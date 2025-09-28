# logger [![JSR](https://jsr.io/badges/@iankulin/logger)](https://jsr.io/@iankulin/logger) [![JSR Score](https://jsr.io/badges/@iankulin/logger/score)](https://jsr.io/@iankulin/logger/score)

> Flexible console logging utility with colors, and multiple output formats

## Features

- **Multiple log levels**: silent, error, warn, info, debug
- **Flexible output formats**: JSON or simple text
- **Caller detection**: Automatically identifies source file and line number
  based on log level
- **Color support**: Automatic TTY detection with colored output

## Install

Install with [JSR](https://jsr.io/@iankulin/logger) for Deno:

```sh
# Add to your deno.json
$ deno add @iankulin/logger

# Or import directly (per the demo code below)
$ deno run --allow-env --allow-sys your-script.js
```

## Quick Start

```typescript
// Deno 
import Logger from "@iankulin/logger";

const logger = new Logger();
logger.info("Hello from logger");
logger.error("Something went wrong");
```

## Usage Examples


```typescript
// Deno
import Logger from "jsr:@iankulin/logger";

// Create a new logger instance
const logger = new Logger();

// Demo basic logging levels
console.log("=== Basic Logging with Defaults ===");
logger.info("This is an info message");

// Demo with structured data
console.log("\n=== Structured Logging ===");
logger.error("Database connection failed", {
  error: "Connection timeout",
  database: "users_db",
  retryCount: 3
});

// Demo message formatting with placeholders
console.log("\n=== Printf Message Formatting ===");
logger.info("User %s has %d points", "alice", 150);

// Demo with different log levels and formatting
console.log("\n=== Log Level ===");
logger.info("Current log level:", logger.level());
logger.setLevel("debug");
logger.debug("Debug is now enabled");
logger.info("Current log level:", logger.level());

// Demo silent level
console.log("\n=== Silent Level ===");
const silentLogger = new Logger({ level: "silent" });
silentLogger.error("This error won't be shown");
silentLogger.info("Neither will this info");
console.log("Silent logger produced no output above");

// Demo with different formatting styles
console.log("\n=== Formats ===");
const simpleLogger = new Logger({ format: "simple" });
const jsonLogger = new Logger({ format: "json" });
simpleLogger.warn("Warning with simple format");
jsonLogger.warn("Warning with json format");

// Demo time format options
console.log("\n=== Time Format ===");
const shortTimeLogger = new Logger({ format: "simple", time: "short" });
const longTimeLogger = new Logger({ format: "simple", time: "long" });
shortTimeLogger.info("Short time format");
longTimeLogger.info("Long time format");

// Demo caller level control
console.log("\n=== Caller Level Control ===");
// callerLevel determines at which level the stack details are shown
const errorCallerLogger = new Logger({ format: "simple", callerLevel: "error" });
const debugCallerLogger = new Logger({ format: "simple", callerLevel: "debug" });
console.log("With callerLevel 'error' (only errors show caller info):");
errorCallerLogger.info("Info without caller");
errorCallerLogger.error("Error with caller");
console.log("\nWith callerLevel 'debug' (all levels show caller info):");
debugCallerLogger.info("Info with caller");
debugCallerLogger.warn("Warning with caller");

// Demo custom colors
console.log("\n=== Custom Colors ===");
const colorLogger = new Logger({
  format: "simple",
  colours: {
    error: "\x1b[31m",   // Red
    warn: "\x1b[38;2;255;255;179m", // pastel yellow (#FFFFB3)
    info: "\x1b[36m",    // Cyan
    debug: "\x1b[90m",   // Dark gray
    reset: "\x1b[0m"
  }
});
colorLogger.error("Custom red error");
colorLogger.warn("Custom yellow warning");
colorLogger.info("Custom cyan info");

// Demo production vs development patterns
console.log("\n=== Common Usage Patterns ===");

// Production-like logger
const prodLogger = new Logger({
  level: "info",
  format: "json",
  callerLevel: "error"
});

// Development-like logger
const devLogger = new Logger({
  level: "debug",
  format: "simple",
  callerLevel: "debug"
});

console.log("Production logger output:");
prodLogger.info("Application started");
prodLogger.error("Database error occurred");

console.log("\nDevelopment logger output:");
devLogger.debug("Debug info for development");
devLogger.info("Development info message");
```

## Requirements

- Deno 1.37.0 or higher

## License

[MIT](LICENSE)

## Versions

- **1.0.0** - JSR release with full Deno support
  - Migrated from [npm version](https://www.npmjs.com/package/@iankulin/logger)
    to JSR (JavaScript Registry)
  - Full TypeScript support
  - Native Deno compatibility
- **1.0.1** - Minor updates
  - Deno flavoured demo in readme
  - Add JSDoc to boost JSR score
- **1.1.0** - Add Node and Bun support

## AI Disclosure

- AI Code tools were used in this project
