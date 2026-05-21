'use client';

import React, { useRef, useEffect, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import IssueCard from '@/components/IssueCard';
import { IssueResponse, IssueStatusResponse } from '@/services/api';
import { Inbox, Clock, Play, Check, AlertCircle, CircleDot, ChevronDown, ChevronRight } from 'lucide-react';

interface StatusGroupProps {
  status: IssueStatusResponse;
  issues: IssueResponse[];
  draggingIssueId?: number | null;
  highlightedIssueId?: number | null;
  dropPosition?: 'before' | 'after' | null;
  onIssueDrop?: (draggedIssueId: number, targetStatusId: number, targetIssueId: number, position: 'before' | 'after') => void;
  onHighlight?: (issueId: number | null, position: 'before' | 'after' | null) => void;
}

const statusIcons: Record<number, React.ElementType> = {
  1: Inbox,
  2: Clock,
  3: Play,
  4: Check,
  5: AlertCircle,
  6: CircleDot,
};

export const StatusGroup: React.FC<StatusGroupProps> = ({
  status,
  issues,
  draggingIssueId,
  highlightedIssueId,
  dropPosition,
  onIssueDrop,
  onHighlight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = dropTargetForElements({
      element: container,
      canDrop: ({ source }) => {
        const sourceData = source.data as { type: string; statusId?: number };
        return sourceData.type === 'issue' && sourceData.statusId !== status.id;
      },
      onDragEnter: () => {
        setIsDragOver(true);
      },
      onDragLeave: () => {
        setIsDragOver(false);
      },
      onDrop: ({ source }) => {
        setIsDragOver(false);
        const sourceData = source.data as { type: string; issueId?: number; statusId?: number };
        if (sourceData.type === 'issue' && sourceData.issueId && sourceData.statusId !== status.id) {
          const firstIssue = issues[0];
          const targetIssueId = firstIssue?.id || 0;
          onIssueDrop?.(sourceData.issueId, status.id, targetIssueId, 'after');
        }
      },
    });

    return cleanup;
  }, [status.id, issues, onIssueDrop]);

  const handleIssueDrop = (draggedIssueId: number, targetIssueId: number, position: 'before' | 'after') => {
    if (draggingIssueId) {
      onIssueDrop?.(draggedIssueId, status.id, targetIssueId, position);
    }
  };

  const StatusIcon = statusIcons[status.id] || CircleDot;

  return (
    <div ref={containerRef} className="rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full px-4 py-2 font-medium text-sm
          flex items-center justify-between
          ${isDragOver ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : 'bg-gray-200'}
          transition-all duration-150
          rounded-lg
        `}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
          <span style={{ color: status.color }}>{status.name}</span>
          <span className="text-gray-500 text-xs">({issues.length})</span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-1">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isDragging={draggingIssueId === issue.id}
              isHighlighted={highlightedIssueId === issue.id}
              dropPosition={highlightedIssueId === issue.id ? dropPosition : null}
              onDrop={handleIssueDrop}
              onHighlight={onHighlight}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusGroup;