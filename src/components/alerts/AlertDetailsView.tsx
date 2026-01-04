"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	AlertTriangle,
	Bell,
	FileCheck,
	Send,
	XCircle,
	AlertCircle,
	User,
	FileText,
	Calendar,
	Clock,
	CheckCircle2,
	Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJwt } from "@/hooks/useJwt";
import { useLanguage } from "@/components/LanguageProvider";
import {
	getAlertById,
	cancelAlert,
	type Alert,
	type AlertStatus,
	type AlertSeverity,
} from "@/lib/api/alerts";
import { getClientById } from "@/lib/api/clients";
import type { Client } from "@/types/client";
import { getClientDisplayName } from "@/types/client";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { formatProperNoun } from "@/lib/utils";
import { executeMutation } from "@/lib/mutations";

const statusConfig: Record<
	AlertStatus,
	{ label: string; icon: React.ReactNode; bgColor: string }
> = {
	DETECTED: {
		label: "Detectada",
		icon: <Bell className="h-4 w-4" />,
		bgColor: "bg-amber-500/20 text-amber-400",
	},
	FILE_GENERATED: {
		label: "Archivo Generado",
		icon: <FileCheck className="h-4 w-4" />,
		bgColor: "bg-sky-500/20 text-sky-400",
	},
	SUBMITTED: {
		label: "Enviada",
		icon: <Send className="h-4 w-4" />,
		bgColor: "bg-emerald-500/20 text-emerald-400",
	},
	OVERDUE: {
		label: "Vencida",
		icon: <AlertCircle className="h-4 w-4" />,
		bgColor: "bg-red-500/20 text-red-400",
	},
	CANCELLED: {
		label: "Cancelada",
		icon: <XCircle className="h-4 w-4" />,
		bgColor: "bg-zinc-500/20 text-zinc-400",
	},
};

const severityConfig: Record<
	AlertSeverity,
	{
		label: string;
		badgeVariant: "default" | "secondary" | "destructive" | "outline";
	}
> = {
	LOW: { label: "Baja", badgeVariant: "outline" },
	MEDIUM: { label: "Media", badgeVariant: "secondary" },
	HIGH: { label: "Alta", badgeVariant: "default" },
	CRITICAL: { label: "Crítica", badgeVariant: "destructive" },
};

interface AlertDetailsViewProps {
	alertId: string;
}

