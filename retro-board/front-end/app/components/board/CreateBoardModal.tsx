'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { teamApi } from '../../services/api';

interface Team {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  members?: any[];
  createdAt: string;
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (boardData: { name: string; description: string; teamId: number }) => void;
}

export default function CreateBoardModal({ isOpen, onClose, onSubmit }: CreateBoardModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const teamsData = await teamApi.getAllTeams();
      setTeams(teamsData);
      if (teamsData.length > 0) {
        setSelectedTeamId(teamsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    setError('');
    onSubmit({ name, description, teamId: selectedTeamId });
  };

  const handleCreateTeam = () => {
    onClose();
    router.push('/teams');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Create New Board</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {isLoadingTeams ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
              <p className="text-neutral-400 mb-6">You need to create a team before creating a board.</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-neutral-700 hover:bg-neutral-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTeam}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
                >
                  Create Team
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="team" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Select Team <span className="text-red-500">*</span>
                </label>
                <select
                  id="team"
                  value={selectedTeamId || ''}
                  onChange={(e) => setSelectedTeamId(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">-- Select a team --</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} (Owner: {team.owner.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Board Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter board name"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Add a description for your board"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-neutral-700 hover:bg-neutral-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
                >
                  Create Board
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
