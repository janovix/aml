"use client";

/**
 * ModelSelector
 *
 * Dropdown to select the AI model provider and model.
 * Uses svgl icons for provider logos with dark mode support.
 */

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	type LlmModel,
	type LlmProvider,
	MODEL_CONFIGS,
	getModelsByProvider,
} from "@/lib/ai/types";
import { useChats } from "./ChatProvider";

// Import SVG icons from svgl
import { Openai } from "@/components/ui/svgs/openai";
import { AnthropicBlack } from "@/components/ui/svgs/anthropicBlack";
import { Gemini } from "@/components/ui/svgs/gemini";

interface ModelSelectorProps {
	className?: string;
}

const PROVIDER_LABELS: Record<LlmProvider, string> = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	google: "Google",
};

const PROVIDER_ORDER: LlmProvider[] = ["openai", "anthropic", "google"];

function ProviderIcon({
	provider,
	className,
}: {
	provider: LlmProvider;
	className?: string;
}) {
	const iconClass = cn("h-4 w-4 shrink-0", className);

	switch (provider) {
		case "openai":
			return <Openai className={iconClass} />;
		case "anthropic":
			return <AnthropicBlack className={iconClass} />;
		case "google":
			return <Gemini className={iconClass} />;
		default:
			return null;
	}
}

export function ModelSelector({ className }: ModelSelectorProps) {
	const { selectedModel, setSelectedModel } = useChats();
	const currentConfig = MODEL_CONFIGS[selectedModel];

	return (
		<Select
			value={selectedModel}
			onValueChange={(value) => setSelectedModel(value as LlmModel)}
		>
			<SelectTrigger className={cn("w-[240px]", className)}>
				<SelectValue placeholder="Select model">
					<div className="flex items-center gap-2">
						<ProviderIcon provider={currentConfig?.provider ?? "openai"} />
						<span className="truncate">
							{PROVIDER_LABELS[currentConfig?.provider ?? "openai"]}{" "}
							{currentConfig?.displayName ?? selectedModel}
						</span>
					</div>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{PROVIDER_ORDER.map((provider, index) => {
					const models = getModelsByProvider(provider);
					if (models.length === 0) return null;

					return (
						<SelectGroup key={provider}>
							{index > 0 && <SelectSeparator />}
							{models.map((model) => (
								<SelectItem key={model.model} value={model.model}>
									<div className="flex items-center gap-2">
										<ProviderIcon provider={provider} />
										<span>
											{PROVIDER_LABELS[provider]} {model.displayName}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectGroup>
					);
				})}
			</SelectContent>
		</Select>
	);
}

export { ProviderIcon };
