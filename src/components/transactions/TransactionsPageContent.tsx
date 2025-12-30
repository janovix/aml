"use client";

import { TransactionsKPICards } from "@/components/transactions/TransactionsKPICards";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { Button } from "@algtools/ui";
import { Plus } from "lucide-react";
import Link from "next/link";

export function TransactionsPageContent(): React.ReactElement {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
					<p className="text-muted-foreground">
						Gestión de transacciones de vehículos
					</p>
				</div>
				<Link href="/transactions/new">
					<Button
						className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 sm:gap-2 rounded-lg p-0 bg-primary hover:bg-primary/90"
						aria-label="Nueva Transacción"
					>
						<Plus className="h-4 w-4 text-primary-foreground" />
						<span className="hidden sm:inline text-primary-foreground">
							Nueva Transacción
						</span>
					</Button>
				</Link>
			</div>

			<TransactionsKPICards />
			<TransactionsTable />
		</div>
	);
}
