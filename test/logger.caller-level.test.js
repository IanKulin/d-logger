import { assertEquals, assert } from "@std/assert";
import Logger from '../lib/logger.ts';

Deno.test("Logger callerLevel - Caller Information Filtering - should include caller info for error when callerLevel is warn", () => {
  const logger = new Logger({ callerLevel: 'warn' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.error('test message');

    // Parse JSON output and check for caller info
    const logEntry = JSON.parse(capturedOutput);
    assert(
      logEntry.callerFile,
      'Should include callerFile for error level'
    );
    assert(
      typeof logEntry.callerLine === 'number',
      'Should include callerLine for error level'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Caller Information Filtering - should include caller info for warn when callerLevel is warn", () => {
  const logger = new Logger({ callerLevel: 'warn' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.warn('test message');

    // Parse JSON output and check for caller info
    const logEntry = JSON.parse(capturedOutput);
    assert(
      logEntry.callerFile,
      'Should include callerFile for warn level'
    );
    assert(
      typeof logEntry.callerLine === 'number',
      'Should include callerLine for warn level'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Caller Information Filtering - should NOT include caller info for info when callerLevel is warn", () => {
  const logger = new Logger({ callerLevel: 'warn' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.info('test message');

    // Parse JSON output and check for absence of caller info
    const logEntry = JSON.parse(capturedOutput);
    assertEquals(
      logEntry.callerFile,
      undefined,
      'Should NOT include callerFile for info level'
    );
    assertEquals(
      logEntry.callerLine,
      undefined,
      'Should NOT include callerLine for info level'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Caller Information Filtering - should NOT include caller info for debug when callerLevel is warn", () => {
  const logger = new Logger({ callerLevel: 'warn', level: 'debug' }); // Set level to debug to ensure debug messages are logged

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.debug('test message');

    // Parse JSON output and check for absence of caller info
    const logEntry = JSON.parse(capturedOutput);
    assertEquals(
      logEntry.callerFile,
      undefined,
      'Should NOT include callerFile for debug level'
    );
    assertEquals(
      logEntry.callerLine,
      undefined,
      'Should NOT include callerLine for debug level'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Caller Information Filtering - should include caller info for all levels when callerLevel is debug", () => {
  const logger = new Logger({ callerLevel: 'debug', level: 'debug' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    // Test each level
    const levels = ['error', 'warn', 'info', 'debug'];
    for (const level of levels) {
      logger[level]('test message');

      const logEntry = JSON.parse(capturedOutput);
      assert(
        logEntry.callerFile,
        `Should include callerFile for ${level} level`
      );
      assert(
        typeof logEntry.callerLine === 'number',
        `Should include callerLine for ${level} level`
      );
    }
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Caller Information Filtering - should NOT include caller info for any level when callerLevel is silent", () => {
  const logger = new Logger({ callerLevel: 'silent', level: 'debug' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    // Test each level
    const levels = ['error', 'warn', 'info', 'debug'];
    for (const level of levels) {
      logger[level]('test message');

      const logEntry = JSON.parse(capturedOutput);
      assertEquals(
        logEntry.callerFile,
        undefined,
        `Should NOT include callerFile for ${level} level`
      );
      assertEquals(
        logEntry.callerLine,
        undefined,
        `Should NOT include callerLine for ${level} level`
      );
    }
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Simple Formatter with callerLevel - should format correctly without caller info when excluded", () => {
  const logger = new Logger({ format: 'simple', callerLevel: 'error' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.info('test message');

    // Should not contain caller info pattern
    assert(
      !capturedOutput.includes('unknown'),
      'Should not include caller placeholder'
    );
    assert(
      !capturedOutput.includes('.js:'),
      'Should not include file:line pattern'
    );

    // Should still contain other parts
    assert(capturedOutput.includes('INFO'), 'Should include log level');
    assert(
      capturedOutput.includes('test message'),
      'Should include message'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Simple Formatter with callerLevel - should format correctly with caller info when included", () => {
  const logger = new Logger({ format: 'simple', callerLevel: 'info' });

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = '';
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    logger.info('test message');

    // Should contain caller info pattern
    assert(
      capturedOutput.includes('.js:'),
      'Should include file:line pattern'
    );
    assert(capturedOutput.includes('INFO'), 'Should include log level');
    assert(
      capturedOutput.includes('test message'),
      'Should include message'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Performance Considerations - should not call getCallerInfo when caller info is not needed", () => {
  const logger = new Logger({ callerLevel: 'error' });

  // Spy on getCallerInfo method
  let getCallerInfoCalled = false;
  const originalGetCallerInfo = logger.getCallerInfo;
  logger.getCallerInfo = function () {
    getCallerInfoCalled = true;
    return originalGetCallerInfo.call(this);
  };

  // Mock console.log to prevent actual output
  const originalLog = console.log;
  console.log = () => {};

  try {
    logger.info('test message');
    assertEquals(
      getCallerInfoCalled,
      false,
      'getCallerInfo should not be called for info level when callerLevel is error'
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger callerLevel - Performance Considerations - should call getCallerInfo when caller info is needed", () => {
  const logger = new Logger({ callerLevel: 'warn' });

  // Spy on getCallerInfo method
  let getCallerInfoCalled = false;
  const originalGetCallerInfo = logger.getCallerInfo;
  logger.getCallerInfo = function () {
    getCallerInfoCalled = true;
    return originalGetCallerInfo.call(this);
  };

  // Mock console.log to prevent actual output
  const originalLog = console.log;
  console.log = () => {};

  try {
    logger.error('test message');
    assertEquals(
      getCallerInfoCalled,
      true,
      'getCallerInfo should be called for error level when callerLevel is warn'
    );
  } finally {
    console.log = originalLog;
  }
});