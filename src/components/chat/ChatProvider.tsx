"use client";

/**
 * ChatProvider — Janbot via @ai-sdk/react useChat + DefaultChatTransport (UIMessage stream).
 */

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	useEffect,
	useMemo,
	type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { type LlmModel, DEFAULT_MODEL, MODEL_CONFIGS } from "@/lib/ai/types";
import { useJwt } from "@/hooks/useJwt";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { useOrgStore } from "@/lib/org-store";
import { getAmlCoreBaseUrl } from "@/lib/api/config";
import type { BotExpression } from "./AnimatedBotIcon";

const JANBOT_THREAD_STORAGE_KEY = "janbot-thread-id";

export interface ChatAttachment {
	file: File;
	entityType: "CLIENT" | "TRANSACTION";
}

export type JanbotMessageMetadata = {
	janovixAttachment?: {
		name: string;
		entityType: "CLIENT" | "TRANSACTION";
		size: number;
	};
};

export type JanbotUIMessage = UIMessage<JanbotMessageMetadata>;

interface ChatContextValue {
	messages: JanbotUIMessage[];
	input: string;
	setInput: (input: string) => void;
	handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
	isLoading: boolean;
	error: Error | undefined;
	reload: () => void;
	stop: () => void;
	clearMessages: () => void;
	addToolApprovalResponse: (args: {
		id: string;
		approved: boolean;
		reason?: string;
	}) => void;
	pendingFile: ChatAttachment | null;
	setPendingFile: (file: ChatAttachment | null) => void;
	botExpression: BotExpression;
	isSleeping: boolean;
	wakeUp: () => void;
	selectedModel: LlmModel;
	setSelectedModel: (model: LlmModel) => void;
	isOpen: boolean;
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
	children: ReactNode;
}

async function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.split(",")[1] || result;
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

const SLEEP_MIN_MS = 2 * 60 * 1000;
const SLEEP_MAX_MS = 5 * 60 * 1000;

function getRandomSleepInterval(): number {
	return (
		Math.floor(Math.random() * (SLEEP_MAX_MS - SLEEP_MIN_MS + 1)) + SLEEP_MIN_MS
	);
}

const CHAT_DRAWER_STORAGE_KEY = "chatDrawerOpen";

