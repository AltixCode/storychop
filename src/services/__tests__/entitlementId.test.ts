import { readFileSync } from "fs";
import { join } from "path";

/**
 * The entitlement this app unlocks on must be the one RevenueCat grants.
 *
 * It was not. `purchases.ts` checked `entitlements.active["remove_ads"]` under
 * a comment saying the key was kept "as RevenueCat has it" -- and StoryChop's
 * project has exactly one entitlement, whose lookup key is `pro`. So the check
 * could never find anything: a customer pays for StoryChop Pro Lifetime,
 * RevenueCat grants `pro`, the app looks for `remove_ads`, and nothing unlocks.
 *
 * Nothing catches that. The purchase succeeds, the receipt is valid, App Store
 * review passes, and the only symptom is a paying customer with a locked app.
 * Every other app in this portfolio uses `remove_ads` on both sides, which is
 * exactly why the outlier read as correct.
 *
 * This test cannot reach RevenueCat -- no network in CI, and no secret here that
 * should have that scope. What it can do is pin the constant so that changing it
 * is deliberate, and carry the one command that re-checks the real answer:
 *
 *     rc entitlements list --project-id proj4af70a1b
 *
 * Verified 2026-09-18: one entitlement, lookup key `pro`, display name
 * "StoryChop Pro", created 2026-09-12.
 */
const VERIFIED_ENTITLEMENT_LOOKUP_KEY = "pro";

describe("the entitlement the app unlocks on", () => {
  it("matches the lookup key RevenueCat actually grants", () => {
    const source = readFileSync(
      join(__dirname, "..", "purchases.ts"),
      "utf8",
    );
    expect(source).toContain(
      `const ENTITLEMENT_ID = "${VERIFIED_ENTITLEMENT_LOOKUP_KEY}"`,
    );
  });

  it("does not use the portfolio default, which is wrong for this app", () => {
    const source = readFileSync(
      join(__dirname, "..", "purchases.ts"),
      "utf8",
    );
    expect(source).not.toContain('const ENTITLEMENT_ID = "remove_ads"');
  });
});
