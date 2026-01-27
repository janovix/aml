"use client";

import * as React from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * NavbarClock - A compact, beautiful clock component for navigation bars
 *
 * @description
 * Displays current time with toggleable 12h/24h format,
 * and timezone mismatch warnings when the user's local timezone differs from the org timezone.
 */

type TimeFormat = "12h" | "24h";
type ClockSize = "sm" | "md" | "lg";

interface NavbarClockProps {
	defaultFormat?: TimeFormat;
	onFormatChange?: (format: TimeFormat) => void;
	showSeconds?: boolean;
	showDate?: boolean;
	size?: ClockSize;
	className?: string;
	timezone?: string; // IANA timezone (e.g., "America/New_York")
	showTimezoneMismatch?: boolean; // Show warning when user's timezone differs
	timezoneLabel?: string; // Optional label to show (e.g., "NYC", "HQ")
	showIcon?: boolean; // Show clock icon (default: true)
}

const sizeConfig = {
	sm: {
		container: "gap-1.5 px-2 py-1",
		time: "text-xs font-medium",
		date: "text-[10px]",
		icon: "w-3.5 h-3.5",
	},
	md: {
		container: "gap-2 px-3 py-1.5",
		time: "text-sm font-semibold",
		date: "text-[11px]",
		icon: "w-4 h-4",
	},
	lg: {
		container: "gap-3 px-4 py-2",
		time: "text-base font-semibold",
		date: "text-xs",
		icon: "w-5 h-5",
	},
};

function getUserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function isTimezoneMismatch(userTz: string, orgTz: string): boolean {
	if (!orgTz) return false;
	// Compare the actual UTC offsets at the current time
	const now = new Date();
	const userOffset = getTimezoneOffset(now, userTz);
	const orgOffset = getTimezoneOffset(now, orgTz);
	return userOffset !== orgOffset;
}

function getTimezoneOffset(date: Date, timezone: string): number {
	try {
		const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
		const tzDate = new Date(
			date.toLocaleString("en-US", { timeZone: timezone }),
		);
		return (tzDate.getTime() - utcDate.getTime()) / 60000;
	} catch {
		return 0;
	}
}

function getTimeInTimezone(
	date: Date,
	timezone: string,
): { hours: number; minutes: number; seconds: number } {
	try {
		const options: Intl.DateTimeFormatOptions = {
			timeZone: timezone,
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			hour12: false,
		};
		const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
		const hours = Number.parseInt(
			parts.find((p) => p.type === "hour")?.value || "0",
		);
		const minutes = Number.parseInt(
			parts.find((p) => p.type === "minute")?.value || "0",
		);
		const seconds = Number.parseInt(
			parts.find((p) => p.type === "second")?.value || "0",
		);
		return { hours, minutes, seconds };
	} catch {
		return {
			hours: date.getHours(),
			minutes: date.getMinutes(),
			seconds: date.getSeconds(),
		};
	}
}

function formatTimezoneDiff(userTz: string, orgTz: string): string {
	try {
		const now = new Date();
		const userOffset = getTimezoneOffset(now, userTz);
		const orgOffset = getTimezoneOffset(now, orgTz);
		const diffMinutes = orgOffset - userOffset;
		const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
		const diffMins = Math.abs(diffMinutes) % 60;
		const sign = diffMinutes >= 0 ? "+" : "-";
		if (diffMins === 0) {
			return `${sign}${diffHours}h`;
		}
		return `${sign}${diffHours}h ${diffMins}m`;
	} catch {
		return "";
	}
}

function formatTimezoneShort(iana: string): string {
	// Extract city name from IANA identifier (e.g., "America/New_York" -> "New York")
	const city = iana.split("/").pop()?.replace(/_/g, " ") || iana;
	return city;
}

