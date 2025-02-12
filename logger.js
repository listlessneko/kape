const DEBUG_MODE = true;

export const logger = {
  debug: (...args) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    console.log(...args);
  },
  log: (...args) => {
    console.log(...args);
  }
}
