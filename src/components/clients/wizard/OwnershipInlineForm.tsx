"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Trash2,
	Building2,
	User,
	Users,
	ShieldAlert,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ShareholderFormDialog } from "../ShareholderFormDialog";
import { BeneficialControllerFormDialog } from "../BeneficialControllerFormDialog";
import { deleteShareholder } from "@/lib/api/shareholders";
import { deleteBeneficialController } from "@/lib/api/beneficial-controllers";
import type { Shareholder } from "@/types/shareholder";
import type { BeneficialController } from "@/types/beneficial-controller";
import {
	getShareholderDisplayName,
	getEntityTypeLabel,
} from "@/types/shareholder";
import {
	getBCDisplayName,
	getBCTypeLabel,
} from "@/types/beneficial-controller";

export interface ShareholderWithDocuments extends Shareholder {
	// Additional document fields can be added here if needed
}

export interface BCWithDocuments extends BeneficialController {
	// Additional document fields can be added here if needed
}

interface OwnershipInlineFormProps {
	clientId: string;
	shareholders: ShareholderWithDocuments[];
	beneficialControllers: BCWithDocuments[];
	onShareholdersChange: (shareholders: ShareholderWithDocuments[]) => void;
	onBCsChange: (bcs: BCWithDocuments[]) => void;
}

export function OwnershipInlineForm({
	clientId,
	shareholders,
	beneficialControllers,
	onShareholdersChange,
	onBCsChange,
}: OwnershipInlineFormProps) {
	const [shareholderDialogOpen, setShareholderDialogOpen] = useState(false);
	const [bcDialogOpen, setBcDialogOpen] = useState(false);

	const handleShareholderSave = () => {
		// Trigger refresh in parent - parent will reload shareholders
		onShareholdersChange([...shareholders]);
	};

	const handleBCSave = () => {
		// Trigger refresh in parent - parent will reload BCs
		onBCsChange([...beneficialControllers]);
	};

	const handleDeleteShareholder = async (shareholderId: string) => {
		if (!confirm("¿Está seguro de eliminar este accionista?")) return;

		try {
			await deleteShareholder({ clientId, shareholderId });
			toast.success("Accionista eliminado");
			onShareholdersChange(shareholders.filter((s) => s.id !== shareholderId));
		} catch (error) {
			console.error("Error deleting shareholder:", error);
			toast.error("Error al eliminar accionista");
		}
	};

	const handleDeleteBC = async (bcId: string) => {
		if (!confirm("¿Está seguro de eliminar este beneficiario controlador?"))
			return;

		try {
			await deleteBeneficialController({ clientId, bcId });
			toast.success("Beneficiario controlador eliminado");
			onBCsChange(beneficialControllers.filter((bc) => bc.id !== bcId));
		} catch (error) {
			console.error("Error deleting beneficial controller:", error);
			toast.error("Error al eliminar beneficiario controlador");
		}
	};

	const totalOwnership = shareholders.reduce(
		(sum, s) => sum + s.ownershipPercentage,
		0,
	);

	return (
		<div className="space-y-6">
			{/* Shareholders Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-base flex items-center gap-2">
							<Building2 className="h-4 w-4" />
							Accionistas
						</CardTitle>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setShareholderDialogOpen(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							Agregar
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{shareholders.length > 0 ? (
						<div className="space-y-3">
							<div className="flex items-center justify-between p-2 bg-muted/30 rounded">
								<span className="text-sm font-medium">Participación Total</span>
								<Badge
									variant={totalOwnership > 100 ? "destructive" : "default"}
								>
									{totalOwnership.toFixed(2)}%
								</Badge>
							</div>
							{shareholders.map((shareholder) => {
								const Icon =
									shareholder.entityType === "COMPANY" ? Building2 : User;
								return (
									<div
										key={shareholder.id}
										className="flex items-center justify-between p-3 border rounded bg-muted/20"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<Icon className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm font-medium">
													{getShareholderDisplayName(shareholder)}
												</span>
												<Badge variant="outline" className="text-xs">
													{getEntityTypeLabel(shareholder.entityType)}
												</Badge>
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												{shareholder.ownershipPercentage}% de participación
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteShareholder(shareholder.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground">
							<Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay accionistas registrados</p>
							<p className="text-xs mt-1">Se requiere al menos un accionista</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Beneficial Controllers Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-base flex items-center gap-2">
							<Users className="h-4 w-4" />
							Beneficiarios Controladores
						</CardTitle>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setBcDialogOpen(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							Agregar
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{beneficialControllers.length > 0 ? (
						<div className="space-y-3">
							{beneficialControllers.map((bc) => (
								<div
									key={bc.id}
									className="flex items-center justify-between p-3 border rounded bg-muted/20"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">
												{getBCDisplayName(bc)}
											</span>
											<Badge variant="outline" className="text-xs">
												{getBCTypeLabel(bc.bcType)}
											</Badge>
											{bc.isLegalRepresentative && (
												<Badge variant="secondary" className="text-xs">
													Rep. Legal
												</Badge>
											)}
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											{bc.curp && `CURP: ${bc.curp}`}
											{bc.rfc && ` • RFC: ${bc.rfc}`}
										</div>
										{bc.screeningResult === "pending" && (
											<div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
												<AlertCircle className="h-3 w-3" />
												<span>Screening pendiente</span>
											</div>
										)}
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDeleteBC(bc.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-6 text-muted-foreground">
							<Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
							<p className="text-sm">
								No hay beneficiarios controladores registrados
							</p>
							<p className="text-xs mt-1">
								Se requiere al menos un beneficiario controlador
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<ShareholderFormDialog
				open={shareholderDialogOpen}
				onOpenChange={setShareholderDialogOpen}
				clientId={clientId}
				shareholder={null}
				onSave={handleShareholderSave}
			/>

			<BeneficialControllerFormDialog
				open={bcDialogOpen}
				onOpenChange={setBcDialogOpen}
				clientId={clientId}
				beneficialController={null}
				onSave={handleBCSave}
			/>
		</div>
	);
}