export function ChatProvider({ children }: ChatProviderProps) {
	const { jwt } = useJwt();
	const { orgSlug } = useOrgNavigation();
	const organizationId = useOrgStore((s) => s.currentOrg?.id);
	const [selectedModel, setSelectedModel] = useState<LlmModel>(DEFAULT_MODEL);
	const [isOpen, setIsOpen] = useState(() => {
		if (typeof window !== "undefined") {
			return sessionStorage.getItem(CHAT_DRAWER_STORAGE_KEY) === "true";
		}
		return false;
	});
	const [input, setInput] = useState("");
	const [pendingFile, setPendingFile] = useState<ChatAttachment | null>(null);
	const [botExpression, setBotExpression] = useState<BotExpression>("idle");
	const [isSleeping, setIsSleeping] = useState(false);
	const [chatId] = useState(
		() =>
			`janbot-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())}`,
	);
	const [threadId, setThreadId] = useState<string | null>(null);
	const didHydrateRef = useRef(false);

	const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Restore thread id from storage (client only)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = localStorage.getItem(JANBOT_THREAD_STORAGE_KEY);
		if (stored) setThreadId(stored);
	}, []);

	const transport = useMemo(
		() =>
			new DefaultChatTransport<JanbotUIMessage>({
				api: "/api/chat",
				headers: () =>
					jwt
						? { Authorization: `Bearer ${jwt}` }
						: ({} as Record<string, string>),
				body: () => ({
					model: selectedModel,
					orgSlug: orgSlug || undefined,
					organizationId: organizationId ?? undefined,
					threadId: threadId ?? undefined,
				}),
			}),
		[jwt, selectedModel, orgSlug, organizationId, threadId],
	);

	const {
		messages,
		sendMessage,
		status,
		stop,
		setMessages,
		error,
		clearError,
		regenerate,
		addToolApprovalResponse,
	} = useChat<JanbotUIMessage>({
		id: chatId,
		experimental_throttle: 50,
		transport,
		sendAutomaticallyWhen: ({ messages: msgs }) => {
			const last = msgs.at(-1);
			if (!last || last.role !== "assistant") return false;
			return last.parts.some(
				(p) =>
					isToolUIPart(p) &&
					p.state === "approval-responded" &&
					"approval" in p &&
					!!p.approval,
			);
		},
	});

	const isLoading = status === "submitted" || status === "streaming";

	// Load prior messages once per thread (after useChat provides setMessages)
	useEffect(() => {
		if (!jwt || !threadId || didHydrateRef.current) return;
		didHydrateRef.current = true;
		let cancelled = false;
		void (async () => {
			try {
				const base = getAmlCoreBaseUrl();
				const res = await fetch(
					`${base}/api/v1/chat/threads/${encodeURIComponent(threadId)}/messages`,
					{ headers: { Authorization: `Bearer ${jwt}` } },
				);
				if (!res.ok || cancelled) return;
				const data = (await res.json()) as {
					messages: JanbotUIMessage[];
				};
				if (data.messages?.length) {
					setMessages(data.messages);
				}
			} catch {
				// ignore
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [jwt, threadId, setMessages]);

	const startSleepTimer = useCallback(() => {
		if (sleepTimeoutRef.current) {
			clearTimeout(sleepTimeoutRef.current);
		}
		const interval = getRandomSleepInterval();
		sleepTimeoutRef.current = setTimeout(() => {
			setIsSleeping(true);
		}, interval);
	}, []);

	const wakeUp = useCallback(() => {
		setIsSleeping(false);
		startSleepTimer();
	}, [startSleepTimer]);

	useEffect(() => {
		startSleepTimer();
		return () => {
			if (sleepTimeoutRef.current) {
				clearTimeout(sleepTimeoutRef.current);
			}
		};
	}, [startSleepTimer]);

	useEffect(() => {
		if (isLoading || messages.length > 0) {
			if (isSleeping) {
				setIsSleeping(false);
			}
			startSleepTimer();
		}
	}, [isLoading, messages.length, isSleeping, startSleepTimer]);

	useEffect(() => {
		sessionStorage.setItem(CHAT_DRAWER_STORAGE_KEY, String(isOpen));
	}, [isOpen]);

	useEffect(() => {
		if (successTimeoutRef.current) {
			clearTimeout(successTimeoutRef.current);
			successTimeoutRef.current = null;
		}

		if (isSleeping) {
			setBotExpression("sleepy");
			return;
		}

		if (error) {
			setBotExpression("error");
		} else if (isLoading) {
			setBotExpression("thinking");
		} else if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === "assistant") {
				const hasText = lastMessage.parts.some(
					(p) =>
						p.type === "text" &&
						"text" in p &&
						(p as { text: string }).text?.length,
				);
				if (hasText) {
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

			let activeThreadId = threadId;
			if (!activeThreadId && jwt) {
				try {
					const base = getAmlCoreBaseUrl();
					const res = await fetch(`${base}/api/v1/chat/threads`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${jwt}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ model: selectedModel }),
					});
					if (res.ok) {
						const data = (await res.json()) as { id: string };
						activeThreadId = data.id;
						localStorage.setItem(JANBOT_THREAD_STORAGE_KEY, data.id);
						setThreadId(data.id);
					}
				} catch {
					// continue without persistence
				}
			}

			const lines: string[] = [];
			if (input.trim()) lines.push(input.trim());
			if (pendingFile) {
				const label =
					pendingFile.entityType === "CLIENT" ? "Clientes" : "Transacciones";
				lines.push(`[Archivo adjunto: ${pendingFile.file.name} (${label})]`);
			}
			const text = lines.join("\n\n") || " ";

			const metadata: JanbotMessageMetadata | undefined = pendingFile
				? {
						janovixAttachment: {
							name: pendingFile.file.name,
							entityType: pendingFile.entityType,
							size: pendingFile.file.size,
						},
					}
				: undefined;

			let fileUpload:
				| {
						fileName: string;
						entityType: "CLIENT" | "TRANSACTION";
						fileContent: string;
				  }
				| undefined;
			if (pendingFile && jwt) {
				fileUpload = {
					fileName: pendingFile.file.name,
					entityType: pendingFile.entityType,
					fileContent: await readFileAsBase64(pendingFile.file),
				};
			}

			setInput("");
			setPendingFile(null);

			await sendMessage(
				{ text, metadata },
				{
					body: {
						fileUpload,
						threadId: activeThreadId ?? undefined,
						organizationId: organizationId ?? undefined,
					},
				},
			);
		},
		[
			input,
			isLoading,
			pendingFile,
			jwt,
			sendMessage,
			threadId,
			selectedModel,
			organizationId,
		],
	);

	const reload = useCallback(() => {
		void regenerate();
	}, [regenerate]);

	const clearMessages = useCallback(() => {
		setMessages([]);
		clearError();
		didHydrateRef.current = false;
		if (typeof window !== "undefined") {
			localStorage.removeItem(JANBOT_THREAD_STORAGE_KEY);
		}
		setThreadId(null);
	}, [setMessages, clearError]);

	const openChat = useCallback(() => setIsOpen(true), []);
	const closeChat = useCallback(() => setIsOpen(false), []);
	const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

	const value: ChatContextValue = {
		messages,
		input,
		setInput,
		handleSubmit,
		isLoading,
		error: error ?? undefined,
		reload,
		stop,
		clearMessages,
		addToolApprovalResponse,
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

export function useModelInfo(model: LlmModel) {
	const config = MODEL_CONFIGS[model];
	return {
		displayName: config?.displayName ?? model,
		description: config?.description ?? "",
		provider: config?.provider ?? "unknown",
	};
}
