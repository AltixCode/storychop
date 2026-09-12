# StoryChop — Agent Runbook & Operating Directive

## 1. System Overview & Identifiers
* **App Name:** StoryChop
* **Bundle Identifier (iOS):** `com.altixcode.storychop`
* **Package Name (Android):** `com.altixcode.storychop`
* **URL Scheme:** `storychop://`
* **Monetization Model:** Free download with a single **$6.99 Lifetime Non-Consumable IAP** lifetime unlock
* **Entitlement ID:** `pro`
* **Architecture:** 100% On-Device execution, zero external server compute ($0.00 marginal cost).

## 2. Environment Variables & Secrets
```bash
EXPO_PUBLIC_RC_IOS_KEY="appl_placeholder"
EXPO_PUBLIC_RC_ANDROID_KEY="goog_placeholder"
```

## 3. Development & Build CLI Commands
```bash
# Start local Metro dev server
npx expo start

# Run iOS simulator
npx expo run:ios

# Run Android simulator
npx expo run:android

# Generate Native Prebuild
npx expo prebuild --clean

# Type check
npx tsc --noEmit
```

## 4. Legal Pages & Coolify Hosting
Static legal landing pages for Privacy Policy and Terms of Service are hosted at:
* `https://www.hushtunnel.com/legal/storychop-privacy`
* `https://www.hushtunnel.com/legal/storychop-terms`
Deployed via Coolify on Hetzner VPS (`2.28.42.222`).

## 5. Technical Gotchas & Edge Cases
* Zero-log and zero-cloud invariants: No remote analytics, error trackers, or telemetry that uploads user media or identifiers.
* All processing must occur in local sandboxed storage and stream to `expo-media-library` or `expo-sharing`.

## 6. Mandatory 12-Language Localization Protocol
* **Core Rule:** The application must maintain 100% localization across 12 Tier-1 global languages:
  1. **English (`en`)** — Default fallback
  2. **Spanish (`es`)** — Latin America, US, Spain
  3. **French (`fr`)** — France, Canada, Francophone markets
  4. **German (`de`)** — Germany, Austria, Switzerland
  5. **Russian (`ru`)** — Eastern Europe, CIS
  6. **Simplified Chinese (`zh`)** — Greater China, Singapore
  7. **Japanese (`ja`)** — Japan
  8. **Brazilian Portuguese (`pt`)** — Brazil, Portugal
  9. **Korean (`ko`)** — South Korea
  10. **Italian (`it`)** — Italy
  11. **Turkish (`tr`)** — Turkey
  12. **Arabic (`ar`)** — MENA, GCC (RTL support)
* **Zero Hardcoded Strings:** No raw user-facing text strings are permitted in React Native views or components. All copy must be resolved through `t('key')` exported from `src/i18n/index.ts`.
* **Automatic Device Language Resolution:** Locale is dynamically detected on app launch using `expo-localization` (`Localization.getLocales()[0]?.languageCode`). If the user's device is set to an unsupported language, the app cleanly falls back to English (`en`).
* **Feature Expansion Directives:** Whenever any new UI component, modal, toast, alert, error message, or workflow is introduced, the developer or AI agent MUST add corresponding translation strings for all 12 supported languages in `src/i18n/index.ts`. PRs with missing locale keys or hardcoded English strings will be rejected.

