"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Plus,
	User,
	Pencil,
	Trash2,
	ShieldAlert,
	ShieldQuestion,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
	listClientBeneficialControllers,
	deleteBeneficialController,
} from "@/lib/api/beneficial-controllers";
import { listClientShareholders } from "@/lib/api/shareholders";
import type { BeneficialController } from "@/types/beneficial-controller";
import type { Shareholder } from "@/types/shareholder";
import {
	getBCDisplayName,
	getBCTypeLabel,
	getIdentificationCriteriaLabel,
} from "@/types/beneficial-controller";
import { getShareholderDisplayName } from "@/types/shareholder";
import { Badge } from "@/components/ui/badge";
import { BeneficialControllerFormDialog } from "./BeneficialControllerFormDialog";
import { getSuggestedBCsFromShareholders } from "@/lib/bc-determination";

interface BeneficialControllerSectionProps {
	clientId: string;
	personType: "physical" | "moral" | "trust";
	onBCChange?: () => void;
}

export function BeneficialControllerSection({
	clientId,
	personType,
	onBCChange,
}: BeneficialControllerSectionProps) {
	const [bcs, setBCs] = useState<BeneficialController[]>([]);
	const [shareholders, setShareholders] = useState<Shareholder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingBC, setEditingBC] = useState<BeneficialController | null>(null);
	const [suggestedShareholder, setSuggestedShareholder] =
		useState<Shareholder | null>(null);

	const loadBCs = async () => {
		try {
			const response = await listClientBeneficialControllers({ clientId });
			setBCs(response.data);
		} catch (error) {
			console.error("Error loading beneficial controllers:", error);
			toast.error("Error al cargar beneficiarios controladores");
		}
	};

	const loadShareholders = async () => {
		try {
			const response = await listClientShareholders({ clientId });
			setShareholders(response.data);
		} catch (error) {
			console.error("Error loading shareholders:", error);
		}
	};

	const loadAll = async () => {
		if (personType === "physical") {
			setIsLoading(false);
			return;
		}
		try {
			setIsLoading(true);
			await Promise.all([loadBCs(), loadShareholders()]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, [clientId, personType]);

	const suggestedBCs = getSuggestedBCsFromShareholders(shareholders, bcs);

	const handleDelete = async (bcId: string) => {
		if (!confirm("¿Está seguro de eliminar este beneficiario controlador?"))
			return;

		try {
			await deleteBeneficialController({ clientId, bcId });
			toast.success("Beneficiario controlador eliminado");
			loadBCs();
			onBCChange?.();
		} catch (error) {
			console.error("Error deleting beneficial controller:", error);
			toast.error("Error al eliminar beneficiario controlador");
		}
	};

	const handleOpenCreate = (fromShareholder?: Shareholder) => {
		setEditingBC(null);
		setSuggestedShareholder(fromShareholder ?? null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (bc: BeneficialController) => {
		setEditingBC(bc);
		setSuggestedShareholder(null);
		setDialogOpen(true);
	};

	const handleDialogSave = () => {
		loadBCs();
		onBCChange?.();
	};

	if (personType === "physical") {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Beneficiarios Controladores</CardTitle>
						<CardDescription>
							Personas físicas que obtienen el beneficio o ejercen control sobre
							la entidad, conforme a la LFPIORPI y el CFF Art. 32-B. Documentos
							con reconocimiento oficial (Art. 18-III LFPIORPI).
						</CardDescription>
					</div>
					<Button
						size="sm"
						className="w-full sm:w-auto shrink-0"
						onClick={() => handleOpenCreate()}
					>
						<Plus className="h-4 w-4 mr-2" />
						Agregar Beneficiario Controlador
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="text-center py-8 text-muted-foreground">
						Cargando beneficiarios controladores...
					</div>
				) : (
					<div className="space-y-3">
						{/* Suggested BCs from shareholders >=25% (Art. 3-III-b-ii) — show even when no BCs yet */}
						{suggestedBCs.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">
									Sugeridos (accionistas con ≥25% sin BC registrado)
								</p>
								{suggestedBCs.map(({ shareholder, ruleLabel }) => (
									<div
										key={shareholder.id}
										className="flex items-center justify-between p-3 border rounded-lg border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
									>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<User className="h-4 w-4 text-muted-foreground shrink-0" />
												<span className="font-medium truncate">
													{getShareholderDisplayName(shareholder)}
												</span>
												<Badge
													variant="secondary"
													className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
												>
													Sugerido
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												{ruleLabel}
											</p>
											<p className="text-xs text-muted-foreground">
												Participación: {shareholder.ownershipPercentage}%
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="shrink-0 ml-2"
											onClick={() => handleOpenCreate(shareholder)}
										>
											<Plus className="h-4 w-4 mr-1" />
											Agregar como BC
										</Button>
									</div>
								))}
							</div>
						)}
						{bcs.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								<User className="h-12 w-12 mx-auto mb-3 opacity-50" />
								<p>No hay beneficiarios controladores registrados</p>
								<p className="text-sm mt-1">
									Los beneficiarios controladores son requeridos para entidades
									morales y fideicomisos
								</p>
							</div>
						)}
						{bcs.length > 0 && (
							<div
								className={cn(suggestedBCs.length > 0 && "border-t pt-3 mt-3")}
							>
								<p className="text-sm font-medium text-muted-foreground mb-2">
									Registrados
								</p>
							</div>
						)}
						{bcs.map((bc) => {
							const PEPIcon = bc.isPEP ? ShieldAlert : ShieldQuestion;
							const pepColor = bc.isPEP ? "text-red-500" : "text-gray-500";
							const hasScreening =
								bc.screeningResult && bc.screeningResult !== "pending";

							return (
								<div
									key={bc.id}
									className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
								>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-medium truncate">
												{getBCDisplayName(bc)}
											</span>
											<Badge variant="outline" className="shrink-0">
												{getBCTypeLabel(bc.bcType)}
											</Badge>
											{bc.isLegalRepresentative && (
												<Badge variant="secondary" className="shrink-0">
													Rep. Legal
												</Badge>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-sm text-muted-foreground">
											<span>
												{getIdentificationCriteriaLabel(
													bc.identificationCriteria,
												)}
											</span>
											{bc.curp && <span>• CURP: {bc.curp}</span>}
											{bc.rfc && <span>• RFC: {bc.rfc}</span>}
										</div>
										{hasScreening && (
											<div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
												<PEPIcon className={`h-3.5 w-3.5 ${pepColor}`} />
												<span className={pepColor}>
													{bc.isPEP ? "PEP Detectado" : "No PEP"}
												</span>
												{bc.ofacSanctioned && (
													<Badge variant="destructive" className="text-xs">
														OFAC
													</Badge>
												)}
												{bc.unscSanctioned && (
													<Badge variant="destructive" className="text-xs">
														UNSC
													</Badge>
												)}
												{bc.sat69bListed && (
													<Badge variant="destructive" className="text-xs">
														SAT 69-B
													</Badge>
												)}
												{bc.adverseMediaFlagged && (
													<Badge variant="destructive" className="text-xs">
														Media Adversa
													</Badge>
												)}
											</div>
										)}
										{!hasScreening && bc.screeningResult === "pending" && (
											<div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
												<AlertCircle className="h-3.5 w-3.5" />
												<span>Screening pendiente</span>
											</div>
										)}
									</div>
									<div className="flex gap-2 ml-2 sm:ml-4 shrink-0">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleOpenEdit(bc)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(bc.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>

			<BeneficialControllerFormDialog
				open={dialogOpen}
				onOpenChange={(open) => {
					setDialogOpen(open);
					if (!open) setSuggestedShareholder(null);
				}}
				clientId={clientId}
				beneficialController={editingBC}
				suggestedShareholder={suggestedShareholder}
				onSave={handleDialogSave}
			/>
		</Card>
	);
}
