"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	Edit,
	Mail,
	Phone,
	MapPin,
	AlertTriangle,
	FileText,
	Calendar,
	Shield,
	Building2,
	User,
} from "lucide-react";
import Link from "next/link";
import { mockClients } from "@/data/mockClients";
import { getClientDisplayName, type Client } from "@/types/client";
import { cn } from "@/lib/utils";

const riskBadgeStyles: Record<string, string> = {
	BAJO: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	MEDIO:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	ALTO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const statusBadgeStyles: Record<string, string> = {
	ACTIVO:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	INACTIVO: "bg-muted text-muted-foreground border-muted-foreground/30",
	SUSPENDIDO:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	BLOQUEADO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const reviewStatusBadgeStyles: Record<string, string> = {
	PENDIENTE: "bg-muted text-muted-foreground border-muted-foreground/30",
	EN_REVISION:
		"bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
	APROBADO:
		"bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
	RECHAZADO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

interface ClientDetailPageContentProps {
	clientId: string;
}

export function ClientDetailPageContent({
	clientId,
}: ClientDetailPageContentProps): React.ReactElement {
	const router = useRouter();
	const [client, setClient] = useState<Client | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		const foundClient = mockClients.find((c) => c.id === clientId);
		setClient(foundClient || null);
	}, [clientId]);

	if (!client) {
		return (
			<div className="flex h-screen w-full overflow-hidden bg-background">
				<AppSidebar
					collapsed={sidebarCollapsed}
					onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>
				<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
					<div className="flex-1 flex items-center justify-center">
						<Card className="w-full max-w-md">
							<CardContent className="pt-6">
								<div className="text-center space-y-4">
									<AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
									<h2 className="text-2xl font-semibold">
										Cliente no encontrado
									</h2>
									<p className="text-muted-foreground">
										El cliente con ID {clientId} no existe.
									</p>
									<Button
										onClick={() => router.push("/clients")}
										className="w-full"
									>
										<ArrowLeft className="mr-2 h-4 w-4" />
										Volver a Clientes
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	const displayName = getClientDisplayName(client);
	const addressParts = [
		client.street,
		client.extNumber && `Ext. ${client.extNumber}`,
		client.intNumber && `Int. ${client.intNumber}`,
		client.neighborhood,
		client.city,
		client.state,
		client.zipCode,
		client.country,
	]
		.filter(Boolean)
		.join(", ");

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<AppSidebar
				collapsed={sidebarCollapsed}
				onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>

			<main className="flex flex-1 min-h-0 min-w-0 w-full flex-col">
				<header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-3 sm:px-6">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push("/clients")}
							className="shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold text-foreground truncate">
								{displayName}
							</h1>
							<p className="text-sm text-muted-foreground hidden sm:block truncate">
								Detalles del cliente
							</p>
						</div>
					</div>
					<Link href={`/clients/${client.id}/edit`}>
						<Button className="gap-2 shrink-0 ml-2">
							<Edit className="h-4 w-4" />
							<span className="hidden sm:inline">Editar</span>
						</Button>
					</Link>
				</header>

				<div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
					<div className="max-w-5xl mx-auto space-y-6">
						{/* Header Card */}
						<Card className="border-2">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											{client.personType === "FISICA" ? (
												<User className="h-8 w-8 text-primary" />
											) : (
												<Building2 className="h-8 w-8 text-primary" />
											)}
											<div>
												<CardTitle className="text-2xl">
													{displayName}
												</CardTitle>
												<p className="text-sm text-muted-foreground font-mono mt-1">
													RFC: {client.rfc}
												</p>
											</div>
										</div>
									</div>
									<div className="flex flex-col gap-2 items-end">
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												riskBadgeStyles[client.riskLevel],
											)}
										>
											{client.riskLevel === "BAJO"
												? "Bajo"
												: client.riskLevel === "MEDIO"
													? "Medio"
													: "Alto"}
										</Badge>
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												statusBadgeStyles[client.status],
											)}
										>
											{client.status === "ACTIVO"
												? "Activo"
												: client.status === "INACTIVO"
													? "Inactivo"
													: client.status === "SUSPENDIDO"
														? "Suspendido"
														: "Bloqueado"}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center gap-3">
										<Mail className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">Email</p>
											<p className="font-medium">{client.email}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Phone className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">Teléfono</p>
											<p className="font-medium">{client.phone}</p>
										</div>
									</div>
									{addressParts && (
										<div className="flex items-start gap-3 md:col-span-2">
											<MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
											<div>
												<p className="text-sm text-muted-foreground">
													Dirección
												</p>
												<p className="font-medium">{addressParts}</p>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Status and Review Card */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card className="shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg flex items-center gap-2">
										<Shield className="h-5 w-5" />
										Estado de Revisión
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm text-muted-foreground mb-2">
											Estado actual
										</p>
										<Badge
											variant="outline"
											className={cn(
												"font-medium",
												reviewStatusBadgeStyles[client.reviewStatus],
											)}
										>
											{client.reviewStatus === "PENDIENTE"
												? "Pendiente"
												: client.reviewStatus === "EN_REVISION"
													? "En Revisión"
													: client.reviewStatus === "APROBADO"
														? "Aprobado"
														: "Rechazado"}
										</Badge>
									</div>
									<Separator />
									<div className="flex items-center gap-3">
										<Calendar className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm text-muted-foreground">
												Última revisión
											</p>
											<p className="font-medium">
												{new Date(client.lastReview).toLocaleDateString(
													"es-MX",
													{
														day: "2-digit",
														month: "long",
														year: "numeric",
													},
												)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg flex items-center gap-2">
										<AlertTriangle className="h-5 w-5" />
										Avisos
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<p className="text-3xl font-bold">{client.alertCount}</p>
											<p className="text-sm text-muted-foreground">
												avisos activos
											</p>
										</div>
										{client.alertCount > 0 && (
											<Button variant="outline" className="w-full">
												<FileText className="mr-2 h-4 w-4" />
												Ver Avisos
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Additional Information */}
						<Card className="shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg">Información Adicional</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											Tipo de Persona
										</p>
										<p className="font-medium">
											{client.personType === "FISICA"
												? "Persona Física"
												: "Persona Moral"}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground mb-1">
											ID del Cliente
										</p>
										<p className="font-medium font-mono text-sm">{client.id}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
