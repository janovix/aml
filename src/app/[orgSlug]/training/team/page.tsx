"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ExpirationBanner } from "@/components/training/ExpirationBanner";
import {
	getOrgTrainingComplianceSummary,
	listOrgTrainingEnrollments,
} from "@/lib/api/training";
import {
	pickTrainingTitle,
	pickEnrollmentStatusKey,
} from "@/lib/training/i18n";
import { useOrgStore } from "@/lib/org-store";
import { useLanguage } from "@/components/LanguageProvider";

type OrgComplianceSummary = {
	expiringWithin30Days?: number;
	byStatus?: Record<string, number>;
};

type Row = {
	id: string;
	userId: string;
	status: string;
	course: { slug: string; titleI18n: unknown };
};

export default function TrainingTeamPage() {
	const { t, language } = useLanguage();
	const lang = language === "en" ? "en" : "es";
	const params = useParams();
	const orgSlug = params.orgSlug as string;
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const role = currentOrg?.userRole?.toLowerCase() ?? "";
	const allowed = role === "owner" || role === "admin";

	const [loading, setLoading] = useState(true);
	const [summary, setSummary] = useState<OrgComplianceSummary | null>(null);
	const [rows, setRows] = useState<Row[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!allowed || !currentOrg?.id) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const [sumRes, enrRes] = await Promise.all([
					getOrgTrainingComplianceSummary(currentOrg.id),
					listOrgTrainingEnrollments(currentOrg.id),
				]);
				if (!cancelled) {
					setSummary(sumRes.json as OrgComplianceSummary);
					setRows((enrRes.json as { data: Row[] }).data ?? []);
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
	}, [allowed, currentOrg?.id]);

	if (!allowed) {
		return (
			<div className="container max-w-lg py-8">
				<p className="text-muted-foreground">{t("breadcrumbForbidden")}</p>
				<Button className="mt-4" asChild variant="outline">
					<Link href={`/${orgSlug}/training`}>{t("back")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="container max-w-5xl py-8 space-y-6">
			<div className="flex justify-between gap-4 flex-wrap">
				<div>
					<h1 className="text-2xl font-semibold">
						{t("trainingTeamSubtitle")}
					</h1>
					<p className="text-muted-foreground text-sm">
						{t("trainingSubtitle")}
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href={`/${orgSlug}/training`}>{t("back")}</Link>
				</Button>
			</div>

			{summary != null && (
				<ExpirationBanner count={summary.expiringWithin30Days ?? 0} />
			)}

			{loading && <p>{t("trainingLoading")}</p>}
			{error && <p className="text-destructive text-sm">{error}</p>}

			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead className="bg-muted/60">
						<tr>
							<th className="text-left p-2 font-medium">
								{t("trainingTeamUserHeader")}
							</th>
							<th className="text-left p-2 font-medium">
								{t("trainingTeamCourseHeader")}
							</th>
							<th className="text-left p-2 font-medium">
								{t("trainingTeamStatusHeader")}
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.id} className="border-t">
								<td className="p-2 font-mono text-xs">{r.userId}</td>
								<td className="p-2">
									{pickTrainingTitle(r.course.titleI18n, lang) || r.course.slug}
								</td>
								<td className="p-2">{t(pickEnrollmentStatusKey(r.status))}</td>
							</tr>
						))}
					</tbody>
				</table>
				{rows.length === 0 && !loading && (
					<p className="p-4 text-muted-foreground text-sm">
						{t("trainingNoEnrollmentsTeam")}
					</p>
				)}
			</div>
		</div>
	);
}
