import { assertEquals, assertMatch } from "@std/assert";
import Logger from "../lib/logger.ts";

Deno.test("Logger util.format functionality - Format specifiers - should handle %s string formatting", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("User %s logged in", "john");

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "User john logged in");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Format specifiers - should handle %d number formatting", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("User has %d points", 100);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "User has 100 points");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Format specifiers - should handle %i integer formatting", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Value: %i", 42.7);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Value: 42");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Format specifiers - should handle %f float formatting", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Price: %f", 19.99);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Price: 19.99");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Format specifiers - should handle %j JSON formatting", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const obj = { name: "test", value: 42 };
    logger.info("Config: %j", obj);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, 'Config: {"name":"test","value":42}');
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Format specifiers - should handle %% literal percentage", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Progress: 50%% complete");

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Progress: 50%% complete");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Multiple format specifiers - should handle multiple format specifiers", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info(
      "User %s has %d points and %f%% completion",
      "alice",
      150,
      75.5,
    );

    const output = JSON.parse(capturedOutput);
    assertEquals(
      output.msg,
      "User alice has 150 points and 75.5% completion",
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Multiple format specifiers - should handle mixed format specifiers with JSON", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const config = { debug: true, port: 3000 };
    logger.info(
      "Server %s running on port %d with config %j",
      "api",
      8080,
      config,
    );

    const output = JSON.parse(capturedOutput);
    assertEquals(
      output.msg,
      'Server api running on port 8080 with config {"debug":true,"port":3000}',
    );
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Multiple arguments without format specifiers - should handle multiple arguments without format specifiers", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Message", "arg1", "arg2", 123);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Message arg1 arg2 123");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Multiple arguments without format specifiers - should handle mixed objects and primitives", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const obj = { key: "value" };
    logger.info("Data:", obj, 42, true);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Data: { key: 'value' } 42 true");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Edge cases - should handle more format specifiers than arguments", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Hello %s, you are %d years old", "John");

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Hello John, you are %d years old");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Edge cases - should handle more arguments than format specifiers", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Hello %s", "John", "extra", "args", 123);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Hello John extra args 123");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Edge cases - should handle null and undefined values", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    logger.info("Values: %s %s %d", null, undefined, null);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Values: null undefined 0");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Edge cases - should handle arrays and objects without %j", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const arr = [1, 2, 3];
    const obj = { a: 1 };
    logger.info("Data %s and %s", arr, obj);

    const output = JSON.parse(capturedOutput);
    assertEquals(output.msg, "Data [ 1, 2, 3 ] and { a: 1 }");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Simple format output - should format messages correctly in simple format", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "simple" });
    logger.info("User %s has %d points", "bob", 200);

    assertMatch(capturedOutput, /User bob has 200 points/);
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Simple format output - should handle JSON formatting in simple format", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "simple" });
    const data = { status: "active", count: 5 };
    logger.warn("Status: %j", data);

    assertMatch(capturedOutput, /Status: {"status":"active","count":5}/);
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Error handling in util.format - should handle objects that throw during toString", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const problematicObj = {
      toString() {
        throw new Error("toString failed");
      },
    };

    // The logger might handle the error gracefully, so let's test the actual output
    logger.info("Object: %s", problematicObj);

    // Check that something was logged (the logger should handle the error)
    const output = JSON.parse(capturedOutput);
    assertEquals(typeof output.msg, "string");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger util.format functionality - Error handling in util.format - should handle circular references with %j", () => {
  let capturedOutput = "";
  const originalLog = console.log;
  console.log = (message) => {
    capturedOutput = message;
  };

  try {
    const logger = new Logger({ format: "json" });
    const circular = { name: "test" };
    circular.self = circular;

    logger.info("Circular: %j", circular);

    const output = JSON.parse(capturedOutput);
    assertMatch(output.msg, /Circular: \[Circular\]/);
  } finally {
    console.log = originalLog;
  }
});
