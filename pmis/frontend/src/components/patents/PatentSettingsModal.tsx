import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Download, Trash2, FileText, ExternalLink, Unlink, Search, Plus } from 'lucide-react';
import {
  patentSettingsApi,
  wikiApi,
  type PatentTemplateResponse,
  type PatentGuideResponse,
  type WikiSearchResult,
} from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface PatentSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

function formatSize(bytes?: number | null): string {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '-';
}

/**
 * Merged patent settings dialog for patent admins:
 *  - disclosure template management (upload / download / delete)
 *  - controlled "patent writing guide" wiki page (link existing / create / unlink)
 */
export default function PatentSettingsModal({ open, onClose }: PatentSettingsModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();

  // ----- templates -----
  const [templates, setTemplates] = useState<PatentTemplateResponse[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- guide doc -----
  const [guide, setGuide] = useState<PatentGuideResponse | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideSearch, setGuideSearch] = useState('');
  const [guideResults, setGuideResults] = useState<WikiSearchResult[]>([]);
  const [guideSearching, setGuideSearching] = useState(false);
  const [guideSearched, setGuideSearched] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [guideBusy, setGuideBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setTemplatesLoading(true);
      setGuideLoading(true);
      try {
        const [tplList, guideInfo] = await Promise.all([
          patentSettingsApi.listTemplates(),
          patentSettingsApi.getGuide(),
        ]);
        setTemplates(tplList);
        setGuide(guideInfo || null);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
        console.error(err);
      } finally {
        setTemplatesLoading(false);
        setGuideLoading(false);
      }
    })();
  }, [open, t, addToast]);

  if (!open) return null;

  const refreshTemplates = async () => {
    setTemplates(await patentSettingsApi.listTemplates());
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await patentSettingsApi.uploadTemplate(file);
      await refreshTemplates();
      addToast('success', t('patents.settings.uploadSuccess'));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (tpl: PatentTemplateResponse) => {
    try {
      await patentSettingsApi.downloadTemplate(tpl.id, tpl.fileName);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    }
  };

  const handleDeleteTemplate = async (tpl: PatentTemplateResponse) => {
    if (!window.confirm(t('patents.settings.tplDeleteConfirm'))) return;
    try {
      await patentSettingsApi.deleteTemplate(tpl.id);
      await refreshTemplates();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    }
  };

  const handleGuideSearch = async () => {
    const keyword = guideSearch.trim();
    if (!keyword) return;
    setGuideSearching(true);
    try {
      const res = await wikiApi.searchPages(keyword);
      setGuideResults(res.results || []);
      setGuideSearched(true);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setGuideSearching(false);
    }
  };

  const handleLinkGuide = async (pageId: number) => {
    setGuideBusy(true);
    try {
      const linked = await patentSettingsApi.linkGuide(pageId);
      setGuide(linked);
      setGuideSearch('');
      setGuideResults([]);
      setGuideSearched(false);
      addToast('success', t('patents.settings.guideLinked'));
    } catch (err) {
      addToast('error', t('patents.settings.guideLinkFailed') + (err instanceof Error ? err.message : ''));
    } finally {
      setGuideBusy(false);
    }
  };

  const handleCreateGuide = async () => {
    setGuideBusy(true);
    try {
      const created = await patentSettingsApi.createGuide(createTitle.trim() || undefined);
      setGuide(created);
      setCreateTitle('');
      addToast('success', t('patents.settings.guideLinked'));
    } catch (err) {
      addToast('error', t('patents.settings.guideLinkFailed') + (err instanceof Error ? err.message : ''));
    } finally {
      setGuideBusy(false);
    }
  };

  const handleUnlinkGuide = async () => {
    if (!window.confirm(t('patents.settings.guideUnlinkConfirm'))) return;
    setGuideBusy(true);
    try {
      await patentSettingsApi.unlinkGuide();
      setGuide(null);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setGuideBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">{t('patents.settings.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Templates section */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">{t('patents.settings.templatesTitle')}</h3>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />
                  {uploading ? t('patents.new.submitting') : t('patents.settings.upload')}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2">{t('patents.settings.templatesHint')}</p>

            {templatesLoading ? (
              <div className="text-sm text-gray-500 py-4 text-center">…</div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">{t('patents.settings.templatesEmpty')}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.settings.tplName')}</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.settings.tplSize')}</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.settings.tplUploader')}</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.settings.tplDate')}</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.settings.tplActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((tpl) => (
                    <tr key={tpl.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-800">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[240px]" title={tpl.fileName}>{tpl.fileName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">{formatSize(tpl.fileSize)}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{tpl.uploadedByName || '-'}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{fmtDate(tpl.uploadedAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownload(tpl)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                            title={t('patents.detail.download')}
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                            title={t('patents.admin.revoke')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Guide document section */}
          <section className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('patents.settings.guideTitle')}</h3>
            <p className="text-xs text-gray-400 mb-3">{t('patents.settings.guideLinkedHint')}</p>

            {guideLoading ? (
              <div className="text-sm text-gray-500 py-2 text-center">…</div>
            ) : guide ? (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 truncate" title={guide.title}>{guide.title}</span>
                  <span className="text-xs text-gray-400">#{guide.wikiPageId}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/wiki/${guide.wikiPageId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t('patents.settings.guideOpen')}
                  </a>
                  <button
                    onClick={handleUnlinkGuide}
                    disabled={guideBusy}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    <Unlink className="w-3 h-3" />
                    {t('patents.settings.guideUnlink')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded mb-3">
                {t('patents.settings.guideNone')}
              </div>
            )}

            {/* Link an existing page */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGuideSearch();
                    }}
                    placeholder={t('patents.settings.guideSearchPlaceholder')}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                  />
                </div>
                <button
                  onClick={handleGuideSearch}
                  disabled={guideSearching || !guideSearch.trim()}
                  className="px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  {t('patents.settings.guideSearchBtn')}
                </button>
              </div>
              {guideSearched && (
                <div className="mt-1.5 max-h-32 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded">
                  {guideResults.length === 0 ? (
                    <div className="text-xs text-gray-400 px-3 py-2">{t('patents.settings.guideSearchEmpty')}</div>
                  ) : (
                    guideResults.map((r) => (
                      <div key={r.id} className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-xs text-gray-700 truncate">{r.title}</span>
                        <button
                          onClick={() => handleLinkGuide(r.id)}
                          disabled={guideBusy}
                          className="text-xs text-gray-600 hover:bg-gray-100 rounded px-2 py-0.5 disabled:opacity-50"
                        >
                          {t('patents.settings.guideLink')}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Create a dedicated page */}
            <div className="mt-3 flex items-center gap-1.5">
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder={t('patents.settings.guideCreateTitlePlaceholder')}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
              <button
                onClick={handleCreateGuide}
                disabled={guideBusy}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                {t('patents.settings.guideCreate')}
              </button>
            </div>
          </section>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('patents.settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
