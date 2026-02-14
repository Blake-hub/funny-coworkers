'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import CreateBoardModal from './CreateBoardModal';
import { boardApi, teamApi } from '../../services/api';

interface Team {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  members?: {
    id: number;
    user: {
      id: number;
      username: string;
      email: string;
    };
  }[];
}

interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  team: Team;
}

interface BoardListProps {
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export default function BoardList({ isModalOpen, onOpenModal, onCloseModal }: BoardListProps) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [boards, setBoards] = useState<Board[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch teams and boards on component mount
  useEffect(() => {
    fetchTeamsAndBoards();
  }, []);

  // Fetch boards when selected team changes
  useEffect(() => {
    if (selectedTeamId === null) {
      // Fetch all boards across all teams
      fetchAllBoards();
    } else if (selectedTeamId) {
      // Fetch boards for specific team
      fetchBoards(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchTeamsAndBoards = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch all teams
      const teamsData = await teamApi.getAllTeams();
      
      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          try {
            const members = await teamApi.getTeamMembers(team.id);
            return {
              ...team,
              members: members
            };
          } catch (err) {
            console.error('Error fetching members for team', team.id, err);
            // Fallback if members fetch fails
            return team;
          }
        })
      );
      
      setTeams(teamsWithMembers);
      
      // Fetch all boards directly after getting teams data
      const allBoards = [];
      
      for (const team of teamsWithMembers) {
        try {
          const teamBoards = await boardApi.getAllBoards(team.id);
          allBoards.push(...teamBoards);
        } catch (err) {
          console.error('Error fetching boards for team', team.id, err);
          // Continue with other teams even if one fails
        }
      }
      
      setBoards(allBoards);
      setIsLoading(false);
      
      // Default to showing all boards
      setSelectedTeamId(null);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setIsError(true);
      setErrorMessage('Failed to fetch teams');
      setIsLoading(false);
    }
  };

  const fetchBoards = async (teamId: number) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const boardsData = await boardApi.getAllBoards(teamId);
      setBoards(boardsData);
    } catch (error) {
      console.error('Error fetching boards:', error);
      setIsError(true);
      setErrorMessage('Failed to fetch boards');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBoards = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch all boards by getting boards for each team
      const allBoards = [];
      
      for (const team of teams) {
        try {
          const teamBoards = await boardApi.getAllBoards(team.id);
          allBoards.push(...teamBoards);
        } catch (err) {
          console.error('Error fetching boards for team', team.id, err);
          // Continue with other teams even if one fails
        }
      }
      
      setBoards(allBoards);
    } catch (error) {
      console.error('Error fetching all boards:', error);
      setIsError(true);
      setErrorMessage('Failed to fetch all boards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = () => {
    onOpenModal();
  };

  const handleSubmitBoard = async (boardData: { name: string; description: string; teamId: number }) => {
    setIsError(false);
    try {
      // Create the board using the API
      const newBoard = await boardApi.createBoard(boardData);
      
      // Add the new board to the list
      setBoards([...boards, newBoard]);
      onCloseModal();
      
      // Navigate to the new board with a small delay for visual consistency
      setTimeout(() => {
        router.push(`/board/${newBoard.id}`);
      }, 100);
    } catch (error) {
      console.error('Error creating board:', error);
      setIsError(true);
      setErrorMessage('Failed to create board');
    }
  };

  const handleViewBoard = (boardId: number) => {
    // Navigate immediately to the board detail page
    router.push(`/board/${boardId}`);
  };

  const handleDeleteBoard = async (boardId: number) => {
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      try {
        // Delete the board using the API
        await boardApi.deleteBoard(boardId);
        
        // Update the local state
        setBoards((prevBoards) => prevBoards.filter((board) => board.id !== boardId));
      } catch (error) {
        console.error('Error deleting board:', error);
        alert('Failed to delete board. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-medium mb-1">{t('dashboard.activeBoards')}</h2>
          <p className="text-neutral-400 text-sm">{boards.length} {t('dashboard.boardsAvailable')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {teams.length > 0 && (
            <select
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full sm:w-auto px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
          )}
          <button
            onClick={handleCreateBoard}
            className="btn-primary w-full sm:w-auto"
          >
{t('dashboard.createNewBoard')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p className="text-neutral-400 mb-6">{errorMessage}</p>
          <button
            onClick={fetchTeamsAndBoards}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
          >
            Try Again
          </button>
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-medium mb-2">{t('dashboard.noBoardsFound')}</h3>
          <p className="text-neutral-400 mb-6">{t('dashboard.createFirstBoard')}</p>
          <button
            onClick={handleCreateBoard}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
          >
            {t('dashboard.createBoard')}
          </button>
        </div>
      ) : (
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
                  <button className="p-2 rounded-full hover:bg-neutral-200 transition-smooth" onClick={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full hover:bg-neutral-200 transition-smooth" onClick={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 rounded-full hover:bg-neutral-200 transition-smooth" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-neutral-400 text-sm mb-4">
                {board.description || 'No description'}
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {(() => {
                    const team = teams.find(t => t.id === board.team.id);
                    const teamMembers = team?.members || [];
                    const visibleMembers = teamMembers.slice(0, 3);
                    const remainingMembers = Math.max(0, teamMembers.length - 3);
                    
                    return (
                      <>
                        {visibleMembers.map((member, index) => (
                          <div
                            key={member.id}
                            className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-medium"
                          >
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {remainingMembers > 0 && (
                          <div className="w-7 h-7 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-500 text-xs font-medium">
                            +{remainingMembers}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="text-sm text-neutral-400">
                  {(() => {
                    const team = teams.find(t => t.id === board.team.id);
                    return team?.members?.length || 0;
                  })()} members
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-4 flex items-center justify-between text-sm text-neutral-400">
                <div>
                  Team: {board.team.name}
                </div>
                <div>
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSubmit={handleSubmitBoard}
      />
    </div>
  );
}