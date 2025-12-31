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

type InvitationState =
	| "loading"
	| "ready"
	| "accepting"
	| "accepted"
	| "error"
	| "not-authenticated";

export default function AcceptInvitationPage() {
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
			setErrorMessage("No valid invitation ID was provided.");
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
				title: "Error accepting invitation",
				description: result.error,
			});
		} else {
			setState("accepted");
			toast({
				title: "Invitation accepted!",
				description: "You are now part of the organization.",
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
						<p className="text-muted-foreground">Verifying invitation...</p>
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
						<CardTitle className="text-2xl">Organization Invitation</CardTitle>
						<CardDescription>
							You have a pending invitation to join an organization.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground mb-4">
							To accept this invitation, you must first sign in or create an
							account.
						</p>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button onClick={handleLogin} className="w-full" size="lg">
							Sign in
						</Button>
						<p className="text-xs text-muted-foreground text-center">
							You will be redirected back after signing in
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
						<CardTitle className="text-2xl">Welcome to the team!</CardTitle>
						<CardDescription>
							You have successfully accepted the invitation.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							You will be redirected to the organization dashboard in a few
							seconds...
						</p>
					</CardContent>
					<CardFooter>
						<Button onClick={() => router.push("/")} className="w-full">
							Go to dashboard
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
						<CardTitle className="text-2xl">Error</CardTitle>
						<CardDescription>
							The invitation could not be processed.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground">
							{errorMessage ||
								"The invitation may have expired or has already been used."}
						</p>
					</CardContent>
					<CardFooter className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => router.push("/")}
							className="flex-1"
						>
							Back to home
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
					<CardTitle className="text-2xl">Organization Invitation</CardTitle>
					<CardDescription>
						You have been invited to join an organization on Janovix.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground mb-2">
						Would you like to accept this invitation and join the team?
					</p>
					<p className="text-xs text-muted-foreground">
						Signed in as:{" "}
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
						Decline
					</Button>
					<Button
						onClick={handleAccept}
						className="flex-1"
						disabled={state === "accepting"}
					>
						{state === "accepting" ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Accepting...
							</>
						) : (
							"Accept invitation"
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
