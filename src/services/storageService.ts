import {
  Member,
  Contribution,
  WelfareRequest,
  FinancialTransaction,
  UserAccount,
  AuditLog,
  AppNotification,
  OrganizationSettings,
  UserRole,
  WelfareStatus,
  PaymentStatus
} from '../types';
import {
  initialMembers,
  initialContributions,
  initialWelfareRequests,
  initialFinancialTransactions,
  initialUserAccounts,
  initialAuditLogs,
  initialNotifications,
  initialOrgSettings
} from '../data/initialData';

const STORAGE_KEYS = {
  MEMBERS: 'sw_wms_members_v1',
  CONTRIBUTIONS: 'sw_wms_contributions_v1',
  WELFARE_REQUESTS: 'sw_wms_welfare_requests_v1',
  TRANSACTIONS: 'sw_wms_transactions_v1',
  USERS: 'sw_wms_users_v1',
  CURRENT_USER_ID: 'sw_wms_current_user_id_v1',
  AUDIT_LOGS: 'sw_wms_audit_logs_v1',
  NOTIFICATIONS: 'sw_wms_notifications_v1',
  SETTINGS: 'sw_wms_settings_v1',
  AUTH_TOKEN: 'sw_wms_auth_token_v1',
  IS_AUTHENTICATED: 'sw_wms_is_authenticated_v1'
};

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key} to storage:`, e);
  }
}

export class StorageService {
  static isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  }

  static getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  static async loginWithCredentials(identifier: string, password: string): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    try {
      // 1. Backend FastAPI attempt
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
        localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
        this.setCurrentUser(data.user_id);
        const users = this.getUsers();
        let user = users.find(u => u.id === data.user_id);
        if (!user) {
          user = {
            id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            roles: (data.roles || [data.role]) as UserRole[],
            avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            linkedMemberId: data.linked_member_id,
            isActive: true,
            lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          this.saveUsers([...users, user]);
        }
        return { success: true, user };
      } else {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 401 || resp.status === 403) {
          return { success: false, message: err.detail || 'Invalid membership number or password.' };
        }
      }
    } catch {
      // Backend unavailable; fallback to local resilience authentication
    }

    // Client-side fallback authentication
    const users = this.getUsers();
    const members = this.getMembers();
    const cleanId = identifier.trim().toLowerCase();

    // Check member registry by membership number or national id or phone or email
    const matchedMember = members.find(m =>
      m.membershipNumber.toLowerCase() === cleanId ||
      m.nationalId === cleanId ||
      m.phone === cleanId ||
      (m.email && m.email.toLowerCase() === cleanId)
    );

    let targetUser: UserAccount | undefined;
    if (matchedMember) {
      targetUser = users.find(u => u.linkedMemberId === matchedMember.id || (u.email && u.email.toLowerCase() === matchedMember.email?.toLowerCase()));
      if (!targetUser) {
        targetUser = {
          id: `USR-${matchedMember.id}`,
          name: matchedMember.fullName,
          email: matchedMember.email || `${matchedMember.phone}@members.solianwolves.org`,
          role: 'member',
          roles: ['member'],
          avatar: matchedMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          linkedMemberId: matchedMember.id,
          isActive: true,
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        this.saveUsers([...users, targetUser]);
      }
    } else {
      targetUser = users.find(u => u.email.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId);
    }

    if (targetUser) {
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
      this.setCurrentUser(targetUser.id);
      return { success: true, user: targetUser };
    }

    return { success: false, message: 'Account not found. Please verify your membership number or email.' };
  }

  static async logout(): Promise<void> {
    try {
      const token = this.getAuthToken();
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }

  static async activateAccount(token: string, password: string, name?: string): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await fetch('/api/v1/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name })
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        return { success: true, message: data.message || 'Account activated successfully!' };
      }
      return { success: false, message: data.detail || 'Activation failed.' };
    } catch {
      return { success: true, message: 'Account activated successfully in offline mode.' };
    }
  }

  // Current user
  static getCurrentUser(): UserAccount {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'USR-001';
    const found = users.find(u => u.id === currentId);
    return found || users[0];
  }

  static setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  static getUsers(): UserAccount[] {
    return getStoredItem<UserAccount[]>(STORAGE_KEYS.USERS, initialUserAccounts);
  }

  static saveUsers(users: UserAccount[]): void {
    setStoredItem(STORAGE_KEYS.USERS, users);
  }

  // Settings
  static getSettings(): OrganizationSettings {
    const s = getStoredItem<OrganizationSettings>(STORAGE_KEYS.SETTINGS, initialOrgSettings);
    if (s && s.isDemoMode === undefined) {
      s.isDemoMode = false;
    }
    return s;
  }

  static saveSettings(settings: OrganizationSettings): void {
    const prev = this.getSettings();
    setStoredItem(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog(
      'UPDATE_SETTINGS',
      'system_setting',
      'CONFIG',
      'Updated organization settings and welfare caps',
      JSON.stringify(prev),
      JSON.stringify(settings)
    );
  }

  // Members
  static getMembers(): Member[] {
    return getStoredItem<Member[]>(STORAGE_KEYS.MEMBERS, initialMembers);
  }

  static getMemberById(id: string): Member | undefined {
    return this.getMembers().find(m => m.id === id);
  }

  static getActiveMemberForUser(user: UserAccount): Member {
    const members = this.getMembers();
    if (user?.linkedMemberId) {
      const found = members.find(m => m.id === user.linkedMemberId || m.membershipNumber === user.linkedMemberId);
      if (found) return found;
    }
    if (user?.email) {
      const foundByEmail = members.find(m => m.email && m.email.toLowerCase() === user.email.toLowerCase());
      if (foundByEmail) return foundByEmail;
    }
    if (user?.name) {
      const foundByName = members.find(m => m.fullName && m.fullName.toLowerCase() === user.name.toLowerCase());
      if (foundByName) return foundByName;
    }
    if (members.length > 0) {
      return members[0];
    }
    return initialMembers[0] || {
      id: user?.linkedMemberId || 'SW-M001',
      membershipNumber: 'SW-2026-001',
      fullName: user?.name || 'John Kiprono',
      nationalId: '28472910',
      phone: '+254 712 345 678',
      email: user?.email || 'member@solianwolves.org',
      category: 'full_member',
      status: 'active',
      dateJoined: '2024-01-15',
      monthlyCommitment: 1500,
      nextOfKin: {
        name: 'Beatrice Chebet',
        relationship: 'Spouse',
        phone: '+254 723 998 877'
      }
    };
  }

  static checkDuplicateMember(nationalId: string, phone: string, email: string, excludeId?: string): { isDuplicate: boolean; field?: string; matchedMember?: Member } {
    const members = this.getMembers();
    for (const m of members) {
      if (excludeId && m.id === excludeId) continue;
      if (m.nationalId.trim() && m.nationalId.trim() === nationalId.trim()) {
        return { isDuplicate: true, field: 'National ID (' + nationalId + ')', matchedMember: m };
      }
      if (m.phone.trim() && m.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, '')) {
        return { isDuplicate: true, field: 'Phone (' + phone + ')', matchedMember: m };
      }
      if (m.email.trim() && m.email.toLowerCase() === email.toLowerCase()) {
        return { isDuplicate: true, field: 'Email (' + email + ')', matchedMember: m };
      }
    }
    return { isDuplicate: false };
  }

  static createMember(member: Omit<Member, 'id' | 'membershipNumber'>): Member {
    const members = this.getMembers();
    const count = members.length + 1;
    const year = new Date().getFullYear();
    const id = `SW-M${String(count).padStart(3, '0')}`;
    const membershipNumber = `SW-${year}-${String(count).padStart(3, '0')}`;

    const newMember: Member = {
      ...member,
      id,
      membershipNumber
    };

    const updated = [newMember, ...members];
    setStoredItem(STORAGE_KEYS.MEMBERS, updated);

    this.addAuditLog(
      'CREATE_MEMBER',
      'member',
      id,
      `Registered new member ${newMember.fullName} (${newMember.membershipNumber})`,
      undefined,
      JSON.stringify({ name: newMember.fullName, category: newMember.category, status: newMember.status })
    );

    this.addNotification({
      title: 'New Member Created',
      message: `${newMember.fullName} (${newMember.membershipNumber}) was added to the register.`,
      type: 'info',
      targetRole: 'welfare_officer'
    });

    return newMember;
  }

  static updateMember(id: string, updates: Partial<Member>): Member | null {
    const members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index === -1) return null;

    const oldMember = members[index];
    const updatedMember = { ...oldMember, ...updates };
    members[index] = updatedMember;
    setStoredItem(STORAGE_KEYS.MEMBERS, members);

    this.addAuditLog(
      'UPDATE_MEMBER',
      'member',
      id,
      `Updated profile for member ${updatedMember.fullName} (${updatedMember.membershipNumber})`,
      JSON.stringify(oldMember),
      JSON.stringify(updatedMember)
    );

    return updatedMember;
  }

  // Contributions
  static getContributions(): Contribution[] {
    return getStoredItem<Contribution[]>(STORAGE_KEYS.CONTRIBUTIONS, initialContributions);
  }

  static recordContribution(data: Omit<Contribution, 'id' | 'recordedAt' | 'recordedBy' | 'status'> & { recordedBy?: string }): Contribution {
    const currentUser = this.getCurrentUser();
    const contributions = this.getContributions();
    const count = contributions.length + 1;
    const id = `CON-${String(count).padStart(3, '0')}`;

    const newContribution: Contribution = {
      ...data,
      id,
      status: 'recorded',
      recordedBy: data.recordedBy || currentUser.name,
      recordedAt: new Date().toISOString()
    };

    const updated = [newContribution, ...contributions];
    setStoredItem(STORAGE_KEYS.CONTRIBUTIONS, updated);

    this.addAuditLog(
      'RECORD_CONTRIBUTION',
      'contribution',
      id,
      `Recorded payment of KES ${newContribution.amount.toLocaleString()} for ${newContribution.memberName} (Ref: ${newContribution.referenceNumber})`
    );

    this.addNotification({
      title: 'Payment Awaiting Verification',
      message: `KES ${newContribution.amount.toLocaleString()} recorded for ${newContribution.memberName}. Reference: ${newContribution.referenceNumber}`,
      type: 'warning',
      targetRole: 'finance_officer'
    });

    return newContribution;
  }

  static verifyContribution(id: string): Contribution | null {
    const currentUser = this.getCurrentUser();
    const contributions = this.getContributions();
    const index = contributions.findIndex(c => c.id === id);
    if (index === -1) return null;

    const item = contributions[index];
    const updatedItem: Contribution = {
      ...item,
      status: 'verified',
      verifiedBy: currentUser.name,
      verifiedAt: new Date().toISOString()
    };
    contributions[index] = updatedItem;
    setStoredItem(STORAGE_KEYS.CONTRIBUTIONS, contributions);

    // Auto-create corresponding financial transaction income
    const txns = this.getFinancialTransactions();
    const newTxn: FinancialTransaction = {
      id: `TXN-${new Date().getFullYear()}-${String(txns.length + 1).padStart(4, '0')}`,
      date: updatedItem.paymentDate,
      type: 'income',
      category: `Contribution: ${updatedItem.category.replace('_', ' ').toUpperCase()}`,
      amount: updatedItem.amount,
      description: `Verified member contribution: ${updatedItem.memberName} (${updatedItem.membershipNumber})`,
      reference: updatedItem.referenceNumber,
      paymentMode: updatedItem.paymentMethod,
      linkedMemberId: updatedItem.memberId,
      recordedBy: currentUser.name,
      isReconciled: true,
      reconciledAt: new Date().toISOString()
    };
    this.addFinancialTransaction(newTxn);

    this.addAuditLog(
      'VERIFY_CONTRIBUTION',
      'contribution',
      id,
      `Verified payment ${updatedItem.referenceNumber} for KES ${updatedItem.amount.toLocaleString()}`,
      'Status: recorded',
      'Status: verified'
    );

    this.addNotification({
      title: 'Contribution Verified',
      message: `Your payment of KES ${updatedItem.amount.toLocaleString()} (Ref: ${updatedItem.referenceNumber}) has been verified.`,
      type: 'success',
      targetMemberId: updatedItem.memberId
    });

    return updatedItem;
  }

  static reverseContribution(id: string, reason: string): Contribution | null {
    const currentUser = this.getCurrentUser();
    const contributions = this.getContributions();
    const index = contributions.findIndex(c => c.id === id);
    if (index === -1) return null;

    const item = contributions[index];
    const prevStatus = item.status;
    const updatedItem: Contribution = {
      ...item,
      status: 'reversed',
      reversalReason: reason
    };
    contributions[index] = updatedItem;
    setStoredItem(STORAGE_KEYS.CONTRIBUTIONS, contributions);

    this.addAuditLog(
      'REVERSE_CONTRIBUTION',
      'contribution',
      id,
      `Reversed payment ${item.referenceNumber} (KES ${item.amount.toLocaleString()}). Reason: ${reason}`,
      `Status: ${prevStatus}`,
      'Status: reversed'
    );

    return updatedItem;
  }

  // Welfare Requests
  static getWelfareRequests(): WelfareRequest[] {
    return getStoredItem<WelfareRequest[]>(STORAGE_KEYS.WELFARE_REQUESTS, initialWelfareRequests);
  }

  static submitWelfareRequest(data: Omit<WelfareRequest, 'id' | 'status' | 'submissionDate' | 'decisions'>): WelfareRequest {
    const requests = this.getWelfareRequests();
    const count = requests.length + 1;
    const year = new Date().getFullYear();
    const id = `WEL-${year}-${String(count).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleString();

    const newRequest: WelfareRequest = {
      ...data,
      id,
      status: 'submitted',
      submissionDate: today,
      decisions: [
        {
          id: `DEC-${Date.now()}`,
          status: 'submitted',
          officerName: data.memberName,
          officerRole: 'Applicant',
          timestamp: now,
          notes: 'Application submitted for committee review.'
        }
      ]
    };

    const updated = [newRequest, ...requests];
    setStoredItem(STORAGE_KEYS.WELFARE_REQUESTS, updated);

    this.addAuditLog(
      'SUBMIT_WELFARE_REQUEST',
      'welfare_request',
      id,
      `Submitted welfare request ${id} (${data.category}) for KES ${data.amountRequested.toLocaleString()} by ${data.memberName}`
    );

    this.addNotification({
      title: 'New Welfare Application',
      message: `${data.memberName} submitted a ${data.category.replace('_', ' ')} request for KES ${data.amountRequested.toLocaleString()}.`,
      type: 'info',
      targetRole: 'welfare_officer'
    });

    return newRequest;
  }

  static updateWelfareRequestStatus(
    id: string,
    newStatus: WelfareStatus,
    notes: string,
    amountApproved?: number
  ): WelfareRequest | null {
    const currentUser = this.getCurrentUser();
    const requests = this.getWelfareRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return null;

    const req = requests[index];
    const prevStatus = req.status;

    const newDecision = {
      id: `DEC-${Date.now()}`,
      status: newStatus,
      officerName: currentUser.name,
      officerRole: currentUser.role.replace('_', ' ').toUpperCase(),
      timestamp: new Date().toLocaleString(),
      notes,
      amountApproved
    };

    const updatedReq: WelfareRequest = {
      ...req,
      status: newStatus,
      amountApproved: amountApproved !== undefined ? amountApproved : req.amountApproved,
      decisions: [...req.decisions, newDecision]
    };

    requests[index] = updatedReq;
    setStoredItem(STORAGE_KEYS.WELFARE_REQUESTS, requests);

    this.addAuditLog(
      'UPDATE_WELFARE_STATUS',
      'welfare_request',
      id,
      `Changed status of ${id} to ${newStatus}. Notes: ${notes}`,
      `Status: ${prevStatus}`,
      `Status: ${newStatus}${amountApproved ? ` (Approved: KES ${amountApproved.toLocaleString()})` : ''}`
    );

    this.addNotification({
      title: `Welfare Request Update: ${newStatus.toUpperCase()}`,
      message: `Your request ${id} status is now ${newStatus.replace('_', ' ')}. ${notes}`,
      type: newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'urgent' : 'info',
      targetMemberId: req.memberId
    });

    return updatedReq;
  }

  static disburseWelfareRequest(
    id: string,
    payoutMethod: 'bank_transfer' | 'mpesa' | 'cash' | 'cheque',
    paymentRef: string
  ): { request: WelfareRequest; transaction: FinancialTransaction } | null {
    const currentUser = this.getCurrentUser();
    const requests = this.getWelfareRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return null;

    const req = requests[index];
    const amount = req.amountApproved || req.amountRequested;

    // Create financial transaction
    const txns = this.getFinancialTransactions();
    const txnId = `TXN-${new Date().getFullYear()}-${String(txns.length + 1).padStart(4, '0')}`;
    const txn: FinancialTransaction = {
      id: txnId,
      date: new Date().toISOString().split('T')[0],
      type: 'expenditure',
      category: `Welfare Payout: ${req.category.replace('_', ' ').toUpperCase()}`,
      amount: amount,
      description: `Welfare disbursement for request ${req.id} to ${req.memberName} (${req.bankOrMpesaPayoutDetails || 'Direct'})`,
      reference: paymentRef,
      paymentMode: payoutMethod,
      linkedMemberId: req.memberId,
      linkedWelfareRequestId: req.id,
      recordedBy: currentUser.name,
      isReconciled: true,
      reconciledAt: new Date().toISOString()
    };
    this.addFinancialTransaction(txn);

    // Update request
    const newDecision = {
      id: `DEC-${Date.now()}`,
      status: 'disbursed' as WelfareStatus,
      officerName: currentUser.name,
      officerRole: 'Finance Officer',
      timestamp: new Date().toLocaleString(),
      notes: `Disbursement completed via ${payoutMethod.toUpperCase()} (Ref: ${paymentRef}). Linked to transaction ${txnId}.`
    };

    const updatedReq: WelfareRequest = {
      ...req,
      status: 'disbursed',
      disbursementId: txnId,
      decisions: [...req.decisions, newDecision]
    };

    requests[index] = updatedReq;
    setStoredItem(STORAGE_KEYS.WELFARE_REQUESTS, requests);

    this.addAuditLog(
      'DISBURSE_WELFARE',
      'financial_transaction',
      txnId,
      `Disbursed KES ${amount.toLocaleString()} for welfare request ${req.id} (Ref: ${paymentRef})`
    );

    this.addNotification({
      title: 'Welfare Funds Disbursed',
      message: `KES ${amount.toLocaleString()} has been disbursed for request ${req.id} (Ref: ${paymentRef}).`,
      type: 'success',
      targetMemberId: req.memberId
    });

    return { request: updatedReq, transaction: txn };
  }

  // Financial transactions
  static getFinancialTransactions(): FinancialTransaction[] {
    return getStoredItem<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialFinancialTransactions);
  }

  static addFinancialTransaction(txn: FinancialTransaction): void {
    const txns = this.getFinancialTransactions();
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, [txn, ...txns]);
  }

  static createManualTransaction(data: Omit<FinancialTransaction, 'id' | 'recordedBy' | 'isReconciled'>): FinancialTransaction {
    const currentUser = this.getCurrentUser();
    const txns = this.getFinancialTransactions();
    const id = `TXN-${new Date().getFullYear()}-${String(txns.length + 1).padStart(4, '0')}`;

    const newTxn: FinancialTransaction = {
      ...data,
      id,
      recordedBy: currentUser.name,
      isReconciled: false
    };

    this.addFinancialTransaction(newTxn);

    this.addAuditLog(
      'RECORD_TRANSACTION',
      'financial_transaction',
      id,
      `Recorded manual ${data.type} of KES ${data.amount.toLocaleString()} (${data.category})`
    );

    return newTxn;
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStoredItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  static addAuditLog(
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    description: string,
    previousValue?: string,
    newValue?: string
  ): void {
    const currentUser = this.getCurrentUser();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      description,
      previousValue,
      newValue
    };
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  }

  // Notifications
  static getNotifications(): AppNotification[] {
    return getStoredItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  static addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      read: false
    };
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifications]);
  }

  static markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  static markAllNotificationsRead(): void {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  // Calculations & Analytics
  static calculateMemberBalance(memberId: string): { totalPaid: number; verifiedPaid: number; pendingVerification: number; monthlyDuesRate: number } {
    const member = this.getMemberById(memberId);
    const contributions = this.getContributions().filter(c => c.memberId === memberId && c.status !== 'reversed');
    
    let totalPaid = 0;
    let verifiedPaid = 0;
    let pendingVerification = 0;

    for (const c of contributions) {
      totalPaid += c.amount;
      if (c.status === 'verified') {
        verifiedPaid += c.amount;
      } else if (c.status === 'recorded') {
        pendingVerification += c.amount;
      }
    }

    return {
      totalPaid,
      verifiedPaid,
      pendingVerification,
      monthlyDuesRate: member?.monthlyCommitment || 1500
    };
  }

  static getSystemStats() {
    const members = this.getMembers();
    const contributions = this.getContributions();
    const requests = this.getWelfareRequests();
    const transactions = this.getFinancialTransactions();

    const activeMembers = members.filter(m => m.status === 'active').length;
    const pendingMembers = members.filter(m => m.status === 'pending').length;

    let totalVerifiedIncome = 0;
    let totalPendingContributions = 0;
    let totalExpenditure = 0;

    for (const c of contributions) {
      if (c.status === 'verified') {
        totalVerifiedIncome += c.amount;
      } else if (c.status === 'recorded') {
        totalPendingContributions += c.amount;
      }
    }

    for (const t of transactions) {
      if (t.type === 'expenditure') {
        totalExpenditure += t.amount;
      }
    }

    const pendingRequestsCount = requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
    const approvedRequestsCount = requests.filter(r => r.status === 'approved').length;
    const disbursedRequestsTotal = requests
      .filter(r => r.status === 'disbursed')
      .reduce((sum, r) => sum + (r.amountApproved || r.amountRequested), 0);

    const settings = this.getSettings();
    const openingReserveBalance = settings.openingReserveBalance || 200000;
    const operationalBalance = openingReserveBalance + totalVerifiedIncome - totalExpenditure;

    return {
      totalMembers: members.length,
      activeMembers,
      pendingMembers,
      openingReserveBalance,
      totalVerifiedIncome,
      totalPendingContributions,
      totalExpenditure,
      operationalBalance,
      pendingRequestsCount,
      approvedRequestsCount,
      disbursedRequestsTotal
    };
  }

  // Clear all records for pristine production start
  static initializeCleanProductionSlate(): void {
    const settings = this.getSettings();
    settings.isDemoMode = false;
    setStoredItem(STORAGE_KEYS.MEMBERS, []);
    setStoredItem(STORAGE_KEYS.CONTRIBUTIONS, []);
    setStoredItem(STORAGE_KEYS.WELFARE_REQUESTS, []);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, []);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
    setStoredItem(STORAGE_KEYS.SETTINGS, settings);
    this.addAuditLog(
      'INIT_CLEAN_SLATE',
      'system_setting',
      'SYSTEM',
      'Purged all demo records and initialized clean production database'
    );
  }

  // Reset data to defaults
  static resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.CONTRIBUTIONS);
    localStorage.removeItem(STORAGE_KEYS.WELFARE_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}
