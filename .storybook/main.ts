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
