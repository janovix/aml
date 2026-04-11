import type { Metadata } from "next";
import { OrgAssessmentView } from "@/components/risk/OrgAssessmentView";

export const metadata: Metadata = {
	title: "Evaluación Organizacional EBR | Plataforma AML",
	description:
		"Evaluación con enfoque basado en riesgo a nivel organizacional conforme al Art. 18-VII LFPIORPI",
};

export default function OrgAssessmentPage(): React.ReactElement {
	return <OrgAssessmentView />;
}
