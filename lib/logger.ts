/**
 * @fileoverview A comprehensive cross-platform logging library with configurable levels, formatting, and caller detection.
 *
 * This module provides a Logger class that supports multiple log levels, JSON and simple text formatting,
 * automatic TTY detection for colored output, and optional caller information inclusion. It includes
 * built-in util.format-style string formatting with %s, %d, %j, and other specifiers.
 *
 * Compatible with Deno, Node.js, and Bun runtimes.
 *
 * @module logger
 * @example
 * ```ts
 * import Logger from "@iankulin/logger";
 *
 * // Create a basic logger
 * const logger = new Logger({ level: "info", format: "json" });
 *
 * // Log messages with different levels
 * logger.info("User %s logged in", "alice");
 * logger.warn("High memory usage: %d%%", 89);
 * logger.error("Database connection failed: %j", { host: "localhost", port: 5432 });
 *
 * // Change log level dynamically
 * logger.level("debug");
 * logger.debug("This will now be shown");
 * ```
 */

// Native implementation of util.format functionality
function format(f: unknown, ...args: unknown[]): string {
  if (typeof f !== "string") {
    // If first argument is not a string, just join all args with spaces
    return [f, ...args].map((arg) => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 0);
        } catch {
          // Handle circular references and other JSON errors
          return "[object Object]";
        }
      }
      return String(arg);
    }).join(" ");
  }

  let i = 0;
  // First, handle %% replacement - if there are no args, %% stays as %%
  // If there are args, %% becomes %
  const handlePercentPercent = args.length === 0 ? "%%" : "%";

  const str = f.replace(/%[sdifj%]/g, (match: string) => {
    if (match === "%%") {
      return handlePercentPercent;
    }

    if (i >= args.length) return match;

    const arg = args[i++];

    switch (match) {
      case "%s":
        if (arg === null) return "null";
        if (arg === undefined) return "undefined";
        if (typeof arg === "object") {
          try {
            // For objects without %j, use a simplified string representation
            if (Array.isArray(arg)) {
              return `[ ${arg.join(", ")} ]`;
            }
            // For plain objects, show key-value pairs
            const entries = Object.entries(arg).map(([k, v]) =>
              `${k}: ${typeof v === "string" ? `'${v}'` : v}`
            );
            return `{ ${entries.join(", ")} }`;
          } catch {
            return "[object Object]";
          }
        }
        try {
          return String(arg);
        } catch {
          return "[object Object]";
        }

      case "%d":
        if (arg === null) return "0";
        if (arg === undefined) return "NaN";
        return String(Number(arg));

      case "%i":
        if (arg === null) return "0";
        if (arg === undefined) return "NaN";
        return String(parseInt(String(Number(arg)), 10));

      case "%f":
        if (arg === null) return "0";
        if (arg === undefined) return "NaN";
        return String(parseFloat(String(Number(arg))));

      case "%j":
        try {
          return JSON.stringify(arg);
        } catch {
          return "[Circular]";
        }

      default:
        return match;
    }
  });

  // Append any remaining arguments
  const remainingArgs = args.slice(i);
  if (remainingArgs.length > 0) {
    return str + " " + remainingArgs.map((arg) => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "object") {
        try {
          if (Array.isArray(arg)) {
            return `[ ${arg.join(", ")} ]`;
          }
          const entries = Object.entries(arg).map(([k, v]) =>
            `${k}: ${typeof v === "string" ? `'${v}'` : v}`
          );
          return `{ ${entries.join(", ")} }`;
        } catch {
          return "[object Object]";
        }
      }
      return String(arg);
    }).join(" ");
  }

  return str;
}

// Cross-platform process interface
interface NodeProcess {
  pid: number;
  versions?: {
    node?: string;
    bun?: string;
  };
  stdout?: {
    isTTY?: boolean;
  };
}

// Cross-platform global interface
interface CrossPlatformGlobal {
  process?: NodeProcess;
  require?: (module: string) => unknown;
}

// Runtime detection and cross-platform utilities
const runtime = {
  isDeno: typeof Deno !== 'undefined',
  isNode: typeof (globalThis as CrossPlatformGlobal).process !== 'undefined' &&
          Boolean((globalThis as CrossPlatformGlobal).process?.versions?.node),
  isBun: typeof (globalThis as CrossPlatformGlobal).process !== 'undefined' &&
         Boolean((globalThis as CrossPlatformGlobal).process?.versions?.bun),
};

// Cross-platform API wrappers
function getPid(): number {
  if (runtime.isDeno) {
    return Deno.pid;
  }
  return (globalThis as CrossPlatformGlobal).process?.pid || 0;
}

