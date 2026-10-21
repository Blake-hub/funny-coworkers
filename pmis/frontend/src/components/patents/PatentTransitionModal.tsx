import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload } from 'lucide-react';
import {
  patentApi,
  type AllowedTransitionResponse,
  type PatentDetailResponse,
} from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface PatentTransitionModalProps {
  patentId: number;
  transition: AllowedTransitionResponse;
  onClose: () => void;
  onDone: (detail: PatentDetailResponse) => void;
}

/** Admin status transition dialog driven by AllowedTransitionDTO from the backend. */
export default function PatentTransitionModal({
  patentId,
  transition,
  onClose,
  onDone,
}: PatentTransitionModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [eventDate, setEventDate] = useState(today);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [applicationType, setApplicationType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  // Drag & drop highlight state for the attachment upload zone.
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (transition.requiresApplicationTypeConfirm) {
      setApplicationType('STANDARD');
    }
  }, [transition.requiresApplicationTypeConfirm]);

  const validateFile = (f: File | null): string | null => {
    if (!f) {
      return transition.requiresAttachment ? t('patents.transition.attachmentRequired') : null;
    }
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
    if (!allowed.includes(ext)) {
      return t('patents.error.fileNotAllowed');
    }
    if (f.size > 100 * 1024 * 1024) {
      return t('patents.error.fileTooLarge');
    }
    return null;
  };

  const handleSubmit = async () => {
    if (transition.requiresApplicationNumber && !applicationNumber.trim()) {
      addToast('error', t('patents.transition.applicationNumberRequired'));
      return;
    }
    if (transition.requiresCertificateNumber && !certificateNumber.trim()) {
      addToast('error', t('patents.transition.certificateNumberRequired'));
      return;
    }
    const err = validateFile(file);
    setFileError(err);
    if (err) return;

    setSubmitting(true);
    try {
      const detail = await patentApi.transition(
        patentId,
        {
          toStatus: transition.toStatus,
          eventDate,
          applicationNumber: applicationNumber.trim() || undefined,
          certificateNumber: certificateNumber.trim() || undefined,
          applicationType: applicationType || undefined,
        },
        file
      );
      onDone(detail);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : t('patents.error.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">{t('patents.transition.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t('patents.transition.target')}
            </label>
            <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
              {t(`patents.status.${transition.toStatus}`)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t('patents.transition.eventDate')}
            </label>
            <input
              type="date"
              value={eventDate}
              max={today}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
            />
          </div>

          {transition.requiresApplicationNumber && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('patents.transition.applicationNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicationNumber}
                onChange={(e) => setApplicationNumber(e.target.value)}
                placeholder={t('patents.transition.applicationNumberRequired')}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          {transition.requiresCertificateNumber && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('patents.transition.certificateNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder={t('patents.transition.certificateNumberRequired')}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          {transition.requiresApplicationTypeConfirm && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('patents.transition.confirmType')} <span className="text-red-500">*</span>
              </label>
              <select
                value={applicationType}
                onChange={(e) => setApplicationType(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              >
                <option value="STANDARD">{t('patents.type.STANDARD')}</option>
                <option value="PRIORITY">{t('patents.type.PRIORITY')}</option>
                <option value="PREEMPTIVE">{t('patents.type.PREEMPTIVE')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('patents.transition.confirmTypeHint')}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {t('patents.transition.attachment')}
              {transition.requiresAttachment && <span className="text-red-500"> *</span>}
            </label>
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
                setFile(dropped);
                setFileError(validateFile(dropped));
              }}
            >
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {file
                  ? file.name
                  : `${t('patents.new.dragHere')} ${t('patents.new.clickToBrowse')}`}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".zip,.rar,.7z,.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setFileError(validateFile(f));
                }}
              />
            </label>
            {transition.requiresAttachment && (
              <p className="mt-1 text-xs text-red-500">{t('patents.transition.attachmentRequired')}</p>
            )}
            {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {t('patents.transition.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('patents.transition.submitting') : t('patents.transition.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
