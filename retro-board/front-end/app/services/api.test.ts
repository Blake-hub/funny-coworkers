import { authApi, fetchApi, userApi, teamApi, boardApi, columnApi, cardApi, API_BASE_URL } from './api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('fetchApi', () => {
    it('should return data for successful requests', async () => {
      const mockData = { token: 'testToken', username: 'testuser' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchApi('/test');
      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await fetchApi('/test');
      expect(result).toEqual({});
    });

    it('should handle 401 with Authorization header', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      await expect(fetchApi('/test', {
        headers: { 'Authorization': 'Bearer test-token' }
      })).rejects.toThrow('Invalid credentials');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('username');
    });

    it('should throw error for 409 status with message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ message: 'Username already exists' }),
      });

      await expect(fetchApi('/test')).rejects.toThrow('Username already exists');
    });

    it('should throw error for 409 status without message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({}),
      });

      await expect(fetchApi('/test')).rejects.toThrow('Username or email already exists');
    });

    it('should throw error for 401 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      await expect(fetchApi('/test')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for 400 status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
      });

      await expect(fetchApi('/test')).rejects.toThrow('Invalid input data');
    });

    it('should throw error for other status codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(fetchApi('/test')).rejects.toThrow('API error: 500 Internal Server Error');
    });

    it('should handle error when parsing response JSON fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.reject(new Error('JSON parse error')),
      });

      await expect(fetchApi('/test')).rejects.toThrow('Username or email already exists');
    });
  });

  describe('authApi', () => {
    describe('register', () => {
      it('should call register endpoint with correct data', async () => {
        const mockResponse = { token: 'testToken', username: 'testuser' };
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

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
        });

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

  describe('userApi', () => {
    it('should get profile with auth header', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = { id: 1, username: 'test' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await userApi.getProfile();
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/profile', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should search users', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, username: 'test' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await userApi.searchUsers('test');
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/users/search?query=test', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('teamApi', () => {
    it('should get all teams', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, name: 'Team 1' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await teamApi.getAllTeams();
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create team', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const teamData = { name: 'Test Team', ownerId: 1 };
      const mockResponse = { id: 1, ...teamData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await teamApi.createTeam(teamData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete team', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue({ ok: true, status: 204 });
      
      await teamApi.deleteTeam(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams/1', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
    });

    it('should update team', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const teamData = { name: 'Updated Team' };
      const mockResponse = { id: 1, ...teamData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await teamApi.updateTeam(1, teamData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams/1', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get team by id', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = { id: 1, name: 'Team 1' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await teamApi.getTeamById(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get team members', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, username: 'user1' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await teamApi.getTeamMembers(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/teams/1/members', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('boardApi', () => {
    it('should get all boards', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, name: 'Board 1' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await boardApi.getAllBoards(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/boards/team/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create board', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const boardData = { name: 'Test Board', description: 'desc', teamId: 1 };
      const mockResponse = { id: 1, ...boardData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await boardApi.createBoard(boardData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/boards', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete board', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue({ ok: true, status: 204 });
      
      await boardApi.deleteBoard(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/boards/1', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
    });

    it('should update board', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const boardData = { name: 'Updated Board', description: 'new desc' };
      const mockResponse = { id: 1, ...boardData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await boardApi.updateBoard(1, boardData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/boards/1', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get board by id', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = { id: 1, name: 'Board 1' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await boardApi.getBoardById(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/boards/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('columnApi', () => {
    it('should get all columns', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, name: 'Column 1' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await columnApi.getAllColumns(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/columns/board/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create column', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const columnData = { name: 'Test Column', boardId: 1, position: 0 };
      const mockResponse = { id: 1, ...columnData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await columnApi.createColumn(columnData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/columns', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(columnData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete column', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue({ ok: true, status: 204 });
      
      await columnApi.deleteColumn(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/columns/1', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
    });

    it('should update column', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const columnData = { name: 'Updated Column', position: 1 };
      const mockResponse = { id: 1, ...columnData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await columnApi.updateColumn(1, columnData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/columns/1', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(columnData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get column by id', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = { id: 1, name: 'Column 1' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await columnApi.getColumnById(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/columns/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cardApi', () => {
    it('should get all cards', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = [{ id: 1, title: 'Card 1' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await cardApi.getAllCards(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/cards/column/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create card', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const cardData = { title: 'Test Card', description: 'desc', columnId: 1, position: 0 };
      const mockResponse = { id: 1, ...cardData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await cardApi.createCard(cardData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/cards', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should delete card', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue({ ok: true, status: 204 });
      
      await cardApi.deleteCard(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/cards/1', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
    });

    it('should update card', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const cardData = { title: 'Updated Card', description: 'new desc', columnId: 1, position: 1 };
      const mockResponse = { id: 1, ...cardData };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await cardApi.updateCard(1, cardData);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/cards/1', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get card by id', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const mockResponse = { id: 1, title: 'Card 1' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResponse) });
      
      const result = await cardApi.getCardById(1);
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8081/api/cards/1', {
        headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('API_BASE_URL', () => {
    it('should export API_BASE_URL', () => {
      expect(API_BASE_URL).toBeDefined();
    });
  });
});
