import { assertEquals, assert } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Robustness - Edge Cases and Data Handling - should not crash on logging errors", () => {
  clearCapturedLogs();
  const logger = new Logger();

  // This should not throw
  logger.info('test message');
});

Deno.test("Logger Robustness - Edge Cases and Data Handling - should handle undefined and null messages gracefully", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // These should not crash
  logger.info(undefined);
  logger.info(null);

  const logs = getCapturedLogs();
  assertEquals(logs.length, 2);

  const parsed1 = JSON.parse(logs[0]);
  const parsed2 = JSON.parse(logs[1]);

  assertEquals(parsed1.msg, 'undefined');
  assertEquals(parsed2.msg, 'null');
});

Deno.test("Logger Robustness - Edge Cases and Data Handling - should handle extremely large messages", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });
  const hugeMessage = 'x'.repeat(100000);

  logger.info(hugeMessage);

  const parsed = JSON.parse(getCapturedLogs()[0]);
  assertEquals(parsed.msg, hugeMessage);
});

Deno.test("Logger Robustness - Edge Cases and Data Handling - should handle circular objects in message formatting", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  const circular = { name: 'test' };
  circular.self = circular;

  logger.info('Circular: %j', circular);

  // Should still log something
  assertEquals(getCapturedLogs().length, 1);
});

Deno.test("Logger Robustness - Performance and Memory - should handle rapid consecutive logging without issues", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  for (let i = 0; i < 1000; i++) {
    logger.info(`rapid message ${i}`);
  }

  assertEquals(getCapturedLogs().length, 1000);
});

Deno.test("Logger Robustness - Performance and Memory - should handle repeated logging operations efficiently", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'simple' });

  const startTime = Date.now();

  // Log a reasonable number of messages
  for (let i = 0; i < 500; i++) {
    logger.info(`performance test message ${i}`);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Should complete within reasonable time (adjust threshold as needed)
  assert(duration < 5000, `Logging took too long: ${duration}ms`);
  assertEquals(getCapturedLogs().length, 500);
});

Deno.test("Logger Robustness - Performance and Memory - should handle mixed format types in rapid succession", () => {
  clearCapturedLogs();
  const jsonLogger = new Logger({ format: 'json' });
  const simpleLogger = new Logger({ format: 'simple' });

  for (let i = 0; i < 50; i++) {
    jsonLogger.info(`json message ${i}`);
    simpleLogger.info(`simple message ${i}`);
  }

  assertEquals(getCapturedLogs().length, 100);
});

Deno.test("Logger Robustness - Complex Data Structures - should handle deeply nested objects", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  const deepObject = {
    level1: { level2: { level3: { level4: { value: 'deep' } } } },
  };

  logger.info('Deep object: %j', deepObject);

  assertEquals(getCapturedLogs().length, 1);
});

Deno.test("Logger Robustness - Complex Data Structures - should handle arrays with mixed data types", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  const mixedArray = [
    1,
    'string',
    { obj: true },
    [1, 2, 3],
    null,
    undefined,
  ];

  logger.info('Mixed array: %j', mixedArray);

  assertEquals(getCapturedLogs().length, 1);
});

Deno.test("Logger Robustness - Complex Data Structures - should handle special characters and unicode", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  const specialMessage = 'Special chars: \n\t\r\\"\'🚀 Unicode: こんにちは';

  logger.info(specialMessage);

  const parsed = JSON.parse(getCapturedLogs()[0]);
  assertEquals(parsed.msg, specialMessage);
});
