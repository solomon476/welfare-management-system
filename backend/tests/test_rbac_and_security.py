import pytest
from datetime import date
from decimal import Decimal

def get_auth_token(client, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Failed to login {email}: {res.text}"
    return res.json()["access_token"]

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

def test_auth_login_and_token(client):
    """
    Test 1: Authentication & Token Issuance
    Verifies user login, JWT generation, and /auth/me identity verification.
    """
    # 1. Successful admin login
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@solianwolves.org",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "admin"
    assert data["name"] == "Sarah Wanjiku"

    token = data["access_token"]

    # 2. Verify identity via /auth/me
    me_res = client.get("/api/v1/auth/me", headers=auth_headers(token))
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["id"] == "USR-001"
    assert me_data["email"] == "admin@solianwolves.org"
    assert me_data["role"] == "admin"

    # 3. Invalid credentials rejection
    bad_res = client.post("/api/v1/auth/login", json={
        "email": "admin@solianwolves.org",
        "password": "wrongpassword"
    })
    assert bad_res.status_code == 401
    assert "Invalid email or password" in bad_res.json()["detail"]

def test_member_role_rbac_boundary(client):
    """
    Test 2: Role-Based Access Control (RBAC) Administrative Protection
    Verifies that ordinary 'member' accounts cannot access administrative or financial endpoints.
    """
    member_token = get_auth_token(client, "member@solianwolves.org", "member123")
    headers = auth_headers(member_token)

    # 1. Member cannot access treasury reconciliation
    res1 = client.get("/api/v1/treasury/reconciliation", headers=headers)
    assert res1.status_code == 403
    assert "Access denied" in res1.json()["detail"]

    # 2. Member cannot view full audit trail
    res2 = client.get("/api/v1/audit", headers=headers)
    assert res2.status_code == 403

    # 3. Member cannot view user accounts
    res3 = client.get("/api/v1/users", headers=headers)
    assert res3.status_code == 403

    # 4. Member cannot record a contribution
    res4 = client.post("/api/v1/contributions", json={
        "member_id": "SW-M001",
        "amount": "1000.00",
        "payment_date": str(date.today()),
        "category": "monthly_dues",
        "payment_method": "mpesa",
        "reference_number": "UNAUTH-CONTRIB-01"
    }, headers=headers)
    assert res4.status_code == 403

    # 5. Member cannot review or approve a welfare claim
    res5 = client.post("/api/v1/welfare/REQ-001/status", json={
        "status": "approved",
        "notes": "Unauthorized approval attempt",
        "officer_name": "John Kiprono"
    }, headers=headers)
    assert res5.status_code == 403

def test_member_data_privacy_isolation(client):
    """
    Test 3: Member Privacy Isolation
    Ordinary members can only view their own contributions, claims, profiles, and financial statements.
    """
    member_token = get_auth_token(client, "member@solianwolves.org", "member123")
    headers = auth_headers(member_token)

    # Member SW-M001 queries contributions
    res = client.get("/api/v1/contributions", headers=headers)
    assert res.status_code == 200
    contribs = res.json()["items"]
    # All returned contributions MUST belong strictly to SW-M001
    for c in contribs:
        assert c["member_id"] == "SW-M001"

    # Member queries their own member statement -> 200 OK
    own_stmt = client.get("/api/v1/reports/member-statement/SW-M001", headers=headers)
    assert own_stmt.status_code == 200
    assert own_stmt.json()["member_id"] == "SW-M001"

    # Member attempts to view another member's confidential statement -> 403 Forbidden
    other_stmt = client.get("/api/v1/reports/member-statement/SW-M002", headers=headers)
    assert other_stmt.status_code == 403
    assert "Access denied" in other_stmt.json()["detail"]

    # Member attempts to view another member's profile directly -> 403 Forbidden
    other_prof = client.get("/api/v1/members/SW-M002", headers=headers)
    assert other_prof.status_code == 403
    assert "Access denied" in other_prof.json()["detail"]

    # Member views their own profile directly -> 200 OK
    own_prof = client.get("/api/v1/members/SW-M001", headers=headers)
    assert own_prof.status_code == 200
    assert own_prof.json()["id"] == "SW-M001"

def test_maker_checker_segregation_of_duties(client):
    """
    Test 4: Maker-Checker Segregation of Duties
    The officer who recorded an incoming payment cannot be the officer who verifies it.
    """
    ref_code = "SEGR-DUTIES-001"
    payload = {
        "member_id": "SW-M001",
        "amount": "2500.00",
        "payment_date": str(date.today()),
        "category": "monthly_dues",
        "payment_method": "mpesa",
        "reference_number": ref_code,
        "recorded_by": "Grace Achieng (Treasury)"
    }
    create_res = client.post("/api/v1/contributions", json=payload)
    assert create_res.status_code == 201
    contrib_id = create_res.json()["id"]

    # Attempt verification by the SAME officer ("Grace Achieng") -> MUST be rejected
    same_officer_verify = client.post(
        f"/api/v1/contributions/{contrib_id}/verify",
        json={"verified_by": "Grace Achieng"}
    )
    assert same_officer_verify.status_code == 400
    assert "Maker-Checker Segregation of Duties" in same_officer_verify.json()["detail"]

    # Independent verification by another officer ("David Mwangi") -> MUST succeed
    diff_officer_verify = client.post(
        f"/api/v1/contributions/{contrib_id}/verify",
        json={"verified_by": "David Mwangi"}
    )
    assert diff_officer_verify.status_code == 200
    assert diff_officer_verify.json()["status"] == "verified"
    assert diff_officer_verify.json()["verified_by"] == "David Mwangi"

def test_conflict_of_interest_guard(client):
    """
    Test 5: Conflict of Interest Guard
    An authorized welfare officer or approver cannot approve or sanction their own welfare claim.
    """
    claim_payload = {
        "member_id": "SW-M003",
        "category": "medical",
        "urgency": "urgent",
        "amount_requested": "20000.00",
        "description": "Medical assistance for Peter Ochieng",
        "bank_or_mpesa_payout_details": "M-Pesa 0700000000"
    }
    claim_res = client.post("/api/v1/welfare", json=claim_payload)
    assert claim_res.status_code == 201
    claim_id = claim_res.json()["id"]

    # 1. Peter Ochieng attempts to approve his own claim by officer_name -> MUST be rejected
    self_approve_res = client.post(f"/api/v1/welfare/{claim_id}/status", json={
        "status": "approved",
        "notes": "Self approval attempt",
        "officer_name": "Peter Ochieng",
        "officer_role": "approver",
        "amount_approved": "20000.00"
    })
    assert self_approve_res.status_code == 400
    assert "Conflict of Interest" in self_approve_res.json()["detail"]

    # 2. Officer whose user account is linked to SW-M003 attempts to approve via auth token -> MUST be rejected
    approver_token = get_auth_token(client, "approver@solianwolves.org", "approver123")
    token_self_approve = client.post(
        f"/api/v1/welfare/{claim_id}/status",
        json={"status": "approved", "amount_approved": "20000.00"},
        headers=auth_headers(approver_token)
    )
    assert token_self_approve.status_code == 400
    assert "Conflict of Interest" in token_self_approve.json()["detail"]

    # 3. Approval by independent officer (David Mwangi / Welfare Officer) -> MUST succeed
    independent_res = client.post(f"/api/v1/welfare/{claim_id}/status", json={
        "status": "approved",
        "notes": "Reviewed and sanctioned by Welfare Officer",
        "officer_name": "David Mwangi",
        "officer_role": "welfare_officer",
        "amount_approved": "20000.00"
    })
    assert independent_res.status_code == 200
    assert independent_res.json()["status"] == "approved"

def test_auditor_role_privileges(client):
    """
    Test 6: Independent Auditor Role
    Auditor has read-only assurance access to audit logs, ledger, reports, and accounts,
    but cannot create contributions or execute disbursements.
    """
    auditor_token = get_auth_token(client, "auditor@solianwolves.org", "auditor123")
    headers = auth_headers(auditor_token)

    # 1. Auditor can view audit logs
    audit_res = client.get("/api/v1/audit", headers=headers)
    assert audit_res.status_code == 200
    assert "items" in audit_res.json()

    # 2. Auditor can view treasury reconciliation & ledger
    rec_res = client.get("/api/v1/treasury/reconciliation", headers=headers)
    assert rec_res.status_code == 200

    ledger_res = client.get("/api/v1/treasury/ledger", headers=headers)
    assert ledger_res.status_code == 200

    # 3. Auditor can view users
    users_res = client.get("/api/v1/users", headers=headers)
    assert users_res.status_code == 200

    # 4. Auditor CANNOT record contributions (read-only assurance)
    write_res = client.post("/api/v1/contributions", json={
        "member_id": "SW-M001",
        "amount": "1000.00",
        "payment_date": str(date.today()),
        "category": "monthly_dues",
        "payment_method": "mpesa",
        "reference_number": "AUDITOR-ILLEGAL-01"
    }, headers=headers)
    assert write_res.status_code == 403
