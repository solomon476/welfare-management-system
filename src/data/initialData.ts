import {
  Member,
  Contribution,
  WelfareRequest,
  FinancialTransaction,
  UserAccount,
  AuditLog,
  AppNotification,
  OrganizationSettings
} from '../types';

export const initialOrgSettings: OrganizationSettings = {
  orgName: 'Solian Wolves Welfare Association',
  tagline: 'Supporting One Another Through Every Season of Life',
  registrationNumber: 'WMS/NBI/2023/0488',
  currency: 'KES',
  monthlyDuesAmount: 1500,
  welfareRegistrationFee: 2000,
  fiscalYearStart: '01-01',
  openingReserveBalance: 200000,
  maxBereavementBenefit: 50000,
  maxMedicalBenefit: 35000,
  maxEducationBenefit: 25000,
  approvalQuorum: 2,
  contactEmail: 'welfare@solianwolves.org',
  contactPhone: '+254 722 000 123',
  address: 'Solian Wolves Towers, 4th Floor, Ralph Bunche Rd, Nairobi, Kenya',
  isDemoMode: true
};

export const initialUserAccounts: UserAccount[] = [
  {
    id: 'USR-001',
    name: 'Sarah Koech',
    email: 'admin@solianwolves.org',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Executive Administration',
    isActive: true,
    lastLogin: '2026-10-25 09:30'
  },
  {
    id: 'USR-002',
    name: 'David Mwangi',
    email: 'welfare@solianwolves.org',
    role: 'welfare_officer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Welfare & Member Care',
    isActive: true,
    lastLogin: '2026-10-25 11:15'
  },
  {
    id: 'USR-003',
    name: 'Grace Achieng',
    email: 'finance@solianwolves.org',
    role: 'finance_officer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: 'Treasury & Finance',
    isActive: true,
    lastLogin: '2026-10-25 14:02'
  },
  {
    id: 'USR-004',
    name: 'Dr. Benson Otieno',
    email: 'approvals@solianwolves.org',
    role: 'approver',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Welfare Advisory Board',
    isActive: true,
    lastLogin: '2026-10-24 16:45'
  },
  {
    id: 'USR-005',
    name: 'John Kiprono',
    email: 'john.kiprono@example.com',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    linkedMemberId: 'SW-M001',
    department: 'General Membership',
    isActive: true,
    lastLogin: '2026-10-25 08:20'
  }
];

