import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import RichTextEditor, { DocumentOutline } from '@/components/RichTextEditor';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, CreateWikiPageRequest } from '@/services/api';
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

export default function NewDocument() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorJson, setEditorJson] = useState<string>('');
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleEditorReady = useCallback((editor: unknown) => {
    setEditorInstance(editor);
  }, []);

  const handleContentChange = useCallback((content: string, json: string) => {
    setEditorContent(content);
    setEditorJson(json);
  }, []);

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      addToast('error', 'Please enter a title');
      return;
    }

    if (publish) {
      setIsPublishing(true);
    } else {
      setIsSaving(true);
    }

    try {
      const pageData: CreateWikiPageRequest = {
        title: title.trim(),
        contentHtml: editorContent,
        contentJson: editorJson,
        isPublished: publish,
      };

      const userId = parseInt(user!.id, 10);
      if (isNaN(userId)) {
        addToast('error', 'Invalid user ID');
        return;
      }
      const created = await wikiApi.createPage(pageData, userId);
      setLastSaved(new Date());

      if (publish) {
        addToast('success', 'Document published successfully!');
        router.push(`/wiki/${created.id}`);
      } else {
        addToast('success', 'Document saved as draft');
        // Redirect to edit page after saving
        router.push(`/wiki/${created.id}/edit`);
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                className="w-full text-2xl font-bold text-gray-800 border-0 px-0 py-2 focus:ring-0 focus:outline-none bg-transparent placeholder-gray-400"
              />

              {/* Author Info */}
              <div className="text-sm text-gray-500">
                <span className="font-medium">Author:</span> {user?.name || 'Unknown User'}
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
