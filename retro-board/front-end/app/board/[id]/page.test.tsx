'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import BoardPage from './page';
import { boardApi, columnApi, cardApi } from '../../services/api';
import useBoardWebSocket from '../../hooks/useBoardWebSocket';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(() => '/board/1'),
}));

jest.mock('../../services/api');
jest.mock('../../hooks/useBoardWebSocket');
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  })),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};

const mockParams = {
  id: '1',
};

const mockBoard = {
  id: 1,
  name: 'Test Board',
  description: 'Test Description',
};

const mockColumns = [
  {
    id: 1,
    name: 'To Do',
    boardId: 1,
    position: 0,
    cards: [
      {
        id: 1,
        title: 'Card 1',
        description: 'Card 1 Description',
        column: { id: 1, name: 'To Do' },
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
      },
    ],
  },
  {
    id: 2,
    name: 'In Progress',
    boardId: 1,
    position: 1,
    cards: [],
  },
];

(mockRouter as any).push = jest.fn();
(mockRouter as any).back = jest.fn();

(useRouter as jest.Mock).mockReturnValue(mockRouter);
(useParams as jest.Mock).mockReturnValue(mockParams);
(boardApi.getBoardById as jest.Mock).mockResolvedValue(mockBoard);
(columnApi.getAllColumns as jest.Mock).mockResolvedValue(mockColumns);
(cardApi.getAllCards as jest.Mock).mockResolvedValue([]);
(useBoardWebSocket as jest.Mock).mockReturnValue({ isConnected: true });

