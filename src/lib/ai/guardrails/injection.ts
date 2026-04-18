/**
 * Lightweight prompt-injection heuristics (Layer 3 — input).
 */

export interface InjectionScanResult {
	blocked: boolean;
	kind?: string;
}

const PATTERNS: RegExp[] = [
	/ignore (all )?(previous|prior) instructions/i,
	/disregard (all )?(previous|prior) instructions/i,
	/you are now (a|an|the) /i,
	/\bsystem:\s*/i,
	/\bdeveloper:\s*/i,
	/\bjailbreak\b/i,
	/\bDAN\b.*\bmode\b/i,
];

export function scanUserTextForInjection(text: string): InjectionScanResult {
	const sample = text.slice(0, 12000);
	for (const re of PATTERNS) {
		if (re.test(sample)) {
			return { blocked: true, kind: re.source };
		}
	}
	return { blocked: false };
}
