import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { evaluateFlagsForSession } from "@/lib/flags/evaluateFlags";

const CFDI_INVOICES_FLAG_KEY = "cfdi-invoices-enabled";

/**
 * Hides the Facturas (CFDI invoices) area when the flag is explicitly false in flags-svc.
 * Fail-open: missing flag, error, or true keeps routes available.
 */
export default async function InvoicesGateLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { flags } = await evaluateFlagsForSession([CFDI_INVOICES_FLAG_KEY]);
	if (flags[CFDI_INVOICES_FLAG_KEY] === false) {
		notFound();
	}
	return <>{children}</>;
}
