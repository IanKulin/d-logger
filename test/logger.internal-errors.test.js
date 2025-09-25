import { assertEquals, assert } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Internal Error Handling - Formatter Error Handling - should fall back to JSON formatter when custom formatter throws", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });

  // Replace the simple formatter with one that throws
  logger.formatters.simple = function () {
    throw new Error('Custom formatter error');
  };

  logger.info('test message');

  // Should still produce output using JSON formatter fallback
  assertEquals(getCapturedLogs().length, 1);

  // Should be valid JSON (fallback to JSON formatter)
  const logOutput = getCapturedLogs()[0];
  const parsed = JSON.parse(logOutput);
  assertEquals(parsed.msg, 'test message');
  assert(
    parsed.formatterError.includes(
      'Formatter failed: Custom formatter error'
    )
  );
});

Deno.test("Logger Internal Error Handling - Formatter Error Handling - should not crash when formatter returns non-string", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });

  // Replace formatter with one that returns an object instead of string
  logger.formatters.simple = function () {
    return { notAString: true };
  };

  logger.info('test message');

  // Should still produce output (fallback should handle this)
  assertEquals(getCapturedLogs().length, 1);

  // Should be valid JSON from fallback
  const logOutput = getCapturedLogs()[0];
  const parsed = JSON.parse(logOutput);
  assertEquals(parsed.msg, 'test message');
});

Deno.test("Logger Internal Error Handling - Formatter Error Handling - should preserve original formatters after error", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });

  // Temporarily break the formatter
  const originalSimple = logger.formatters.simple;
  logger.formatters.simple = function () {
    throw new Error('Temporary error');
  };

  logger.info('first message');

  // Restore the formatter
  logger.formatters.simple = originalSimple;

  logger.info('second message');

  // First message should have used fallback, second should work normally
  assertEquals(getCapturedLogs().length, 2);

  // First log should be JSON (fallback)
  JSON.parse(getCapturedLogs()[0]); // This should not throw

  // Second log should be simple format
  assert(getCapturedLogs()[1].includes('[INFO ]'));
  assert(getCapturedLogs()[1].includes('second message'));
});

Deno.test("Logger Internal Error Handling - Formatter Error Handling - should handle repeated formatter failures without memory leaks", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });

  // Break the formatter
  logger.formatters.simple = function () {
    throw new Error('Always fails');
  };

  // Log many times
  for (let i = 0; i < 100; i++) {
    logger.info(`message ${i}`);
  }

  // Should have produced 100 fallback logs
  assertEquals(getCapturedLogs().length, 100);

  // All should be valid JSON (fallback format)
  getCapturedLogs().forEach((log) => {
    JSON.parse(log); // This should not throw
  });
});