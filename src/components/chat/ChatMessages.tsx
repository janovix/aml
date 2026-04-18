"use client";

/**
 * ChatMessages — renders UIMessage parts (text, reasoning, tools, sources).
 */

import { useEffect, useRef, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
	Bot,
	User,
	Loader2,
	FileSpreadsheet,
	Users,
	Receipt,
	ExternalLink,
} from "lucide-react";
import {
	useChats,
	type JanbotUIMessage,
	type JanbotMessageMetadata,
} from "./ChatProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolApprovalCard } from "./ToolApprovalCard";
import { ToolResultCard } from "./ToolResultCard";
import { isToolUIPart, isReasoningUIPart } from "ai";

interface ChatMessagesProps {
	className?: string;
}

const MarkdownContent = memo(function MarkdownContent({
	content,
}: {
	content: string;
}) {
	return (
		<ReactMarkdown
			components={{
				h1: ({ children }) => (
					<h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
				),
				h2: ({ children }) => (
					<h2 className="text-base font-bold mt-3 mb-2 first:mt-0">
						{children}
					</h2>
				),
				h3: ({ children }) => (
					<h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
				),
				p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
				strong: ({ children }) => (
					<strong className="font-semibold">{children}</strong>
				),
				em: ({ children }) => <em className="italic">{children}</em>,
				ul: ({ children }) => (
					<ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
				),
				ol: ({ children }) => (
					<ol className="list-decimal list-inside mb-2 space-y-1">
						{children}
					</ol>
				),
				li: ({ children }) => <li className="ml-1">{children}</li>,
				code: ({ className, children }) => {
					const isInline = !className;
					if (isInline) {
						return (
							<code className="px-1.5 py-0.5 rounded bg-background/50 text-xs font-mono">
								{children}
							</code>
						);
					}
					return (
						<code className="block p-3 rounded-lg bg-background/50 text-xs font-mono overflow-x-auto my-2">
							{children}
						</code>
					);
				},
				pre: ({ children }) => (
					<pre className="overflow-x-auto my-2">{children}</pre>
				),
				blockquote: ({ children }) => (
					<blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic">
						{children}
					</blockquote>
				),
				a: ({ href, children }) => (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2 hover:no-underline"
					>
						{children}
					</a>
				),
				hr: () => <hr className="my-3 border-border" />,
			}}
		>
			{content}
		</ReactMarkdown>
	);
});

function FileAttachmentPreviewFromMeta({
	meta,
	isUser,
}: {
	meta: NonNullable<JanbotMessageMetadata["janovixAttachment"]>;
	isUser: boolean;
}) {
	const { t } = useLanguage();
	const isClient = meta.entityType === "CLIENT";

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 p-2.5 rounded-xl",
				isUser
					? "bg-white/20 border border-white/30"
					: "bg-muted border border-border",
			)}
		>
			<div
				className={cn(
					"flex items-center justify-center h-10 w-10 rounded-lg shrink-0",
					isUser ? "bg-white/20" : "bg-background",
				)}
			>
				<FileSpreadsheet
					className={cn(
						"h-5 w-5",
						isUser ? "text-white" : "text-muted-foreground",
					)}
				/>
			</div>
			<div className="flex flex-col min-w-0 flex-1">
				<span
					className={cn(
						"text-xs font-medium truncate",
						isUser ? "text-white" : "text-foreground",
					)}
				>
					{meta.name}
				</span>
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"text-[10px]",
							isUser ? "text-white/80" : "text-muted-foreground",
						)}
					>
						{formatSize(meta.size)}
					</span>
					<div
						className={cn(
							"flex items-center gap-1 text-[10px]",
							isUser ? "text-white/80" : "text-muted-foreground",
						)}
					>
						{isClient ? (
							<Users className="h-2.5 w-2.5" />
						) : (
							<Receipt className="h-2.5 w-2.5" />
						)}
						<span>
							{isClient ? t("chatImportClients") : t("chatImportOperations")}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

type JanbotPart = JanbotUIMessage["parts"][number];

function getCleanUserText(parts: JanbotPart[]): string {
	const text = parts
		.filter((p): p is { type: "text"; text: string } => p.type === "text")
		.map((p) => p.text)
		.join("\n\n");
	return text
		.replace(/\[Archivo adjunto:.*?\]/gis, "")
		.replace(/\[Attached file:.*?\]/gis, "")
		.trim();
}

function ToolPartBlock({
	part,
	onApprove,
	onDeny,
}: {
	part: JanbotPart;
	onApprove: (id: string) => void;
	onDeny: (id: string) => void;
}) {
	if (!isToolUIPart(part)) return null;

	const name =
		part.type === "dynamic-tool"
			? ((part as { toolName?: string }).toolName ?? "tool")
			: part.type.replace(/^tool-/, "");

	if (
		part.state === "approval-requested" &&
		"approval" in part &&
		part.approval &&
		typeof part.approval === "object" &&
		"id" in part.approval
	) {
		const approvalId = String((part.approval as { id: string }).id);
		return (
			<ToolApprovalCard
				approvalId={approvalId}
				toolLabel={name}
				onApprove={onApprove}
				onDeny={onDeny}
			/>
		);
	}

	if (part.state === "output-available") {
		return <ToolResultCard toolName={name} output={part.output} />;
	}

	if (part.state === "output-error") {
		return (
			<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
				<div className="font-semibold">{name}</div>
				{part.errorText ?? "Tool error"}
			</div>
		);
	}

	return (
		<div className="text-xs text-muted-foreground italic">
			{name}: {part.state.replace(/-/g, " ")}
		</div>
	);
}

