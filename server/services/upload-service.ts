import fs from "fs";
import path from "path";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../env";
import { logger } from "../logger";

export type UploadProvider = "local" | "object-storage";

export interface UploadService {
  provider: UploadProvider;
  publicPath(filename: string): string;
  deleteFile?(filename: string): Promise<void>;
  middleware: multer.Multer;
}

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed"));
  }
};

export function createUploadService(): UploadService {
  if (env.UPLOAD_PROVIDER === "object-storage") {
    return createR2UploadService();
  }
  return createLocalUploadService();
}

function createLocalUploadService(): UploadService {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  return {
    provider: "local",
    publicPath: (filename) => `/uploads/${filename}`,
    middleware: multer({
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${file.fieldname}-${suffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter,
    }),
  };
}

function createR2UploadService(): UploadService {
  const s3 = new S3Client({
    region: env.OBJECT_STORAGE_REGION ?? "auto",
    endpoint: env.OBJECT_STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
    },
  });

  const bucket = env.OBJECT_STORAGE_BUCKET!;
  const publicUrl = env.OBJECT_STORAGE_PUBLIC_URL!.replace(/\/$/, "");

  // Custom multer StorageEngine that buffers then uploads to R2
  const r2Storage: multer.StorageEngine = {
    _handleFile(_req, file, cb) {
      const key = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const chunks: Buffer[] = [];
      file.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.stream.on("error", cb);
      file.stream.on("end", () => {
        const body = Buffer.concat(chunks);
        s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: file.mimetype,
        }))
          .then(() => cb(null, { filename: key, size: body.length }))
          .catch((err) => {
            // The global error handler swallows this into a generic 500
            // without logging it, so record the actual SDK error here -
            // otherwise upload failures are undebuggable from the logs.
            logger.error("object_storage_upload_failed", {
              name: err?.name,
              code: err?.Code ?? err?.code,
              errorMessage: err?.message,
              httpStatusCode: err?.$metadata?.httpStatusCode,
              requestId: err?.$metadata?.requestId,
              bucket,
              endpoint: env.OBJECT_STORAGE_ENDPOINT,
              region: env.OBJECT_STORAGE_REGION,
            });
            cb(err);
          });
      });
    },
    _removeFile(_req, _file, cb) {
      cb(null);
    },
  };

  return {
    provider: "object-storage",
    publicPath: (filename) => `${publicUrl}/${filename}`,
    deleteFile: (filename) =>
      s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename })).then(() => {}),
    middleware: multer({
      storage: r2Storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter,
    }),
  };
}
