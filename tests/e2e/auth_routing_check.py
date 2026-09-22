#!/usr/bin/env python3
"""
Automated pre-deployment checks for auth and role-based routing.

Covers:
  1. Login page renders and rejects a wrong password with a visible error.
  2. Unauthenticated visitors are redirected away from operator routes
     (control panel, affiliate manager, AI CEO).
  3. A super-admin session reaches the control panel, affiliate manager and
     AI CEO screens (no endless "Checking workspace access..." state).
  4. The "Back to Control Panel" control is visible inside a module and
     navigates back to /control-panel.
  5. An invalid path renders the not-found experience instead of a crash.

Run against the dev server:  python3 tests/e2e/auth_routing_check.py
Exits non-zero when any check fails.

The super-admin checks need a minted session at
~/.cache/lovable-auth/session.json (created by `lovable auth-session --json`).
Without it those checks are reported as SKIP, not failures.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("APP_BASE_URL", "http://localhost:8080")
SESSION_FILE = Path(os.path.expanduser("~/.cache/lovable-auth/session.json"))
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

# Credentials come from the environment only — never hardcode secrets here.
TEST_EMAIL = os.environ.get("TEST_EMAIL", "")
TEST_PASS = os.environ.get("TEST_PASS", "")

results = []


def report(name, ok, detail=""):
    results.append((name, ok, detail))
    mark = "PASS" if ok is True else ("SKIP" if ok is None else "FAIL")
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


async def fresh_page(pw):
    browser = await pw.chromium.launch(headless=True)
    context = await browser.new_context(viewport={"width": 1280, "height": 900})
    return browser, context, await context.new_page()


async def restore_session(context, page):
    minted = json.loads(SESSION_FILE.read_text())
    cookies = minted.get("cookies") or []
    for c in cookies:
        c["url"] = BASE
    if cookies:
        await context.add_cookies(cookies)
    await page.goto(BASE, wait_until="domcontentloaded")
    await page.evaluate(
        "window.localStorage.setItem(%s, %s)"
        % (json.dumps(minted["storage_key"]), json.dumps(json.dumps(minted["session"])))
    )


async def main():
    async with async_playwright() as pw:
        # 1. Login page renders.
        browser, context, page = await fresh_page(pw)
        try:
            await page.goto(f"{BASE}/login", wait_until="domcontentloaded")
            await page.wait_for_timeout(2500)
            email = page.locator('input[type="email"]')
            ok = await email.count() > 0
            report("login page renders", ok, page.url)

            # Wrong password must show an error, not sign in.
            if ok:
                await email.fill("nobody@example.com")
                await page.locator('input[type="password"]').fill("wrong-password-123")
                await page.locator('button[type="submit"]').first.click()
                shown = False
                for _ in range(20):
                    await page.wait_for_timeout(500)
                    body = (await page.inner_text("body")).lower()
                    if any(
                        w in body
                        for w in ("invalid", "incorrect", "failed", "unable to sign in")
                    ):
                        shown = True
                        break
                still_on_login = "/login" in page.url or "/auth" in page.url
                report(
                    "login rejects bad password",
                    still_on_login and shown,
                    page.url,
                )
        finally:
            await browser.close()

        # 2. Unauthenticated users are bounced from operator routes. The gate
        # either redirects to /login or renders an access-restricted screen;
        # both are acceptable as long as the console itself never renders.
        for path in ("/control-panel", "/affiliate-manager", "/ai-ceo/live-monitor"):
            browser, context, page = await fresh_page(pw)
            try:
                await page.goto(f"{BASE}{path}", wait_until="domcontentloaded")
                await page.wait_for_timeout(6000)
                bounced = "/login" in page.url or "/auth" in page.url
                body = (await page.inner_text("body")).lower()
                restricted = "access restricted" in body or "return to sign in" in body
                report(
                    f"anonymous blocked from {path}",
                    bounced or restricted,
                    page.url,
                )
            finally:
                await browser.close()

        # 3-5. Super-admin session checks (skipped without a minted session).
        if not SESSION_FILE.exists():
            for name in (
                "super-admin opens /control-panel",
                "super-admin opens /affiliate-manager",
                "super-admin opens /ai-ceo/live-monitor",
                "back-to-control-panel button works",
                "invalid path shows not-found",
            ):
                report(name, None, "no minted session file")
        else:
            browser, context, page = await fresh_page(pw)
            try:
                await restore_session(context, page)

                for path in (
                    "/control-panel",
                    "/affiliate-manager",
                    "/ai-ceo/live-monitor",
                ):
                    await page.goto(f"{BASE}{path}", wait_until="domcontentloaded")
                    await page.wait_for_timeout(9000)
                    body = await page.inner_text("body")
                    stuck = "Checking workspace access" in body
                    denied = "Access restricted" in body
                    report(
                        f"super-admin opens {path}",
                        not stuck and not denied and path in page.url,
                        page.url,
                    )
                    if path == "/ai-ceo/live-monitor":
                        await page.screenshot(path=str(SHOTS / "ai-ceo-module.png"))

                # Back to Control Panel button inside a module.
                await page.goto(f"{BASE}/ai-ceo/live-monitor", wait_until="domcontentloaded")
                await page.wait_for_timeout(6000)
                back = page.get_by_role("link", name="Back to Control Panel").first
                visible = await back.count() > 0 and await back.is_visible()
                report("back button visible in module", visible)
                if visible:
                    await back.click()
                    await page.wait_for_timeout(5000)
                    report(
                        "back button returns to /control-panel",
                        "/control-panel" in page.url,
                        page.url,
                    )
                    await page.screenshot(path=str(SHOTS / "back-to-control-panel.png"))

                # Invalid path must render the not-found UI, not a crash.
                await page.goto(f"{BASE}/definitely-not-a-page-xyz", wait_until="domcontentloaded")
                await page.wait_for_timeout(3000)
                body = (await page.inner_text("body")).lower()
                ok = any(w in body for w in ("not found", "404", "doesn't exist"))
                report("invalid path shows not-found", ok, page.url)
            finally:
                await browser.close()

    failed = [r for r in results if r[1] is False]
    print(f"\n{len(results) - len(failed) - sum(1 for r in results if r[1] is None)} passed, "
          f"{sum(1 for r in results if r[1] is None)} skipped, {len(failed)} failed")
    sys.exit(1 if failed else 0)


asyncio.run(main())
