import { fetchApi, UserResponse } from './api';

// ==================== Types ====================

export type BoardStatus = 'ACTIVE' | 'ENDED';
export type ParticipantRole = 'OWNER' | 'PARTICIPANT';
export type BoardView = 'owned' | 'joined' | 'all';

export interface ParticipantDTO {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface BoardDTO {
  id: number;
  title: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  teamId?: number;
  teamName?: string;
  status: BoardStatus;
  participantCount?: number;
  cardCount?: number;
  currentUserRole?: string;
  participants?: ParticipantDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ColumnDTO {
  id: number;
  name: string;
  boardId: number;
  position: number;
  cardCount?: number;
}

export interface CardDTO {
  id: number;
  title: string;
  description?: string;
  columnId: number;
  creatorId?: number;
  position: number;
  votes: number;
  votedByCurrentUser: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Request Types ====================

export interface CreateBoardRequest {
  title: string;
  description?: string;
  teamId?: number;
  participantUserIds?: number[];
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
}

export interface CreateColumnRequest {
  name: string;
  boardId: number;
}

export interface UpdateColumnRequest {
  name?: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  columnId: number;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  columnId?: number;
  position?: number;
}

export interface InviteRequest {
  userIds: number[];
}

// ==================== WebSocket Event ====================

export interface BoardUpdateEvent {
  type: string;
  boardId: number;
  data: unknown;
  timestamp: string;
}

// ==================== API ====================

export const retroApi = {
  // ---------- Boards ----------
  createBoard: async (req: CreateBoardRequest): Promise<BoardDTO> => {
    return fetchApi<BoardDTO>('/retro/boards', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  listBoards: async (view: BoardView = 'joined'): Promise<BoardDTO[]> => {
    return fetchApi<BoardDTO[]>(`/retro/boards?view=${view}`);
  },

  getBoardById: async (id: number): Promise<BoardDTO> => {
    return fetchApi<BoardDTO>(`/retro/boards/${id}`);
  },

  updateBoard: async (id: number, req: UpdateBoardRequest): Promise<BoardDTO> => {
    return fetchApi<BoardDTO>(`/retro/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  deleteBoard: async (id: number): Promise<void> => {
    return fetchApi<void>(`/retro/boards/${id}`, {
      method: 'DELETE',
    });
  },

  endBoard: async (id: number): Promise<void> => {
    return fetchApi<void>(`/retro/boards/${id}/end`, {
      method: 'POST',
    });
  },

  inviteParticipants: async (id: number, req: InviteRequest): Promise<void> => {
    return fetchApi<void>(`/retro/boards/${id}/participants`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  removeParticipant: async (id: number, userId: number): Promise<void> => {
    return fetchApi<void>(`/retro/boards/${id}/participants/${userId}`, {
      method: 'DELETE',
    });
  },

  // ---------- Columns ----------
  createColumn: async (req: CreateColumnRequest): Promise<ColumnDTO> => {
    return fetchApi<ColumnDTO>('/retro/columns', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getColumnsByBoard: async (boardId: number): Promise<ColumnDTO[]> => {
    return fetchApi<ColumnDTO[]>(`/retro/columns?boardId=${boardId}`);
  },

  updateColumn: async (id: number, req: UpdateColumnRequest): Promise<ColumnDTO> => {
    return fetchApi<ColumnDTO>(`/retro/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  deleteColumn: async (id: number): Promise<void> => {
    return fetchApi<void>(`/retro/columns/${id}`, {
      method: 'DELETE',
    });
  },

  // ---------- Cards ----------
  createCard: async (req: CreateCardRequest): Promise<CardDTO> => {
    return fetchApi<CardDTO>('/retro/cards', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getCardsByColumn: async (columnId: number): Promise<CardDTO[]> => {
    return fetchApi<CardDTO[]>(`/retro/cards?columnId=${columnId}`);
  },

  updateCard: async (id: number, req: UpdateCardRequest): Promise<CardDTO> => {
    return fetchApi<CardDTO>(`/retro/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  deleteCard: async (id: number): Promise<void> => {
    return fetchApi<void>(`/retro/cards/${id}`, {
      method: 'DELETE',
    });
  },

  voteCard: async (id: number): Promise<CardDTO> => {
    return fetchApi<CardDTO>(`/retro/cards/${id}/vote`, {
      method: 'POST',
    });
  },
};

// Re-export UserResponse for convenience in retro pages
export type { UserResponse };
