import type { ClientRiskAssessment } from "@/lib/api/risk";

export function makeClientRiskAssessment(
	over: Partial<ClientRiskAssessment> = {},
): ClientRiskAssessment {
	return {
		id: "as-1",
		clientId: "c-1",
		organizationId: "org-1",
		version: 1,
		riskLevel: "LOW",
		riskScore: 10,
		inherentRiskScore: 12,
		residualRiskScore: 8,
		mitigantEffect: 4,
		ddLevel: "SIMPLIFIED",
		ddProfile: {
			clientAcceptance: "SIMPLIFIED",
			identificationVerification: "SIMPLIFIED",
			ongoingMonitoring: "SIMPLIFIED",
			transactionScrutiny: "SIMPLIFIED",
			reportingObligations: "SIMPLIFIED",
		},
		elements: [
			{
				elementType: "CLIENT",
				factors: [],
				rawScore: 2,
				riskLevel: "LOW",
			},
		],
		triggerReason: "MANUAL",
		createdAt: "2024-01-01",
		...over,
	};
}
