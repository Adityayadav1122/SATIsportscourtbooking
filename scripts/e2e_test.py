#!/usr/bin/env python3
"""End-to-end smoke tests for the SATI Sports Hall booking app."""

import time
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
TEST_PASSWORD = "Test1234!"
TEST_NAME = "E2E Test User"

GOTO_TIMEOUT = 120000


def _goto(page, url):
    page.goto(url, timeout=GOTO_TIMEOUT)
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)


def register(page, scholar=None, password=None):
    scholar = scholar or f"21e2e{int(time.time()) % 10000:04d}"
    password = password or TEST_PASSWORD
    _goto(page, f"{BASE}/register")
    page.get_by_label("Full Name").fill(TEST_NAME)
    page.get_by_label("Scholar Number").fill(scholar)
    page.locator('input[type="password"]').fill(password)
    page.get_by_label("Department").fill("MCA")
    page.get_by_label("Year").select_option("3rd")
    page.get_by_role("button", name="Create Account").click()
    page.wait_for_url(f"{BASE}/", timeout=GOTO_TIMEOUT)
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    print(f"  [OK] Registered scholar={scholar}")
    return scholar


def login(page, scholar, password, role="student"):
    _goto(page, f"{BASE}/login")
    if role == "faculty":
        page.get_by_role("button", name="faculty", exact=True).click()
    if role == "student":
        page.get_by_label("Scholar Number").fill(scholar)
    else:
        page.get_by_label("Employee / Faculty ID").fill(scholar)
    page.locator('input[type="password"]').fill(password)
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url(f"{BASE}/", timeout=GOTO_TIMEOUT)
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    print(f"  [OK] Logged in as {scholar} ({role})")


def test_home(page):
    _goto(page, BASE)
    expect(page.get_by_text("SATI Sports Hall").first).to_be_visible()
    expect(page.get_by_text("Book your sports slot")).to_be_visible()
    expect(page.get_by_text("Today's Availability")).to_be_visible()
    print("  [OK] Home page loads correctly")


def _pick_slot(page):
    """From step 3 of the wizard, click the first available slot button."""
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    expect(page.get_by_text("Select a time slot")).to_be_visible()
    btn = None
    for label in ("Open", "Available"):
        loc = page.locator("div.grid button:not([disabled])").filter(has_text=label)
        if loc.count() > 0:
            btn = loc.first
            break
    if btn is None:
        btn = page.locator("div.grid button:not([disabled])").first
    text = btn.inner_text()
    print(f"  [OK] Slot chosen: {text!r}")
    btn.click()
    page.wait_for_timeout(200)
    expect(page.get_by_role("button", name="Confirm Booking")).to_be_visible()


def test_booking_wizard(page):
    _goto(page, f"{BASE}/book")
    expect(page.get_by_text("Choose a sport")).to_be_visible()
    page.get_by_role("button", name="Badminton").click()
    page.wait_for_timeout(200)
    expect(page.get_by_text("Pick a date")).to_be_visible()
    page.locator("button", has_text="Tomorrow").first.click()
    page.wait_for_timeout(200)
    _pick_slot(page)
    page.get_by_role("button", name="Confirm Booking").click()
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    expect(page.get_by_role("heading", name="Booking Confirmed!")).to_be_visible(timeout=15000)
    el = page.locator("text=Booking ID:").first
    booking_id = el.inner_text().split(":")[-1].strip() if el.count() else "unknown"
    print(f"  [OK] Booking confirmed, id={booking_id}")
    return booking_id


def test_my_bookings(page, expect_empty=False):
    _goto(page, f"{BASE}/my-bookings")
    expect(page.get_by_role("heading", name="My Bookings")).to_be_visible()
    if expect_empty:
        expect(page.get_by_text("No upcoming bookings")).to_be_visible()
        print("  [OK] My Bookings: empty state shown")
    else:
        expect(page.get_by_text("confirmed").first).to_be_visible()
        print("  [OK] My Bookings: upcoming booking shown as confirmed")


def test_cancel_booking(page):
    _goto(page, f"{BASE}/my-bookings")
    page.get_by_role("button", name="Cancel", exact=True).first.click()
    page.wait_for_timeout(200)
    expect(page.get_by_text("Cancel this?")).to_be_visible()
    page.get_by_role("button", name="Yes", exact=True).click()
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    page.wait_for_timeout(500)
    expect(page.get_by_text("cancelled").first).to_be_visible()
    print("  [OK] Booking cancelled successfully")


