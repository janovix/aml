"use client";

import { useRouter } from "next/navigation";
import { KpiCards } from "@/components/clients/KpiCards";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { Button } from "@algtools/ui";
import { Plus } from "lucide-react";

export function ClientsPageContent(): React.ReactElement {
	const router = useRouter();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
					<p className="text-muted-foreground">
						Gestión y monitoreo de clientes
					</p>
				</div>
				<Button
					className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 sm:gap-2 rounded-lg p-0 bg-primary hover:bg-primary/90"
					onClick={() => router.push("/clients/new")}
					aria-label="Nuevo Cliente"
				>
					<Plus className="h-4 w-4 text-primary-foreground" />
					<span className="hidden sm:inline text-primary-foreground">
						Nuevo Cliente
					</span>
				</Button>
			</div>

			<KpiCards />

			<ClientsTable />
		</div>
	);
}
