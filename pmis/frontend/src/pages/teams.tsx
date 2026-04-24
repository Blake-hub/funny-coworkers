import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { mockTeams } from '@/data/mockData';
import { Plus, Search, Users, User } from 'lucide-react';

export default function Teams() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const filteredTeams = mockTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Teams</h1>
        <p className="text-gray-500 mt-1">View and manage your teams.</p>
      </div>

      {/* Actions Bar */}
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
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Team
          </button>
        </div>
      </div>

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.map((team) => (
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
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{team.memberCount}</p>
                  <p className="text-sm text-gray-500">Members</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Lead</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {team.leadName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{team.leadName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
