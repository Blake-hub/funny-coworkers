import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Columns, ShieldCheck, ChevronDown, Check, BookOpen, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import PatentAdminManageModal from '@/components/patents/PatentAdminManageModal';
import PatentSettingsModal from '@/components/patents/PatentSettingsModal';
import { patentApi, patentSettingsApi, type PatentListResponse, type PatentGuideResponse } from '@/services/api';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: {} };
}

/** Toggleable extra columns (default columns are always shown). */
const EXTRA_COLUMNS = [
  'applicationNumber',
  'certificateNumber',
  'receivedDate',
  'paidDate',
  'acceptedDate',
  'preliminaryPassedDate',
  'publishedDate',
  'priorityGrantedDate',
  'substantiveExamDate',
  'oaNotificationDate',
  'grantFeePaidDate',
  'grantedDate',
] as const;

type ExtraColumn = (typeof EXTRA_COLUMNS)[number];

const DEFAULT_VISIBLE: Record<ExtraColumn, boolean> = {
  applicationNumber: false,
  certificateNumber: false,
  receivedDate: false,
  paidDate: false,
  acceptedDate: true,
  preliminaryPassedDate: false,
  publishedDate: false,
  priorityGrantedDate: false,
  substantiveExamDate: false,
  oaNotificationDate: false,
  grantFeePaidDate: false,
  grantedDate: true,
};

const STORAGE_KEY = 'patent-column-prefs';

const ABNORMAL_STATUSES = new Set(['CANCELLED', 'REJECTED', 'DEEMED_WITHDRAWN', 'WITHDRAWN']);

function statusPillClass(status: string): string {
  if (status === 'GRANTED') return 'bg-green-100 text-green-700';
  if (ABNORMAL_STATUSES.has(status)) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function fmtDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '-';
}

export default function Patents() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [scope, setScope] = useState<'all' | 'mine' | 'granted'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PatentListResponse[]>([]);
  const [viewerIsPatentAdmin, setViewerIsPatentAdmin] = useState(false);
  const [guide, setGuide] = useState<PatentGuideResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showColumns, setShowColumns] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const [visibleColumns, setVisibleColumns] = useState<Record<ExtraColumn, boolean>>(DEFAULT_VISIBLE);

  // Restore column preferences from localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setVisibleColumns({ ...DEFAULT_VISIBLE, ...JSON.parse(raw) });
      }
    } catch {
      // Ignore malformed preferences.
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchPatents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await patentApi.list(query || undefined, scope);
      setItems(res.items || []);
      setViewerIsPatentAdmin(Boolean(res.viewerIsPatentAdmin));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [query, scope, t, addToast]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPatents();
    }
  }, [authLoading, isAuthenticated, fetchPatents]);

  // The guide doc reading entry is shown to everyone once configured.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      patentSettingsApi.getGuide()
        .then((g) => setGuide(g || null))
        .catch(() => setGuide(null));
    }
  }, [authLoading, isAuthenticated, showSettingsModal]);

  // Close the columns dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setShowColumns(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleColumn = (col: ExtraColumn) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [col]: !prev[col] };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const chips: Array<{ id: 'all' | 'mine' | 'granted'; label: string }> = [
    { id: 'all', label: t('patents.chips.all') },
    { id: 'mine', label: t('patents.chips.mine') },
    { id: 'granted', label: t('patents.chips.granted') },
  ];

  const extraVisible = EXTRA_COLUMNS.filter(
    (c) => visibleColumns[c] && c !== 'acceptedDate' && c !== 'grantedDate'
  );

  const cellValue = (p: PatentListResponse, col: ExtraColumn): string => {
    if (col === 'applicationNumber') return p.applicationNumber || '-';
    if (col === 'certificateNumber') return p.certificateNumber || '-';
    return fmtDate(p[col as keyof PatentListResponse] as string | null | undefined);
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">{t('patents.title')}</h1>
          <div className="flex items-center gap-1 shrink-0">
            {guide && (
              <a
                href={`/wiki/${guide.wikiPageId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{t('patents.settings.guideTitle')}</span>
              </a>
            )}
            {viewerIsPatentAdmin && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <Settings className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{t('patents.settings.title')}</span>
              </button>
            )}
            {viewerIsPatentAdmin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{t('patents.admin.title')}</span>
              </button>
            )}
            <div className="relative group">
              <button
                onClick={() => router.push('/patents/new')}
                className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                aria-label={t('patents.create')}
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="absolute top-full mt-1 right-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {t('patents.create')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter area */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1 shrink-0">
            {chips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setScope(chip.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  scope === chip.id
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="relative w-56">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setQuery(searchInput.trim());
                }}
                onBlur={() => setQuery(searchInput.trim())}
                placeholder={t('patents.searchPlaceholder')}
                className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>

            <div className="relative" ref={columnsRef}>
              <button
                onClick={() => setShowColumns(!showColumns)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <Columns className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">{t('patents.columns')}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showColumns ? 'rotate-180' : ''}`} />
              </button>
              {showColumns && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {t('patents.columns')}
                    </p>
                    <div className="space-y-1">
                      {EXTRA_COLUMNS.map((col) => (
                        <div
                          key={col}
                          onClick={() => toggleColumn(col)}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          <span className="text-sm text-gray-700">{t(`patents.col.${col}`)}</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center ${
                              visibleColumns[col] ? 'bg-gray-600 text-white' : 'border border-gray-300'
                            }`}
                          >
                            {visibleColumns[col] && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-w-full">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap w-14">
                    {t('patents.col.index')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t('patents.col.title')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t('patents.col.inventors')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t('patents.col.submitDate')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t('patents.col.status')}
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {t('patents.col.applicationType')}
                  </th>
                  {visibleColumns.acceptedDate && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {t('patents.col.acceptedDate')}
                    </th>
                  )}
                  {visibleColumns.grantedDate && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {t('patents.col.grantedDate')}
                    </th>
                  )}
                  {extraVisible.map((col) => (
                    <th
                      key={col}
                      className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                    >
                      {t(`patents.col.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/patents/${p.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{idx + 1}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-800">{p.title}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{p.inventors.join('、')}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{fmtDate(p.submitDate)}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusPillClass(p.status)}`}
                      >
                        {t(`patents.status.${p.status}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{p.applicationType ? t(`patents.type.${p.applicationType}`) : '—'}</span>
                    </td>
                    {visibleColumns.acceptedDate && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{fmtDate(p.acceptedDate)}</span>
                      </td>
                    )}
                    {visibleColumns.grantedDate && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{fmtDate(p.grantedDate)}</span>
                      </td>
                    )}
                    {extraVisible.map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{cellValue(p, col)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {(isLoading || items.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? '…' : t('patents.empty')}
                {!isLoading && items.length === 0 && (
                  <div className="text-xs text-gray-400 mt-1">{t('patents.emptyStateHint')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PatentAdminManageModal open={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <PatentSettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </Layout>
  );
}
