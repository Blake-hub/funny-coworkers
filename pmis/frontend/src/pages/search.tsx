import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { Search, Bug, FolderOpen, FileText, Users } from 'lucide-react';
import { mockIssues, mockProjects, mockTeams } from '@/data/mockData';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  
  if (!token) {
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

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const filteredIssues = mockIssues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = mockTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Search</h1>
        <p className="text-gray-500 mt-1">Find issues, projects, teams, and more</p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues, projects, teams, wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Issues Results */}
        {filteredIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Bug className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Issues ({filteredIssues.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/issues')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-500">#{issue.id}</span>
                    <span className="font-medium text-gray-800">{issue.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Results */}
        {filteredProjects.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Projects ({filteredProjects.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/projects')}
                >
                  <h4 className="font-medium text-gray-800">{project.name}</h4>
                  <p className="text-sm text-gray-500">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Results */}
        {filteredTeams.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Teams ({filteredTeams.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredTeams.map((team) => (
                <div 
                  key={team.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/teams')}
                >
                  <h4 className="font-medium text-gray-800">{team.name}</h4>
                  <p className="text-sm text-gray-500">{team.memberCount} members | Lead: {team.leadName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredIssues.length === 0 && filteredProjects.length === 0 && filteredTeams.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-500">Try different keywords or browse the sidebar</p>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-800 mb-2">Start searching</h3>
            <p className="text-gray-500">Enter a keyword above to find issues, projects, teams, or wiki pages</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
