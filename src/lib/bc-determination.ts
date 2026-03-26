/**
 * Beneficial Controller suggestion for AML admin per LFPIORPI Art. 3-III.
 * Identifies person shareholders with >=25% (Art. 3-III-b-ii) that are not yet
 * registered as BCs, so the compliance officer can add them with one click.
 */

import type { Shareholder } from "@/types/shareholder";
import type { BeneficialController } from "@/types/beneficial-controller";
import { getShareholderDisplayName } from "@/types/shareholder";

export const SUGGESTED_BC_RULE_LABEL =
	"Accionista con ≥25% — Art. 3-III-b-ii LFPIORPI";

/**
 * True when the shareholder is a person with >= 25% ownership (possible BC per Art. 3-III-b-ii).
 */
export function isPossibleBC(shareholder: {
	entityType: string;
	ownershipPercentage: number;
}): boolean {
	return (
		shareholder.entityType === "PERSON" && shareholder.ownershipPercentage >= 25
	);
}

/**
 * Returns person shareholders with ownership >= 25% that do not yet have a
 * matching beneficial controller. Excludes only by shareholderId or RFC match;
 * name-only match is flagged as potentialDuplicate for UI warning, not excluded.
 */
export function getSuggestedBCsFromShareholders(
	shareholders: Shareholder[],
	existingBCs: BeneficialController[],
): Array<{
	shareholder: Shareholder;
	ruleLabel: string;
	potentialDuplicate?: boolean;
}> {
	const bcNames = new Set(
		existingBCs.map((bc) =>
			[bc.firstName, bc.lastName, bc.secondLastName]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim(),
		),
	);
	const bcShareholderIds = new Set(
		existingBCs
			.map((bc) => bc.shareholderId)
			.filter((id): id is string => !!id),
	);
	const bcRfcs = new Set(
		existingBCs
			.map((bc) => bc.rfc)
			.filter((r): r is string => !!r && r.trim().length > 0),
	);

	return shareholders
		.filter(
			(sh) =>
				sh.entityType === "PERSON" &&
				sh.ownershipPercentage >= 25 &&
				!bcShareholderIds.has(sh.id) &&
				!(sh.rfc && bcRfcs.has(sh.rfc.trim())),
		)
		.map((sh) => {
			const name = getShareholderDisplayName(sh)
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim();
			const potentialDuplicate = bcNames.has(name);
			return {
				shareholder: sh,
				ruleLabel: SUGGESTED_BC_RULE_LABEL,
				...(potentialDuplicate && { potentialDuplicate: true }),
			};
		});
}
