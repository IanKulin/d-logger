import { assertEquals, assert } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
  getFirstLogAsJSON,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger JSON Formatter - Basic JSON Output - should produce valid JSON output", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.info('test message');

  assertEquals(getCapturedLogs().length, 1);
  const logOutput = getCapturedLogs()[0];

  // Should be valid JSON
  JSON.parse(logOutput);
});

Deno.test("Logger JSON Formatter - Basic JSON Output - should include all required fields in JSON output", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json', callerLevel: 'info' });
  logger.info('test message');

  const parsed = getFirstLogAsJSON();

  assertEquals(parsed.level, 'info');
  assertEquals(parsed.levelNumber, 2);
  assertEquals(parsed.msg, 'test message');
  assertEquals(typeof parsed.time, 'string');
  assertEquals(typeof parsed.pid, 'number');
  assertEquals(typeof parsed.hostname, 'string');
  assert(parsed.callerFile);
  assertEquals(typeof parsed.callerLine, 'number');
});

Deno.test("Logger JSON Formatter - Basic JSON Output - should format timestamp correctly based on time option", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json', time: 'short' });
  logger.info('test message');

  const parsed = getFirstLogAsJSON();
  // Should be short format, not ISO
  assert(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
  assert(!parsed.time.includes('T'));
  assert(!parsed.time.includes('Z'));
});

Deno.test("Logger JSON Formatter - JSON Error Handling - should handle circular references in log entry", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Create a circular reference by modifying the logger's formatters
  const originalJsonFormatter = logger.formatters.json;
  logger.formatters.json = function (logEntry) {
    // Add a circular reference to the logEntry
    const circular = { self: null };
    circular.self = circular;
    logEntry.circular = circular;

    // Call the original formatter which should handle the error
    return originalJsonFormatter.call(this, logEntry);
  };

  logger.info('test with circular reference');

  const logOutput = getCapturedLogs()[0];
  // Should be valid JSON despite circular reference
  const parsed = JSON.parse(logOutput);
  // Should contain error information
  assert(parsed.jsonError.includes('JSON stringify failed'));
  assertEquals(parsed.msg, 'test with circular reference');
});

Deno.test("Logger JSON Formatter - JSON Error Handling - should handle JSON stringify errors with fallback", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Create a problematic object that will cause JSON.stringify to fail
  const problematic = {};
  Object.defineProperty(problematic, 'badProp', {
    get() {
      throw new Error('Property access error');
    },
    enumerable: true,
  });

  // Test the formatter directly with a problematic object
  const problematicLogEntry = {
    level: 'info',
    msg: 'test message',
    problematic: problematic,
  };

  const result = logger.formatters.json(problematicLogEntry);

  // Should produce valid JSON with error info
  const parsed = JSON.parse(result);
  assert(parsed.jsonError.includes('JSON stringify failed'));
});

Deno.test("Logger JSON Formatter - JSON Error Handling - should handle extreme JSON stringify failures", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Create an object that will fail even the safe fallback
  // by mocking JSON.stringify to always throw
  const originalStringify = JSON.stringify;
  let callCount = 0;

  JSON.stringify = function (...args) {
    callCount++;
    if (callCount <= 2) {
      throw new Error('Mock JSON error');
    }
    return originalStringify.apply(this, args);
  };

  try {
    const result = logger.formatters.json({
      level: 'error',
      msg: 'test message',
    });

    // Should still produce valid JSON string even after multiple failures
    const parsed = JSON.parse(result);
    assertEquals(parsed.level, 'error');
    assertEquals(parsed.msg, 'test message');
    assert(parsed.jsonError.includes('Multiple JSON errors occurred'));
  } finally {
    JSON.stringify = originalStringify;
  }
});

Deno.test("Logger JSON Formatter - Special Characters and Edge Cases - should handle special characters", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.info('Special chars: "quotes", \\backslash, \nnewline');

  // Should produce valid JSON despite special characters
  JSON.parse(getCapturedLogs()[0]);
});

Deno.test("Logger JSON Formatter - Special Characters and Edge Cases - should handle empty messages", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.info('');

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.msg, '');
});

Deno.test("Logger JSON Formatter - Special Characters and Edge Cases - should handle null and undefined arguments", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.info('Value: %s', null);

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.msg, 'Value: null');
});

Deno.test("Logger JSON Formatter - Special Characters and Edge Cases - should handle very long messages", () => {
  clearCapturedLogs();
  const longMessage = 'x'.repeat(10000);
  const logger = new Logger({ format: 'json' });
  logger.info(longMessage);

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.msg, longMessage);
});

Deno.test("Logger JSON Formatter - Special Characters and Edge Cases - should handle objects in messages", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  const obj = { key: 'value', nested: { prop: 123 } };
  logger.info('Object: %j', obj);

  const parsed = getFirstLogAsJSON();
  assert(parsed.msg.includes('{"key":"value","nested":{"prop":123}}'));
});

Deno.test("Logger JSON Formatter - All Log Levels in JSON - should log error messages with correct level", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.error('error message');

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.level, 'error');
  assertEquals(parsed.levelNumber, 0);
});

Deno.test("Logger JSON Formatter - All Log Levels in JSON - should log warn messages with correct level", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.warn('warn message');

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.level, 'warn');
  assertEquals(parsed.levelNumber, 1);
});

Deno.test("Logger JSON Formatter - All Log Levels in JSON - should log info messages with correct level", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  logger.info('info message');

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.level, 'info');
  assertEquals(parsed.levelNumber, 2);
});

Deno.test("Logger JSON Formatter - All Log Levels in JSON - should log debug messages with correct level", () => {
  clearCapturedLogs();
  const logger = new Logger({ level: 'debug', format: 'json' });
  logger.debug('debug message');

  const parsed = getFirstLogAsJSON();
  assertEquals(parsed.level, 'debug');
  assertEquals(parsed.levelNumber, 3);
});