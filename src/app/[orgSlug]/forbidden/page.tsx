"use client";

import { use } from "react";
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
import { useLanguage } from "@/components/LanguageProvider";

interface PageProps {
	params: Promise<{ orgSlug: string }>;
}

export default function ForbiddenPage({ params }: PageProps) {
	const { t } = useLanguage();
	const { orgSlug } = use(params);

	return (
		<div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<ShieldX className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl">{t("errorAccessDenied")}</CardTitle>
					<CardDescription>
						{t("errorAccessDeniedDesc")}{" "}
						<span className="font-semibold text-foreground">{orgSlug}</span>.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-sm text-muted-foreground">
					<p>{t("errorAccessDeniedReason")}</p>
				</CardContent>
				<CardFooter className="flex gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => window.history.back()}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("errorGoBack")}
					</Button>
					<Button asChild className="flex-1">
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
