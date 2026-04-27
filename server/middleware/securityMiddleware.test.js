const {
  createCorsOptions,
  sanitizeRequest,
  verifyTrustedOrigin,
  __test__
} = require('./securityMiddleware');

describe('securityMiddleware', () => {
  describe('sanitizeInput', () => {
    test('removes dangerous keys and trims strings', () => {
      const input = {
        name: '  Farmix  ',
        '$where': 'bad',
        profile: {
          city: '  Lucknow ',
          'nested.value': 'drop'
        },
        list: ['  one  ', { constructor: 'blocked', valid: '  yes ' }]
      };

      expect(__test__.sanitizeInput(input)).toEqual({
        name: 'Farmix',
        profile: {
          city: 'Lucknow'
        },
        list: ['one', { valid: 'yes' }]
      });
    });
  });

  describe('sanitizeRequest', () => {
    test('sanitizes body query and params', () => {
      const req = {
        body: { name: ' Test ', '$gt': 1 },
        query: { search: ' wheat ' },
        params: { id: ' 123 ' }
      };

      sanitizeRequest(req, {}, jest.fn());

      expect(req.body).toEqual({ name: 'Test' });
      expect(req.query).toEqual({ search: 'wheat' });
      expect(req.params).toEqual({ id: '123' });
    });
  });

  describe('createCorsOptions', () => {
    const previousClientUrl = process.env.CLIENT_URL;

    afterEach(() => {
      process.env.CLIENT_URL = previousClientUrl;
      delete process.env.CLIENT_URLS;
      delete process.env.ALLOWED_ORIGINS;
    });

    test('allows configured origin', () => {
      process.env.CLIENT_URL = 'http://localhost:3000';
      const options = createCorsOptions();
      const callback = jest.fn();

      options.origin('http://localhost:3000', callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    test('rejects unexpected origin', () => {
      process.env.CLIENT_URL = 'http://localhost:3000';
      const options = createCorsOptions();
      const callback = jest.fn();

      options.origin('http://malicious.test', callback);

      const [error] = callback.mock.calls[0];
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('verifyTrustedOrigin', () => {
    const previousClientUrl = process.env.CLIENT_URL;

    afterEach(() => {
      process.env.CLIENT_URL = previousClientUrl;
      delete process.env.CLIENT_URLS;
      delete process.env.ALLOWED_ORIGINS;
    });

    test('allows state changing request from trusted origin', () => {
      process.env.CLIENT_URL = 'http://localhost:3000';
      const req = {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' }
      };
      const res = { status: jest.fn() };
      const next = jest.fn();

      verifyTrustedOrigin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('blocks state changing request from untrusted origin', () => {
      process.env.CLIENT_URL = 'http://localhost:3000';
      const req = {
        method: 'DELETE',
        headers: { origin: 'http://evil.test' }
      };
      const res = { status: jest.fn() };
      const next = jest.fn();

      verifyTrustedOrigin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Cross-site request blocked');
    });
  });
});