def test_double_book_ui_protection(page):
    _goto(page, f"{BASE}/book")
    page.get_by_role("button", name="Badminton").click()
    page.wait_for_timeout(200)
    page.locator("button", has_text="Tomorrow").first.click()
    page.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
    expect(page.get_by_text("Select a time slot")).to_be_visible()
    slot_07 = page.locator("div.grid button:has-text('07:00')")
    expect(slot_07).to_be_visible()
    expect(slot_07).to_be_disabled()
    print("  [OK] Already-booked slot (07:00) is disabled in the UI")


def test_admin_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        login(page, "coordinator", "hall8855coord", role="faculty")
        _goto(page, f"{BASE}/admin")
        expect(page.get_by_text("Admin Dashboard")).to_be_visible()
        expect(page.get_by_text("Total Bookings")).to_be_visible()
        expect(page.get_by_text("Registered Members")).to_be_visible()
        expect(page.get_by_label("Date")).to_be_visible()
        expect(page.get_by_label("Sport")).to_be_visible()
        print("  [OK] Admin dashboard + filters work")
        browser.close()


def test_concurrent_double_book():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        pg1 = browser.new_page()
        pg2 = browser.new_page()

        ts = int(time.time()) % 100000
        s1 = f"21c1a{ts:05d}"
        s2 = f"21c2b{ts:05d}"
        register(pg1, scholar=s1, password="Conc1234!")
        register(pg2, scholar=s2, password="Conc1234!")

        for pg in (pg1, pg2):
            _goto(pg, f"{BASE}/book")
            pg.get_by_role("button", name="Badminton").click()
            pg.wait_for_timeout(200)
            pg.locator("button", has_text="Tomorrow").first.click()
            pg.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)

        slot_btn = pg1.locator("div.grid button:not([disabled])").first
        if slot_btn.count() == 0 or slot_btn.is_disabled():
            print("  [WARN] No free slots on badminton tomorrow - skipping concurrency test")
            browser.close()
            return
        slot_label = slot_btn.inner_text()
        print(f"  [OK] Racing on slot: {slot_label!r}")
        slot_btn.click()
        pg1.wait_for_timeout(150)
        pg1.get_by_role("button", name="Confirm Booking").click()
        pg1.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
        try:
            expect(pg1.get_by_role("heading", name="Booking Confirmed!")).to_be_visible(timeout=15000)
            u1_ok = True
        except Exception:
            u1_ok = False

        slot_time = slot_label.split("\n")[0]
        slot_btn2 = pg2.locator("div.grid button", has_text=slot_time).first
        disabled = slot_btn2.is_disabled() if slot_btn2.count() else True
        u2_ok = False
        rejected_msg = None
        if not disabled:
            slot_btn2.click(force=True)
            pg2.wait_for_timeout(150)
            pg2.get_by_role("button", name="Confirm Booking").click()
            pg2.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
            try:
                expect(pg2.get_by_role("heading", name="Booking Confirmed!")).to_be_visible(timeout=15000)
                u2_ok = True
            except Exception:
                u2_ok = False
            if not u2_ok:
                rejected_msg = pg2.locator(".bg-ember-100").inner_text()

        print(f"  [OK] User1 ({s1}) succeeded={u1_ok}")
        print(f"  [OK] User2 ({s2}) slot-disabled={disabled} succeeded={u2_ok} rejected={rejected_msg!r}")
        assert u1_ok and not u2_ok, "Double booking was NOT prevented!"
        if not disabled:
            assert rejected_msg and "someone else" in rejected_msg, (
                "Second clicker should get a 'just booked' rejection message"
            )
        print("  [OK] Concurrency: exactly one booking allowed (DB protection holds)")

        if u1_ok:
            _goto(pg1, f"{BASE}/my-bookings")
            pg1.get_by_role("button", name="Cancel", exact=True).first.click()
            pg1.wait_for_timeout(200)
            pg1.get_by_role("button", name="Yes", exact=True).click()
            pg1.wait_for_load_state("networkidle", timeout=GOTO_TIMEOUT)
            print("  [OK] Concurrent booking cancelled (cleanup)")
        browser.close()


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=== HOME PAGE ===")
        test_home(page)

        print("\n=== REGISTER ===")
        register(page)

        print("\n=== BOOKING WIZARD ===")
        test_booking_wizard(page)

        print("\n=== MY BOOKINGS (has booking) ===")
        test_my_bookings(page)

        print("\n=== CANCEL BOOKING ===")
        test_cancel_booking(page)

        print("\n=== MY BOOKINGS (empty after cancel) ===")
        test_my_bookings(page, expect_empty=True)

        print("\n=== DOUBLE-BOOK UI PROTECTION ===")
        test_double_book_ui_protection(page)

        browser.close()

    print("\n=== ADMIN DASHBOARD ===")
    test_admin_dashboard()

    print("\n=== CONCURRENT DOUBLE-BOOK TEST ===")
    test_concurrent_double_book()

    print("\n[PASS] All E2E tests completed!")