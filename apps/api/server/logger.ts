import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

const priority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  return priority[level] >= priority[env.LOG_LEVEL];
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  // meta is spread first so a caller accidentally passing a `level`,
  // `message`, or `timestamp` key in it can never silently clobber the
  // actual log fields - those three always reflect what was passed to
  // the logger call itself.
  const entry = {
    ...meta,
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
