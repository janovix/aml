"use client";

import { useRouter } from "next/navigation";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
	Separator,
	cn,
} from "@algtools/ui";
import {
	ArrowLeft,
	Edit,
	Flag,
	FileText,
	Building2,
	MapPin,
	Phone,
	Mail,
	Calendar,
	AlertCircle,
	User,
} from "lucide-react";
import type { Client, RiskLevel, ClientStatus } from "../../types/client";
import { mockClients } from "../../data/mockClients";

const riskBadgeStyles: Record<RiskLevel, string> = {
	BAJO: "bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low))]/30",
	MEDIO:
		"bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/30",
	ALTO: "bg-[hsl(var(--risk-high-bg))] text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high))]/30",
};

const statusBadgeStyles: Record<ClientStatus, string> = {
	ACTIVO:
		"bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))] border-[hsl(var(--risk-low))]/30",
	INACTIVO: "bg-muted text-muted-foreground border-border",
	SUSPENDIDO:
		"bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))] border-[hsl(var(--risk-medium))]/30",
	BLOQUEADO:
		"bg-[hsl(var(--risk-high-bg))] text-[hsl(var(--risk-high))] border-[hsl(var(--risk-high))]/30",
};

const getClientDisplayName = (client: Client): string => {
	if (client.personType === "FISICA") {
		return `${client.firstName} ${client.lastName} ${client.secondLastName || ""}`.trim();
	}
	return client.businessName || "";
};

interface ClientDetailsViewProps {
	clientId: string;
}

export function ClientDetailsView({
	clientId,
}: ClientDetailsViewProps): React.JSX.Element {
	const router = useRouter();

	const client = mockClients.find((c) => c.id === clientId) || mockClients[0];

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={() => router.push("/clients")}
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<Separator orientation="vertical" className="h-6" />
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Detalles del Cliente
						</h1>
						<p className="text-sm text-muted-foreground">
							{getClientDisplayName(client)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
						<FileText className="h-4 w-4" />
						Generar Reporte
					</Button>
					<Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
						<Flag className="h-4 w-4" />
						Marcar Sospechoso
					</Button>
					<Button
						size="sm"
						className="gap-2"
						onClick={() => router.push(`/clients/${clientId}/edit`)}
					>
						<Edit className="h-4 w-4" />
						<span className="hidden sm:inline">Editar</span>
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Información General</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex flex-wrap gap-4">
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									Nivel de Riesgo:
								</span>
								<Badge
									variant="outline"
									className={cn(
										"font-medium text-sm",
										riskBadgeStyles[client.riskLevel],
									)}
								>
									{client.riskLevel}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">Estado:</span>
								<Badge
									variant="outline"
									className={cn(
										"font-medium text-sm",
										statusBadgeStyles[client.status],
									)}
								>
									{client.status}
								</Badge>
							</div>
							{client.alertCount > 0 && (
								<div className="flex items-center gap-2">
									<AlertCircle className="h-4 w-4 text-[hsl(var(--risk-high))]" />
									<span className="text-sm font-medium text-[hsl(var(--risk-high))]">
										{client.alertCount}{" "}
										{client.alertCount === 1 ? "Aviso" : "Avisos"} Activos
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							{client.personType === "FISICA" ? (
								<>
									<User className="h-5 w-5" />
									Datos Personales
								</>
							) : (
								<>
									<Building2 className="h-5 w-5" />
									Datos de la Empresa
								</>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{client.personType === "FISICA" ? "Nombre" : "Razón Social"}
								</dt>
								<dd className="text-base">{getClientDisplayName(client)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									RFC
								</dt>
								<dd className="text-base font-mono">{client.rfc}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Phone className="h-5 w-5" />
							Información de Contacto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Email
								</dt>
								<dd className="text-base">contacto@cliente.com</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<Phone className="h-4 w-4" />
									Teléfono
								</dt>
								<dd className="text-base">+52 81 1234 5678</dd>
							</div>
							<div className="md:col-span-2">
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<MapPin className="h-4 w-4" />
									Dirección
								</dt>
								<dd className="text-base">
									Av. Constitución 123
									<br />
									Col. Centro, C.P. 64000
									<br />
									Monterrey, Nuevo León, México
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Calendar className="h-5 w-5" />
							Historial de Transacciones
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Fecha de Registro
								</dt>
								<dd className="text-base">{formatDate(client.lastReview)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Última Transacción
								</dt>
								<dd className="text-base">{formatDate(client.lastReview)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Total de Transacciones
								</dt>
								<dd className="text-base font-semibold">156</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Volumen Total
								</dt>
								<dd className="text-base font-semibold text-primary">
									$45,800,000
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Notas de Cumplimiento</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Cliente con alto volumen de transacciones. Requiere monitoreo
							continuo debido al nivel de riesgo.
						</p>
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">Última revisión:</span>{" "}
								{formatDate(client.lastReview)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
