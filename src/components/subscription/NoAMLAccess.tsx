"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ShieldX, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface NoAMLAccessProps {
	/** Whether the subscription is still loading */
	isLoading?: boolean;
}

/**
 * Full-page blocker shown when user doesn't have AML product access
 *
 * This is displayed when a user has a Watchlist-only subscription
 * and tries to access the AML application.
 */
export function NoAMLAccess({ isLoading = false }: NoAMLAccessProps) {
	const { t } = useLanguage();

	// Build auth billing URL based on current location
	const authBillingUrl =
		typeof window !== "undefined"
			? `${window.location.origin.replace("aml.", "auth.")}/settings/billing`
			: "/settings/billing";

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
					<p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
			<Card className="max-w-md w-full text-center shadow-lg">
				<CardHeader className="space-y-4">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<ShieldX className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl font-semibold">
						{t("subscription.noAmlAccess.title")}
					</CardTitle>
					<CardDescription className="text-base">
						{t("subscription.noAmlAccess.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{t("subscription.noAmlAccess.upgradePrompt")}
					</p>
					<div className="flex flex-col gap-3">
						<Button asChild size="lg" className="w-full">
							<Link
								href={authBillingUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								{t("subscription.noAmlAccess.upgradeCta")}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							variant="ghost"
							asChild
							size="sm"
							className="text-muted-foreground"
						>
							<Link
								href={authBillingUrl.replace("/billing", "")}
								target="_blank"
								rel="noopener noreferrer"
							>
								{t("subscription.noAmlAccess.backToSettings")}
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
