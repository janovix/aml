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
	Building2,
	User,
	Pencil,
	Trash2,
	Users,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
	listClientShareholders,
	deleteShareholder,
} from "@/lib/api/shareholders";
import type { Shareholder } from "@/types/shareholder";
import {
	getShareholderDisplayName,
	getEntityTypeLabel,
} from "@/types/shareholder";
import { Badge } from "@/components/ui/badge";
import { ShareholderFormDialog } from "./ShareholderFormDialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ShareholderSectionProps {
	clientId: string;
	personType: "physical" | "moral" | "trust";
	onShareholderChange?: () => void;
}

export function ShareholderSection({
	clientId,
	personType,
	onShareholderChange,
}: ShareholderSectionProps) {
	const [shareholders, setShareholders] = useState<Shareholder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingShareholder, setEditingShareholder] =
		useState<Shareholder | null>(null);
	const [subShareholdersMap, setSubShareholdersMap] = useState<
		Record<string, Shareholder[]>
	>({});
	const [expandedShareholders, setExpandedShareholders] = useState<Set<string>>(
		new Set(),
	);

	const loadShareholders = async () => {
		try {
			setIsLoading(true);
			const response = await listClientShareholders({ clientId });
			setShareholders(response.data);
		} catch (error) {
			console.error("Error loading shareholders:", error);
			toast.error("Error al cargar accionistas");
		} finally {
			setIsLoading(false);
		}
	};

	const loadSubShareholders = async (parentId: string) => {
		try {
			const response = await listClientShareholders({
				clientId,
				parentShareholderId: parentId,
			});
			setSubShareholdersMap((prev) => ({
				...prev,
				[parentId]: response.data,
			}));
		} catch (error) {
			console.error("Error loading sub-shareholders:", error);
			toast.error("Error al cargar sub-accionistas");
		}
	};

	const toggleExpanded = (shareholderId: string) => {
		setExpandedShareholders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(shareholderId)) {
				newSet.delete(shareholderId);
			} else {
				newSet.add(shareholderId);
				// Load sub-shareholders if not already loaded
				if (!subShareholdersMap[shareholderId]) {
					loadSubShareholders(shareholderId);
				}
			}
			return newSet;
		});
	};

	const handleOpenCreate = () => {
		setEditingShareholder(null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (shareholder: Shareholder) => {
		setEditingShareholder(shareholder);
		setDialogOpen(true);
	};

	const handleDialogSave = () => {
		loadShareholders();
		onShareholderChange?.();
	};

	useEffect(() => {
		if (personType !== "physical") {
			loadShareholders();
		} else {
			setIsLoading(false);
		}
	}, [clientId, personType]);

	const handleDelete = async (shareholderId: string) => {
		if (!confirm("¿Está seguro de eliminar este accionista?")) return;

		try {
			await deleteShareholder({ clientId, shareholderId });
			toast.success("Accionista eliminado");
			loadShareholders();
			onShareholderChange?.();
		} catch (error) {
			console.error("Error deleting shareholder:", error);
			toast.error("Error al eliminar accionista");
		}
	};

	if (personType === "physical") {
		return null;
	}

	const totalOwnership = shareholders.reduce(
		(sum, s) => sum + s.ownershipPercentage,
		0,
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Accionistas</CardTitle>
						<CardDescription>
							Personas físicas o morales con participación accionaria en la
							entidad. Soporta hasta 2 niveles de jerarquía.
						</CardDescription>
					</div>
					<Button size="sm" onClick={handleOpenCreate}>
						<Plus className="h-4 w-4 mr-2" />
						Agregar Accionista
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="text-center py-8 text-muted-foreground">
						Cargando accionistas...
					</div>
				) : shareholders.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
						<p>No hay accionistas registrados</p>
						<p className="text-sm mt-1">
							Los accionistas son requeridos para entidades morales y
							fideicomisos
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
							<span className="text-sm font-medium">Participación Total</span>
							<Badge variant={totalOwnership > 100 ? "destructive" : "default"}>
								{totalOwnership.toFixed(2)}%
							</Badge>
						</div>
						<div className="space-y-3">
							{shareholders.map((shareholder) => {
								const Icon =
									shareholder.entityType === "COMPANY" ? Building2 : User;
								const isCompany = shareholder.entityType === "COMPANY";
								const isExpanded = expandedShareholders.has(shareholder.id);
								const subShareholders =
									subShareholdersMap[shareholder.id] || [];

								return (
									<div key={shareholder.id}>
										<div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													{isCompany && (
														<button
															type="button"
															onClick={() => toggleExpanded(shareholder.id)}
															className="p-0.5 hover:bg-muted rounded"
														>
															{isExpanded ? (
																<ChevronDown className="h-4 w-4" />
															) : (
																<ChevronRight className="h-4 w-4" />
															)}
														</button>
													)}
													<Icon className="h-4 w-4 text-muted-foreground shrink-0" />
													<span className="font-medium truncate">
														{getShareholderDisplayName(shareholder)}
													</span>
													<Badge variant="outline" className="shrink-0">
														{getEntityTypeLabel(shareholder.entityType)}
													</Badge>
												</div>
												<div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
													<span>
														Participación: {shareholder.ownershipPercentage}%
													</span>
													{shareholder.rfc && (
														<span>• RFC: {shareholder.rfc}</span>
													)}
													{shareholder.taxId && (
														<span>• Tax ID: {shareholder.taxId}</span>
													)}
												</div>
											</div>
											<div className="flex gap-2 ml-4">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleOpenEdit(shareholder)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDelete(shareholder.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										{/* Sub-shareholders (only for COMPANY type) */}
										{isCompany && isExpanded && (
											<div className="ml-8 mt-2 space-y-2">
												{subShareholders.length > 0 ? (
													subShareholders.map((subShareholder) => {
														const SubIcon =
															subShareholder.entityType === "COMPANY"
																? Building2
																: User;
														return (
															<div
																key={subShareholder.id}
																className="flex items-center justify-between p-2 border rounded bg-muted/20"
															>
																<div className="min-w-0 flex-1">
																	<div className="flex items-center gap-2">
																		<SubIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
																		<span className="text-sm font-medium truncate">
																			{getShareholderDisplayName(
																				subShareholder,
																			)}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs shrink-0"
																		>
																			{getEntityTypeLabel(
																				subShareholder.entityType,
																			)}
																		</Badge>
																	</div>
																	<div className="text-xs text-muted-foreground mt-0.5">
																		Participación:{" "}
																		{subShareholder.ownershipPercentage}%
																	</div>
																</div>
																<div className="flex gap-1 ml-2">
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			handleOpenEdit(subShareholder)
																		}
																	>
																		<Pencil className="h-3.5 w-3.5" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			handleDelete(subShareholder.id)
																		}
																	>
																		<Trash2 className="h-3.5 w-3.5" />
																	</Button>
																</div>
															</div>
														);
													})
												) : (
													<div className="text-xs text-muted-foreground italic p-2">
														Sin sub-accionistas
													</div>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>

			<ShareholderFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				clientId={clientId}
				shareholder={editingShareholder}
				onSave={handleDialogSave}
			/>
		</Card>
	);
}
