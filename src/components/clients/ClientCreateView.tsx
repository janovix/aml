"use client";

import type React from "react";
import { ClientCreateWizard } from "./wizard";

/**
 * ClientCreateView - Multi-step wizard for creating a new client
 *
 * Step 1: Client information (person type, personal/company data, contact, address)
 * Step 2: Documents and UBOs (after client is created)
 */
export function ClientCreateView(): React.JSX.Element {
	return <ClientCreateWizard />;
}
