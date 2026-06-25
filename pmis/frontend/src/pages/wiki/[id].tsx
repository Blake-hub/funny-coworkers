import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { ArrowLeft, Edit3, Clock, User, Send, Trash2 } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { wikiApi, WikiPageResponse, WikiCommentResponse } from '@/services/api';

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

      // Then get the HTML content
      const { contentHtml } = await wikiApi.getPageHtml(Number(id));
      setHtmlContent(contentHtml);
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
      const createdComment = await wikiApi.createComment(Number(id), newComment.trim(), authUser.id);
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
      <div className="max-w-4xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/wiki')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Wiki</span>
          </button>

          <button
            onClick={() => router.push(`/wiki/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">Edit</span>
          </button>
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
                          {authUser?.id === comment.userId && (
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
      `}</style>
    </Layout>
  );
}
