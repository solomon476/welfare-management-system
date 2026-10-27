from sqlalchemy.orm import Session
from datetime import date, datetime
from decimal import Decimal

from ..models.orm import User, Member, Contribution, WelfareRequest, WelfareDecision, FinancialLedgerEntry, OrganizationSettings, AuditLog, Role, UserRole
from ..core.security import hash_password
from ..core.config import settings

def init_db(db: Session):
    # 0. System Roles
    if db.query(Role).count() == 0:
        default_roles = [
            Role(id="admin", name="Administrator", description="Full administrative authority, accounts, and association settings"),
            Role(id="finance_officer", name="Finance Officer", description="Record and verify contributions; access financial ledger"),
            Role(id="welfare_officer", name="Welfare Officer", description="Review welfare assistance applications and make recommendations"),
            Role(id="welfare_approver", name="Welfare Approver", description="Approve or reject welfare assistance within assigned limits"),
            Role(id="approver", name="Welfare Approver Alias", description="Backward-compatibility alias for approver role"),
            Role(id="member", name="General Member", description="Access personal member portal, contributions, and welfare requests"),
            Role(id="auditor", name="Auditor", description="Read-only assurance access to financial ledger and immutable audit trails")
        ]
        db.add_all(default_roles)
        db.flush()
    # 1. Organization Settings
    existing_settings = db.query(OrganizationSettings).first()
    if not existing_settings:
        org_settings = OrganizationSettings(
            id=1,
            org_name="Solian Wolves Welfare Association",
            tagline="Empowering Members Through Solidarity",
            registration_number="WLF/2026/0892",
            currency="KES",
            monthly_dues_amount=Decimal("1500.00"),
            welfare_registration_fee=Decimal("2000.00"),
            opening_reserve_balance=settings.DEFAULT_OPENING_RESERVE,
            max_bereavement_benefit=Decimal("50000.00"),
            max_medical_benefit=Decimal("35000.00"),
            max_education_benefit=Decimal("25000.00"),
            approval_quorum=settings.APPROVAL_QUORUM,
            contact_email="admin@solianwolves.org",
            contact_phone="+254 711 234 567",
            address="Wolves Plaza, 4th Floor, Upper Hill, Nairobi",
            is_demo_mode=True
        )
        db.add(org_settings)

    # 2. Users
    solian_default_users = [
        User(
            id="USR-SOLOMON",
            name="Solomon",
            email="solomon@solianwolves.org",
            hashed_password=hash_password("solianalphas"),
            role="admin",
            avatar="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            department="Executive Committee",
            linked_member_id="SW-M-SOLOMON",
            is_active=True
        ),
        User(
            id="USR-IAN",
            name="Ian",
            email="ian@solianwolves.org",
            hashed_password=hash_password("solianalphas"),
            role="secretary",
            avatar="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
            department="Executive Secretariat",
            linked_member_id="SW-M-IAN",
            is_active=True
        ),
        User(
            id="USR-NOELLA",
            name="Noella",
            email="noella@solianwolves.org",
            hashed_password=hash_password("solianalphas"),
            role="finance_officer",
            avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            department="Treasury & Finance",
            linked_member_id="SW-M-NOELLA",
            is_active=True
        ),
    ]
    for su in solian_default_users:
        existing = db.query(User).filter((User.id == su.id) | (User.email == su.email)).first()
        if not existing:
            db.add(su)
        else:
            existing.hashed_password = hash_password("solianalphas")
            existing.role = su.role
            existing.linked_member_id = su.linked_member_id

    users = [
        User(
            id="USR-001",
            name="Sarah Wanjiku",
            email="admin@solianwolves.org",
            hashed_password=hash_password("admin123"),
            role="admin",
            avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            department="Executive Committee",
            linked_member_id="SW-M003",
            is_active=True
        ),
        User(
            id="USR-002",
            name="David Mwangi",
            email="welfare@solianwolves.org",
            hashed_password=hash_password("welfare123"),
            role="welfare_officer",
            avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            department="Welfare Directorate",
            linked_member_id="SW-M002",
            is_active=True
        ),
        User(
            id="USR-003",
            name="Grace Achieng",
            email="finance@solianwolves.org",
            hashed_password=hash_password("finance123"),
            role="finance_officer",
            avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            department="Treasury & Finance",
            linked_member_id="SW-M001",
            is_active=True
        ),
        User(
            id="USR-004",
            name="Dr. Benson Otieno",
            email="approver@solianwolves.org",
            hashed_password=hash_password("approver123"),
            role="welfare_approver",
            avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            department="Board of Trustees",
            linked_member_id="SW-M003",
            is_active=True
        ),
        User(
            id="USR-005",
            name="John Kiprono",
            email="member@solianwolves.org",
            hashed_password=hash_password("member123"),
            role="member",
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            linked_member_id="SW-M001",
            department="General Assembly",
            is_active=True
        ),
        User(
            id="USR-006",
            name="Robert Mutua",
            email="auditor@solianwolves.org",
            hashed_password=hash_password("auditor123"),
            role="auditor",
            avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
            department="External Audit & Assurance",
            linked_member_id=None,
            is_active=True
        )
    ]
    for u in users:
        existing = db.query(User).filter((User.id == u.id) | (User.email == u.email)).first()
        if not existing:
            db.add(u)

    # 3. Members
    solian_default_members = [
        Member(
            id="SW-M-SOLOMON",
            membership_number="SW-EXEC-001",
            full_name="Solomon",
            national_id="30112233",
            phone="0799589508",
            email="solomon@solianwolves.org",
            category="full_member",
            status="active",
            date_joined=date(2024, 1, 1),
            monthly_commitment=Decimal("1500.00"),
            next_of_kin_name="Solomon Family",
            next_of_kin_relationship="Family",
            next_of_kin_phone="0799589508",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
        ),
        Member(
            id="SW-M-IAN",
            membership_number="SW-EXEC-002",
            full_name="Ian",
            national_id="30112234",
            phone="0714729996",
            email="ian@solianwolves.org",
            category="full_member",
            status="active",
            date_joined=date(2024, 1, 1),
            monthly_commitment=Decimal("1500.00"),
            next_of_kin_name="Ian Family",
            next_of_kin_relationship="Family",
            next_of_kin_phone="0714729996",
            avatar_url="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
        ),
        Member(
            id="SW-M-NOELLA",
            membership_number="SW-EXEC-003",
            full_name="Noella",
            national_id="30112235",
            phone="0758018973",
            email="noella@solianwolves.org",
            category="full_member",
            status="active",
            date_joined=date(2024, 1, 1),
            monthly_commitment=Decimal("1500.00"),
            next_of_kin_name="Noella Family",
            next_of_kin_relationship="Family",
            next_of_kin_phone="0758018973",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
        ),
    ]
    for sm in solian_default_members:
        existing_m = db.query(Member).filter(
            (Member.id == sm.id) | (Member.phone == sm.phone) | (Member.membership_number == sm.membership_number)
        ).first()
        if not existing_m:
            db.add(sm)

    members = [
        Member(
            id="SW-M001",
            membership_number="SW-2026-001",
            full_name="John Kiprono",
            national_id="28475912",
            phone="+254 722 100 200",
            email="member@solianwolves.org",
            category="full_member",
            status="active",
            date_joined=date(2024, 1, 15),
            monthly_commitment=Decimal("1500.00"),
            next_of_kin_name="Mercy Kiprono",
            next_of_kin_relationship="Spouse",
            next_of_kin_phone="+254 722 100 201",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        ),
        Member(
            id="SW-M002",
            membership_number="SW-2026-002",
            full_name="Mary Njeri",
            national_id="31902844",
            phone="+254 733 400 500",
            email="mary.njeri@example.com",
            category="full_member",
            status="active",
            date_joined=date(2024, 2, 1),
            monthly_commitment=Decimal("1500.00"),
            next_of_kin_name="Samuel Njeri",
            next_of_kin_relationship="Brother",
            next_of_kin_phone="+254 733 400 501",
            avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
        ),
        Member(
            id="SW-M003",
            membership_number="SW-2026-003",
            full_name="Peter Ochieng",
            national_id="25671903",
            phone="+254 710 600 700",
            email="peter.ochieng@example.com",
            category="senior",
            status="active",
            date_joined=date(2023, 11, 10),
            monthly_commitment=Decimal("2000.00"),
            next_of_kin_name="Amina Ochieng",
            next_of_kin_relationship="Spouse",
            next_of_kin_phone="+254 710 600 701",
            avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80"
        )
    ]
    for m in members:
        existing_m = db.query(Member).filter(
            (Member.id == m.id) | (Member.phone == m.phone) | (Member.membership_number == m.membership_number)
        ).first()
        if not existing_m:
            db.add(m)

    # 4. Opening Sinking Reserve Transaction in Ledger
    if db.query(FinancialLedgerEntry).count() == 0:
        ledger_init = FinancialLedgerEntry(
            id="TXN-INIT-001",
            date=date(2026, 1, 1),
            type="income",
            category="Opening Reserve Fund",
            amount=settings.DEFAULT_OPENING_RESERVE,
            description="Board-authorized capital sinking reserve allocation",
            reference="RES-2026-ALLOC",
            payment_mode="bank_transfer",
            recorded_by="Sarah Wanjiku",
            is_reconciled=True,
            reconciled_at=datetime(2026, 1, 1, 8, 0)
        )
        db.add(ledger_init)

    db.commit()
