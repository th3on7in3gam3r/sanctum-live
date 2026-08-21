import React from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileHeader } from './MobileHeader';
import { useTour } from '../../hooks/useTour';
import { TOUR_IDS } from '../../tour/tourIds';
import { dashboardTourSteps } from '../../tour/dashboardTour';

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
  const { startTour } = useTour(TOUR_IDS.dashboard, dashboardTourSteps, {
    enabled: currentPath === '/dashboard',
    delayMs: 700,
  });

  const handleShowTutorial = () => {
    if (currentPath !== '/dashboard') {
      onNavigate('/dashboard');
      window.setTimeout(() => startTour(), 400);
      return;
    }
    startTour();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex flex-col md:flex-row transition-colors">
      {/* Desktop Sidebar */}
      <DashboardSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        onShowTutorial={handleShowTutorial}
        className="hidden md:flex"
      />

      {/* Mobile Top Header */}
      <MobileHeader
        currentPath={currentPath}
        onNavigate={onNavigate}
        onShowTutorial={handleShowTutorial}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


