import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bot,
  Download,
  FileText,
  History as HistoryIcon,
  Pencil,
  Send,
  Undo2,
  FileBadge,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import PatentProgressDiagram from '@/components/patents/PatentProgressDiagram';
import PatentTransitionModal from '@/components/patents/PatentTransitionModal';
import {
  patentApi,
  type AllowedTransitionResponse,
  type PatentDetailResponse,
} from '@/services/api';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: {} };
}

const ABNORMAL_STATUSES = new Set(['CANCELLED', 'REJECTED', 'DEEMED_WITHDRAWN', 'WITHDRAWN']);

function statusPillClass(status: string): string {
  if (status === 'GRANTED') return 'bg-green-100 text-green-700';
  if (ABNORMAL_STATUSES.has(status)) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function fmtDateTime(value?: string | null): string {
  return value ? value.slice(0, 16).replace('T', ' ') : '-';
}

function fmtFileSize(size?: number | null): string {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function PatentDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const id = Number(router.query.id);

  const [detail, setDetail] = useState<PatentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTransition, setActiveTransition] = useState<AllowedTransitionResponse | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (Number.isNaN(id)) return;
    setIsLoading(true);
    try {
      const d = await patentApi.getById(id);
      setDetail(d);
      setNotFound(false);
    } catch (err) {
      setNotFound(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDetail();
    }
  }, [authLoading, isAuthenticated, fetchDetail]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleUndo = async () => {
    if (!detail) return;
    if (!window.confirm(t('patents.transition.undoConfirm'))) return;
    setBusy(true);
    try {
      const d = await patentApi.undoTransition(detail.id);
      setDetail(d);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setBusy(false);
    }
  };

  // Two-step delete: first click arms the button, second click executes.
  const handleDelete = async () => {
    if (!detail) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    try {
      await patentApi.delete(detail.id);
      router.push('/patents');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const handleSendComment = async () => {
    if (!detail || !comment.trim()) return;
    setSending(true);
    try {
      const d = await patentApi.addComment(detail.id, comment.trim());
      setDetail(d);
      setComment('');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    if (!detail) return;
    try {
      await patentApi.downloadAttachment(detail.id, attachmentId, fileName);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    }
  };

  const canUndo =
    detail?.viewerIsPatentAdmin &&
    (detail.history?.length || 0) > 0 &&
    !detail.history![0].undone;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center gap-2">
          <button
            onClick={() => router.push('/patents')}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label={t('patents.detail.backToList')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold text-gray-800 truncate">
            {isLoading ? '…' : detail ? detail.title : t('patents.detail.notFound')}
          </h1>
          {detail?.originalTitle && detail.originalTitle !== detail.title && (
            <span
              title={`${t('patents.detail.originalTitle')}: ${detail.originalTitle}`}
              className="hidden md:inline text-xs text-gray-400 border-l border-gray-200 pl-2"
            >
              {t('patents.detail.originalTitle')}: {detail.originalTitle}
            </span>
          )}
          {detail && (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusPillClass(detail.status)}`}>
              {t(`patents.status.${detail.status}`)}
            </span>
          )}
          <div className="flex-1" />
          {detail?.viewerIsPatentAdmin && (
            <button
              onClick={() => router.push(`/patents/new?id=${detail.id}`)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{t('patents.detail.edit')}</span>
            </button>
          )}
          {detail?.viewerIsCreator && detail.status === 'WITHDRAWN' && !detail?.viewerIsPatentAdmin && (
            <button
              onClick={() => router.push(`/patents/new?id=${detail.id}`)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{t('patents.detail.edit')}</span>
            </button>
          )}
          {detail && (detail.viewerIsCreator || detail.viewerIsPatentAdmin) && detail.status === 'WITHDRAWN' && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex items-center gap-1 px-2 py-1 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">{confirmDelete ? t('patents.detail.deleteConfirm') : t('patents.detail.delete')}</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-400 py-16">…</div>
          ) : !detail ? (
            <div className="text-center text-gray-400 py-16">{t('patents.detail.notFound')}</div>
          ) : (
            <>
              {/* Basic info */}
              <section className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-800 mb-3">
                  {t('patents.detail.basicInfo')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.col.applicationType')}</div>
                    <div className="text-gray-800">{detail.applicationType ? t(`patents.type.${detail.applicationType}`) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.detail.category')}</div>
                    <div className="text-gray-800">{t(`patents.new.category${detail.patentCategory === 'INVENTION' ? 'Invention' : detail.patentCategory === 'UTILITY_MODEL' ? 'UtilityModel' : 'Design'}`)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.col.inventors')}</div>
                    <div className="text-gray-800">{detail.inventors.join('、')}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.detail.creator')}</div>
                    <div className="text-gray-800">{detail.creatorName || detail.creatorId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.col.submitDate')}</div>
                    <div className="text-gray-800">{(detail.submitDate || '-').slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.detail.applicationNumber')}</div>
                    <div className="text-gray-800">{detail.applicationNumber || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('patents.detail.certificateNumber')}</div>
                    <div className="text-gray-800">{detail.certificateNumber || '-'}</div>
                  </div>
                </div>
              </section>

              {/* Progress diagram */}
              <section>
                <h2 className="text-sm font-medium text-gray-800 mb-2">
                  {t('patents.detail.progress')}
                </h2>
                <PatentProgressDiagram status={detail.status} applicationType={detail.applicationType} />
              </section>

              {/* Status actions (patent admins; creators may withdraw while SUBMITTED) */}
              {detail.allowedTransitions.length > 0 && (
                <section className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="text-sm font-medium text-gray-800 mb-3">
                    {t('patents.detail.statusActions')}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {detail.allowedTransitions.map((tr) => (
                      <button
                        key={tr.toStatus}
                        onClick={() => setActiveTransition(tr)}
                        disabled={busy}
                        className={`px-2 py-1 text-xs rounded border disabled:opacity-50 ${
                          tr.toStatus === 'WITHDRAWN' || tr.toStatus === 'REJECTED' || tr.toStatus === 'DEEMED_WITHDRAWN' || tr.toStatus === 'CANCELLED'
                            ? 'text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50'
                            : 'text-gray-700 border-gray-200 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {detail.status === 'WITHDRAWN' && tr.toStatus === 'SUBMITTED'
                          ? t('patents.detail.resubmit')
                          : t(`patents.status.${tr.toStatus}`)}
                      </button>
                    ))}
                    {canUndo && (
                      <button
                        onClick={handleUndo}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        <Undo2 className="w-3 h-3" />
                        {t('patents.transition.undo')}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Attachments */}
              <section className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-800 mb-3">
                  {t('patents.detail.attachments')}
                </h2>
                {detail.attachments.length === 0 ? (
                  <div className="text-sm text-gray-400">{t('patents.detail.noAttachments')}</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {detail.attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            att.category === 'DISCLOSURE'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {att.category === 'DISCLOSURE' ? (
                            <FileText className="w-3 h-3" />
                          ) : (
                            <FileBadge className="w-3 h-3" />
                          )}
                          {t(`patents.attachment.${att.category}`)}
                        </span>
                        <span className="text-sm text-gray-700 truncate flex-1">{att.fileName}</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {fmtFileSize(att.fileSize)}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap hidden md:inline">
                          {att.uploadedByName || att.uploadedBy} · {fmtDateTime(att.uploadedAt)}
                        </span>
                        <button
                          onClick={() => handleDownload(att.id, att.fileName)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {t('patents.detail.download')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Status history */}
              {detail.history.length > 0 && (
                <section className="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 mb-3">
                    <HistoryIcon className="w-3.5 h-3.5 text-gray-500" />
                    {t('patents.detail.history')}
                  </h2>
                  <ul className="space-y-2">
                    {detail.history.map((h) => (
                      <li
                        key={h.id}
                        className={`text-sm flex flex-wrap items-center gap-2 ${
                          h.undone ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xs text-gray-400">{fmtDateTime(h.createdAt)}</span>
                        <span>
                          {h.operatorName || h.operatorId}: {t(`patents.status.${h.fromStatus ?? 'INITIAL'}`)}
                          {' → '}
                          {t(`patents.status.${h.toStatus}`)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {t('patents.transition.eventDate')}: {h.eventDate}
                        </span>
                        {h.undone && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 line-through">
                            {t('patents.transition.undo')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Comments */}
              <section className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-medium text-gray-800 mb-3">
                  {t('patents.detail.comments')}
                </h2>
                {detail.comments.length === 0 ? (
                  <div className="text-sm text-gray-400 mb-3">{t('patents.detail.noComments')}</div>
                ) : (
                  <ul className="space-y-3 mb-4">
                    {detail.comments.map((c) => (
                      <li key={c.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-0.5">
                          {c.isSystem ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Bot className="w-3.5 h-3.5" />
                              {t('patents.detail.systemRecord')}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-700">
                              {c.authorName || c.authorId}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{fmtDateTime(c.createdAt)}</span>
                        </div>
                        <div className={`rounded px-3 py-2 ${c.isSystem ? 'bg-gray-50 text-gray-500' : 'bg-gray-100 text-gray-800'}`}>
                          {c.content}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('patents.detail.commentPlaceholder')}
                    rows={2}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400 resize-none"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={sending || !comment.trim()}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-white bg-gray-600 hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('patents.detail.send')}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {detail && activeTransition && (
        <PatentTransitionModal
          patentId={detail.id}
          transition={activeTransition}
          onClose={() => setActiveTransition(null)}
          onDone={(d) => {
            setDetail(d);
            setActiveTransition(null);
          }}
        />
      )}
    </Layout>
  );
}
