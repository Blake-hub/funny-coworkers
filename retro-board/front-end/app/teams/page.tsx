'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/layout/HeaderBar';
import Sidebar from '../components/layout/Sidebar';
import CreateBoardModal from '../components/board/CreateBoardModal';
import { teamApi, userApi, boardApi } from '../services/api';

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

interface Team {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  members?: TeamMember[];
  boards?: Board[];
  createdAt: string;
}

interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role: 'owner' | 'member';
  joinedAt: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: any[];
  isSearching: boolean;
  selectedUsers: number[];
  onToggleUserSelection: (userId: number) => void;
}

function AddMemberModal({ 
  isOpen, 
  onClose, 
  onAddMembers, 
  searchQuery, 
  onSearchChange, 
  searchResults, 
  isSearching, 
  selectedUsers, 
  onToggleUserSelection 
}: AddMemberModalProps) {
  const { t } = useTranslation('common');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">{t('modals.addMember.title')}</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('modals.addMember.searchUsers')}</label>
          <input
            type="text"
            className="input-field w-full"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={t('modals.addMember.searchPlaceholder')}
          />
          <p className="text-xs text-neutral-400 mt-1">{t('modals.addMember.searchHint')}</p>
        </div>

        {isSearching ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="border rounded-lg max-h-60 overflow-y-auto mb-4">
            {searchResults.map((user) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-3 hover:bg-neutral-100 dark:hover:bg-gray-700 cursor-pointer ${selectedUsers.includes(user.id) ? 'bg-primary/10' : ''}`}
                onClick={() => onToggleUserSelection(user.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                    {user.username.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{user.username}</h4>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </div>
                </div>
                {selectedUsers.includes(user.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        ) : searchQuery.length >= 2 ? (
          <div className="text-center py-4 text-neutral-400">
            {t('modals.addMember.noUsersFound')}
          </div>
        ) : null}

        <div className="flex gap-2">
          <button 
            type="button" 
            className="btn-outline flex-1"
            onClick={onClose}
          >
            {t('modals.addMember.cancel')}
          </button>
          <button 
            type="button" 
            className="btn-primary flex-1"
            onClick={onAddMembers}
            disabled={selectedUsers.length === 0}
          >
            {t('modals.addMember.addMembers', { count: selectedUsers.length, plural: selectedUsers.length !== 1 ? 's' : '' })}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (teamName: string) => void;
}

function CreateTeamModal({ isOpen, onClose, onCreate }: CreateTeamModalProps) {
  const { t } = useTranslation('common');
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onCreate(teamName);
      setTeamName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">{t('modals.createTeam.title')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('modals.createTeam.teamName')}</label>
            <input
              type="text"
              className="input-field w-full"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              {t('modals.createTeam.createTeam')}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              {t('modals.createTeam.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTeamNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdate: (newName: string) => void;
}

function EditTeamNameModal({ isOpen, onClose, team, onUpdate }: EditTeamNameModalProps) {
  const { t } = useTranslation('common');
  const [newName, setNewName] = useState(team?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== team?.name) {
      onUpdate(newName);
      onClose();
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">{t('modals.editTeamName.title')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('modals.editTeamName.teamName')}</label>
            <input
              type="text"
              className="input-field w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new team name"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              {t('modals.editTeamName.saveChanges')}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              {t('modals.editTeamName.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onDelete: () => void;
}

function DeleteTeamModal({ isOpen, onClose, team, onDelete }: DeleteTeamModalProps) {
  const { t } = useTranslation('common');
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4 text-error">{t('modals.deleteTeam.title')}</h3>
        <p className="mb-6">{t('modals.deleteTeam.confirm', { teamName: team.name })}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onDelete} className="btn-primary bg-error hover:bg-error/80 flex-1">
            {t('modals.deleteTeam.deleteTeam')}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            {t('modals.deleteTeam.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  team: Team | null;
  onTransfer: () => void;
}

function TransferOwnershipModal({ isOpen, onClose, member, team, onTransfer }: TransferOwnershipModalProps) {
  const { t } = useTranslation('common');
  if (!isOpen || !member || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">{t('modals.transferOwnership.title')}</h3>
        <p className="mb-6">{t('modals.transferOwnership.confirm', { teamName: team.name, memberName: member.user?.username || 'Unknown' })}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onTransfer} className="btn-primary flex-1">
            {t('modals.transferOwnership.transferOwnership')}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            {t('modals.transferOwnership.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  t: (key: string, options?: any) => string;
}

function TeamCard({ team, onSelect, onEdit, onDelete, t }: TeamCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium">{team.name}</h3>
        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
          {team.members ? team.members.length : '?'}
          {team.members ? (team.members.length === 1 ? ` ${t('teams.members')}` : ` ${t('teams.members')}`) : ` ${t('teams.members')}`}
        </span>
      </div>
      <p className="text-sm text-neutral-400 mb-4">
        {t('teams.owner')}: {team.owner?.username || 'Unknown'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {t('teams.createdOn')} {team.createdAt}
        </span>
        <div className="flex gap-2">
          <button onClick={(e) => {
            e.stopPropagation();
            onEdit(team);
          }} className="btn-outline text-xs">
            {t('buttons.edit')}
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            onDelete(team);
          }} className="btn-outline text-xs text-error">
            {t('buttons.delete')}
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            onSelect(team);
          }} className="btn-primary text-xs">
            View Team
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Teams() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [memberToTransferOwnership, setMemberToTransferOwnership] = useState<TeamMember | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Fetch teams from backend
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamsData = await teamApi.getAllTeams();
      // Transform the data to match our interface
      const transformedTeams = await Promise.all(teamsData.map(async (team: any) => {
        try {
          // Fetch members for each team
          const members = await teamApi.getTeamMembers(team.id);
          return {
            id: team.id,
            name: team.name,
            owner: team.owner,
            members: members,
            createdAt: team.createdAt ? new Date(team.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        } catch (err) {
          console.error('Error fetching members for team', team.id, err);
          // Fallback if members fetch fails
          return {
            id: team.id,
            name: team.name,
            owner: team.owner,
            createdAt: team.createdAt ? new Date(team.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          };
        }
      }));
      setTeams(transformedTeams);
      console.log('Fetched teams with members:', transformedTeams);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (teamName: string) => {
    try {
      const username = localStorage.getItem('username');
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }
      
      // Create team with current user as owner
      const newTeam = await teamApi.createTeam({
        name: teamName,
        ownerId: parseInt(userId, 10),
      });
      
      // Fetch the new team's members
      const members = await teamApi.getTeamMembers(newTeam.id);
      
      // Add the new team to the list with members
      const transformedTeam = {
        id: newTeam.id,
        name: newTeam.name,
        owner: newTeam.owner,
        members: members,
        createdAt: newTeam.createdAt ? new Date(newTeam.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
      setTeams([...teams, transformedTeam]);
      console.log('Created new team with members:', newTeam.id, 'members:', members.length);
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team. Please try again.');
    }
  };

  const handleSelectTeam = async (team: Team) => {
    try {
      // Convert team.id to number to ensure type consistency
      const teamId = Number(team.id);
      
      // Fetch the team details
      const teamDetails = await teamApi.getTeamById(teamId);
      
      // Fetch the team members
      const members = await teamApi.getTeamMembers(teamId);
      console.log('Team members:', members); // Debug log
      
      // Fetch the team boards
      const boards = await boardApi.getAllBoards(teamId);
      console.log('Team boards:', boards); // Debug log
      
      // Create a team object with both details, members, and boards
      const fullTeam = {
        ...teamDetails,
        members: members,
        boards: boards
      };
      
      // Update the teams array with the team that has members and boards
      setTeams(prevTeams => prevTeams.map(t => 
        Number(t.id) === teamId ? fullTeam : t
      ));
      
      // Log for debugging
      console.log('Updated teams array with team:', team.id, 'members:', members.length, 'boards:', boards.length);
      
      setSelectedTeam(fullTeam);
    } catch (err) {
      console.error('Error fetching team details:', err);
      // Fallback to the basic team information if full details fail
      setSelectedTeam(team);
    }
  };

  const handleCloseTeam = () => {
    setSelectedTeam(null);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleAddMemberClick = () => {
    setIsAddMemberModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
  };

  const handleSearchUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const results = await userApi.searchUsers(query);
        // Filter out users who are already members of the team
        const existingMemberIds = selectedTeam?.members?.map(member => member.user.id) || [];
        const filteredResults = results.filter(user => !existingMemberIds.includes(user.id));
        setSearchResults(filteredResults);
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleToggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAddMembers = async () => {
    if (!selectedTeam || selectedUsers.length === 0) {
      return;
    }

    try {
      // Get the selected users from search results
      const usersToAdd = searchResults.filter(user => selectedUsers.includes(user.id));
      
      // Create member objects
      const newMembers = usersToAdd.map(user => ({
        userId: user.id,
        role: 'member'
      }));

      // Update the team with new members
      const updatedTeam = await teamApi.updateTeam(selectedTeam.id, {
        members: [
          // Keep existing members
          ...(selectedTeam.members?.map(member => ({
            userId: member.user.id,
            role: member.role
          })) || []),
          // Add new members
          ...newMembers
        ]
      });

      // After updating, refetch the team members to show the updated list
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      const teamWithUpdatedMembers = {
        ...selectedTeam,
        members: members
      };
      
      // Update the selected team in state
      setSelectedTeam(teamWithUpdatedMembers);
      
      // Update the teams array with the updated team
      setTeams(prevTeams => prevTeams.map(t => 
        t.id === selectedTeam.id ? teamWithUpdatedMembers : t
      ));
      
      // Close the modal
      setIsAddMemberModalOpen(false);
    } catch (err) {
      console.error('Error adding members:', err);
      setError('Failed to add members. Please try again.');
    }
  };

  const handleRemoveMember = async (memberToRemove: TeamMember) => {
    if (!selectedTeam) {
      return;
    }

    try {
      // Create a new members list without the member to remove
      const updatedMembers = selectedTeam.members?.filter(member => member.id !== memberToRemove.id) || [];
      
      // Update the team with the new members list
      await teamApi.updateTeam(selectedTeam.id, {
        members: updatedMembers.map(member => ({
          userId: member.user.id,
          role: member.role
        }))
      });

      // After updating, refetch the team members to show the updated list
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      const teamWithUpdatedMembers = {
        ...selectedTeam,
        members: members
      };
      
      // Update the selected team in state
      setSelectedTeam(teamWithUpdatedMembers);
      
      // Update the teams array with the updated team
      setTeams(prevTeams => prevTeams.map(t => 
        t.id === selectedTeam.id ? teamWithUpdatedMembers : t
      ));
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    }
  };

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeamName = async (newName: string) => {
    if (!teamToEdit) {
      return;
    }

    try {
      // Update the team name
      const updatedTeam = await teamApi.updateTeam(teamToEdit.id, {
        name: newName
      });

      // Fetch the updated team's members
      const members = await teamApi.getTeamMembers(teamToEdit.id);
      const teamWithMembers = {
        ...updatedTeam,
        members: members
      };

      // Update the teams array
      setTeams(prevTeams => prevTeams.map(t => 
        t.id === teamToEdit.id ? teamWithMembers : t
      ));

      // If this is the selected team, update it too
      if (selectedTeam && selectedTeam.id === teamToEdit.id) {
        setSelectedTeam(teamWithMembers);
      }

      console.log('Updated team name:', teamToEdit.id, 'new name:', newName);
    } catch (err) {
      console.error('Error updating team name:', err);
      setError('Failed to update team name. Please try again.');
    }
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) {
      return;
    }

    try {
      // Delete the team
      await teamApi.deleteTeam(teamToDelete.id);

      // Remove the team from the teams array
      setTeams(prevTeams => prevTeams.filter(t => 
        t.id !== teamToDelete.id
      ));

      // If this is the selected team, close the detail view
      if (selectedTeam && selectedTeam.id === teamToDelete.id) {
        setSelectedTeam(null);
      }

      // Close the modal
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);

      console.log('Deleted team:', teamToDelete.id, teamToDelete.name);
    } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team. Please try again.');
    }
  };

  const handleTransferOwnership = (member: TeamMember) => {
    if (!selectedTeam) {
      return;
    }
    setMemberToTransferOwnership(member);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransferOwnership = async () => {
    if (!memberToTransferOwnership || !selectedTeam) {
      return;
    }

    try {
      // Update the team with new owner
      const updatedTeam = await teamApi.updateTeam(selectedTeam.id, {
        ownerId: memberToTransferOwnership.user.id
      });

      // Fetch the updated team's members
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      const teamWithMembers = {
        ...updatedTeam,
        members: members
      };

      // Update the teams array
      setTeams(prevTeams => prevTeams.map(t => 
        t.id === selectedTeam.id ? teamWithMembers : t
      ));

      // Update the selected team
      setSelectedTeam(teamWithMembers);

      // Close the modal
      setIsTransferModalOpen(false);
      setMemberToTransferOwnership(null);

      console.log('Transferred ownership of team:', selectedTeam.id, 'to user:', memberToTransferOwnership.user.id);
    } catch (err) {
      console.error('Error transferring ownership:', err);
      setError('Failed to transfer ownership. Please try again.');
    }
  };

  const handleCreateBoard = () => {
    console.log('Create Board button clicked');
    console.log('Current isCreateBoardModalOpen state:', isCreateBoardModalOpen);
    setIsCreateBoardModalOpen(true);
    console.log('After setting state:', isCreateBoardModalOpen);
  };

  const handleSubmitBoard = async (boardData: { name: string; description: string; teamId: number }) => {
    try {
      // Create the board using the API
      const newBoard = await boardApi.createBoard(boardData);
      
      // If the board was created for the selected team, update the selected team's boards
      if (selectedTeam && selectedTeam.id === boardData.teamId) {
        const updatedSelectedTeam = {
          ...selectedTeam,
          boards: [...(selectedTeam.boards || []), newBoard]
        };
        setSelectedTeam(updatedSelectedTeam);
        
        // Also update the team in the teams array
        setTeams(prevTeams => prevTeams.map(t => 
          t.id === boardData.teamId ? updatedSelectedTeam : t
        ));
      }
      
      // Close the modal
      setIsCreateBoardModalOpen(false);
    } catch (err) {
      console.error('Error creating board:', err);
      setError('Failed to create board. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex flex-col">
      <HeaderBar onMobileMenuClick={handleMobileSidebarToggle} />
      <div className="flex flex-1 overflow-hidden">
        {isMobileSidebarOpen && (
          <Sidebar 
            onCreateBoard={() => {}}
            isMobile={true}
            onMobileToggle={handleMobileSidebarToggle}
          />
        )}
        <Sidebar 
          onCreateBoard={() => {}}
          isMobile={false}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {!selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-medium mb-2">{t('teams.pageTitle')}</h1>
                  <p className="text-neutral-400">{t('teams.pageDescription')}</p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + {t('teams.createNewTeam')}
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="bg-error/10 text-error p-4 rounded-lg mb-6">
                  {error}
                  <button 
                    className="mt-2 text-sm font-medium underline"
                    onClick={fetchTeams}
                  >
                    Try again
                  </button>
                </div>
              ) : teams.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">{t('teams.noTeams')}</h3>
                  <p className="text-neutral-400 mb-4">{t('teams.createFirstTeam')}</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    {t('teams.createNewTeam')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <TeamCard 
                      key={team.id} 
                      team={team} 
                      onSelect={handleSelectTeam}
                      onEdit={handleEditTeam}
                      onDelete={handleDeleteTeam}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="team-detail">
              <div className="flex items-center justify-between mb-6">
                <button 
                  className="btn-outline mb-4"
                  onClick={handleCloseTeam}
                >
{t('teams.backToTeams')}
                </button>
                <div>
                  <h1 className="text-2xl font-medium">{selectedTeam.name}</h1>
                  <p className="text-sm text-neutral-400">
                    {selectedTeam.members ? selectedTeam.members.length : '?'}
{t('teams.members')}
                  </p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={handleAddMemberClick}
                >
                  + Add Member
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-medium mb-4">{t('teams.teamMembers')}</h3>
                  <div className="space-y-3">
                    {(selectedTeam.members || []).map((member) => {
                      // Check if current user is the owner
                      const currentUserId = localStorage.getItem('userId');
                      const isCurrentUserOwner = currentUserId && selectedTeam.owner?.id === parseInt(currentUserId, 10);
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                              {member.user?.username.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="font-medium">{member.user?.username || 'Unknown'}</h4>
                              <p className="text-xs text-neutral-400">
                                {member.role === 'owner' ? 'Owner' : 'Member'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isCurrentUserOwner && member.role !== 'owner' && (
                              <button 
                                className="text-primary hover:text-primary/80 text-sm"
                                onClick={() => handleTransferOwnership(member)}
                              >
                                Transfer Ownership
                              </button>
                            )}
                            {member.role !== 'owner' && (
                              <button 
                                className="text-error hover:text-error/80 text-sm"
                                onClick={() => handleRemoveMember(member)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-medium mb-4">{t('teams.teamBoards')}</h3>
                  <div className="space-y-3">
                    {selectedTeam.boards && selectedTeam.boards.length > 0 ? (
                      selectedTeam.boards.map((board) => (
                        <div key={board.id} className="p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-smooth">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{board.name}</h4>
                            <div className="flex gap-2">
                              <button 
                                className="text-sm text-neutral-500 hover:text-neutral-700"
                                onClick={() => router.push(`/board/${board.id}`)}
                              >
{t('buttons.view')}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-400 mb-2">
{board.description || t('board.noDescription')}
                          </p>
                          <div className="text-xs text-neutral-400">
{t('teams.createdOn')} {new Date(board.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-neutral-200 rounded-lg text-center">
                        <p className="text-neutral-400 mb-3">{t('teams.noBoards')}</p>
                        <button className="btn-primary text-sm" onClick={handleCreateBoard}>
                          {t('teams.createFirstBoard')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <CreateTeamModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTeam}
      />
      
      <EditTeamNameModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        team={teamToEdit}
        onUpdate={handleUpdateTeamName}
      />
      
      <DeleteTeamModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        team={teamToDelete}
        onDelete={handleConfirmDeleteTeam}
      />
      
      <TransferOwnershipModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        member={memberToTransferOwnership}
        team={selectedTeam}
        onTransfer={handleConfirmTransferOwnership}
      />
      
      <AddMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMembers={handleAddMembers}
        searchQuery={searchQuery}
        onSearchChange={handleSearchUsers}
        searchResults={searchResults}
        isSearching={isSearching}
        selectedUsers={selectedUsers}
        onToggleUserSelection={handleToggleUserSelection}
      />
      
      {/* Simple custom modal for testing */}
      {isCreateBoardModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium">Create New Board</h2>
                <button
                  onClick={() => setIsCreateBoardModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedTeam) {
                  handleSubmitBoard({ name: boardName, description: boardDescription, teamId: Number(selectedTeam.id) });
                }
              }}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Board Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter board name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Add a description for your board"
                    rows={3}
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="team" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Team <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="team"
                    value={selectedTeam?.name || ''}
                    disabled
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateBoardModalOpen(false)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
