"use client";

import Link from "next/link";
import { Home, LockKeyhole, LogIn } from "lucide-react";
import { getAuthAppUrl } from "@/lib/auth/config";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function UnauthorizedPage() {
	const { t } = useLanguage();
	const loginUrl =
		typeof window !== "undefined"
			? `${getAuthAppUrl()}/login?redirect_to=${encodeURIComponent(window.location.href)}`
			: `${getAuthAppUrl()}/login`;

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<LockKeyhole className="h-8 w-8 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl font-semibold">
						{t("errorUnauthorizedTitle")}
					</CardTitle>
					<CardDescription className="text-base">
						{t("errorUnauthorizedDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-sm text-muted-foreground">
					<p>{t("errorUnauthorizedReason")}</p>
				</CardContent>
				<CardFooter className="flex gap-3 pb-6">
					<Button asChild className="flex-1">
						<Link href={loginUrl}>
							<LogIn className="mr-2 h-4 w-4" />
							{t("errorSignIn")}
						</Link>
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
}
