import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Download, ChevronDown, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import PatentInventorInput from '@/components/patents/PatentInventorInput';
import { patentApi, patentSettingsApi, type PatentDetailResponse, type PatentTemplateResponse, type PatentGuideResponse } from '@/services/api';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: {} };
}

/** Create page; doubles as the creator edit page via /patents/new?id={id} (SUBMITTED only). */
export default function PatentNew() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const editId = router.query.id ? Number(router.query.id) : null;
  const isEdit = editId !== null && !Number.isNaN(editId);

  const [title, setTitle] = useState('');
  const [inventors, setInventors] = useState<string[]>([]);
  const [patentCategory, setPatentCategory] = useState<'INVENTION' | 'UTILITY_MODEL' | 'DESIGN'>('INVENTION');
  const [file, setFile] = useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(isEdit);

  // Disclosure template download entry.
  const [templates, setTemplates] = useState<PatentTemplateResponse[]>([]);
  const [showTemplateList, setShowTemplateList] = useState(false);
  // Guide doc reading entry (opens /wiki/{id} in a new tab).
  const [guide, setGuide] = useState<PatentGuideResponse | null>(null);

  // Drag & drop highlight state for the disclosure upload zone.
  const [dragActive, setDragActive] = useState(false);

  // Close the template dropdown on outside clicks.
  const templateDropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showTemplateList) return;
    const handler = (e: MouseEvent) => {
      if (templateDropRef.current && !templateDropRef.current.contains(e.target as Node)) {
        setShowTemplateList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTemplateList]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Templates and guide doc are the same for everyone; failures are non-fatal.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    patentSettingsApi.listTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
    patentSettingsApi.getGuide()
      .then((g) => setGuide(g || null))
      .catch(() => setGuide(null));
  }, [authLoading, isAuthenticated]);

  // Prefill in edit mode.
  useEffect(() => {
    if (!isEdit || !isAuthenticated || authLoading) return;
    (async () => {
      try {
        const detail: PatentDetailResponse = await patentApi.getById(editId as number);
        // Creator may edit while SUBMITTED; patent admins may edit in any status
        // (agency rewrites title after reception).
        const adminCanEdit = detail.viewerIsPatentAdmin;
        const creatorCanEdit = detail.viewerIsCreator && detail.status === 'SUBMITTED';
        if (!adminCanEdit && !creatorCanEdit) {
          addToast('error', t('patents.error.forbidden'));
          router.replace(`/patents/${editId}`);
          return;
        }
        setTitle(detail.title);
        setInventors(detail.inventors || []);
        if (detail.patentCategory) {
          setPatentCategory(detail.patentCategory as typeof patentCategory);
        }
        setCurrentFileName(
          detail.attachments.find((a) => a.category === 'DISCLOSURE')?.fileName || null
        );
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : t('patents.detail.loadFailed'));
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [isEdit, isAuthenticated, authLoading, editId, t, addToast, router]);

  const validateFile = (f: File | null): string | null => {
    if (!f) {
      return isEdit ? null : t('patents.new.disclosureRequired');
    }
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.doc' && ext !== '.docx') {
      return t('patents.error.fileNotAllowed');
    }
    if (f.size > 100 * 1024 * 1024) {
      return t('patents.error.fileTooLarge');
    }
    return null;
  };

  const acceptFile = (f: File | null) => {
    setFile(f);
    setFileError(validateFile(f));
  };

  const handleDownloadTemplate = async (tpl: PatentTemplateResponse) => {
    try {
      await patentSettingsApi.downloadTemplate(tpl.id, tpl.fileName);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      addToast('error', t('patents.new.titleRequired'));
      return;
    }
    if (inventors.length === 0) {
      addToast('error', t('patents.new.inventorsRequired'));
      return;
    }
    const err = validateFile(file);
    setFileError(err);
    if (err) return;

    setSubmitting(true);
    try {
      const detail = isEdit
        ? await patentApi.update(editId as number, title.trim(), inventors, file, patentCategory)
        : await patentApi.create(title.trim(), inventors, file as File, patentCategory);
      router.push(`/patents/${detail.id}`);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : t('patents.error.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">
            {isEdit ? t('patents.new.editTitle') : t('patents.new.title')}
          </h1>
          {guide && (
            <a
              href={`/wiki/${guide.wikiPageId}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{t('patents.settings.guideTitle')}</span>
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('patents.new.patentName')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('patents.new.patentNamePlaceholder')}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                />
                <select
                  value={patentCategory}
                  onChange={(e) => setPatentCategory(e.target.value as typeof patentCategory)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400 text-gray-700 bg-white"
                  title={t('patents.new.category')}
                >
                  <option value="INVENTION">{t('patents.new.categoryInvention')}</option>
                  <option value="UTILITY_MODEL">{t('patents.new.categoryUtilityModel')}</option>
                  <option value="DESIGN">{t('patents.new.categoryDesign')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('patents.new.inventors')} <span className="text-red-500">*</span>
              </label>
              <PatentInventorInput value={inventors} onChange={setInventors} />
              <p className="mt-1 text-xs text-gray-500">{t('patents.new.inventorsHint')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('patents.new.disclosure')} <span className="text-red-500">*</span>
                </label>
                {templates.length > 0 && (
                  <div className="relative" ref={templateDropRef}>
                    <button
                      onClick={() => setShowTemplateList(!showTemplateList)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">{t('patents.new.downloadTemplate')}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showTemplateList ? 'rotate-180' : ''}`} />
                    </button>
                    {showTemplateList && (
                      <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        {templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            onClick={() => handleDownloadTemplate(tpl)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50"
                            title={tpl.fileName}
                          >
                            <Download className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-xs text-gray-700 truncate flex-1">{tpl.fileName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isEdit && currentFileName && !file && (
                <p className="mb-2 text-xs text-gray-500">
                  {t('patents.new.currentFile')}: {currentFileName}
                </p>
              )}
              <label
                className={`flex items-center gap-2 px-2 py-1.5 border border-dashed rounded cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-gray-600 bg-gray-100'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const dropped = e.dataTransfer.files?.[0] || null;
                  acceptFile(dropped);
                }}
              >
                <Upload className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-600 truncate">
                  {file
                    ? file.name
                    : isEdit
                      ? t('patents.new.replace')
                      : `${t('patents.new.dragHere')} ${t('patents.new.clickToBrowse')}`}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".doc,.docx"
                  onChange={(e) => {
                    acceptFile(e.target.files?.[0] || null);
                  }}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">{t('patents.new.disclosureHint')}</p>
              {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('patents.new.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || loadingDetail}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('patents.new.submitting') : t('patents.new.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
