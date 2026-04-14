"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tags, User, CreditCard, Mail, MapPin, StickyNote } from "lucide-react";
import { toast } from "sonner";
import {
	createBeneficialController,
	patchBeneficialController,
} from "@/lib/api/beneficial-controllers";
import { listClientShareholders } from "@/lib/api/shareholders";
import type {
	BeneficialController,
	BeneficialControllerCreateRequest,
	BeneficialControllerPatchRequest,
	BCType,
	IdentificationCriteria,
	IdDocumentType,
} from "@/types/beneficial-controller";
import type { Shareholder } from "@/types/shareholder";
import { ZipCodeAddressFields } from "./ZipCodeAddressFields";
import { PhoneInput } from "@/components/ui/phone-input";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import type { CatalogItem } from "@/types/catalog";
import {
	IDDocumentSelector,
	type IDDocumentData,
	type IDType,
} from "./wizard/IDDocumentSelector";
import { uploadDocumentForKYC } from "@/lib/api/file-upload";
import { useOrgStore } from "@/lib/org-store";

interface BeneficialControllerFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientId: string;
	beneficialController?: BeneficialController | null;
	suggestedShareholder?: Shareholder | null;
	onSave: () => void;
}

export function BeneficialControllerFormDialog({
	open,
	onOpenChange,
	clientId,
	beneficialController,
	suggestedShareholder,
	onSave,
}: BeneficialControllerFormDialogProps) {
	const isEditMode = !!beneficialController;

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [shareholders, setShareholders] = useState<Shareholder[]>([]);

	// BC Classification
	const [bcType, setBcType] = useState<BCType>(
		beneficialController?.bcType || "SHAREHOLDER",
	);
	const [identificationCriteria, setIdentificationCriteria] =
		useState<IdentificationCriteria>(
			beneficialController?.identificationCriteria || "BENEFIT",
		);
	const [isLegalRepresentative, setIsLegalRepresentative] = useState(
		beneficialController?.isLegalRepresentative || false,
	);
	const [controlMechanism, setControlMechanism] = useState(
		beneficialController?.controlMechanism || "",
	);
	const [shareholderId, setShareholderId] = useState(
		beneficialController?.shareholderId || "",
	);

	// Personal Data (Anexo 3)
	const [firstName, setFirstName] = useState(
		beneficialController?.firstName || "",
	);
	const [lastName, setLastName] = useState(
		beneficialController?.lastName || "",
	);
	const [secondLastName, setSecondLastName] = useState(
		beneficialController?.secondLastName || "",
	);
	const [birthDate, setBirthDate] = useState(
		beneficialController?.birthDate
			? new Date(beneficialController.birthDate).toISOString().split("T")[0]
			: "",
	);
	const [nationality, setNationality] = useState(
		beneficialController?.nationality || "",
	);
	const [occupation, setOccupation] = useState(
		beneficialController?.occupation || "",
	);
	const [curp, setCurp] = useState(beneficialController?.curp || "");
	const [rfc, setRfc] = useState(beneficialController?.rfc || "");

	// ID Document (Anexo 3) — uses the reusable IDDocumentSelector
	const [idDocumentData, setIdDocumentData] = useState<IDDocumentData | null>(
		() => {
			if (!beneficialController?.idDocumentType) return null;
			const idType: IDType =
				beneficialController.idDocumentType === "PASSPORT"
					? "PASSPORT"
					: "NATIONAL_ID";
			return {
				idType,
				documentType: idType,
				documentNumber: beneficialController.idDocumentNumber || "",
				isUploaded: !!beneficialController.idCopyDocId,
				isUploading: false,
			};
		},
	);
	const [idDocumentAuthority, setIdDocumentAuthority] = useState(
		beneficialController?.idDocumentAuthority || "",
	);
	const [idCopyDocId, setIdCopyDocId] = useState(
		beneficialController?.idCopyDocId || "",
	);

	// Contact
	const [email, setEmail] = useState(beneficialController?.email || "");
	const [phone, setPhone] = useState(beneficialController?.phone || "");

	// Address
	const [postalCode, setPostalCode] = useState(
		beneficialController?.postalCode || "",
	);
	const [stateCode, setStateCode] = useState(
		beneficialController?.stateCode || "",
	);
	const [city, setCity] = useState(beneficialController?.city || "");
	const [municipality, setMunicipality] = useState("");
	const [neighborhood, setNeighborhood] = useState("");
	const [street, setStreet] = useState(beneficialController?.street || "");

	// Notes
	const [notes, setNotes] = useState(beneficialController?.notes || "");

	// Load shareholders for linking
	useEffect(() => {
		if (!open) return;
		const loadShareholders = async () => {
			try {
				const response = await listClientShareholders({ clientId });
				setShareholders(response.data);
			} catch (error) {
				console.error("Error loading shareholders:", error);
			}
		};
		loadShareholders();
	}, [open, clientId]);

	// Pre-fill from suggested shareholder (Art. 3-III-b-ii: ≥25% → BC)
	useEffect(() => {
		if (!open || !suggestedShareholder || beneficialController) return;
		if (suggestedShareholder.entityType !== "PERSON") return;
		setBcType("SHAREHOLDER");
		setIdentificationCriteria("CONTROL");
		setShareholderId(suggestedShareholder.id);
		setFirstName(suggestedShareholder.firstName ?? "");
		setLastName(suggestedShareholder.lastName ?? "");
		setSecondLastName(suggestedShareholder.secondLastName ?? "");
		setRfc(suggestedShareholder.rfc ?? "");
	}, [open, suggestedShareholder, beneficialController]);

	// Reset form when dialog opens or BC changes (skip when prefill from suggestedShareholder applies)
	useEffect(() => {
		if (!open) return;
		if (suggestedShareholder && !beneficialController) return;

		setBcType(beneficialController?.bcType || "SHAREHOLDER");
		setIdentificationCriteria(
			beneficialController?.identificationCriteria || "BENEFIT",
		);
		setIsLegalRepresentative(
			beneficialController?.isLegalRepresentative || false,
		);
		setControlMechanism(beneficialController?.controlMechanism || "");
		setShareholderId(beneficialController?.shareholderId || "");
		setFirstName(beneficialController?.firstName || "");
		setLastName(beneficialController?.lastName || "");
		setSecondLastName(beneficialController?.secondLastName || "");
		setBirthDate(
			beneficialController?.birthDate
				? new Date(beneficialController.birthDate).toISOString().split("T")[0]
				: "",
		);
		setNationality(beneficialController?.nationality || "");
		setOccupation(beneficialController?.occupation || "");
		setCurp(beneficialController?.curp || "");
		setRfc(beneficialController?.rfc || "");
		if (beneficialController?.idDocumentType) {
			const idType: IDType =
				beneficialController.idDocumentType === "PASSPORT"
					? "PASSPORT"
					: "NATIONAL_ID";
			setIdDocumentData({
				idType,
				documentType: idType,
				documentNumber: beneficialController.idDocumentNumber || "",
				isUploaded: !!beneficialController.idCopyDocId,
				isUploading: false,
			});
		} else {
			setIdDocumentData(null);
		}
		setIdDocumentAuthority(beneficialController?.idDocumentAuthority || "");
		setIdCopyDocId(beneficialController?.idCopyDocId || "");
		setEmail(beneficialController?.email || "");
		setPhone(beneficialController?.phone || "");
		setPostalCode(beneficialController?.postalCode || "");
		setStateCode(beneficialController?.stateCode || "");
		setCity(beneficialController?.city || "");
		setMunicipality("");
		setNeighborhood("");
		setStreet(beneficialController?.street || "");
		setNotes(beneficialController?.notes || "");
	}, [open, beneficialController, suggestedShareholder]);

	const handleIdDocUpload = useCallback(async (data: IDDocumentData) => {
		const { currentOrg, currentUserId } = useOrgStore.getState();
		if (!currentOrg?.id) {
			toast.error("No se pudo obtener la organización actual");
			throw new Error("Organization ID not available");
		}

		const relatedFiles: Array<{ file: Blob; name: string; type: string }> = [];

		if (data.rasterizedImages && data.rasterizedImages.length > 0) {
			data.rasterizedImages.forEach((blob, idx) => {
				relatedFiles.push({
					file: blob,
					name: `rasterized_page_${idx + 1}.jpg`,
					type: `rasterized_page_${idx + 1}`,
				});
			});
		}
		if (data.ineFrontBlob) {
			relatedFiles.push({
				file: data.ineFrontBlob,
				name: "ine_front.jpg",
				type: "ine_front",
			});
		}
		if (data.ineBackBlob) {
			relatedFiles.push({
				file: data.ineBackBlob,
				name: "ine_back.jpg",
				type: "ine_back",
			});
		}

		const primaryFile = data.processedBlob ?? data.file;
		if (!primaryFile) {
			toast.error("No se encontró el archivo de identificación");
			throw new Error("No primary file available");
		}

		const uploadResult = await uploadDocumentForKYC({
			organizationId: currentOrg.id,
			userId: currentUserId || "unknown",
			primaryFile,
			fileName: data.originalFile?.name || data.file?.name || "id_document.jpg",
			originalPdf:
				data.originalFile?.type === "application/pdf"
					? data.originalFile
					: null,
			relatedFiles: relatedFiles.length > 0 ? relatedFiles : undefined,
			waitForProcessing: false,
		});

		setIdCopyDocId(uploadResult.documentId);
		toast.success("Identificación cargada");
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!firstName.trim() || !lastName.trim()) {
			toast.error("Nombre y apellido paterno son requeridos");
			return;
		}

		try {
			setIsSubmitting(true);

			const mappedIdDocType: IdDocumentType | null =
				idDocumentData?.idType === "NATIONAL_ID"
					? "INE"
					: idDocumentData?.idType === "PASSPORT"
						? "PASSPORT"
						: null;

			const baseData = {
				bcType,
				identificationCriteria,
				isLegalRepresentative,
				controlMechanism: controlMechanism || null,
				shareholderId: shareholderId || null,
				firstName,
				lastName,
				secondLastName: secondLastName || null,
				birthDate: birthDate || null,
				nationality: nationality || null,
				occupation: occupation || null,
				curp: curp || null,
				rfc: rfc || null,
				idDocumentType: mappedIdDocType,
				idDocumentNumber: idDocumentData?.documentNumber || null,
				idDocumentAuthority: idDocumentAuthority || null,
				idCopyDocId: idCopyDocId || null,
				email: email || null,
				phone: phone || null,
				country: null, // country is derived from nationality via catalog
				stateCode: stateCode || null,
				city: city || null,
				street: street || null,
				postalCode: postalCode || null,
				notes: notes || null,
			};

			if (isEditMode) {
				const patchData: BeneficialControllerPatchRequest = { ...baseData };
				await patchBeneficialController({
					clientId,
					bcId: beneficialController.id,
					input: patchData,
				});
				toast.success("Beneficiario controlador actualizado");
			} else {
				const createData: BeneficialControllerCreateRequest = baseData;
				await createBeneficialController({ clientId, input: createData });
				toast.success(
					"Beneficiario controlador creado. El screening se iniciará automáticamente.",
				);
			}

			onSave();
			onOpenChange(false);
		} catch (error: any) {
			console.error("Error saving beneficial controller:", error);
			toast.error(
				error?.message || "Error al guardar beneficiario controlador",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl" fullscreenMobile>
				<DialogHeader>
					<DialogTitle>
						{isEditMode
							? "Editar Beneficiario Controlador"
							: "Agregar Beneficiario Controlador"}
					</DialogTitle>
					<DialogDescription>
						Persona física que obtiene el beneficio o ejerce control sobre la
						entidad (LFPIORPI / CFF Art. 32-B)
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
					<DialogBody className="space-y-6">
						{/* ── Clasificación ── */}
						<section className="space-y-4">
							<div className="flex items-center gap-2">
								<Tags className="h-4 w-4 text-primary" />
								<h4 className="text-sm font-semibold">Clasificación</h4>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="bcType">Tipo de BC *</Label>
									<Select
										value={bcType}
										onValueChange={(v) => setBcType(v as BCType)}
									>
										<SelectTrigger id="bcType">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="SHAREHOLDER">
												Accionista Beneficiario
											</SelectItem>
											<SelectItem value="LEGAL_REP">
												Representante Legal
											</SelectItem>
											<SelectItem value="TRUSTEE">Fiduciario</SelectItem>
											<SelectItem value="SETTLOR">Fideicomitente</SelectItem>
											<SelectItem value="TRUST_BENEFICIARY">
												Beneficiario del Fideicomiso
											</SelectItem>
											<SelectItem value="DIRECTOR">Director</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="identificationCriteria">
										Criterio de Identificación *
									</Label>
									<Select
										value={identificationCriteria}
										onValueChange={(v) =>
											setIdentificationCriteria(v as IdentificationCriteria)
										}
									>
										<SelectTrigger id="identificationCriteria">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="BENEFIT">
												Obtiene el Beneficio (1er Criterio)
											</SelectItem>
											<SelectItem value="CONTROL">
												Ejerce el Control (2do Criterio)
											</SelectItem>
											<SelectItem value="FALLBACK">
												Administrador/Consejo (3er Criterio)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="isLegalRepresentative"
										checked={isLegalRepresentative}
										onCheckedChange={(checked) =>
											setIsLegalRepresentative(checked as boolean)
										}
									/>
									<Label
										htmlFor="isLegalRepresentative"
										className="font-normal cursor-pointer"
									>
										Es representante legal
									</Label>
								</div>
								{shareholders.length > 0 && (
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<Label
											htmlFor="shareholderId"
											className="shrink-0 text-muted-foreground text-sm"
										>
											Vinculado a:
										</Label>
										<Select
											value={shareholderId || "__none__"}
											onValueChange={(v) =>
												setShareholderId(v === "__none__" ? "" : v)
											}
										>
											<SelectTrigger
												id="shareholderId"
												className="max-w-[200px]"
											>
												<SelectValue placeholder="Ninguno" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">Ninguno</SelectItem>
												{shareholders.map((s) => (
													<SelectItem key={s.id} value={s.id}>
														{s.firstName || s.businessName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
							</div>

							{identificationCriteria === "CONTROL" && (
								<div className="space-y-2">
									<Label htmlFor="controlMechanism">Mecanismo de Control</Label>
									<Input
										id="controlMechanism"
										value={controlMechanism}
										onChange={(e) => setControlMechanism(e.target.value)}
										placeholder="Describe cómo ejerce el control"
									/>
								</div>
							)}
						</section>

						<hr className="border-border" />

						{/* ── Datos Personales ── */}
						<section className="space-y-4">
							<div className="flex items-center gap-2">
								<User className="h-4 w-4 text-primary" />
								<h4 className="text-sm font-semibold">Datos Personales</h4>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">Nombre *</Label>
									<Input
										id="firstName"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value.toUpperCase())}
										placeholder="NOMBRE"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">Apellido Paterno *</Label>
									<Input
										id="lastName"
										value={lastName}
										onChange={(e) => setLastName(e.target.value.toUpperCase())}
										placeholder="APELLIDO PATERNO"
										required
									/>
								</div>
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
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="birthDate">Fecha de Nacimiento</Label>
									<Input
										id="birthDate"
										type="date"
										value={birthDate}
										onChange={(e) => setBirthDate(e.target.value)}
									/>
								</div>
								<CatalogSelector
									catalogKey="countries"
									label="Nacionalidad"
									value={nationality}
									onChange={(option: CatalogItem | null) => {
										const meta = option?.metadata as
											| { code?: string }
											| undefined;
										setNationality(meta?.code || option?.id || "");
									}}
									getOptionValue={(option: CatalogItem) => {
										const meta = option.metadata as
											| { code?: string }
											| undefined;
										return meta?.code || option.id;
									}}
								/>
								<div className="space-y-2">
									<Label htmlFor="occupation">Ocupación</Label>
									<Input
										id="occupation"
										value={occupation}
										onChange={(e) => setOccupation(e.target.value)}
										placeholder="Empresario"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="curp">CURP</Label>
									<Input
										id="curp"
										value={curp}
										onChange={(e) => setCurp(e.target.value.toUpperCase())}
										placeholder="CURP"
										maxLength={18}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="rfc">RFC</Label>
									<Input
										id="rfc"
										value={rfc}
										onChange={(e) => setRfc(e.target.value.toUpperCase())}
										placeholder="RFC"
										maxLength={13}
									/>
								</div>
							</div>
						</section>

						<hr className="border-border" />

						{/* ── Optional Sections (Accordion) ── */}
						<Accordion type="multiple" className="space-y-0">
							{/* ── Documento de Identificación ── */}
							<AccordionItem value="id-document" className="border-b-0">
								<AccordionTrigger className="py-3 hover:no-underline">
									<span className="flex items-center gap-2 text-sm font-semibold">
										<CreditCard className="h-4 w-4 text-primary" />
										Documento de Identificación
										{(idCopyDocId || idDocumentData?.isUploaded) && (
											<span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" />
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent className="space-y-4">
									<IDDocumentSelector
										required={false}
										disabled={isSubmitting}
										data={idDocumentData}
										onDataChange={setIdDocumentData}
										onUpload={handleIdDocUpload}
										label="Identificación Oficial"
										personalData={{
											firstName,
											lastName,
											secondLastName,
											curp,
											birthDate,
										}}
									/>

									<div className="space-y-2">
										<Label htmlFor="idDocumentAuthority">
											Autoridad Emisora
										</Label>
										<Input
											id="idDocumentAuthority"
											value={idDocumentAuthority}
											onChange={(e) => setIdDocumentAuthority(e.target.value)}
											placeholder="INE, SRE, etc."
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* ── Contacto ── */}
							<AccordionItem value="contact" className="border-b-0">
								<AccordionTrigger className="py-3 hover:no-underline">
									<span className="flex items-center gap-2 text-sm font-semibold">
										<Mail className="h-4 w-4 text-primary" />
										Contacto
										{(email || phone) && (
											<span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" />
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent>
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
								</AccordionContent>
							</AccordionItem>

							{/* ── Domicilio ── */}
							<AccordionItem value="address" className="border-b-0">
								<AccordionTrigger className="py-3 hover:no-underline">
									<span className="flex items-center gap-2 text-sm font-semibold">
										<MapPin className="h-4 w-4 text-primary" />
										Domicilio
										{(postalCode || street) && (
											<span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" />
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent className="space-y-4">
									<ZipCodeAddressFields
										postalCode={postalCode}
										onPostalCodeChange={setPostalCode}
										city={city}
										onCityChange={setCity}
										municipality={municipality}
										onMunicipalityChange={setMunicipality}
										stateCode={stateCode}
										onStateCodeChange={setStateCode}
										neighborhood={neighborhood}
										onNeighborhoodChange={setNeighborhood}
										showNeighborhood
									/>

									<div className="space-y-2">
										<Label htmlFor="street">Calle y Número</Label>
										<Input
											id="street"
											value={street}
											onChange={(e) => setStreet(e.target.value)}
											placeholder="Av. Constitución 100, Col. Centro"
										/>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* ── Notas ── */}
							<AccordionItem value="notes" className="border-b-0">
								<AccordionTrigger className="py-3 hover:no-underline">
									<span className="flex items-center gap-2 text-sm font-semibold">
										<StickyNote className="h-4 w-4 text-primary" />
										Notas
										{notes && (
											<span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" />
										)}
									</span>
								</AccordionTrigger>
								<AccordionContent>
									<Textarea
										id="notes"
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										placeholder="Notas adicionales sobre este beneficiario controlador..."
										rows={3}
									/>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
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
						<Button type="submit" loading={isSubmitting}>
							{isEditMode ? "Actualizar" : "Crear"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
