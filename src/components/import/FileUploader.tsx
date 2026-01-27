"use client";

import type React from "react";
import { useCallback, useState } from "react";
import {
	Upload,
	FileSpreadsheet,
	Users,
	Receipt,
	AlertCircle,
	Download,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportEntityType } from "@/types/import";
import { getTemplateUrl } from "@/lib/api/imports";

interface FileUploaderProps {
	onFileUpload: (file: File, entityType: ImportEntityType) => void;
	isUploading?: boolean;
	disabled?: boolean;
	/** Pre-select an entity type */
	defaultEntityType?: ImportEntityType;
}

export function FileUploader({
	onFileUpload,
	isUploading = false,
	disabled = false,
	defaultEntityType,
}: FileUploaderProps) {
	const isDisabled = isUploading || disabled;
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedEntityType, setSelectedEntityType] =
		useState<ImportEntityType>(defaultEntityType ?? "CLIENT");

	const validateFile = useCallback((file: File): boolean => {
		const validTypes = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
			"text/csv",
		];
		const validExtensions = [".xlsx", ".xls", ".csv"];
		const hasValidType = validTypes.includes(file.type);
		const hasValidExtension = validExtensions.some((ext) =>
			file.name.toLowerCase().endsWith(ext),
		);

		if (!hasValidType && !hasValidExtension) {
			setError("Por favor sube un archivo Excel (.xlsx, .xls) o CSV");
			return false;
		}

		if (file.size > 50 * 1024 * 1024) {
			setError("El archivo debe ser menor a 50MB");
			return false;
		}

		setError(null);
		return true;
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file && validateFile(file)) {
				onFileUpload(file, selectedEntityType);
			}
		},
		[onFileUpload, validateFile, selectedEntityType],
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file && validateFile(file)) {
				onFileUpload(file, selectedEntityType);
			}
		},
		[onFileUpload, validateFile, selectedEntityType],
	);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{/* Entity Type Selection */}
			<Card className="bg-card border-border">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg">Tipo de Datos</CardTitle>
					<CardDescription>
						Selecciona el tipo de datos que deseas importar
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-3">
						<Button
							variant={selectedEntityType === "CLIENT" ? "default" : "outline"}
							className={cn(
								"h-auto py-4 flex flex-col items-center gap-2",
								selectedEntityType === "CLIENT"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30",
							)}
							onClick={() => setSelectedEntityType("CLIENT")}
						>
							<Users className="h-6 w-6" />
							<span className="text-sm font-medium">Clientes</span>
							<span className="text-xs opacity-70">
								Personas físicas y morales
							</span>
						</Button>
						<Button
							variant={
								selectedEntityType === "TRANSACTION" ? "default" : "outline"
							}
							className={cn(
								"h-auto py-4 flex flex-col items-center gap-2",
								selectedEntityType === "TRANSACTION"
									? "bg-primary text-primary-foreground"
									: "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30",
							)}
							onClick={() => setSelectedEntityType("TRANSACTION")}
						>
							<Receipt className="h-6 w-6" />
							<span className="text-sm font-medium">Transacciones</span>
							<span className="text-xs opacity-70">
								Operaciones de vehículos
							</span>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* File Upload */}
			<Card className="bg-card border-border">
				<CardHeader className="text-center pb-2">
					<CardTitle className="text-2xl">Importar Datos</CardTitle>
					<CardDescription>
						Sube un archivo Excel o CSV para comenzar la importación
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div
						className={cn(
							"relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 cursor-pointer",
							isDisabled && "opacity-50 pointer-events-none",
							isDragging
								? "border-primary bg-primary/5"
								: "border-border hover:border-primary/50 hover:bg-secondary/50",
						)}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						<input
							type="file"
							accept=".xlsx,.xls,.csv"
							onChange={handleFileChange}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							disabled={isDisabled}
						/>
						<div className="flex flex-col items-center gap-4">
							<div
								className={cn(
									"p-4 rounded-full transition-colors",
									isDragging ? "bg-primary/20" : "bg-secondary",
								)}
							>
								{isUploading ? (
									<div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
								) : (
									<Upload
										className={cn(
											"h-10 w-10 transition-colors",
											isDragging ? "text-primary" : "text-muted-foreground",
										)}
									/>
								)}
							</div>
							<div className="text-center">
								<p className="text-lg font-medium text-foreground">
									{isUploading ? (
										"Subiendo archivo..."
									) : (
										<>
											Arrastra tu archivo aquí, o{" "}
											<span className="text-primary">selecciona</span>
										</>
									)}
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Soporta Excel (.xlsx, .xls) y CSV hasta 50MB
								</p>
							</div>
						</div>
					</div>

					{error && (
						<div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
							<AlertCircle className="h-5 w-5 shrink-0" />
							<p className="text-sm">{error}</p>
						</div>
					)}

					<div className="flex items-center gap-4 pt-4">
						<div className="flex-1 h-px bg-border" />
						<span className="text-sm text-muted-foreground">
							o descarga una plantilla
						</span>
						<div className="flex-1 h-px bg-border" />
					</div>

					<div className="grid grid-cols-2 gap-3">
						<Button
							variant="outline"
							className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30"
							asChild
						>
							<a
								href={getTemplateUrl("CLIENT")}
								download="plantilla_clientes.csv"
							>
								<Download className="h-6 w-6 text-blue-500" />
								<span className="text-sm font-medium">Plantilla Clientes</span>
								<span className="text-xs text-muted-foreground">CSV</span>
							</a>
						</Button>
						<Button
							variant="outline"
							className="h-auto py-4 flex flex-col items-center gap-2 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30"
							asChild
						>
							<a
								href={getTemplateUrl("TRANSACTION")}
								download="plantilla_transacciones.csv"
							>
								<FileSpreadsheet className="h-6 w-6 text-green-500" />
								<span className="text-sm font-medium">
									Plantilla Transacciones
								</span>
								<span className="text-xs text-muted-foreground">CSV</span>
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
