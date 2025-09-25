// Shared test utilities for logger tests

// Mock console.log to capture output
let capturedLogs = [];
let capturedErrors = [];
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalIsTTY = Deno.stdout.isTerminal();

export function mockConsole() {
  console.log = (...args) => {
    capturedLogs.push(args.join(" "));
  };
}

export function mockConsoleError() {
  console.error = (...args) => {
    capturedErrors.push(args);
  };
}

export function restoreConsole() {
  console.log = originalConsoleLog;
  capturedLogs = [];
}

export function restoreConsoleError() {
  console.error = originalConsoleError;
  capturedErrors = [];
}

export function getCapturedLogs() {
  return capturedLogs;
}

export function getCapturedErrors() {
  return capturedErrors;
}

export function clearCapturedLogs() {
  capturedLogs = [];
}

export function clearCapturedErrors() {
  capturedErrors = [];
}

let mockIsTTY = originalIsTTY;

export function setTTYMode(isTTY) {
  mockIsTTY = isTTY;
  // Mock Deno.stdout.isTerminal for testing
  Deno.stdout.isTerminal = () => mockIsTTY;
}

export function restoreTTY() {
  mockIsTTY = originalIsTTY;
  // Restore original Deno.stdout.isTerminal
  Deno.stdout.isTerminal = () => originalIsTTY;
}

// Helper to setup both console mocks
export function setupMocks() {
  mockConsole();
  mockConsoleError();
}

// Helper to restore both console mocks
export function restoreMocks() {
  restoreConsole();
  restoreConsoleError();
}

// Helper to get parsed JSON from first captured log
export function getFirstLogAsJSON() {
  if (capturedLogs.length === 0) {
    throw new Error("No logs captured");
  }
  return JSON.parse(capturedLogs[0]);
}
