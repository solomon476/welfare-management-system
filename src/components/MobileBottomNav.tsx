import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  HeartHandshake,
  Menu,
  FileText,
  User,
  DollarSign
} from 'lucide-react';

interface MobileBottomNavProps {
  activePortal: 'admin' | 'member';
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingRequestsCount: number;
  pendingContributionsCount: number;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePortal,
  currentTab,
  setCurrentTab,
  pendingRequestsCount,
  pendingContributionsCount,
  onOpenMobileMenu
}) => {
  return (
    <nav className="mobile-bottom-nav">
      {activePortal === 'admin' ? (
        <>
          <button
            className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
            aria-label="Dashboard"
          >
            <div className="bottom-nav-icon-wrapper">
              <LayoutDashboard size={20} />
            </div>
            <span>Dashboard</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'members' ? 'active' : ''}`}
            onClick={() => setCurrentTab('members')}
            aria-label="Members"
          >
            <div className="bottom-nav-icon-wrapper">
              <Users size={20} />
            </div>
            <span>Members</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'contributions' ? 'active' : ''}`}
            onClick={() => setCurrentTab('contributions')}
            aria-label="Contributions"
          >
            <div className="bottom-nav-icon-wrapper">
              <CreditCard size={20} />
              {pendingContributionsCount > 0 && (
                <span className="bottom-nav-badge">{pendingContributionsCount}</span>
              )}
            </div>
            <span>Payments</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'welfare' ? 'active' : ''}`}
            onClick={() => setCurrentTab('welfare')}
            aria-label="Welfare"
          >
            <div className="bottom-nav-icon-wrapper">
              <HeartHandshake size={20} />
              {pendingRequestsCount > 0 && (
                <span className="bottom-nav-badge">{pendingRequestsCount}</span>
              )}
            </div>
            <span>Welfare</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={onOpenMobileMenu}
            aria-label="More Options"
          >
            <div className="bottom-nav-icon-wrapper">
              <Menu size={20} />
            </div>
            <span>More</span>
          </button>
        </>
      ) : (
        <>
          <button
            className={`bottom-nav-item ${currentTab === 'member_dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('member_dashboard')}
            aria-label="Home"
          >
            <div className="bottom-nav-icon-wrapper">
              <LayoutDashboard size={20} />
            </div>
            <span>Home</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'my_contributions' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my_contributions')}
            aria-label="My Contributions"
          >
            <div className="bottom-nav-icon-wrapper">
              <CreditCard size={20} />
            </div>
            <span>Dues</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'my_requests' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my_requests')}
            aria-label="Assistance"
          >
            <div className="bottom-nav-icon-wrapper">
              <HeartHandshake size={20} />
              {pendingRequestsCount > 0 && (
                <span className="bottom-nav-badge">{pendingRequestsCount}</span>
              )}
            </div>
            <span>Claims</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'welfare_rules' ? 'active' : ''}`}
            onClick={() => setCurrentTab('welfare_rules')}
            aria-label="Rules"
          >
            <div className="bottom-nav-icon-wrapper">
              <FileText size={20} />
            </div>
            <span>Rules</span>
          </button>

          <button
            className={`bottom-nav-item ${currentTab === 'member_profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('member_profile')}
            aria-label="My Profile"
          >
            <div className="bottom-nav-icon-wrapper">
              <User size={20} />
            </div>
            <span>Profile</span>
          </button>
        </>
      )}
    </nav>
  );
};
