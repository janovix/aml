"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { listMyTrainingEnrollments } from "@/lib/api/training";
import { useLanguage } from "@/components/LanguageProvider";
import { useOrgStore } from "@/lib/org-store";
import {
	pickEnrollmentStatusKey,
	pickTrainingTitle,
} from "@/lib/training/i18n";

export default function TrainingHomePage() {
	const { t, language } = useLanguage();
	const lang = language === "en" ? "en" : "es";
	const params = useParams();
	const orgSlug = params.orgSlug as string;
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [rows, setRows] = useState<
		Array<{
			id: string;
			status: string;
			course: { slug: string; titleI18n: unknown };
		}>
	>([]);

	useEffect(() => {
		if (!currentOrg?.id) {
			setLoading(false);
			setRows([]);
			setError(null);
			return;
		}

		let cancelled = false;
		setRows([]);
		void (async () => {
			try {
				setLoading(true);
				const { json } = await listMyTrainingEnrollments();
				if (!cancelled) {
					setRows(json.data ?? []);
					setError(null);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Error");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [currentOrg?.id]);

	const prefix = `/${orgSlug}`;

	return (
		<div className="container max-w-4xl py-8 space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					{t("navTraining")}
				</h1>
				<p className="text-muted-foreground">{t("trainingSubtitle")}</p>
			</div>

			{loading && <p>{t("trainingLoading")}</p>}
			{error && (
				<p className="text-destructive text-sm" role="alert">
					{error}
				</p>
			)}

			{!loading && !error && rows.length === 0 && (
				<p className="text-muted-foreground">{t("trainingNoEnrollments")}</p>
			)}

			<div className="grid gap-4">
				{rows.map((r) => {
					const title =
						pickTrainingTitle(r.course.titleI18n, lang) || r.course.slug;

					return (
						<Card key={r.id}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div>
									<CardTitle className="text-base">{title}</CardTitle>
									<CardDescription>
										{t("trainingStatusLabel")}:{" "}
										{t(pickEnrollmentStatusKey(r.status))}
									</CardDescription>
								</div>
								<Button asChild size="sm">
									<Link href={`${prefix}/training/${r.course.slug}`}>
										{t("trainingOpen")}
									</Link>
								</Button>
							</CardHeader>
							<CardContent />
						</Card>
					);
				})}
			</div>

			<div className="flex gap-4 text-sm">
				<Link
					href={`${prefix}/training/team`}
					className="text-primary underline-offset-4 hover:underline"
				>
					{t("trainingTeamSubtitle")}
				</Link>
				<Link
					href={`${prefix}/training/certificates`}
					className="text-primary underline-offset-4 hover:underline"
				>
					{t("trainingCertsSubtitle")}
				</Link>
			</div>
		</div>
	);
}
