import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { Plus, Search, Users, Pencil, X, Trash2, UserPlus } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { teamApi, userApi, TeamResponse, UserResponse } from '@/services/api';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  
  if (!token) {
    debugger;
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Teams() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserResponse[]>([]);
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserResponse | null>(null);
  const [newMemberRole, setNewMemberRole] = useState('TEAM_MEMBER');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamApi.getAllTeams();
        setTeams(data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const openMembersModal = async (team: TeamResponse) => {
    setSelectedTeam(team);
    try {
      const members = await teamApi.getTeamMembers(team.id);
      setTeamMembers(members);
      const users = await userApi.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
    setShowMembersModal(true);
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await teamApi.addTeamMember(selectedTeam.id, userId, newMemberRole);
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
      setShowAddMemberModal(false);
      setNewMemberRole('TEAM_MEMBER');
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
    try {
      await teamApi.removeTeamMember(selectedTeam.id, userId);
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    if (!selectedTeam) return;
    try {
      await teamApi.updateTeamMemberRole(selectedTeam.id, userId, role);
      const members = await teamApi.getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to update team member role:', error);
    }
  };

  const getUsersNotInTeam = () => {
    if (!selectedTeam) return [];
    const memberIds = teamMembers.map(m => m.id);
    return allUsers.filter(u => !memberIds.includes(u.id));
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTeams = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (filteredTeams.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No teams found</p>
        </div>
      );
    }

    return filteredTeams.map((team) => (
      <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{team.name}</h3>
              <p className="text-sm text-gray-500">{team.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{team.memberCount}</p>
              <p className="text-sm text-gray-500">Members</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                  {team.leadName ? team.leadName.charAt(0) : '?'}
                </div>
                <span className="text-sm font-medium text-gray-700">{team.leadName || 'N/A'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Owner</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                  {team.ownerName ? team.ownerName.charAt(0) : '?'}
                </div>
                <span className="text-sm font-medium text-gray-700">{team.ownerName || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openMembersModal(team)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                <Users className="w-4 h-4" />
                Members
              </button>
              <a
                href={`/teams/edit/${team.id}`}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium text-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </a>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Teams</h1>
        <p className="text-gray-500 mt-1">View and manage your teams.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => router.push('/teams/new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Team
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {renderTeams()}
      </div>

      {showMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
                <p className="text-sm text-gray-500">{selectedTeam.name}</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No members in this team yet.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                                {member.name.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-800">{member.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{member.email}</td>
                          <td className="py-3">
                            <select
                              value="TEAM_MEMBER"
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="TEAM_OWNER">Team Owner</option>
                              <option value="TEAM_MEMBER">Team Member</option>
                            </select>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add Team Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  onChange={(e) => setSelectedUserForRole(allUsers.find(u => u.id === Number(e.target.value)) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user</option>
                  {getUsersNotInTeam().map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TEAM_OWNER">Team Owner</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedUserForRole && handleAddMember(selectedUserForRole.id)}
                disabled={!selectedUserForRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
