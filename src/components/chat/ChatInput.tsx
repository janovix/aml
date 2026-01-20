"use client";

/**
 * ChatInput
 *
 * Modern chat input with integrated model selector.
 * Clean design inspired by modern AI chat interfaces.
 * Supports CSV file uploads for importing clients/transactions.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
	ArrowUp,
	Square,
	Loader2,
	ChevronDown,
	Paperclip,
	X,
	FileSpreadsheet,
	Users,
	Receipt,
} from "lucide-react";
import { useChats, type ChatAttachment } from "./ChatProvider";
import {
	type LlmModel,
	type LlmProvider,
	MODEL_CONFIGS,
	getModelsByProvider,
} from "@/lib/ai/types";
import { useLanguage } from "@/components/LanguageProvider";

// Import SVG icons from svgl
import { Openai } from "@/components/ui/svgs/openai";
import { AnthropicBlack } from "@/components/ui/svgs/anthropicBlack";
import { Gemini } from "@/components/ui/svgs/gemini";

interface ChatInputProps {
	className?: string;
}

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

export function ChatInput({ className }: ChatInputProps) {
	const {
		input,
		setInput,
		handleSubmit,
		isLoading,
		stop,
		selectedModel,
		setSelectedModel,
		pendingFile,
		setPendingFile,
	} = useChats();
	const { t } = useLanguage();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
	const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
	const [selectedEntityType, setSelectedEntityType] = useState<
		"CLIENT" | "TRANSACTION"
	>("CLIENT");

	const currentConfig = MODEL_CONFIGS[selectedModel];

	// Handle file selection
	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				// Validate file type
				const validExtensions = [".csv", ".xlsx", ".xls"];
				const hasValidExtension = validExtensions.some((ext) =>
					file.name.toLowerCase().endsWith(ext),
				);

				if (!hasValidExtension) {
					// Could show a toast here
					return;
				}

				setPendingFile({
					file,
					entityType: selectedEntityType,
				});
			}
			// Reset input so the same file can be selected again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[selectedEntityType, setPendingFile],
	);

	// Trigger file input click
	const handleAttachClick = useCallback(
		(entityType: "CLIENT" | "TRANSACTION") => {
			setSelectedEntityType(entityType);
			setIsFileMenuOpen(false);
			// Small delay to ensure state is updated
			setTimeout(() => {
				fileInputRef.current?.click();
			}, 0);
		},
		[],
	);

	// Remove pending file
	const handleRemoveFile = useCallback(() => {
		setPendingFile(null);
	}, [setPendingFile]);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	}, [input]);

	// Handle key events
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (input.trim() && !isLoading) {
				handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
			}
		}
	};

	const handleModelSelect = (model: LlmModel) => {
		setSelectedModel(model);
		setIsModelMenuOpen(false);
	};

	return (
		<form onSubmit={handleSubmit} className={cn("p-3", className)}>
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,.xlsx,.xls"
				onChange={handleFileSelect}
				className="hidden"
			/>

			<div
				className={cn(
					"relative flex flex-col rounded-2xl border bg-muted/30",
					"focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
					"transition-shadow duration-200",
				)}
			>
				{/* Pending file preview */}
				{pendingFile && (
					<div className="px-3 pt-3">
						<div className="flex items-center gap-3 p-2 rounded-xl bg-primary/5 border border-primary/20">
							{/* File icon */}
							<div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
								<FileSpreadsheet className="h-4 w-4 text-primary" />
							</div>

							{/* File info */}
							<div className="flex flex-col min-w-0 flex-1">
								<span className="text-xs font-medium text-foreground truncate">
									{pendingFile.file.name}
								</span>
								<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
									{pendingFile.entityType === "CLIENT" ? (
										<Users className="h-2.5 w-2.5" />
									) : (
										<Receipt className="h-2.5 w-2.5" />
									)}
									<span>
										{pendingFile.entityType === "CLIENT"
											? t("chatImportClients")
											: t("chatImportTransactions")}
									</span>
								</div>
							</div>

							{/* Remove button */}
							<button
								type="button"
								onClick={handleRemoveFile}
								className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				)}

				{/* Textarea */}
				<Textarea
					ref={textareaRef}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={
						pendingFile ? t("chatImportPlaceholder") : t("chatPlaceholder")
					}
					className={cn(
						"min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent",
						"px-4 pt-3 pb-0 text-base rounded-b-none",
						"focus-visible:ring-0 focus-visible:ring-offset-0",
						"placeholder:text-muted-foreground/60",
						pendingFile && "rounded-t-none",
					)}
					disabled={isLoading}
					rows={1}
				/>

				{/* Bottom toolbar */}
				<div className="flex items-center justify-between px-3 py-2">
					{/* Left side - actions */}
					<div className="flex items-center gap-1">
						{/* Attachment button with dropdown */}
						<DropdownMenu
							open={isFileMenuOpen}
							onOpenChange={setIsFileMenuOpen}
						>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className={cn(
										"h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground",
										pendingFile && "text-primary",
									)}
									title={t("chatAttachCSV")}
								>
									<Paperclip className="h-4 w-4" />
									<span className="sr-only">{t("chatAttachCSV")}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								sideOffset={8}
								className="w-[200px]"
							>
								<DropdownMenuItem
									onClick={() => handleAttachClick("CLIENT")}
									className="flex items-center gap-2 cursor-pointer"
								>
									<Users className="h-4 w-4 text-blue-500" />
									<span>{t("chatImportClients")}</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleAttachClick("TRANSACTION")}
									className="flex items-center gap-2 cursor-pointer"
								>
									<Receipt className="h-4 w-4 text-green-500" />
									<span>{t("chatImportTransactions")}</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Model selector dropdown */}
						<DropdownMenu
							open={isModelMenuOpen}
							onOpenChange={setIsModelMenuOpen}
						>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className={cn(
										"h-8 gap-1.5 rounded-lg px-2",
										"text-muted-foreground hover:text-foreground",
									)}
								>
									<ProviderIcon
										provider={currentConfig?.provider ?? "openai"}
										className="h-3.5 w-3.5"
									/>
									<span className="text-xs font-medium">
										{currentConfig?.displayName ?? selectedModel}
									</span>
									<ChevronDown className="h-3 w-3 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="w-[240px]"
								sideOffset={8}
							>
								{PROVIDER_ORDER.map((provider, index) => {
									const models = getModelsByProvider(provider);
									if (models.length === 0) return null;

									const providerLabel =
										provider === "openai"
											? "OpenAI"
											: provider === "anthropic"
												? "Anthropic"
												: "Google";

									return (
										<div key={provider}>
											{index > 0 && <DropdownMenuSeparator />}
											{models.map((model) => (
												<DropdownMenuItem
													key={model.model}
													onClick={() => handleModelSelect(model.model)}
													className={cn(
														"flex items-center gap-2 py-2 cursor-pointer",
														selectedModel === model.model &&
															"bg-accent font-medium",
													)}
												>
													<ProviderIcon
														provider={provider}
														className="h-4 w-4"
													/>
													<span className="text-sm">
														{providerLabel} {model.displayName}
													</span>
												</DropdownMenuItem>
											))}
										</div>
									);
								})}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Right side - send/stop button */}
					{isLoading ? (
						<Button
							type="button"
							size="icon"
							variant="outline"
							onClick={stop}
							className="h-8 w-8 rounded-lg"
						>
							<Square className="h-3.5 w-3.5" />
							<span className="sr-only">{t("chatStop")}</span>
						</Button>
					) : (
						<Button
							type="submit"
							size="icon"
							disabled={!input.trim() && !pendingFile}
							className={cn(
								"h-8 w-8 rounded-lg",
								"bg-primary text-primary-foreground hover:bg-primary/90",
								"disabled:bg-muted disabled:text-muted-foreground",
							)}
						>
							{isLoading ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<ArrowUp className="h-3.5 w-3.5" />
							)}
							<span className="sr-only">{t("chatSend")}</span>
						</Button>
					)}
				</div>
			</div>
		</form>
	);
}