export function NavbarClock({
	defaultFormat = "12h",
	onFormatChange,
	showSeconds = false,
	showDate = false,
	size = "md",
	className,
	timezone,
	showTimezoneMismatch = true,
	timezoneLabel,
	showIcon = true,
}: NavbarClockProps) {
	const { t } = useLanguage();
	const [format, setInternalFormat] = React.useState<TimeFormat>(defaultFormat);
	const [time, setTime] = React.useState(new Date());
	const [userTimezone, setUserTimezone] = React.useState<string>("");

	const setFormat = (newFormat: TimeFormat) => {
		setInternalFormat(newFormat);
		onFormatChange?.(newFormat);
	};

	React.useEffect(() => {
		setUserTimezone(getUserTimezone());
		const interval = setInterval(() => {
			setTime(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const { hours, minutes, seconds } = React.useMemo(() => {
		if (timezone) {
			return getTimeInTimezone(time, timezone);
		}
		return {
			hours: time.getHours(),
			minutes: time.getMinutes(),
			seconds: time.getSeconds(),
		};
	}, [time, timezone]);

	const hasMismatch = React.useMemo(() => {
		if (!timezone || !userTimezone || !showTimezoneMismatch) return false;
		return isTimezoneMismatch(userTimezone, timezone);
	}, [timezone, userTimezone, showTimezoneMismatch]);

	const timezoneDiff = React.useMemo(() => {
		if (!timezone || !userTimezone) return "";
		return formatTimezoneDiff(userTimezone, timezone);
	}, [timezone, userTimezone]);

	const styles = sizeConfig[size];

	const formatTime = () => {
		if (format === "24h") {
			const h = hours.toString().padStart(2, "0");
			const m = minutes.toString().padStart(2, "0");
			const s = seconds.toString().padStart(2, "0");
			return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
		} else {
			const h = hours % 12 || 12;
			const m = minutes.toString().padStart(2, "0");
			const s = seconds.toString().padStart(2, "0");
			const period = hours >= 12 ? "PM" : "AM";
			return showSeconds ? `${h}:${m}:${s} ${period}` : `${h}:${m} ${period}`;
		}
	};

	const formatDateStr = () => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: "short",
			month: "short",
			day: "numeric",
			...(timezone && { timeZone: timezone }),
		};
		return time.toLocaleDateString(undefined, options);
	};

	const toggleFormat = () => {
		setFormat(format === "12h" ? "24h" : "12h");
	};

	// Only show timezone difference label when there's a mismatch
	const displayLabel = hasMismatch ? timezoneDiff : null;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<div
					className={cn(
						"inline-flex items-center rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-all cursor-pointer select-none active:scale-[0.97]",
						styles.container,
						className,
					)}
					title={t("clockClickForInfo")}
				>
					{showIcon && (
						<Clock className={cn(styles.icon, "text-muted-foreground")} />
					)}

					{displayLabel && (
						<span
							className={cn(styles.time, "text-muted-foreground font-medium")}
						>
							{displayLabel}
						</span>
					)}
				</div>
			</PopoverTrigger>

			<PopoverContent side="bottom" align="end" className="w-64 p-3">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h4 className="font-semibold text-sm">{t("clockTimezoneInfo")}</h4>
						<button
							type="button"
							onClick={toggleFormat}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							{t("clockSwitchTo")} {format === "12h" ? "24h" : "12h"}
						</button>
					</div>

					<div className="space-y-2 text-sm">
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">
								{t("clockCurrentTime")}:
							</span>
							<span className="font-semibold text-base tabular-nums">
								{formatTime()}
							</span>
						</div>

						<div className="border-t border-border my-2" />
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">
								{t("clockAppTimezone")}:
							</span>
							<span className="font-medium">
								{timezoneLabel ||
									(timezone && formatTimezoneShort(timezone)) ||
									t("clockLocal")}
							</span>
						</div>

						{timezone && (
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">IANA:</span>
								<span className="font-mono text-xs">{timezone}</span>
							</div>
						)}

						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">
								{t("clockYourTimezone")}:
							</span>
							<span className="font-medium">
								{userTimezone
									? formatTimezoneShort(userTimezone)
									: t("clockDetecting")}
							</span>
						</div>

						{hasMismatch && (
							<>
								<div className="border-t border-border my-2" />
								<div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
									<AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
									<div className="text-xs">
										<p className="font-medium text-amber-600 dark:text-amber-400">
											{t("clockTimezoneMismatch")}
										</p>
										<p className="text-muted-foreground">
											{t("clockDifference")}: {timezoneDiff}
										</p>
									</div>
								</div>
							</>
						)}

						{!hasMismatch && timezone && (
							<div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<p className="text-xs text-green-600 dark:text-green-400">
									{t("clockTimezonesMatch")}
								</p>
							</div>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
