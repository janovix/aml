"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Index page - Redirect fallback
 *
 * This page should rarely be reached because the middleware handles all redirects:
 * - User has orgs → redirected to /{orgSlug}
 * - User has no orgs → redirected to onboarding
 * - User not authenticated → redirected to login
 *
 * This page only renders as a fallback if something unexpected happens.
 * It shows a loading state and attempts to redirect to the auth app.
 */
export default function IndexPage() {
	const { t } = useLanguage();
	const router = useRouter();

	useEffect(() => {
		// Fallback: if we somehow reach this page, redirect to auth app
		// The middleware should have handled this, but this is a safety net
		const authAppUrl =
			process.env.NEXT_PUBLIC_AUTH_APP_URL ||
			"https://auth.janovix.workers.dev";

		// Small delay to show loading state before redirect
		const timeout = setTimeout(() => {
			window.location.href = authAppUrl;
		}, 1000);

		return () => clearTimeout(timeout);
	}, [router]);

	return (
		<div className="flex min-h-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<div className="flex flex-col items-center gap-4 text-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-muted-foreground">{t("redirecting")}</p>
			</div>
		</div>
	);
}
