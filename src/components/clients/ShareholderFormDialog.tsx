"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Building2, User } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneInput } from "@/components/ui/phone-input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { CatalogItem } from "@/types/catalog";
import { validateRFC, validateCURP, validateRFCMatch } from "@/lib/utils";

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

	const [entityType, setEntityType] = useState<"PERSON" | "COMPANY">(
		shareholder?.entityType || "PERSON",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [parentShareholders, setParentShareholders] = useState<Shareholder[]>(
		[],
	);
	const [loadingParents, setLoadingParents] = useState(false);

	// Common fields
	const NO_PARENT = "__none__";
	const [parentShareholderId, setParentShareholderId] = useState<string>(
		shareholder?.parentShareholderId || NO_PARENT,
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
	const [taxIdError, setTaxIdError] = useState<string | undefined>();
	const [representativeCurpError, setRepresentativeCurpError] = useState<
		string | undefined
	>();
	const [representativeRfcError, setRepresentativeRfcError] = useState<
		string | undefined
	>();
	// Nationality for physical person
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

		setEntityType(shareholder?.entityType || "PERSON");
		setParentShareholderId(shareholder?.parentShareholderId || NO_PARENT);
		setOwnershipPercentage(shareholder?.ownershipPercentage?.toString() || "");
		setEmail(shareholder?.email || "");
		setPhone(shareholder?.phone || "");
		setFirstName(shareholder?.firstName || "");
		setLastName(shareholder?.lastName || "");
		setSecondLastName(shareholder?.secondLastName || "");
		setRfc(shareholder?.rfc || "");
		setRfcError(undefined);
		setTaxIdError(undefined);
		setRepresentativeCurpError(undefined);
		setRepresentativeRfcError(undefined);
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
				const rfcMatch = validateRFCMatch(rfc, "physical", {
					firstName,
					lastName,
					secondLastName,
				});
				if (!rfcMatch.isValid) {
					setRfcError(rfcMatch.error);
					return;
				}
			}
		} else {
			if (!businessName.trim()) {
				toast.error("Razón social es requerida");
				return;
			}
			if (taxId.trim()) {
				const taxIdValidation = validateRFC(taxId, "moral");
				if (!taxIdValidation.isValid) {
					setTaxIdError(taxIdValidation.error);
					return;
				}
				const taxIdMatch = validateRFCMatch(taxId, "moral", {
					incorporationDate: incorporationDate || undefined,
				});
				if (!taxIdMatch.isValid) {
					setTaxIdError(taxIdMatch.error);
					return;
				}
			}
			if (representativeCurp.trim()) {
				const curpValidation = validateCURP(representativeCurp);
				if (!curpValidation.isValid) {
					setRepresentativeCurpError(curpValidation.error);
					return;
				}
			}
			if (representativeRfc.trim()) {
				const repRfcValidation = validateRFC(representativeRfc, "physical");
				if (!repRfcValidation.isValid) {
					setRepresentativeRfcError(repRfcValidation.error);
					return;
				}
			}
		}

		try {
			setIsSubmitting(true);

			if (isEditMode) {
				const patchData: ShareholderPatchRequest = {
					entityType: shareholder.entityType,
				};

				const resolvedParentId =
					parentShareholderId === NO_PARENT ? null : parentShareholderId;
				if (resolvedParentId !== (shareholder.parentShareholderId || null)) {
					patchData.parentShareholderId = resolvedParentId;
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
					parentShareholderId:
						parentShareholderId === NO_PARENT ? null : parentShareholderId,
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl" fullscreenMobile>
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Editar Accionista" : "Agregar Accionista"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Actualiza la información del accionista"
							: "Registra una persona física o moral con participación accionaria"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					<DialogBody className="space-y-6">
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
										<SelectItem value={NO_PARENT}>
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
									Solo entidades morales pueden tener sub-accionistas (máximo 2
									niveles)
								</p>
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
										<Label htmlFor="secondLastName">Apellido Materno</Label>
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
													if (!result.isValid) {
														setRfcError(result.error);
													} else {
														const matchResult = validateRFCMatch(
															val,
															"physical",
															{ firstName, lastName, secondLastName },
														);
														setRfcError(
															matchResult.isValid
																? undefined
																: matchResult.error,
														);
													}
												} else {
													setRfcError(undefined);
												}
											}}
											placeholder="RFC"
											maxLength={13}
											className={rfcError ? "border-destructive" : ""}
										/>
										{rfcError && (
											<p className="text-xs text-destructive">{rfcError}</p>
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
											setPersonNationality(meta?.code || option?.id || "");
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
										<Label htmlFor="taxId">RFC / Tax ID *</Label>
										<Input
											id="taxId"
											value={taxId}
											onChange={(e) => {
												const val = e.target.value.toUpperCase();
												setTaxId(val);
												if (val.trim()) {
													const result = validateRFC(val, "moral");
													if (!result.isValid) {
														setTaxIdError(result.error);
													} else {
														const matchResult = validateRFCMatch(val, "moral", {
															incorporationDate: incorporationDate || undefined,
														});
														setTaxIdError(
															matchResult.isValid
																? undefined
																: matchResult.error,
														);
													}
												} else {
													setTaxIdError(undefined);
												}
											}}
											placeholder="RFC O TAX ID"
											maxLength={12}
											className={taxIdError ? "border-destructive" : ""}
										/>
										{taxIdError && (
											<p className="text-xs text-destructive">{taxIdError}</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="incorporationDate">
											Fecha de Constitución
										</Label>
										<Input
											id="incorporationDate"
											type="date"
											value={incorporationDate}
											onChange={(e) => setIncorporationDate(e.target.value)}
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
											setCompanyNationality(meta?.code || option?.id || "");
										}}
										getOptionValue={(option: CatalogItem) => {
											const meta = option.metadata as
												| { code?: string }
												| undefined;
											return meta?.code || option.id;
										}}
									/>
								</div>

								{/* Anexo 4: Representative Information */}
								<div className="border-t pt-4 space-y-4">
									<h4 className="text-sm font-medium">
										Representante Legal (Anexo 4)
									</h4>
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
												onChange={(e) => {
													const val = e.target.value.toUpperCase();
													setRepresentativeCurp(val);
													if (val.trim()) {
														const result = validateCURP(val);
														setRepresentativeCurpError(
															result.isValid ? undefined : result.error,
														);
													} else {
														setRepresentativeCurpError(undefined);
													}
												}}
												placeholder="CURP"
												maxLength={18}
												className={
													representativeCurpError ? "border-destructive" : ""
												}
											/>
											{representativeCurpError && (
												<p className="text-xs text-destructive">
													{representativeCurpError}
												</p>
											)}
										</div>
										<div className="space-y-2">
											<Label htmlFor="representativeRfc">RFC</Label>
											<Input
												id="representativeRfc"
												value={representativeRfc}
												onChange={(e) => {
													const val = e.target.value.toUpperCase();
													setRepresentativeRfc(val);
													if (val.trim()) {
														const result = validateRFC(val, "physical");
														setRepresentativeRfcError(
															result.isValid ? undefined : result.error,
														);
													} else {
														setRepresentativeRfcError(undefined);
													}
												}}
												placeholder="RFC"
												maxLength={13}
												className={
													representativeRfcError ? "border-destructive" : ""
												}
											/>
											{representativeRfcError && (
												<p className="text-xs text-destructive">
													{representativeRfcError}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Common Fields */}
						<div className="border-t pt-4 space-y-4">
							<h4 className="text-sm font-medium">Participación y Contacto</h4>
							<div className="space-y-4">
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
						</div>
					</DialogBody>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							{isEditMode ? "Actualizar" : "Crear"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
