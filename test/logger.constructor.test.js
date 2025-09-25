import { assertEquals, assertThrows } from "@std/assert";
import Logger from "../lib/logger.ts";

Deno.test("Logger Constructor - should throw error for invalid log level", () => {
  assertThrows(
    () => {
      new Logger({ level: "invalid" });
    },
    Error,
    "Invalid log level: invalid. Valid levels are: silent, error, warn, info, debug",
  );
});

Deno.test("Logger Constructor - should throw error for invalid format", () => {
  assertThrows(
    () => {
      new Logger({ format: "invalid" });
    },
    Error,
    "Invalid format: invalid. Valid formats are: json, simple",
  );
});

Deno.test("Logger Constructor - should throw error for invalid time option", () => {
  assertThrows(
    () => {
      new Logger({ time: "invalid" });
    },
    Error,
    "Invalid time: invalid. Valid times are: long, short",
  );
});

Deno.test("Logger Constructor - should throw error for invalid callerLevel", () => {
  assertThrows(
    () => {
      new Logger({ callerLevel: "invalid" });
    },
    Error,
    "Invalid callerLevel: invalid. Valid levels are: silent, error, warn, info, debug",
  );
});

Deno.test("Logger Constructor - should throw error for non-object colours", () => {
  assertThrows(
    () => {
      new Logger({ colours: "not an object" });
    },
    Error,
    "colours option must be an object",
  );
});

Deno.test("Logger Constructor - should throw error for non-object levels", () => {
  assertThrows(
    () => {
      new Logger({ levels: "not an object" });
    },
    Error,
    "levels option must be an object",
  );
});

Deno.test("Logger Constructor - should throw error for invalid level values", () => {
  assertThrows(
    () => {
      new Logger({ levels: { error: -1 } });
    },
    Error,
    "Level value for 'error' must be a non-negative integer",
  );

  assertThrows(
    () => {
      new Logger({ levels: { error: "not a number" } });
    },
    Error,
    "Level value for 'error' must be a non-negative integer",
  );

  assertThrows(
    () => {
      new Logger({ levels: { error: 1.5 } });
    },
    Error,
    "Level value for 'error' must be a non-negative integer",
  );
});

Deno.test("Logger Constructor - should accept valid options without throwing", () => {
  // This should not throw
  new Logger({
    level: "debug",
    format: "simple",
    time: "long",
    callerLevel: "error",
    colours: { error: "\x1b[31m" },
    levels: { custom: 4 },
  });
});

Deno.test("Logger Constructor - should instantiate with default options", () => {
  const logger = new Logger();
  assertEquals(logger.options.level, "info");
  assertEquals(logger.options.format, "json");
  assertEquals(logger.options.time, "short");
  assertEquals(logger.options.callerLevel, "warn");
  assertEquals(logger.options.levels, {
    silent: -1,
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  });
});

Deno.test("Logger Constructor - should instantiate with custom options", () => {
  const logger = new Logger({
    level: "debug",
    format: "simple",
    time: "long",
    callerLevel: "error",
  });
  assertEquals(logger.options.level, "debug");
  assertEquals(logger.options.format, "simple");
  assertEquals(logger.options.time, "long");
  assertEquals(logger.options.callerLevel, "error");
});

Deno.test("Logger Constructor - should merge options correctly", () => {
  const customOptions = {
    level: "debug",
    format: "simple",
    time: "long",
    colours: {
      error: "\x1b[31m", // different red
    },
  };

  const logger = new Logger(customOptions);

  assertEquals(logger.options.level, "debug");
  assertEquals(logger.options.format, "simple");
  assertEquals(logger.options.time, "long");
  assertEquals(logger.options.colours.error, "\x1b[31m");
  // Should still have other default colors
  assertEquals(logger.options.colours.warn, "\x1b[33m");
});

Deno.test("Logger Constructor - should have all log level methods", () => {
  const logger = new Logger();
  assertEquals(typeof logger.error, "function");
  assertEquals(typeof logger.warn, "function");
  assertEquals(typeof logger.info, "function");
  assertEquals(typeof logger.debug, "function");
});

Deno.test("Logger Constructor - should have level management methods", () => {
  const logger = new Logger();
  assertEquals(typeof logger.level, "function");
  assertEquals(typeof logger.setLevel, "function");
});

Deno.test("Logger Constructor - should detect TTY correctly", () => {
  const originalIsTTY = Deno.stdout.isTerminal();

  // Mock TTY mode
  Deno.stdout.isTerminal = () => true;
  const logger1 = new Logger();
  assertEquals(logger1.isRedirected, false);

  Deno.stdout.isTerminal = () => false;
  const logger2 = new Logger();
  assertEquals(logger2.isRedirected, true);

  // Restore original
  Deno.stdout.isTerminal = () => originalIsTTY;
});

Deno.test("Logger Constructor - should work with all existing constructor patterns", () => {
  // No options - should not throw
  new Logger();

  // Partial options - should not throw
  new Logger({ level: "debug" });

  // Full options (without time) - should not throw
  new Logger({
    level: "warn",
    format: "simple",
    colours: { error: "\x1b[31m" },
    levels: { custom: 5 },
  });
});