export const initialMembers: Member[] = [
  {
    id: 'SW-M001',
    membershipNumber: 'SW-2024-001',
    fullName: 'John Kiprono',
    nationalId: '28472910',
    phone: '+254 712 345 678',
    email: 'john.kiprono@example.com',
    category: 'full_member',
    status: 'active',
    dateJoined: '2024-01-15',
    monthlyCommitment: 1500,
    nextOfKin: {
      name: 'Beatrice Chebet',
      relationship: 'Spouse',
      phone: '+254 723 998 877',
      email: 'beatrice.c@example.com'
    },
    notes: 'Founding member. Prompt monthly contributor.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'SW-M002',
    membershipNumber: 'SW-2024-002',
    fullName: 'Esther Wanjiku Ndung\'u',
    nationalId: '31908472',
    phone: '+254 721 556 789',
    email: 'esther.wanjiku@example.com',
    category: 'full_member',
    status: 'active',
    dateJoined: '2024-02-01',
    monthlyCommitment: 1500,
    nextOfKin: {
      name: 'Peter Ndung\'u',
      relationship: 'Brother',
      phone: '+254 710 443 322'
    },
    notes: 'Member in good standing. Active on committee.',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'SW-M003',
    membershipNumber: 'SW-2024-003',
    fullName: 'Hassan Mohammed Ali',
    nationalId: '29871145',
    phone: '+254 733 889 900',
    email: 'hassan.ali@example.com',
    category: 'full_member',
    status: 'active',
    dateJoined: '2024-03-10',
    monthlyCommitment: 1500,
    nextOfKin: {
      name: 'Fatuma Hassan',
      relationship: 'Spouse',
      phone: '+254 735 112 233'
    },
    notes: 'Regular contributor via direct bank standing order.'
  },
  {
    id: 'SW-M004',
    membershipNumber: 'SW-2024-004',
    fullName: 'Mercy Akinyi Omondi',
    nationalId: '33491028',
    phone: '+254 705 678 123',
    email: 'mercy.akinyi@example.com',
    category: 'associate',
    status: 'active',
    dateJoined: '2024-06-20',
    monthlyCommitment: 1000,
    nextOfKin: {
      name: 'George Omondi',
      relationship: 'Father',
      phone: '+254 722 778 899'
    },
    notes: 'Associate membership tier. Applied for medical assistance in Sep 2026.'
  },
  {
    id: 'SW-M005',
    membershipNumber: 'SW-2024-005',
    fullName: 'Samuel Kiprotich Kemboi',
    nationalId: '25619384',
    phone: '+254 718 901 234',
    email: 'samuel.kemboi@example.com',
    category: 'senior',
    status: 'active',
    dateJoined: '2024-01-10',
    monthlyCommitment: 1500,
    nextOfKin: {
      name: 'Joyce Chepkemoi',
      relationship: 'Daughter',
      phone: '+254 728 665 544'
    },
    notes: 'Senior advisory member.'
  },
  {
    id: 'SW-M006',
    membershipNumber: 'SW-2024-006',
    fullName: 'Brian Mutua Musyoka',
    nationalId: '35198204',
    phone: '+254 790 334 455',
    email: 'brian.mutua@example.com',
    category: 'youth',
    status: 'inactive',
    dateJoined: '2024-08-15',
    monthlyCommitment: 800,
    nextOfKin: {
      name: 'Agnes Musyoka',
      relationship: 'Mother',
      phone: '+254 714 223 344'
    },
    notes: 'Relocated temporarily for graduate studies. Inactive notice filed.'
  },
  {
    id: 'SW-M007',
    membershipNumber: 'SW-2024-007',
    fullName: 'Faith Nyambura Mwangi',
    nationalId: '32098415',
    phone: '+254 726 445 566',
    email: 'faith.nyambura@example.com',
    category: 'full_member',
    status: 'pending',
    dateJoined: '2026-10-22',
    monthlyCommitment: 1500,
    nextOfKin: {
      name: 'Joseph Mwangi',
      relationship: 'Spouse',
      phone: '+254 720 119 988'
    },
    notes: 'New registration awaiting committee verification.'
  }
];

