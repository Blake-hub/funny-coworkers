import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import RichTextEditor, { DocumentOutline } from '@/components/RichTextEditor';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Send, Eye } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, WikiPageResponse, rewriteWikiMediaUrls, normalizeWikiMediaUrlsToRelative, WikiFolderResponse } from '@/services/api';
import { useToast } from '@/context/ToastContext';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<object>> {
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

export default function WikiPageEdit() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { id } = router.query;
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorJson, setEditorJson] = useState<string>('');
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [page, setPage] = useState<WikiPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [folders, setFolders] = useState<WikiFolderResponse[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'PRIVATE' | 'TEAM' | 'PUBLIC'>('PRIVATE');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (id) {
      loadPage();
    }
  }, [id]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const result = await wikiApi.getAllFolders();
        setFolders(result);
      } catch (err) {
        console.error('Failed to load wiki folders:', err);
      }
    };
    loadFolders();
  }, []);

  const loadPage = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const pageData = await wikiApi.getPageById(Number(id));
      setPage(pageData);
      setTitle(pageData.title);
      setSelectedFolderId(pageData.folderId ?? null);
      if (
        pageData.visibility === 'PUBLIC' ||
        pageData.visibility === 'TEAM' ||
        pageData.visibility === 'PRIVATE'
      ) {
        setSelectedVisibility(pageData.visibility);
      }

      if (pageData.contentHtml) {
        setEditorContent(rewriteWikiMediaUrls(pageData.contentHtml));
      }
    } catch (err) {
      console.error('Failed to load wiki page:', err);
      addToast('error', err instanceof Error ? err.message : 'Failed to load wiki page');
      router.push('/wiki');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorReady = useCallback((editor: unknown) => {
    setEditorInstance(editor);
  }, []);

  const handleContentChange = useCallback((content: string, json: string) => {
    setEditorContent(content);
    setEditorJson(json);
    setHasUnsavedChanges(true);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const normalizeJsonMediaUrls = (jsonString: string): string => {
    if (!jsonString) return jsonString;
    try {
      const doc = JSON.parse(jsonString);
      const walk = (node: any) => {
        if (!node) return;
        if (node.type === 'image' && node.attrs && typeof node.attrs.src === 'string') {
          const originalSrc = node.attrs.src;
          const wrapped = `<img src="${originalSrc}">`;
          const normalized = normalizeWikiMediaUrlsToRelative(wrapped);
          const match = normalized.match(/src="([^"]*)"/);
          if (match) node.attrs.src = match[1];
        }
        if (Array.isArray(node.content)) node.content.forEach(walk);
        if (Array.isArray(node.marks)) node.marks.forEach((m: any) => { if (m.attrs && typeof m.attrs.href === 'string') { const wrapped = `<a href="${m.attrs.href}"></a>`; const n = normalizeWikiMediaUrlsToRelative(wrapped); const m2 = n.match(/href="([^"]*)"/); if (m2) m.attrs.href = m2[1]; } });
      };
      walk(doc);
      return JSON.stringify(doc);
    } catch {
      return jsonString;
    }
  };

  const flattenFolders = (
    folderList: WikiFolderResponse[],
    depth: number
  ): Array<{ id: number; name: string; depth: number }> => {
    const result: Array<{ id: number; name: string; depth: number }> = [];
    for (const folder of folderList) {
      result.push({ id: folder.id, name: folder.name, depth });
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFolders(folder.children, depth + 1));
      }
    }
    return result;
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      addToast('error', 'Please enter a title');
      return;
    }

    if (!id) return;

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      const normalizedHtml = normalizeWikiMediaUrlsToRelative(editorContent);
      const normalizedJson = normalizeJsonMediaUrls(editorJson);

      const pageData = {
        title: title.trim(),
        contentHtml: normalizedHtml,
        contentJson: normalizedJson,
        isPublished: publish,
        folderId: selectedFolderId ?? undefined,
        visibility: selectedVisibility,
      };

      await wikiApi.updatePage(Number(id), pageData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      if (publish) {
        addToast('success', 'Document published successfully!');
        router.push(`/wiki/${id}`);
      } else {
        addToast('success', 'Document saved as draft');
      }
    } catch (err) {
      console.error('Failed to save document:', err);
      addToast('error', err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <button
            onClick={() => router.push('/wiki')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Wiki</span>
          </button>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {formatLastSaved()}
              </span>
            )}

            <button
              onClick={() => router.push(`/wiki/${id}`)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isSaving ? 'Saving...' : 'Save Draft'}
              </span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPublishing ? 'Publishing...' : 'Publish'}
              </span>
            </button>

            <button
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="flex items-center justify-center p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              {isRightPanelCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 70% Width */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isRightPanelCollapsed ? 'w-full' : 'w-[70%]'}`}>
            <div className="px-8 py-6 flex flex-col h-full" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Document Title */}
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter document title..."
                className="w-full text-2xl font-bold text-gray-800 border-0 px-0 py-2 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400"
              />

              {/* Author Info */}
              <div className="text-sm text-gray-500">
                <span className="font-medium">Author:</span> {page?.lastModifiedByName || user?.name || 'Unknown User'}
                {hasUnsavedChanges && (
                  <span className="ml-2 text-yellow-600">(unsaved changes)</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Folder (optional)</label>
                  <select
                    value={selectedFolderId ?? ''}
                    onChange={e => {
                      setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Root (no folder) —</option>
                    {flattenFolders(folders, 0).map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {'— '.repeat(opt.depth)}
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    value={selectedVisibility}
                    onChange={e => {
                      setSelectedVisibility(e.target.value as 'PRIVATE' | 'TEAM' | 'PUBLIC');
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PRIVATE">Private — Only you</option>
                    <option value="TEAM">Team — Team members only</option>
                    <option value="PUBLIC">Public — All organization users</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Controls who can view and edit this document.</p>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Document Body */}
              <div className="flex-1 min-h-[500px] mt-4">
                <RichTextEditor
                  value={editorContent}
                  onChange={handleContentChange}
                  placeholder="Start writing your document... You can add text, create tables, insert images, and more."
                  data-testid="wiki-document-editor"
                  onReady={handleEditorReady}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - 30% Width */}
          <div className={`${isRightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[30%]'} transition-all duration-300 border-l border-gray-200 flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentOutline editor={editorInstance} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
