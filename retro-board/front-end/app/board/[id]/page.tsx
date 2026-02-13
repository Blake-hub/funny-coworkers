'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HeaderBar from '../../components/layout/HeaderBar';
import Sidebar from '../../components/layout/Sidebar';
import Column from '../../components/board/Column';
import { boardApi, columnApi, cardApi } from '../../services/api';

interface Card {
  id: number;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  column: {
    id: number;
    title: string;
  };
}

interface ColumnType {
  id: number;
  name: string;
  position: number;
  board: {
    id: number;
    name: string;
  };
  cards: Card[];
}

interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  team: {
    id: number;
    name: string;
  };
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch board details and columns
    fetchBoardData();
  }, [router, boardId]);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch board details
      const boardData = await boardApi.getBoardById(parseInt(boardId));
      setBoard(boardData);
      
      // Fetch columns for the board
      const columnsData = await columnApi.getAllColumns(parseInt(boardId));
      
      // For each column, fetch its cards
      const columnsWithCards = await Promise.all(
        columnsData.map(async (column) => {
          const cardsData = await cardApi.getAllCards(column.id);
          return {
            ...column,
            cards: cardsData,
          };
        })
      );
      
      // Sort columns by position
      columnsWithCards.sort((a, b) => a.position - b.position);
      setColumns(columnsWithCards);
    } catch (error) {
      console.error('Error fetching board data:', error);
      setIsError(true);
      setErrorMessage('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (columnId: number, cardData: { title: string; description: string }) => {
    try {
      // Get the column to determine the next position
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      const newPosition = column.cards.length;
      
      // Create the card using the API
      const newCard = await cardApi.createCard({
        title: cardData.title,
        description: cardData.description,
        columnId,
        position: newPosition,
      });
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? { ...column, cards: [...column.cards, newCard] }
            : column
        )
      );
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Failed to add card');
    }
  };

  const handleUpdateCard = async (columnId: number, cardId: number, updatedCard: Partial<Card>) => {
    try {
      // Get the current card
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      const card = column.cards.find(c => c.id === cardId);
      if (!card) return;
      
      // Update the card using the API
      await cardApi.updateCard(cardId, {
        title: updatedCard.title || card.title,
        description: updatedCard.description || card.description,
        columnId,
        position: card.position,
      });
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cards: column.cards.map((card) =>
                  card.id === cardId ? { ...card, ...updatedCard } : card
                ),
              }
            : column
        )
      );
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card');
    }
  };

  const handleDeleteCard = async (columnId: number, cardId: number) => {
    try {
      // Delete the card using the API
      await cardApi.deleteCard(cardId);
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId),
              }
            : column
        )
      );
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card');
    }
  };

  const handleAddColumn = async (title: string) => {
    try {
      // Get the next position
      const newPosition = columns.length;
      
      // Create the column using the API
      const newColumn = await columnApi.createColumn({
        name: title,
        boardId: parseInt(boardId),
        position: newPosition,
      });
      
      // Update the local state
      setColumns((prevColumns) => [...prevColumns, { ...newColumn, cards: [] }]);
    } catch (error) {
      console.error('Error adding column:', error);
      alert('Failed to add column');
    }
  };

  const handleUpdateColumn = async (columnId: number, updatedColumn: Partial<ColumnType>) => {
    try {
      // Get the current column
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      // Update the column using the API
      await columnApi.updateColumn(columnId, {
        name: updatedColumn.name || column.name,
        position: column.position,
      });
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId ? { ...column, ...updatedColumn } : column
        )
      );
    } catch (error) {
      console.error('Error updating column:', error);
      alert('Failed to update column');
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      // Delete the column using the API
      await columnApi.deleteColumn(columnId);
      
      // Update the local state
      setColumns((prevColumns) => prevColumns.filter((column) => column.id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Failed to delete column');
    }
  };

  const handleMoveCard = async (fromColumnId: number, toColumnId: number, cardId: number, dropIndex: number | null = null) => {
    try {
      // Get the card
      const fromColumn = columns.find(col => col.id === fromColumnId);
      if (!fromColumn) return;
      
      const card = fromColumn.cards.find(c => c.id === cardId);
      if (!card) return;
      
      // Determine the new position
      let newPosition = dropIndex || 0;
      
      // Update the card using the API
      await cardApi.updateCard(cardId, {
        title: card.title,
        description: card.description,
        columnId: toColumnId,
        position: newPosition,
      });
      
      // Update the local state
      setColumns((prevColumns) => {
        // Remove card from source column
        const columnsWithCardRemoved = prevColumns.map((column) =>
          column.id === fromColumnId
            ? {
                ...column,
                cards: column.cards.filter((c) => c.id !== cardId),
              }
            : column
        );
        
        // Add card to target column
                return columnsWithCardRemoved.map((column) =>
                  column.id === toColumnId
                    ? {
                        ...column,
                        cards: [...column.cards, { ...card, column: { id: toColumnId, title: column.name } }],
                      }
                    : column
                );
      });
    } catch (error) {
      console.error('Error moving card:', error);
      alert('Failed to move card');
    }
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex flex-col">
        <HeaderBar onMobileMenuClick={handleMobileSidebarToggle} />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex flex-col">
        <HeaderBar onMobileMenuClick={handleMobileSidebarToggle} />
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-neutral-400 mb-6">{errorMessage || 'Failed to load board'}</p>
            <button
              onClick={fetchBoardData}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex flex-col">
      <HeaderBar onMobileMenuClick={handleMobileSidebarToggle} />
      <div className="flex flex-1 overflow-hidden">
        {isMobileSidebarOpen && (
          <Sidebar 
            isMobile={true}
            onMobileToggle={handleMobileSidebarToggle}
          />
        )}
        <Sidebar 
          isMobile={false}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <button 
                className="p-2 rounded-lg hover:bg-neutral-200 transition-smooth"
                onClick={() => router.back()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-medium">{board.name}</h1>
            </div>
            <p className="text-neutral-400">{board.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <button className="btn-outline text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Board Settings
            </button>
            <button className="btn-outline text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Members
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onAddCard={handleAddCard}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                onMoveCard={handleMoveCard}
              />
            ))}
            <button 
              onClick={() => {
                // Create new column with default values
                const newColumnTitle = `Column ${columns.length + 1}`;
                handleAddColumn(newColumnTitle);
              }}
              className="min-w-[300px] bg-white/50 dark:bg-gray-700/50 border-2 border-dashed border-neutral-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 hover:border-primary transition-all duration-200"
              title="Add Column"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}