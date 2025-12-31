"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

/**
 * Global 404 Not Found page
 * Shown when a route doesn't exist
 */
export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<FileQuestion className="h-10 w-10 text-muted-foreground" />
					</div>
					<CardTitle className="text-3xl font-bold">404</CardTitle>
					<CardDescription className="text-lg">Page not found</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-sm text-muted-foreground">
					<p>
						The page you&apos;re looking for doesn&apos;t exist or has been
						moved. Check the URL or navigate back to safety.
					</p>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => window.history.back()}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
					<Button asChild className="flex-1">
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Home
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
