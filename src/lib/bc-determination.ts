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
 * Returns person shareholders with ownership >= 25% that do not yet have a
 * matching beneficial controller (by shareholderId or by name).
 */
export function getSuggestedBCsFromShareholders(
	shareholders: Shareholder[],
	existingBCs: BeneficialController[],
): Array<{ shareholder: Shareholder; ruleLabel: string }> {
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

	return shareholders
		.filter(
			(sh) =>
				sh.entityType === "PERSON" &&
				sh.ownershipPercentage >= 25 &&
				!bcShareholderIds.has(sh.id),
		)
		.filter((sh) => {
			const name = getShareholderDisplayName(sh)
				.toLowerCase()
				.replace(/\s+/g, " ")
				.trim();
			return !bcNames.has(name);
		})
		.map((sh) => ({
			shareholder: sh,
			ruleLabel: SUGGESTED_BC_RULE_LABEL,
		}));
}
