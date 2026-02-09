'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../components/layout/HeaderBar';
import Sidebar from '../components/layout/Sidebar';
import { teamApi, userApi } from '../services/api';

interface Team {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
    email: string;
  };
  members?: TeamMember[];
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Add Team Members</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Search Users</label>
          <input
            type="text"
            className="input-field w-full"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Enter username or email"
          />
          <p className="text-xs text-neutral-400 mt-1">Type at least 2 characters to search</p>
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
            No users found
          </div>
        ) : null}

        <div className="flex gap-2">
          <button 
            type="button" 
            className="btn-outline flex-1"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-primary flex-1"
            onClick={onAddMembers}
            disabled={selectedUsers.length === 0}
          >
            Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
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
        <h3 className="text-lg font-medium mb-4">Create New Team</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
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
              Create Team
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
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
        <h3 className="text-lg font-medium mb-4">Edit Team Name</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
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
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
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
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4 text-error">Delete Team</h3>
        <p className="mb-6">Are you sure you want to delete the team <strong>{team.name}</strong>? This action cannot be undone.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onDelete} className="btn-primary bg-error hover:bg-error/80 flex-1">
            Delete Team
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
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
  if (!isOpen || !member || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Transfer Ownership</h3>
        <p className="mb-6">Are you sure you want to transfer ownership of <strong>{team.name}</strong> to <strong>{member.user?.username || 'Unknown'}</strong>?</p>
        <div className="flex gap-2">
          <button type="button" onClick={onTransfer} className="btn-primary flex-1">
            Transfer Ownership
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
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
}

function TeamCard({ team, onSelect, onEdit, onDelete }: TeamCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium">{team.name}</h3>
        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
          {team.members ? team.members.length : '?'}
          {team.members ? (team.members.length === 1 ? ' member' : ' members') : ' member'}
        </span>
      </div>
      <p className="text-sm text-neutral-400 mb-4">
        Owner: {team.owner?.username || 'Unknown'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          Created on {team.createdAt}
        </span>
        <div className="flex gap-2">
          <button onClick={(e) => {
            e.stopPropagation();
            onEdit(team);
          }} className="btn-outline text-xs">
            Edit
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            onDelete(team);
          }} className="btn-outline text-xs text-error">
            Delete
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
      // Fetch the team details
      const teamDetails = await teamApi.getTeamById(team.id);
      
      // Fetch the team members
      const members = await teamApi.getTeamMembers(team.id);
      console.log('Team members:', members); // Debug log
      
      // Create a team object with both details and members
      const fullTeam = {
        ...teamDetails,
        members: members
      };
      
      // Update the teams array with the team that has members
      setTeams(prevTeams => prevTeams.map(t => 
        t.id.toString() === team.id.toString() ? fullTeam : t
      ));
      
      // Log for debugging
      console.log('Updated teams array with team:', team.id, 'members:', members.length);
      
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
                  <h1 className="text-2xl font-medium mb-2">My Teams</h1>
                  <p className="text-neutral-400">Collaborate with your team on retrospectives</p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Create New Team
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
                  <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                  <p className="text-neutral-400 mb-4">Create your first team to get started</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    + Create New Team
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
                  ← Back to Teams
                </button>
                <div>
                  <h1 className="text-2xl font-medium">{selectedTeam.name}</h1>
                  <p className="text-sm text-neutral-400">
                    {selectedTeam.members ? selectedTeam.members.length : '?'} 
                    {selectedTeam.members ? (selectedTeam.members.length === 1 ? 'member' : 'members') : 'member'}
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
                  <h3 className="text-lg font-medium mb-4">Team Members</h3>
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
                  <h3 className="text-lg font-medium mb-4">Team Boards</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-dashed border-neutral-200 rounded-lg text-center">
                      <p className="text-neutral-400 mb-3">No boards yet</p>
                      <button className="btn-primary text-sm">
                        + Create First Board
                      </button>
                    </div>
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
    </div>
  );
}
