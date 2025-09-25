import { assertEquals, assertThrows } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Level Management - Level Setting and Getting - should change log level with level() method", () => {
  const logger = new Logger();
  logger.level('debug');
  assertEquals(logger.options.level, 'debug');
});

Deno.test("Logger Level Management - Level Setting and Getting - should return current level when called without arguments", () => {
  const logger = new Logger({ level: 'debug' });
  assertEquals(logger.level(), 'debug');
});

Deno.test("Logger Level Management - Level Setting and Getting - should return new level when setting level", () => {
  const logger = new Logger();
  const result = logger.level('error');
  assertEquals(result, 'error');
  assertEquals(logger.options.level, 'error');
});

Deno.test("Logger Level Management - Level Setting and Getting - should throw error for invalid log level", () => {
  const logger = new Logger();
  assertThrows(() => {
    logger.level('invalid');
  }, Error, "Invalid log level: invalid");
});

Deno.test("Logger Level Management - Level Setting and Getting - should allow method chaining after setting level", () => {
  const logger = new Logger();
  // This should not throw and should return a level
  const result = logger.level('warn');
  assertEquals(result, 'warn');
  assertEquals(typeof result, 'string');
});

Deno.test("Logger Level Management - setLevel Method - should have setLevel method as alias", () => {
  const logger = new Logger();
  assertEquals(typeof logger.setLevel, 'function');
});

Deno.test("Logger Level Management - setLevel Method - should set level correctly with setLevel method", () => {
  const logger = new Logger();
  const result = logger.setLevel('debug');
  assertEquals(result, 'debug');
  assertEquals(logger.options.level, 'debug');
});

Deno.test("Logger Level Management - setLevel Method - should return current level with setLevel when no args", () => {
  const logger = new Logger({ level: 'warn' });
  const result = logger.setLevel();
  assertEquals(result, 'warn');
});

Deno.test("Logger Level Management - setLevel Method - should throw error for invalid level in setLevel", () => {
  const logger = new Logger();
  assertThrows(() => {
    logger.setLevel('invalid');
  }, Error, "Invalid log level: invalid");
});

Deno.test("Logger Level Management - setLevel Method - should maintain consistency between level() and setLevel()", () => {
  const logger = new Logger();

  logger.level('error');
  assertEquals(logger.setLevel(), 'error');

  logger.setLevel('debug');
  assertEquals(logger.level(), 'debug');
});

Deno.test("Logger Level Management - setLevel Method - should support fluent interface pattern", () => {
  const logger = new Logger();

  // This demonstrates the fluent interface working
  const currentLevel = logger.level('warn');
  assertEquals(currentLevel, 'warn');

  // Both methods should return the current level for chaining
  assertEquals(logger.level('info'), 'info');
  assertEquals(logger.setLevel('debug'), 'debug');
});

Deno.test("Logger Level Management - Log Level Filtering - should filter debug messages when level is info", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'info' });
  logger.debug('debug message');
  assertEquals(getCapturedLogs().length, 0);
});

Deno.test("Logger Level Management - Log Level Filtering - should show info messages when level is info", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'info' });
  logger.info('info message');
  assertEquals(getCapturedLogs().length, 1);
});

Deno.test("Logger Level Management - Log Level Filtering - should show error messages at any level", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'error' });
  logger.error('error message');
  assertEquals(getCapturedLogs().length, 1);
});

Deno.test("Logger Level Management - Log Level Filtering - should filter warn and info when level is error", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'error' });
  logger.warn('warn message');
  logger.info('info message');
  assertEquals(getCapturedLogs().length, 0);
});

Deno.test("Logger Level Management - Log Level Filtering - should show all messages when level is debug", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'debug' });
  logger.error('error message');
  logger.warn('warn message');
  logger.info('info message');
  logger.debug('debug message');
  assertEquals(getCapturedLogs().length, 4);
});

Deno.test("Logger Level Management - Log Level Filtering - should show warn and above when level is warn", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'warn' });
  logger.error('error message');
  logger.warn('warn message');
  logger.info('info message');
  logger.debug('debug message');
  assertEquals(getCapturedLogs().length, 2);
});

Deno.test("Logger Level Management - Silent Level - should suppress all output when level is silent", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'silent' });

  logger.error('error message');
  logger.warn('warn message');
  logger.info('info message');
  logger.debug('debug message');

  // No messages should be logged
  assertEquals(getCapturedLogs().length, 0);
});

Deno.test("Logger Level Management - Silent Level - should allow setting level to silent", () => {
  const logger = new Logger();
  const result = logger.level('silent');
  assertEquals(result, 'silent');
  assertEquals(logger.options.level, 'silent');
});

Deno.test("Logger Level Management - Silent Level - should work with setLevel for silent level", () => {
  const logger = new Logger();
  const result = logger.setLevel('silent');
  assertEquals(result, 'silent');
  assertEquals(logger.options.level, 'silent');
});

Deno.test("Logger Level Management - Silent Level - should remain silent after multiple log attempts", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'silent' });

  // Try logging multiple times
  for (let i = 0; i < 5; i++) {
    logger.error(`error ${i}`);
    logger.warn(`warn ${i}`);
    logger.info(`info ${i}`);
    logger.debug(`debug ${i}`);
  }

  // Still no output
  assertEquals(getCapturedLogs().length, 0);
});

Deno.test("Logger Level Management - Dynamic Level Changes - should respect level changes during runtime", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'error' });

  // Should not log at info level
  logger.info('info message 1');
  assertEquals(getCapturedLogs().length, 0);

  // Change to info level
  logger.level('info');

  // Should now log info messages
  logger.info('info message 2');
  assertEquals(getCapturedLogs().length, 1);

  // Change to silent
  logger.level('silent');

  // Should not log anything
  logger.error('error message');
  assertEquals(getCapturedLogs().length, 1); // Still just the previous info message
});
