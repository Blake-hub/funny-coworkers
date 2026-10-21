import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, CornerDownRight, RotateCw } from 'lucide-react';
import type { PatentDetailResponse } from '@/services/api';

interface PatentProgressDiagramProps {
  status: string;
  applicationType: string;
}

const ABNORMAL = new Set(['CANCELLED', 'REJECTED', 'DEEMED_WITHDRAWN', 'WITHDRAWN']);
const TERMINAL_OK = new Set(['GRANTED']);

/** Horizontal wireframe progress diagram; branch row under SUBSTANTIVE_EXAM. */
export default function PatentProgressDiagram({ status, applicationType }: PatentProgressDiagramProps) {
  const { t } = useTranslation();
  const st = (s: string) => t(`patents.status.${s}`);

  const mainLine = ['SUBMITTED', 'RECEIVED', 'PAID', 'ACCEPTED', 'PRELIMINARY_PASSED', 'PUBLISHED'];
  if (applicationType === 'PRIORITY') mainLine.push('PRIORITY_GRANTED');
  mainLine.push('SUBSTANTIVE_EXAM');

  const branchLine = ['OA_RESPONSE', 'REGISTERING', 'FEE_PAID', 'GRANTED'];

  const mainIdx = mainLine.indexOf(status);
  const inBranch = !mainLine.includes(status);

  const isAbnormal = ABNORMAL.has(status);
  const currentIdx = mainIdx >= 0 ? mainIdx : mainLine.length;

  const nodeStyle = (s: string, done: boolean, current: boolean, abnormal = false) => {
    let cls = 'px-3 py-1.5 rounded-full text-xs border whitespace-nowrap flex items-center gap-1 ';
    if (current) {
      cls += abnormal
        ? 'bg-red-600 text-white border-red-600 font-semibold shadow'
        : TERMINAL_OK.has(s)
          ? 'bg-green-600 text-white border-green-600 font-semibold shadow'
          : 'bg-gray-600 text-white border-gray-600 font-semibold shadow';
    } else if (done) {
      cls += 'bg-gray-100 text-gray-600 border-gray-300';
    } else {
      cls += 'bg-white text-gray-400 border-gray-300 border-dashed';
    }
    return cls;
  };

  const Arrow = () => <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />;

  const currentIsBranch = inBranch && branchLine.includes(status);
  const currentIsOther = inBranch && !branchLine.includes(status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
      {/* Main line */}
      <div className="flex items-center gap-1 flex-wrap">
        {mainLine.map((s, i) => {
          const done = mainIdx < 0 ? currentIdx > i || currentIdx === mainLine.length : i < mainIdx;
          const current = status === s;
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <Arrow />}
              <div className={nodeStyle(s, done, current, ABNORMAL.has(s))}>
                {done && !current && <Check className="w-3 h-3" />}
                {st(s)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branch line under SUBSTANTIVE_EXAM */}
      <div className="flex items-center gap-1 flex-wrap mt-2 pl-6">
        <CornerDownRight className="w-3.5 h-3.5 text-gray-300" />
        {branchLine.map((s, i) => {
          const current = status === s;
          const done = currentIsBranch && branchLine.indexOf(status) > i;
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <Arrow />}
              <div className={nodeStyle(s, done, current, ABNORMAL.has(s))}>
                {s === 'OA_RESPONSE' && <RotateCw className="w-3 h-3" />}
                {st(s)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abnormal terminal states not on the two lines */}
      {currentIsOther && (
        <div className="flex items-center gap-1 mt-2 pl-6">
          <CornerDownRight className="w-3.5 h-3.5 text-gray-300" />
          <div className={nodeStyle(status, false, true, true)}>{st(status)}</div>
        </div>
      )}
    </div>
  );
}
