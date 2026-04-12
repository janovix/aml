"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Calendar,
	Clock,
	FileText,
	Shield,
	User,
} from "lucide-react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { useLanguage } from "@/components/LanguageProvider";
import { RiskBadge, DDBadge } from "@/components/risk/RiskBadge";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getRiskEvaluationDetail,
	type RiskEvaluationDetail,
	type RiskLevel,
} from "@/lib/api/risk";
import { cn } from "@/lib/utils";
import type { TranslationKeys } from "@/lib/translations";
import { riskEvalFactorLabel } from "@/lib/risk-eval-factor-labels";

const ELEMENT_TITLE_KEYS: Record<string, TranslationKeys> = {
	CLIENTS: "riskEvalDetailElementClients",
	GEOGRAPHY: "riskEvalDetailElementGeography",
	PRODUCTS: "riskEvalDetailElementProducts",
	TRANSACTIONS: "riskEvalDetailElementTransactions",
};

export function EvaluationDetailView(): React.ReactElement {
	const params = useParams();
	const id = params?.id as string;
	const { orgPath } = useOrgNavigation();
	const { jwt } = useJwt();
	const { t } = useLanguage();

	const [detail, setDetail] = useState<RiskEvaluationDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!id || !jwt) return;
		setIsLoading(true);
		getRiskEvaluationDetail(id, { jwt })
			.then(setDetail)
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [id, jwt]);

	if (isLoading) {
		return <EvaluationDetailSkeleton />;
	}

	if (!detail) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-4">
				<Shield className="h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">{t("riskEvalDetailNotFound")}</p>
				<Link href={orgPath("/risk/evaluations")}>
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						{t("riskEvalDetailBackToList")}
					</Button>
				</Link>
			</div>
		);
	}

	const elements = [
		{ key: "CLIENTS" as const, data: detail.clientFactors },
		{ key: "GEOGRAPHY" as const, data: detail.geographicFactors },
		{ key: "PRODUCTS" as const, data: detail.activityFactors },
		{ key: "TRANSACTIONS" as const, data: detail.transactionFactors },
	];

	return (
		<div className="space-y-6">
			{/* Navigation */}
			<div className="flex items-center gap-4">
				<Link href={orgPath("/risk/evaluations")}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						{t("riskEvalDetailBackToList")}
					</Button>
				</Link>
				<span className="text-muted-foreground">|</span>
				<Link href={orgPath(`/clients/${detail.clientId}`)}>
					<Button variant="ghost" size="sm">
						<User className="h-4 w-4 mr-2" />
						{detail.client.name}
					</Button>
				</Link>
			</div>

			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold">{t("riskEvalDetailTitle")}</h1>
					<p className="text-muted-foreground">
						{detail.client.name} &middot; {detail.client.rfc}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<RiskBadge level={detail.riskLevel as RiskLevel} size="md" />
					<DDBadge
						level={
							detail.dueDiligenceLevel as "SIMPLIFIED" | "STANDARD" | "ENHANCED"
						}
					/>
				</div>
			</div>

			{/* Score Gauges */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="flex items-center justify-center py-6">
						<RiskScoreGauge
							score={detail.inherentRiskScore}
							maxScore={9}
							level={detail.riskLevel as RiskLevel}
							label={t("riskEvalDetailInherent")}
							size="lg"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center justify-center py-6">
						<RiskScoreGauge
							score={detail.residualRiskScore}
							maxScore={9}
							level={detail.riskLevel as RiskLevel}
							label={t("riskEvalDetailResidual")}
							size="lg"
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="py-6 space-y-3">
						<div className="flex items-center gap-2 text-sm">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("riskEvalDetailAssessedAt")}:
							</span>
							<span>{new Date(detail.assessedAt).toLocaleDateString()}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Clock className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("riskEvalDetailNextReview")}:
							</span>
							<span>{new Date(detail.nextReviewAt).toLocaleDateString()}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("riskEvalDetailTrigger")}:
							</span>
							<span>{detail.triggerReason ?? "—"}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<User className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("riskEvalDetailAssessedBy")}:
							</span>
							<span>{detail.assessedBy}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Factor Breakdown per Element */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{elements.map(({ key, data }) => (
					<Card key={key}>
						<CardHeader className="pb-3">
							<CardTitle className="text-base flex items-center justify-between">
								<span>
									{ELEMENT_TITLE_KEYS[key] ? t(ELEMENT_TITLE_KEYS[key]) : key}
								</span>
								{data.riskLevel && (
									<RiskBadge level={data.riskLevel as RiskLevel} size="sm" />
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{data.factors?.map(
									(f: { name: string; score: number; weight: number }) => (
										<div
											key={f.name}
											className="flex items-center justify-between text-sm"
										>
											<span className="text-muted-foreground truncate">
												{riskEvalFactorLabel(f.name, t)}
											</span>
											<div className="flex items-center gap-2 shrink-0">
												<span className="tabular-nums text-xs text-muted-foreground">
													{t("riskEvalDetailFactorWeight").replace(
														"{weight}",
														f.weight.toFixed(2),
													)}
												</span>
												<span className="tabular-nums font-medium w-10 text-right">
													{f.score.toFixed(1)}
												</span>
											</div>
										</div>
									),
								) ?? (
									<p className="text-xs text-muted-foreground">
										{t("riskEvalDetailNoFactorData")}
									</p>
								)}
							</div>
							{data.rawScore !== undefined && (
								<div className="mt-3 pt-3 border-t flex justify-between text-sm font-medium">
									<span>{t("riskEvalDetailElementScore")}</span>
									<span className="tabular-nums">
										{Number(data.rawScore).toFixed(2)}
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Mitigant Factors */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">
						{t("riskEvalDetailMitigants")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{detail.mitigantFactors.factors.map((f) => (
							<div
								key={f.name}
								className="flex items-center justify-between text-sm"
							>
								<span className="text-muted-foreground">
									{riskEvalFactorLabel(f.name, t)}
								</span>
								<div className="flex items-center gap-2">
									<span className="tabular-nums text-xs text-muted-foreground">
										{t("riskEvalDetailFactorWeight").replace(
											"{weight}",
											f.weight.toFixed(2),
										)}
									</span>
									<span
										className={cn(
											"tabular-nums font-medium w-10 text-right",
											f.score > 0
												? "text-emerald-600"
												: f.score < 0
													? "text-red-500"
													: "text-muted-foreground",
										)}
									>
										{f.score > 0 ? "-" : ""}
										{Math.abs(f.score).toFixed(2)}
									</span>
								</div>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t flex justify-between text-sm font-medium">
						<span>{t("riskEvalDetailTotalMitigation")}</span>
						<span className="tabular-nums text-emerald-600">
							-{detail.mitigantFactors.effect.toFixed(2)}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function EvaluationDetailSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-48" />
			<div className="flex justify-between">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-8 w-32" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardContent className="py-6">
							<Skeleton className="h-24 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="py-6">
							<Skeleton className="h-32 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
