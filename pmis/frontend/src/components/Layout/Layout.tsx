import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ToastContainer from '../Toast/ToastContainer';
import { Menu, X, GripVertical } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const MIN_WIDTH_PX = 64;
const COLLAPSED_WIDTH_PX = 80;
const DEFAULT_WIDTH_PX = 256;
const MOBILE_BREAKPOINT = 768;

export default function Layout({ children }: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH_PX);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const dragRef = useRef({
    initialWidth: DEFAULT_WIDTH_PX, initialX: 0 });

  useEffect(() => {
    const checkMobile = () => {
      const viewportWidth = window.innerWidth;
      const isMobileDevice = viewportWidth < MOBILE_BREAKPOINT;
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        setSidebarWidth(0);
        setIsMobileMenuOpen(false);
      } else {
        setSidebarWidth(DEFAULT_WIDTH_PX);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const minWidth = Math.max(MIN_WIDTH_PX, viewportWidth / 7);
      const maxWidth = viewportWidth * 0.25;
      
      if (sidebarWidth > maxWidth) {
        setSidebarWidth(maxWidth);
      } else if (sidebarWidth < minWidth && sidebarWidth > COLLAPSED_WIDTH_PX) {
        setSidebarWidth(minWidth);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth, isMobile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      initialWidth: sidebarWidth,
      initialX: e.clientX,
    };
  };

  useEffect(() => {
    if (!isDragging || isMobile) return;

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
  }, [isDragging, sidebarWidth, isMobile]);

  const isCollapsed = !isMobile && sidebarWidth <= COLLAPSED_WIDTH_PX;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex h-screen overflow-hidden">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: takes space, Mobile: fixed overlay */}
      <div 
        className={`transition-transform duration-300 ease-in-out ${
          isMobile ? 'fixed z-40 top-0 left-0 h-screen shadow-2xl' : 'flex-shrink-0'
        }`}
        style={{
          width: isMobile ? DEFAULT_WIDTH_PX : `${sidebarWidth}px`,
          transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        }}
      >
        <Sidebar width={isMobile ? DEFAULT_WIDTH_PX : sidebarWidth} isCollapsed={isCollapsed} isMobile={isMobile} />
      </div>
      
      {/* Main Content - fills remaining space */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Draggable Splitter - Hidden by default, visible on hover */}
        {!isMobile && (
          <>
            {/* Invisible hot zone for hover detection */}
            <div
              className="absolute top-0 bottom-0 z-10"
              style={{ left: '8px', width: '20px' }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseDown={handleMouseDown}
            />
            {/* Visible splitter line */}
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center cursor-col-resize z-10"
              style={{ left: '16px', width: isDragging || isHovering ? '6px' : '0px' }}
              onMouseDown={handleMouseDown}
            >
              <div 
                className={`w-full h-full transition-colors duration-200 ${
                  isDragging ? 'bg-gray-500' : 'bg-gray-300'
                }`}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 transition-all duration-200 ${
                  isDragging || isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              >
                <GripVertical className={`w-4 h-6 ${isDragging ? 'text-gray-700' : 'text-gray-500'}`} />
              </div>
            </div>
          </>
        )}
        
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