import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-links", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/nextjs",
		options: {},
	},
	docs: {
		autodocs: "tag",
	},
	/**
	 * Inject placeholder env vars into webpack's DefinePlugin so that
	 * NEXT_PUBLIC_* references are inlined at compile time. Without this,
	 * @storybook/nextjs reads from .env files (which don't exist in CI/Chromatic)
	 * and the vars remain undefined at runtime in the Storybook iframe.
	 *
	 * Real values can be overridden via process.env (GitHub Actions step env, etc.).
	 */
	env: (existing) => ({
		...existing,
		NEXT_PUBLIC_AUTH_SERVICE_URL:
			process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
			"https://auth-svc.example.workers.dev",
		NEXT_PUBLIC_AUTH_APP_URL:
			process.env.NEXT_PUBLIC_AUTH_APP_URL ||
			"https://auth.example.workers.dev",
		NEXT_PUBLIC_WATCHLIST_APP_URL:
			process.env.NEXT_PUBLIC_WATCHLIST_APP_URL ||
			"https://watchlist.example.workers.dev",
		NEXT_PUBLIC_HOMEPAGE_URL:
			process.env.NEXT_PUBLIC_HOMEPAGE_URL || "https://janovix.com",
		NEXT_PUBLIC_AML_APP_URL:
			process.env.NEXT_PUBLIC_AML_APP_URL || "https://aml.example.workers.dev",
		NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL:
			process.env.NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL ||
			"https://notifications-svc.example.workers.dev",
		NEXT_PUBLIC_AML_CORE_URL:
			process.env.NEXT_PUBLIC_AML_CORE_URL ||
			"https://aml-svc.example.workers.dev",
		NEXT_PUBLIC_WATCHLIST_API_BASE_URL:
			process.env.NEXT_PUBLIC_WATCHLIST_API_BASE_URL ||
			"https://watchlist-svc.example.workers.dev",
		NEXT_PUBLIC_DOC_SVC_URL:
			process.env.NEXT_PUBLIC_DOC_SVC_URL ||
			"https://doc-svc.example.workers.dev",
		NEXT_PUBLIC_KYC_URL:
			process.env.NEXT_PUBLIC_KYC_URL || "https://kyc.example.workers.dev",
	}),
	webpackFinal: async (config) => {
		const storybookDir = path.dirname(fileURLToPath(import.meta.url));

		// Ensure Next.js App Router hooks/components don't throw in Storybook/Chromatic.
		config.resolve = config.resolve ?? {};
		config.resolve.alias = {
			...(config.resolve.alias ?? {}),
			"next/navigation": path.resolve(
				storybookDir,
				"./mocks/next-navigation.ts",
			),
			"next/link": path.resolve(storybookDir, "./mocks/next-link.tsx"),
		};
		return config;
	},
};

export default config;
