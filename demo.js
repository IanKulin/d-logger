import Logger from './lib/logger.ts';
const logger = new Logger({ level: 'debug' });

logger.error('Unable to fetch student');
logger.info('Hello from logger');
logger.warn('This is a warning');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
logger.level('error');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info' or higher

const simple_logger = new Logger({ level: 'debug', format: 'simple' });

simple_logger.error('Unable to fetch student');
simple_logger.info('Hello from logger');
simple_logger.warn('This is a warning');
simple_logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
simple_logger.level('error');
simple_logger.debug('This is a debug message'); // This won't be logged if level is set to 'info' or higher

const longLogger = new Logger({ time: 'long', format: 'simple' });
const shortLogger = new Logger({ time: 'short', format: 'simple' });

longLogger.info('This uses long time format');
shortLogger.info('This uses short time format');

// Demonstrate callerLevel functionality
console.log('\n=== Caller Level Demo ===');

// Default callerLevel is 'warn' - only errors and warnings include caller info
const defaultCallerLogger = new Logger({ format: 'simple' });
console.log(
  'Default callerLevel (warn) - only errors and warnings show caller info:'
);
defaultCallerLogger.error('Error with caller info');
defaultCallerLogger.warn('Warning with caller info');
defaultCallerLogger.info('Info without caller info');
defaultCallerLogger.debug('Debug without caller info');

// Set callerLevel to 'error' - only errors include caller info
const errorOnlyLogger = new Logger({ format: 'simple', callerLevel: 'error' });
console.log('\nCallerLevel set to error - only errors show caller info:');
errorOnlyLogger.error('Error with caller info');
errorOnlyLogger.warn('Warning without caller info');
errorOnlyLogger.info('Info without caller info');

// Set callerLevel to 'debug' - all levels include caller info
const allLevelsLogger = new Logger({ format: 'simple', callerLevel: 'debug' });
console.log('\nCallerLevel set to debug - all levels show caller info:');
allLevelsLogger.error('Error with caller info');
allLevelsLogger.warn('Warning with caller info');
allLevelsLogger.info('Info with caller info');
allLevelsLogger.debug('Debug with caller info');

// Set callerLevel to 'silent' - no levels include caller info
const noneLogger = new Logger({ format: 'simple', callerLevel: 'silent' });
console.log('\nCallerLevel set to silent - no levels show caller info:');
noneLogger.error('Error without caller info');
noneLogger.warn('Warning without caller info');
noneLogger.info('Info without caller info');

// Demonstrate format string functionality (util.format style)
console.log('\n=== Format String Demo ===');

const formatLogger = new Logger({ format: 'simple', level: 'debug' });
console.log('Format strings with various specifiers:');

// String formatting (%s)
formatLogger.info('User %s logged in successfully', 'john_doe');

// Number formatting (%d, %i, %f)
formatLogger.warn('Database has %d connections, CPU usage: %f%%', 25, 84.3);
formatLogger.debug('Processing item %i of %d', 42, 100);

// JSON formatting (%j)
const user = { name: 'Alice', role: 'admin', active: true };
const config = { timeout: 5000, retries: 3 };
formatLogger.info('User data: %j, Config: %j', user, config);

// Mixed formatting
formatLogger.error('API call failed for user %s (ID: %d) with config %j', 'bob', 1234, config);

// Multiple arguments without format specifiers
formatLogger.warn('System alert:', 'High memory usage detected', { usage: '89%', threshold: '80%' });

// Literal percentage with %%
formatLogger.info('Upload progress: 50%% complete');

// Edge cases
formatLogger.debug('Values: %s, %s, %d', null, undefined, null);

console.log('\nJSON format with same messages:');
const jsonFormatLogger = new Logger({ format: 'json' });
jsonFormatLogger.info('User %s logged in with %d failed attempts', 'alice', 2);
jsonFormatLogger.warn('Config loaded: %j', { env: 'production', debug: false });
