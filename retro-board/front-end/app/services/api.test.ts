import { authApi, fetchApi } from './api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchApi', () => {
    it('should return data for successful requests', async () => {
      const mockData = { token: 'testToken', username: 'testuser' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await fetchApi('/test');
      expect(result).toEqual(mockData);
    });

    it('should throw error for 409 status with message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ message: 'Username already exists' }),
      } as Response);

      await expect(fetchApi('/test')).rejects.toThrow('Username already exists');
    });

    it('should throw error for 409 status without message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(fetchApi('/test')).rejects.toThrow('Username or email already exists');
    });

    it('should throw error for 401 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(fetchApi('/test')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for 400 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(fetchApi('/test')).rejects.toThrow('Invalid input data');
    });

    it('should throw error for other status codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      } as Response);

      await expect(fetchApi('/test')).rejects.toThrow('API error: 500 Internal Server Error');
    });
  });

  describe('authApi', () => {
    describe('register', () => {
      it('should call register endpoint with correct data', async () => {
        const mockResponse = { token: 'testToken', username: 'testuser' };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const userData = {
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com',
        };

        const result = await authApi.register(userData);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('login', () => {
      it('should call login endpoint with correct data', async () => {
        const mockResponse = { token: 'testToken', username: 'testuser' };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const credentials = {
          username: 'testuser',
          password: 'password123',
        };

        const result = await authApi.login(credentials);

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
