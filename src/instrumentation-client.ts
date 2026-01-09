// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
