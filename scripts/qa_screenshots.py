"""QA: screenshot + interaction verification for the NOVA landing page."""
import json
import sys

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "/tmp/nova-qa"

errors = []
interactions = []


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # ---------- Desktop ----------
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = ctx.new_page()
        page_errors = []
        page.on("console", lambda m: page_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        page.goto(BASE, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1800)  # let hero animations settle

        # hero content
        h1 = page.locator("h1").first
        interactions.append(("hero-h1", h1.inner_text().replace("\n", " | ")))
        interactions.append(("hero-cta", page.locator("a", has_text="Start exploring").count()))

        page.screenshot(path=f"{OUT}-desktop-01-hero.png", full_page=False)

        # scroll through page
        page.mouse.wheel(0, 3000)
        page.wait_for_timeout(900)
        page.screenshot(path=f"{OUT}-desktop-02-mid.png", full_page=False)

        # tabs in showcase
        page.locator("button[role=tab]", has_text="Summary").click()
        page.wait_for_timeout(700)
        interactions.append(("tab-summary-visible", page.locator("text=NOVA summary").count()))
        page.locator("button[role=tab]", has_text="Ask").click()
        page.wait_for_timeout(700)
        interactions.append(("tab-ask-visible", page.locator("text=Ask anything about your research…").count()))
        page.locator("button[role=tab]", has_text="Insights").click()
        page.wait_for_timeout(700)
        interactions.append(("tab-insights-visible", page.locator("text=Trending topics in your workspace").count()))

        # pricing toggle (yearly default -> monthly)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(700)
        monthly_btn = page.locator("button", has_text="monthly").first
        monthly_btn.click()
        page.wait_for_timeout(700)
        # $0 / $12 / $39 are monthly values; check $12 appears for Pro
        interactions.append(("pricing-monthly-12", page.locator("text=$12").count()))
        page.screenshot(path=f"{OUT}-desktop-03-pricing.png", full_page=False)

        # FAQ accordion
        faq_q = page.locator("button[id^=faq-button]").nth(1)
        faq_q.click()
        page.wait_for_timeout(600)
        panel = page.locator("#faq-panel-1")
        interactions.append(("faq-open", panel.is_visible()))
        faq_q.click()
        page.wait_for_timeout(600)
        interactions.append(("faq-closed", panel.is_visible() is False))

        # mobile menu
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(600)
        page.screenshot(path=f"{OUT}-mobile-00-top.png", full_page=False)
        page.locator("button[aria-label='Open menu']").click()
        page.wait_for_timeout(600)
        interactions.append(("mobile-menu-open", page.locator("nav[aria-label=Mobile]").count()))
        page.screenshot(path=f"{OUT}-mobile-01-menu.png", full_page=False)
        page.locator("button[aria-label='Close menu']").click()
        page.wait_for_timeout(500)

        # mobile full-page scroll shots
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}-mobile-02-full.png", full_page=True)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(900)
        page.screenshot(path=f"{OUT}-mobile-03-bottom.png", full_page=True)

        interactions.append(("console-errors-desktop", page_errors))
        errors.extend(page_errors)

        ctx.close()

        # ---------- Small mobile ----------
        ctx2 = browser.new_context(viewport={"width": 360, "height": 800})
        page2 = ctx2.new_page()
        page2.goto(BASE, wait_until="networkidle", timeout=60000)
        page2.wait_for_timeout(1500)
        page2.screenshot(path=f"{OUT}-360-top.png", full_page=False)
        # horizontal overflow check
        overflow = page2.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        )
        interactions.append(("360px-h-overflow", overflow))
        ctx2.close()

        browser.close()

    print(json.dumps({"interactions": interactions, "console_errors": errors}, indent=2))


if __name__ == "__main__":
    sys.exit(run())
