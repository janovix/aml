"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
	AUTH_RATE_LIMIT_EVENT,
	type RateLimitEventDetail,
} from "@/lib/auth/authClient";

const TOAST_ID = "auth-rate-limit";

/**
 * Global listener that shows a toast whenever auth-svc returns HTTP 429.
 * Mount this once near the root of the app (alongside <Toaster />).
 */
export function RateLimitToast() {
	useEffect(() => {
		const handleRateLimit = (event: Event) => {
			const { retryAfter } = (event as CustomEvent<RateLimitEventDetail>)
				.detail;

			const message =
				retryAfter > 0
					? `Demasiadas solicitudes. Por favor espera ${retryAfter} segundos.`
					: "Demasiadas solicitudes. Por favor espera un momento.";

			toast.warning(message, {
				id: TOAST_ID,
				duration: Math.max((retryAfter ?? 10) * 1000, 5000),
			});
		};

		window.addEventListener(AUTH_RATE_LIMIT_EVENT, handleRateLimit);
		return () => {
			window.removeEventListener(AUTH_RATE_LIMIT_EVENT, handleRateLimit);
		};
	}, []);

	return null;
}
