"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@algtools/ui";
import { Save, Building2, AlertCircle } from "lucide-react";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import {
	getFieldDescription,
	getFieldDescriptionByXmlTag,
} from "../../lib/field-descriptions";
import { fetchJson } from "@/lib/api/http";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import { validateRFC } from "../../lib/utils";
import { executeMutation } from "@/lib/mutations";
import { toast } from "sonner";

interface OrganizationSettingsData {
	obligatedSubjectKey: string;
	activityKey: string;
}

export function SettingsPageContent(): React.JSX.Element {
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [hasNoOrganization, setHasNoOrganization] = useState(false);
	const [formData, setFormData] = useState<OrganizationSettingsData>({
		obligatedSubjectKey: "",
		activityKey: "VEH",
	});

	const [validationErrors, setValidationErrors] = useState<{
		rfc?: string;
	}>({});

	// Fetch existing organization settings on mount
	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const baseUrl = getAmlCoreBaseUrl();
				const { json: data } = await fetchJson<{
					obligatedSubjectKey?: string;
					activityKey?: string;
				}>(`${baseUrl}/api/v1/organization-settings`);

				setFormData({
					obligatedSubjectKey: data.obligatedSubjectKey || "",
					activityKey: data.activityKey || "VEH",
				});
			} catch (error: unknown) {
				// Check error status for specific handling
				const apiError = error as { status?: number };
				if (apiError.status === 404) {
					// No settings found, that's okay for first-time setup
					console.log("No organization settings found, using defaults");
				} else if (apiError.status === 403) {
					// No active organization selected
					setHasNoOrganization(true);
				} else {
					console.error("Error fetching organization settings:", error);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, []);

	const handleInputChange = (
		field: keyof OrganizationSettingsData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();

		// Client-side validation for RFC
		const rfcValidation = validateRFC(formData.obligatedSubjectKey, "moral");
		if (!rfcValidation.isValid) {
			setValidationErrors({ rfc: rfcValidation.error });
			toast.error("Por favor, corrija los errores en el formulario");
			return;
		}

		setValidationErrors({});
		setIsSaving(true);

		try {
			await executeMutation({
				mutation: async () => {
					const baseUrl = getAmlCoreBaseUrl();
					return fetchJson(`${baseUrl}/api/v1/organization-settings`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							obligatedSubjectKey: formData.obligatedSubjectKey.toUpperCase(),
							activityKey: formData.activityKey,
						}),
					});
				},
				loading: "Guardando configuración...",
				success: "Los datos de la organización se han guardado exitosamente.",
			});
		} catch {
			// Error is already handled by executeMutation via Sonner
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Configuración
						</h1>
						<p className="text-sm text-muted-foreground">
							Gestión de datos de la organización
						</p>
					</div>
				</div>
				<Card>
					<CardContent className="p-6">
						<div className="animate-pulse space-y-4">
							<div className="h-4 w-1/3 bg-muted rounded" />
							<div className="h-10 w-full bg-muted rounded" />
							<div className="h-4 w-1/3 bg-muted rounded" />
							<div className="h-10 w-full bg-muted rounded" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (hasNoOrganization) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Configuración
						</h1>
						<p className="text-sm text-muted-foreground">
							Gestión de datos de la organización
						</p>
					</div>
				</div>
				<Card>
					<CardContent className="p-8">
						<div className="flex flex-col items-center justify-center text-center space-y-4">
							<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
								<Building2 className="h-6 w-6 text-muted-foreground" />
							</div>
							<div className="space-y-2">
								<h3 className="text-lg font-medium">
									No hay organización activa
								</h3>
								<p className="text-sm text-muted-foreground max-w-sm">
									Debes seleccionar o crear una organización antes de poder
									configurar los datos de cumplimiento.
								</p>
							</div>
							<div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-lg">
								<AlertCircle className="h-4 w-4" />
								<span className="text-sm">
									Selecciona una organización desde el menú lateral
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-semibold text-foreground">
						Configuración
					</h1>
					<p className="text-sm text-muted-foreground">
						Gestión de datos de la organización
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Datos de la Organización</CardTitle>
						<CardDescription>
							Información requerida para la generación de reportes XML
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="organization-rfc"
									description={getFieldDescription("rfc")}
									required
								>
									RFC de la Organización
								</LabelWithInfo>
								<Input
									id="organization-rfc"
									value={formData.obligatedSubjectKey}
									onChange={(e) => {
										handleInputChange("obligatedSubjectKey", e.target.value);
										// Clear error when user starts typing
										if (validationErrors.rfc) {
											setValidationErrors((prev) => ({
												...prev,
												rfc: undefined,
											}));
										}
									}}
									placeholder="ABC850101AAA"
									className={`font-mono uppercase ${
										validationErrors.rfc ? "border-destructive" : ""
									}`}
									maxLength={12}
									required
								/>
								{validationErrors.rfc ? (
									<p className="text-xs text-destructive">
										{validationErrors.rfc}
									</p>
								) : (
									<p className="text-xs text-muted-foreground">
										12 caracteres para persona moral
									</p>
								)}
							</div>

							<div className="space-y-2">
								<LabelWithInfo
									htmlFor="vulnerable-activity"
									description={getFieldDescriptionByXmlTag("clave_actividad")}
									required
								>
									Actividad Vulnerable
								</LabelWithInfo>
								<Select
									value={formData.activityKey}
									onValueChange={(value) =>
										handleInputChange("activityKey", value)
									}
									disabled
									required
								>
									<SelectTrigger id="vulnerable-activity">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="VEH">VEH - Vehículos</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Actualmente solo se soporta la actividad de Vehículos
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-2">
					<Button type="submit" size="sm" className="gap-2" disabled={isSaving}>
						<Save className="h-4 w-4" />
						<span className="hidden sm:inline">
							{isSaving ? "Guardando..." : "Guardar Configuración"}
						</span>
					</Button>
				</div>
			</form>
		</div>
	);
}
