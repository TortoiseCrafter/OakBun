import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiResponse<T = unknown> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: unknown;
    meta?: {
        page?: number;
        limit?: number;
        total?: number
    }
}

const Response = {
    error: (
        c: Context,
        message: string = 'Error',
        status: ContentfulStatusCode = 400,
        errorDetails?: unknown
    ) => {
        return c.json({
            data: null,
            error: errorDetails,
            message,
            success: false
        } satisfies ApiResponse, status)
    },
    success: <T>(
        c: Context,
        data: T,
        message: string = 'Success',
        status: ContentfulStatusCode = 200,
        meta?: ApiResponse['meta']
    ) => {
        return c.json({
            data,
            message,
            meta,
            success: true
        } satisfies ApiResponse<T>, status)
    }
}

export { Response }