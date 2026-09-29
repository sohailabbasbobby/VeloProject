import { Response } from 'express';

export class HttpError extends Error {
    public readonly status: number;
    public readonly code: string;

    constructor(status: number, message: string, code = 'REQUEST_ERROR') {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export const badRequest = (msg: string) => new HttpError(400, msg, 'BAD_REQUEST');
export const unauthorized = (msg = 'Unauthorized') => new HttpError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg = 'Forbidden') => new HttpError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Not found') => new HttpError(404, msg, 'NOT_FOUND');
export const conflict = (msg: string) => new HttpError(409, msg, 'CONFLICT');

/** Wraps an async express handler so thrown errors delegate to next(error). */
type AsyncHandler = (req: any, res: Response, next: (err?: any) => void) => Promise<any>;
export const asyncHandler =
    (fn: AsyncHandler) =>
    (req: any, res: Response, next: (err?: any) => void): void => {
        fn(req, res, next).catch(next);
    };

export const ok = <T>(res: Response, data: T, status = 200) =>
    res.status(status).json({ success: true, data });
