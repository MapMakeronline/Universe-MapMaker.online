/**
 * Development-aware Logger
 *
 * Automatycznie wyłącza logi w production, zachowując tylko error logs.
 * Używaj zamiast bezpośrednio console.log/warn/debug.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger levels configuration
 */
type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

interface LoggerConfig {
  enabled: boolean;
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: isDevelopment,
      prefix: '',
      timestamp: false,
      ...config,
    };
  }

  private formatMessage(level: LogLevel, args: any[]): any[] {
    const parts: any[] = [];

    if (this.config.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    return [...parts, ...args];
  }

  /**
   * General log (tylko development)
   */
  log(...args: any[]) {
    if (this.config.enabled) {
      console.log(...this.formatMessage('log', args));
    }
  }

  /**
   * Warning log (tylko development)
   */
  warn(...args: any[]) {
    if (this.config.enabled) {
      console.warn(...this.formatMessage('warn', args));
    }
  }

  /**
   * Error log (ZAWSZE, nawet w production)
   */
  error(...args: any[]) {
    console.error(...this.formatMessage('error', args));
  }

  /**
   * Debug log (tylko development)
   */
  debug(...args: any[]) {
    if (this.config.enabled) {
      console.debug(...this.formatMessage('debug', args));
    }
  }

  /**
   * Info log (tylko development)
   */
  info(...args: any[]) {
    if (this.config.enabled) {
      console.info(...this.formatMessage('info', args));
    }
  }

  /**
   * Tworzy nową instancję logger'a z prefiksem
   */
  createScoped(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Group logs (tylko development)
   */
  group(label: string, callback: () => void) {
    if (this.config.enabled) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Table log (tylko development)
   */
  table(data: any) {
    if (this.config.enabled) {
      console.table(data);
    }
  }

  /**
   * Time measurement (tylko development)
   */
  time(label: string) {
    if (this.config.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.config.enabled) {
      console.timeEnd(label);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Domain-specific loggers
 */
export const mapLogger = new Logger({ prefix: '🗺️ MAP' });
export const reduxLogger = new Logger({ prefix: '🔴 REDUX' });
export const apiLogger = new Logger({ prefix: '🌐 API' });
export const drawLogger = new Logger({ prefix: '✏️ DRAW' });
export const layerLogger = new Logger({ prefix: '📊 LAYER' });

/**
 * Performance logger with timing
 */
export const perfLogger = new Logger({ prefix: '⚡ PERF', timestamp: true });

/**
 * Helper function for component lifecycle logging
 */
export const logComponentLifecycle = (componentName: string) => {
  const componentLogger = new Logger({ prefix: `🔷 ${componentName}` });

  return {
    mount: () => componentLogger.log('Component mounted'),
    unmount: () => componentLogger.log('Component unmounted'),
    update: (props?: any) => componentLogger.log('Component updated', props),
    render: () => componentLogger.log('Component rendering'),
    error: (error: Error) => componentLogger.error('Component error:', error),
  };
};

export default logger;
