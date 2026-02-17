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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	createBeneficialController,
	patchBeneficialController,
	listClientBeneficialControllers,
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
import {
	getBCTypeLabel,
	getIdentificationCriteriaLabel,
	getIdDocumentTypeLabel,
} from "@/types/beneficial-controller";

interface BeneficialControllerFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientId: string;
	beneficialController?: BeneficialController | null; // Null for create mode
	onSave: () => void; // Callback after successful save
}

export function BeneficialControllerFormDialog({
	open,
	onOpenChange,
	clientId,
	beneficialController,
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

	// Anexo 3: Personal Data (all BCs are natural persons)
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
	const [birthCountry, setBirthCountry] = useState(
		beneficialController?.birthCountry || "",
	);
	const [nationality, setNationality] = useState(
		beneficialController?.nationality || "",
	);
	const [occupation, setOccupation] = useState(
		beneficialController?.occupation || "",
	);
	const [curp, setCurp] = useState(beneficialController?.curp || "");
	const [rfc, setRfc] = useState(beneficialController?.rfc || "");

	// Anexo 3: ID Document Details
	const [idDocumentType, setIdDocumentType] = useState<IdDocumentType>(
		beneficialController?.idDocumentType || "INE",
	);
	const [idDocumentNumber, setIdDocumentNumber] = useState(
		beneficialController?.idDocumentNumber || "",
	);
	const [idDocumentAuthority, setIdDocumentAuthority] = useState(
		beneficialController?.idDocumentAuthority || "",
	);

	// Contact
	const [email, setEmail] = useState(beneficialController?.email || "");
	const [phone, setPhone] = useState(beneficialController?.phone || "");

	// Address (managed by ZipCodeAddressFields)
	const [country, setCountry] = useState(beneficialController?.country || "MX");
	const [stateCode, setStateCode] = useState(
		beneficialController?.stateCode || "",
	);
	const [city, setCity] = useState(beneficialController?.city || "");
	const [street, setStreet] = useState(beneficialController?.street || "");
	const [postalCode, setPostalCode] = useState(
		beneficialController?.postalCode || "",
	);

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

	// Reset form when dialog closes or BC changes
	useEffect(() => {
		if (!open) return;

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
		setBirthCountry(beneficialController?.birthCountry || "");
		setNationality(beneficialController?.nationality || "");
		setOccupation(beneficialController?.occupation || "");
		setCurp(beneficialController?.curp || "");
		setRfc(beneficialController?.rfc || "");
		setIdDocumentType(beneficialController?.idDocumentType || "INE");
		setIdDocumentNumber(beneficialController?.idDocumentNumber || "");
		setIdDocumentAuthority(beneficialController?.idDocumentAuthority || "");
		setEmail(beneficialController?.email || "");
		setPhone(beneficialController?.phone || "");
		setCountry(beneficialController?.country || "MX");
		setStateCode(beneficialController?.stateCode || "");
		setCity(beneficialController?.city || "");
		setStreet(beneficialController?.street || "");
		setPostalCode(beneficialController?.postalCode || "");
		setNotes(beneficialController?.notes || "");
	}, [open, beneficialController]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!firstName.trim() || !lastName.trim()) {
			toast.error("Nombre y apellido paterno son requeridos");
			return;
		}

		try {
			setIsSubmitting(true);

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
				birthCountry: birthCountry || null,
				nationality: nationality || null,
				occupation: occupation || null,
				curp: curp || null,
				rfc: rfc || null,
				idDocumentType: idDocumentType || null,
				idDocumentNumber: idDocumentNumber || null,
				idDocumentAuthority: idDocumentAuthority || null,
				email: email || null,
				phone: phone || null,
				country: country || null,
				stateCode: stateCode || null,
				city: city || null,
				street: street || null,
				postalCode: postalCode || null,
				notes: notes || null,
			};

			if (isEditMode) {
				// Patch mode - send all fields (could optimize to only send changed fields)
				const patchData: BeneficialControllerPatchRequest = { ...baseData };

				await patchBeneficialController({
					clientId,
					bcId: beneficialController.id,
					input: patchData,
				});
				toast.success("Beneficiario controlador actualizado");
			} else {
				// Create mode
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
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

				<form onSubmit={handleSubmit}>
					<DialogBody className="space-y-6">
						{/* BC Classification */}
						<div className="space-y-4 border-b pb-4">
							<h4 className="text-sm font-medium">Clasificación</h4>
							<div className="grid grid-cols-2 gap-4">
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

							<div className="grid grid-cols-2 gap-4">
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
									<div className="space-y-2">
										<Label htmlFor="shareholderId">
											Vinculado a Accionista (opcional)
										</Label>
										<Select
											value={shareholderId}
											onValueChange={setShareholderId}
										>
											<SelectTrigger id="shareholderId">
												<SelectValue placeholder="Ninguno" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="">Ninguno</SelectItem>
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
						</div>

						{/* Anexo 3: Personal Data */}
						<div className="space-y-4 border-b pb-4">
							<h4 className="text-sm font-medium">
								Datos Personales (Anexo 3)
							</h4>
							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">Nombre *</Label>
									<Input
										id="firstName"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										placeholder="Nombre"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">Apellido Paterno *</Label>
									<Input
										id="lastName"
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										placeholder="Apellido Paterno"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="secondLastName">Apellido Materno</Label>
									<Input
										id="secondLastName"
										value={secondLastName}
										onChange={(e) => setSecondLastName(e.target.value)}
										placeholder="Apellido Materno"
									/>
								</div>
							</div>

							<div className="grid grid-cols-4 gap-4">
								<div className="space-y-2">
									<Label htmlFor="birthDate">Fecha de Nacimiento</Label>
									<Input
										id="birthDate"
										type="date"
										value={birthDate}
										onChange={(e) => setBirthDate(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="birthCountry">País de Nacimiento</Label>
									<Input
										id="birthCountry"
										value={birthCountry}
										onChange={(e) => setBirthCountry(e.target.value)}
										placeholder="México"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="nationality">Nacionalidad</Label>
									<Input
										id="nationality"
										value={nationality}
										onChange={(e) => setNationality(e.target.value)}
										placeholder="Mexicana"
									/>
								</div>
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
						</div>

						{/* Anexo 3: ID Document */}
						<div className="space-y-4 border-b pb-4">
							<h4 className="text-sm font-medium">
								Documento de Identificación (Anexo 3)
							</h4>
							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="idDocumentType">Tipo de Documento</Label>
									<Select
										value={idDocumentType}
										onValueChange={(v) =>
											setIdDocumentType(v as IdDocumentType)
										}
									>
										<SelectTrigger id="idDocumentType">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="INE">INE/IFE</SelectItem>
											<SelectItem value="PASSPORT">Pasaporte</SelectItem>
											<SelectItem value="OTHER">Otro Documento</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="idDocumentNumber">Número de Documento</Label>
									<Input
										id="idDocumentNumber"
										value={idDocumentNumber}
										onChange={(e) => setIdDocumentNumber(e.target.value)}
										placeholder="Número"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="idDocumentAuthority">Autoridad Emisora</Label>
									<Input
										id="idDocumentAuthority"
										value={idDocumentAuthority}
										onChange={(e) => setIdDocumentAuthority(e.target.value)}
										placeholder="INE, SRE, etc."
									/>
								</div>
							</div>
						</div>

						{/* Contact */}
						<div className="space-y-4 border-b pb-4">
							<h4 className="text-sm font-medium">Contacto</h4>
							<div className="grid grid-cols-2 gap-4">
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
									<Input
										id="phone"
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="5512345678"
									/>
								</div>
							</div>
						</div>

						{/* Address */}
						<div className="space-y-4 border-b pb-4">
							<h4 className="text-sm font-medium">Domicilio</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="postalCode">Código Postal</Label>
									<Input
										id="postalCode"
										value={postalCode}
										onChange={(e) => setPostalCode(e.target.value)}
										placeholder="64000"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="stateCode">Estado</Label>
									<Input
										id="stateCode"
										value={stateCode}
										onChange={(e) => setStateCode(e.target.value)}
										placeholder="NL"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="city">Ciudad</Label>
									<Input
										id="city"
										value={city}
										onChange={(e) => setCity(e.target.value)}
										placeholder="Monterrey"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="street">Calle</Label>
									<Input
										id="street"
										value={street}
										onChange={(e) => setStreet(e.target.value)}
										placeholder="Av. Constitución"
									/>
								</div>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-2">
							<Label htmlFor="notes">Notas</Label>
							<Input
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Notas adicionales"
							/>
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
