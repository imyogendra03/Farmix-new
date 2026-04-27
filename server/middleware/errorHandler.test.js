jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const logger = require('../utils/logger');
const { normalizeError, errorHandler, notFoundHandler } = require('./errorHandler');

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('normalizes mongoose validation errors', () => {
    const normalized = normalizeError({
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is invalid' },
        password: { message: 'Password is required' }
      }
    });

    expect(normalized).toEqual({
      statusCode: 400,
      message: 'Email is invalid, Password is required'
    });
  });

  test('normalizes duplicate key errors', () => {
    const normalized = normalizeError({
      code: 11000,
      keyValue: { email: 'test@example.com' }
    });

    expect(normalized).toEqual({
      statusCode: 409,
      message: 'email already exists'
    });
  });

  test('responds with structured error payload', () => {
    const req = {
      id: 'req-1',
      method: 'GET',
      originalUrl: '/api/test',
      headers: {}
    };
    const res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(new Error('Boom'), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Boom',
        requestId: 'req-1'
      })
    );
    expect(logger.error).toHaveBeenCalled();
  });

  test('creates 404 error for unknown route', () => {
    const next = jest.fn();
    notFoundHandler({ originalUrl: '/missing' }, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Route not found: /missing',
        statusCode: 404
      })
    );
  });
});
