export const isBrowser = typeof window !== 'undefined';

export const debugEnabled = (() => {
  // Enable debug in dev builds or when localStorage flag is set
  try {
    if (process.env.NODE_ENV !== 'production') return true;
    if (isBrowser && window.localStorage?.getItem('bt_debug') === '1') return true;
  } catch (e) {
    // ignore
  }
  return false;
})();

export const logger = {
  debug: (...args: any[]) => {
    if (debugEnabled) console.debug(...args);
  },
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

export default logger;
