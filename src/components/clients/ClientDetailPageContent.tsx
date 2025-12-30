"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface ClientDetailPageContentProps {
	clientId: string;
}

export function ClientDetailPageContent({
	clientId,
}: ClientDetailPageContentProps): React.ReactElement {
	const router = useRouter();
	const [client, setClient] = useState<Client | null>(null);

	useEffect(() => {
		const foundClient = mockClients.find((c) => c.rfc === clientId);
		setClient(foundClient || null);
	}, [clientId]);

	if (!client) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
							<h2 className="text-2xl font-semibold">Cliente no encontrado</h2>
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
		);
	}

	const displayName = getClientDisplayName(client);
	const addressParts = [
		client.street,
		client.externalNumber && `Ext. ${client.externalNumber}`,
		client.internalNumber && `Int. ${client.internalNumber}`,
		client.neighborhood,
		client.city,
		client.stateCode,
		client.postalCode,
		client.country,
	]
		.filter(Boolean)
		.join(", ");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.push("/clients")}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
						<p className="text-muted-foreground">Detalles del cliente</p>
					</div>
				</div>
				<Link href={`/clients/${client.rfc}/edit`}>
					<Button className="gap-2">
						<Edit className="h-4 w-4" />
						<span>Editar</span>
					</Button>
				</Link>
			</div>

			<div className="space-y-6">
				<div className="max-w-5xl mx-auto space-y-6">
					{/* Header Card */}
					<Card className="border-2">
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div className="space-y-2">
									<div className="flex items-center gap-3">
										{client.personType === "physical" ? (
											<User className="h-8 w-8 text-primary" />
										) : (
											<Building2 className="h-8 w-8 text-primary" />
										)}
										<div>
											<CardTitle className="text-2xl">{displayName}</CardTitle>
											<p className="text-sm text-muted-foreground font-mono mt-1">
												RFC: {client.rfc}
											</p>
										</div>
									</div>
								</div>
								<div className="flex flex-col gap-2 items-end">
									<Badge variant="outline" className="font-medium">
										RFC: {client.rfc}
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
											<p className="text-sm text-muted-foreground">Dirección</p>
											<p className="font-medium">{addressParts}</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Dates Card */}
					<Card className="shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Fechas Importantes
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">
										Fecha de creación
									</p>
									<p className="font-medium">
										{new Date(client.createdAt).toLocaleDateString("es-MX", {
											day: "2-digit",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
							<Separator />
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm text-muted-foreground">
										Última actualización
									</p>
									<p className="font-medium">
										{new Date(client.updatedAt).toLocaleDateString("es-MX", {
											day: "2-digit",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

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
										{client.personType === "physical"
											? "Persona Física"
											: client.personType === "moral"
												? "Persona Moral"
												: "Fideicomiso"}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground mb-1">RFC</p>
									<p className="font-medium font-mono text-sm">{client.rfc}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
