import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ToastContainer from '../Toast/ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
}

const MIN_WIDTH_PX = 64; // 1/7 of 448px viewport minimum
const COLLAPSED_WIDTH_PX = 80; // w-20
const DEFAULT_WIDTH_PX = 256; // w-64

export default function Layout({ children }: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH_PX);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const dragRef = useRef({
    initialWidth: DEFAULT_WIDTH_PX, initialX: 0 });

  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const minWidth = Math.max(MIN_WIDTH_PX, viewportWidth / 7);
      const maxWidth = viewportWidth * 0.25;
      
      if (viewportWidth < 768) {
        setSidebarWidth(COLLAPSED_WIDTH_PX);
      } else if (sidebarWidth > maxWidth) {
        setSidebarWidth(maxWidth);
      } else if (sidebarWidth < minWidth && sidebarWidth > COLLAPSED_WIDTH_PX) {
        setSidebarWidth(minWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      initialWidth: sidebarWidth,
      initialX: e.clientX,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const viewportWidth = window.innerWidth;
      const minWidth = Math.max(MIN_WIDTH_PX, viewportWidth / 7);
      const maxWidth = viewportWidth * 0.25;
      
      const deltaX = e.clientX - dragRef.current.initialX;
      const newWidth = dragRef.current.initialWidth + deltaX;
      
      if (newWidth <= COLLAPSED_WIDTH_PX) {
        setSidebarWidth(COLLAPSED_WIDTH_PX);
      } else if (newWidth <= minWidth) {
        setSidebarWidth(minWidth);
      } else if (newWidth >= maxWidth) {
        setSidebarWidth(maxWidth);
      } else {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('selectstart', handleSelectStart);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('selectstart', handleSelectStart);
    };
  }, [isDragging, sidebarWidth]);

  const isCollapsed = sidebarWidth <= COLLAPSED_WIDTH_PX;

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      <div className="relative flex-shrink-0">
        <Sidebar width={sidebarWidth} isCollapsed={isCollapsed} />
        
        {/* Draggable Splitter - Invisible by default, appears on hover */}
        <div
          className="absolute top-4 bottom-4"
          style={{
            left: `${sidebarWidth + 16}px`,
            width: isDragging || isHovering ? '3px' : '0px',
            transition: 'width 0.2s ease-out',
            zIndex: 10,
          }}
        >
          <div
            className={`absolute top-0 bottom-0 left-0 w-full transition-all duration-200 ${
              isDragging || isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundColor: isDragging ? '#6b7280' : '#d1d5db',
              cursor: 'col-resize',
            }}
            onMouseDown={handleMouseDown}
          />
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-6 rounded-full transition-all duration-200 ${
              isDragging || isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundColor: isDragging ? '#4b5563' : '#9ca3af',
            }}
          />
        </div>
        
        {/* Invisible hover hot zone - extends 8px across the main content border */}
        <div
          className="absolute top-4 bottom-4"
          style={{
            left: `calc(${sidebarWidth + 16}px - 4px)`,
            width: '8px',
            cursor: (isDragging || isHovering) ? 'col-resize' : 'default',
            zIndex: 10,
          }}
          onMouseEnter={() => !isDragging && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseDown={handleMouseDown}
        />
      </div>
      
      <div 
        className="flex-1 flex flex-col h-screen overflow-hidden"
      >
        <main className="p-4 flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
