"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CatalogItem } from "@/types/catalog";
import { createCatalogItem } from "@/lib/catalogs";

interface AddCatalogItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	catalogKey: string;
	catalogName?: string;
	initialValue?: string;
	onItemCreated: (item: CatalogItem) => void;
}

export function AddCatalogItemDialog({
	open,
	onOpenChange,
	catalogKey,
	catalogName,
	initialValue = "",
	onItemCreated,
}: AddCatalogItemDialogProps): React.ReactElement {
	const [name, setName] = useState(initialValue);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			const trimmedName = name.trim();
			if (!trimmedName) {
				setError("El nombre es requerido");
				return;
			}

			if (trimmedName.length > 200) {
				setError("El nombre no puede exceder 200 caracteres");
				return;
			}

			setIsSubmitting(true);
			setError(null);

			try {
				const newItem = await createCatalogItem(catalogKey, trimmedName);
				toast.success(`"${newItem.name}" agregado exitosamente`);
				onItemCreated(newItem);
				setName("");
				onOpenChange(false);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Error al crear el elemento";

				// Check for conflict error (already exists)
				if (message.includes("already exists") || message.includes("409")) {
					setError("Ya existe un elemento con este nombre");
				} else {
					setError(message);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[name, catalogKey, onItemCreated, onOpenChange],
	);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				setName("");
				setError(null);
			}
			onOpenChange(nextOpen);
		},
		[onOpenChange],
	);

	// Reset name when initialValue changes
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setName(e.target.value);
			if (error) {
				setError(null);
			}
		},
		[error],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Agregar nuevo elemento</DialogTitle>
					<DialogDescription>
						{catalogName
							? `Agregar un nuevo elemento al catálogo "${catalogName}".`
							: "Agregar un nuevo elemento al catálogo."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="catalog-item-name">Nombre</Label>
							<Input
								id="catalog-item-name"
								value={name}
								onChange={handleInputChange}
								placeholder="Ingrese el nombre del elemento"
								autoFocus
								disabled={isSubmitting}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "catalog-item-error" : undefined}
							/>
							{error && (
								<p
									id="catalog-item-error"
									className="text-sm text-destructive"
									role="alert"
								>
									{error}
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting || !name.trim()}>
							{isSubmitting ? "Guardando..." : "Agregar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
