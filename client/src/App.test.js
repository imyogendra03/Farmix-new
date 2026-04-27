import { getApiErrorMessage } from './services/api';

describe('getApiErrorMessage', () => {
  test('prefers backend message from response payload', () => {
    const error = {
      response: {
        data: {
          message: 'Backend validation failed'
        }
      }
    };

    expect(getApiErrorMessage(error)).toBe('Backend validation failed');
  });

  test('falls back to native error message', () => {
    const error = new Error('Network error');

    expect(getApiErrorMessage(error)).toBe('Network error');
  });

  test('uses provided fallback when no message exists', () => {
    expect(getApiErrorMessage({}, 'Custom fallback')).toBe('Custom fallback');
  });
});
