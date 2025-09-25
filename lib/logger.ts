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

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

export interface LogLevels {
  [level: string]: number;
  silent: -1;
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

export interface Colours {
  [level: string]: string;
  error: string;
  warn: string;
  info: string;
  debug: string;
  reset: string;
}

export interface LogEntry {
  level: string;
  levelNumber: number;
  time: string;
  pid: number;
  hostname: string;
  msg: string;
  callerFile?: string;
  callerLine?: number;
  [key: string]: unknown;
}

export type Formatter = (logEntry: LogEntry) => string;

export interface LoggerOptions {
  level?: LogLevel;
  levels?: Partial<LogLevels>;
  format?: "json" | "simple";
  time?: "long" | "short";
  callerLevel?: LogLevel;
  colours?: Partial<Colours>;
}

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
    this.isRedirected = !Deno.stdout.isTerminal();

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
      pid: Deno.pid,
      hostname: Deno.hostname(),
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

  error(message: unknown, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }

  warn(message: unknown, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  info(message: unknown, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  debug(message: unknown, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

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