function getHostname(): string {
  if (runtime.isDeno) {
    return Deno.hostname();
  }
  // For Node.js/Bun, we need to import os module
  if (runtime.isNode || runtime.isBun) {
    try {
      // Try accessing require if available
      const requireFn = (globalThis as CrossPlatformGlobal)?.require || eval('require');
      const os = requireFn?.('os') as { hostname?: () => string };
      return os?.hostname?.() || 'localhost';
    } catch {
      // Fallback if require is not available
      return 'localhost';
    }
  }
  return 'localhost';
}

function isTerminal(): boolean {
  if (runtime.isDeno) {
    return Deno.stdout.isTerminal();
  }
  return (globalThis as CrossPlatformGlobal).process?.stdout?.isTTY || false;
}

/**
 * Available log levels in order of priority.
 *
 * - `silent`: No logging output
 * - `error`: Only error messages
 * - `warn`: Error and warning messages
 * - `info`: Error, warning, and info messages (default)
 * - `debug`: All messages including debug output
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

/**
 * Numeric mapping for log levels used internally for level comparison.
 * Lower numbers have higher priority (are shown more often).
 */
export interface LogLevels {
  [level: string]: number;
  silent: -1;
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

/**
 * ANSI color codes for different log levels.
 * Only used when output is to a terminal (TTY), not when redirected to files.
 */
export interface Colours {
  [level: string]: string;
  error: string;
  warn: string;
  info: string;
  debug: string;
  reset: string;
}

/**
 * Structure of a log entry passed to formatters.
 *
 * This interface defines the shape of log objects that are passed to custom formatters.
 * All standard properties are always present, with optional caller information included
 * based on the {@link LoggerOptions.callerLevel} setting.
 *
 * @example
 * ```ts
 * const entry: LogEntry = {
 *   level: "info",
 *   levelNumber: 2,
 *   time: "2024-01-15 10:30",
 *   pid: 1234,
 *   hostname: "localhost",
 *   msg: "User alice logged in",
 *   callerFile: "/path/to/app.ts",
 *   callerLine: 42
 * };
 * ```
 */
export interface LogEntry {
  /** The log level as a string (e.g., "info", "error") */
  level: string;
  /** The numeric value of the log level for comparison */
  levelNumber: number;
  /** Formatted timestamp string */
  time: string;
  /** Process ID of the current process */
  pid: number;
  /** Hostname of the current machine */
  hostname: string;
  /** The final formatted log message */
  msg: string;
  /** Source file path (included based on callerLevel setting) */
  callerFile?: string;
  /** Line number in source file (included based on callerLevel setting) */
  callerLine?: number;
  /** Additional custom properties can be added by formatters */
  [key: string]: unknown;
}

/**
 * Custom formatter function type for log entries.
 *
 * @param logEntry - The log entry object to format
 * @returns A formatted string representation of the log entry
 *
 * @example
 * ```ts
 * const customFormatter: Formatter = (entry) => {
 *   return `${entry.time} [${entry.level.toUpperCase()}] ${entry.msg}`;
 * };
 * ```
 */
export type Formatter = (logEntry: LogEntry) => string;

/**
 * Configuration options for the Logger constructor.
 *
 * @example
 * ```ts
 * // Basic configuration
 * const logger = new Logger({
 *   level: "debug",
 *   format: "simple"
 * });
 *
 * // Advanced configuration with caller detection
 * const logger = new Logger({
 *   level: "info",
 *   format: "json",
 *   time: "long",
 *   callerLevel: "warn",
 *   colours: {
 *     error: "\x1b[91m",
 *     info: "\x1b[94m"
 *   }
 * });
 * ```
 */
export interface LoggerOptions {
  /** Minimum log level to output. Defaults to "info" */
  level?: LogLevel;
  /** Custom level mappings. Partial override of default levels */
  levels?: Partial<LogLevels>;
  /** Output format: "json" for structured logs, "simple" for human-readable. Defaults to "json" */
  format?: "json" | "simple";
  /** Timestamp format: "long" for ISO string, "short" for abbreviated. Defaults to "short" */
  time?: "long" | "short";
  /** Minimum level to include caller info (file/line). Defaults to "warn" */
  callerLevel?: LogLevel;
  /** Custom ANSI color codes for log levels */
  colours?: Partial<Colours>;
}

/**
 * A comprehensive logging class with configurable levels, formatting, and caller detection.
 *
 * Features:
 * - Multiple log levels (silent, error, warn, info, debug)
 * - JSON and simple text formatting
 * - util.format-style string interpolation (%s, %d, %j, etc.)
 * - Automatic TTY detection for colored vs plain output
 * - Optional caller information (file/line) inclusion
 * - Dynamic level changing
 * - Extensible color and level configuration
 *
 * @example
 * ```ts
 * // Basic usage
 * const logger = new Logger();
 * logger.info("Hello, world!");
 * logger.error("Something went wrong");
 *
 * // With format strings
 * logger.info("User %s has %d notifications", "alice", 5);
 * logger.warn("Config: %j", { timeout: 5000 });
 *
 * // Dynamic level changes
 * logger.level("debug");
 * logger.debug("Debug info now visible");
 *
 * // Custom configuration
 * const customLogger = new Logger({
 *   level: "warn",
 *   format: "simple",
 *   callerLevel: "error"
 * });
 * ```
 */
class Logger {
  options: {
    level: LogLevel;
    levels: LogLevels;
    format: "json" | "simple";
    time: "long" | "short";
    callerLevel: LogLevel;
    colours: Colours;
  };
  isRedirected: boolean;
  formatters: { [key: string]: Formatter };
  callerErrorCount: number;
  maxCallerErrors: number;

