"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Play, History, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import {
	getClientRiskAssessment,
	getClientRiskHistory,
	triggerClientRiskAssessment,
	type ClientRiskAssessment,
} from "@/lib/api/risk";
import { RiskBadge } from "./RiskBadge";
import { RiskScoreGauge } from "./RiskScoreGauge";
import { RiskFactorBreakdown } from "./RiskFactorBreakdown";
import { DDProfileCard } from "./DDProfileCard";

interface ClientRiskSectionProps {
	clientId: string;
}

export function ClientRiskSection({ clientId }: ClientRiskSectionProps) {
	const { jwt } = useJwt();
	const { language, t } = useLanguage();
	const { orgPath } = useOrgNavigation();

	const [assessment, setAssessment] = useState<ClientRiskAssessment | null>(
		null,
	);
	const [history, setHistory] = useState<ClientRiskAssessment[]>([]);
	const [showHistory, setShowHistory] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isTriggering, setIsTriggering] = useState(false);

	const fetchData = useCallback(
		async (jwtToken: string) => {
			setIsLoading(true);
			try {
				const [a, h] = await Promise.all([
					getClientRiskAssessment(clientId, { jwt: jwtToken }),
					getClientRiskHistory(clientId, { jwt: jwtToken }).catch(
						() => [] as ClientRiskAssessment[],
					),
				]);
				setAssessment(a);
				setHistory(h);
			} finally {
				setIsLoading(false);
			}
		},
		[clientId],
	);

	useEffect(() => {
		if (!jwt) return;
		fetchData(jwt);
	}, [jwt, fetchData]);

	const handleTrigger = async () => {
		if (!jwt) return;
		setIsTriggering(true);
		try {
			await triggerClientRiskAssessment(clientId, { jwt });
			toast.success(
				language === "es"
					? "Evaluación de riesgo encolada"
					: "Risk assessment queued",
			);
			setTimeout(() => jwt && fetchData(jwt), 3000);
		} catch {
			toast.error(
				language === "es"
					? "Error al iniciar evaluación"
					: "Error triggering assessment",
			);
		} finally {
			setIsTriggering(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-20 rounded-lg" />
				<Skeleton className="h-32 rounded-lg" />
			</div>
		);
	}

	if (!assessment) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<p className="text-sm text-muted-foreground">
					{language === "es"
						? "Sin evaluación de riesgo disponible"
						: "No risk assessment available"}
				</p>
				<Button
					variant="outline"
					size="sm"
					className="mt-3"
					onClick={handleTrigger}
					disabled={isTriggering}
				>
					<Play className="mr-2 h-3.5 w-3.5" />
					{language === "es" ? "Evaluar riesgo" : "Assess risk"}
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Summary row */}
			<div className="flex flex-wrap items-center gap-4">
				<RiskScoreGauge
					score={assessment.riskScore}
					level={assessment.riskLevel}
					label={language === "es" ? "Puntuación" : "Score"}
					size="sm"
				/>
				<div className="flex-1 grid grid-cols-2 @lg/main:grid-cols-4 gap-3 min-w-0">
					<div className="rounded-lg border bg-muted/50 p-2.5 text-center">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							{language === "es" ? "Nivel" : "Level"}
						</div>
						<div className="mt-1">
							<RiskBadge level={assessment.riskLevel} language={language} />
						</div>
					</div>
					<div className="rounded-lg border bg-muted/50 p-2.5 text-center">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							{language === "es" ? "Inherente" : "Inherent"}
						</div>
						<div className="mt-1 text-sm font-bold tabular-nums">
							{assessment.inherentRiskScore.toFixed(1)}
						</div>
					</div>
					<div className="rounded-lg border bg-muted/50 p-2.5 text-center">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							{language === "es" ? "Residual" : "Residual"}
						</div>
						<div className="mt-1 text-sm font-bold tabular-nums">
							{assessment.residualRiskScore.toFixed(1)}
						</div>
					</div>
					<div className="rounded-lg border bg-muted/50 p-2.5 text-center">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
							{language === "es" ? "Versión" : "Version"}
						</div>
						<div className="mt-1 text-sm font-bold tabular-nums">
							v{assessment.version}
						</div>
					</div>
				</div>
			</div>

			{/* Factor Breakdown */}
			{assessment.elements && assessment.elements.length > 0 && (
				<div>
					<h4 className="text-sm font-semibold mb-3">
						{language === "es" ? "Desglose por Elementos" : "Element Breakdown"}
					</h4>
					<RiskFactorBreakdown
						elements={assessment.elements}
						language={language}
					/>
				</div>
			)}

			{/* DD Profile */}
			{assessment.ddProfile && (
				<div>
					<h4 className="text-sm font-semibold mb-3">
						{language === "es"
							? "Perfil de Debida Diligencia"
							: "Due Diligence Profile"}
					</h4>
					<DDProfileCard profile={assessment.ddProfile} language={language} />
				</div>
			)}

			{/* Actions row */}
			<div className="flex items-center gap-2 pt-2">
				<Button
					variant="outline"
					size="sm"
					onClick={handleTrigger}
					disabled={isTriggering}
				>
					<RefreshCw
						className={cn("mr-2 h-3.5 w-3.5", isTriggering && "animate-spin")}
					/>
					{language === "es" ? "Re-evaluar" : "Re-assess"}
				</Button>
				{history.length > 1 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowHistory(!showHistory)}
					>
						<History className="mr-2 h-3.5 w-3.5" />
						{showHistory
							? language === "es"
								? "Ocultar historial"
								: "Hide history"
							: language === "es"
								? `Ver historial (${history.length})`
								: `View history (${history.length})`}
					</Button>
				)}
			</div>

			{/* History table */}
			{showHistory && history.length > 1 && (
				<div className="space-y-2">
					<div className="overflow-x-auto border rounded-lg">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/50">
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										{language === "es" ? "Ver." : "Ver."}
									</th>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										{language === "es" ? "Fecha" : "Date"}
									</th>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										{language === "es" ? "Nivel" : "Level"}
									</th>
									<th className="text-right px-3 py-2 font-medium text-muted-foreground">
										{language === "es" ? "Puntuación" : "Score"}
									</th>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										{language === "es" ? "Motivo" : "Trigger"}
									</th>
								</tr>
							</thead>
							<tbody>
								{history.map((h) => (
									<tr
										key={h.id}
										className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
										onClick={() =>
											(window.location.href = orgPath(
												`/risk/evaluations/${h.id}`,
											))
										}
									>
										<td className="px-3 py-2 tabular-nums">v{h.version}</td>
										<td className="px-3 py-2 text-muted-foreground">
											{new Date(h.createdAt).toLocaleDateString(
												language === "es" ? "es-MX" : "en-US",
												{
													year: "numeric",
													month: "short",
													day: "numeric",
												},
											)}
										</td>
										<td className="px-3 py-2">
											<RiskBadge level={h.riskLevel} language={language} />
										</td>
										<td className="px-3 py-2 text-right tabular-nums">
											{h.riskScore.toFixed(1)}
										</td>
										<td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
											{h.triggerReason}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="text-right">
						<Link
							href={orgPath(`/risk/evaluations?clientId=${clientId}`)}
							className="text-xs text-primary hover:underline inline-flex items-center gap-1"
						>
							<ExternalLink className="h-3 w-3" />
							{t("riskEvalViewAll")}
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
