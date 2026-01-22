"use client";

/**
 * ChatProvider
 *
 * Provides chat state and context to child components.
 * Uses a simple implementation with useState and fetch.
 * Passes JWT token for authenticated API calls (data tools).
 */

import * as Sentry from "@sentry/nextjs";
import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	useEffect,
	type ReactNode,
} from "react";
import { type LlmModel, DEFAULT_MODEL, MODEL_CONFIGS } from "@/lib/ai/types";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import type { BotExpression } from "./AnimatedBotIcon";

// File attachment type
export interface ChatAttachment {
	file: File;
	entityType: "CLIENT" | "TRANSACTION";
}

// Message type
export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	createdAt: Date;
	attachment?: ChatAttachment;
}

interface ChatContextValue {
	// Chat state
	messages: ChatMessage[];
	input: string;
	setInput: (input: string) => void;
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	isLoading: boolean;
	error: Error | undefined;
	reload: () => void;
	stop: () => void;
	clearMessages: () => void;

	// File attachment state
	pendingFile: ChatAttachment | null;
	setPendingFile: (file: ChatAttachment | null) => void;

	// Bot expression state (for animated icon)
	botExpression: BotExpression;
	isSleeping: boolean;
	wakeUp: () => void;

	// Model selection
	selectedModel: LlmModel;
	setSelectedModel: (model: LlmModel) => void;

	// Drawer state
	isOpen: boolean;
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
	children: ReactNode;
}

function generateId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Read file as base64 string
 */
async function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// Remove the data URL prefix (e.g., "data:text/csv;base64,")
			const base64 = result.split(",")[1] || result;
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// Sleep timer constants (in milliseconds)
const SLEEP_MIN_MS = 2 * 60 * 1000; // 2 minutes
const SLEEP_MAX_MS = 5 * 60 * 1000; // 5 minutes

/** Get a random sleep interval between min and max */
function getRandomSleepInterval(): number {
	return (
		Math.floor(Math.random() * (SLEEP_MAX_MS - SLEEP_MIN_MS + 1)) + SLEEP_MIN_MS
	);
}

