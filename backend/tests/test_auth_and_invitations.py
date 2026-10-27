import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
import secrets

from app.models.orm import User, Member, AccountInvitation, UserSession, PasswordResetToken
from app.core.security import hash_password, create_access_token
try:
    from scripts.setup_initial_admin import setup_admin
    from scripts.backup_restore import test_backup_and_restore_cycle
except ImportError:
    from backend.scripts.setup_initial_admin import setup_admin
    from backend.scripts.backup_restore import test_backup_and_restore_cycle

def test_login_with_email_and_membership_number(client, db_session):
    """
    Acceptance Criteria #3:
    Sign in with either official email address or membership number.
    """
    # 1. Sign in with Email
    resp_email = client.post("/api/v1/auth/login", json={
        "identifier": "member@solianwolves.org",
        "password": "member123"
    })
    assert resp_email.status_code == 200
    data_email = resp_email.json()
    assert data_email["email"] == "member@solianwolves.org"
    assert "access_token" in data_email
    assert "member" in data_email["roles"]

    # 2. Sign in with Membership Number
    resp_mem = client.post("/api/v1/auth/login", json={
        "identifier": "SW-2026-001",
        "password": "member123"
    })
    assert resp_mem.status_code == 200, f"Membership number login failed: {resp_mem.text}"
    data_mem = resp_mem.json()
    assert data_mem["name"] == "John Kiprono"
    assert "access_token" in data_mem

    # 3. Invalid credentials
    resp_bad = client.post("/api/v1/auth/login", json={
        "identifier": "SW-M001",
        "password": "wrongpassword123"
    })
    assert resp_bad.status_code == 401

def test_persistent_session_and_revocation(client, db_session):
    """
    Acceptance Criteria #3 & #6:
    Persistent session with cookie support, session restoration via /auth/me,
    and server-side revocation on logout.
    """
    # Login to obtain session cookie and Bearer token
    login_resp = client.post("/api/v1/auth/login", json={
        "identifier": "admin@solianwolves.org",
        "password": "admin123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert "sw_session" in login_resp.cookies

    # Restore session using Bearer header
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@solianwolves.org"

    # Logout and revoke session
    logout_resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # Attempting to use the revoked session must now return 401 Unauthorized
    revoked_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert revoked_resp.status_code == 401
    assert "revoked" in revoked_resp.json()["detail"].lower()

def test_admin_member_creation_and_activation_invitation(client, db_session):
    """
    Acceptance Criteria #2:
    Administrator registers a member and backend automatically issues
    a single-use, 72-hour expiring activation invitation token.
    """
    admin_login = client.post("/api/v1/auth/login", json={
        "identifier": "admin@solianwolves.org",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    nat_id = f"NAT-{secrets.token_hex(4)}"
    phone = f"+2547{secrets.token_hex(4)}"
    member_email = f"new_{secrets.token_hex(3)}@wolves.org"

    # 1. Admin registers member
    create_resp = client.post("/api/v1/admin/members", headers=admin_headers, json={
        "full_name": "Amina Mohamed",
        "national_id": nat_id,
        "phone": phone,
        "email": member_email,
        "category": "full_member",
        "status": "active",
        "date_joined": date.today().isoformat(),
        "monthly_commitment": "1500.00",
        "next_of_kin": {
            "name": "Fatuma Mohamed",
            "relationship": "Sister",
            "phone": "+254 722 000 111",
            "email": "fatuma@wolves.org"
        }
    })
    assert create_resp.status_code == 201
    create_data = create_resp.json()
    assert "invitation_token" in create_data
    invitation_token = create_data["invitation_token"]
    mem_num = create_data["member"]["membership_number"]

    # 2. Member activates account with single-use invitation token
    activate_resp = client.post("/api/v1/auth/activate", json={
        "token": invitation_token,
        "password": "SecurePassword123",
        "name": "Amina Mohamed"
    })
    assert activate_resp.status_code == 200
    assert "activated" in activate_resp.json()["message"].lower()

    # 3. Re-using the same invitation token must fail
    reuse_resp = client.post("/api/v1/auth/activate", json={
        "token": invitation_token,
        "password": "AnotherPassword123"
    })
    assert reuse_resp.status_code == 400
    assert "already been used" in reuse_resp.json()["detail"].lower()

    # 4. Member can now log in with their Membership Number and chosen password
    new_login = client.post("/api/v1/auth/login", json={
        "identifier": mem_num,
        "password": "SecurePassword123"
    })
    assert new_login.status_code == 200
    assert new_login.json()["email"] == member_email

def test_password_recovery_and_reset(client, db_session):
    """
    Acceptance Criteria #6:
    Password recovery token issuance and reset completion.
    """
    # 1. Initiate forgot password
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={
        "identifier": "member@solianwolves.org"
    })
    assert forgot_resp.status_code == 200
    reset_token = forgot_resp.json()["reset_token"]
    assert reset_token is not None

    # 2. Complete reset
    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewSecretPassword2026"
    })
    assert reset_resp.status_code == 200

    # 3. Log in with new password
    login_new = client.post("/api/v1/auth/login", json={
        "identifier": "member@solianwolves.org",
        "password": "NewSecretPassword2026"
    })
    assert login_new.status_code == 200

    # 4. Restore baseline password for remaining tests
    restore_req = client.post("/api/v1/auth/forgot-password", json={
        "identifier": "member@solianwolves.org"
    })
    restore_token = restore_req.json()["reset_token"]
    client.post("/api/v1/auth/reset-password", json={
        "token": restore_token,
        "new_password": "member123"
    })

def test_role_grant_and_revocation(client, db_session):
    """
    Acceptance Criteria #4 & #5:
    Multi-role assignment: an officer can have both Member and officer roles,
    changing UI without requiring duplicate accounts.
    """
    admin_login = client.post("/api/v1/auth/login", json={
        "identifier": "admin@solianwolves.org",
        "password": "admin123"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    target_user_id = "USR-005"  # John Kiprono (General Member)

    # 1. Grant Finance Officer role to John Kiprono
    grant_resp = client.post(
        f"/api/v1/admin/users/{target_user_id}/roles",
        headers=admin_headers,
        json={"role": "finance_officer"}
    )
    assert grant_resp.status_code == 200
    roles = grant_resp.json()["roles"]
    assert "finance_officer" in roles
    assert "member" in roles

    # 2. Revoke Finance Officer role
    revoke_resp = client.delete(
        f"/api/v1/admin/users/{target_user_id}/roles/finance_officer",
        headers=admin_headers
    )
    assert revoke_resp.status_code == 200
    updated_roles = revoke_resp.json()["roles"]
    assert "finance_officer" not in updated_roles

def test_initial_administrator_appointment_script(db_session):
    """
    Acceptance Criteria #1:
    Controlled one-time procedure to initialize association administrator.
    Refuses duplicate run without --force.
    """
    # Should refuse since admin already exists
    refusal = setup_admin(name="Test Admin", email="duplicate@wolves.org", password="ValidPass123", force=False)
    assert refusal is False

    # Succeeds with force override
    success = setup_admin(name="Executive Admin", email="exec@wolves.org", password="ValidPass123", force=True)
    assert success is True

def test_automated_backup_and_restore_cycle():
    """
    Acceptance Criteria #9:
    Automated backup verification test with cryptographic checksum validation.
    """
    passed = test_backup_and_restore_cycle()
    assert passed is True
