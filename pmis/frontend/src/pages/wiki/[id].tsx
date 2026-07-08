import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { ArrowLeft, Edit3, Clock, User, Send, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, WikiPageResponse, WikiCommentResponse, rewriteWikiMediaUrls } from '@/services/api';

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

export default function WikiPageView() {
  const router = useRouter();
  const { isAuthenticated, user: authUser } = useAuth();
  const { id } = router.query;
  const [page, setPage] = useState<WikiPageResponse | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<WikiCommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; level: number; text: string }>>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['all']));
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (id) {
      loadPage();
      loadComments();
    }
  }, [id]);

  const loadPage = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // First get the page metadata
      const pageData = await wikiApi.getPageById(Number(id));
      setPage(pageData);

      // Then get the HTML content and rewrite backend-relative URLs so images render
      const { contentHtml } = await wikiApi.getPageHtml(Number(id));
      setHtmlContent(rewriteWikiMediaUrls(contentHtml || ''));
    } catch (err) {
      console.error('Failed to load wiki page:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wiki page');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!htmlContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const newHeadings: Array<{ id: string; level: number; text: string; originalIndex: number }> = [];
    
    headingElements.forEach((el, index) => {
      const level = parseInt(el.tagName.charAt(1));
      const text = el.textContent || `Heading ${level}`;
      newHeadings.push({
        id: `heading-${index}`,
        level,
        text,
        originalIndex: index,
      });
    });

    setHeadings(newHeadings);

    requestAnimationFrame(() => {
      if (!contentRef.current) return;

      const domHeadings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      domHeadings.forEach((el, index) => {
        el.id = `heading-${index}`;
      });
    });
  }, [htmlContent]);

  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return;

    requestAnimationFrame(() => {
      const domHeadings = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      domHeadings?.forEach((el, index) => {
        el.id = `heading-${index}`;
      });
    });

    const timer = setTimeout(() => {
      const domHeadings = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      domHeadings?.forEach((el, index) => {
        el.id = `heading-${index}`;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [headings.length]);

  const scrollToHeading = (headingIndex: number) => {
    const targetHeading = headings[headingIndex];
    if (!targetHeading) return;

    setTimeout(() => {
      const domHeadings = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (domHeadings) {
        for (let i = 0; i < domHeadings.length; i++) {
          const el = domHeadings[i] as HTMLElement;
          if (el.textContent?.trim() === targetHeading.text.trim()) {
            const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
              let parent = element.parentElement;
              while (parent) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                  return parent;
                }
                parent = parent.parentElement;
              }
              return null;
            };

            const scrollContainer = findScrollContainer(el);
            if (scrollContainer) {
              const containerRect = scrollContainer.getBoundingClientRect();
              const elementRect = el.getBoundingClientRect();
              const targetScroll = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 20;
              
              scrollContainer.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
              });
            } else {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            break;
          }
        }
      }
    }, 100);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const buildTree = () => {
    const tree: Array<{ id: string; level: number; text: string; children: any[] }> = [];
    const stack: any[] = [];

    for (const heading of headings) {
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const node = {
        ...heading,
        children: [],
      };

      if (stack.length === 0) {
        tree.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    }

    return tree;
  };

  const TreeItem = ({ item, depth = 0 }: { item: any; depth?: number }) => (
    <div key={item.id}>
      <button
        onClick={() => {
          if (item.children.length > 0) {
            toggleExpand(item.id);
          }
          scrollToHeading(item.originalIndex);
        }}
        className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
      >
        <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">
          {item.children.length > 0 ? (
            expandedItems.has(item.id) ? (
              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )
          ) : (
            <span className="w-3" />
          )}
        </span>
        <span className={`flex-1 truncate text-sm ${item.level === 1 ? 'font-semibold' : ''}`}>
          {item.text}
        </span>
        <span className="text-xs text-gray-400">H{item.level}</span>
      </button>
      {item.children.length > 0 && expandedItems.has(item.id) && (
        <div>
          {item.children.map((child: any) => (
            <TreeItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const loadComments = async () => {
    if (!id) return;
    try {
      const commentsData = await wikiApi.getComments(Number(id));
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !authUser?.id) return;

    try {
      const createdComment = await wikiApi.createComment(Number(id), newComment.trim());
      setComments(prev => [...prev, createdComment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      alert('Failed to submit comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await wikiApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment');
    }
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/wiki')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Wiki</span>
          </button>

          <div className="flex items-center gap-2">
            {headings.length > 0 && (
              <button
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isRightPanelCollapsed ? 'Show Outline' : 'Hide Outline'}
              >
                {isRightPanelCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                )}
              </button>
            )}

            <button
              onClick={() => router.push(`/wiki/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push('/wiki')}
              className="text-blue-600 hover:underline"
            >
              Return to Wiki
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && page && (
          <div className="flex gap-0 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Main Content */}
            <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isRightPanelCollapsed ? 'w-full' : ''}`}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-8 py-6">
                  {/* Title */}
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">{page.title}</h1>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
                    {page.lastModifiedByName && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{page.lastModifiedByName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last modified: {formatDate(page.lastModifiedAt)}</span>
                    </div>
                    {!page.isPublished && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* HTML Content */}
                  <div
                    ref={contentRef}
                    className="wiki-content prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />

                  {/* Empty Content State */}
                  {!htmlContent && (
                    <div className="text-center text-gray-500 py-8">
                      This document has no content yet.
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border-t border-gray-200">
                  <div className="px-8 py-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Comments ({comments.length})
                    </h2>

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mb-6">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span className="text-sm font-medium">Post Comment</span>
                        </button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No comments yet. Be the first to comment!
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800 text-sm">
                                    {comment.userName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(comment.createdAt)}
                                  </div>
                                </div>
                              </div>
                              {Number(authUser?.id ?? 0) === Number(comment.userId) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed pl-10">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Outline Sidebar */}
            {headings.length > 0 && (
              <div className={`${isRightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[30%]'} transition-all duration-300 border-l border-gray-200 flex flex-col flex-shrink-0`}>
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Outline</h3>
                  <nav className="space-y-1">
                    {buildTree().map((item) => (
                      <TreeItem key={item.id} item={item} depth={0} />
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wiki Content Styles */}
      <style jsx global>{`
        .wiki-content h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937; }
        .wiki-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
        .wiki-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #4b5563; }
        .wiki-content p { margin-bottom: 1rem; line-height: 1.75; color: #374151; }
        .wiki-content ul, .wiki-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .wiki-content li { margin-bottom: 0.25rem; line-height: 1.75; }
        .wiki-content ul li { list-style-type: disc; }
        .wiki-content ol li { list-style-type: decimal; }
        .wiki-content blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .wiki-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
        .wiki-content pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .wiki-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .wiki-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .wiki-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .wiki-content th, .wiki-content td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .wiki-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .wiki-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .wiki-content a:hover {
          color: #2563eb;
        }
        .wiki-content .mention {
          background-color: #eef2ff;
          color: #4f46e5;
          border-radius: 4px;
          padding: 0.1rem 0.35rem;
          font-weight: 500;
          box-decoration-break: clone;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .wiki-content .mention:hover {
          background-color: #e0e7ff;
          color: #4338ca;
        }
      `}</style>
    </Layout>
  );
}
