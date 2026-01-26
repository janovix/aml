"use client";

import type React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelWithInfo } from "@/components/ui/LabelWithInfo";
import { CatalogSelector } from "@/components/catalogs/CatalogSelector";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getFieldDescription } from "@/lib/field-descriptions";
import { useZipCodeLookup } from "@/hooks/useZipCodeLookup";
import { toast } from "sonner";
import { Loader2, PencilLine } from "lucide-react";
import type { CatalogItem } from "@/types/catalog";

const CUSTOM_NEIGHBORHOOD_VALUE = "__CUSTOM__";

interface ZipCodeAddressFieldsProps {
	// Postal code
	postalCode: string;
	onPostalCodeChange: (value: string) => void;

	// City
	city: string;
	onCityChange: (value: string) => void;

	// Municipality
	municipality: string;
	onMunicipalityChange: (value: string) => void;

	// State code (2-letter code like "NL")
	stateCode: string;
	onStateCodeChange: (value: string) => void;

	// Optional: Neighborhood (colonia)
	neighborhood?: string;
	onNeighborhoodChange?: (value: string) => void;

	// Optional: Reference
	reference?: string;
	onReferenceChange?: (value: string) => void;

	// Control labels
	showNeighborhood?: boolean;
	showReference?: boolean;

	// Disable auto-lookup (for testing or manual entry)
	disableAutoLookup?: boolean;
}

/**
 * ZipCodeAddressFields - Smart address form fields with automatic population
 *
 * Features:
 * - Queries zip-code catalog when postal code is entered
 * - Auto-populates city, municipality, and state from catalog
 * - Allows manual editing if zip code not found or user wants to override
 * - Handles edge cases:
 *   - User changes state after auto-population (preserves manual change)
 *   - User manually edits fields before entering zip code (preserves manual entries)
 *   - Zip code not found in catalog (allows manual entry)
 *   - Multiple settlements for same zip code (shows info toast)
 */
