'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  // Sidebar state
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Modal states
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  isCreatePoolModalOpen: boolean;
  setCreatePoolModalOpen: (open: boolean) => void;
  
  // Current view
  currentView: 'swap' | 'deposit' | 'withdraw';
  setCurrentView: (view: 'swap' | 'deposit' | 'withdraw') => void;
  
  // Loading states
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Toast/notification state
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 for persistent
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUIContext() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modal states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);
  
  // Current view
  const [currentView, setCurrentView] = useState<'swap' | 'deposit' | 'withdraw'>('swap');
  
  // Loading state
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const setSettingsModalOpen = (open: boolean) => {
    setIsSettingsModalOpen(open);
  };

  const setCreatePoolModalOpen = (open: boolean) => {
    setIsCreatePoolModalOpen(open);
  };

  const setGlobalLoading = (loading: boolean) => {
    setIsGlobalLoading(loading);
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000 // Default 5 seconds
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value: UIContextType = {
    // Sidebar
    isSidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    
    // Modals
    isSettingsModalOpen,
    setSettingsModalOpen,
    isCreatePoolModalOpen,
    setCreatePoolModalOpen,
    
    // Current view
    currentView,
    setCurrentView,
    
    // Loading
    isGlobalLoading,
    setGlobalLoading,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
