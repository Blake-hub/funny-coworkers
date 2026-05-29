'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { IssueResponse } from '@/services/api';
import { User, Calendar } from 'lucide-react';

interface IssueCardProps {
  issue: IssueResponse;
  isDragging?: boolean;
  isHighlighted?: boolean;
  dropPosition?: 'before' | 'after' | null;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: (issueId: number, targetIssueId: number, position: 'before' | 'after') => void;
  onHighlight?: (issueId: number | null, position: 'before' | 'after' | null) => void;
}

const priorityColors: Record<number, string> = {
  0: '#808080',
  1: '#DC3545',
  2: '#FFA500',
  3: '#28A745',
  4: '#17A2B8',
};

const priorityLabels: Record<number, string> = {
  0: 'No Priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  isDragging = false,
  isHighlighted = false,
  dropPosition = null,
  onDragStart,
  onDragEnd,
  onDrop,
  onHighlight,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/issues/${issue.id}`);
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const cleanup = draggable({
      element: card,
      getInitialData: () => ({
        type: 'issue',
        issueId: issue.id,
        statusId: issue.statusId,
        sortOrder: issue.sortOrder,
      }),
      onDragStart: () => onDragStart?.(),
    });

    return cleanup;
  }, [issue.id, issue.statusId, issue.sortOrder, onDragStart, onDragEnd]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const cleanup = dropTargetForElements({
      element: card,
      canDrop: ({ source }) => {
        const sourceData = source.data as { type: string; issueId?: number };
        return sourceData.type === 'issue' && sourceData.issueId !== issue.id;
      },
      onDragEnter: ({ source }) => {
        const sourceData = source.data as { type: string; issueId?: number };
        if (sourceData.type === 'issue' && sourceData.issueId !== issue.id) {
          onHighlight?.(issue.id, 'after');
          onDragStart?.();
        }
      },
      onDragLeave: () => {
        onHighlight?.(null, null);
        onDragEnd?.();
      },
      onDrop: ({ source }) => {
        const sourceData = source.data as { type: string; issueId?: number; statusId?: number };
        if (sourceData.type === 'issue' && sourceData.issueId !== issue.id) {
          onDrop?.(sourceData.issueId!, issue.id, dropPosition || 'after');
        }
        onHighlight?.(null, null);
        onDragEnd?.();
      },
    });

    return cleanup;
  }, [issue.id, issue.statusId, onDrop, onDragStart, onDragEnd, onHighlight, dropPosition]);

  const showInsertionBefore = isHighlighted && dropPosition === 'before';
  const showInsertionAfter = isHighlighted && dropPosition === 'after';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {showInsertionBefore && (
        <div
          className="h-[3px] bg-blue-500 rounded-full mx-2 my-1"
          style={{ marginTop: '-4px' }}
        />
      )}
      <div
        ref={cardRef}
        data-issue-card={issue.id}
        className={`
          px-3 py-3 cursor-pointer rounded-md
          ${isDragging ? 'opacity-50 shadow-lg cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
          ${isHighlighted ? 'bg-blue-50' : 'bg-white'}
          hover:bg-gray-100
          transition-all duration-150
        `}
        style={{
          opacity: isDragging ? 0.5 : 1,
          boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.2)' : 'none',
        }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          {issue.priorityId !== null && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityColors[issue.priorityId] || '#808080' }}
              title={priorityLabels[issue.priorityId] || 'Unknown'}
            />
          )}
          
          {issue.teamIdentifier && issue.teamIssueNumber ? (
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">{issue.teamIdentifier}-{issue.teamIssueNumber}</span>
          ) : (
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">#{issue.id}</span>
          )}
          
          <span className="text-sm text-gray-800 truncate flex-1">{issue.title}</span>
          
          {issue.projectId && (
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex-shrink-0">
              {issue.projectId}
            </span>
          )}
          
          {issue.assigneeName ? (
            <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
              <User className="w-3 h-3" />
              {issue.assigneeName}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <User className="w-3 h-3" />
              Unassigned
            </span>
          )}
          
          <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <Calendar className="w-3 h-3" />
            {formatDate(issue.createdAt)}
          </span>
        </div>
      </div>
      {showInsertionAfter && (
        <div
          className="h-[3px] bg-blue-500 rounded-full mx-2 my-1"
          style={{ marginBottom: '-4px' }}
        />
      )}
    </>
  );
};

export default IssueCard;