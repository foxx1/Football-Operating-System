import crypto from "crypto";

/**
 * Verifies a Terra webhook request per Terra's documented scheme:
 * https://docs.tryterra.co/health-and-fitness-api/integration-setup/setting-up-data-destinations/webhooks
 *
 * The `terra-signature` header looks like: "t=1700000000,v1=<hex hmac>"
 * The signed message is `${timestamp}.${rawBody}`, HMAC-SHA256'd with the
 * webhook's signing secret (from the Terra dashboard), hex-encoded.
 *
 * Requires the RAW request body bytes — verification will always fail if
 * the body has already been JSON-parsed and re-stringified, since that can
 * change whitespace/key order versus what Terra actually signed.
 */

const TOLERANCE_MS = 5 * 60 * 1000; // reject signatures older than 5 minutes (replay protection)

export type TerraSignatureCheck =
  | { ok: true }
  | { ok: false; reason: "missing_header" | "malformed_header" | "stale_timestamp" | "signature_mismatch" };

export function verifyTerraSignature(
  header: string | string[] | undefined,
  rawBody: Buffer | undefined,
  signingSecret: string
): TerraSignatureCheck {
  if (!header || Array.isArray(header)) {
    return { ok: false, reason: "missing_header" };
  }
  if (!rawBody) {
    return { ok: false, reason: "missing_header" };
  }

  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const timestamp = parts["t"];
  const receivedSignature = parts["v1"];

  if (!timestamp || !receivedSignature) {
    return { ok: false, reason: "malformed_header" };
  }

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > TOLERANCE_MS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expectedSignature = crypto
    .createHmac("sha256", signingSecret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(receivedSignature, "hex");

  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}
