"""QA: external verification of the LIVE Vercel deployment (public, no auth).

Uses plain HTTP to check route statuses and Playwright to load pages and
detect console errors / JS exceptions / SSO redirects. Screenshots captured
at multiple viewports.
"""
import json
import sys
import urllib.request
import urllib.error

from playwright.sync_api import sync_playwright

BASE = "https://novabuild-8rgqnxj9c-pakstylebd.vercel.app"
OUT = "/tmp/nova-live-qa"

# routes that should return >= 200 (static or dynamic shell)
OK_ROUTES = [
    "/", "/login", "/register", "/verify", "/forgot-password", "/reset-password",
    "/app", "/admin", "/admin/users", "/admin/plans", "/admin/jobs", "/admin/settings",
]
# routes that should return 404 (real Next 404, NOT an SSO 302)
NOTFOUND_ROUTES = ["/definitely-not-a-real-route-xyz"]


def http_status(path: str) -> tuple[int, str]:
    url = BASE + path
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = resp.read(400).decode("utf-8", "replace")
            final = resp.geturl()
            return resp.status, f"final={final} body={body[:80]!r}"
    except urllib.error.HTTPError as e:
        body = e.read(400).decode("utf-8", "replace")
        final = e.geturl() if hasattr(e, "geturl") else ""
        return e.code, f"final={final} body={body[:80]!r}"
    except Exception as e:  # noqa: BLE001
        return -1, f"exc={e!r}"


def check_http() -> list[dict]:
    results = []
    for path in OK_ROUTES + NOTFOUND_ROUTES:
        status, detail = http_status(path)
        is_sso = "vercel.com/sso-api" in detail or "_vercel_sso_nonce" in detail
        results.append({
            "path": path, "status": status, "sso_redirect": is_sso, "detail": detail,
        })
    return results


def check_browser() -> list[dict]:
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for viewport, label in [({"width": 1440, "height": 900}, "desktop"),
                                ({"width": 768, "height": 1024}, "tablet"),
                                ({"width": 360, "height": 800}, "mobile")]:
            ctx = browser.new_context(viewport=viewport, device_scale_factor=1)
            for path in ["/", "/login", "/admin"]:
                page = ctx.new_page()
                console_errs = []
                page.on("console", lambda m: console_errs.append(m.text) if m.type in ("error",) else None)
                page.on("pageerror", lambda e: console_errs.append(str(e)))
                try:
                    resp = page.goto(BASE + path, wait_until="networkidle", timeout=60000)
                    page.wait_for_timeout(1500)
                    title = page.title()
                    h1 = ""
                    try:
                        h1 = page.locator("h1").first.inner_text(timeout=3000)
                    except Exception:  # noqa: BLE001
                        pass
                    is_sso = "vercel.com/sso-api" in page.url
                    # horizontal overflow check (mobile)
                    overflow = page.evaluate(
                        "document.documentElement.scrollWidth - document.documentElement.clientWidth"
                    )
                    results.append({
                        "viewport": label, "path": path,
                        "status": resp.status if resp else -1,
                        "final_url": page.url, "sso_redirect": is_sso,
                        "title": title[:60], "h1": h1[:60],
                        "console_errors": console_errs[:10],
                        "h_overflow": overflow, "screenshot": f"{OUT}-{label}-{path.replace('/', '_') or 'home'}.png",
                    })
                    page.screenshot(path=f"{OUT}-{label}-{path.replace('/', '_') or 'home'}.png", full_page=False)
                except Exception as e:  # noqa: BLE001
                    results.append({"viewport": label, "path": path, "error": repr(e)})
                finally:
                    page.close()
            ctx.close()
        browser.close()
    return results


def main() -> int:
    http = check_http()
    print(json.dumps({"http": http}, indent=2))
    browser = check_browser()
    print(json.dumps({"browser": browser}, indent=2))

    problems = []
    for r in http:
        if r["sso_redirect"]:
            problems.append(f"SSO redirect on {r['path']}")
        if r["path"] in OK_ROUTES and not (200 <= r["status"] < 500):
            problems.append(f"bad status {r['status']} on {r['path']}")
        if r["path"] in NOTFOUND_ROUTES and r["status"] != 404:
            problems.append(f"expected 404, got {r['status']} on {r['path']}")
    for r in browser:
        if r.get("error"):
            problems.append(f"browser error on {r.get('path')} @ {r.get('viewport')}: {r['error']}")
        if r.get("sso_redirect"):
            problems.append(f"SSO in browser on {r.get('path')} @ {r.get('viewport')}")
        if r.get("console_errors"):
            problems.append(f"console errors on {r.get('path')} @ {r.get('viewport')}: {r['console_errors']}")
        if r.get("h_overflow", 0) > 0:
            problems.append(f"horizontal overflow {r.get('h_overflow')}px on {r.get('path')} @ {r.get('viewport')}")

    if problems:
        print(f"\nPROBLEMS ({len(problems)}):")
        for p in problems:
            print(" -", p)
        return 1
    print("\nNO PROBLEMS FOUND.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
