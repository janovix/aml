"use client";

/**
 * ChatMessages
 *
 * Displays the chat message history with user and assistant messages.
 * Uses react-markdown for proper markdown rendering in assistant responses.
 */

import { useEffect, useRef, memo } from "react";
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
} from "lucide-react";
import {
	useChats,
	type ChatMessage,
	type ChatAttachment,
} from "./ChatProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface ChatMessagesProps {
	className?: string;
}

export function ChatMessages({ className }: ChatMessagesProps) {
	const { messages, isLoading } = useChats();
	const { t } = useLanguage();
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

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
					<MessageBubble key={message.id} message={message} />
				))}
				{isLoading && (
					<div className="flex items-center gap-2 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-sm">Thinking...</span>
					</div>
				)}
				<div ref={scrollRef} />
			</div>
		</ScrollArea>
	);
}

interface MessageBubbleProps {
	message: ChatMessage;
}

/**
 * Markdown content renderer with proper styling
 */
const MarkdownContent = memo(function MarkdownContent({
	content,
}: {
	content: string;
}) {
	return (
		<ReactMarkdown
			components={{
				// Headings
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
				// Paragraphs
				p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
				// Bold and italic
				strong: ({ children }) => (
					<strong className="font-semibold">{children}</strong>
				),
				em: ({ children }) => <em className="italic">{children}</em>,
				// Lists
				ul: ({ children }) => (
					<ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
				),
				ol: ({ children }) => (
					<ol className="list-decimal list-inside mb-2 space-y-1">
						{children}
					</ol>
				),
				li: ({ children }) => <li className="ml-1">{children}</li>,
				// Code
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
				// Blockquote
				blockquote: ({ children }) => (
					<blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic">
						{children}
					</blockquote>
				),
				// Links
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
				// Horizontal rule
				hr: () => <hr className="my-3 border-border" />,
			}}
		>
			{content}
		</ReactMarkdown>
	);
});

/**
 * File attachment preview component
 */
function FileAttachmentPreview({
	attachment,
	isUser,
}: {
	attachment: ChatAttachment;
	isUser: boolean;
}) {
	const { t } = useLanguage();
	const isClient = attachment.entityType === "CLIENT";

	// Format file size
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
			{/* File icon with type indicator */}
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

			{/* File info */}
			<div className="flex flex-col min-w-0 flex-1">
				<span
					className={cn(
						"text-xs font-medium truncate",
						isUser ? "text-white" : "text-foreground",
					)}
				>
					{attachment.file.name}
				</span>
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"text-[10px]",
							isUser ? "text-white/80" : "text-muted-foreground",
						)}
					>
						{formatSize(attachment.file.size)}
					</span>
					<span
						className={cn(
							"text-[10px]",
							isUser ? "text-white/60" : "text-muted-foreground/50",
						)}
					>
						•
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
							{isClient ? t("chatImportClients") : t("chatImportTransactions")}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Extract clean message content without the attachment text
 */
function getCleanContent(content: string, hasAttachment: boolean): string {
	if (!hasAttachment) return content;

	// Remove the attachment text patterns in both Spanish and English
	const patterns = [
		/\[Archivo adjunto:.*?\]/gi,
		/\[Attached file:.*?\]/gi,
		/\n\n$/,
	];

	let cleanContent = content;
	for (const pattern of patterns) {
		cleanContent = cleanContent.replace(pattern, "").trim();
	}

	return cleanContent;
}

function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === "user";
	const hasAttachment = !!message.attachment;
	const cleanContent = getCleanContent(message.content, hasAttachment);
	const hasTextContent = cleanContent.length > 0;

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
				{/* File attachment (shown first for user messages) */}
				{hasAttachment && message.attachment && (
					<FileAttachmentPreview
						attachment={message.attachment}
						isUser={isUser}
					/>
				)}

				{/* Text content bubble */}
				{hasTextContent && (
					<div
						className={cn(
							"rounded-2xl px-4 py-2 text-sm",
							isUser
								? "bg-primary text-primary-foreground rounded-br-md"
								: "bg-muted rounded-bl-md",
						)}
					>
						{isUser ? (
							<div className="whitespace-pre-wrap">{cleanContent}</div>
						) : (
							<MarkdownContent content={message.content} />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