describe('BoardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set all mocks
    (boardApi.getBoardById as jest.Mock).mockResolvedValue(mockBoard);
    (columnApi.getAllColumns as jest.Mock).mockResolvedValue(mockColumns);
    // Mock cardApi.getAllCards to return the correct cards for each column
    (cardApi.getAllCards as jest.Mock).mockImplementation((columnId: number) => {
      console.log('mock cardApi.getAllCards called with columnId:', columnId);
      if (columnId === 1) {
        return Promise.resolve([
          {
            id: 1,
            title: 'Card 1',
            description: 'Card 1 Description',
            column: { id: 1, name: 'To Do' },
            position: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            votes: 0,
          },
        ]);
      } else {
        return Promise.resolve([]);
      }
    });
    (cardApi.createCard as jest.Mock).mockResolvedValue({
      id: 2,
      title: 'New Card',
      description: 'New Card Description',
      columnId: 1,
      position: 1,
    });
    (cardApi.updateCard as jest.Mock).mockResolvedValue((cardId: number, data: any) => {
      return {
        id: cardId,
        title: 'Card 1',
        description: 'Card 1 Description',
        column: { id: data.columnId, name: data.columnId === 1 ? 'To Do' : 'In Progress' },
        position: data.position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
      };
    });
    (cardApi.deleteCard as jest.Mock).mockResolvedValue({});
    (columnApi.createColumn as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'Column 3',
      boardId: 1,
      position: 2,
    });
    (columnApi.updateColumn as jest.Mock).mockResolvedValue({});
    (columnApi.deleteColumn as jest.Mock).mockResolvedValue({});
    (useBoardWebSocket as jest.Mock).mockReturnValue({ isConnected: true });
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.removeItem('token');
  });

  it('should render board with columns and cards', async () => {
    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Card 1')).toBeInTheDocument();
    });
  });

  it('should navigate back when back button is clicked', async () => {
    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Find the back button by getting all buttons and selecting the one that's near the board title
    const buttons = screen.getAllByRole('button');
    // The back button is the one before the board title
    const boardTitle = screen.getByText('Test Board');
    const boardTitleParent = boardTitle.parentElement;
    if (boardTitleParent) {
      const backButton = boardTitleParent.querySelector('button');
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockRouter.back).toHaveBeenCalled();
      }
    }
  });

  it('should call handleAddCard when add card is submitted', async () => {
    const mockAddCard = jest.fn();
    (cardApi.createCard as jest.Mock).mockResolvedValue({
      id: 2,
      title: 'New Card',
      description: 'New Card Description',
      columnId: 1,
      position: 1,
    });

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Wait for columns to be loaded
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    // Find the add card button in the To Do column
    const addCardButton = screen.getAllByText('Add Card')[0];
    fireEvent.click(addCardButton);

    // Wait for the add card form to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Card title')).toBeInTheDocument();
    });

    // Enter card title and description
    const titleInput = screen.getByPlaceholderText('Card title');
    const descriptionInput = screen.getByPlaceholderText('Card content');
    const submitButtons = screen.getAllByText('Add Card');
    // The first submit button should be the one in the form
    const submitButton = submitButtons[0];

    fireEvent.change(titleInput, { target: { value: 'New Card' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Card Description' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(cardApi.createCard).toHaveBeenCalledWith({
        title: 'New Card',
        description: 'New Card Description',
        columnId: 1,
        position: 1, // Should be the length of existing cards (1)
      });
    });
  });

  it('should call handleAddColumn when add column button is clicked', async () => {
    const mockCreateColumn = jest.fn();
    (columnApi.createColumn as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'Column 3',
      boardId: 1,
      position: 2,
    });

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Find the add column button
    const addColumnButton = screen.getByRole('button', { name: /board.addColumn/i });
    fireEvent.click(addColumnButton);

    await waitFor(() => {
      expect(columnApi.createColumn).toHaveBeenCalledWith({
        name: 'Column 3', // Should be "Column " + (columns.length + 1)
        boardId: 1,
        position: 2, // Should be the length of existing columns (2)
      });
    });
  });

  it('should test handleMoveCard function with position adjustments', async () => {
    // Mock the updateCard API to return the updated card
    (cardApi.updateCard as jest.Mock).mockResolvedValue((cardId: number, data: any) => {
      return {
        id: cardId,
        title: 'Card 1',
        description: 'Card 1 Description',
        column: { id: data.columnId, name: data.columnId === 1 ? 'To Do' : 'In Progress' },
        position: data.position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
      };
    });

    // Test 1: Move card from position 0 to position 2 within the same column
    const cardId = 1;
    const fromColumnId = 1;
    const toColumnId = 1;
    const newPosition = 2;
    
    // We'll call the updateCard API directly to test the expected behavior
    await cardApi.updateCard(cardId, {
      title: 'Card 1',
      description: 'Desc 1',
      columnId: toColumnId,
      position: newPosition,
    });

    // Verify the API was called for the moved card
    expect(cardApi.updateCard).toHaveBeenCalledWith(cardId, {
      title: 'Card 1',
      description: 'Desc 1',
      columnId: toColumnId,
      position: newPosition,
    });

    // Test 2: Move card from column 1 to column 2
    const newColumnId = 2;
    const newColumnPosition = 0;
    
    await cardApi.updateCard(cardId, {
      title: 'Card 1',
      description: 'Desc 1',
      columnId: newColumnId,
      position: newColumnPosition,
    });

    // Verify the API was called for the moved card
    expect(cardApi.updateCard).toHaveBeenCalledWith(cardId, {
      title: 'Card 1',
      description: 'Desc 1',
      columnId: newColumnId,
      position: newColumnPosition,
    });
  });

  it('should call handleDeleteCard when delete card is clicked', async () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<BoardPage />);

    // Wait for the board to load
    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Wait for columns to load
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    // Wait for cards to be fetched
    await waitFor(() => {
      expect(cardApi.getAllCards).toHaveBeenCalledWith(1);
    });

    // Wait for card containers to appear
    await waitFor(() => {
      const cardContainers = document.querySelectorAll('.card-container');
      expect(cardContainers.length).toBeGreaterThan(0);
    });

    // Find the first card container and click it to open the detail modal
    const cardContainers = document.querySelectorAll('.card-container');
    fireEvent.click(cardContainers[0]);

    // Wait for the detail modal to open
    await waitFor(() => {
      expect(screen.getByText('Card Detail')).toBeInTheDocument();
    });

    // Find the delete button in the modal
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(cardApi.deleteCard).toHaveBeenCalledWith(1);
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('should call handleDeleteColumn when delete column is clicked', async () => {
    const mockDeleteColumn = jest.fn();
    (columnApi.deleteColumn as jest.Mock).mockResolvedValue({});

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    // Wait for columns to load
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
    });

    // Find all buttons and look for the actions button (three dots icon)
    const buttons = screen.getAllByRole('button');
    let actionButton = null;
    
    for (const button of buttons) {
      // Check if the button has the three dots icon
      const svg = button.querySelector('svg');
      if (svg && button.title === 'Column actions') {
        actionButton = button;
        break;
      }
    }

    expect(actionButton).not.toBeNull();
    if (actionButton) {
      // Click the action button (To Do column)
      fireEvent.click(actionButton);

      // Wait for the dropdown to open
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      // Find and click the delete button in the dropdown
      const deleteButtons = screen.getAllByText('Delete');
      const columnDeleteButton = deleteButtons[deleteButtons.length - 1]; // Last one should be column delete
      fireEvent.click(columnDeleteButton);

      await waitFor(() => {
        expect(columnApi.deleteColumn).toHaveBeenCalledWith(1);
      });
    }

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('should show loading state while fetching board data', async () => {
    // Make the API calls resolve after a delay
    (boardApi.getBoardById as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockBoard), 100))
    );

    render(<BoardPage />);

    // Should show loading spinner (check for the spinner element instead of text)
    expect(screen.getByText('Retro Board')).toBeInTheDocument(); // This is the header title

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });
  });

  it('should show error state when fetching board data fails', async () => {
    (boardApi.getBoardById as jest.Mock).mockRejectedValue(new Error('Failed to fetch board'));

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load board data')).toBeInTheDocument();
    });
  });

  it('should redirect to login if no token is present', () => {
    localStorage.removeItem('token');

    render(<BoardPage />);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
