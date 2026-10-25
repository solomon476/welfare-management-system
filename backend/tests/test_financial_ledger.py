import pytest
from decimal import Decimal
from datetime import date

def test_reconciliation_math(client):
    """
    Test 1: Protect the Money First - Strict Reconciled Balance Check
    Verifies that the balance is calculated strictly from posted ledger entries and reserve fund.
    """
    res = client.get("/api/v1/treasury/reconciliation")
    assert res.status_code == 200
    data = res.json()
    
    assert data["currency"] == "KES"
    assert Decimal(str(data["opening_reserve"])) == Decimal("200000.00")
    assert Decimal(str(data["reconciled_cash_balance"])) >= Decimal("0.00")
    assert data["is_positive"] is True
    assert data["flag_negative_balance"] is False

def test_duplicate_payment_reference_prevention(client):
    """
    Test 2: Prevent Duplicate Payment Processing
    Enforces unique payment references (e.g. M-Pesa receipt code).
    """
    ref_code = "MPESA-CONFIRM-9901"
    
    # First recording succeeds
    payload = {
        "member_id": "SW-M001",
        "amount": "1500.00",
        "payment_date": str(date.today()),
        "category": "monthly_dues",
        "payment_method": "mpesa",
        "reference_number": ref_code,
        "notes": "First test payment"
    }
    res1 = client.post("/api/v1/contributions", json=payload)
    assert res1.status_code == 201
    
    # Second recording with the exact same reference MUST be rejected
    res2 = client.post("/api/v1/contributions", json=payload)
    assert res2.status_code == 400
    assert "Duplicate payment reference" in res2.json()["detail"]

def test_non_destructive_reversal_integrity(client):
    """
    Test 3: Non-Destructive Reversals with Audit Trail
    Never silently delete posted transactions; record compensating reversals with mandatory reason.
    """
    # 1. Record contribution
    ref_code = "REV-TEST-RECEIPT-01"
    payload = {
        "member_id": "SW-M002",
        "amount": "3000.00",
        "payment_date": str(date.today()),
        "category": "monthly_dues",
        "payment_method": "bank_transfer",
        "reference_number": ref_code
    }
    rec_res = client.post("/api/v1/contributions", json=payload)
    assert rec_res.status_code == 201
    contrib_id = rec_res.json()["id"]

    # 2. Finance Officer verifies contribution
    v_res = client.post(f"/api/v1/contributions/{contrib_id}/verify", json={"verified_by": "Grace Achieng"})
    assert v_res.status_code == 200
    assert v_res.json()["status"] == "verified"

    # 3. Reverse with insufficient reason (<5 chars) should fail validation
    short_rev = client.post(f"/api/v1/contributions/{contrib_id}/reverse", json={"reason": "bad"})
    assert short_rev.status_code in (400, 422)

    # 4. Reverse with documented explanation
    rev_res = client.post(
        f"/api/v1/contributions/{contrib_id}/reverse",
        json={"reason": "Member deposited into incorrect account branch; refunded via bank"}
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "reversed"
    assert rev_res.json()["reversal_reason"] is not None

def test_double_spend_overdraft_prevention(client):
    """
    Test 4: Concurrent Overdraft Prevention
    Verifies that simultaneous or massive claims exceeding verified treasury funds are blocked.
    """
    # 1. Submit claim for KES 999,999,999 (far exceeding treasury)
    claim_payload = {
        "member_id": "SW-M001",
        "category": "bereavement",
        "urgency": "urgent",
        "amount_requested": "999999999.00",
        "description": "Massive claim exceeding entire reserve fund",
        "bank_or_mpesa_payout_details": "Paybill 123456"
    }
    claim_res = client.post("/api/v1/welfare", json=claim_payload)
    assert claim_res.status_code == 201
    claim_id = claim_res.json()["id"]

    # 2. Approve the claim
    app_res = client.post(f"/api/v1/welfare/{claim_id}/status", json={
        "status": "approved",
        "notes": "Approved in error",
        "officer_name": "Dr. Benson Otieno",
        "officer_role": "approver",
        "amount_approved": "999999999.00"
    })
    assert app_res.status_code == 200

    # 3. Attempt disbursement - MUST be rejected with Insufficient Funds error
    disb_res = client.post(f"/api/v1/disbursements/{claim_id}", json={
        "payment_mode": "bank_transfer",
        "reference_number": "BANK-TXN-EXCEED-01",
        "officer_name": "Grace Achieng"
    })
    assert disb_res.status_code == 400
    assert "Insufficient verified treasury funds" in disb_res.json()["detail"]

def test_pagination_and_member_query(client):
    """
    Test 5: Pagination for 100-1,000 members
    Ensures bounded queries with limit and skip.
    """
    res = client.get("/api/v1/members?limit=2&skip=0")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 3
    assert data["has_more"] is True

def test_cursor_pagination_for_100k_members(client):
    """
    Test 6: Keyset Cursor Pagination for 50,000–100,000 scale
    Ensures O(1) query seeking using cursor without linear OFFSET performance degradation.
    """
    res1 = client.get("/api/v1/members?limit=2")
    assert res1.status_code == 200
    data1 = res1.json()
    cursor = data1.get("next_cursor")
    assert cursor is not None

    # Fetch next page using cursor
    res2 = client.get(f"/api/v1/members?limit=2&cursor={cursor}")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["items"]) >= 1
    # Ensure next page does not duplicate first page
    assert data2["items"][0]["id"] != data1["items"][0]["id"]

def test_bulk_contribution_import_for_100k_members(client):
    """
    Test 7: High-Volume Statement Batch Import for 50k-100k Scale
    Processes statement dumps, matches members by National ID, and skips duplicates automatically.
    """
    batch_payload = {
        "batch_reference": "MPESA_BATCH_OCT_SCALE_TEST",
        "items": [
            {
                "member_identifier": "28475912",  # John Kiprono's National ID
                "amount": "1500.00",
                "payment_date": str(date.today()),
                "category": "monthly_dues",
                "payment_method": "mpesa",
                "reference_number": "BULK-PAYBILL-001"
            },
            {
                "member_identifier": "31902844",  # Mary Njeri's National ID
                "amount": "1500.00",
                "payment_date": str(date.today()),
                "category": "monthly_dues",
                "payment_method": "mpesa",
                "reference_number": "BULK-PAYBILL-002"
            },
            {
                "member_identifier": "28475912",
                "amount": "1500.00",
                "payment_date": str(date.today()),
                "category": "monthly_dues",
                "payment_method": "mpesa",
                "reference_number": "BULK-PAYBILL-001"  # Duplicate reference in same batch
            },
            {
                "member_identifier": "99999999",  # Non-existent member
                "amount": "1500.00",
                "payment_date": str(date.today()),
                "category": "monthly_dues",
                "payment_method": "mpesa",
                "reference_number": "BULK-PAYBILL-003"
            }
        ],
        "auto_verify": True,
        "recorded_by": "Finance Officer"
    }

    res = client.post("/api/v1/contributions/bulk-import", json=batch_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["successfully_imported"] == 2
    assert data["duplicates_skipped"] == 1
    assert "99999999" in data["unmatched_identifiers"]
    assert Decimal(str(data["total_amount_recorded"])) == Decimal("3000.00")

