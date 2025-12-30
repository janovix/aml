"use client";

import { useStore } from "@nanostores/react";
import { useRef } from "react";
import { sessionStore, setSession } from "./sessionStore";
import type { Session } from "./types";

// Hydrator component - use in root layout
export function SessionHydrator({
	serverSession,
	children,
}: {
	serverSession: Session;
	children: React.ReactNode;
}) {
	const hydrated = useRef(false);

	if (!hydrated.current && typeof window !== "undefined") {
		sessionStore.set({
			data: serverSession,
			error: null,
			isPending: false,
		});
		hydrated.current = true;
	}

	return <>{children}</>;
}

// Hook to access session in components
export function useAuthSession() {
	const { data, error, isPending } = useStore(sessionStore);
	return { data, error, isPending };
}
