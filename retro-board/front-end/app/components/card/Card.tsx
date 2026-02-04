'use client';

import { useState, useRef } from 'react';

interface Card {
  id: number;
  title: string;
  content: string;
  creator: string;
  createdAt: string;
  votes: number;
}

interface CardProps {
  card: Card;
  columnId: number;
  onUpdate: (updatedCard: Partial<Card>) => void;
  onDelete: () => void;
}

export default function Card({ card, columnId, onUpdate, onDelete }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedContent, setEditedContent] = useState(card.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleVote = () => {
    onUpdate({ votes: card.votes + 1 });
  };

  const handleEdit = () => {
    if (editedTitle.trim()) {
      onUpdate({ title: editedTitle, content: editedContent });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete();
    }
  };

  return (
    <>
      <div 
        className={`card-container cursor-pointer transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
        onClick={() => setIsDetailOpen(true)}
        draggable="true"
        ref={cardRef}
        onDragStart={(e) => {
          setIsDragging(true);
          // Store card data for drag-and-drop
          e.dataTransfer.setData('text/plain', `${columnId},${card.id}`);
          // Improve drag image
          e.dataTransfer.effectAllowed = 'move';
          
          // Get initial mouse position
          if (e.clientX && e.clientY) {
            setDragPosition({ x: e.clientX, y: e.clientY });
          }
          
          // Create a custom drag image for better visibility
          if (e.currentTarget) {
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.width = '280px';
            dragImage.style.height = 'auto';
            dragImage.style.opacity = '0.9';
            dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            dragImage.style.pointerEvents = 'none';
            e.dataTransfer.setDragImage(dragImage, 50, 50);
          }
          
          // Add global dragover listener to track cursor position during drag
          const handleDragOver = (dragEvent: DragEvent) => {
            if (dragEvent.clientX && dragEvent.clientY) {
              setDragPosition({ x: dragEvent.clientX, y: dragEvent.clientY });
            }
          };
          
          document.addEventListener('dragover', handleDragOver);
          
          // Clean up listener on drag end
          const handleDragEnd = () => {
            document.removeEventListener('dragover', handleDragOver);
          };
          
          e.currentTarget.addEventListener('dragend', handleDragEnd, { once: true });
        }}
        onDragEnd={() => {
          // Reset dragging state immediately
          setIsDragging(false);
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm flex-1">{card.title}</h4>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleVote();
              }}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-primary transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {card.votes}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded hover:bg-neutral-200 transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1 rounded hover:bg-neutral-200 transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
          {card.content}
        </p>
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{card.creator}</span>
          <span>{card.createdAt}</span>
        </div>
      </div>

      {/* Floating card that follows cursor during drag */}
      {isDragging && (
        <div 
          className="fixed top-0 left-0 pointer-events-none z-50 transition-transform duration-0"
          style={{
            transform: `translate(${dragPosition.x - 140}px, ${dragPosition.y - 50}px)`,
            width: '280px'
          }}
        >
          <div className="card-container shadow-lg transform rotate-2 opacity-90">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm flex-1">{card.title}</h4>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {card.votes}
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
              {card.content}
            </p>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>{card.creator}</span>
              <span>{card.createdAt}</span>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="card-container">
          <div className="space-y-2">
            <input
              type="text"
              className="input-field w-full text-sm"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
            />
            <textarea
              className="input-field w-full text-sm h-20 resize-none"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="btn-primary text-xs flex-1"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(card.title);
                  setEditedContent(card.content);
                }}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Card Detail</h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-200 transition-smooth"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="input-field w-full text-base py-3"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  className="input-field w-full h-48 resize-none text-base py-3"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <button 
                      onClick={handleVote}
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-smooth"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Vote ({card.votes})
                    </button>
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
                  Created by {card.creator} on {card.createdAt}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="btn-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setEditedTitle(card.title);
                    setEditedContent(card.content);
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setIsDetailOpen(false);
                  }}
                  className="btn-outline text-error border-error hover:bg-error/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}