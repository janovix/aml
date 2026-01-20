"use client";

/**
 * ChatDrawer
 *
 * Sidebar drawer component for the AI chat interface.
 */

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Bot, X, Trash2 } from "lucide-react";
import { useChats } from "./ChatProvider";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
// TODO: Enable when auth-svc billing is implemented
// import { ChatUsageDisplay } from "./ChatUsageDisplay";
import { useLanguage } from "@/components/LanguageProvider";

interface ChatDrawerProps {
	className?: string;
}

export function ChatDrawer({ className }: ChatDrawerProps) {
	const { isOpen, closeChat, messages, clearMessages } = useChats();
	const { t } = useLanguage();

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
			<SheetContent
				side="right"
				className={cn(
					"w-full sm:w-[440px] sm:max-w-[440px] p-0 flex flex-col",
					className,
				)}
			>
				<SheetHeader className="px-4 py-3 border-b shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
								<Bot className="h-4 w-4 text-primary" />
							</div>
							<div>
								<SheetTitle className="text-base">{t("chatTitle")}</SheetTitle>
								<SheetDescription className="text-xs">
									{t("chatSubtitle")}
								</SheetDescription>
							</div>
						</div>
						<div className="flex items-center gap-1">
							{messages.length > 0 && (
								<Button
									variant="ghost"
									size="icon"
									onClick={clearMessages}
									className="h-8 w-8"
									title={t("chatClear")}
								>
									<Trash2 className="h-4 w-4" />
									<span className="sr-only">{t("chatClear")}</span>
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								onClick={closeChat}
								className="h-8 w-8"
							>
								<X className="h-4 w-4" />
								<span className="sr-only">{t("chatClose")}</span>
							</Button>
						</div>
					</div>
				</SheetHeader>

				{/* Model selector and usage */}
				<div className="px-4 py-2 border-b shrink-0 space-y-2">
					<ModelSelector className="w-full" />
					{/* TODO: Usage display - enable when auth-svc billing is implemented */}
					{/* <ChatUsageDisplay /> */}
				</div>

				{/* Messages area */}
				<ChatMessages className="flex-1 min-h-0" />

				<Separator />

				{/* Input area */}
				<ChatInput className="shrink-0" />
			</SheetContent>
		</Sheet>
	);
}
