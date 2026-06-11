import { createLogger, format, transports, type Logger } from 'winston';

export const buildLogger = (): Logger => {
  return createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
  });
};
