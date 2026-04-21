// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { configureMRZTesseract } from "@janovix/document-scanner";

// Environment variables (set in Cloudflare Worker config or .env)
// NEXT_PUBLIC_SENTRY_DSN: Your Sentry DSN from project settings
// NEXT_PUBLIC_ENVIRONMENT: "development" for dev branch, "production" for main branch
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
	process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "development";
const isDevelopment = environment === "development";

Sentry.init({
	dsn,

	// Tag events with the environment (dev or production)
	environment,

	// Add optional integrations for additional features
	integrations: [Sentry.replayIntegration()],

	// Define how likely traces are sampled. Higher in dev for debugging, lower in production.
	tracesSampleRate: isDevelopment ? 1.0 : 0.2,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Define how likely Replay events are sampled.
	// Higher in dev for debugging, lower in production to reduce costs.
	replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,

	// Define how likely Replay events are sampled when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});

// Wire the MRZ-specialised Tesseract model for ID OCR. Opt-in via env: when
// NEXT_PUBLIC_MRZ_TESSDATA_LANG_PATH is unset, @janovix/document-scanner falls
// back to the stock `eng` model (safe for local dev / tests without R2 access).
// Recommended production value: https://cdn.janovix.com/tessdata
// Recommended language: `mrz` (tessdata_fast, ~1.4MB). Set to `mrz_best`
// (tessdata_best, ~11MB) only if production breadcrumbs justify the bigger model.
const mrzLangPath = process.env.NEXT_PUBLIC_MRZ_TESSDATA_LANG_PATH;
const mrzLanguage = process.env.NEXT_PUBLIC_MRZ_TESSDATA_LANGUAGE;
if (mrzLangPath && mrzLangPath.trim().length > 0) {
	const resolvedLangPath = mrzLangPath.trim().replace(/\/$/, "");
	const resolvedLanguage =
		mrzLanguage && mrzLanguage.trim().length > 0 ? mrzLanguage.trim() : "mrz";
	configureMRZTesseract({
		langPath: resolvedLangPath,
		language: resolvedLanguage,
	});
	console.info(
		`[OCR-MRZ] MRZ Tesseract model configured: language=${resolvedLanguage} langPath=${resolvedLangPath}`,
	);
} else {
	console.info(
		"[OCR-MRZ] NEXT_PUBLIC_MRZ_TESSDATA_LANG_PATH not set — falling back to stock 'eng' model (no MRZ specialisation).",
	);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
