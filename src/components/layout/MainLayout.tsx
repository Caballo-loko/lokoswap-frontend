'use client';

import React, { useState, useEffect } from 'react';
import { Pool } from '../../contexts/PoolContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  onCreatePoolClick: () => void;
  onSettingsClick: () => void;
}

export default function MainLayout({
  children,
  onCreatePoolClick,
  onSettingsClick
}: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleMobileOverlayClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-base-100">
      {/* Header */}
      <Header onSettingsClick={onSettingsClick} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${isMobile && !isMobileSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar
            onCreatePoolClick={onCreatePoolClick}
            isCollapsed={isMobile ? false : isSidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            className={isMobile ? 'h-full' : ''}
          />
        </div>

        {/* Mobile Overlay */}
        {isMobile && isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleMobileOverlayClick}
          />
        )}

        {/* Main Content */}
        <main className={`
          flex-1 overflow-auto
          ${isMobile ? 'w-full' : ''}
        `}>
          <div className="h-full p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Mobile Sidebar Toggle Button */}
        {isMobile && (
          <button
            onClick={handleSidebarToggle}
            className={`
              fixed bottom-20 left-4 z-30
              btn btn-primary btn-circle shadow-lg
              ${isMobileSidebarOpen ? 'hidden' : 'block'}
            `}
            title="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
