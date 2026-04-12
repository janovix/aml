"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Badge as BadgeIcon,
	ChevronDown,
	ChevronRight,
	RefreshCw,
	Save,
	Settings2,
	Shield,
	Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useJwt } from "@/hooks/useJwt";
import { useLanguage } from "@/components/LanguageProvider";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	getEffectiveMethodology,
	resetMethodologyToDefault,
	type MethodologyData,
} from "@/lib/api/risk";

const SCOPE_LABELS: Record<string, { es: string; en: string; color: string }> =
	{
		SYSTEM: {
			es: "Predeterminado del sistema",
			en: "System default",
			color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400",
		},
		ACTIVITY: {
			es: "Predeterminado por actividad",
			en: "Activity default",
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
		},
		ORGANIZATION: {
			es: "Personalizado",
			en: "Custom",
			color:
				"bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
		},
	};

export function MethodologySettingsView(): React.ReactElement {
	const { orgPath } = useOrgNavigation();
	const { jwt } = useJwt();
	const { language, t } = useLanguage();

	const [methodology, setMethodology] = useState<MethodologyData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isResetting, setIsResetting] = useState(false);

	const fetchMethodology = useCallback(async () => {
		if (!jwt) return;
		setIsLoading(true);
		try {
			const data = await getEffectiveMethodology({ jwt });
			setMethodology(data);
		} catch {
			toast.error(
				language === "es"
					? "Error al cargar metodología"
					: "Error loading methodology",
			);
		} finally {
			setIsLoading(false);
		}
	}, [jwt, language]);

	useEffect(() => {
		fetchMethodology();
	}, [fetchMethodology]);

	const handleReset = async () => {
		if (!jwt) return;
		setIsResetting(true);
		try {
			const data = await resetMethodologyToDefault({ jwt });
			setMethodology(data);
			toast.success(
				language === "es"
					? "Metodología restablecida al valor predeterminado"
					: "Methodology reset to default",
			);
		} catch {
			toast.error(
				language === "es"
					? "Error al restablecer metodología"
					: "Error resetting methodology",
			);
		} finally {
			setIsResetting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-[400px] rounded-xl" />
			</div>
		);
	}

	if (!methodology) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-4">
				<Settings2 className="h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">
					{language === "es"
						? "No se encontró metodología"
						: "No methodology found"}
				</p>
			</div>
		);
	}

	const scopeLabel =
		SCOPE_LABELS[methodology.sourceScope] ?? SCOPE_LABELS.SYSTEM;
	const isCustom = methodology.sourceScope === "ORGANIZATION";

	return (
		<div className="space-y-6">
			{/* Navigation */}
			<Link href={orgPath("/risk")}>
				<Button variant="ghost" size="sm">
					<ArrowLeft className="h-4 w-4 mr-2" />
					{t("riskMethodologyBackToDashboard")}
				</Button>
			</Link>

			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-3">
						<Settings2 className="h-6 w-6 text-primary" />
						{t("riskMethodologyTitle")}
					</h1>
					<p className="text-muted-foreground mt-1">
						{methodology.name} &middot; v{methodology.version}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Badge className={scopeLabel.color}>{scopeLabel[language]}</Badge>
					{isCustom && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="outline" size="sm" disabled={isResetting}>
									<Undo2 className="h-4 w-4 mr-2" />
									{t("riskMethodologyReset")}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t("riskMethodologyResetConfirmTitle")}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t("riskMethodologyResetConfirmDescription")}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										{t("riskMethodologyResetCancel")}
									</AlertDialogCancel>
									<AlertDialogAction onClick={handleReset}>
										{t("riskMethodologyResetConfirm")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>

			{/* Categories */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t("riskMethodologyCategoriesTitle")}
					</CardTitle>
					<CardDescription>
						{t("riskMethodologyCategoriesDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{methodology.categories.map((cat) => (
						<CategorySection
							key={cat.name}
							category={cat}
							language={language}
						/>
					))}
				</CardContent>
			</Card>

			{/* Thresholds */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t("riskMethodologyThresholdsTitle")}
					</CardTitle>
					<CardDescription>
						{t("riskMethodologyThresholdsDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="text-left py-2 px-3 font-medium text-muted-foreground">
										{t("riskMethodologyThLevel")}
									</th>
									<th className="text-center py-2 px-3 font-medium text-muted-foreground">
										{t("riskMethodologyThRange")}
									</th>
									<th className="text-center py-2 px-3 font-medium text-muted-foreground">
										{t("riskMethodologyThDD")}
									</th>
									<th className="text-center py-2 px-3 font-medium text-muted-foreground">
										{t("riskMethodologyThReview")}
									</th>
								</tr>
							</thead>
							<tbody>
								{methodology.thresholds.map((th) => (
									<tr key={th.riskLevel} className="border-b last:border-0">
										<td className="py-2 px-3 font-medium">
											{th.riskLevel.replace("_", " ")}
										</td>
										<td className="py-2 px-3 text-center tabular-nums text-muted-foreground">
											{th.minScore} – {th.maxScore}
										</td>
										<td className="py-2 px-3 text-center">{th.ddLevel}</td>
										<td className="py-2 px-3 text-center tabular-nums">
											{th.reviewMonths} {language === "es" ? "meses" : "months"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Mitigants */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{t("riskMethodologyMitigantsTitle")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{methodology.mitigants.map((m) => (
							<div
								key={m.mitigantKey}
								className="flex items-center justify-between text-sm py-1"
							>
								<span>{m.displayName}</span>
								<div className="flex items-center gap-4 text-muted-foreground">
									<span className="tabular-nums">
										{language === "es" ? "Peso" : "Weight"}:{" "}
										{m.weight.toFixed(2)}
									</span>
									<span className="tabular-nums">
										{language === "es" ? "Efecto máx" : "Max effect"}:{" "}
										{m.maxEffect.toFixed(1)}
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function CategorySection({
	category,
	language,
}: {
	category: MethodologyData["categories"][number];
	language: "es" | "en";
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
				>
					<div className="flex items-center gap-3">
						{isOpen ? (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						)}
						<span className="font-medium">{category.displayName}</span>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="tabular-nums">
							{language === "es" ? "Peso" : "Weight"}:{" "}
							{(category.weight * 100).toFixed(0)}%
						</Badge>
						<Badge variant="outline" className="tabular-nums">
							{category.factors.length}{" "}
							{language === "es" ? "factores" : "factors"}
						</Badge>
					</div>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-2 ml-7 space-y-3">
					{category.factors.map((factor) => (
						<div key={factor.name} className="rounded-lg border p-3 space-y-2">
							<div className="flex items-center justify-between">
								<div>
									<span className="text-sm font-medium">
										{factor.displayName}
									</span>
									<span className="ml-2 text-xs text-muted-foreground">
										({factor.factorType})
									</span>
								</div>
								<Badge variant="secondary" className="text-xs tabular-nums">
									{(factor.weight * 100).toFixed(0)}%
								</Badge>
							</div>
							{factor.scoreMaps.length > 0 && (
								<div className="grid grid-cols-2 gap-1 pl-2">
									{factor.scoreMaps.map((sm, idx) => (
										<div
											key={`${sm.conditionValue}-${idx}`}
											className="flex items-center justify-between text-xs text-muted-foreground"
										>
											<span className="truncate">
												{sm.label ?? sm.conditionValue}
											</span>
											<span className="tabular-nums font-medium ml-2">
												{sm.score.toFixed(1)}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
