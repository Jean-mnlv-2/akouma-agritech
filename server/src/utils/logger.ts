type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getEnvLogLevel(): LogLevel {
  const fromEnv = (process.env.LOG_LEVEL || '').toLowerCase() as LogLevel;
  if (fromEnv && levelWeight[fromEnv] != null) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }
  return 'debug';
}

const currentLevel = getEnvLogLevel();

function log(level: LogLevel, message: string, meta?: unknown) {
  if (levelWeight[level] < levelWeight[currentLevel]) {
    return;
  }
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    if (level === 'debug') {
      console.log(prefix, message, meta);
      return;
    }
    if (level === 'info') {
      console.info(prefix, message, meta);
      return;
    }
    if (level === 'warn') {
      console.warn(prefix, message, meta);
      return;
    }
    console.error(prefix, message, meta);
    return;
  }
  if (level === 'debug') {
    console.log(prefix, message);
    return;
  }
  if (level === 'info') {
    console.info(prefix, message);
    return;
  }
  if (level === 'warn') {
    console.warn(prefix, message);
    return;
  }
  console.error(prefix, message);
}

export const logger = {
  debug(message: string, meta?: unknown) {
    log('debug', message, meta);
  },
  info(message: string, meta?: unknown) {
    log('info', message, meta);
  },
  warn(message: string, meta?: unknown) {
    log('warn', message, meta);
  },
  error(message: string, meta?: unknown) {
    log('error', message, meta);
  },
};

