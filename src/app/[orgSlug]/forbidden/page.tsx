import { ShieldX, ArrowLeft, Home } from "lucide-react";
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

export default async function ForbiddenPage({ params }: PageProps) {
	const { orgSlug } = await params;

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<ShieldX className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl">Access Denied</CardTitle>
					<CardDescription>
						You don&apos;t have access to the organization{" "}
						<span className="font-semibold text-foreground">{orgSlug}</span>.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-sm text-muted-foreground">
					<p>
						This could happen if you followed a shared link to an organization
						you&apos;re not a member of, or if your access was revoked.
					</p>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button variant="outline" asChild className="flex-1">
						<Link href="javascript:history.back()">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Go Back
						</Link>
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
