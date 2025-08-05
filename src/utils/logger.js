/**
 * Logger utility to control console logging throughout the application.
 * Set window.DEBUG_MODE to true in index.js or browser console to enable debug logs.
 */

const isDebugMode = () => {
  return window.DEBUG_MODE === true;
};

/**
 * Logs a message to the console if debug mode is enabled
 * @param {*} args - The arguments to log
 */
export const debugLog = (...args) => {
  if (isDebugMode()) {
    console.log(...args);
  }
};

/**
 * Logs a warning to the console if debug mode is enabled
 * @param {*} args - The arguments to log
 */
export const debugWarn = (...args) => {
  if (isDebugMode()) {
    console.warn(...args);
  }
};

/**
 * Logs an error to the console (always enabled)
 * @param {*} args - The arguments to log
 */
export const errorLog = (...args) => {
  console.error(...args);
};

/**
 * Disables all console output in the application (except errors)
 * Useful for production environments
 */
export const disableConsoleOutput = () => {
  window.DEBUG_MODE = false;
  
  // Save original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn
  };
  
  // Override with no-op functions (keep error for critical issues)
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  
  return () => {
    // Return a function to restore console
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
  };
};

/**
 * Utility to log performance metrics 
 * @param {string} label - The label for the operation
 * @param {function} fn - The function to measure
 * @returns The result of the function
 */
export const measurePerformance = async (label, fn) => {
  if (!isDebugMode()) {
    return await fn();
  }
  
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  debugLog(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

export default {
  debugLog,
  debugWarn,
  errorLog,
  disableConsoleOutput,
  measurePerformance
};
