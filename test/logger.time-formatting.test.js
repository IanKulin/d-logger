import { assert, assertEquals, assertThrows } from "@std/assert";
import Logger from "../lib/logger.ts";
import {
  clearCapturedLogs,
  getCapturedLogs,
  getFirstLogAsJSON,
  setupMocks,
} from "./helpers/logger-test-helpers.js";

// Setup and teardown for all tests
setupMocks();

Deno.test("Logger Time Formatting - Default Time Format - should default to short time format", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: "json" });
  logger.info("test message");

  const parsed = getFirstLogAsJSON();

  // Short format should be YYYY-MM-DD HH:MM (without seconds)
  assert(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
  assert(!parsed.time.includes("T"));
  assert(!parsed.time.includes("Z"));
  assert(!parsed.time.includes("."));
});

Deno.test("Logger Time Formatting - Default Time Format - should include time option in logger options", () => {
  const shortLogger = new Logger({ time: "short" });
  const longLogger = new Logger({ time: "long" });
  const defaultLogger = new Logger();

  assertEquals(shortLogger.options.time, "short");
  assertEquals(longLogger.options.time, "long");
  assertEquals(defaultLogger.options.time, "short"); // default
});

Deno.test("Logger Time Formatting - Short Time Format - should format time as short when time option is 'short'", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "short", format: "json" });
  logger.info("test message");

  const parsed = getFirstLogAsJSON();

  // Short format: YYYY-MM-DD HH:MM
  assert(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
  assertEquals(parsed.time.length, 16);
});

Deno.test("Logger Time Formatting - Short Time Format - should work with simple formatter and short time", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "short", format: "simple" });
  logger.info("test message");

  const logOutput = getCapturedLogs()[0];

  // Should contain short time format in brackets
  assert(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
  assert(!logOutput.includes("T"));
  assert(!logOutput.includes("Z"));
});

Deno.test("Logger Time Formatting - Short Time Format - should truncate time correctly in short format", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "short", format: "json" });

  logger.info("test message");

  const parsed = getFirstLogAsJSON();

  // Short format should not have seconds or milliseconds
  assert(
    !parsed.time.includes(":") || parsed.time.split(":").length === 2,
  );
  assert(!parsed.time.includes("."));

  // Should be exactly 16 characters: YYYY-MM-DD HH:MM
  assertEquals(parsed.time.length, 16);
});

Deno.test("Logger Time Formatting - Long Time Format - should format time as long ISO string when time is 'long'", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "long", format: "json" });
  logger.info("test message");

  const parsed = getFirstLogAsJSON();

  // Long format should be full ISO string
  assert(parsed.time.includes("T"));
  assert(parsed.time.includes("Z"));
  assert(parsed.time.includes("."));

  // Should be valid ISO string
  new Date(parsed.time); // This should not throw

  // Should match ISO format pattern
  assert(
    parsed.time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  );
});

Deno.test("Logger Time Formatting - Long Time Format - should work with simple formatter and long time", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "long", format: "simple" });
  logger.info("test message");

  const logOutput = getCapturedLogs()[0];

  // Should contain long time format in brackets
  assert(
    logOutput.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
  );
  assert(logOutput.includes("T"));
  assert(logOutput.includes("Z"));
});

Deno.test("Logger Time Formatting - Long Time Format - should preserve time precision in long format", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "long", format: "json" });

  const startTime = Date.now();
  logger.info("test message");
  const endTime = Date.now();

  const parsed = getFirstLogAsJSON();
  const logTime = new Date(parsed.time).getTime();

  // Log time should be within the test execution window
  assert(logTime >= startTime);
  assert(logTime <= endTime);

  // Should have millisecond precision
  assert(parsed.time.includes("."));
});

Deno.test("Logger Time Formatting - Time Format Consistency - should use consistent time format across multiple log calls", () => {
  clearCapturedLogs();
  const logger = new Logger({ time: "short", format: "json" });

  logger.info("first message");
  logger.warn("second message");

  const logs = getCapturedLogs();
  const parsed1 = JSON.parse(logs[0]);
  const parsed2 = JSON.parse(logs[1]);

  // Both should use short format
  assert(parsed1.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
  assert(parsed2.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
});

Deno.test("Logger Time Formatting - Time Option Validation - should validate time option in constructor", () => {
  // Valid options should not throw
  new Logger({ time: "long" });
  new Logger({ time: "short" });

  // Invalid option should throw
  assertThrows(
    () => {
      new Logger({ time: "medium" });
    },
    Error,
    "Invalid time: medium. Valid times are: long, short",
  );

  assertThrows(
    () => {
      new Logger({ time: "invalid" });
    },
    Error,
    "Invalid time: invalid. Valid times are: long, short",
  );
});

Deno.test("Logger Time Formatting - Backward Compatibility - should maintain existing behavior for existing code", () => {
  clearCapturedLogs();

  // Code that doesn't specify time option should work as before
  const logger = new Logger({ format: "json", level: "info" });
  logger.info("test message");

  const parsed = getFirstLogAsJSON();

  // Should still have all expected fields
  assertEquals(parsed.level, "info");
  assertEquals(parsed.msg, "test message");
  assertEquals(typeof parsed.time, "string");
  assertEquals(typeof parsed.pid, "number");
  assertEquals(typeof parsed.hostname, "string");

  // Time should be in short format (new default)
  assert(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
});

Deno.test("Logger Time Formatting - Backward Compatibility - should not break existing simple formatter tests", () => {
  clearCapturedLogs();
  const logger = new Logger({ format: "simple" });
  logger.warn("warning message");

  const logOutput = getCapturedLogs()[0];

  // Should still contain expected elements
  assert(logOutput.includes("[WARN ]"));
  assert(logOutput.includes("warning message"));
  assert(logOutput.includes(".js:"));

  // Should use short time format (new default)
  assert(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
});
