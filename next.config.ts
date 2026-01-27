import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "path";

// Determine environment from NEXT_PUBLIC_ENVIRONMENT (set in Cloudflare Worker config)
// Set NEXT_PUBLIC_ENVIRONMENT=development for dev branch, NEXT_PUBLIC_ENVIRONMENT=production for main branch
const sentryEnvironment =
	process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || "development";

const nextConfig: NextConfig = {
	// Exclude canvas-dependent packages from server-side bundling
	serverExternalPackages: ["jscanify", "pdfjs-dist"],

	// Turbopack configuration for handling canvas dependency
	// jscanify requires canvas package which uses createCanvas - we provide a browser shim
	turbopack: {
		resolveAlias: {
			// Map canvas to browser-compatible shim (provides createCanvas/loadImage)
			canvas: { browser: "./src/lib/canvas-shim.ts" },
		},
	},

	// Webpack configuration for handling problematic packages (used in production builds)
	webpack: (config, { isServer }) => {
		// Handle canvas dependency for jscanify (optional peer dependency)
		// Use browser-compatible shim that provides createCanvas/loadImage
		config.resolve.alias = {
			...config.resolve.alias,
			canvas: path.resolve(__dirname, "./src/lib/canvas-shim.ts"),
		};

		// For client-side, provide fallbacks for Node.js built-in modules
		// that jscanify's jsdom dependency tries to import
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				net: false,
				tls: false,
				fs: false,
				child_process: false,
				http: false,
				https: false,
				stream: false,
				crypto: false,
				os: false,
				path: false,
				zlib: false,
				util: false,
				buffer: false,
				url: false,
				assert: false,
				querystring: false,
				events: false,
			};
		}

		// Prevent pdfjs-dist from being bundled on server
		if (isServer) {
			config.externals = config.externals || [];
			if (Array.isArray(config.externals)) {
				config.externals.push("pdfjs-dist", "jscanify");
			}
		}

		return config;
	},
};

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: process.env.SENTRY_ORG,

	project: process.env.SENTRY_PROJECT,

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	// Set the release name based on environment for better tracking in Sentry
	release: {
		name: `aml@${sentryEnvironment}`,
	},

	webpack: {
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,

		// Tree-shaking options for reducing bundle size
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
	},
});

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