export const initialContributions: Contribution[] = [
  {
    id: 'CON-001',
    memberId: 'SW-M001',
    memberName: 'John Kiprono',
    membershipNumber: 'SW-2024-001',
    amount: 1500,
    paymentDate: '2026-10-05',
    category: 'monthly_dues',
    paymentMethod: 'mpesa',
    referenceNumber: 'SKJ928410L',
    status: 'verified',
    recordedBy: 'David Mwangi',
    recordedAt: '2026-10-05T10:14:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-10-06T09:30:00Z',
    notes: 'October 2026 regular monthly dues'
  },
  {
    id: 'CON-002',
    memberId: 'SW-M001',
    memberName: 'John Kiprono',
    membershipNumber: 'SW-2024-001',
    amount: 2000,
    paymentDate: '2026-09-12',
    category: 'benevolent_levy',
    paymentMethod: 'mpesa',
    referenceNumber: 'SIH782190B',
    status: 'verified',
    recordedBy: 'Grace Achieng',
    recordedAt: '2026-09-12T14:20:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-09-13T11:00:00Z',
    notes: 'Special levy for bereavement assistance'
  },
  {
    id: 'CON-003',
    memberId: 'SW-M001',
    memberName: 'John Kiprono',
    membershipNumber: 'SW-2024-001',
    amount: 1500,
    paymentDate: '2026-09-02',
    category: 'monthly_dues',
    paymentMethod: 'mpesa',
    referenceNumber: 'SHF638291K',
    status: 'verified',
    recordedBy: 'David Mwangi',
    recordedAt: '2026-09-02T08:50:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-09-03T16:15:00Z',
    notes: 'September 2026 monthly dues'
  },
  {
    id: 'CON-004',
    memberId: 'SW-M002',
    memberName: 'Esther Wanjiku Ndung\'u',
    membershipNumber: 'SW-2024-002',
    amount: 3000,
    paymentDate: '2026-10-18',
    category: 'monthly_dues',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'EBB-TRX-20261018-09',
    status: 'recorded',
    recordedBy: 'David Mwangi',
    recordedAt: '2026-10-18T16:00:00Z',
    notes: 'Advance dues for October & November 2026. Awaiting bank statement confirmation.'
  },
  {
    id: 'CON-005',
    memberId: 'SW-M003',
    memberName: 'Hassan Mohammed Ali',
    membershipNumber: 'SW-2024-003',
    amount: 4500,
    paymentDate: '2026-10-10',
    category: 'monthly_dues',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'STANBIC-44892019',
    status: 'verified',
    recordedBy: 'Grace Achieng',
    recordedAt: '2026-10-10T11:00:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-10-11T10:00:00Z',
    notes: 'Quarter 4 dues payment in advance'
  },
  {
    id: 'CON-006',
    memberId: 'SW-M004',
    memberName: 'Mercy Akinyi Omondi',
    membershipNumber: 'SW-2024-004',
    amount: 1000,
    paymentDate: '2026-10-21',
    category: 'monthly_dues',
    paymentMethod: 'mpesa',
    referenceNumber: 'SKU998271M',
    status: 'recorded',
    recordedBy: 'David Mwangi',
    recordedAt: '2026-10-21T13:45:00Z',
    notes: 'October associate member dues'
  },
  {
    id: 'CON-007',
    memberId: 'SW-M005',
    memberName: 'Samuel Kiprotich Kemboi',
    membershipNumber: 'SW-2024-005',
    amount: 5000,
    paymentDate: '2026-10-01',
    category: 'emergency_fund',
    paymentMethod: 'cash',
    referenceNumber: 'RCT-2026-0041',
    status: 'verified',
    recordedBy: 'Grace Achieng',
    recordedAt: '2026-10-01T15:00:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-10-01T15:30:00Z',
    notes: 'Voluntary top-up contribution into emergency reserve'
  },
  {
    id: 'CON-008',
    memberId: 'SW-M002',
    memberName: 'Esther Wanjiku Ndung\'u',
    membershipNumber: 'SW-2024-002',
    amount: 1500,
    paymentDate: '2026-08-15',
    category: 'monthly_dues',
    paymentMethod: 'mpesa',
    referenceNumber: 'SGR449102X',
    status: 'reversed',
    recordedBy: 'David Mwangi',
    recordedAt: '2026-08-15T11:20:00Z',
    verifiedBy: 'Grace Achieng',
    verifiedAt: '2026-08-16T09:00:00Z',
    reversalReason: 'Duplicate entry: Member paid once via M-Pesa but entered twice in log. Corrected on member review.',
    notes: 'Reversed after audit reconciliation.'
  }
];

