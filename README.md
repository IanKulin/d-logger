# logger [![NPM version](https://img.shields.io/npm/v/@iankulin/logger.svg?style=flat)](https://www.npmjs.com/package/@iankulin/logger) [![NPM total downloads](https://img.shields.io/npm/dt/@iankulin/logger.svg?style=flat)](https://npmjs.org/package/@iankulin/logger)

> Flexible console logging utility with colors, and multiple output formats

## Features

- **Multiple log levels**: silent, error, warn, info, debug
- **Flexible output formats**: JSON or simple text
- **Caller detection**: Automatically identifies source file and line number based on log level
- **Color support**: Automatic TTY detection with colored output
- **ESM only**: Modern ES module support

## Install

Install with [npm](https://npmjs.org/package/@iankulin/logger):

```sh
$ npm install @iankulin/logger
```

## Quick Start

```js
import Logger from '@iankulin/logger';

const logger = new Logger();
logger.info('Hello from logger');
logger.error('Something went wrong');
```

## Usage Examples

### Basic Logging

```js
import Logger from '@iankulin/logger';
const logger = new Logger({ level: 'info' });

logger.error('Critical error occurred');
logger.warn('This is a warning');
logger.info('Informational message');
logger.debug('Debug info'); // Won't be shown (level is 'info')
```

### Log Levels

The logger supports five log levels (from least to most verbose):

- `silent` - Suppresses all output
- `error` - Only error messages
- `warn` - Error and warning messages
- `info` - Error, warning, and info messages (default)
- `debug` - All messages

```js
const logger = new Logger({ level: 'debug' });

// All of these will be logged
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');

// Change level dynamically
logger.level('error');
logger.info('This will not be logged');

// Get current level
console.log(logger.level()); // 'error'
```

### Output Formats

#### JSON Format (Default)

```js
const logger = new Logger({ format: 'json' });
logger.info('Hello world');
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

```js
const logger = new Logger({ format: 'simple' });
logger.error('Something failed');
```

```
[2025-07-04 22:50] [ERROR] [basic.js:3] Something failed
```

### Message Formatting

The logger uses Node.js `util.format()` for message formatting with placeholders like `%s`, `%d`, `%j`.

```js
const logger = new Logger({ format: 'json' });

// String formatting
logger.info('User %s has %d points', 'john', 100);
// Output: {"level":"info","msg":"User john has 100 points",...}

// JSON formatting
logger.info('Config: %j', { debug: true, port: 3000 });
// Output: {"level":"info","msg":"Config: {\"debug\":true,\"port\":3000}",...}

// Simple format example
const simpleLogger = new Logger({ format: 'simple' });
simpleLogger.warn('Processing file %s (%d bytes)', 'data.txt', 1024);
// Output: [2025-07-05 10:30] [WARN ] [app.js:15] Processing file data.txt (1024 bytes)
```

### Custom Colors

```js
const logger = new Logger({
  colours: {
    error: '\x1b[31m', // Red
    warn: '\x1b[93m', // Bright yellow
    info: '\x1b[36m', // Cyan
    debug: '\x1b[90m', // Dark gray
  },
});
```

### Caller Level Control

Control when caller information (file and line number) is included in log messages. This is useful for performance optimization since caller detection can be expensive.

```js
// Default: only include caller info for warnings and errors
const logger = new Logger({ callerLevel: 'warn' });

logger.error('Critical error'); // Includes caller info
logger.warn('Warning message'); // Includes caller info
logger.info('Info message'); // No caller info
logger.debug('Debug message'); // No caller info
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

**Performance Tip:** For production applications that primarily log info/debug messages, setting `callerLevel: 'error'` can significantly improve performance by avoiding expensive stack trace analysis for routine logging.

## Constructor Options

| Option        | Type   | Default   | Description                                                                                     |
| ------------- | ------ | --------- | ----------------------------------------------------------------------------------------------- |
| `level`       | string | `'info'`  | Minimum log level to output (`'silent'`, `'error'`, `'warn'`, `'info'`, `'debug'`)              |
| `format`      | string | `'json'`  | Output format (`'json'` or `'simple'`)                                                          |
| `callerLevel` | string | `'warn'`  | Minimum log level to include caller info (`'silent'`, `'error'`, `'warn'`, `'info'`, `'debug'`) |
| `colours`     | object | See below | Color codes for each log level                                                                  |
| `levels`      | object | See below | Custom level names and numeric values                                                           |

## Common Usage Patterns

```js
import Logger from '@iankulin/logger';

// Production: JSON format with environment-based level
const prodLogger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  callerLevel: 'error', // Performance optimization
});

// Development: Simple format with debug level
const devLogger = new Logger({
  level: 'debug',
  format: 'simple',
});

// Testing: Silent mode
const testLogger = new Logger({ level: 'silent' });
```

## Requirements

- Node.js 18.0.0 or higher
- ES modules support

## License

[MIT](LICENSE)

## Versions

- **0.1.5** - Initial release
- **0.1.6** - Added tests, improved error handling, caller detection loop prevention, `silent` logging level
- **1.0.0** - Production release
- **1.0.2** - Added types for intellisense
- **1.1.0** - added { time: 'short' } option, refactor tests, added { callerLevel: 'warn' } option
- **1.1.2** - dependencies update following [chalk supply chain attack](https://www.bleepingcomputer.com/news/security/self-propagating-supply-chain-attack-hits-187-npm-packages/) although not affected.