export function AlertDetailsView({
	alertId,
}: AlertDetailsViewProps): React.JSX.Element {
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [alert, setAlert] = useState<Alert | null>(null);
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { navigateTo, orgPath } = useOrgNavigation();
	const { toast } = useToast();
	const { jwt } = useJwt();
	const { t } = useLanguage();

	useEffect(() => {
		const fetchAlert = async () => {
			if (!jwt) return;

			try {
				setIsLoading(true);
				const alertData = await getAlertById({ id: alertId, jwt });
				setAlert(alertData);

				// Fetch client if available
				if (alertData.clientId) {
					try {
						const clientData = await getClientById({
							id: alertData.clientId,
							jwt,
						});
						setClient(clientData);
					} catch (error) {
						console.error("Error fetching client:", error);
					}
				}
			} catch (error) {
				console.error("Error fetching alert:", error);
				toast({
					title: "Error",
					description: "No se pudo cargar la alerta.",
					variant: "destructive",
				});
				navigateTo("/alerts");
			} finally {
				setIsLoading(false);
			}
		};
		fetchAlert();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [alertId, jwt]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeroSkeleton
					showStats={false}
					showBackButton={true}
					actionCount={2}
				/>
				{/* Content skeleton */}
				<div className="grid gap-6 md:grid-cols-2">
					{[1, 2].map((i) => (
						<Card key={i}>
							<CardHeader>
								<div className="h-6 w-48 bg-accent animate-pulse rounded" />
							</CardHeader>
							<CardContent className="space-y-4">
								{[1, 2, 3].map((j) => (
									<div key={j} className="space-y-2">
										<div className="h-4 w-24 bg-accent animate-pulse rounded" />
										<div className="h-5 w-40 bg-accent animate-pulse rounded" />
									</div>
								))}
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (!alert) {
		return (
			<div className="space-y-6">
				<PageHero
					title="Alerta no encontrada"
					subtitle={`La alerta ${alertId} no existe`}
					icon={AlertTriangle}
					backButton={{
						label: "Volver a Alertas",
						onClick: () => navigateTo("/alerts"),
					}}
				/>
			</div>
		);
	}

	const formatDateTime = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return "No disponible";
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "Fecha inválida";
		}
		return date.toLocaleString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) {
			return "No disponible";
		}
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "Fecha inválida";
		}
		return date.toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	const handleCancel = async (reason: string): Promise<void> => {
		if (!alert || !jwt) return;

		try {
			await executeMutation({
				mutation: () => cancelAlert({ id: alert.id, reason, jwt }),
				loading: "Cancelando alerta...",
				success: "Alerta cancelada exitosamente",
				onSuccess: () => {
					// Refetch alert to get updated status
					getAlertById({ id: alert.id, jwt })
						.then(setAlert)
						.catch(console.error);
				},
			});
			setCancelDialogOpen(false);
		} catch (error) {
			console.error("Error cancelling alert:", error);
		}
	};

	const handleDownloadXml = async (): Promise<void> => {
		if (!alert?.satFileUrl) {
			toast({
				title: t("alertDownloadXmlNoFile"),
				variant: "destructive",
			});
			return;
		}

		try {
			toast({
				title: t("alertDownloadingXml"),
			});

			const response = await fetch(alert.satFileUrl);
			if (!response.ok) {
				throw new Error("Failed to download file");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			// Create a filename from alertRuleId and alert id
			a.download = `alerta-${alert.alertRuleId}-${alert.id}.xml`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			toast({
				title: t("alertDownloadXmlSuccess"),
			});
		} catch (error) {
			console.error("Error downloading XML:", error);
			toast({
				title: t("alertDownloadXmlError"),
				variant: "destructive",
			});
		}
	};

	const statusCfg = statusConfig[alert.status];
	const severityCfg = severityConfig[alert.severity];

	return (
		<div className="space-y-6">
			<PageHero
				title={alert.alertRule?.name || `Alerta ${alert.id}`}
				subtitle={`Código: ${alert.alertRuleId}`}
				icon={AlertTriangle}
				backButton={{
					label: "Volver a Alertas",
					onClick: () => navigateTo("/alerts"),
				}}
				actions={[
					...(alert.satFileUrl
						? [
								{
									label: t("alertDownloadXml"),
									icon: Download,
									onClick: handleDownloadXml,
								},
							]
						: []),
					...(alert.status !== "CANCELLED"
						? [
								{
									label: "Cancelar Alerta",
									icon: XCircle,
									onClick: () => setCancelDialogOpen(true),
									variant: "destructive" as const,
								},
							]
						: []),
				]}
			/>

			<div className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Información de la Alerta</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Estado
								</p>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant="outline"
										className={`${statusCfg.bgColor} border-0`}
									>
										<div className="flex items-center gap-2">
											{statusCfg.icon}
											{statusCfg.label}
										</div>
									</Badge>
								</div>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Severidad
								</p>
								<Badge variant={severityCfg.badgeVariant} className="mt-1">
									{severityCfg.label}
								</Badge>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Regla de Alerta
								</p>
								<p className="text-base font-medium mt-1">
									{alert.alertRule?.name || alert.alertRuleId}
								</p>
								{alert.alertRule?.description && (
									<p className="text-sm text-muted-foreground mt-1">
										{alert.alertRule.description}
									</p>
								)}
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Tipo
								</p>
								<Badge variant="outline" className="mt-1">
									{alert.isManual ? "Manual" : "Automática"}
								</Badge>
							</div>
							<Separator />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Creada
								</p>
								<p className="text-base font-medium mt-1">
									{formatDateTime(alert.createdAt)}
								</p>
							</div>
							{alert.updatedAt && alert.updatedAt !== alert.createdAt && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Actualizada
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.updatedAt)}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Información del Cliente</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{client ? (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Cliente
										</p>
										<Link
											href={orgPath(`/clients/${client.id}`)}
											className="text-base font-medium text-primary hover:underline mt-1 block"
										>
											{getClientDisplayName(client)}
										</Link>
									</div>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											RFC
										</p>
										<p className="text-base font-mono mt-1">{client.rfc}</p>
									</div>
									{client.email && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Email
												</p>
												<p className="text-base mt-1">{client.email}</p>
											</div>
										</>
									)}
								</>
							) : (
								<div>
									<p className="text-sm text-muted-foreground">
										ID del Cliente: {alert.clientId}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Plazos y Fechas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{alert.submissionDeadline && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Fecha Límite de Envío
										</p>
										<p
											className={`text-base font-medium mt-1 ${
												alert.isOverdue ? "text-red-400" : ""
											}`}
										>
											{formatDate(alert.submissionDeadline)}
											{alert.isOverdue && (
												<span className="ml-2 text-xs">(Vencida)</span>
											)}
										</p>
									</div>
									<Separator />
								</>
							)}
							{alert.fileGeneratedAt && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Archivo Generado
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.fileGeneratedAt)}
										</p>
									</div>
									<Separator />
								</>
							)}
							{alert.submittedAt && (
								<>
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Enviada a SAT
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.submittedAt)}
										</p>
									</div>
									{alert.satFolioNumber && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Folio SAT
												</p>
												<p className="text-base font-mono mt-1">
													{alert.satFolioNumber}
												</p>
											</div>
										</>
									)}
									{alert.satAcknowledgmentReceipt && (
										<>
											<Separator />
											<div>
												<p className="text-sm font-medium text-muted-foreground">
													Acuse de Recibo SAT
												</p>
												<p className="text-base font-mono mt-1 break-all">
													{alert.satAcknowledgmentReceipt}
												</p>
											</div>
										</>
									)}
								</>
							)}
							{alert.cancelledAt && (
								<>
									<Separator />
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Cancelada
										</p>
										<p className="text-base font-medium mt-1">
											{formatDateTime(alert.cancelledAt)}
										</p>
										{alert.cancellationReason && (
											<p className="text-sm text-muted-foreground mt-1">
												Razón: {alert.cancellationReason}
											</p>
										)}
									</div>
								</>
							)}
							{!alert.submissionDeadline &&
								!alert.fileGeneratedAt &&
								!alert.submittedAt &&
								!alert.cancelledAt && (
									<p className="text-sm text-muted-foreground">
										No hay fechas registradas
									</p>
								)}
						</CardContent>
					</Card>

					{alert.notes && (
						<Card>
							<CardHeader>
								<CardTitle>Notas</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm whitespace-pre-wrap">{alert.notes}</p>
							</CardContent>
						</Card>
					)}

					{alert.transactionId && (
						<Card>
							<CardHeader>
								<CardTitle>Transacción Relacionada</CardTitle>
							</CardHeader>
							<CardContent>
								<Link
									href={orgPath(`/transactions/${alert.transactionId}`)}
									className="text-base font-medium text-primary hover:underline"
								>
									Ver Transacción {alert.transactionId}
								</Link>
							</CardContent>
						</Card>
					)}

					{Object.keys(alert.metadata || {}).length > 0 && (
						<Card className="md:col-span-2">
							<CardHeader>
								<CardTitle>Metadatos</CardTitle>
							</CardHeader>
							<CardContent>
								<pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
									{JSON.stringify(alert.metadata, null, 2)}
								</pre>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Cancelar alerta?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción cancelará la alerta{" "}
							<strong>{alert.alertRule?.name || alert.alertRuleId}</strong>. Por
							favor, proporciona una razón para la cancelación.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.currentTarget);
							const reason = formData.get("reason") as string;
							if (reason) {
								handleCancel(reason);
							}
						}}
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="reason"
								className="text-sm font-medium text-foreground"
							>
								Razón de cancelación
							</label>
							<textarea
								id="reason"
								name="reason"
								required
								className="mt-2 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								placeholder="Describe la razón de la cancelación..."
							/>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
							<AlertDialogAction type="submit">
								Confirmar Cancelación
							</AlertDialogAction>
						</AlertDialogFooter>
					</form>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
