import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { PrayerRoomsListPage } from './pages/PrayerRoomsListPage';
import { PrayerRoomDetailsPage } from './pages/PrayerRoomDetailsPage';
import { CreatePrayerRoomPage } from './pages/CreatePrayerRoomPage';
import { PrayerControlRoomPage } from './pages/PrayerControlRoomPage';
import { PrayerRequestsPage } from './pages/PrayerRequestsPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { PublicJoinView } from './components/public/PublicJoinView';
import { JoinFinderPage } from './pages/JoinFinderPage';
import { ListenerRoomView } from './components/public/ListenerRoomView';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { NotificationToastContainer } from './components/common/NotificationToast';
import { GlobalConfirmModal } from './components/common/GlobalConfirmModal';
import { loadJoinSession } from './services/realtime/joinSessionStore';

const RouterContent: React.FC = () => {
  const { isAuthenticated, authReady, membershipDenied, needsOnboarding } = useAuth();
  const { hasUnsavedChanges, setHasUnsavedChanges, confirmAction, leavePrayerRoom } = useApp();

  // Route state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Attendee state for public join
  const [joinedAttendeeName, setJoinedAttendeeName] = useState<string | null>(() => {
    const storedJoin = loadJoinSession();
    if (!storedJoin) return null;
    return localStorage.getItem('sanctum_active_attendee_session') || storedJoin.guestName || null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = window.location.pathname || '/';
      if (hasUnsavedChanges) {
        window.history.pushState({}, '', currentPath);
        confirmAction({
          title: 'Discard unsaved changes?',
          description: 'Your changes have not been saved.',
          confirmText: 'Discard Changes',
          cancelText: 'Stay Here',
          isDestructive: true,
          onConfirm: () => {
            setHasUnsavedChanges(false);
            window.history.pushState({}, '', nextPath);
            setCurrentPath(nextPath);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        });
        return;
      }
      setCurrentPath(nextPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedChanges, currentPath, confirmAction, setHasUnsavedChanges]);

  const navigate = (path: string, options?: { ignoreUnsaved?: boolean }) => {
    const go = () => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (options?.ignoreUnsaved) {
      setHasUnsavedChanges(false);
      go();
      return;
    }

    if (hasUnsavedChanges) {
      confirmAction({
        title: 'Discard unsaved changes?',
        description: 'Your changes have not been saved.',
        confirmText: 'Discard Changes',
        cancelText: 'Stay Here',
        isDestructive: true,
        onConfirm: () => {
          setHasUnsavedChanges(false);
          go();
        },
      });
      return;
    }

    go();
  };

  useEffect(() => {
    if (!authReady) return;
    if (needsOnboarding && currentPath !== '/onboarding' && !currentPath.startsWith('/join')) {
      if (
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath.startsWith('/dashboard')
      ) {
        navigate('/onboarding');
      }
      return;
    }
    if (isAuthenticated && (currentPath === '/' || currentPath === '/login' || currentPath === '/onboarding')) {
      navigate('/dashboard');
      return;
    }
    if (membershipDenied && currentPath !== '/login' && !currentPath.startsWith('/join')) {
      if (currentPath === '/' || currentPath.startsWith('/dashboard') || currentPath === '/onboarding') {
        navigate('/login');
      }
    }
  }, [authReady, isAuthenticated, membershipDenied, needsOnboarding, currentPath]);

  // Route: /join (paste a link) or /join/:slug (that room)
  if (currentPath === '/join' || currentPath === '/join/') {
    return <JoinFinderPage onNavigate={navigate} />;
  }

  if (currentPath.startsWith('/join/')) {
    const parts = currentPath.split('/');
    const slug = parts[2];
    if (!slug) {
      return <JoinFinderPage onNavigate={navigate} />;
    }

    if (joinedAttendeeName) {
      return (
          <ListenerRoomView
          participantName={joinedAttendeeName}
          roomSlug={slug}
          onLeave={() => {
            void leavePrayerRoom();
            localStorage.removeItem('sanctum_active_attendee_session');
            setJoinedAttendeeName(null);
            navigate(`/join/${slug}`);
          }}
        />
      );
    }

    return (
      <PublicJoinView
        slug={slug}
        onJoinSuccess={(name) => {
          localStorage.setItem('sanctum_active_attendee_session', name);
          setJoinedAttendeeName(name);
        }}
      />
    );
  }

  // Standalone Public Pages
  if (currentPath === '/login') {
    return <LoginPage onNavigate={navigate} />;
  }
  if (currentPath === '/onboarding') {
    if (!authReady) {
      return (
        <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex items-center justify-center text-sm text-[#68736D]">
          Checking church session…
        </div>
      );
    }
    return <OnboardingPage onNavigate={navigate} />;
  }
  if (currentPath === '/privacy') {
    return <PrivacyPage onNavigate={navigate} />;
  }
  if (currentPath === '/terms') {
    return <TermsPage onNavigate={navigate} />;
  }
  if (currentPath === '/') {
    return <LandingPage onNavigate={navigate} />;
  }

  if (currentPath.startsWith('/dashboard')) {
    if (!authReady) {
      return (
        <div className="min-h-screen bg-[#F8F7F3] dark:bg-[#101814] flex items-center justify-center text-sm text-[#68736D]">
          Checking church session…
        </div>
      );
    }
    if (needsOnboarding) {
      return <OnboardingPage onNavigate={navigate} />;
    }
    if (!isAuthenticated) {
      return <LoginPage onNavigate={navigate} />;
    }
  }
  if (currentPath.includes('/control')) {
    const parts = currentPath.split('/');
    const roomId = parts[3] || 'room_1';

    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <PrayerControlRoomPage roomId={roomId} onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // Dashboard Create/Edit route: /dashboard/prayer-rooms/new or /dashboard/prayer-rooms/:id/edit
  if (currentPath === '/dashboard/prayer-rooms/new') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <CreatePrayerRoomPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  if (currentPath.includes('/edit')) {
    const parts = currentPath.split('/');
    const roomId = parts[3];
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <CreatePrayerRoomPage roomId={roomId} onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  const roomDetailMatch = currentPath.match(/^\/dashboard\/prayer-rooms\/([^/]+)$/);
  if (roomDetailMatch) {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <PrayerRoomDetailsPage roomId={roomDetailMatch[1]} onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // Dashboard sub-routes
  if (currentPath === '/dashboard/prayer-rooms') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <PrayerRoomsListPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  if (currentPath === '/dashboard/prayer-requests') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <PrayerRequestsPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  if (currentPath === '/dashboard/participants') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <ParticipantsPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  if (currentPath === '/dashboard/history') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <HistoryPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  if (currentPath === '/dashboard/settings') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <SettingsPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // Default Dashboard Overview
  if (currentPath.startsWith('/dashboard')) {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <DashboardOverviewPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // Fallback to Landing
  return <LandingPage onNavigate={navigate} />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterContent />
        <NotificationToastContainer />
        <GlobalConfirmModal />
      </AppProvider>
    </AuthProvider>
  );
}
