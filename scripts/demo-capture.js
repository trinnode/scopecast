// Playwright screen-capture sequence for the DoraHacks demo video.
// Invoked with tools.playwright.browser_run_code_unsafe({ filename: "scripts/demo-capture.js" }).
// Captures the live Next.js production build on localhost:3600 with a demo
// wallet provider (UI only). No private key is ever placed in the browser.

async (page) => {
  const OUT = "/home/trinnex/Documents/CodeBase/personalProjects/Dorahacks/scopecast/docs/demo/frames";
  const BASE = "http://localhost:3700";

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method }) => {
        if (method === "eth_accounts" || method === "eth_requestAccounts") {
          return ["0x199674cd60606A67E0Fa9fa28Ef00F58A33d2075"];
        }
        if (method === "eth_chainId") return "0x14a34";
        if (method === "wallet_switchEthereumChain") return null;
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  });

  const caption = async (text) => {
    await page.evaluate((t) => {
      let el = document.getElementById("demo-caption");
      if (!el) {
        el = document.createElement("div");
        el.id = "demo-caption";
        el.style.cssText =
          "position:fixed;left:24px;right:24px;bottom:24px;z-index:99999;padding:18px 22px;" +
          "background:rgba(5,5,6,.92);border:1px solid #00f0ff;color:#fff;" +
          "font:600 18px/1.5 'Space Mono',monospace;letter-spacing:.02em;";
        document.body.appendChild(el);
      }
      el.textContent = t;
    }, text);
    await page.waitForTimeout(350);
  };

  const shot = async (name, text) => {
    await caption(text);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    await page.evaluate(() => document.getElementById("demo-caption")?.remove());
    await page.waitForTimeout(200);
  };

  const goto = async (path) => {
    try {
      await page.goto(BASE + path, { waitUntil: "commit", timeout: 60000 });
    } catch (e) {
      return;
    }
    await page.waitForTimeout(2600);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.documentElement.scrollTop = 0; });
  };

  const toHeading = async (text) => {
    await page.evaluate((t) => {
      const h = [...document.querySelectorAll("h2")].find((e) => e.innerText.includes(t));
      if (h) h.scrollIntoView({ block: "start", behavior: "instant" });
    }, text);
    await page.waitForTimeout(600);
  };

  await goto("/");
  await shot("01-hero", "SCOPECAST — one agent policy, three chains, one verifiable callback.");

  await page.evaluate(() => document.querySelector("figure[role=img]")?.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(500);
  await shot("02-route", "Base Sepolia event → Reactive Omni validation → Unichain Sepolia enforcement.");

  await toHeading("Three stages");
  await shot("03-mechanism", "Every stage is independently verifiable: source, Reactive, destination.");

  await toHeading("versioned capability");
  await shot("04-policy", "Nine capability fields, one canonical hash, emitted and recomputed on every chain.");

  await toHeading("Fail closed");
  await shot("05-security", "Both callback checks required. Strictly newer epochs win. The guard fails closed.");

  await goto("/console");
  await shot("06-console", "Security console reading real Base and Unichain chain state.");

  await page.evaluate(() => { document.documentElement.scrollTop = 0; });
  await page.waitForTimeout(400);
  await shot("07-wallet", "Test wallet connected — UI demonstration; no signing key is stored by the app.");

  await goto("/console/propagation");
  await shot("08-propagation", "Real receipts: source tx, Lasna react() tx and Unichain callback tx.");

  await goto("/console/policies");
  await shot("09-policies", "One agent policy, epoch 2, revoked on destination.");

  const detail = await page.locator('a[href^="/console/policies/"]').first().getAttribute("href");
  if (detail) {
    await goto(detail);
    await shot("10-detail", "Agent key, target, selector, cap, expiry, epoch and policy hash.");
  }

  await goto("/console/demo");
  await shot("11-demo", "Guarded DeFi action: 2 test units moved before revocation.");

  await goto("/console/revoke");
  await shot("12-revoke", "Revoke once. Source revocation is final; destination enforcement follows the callback.");

  await goto("/console/audit");
  await shot("13-audit", "Audit trail links every event to its own chain explorer.");

  await goto("/console/diagnostics");
  await shot("14-diagnostics", "Diagnostics: chain IDs, addresses, system contract, callback proxy and gas reserve.");

  await goto("/console/architecture");
  await shot("15-architecture", "Trust boundaries and monotonic epoch invariants.");

  await goto("/");
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.innerText.includes("Inspect the implementation"));
    h?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForTimeout(500);
  await shot("16-outro", "Public repo, runbook and docs. Testnet only — no atomic or instant revocation claim.");

  return "captured 16 frames";
}
