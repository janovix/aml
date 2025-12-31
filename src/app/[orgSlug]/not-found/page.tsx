"use client";

import { use } from "react";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default function OrgNotFoundPage({ params }: PageProps) {
	const { orgSlug } = use(params);

	return (
		<div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<SearchX className="h-8 w-8 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl">Organization Not Found</CardTitle>
					<CardDescription>
						The organization{" "}
						<span className="font-semibold text-foreground">{orgSlug}</span>{" "}
						doesn&apos;t exist.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-sm text-muted-foreground">
					<p>
						This could happen if the organization was deleted, the URL is
						incorrect, or you followed an outdated link.
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
