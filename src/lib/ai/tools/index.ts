/**
 * AI Tools Index
 *
 * System prompt and tools for the AI assistant
 */

export {
	createDataTools,
	type DataTools,
	getDataToolInventoryMarkdown,
} from "./data-tools";
export { createImportTool, type ImportTool } from "./import-tool";
export {
	buildJanbotTools,
	filterToolsByJanbotFlags,
	getFullJanbotToolInventoryMarkdown,
	JANBOT_TOOL_FLAG_PREFIX,
	type FileUploadContext,
	type JanbotTools,
} from "./registry";

import { getFullJanbotToolInventoryMarkdown } from "./registry";
import { JANBOT_PROMPT_STATIC_SUFFIX } from "../janbot-prompt-static";

const JANBOT_PROMPT_INTRO = `You are Janbot, an AI assistant for Janovix, a Mexican AML (Anti-Money Laundering) compliance platform that supports nearly all vulnerable activities defined in the LFPIORPI. Your role is to help users understand and manage their compliance operations efficiently. You are an expert on the LFPIORPI (Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita), Mexico's anti-money laundering law.`;

function janbotCapabilitiesBlock(): string {
	const md = getFullJanbotToolInventoryMarkdown();
	const n = (md.match(/^- \*\*/gm) ?? []).length;
	return `## Your Capabilities

You have access to **${n}** tools that can query the user's real data and platform context. Use them proactively when the user asks about their specific data.

${md}

### Import tool
When a user uploads a CSV or Excel file through the assistant, you may also have access to **processImport** to validate and import rows from that file.
When a user attaches a file, use the processImport tool immediately unless they ask for something else first.

`;
}

/**
 * Full Janbot system prompt with an up-to-date tool inventory.
 */
export function buildJanbotSystemPrompt(extra?: string): string {
	return `${JANBOT_PROMPT_INTRO}

${janbotCapabilitiesBlock()}
${JANBOT_PROMPT_STATIC_SUFFIX}${extra ?? ""}`;
}

/** @deprecated Prefer `buildJanbotSystemPrompt()` for dynamic tool counts */
export const SYSTEM_PROMPT = buildJanbotSystemPrompt();
