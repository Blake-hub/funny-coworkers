'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateBoardModal from './CreateBoardModal';

interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  members: number;
  columns: number;
  cards: number;
}

interface BoardListProps {
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export default function BoardList({ isModalOpen, onOpenModal, onCloseModal }: BoardListProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([
    {
      id: 1,
      name: 'Sprint 1 Retro',
      description: 'Retrospective for our first sprint',
      createdAt: '2026-01-20',
      updatedAt: '2026-01-25',
      members: 5,
      columns: 3,
      cards: 12,
    },
    {
      id: 2,
      name: 'Team Planning',
      description: 'Quarterly team planning session',
      createdAt: '2026-01-15',
      updatedAt: '2026-01-28',
      members: 8,
      columns: 4,
      cards: 20,
    },
    {
      id: 3,
      name: 'Q1 Review',
      description: 'First quarter review and feedback',
      createdAt: '2026-01-10',
      updatedAt: '2026-01-22',
      members: 6,
      columns: 3,
      cards: 15,
    },
  ]);

  const handleCreateBoard = () => {
    onOpenModal();
  };

  const handleSubmitBoard = (boardData: { name: string; description: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const newBoard: Board = {
      id: boards.length + 1,
      name: boardData.name,
      description: boardData.description,
      createdAt: today,
      updatedAt: today,
      members: 1,
      columns: 3,
      cards: 0,
    };

    setBoards([...boards, newBoard]);
    onCloseModal();
    
    // Navigate to the new board with a small delay for visual consistency
    setTimeout(() => {
      router.push(`/board/${newBoard.id}`);
    }, 100);
  };

  const handleViewBoard = (boardId: number) => {
    // Add a small delay to allow the visual feedback to be seen
    setTimeout(() => {
      router.push(`/board/${boardId}`);
    }, 100);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium mb-1">Active Boards</h2>
          <p className="text-neutral-400 text-sm">{boards.length} boards available</p>
        </div>
        <button
          onClick={handleCreateBoard}
          className="btn-primary"
        >
          + Create New Board
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-container cursor-pointer hover:shadow-lg active:scale-95 active:shadow-sm transition-smooth dark:bg-gray-800"
            onClick={() => handleViewBoard(board.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{board.name}</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-neutral-200 transition-smooth">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-neutral-200 transition-smooth">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              {board.description}
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-medium"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-7 h-7 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 text-xs font-medium">
                  +{board.members - 3}
                </div>
              </div>
              <div className="text-sm text-neutral-400">
                {board.members} members
              </div>
            </div>
            <div className="border-t border-neutral-200 pt-4 flex items-center justify-between text-sm text-neutral-400">
              <div>
                {board.columns} columns • {board.cards} cards
              </div>
              <div>
                Updated {board.updatedAt}
              </div>
            </div>
          </div>
        ))}
      </div>
      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={handleSubmitBoard}
      />
    </div>
  );
}