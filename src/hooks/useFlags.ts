"use client";

import { useEffect, useMemo, useState } from "react";
import {
	evaluateFlagsForSession,
	type FlagValue,
} from "@/lib/flags/evaluateFlags";

/**
 * Client hook: evaluates flags for the current user session (server action → flags-svc).
 * Caches result for the lifetime of the page session (in-memory per hook instance).
 */
export function useFlags(keys: string[]): {
	flags: Record<string, FlagValue>;
	isLoading: boolean;
	error: string | null;
} {
	const keysKey = useMemo(() => JSON.stringify([...keys].sort()), [keys]);
	const [flags, setFlags] = useState<Record<string, FlagValue>>({});
	const [isLoading, setIsLoading] = useState(keys.length > 0);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const list = JSON.parse(keysKey) as string[];
		if (list.length === 0) {
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);

		void evaluateFlagsForSession(list).then((r) => {
			if (cancelled) return;
			setFlags(r.flags);
			setError(r.error);
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [keysKey]);

	return { flags, isLoading, error };
}
