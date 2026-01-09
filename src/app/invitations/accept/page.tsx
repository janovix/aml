"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { acceptInvitation } from "@/lib/auth/organizations";
import { useAuthSession } from "@/lib/auth/useAuthSession";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";

type InvitationState =
	| "loading"
	| "ready"
	| "accepting"
	| "accepted"
	| "error"
	| "not-authenticated";

export default function AcceptInvitationPage() {
	const { t } = useLanguage();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { toast } = useToast();
	const { data: session, isPending: sessionLoading } = useAuthSession();

	const invitationId = searchParams.get("invitationId");
	const [state, setState] = useState<InvitationState>("loading");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (sessionLoading) return;

		if (!session?.user) {
			setState("not-authenticated");
			return;
		}

		if (!invitationId) {
			setState("error");
			setErrorMessage(t("invitationNoId"));
			return;
		}

		setState("ready");
	}, [session, sessionLoading, invitationId]);

	const handleAccept = async () => {
		if (!invitationId) return;

		setState("accepting");
		const result = await acceptInvitation(invitationId);

		if (result.error) {
			setState("error");
			setErrorMessage(result.error);
			toast({
				variant: "destructive",
				title: t("invitationAcceptError"),
				description: result.error,
			});
		} else {
			setState("accepted");
			toast({
				title: t("invitationAcceptedSuccess"),
				description: t("invitationAcceptedSuccessDesc"),
			});
			// Redirect to main page after a short delay
			setTimeout(() => {
				router.push("/");
			}, 2000);
		}
	};

	const handleDecline = () => {
		// For now, just redirect back to home
		// In the future, we could add a reject-invitation API
		router.push("/");
	};

	const handleLogin = () => {
		const authAppUrl =
			process.env.NEXT_PUBLIC_AUTH_APP_URL ||
			"https://auth.janovix.workers.dev";
		const currentUrl =
			typeof window !== "undefined" ? window.location.href : "";
		window.location.href = `${authAppUrl}/login?redirect_to=${encodeURIComponent(currentUrl)}`;
	};

	if (state === "loading" || sessionLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
				<Card className="w-full max-w-md">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-muted-foreground">{t("invitationVerifying")}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (state === "not-authenticated") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
							<Users className="h-8 w-8 text-amber-600" />
						</div>
						<CardTitle className="text-2xl">{t("invitationTitle")}</CardTitle>
						<CardDescription>{t("invitationPendingDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground mb-4">
							{t("invitationSignInRequired")}
						</p>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button onClick={handleLogin} className="w-full" size="lg">
							{t("invitationSignIn")}
						</Button>
						<p className="text-xs text-muted-foreground text-center">
							{t("invitationRedirectAfterSignIn")}
						</p>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (state === "accepted") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<CardTitle className="text-2xl">{t("invitationWelcome")}</CardTitle>
						<CardDescription>{t("invitationAcceptedDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							{t("invitationRedirecting")}
						</p>
					</CardContent>
					<CardFooter>
						<Button onClick={() => router.push("/")} className="w-full">
							{t("invitationGoToDashboard")}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (state === "error") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
							<AlertCircle className="h-8 w-8 text-destructive" />
						</div>
						<CardTitle className="text-2xl">
							{t("invitationErrorTitle")}
						</CardTitle>
						<CardDescription>{t("invitationErrorDesc")}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							{errorMessage || t("invitationErrorExpired")}
						</p>
					</CardContent>
					<CardFooter className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => router.push("/")}
							className="flex-1"
						>
							{t("invitationBackToHome")}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// state === "ready" or "accepting"
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Users className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl">{t("invitationTitle")}</CardTitle>
					<CardDescription>{t("invitationInvitedToJoin")}</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground mb-2">
						{t("invitationAcceptQuestion")}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("invitationSignedInAs")}{" "}
						<span className="font-medium">{session?.user?.email}</span>
					</p>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						variant="outline"
						onClick={handleDecline}
						className="flex-1"
						disabled={state === "accepting"}
					>
						{t("invitationDecline")}
					</Button>
					<Button
						onClick={handleAccept}
						className="flex-1"
						disabled={state === "accepting"}
					>
						{state === "accepting" ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("invitationAccepting")}
							</>
						) : (
							t("invitationAccept")
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