export const initialWelfareRequests: WelfareRequest[] = [
  {
    id: 'WEL-2026-001',
    memberId: 'SW-M001',
    memberName: 'John Kiprono',
    membershipNumber: 'SW-2024-001',
    category: 'medical',
    urgency: 'urgent',
    amountRequested: 35000,
    amountApproved: 30000,
    status: 'approved',
    submissionDate: '2026-10-12',
    description: 'Emergency hospitalization and surgery co-pay for spouse (Beatrice Chebet) at Nairobi West Hospital following sudden appendicitis.',
    documents: [
      {
        id: 'DOC-101',
        name: 'Hospital_Admission_NWH.pdf',
        size: '1.4 MB',
        uploadedAt: '2026-10-12'
      },
      {
        id: 'DOC-102',
        name: 'Interim_Hospital_Bill_NWH.pdf',
        size: '890 KB',
        uploadedAt: '2026-10-12'
      }
    ],
    decisions: [
      {
        id: 'DEC-01',
        status: 'submitted',
        officerName: 'System',
        officerRole: 'Portal',
        timestamp: '2026-10-12 11:20',
        notes: 'Application submitted by member John Kiprono via Member Portal.'
      },
      {
        id: 'DEC-02',
        status: 'under_review',
        officerName: 'David Mwangi',
        officerRole: 'Welfare Officer',
        timestamp: '2026-10-13 09:15',
        notes: 'Verified hospital admission records and active member eligibility. Member has 0 arrears.'
      },
      {
        id: 'DEC-03',
        status: 'approved',
        officerName: 'Dr. Benson Otieno',
        officerRole: 'Approver',
        timestamp: '2026-10-14 14:00',
        notes: 'Executive Committee approved KES 30,000 in accordance with Article 6.2 medical emergency cap.',
        amountApproved: 30000
      }
    ],
    bankOrMpesaPayoutDetails: 'M-Pesa 0712345678 (John Kiprono)',
    internalNotes: 'Awaiting finance officer disbursement schedule.'
  },
  {
    id: 'WEL-2026-002',
    memberId: 'SW-M004',
    memberName: 'Mercy Akinyi Omondi',
    membershipNumber: 'SW-2024-004',
    category: 'bereavement',
    urgency: 'emergency',
    amountRequested: 50000,
    amountApproved: 50000,
    status: 'disbursed',
    submissionDate: '2026-09-18',
    description: 'Demise of immediate family member (Father: George Omondi). Assistance with funeral arrangements and family transit to Siaya County.',
    documents: [
      {
        id: 'DOC-201',
        name: 'Burial_Permit_Omondi_G.pdf',
        size: '1.2 MB',
        uploadedAt: '2026-09-18'
      },
      {
        id: 'DOC-202',
        name: 'ID_Copy_NextOfKin.pdf',
        size: '640 KB',
        uploadedAt: '2026-09-18'
      }
    ],
    decisions: [
      {
        id: 'DEC-11',
        status: 'submitted',
        officerName: 'System',
        officerRole: 'Portal',
        timestamp: '2026-09-18 10:00',
        notes: 'Submitted with official burial permit attached.'
      },
      {
        id: 'DEC-12',
        status: 'under_review',
        officerName: 'David Mwangi',
        officerRole: 'Welfare Officer',
        timestamp: '2026-09-18 12:30',
        notes: 'Confirmed documents. Next of kin relationship verified.'
      },
      {
        id: 'DEC-13',
        status: 'approved',
        officerName: 'Sarah Koech',
        officerRole: 'Administrator',
        timestamp: '2026-09-19 09:00',
        notes: 'Expedited approval granted as per immediate bereavement clause.',
        amountApproved: 50000
      },
      {
        id: 'DEC-14',
        status: 'disbursed',
        officerName: 'Grace Achieng',
        officerRole: 'Finance Officer',
        timestamp: '2026-09-19 14:30',
        notes: 'Payment disbursed via Bank EFT TXN-2026-0089.'
      }
    ],
    disbursementId: 'TXN-2026-0089',
    bankOrMpesaPayoutDetails: 'KCB Bank Acc 1189402910 - Mercy Akinyi',
    internalNotes: 'Disbursement executed smoothly and condolence letter sent.'
  },
  {
    id: 'WEL-2026-003',
    memberId: 'SW-M005',
    memberName: 'Samuel Kiprotich Kemboi',
    membershipNumber: 'SW-2024-005',
    category: 'education_emergency',
    urgency: 'normal',
    amountRequested: 20000,
    status: 'under_review',
    submissionDate: '2026-10-23',
    description: 'Final semester exam clearance fee support for dependent daughter (Joyce Chepkemoi) at Moi University.',
    documents: [
      {
        id: 'DOC-301',
        name: 'Moi_Univ_Fee_Statement.pdf',
        size: '950 KB',
        uploadedAt: '2026-10-23'
      }
    ],
    decisions: [
      {
        id: 'DEC-21',
        status: 'submitted',
        officerName: 'System',
        officerRole: 'Portal',
        timestamp: '2026-10-23 15:40',
        notes: 'Application submitted.'
      },
      {
        id: 'DEC-22',
        status: 'under_review',
        officerName: 'David Mwangi',
        officerRole: 'Welfare Officer',
        timestamp: '2026-10-24 10:15',
        notes: 'Reviewing fee statement against education support guidelines.'
      }
    ],
    bankOrMpesaPayoutDetails: 'M-Pesa 0718901234 (Samuel Kemboi)',
    internalNotes: 'To be reviewed in next weekly committee quorum.'
  },
  {
    id: 'WEL-2026-004',
    memberId: 'SW-M002',
    memberName: 'Esther Wanjiku Ndung\'u',
    membershipNumber: 'SW-2024-002',
    category: 'disaster_relief',
    urgency: 'urgent',
    amountRequested: 25000,
    status: 'more_info_required',
    submissionDate: '2026-10-20',
    description: 'Flash flooding damage to residential perimeter wall and domestic water line in Rongai.',
    documents: [
      {
        id: 'DOC-401',
        name: 'Flood_Damage_Photos.pdf',
        size: '2.5 MB',
        uploadedAt: '2026-10-20'
      }
    ],
    decisions: [
      {
        id: 'DEC-31',
        status: 'submitted',
        officerName: 'System',
        officerRole: 'Portal',
        timestamp: '2026-10-20 08:30',
        notes: 'Submitted with photos.'
      },
      {
        id: 'DEC-32',
        status: 'more_info_required',
        officerName: 'David Mwangi',
        officerRole: 'Welfare Officer',
        timestamp: '2026-10-21 11:00',
        notes: 'Requested contractor quotation and local administration/chief incident confirmation letter.'
      }
    ],
    bankOrMpesaPayoutDetails: 'M-Pesa 0721556789',
    internalNotes: 'Awaiting formal quotation from member.'
  }
];

