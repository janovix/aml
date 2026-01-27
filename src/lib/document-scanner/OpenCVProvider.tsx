"use client";

/**
 * OpenCV + jscanify loader
 *
 * Following react-scanify-demo approach: load BOTH opencv.js and jscanify.min.js
 * via script tags. This ensures jscanify can find the global cv object.
 *
 * https://github.com/ColonelParrot/react-scanify-demo
 */

import * as React from "react";
import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
} from "react";
import * as Sentry from "@sentry/nextjs";

const OPENCV_URL = "https://docs.opencv.org/4.7.0/opencv.js";
const JSCANIFY_URL =
	"https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js";

interface OpenCVContextValue {
	isLoaded: boolean;
	isLoading: boolean;
	error: string | null;
	loadOpenCV: () => Promise<void>;
}

const OpenCVContext = createContext<OpenCVContextValue>({
	isLoaded: false,
	isLoading: false,
	error: null,
	loadOpenCV: async () => {},
});

export function useOpenCV(): OpenCVContextValue {
	return useContext(OpenCVContext);
}

interface OpenCVProviderProps {
	children: React.ReactNode;
}

/**
 * Check if cv object is actually ready
 */
function isCvReady(): boolean {
	if (typeof window === "undefined") return false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cv = (window as any).cv;
	return cv && typeof cv.Mat === "function";
}

/**
 * Check if jscanify is loaded
 */
function isJscanifyReady(): boolean {
	if (typeof window === "undefined") return false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return typeof (window as any).jscanify === "function";
}

/**
 * Load a script and return a promise
 */
function loadScript(id: string, src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		// Check if already exists
		if (document.getElementById(id)) {
			resolve();
			return;
		}

		const script = document.createElement("script");
		script.id = id;
		script.src = src;
		script.async = true;

		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load ${src}`));

		document.body.appendChild(script);
	});
}

/**
 * Wait for a condition to be true
 */
async function waitFor(
	condition: () => boolean,
	timeoutMs: number = 30000,
	intervalMs: number = 100,
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		if (condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error("Timeout waiting for condition");
}

export function OpenCVProvider({
	children,
}: OpenCVProviderProps): React.JSX.Element {
	const [isLoaded, setIsLoaded] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const loadPromiseRef = useRef<Promise<void> | null>(null);

	const loadOpenCV = useCallback(async (): Promise<void> => {
		// Already loaded
		if (isLoaded && isCvReady() && isJscanifyReady()) {
			return;
		}

		// Already loading - wait for that promise
		if (loadPromiseRef.current) {
			return loadPromiseRef.current;
		}

		setIsLoading(true);
		setError(null);

		loadPromiseRef.current = (async () => {
			return Sentry.startSpan(
				{
					name: "Load OpenCV and jscanify",
					op: "resource.script",
				},
				async () => {
					try {
						// Step 1: Load OpenCV script
						Sentry.logger.info("[OpenCV] Loading script...");
						await loadScript("opencv-js", OPENCV_URL);
						Sentry.logger.info("[OpenCV] Script loaded");

						// Step 2: Wait for cv to be ready (WASM initialization)
						Sentry.logger.info("[OpenCV] Waiting for WASM...");
						await waitFor(isCvReady, 30000);
						Sentry.logger.info("[OpenCV] Ready!");

						// Step 3: Load jscanify script (AFTER OpenCV is ready)
						Sentry.logger.info("[jscanify] Loading script...");
						await loadScript("jscanify-js", JSCANIFY_URL);
						Sentry.logger.info("[jscanify] Script loaded");

						// Step 4: Wait for jscanify to be available
						await waitFor(isJscanifyReady, 5000);
						Sentry.logger.info("[jscanify] Ready!");

						setIsLoaded(true);
						setIsLoading(false);
					} catch (err) {
						const errorMsg =
							err instanceof Error ? err.message : "Failed to load libraries";
						Sentry.captureException(err);
						Sentry.logger.error(
							Sentry.logger.fmt`[OpenCV/jscanify] Error: ${errorMsg}`,
						);
						setError(errorMsg);
						setIsLoading(false);
						throw err;
					} finally {
						loadPromiseRef.current = null;
					}
				},
			);
		})();

		return loadPromiseRef.current;
	}, [isLoaded]);

	const contextValue: OpenCVContextValue = {
		isLoaded,
		isLoading,
		error,
		loadOpenCV,
	};

	return (
		<OpenCVContext.Provider value={contextValue}>
			{children}
		</OpenCVContext.Provider>
	);
}

/**
 * Check if OpenCV and jscanify are ready
 */
export function isOpenCVReady(): boolean {
	return isCvReady() && isJscanifyReady();
}

/**
 * Get cv object
 */
export function getCV(): unknown | null {
	if (!isCvReady()) return null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (window as any).cv;
}

/**
 * Get jscanify class (loaded via script tag)
 */
export function getJscanifyClass(): unknown | null {
	if (!isJscanifyReady()) return null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (window as any).jscanify;
}

/**
 * Load OpenCV and jscanify imperatively
 */
export async function loadOpenCVScript(): Promise<void> {
	if (typeof window === "undefined") {
		throw new Error("Cannot load in server environment");
	}

	// Already loaded
	if (isCvReady() && isJscanifyReady()) {
		return;
	}

	return await Sentry.startSpan(
		{
			name: "Load OpenCV Script (Imperative)",
			op: "resource.script",
		},
		async () => {
			// Load OpenCV
			if (!document.getElementById("opencv-js")) {
				Sentry.logger.info("[OpenCV] Loading script...");
				await loadScript("opencv-js", OPENCV_URL);
			}

			// Wait for cv
			Sentry.logger.info("[OpenCV] Waiting for WASM...");
			await waitFor(isCvReady, 30000);
			Sentry.logger.info("[OpenCV] Ready!");

			// Load jscanify
			if (!document.getElementById("jscanify-js")) {
				Sentry.logger.info("[jscanify] Loading script...");
				await loadScript("jscanify-js", JSCANIFY_URL);
			}

			// Wait for jscanify
			await waitFor(isJscanifyReady, 5000);
			Sentry.logger.info("[jscanify] Ready!");
		},
	);
}
