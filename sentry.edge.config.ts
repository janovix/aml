// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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

	// Define how likely traces are sampled. Higher in dev for debugging, lower in production.
	tracesSampleRate: isDevelopment ? 1.0 : 0.2,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});
