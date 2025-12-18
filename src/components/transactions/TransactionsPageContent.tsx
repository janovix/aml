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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
					<p className="text-muted-foreground">
						Gestión de transacciones de vehículos
					</p>
				</div>
				<Link href="/transactions/new">
					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						<span>Nueva Transacción</span>
					</Button>
				</Link>
			</div>

			<TransactionsKPICards />
			<TransactionsFilters filters={filters} onFiltersChange={setFilters} />
			<TransactionsTable filters={filters} />
		</div>
	);
}
