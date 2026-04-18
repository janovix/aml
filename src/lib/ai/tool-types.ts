/**
 * Structured tool outputs for Janbot UI (ToolResultCard).
 * Plain strings from legacy tools still render as monospace text.
 */

export type JanbotToolResultKind =
	| "janbot.markdown"
	| "janbot.api"
	| "janbot.table"
	| "janbot.watchlist.screen";

export type JanbotToolResult =
	| {
			kind: "janbot.markdown";
			title?: string;
			markdown: string;
	  }
	| {
			kind: "janbot.api";
			title: string;
			endpoint: string;
			data: unknown;
	  }
	| {
			kind: "janbot.table";
			title: string;
			columns: string[];
			rows: Record<string, string | number | boolean | null>[];
	  }
	| {
			kind: "janbot.watchlist.screen";
			queryId: string;
			ofacCount: number;
			unscCount: number;
			sat69bCount: number;
	  };

export function isJanbotToolResult(value: unknown): value is JanbotToolResult {
	if (!value || typeof value !== "object" || !("kind" in value)) return false;
	const k = (value as { kind: string }).kind;
	return (
		k === "janbot.markdown" ||
		k === "janbot.api" ||
		k === "janbot.table" ||
		k === "janbot.watchlist.screen"
	);
}
