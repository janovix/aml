"use client";

import * as React from "react";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2, Link2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { useJwt } from "@/hooks/useJwt";
import {
	updateSelfServiceSettings,
	type SelfServiceMode,
	type OrganizationSettingsEntity,
} from "@/lib/api/organization-settings";
import { cn } from "@/lib/utils";

interface KycSelfServiceSettingsCardProps {
	settings: OrganizationSettingsEntity;
	onUpdate: (updated: OrganizationSettingsEntity) => void;
	className?: string;
}

const MODE_LABELS: Record<SelfServiceMode, string> = {
	disabled: "Deshabilitado",
	manual: "Manual (solo generación de enlace)",
	automatic: "Automático (envío por correo al crear cliente)",
};

const MODE_DESCRIPTIONS: Record<SelfServiceMode, string> = {
	disabled:
		"No se generarán enlaces de autoservicio KYC. Los clientes no podrán completar su identificación de forma remota.",
	manual:
		"Los enlaces KYC se pueden generar manualmente desde la ficha del cliente. El enlace no se envía automáticamente.",
	automatic:
		"Al crear un cliente con correo electrónico, se genera y envía automáticamente un enlace KYC. También se activa cuando se cruzan umbrales de identificación (Art. 17 LFPIORPI).",
};

export function KycSelfServiceSettingsCard({
	settings,
	onUpdate,
	className,
}: KycSelfServiceSettingsCardProps) {
	const { jwt } = useJwt();
	const [mode, setMode] = useState<SelfServiceMode>(
		settings.selfServiceMode ?? "disabled",
	);
	const [expiryHours, setExpiryHours] = useState(
		settings.selfServiceExpiryHours ?? 72,
	);
	const [isSaving, setIsSaving] = useState(false);
	const isDirty =
		mode !== (settings.selfServiceMode ?? "disabled") ||
		expiryHours !== (settings.selfServiceExpiryHours ?? 72);

	async function handleSave() {
		if (!jwt || !isDirty) return;
		setIsSaving(true);
		try {
			const updated = await updateSelfServiceSettings({
				input: {
					selfServiceMode: mode,
					selfServiceExpiryHours: expiryHours,
				},
				jwt,
			});
			onUpdate(updated);
			toast.success("Configuración de autoservicio guardada");
		} catch {
			toast.error("Error al guardar la configuración de autoservicio");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Card className={cn(className)}>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2">
							<Link2 className="h-5 w-5" />
							KYC Autoservicio
						</CardTitle>
						<CardDescription>
							Configura cómo los clientes pueden completar su identificación de
							forma remota. Cumplimiento con Art. 18-I LFPIORPI (verificación
							directa por oficial de cumplimiento).
						</CardDescription>
					</div>
					<Badge
						variant={
							mode === "disabled"
								? "secondary"
								: mode === "automatic"
									? "default"
									: "outline"
						}
					>
						{MODE_LABELS[mode]}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* Mode selector */}
				<div className="space-y-2">
					<Label htmlFor="self-service-mode">Modo de autoservicio</Label>
					<Select
						value={mode}
						onValueChange={(v) => setMode(v as SelfServiceMode)}
					>
						<SelectTrigger id="self-service-mode">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="disabled">Deshabilitado</SelectItem>
							<SelectItem value="manual">Manual</SelectItem>
							<SelectItem value="automatic">Automático</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-xs text-muted-foreground">
						{MODE_DESCRIPTIONS[mode]}
					</p>
				</div>

				{/* Expiry hours */}
				{mode !== "disabled" && (
					<div className="space-y-2">
						<Label htmlFor="expiry-hours">Validez del enlace (horas)</Label>
						<div className="flex items-center gap-3">
							<Input
								id="expiry-hours"
								type="number"
								min={1}
								max={720}
								value={expiryHours}
								onChange={(e) => setExpiryHours(Number(e.target.value))}
								className="w-28"
							/>
							<span className="text-sm text-muted-foreground">
								≈{" "}
								{expiryHours >= 24
									? `${Math.round(expiryHours / 24)} día${Math.round(expiryHours / 24) !== 1 ? "s" : ""}`
									: `${expiryHours} hora${expiryHours !== 1 ? "s" : ""}`}
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							El enlace KYC expirará automáticamente después de este tiempo.
							Máximo: 720 horas (30 días).
						</p>
					</div>
				)}

				{/* Compliance notice */}
				<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
					<Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
					<p className="text-xs text-amber-700 dark:text-amber-300">
						El autoservicio KYC requiere revisión y aprobación manual por el
						oficial de cumplimiento antes de considerar al cliente identificado
						(Art. 18-I LFPIORPI — <em>"de manera directa"</em>). Toda sesión
						queda registrada en la bitácora de auditoría (Art. 18-IV).
					</p>
				</div>

				{/* Save button */}
				<div className="flex justify-end">
					<Button
						onClick={handleSave}
						disabled={!isDirty || isSaving || !jwt}
						size="sm"
					>
						{isSaving ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Save className="mr-2 h-4 w-4" />
						)}
						Guardar cambios
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