export function ZipCodeAddressFields({
	postalCode,
	onPostalCodeChange,
	city,
	onCityChange,
	municipality,
	onMunicipalityChange,
	stateCode,
	onStateCodeChange,
	neighborhood,
	onNeighborhoodChange,
	reference,
	onReferenceChange,
	showNeighborhood = true,
	showReference = true,
	disableAutoLookup = false,
}: ZipCodeAddressFieldsProps): React.JSX.Element {
	const { lookup, loading } = useZipCodeLookup();

	// Track if fields were auto-populated to handle user overrides
	const [autoPopulatedZipCode, setAutoPopulatedZipCode] = useState<
		string | null
	>(null);
	const [userModifiedFields, setUserModifiedFields] = useState({
		city: false,
		municipality: false,
		stateCode: false,
	});

	// Track the last zip code we looked up to avoid duplicate lookups
	const [lastLookedUpZipCode, setLastLookedUpZipCode] = useState<string | null>(
		null,
	);

	// Store available settlements for the current zip code
	const [availableSettlements, setAvailableSettlements] = useState<
		Array<{
			name: string;
			type: string;
		}>
	>([]);

	// Track if user selected custom neighborhood option
	const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);
	const [customNeighborhoodValue, setCustomNeighborhoodValue] = useState("");

	// Track if we've shown the toast for the current zip code to prevent duplicates
	const toastShownForZipCode = useRef<string | null>(null);

	// Track if this is the initial mount to prevent lookup on load
	const isInitialMount = useRef(true);
	const initialPostalCode = useRef(postalCode);

	/**
	 * Perform zip code lookup and populate fields
	 */
	const performLookup = useCallback(
		async (zipCode: string) => {
			if (disableAutoLookup) return;

			const trimmedZipCode = zipCode.trim();

			// Skip if already looked up this zip code
			if (trimmedZipCode === lastLookedUpZipCode) {
				return;
			}

			// Validate format before lookup
			if (!/^\d{5}$/.test(trimmedZipCode)) {
				return;
			}

			const result = await lookup(trimmedZipCode);

			if (result) {
				setLastLookedUpZipCode(trimmedZipCode);
				setAutoPopulatedZipCode(trimmedZipCode);
				setAvailableSettlements(result.settlements);

				// Only populate fields that haven't been manually modified
				if (!userModifiedFields.city) {
					onCityChange(result.city.toUpperCase());
				}
				if (!userModifiedFields.municipality) {
					onMunicipalityChange(result.municipality.toUpperCase());
				}
				if (!userModifiedFields.stateCode) {
					onStateCodeChange(result.stateCode.toUpperCase());
				}

				// Show info about settlements if multiple exist, but only once per zip code
				if (
					result.settlements.length > 1 &&
					toastShownForZipCode.current !== trimmedZipCode
				) {
					toastShownForZipCode.current = trimmedZipCode;
					toast.info(
						`Se encontraron ${result.settlements.length} colonias para este código postal. Por favor, selecciona la colonia correspondiente para continuar.`,
						{ duration: 6000 },
					);
				} else if (result.settlements.length === 1) {
					// Single settlement - auto-populate neighborhood
					if (onNeighborhoodChange) {
						onNeighborhoodChange(result.settlements[0].name.toUpperCase());
					}
				}
			} else {
				// Zip code not found - allow manual entry
				setLastLookedUpZipCode(trimmedZipCode);
				setAvailableSettlements([]);

				// Only show toast once per zip code
				if (toastShownForZipCode.current !== trimmedZipCode) {
					toastShownForZipCode.current = trimmedZipCode;
					toast.info(
						"Código postal no encontrado en el catálogo. Puedes ingresar los datos manualmente.",
						{ duration: 4000 },
					);
				}
			}
		},
		[
			lookup,
			disableAutoLookup,
			lastLookedUpZipCode,
			userModifiedFields,
			onCityChange,
			onMunicipalityChange,
			onStateCodeChange,
		],
	);

	/**
	 * Handle postal code change with debounced lookup
	 */
	const handlePostalCodeChange = (value: string) => {
		onPostalCodeChange(value);

		// Mark that user is actively changing the postal code (not initial load)
		isInitialMount.current = false;

		// Reset auto-population tracking if user changes zip code
		if (value.trim() !== autoPopulatedZipCode) {
			setAutoPopulatedZipCode(null);
			setAvailableSettlements([]);
			setIsCustomNeighborhood(false);
			setCustomNeighborhoodValue("");
			toastShownForZipCode.current = null;
			// Reset user modification tracking when zip code changes
			setUserModifiedFields({
				city: false,
				municipality: false,
				stateCode: false,
			});
		}
	};

	/**
	 * Handle neighborhood selection from dropdown
	 */
	const handleNeighborhoodSelect = (value: string) => {
		if (value === CUSTOM_NEIGHBORHOOD_VALUE) {
			setIsCustomNeighborhood(true);
			setCustomNeighborhoodValue("");
			onNeighborhoodChange?.("");
		} else {
			setIsCustomNeighborhood(false);
			setCustomNeighborhoodValue("");
			onNeighborhoodChange?.(value);
		}
	};

	/**
	 * Handle custom neighborhood input
	 */
	const handleCustomNeighborhoodChange = (value: string) => {
		const upperValue = value.toUpperCase();
		setCustomNeighborhoodValue(upperValue);
		onNeighborhoodChange?.(upperValue);
	};

	/**
	 * Trigger lookup when postal code reaches 5 digits
	 * Only trigger when user actively types (not on mount with existing data)
	 */
	useEffect(() => {
		// Skip lookup on initial mount if postal code is already populated
		if (isInitialMount.current) {
			isInitialMount.current = false;
			// If component mounted with a postal code, mark it as already looked up
			// to prevent automatic lookup and toast
			if (postalCode.trim().length === 5 && /^\d{5}$/.test(postalCode.trim())) {
				setLastLookedUpZipCode(postalCode.trim());
				toastShownForZipCode.current = postalCode.trim();
			}
			return;
		}

		const trimmedZipCode = postalCode.trim();
		if (trimmedZipCode.length === 5 && /^\d{5}$/.test(trimmedZipCode)) {
			// Only perform lookup if this zip code hasn't been looked up yet
			// AND it's different from the initial postal code
			if (
				trimmedZipCode !== lastLookedUpZipCode &&
				trimmedZipCode !== initialPostalCode.current
			) {
				performLookup(trimmedZipCode);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postalCode]); // Only depend on postalCode, not performLookup

	/**
	 * Track manual modifications to fields
	 */
	const handleCityChange = (value: string) => {
		onCityChange(value);
		// Mark as manually modified if this change is not from auto-population
		if (autoPopulatedZipCode !== postalCode.trim()) {
			setUserModifiedFields((prev) => ({ ...prev, city: true }));
		}
	};

	const handleMunicipalityChange = (value: string) => {
		onMunicipalityChange(value);
		if (autoPopulatedZipCode !== postalCode.trim()) {
			setUserModifiedFields((prev) => ({ ...prev, municipality: true }));
		}
	};

	const handleStateCodeChange = (catalogItem: CatalogItem | null) => {
		// Extract state code from metadata
		const metadata = catalogItem?.metadata as { code?: string } | undefined;
		const code = metadata?.code || "";
		onStateCodeChange(code);

		// Mark as manually modified if user explicitly changes state
		// This prevents auto-population from overriding user's choice
		if (autoPopulatedZipCode === postalCode.trim()) {
			setUserModifiedFields((prev) => ({ ...prev, stateCode: true }));
		}
	};

	// Determine if we should show the address fields
	// Show them if: zip code not found, or zip code found and neighborhood selected
	const showAddressFields =
		(lastLookedUpZipCode && availableSettlements.length === 0) || // Zip not found
		availableSettlements.length === 1 || // Single settlement (auto-proceed)
		(availableSettlements.length > 1 && neighborhood); // Multiple settlements and one selected

	// Determine if we should show neighborhood dropdown (multiple settlements found)
	const showNeighborhoodDropdown =
		showNeighborhood && availableSettlements.length > 1;

	// Determine if we should show neighborhood input (no settlements or custom selected)
	const showNeighborhoodInput =
		showNeighborhood &&
		(availableSettlements.length === 0 || // No zip code found
			availableSettlements.length === 1 || // Single settlement (already auto-filled)
			isCustomNeighborhood); // User selected custom option

	return (
		<>
			{/* Row 1: Postal Code + Neighborhood (Dropdown or Input) */}
			<div className="grid grid-cols-1 @md/main:grid-cols-2 gap-4">
				{/* Postal Code */}
				<div className="space-y-2">
					<LabelWithInfo
						htmlFor="postalCode"
						description={getFieldDescription("postalCode")}
						required
					>
						Código Postal
					</LabelWithInfo>
					<div className="relative">
						<Input
							id="postalCode"
							value={postalCode}
							onChange={(e) => handlePostalCodeChange(e.target.value)}
							placeholder="64000"
							maxLength={5}
							required
						/>
						{loading && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
					<p className="text-xs text-muted-foreground">
						Ingresa el código postal para auto-completar la dirección
					</p>
				</div>

				{/* Neighborhood Dropdown - Show if multiple settlements found */}
				{showNeighborhoodDropdown && (
					<div className="space-y-2">
						<LabelWithInfo
							htmlFor="neighborhood"
							description={getFieldDescription("neighborhood")}
							required
						>
							Colonia
						</LabelWithInfo>
						<Select
							value={
								isCustomNeighborhood
									? CUSTOM_NEIGHBORHOOD_VALUE
									: neighborhood || ""
							}
							onValueChange={handleNeighborhoodSelect}
						>
							<SelectTrigger
								id="neighborhood"
								className="bg-transparent w-full"
							>
								<SelectValue placeholder="Selecciona una colonia" />
							</SelectTrigger>
							<SelectContent className="max-h-[300px]">
								{availableSettlements.map((settlement, index) => (
									<SelectItem
										key={`${settlement.name}-${index}`}
										value={settlement.name.toUpperCase()}
									>
										<div className="flex items-center gap-2">
											<span className="font-medium">{settlement.name}</span>
											<span className="text-xs text-muted-foreground">
												({settlement.type})
											</span>
										</div>
									</SelectItem>
								))}
								<SelectItem value={CUSTOM_NEIGHBORHOOD_VALUE}>
									<div className="flex items-center gap-2 text-primary">
										<PencilLine className="h-4 w-4" />
										<span className="font-medium">
											Escribir colonia personalizada
										</span>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{availableSettlements.length}{" "}
							{availableSettlements.length === 1
								? "colonia disponible"
								: "colonias disponibles"}{" "}
							para este código postal
						</p>
					</div>
				)}

				{/* Neighborhood Input - Show if no settlements, single settlement, or custom selected */}
				{showNeighborhoodInput && !showNeighborhoodDropdown && (
					<div className="space-y-2">
						<LabelWithInfo
							htmlFor="neighborhood-input"
							description={getFieldDescription("neighborhood")}
							required
						>
							Colonia
						</LabelWithInfo>
						<Input
							id="neighborhood-input"
							value={neighborhood || ""}
							onChange={(e) =>
								onNeighborhoodChange?.(e.target.value.toUpperCase())
							}
							placeholder="CENTRO"
							required
						/>
					</div>
				)}
			</div>

			{/* Custom Neighborhood Input - Show when custom option selected from dropdown */}
			{isCustomNeighborhood && showNeighborhoodDropdown && (
				<div className="space-y-2">
					<LabelWithInfo
						htmlFor="custom-neighborhood"
						description="Ingresa el nombre de la colonia manualmente"
						required
					>
						Colonia Personalizada
					</LabelWithInfo>
					<Input
						id="custom-neighborhood"
						value={customNeighborhoodValue}
						onChange={(e) => handleCustomNeighborhoodChange(e.target.value)}
						placeholder="ESCRIBE EL NOMBRE DE LA COLONIA"
						required
						autoFocus
					/>
					<p className="text-xs text-muted-foreground">
						Ingresa el nombre exacto de la colonia si no aparece en la lista
					</p>
				</div>
			)}

			{/* Address Fields - Show after neighborhood selected or if zip not found */}
			{showAddressFields && (
				<>
					{/* Row 2: City, Municipality, State */}
					<div className="grid grid-cols-1 @md/main:grid-cols-2 @lg/main:grid-cols-3 gap-4">
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="city"
								description={getFieldDescription("city")}
								required
							>
								Ciudad
							</LabelWithInfo>
							<Input
								id="city"
								value={city}
								onChange={(e) => handleCityChange(e.target.value.toUpperCase())}
								placeholder="MONTERREY"
								required
							/>
						</div>
						<div className="space-y-2">
							<LabelWithInfo
								htmlFor="municipality"
								description={getFieldDescription("municipality")}
								required
							>
								Municipio
							</LabelWithInfo>
							<Input
								id="municipality"
								value={municipality}
								onChange={(e) =>
									handleMunicipalityChange(e.target.value.toUpperCase())
								}
								placeholder="MONTERREY"
								required
							/>
						</div>
						<div className="space-y-2">
							<CatalogSelector
								catalogKey="states"
								label="Estado"
								labelDescription={getFieldDescription("stateCode")}
								value={stateCode}
								searchPlaceholder="Buscar estado..."
								placeholder="Seleccionar estado"
								onChange={handleStateCodeChange}
								getOptionValue={(option) => {
									// Use the state code from metadata
									const metadata = option.metadata as
										| { code?: string }
										| undefined;
									return metadata?.code || option.id;
								}}
								renderOption={(option, isSelected) => {
									return (
										<div className="flex w-full items-center justify-between gap-3">
											<span className="text-sm font-medium text-foreground">
												{option.name}
											</span>
											{isSelected && <span className="text-primary">✓</span>}
										</div>
									);
								}}
								required
							/>
						</div>
					</div>

					{/* Row 3: Reference */}
					{showReference && (
						<div className="space-y-2">
							<Label htmlFor="reference">Referencia</Label>
							<Input
								id="reference"
								value={reference || ""}
								onChange={(e) =>
									onReferenceChange?.(e.target.value.toUpperCase())
								}
								placeholder="ENTRE CALLES X Y Y"
							/>
						</div>
					)}
				</>
			)}
		</>
	);
}
