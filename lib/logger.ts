/* eslint-disable no-console */

type LogMethod = (...args: unknown[]) => void;

const noop: LogMethod = () => undefined;

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  debug: isProduction ? noop : console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
} satisfies Record<"debug" | "info" | "warn" | "error", LogMethod>;
