'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../components/layout/HeaderBar';
import Sidebar from '../components/layout/Sidebar';

interface Team {
  id: number;
  name: string;
  owner: string;
  members: TeamMember[];
  createdAt: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: 'owner' | 'member';
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
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

interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
}

function TeamCard({ team, onSelect }: TeamCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-smooth">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-medium">{team.name}</h3>
        <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
          {team.members.length} members
        </span>
      </div>
      <p className="text-sm text-neutral-400 mb-4">
        Owner: {team.owner}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          Created on {team.createdAt}
        </span>
        <button onClick={() => onSelect(team)} className="btn-primary text-xs">
          View Team
        </button>
      </div>
    </div>
  );
}

export default function Teams() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 1,
      name: 'Engineering Team',
      owner: 'Current User',
      members: [
        { id: 1, name: 'Current User', role: 'owner' },
        { id: 2, name: 'John Doe', role: 'member' },
        { id: 3, name: 'Jane Smith', role: 'member' },
      ],
      createdAt: '2026-01-20',
    },
    {
      id: 2,
      name: 'Design Team',
      owner: 'Current User',
      members: [
        { id: 1, name: 'Current User', role: 'owner' },
        { id: 4, name: 'Alice Johnson', role: 'member' },
      ],
      createdAt: '2026-01-25',
    },
  ]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleCreateTeam = (teamName: string) => {
    const newTeam: Team = {
      id: Date.now(),
      name: teamName,
      owner: 'Current User',
      members: [
        { id: 1, name: 'Current User', role: 'owner' },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTeams([...teams, newTeam]);
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
  };

  const handleCloseTeam = () => {
    setSelectedTeam(null);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <HeaderBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCreateBoard={() => {}} />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <TeamCard 
                    key={team.id} 
                    team={team} 
                    onSelect={handleSelectTeam} 
                  />
                ))}
              </div>
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
                <h1 className="text-2xl font-medium">{selectedTeam.name}</h1>
                <button className="btn-primary">
                  + Add Member
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-medium mb-4">Team Members</h3>
                  <div className="space-y-3">
                    {selectedTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium">{member.name}</h4>
                            <p className="text-xs text-neutral-400">
                              {member.role === 'owner' ? 'Owner' : 'Member'}
                            </p>
                          </div>
                        </div>
                        {member.role !== 'owner' && (
                          <button className="text-error hover:text-error/80 text-sm">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4">
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
    </div>
  );
}
