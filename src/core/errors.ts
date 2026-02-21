
export class AppError extends Error {
    constructor(message: string, public code: string = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 'FORBIDDEN');
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation Error') {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
