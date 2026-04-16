"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { EnvironmentContext } from "@algenium/blocks";
import {
	environmentAtom,
	initEnvironmentFromCookie,
	setDataEnvironment,
	DATA_ENVIRONMENTS,
} from "@/lib/environment-store";

export function DataEnvironmentProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	useEffect(() => {
		initEnvironmentFromCookie();
	}, []);

	const environment = useStore(environmentAtom);

	const value = useMemo(
		() => ({
			environment,
			setEnvironment: setDataEnvironment,
			environments: DATA_ENVIRONMENTS,
		}),
		[environment],
	);

	return (
		<EnvironmentContext.Provider value={value}>
			{children}
		</EnvironmentContext.Provider>
	);
}
