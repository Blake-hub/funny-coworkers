'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../../components/layout/HeaderBar';
import Sidebar from '../../components/layout/Sidebar';
import Column from '../../components/board/Column';

interface Card {
  id: number;
  title: string;
  content: string;
  creator: string;
  createdAt: string;
  votes: number;
}

interface ColumnType {
  id: number;
  title: string;
  description: string;
  cards: Card[];
}

export default function BoardPage() {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnType[]>([
    {
      id: 1,
      title: 'What Went Well',
      description: 'Things that worked well during the sprint',
      cards: [
        {
          id: 1,
          title: 'Team Collaboration',
          content: 'Great communication between team members',
          creator: 'John Doe',
          createdAt: '2026-01-25',
          votes: 3,
        },
        {
          id: 2,
          title: 'Task Management',
          content: 'Clear task assignments and deadlines',
          creator: 'Jane Smith',
          createdAt: '2026-01-24',
          votes: 2,
        },
      ],
    },
    {
      id: 2,
      title: 'What Didn\'t Go Well',
      description: 'Challenges and issues encountered',
      cards: [
        {
          id: 3,
          title: 'Scope Creep',
          content: 'Requirements changed mid-sprint',
          creator: 'Bob Johnson',
          createdAt: '2026-01-25',
          votes: 4,
        },
      ],
    },
    {
      id: 3,
      title: 'Action Items',
      description: 'Steps to improve for next sprint',
      cards: [
        {
          id: 4,
          title: 'Better Planning',
          content: 'Spend more time on sprint planning',
          creator: 'Alice Brown',
          createdAt: '2026-01-26',
          votes: 1,
        },
        {
          id: 5,
          title: 'Regular Check-ins',
          content: 'Daily stand-ups to track progress',
          creator: 'Charlie Davis',
          createdAt: '2026-01-26',
          votes: 2,
        },
      ],
    },
  ]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleAddCard = (columnId: number, card: Card) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === columnId
          ? { ...column, cards: [...column.cards, card] }
          : column
      )
    );
  };

  const handleUpdateCard = (columnId: number, cardId: number, updatedCard: Partial<Card>) => {
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
  };

  const handleDeleteCard = (columnId: number, cardId: number) => {
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
  };

  const handleAddColumn = (title: string, description: string) => {
    const newColumn: ColumnType = {
      id: columns.length + 1,
      title,
      description,
      cards: [],
    };
    setColumns((prevColumns) => [...prevColumns, newColumn]);
  };

  const handleUpdateColumn = (columnId: number, updatedColumn: Partial<ColumnType>) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === columnId ? { ...column, ...updatedColumn } : column
      )
    );
  };

  const handleDeleteColumn = (columnId: number) => {
    setColumns((prevColumns) => prevColumns.filter((column) => column.id !== columnId));
  };

  const handleMoveCard = (fromColumnId: number, toColumnId: number, cardId: number, dropIndex: number | null = null) => {
    setColumns((prevColumns) => {
      // Find the card in the source column
      let cardToMove: Card | null = null;
      let originalCardIndex = -1;
      
      const columnsWithCardRemoved = prevColumns.map((column) => {
        if (column.id === fromColumnId) {
          const cardIndex = column.cards.findIndex((card) => card.id === cardId);
          if (cardIndex !== -1) {
            cardToMove = { ...column.cards[cardIndex] };
            originalCardIndex = cardIndex;
            return {
              ...column,
              cards: column.cards.filter((card) => card.id !== cardId),
            };
          }
        }
        return column;
      });

      // Add the card to the target column at the specified index
      if (cardToMove) {
        return columnsWithCardRemoved.map((column) => {
          if (column.id === toColumnId) {
            if (dropIndex !== null && dropIndex >= 0) {
              // Adjust drop index if moving within the same column and the original index was before the drop index
              let adjustedDropIndex = dropIndex;
              if (fromColumnId === toColumnId && originalCardIndex !== -1 && originalCardIndex < dropIndex) {
                adjustedDropIndex = dropIndex - 1;
              }
              
              // Insert at specific position
              const newCards = [...column.cards];
              // Ensure drop index is within bounds
              const safeDropIndex = Math.min(Math.max(0, adjustedDropIndex), newCards.length);
              newCards.splice(safeDropIndex, 0, cardToMove!);
              return {
                ...column,
                cards: newCards,
              };
            } else {
              // Append to end if no index specified
              return {
                ...column,
                cards: [...column.cards, cardToMove!],
              };
            }
          }
          return column;
        });
      }

      return prevColumns;
    });
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

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
              <button className="p-2 rounded-lg hover:bg-neutral-200 transition-smooth">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-medium">Sprint 1 Retro</h1>
            </div>
            <p className="text-neutral-400">Retrospective for our first sprint</p>
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
                handleAddColumn(newColumnTitle, '');
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