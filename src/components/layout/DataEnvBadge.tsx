"use client";

import { useStore } from "@nanostores/react";
import { EnvironmentMiniBadge } from "@algenium/blocks";
import { environmentAtom } from "@/lib/environment-store";

/**
 * Footer echo of the org-picker badge: shows the user-selected data
 * environment (Stg/Dev) and renders nothing when production.
 */
export function DataEnvBadge({ className }: { className?: string }) {
	const env = useStore(environmentAtom);
	if (env === "production") return null;
	return (
		<EnvironmentMiniBadge environment={env} abbreviated className={className} />
	);
}
