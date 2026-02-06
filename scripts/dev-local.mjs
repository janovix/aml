#!/usr/bin/env node

// Set NODE_TLS_REJECT_UNAUTHORIZED before starting Next.js dev server
// This is required for local development with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

console.log(
	"Access via https://aml-local.janovix.workers.dev (see LOCAL_DEV_SETUP.md)",
);
console.log("TLS certificate validation disabled for local development\n");

// Monkey-patch the https module BEFORE importing Next.js
// This is needed because Next.js middleware rewrites make internal HTTPS requests
import https from "https";

// Store original request method
const originalHttpsRequest = https.request;

// Override https.request to set rejectUnauthorized: false
https.request = function (url, options, callback) {
	// Handle different call signatures of https.request
	if (typeof url === "string" || url instanceof URL) {
		// https.request(url, options, callback)
		if (typeof options === "function") {
			callback = options;
			options = {};
		} else {
			options = options || {};
		}
	} else {
		// https.request(options, callback)
		callback = options;
		options = url;
		url = null;
	}

	// Always disable certificate validation in local dev
	options.rejectUnauthorized = false;

	// Call original with modified options
	if (url) {
		return originalHttpsRequest.call(this, url, options, callback);
	}
	return originalHttpsRequest.call(this, options, callback);
};

// Now run Next.js in the same process so the monkey-patch applies
// Import Next.js CLI dynamically
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Run next dev command
const nextCli = require("next/dist/bin/next");
process.argv = ["node", "next", "dev", "--webpack"];