function MessageBubble({
	message,
	onApprove,
	onDeny,
}: {
	message: JanbotUIMessage;
	onApprove: (id: string) => void;
	onDeny: (id: string) => void;
}) {
	const isUser = message.role === "user";
	const meta = message.metadata?.janovixAttachment;
	const cleanUserText = isUser ? getCleanUserText(message.parts) : "";

	return (
		<div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
			<Avatar className="h-8 w-8 shrink-0">
				<AvatarFallback
					className={cn(
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground",
					)}
				>
					{isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
				</AvatarFallback>
			</Avatar>
			<div
				className={cn(
					"flex flex-col gap-2 max-w-[80%]",
					isUser ? "items-end" : "items-start",
				)}
			>
				{isUser && meta && (
					<FileAttachmentPreviewFromMeta meta={meta} isUser={isUser} />
				)}
				{isUser && cleanUserText.length > 0 && (
					<div
						className={cn(
							"rounded-2xl px-4 py-2 text-sm",
							"bg-primary text-primary-foreground rounded-br-md",
						)}
					>
						<div className="whitespace-pre-wrap">{cleanUserText}</div>
					</div>
				)}
				{!isUser &&
					message.parts.map((part, i) => {
						if (part.type === "text" && part.text) {
							return (
								<div
									key={`t-${i}`}
									className="rounded-2xl px-4 py-2 text-sm bg-muted rounded-bl-md"
								>
									<MarkdownContent content={part.text} />
								</div>
							);
						}
						if (isReasoningUIPart(part)) {
							return (
								<details
									key={`r-${i}`}
									className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-xs"
								>
									<summary className="cursor-pointer font-medium text-muted-foreground">
										Reasoning
									</summary>
									<pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-muted-foreground max-h-48 overflow-y-auto">
										{part.text}
									</pre>
								</details>
							);
						}
						if (part.type === "source-url") {
							return (
								<a
									key={`s-${i}`}
									href={part.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-xs text-primary underline"
								>
									<ExternalLink className="h-3 w-3" />
									{part.title ?? part.url}
								</a>
							);
						}
						if (isToolUIPart(part)) {
							return (
								<div key={`tool-${i}`} className="w-full max-w-lg">
									<ToolPartBlock
										part={part}
										onApprove={onApprove}
										onDeny={onDeny}
									/>
								</div>
							);
						}
						return null;
					})}
			</div>
		</div>
	);
}

export function ChatMessages({ className }: ChatMessagesProps) {
	const { messages, isLoading, addToolApprovalResponse } = useChats();
	const { t } = useLanguage();
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevMessageCountRef = useRef(0);
	const rafRef = useRef<number>(0);

	const scrollToBottom = useCallback((smooth: boolean) => {
		cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			const el = scrollRef.current;
			if (!el) return;
			const viewport = el.closest("[data-radix-scroll-area-viewport]");
			if (viewport) {
				if (smooth) {
					viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
				} else {
					viewport.scrollTop = viewport.scrollHeight;
				}
			} else {
				el.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
			}
		});
	}, []);

	useEffect(() => {
		const isNewMessage = messages.length !== prevMessageCountRef.current;
		prevMessageCountRef.current = messages.length;

		if (isNewMessage) {
			scrollToBottom(true);
		} else if (isLoading) {
			scrollToBottom(false);
		}
	}, [messages, isLoading, scrollToBottom]);

	useEffect(() => {
		return () => cancelAnimationFrame(rafRef.current);
	}, []);

	const onApprove = useCallback(
		(id: string) => {
			void addToolApprovalResponse({ id, approved: true });
		},
		[addToolApprovalResponse],
	);

	const onDeny = useCallback(
		(id: string) => {
			void addToolApprovalResponse({
				id,
				approved: false,
				reason: "User denied",
			});
		},
		[addToolApprovalResponse],
	);

	if (messages.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center h-full text-center p-6",
					className,
				)}
			>
				<Bot className="h-12 w-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold mb-2">{t("chatAssistant")}</h3>
				<p className="text-sm text-muted-foreground max-w-sm">
					{t("chatEmptyDescription")}
				</p>
			</div>
		);
	}

	return (
		<ScrollArea className={cn("flex-1", className)}>
			<div className="flex flex-col gap-4 p-4 pr-5">
				{messages.map((message) => (
					<MessageBubble
						key={message.id}
						message={message}
						onApprove={onApprove}
						onDeny={onDeny}
					/>
				))}
				{isLoading && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-sm">{t("chatThinking")}</span>
					</div>
				)}
				<div ref={scrollRef} />
			</div>
		</ScrollArea>
	);
}
