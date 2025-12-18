"use client";

import { useState } from "react";
import { TransactionsKPICards } from "@/components/transactions/TransactionsKPICards";
import { TransactionsFilters } from "@/components/transactions/TransactionsFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { Button } from "@algtools/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { ListTransactionsOptions } from "@/lib/api/transactions";

export function TransactionsPageContent(): React.ReactElement {
	const [filters, setFilters] = useState<ListTransactionsOptions>({});

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						Transacciones
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground">
						Gestión de transacciones de vehículos
					</p>
				</div>
				<Link href="/transactions/new">
					<Button className="gap-2 shrink-0">
						<Plus className="h-4 w-4" />
						<span className="hidden sm:inline">Nueva Transacción</span>
						<span className="sm:hidden">Nueva</span>
					</Button>
				</Link>
			</div>

			<TransactionsKPICards />
			<TransactionsFilters filters={filters} onFiltersChange={setFilters} />
			<TransactionsTable filters={filters} />
		</div>
	);
}
