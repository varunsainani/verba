import { NextFunction, Request, Response } from "express";

// Application error carrying an i18n message key resolved at the error handler
// with the request locale, so clients always get a localized message.
export class AppError extends Error {
  statusCode: number;
  messageKey: string;
  params?: Record<string, string | number>;

  constructor(
    statusCode: number,
    messageKey: string,
    params?: Record<string, string | number>,
  ) {
    super(messageKey);
    this.statusCode = statusCode;
    this.messageKey = messageKey;
    this.params = params;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
