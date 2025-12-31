"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Badge,
	Separator,
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
	User,
} from "lucide-react";
import type { Client } from "../../types/client";
import { getClientDisplayName } from "../../types/client";
import { getClientByRfc } from "../../lib/api/clients";
import { useToast } from "../../hooks/use-toast";

interface ClientDetailsViewProps {
	clientId: string; // RFC is passed as clientId
}

export function ClientDetailsView({
	clientId,
}: ClientDetailsViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchClient = async () => {
			try {
				setIsLoading(true);
				const data = await getClientByRfc({
					rfc: clientId,
				});
				setClient(data);
			} catch (error) {
				console.error("Error fetching client:", error);
				toast({
					title: "Error",
					description: "No se pudo cargar la información del cliente.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchClient();
	}, [clientId, toast]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={() => navigateTo("/clients")}
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Cargando cliente...
						</h1>
					</div>
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2"
						onClick={() => navigateTo("/clients")}
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Cliente no encontrado
						</h1>
					</div>
				</div>
			</div>
		);
	}

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
						onClick={() => navigateTo("/clients")}
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="hidden sm:inline">Volver</span>
					</Button>
					<Separator orientation="vertical" className="hidden h-6 sm:block" />
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
						onClick={() => navigateTo(`/clients/${clientId}/edit`)}
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
								<span className="text-sm text-muted-foreground">RFC:</span>
								<Badge
									variant="outline"
									className="font-medium text-sm font-mono"
								>
									{client.rfc}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							{client.personType === "physical" ? (
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
									{client.personType === "physical" ? "Nombre" : "Razón Social"}
								</dt>
								<dd className="text-base">{getClientDisplayName(client)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									RFC
								</dt>
								<dd className="text-base font-mono">{client.rfc}</dd>
							</div>
							{client.personType === "physical" && client.birthDate && (
								<div>
									<dt className="text-sm font-medium text-muted-foreground mb-1">
										Fecha de Nacimiento
									</dt>
									<dd className="text-base">{formatDate(client.birthDate)}</dd>
								</div>
							)}
							{(client.personType === "moral" ||
								client.personType === "trust") &&
								client.incorporationDate && (
									<div>
										<dt className="text-sm font-medium text-muted-foreground mb-1">
											Fecha de Constitución
										</dt>
										<dd className="text-base">
											{formatDate(client.incorporationDate)}
										</dd>
									</div>
								)}
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
								<dd className="text-base">{client.email}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<Phone className="h-4 w-4" />
									Teléfono
								</dt>
								<dd className="text-base">{client.phone}</dd>
							</div>
							<div className="md:col-span-2">
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<MapPin className="h-4 w-4" />
									Dirección
								</dt>
								<dd className="text-base">
									{client.street} {client.externalNumber}
									{client.internalNumber && ` Int. ${client.internalNumber}`}
									<br />
									{client.neighborhood && `${client.neighborhood}, `}
									C.P. {client.postalCode}
									<br />
									{client.city}, {client.stateCode}, {client.country}
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
								<dd className="text-base">{formatDate(client.createdAt)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									Última Actualización
								</dt>
								<dd className="text-base">{formatDate(client.updatedAt)}</dd>
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
							{client.notes || "Sin notas adicionales."}
						</p>
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">Última actualización:</span>{" "}
								{formatDate(client.updatedAt)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
