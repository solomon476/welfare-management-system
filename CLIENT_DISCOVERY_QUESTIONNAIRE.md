# Solian Wolves — Welfare Management System (WMS)
## Client Discovery Questionnaire · Outstanding Requirements (PRD Section 15)

To convert **PRD v0.2 (Proposed Scope)** into an approved **PRD v1.0 and Final Quotation**, the client should complete the following structured discovery questions.

---

### Part 1: Tenancy & Organizational Scope (R-01)
- [ ] **Single Organization vs Multi-Tenancy:**
  - [ ] **Option A:** System is exclusively for Solian Wolves Welfare Association (single-tenant).
  - [ ] **Option B:** Multi-tenant platform where other independent welfare groups, chamas, or associations can register their own branches/organizations.
  - *Current baseline assumed:* Single-tenant with configurable organizational identity.

---

### Part 2: Membership Rules & Registration (R-02)
- [ ] **Member Registration Workflow:**
  - [ ] Can members self-register via a public signup portal, or must they be registered solely by an authorized Welfare Officer?
  - [ ] Does membership require formal executive committee approval before being marked *Active*?
- [ ] **Required KYC / Member Fields:**
  - Standard fields: Full Legal Name, National ID / Passport, Mobile Phone, Email, Next of Kin (Beneficiary), Membership Category, Date Joined.
  - Are any additional fields required (e.g., County/Sub-County, Employer, Kra PIN, Physical Address)?
- [ ] **Duplicate Detection Criteria:**
  - National ID match (strict rejection)
  - Mobile phone match (warning or strict rejection)
  - Email match (warning)

---

### Part 3: Contribution Policies & Arrears (R-03)
- [ ] **Contribution Frequency & Rate:**
  - Standard monthly dues amount (e.g., KES 1,500/month or customizable by tier).
  - Are contributions fixed per member, or do members have different elected monthly pledge levels?
- [ ] **Arrears & Grace Period Rules:**
  - What happens when a member falls behind on contributions?
  - Grace period before status changes to *Suspended* (e.g., 60 days, 90 days)?
  - Does having arrears immediately freeze eligibility for welfare assistance?
- [ ] **External Payment Verification Workflow:**
  - Authorized payment methods: M-Pesa (Buy Goods / Paybill), Bank Deposit / EFT, Banker's Cheque, Cash.
  - Recording vs Verification policy: Payments recorded by Welfare Officers remain in *Recorded* status until the Finance Officer / Treasurer reconciles against official bank statements.

---

### Part 4: Welfare Assistance Categories & Benefit Limits (R-04)
Please confirm or adjust the proposed welfare benefit categories and constitutional caps:

| Welfare Category | Proposed Maximum Benefit Cap (KES) | Required Evidence / Supporting Documents |
| :--- | :--- | :--- |
| **Bereavement (Member / Spouse / Child)** | KES 50,000 | Certified Burial Permit, Death Certificate, Copy of ID |
| **Medical / Hospitalization Co-Pay** | KES 35,000 | Hospital Admission Note, Discharge Summary, Official Invoices |
| **Education Hardship Emergency** | KES 25,000 | Official Institution Fee Statement, Student Admission Letter |
| **Disaster Relief / Property Loss** | KES 20,000 | Incident report, local administration/chief letter, photo evidence |
| **General Compassionate Aid** | Discretionary (up to KES 15,000) | Detailed committee narrative and review |

- [ ] **Waiting Period:** Are new members required to have contributed continuously for a minimum period (e.g. 3 months) before qualifying for non-bereavement claims?

---

### Part 5: Governance & Separation of Duties (R-05)
- [ ] **Approval Quorum:**
  - How many approvers must vote to approve a welfare claim? (Default baseline: minimum 2 approvers).
- [ ] **Separation of Duties:**
  - Can the officer who records a payment also verify it? *(Recommended: No, only Finance Officer/Treasurer should verify payments)*.
  - Can the officer who approves a welfare claim disburse the funds? *(Recommended: No, disbursement is executed by Treasury after committee approval)*.

---

### Part 6: Reporting & Statutory Requirements (R-06 & R-07)
- [ ] **Reporting Needs:**
  - Periodic Operational Ledger (Monthly / Quarterly / Annual)
  - Member Contribution Statements (Individual Printable Certificate)
  - Welfare Assistance Disbursement Register
  - Arrears & Member Standing List
- [ ] **Expected Volumes (Scale):**
  - Expected active members in Year 1: (e.g., 100 - 500 members / 500 - 2,000 members / 2,000+)
  - Average monthly transaction volume: (e.g., 200 - 1,000 payments/month)

---

### Part 7: Data Protection & Kenya DPA Compliance
- [ ] The system maintains sensitive health and bereavement records. Does the association have a registered Data Protection Officer (DPO) or designated data controller under the Kenya Data Protection Act 2019?
