import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { UserAccount, OrganizationSettings, Member } from './types';

// Shell & Global Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MemberManagement } from './components/admin/MemberManagement';
import { ContributionManagement } from './components/admin/ContributionManagement';
import { WelfareManagement } from './components/admin/WelfareManagement';
import { FinanceManagement } from './components/admin/FinanceManagement';
import { ReportsAnalytics } from './components/admin/ReportsAnalytics';
import { AuditLogs } from './components/admin/AuditLogs';
import { OrgSettingsView } from './components/admin/OrgSettingsView';

// Member Views
import { MemberDashboard } from './components/member/MemberDashboard';
import { MyContributions } from './components/member/MyContributions';
import { ApplyWelfareModal } from './components/member/ApplyWelfareModal';
import { MyRequests } from './components/member/MyRequests';
import { MemberProfile } from './components/member/MemberProfile';
import { WelfareRules } from './components/member/WelfareRules';
import { LoginPage } from './components/auth/LoginPage';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => StorageService.getCurrentUser());
  const [settings, setSettings] = useState<OrganizationSettings>(() => StorageService.getSettings());
  const [isAuth, setIsAuth] = useState<boolean>(() => {
    // In production mode, require valid active authenticated session
    return StorageService.isAuthenticated();
  });

  const isOfficer = ['admin', 'secretary', 'finance_officer', 'welfare_officer', 'approver', 'welfare_approver', 'auditor'].some(
    r => currentUser.role === r || (currentUser.roles && currentUser.roles.includes(r as any))
  );

  const [activePortal, setActivePortal] = useState<'admin' | 'member'>(() => {
    return isOfficer ? 'admin' : 'member';
  });
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return isOfficer ? 'dashboard' : 'member_dashboard';
  });

  // ── Browser History: push state on tab change so back button works within app ──
  const navigateToTab = (tab: string, portal?: 'admin' | 'member') => {
    const p = portal ?? activePortal;
    window.history.pushState({ tab, portal: p }, '', `#${tab}`);
    setCurrentTab(tab);
    if (portal) setActivePortal(portal);
  };

  // Seed the initial history entry so first back doesn't exit
  useEffect(() => {
    const initialTab = isOfficer ? 'dashboard' : 'member_dashboard';
    const initialPortal = isOfficer ? 'admin' : 'member';
    window.history.replaceState({ tab: initialTab, portal: initialPortal }, '', `#${initialTab}`);
  }, []);

  // Listen for hardware/browser back button
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
        setActivePortal(e.state.portal ?? activePortal);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activePortal]);

  // Restore session from FastAPI backend on mount if token is stored
  useEffect(() => {
    const token = StorageService.getAuthToken();
    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        if (userData) {
          setCurrentUser(prev => ({
            ...prev,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            roles: userData.roles || [userData.role],
            linkedMemberId: userData.linked_member_id
          }));
        }
      })
      .catch(() => {});
    }
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuth(true);
    const officer = ['admin', 'secretary', 'finance_officer', 'welfare_officer', 'approver', 'welfare_approver', 'auditor'].some(
      r => user.role === r || (user.roles && user.roles.includes(r as any))
    );
    if (officer) {
      setActivePortal('admin');
      setCurrentTab('dashboard');
    } else {
      setActivePortal('member');
      setCurrentTab('member_dashboard');
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setIsAuth(false);
  };

  // Modals & Drawers
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [isApplyWelfareOpen, setIsApplyWelfareOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState(StorageService.getNotifications());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Adjust active tab when switching portal
  const handleSwitchPortal = (portal: 'admin' | 'member') => {
    const tab = portal === 'admin' ? 'dashboard' : 'member_dashboard';
    navigateToTab(tab, portal);
  };

  const handleSelectUser = (user: UserAccount) => {
    StorageService.setCurrentUser(user.id);
    setCurrentUser(user);
    if (user.role === 'member') {
      setActivePortal('member');
      setCurrentTab('member_dashboard');
    }
  };

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleInitializeCleanSlate = () => {
    if (confirm('Initialize clean production database? This will clear all sample demo records so you can start with real approved member entries.')) {
      StorageService.initializeCleanProductionSlate();
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (confirm('Reset system data to initial demonstration state? All custom records will be restored to defaults.')) {
      StorageService.resetToDefaultData();
      window.location.reload();
    }
  };

  const handleSaveSettings = (updated: OrganizationSettings) => {
    StorageService.saveSettings(updated);
    setSettings(updated);
  };

  const refreshNotifications = () => {
    setNotifications(StorageService.getNotifications());
  };

  const handleMarkNotifRead = (id: string) => {
    StorageService.markNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllNotifsRead = () => {
    StorageService.markAllNotificationsRead();
    refreshNotifications();
  };

  // Safe guaranteed member profile for Member Portal
  const activeMember = StorageService.getActiveMemberForUser(currentUser);

  const stats = StorageService.getSystemStats();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAuth) {
    return <LoginPage settings={settings} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePortal={activePortal}
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateToTab(tab)}
        userRole={currentUser.role}
        pendingRequestsCount={stats.pendingRequestsCount}
        pendingContributionsCount={StorageService.getContributions().filter(c => c.status === 'recorded').length}
        setActivePortal={handleSwitchPortal}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
      />

      {/* Main Container */}
      <div className="app-main">
        {/* Top Header */}
        <Navbar
          currentUser={currentUser}
          activePortal={activePortal}
          setActivePortal={handleSwitchPortal}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={unreadCount}
          settings={settings}
          theme={theme}
          setTheme={setTheme}
          onResetData={handleResetData}
          onInitializeCleanSlate={handleInitializeCleanSlate}
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
          onLogout={handleLogout}
        />

        {/* Dynamic Route Content */}
        {activePortal === 'admin' ? (
          <>
            {currentTab === 'dashboard' && (
              <AdminDashboard
                onNavigate={setCurrentTab}
                settings={settings}
                onOpenRecordPayment={() => {
                  setCurrentTab('contributions');
                  setIsRecordPaymentOpen(true);
                }}
                onOpenNewMember={() => {
                  setCurrentTab('members');
                  setIsNewMemberOpen(true);
                }}
              />
            )}

            {currentTab === 'members' && (
              <MemberManagement
                settings={settings}
                userRole={currentUser.role}
                isCreateOpen={isNewMemberOpen}
                setIsCreateOpen={setIsNewMemberOpen}
              />
            )}

            {currentTab === 'contributions' && (
              <ContributionManagement
                settings={settings}
                userRole={currentUser.role}
                isRecordOpen={isRecordPaymentOpen}
                setIsRecordOpen={setIsRecordPaymentOpen}
              />
            )}

            {currentTab === 'welfare' && (
              <WelfareManagement
                settings={settings}
                userRole={currentUser.role}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceManagement
                settings={settings}
                userRole={currentUser.role}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsAnalytics
                settings={settings}
              />
            )}

            {currentTab === 'audit' && (
              <AuditLogs />
            )}

            {currentTab === 'settings' && (
              <OrgSettingsView
                settings={settings}
                onSave={handleSaveSettings}
                userRole={currentUser.role}
              />
            )}

            {/* Fallback for unmatched admin tab */}
            {!['dashboard', 'members', 'contributions', 'welfare', 'finance', 'reports', 'audit', 'settings'].includes(currentTab) && (
              <AdminDashboard
                onNavigate={setCurrentTab}
                settings={settings}
                onOpenRecordPayment={() => {
                  setCurrentTab('contributions');
                  setIsRecordPaymentOpen(true);
                }}
                onOpenNewMember={() => {
                  setCurrentTab('members');
                  setIsNewMemberOpen(true);
                }}
              />
            )}
          </>
        ) : (
          <>
            {currentTab === 'member_dashboard' && (
              <MemberDashboard
                member={activeMember}
                settings={settings}
                onNavigate={setCurrentTab}
                onOpenApply={() => setIsApplyWelfareOpen(true)}
              />
            )}

            {currentTab === 'my_contributions' && (
              <MyContributions
                member={activeMember}
                settings={settings}
              />
            )}

            {currentTab === 'my_requests' && (
              <MyRequests
                member={activeMember}
                settings={settings}
                onOpenApply={() => setIsApplyWelfareOpen(true)}
              />
            )}

            {currentTab === 'member_profile' && (
              <MemberProfile
                member={activeMember}
                settings={settings}
              />
            )}

            {currentTab === 'welfare_rules' && (
              <WelfareRules
                settings={settings}
              />
            )}

            {/* Fallback for unmatched member tab */}
            {!['member_dashboard', 'my_contributions', 'my_requests', 'member_profile', 'welfare_rules'].includes(currentTab) && (
              <MemberDashboard
                member={activeMember}
                settings={settings}
                onNavigate={setCurrentTab}
                onOpenApply={() => setIsApplyWelfareOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Global Modals */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        users={StorageService.getUsers()}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />

      <ApplyWelfareModal
        isOpen={isApplyWelfareOpen}
        onClose={() => setIsApplyWelfareOpen(false)}
        member={activeMember}
        settings={settings}
        onSuccess={() => {
          refreshNotifications();
          setCurrentTab('my_requests');
        }}
      />

      {/* Smartphone Bottom Navigation Bar */}
      <MobileBottomNav
        activePortal={activePortal}
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateToTab(tab)}
        pendingRequestsCount={stats.pendingRequestsCount}
        pendingContributionsCount={StorageService.getContributions().filter(c => c.status === 'recorded').length}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />
    </div>
  );
};

export default App;
