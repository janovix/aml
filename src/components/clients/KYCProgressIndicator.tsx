"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	FileCheck2,
	FileX2,
	AlertCircle,
	CheckCircle2,
	Clock,
	Users,
	ShieldCheck,
	ShieldAlert,
	ShieldQuestion,
	Loader2,
} from "lucide-react";
import { getClientKYCStatus, type KYCStatusResponse } from "@/lib/api/clients";
import { getDocumentLabel, requiresUBOs } from "@/lib/constants";

interface KYCProgressIndicatorProps {
	clientId: string;
	personType: string;
	className?: string;
	/** If true, only show the compact badge version */
	compact?: boolean;
	/** Refresh trigger - increment to refetch KYC status */
	refreshTrigger?: number;
}

const KYC_STATUS_CONFIG = {
	INCOMPLETE: {
		label: "Incompleto",
		color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		icon: AlertCircle,
	},
	PENDING_VERIFICATION: {
		label: "Pendiente de verificación",
		color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
		icon: Clock,
	},
	COMPLETE: {
		label: "Completo",
		color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		icon: CheckCircle2,
	},
	EXPIRED: {
		label: "Expirado",
		color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		icon: AlertCircle,
	},
};

const PEP_STATUS_CONFIG = {
	PENDING: {
		label: "Pendiente",
		color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
		icon: ShieldQuestion,
	},
	CONFIRMED: {
		label: "PEP Confirmado",
		color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
		icon: ShieldAlert,
	},
	NOT_PEP: {
		label: "No PEP",
		color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		icon: ShieldCheck,
	},
	ERROR: {
		label: "Error",
		color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
		icon: AlertCircle,
	},
};

function DocumentTypeLabel({ type }: { type: string }) {
	return <span>{getDocumentLabel(type)}</span>;
}

export function KYCProgressIndicator({
	clientId,
	personType,
	className,
	compact = false,
	refreshTrigger = 0,
}: KYCProgressIndicatorProps) {
	const [status, setStatus] = useState<KYCStatusResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStatus = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const data = await getClientKYCStatus({ id: clientId });
				setStatus(data);
			} catch (err) {
				console.error("Error fetching KYC status:", err);
				setError("Error al cargar el estado KYC");
			} finally {
				setIsLoading(false);
			}
		};
		fetchStatus();
	}, [clientId, refreshTrigger]);

	if (isLoading) {
		if (compact) {
			return (
				<Badge variant="outline" className="gap-1">
					<Loader2 className="h-3 w-3 animate-spin" />
					Cargando...
				</Badge>
			);
		}
		return (
			<Card className={className}>
				<CardContent className="p-4 flex items-center justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	if (error || !status) {
		if (compact) {
			return (
				<Badge variant="outline" className="gap-1 text-amber-600">
					<AlertCircle className="h-3 w-3" />
					Error
				</Badge>
			);
		}
		return (
			<Card className={className}>
				<CardContent className="p-4 text-amber-600 flex items-center gap-2">
					<AlertCircle className="h-4 w-4" />
					<span className="text-sm">{error || "Error desconocido"}</span>
				</CardContent>
			</Card>
		);
	}

	const kycConfig =
		KYC_STATUS_CONFIG[status.kycStatus as keyof typeof KYC_STATUS_CONFIG] ||
		KYC_STATUS_CONFIG.INCOMPLETE;
	const pepConfig =
		PEP_STATUS_CONFIG[status.pep.status as keyof typeof PEP_STATUS_CONFIG] ||
		PEP_STATUS_CONFIG.PENDING;

	const KYCIcon = kycConfig.icon;
	const PEPIcon = pepConfig.icon;

	// Compact badge version
	if (compact) {
		return (
			<div className="flex items-center gap-2">
				<Badge className={cn("gap-1", kycConfig.color)}>
					<KYCIcon className="h-3 w-3" />
					KYC {status.completionPercentage}%
				</Badge>
				<Badge className={cn("gap-1", pepConfig.color)}>
					<PEPIcon className="h-3 w-3" />
					{pepConfig.label}
				</Badge>
			</div>
		);
	}

	// Full card version
	const requiresUBO = requiresUBOs(
		personType as "physical" | "moral" | "trust",
	);

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center justify-between">
					<span>Estado KYC</span>
					<Badge className={cn(kycConfig.color)}>{kycConfig.label}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Progress bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Progreso</span>
						<span className="font-medium">{status.completionPercentage}%</span>
					</div>
					<Progress value={status.completionPercentage} className="h-2" />
				</div>

				{/* Documents section */}
				<div className="space-y-2">
					<h4 className="text-sm font-medium flex items-center gap-2">
						<FileCheck2 className="h-4 w-4" />
						Documentos
					</h4>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<span>Cargados:</span>
							<span className="font-medium text-foreground">
								{status.documents.total}
							</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<span>Verificados:</span>
							<span className="font-medium text-green-600">
								{status.documents.verified}
							</span>
						</div>
					</div>

					{/* Missing documents */}
					{status.documents.missing.length > 0 && (
						<div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
							<p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1 flex items-center gap-1">
								<FileX2 className="h-3 w-3" />
								Documentos faltantes:
							</p>
							<ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
								{status.documents.missing.map((docType) => (
									<li key={docType} className="flex items-center gap-1">
										<span className="w-1 h-1 rounded-full bg-amber-500" />
										<DocumentTypeLabel type={docType} />
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* UBO section (for moral/trust) */}
				{requiresUBO && status.ubos.required && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium flex items-center gap-2">
							<Users className="h-4 w-4" />
							Beneficiarios Finales (UBO)
						</h4>
						{status.ubos.hasUBO ? (
							<div className="text-sm">
								<span className="text-muted-foreground">Registrados: </span>
								<span className="font-medium text-green-600">
									{status.ubos.count}
								</span>
								{!status.ubos.allHaveDocuments && (
									<p className="text-xs text-amber-600 mt-1">
										Algunos UBOs no tienen documentos cargados
									</p>
								)}
							</div>
						) : (
							<div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
								<p className="text-xs text-amber-800 dark:text-amber-200">
									Se requiere al menos un beneficiario final
								</p>
							</div>
						)}
					</div>
				)}

				{/* PEP status */}
				<div className="space-y-2 pt-2 border-t">
					<h4 className="text-sm font-medium flex items-center gap-2">
						<PEPIcon className="h-4 w-4" />
						Estado PEP
					</h4>
					<div className="flex items-center justify-between">
						<Badge className={cn(pepConfig.color)}>{pepConfig.label}</Badge>
						{status.pep.checkedAt && (
							<span className="text-xs text-muted-foreground">
								Verificado:{" "}
								{new Date(status.pep.checkedAt).toLocaleDateString("es-MX")}
							</span>
						)}
					</div>
					{status.pep.isPEP && (
						<p className="text-xs text-red-600 dark:text-red-400">
							Este cliente está identificado como Persona Políticamente Expuesta
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
