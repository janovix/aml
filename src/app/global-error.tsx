"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCcw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);
	return (
		<html>
			<body className="min-h-screen bg-linear-to-br from-background to-muted/50">
				<div className="flex min-h-screen items-center justify-center p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
								<ServerCrash className="h-10 w-10 text-destructive" />
							</div>
							<CardTitle className="text-2xl font-semibold">
								Something went wrong
							</CardTitle>
							<CardDescription className="text-base">
								We hit an unexpected error while loading this page.
							</CardDescription>
						</CardHeader>
						<CardContent className="text-center text-sm text-muted-foreground">
							<p>Try again, or return home if the problem persists.</p>
						</CardContent>
						<CardFooter className="flex gap-3 pb-6">
							<Button className="flex-1" onClick={reset}>
								<RefreshCcw className="mr-2 h-4 w-4" />
								Try again
							</Button>
							<Button asChild variant="outline" className="flex-1">
								<Link href="/">
									<Home className="mr-2 h-4 w-4" />
									Home
								</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>
			</body>
		</html>
	);
}
