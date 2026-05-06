"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { listMyCertifications } from "@/lib/api/training";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { useLanguage } from "@/components/LanguageProvider";

export default function TrainingCertificatesPage() {
	const { t } = useLanguage();
	const params = useParams();
	const orgSlug = params.orgSlug as string;
	const [loading, setLoading] = useState(true);
	const [rows, setRows] = useState<
		Array<{
			id: string;
			certificateNumber: string;
			score: number;
			expiresAt: string;
		}>
	>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const { json } = await listMyCertifications();
				if (!cancelled) setRows(json.data ?? []);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const base = getAmlCoreBaseUrl();

	return (
		<div className="container max-w-4xl py-8 space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">
						{t("trainingCertsSubtitle")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("trainingSubtitle")}
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href={`/${orgSlug}/training`}>{t("back")}</Link>
				</Button>
			</div>

			{loading && <p>{t("trainingLoading")}</p>}

			<div className="grid gap-4">
				{rows.map((r) => (
					<Card key={r.id}>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-base">
									{r.certificateNumber}
								</CardTitle>
								<CardDescription>
									{t("trainingScorePrefix")} {r.score}% ·{" "}
									{t("trainingValidUntil")}{" "}
									{new Date(r.expiresAt).toLocaleDateString()}
								</CardDescription>
							</div>
							<Button
								size="sm"
								variant="secondary"
								type="button"
								onClick={async () => {
									const { tokenCache } = await import("@/lib/auth/tokenCache");
									const jwt = await tokenCache.getCachedToken();
									const res = await fetch(
										`${base}/api/v1/training/certifications/${encodeURIComponent(r.id)}/download`,
										{
											headers: jwt
												? { Authorization: `Bearer ${jwt}` }
												: undefined,
											credentials: "include",
										},
									);
									if (!res.ok) return;
									const blob = await res.blob();
									const url = URL.createObjectURL(blob);
									const a = document.createElement("a");
									a.href = url;
									a.download = `${r.certificateNumber}.pdf`;
									a.click();
									URL.revokeObjectURL(url);
								}}
							>
								PDF
							</Button>
						</CardHeader>
					</Card>
				))}
			</div>
		</div>
	);
}
