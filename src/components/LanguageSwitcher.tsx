"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect, useState } from "react";

const LANGUAGES = [
	{ code: "es" as const, label: "Español", flag: "🇲🇽" },
	{ code: "en" as const, label: "English", flag: "🇺🇸" },
];

export function LanguageSwitcher() {
	const { language, setLanguage, t } = useLanguage();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const currentLang =
		LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="rounded-full"
					aria-label={t("languageSpanish")}
				>
					<Languages className="h-[1.2rem] w-[1.2rem]" />
					<span className="sr-only">{currentLang.label}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{LANGUAGES.map((lang) => (
					<DropdownMenuItem
						key={lang.code}
						onClick={() => setLanguage(lang.code)}
						className={language === lang.code ? "bg-accent" : ""}
					>
						<span className="mr-2">{lang.flag}</span>
						{lang.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
