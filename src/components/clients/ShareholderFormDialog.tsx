"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Loader2,
	Building2,
	User,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
	createShareholder,
	patchShareholder,
	listClientShareholders,
} from "@/lib/api/shareholders";
import type {
	Shareholder,
	ShareholderCreateRequest,
	ShareholderPatchRequest,
} from "@/types/shareholder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneInput } from "@/components/ui/phone-input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { CatalogItem } from "@/types/catalog";
import { validateRFC } from "@/lib/utils";
import {
	DialogWizardStepper,
	type DialogWizardStep,
} from "./wizard/DialogWizardStepper";

const SH_STEP_BASE: DialogWizardStep[] = [
	{ id: 1, title: "Identidad" },
	{ id: 2, title: "Representante" },
	{ id: 3, title: "Participación" },
];

interface ShareholderFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientId: string;
	shareholder?: Shareholder | null;
	onSave: () => void;
}

export function ShareholderFormDialog({
	open,
	onOpenChange,
	clientId,
	shareholder,
	onSave,
}: ShareholderFormDialogProps) {
	const isEditMode = !!shareholder;

	const [currentStep, setCurrentStep] = useState(1);
	const [entityType, setEntityType] = useState<"PERSON" | "COMPANY">(
		shareholder?.entityType || "PERSON",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [parentShareholders, setParentShareholders] = useState<Shareholder[]>(
		[],
	);
	const [loadingParents, setLoadingParents] = useState(false);

	// Common fields
	const [parentShareholderId, setParentShareholderId] = useState<string>(
		shareholder?.parentShareholderId || "",
	);
	const [ownershipPercentage, setOwnershipPercentage] = useState(
		shareholder?.ownershipPercentage?.toString() || "",
	);
	const [email, setEmail] = useState(shareholder?.email || "");
	const [phone, setPhone] = useState(shareholder?.phone || "");

	// PERSON fields
	const [firstName, setFirstName] = useState(shareholder?.firstName || "");
	const [lastName, setLastName] = useState(shareholder?.lastName || "");
	const [secondLastName, setSecondLastName] = useState(
		shareholder?.secondLastName || "",
	);
	const [rfc, setRfc] = useState(shareholder?.rfc || "");
	const [rfcError, setRfcError] = useState<string | undefined>();
	const [personNationality, setPersonNationality] = useState(
		shareholder?.entityType === "PERSON"
			? shareholder?.nationality || "MX"
			: "MX",
	);

	// COMPANY fields
	const [businessName, setBusinessName] = useState(
		shareholder?.businessName || "",
	);
	const [taxId, setTaxId] = useState(shareholder?.taxId || "");
	const [incorporationDate, setIncorporationDate] = useState(
		shareholder?.incorporationDate
			? new Date(shareholder.incorporationDate).toISOString().split("T")[0]
			: "",
	);
	const [companyNationality, setCompanyNationality] = useState(
		shareholder?.entityType === "COMPANY"
			? shareholder?.nationality || "MX"
			: "MX",
	);

	// COMPANY representative fields (Anexo 4)
	const [representativeName, setRepresentativeName] = useState(
		shareholder?.representativeName || "",
	);
	const [representativeCurp, setRepresentativeCurp] = useState(
		shareholder?.representativeCurp || "",
	);
	const [representativeRfc, setRepresentativeRfc] = useState(
		shareholder?.representativeRfc || "",
	);

	/* ── Wizard step config (Step 2 skipped for PERSON) ── */
	const isRepresentativeSkipped = entityType === "PERSON";

	const wizardSteps = useMemo<DialogWizardStep[]>(() => {
		return SH_STEP_BASE.map((s) =>
			s.id === 2 ? { ...s, skipped: isRepresentativeSkipped } : s,
		);
	}, [isRepresentativeSkipped]);

	const TOTAL_STEPS = SH_STEP_BASE.length;

	// Load available parent shareholders (only COMPANY type)
	useEffect(() => {
		if (!open) return;

		const loadParentOptions = async () => {
			try {
				setLoadingParents(true);
				const response = await listClientShareholders({ clientId });
				const companyParents = response.data.filter(
					(s) => s.entityType === "COMPANY" && s.id !== shareholder?.id,
				);
				setParentShareholders(companyParents);
			} catch (error) {
				console.error("Error loading parent shareholders:", error);
			} finally {
				setLoadingParents(false);
			}
		};

		loadParentOptions();
	}, [open, clientId, shareholder?.id]);

	// Reset form when dialog closes or shareholder changes
	useEffect(() => {
		if (!open) return;

		setCurrentStep(1);
		setEntityType(shareholder?.entityType || "PERSON");
		setParentShareholderId(shareholder?.parentShareholderId || "");
		setOwnershipPercentage(shareholder?.ownershipPercentage?.toString() || "");
		setEmail(shareholder?.email || "");
		setPhone(shareholder?.phone || "");
		setFirstName(shareholder?.firstName || "");
		setLastName(shareholder?.lastName || "");
		setSecondLastName(shareholder?.secondLastName || "");
		setRfc(shareholder?.rfc || "");
		setRfcError(undefined);
		setPersonNationality(
			shareholder?.entityType === "PERSON"
				? shareholder?.nationality || "MX"
				: "MX",
		);
		setBusinessName(shareholder?.businessName || "");
		setTaxId(shareholder?.taxId || "");
		setIncorporationDate(
			shareholder?.incorporationDate
				? new Date(shareholder.incorporationDate).toISOString().split("T")[0]
				: "",
		);
		setCompanyNationality(
			shareholder?.entityType === "COMPANY"
				? shareholder?.nationality || "MX"
				: "MX",
		);
		setRepresentativeName(shareholder?.representativeName || "");
		setRepresentativeCurp(shareholder?.representativeCurp || "");
		setRepresentativeRfc(shareholder?.representativeRfc || "");
	}, [open, shareholder]);

	/* ── Per-step validation ── */
	const validateStep = (step: number): boolean => {
		switch (step) {
			case 1:
				if (entityType === "PERSON") {
					if (!firstName.trim() || !lastName.trim()) {
						toast.error("Nombre y apellido son requeridos");
						return false;
					}
					if (rfc.trim()) {
						const rfcValidation = validateRFC(rfc, "physical");
						if (!rfcValidation.isValid) {
							setRfcError(rfcValidation.error);
							return false;
						}
					}
				} else {
					if (!businessName.trim()) {
						toast.error("Razón social es requerida");
						return false;
					}
				}
				return true;
			case 2:
				// Representative fields are optional
				return true;
			case 3: {
				const ownership = parseFloat(ownershipPercentage);
				if (isNaN(ownership) || ownership <= 0 || ownership > 100) {
					toast.error("La participación debe ser entre 0 y 100%");
					return false;
				}
				return true;
			}
			default:
				return true;
		}
	};

	const goNext = () => {
		if (!validateStep(currentStep)) return;
		let next = currentStep + 1;
		// Skip the representative step for PERSON entities
		if (next === 2 && isRepresentativeSkipped) {
			next = 3;
		}
		setCurrentStep(Math.min(next, TOTAL_STEPS));
	};

	const goBack = () => {
		let prev = currentStep - 1;
		// Skip the representative step for PERSON entities
		if (prev === 2 && isRepresentativeSkipped) {
			prev = 1;
		}
		setCurrentStep(Math.max(prev, 1));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const ownership = parseFloat(ownershipPercentage);
		if (isNaN(ownership) || ownership <= 0 || ownership > 100) {
			toast.error("La participación debe ser entre 0 y 100%");
			return;
		}

		if (entityType === "PERSON") {
			if (!firstName.trim() || !lastName.trim()) {
				toast.error("Nombre y apellido son requeridos");
				return;
			}
			if (rfc.trim()) {
				const rfcValidation = validateRFC(rfc, "physical");
				if (!rfcValidation.isValid) {
					setRfcError(rfcValidation.error);
					return;
				}
			}
		} else {
			if (!businessName.trim()) {
				toast.error("Razón social es requerida");
				return;
			}
		}

		try {
			setIsSubmitting(true);

			if (isEditMode) {
				const patchData: ShareholderPatchRequest = {};

				if (parentShareholderId !== (shareholder.parentShareholderId || "")) {
					patchData.parentShareholderId = parentShareholderId || null;
				}
				if (ownership !== shareholder.ownershipPercentage) {
					patchData.ownershipPercentage = ownership;
				}
				if (email !== (shareholder.email || "")) {
					patchData.email = email || null;
				}
				if (phone !== (shareholder.phone || "")) {
					patchData.phone = phone || null;
				}

				if (entityType === "PERSON") {
					if (firstName !== (shareholder.firstName || ""))
						patchData.firstName = firstName || null;
					if (lastName !== (shareholder.lastName || ""))
						patchData.lastName = lastName || null;
					if (secondLastName !== (shareholder.secondLastName || ""))
						patchData.secondLastName = secondLastName || null;
					if (rfc !== (shareholder.rfc || "")) patchData.rfc = rfc || null;
					if (personNationality !== (shareholder.nationality || ""))
						patchData.nationality = personNationality || null;
				} else {
					if (businessName !== (shareholder.businessName || ""))
						patchData.businessName = businessName || null;
					if (taxId !== (shareholder.taxId || ""))
						patchData.taxId = taxId || null;
					if (
						incorporationDate !==
						(shareholder.incorporationDate
							? new Date(shareholder.incorporationDate)
									.toISOString()
									.split("T")[0]
							: "")
					) {
						patchData.incorporationDate = incorporationDate || null;
					}
					if (companyNationality !== (shareholder.nationality || ""))
						patchData.nationality = companyNationality || null;
					if (representativeName !== (shareholder.representativeName || ""))
						patchData.representativeName = representativeName || null;
					if (representativeCurp !== (shareholder.representativeCurp || ""))
						patchData.representativeCurp = representativeCurp || null;
					if (representativeRfc !== (shareholder.representativeRfc || ""))
						patchData.representativeRfc = representativeRfc || null;
				}

				if (Object.keys(patchData).length === 0) {
					toast.info("No hay cambios para guardar");
					onOpenChange(false);
					return;
				}

				await patchShareholder({
					clientId,
					shareholderId: shareholder.id,
					input: patchData,
				});
				toast.success("Accionista actualizado");
			} else {
				const createData: ShareholderCreateRequest = {
					parentShareholderId: parentShareholderId || null,
					ownershipPercentage: ownership,
					email: email || null,
					phone: phone || null,
					entityType,
					...(entityType === "PERSON"
						? {
								firstName: firstName || null,
								lastName: lastName || null,
								secondLastName: secondLastName || null,
								rfc: rfc || null,
								nationality: personNationality || null,
							}
						: {
								businessName: businessName || null,
								taxId: taxId || null,
								incorporationDate: incorporationDate || null,
								nationality: companyNationality || null,
								representativeName: representativeName || null,
								representativeCurp: representativeCurp || null,
								representativeRfc: representativeRfc || null,
							}),
				};

				await createShareholder({ clientId, input: createData });
				toast.success("Accionista creado");
			}

			onSave();
			onOpenChange(false);
		} catch (error: any) {
			console.error("Error saving shareholder:", error);
			toast.error(error?.message || "Error al guardar accionista");
		} finally {
			setIsSubmitting(false);
		}
	};

	/* ── Step subtitles ── */
	const stepSubtitles: Record<number, string> = {
		1: entityType === "PERSON"
			? "Ingresa los datos de identificación de la persona física."
			: "Ingresa los datos de identificación de la persona moral.",
		2: "Datos del representante legal de la empresa (Anexo 4).",
		3: "Define el porcentaje de participación e información de contacto.",
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl" fullscreenMobile>
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Editar Accionista" : "Agregar Accionista"}
					</DialogTitle>
					<DialogDescription>
						{stepSubtitles[currentStep]}
					</DialogDescription>
				</DialogHeader>

				<DialogWizardStepper steps={wizardSteps} currentStep={currentStep} />

				<form
					onSubmit={handleSubmit}
					className="flex min-h-0 flex-1 flex-col"
				>
					<DialogBody className="space-y-5">
						{/* ── Step 1: Entity Type & Identity ── */}
						{currentStep === 1 && (
							<section className="space-y-5">
								{/* Entity Type Selection (only for create mode) */}
								{!isEditMode && (
									<div className="space-y-2">
										<Label>Tipo de Entidad *</Label>
										<Tabs
											value={entityType}
											onValueChange={(v) =>
												setEntityType(v as "PERSON" | "COMPANY")
											}
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="PERSON">
													<User className="h-4 w-4 mr-2" />
													Persona Física
												</TabsTrigger>
												<TabsTrigger value="COMPANY">
													<Building2 className="h-4 w-4 mr-2" />
													Persona Moral
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</div>
								)}

								{/* PERSON Fields */}
								{entityType === "PERSON" && (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="firstName">Nombre *</Label>
												<Input
													id="firstName"
													value={firstName}
													onChange={(e) =>
														setFirstName(e.target.value.toUpperCase())
													}
													placeholder="NOMBRE"
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="lastName">Apellido Paterno *</Label>
												<Input
													id="lastName"
													value={lastName}
													onChange={(e) =>
														setLastName(e.target.value.toUpperCase())
													}
													placeholder="APELLIDO PATERNO"
													required
												/>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="secondLastName">
													Apellido Materno
												</Label>
												<Input
													id="secondLastName"
													value={secondLastName}
													onChange={(e) =>
														setSecondLastName(e.target.value.toUpperCase())
													}
													placeholder="APELLIDO MATERNO"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="rfc">RFC</Label>
												<Input
													id="rfc"
													value={rfc}
													onChange={(e) => {
														const val = e.target.value.toUpperCase();
														setRfc(val);
														if (val.trim()) {
															const result = validateRFC(val, "physical");
															setRfcError(
																result.isValid ? undefined : result.error,
															);
														} else {
															setRfcError(undefined);
														}
													}}
													placeholder="RFC"
													maxLength={13}
													className={rfcError ? "border-destructive" : ""}
												/>
												{rfcError && (
													<p className="text-xs text-destructive">
														{rfcError}
													</p>
												)}
											</div>
										</div>
										<div className="space-y-2">
											<CatalogSelector
												catalogKey="countries"
												label="Nacionalidad"
												value={personNationality}
												onChange={(option: CatalogItem | null) => {
													const meta = option?.metadata as
														| { code?: string }
														| undefined;
													setPersonNationality(
														meta?.code || option?.id || "",
													);
												}}
												getOptionValue={(option: CatalogItem) => {
													const meta = option.metadata as
														| { code?: string }
														| undefined;
													return meta?.code || option.id;
												}}
											/>
										</div>
									</div>
								)}

								{/* COMPANY Fields */}
								{entityType === "COMPANY" && (
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="businessName">Razón Social *</Label>
											<Input
												id="businessName"
												value={businessName}
												onChange={(e) =>
													setBusinessName(e.target.value.toUpperCase())
												}
												placeholder="RAZÓN SOCIAL"
												required
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="taxId">RFC / Tax ID</Label>
												<Input
													id="taxId"
													value={taxId}
													onChange={(e) =>
														setTaxId(e.target.value.toUpperCase())
													}
													placeholder="RFC O TAX ID"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="incorporationDate">
													Fecha de Constitución
												</Label>
												<Input
													id="incorporationDate"
													type="date"
													value={incorporationDate}
													onChange={(e) =>
														setIncorporationDate(e.target.value)
													}
												/>
											</div>
										</div>
										<div className="space-y-2">
											<CatalogSelector
												catalogKey="countries"
												label="Basada en"
												value={companyNationality}
												onChange={(option: CatalogItem | null) => {
													const meta = option?.metadata as
														| { code?: string }
														| undefined;
													setCompanyNationality(
														meta?.code || option?.id || "",
													);
												}}
												getOptionValue={(option: CatalogItem) => {
													const meta = option.metadata as
														| { code?: string }
														| undefined;
													return meta?.code || option.id;
												}}
											/>
										</div>
									</div>
								)}
							</section>
						)}

						{/* ── Step 2: Representative (COMPANY only) ── */}
						{currentStep === 2 && entityType === "COMPANY" && (
							<section className="space-y-5">
								<p className="text-sm text-muted-foreground">
									Información del representante legal de la persona moral
									(Anexo 4). Estos campos son opcionales.
								</p>
								<div className="space-y-2">
									<Label htmlFor="representativeName">
										Nombre del Representante
									</Label>
									<Input
										id="representativeName"
										value={representativeName}
										onChange={(e) =>
											setRepresentativeName(e.target.value.toUpperCase())
										}
										placeholder="NOMBRE COMPLETO"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="representativeCurp">CURP</Label>
										<Input
											id="representativeCurp"
											value={representativeCurp}
											onChange={(e) =>
												setRepresentativeCurp(e.target.value.toUpperCase())
											}
											placeholder="CURP"
											maxLength={18}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="representativeRfc">RFC</Label>
										<Input
											id="representativeRfc"
											value={representativeRfc}
											onChange={(e) =>
												setRepresentativeRfc(e.target.value.toUpperCase())
											}
											placeholder="RFC"
											maxLength={13}
										/>
									</div>
								</div>
							</section>
						)}

						{/* ── Step 3: Participation & Contact ── */}
						{currentStep === 3 && (
							<section className="space-y-5">
								{/* Parent Shareholder (for sub-shareholders) */}
								{parentShareholders.length > 0 && (
									<div className="space-y-2">
										<Label>Accionista Padre (opcional)</Label>
										<Select
											value={parentShareholderId}
											onValueChange={setParentShareholderId}
										>
											<SelectTrigger>
												<SelectValue placeholder="Sin padre (accionista directo)" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">
													Sin padre (accionista directo)
												</SelectItem>
												{parentShareholders.map((parent) => (
													<SelectItem key={parent.id} value={parent.id}>
														{parent.businessName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											Solo entidades morales pueden tener sub-accionistas
											(máximo 2 niveles)
										</p>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="ownershipPercentage">
										Participación (%) *
									</Label>
									<Input
										id="ownershipPercentage"
										type="number"
										step="0.01"
										min="0"
										max="100"
										value={ownershipPercentage}
										onChange={(e) => setOwnershipPercentage(e.target.value)}
										placeholder="25.00"
										required
									/>
								</div>

								<hr className="border-border" />

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="email@example.com"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Teléfono</Label>
										<PhoneInput
											id="phone"
											value={phone}
											onChange={(value) => setPhone(value ?? "")}
											defaultCountry="MX"
										/>
									</div>
								</div>
							</section>
						)}
					</DialogBody>

					<DialogFooter>
						<div className="flex w-full items-center justify-between gap-2">
							{/* Left side */}
							<div>
								{currentStep > 1 ? (
									<Button
										type="button"
										variant="ghost"
										onClick={goBack}
										disabled={isSubmitting}
									>
										<ChevronLeft className="h-4 w-4 mr-1" />
										Atrás
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										onClick={() => onOpenChange(false)}
										disabled={isSubmitting}
									>
										Cancelar
									</Button>
								)}
							</div>

							{/* Right side */}
							<div className="flex items-center gap-2">
								{currentStep < TOTAL_STEPS ? (
									<>
										<span className="text-xs text-muted-foreground hidden sm:inline">
											Paso {currentStep} de {TOTAL_STEPS}
										</span>
										<Button
											type="button"
											onClick={goNext}
											disabled={isSubmitting}
										>
											Siguiente
											<ChevronRight className="h-4 w-4 ml-1" />
										</Button>
									</>
								) : (
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting && (
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										)}
										{isEditMode ? "Actualizar" : "Crear"}
									</Button>
								)}
							</div>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