export function ChatProvider({ children }: ChatProviderProps) {
	const { jwt } = useJwt();
	const { orgSlug } = useOrgNavigation();
	const [selectedModel, setSelectedModel] = useState<LlmModel>(DEFAULT_MODEL);
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | undefined>();
	const [botExpression, setBotExpression] = useState<BotExpression>("idle");
	const [isSleeping, setIsSleeping] = useState(false);
	const [pendingFile, setPendingFile] = useState<ChatAttachment | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Start/reset the sleep timer
	const startSleepTimer = useCallback(() => {
		// Clear any existing sleep timeout
		if (sleepTimeoutRef.current) {
			clearTimeout(sleepTimeoutRef.current);
		}

		// Set a new random sleep timeout
		const interval = getRandomSleepInterval();
		sleepTimeoutRef.current = setTimeout(() => {
			setIsSleeping(true);
		}, interval);
	}, []);

	// Wake up the bot and restart the sleep timer
	const wakeUp = useCallback(() => {
		setIsSleeping(false);
		startSleepTimer();
	}, [startSleepTimer]);

	// Initialize sleep timer on mount
	useEffect(() => {
		startSleepTimer();

		return () => {
			if (sleepTimeoutRef.current) {
				clearTimeout(sleepTimeoutRef.current);
			}
		};
	}, [startSleepTimer]);

	// Reset sleep timer when there's user activity (messages, loading, etc.)
	useEffect(() => {
		if (isLoading || messages.length > 0) {
			// User is active, wake up if sleeping and restart timer
			if (isSleeping) {
				setIsSleeping(false);
			}
			startSleepTimer();
		}
	}, [isLoading, messages.length, isSleeping, startSleepTimer]);

	// Derive bot expression from chat state
	useEffect(() => {
		// Clear any pending success timeout
		if (successTimeoutRef.current) {
			clearTimeout(successTimeoutRef.current);
			successTimeoutRef.current = null;
		}

		// If sleeping, always show sleepy expression
		if (isSleeping) {
			setBotExpression("sleepy");
			return;
		}

		if (error) {
			setBotExpression("error");
		} else if (isLoading) {
			setBotExpression("thinking");
		} else if (messages.length > 0) {
			// Check if last message was a successful assistant response
			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === "assistant" && lastMessage.content.length > 0) {
				// Show success briefly then return to idle
				setBotExpression("success");
				successTimeoutRef.current = setTimeout(() => {
					setBotExpression("idle");
				}, 2500);
			} else {
				setBotExpression("idle");
			}
		} else {
			setBotExpression("idle");
		}

		return () => {
			if (successTimeoutRef.current) {
				clearTimeout(successTimeoutRef.current);
			}
		};
	}, [isLoading, error, messages, isSleeping]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if ((!input.trim() && !pendingFile) || isLoading) return;

			// Build content with file info if present
			let content = input.trim();
			if (pendingFile) {
				const fileInfo = `[Archivo adjunto: ${pendingFile.file.name} (${pendingFile.entityType === "CLIENT" ? "Clientes" : "Transacciones"})]`;
				content = content ? `${content}\n\n${fileInfo}` : fileInfo;
			}

			const userMessage: ChatMessage = {
				id: generateId(),
				role: "user",
				content,
				createdAt: new Date(),
				attachment: pendingFile ?? undefined,
			};

			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			const fileToUpload = pendingFile;
			setPendingFile(null);
			setIsLoading(true);
			setError(undefined);

			// Create abort controller
			abortControllerRef.current = new AbortController();

			try {
				// Build headers with JWT if available
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
				};
				if (jwt) {
					headers.Authorization = `Bearer ${jwt}`;
				}

				// Build request body
				const requestBody: {
					messages: Array<{ role: string; content: string }>;
					model: string;
					orgSlug?: string;
					fileUpload?: {
						fileName: string;
						entityType: string;
						fileContent: string;
					};
				} = {
					messages: [...messages, userMessage].map((m) => ({
						role: m.role,
						content: m.content,
					})),
					model: selectedModel,
					orgSlug: orgSlug || undefined,
				};

				// If there's a file, read it and include in the request
				if (fileToUpload) {
					const fileContent = await readFileAsBase64(fileToUpload.file);
					requestBody.fileUpload = {
						fileName: fileToUpload.file.name,
						entityType: fileToUpload.entityType,
						fileContent,
					};
				}

				const response = await fetch("/api/chat", {
					method: "POST",
					headers,
					body: JSON.stringify(requestBody),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						(errorData as { error?: string }).error ||
							`Request failed: ${response.status}`,
					);
				}

				// Read streaming response
				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("No response body");
				}

				const assistantMessage: ChatMessage = {
					id: generateId(),
					role: "assistant",
					content: "",
					createdAt: new Date(),
				};

				setMessages((prev) => [...prev, assistantMessage]);

				const decoder = new TextDecoder();
				let accumulatedContent = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					accumulatedContent += chunk;

					// Update the assistant message with accumulated content
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantMessage.id
								? { ...m, content: accumulatedContent }
								: m,
						),
					);
				}
			} catch (err) {
				if (err instanceof Error && err.name !== "AbortError") {
					// Report to Sentry for observability
					Sentry.captureException(err, {
						tags: { feature: "chat" },
						extra: {
							model: selectedModel,
							hasFile: !!pendingFile,
							messageCount: messages.length,
						},
					});
					setError(err);
					// Remove the empty assistant message if there was an error
					setMessages((prev) =>
						prev.filter((m) => m.role !== "assistant" || m.content.length > 0),
					);
				}
			} finally {
				setIsLoading(false);
				abortControllerRef.current = null;
			}
		},
		[input, isLoading, messages, selectedModel, jwt, pendingFile, orgSlug],
	);

	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			setIsLoading(false);
		}
	}, []);

	const reload = useCallback(() => {
		// Get the last user message and resend
		const lastUserMessage = [...messages]
			.reverse()
			.find((m) => m.role === "user");
		if (lastUserMessage) {
			// Remove last assistant message and re-submit
			setMessages((prev) => {
				const lastAssistantIdx = prev.findIndex(
					(m, i) =>
						m.role === "assistant" &&
						prev.slice(i + 1).every((next) => next.role !== "assistant"),
				);
				return lastAssistantIdx >= 0 ? prev.slice(0, lastAssistantIdx) : prev;
			});
			setInput(lastUserMessage.content);
		}
	}, [messages]);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(undefined);
	}, []);

	const openChat = useCallback(() => setIsOpen(true), []);
	const closeChat = useCallback(() => setIsOpen(false), []);
	const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

	const value: ChatContextValue = {
		messages,
		input,
		setInput,
		handleSubmit,
		isLoading,
		error,
		reload,
		stop,
		clearMessages,
		pendingFile,
		setPendingFile,
		botExpression,
		isSleeping,
		wakeUp,
		selectedModel,
		setSelectedModel,
		isOpen,
		openChat,
		closeChat,
		toggleChat,
	};

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChats(): ChatContextValue {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChats must be used within a ChatProvider");
	}
	return context;
}

/**
 * Get model display info
 */
export function useModelInfo(model: LlmModel) {
	const config = MODEL_CONFIGS[model];
	return {
		displayName: config?.displayName ?? model,
		description: config?.description ?? "",
		provider: config?.provider ?? "unknown",
	};
}
