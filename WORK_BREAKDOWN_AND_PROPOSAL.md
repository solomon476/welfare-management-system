# Solian Wolves — Welfare Management System (WMS)
## Development Work Breakdown & Commercial Proposal Framework (PRD Section 13 & 14)

---

## 1. Work Breakdown Structure (WBS) & Effort Estimates

| Workstream | Module / Deliverable | Key Tasks Included | Estimated Effort |
| :--- | :--- | :--- | :--- |
| **Phase 1: Discovery** | Requirements Finalization | Client questionnaire review, constitutional rule signing, PRD v1.0 sign-off | 24 Hours |
| **Phase 2: UI/UX & Blueprint** | System Architecture | Database DDL, RLS policies, security threat modeling, component specifications | 36 Hours |
| **Phase 3.1: Frontend** | Administrative Portal | Dashboard KPIs, member registry, contribution reconciliation, welfare decision pipeline, ledger, settings | 90 Hours |
| **Phase 3.2: Frontend** | Member Portal | Self-service claims form, contribution statement, decision tracking, next-of-kin profile | 50 Hours |
| **Phase 3.3: Backend** | Cloud Backend & DB | Authentication, RBAC middleware, PostgreSQL schema migration, audit logger | 70 Hours |
| **Phase 4: QA & Testing** | Verification & Acceptance | Boundary test (recorded vs verified), duplicate detection, Kenyan DPA privacy audit, mobile responsive checks | 45 Hours |
| **Phase 5: Deployment** | Cloud Launch & Training | Production HTTPS domain setup, backup automation, administrator training, user manuals | 30 Hours |
| **Total Development Effort** | | | **345 Hours** |

---

## 2. Pricing & Commercial Calculation Model

Following PRD Section 14:

$$\text{Development Fee} = \sum(\text{Estimated Task Hours} \times \text{Agreed Hourly Rate}) + \text{Contingency (10\%) }$$

### Milestone Payment Schedule:
1. **Milestone 1 (25%):** Mobilization & Approval of PRD v1.0 and Technical Blueprint.
2. **Milestone 2 (35%):** Delivery of Working Core Application (Members, Contributions, Welfare Pipeline).
3. **Milestone 3 (25%):** Client Acceptance Testing (UAT AC-01 to AC-12 passed).
4. **Milestone 4 (15%):** Production Cloud Deployment, Handover, and Designated User Training.

---

## 3. Recurring Operational Infrastructure Costs (Direct-to-Provider)

To maintain financial transparency, recurring cloud costs are billed directly by the infrastructure providers:
- **Managed Database & Auth (Supabase / Managed PostgreSQL):** ~$25 - $50 / month
- **Web Application Hosting & CDN (Vercel / Cloudflare):** ~$0 - $20 / month
- **Custom Domain & SSL (.org / .co.ke):** ~$15 - $30 / year
- **Automated Off-site S3 Backup Storage:** ~$5 / month

---

## 4. Protected Scope Boundaries (PRD Section 11 Exclusions)

To protect Solian Wolves from costly assumptions, the following features remain strictly excluded unless quoted separately via change-order:
- Direct M-Pesa automated Daraja API C2B/B2C automated integration.
- Native mobile apps for Google Play / Apple App Store.
- Statutory payroll, loan interest, or full double-entry accounting software.
- Bulk automated SMS / WhatsApp gateway provider charges.
