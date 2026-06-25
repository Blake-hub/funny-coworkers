import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { Plus, Search, FileText, FolderOpen, Edit3, Eye, Trash2 } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, WikiPageResponse } from '@/services/api';

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

export default function Wiki() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [wikiPages, setWikiPages] = useState<WikiPageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    loadWikiPages();
  }, []);

  const loadWikiPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const pages = await wikiApi.getAllPages();
      setWikiPages(pages);
    } catch (err) {
      console.error('Failed to load wiki pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wiki pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      await wikiApi.deletePage(id);
      setWikiPages(pages => pages.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete wiki page:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete page');
    }
  };

  const handleNewPage = () => {
    router.push('/wiki/new-document');
  };

  const filteredPages = wikiPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
            />
          </div>
          <button
            onClick={handleNewPage}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Loading wiki pages...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPages.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No wiki pages yet</h3>
          <p className="text-gray-500 mb-4">Create your first wiki page to get started.</p>
          <button
            onClick={handleNewPage}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Page
          </button>
        </div>
      )}

      {/* Wiki Pages */}
      {!loading && filteredPages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-100">
            {filteredPages.map((page) => (
              <div key={page.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-800 truncate">{page.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {page.lastModifiedByName && (
                        <span>Last modified by {page.lastModifiedByName}</span>
                      )}
                      <span>on {formatDate(page.lastModifiedAt)}</span>
                      {!page.isPublished && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => router.push(`/wiki/${page.id}`)}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors p-1"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/wiki/${page.id}/edit`)}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors p-1"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    className="flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
