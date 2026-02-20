"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ShieldAlert, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";
import {
	AUTH_RATE_LIMIT_EVENT,
	type RateLimitEventDetail,
} from "@/lib/auth/authClient";

interface RateLimitState {
	retryAfter: number;
	returnUrl: string;
}

/**
 * Full-screen blocking overlay shown whenever auth-svc returns HTTP 429.
 * Captures the current page URL so the Retry button takes the user back to
 * the exact page that triggered the rate limit.
 *
 * Mount this once near the root of the app (alongside <Toaster />).
 */
export function RateLimitBlocker() {
	const { t } = useLanguage();
	const [state, setState] = useState<RateLimitState | null>(null);
	const [secondsLeft, setSecondsLeft] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const handleRateLimit = (event: Event) => {
			const { retryAfter } = (event as CustomEvent<RateLimitEventDetail>)
				.detail;

			setState({
				retryAfter,
				returnUrl: window.location.href,
			});
			setSecondsLeft(retryAfter > 0 ? retryAfter : 0);
		};

		window.addEventListener(AUTH_RATE_LIMIT_EVENT, handleRateLimit);
		return () => {
			window.removeEventListener(AUTH_RATE_LIMIT_EVENT, handleRateLimit);
		};
	}, []);

	useEffect(() => {
		if (state === null) return;

		if (secondsLeft <= 0) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current!);
					intervalRef.current = null;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [state]);

	if (state === null) return null;

	const description =
		secondsLeft > 0
			? t("errorRateLimitDescription").replace("{seconds}", String(secondsLeft))
			: t("errorRateLimitDescriptionReady");

	const handleRetry = () => {
		setState(null);
		window.location.assign(state.returnUrl);
	};

	const overlay = (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
						<ShieldAlert className="h-10 w-10 text-warning" />
					</div>
					<CardTitle className="text-2xl font-semibold">
						{t("errorRateLimitTitle")}
					</CardTitle>
					<CardDescription className="text-base">{description}</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					{secondsLeft > 0 && (
						<p className="text-5xl font-bold tabular-nums text-warning">
							{secondsLeft}
						</p>
					)}
				</CardContent>
				<CardFooter className="flex gap-3 pb-6">
					<Button
						className="flex-1"
						disabled={secondsLeft > 0}
						onClick={handleRetry}
					>
						<RefreshCcw className="mr-2 h-4 w-4" />
						{t("errorRateLimitRetry")}
					</Button>
					<Button asChild variant="outline" className="flex-1">
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							{t("errorHome")}
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);

	return createPortal(overlay, document.body);
}
