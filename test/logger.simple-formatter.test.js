import { assertEquals, assert } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
  setTTYMode,
  restoreTTY,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Simple Formatter - Basic Simple Format - should produce simple text format", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.info('test message');

  assertEquals(getCapturedLogs().length, 1);
  const logOutput = getCapturedLogs()[0];

  // Should contain timestamp, level, caller, and message
  assert(logOutput.includes('[INFO ]'));
  assert(logOutput.includes('test message'));
  // Should contain short timestamp by default
  assert(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
});

Deno.test("Logger Simple Formatter - Basic Simple Format - should pad log levels correctly", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple', level: 'debug' });
  logger.error('error msg');
  logger.debug('debug msg');

  const logs = getCapturedLogs();
  assert(logs[0].includes('[ERROR]'));
  assert(logs[1].includes('[DEBUG]'));
});

Deno.test("Logger Simple Formatter - Basic Simple Format - should include caller information", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple', callerLevel: 'info' });
  logger.info('test message');

  const logOutput = getCapturedLogs()[0];
  // Should contain filename and line number
  assert(logOutput.includes('.js:'));
});

Deno.test("Logger Simple Formatter - Basic Simple Format - should format with long timestamp when specified", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple', time: 'long' });
  logger.info('test message');

  const logOutput = getCapturedLogs()[0];

  // Should contain long time format in brackets
  assert(
    logOutput.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
  );
  assert(logOutput.includes('T'));
  assert(logOutput.includes('Z'));
});

Deno.test("Logger Simple Formatter - All Log Levels in Simple Format - should format error level correctly", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.error('error message');

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('[ERROR]'));
  assert(logOutput.includes('error message'));
});

Deno.test("Logger Simple Formatter - All Log Levels in Simple Format - should format warn level correctly", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.warn('warn message');

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('[WARN ]'));
  assert(logOutput.includes('warn message'));
});

Deno.test("Logger Simple Formatter - All Log Levels in Simple Format - should format info level correctly", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.info('info message');

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('[INFO ]'));
  assert(logOutput.includes('info message'));
});

Deno.test("Logger Simple Formatter - All Log Levels in Simple Format - should format debug level correctly", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple', level: 'debug' });
  logger.debug('debug message');

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('[DEBUG]'));
  assert(logOutput.includes('debug message'));
});

Deno.test("Logger Simple Formatter - Color Handling - should include color codes when output is TTY", () => {
  clearCapturedLogs();
  setTTYMode(true);
  const logger = new Logger({ format: 'simple' });
  logger.error('error message');

  const logOutput = getCapturedLogs()[0];
  // Should contain ANSI color codes
  assert(logOutput.includes('\x1b[91m')); // red for error
  assert(logOutput.includes('\x1b[0m')); // reset
});

Deno.test("Logger Simple Formatter - Color Handling - should not include color codes when output is redirected", () => {
  clearCapturedLogs();
  setTTYMode(false);
  const logger = new Logger({ format: 'simple' });
  logger.error('error message');

  const logOutput = getCapturedLogs()[0];
  // Should not contain ANSI color codes
  assert(!logOutput.includes('\x1b['));
});

Deno.test("Logger Simple Formatter - Color Handling - should use appropriate colors for different levels", () => {
  clearCapturedLogs();
  setTTYMode(true);
  const logger = new Logger({ format: 'simple', level: 'debug' });

  logger.error('error');
  logger.warn('warn');
  logger.info('info');
  logger.debug('debug');

  const logs = getCapturedLogs();

  // Error should be red
  assert(logs[0].includes('\x1b[91m'));
  // Warn should be yellow
  assert(logs[1].includes('\x1b[33m'));
  // Info and debug might have different or no colors, but should have reset codes
  assert(logs[2].includes('\x1b[0m'));
  assert(logs[3].includes('\x1b[0m'));
});

Deno.test("Logger Simple Formatter - Color Handling - should respect custom color configuration", () => {
  clearCapturedLogs();
  setTTYMode(true);
  const logger = new Logger({
    format: 'simple',
    colours: {
      error: '\x1b[31m', // different red
      warn: '\x1b[35m', // magenta instead of yellow
    },
  });

  logger.error('error message');
  logger.warn('warn message');

  const logs = getCapturedLogs();
  assert(logs[0].includes('\x1b[31m'));
  assert(logs[1].includes('\x1b[35m'));
});

Deno.test("Logger Simple Formatter - Message Formatting in Simple Mode - should handle multiple arguments", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.info('Hello %s, you are %d years old', 'John', 25);

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('Hello John, you are 25 years old'));
});

Deno.test("Logger Simple Formatter - Message Formatting in Simple Mode - should handle special characters", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.info('Special chars: "quotes", \\backslash, \nnewline');

  const logOutput = getCapturedLogs()[0];
  assert(logOutput.includes('Special chars: "quotes"'));
});

Deno.test("Logger Simple Formatter - Message Formatting in Simple Mode - should handle empty messages", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });
  logger.info('');

  const logOutput = getCapturedLogs()[0];
  // Should still have the level and timestamp parts
  assert(logOutput.includes('[INFO ]'));
});

Deno.test("Logger Simple Formatter - TTY Detection Integration - should detect TTY mode changes correctly", () => {
  clearCapturedLogs();

  // Test with TTY
  setTTYMode(true);
  const ttyLogger = new Logger({ format: 'simple' });
  ttyLogger.error('tty error');

  // Test without TTY
  setTTYMode(false);
  const noTtyLogger = new Logger({ format: 'simple' });
  noTtyLogger.error('no tty error');

  const logs = getCapturedLogs();

  // First should have colors, second should not
  assert(logs[0].includes('\x1b['));
  assert(!logs[1].includes('\x1b['));
});

// Cleanup
restoreTTY();