  /**
   * Creates a new Logger instance with the specified configuration.
   *
   * @param options - Configuration options for the logger
   *
   * @example
   * ```ts
   * // Default logger (info level, JSON format)
   * const logger = new Logger();
   *
   * // Debug logger with simple formatting
   * const debugLogger = new Logger({
   *   level: "debug",
   *   format: "simple"
   * });
   *
   * // Production logger with caller info on errors only
   * const prodLogger = new Logger({
   *   level: "warn",
   *   format: "json",
   *   time: "long",
   *   callerLevel: "error"
   * });
   * ```
   */
  constructor(options: LoggerOptions = {}) {
    this.validateOptions(options);

    const defaultLevels: LogLevels = {
      silent: -1,
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    const defaultColours: Colours = {
      error: "\x1b[91m",
      warn: "\x1b[33m",
      info: "\x1b[94m",
      debug: "\x1b[37m",
      reset: "\x1b[0m",
    };

    this.options = {
      level: options.level || "info",
      levels: Object.assign({}, defaultLevels, options.levels),
      format: options.format || "json",
      time: options.time || "short",
      callerLevel: options.callerLevel || "warn",
      colours: Object.assign({}, defaultColours, options.colours),
    };

    // Detect if output is redirected to a file
    this.isRedirected = !isTerminal();

    // Initialize formatters registry
    this.formatters = {
      json: this.jsonFormatter.bind(this),
      simple: this.simpleFormatter.bind(this),
    };

    // prevent infinite loop when reporting internal errors in getCallerInfo()
    this.callerErrorCount = 0;
    this.maxCallerErrors = 5;
  }

  validateOptions(options: LoggerOptions): void {
    // Validate level if provided
    if (options.level !== undefined) {
      const validLevels: LogLevel[] = [
        "silent",
        "error",
        "warn",
        "info",
        "debug",
      ];
      if (!validLevels.includes(options.level)) {
        throw new Error(
          `Invalid log level: ${options.level}. Valid levels are: ${
            validLevels.join(", ")
          }`,
        );
      }
    }

    // Validate format if provided
    if (options.format !== undefined) {
      const validFormats = ["json", "simple"];
      if (!validFormats.includes(options.format)) {
        throw new Error(
          `Invalid format: ${options.format}. Valid formats are: ${
            validFormats.join(", ")
          }`,
        );
      }
    }

    // Validate time if provided
    if (options.time !== undefined) {
      const validTimes = ["long", "short"];
      if (!validTimes.includes(options.time)) {
        throw new Error(
          `Invalid time: ${options.time}. Valid times are: ${
            validTimes.join(", ")
          }`,
        );
      }
    }

    // Validate callerLevel if provided
    if (options.callerLevel !== undefined) {
      const validLevels: LogLevel[] = [
        "silent",
        "error",
        "warn",
        "info",
        "debug",
      ];
      if (!validLevels.includes(options.callerLevel)) {
        throw new Error(
          `Invalid callerLevel: ${options.callerLevel}. Valid levels are: ${
            validLevels.join(", ")
          }`,
        );
      }
    }

    // Validate colours if provided (should be an object)
    if (options.colours !== undefined && typeof options.colours !== "object") {
      throw new Error("colours option must be an object");
    }

    // Validate levels if provided (should be an object with numeric values)
    if (options.levels !== undefined) {
      if (typeof options.levels !== "object") {
        throw new Error("levels option must be an object");
      }

      for (const [level, value] of Object.entries(options.levels)) {
        if (
          typeof value !== "number" ||
          value < 0 ||
          !Number.isInteger(value)
        ) {
          throw new Error(
            `Level value for '${level}' must be a non-negative integer`,
          );
        }
      }
    }
  }

  // JSON log formatter
  jsonFormatter(logEntry: LogEntry): string {
    try {
      return JSON.stringify(logEntry);
    } catch (error) {
      // Fallback for circular references or other JSON.stringify errors
      try {
        // Try to create a safe version by stringifying individual fields
        const safeEntry = {
          level: logEntry.level,
          levelNumber: logEntry.levelNumber,
          time: logEntry.time,
          pid: logEntry.pid,
          hostname: logEntry.hostname,
          msg: String(logEntry.msg), // Convert to string safely
          callerFile: logEntry.callerFile,
          callerLine: logEntry.callerLine,
          jsonError: `JSON stringify failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
        return JSON.stringify(safeEntry);
      } catch {
        // Last resort - return a plain string
        return `{"level":"${logEntry.level}","msg":"${
          String(
            logEntry.msg,
            // eslint-disable-next-line no-useless-escape
          ).replace(/"/g, '"')
        }","jsonError":"Multiple JSON errors occurred"}`;
      }
    }
  }

  // Simple text log formatter
  simpleFormatter(logEntry: LogEntry): string {
    const levelPadded = logEntry.level.toUpperCase().padEnd(5);
    const caller = logEntry.callerFile
      ? `${logEntry.callerFile.split("/").pop()}:${logEntry.callerLine}`
      : null;

    return caller
      ? `[${logEntry.time}] [${levelPadded}] [${caller}] ${logEntry.msg}`
      : `[${logEntry.time}] [${levelPadded}] ${logEntry.msg}`;
  }

  getCallerInfo(): { callerFile: string; callerLine: number } {
    const originalFunc =
      (Error as unknown as { prepareStackTrace?: unknown }).prepareStackTrace;
    let callerFile = "unknown";
    let callerLine = 0;
    try {
      const err = new Error();
      // deno-lint-ignore prefer-const
      let currentFile: string | undefined;
      (Error as unknown as { prepareStackTrace?: unknown }).prepareStackTrace =
        function (_err: unknown, stack: unknown) {
          return stack;
        };
      const stack = err.stack as unknown as {
        shift: () => { getFileName: () => string; getLineNumber: () => number };
        length: number;
      };
      currentFile = stack.shift().getFileName();
      while (stack.length) {
        const stackFrame = stack.shift();
        callerFile = stackFrame.getFileName();
        if (currentFile !== callerFile) {
          callerLine = stackFrame.getLineNumber();
          break;
        }
      }
      this.callerErrorCount = 0;
    } catch (e) {
      this.callerErrorCount++;
      if (this.callerErrorCount <= this.maxCallerErrors) {
        console.error("Error retrieving caller info:", e);
        if (this.callerErrorCount === this.maxCallerErrors) {
          // loop detected
          console.error(
            `Caller detection failed ${this.maxCallerErrors} times. Suppressing further caller error messages.`,
          );
        }
      }
      // callerFile and callerLine already set to defaults above
    } finally {
      (Error as unknown as { prepareStackTrace?: unknown }).prepareStackTrace =
        originalFunc;
    }
    return { callerFile, callerLine };
  }

  log(level: LogLevel, message: unknown, ...args: unknown[]): void {
    if (this.options.levels[level] > this.options.levels[this.options.level]) {
      return;
    }

    // Only get caller info if current level is at or above callerLevel threshold
    const shouldIncludeCaller = this.options.levels[level] <=
      this.options.levels[this.options.callerLevel];
    const { callerFile, callerLine } = shouldIncludeCaller
      ? this.getCallerInfo()
      : { callerFile: undefined, callerLine: undefined };

    const now = new Date();
    const time = this.options.time === "long"
      ? now.toISOString()
      : now.toISOString().slice(0, 16).replace("T", " ");

    const logEntry: LogEntry = {
      level,
      levelNumber: this.options.levels[level],
      time: time,
      pid: getPid(),
      hostname: getHostname(),
      msg: format(message, ...args),
    };

    // Only include caller info if it was requested
    if (
      shouldIncludeCaller && callerFile !== undefined &&
      callerLine !== undefined
    ) {
      logEntry.callerFile = callerFile;
      logEntry.callerLine = callerLine;
    }

    const colour = this.options.colours[level];
    const resetColour = this.options.colours.reset;

    // Select the appropriate formatter
    const formatter = this.formatters[this.options.format] ||
      this.formatters.json;

    let formattedLog: string;
    try {
      formattedLog = formatter(logEntry);

      // Ensure formatter returned a string
      if (typeof formattedLog !== "string") {
        throw new Error(
          `Formatter returned ${typeof formattedLog} instead of string`,
        );
      }
    } catch (error) {
      // Formatter failed, fall back to JSON formatter
      try {
        const safeEntry = {
          ...logEntry,
          formatterError: `Formatter failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
        formattedLog = this.formatters.json(safeEntry);
      } catch {
        // Even JSON formatter failed, create minimal safe output
        formattedLog = `{"level":"${logEntry.level}","msg":"${
          String(
            logEntry.msg,
          ).replace(
            /"/g,
            // eslint-disable-next-line no-useless-escape
            '"',
          )
        }","formatterError":"Formatter failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }"}`;
      }
    }

    // only show colours if logging to console
    if (this.isRedirected) {
      console.log(formattedLog);
    } else {
      console.log(`${colour}${formattedLog}${resetColour}`);
    }
  }

  /**
   * Logs an error message. Always shown unless level is set to "silent".
   *
   * @param message - The message to log (supports format strings)
   * @param args - Additional arguments for format string interpolation
   *
   * @example
   * ```ts
   * logger.error("Database connection failed");
   * logger.error("User %s authentication failed", "john");
   * logger.error("Error details: %j", { code: 500, message: "Internal error" });
   * ```
   */
  error(message: unknown, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }

  /**
   * Logs a warning message. Shown when level is "warn", "info", or "debug".
   *
   * @param message - The message to log (supports format strings)
   * @param args - Additional arguments for format string interpolation
   *
   * @example
   * ```ts
   * logger.warn("High memory usage detected");
   * logger.warn("Cache miss for key: %s", "user:123");
   * logger.warn("Performance warning: %d ms", 2500);
   * ```
   */
  warn(message: unknown, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  /**
   * Logs an informational message. Shown when level is "info" or "debug" (default behavior).
   *
   * @param message - The message to log (supports format strings)
   * @param args - Additional arguments for format string interpolation
   *
   * @example
   * ```ts
   * logger.info("Application started successfully");
   * logger.info("User %s logged in", "alice");
   * logger.info("Request processed in %d ms", 150);
   * ```
   */
  info(message: unknown, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  /**
   * Logs a debug message. Only shown when level is set to "debug".
   *
   * @param message - The message to log (supports format strings)
   * @param args - Additional arguments for format string interpolation
   *
   * @example
   * ```ts
   * logger.debug("Processing user data");
   * logger.debug("Cache hit for key: %s", "user:123");
   * logger.debug("Function arguments: %j", { id: 123, name: "test" });
   * ```
   */
  debug(message: unknown, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

  /**
   * Gets the current log level or sets a new one.
   *
   * @param newLevel - Optional new log level to set
   * @returns The current (or newly set) log level
   *
   * @example
   * ```ts
   * // Get current level
   * const currentLevel = logger.level(); // "info"
   *
   * // Set new level
   * logger.level("debug");
   * logger.debug("This will now be shown");
   *
   * // Chaining usage
   * const level = logger.level("warn"); // Sets to "warn" and returns "warn"
   * ```
   */
  level(): LogLevel;
  level(newLevel: LogLevel): LogLevel;
  level(newLevel?: LogLevel): LogLevel {
    // If argument provided, set the new level
    if (arguments.length > 0 && newLevel !== undefined) {
      if (Object.hasOwn(this.options.levels, newLevel)) {
        this.options.level = newLevel;
      } else {
        throw new Error(`Invalid log level: ${newLevel}`);
      }
    }
    return this.options.level;
  }

  /**
   * Alternative method to set/get the log level. Identical to {@link level}.
   *
   * @param newLevel - Optional new log level to set
   * @returns The current (or newly set) log level
   *
   * @example
   * ```ts
   * // Get current level
   * const currentLevel = logger.setLevel(); // "info"
   *
   * // Set new level
   * logger.setLevel("error");
   * ```
   */
  setLevel(): LogLevel;
  setLevel(newLevel: LogLevel): LogLevel;
  setLevel(newLevel?: LogLevel): LogLevel {
    if (arguments.length === 0) {
      // Why are you using this as a getter?
      return this.level();
    }
    return this.level(newLevel!);
  }
}

export default Logger;
