"use client";

import * as React from "react";

/**
 * Page status types for breadcrumb display
 */
export type PageStatus =
	| "normal"
	| "not-found"
	| "error"
	| "forbidden"
	| "unauthorized";

interface PageStatusContextValue {
	status: PageStatus;
	setStatus: (status: PageStatus) => void;
}

const PageStatusContext = React.createContext<
	PageStatusContextValue | undefined
>(undefined);

/**
 * Provider for page status context.
 * This allows error pages (404, 500, etc.) to communicate their status
 * to the breadcrumb component for proper display.
 */
export function PageStatusProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [status, setStatus] = React.useState<PageStatus>("normal");

	const value = React.useMemo(() => ({ status, setStatus }), [status]);

	return (
		<PageStatusContext.Provider value={value}>
			{children}
		</PageStatusContext.Provider>
	);
}

/**
 * Hook to access and update page status.
 * Use this in error pages to set the appropriate status,
 * and in breadcrumb to read the current status.
 */
export function usePageStatus() {
	const context = React.useContext(PageStatusContext);
	if (!context) {
		throw new Error("usePageStatus must be used within a PageStatusProvider");
	}
	return context;
}

/**
 * Hook to set page status on mount and reset on unmount.
 * Convenience hook for error pages.
 */
export function useSetPageStatus(status: PageStatus) {
	const { setStatus } = usePageStatus();

	React.useEffect(() => {
		setStatus(status);
		return () => setStatus("normal");
	}, [status, setStatus]);
}
