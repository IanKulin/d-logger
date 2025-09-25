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

# Or import directly
$ deno run --allow-env --allow-sys your-script.js
```

## Quick Start

```typescript
import Logger from "@iankulin/logger";

const logger = new Logger();
logger.info("Hello from logger");
logger.error("Something went wrong");
```

## Usage Examples

### Basic Logging

```typescript
import Logger from "@iankulin/logger";
const logger = new Logger({ level: "info" });

logger.error("Critical error occurred");
logger.warn("This is a warning");
logger.info("Informational message");
logger.debug("Debug info"); // Won't be shown (level is 'info')
```

### Log Levels

The logger supports five log levels (from least to most verbose):

- `silent` - Suppresses all output
- `error` - Only error messages
- `warn` - Error and warning messages
- `info` - Error, warning, and info messages (default)
- `debug` - All messages

```typescript
const logger = new Logger({ level: "debug" });

// All of these will be logged
logger.error("Error message");
logger.warn("Warning message");
logger.info("Info message");
logger.debug("Debug message");

// Change level dynamically
logger.level("error");
logger.info("This will not be logged");

// Get current level
console.log(logger.level()); // 'error'
```

### Output Formats

#### JSON Format (Default)

```typescript
const logger = new Logger({ format: "json" });
logger.info("Hello world");
```

```json
{
  "level": "info",
  "levelNumber": 2,
  "time": "2025-06-02T12:00:00.000Z",
  "pid": 12345,
  "hostname": "my-computer",
  "msg": "Hello world",
  "callerFile": "file:///path/to/file.js",
  "callerLine": 3
}
```

#### Simple Format

```typescript
const logger = new Logger({ format: "simple" });
logger.error("Something failed");
```

```
[2025-07-04 22:50] [ERROR] [basic.js:3] Something failed
```

### Message Formatting

The logger supports `util.format()` style message formatting with placeholders
like `%s`, `%d`, `%j`.

```typescript
const logger = new Logger({ format: "json" });

// String formatting
logger.info("User %s has %d points", "john", 100);
// Output: {"level":"info","msg":"User john has 100 points",...}

// JSON formatting
logger.info("Config: %j", { debug: true, port: 3000 });
// Output: {"level":"info","msg":"Config: {\"debug\":true,\"port\":3000}",...}

// Simple format example
const simpleLogger = new Logger({ format: "simple" });
simpleLogger.warn("Processing file %s (%d bytes)", "data.txt", 1024);
// Output: [2025-07-05 10:30] [WARN ] [app.js:15] Processing file data.txt (1024 bytes)
```

### Custom Colors

```typescript
const logger = new Logger({
  colours: {
    error: "\x1b[31m", // Red
    warn: "\x1b[93m", // Bright yellow
    info: "\x1b[36m", // Cyan
    debug: "\x1b[90m", // Dark gray
  },
});
```

### Caller Level Control

Control when caller information (file and line number) is included in log
messages. This is useful for performance optimization since caller detection can
be expensive.

```typescript
// Default: only include caller info for warnings and errors
const logger = new Logger({ callerLevel: "warn" });

logger.error("Critical error"); // Includes caller info
logger.warn("Warning message"); // Includes caller info
logger.info("Info message"); // No caller info
logger.debug("Debug message"); // No caller info
```

**JSON Format Output:**

```json
{"level":"error","msg":"Critical error","callerFile":"/path/to/file.js","callerLine":42}
{"level":"info","msg":"Info message"}
```

**Simple Format Output:**

```
[2025-07-04 13:13] [ERROR] [app.js:42] Critical error
[2025-07-04 13:13] [INFO ] Info message
```

**Available callerLevel Options:**

- `'silent'` - Never include caller info (best performance)
- `'error'` - Only include caller info for errors
- `'warn'` - Include caller info for warnings and errors (default)
- `'info'` - Include caller info for info, warnings, and errors
- `'debug'` - Always include caller info

**Performance Tip:** For production applications that primarily log info/debug
messages, setting `callerLevel: 'error'` can significantly improve performance
by avoiding expensive stack trace analysis for routine logging.

## Constructor Options

| Option        | Type   | Default   | Description                                                                                     |
| ------------- | ------ | --------- | ----------------------------------------------------------------------------------------------- |
| `level`       | string | `'info'`  | Minimum log level to output (`'silent'`, `'error'`, `'warn'`, `'info'`, `'debug'`)              |
| `format`      | string | `'json'`  | Output format (`'json'` or `'simple'`)                                                          |
| `callerLevel` | string | `'warn'`  | Minimum log level to include caller info (`'silent'`, `'error'`, `'warn'`, `'info'`, `'debug'`) |
| `colours`     | object | See below | Color codes for each log level                                                                  |
| `levels`      | object | See below | Custom level names and numeric values                                                           |

## Common Usage Patterns

```typescript
import Logger from "@iankulin/logger";

// Production: JSON format with environment-based level
const prodLogger = new Logger({
  level: Deno.env.get("LOG_LEVEL") || "info",
  format: "json",
  callerLevel: "error", // Performance optimization
});

// Development: Simple format with debug level
const devLogger = new Logger({
  level: "debug",
  format: "simple",
});

// Testing: Silent mode
const testLogger = new Logger({ level: "silent" });
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

## AI Disclosure

- AI Code tools were used in this project
