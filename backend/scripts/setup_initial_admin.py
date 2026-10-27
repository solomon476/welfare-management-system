#!/usr/bin/env python3
"""
Solian Wolves Welfare Management System (WMS)
PRD Section 3 & Acceptance Criteria #1: Controlled Initial Administrator Appointment Script

This script provides a one-time controlled procedure to initialize or appoint
the association's first Administrator account. No default passwords are shipped.
"""

import sys
import os
import argparse
import getpass
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    from app.db.session import SessionLocal, Base, engine
    from app.models.orm import User, Role, UserRole, AuditLog
    from app.core.security import hash_password, validate_password_strength
except ImportError:
    from backend.app.db.session import SessionLocal, Base, engine
    from backend.app.models.orm import User, Role, UserRole, AuditLog
    from backend.app.core.security import hash_password, validate_password_strength

def setup_admin(name: str, email: str, password: str, force: bool = False) -> bool:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if an administrator already exists
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin and not force:
            print("\n❌ SECURITY ABORT: An Administrator already exists in this system.")
            print(f"   Existing Administrator: {existing_admin.name} <{existing_admin.email}>")
            print("   Per PRD 3, the initial administrator setup procedure is single-use.")
            print("   To appoint additional administrators, use the Admin Portal or supply --force.\n")
            return False

        # Validate password strength
        is_valid, msg = validate_password_strength(password)
        if not is_valid:
            print(f"\n❌ PASSWORD REJECTED: {msg}")
            print("   Password must be at least 8 characters and contain both letters and numbers.\n")
            return False

        clean_email = email.strip().lower()
        clean_name = name.strip()

        # Check if user with this email already exists
        target_user = db.query(User).filter(User.email == clean_email).first()
        if target_user:
            target_user.name = clean_name
            target_user.hashed_password = hash_password(password)
            target_user.role = "admin"
            target_user.is_active = True
            action_type = "INITIAL_ADMIN_UPDATED"
        else:
            user_count = db.query(User).count() + 1
            target_user = User(
                id=f"USR-{user_count:03d}",
                name=clean_name,
                email=clean_email,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(target_user)
            action_type = "INITIAL_ADMIN_APPOINTED"

        # Ensure admin role exists in Role table
        admin_role = db.query(Role).filter(Role.id == "admin").first()
        if not admin_role:
            db.add(Role(id="admin", name="Administrator", description="Full administrative authority"))

        # Log audit entry
        audit_entry = AuditLog(
            id=f"AUD-INIT-{int(datetime.utcnow().timestamp())}",
            timestamp=datetime.utcnow(),
            user_id=target_user.id or "SYSTEM",
            user_name=clean_name,
            user_role="admin",
            action=action_type,
            entity_type="user",
            entity_id=target_user.id or "USR-ADMIN",
            description=f"Association appointed initial Administrator {clean_name} ({clean_email}) via controlled setup procedure."
        )
        db.add(audit_entry)
        db.commit()

        print("\n" + "=" * 64)
        print("✅ SUCCESS: Initial Association Administrator Appointed!")
        print("=" * 64)
        print(f" • Administrator Name : {clean_name}")
        print(f" • Login Identifier   : {clean_email}")
        print(f" • Primary Role       : Administrator (admin)")
        print(f" • Account Status     : Active")
        print(f" • Audit Reference    : {audit_entry.id}")
        print("=" * 64)
        print("The administrator can now log in to the Solian Wolves WMS portal.\n")
        return True
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Appoint Association Initial Administrator for Solian Wolves WMS")
    parser.add_argument("--name", help="Full Name of the appointed Administrator")
    parser.add_argument("--email", help="Official email address of the Administrator")
    parser.add_argument("--password", help="Secure password for the Administrator (leave blank for interactive prompt)")
    parser.add_argument("--force", action="store_true", help="Force appointment even if an admin already exists")
    args = parser.parse_args()

    name = args.name
    email = args.email
    password = args.password

    if not name:
        name = input("Enter Appointed Administrator Full Name: ").strip()
    if not email:
        email = input("Enter Official Administrator Email: ").strip()
    if not password:
        password = getpass.getpass("Enter Secure Password (min 8 chars, letters & numbers): ").strip()
        confirm = getpass.getpass("Confirm Secure Password: ").strip()
        if password != confirm:
            print("\n❌ Passwords do not match. Aborting setup.\n")
            sys.exit(1)

    success = setup_admin(name=name, email=email, password=password, force=args.force)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
