'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../../components/layout/HeaderBar';
import Sidebar from '../../components/layout/Sidebar';
import Column from '../../components/board/Column';
import { boardApi, columnApi, cardApi } from '../../services/api';
import { Card as CardType, ColumnType, Board } from '../../types';
import useBoardWebSocket from '../../hooks/useBoardWebSocket';

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  const { t } = useTranslation('common');
  
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // WebSocket event handlers with useCallback to prevent re-subscriptions
  const handleCardCreated = useCallback((card: CardType) => {
    console.log('handleCardCreated: called with card:', card);
    setColumns(prev => prev.map(col => 
      col.id === card.column.id 
        ? { 
            ...col, 
            cards: col.cards.some(c => c.id === card.id) 
              ? col.cards 
              : [...col.cards, card] 
          } 
        : col
    ));
  }, []);
  
  const handleCardUpdated = useCallback((card: CardType) => {
    console.log('handleCardUpdated: called with card:', card);
    console.log('handleCardUpdated: card.column:', card.column);
    setColumns(prev => {
      console.log('handleCardUpdated: current columns:', prev);
      
      // First, remove the card from all columns
      const columnsWithoutCard = prev.map(col => ({
        ...col,
        cards: col.cards.filter(c => c.id !== card.id)
      }));
      
      // Then, add the card to the new column at the correct position
      const newColumns = columnsWithoutCard.map(col => {
        if (col.id === card.column?.id) {
          console.log('handleCardUpdated: adding card to column', col.id, 'at position', card.position);
          // Create a new array with the card inserted at the correct position
          const newCards = [...col.cards];
          newCards.splice(card.position, 0, card);
          return {
            ...col,
            cards: newCards
          };
        }
        return col;
      });
      
      console.log('handleCardUpdated: new columns:', newColumns);
      return newColumns;
    });
  }, []);
  
  const handleCardDeleted = useCallback((cardId: number) => {
    setColumns(prev => prev.map(col => 
      ({ ...col, cards: col.cards.filter(c => c.id !== cardId) })
    ));
  }, []);
  
  const handleColumnCreated = useCallback((column: ColumnType) => {
    setColumns(prev => {
      // Check if column already exists to prevent duplicates
      const columnExists = prev.some(col => col.id === column.id);
      if (columnExists) {
        console.log('handleColumnCreated: Column already exists, skipping:', column.id);
        return prev;
      }
      console.log('handleColumnCreated: Adding new column:', column);
      return [...prev, { ...column, cards: [] }];
    });
  }, []);
  
  const handleColumnUpdated = useCallback((column: ColumnType) => {
    setColumns(prev => prev.map(col => 
      col.id === column.id ? { ...column, cards: col.cards } : col
    ));
  }, []);
  
  const handleColumnDeleted = useCallback((columnId: number) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);
  
  // Connect to WebSocket
  useBoardWebSocket({
    boardId: parseInt(boardId),
    onCardCreated: handleCardCreated,
    onCardUpdated: handleCardUpdated,
    onCardDeleted: handleCardDeleted,
    onCardVoted: handleCardUpdated, // Use same handler as card updated
    onColumnCreated: handleColumnCreated,
    onColumnUpdated: handleColumnUpdated,
    onColumnDeleted: handleColumnDeleted
  });

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
      await cardApi.createCard({
        title: cardData.title,
        description: cardData.description,
        columnId,
        position: newPosition,
      });
      
      // Local state update is no longer needed as WebSocket event will handle it
      // This prevents duplicate cards from appearing
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Failed to add card');
    }
  };

  const handleUpdateCard = async (columnId: number, cardId: number, updatedCard: Partial<CardType>) => {
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
      await columnApi.createColumn({
        name: title,
        boardId: parseInt(boardId),
        position: newPosition,
      });
      
      // Local state update is no longer needed as WebSocket event will handle it
      // This prevents duplicate columns from appearing
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
      
      // Update local state immediately for faster animation response
      setColumns(prev => {
        // Create a deep copy of the columns to avoid mutating state
        const updatedColumns = prev.map(col => ({
          ...col,
          cards: [...col.cards]
        }));
        
        // Get the source column
        const sourceColumn = updatedColumns.find(col => col.id === fromColumnId);
        if (!sourceColumn) return prev;
        
        // Get the current position of the card
        const currentPosition = sourceColumn.cards.findIndex(c => c.id === cardId);
        if (currentPosition === -1) return prev;
        
        // Remove the card from the source column
        const [movedCard] = sourceColumn.cards.splice(currentPosition, 1);
        
        // If moving within the same column
        if (fromColumnId === toColumnId) {
          // If the card is being moved to a position before its current position
          if (newPosition < currentPosition) {
            // Update all cards between the new position and current position to move down
            for (let i = 0; i < sourceColumn.cards.length; i++) {
              if (sourceColumn.cards[i].position >= newPosition && sourceColumn.cards[i].position < currentPosition) {
                sourceColumn.cards[i].position += 1;
              }
            }
          }
          // If the card is being moved to a position after its current position
          else if (newPosition > currentPosition) {
            // Update all cards between the current position and new position to move up
            for (let i = 0; i < sourceColumn.cards.length; i++) {
              if (sourceColumn.cards[i].position > currentPosition && sourceColumn.cards[i].position < newPosition) {
                sourceColumn.cards[i].position -= 1;
              }
            }
          }
          
          // Insert the card at the new position
          movedCard.position = newPosition;
          sourceColumn.cards.splice(newPosition, 0, movedCard);
        }
        // If moving to a different column
        else {
          // Update cards in the source column to move up
          for (let i = 0; i < sourceColumn.cards.length; i++) {
            if (sourceColumn.cards[i].position > currentPosition) {
              sourceColumn.cards[i].position -= 1;
            }
          }
          
          // Get the target column
          const targetColumn = updatedColumns.find(col => col.id === toColumnId);
          if (targetColumn) {
            // Update cards in the target column to move down
            for (let i = 0; i < targetColumn.cards.length; i++) {
              if (targetColumn.cards[i].position >= newPosition) {
                targetColumn.cards[i].position += 1;
              }
            }
            
            // Insert the card at the new position in the target column
            movedCard.position = newPosition;
            movedCard.column = { id: toColumnId, name: targetColumn.name };
            targetColumn.cards.splice(newPosition, 0, movedCard);
          }
        }
        
        return updatedColumns;
      });
      
      // Update the card using the API
      await cardApi.updateCard(cardId, {
        title: card.title,
        description: card.description,
        columnId: toColumnId,
        position: newPosition,
      });
      
      // Update other cards using the API
      if (fromColumnId === toColumnId) {
        // Get the current position of the card
        const currentPosition = fromColumn.cards.findIndex(c => c.id === cardId);
        
        // If the card is being moved to a position before its current position
        if (newPosition < currentPosition) {
          // Update all cards between the new position and current position to move down
          for (const c of fromColumn.cards) {
            if (c.id !== cardId && c.position >= newPosition && c.position < currentPosition) {
              await cardApi.updateCard(c.id, {
                title: c.title,
                description: c.description,
                columnId: c.column.id,
                position: c.position + 1
              });
            }
          }
        }
        // If the card is being moved to a position after its current position
        else if (newPosition > currentPosition) {
          // Update all cards between the current position and new position to move up
          for (const c of fromColumn.cards) {
            if (c.id !== cardId && c.position > currentPosition && c.position < newPosition) {
              await cardApi.updateCard(c.id, {
                title: c.title,
                description: c.description,
                columnId: c.column.id,
                position: c.position - 1
              });
            }
          }
        }
      }
      // If moving to a different column, adjust positions in both columns
      else {
        // Update cards in the source column to move up
        for (const c of fromColumn.cards) {
          if (c.id !== cardId && c.position > card.position) {
            await cardApi.updateCard(c.id, {
              title: c.title,
              description: c.description,
              columnId: c.column.id,
              position: c.position - 1
            });
          }
        }
        
        // Update cards in the target column to move down
        const toColumn = columns.find(col => col.id === toColumnId);
        if (toColumn) {
          for (const c of toColumn.cards) {
            if (c.position >= newPosition) {
              await cardApi.updateCard(c.id, {
                title: c.title,
                description: c.description,
                columnId: c.column.id,
                position: c.position + 1
              });
            }
          }
        }
      }
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex items-start gap-4 mb-4 sm:mb-0">
              <button 
                className="p-2 rounded-lg hover:bg-neutral-200 transition-smooth mt-1"
                onClick={() => router.back()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-medium">{board.name}</h1>
                <p className="text-neutral-400">{board.description || t('board.noDescription')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="btn-outline text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
{t('board.boardSettings')}
              </button>
              <button className="btn-outline text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
{t('board.teamMembers')}
              </button>
            </div>
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
              className="w-[320px] bg-white/50 dark:bg-gray-700/50 border-2 border-dashed border-neutral-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 hover:border-primary transition-all duration-200"
              title={t('board.addColumn')}
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