import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { UserAccount, OrganizationSettings, Member } from './types';

// Shell & Global Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { NotificationDrawer } from './components/NotificationDrawer';

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

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser, setCurrentUser] = useState<UserAccount>(StorageService.getCurrentUser());
  const [settings, setSettings] = useState<OrganizationSettings>(StorageService.getSettings());
  const [activePortal, setActivePortal] = useState<'admin' | 'member'>('admin');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

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
    setActivePortal(portal);
    if (portal === 'admin') {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('member_dashboard');
    }
  };

  const handleSelectUser = (user: UserAccount) => {
    StorageService.setCurrentUser(user.id);
    setCurrentUser(user);
    if (user.role === 'member') {
      setActivePortal('member');
      setCurrentTab('member_dashboard');
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

  // Find linked member or default to first member for Member Portal
  const activeMember = (currentUser.linkedMemberId
    ? StorageService.getMemberById(currentUser.linkedMemberId)
    : StorageService.getMembers()[0]) || StorageService.getMembers()[0];

  const stats = StorageService.getSystemStats();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePortal={activePortal}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={currentUser.role}
        pendingRequestsCount={stats.pendingRequestsCount}
        pendingContributionsCount={StorageService.getContributions().filter(c => c.status === 'recorded').length}
        setActivePortal={handleSwitchPortal}
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
    </div>
  );
};

export default App;
