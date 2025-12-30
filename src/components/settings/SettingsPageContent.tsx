"use client";

import type React from "react";
import { useState } from "react";
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
import { Save } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import {
	getFieldDescription,
	getFieldDescriptionByXmlTag,
} from "../../lib/field-descriptions";

interface OrganizationData {
	organizationRfc: string;
	vulnerableActivity: string;
}

export function SettingsPageContent(): React.JSX.Element {
	const { toast } = useToast();
	const [isSaving, setIsSaving] = useState(false);
	const [formData, setFormData] = useState<OrganizationData>({
		organizationRfc: "",
		vulnerableActivity: "VEH",
	});

	const handleInputChange = (
		field: keyof OrganizationData,
		value: string,
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setIsSaving(true);

		try {
			// TODO: Implement API call to save organization settings
			// await saveOrganizationSettings({ input: formData });

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500));

			toast({
				title: "Configuración guardada",
				description:
					"Los datos de la organización se han guardado exitosamente.",
			});
		} catch (error) {
			console.error("Error saving organization settings:", error);
			toast({
				title: "Error",
				description: "No se pudo guardar la configuración.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

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
									value={formData.organizationRfc}
									onChange={(e) =>
										handleInputChange("organizationRfc", e.target.value)
									}
									placeholder="ABC850101AAA"
									className="font-mono uppercase"
									maxLength={12}
									required
								/>
								<p className="text-xs text-muted-foreground">
									12 caracteres para persona moral
								</p>
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
									value={formData.vulnerableActivity}
									onValueChange={(value) =>
										handleInputChange("vulnerableActivity", value)
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
