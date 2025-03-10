// lib/logger.ts
export const safeLog = (method: "log" | "error", ...args: any[]) => {
  try {
    (console[method] as (...args: any[]) => void)(...args);
  } catch (error) {
    if (error.code === "EPIPE") {
      // Ignore EPIPE errors
      return;
    }
    throw error;
  }
};
