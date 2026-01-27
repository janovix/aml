"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportsTable } from "./ImportsTable";
import { CreateImportDialog } from "./CreateImportDialog";

export function ImportPageContent() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleImportSuccess = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background">
			{/* Header */}
			<div className="flex-shrink-0 p-4 border-b border-border">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Importaciones</h1>
						<p className="text-muted-foreground">
							Importa clientes y transacciones de forma masiva
						</p>
					</div>
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Nueva Importación
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-4">
				<ImportsTable refreshTrigger={refreshTrigger} />
			</div>

			{/* Create dialog */}
			<CreateImportDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onSuccess={handleImportSuccess}
			/>
		</div>
	);
}
