import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { Plus, Search, FileText, FolderOpen, Edit3 } from 'lucide-react';

interface WikiPage {
  id: string;
  title: string;
  parentId?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

const mockWikiPages: WikiPage[] = [
  { id: '1', title: 'Getting Started', lastModifiedBy: 'John Doe', lastModifiedAt: '2026-04-20' },
  { id: '2', title: 'API Documentation', lastModifiedBy: 'Sarah Smith', lastModifiedAt: '2026-04-19' },
  { id: '3', title: 'Project Guidelines', lastModifiedBy: 'Mike Johnson', lastModifiedAt: '2026-04-18' },
  { id: '4', title: 'Development Standards', lastModifiedBy: 'John Doe', lastModifiedAt: '2026-04-17' },
  { id: '5', title: 'FAQ', lastModifiedBy: 'Emily Davis', lastModifiedAt: '2026-04-16' },
];

export default function Wiki() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const filteredPages = mockWikiPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Wiki</h1>
        <p className="text-gray-500 mt-1">Access and manage documentation.</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wiki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

      {/* Wiki Pages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-100">
          {filteredPages.map((page) => (
            <div key={page.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-800">{page.title}</h3>
                  <p className="text-sm text-gray-500">
                    Last modified by {page.lastModifiedBy} on {page.lastModifiedAt}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
