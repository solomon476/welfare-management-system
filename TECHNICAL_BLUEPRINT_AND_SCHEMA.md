# Solian Wolves — Welfare Management System (WMS)
## Technical Architecture & Database Blueprint · Deliverable Phase 2

This technical blueprint defines the cloud architecture, database schema, security boundaries, and API contracts for the Solian Wolves Welfare Management System.

---

## 1. High-Level Technical Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-------------------------------------+   +------------------------------------+ |
|  |     ADMINISTRATIVE PORTAL           |   |           MEMBER PORTAL            | |
|  |  - Members, Payments, Welfare,      |   |  - My Profile & Beneficiary,       | |
|  |    Financial Ledger, Reports, Audit |   |    Contribution Statement, Claims  | |
|  +-------------------------------------+   +------------------------------------+ |
|                  Responsive Web Application (React 19 + TypeScript)                |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / TLS 1.3
+------------------------------------------v----------------------------------------+
|                            APPLICATION & IDENTITY LAYER                           |
|  - Role-Based Access Control (RBAC): Admin, Welfare Officer, Finance, Approver    |
|  - Server-Side Input Validation & Duplicate Checking                              |
|  - Audit Log Event Dispatcher (Non-repudiation)                                   |
+------------------------------------------+----------------------------------------+
                                           | Connection Pool
+------------------------------------------v----------------------------------------+
|                        MANAGED PERSISTENT DATABASE LAYER                          |
|  - PostgreSQL with Row-Level Security (RLS) & Foreign Key Constraints             |
|  - Tables: organizations, members, contributions, welfare_requests, transactions  |
|  - Point-In-Time Recovery (PITR) & Automated Daily Snapshots                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Production PostgreSQL Relational Schema (DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    monthly_dues_rate NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    max_bereavement_cap NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
    max_medical_cap NUMERIC(12, 2) NOT NULL DEFAULT 35000.00,
    max_education_cap NUMERIC(12, 2) NOT NULL DEFAULT 25000.00,
    approval_quorum INT DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Accounts table (Auth & Identity)
CREATE TYPE user_role AS ENUM ('admin', 'welfare_officer', 'finance_officer', 'approver', 'member');

CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Members table
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE member_tier AS ENUM ('full_member', 'associate', 'senior', 'youth');

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    membership_number VARCHAR(50) UNIQUE NOT NULL,
    user_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    category member_tier NOT NULL DEFAULT 'full_member',
    status member_status NOT NULL DEFAULT 'active',
    date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
    monthly_commitment NUMERIC(12, 2) NOT NULL DEFAULT 1500.00,
    next_of_kin_name VARCHAR(255) NOT NULL,
    next_of_kin_relationship VARCHAR(100) NOT NULL,
    next_of_kin_phone VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Contributions table
CREATE TYPE payment_category AS ENUM (
    'monthly_dues', 'welfare_fund', 'benevolent_levy', 
    'emergency_fund', 'registration_fee', 'special_contribution'
);
CREATE TYPE payment_method AS ENUM ('mpesa', 'bank_transfer', 'cash', 'cheque');
CREATE TYPE payment_status AS ENUM ('recorded', 'verified', 'disputed', 'reversed');

CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    category payment_category NOT NULL DEFAULT 'monthly_dues',
    payment_method payment_method NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    status payment_status NOT NULL DEFAULT 'recorded',
    recorded_by_user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    verified_by_user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    reversal_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Welfare Requests table
CREATE TYPE welfare_category AS ENUM (
    'bereavement', 'medical', 'education_emergency', 
    'disaster_relief', 'general_assistance'
);
CREATE TYPE welfare_status AS ENUM (
    'submitted', 'under_review', 'more_info_required', 
    'approved', 'rejected', 'disbursed'
);
CREATE TYPE urgency_tier AS ENUM ('normal', 'urgent', 'emergency');

CREATE TABLE welfare_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    category welfare_category NOT NULL,
    urgency urgency_tier NOT NULL DEFAULT 'normal',
    amount_requested NUMERIC(12, 2) NOT NULL CHECK (amount_requested > 0),
    amount_approved NUMERIC(12, 2) CHECK (amount_approved >= 0),
    status welfare_status NOT NULL DEFAULT 'submitted',
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    payout_destination TEXT,
    disbursement_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Request Decision History
CREATE TABLE request_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES welfare_requests(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    status welfare_status NOT NULL,
    notes TEXT NOT NULL,
    amount_approved NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Financial Transactions (Ledger)
CREATE TYPE transaction_flow AS ENUM ('income', 'expenditure');

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    type transaction_flow NOT NULL,
    category VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    reference VARCHAR(100) NOT NULL,
    payment_mode payment_method NOT NULL,
    linked_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    linked_welfare_request_id UUID REFERENCES welfare_requests(id) ON DELETE SET NULL,
    recorded_by_user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Audit Logs (NFR-05 Security Non-repudiation)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Row-Level Security (RLS) Policies

To satisfy **PRD ADM-04 ("Members cannot access another member's private records")**:

1. **Members Table:**
   - Members can only `SELECT` records where `user_account_id = auth.uid()`.
   - Welfare Officers and Admins can `SELECT` and `UPDATE` all member records within their organization.

2. **Contributions Table:**
   - Members can only view contributions linked to their own `member_id`.
   - Finance Officers and Admins have full access to reconcile and update statuses.

3. **Welfare Requests Table:**
   - Members can only view and submit requests linked to their `member_id`.
   - Approvers and Welfare Officers can view details and append decision events.

---

## 4. Disaster Recovery & Backup Plan (NFR-04)
- **Continuous Archiving:** Write-Ahead Logging (WAL) enabled with Point-in-Time Recovery (PITR) allowing rollback to any second in the past 7 days.
- **Nightly Logical Dumps:** Compressed encrypted `.pgdump` exported to object storage in a separate availability zone.
- **Recovery Objective:** RTO (Recovery Time Objective) < 2 hours; RPO (Recovery Point Objective) < 15 minutes.