export const initialFinancialTransactions: FinancialTransaction[] = [
  {
    id: 'TXN-2026-0085',
    date: '2026-10-01',
    type: 'income',
    category: 'Voluntary Emergency Levy',
    amount: 5000,
    description: 'Voluntary top-up into emergency reserve by member Samuel Kemboi',
    reference: 'RCT-2026-0041',
    paymentMode: 'cash',
    linkedMemberId: 'SW-M005',
    recordedBy: 'Grace Achieng',
    isReconciled: true,
    reconciledAt: '2026-10-01 16:00'
  },
  {
    id: 'TXN-2026-0086',
    date: '2026-10-05',
    type: 'income',
    category: 'Member Monthly Dues',
    amount: 1500,
    description: 'October 2026 dues - John Kiprono',
    reference: 'SKJ928410L',
    paymentMode: 'mpesa',
    linkedMemberId: 'SW-M001',
    recordedBy: 'David Mwangi',
    isReconciled: true,
    reconciledAt: '2026-10-06 09:30'
  },
  {
    id: 'TXN-2026-0087',
    date: '2026-10-10',
    type: 'income',
    category: 'Member Monthly Dues',
    amount: 4500,
    description: 'Quarter 4 dues in advance - Hassan Ali',
    reference: 'STANBIC-44892019',
    paymentMode: 'bank_transfer',
    linkedMemberId: 'SW-M003',
    recordedBy: 'Grace Achieng',
    isReconciled: true,
    reconciledAt: '2026-10-11 10:00'
  },
  {
    id: 'TXN-2026-0088',
    date: '2026-10-15',
    type: 'expenditure',
    category: 'Administrative Operations',
    amount: 3500,
    description: 'Quarterly registry filing, bank ledger charge & stationery',
    reference: 'CHQ-00192',
    paymentMode: 'cheque',
    recordedBy: 'Grace Achieng',
    isReconciled: true,
    reconciledAt: '2026-10-16 11:00'
  },
  {
    id: 'TXN-2026-0089',
    date: '2026-09-19',
    type: 'expenditure',
    category: 'Welfare Assistance Payout',
    amount: 50000,
    description: 'Approved bereavement assistance payout for late George Omondi (Member: Mercy Akinyi)',
    reference: 'EFT-889102-KCB',
    paymentMode: 'bank_transfer',
    linkedMemberId: 'SW-M004',
    linkedWelfareRequestId: 'WEL-2026-002',
    recordedBy: 'Grace Achieng',
    isReconciled: true,
    reconciledAt: '2026-09-20 10:00'
  },
  {
    id: 'TXN-2026-0090',
    date: '2026-10-18',
    type: 'income',
    category: 'Member Monthly Dues',
    amount: 3000,
    description: 'Advance dues (Oct & Nov) - Esther Wanjiku',
    reference: 'EBB-TRX-20261018-09',
    paymentMode: 'bank_transfer',
    linkedMemberId: 'SW-M002',
    recordedBy: 'David Mwangi',
    isReconciled: false
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-10-25 11:15',
    userId: 'USR-002',
    userName: 'David Mwangi',
    userRole: 'welfare_officer',
    action: 'MEMBER_VIEW',
    entityType: 'member',
    entityId: 'SW-M001',
    description: 'Viewed profile and verified eligibility history for member John Kiprono'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-10-24 14:00',
    userId: 'USR-004',
    userName: 'Dr. Benson Otieno',
    userRole: 'approver',
    action: 'WELFARE_APPROVE',
    entityType: 'welfare_request',
    entityId: 'WEL-2026-001',
    description: 'Approved assistance of KES 30,000 for medical co-pay request WEL-2026-001',
    previousValue: 'Status: under_review',
    newValue: 'Status: approved (Amount: KES 30,000)'
  },
  {
    id: 'AUD-003',
    timestamp: '2026-10-21 13:45',
    userId: 'USR-002',
    userName: 'David Mwangi',
    userRole: 'welfare_officer',
    action: 'CONTRIBUTION_RECORD',
    entityType: 'contribution',
    entityId: 'CON-006',
    description: 'Recorded payment of KES 1,000 for member Mercy Akinyi (Ref: SKU998271M)'
  },
  {
    id: 'AUD-004',
    timestamp: '2026-10-11 10:00',
    userId: 'USR-003',
    userName: 'Grace Achieng',
    userRole: 'finance_officer',
    action: 'CONTRIBUTION_VERIFY',
    entityType: 'contribution',
    entityId: 'CON-005',
    description: 'Verified bank transfer KES 4,500 against Stanbic statement',
    previousValue: 'Status: recorded',
    newValue: 'Status: verified'
  },
  {
    id: 'AUD-005',
    timestamp: '2026-08-16 09:00',
    userId: 'USR-003',
    userName: 'Grace Achieng',
    userRole: 'finance_officer',
    action: 'TRANSACTION_REVERSAL',
    entityType: 'contribution',
    entityId: 'CON-008',
    description: 'Reversed duplicate entry SGR449102X with documented audit note',
    previousValue: 'Status: verified',
    newValue: 'Status: reversed'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'NOTIF-001',
    title: 'Welfare Request Approved',
    message: 'Medical assistance request WEL-2026-001 has been approved for KES 30,000 and routed to Finance for disbursement.',
    timestamp: '2026-10-24 14:05',
    type: 'success',
    read: false,
    targetRole: 'all',
    targetMemberId: 'SW-M001'
  },
  {
    id: 'NOTIF-002',
    title: 'Bank Payment Pending Verification',
    message: 'Recorded payment EBB-TRX-20261018-09 (KES 3,000) from Esther Wanjiku awaits bank statement reconciliation.',
    timestamp: '2026-10-18 16:05',
    type: 'warning',
    read: false,
    targetRole: 'finance_officer'
  },
  {
    id: 'NOTIF-003',
    title: 'New Member Registration',
    message: 'Faith Nyambura Mwangi registered and is currently pending approval.',
    timestamp: '2026-10-22 17:00',
    type: 'info',
    read: true,
    targetRole: 'admin'
  }
];
