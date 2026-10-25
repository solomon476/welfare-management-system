export type UserRole = 'admin' | 'welfare_officer' | 'finance_officer' | 'approver' | 'member';

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type MemberCategory = 'full_member' | 'associate' | 'senior' | 'youth';

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Member {
  id: string; // e.g. "SW-M001"
  membershipNumber: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  category: MemberCategory;
  status: MemberStatus;
  dateJoined: string; // YYYY-MM-DD
  monthlyCommitment: number; // in KES
  nextOfKin: NextOfKin;
  notes?: string;
  avatarUrl?: string;
}

export type PaymentCategory = 
  | 'monthly_dues'
  | 'welfare_fund'
  | 'benevolent_levy'
  | 'emergency_fund'
  | 'registration_fee'
  | 'special_contribution';

export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'cheque';

export type PaymentStatus = 'recorded' | 'verified' | 'disputed' | 'reversed';

export interface Contribution {
  id: string; // e.g. "CON-001"
  memberId: string;
  memberName: string;
  membershipNumber: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  category: PaymentCategory;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // e.g. "RJA9876251"
  status: PaymentStatus;
  recordedBy: string; // Officer Name
  recordedAt: string; // ISO String
  verifiedBy?: string;
  verifiedAt?: string;
  reversalReason?: string;
  notes?: string;
}

export type WelfareCategory = 
  | 'bereavement'
  | 'medical'
  | 'education_emergency'
  | 'disaster_relief'
  | 'general_assistance';

export type WelfareStatus = 
  | 'submitted'
  | 'under_review'
  | 'more_info_required'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export type RequestUrgency = 'normal' | 'urgent' | 'emergency';

export interface WelfareDocument {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  url?: string;
}

export interface RequestDecisionHistory {
  id: string;
  status: WelfareStatus;
  officerName: string;
  officerRole: string;
  timestamp: string;
  notes: string;
  amountApproved?: number;
}

export interface WelfareRequest {
  id: string; // e.g. "WEL-2026-001"
  memberId: string;
  memberName: string;
  membershipNumber: string;
  category: WelfareCategory;
  urgency: RequestUrgency;
  amountRequested: number;
  amountApproved?: number;
  status: WelfareStatus;
  submissionDate: string;
  description: string;
  documents: WelfareDocument[];
  decisions: RequestDecisionHistory[];
  disbursementId?: string;
  bankOrMpesaPayoutDetails?: string;
  internalNotes?: string;
}

export type TransactionType = 'income' | 'expenditure';

export interface FinancialTransaction {
  id: string; // e.g. "TXN-2026-001"
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  reference: string;
  paymentMode: PaymentMethod;
  linkedMemberId?: string;
  linkedWelfareRequestId?: string;
  recordedBy: string;
  isReconciled: boolean;
  reconciledAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  linkedMemberId?: string;
  department?: string;
  isActive: boolean;
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'member' | 'contribution' | 'welfare_request' | 'financial_transaction' | 'system_setting' | 'auth';
  entityId: string;
  description: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  read: boolean;
  targetRole?: UserRole | 'all';
  targetMemberId?: string;
  linkAction?: string;
}

export interface OrganizationSettings {
  orgName: string;
  tagline: string;
  registrationNumber: string;
  currency: string;
  monthlyDuesAmount: number;
  welfareRegistrationFee: number;
  fiscalYearStart: string;
  openingReserveBalance: number;
  maxBereavementBenefit: number;
  maxMedicalBenefit: number;
  maxEducationBenefit: number;
  approvalQuorum: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  isDemoMode: boolean;
}
