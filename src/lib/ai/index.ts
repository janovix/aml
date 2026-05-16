/**
 * AI Module Index
 *
 * Central export for all AI-related functionality
 */

// Types
export * from "./types";

// Providers
export {
	getModel,
	getProviderForModel,
	isProviderConfigured,
	getConfiguredProviders,
	getAvailableModels,
} from "./providers";
export type { GetModelOptions } from "./providers";

// Tools/System Prompt
export {
	SYSTEM_PROMPT,
	buildJanbotSystemPrompt,
	createDataTools,
	createImportTool,
	buildJanbotTools,
	filterToolsByJanbotFlags,
	getFullJanbotToolInventoryMarkdown,
	JANBOT_TOOL_FLAG_PREFIX,
} from "./tools";
export type {
	DataTools,
	ImportTool,
	JanbotTools,
	FileUploadContext,
} from "./tools";

// Billing
export {
	reportTokenUsage,
	getTokenUsage,
	hasRemainingTokens,
	calculateTotalTokens,
	formatTokenCount,
	calculateUsagePercentage,
} from "./billing";
export type { TokenUsageResponse } from "./billing";
