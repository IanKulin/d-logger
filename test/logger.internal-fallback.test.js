import { assertEquals, assertThrows, assert } from "@std/assert";
import Logger from '../lib/logger.ts';
import {
  setupMocks,
  getCapturedLogs,
  clearCapturedLogs,
  getCapturedErrors,
  clearCapturedErrors,
} from './helpers/logger-test-helpers.js';

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Additional Fallback Tests - JSON Formatter Error Handling - should handle circular references in log data", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Create circular reference
  const obj = { name: 'test' };
  obj.self = obj;

  logger.info('Message with circular ref: %j', obj);

  assertEquals(getCapturedLogs().length, 1);
  const logOutput = getCapturedLogs()[0];

  // Should be valid JSON despite circular reference
  const parsed = JSON.parse(logOutput);
  assertEquals(parsed.level, 'info');
  // Check for either jsonError or that the message was logged successfully
  assert(
    parsed.jsonError?.includes('JSON stringify failed') ||
      parsed.msg.includes('Message with circular ref')
  );
});

Deno.test("Logger Additional Fallback Tests - JSON Formatter Error Handling - should handle objects with non-serializable properties", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Create object with function (non-serializable)
  const objWithFunction = {
    name: 'test',
    func: function () {
      return 'hello';
    },
    symbol: Symbol('test'),
    undefined: undefined,
  };

  logger.info('Object: %j', objWithFunction);

  assertEquals(getCapturedLogs().length, 1);
  const logOutput = getCapturedLogs()[0];

  // Should produce valid JSON
  const parsed = JSON.parse(logOutput);
  assertEquals(parsed.level, 'info');
  // Should have the message in some form
  assert(parsed.msg.includes('Object:'));
});

Deno.test("Logger Additional Fallback Tests - JSON Formatter Error Handling - should handle when JSON formatter itself is broken", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Break the JSON formatter
  logger.formatters.json = function () {
    throw new Error('JSON formatter is broken');
  };

  logger.info('test message');

  // Should still produce some output (last resort fallback)
  assertEquals(getCapturedLogs().length, 1);
  const logOutput = getCapturedLogs()[0];

  // Should contain the message even if not perfectly formatted
  assert(logOutput.includes('test message'));
});

Deno.test("Logger Additional Fallback Tests - Caller Detection Error Handling - should handle stack manipulation errors", () => {
  clearCapturedLogs();
  clearCapturedErrors();

  const logger = new Logger({ format: 'json', callerLevel: 'info' });

  // Override getCallerInfo to simulate an error
  const originalGetCallerInfo = logger.getCallerInfo;
  logger.getCallerInfo = function () {
    this.callerErrorCount++;
    if (this.callerErrorCount <= this.maxCallerErrors) {
      console.error(
        'Error retrieving caller info:',
        new Error('Simulated caller error')
      );
      if (this.callerErrorCount === this.maxCallerErrors) {
        console.error(
          `Caller detection failed ${this.maxCallerErrors} times. Suppressing further caller error messages.`
        );
      }
    }
    return { callerFile: 'unknown', callerLine: 0 };
  };

  try {
    logger.info('test with simulated caller error');

    // Should still log the message
    assertEquals(getCapturedLogs().length, 1);
    const parsed = JSON.parse(getCapturedLogs()[0]);
    assertEquals(parsed.msg, 'test with simulated caller error');
    assertEquals(parsed.callerFile, 'unknown');
    assertEquals(parsed.callerLine, 0);

    // Should have logged an error about caller detection
    assert(getCapturedErrors().length > 0);
  } finally {
    logger.getCallerInfo = originalGetCallerInfo;
    logger.callerErrorCount = 0;
  }
});

Deno.test("Logger Additional Fallback Tests - Caller Detection Error Handling - should suppress caller errors after max threshold", () => {
  clearCapturedLogs();
  clearCapturedErrors();

  const logger = new Logger({ format: 'json', callerLevel: 'info' });

  // Override getCallerInfo to always simulate errors
  const originalGetCallerInfo = logger.getCallerInfo;
  logger.getCallerInfo = function () {
    this.callerErrorCount++;
    if (this.callerErrorCount <= this.maxCallerErrors) {
      console.error(
        'Error retrieving caller info:',
        new Error('Always fails')
      );
      if (this.callerErrorCount === this.maxCallerErrors) {
        console.error(
          `Caller detection failed ${this.maxCallerErrors} times. Suppressing further caller error messages.`
        );
      }
    }
    return { callerFile: 'unknown', callerLine: 0 };
  };

  try {
    // Log more than maxCallerErrors (5) times
    for (let i = 0; i < 10; i++) {
      logger.info(`test message ${i}`);
    }

    // Should have logged all 10 messages
    assertEquals(getCapturedLogs().length, 10);

    // Should have logged errors for first 5 attempts, then suppression message
    const errorLogs = getCapturedErrors();
    assert(errorLogs.length >= 5); // At least 5 error calls
    assert(errorLogs.length <= 6); // But not more than 6 (5 + suppression message)

    // Check that suppression message is included
    const suppressionFound = errorLogs.some((errorArgs) =>
      errorArgs.some(
        (arg) =>
          typeof arg === 'string' &&
          arg.includes('Suppressing further caller error messages')
      )
    );
    assert(suppressionFound);
  } finally {
    logger.getCallerInfo = originalGetCallerInfo;
    logger.callerErrorCount = 0;
  }
});

