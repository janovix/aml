"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { TrainingQuizRunner } from "@/components/training/TrainingQuizRunner";
import { useLanguage } from "@/components/LanguageProvider";
import { useOrgStore } from "@/lib/org-store";

function QuizContent() {
	const { t } = useLanguage();
	const params = useParams();
	const searchParams = useSearchParams();
	const orgSlug = params.orgSlug as string;
	const courseSlug = params.courseSlug as string;
	const enrollmentId = searchParams.get("enrollment");
	const currentOrg = useOrgStore((s) => s.currentOrg);
	const prefix = `/${orgSlug}`;

	if (!enrollmentId) {
		return (
			<div className="container max-w-lg py-8 space-y-4">
				<p className="text-muted-foreground text-sm">
					{t("trainingMissingEnrollment")}
				</p>
				<Button variant="outline" asChild>
					<Link href={`${prefix}/training/${courseSlug}`}>{t("back")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="container max-w-2xl py-8 space-y-6">
			<Button variant="ghost" asChild>
				<Link href={`${prefix}/training/${courseSlug}`}>{t("back")}</Link>
			</Button>
			<TrainingQuizRunner
				key={`${currentOrg?.id ?? "no-org"}-${enrollmentId ?? "no-enrollment"}`}
				orgSlug={orgSlug}
				courseSlug={courseSlug}
				enrollmentId={enrollmentId}
			/>
		</div>
	);
}

export default function TrainingQuizPage() {
	const { t } = useLanguage();
	return (
		<Suspense
			fallback={<p className="container py-8">{t("trainingLoading")}</p>}
		>
			<QuizContent />
		</Suspense>
	);
}
