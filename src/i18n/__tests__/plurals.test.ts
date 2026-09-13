/**
 * The dictionaries are flat, so a plural form lives under a suffixed sibling
 * key. These tests pin the selection rules, because the failure mode is silent:
 * a missing or misnamed variant renders the plural form for a count of one
 * ("Export 1 Clips") and nothing errors.
 */
import { setLanguage, t } from "../index";

// expo-localization only supplies the initial device language; every test sets
// the language explicitly.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));

describe("plural selection", () => {
  afterEach(() => setLanguage("en"));

  it("uses the singular form for a count of one", () => {
    setLanguage("en");
    expect(t("exportClips", { count: 1 })).toBe("Export 1 Clip");
  });

  it("uses the plural form for other counts", () => {
    setLanguage("en");
    expect(t("exportClips", { count: 4 })).toBe("Export 4 Clips");
    expect(t("exportClips", { count: 0 })).toBe("Export 0 Clips");
  });

  it("selects per-locale, not by an English rule", () => {
    setLanguage("de");
    expect(t("exportClips", { count: 1 })).toBe("1 Clip exportieren");
    expect(t("exportClips", { count: 3 })).toContain("3");
  });

  it("falls back to the base key when a variant is absent", () => {
    setLanguage("en");
    // outputClips is parenthetical and deliberately has no singular variant.
    expect(t("outputClips", { count: 1 })).toBe("Output Clips (1)");
  });

  it("leaves keys without a count untouched", () => {
    setLanguage("en");
    expect(t("cancel")).toBe("Cancel");
  });

  it("still interpolates the remaining params on a plural variant", () => {
    setLanguage("en");
    expect(t("allClipsSavedDesc", { count: 1 })).toBe(
      "1 video clip was losslessly exported to your photo library."
    );
  });
});