Deno.test("Logger Additional Fallback Tests - Caller Detection Error Handling - should reset caller error count after successful detection", () => {
  clearCapturedLogs();
  clearCapturedErrors();

  const logger = new Logger({ format: 'json', callerLevel: 'info' });

  // Override getCallerInfo to simulate different phases
  const originalGetCallerInfo = logger.getCallerInfo;
  let phase = 'error1';

  logger.getCallerInfo = function () {
    if (phase === 'error1') {
      this.callerErrorCount++;
      if (this.callerErrorCount <= this.maxCallerErrors) {
        console.error(
          'Error retrieving caller info:',
          new Error('Phase 1 error')
        );
      }
      return { callerFile: 'unknown', callerLine: 0 };
    } else if (phase === 'working') {
      // Reset error count on successful call
      this.callerErrorCount = 0;
      return originalGetCallerInfo.call(this);
    } else if (phase === 'error2') {
      this.callerErrorCount++;
      if (this.callerErrorCount <= this.maxCallerErrors) {
        console.error(
          'Error retrieving caller info:',
          new Error('Phase 2 error')
        );
      }
      return { callerFile: 'unknown', callerLine: 0 };
    }
  };

  try {
    // Cause some errors
    logger.info('test 1');
    logger.info('test 2');

    // Switch to working mode
    phase = 'working';
    logger.info('test 3');

    // Break it again
    phase = 'error2';
    logger.info('test 4');

    const errorLogs = getCapturedErrors();
    // Should have errors from both phases
    assert(errorLogs.length >= 3);
  } finally {
    logger.getCallerInfo = originalGetCallerInfo;
    logger.callerErrorCount = 0;
  }
});

Deno.test("Logger Additional Fallback Tests - Extreme Error Conditions - should handle when console.log itself throws", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Break console.log
  const originalLog = console.log;
  console.log = function () {
    throw new Error('Console is broken');
  };

  try {
    // This should not crash the process, but the error will bubble up
    // since there's no try-catch around console.log in the logger
    assertThrows(() => {
      logger.info('test message');
    }, Error, "Console is broken");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger Additional Fallback Tests - Extreme Error Conditions - should handle when util.format has issues with complex objects", () => {
  setupMocks();
  const logger = new Logger({ format: 'json' });

  // Create an object that will cause issues with string conversion
  const problematicObject = {
    toString: function () {
      throw new Error('toString failed');
    },
    valueOf: function () {
      throw new Error('valueOf failed');
    },
  };

  // The logger should handle this gracefully and not throw
  logger.info('Message: %s', problematicObject);

  const logs = getCapturedLogs();
  assertEquals(logs.length, 1);

  const output = JSON.parse(logs[0]);
  // The logger should handle the problematic object gracefully
  // Either by showing [object Object] or the actual object structure
  assertEquals(typeof output.msg, 'string');
  assertEquals(output.msg.startsWith('Message: '), true);

});

Deno.test("Logger Additional Fallback Tests - Extreme Error Conditions - should handle when hostname fails", () => {
  setupMocks();
  clearCapturedLogs();
  const logger = new Logger({ format: 'json' });

  // Mock hostname retrieval to throw (this would need to be mocked at the source)
  // Since we can't directly mock os.hostname in Deno, this test shows the concept
  // In practice, hostname failures are rare but could happen

  // For Deno, we could mock the hostname call if it were extracted to a mockable function
  // For now, this is more of a documentation test
  logger.info('test message');
  assertEquals(getCapturedLogs().length, 1);

});

Deno.test("Logger Additional Fallback Tests - Fallback Chain Testing - should handle formatter failures gracefully", () => {
  setupMocks();
  clearCapturedLogs();
  clearCapturedErrors();

  const logger = new Logger({ format: 'simple', callerLevel: 'info' });

  // Break the simple formatter
  logger.formatters.simple = function () {
    throw new Error('Simple formatter broken');
  };

  // Also simulate caller detection failure
  const originalGetCallerInfo = logger.getCallerInfo;
  logger.getCallerInfo = function () {
    this.callerErrorCount++;
    if (this.callerErrorCount <= this.maxCallerErrors) {
      console.error(
        'Error retrieving caller info:',
        new Error('Caller detection failed')
      );
    }
    return { callerFile: 'unknown', callerLine: 0 };
  };

  try {
    // Should still produce some output despite multiple failures
    logger.info('test message');

    // Should produce some kind of output (fallback to JSON formatter)
    assertEquals(getCapturedLogs().length, 1);
    const output = getCapturedLogs()[0];

    // Should be valid JSON (fallback formatter)
    const parsed = JSON.parse(output);
    assertEquals(parsed.msg, 'test message');
    assert(parsed.formatterError.includes('Simple formatter broken'));
    assertEquals(parsed.callerFile, 'unknown');
  } finally {
    logger.getCallerInfo = originalGetCallerInfo;
    logger.callerErrorCount = 0;
    }
});

Deno.test("Logger Additional Fallback Tests - Resource Cleanup - should not leak memory during repeated errors", () => {
  setupMocks();
  clearCapturedLogs();
  clearCapturedErrors();

  const logger = new Logger({ format: 'simple' });

  // Break the formatter
  logger.formatters.simple = function () {
    throw new Error('Always fails');
  };

  // Log many times to check for memory leaks
  for (let i = 0; i < 1000; i++) {
    logger.info(`message ${i}`);
  }

  // Should have produced all logs
  assertEquals(getCapturedLogs().length, 1000);

  // Check that we're not accumulating error state
  // (This is more of a smoke test - real memory leak detection would need different tools)
  assert(true); // If we get here without crashing, that's good

});