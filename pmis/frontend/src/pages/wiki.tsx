import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import {
  Plus,
  Search,
  FileText,
  Edit3,
  Eye,
  Trash2,
  X,
} from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, WikiPageResponse, WikiFolderResponse } from '@/services/api';

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
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [wikiPages, setWikiPages] = useState<WikiPageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [folders, setFolders] = useState<WikiFolderResponse[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'mine' | 'team' | 'public'>('all');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderForm, setNewFolderForm] = useState<{
    name: string;
    parentFolderId: number | null;
    visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
    error?: string;
  }>({
    name: '',
    parentFolderId: null,
    visibility: 'PRIVATE',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const loadFolders = async () => {
    try {
      const result = await wikiApi.getAllFolders();
      setFolders(result);
    } catch (err) {
      console.error('Failed to load wiki folders:', err);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  // Sync selected folder from URL query param and trigger reload
  useEffect(() => {
    const folderIdRaw = router.query.folderId;
    const folderId = folderIdRaw != null ? Number(folderIdRaw) : null;
    // Load pages for this folder (or all pages when null)
    loadWikiPages(folderId);
  }, [router.query.folderId]);

  // Open new-folder modal when URL contains newFolderModal=1
  useEffect(() => {
    if (router.query.newFolderModal === '1') {
      setShowNewFolderModal(true);
      setNewFolderForm({
        name: '',
        parentFolderId: router.query.folderId ? Number(router.query.folderId) : null,
        visibility: 'PRIVATE',
      });
      // Clean query param after opening modal (so refresh doesn't re-open)
      const { newFolderModal: _omit, ...rest } = router.query;
      router.replace({
        pathname: '/wiki',
        query: rest,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.newFolderModal]);

  const loadWikiPages = async (folderId: number | null = null) => {
    try {
      setLoading(true);
      setError(null);
      const pages = await wikiApi.getAllPages(folderId);
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

  const filteredPages = wikiPages.filter(page => {
    if (!page.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    const folderIdFromQuery = router.query.folderId ? Number(router.query.folderId) : null;
    if (folderIdFromQuery != null && page.folderId !== folderIdFromQuery) {
      return false;
    }

    if (visibilityFilter === 'mine' && user) {
      const currentUserId = parseInt(user.id, 10);
      if (page.createdBy !== currentUserId) {
        return false;
      }
    }

    if (visibilityFilter === 'team') {
      if (page.visibility !== 'TEAM') {
        return false;
      }
    }

    if (visibilityFilter === 'public') {
      if (page.visibility !== 'PUBLIC') {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const flattenFolderOptions = (
    folderList: WikiFolderResponse[],
    depth: number
  ): Array<{ id: number; name: string; depth: number }> => {
    const result: Array<{ id: number; name: string; depth: number }> = [];
    for (const folder of folderList) {
      result.push({ id: folder.id, name: folder.name, depth });
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFolderOptions(folder.children, depth + 1));
      }
    }
    return result;
  };

  const handleCreateFolder = async () => {
    if (!newFolderForm.name.trim()) {
      setNewFolderForm(prev => ({ ...prev, error: 'Folder name is required' }));
      return;
    }

    try {
      setNewFolderForm(prev => ({ ...prev, error: undefined }));
      await wikiApi.createFolder({
        name: newFolderForm.name.trim(),
        parentFolderId: newFolderForm.parentFolderId ?? undefined,
        visibility: newFolderForm.visibility,
      });
      setShowNewFolderModal(false);
      setNewFolderForm({
        name: '',
        parentFolderId: null,
        visibility: 'PRIVATE',
      });
      await loadFolders();
      // Refresh page list in case we're viewing the parent folder just created into
      const folderIdRaw = router.query.folderId;
      loadWikiPages(folderIdRaw != null ? Number(folderIdRaw) : null);
    } catch (err) {
      console.error('Failed to create folder:', err);
      setNewFolderForm(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to create folder',
      }));
    }
  };

  const flatFolderOptions = flattenFolderOptions(folders, 0);

  const chipOptions = [
    { id: 'all', label: 'All' },
    { id: 'mine', label: 'My Pages' },
    { id: 'team', label: 'Team' },
    { id: 'public', label: 'Public' },
  ];

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Wiki</h1>
          <div className="relative group">
            <button
              onClick={handleNewPage}
              className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Create a new page
              </div>
            </div>
          </div>
        </div>

        {/* Filter Area */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          {/* Chips Filters */}
          <div className="flex items-center gap-1">
            {chipOptions.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setVisibilityFilter(chip.id as typeof visibilityFilter)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  visibilityFilter === chip.id
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search wiki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Wiki List */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center text-gray-500">
              Loading wiki pages...
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPages.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium">No wiki pages yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Create your first wiki page to get started.
              </p>
              <button
                onClick={handleNewPage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Page
              </button>
            </div>
          )}

          {/* Wiki Pages List */}
          {!loading && filteredPages.length > 0 && (
            <div className="min-w-full divide-y divide-gray-100">
              {filteredPages.map((page) => (
                <div
                  key={page.id}
                  className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{page.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {page.lastModifiedByName && (
                          <span>Last modified by {page.lastModifiedByName}</span>
                        )}
                        <span>on {formatDate(page.lastModifiedAt)}</span>
                        {!page.isPublished && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px]">
                            Draft
                          </span>
                        )}
                        {page.visibility && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              page.visibility === 'PUBLIC'
                                ? 'bg-green-100 text-green-800'
                                : page.visibility === 'TEAM'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {page.visibility}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button
                      onClick={() => router.push(`/wiki/${page.id}`)}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/wiki/${page.id}/edit`)}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowNewFolderModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Create New Folder</h2>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderForm.name}
                  onChange={(e) =>
                    setNewFolderForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      error: prev.error ? undefined : prev.error,
                    }))
                  }
                  placeholder="Enter folder name..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Folder (optional)
                </label>
                <select
                  value={newFolderForm.parentFolderId ?? ''}
                  onChange={(e) =>
                    setNewFolderForm(prev => ({
                      ...prev,
                      parentFolderId: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                      error: prev.error ? undefined : prev.error,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">— Root (top level) —</option>
                  {flatFolderOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {'— '.repeat(opt.depth)}
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  value={newFolderForm.visibility}
                  onChange={(e) =>
                    setNewFolderForm(prev => ({
                      ...prev,
                      visibility: e.target.value as 'PRIVATE' | 'TEAM' | 'PUBLIC',
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="PRIVATE">Private — Only you</option>
                  <option value="TEAM">Team — Team members only</option>
                  <option value="PUBLIC">Public — All organization users</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Controls who can view and access this folder and its contents.
                </p>
              </div>

              {newFolderForm.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {newFolderForm.error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
