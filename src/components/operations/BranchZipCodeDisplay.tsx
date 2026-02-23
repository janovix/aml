"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useZipCodeLookup } from "@/hooks/useZipCodeLookup";

interface BranchZipCodeDisplayProps {
	zipCode: string;
}

/**
 * BranchZipCodeDisplay - Displays location details for a branch postal code
 *
 * Features:
 * - Auto-fetches zip code details when a valid 5-digit code is entered
 * - Shows municipality, state, and city information
 * - Displays loading state while fetching
 * - Shows nothing if zip code is invalid or not found
 */
export function BranchZipCodeDisplay({
	zipCode,
}: BranchZipCodeDisplayProps): React.JSX.Element | null {
	const { lookup, loading } = useZipCodeLookup();
	const [locationInfo, setLocationInfo] = useState<{
		municipality: string;
		state: string;
		city: string;
	} | null>(null);

	useEffect(() => {
		const trimmedZipCode = zipCode.trim();

		// Reset if zip code is empty or invalid
		if (!trimmedZipCode || !/^\d{5}$/.test(trimmedZipCode)) {
			setLocationInfo(null);
			return;
		}

		let cancelled = false;

		const fetchLocation = async () => {
			const result = await lookup(trimmedZipCode);

			if (cancelled) return;

			if (result) {
				setLocationInfo({
					municipality: result.municipality,
					state: result.state,
					city: result.city,
				});
			} else {
				setLocationInfo(null);
			}
		};

		fetchLocation();

		return () => {
			cancelled = true;
		};
	}, [zipCode, lookup]);

	// Don't render anything if loading or no data
	if (!zipCode.trim() || !/^\d{5}$/.test(zipCode.trim())) {
		return null;
	}

	if (loading) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				<span>Buscando ubicación...</span>
			</div>
		);
	}

	if (!locationInfo) {
		return null;
	}

	return (
		<div className="flex items-start gap-2 text-sm">
			<MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
			<div className="space-y-0.5">
				<p className="font-medium text-foreground">
					{locationInfo.city}, {locationInfo.state}
				</p>
				<p className="text-muted-foreground text-xs">
					{locationInfo.municipality}
				</p>
			</div>
		</div>
	);
}
