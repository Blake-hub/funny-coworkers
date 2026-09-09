import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
const RichTextEditorEx = dynamic(() => import('@/components/RichTextEditor/RichTextEditorEx'), { ssr: false });
const DocumentOutlineEx = dynamic(() => import('@/components/RichTextEditor/RichTextEditorEx').then((mod) => ({ default: mod.DocumentOutlineEx })), { ssr: false });
import { ArrowLeft, ChevronLeft, ChevronRight, FolderOpen, Save, Send, Settings } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, CreateWikiPageRequest, UpdateWikiPageRequest, normalizeWikiMediaUrlsToRelative, WikiFolderResponse } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useTranslation } from 'react-i18next';

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

export default function NewDocumentEx() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorJson, setEditorJson] = useState<string>('');
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [folders, setFolders] = useState<WikiFolderResponse[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'PRIVATE' | 'TEAM' | 'PUBLIC'>('PRIVATE');
  const [titleError, setTitleError] = useState<string | null>(null);
  
  // New state for enhanced save features
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSave, setIsAutoSave] = useState(false);
  const [savedPageId, setSavedPageId] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const [showFolderVisibilityModal, setShowFolderVisibilityModal] = useState(false);
  const [fvError, setFvError] = useState<string | null>(null);

  const handleEditorReady = useCallback((editor: unknown) => {
    setEditorInstance(editor);
  }, []);

  const handleContentChange = useCallback((content: string, json: string) => {
    setEditorContent(content);
    setEditorJson(json);
    if (!isInitialMount.current) {
      setIsDirty(true);
    }
  }, []);

  // Mark initial mount as complete after first content change
  useEffect(() => {
    if (editorContent && editorContent.length > 0) {
      isInitialMount.current = false;
    }
  }, [editorContent]);

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

  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.folderId;
    if (raw == null) return;
    const folderId = Number(raw);
    if (!Number.isFinite(folderId) || folderId <= 0) return;
    setSelectedFolderId(folderId);
    const { folderId: _strip, ...rest } = router.query;
    router.replace({
      pathname: '/wiki/new-document-ex',
      query: rest,
    }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.folderId]);

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

  const handleSave = async (publish: boolean = false, autoSave: boolean = false) => {
    if (!title.trim()) {
      if (!autoSave) {
        addToast('error', t('nav.documentTitleEmpty'));
      }
      return;
    }

    setTitleError(null);

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
      setIsAutoSave(autoSave);
    }

    try {
      // Fallback: read content directly from editor instance if state is empty
      const editor = editorInstance as any;
      const html = editorContent || (editor?.getHTML ? editor.getHTML() : '');
      const json = editorJson || (editor?.getJSON ? JSON.stringify(editor.getJSON()) : '');

      const normalizedHtml = normalizeWikiMediaUrlsToRelative(html);
      const normalizedJson = normalizeJsonMediaUrls(json);

      console.log('handleSave content:', {
        htmlLength: normalizedHtml.length,
        jsonLength: normalizedJson.length,
        preview: normalizedHtml.substring(0, 100)
      });

      if (savedPageId) {
        // Update existing page
        const updateData: UpdateWikiPageRequest = {
          title: title.trim(),
          contentHtml: normalizedHtml,
          contentJson: normalizedJson,
          isPublished: publish,
          folderId: selectedFolderId ?? undefined,
          visibility: selectedVisibility,
        };

        const updated = await wikiApi.updatePage(savedPageId, updateData);
        setLastSaved(new Date());
        setIsDirty(false);

        if (publish) {
          addToast('success', t('wiki.published'));
          router.push(`/wiki/${updated.id}`);
        } else {
          if (!autoSave) {
            addToast('success', t('wiki.savedAsDraft'));
            router.push(`/wiki/${updated.id}/edit-ex`);
          }
        }
      } else {
        // Create new page
        const pageData: CreateWikiPageRequest = {
          title: title.trim(),
          contentHtml: normalizedHtml,
          contentJson: normalizedJson,
          isPublished: publish,
          folderId: selectedFolderId ?? undefined,
          visibility: selectedVisibility,
        };

        const created = await wikiApi.createPage(pageData);
        setSavedPageId(created.id);
        setLastSaved(new Date());
        setIsDirty(false);

        if (publish) {
          addToast('success', t('wiki.published'));
          router.push(`/wiki/${created.id}`);
        } else {
          if (!autoSave) {
            addToast('success', t('wiki.savedAsDraft'));
            router.push(`/wiki/${created.id}/edit-ex`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to save document:', err);
      if (!autoSave) {
        const msg = err instanceof Error ? err.message : t('wiki.saveFailed');
        const lower = msg.toLowerCase();
        const isNameConflict =
          (lower.includes('already exists') || lower.includes('already in use')) &&
          (lower.includes('title') || lower.includes('name') || lower.includes("'") ||
            lower.includes('page') || lower.includes('folder') || lower.includes('document'));
        if (isNameConflict) {
          setTitleError(msg);
        } else {
          addToast('error', msg);
        }
      }
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
      setIsAutoSave(false);
    }
  };

  // Auto-save feature: save automatically when content changes with 3-second debounce
  useEffect(() => {
    if (!isDirty || isSaving || isPublishing) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (title.trim() && isDirty) {
        handleSave(false, true);
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, isSaving, isPublishing, title, editorContent, editorJson, selectedFolderId, selectedVisibility]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving && !isPublishing) {
          handleSave(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSaving, isPublishing, title, editorContent, editorJson, selectedFolderId, selectedVisibility]);

  // Confirm before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <button
            onClick={() => router.push('/wiki')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t('wiki.backToWiki')}</span>
          </button>

          {selectedFolderId != null && (() => {
            const flat = flattenFolders(folders, 0);
            const match = flat.find(f => f.id === selectedFolderId);
            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium max-w-[200px] truncate">
                  {match ? match.name : t('wiki.folder')}
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-3">
            {/* Dirty indicator */}
            {isDirty && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                {t('wiki.unsaved')}
              </span>
            )}

            {/* Auto-save indicator */}
            {isAutoSave && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4zm2 5.3l2.6 2.6C7.5 21.5 12 24 12 24v-4c-3.3 0-6.2-1.5-8-4z" />
                </svg>
                {t('wiki.saving')}
              </span>
            )}

            {lastSaved && !isDirty && (
              <span className="text-sm text-gray-500">
                Last saved: {formatLastSaved()}
              </span>
            )}

            {lastSaved && isDirty && (
              <span className="text-sm text-gray-400">
                Last saved: {formatLastSaved()}
              </span>
            )}

            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Save Draft (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isSaving ? t('wiki.saving') : t('wiki.save')}
              </span>
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPublishing ? t('wiki.publishing') : t('wiki.publish')}
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

            <button
              onClick={() => {
                setShowFolderVisibilityModal(true);
                setFvError(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={t('wiki.folderVisibilityTitle')}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">{t('wiki.settings')}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isRightPanelCollapsed ? 'w-full' : 'w-[70%]'}`}>
            <div className="px-8 py-2 flex flex-col h-full" style={{ height: 'calc(100vh - 200px)' }}>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                placeholder={t('nav.documentTitlePlaceholder')}
                className={`w-full text-2xl font-bold text-gray-800 border-0 px-0 py-2 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400 ${
                  titleError ? 'ring-0' : ''
                }`}
              />
              {titleError && (
                <div className="mt-1 text-sm text-red-600">{titleError}</div>
              )}

              <div className="text-sm text-gray-500">
                <span className="font-medium">{t('wiki.author')}:</span> {user?.name || t('nav.unknownUser')}
              </div>

              <hr className="border-gray-200" />

              <div className="flex-1 min-h-[500px] mt-4">
                <RichTextEditorEx
                  value={editorContent}
                  onChange={handleContentChange}
                  placeholder="Start writing your document... You can add text, create tables, insert images, and more."
                  data-testid="wiki-document-editor-ex"
                  onReady={handleEditorReady}
                />
              </div>
            </div>
          </div>

          <div className={`${isRightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[30%]'} transition-all duration-300 border-l border-gray-200 flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentOutlineEx editor={editorInstance} />
            </div>
          </div>
        </div>
      </div>

      {showFolderVisibilityModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center"
            onClick={() => {
              setShowFolderVisibilityModal(false);
              setFvError(null);
            }}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-[420px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{t('wiki.folderVisibilityTitle')}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {title || t('nav.untitled')}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wiki.folder')}</label>
                  <select
                    value={selectedFolderId ?? ''}
                    onChange={(e) => {
                      setSelectedFolderId(e.target.value ? Number(e.target.value) : null);
                      if (fvError) setFvError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">{t('wiki.rootFolder')}</option>
                    {flattenFolders(folders, 0).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {'— '.repeat(opt.depth)}
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wiki.visibility')}</label>
                  <select
                    value={selectedVisibility}
                    onChange={(e) => {
                      setSelectedVisibility(e.target.value as 'PRIVATE' | 'TEAM' | 'PUBLIC');
                      if (fvError) setFvError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="PRIVATE">{t('wiki.visPrivate')}</option>
                    <option value="TEAM">{t('wiki.visTeam')}</option>
                    <option value="PUBLIC">{t('wiki.visPublic')}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t('wiki.visibilityHint')}</p>
                </div>

                {fvError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {fvError}
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderVisibilityModal(false);
                    setFvError(null);
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderVisibilityModal(false);
                    setFvError(null);
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}