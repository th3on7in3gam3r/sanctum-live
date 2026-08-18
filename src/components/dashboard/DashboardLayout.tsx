import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileHeader } from './MobileHeader';

interface DashboardLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col md:flex-row transition-colors">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        className="hidden md:flex"
      />

      {/* Mobile Top Header */}
      <MobileHeader currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


