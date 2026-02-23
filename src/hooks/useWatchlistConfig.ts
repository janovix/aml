"use client";

import { useState, useEffect } from "react";
import {
	fetchWatchlistConfig,
	type WatchlistFeatures,
} from "@/lib/api/watchlist";

const DEFAULT_FEATURES: WatchlistFeatures = {
	pepSearch: true,
	pepGrok: true,
	adverseMedia: true,
};

let cachedFeatures: WatchlistFeatures | null = null;

export function useWatchlistConfig(): {
	features: WatchlistFeatures;
	isLoading: boolean;
} {
	const [features, setFeatures] = useState<WatchlistFeatures>(
		cachedFeatures ?? DEFAULT_FEATURES,
	);
	const [isLoading, setIsLoading] = useState(cachedFeatures === null);

	useEffect(() => {
		if (cachedFeatures) return;

		let cancelled = false;
		fetchWatchlistConfig().then((f) => {
			if (cancelled) return;
			cachedFeatures = f;
			setFeatures(f);
			setIsLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return { features, isLoading };
}
