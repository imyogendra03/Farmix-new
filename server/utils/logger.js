const isProduction = process.env.NODE_ENV === 'production';

const formatMeta = (meta = {}) => {
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) {
    return '';
  }

  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
};

const writeLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${formatMeta(meta)}`;

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (!isProduction || level !== 'debug') {
    console.log(line);
  }
};

const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta)
};

module.exports = logger;
