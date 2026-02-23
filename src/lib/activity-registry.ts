"use client";

import {
	Dice5,
	CreditCard,
	Wallet,
	Gift,
	Receipt,
	HandCoins,
	Building2,
	HardHat,
	Gem,
	Palette,
	Car,
	ShieldPlus,
	Truck,
	Briefcase,
	Landmark,
	Stamp,
	Heart,
	KeyRound,
	Bitcoin,
	type LucideIcon,
} from "lucide-react";
import type { ActivityCode } from "@/types/operation";

// --- Color token set for each activity (light/dark compliant) ---

export interface ActivityColorTokens {
	border: string;
	borderSelected: string;
	background: string;
	backgroundSelected: string;
	icon: string;
	iconSelected: string;
	ring: string;
	focusRing: string;
	checkBg: string;
	/** For badge pill background */
	badgeBg: string;
	/** For badge pill text */
	badgeText: string;
}

/**
 * Static color maps for each activity.
 *
 * IMPORTANT: Tailwind class names MUST be written as complete string literals
 * (not template interpolations) so the content scanner can detect them.
 */
const COLOR_MAP: Record<string, ActivityColorTokens> = {
	orange: {
		border: "border-orange-200 dark:border-orange-800",
		borderSelected: "border-orange-400 dark:border-orange-500",
		background: "bg-card dark:bg-orange-950/30",
		backgroundSelected: "bg-orange-50 dark:bg-orange-900/50",
		icon: "text-orange-400 dark:text-orange-500",
		iconSelected: "text-orange-500 dark:text-orange-400",
		ring: "ring-orange-400/30 dark:ring-orange-500/30",
		focusRing:
			"focus-visible:ring-orange-400/30 dark:focus-visible:ring-orange-500/30",
		checkBg: "bg-orange-500",
		badgeBg: "bg-orange-50 dark:bg-orange-900/50",
		badgeText: "text-orange-700 dark:text-orange-300",
	},
	fuchsia: {
		border: "border-fuchsia-200 dark:border-fuchsia-800",
		borderSelected: "border-fuchsia-400 dark:border-fuchsia-500",
		background: "bg-card dark:bg-fuchsia-950/30",
		backgroundSelected: "bg-fuchsia-50 dark:bg-fuchsia-900/50",
		icon: "text-fuchsia-400 dark:text-fuchsia-500",
		iconSelected: "text-fuchsia-500 dark:text-fuchsia-400",
		ring: "ring-fuchsia-400/30 dark:ring-fuchsia-500/30",
		focusRing:
			"focus-visible:ring-fuchsia-400/30 dark:focus-visible:ring-fuchsia-500/30",
		checkBg: "bg-fuchsia-500",
		badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-900/50",
		badgeText: "text-fuchsia-700 dark:text-fuchsia-300",
	},
	lime: {
		border: "border-lime-200 dark:border-lime-800",
		borderSelected: "border-lime-400 dark:border-lime-500",
		background: "bg-card dark:bg-lime-950/30",
		backgroundSelected: "bg-lime-50 dark:bg-lime-900/50",
		icon: "text-lime-400 dark:text-lime-500",
		iconSelected: "text-lime-500 dark:text-lime-400",
		ring: "ring-lime-400/30 dark:ring-lime-500/30",
		focusRing:
			"focus-visible:ring-lime-400/30 dark:focus-visible:ring-lime-500/30",
		checkBg: "bg-lime-500",
		badgeBg: "bg-lime-50 dark:bg-lime-900/50",
		badgeText: "text-lime-700 dark:text-lime-300",
	},
	yellow: {
		border: "border-yellow-200 dark:border-yellow-800",
		borderSelected: "border-yellow-400 dark:border-yellow-500",
		background: "bg-card dark:bg-yellow-950/30",
		backgroundSelected: "bg-yellow-50 dark:bg-yellow-900/50",
		icon: "text-yellow-400 dark:text-yellow-500",
		iconSelected: "text-yellow-500 dark:text-yellow-400",
		ring: "ring-yellow-400/30 dark:ring-yellow-500/30",
		focusRing:
			"focus-visible:ring-yellow-400/30 dark:focus-visible:ring-yellow-500/30",
		checkBg: "bg-yellow-500",
		badgeBg: "bg-yellow-50 dark:bg-yellow-900/50",
		badgeText: "text-yellow-700 dark:text-yellow-300",
	},
	cyan: {
		border: "border-cyan-200 dark:border-cyan-800",
		borderSelected: "border-cyan-400 dark:border-cyan-500",
		background: "bg-card dark:bg-cyan-950/30",
		backgroundSelected: "bg-cyan-50 dark:bg-cyan-900/50",
		icon: "text-cyan-400 dark:text-cyan-500",
		iconSelected: "text-cyan-500 dark:text-cyan-400",
		ring: "ring-cyan-400/30 dark:ring-cyan-500/30",
		focusRing:
			"focus-visible:ring-cyan-400/30 dark:focus-visible:ring-cyan-500/30",
		checkBg: "bg-cyan-500",
		badgeBg: "bg-cyan-50 dark:bg-cyan-900/50",
		badgeText: "text-cyan-700 dark:text-cyan-300",
	},
	amber: {
		border: "border-amber-200 dark:border-amber-800",
		borderSelected: "border-amber-400 dark:border-amber-500",
		background: "bg-card dark:bg-amber-950/30",
		backgroundSelected: "bg-amber-50 dark:bg-amber-900/50",
		icon: "text-amber-400 dark:text-amber-500",
		iconSelected: "text-amber-500 dark:text-amber-400",
		ring: "ring-amber-400/30 dark:ring-amber-500/30",
		focusRing:
			"focus-visible:ring-amber-400/30 dark:focus-visible:ring-amber-500/30",
		checkBg: "bg-amber-500",
		badgeBg: "bg-amber-50 dark:bg-amber-900/50",
		badgeText: "text-amber-700 dark:text-amber-300",
	},
	emerald: {
		border: "border-emerald-200 dark:border-emerald-800",
		borderSelected: "border-emerald-400 dark:border-emerald-500",
		background: "bg-card dark:bg-emerald-950/30",
		backgroundSelected: "bg-emerald-50 dark:bg-emerald-900/50",
		icon: "text-emerald-400 dark:text-emerald-500",
		iconSelected: "text-emerald-500 dark:text-emerald-400",
		ring: "ring-emerald-400/30 dark:ring-emerald-500/30",
		focusRing:
			"focus-visible:ring-emerald-400/30 dark:focus-visible:ring-emerald-500/30",
		checkBg: "bg-emerald-500",
		badgeBg: "bg-emerald-50 dark:bg-emerald-900/50",
		badgeText: "text-emerald-700 dark:text-emerald-300",
	},
	green: {
		border: "border-green-200 dark:border-green-800",
		borderSelected: "border-green-400 dark:border-green-500",
		background: "bg-card dark:bg-green-950/30",
		backgroundSelected: "bg-green-50 dark:bg-green-900/50",
		icon: "text-green-400 dark:text-green-500",
		iconSelected: "text-green-500 dark:text-green-400",
		ring: "ring-green-400/30 dark:ring-green-500/30",
		focusRing:
			"focus-visible:ring-green-400/30 dark:focus-visible:ring-green-500/30",
		checkBg: "bg-green-500",
		badgeBg: "bg-green-50 dark:bg-green-900/50",
		badgeText: "text-green-700 dark:text-green-300",
	},
	rose: {
		border: "border-rose-200 dark:border-rose-800",
		borderSelected: "border-rose-400 dark:border-rose-500",
		background: "bg-card dark:bg-rose-950/30",
		backgroundSelected: "bg-rose-50 dark:bg-rose-900/50",
		icon: "text-rose-400 dark:text-rose-500",
		iconSelected: "text-rose-500 dark:text-rose-400",
		ring: "ring-rose-400/30 dark:ring-rose-500/30",
		focusRing:
			"focus-visible:ring-rose-400/30 dark:focus-visible:ring-rose-500/30",
		checkBg: "bg-rose-500",
		badgeBg: "bg-rose-50 dark:bg-rose-900/50",
		badgeText: "text-rose-700 dark:text-rose-300",
	},
	red: {
		border: "border-red-200 dark:border-red-800",
		borderSelected: "border-red-400 dark:border-red-500",
		background: "bg-card dark:bg-red-950/30",
		backgroundSelected: "bg-red-50 dark:bg-red-900/50",
		icon: "text-red-400 dark:text-red-500",
		iconSelected: "text-red-500 dark:text-red-400",
		ring: "ring-red-400/30 dark:ring-red-500/30",
		focusRing:
			"focus-visible:ring-red-400/30 dark:focus-visible:ring-red-500/30",
		checkBg: "bg-red-500",
		badgeBg: "bg-red-50 dark:bg-red-900/50",
		badgeText: "text-red-700 dark:text-red-300",
	},
	sky: {
		border: "border-sky-200 dark:border-sky-800",
		borderSelected: "border-sky-400 dark:border-sky-500",
		background: "bg-card dark:bg-sky-950/30",
		backgroundSelected: "bg-sky-50 dark:bg-sky-900/50",
		icon: "text-sky-400 dark:text-sky-500",
		iconSelected: "text-sky-500 dark:text-sky-400",
		ring: "ring-sky-400/30 dark:ring-sky-500/30",
		focusRing:
			"focus-visible:ring-sky-400/30 dark:focus-visible:ring-sky-500/30",
		checkBg: "bg-sky-500",
		badgeBg: "bg-sky-50 dark:bg-sky-900/50",
		badgeText: "text-sky-700 dark:text-sky-300",
	},
	slate: {
		border: "border-slate-200 dark:border-slate-800",
		borderSelected: "border-slate-400 dark:border-slate-500",
		background: "bg-card dark:bg-slate-950/30",
		backgroundSelected: "bg-slate-50 dark:bg-slate-900/50",
		icon: "text-slate-400 dark:text-slate-500",
		iconSelected: "text-slate-500 dark:text-slate-400",
		ring: "ring-slate-400/30 dark:ring-slate-500/30",
		focusRing:
			"focus-visible:ring-slate-400/30 dark:focus-visible:ring-slate-500/30",
		checkBg: "bg-slate-500",
		badgeBg: "bg-slate-50 dark:bg-slate-900/50",
		badgeText: "text-slate-700 dark:text-slate-300",
	},
	stone: {
		border: "border-stone-200 dark:border-stone-800",
		borderSelected: "border-stone-400 dark:border-stone-500",
		background: "bg-card dark:bg-stone-950/30",
		backgroundSelected: "bg-stone-50 dark:bg-stone-900/50",
		icon: "text-stone-400 dark:text-stone-500",
		iconSelected: "text-stone-500 dark:text-stone-400",
		ring: "ring-stone-400/30 dark:ring-stone-500/30",
		focusRing:
			"focus-visible:ring-stone-400/30 dark:focus-visible:ring-stone-500/30",
		checkBg: "bg-stone-500",
		badgeBg: "bg-stone-50 dark:bg-stone-900/50",
		badgeText: "text-stone-700 dark:text-stone-300",
	},
	blue: {
		border: "border-blue-200 dark:border-blue-800",
		borderSelected: "border-blue-400 dark:border-blue-500",
		background: "bg-card dark:bg-blue-950/30",
		backgroundSelected: "bg-blue-50 dark:bg-blue-900/50",
		icon: "text-blue-400 dark:text-blue-500",
		iconSelected: "text-blue-500 dark:text-blue-400",
		ring: "ring-blue-400/30 dark:ring-blue-500/30",
		focusRing:
			"focus-visible:ring-blue-400/30 dark:focus-visible:ring-blue-500/30",
		checkBg: "bg-blue-500",
		badgeBg: "bg-blue-50 dark:bg-blue-900/50",
		badgeText: "text-blue-700 dark:text-blue-300",
	},
	indigo: {
		border: "border-indigo-200 dark:border-indigo-800",
		borderSelected: "border-indigo-400 dark:border-indigo-500",
		background: "bg-card dark:bg-indigo-950/30",
		backgroundSelected: "bg-indigo-50 dark:bg-indigo-900/50",
		icon: "text-indigo-400 dark:text-indigo-500",
		iconSelected: "text-indigo-500 dark:text-indigo-400",
		ring: "ring-indigo-400/30 dark:ring-indigo-500/30",
		focusRing:
			"focus-visible:ring-indigo-400/30 dark:focus-visible:ring-indigo-500/30",
		checkBg: "bg-indigo-500",
		badgeBg: "bg-indigo-50 dark:bg-indigo-900/50",
		badgeText: "text-indigo-700 dark:text-indigo-300",
	},
	purple: {
		border: "border-purple-200 dark:border-purple-800",
		borderSelected: "border-purple-400 dark:border-purple-500",
		background: "bg-card dark:bg-purple-950/30",
		backgroundSelected: "bg-purple-50 dark:bg-purple-900/50",
		icon: "text-purple-400 dark:text-purple-500",
		iconSelected: "text-purple-500 dark:text-purple-400",
		ring: "ring-purple-400/30 dark:ring-purple-500/30",
		focusRing:
			"focus-visible:ring-purple-400/30 dark:focus-visible:ring-purple-500/30",
		checkBg: "bg-purple-500",
		badgeBg: "bg-purple-50 dark:bg-purple-900/50",
		badgeText: "text-purple-700 dark:text-purple-300",
	},
	pink: {
		border: "border-pink-200 dark:border-pink-800",
		borderSelected: "border-pink-400 dark:border-pink-500",
		background: "bg-card dark:bg-pink-950/30",
		backgroundSelected: "bg-pink-50 dark:bg-pink-900/50",
		icon: "text-pink-400 dark:text-pink-500",
		iconSelected: "text-pink-500 dark:text-pink-400",
		ring: "ring-pink-400/30 dark:ring-pink-500/30",
		focusRing:
			"focus-visible:ring-pink-400/30 dark:focus-visible:ring-pink-500/30",
		checkBg: "bg-pink-500",
		badgeBg: "bg-pink-50 dark:bg-pink-900/50",
		badgeText: "text-pink-700 dark:text-pink-300",
	},
	teal: {
		border: "border-teal-200 dark:border-teal-800",
		borderSelected: "border-teal-400 dark:border-teal-500",
		background: "bg-card dark:bg-teal-950/30",
		backgroundSelected: "bg-teal-50 dark:bg-teal-900/50",
		icon: "text-teal-400 dark:text-teal-500",
		iconSelected: "text-teal-500 dark:text-teal-400",
		ring: "ring-teal-400/30 dark:ring-teal-500/30",
		focusRing:
			"focus-visible:ring-teal-400/30 dark:focus-visible:ring-teal-500/30",
		checkBg: "bg-teal-500",
		badgeBg: "bg-teal-50 dark:bg-teal-900/50",
		badgeText: "text-teal-700 dark:text-teal-300",
	},
	violet: {
		border: "border-violet-200 dark:border-violet-800",
		borderSelected: "border-violet-400 dark:border-violet-500",
		background: "bg-card dark:bg-violet-950/30",
		backgroundSelected: "bg-violet-50 dark:bg-violet-900/50",
		icon: "text-violet-400 dark:text-violet-500",
		iconSelected: "text-violet-500 dark:text-violet-400",
		ring: "ring-violet-400/30 dark:ring-violet-500/30",
		focusRing:
			"focus-visible:ring-violet-400/30 dark:focus-visible:ring-violet-500/30",
		checkBg: "bg-violet-500",
		badgeBg: "bg-violet-50 dark:bg-violet-900/50",
		badgeText: "text-violet-700 dark:text-violet-300",
	},
};

function getColors(color: string): ActivityColorTokens {
	return COLOR_MAP[color];
}

// --- Activity visual config ---

export interface ActivityVisual {
	code: ActivityCode;
	icon: LucideIcon;
	color: ActivityColorTokens;
	label: string;
	shortLabel: string;
	lfpiropiFraccion: string;
	identificationThresholdUma: number | "ALWAYS";
	noticeThresholdUma: number | "ALWAYS";
	disabled?: boolean;
	disabledReason?: string;
}

// --- Registry ---

const ACTIVITY_VISUALS: Record<ActivityCode, ActivityVisual> = {
	JYS: {
		code: "JYS",
		icon: Dice5,
		color: getColors("orange"),
		label: "Juegos con apuesta, concursos y sorteos",
		shortLabel: "Juegos y sorteos",
		lfpiropiFraccion: "I",
		identificationThresholdUma: 325,
		noticeThresholdUma: 645,
	},
	TSC: {
		code: "TSC",
		icon: CreditCard,
		color: getColors("fuchsia"),
		label: "Tarjetas de crédito o de servicios",
		shortLabel: "Tarjetas de crédito",
		lfpiropiFraccion: "II-a",
		identificationThresholdUma: 805,
		noticeThresholdUma: 1285,
	},
	TPP: {
		code: "TPP",
		icon: Wallet,
		color: getColors("lime"),
		label: "Tarjetas prepagadas",
		shortLabel: "Prepagadas",
		lfpiropiFraccion: "II-b,c",
		identificationThresholdUma: 645,
		noticeThresholdUma: 645,
	},
	TDR: {
		code: "TDR",
		icon: Gift,
		color: getColors("yellow"),
		label: "Vales, cupones, monederos electrónicos",
		shortLabel: "Monederos/vales",
		lfpiropiFraccion: "II-c",
		identificationThresholdUma: 645,
		noticeThresholdUma: 645,
	},
	CHV: {
		code: "CHV",
		icon: Receipt,
		color: getColors("cyan"),
		label: "Cheques de viajero",
		shortLabel: "Cheques viajero",
		lfpiropiFraccion: "III",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 645,
	},
	MPC: {
		code: "MPC",
		icon: HandCoins,
		color: getColors("amber"),
		label: "Préstamos o créditos, con o sin garantía",
		shortLabel: "Préstamos",
		lfpiropiFraccion: "IV",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 1605,
	},
	INM: {
		code: "INM",
		icon: Building2,
		color: getColors("emerald"),
		label: "Comercialización de bienes inmuebles",
		shortLabel: "Inmuebles",
		lfpiropiFraccion: "V",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 8025,
	},
	DIN: {
		code: "DIN",
		icon: HardHat,
		color: getColors("green"),
		label: "Desarrollo inmobiliario",
		shortLabel: "Desarrollo inmob.",
		lfpiropiFraccion: "V Bis",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 8025,
	},
	MJR: {
		code: "MJR",
		icon: Gem,
		color: getColors("rose"),
		label: "Piedras preciosas, joyas, metales y relojes",
		shortLabel: "Joyería/metales",
		lfpiropiFraccion: "VI",
		identificationThresholdUma: 805,
		noticeThresholdUma: 1605,
	},
	OBA: {
		code: "OBA",
		icon: Palette,
		color: getColors("red"),
		label: "Subasta y comercialización de obras de arte",
		shortLabel: "Obras de arte",
		lfpiropiFraccion: "VII",
		identificationThresholdUma: 2410,
		noticeThresholdUma: 4815,
	},
	VEH: {
		code: "VEH",
		icon: Car,
		color: getColors("sky"),
		label: "Distribución y comercialización de vehículos",
		shortLabel: "Vehículos",
		lfpiropiFraccion: "VIII",
		identificationThresholdUma: 3210,
		noticeThresholdUma: 6420,
	},
	BLI: {
		code: "BLI",
		icon: ShieldPlus,
		color: getColors("slate"),
		label: "Servicios de blindaje",
		shortLabel: "Blindaje",
		lfpiropiFraccion: "IX",
		identificationThresholdUma: 2410,
		noticeThresholdUma: 4815,
	},
	TCV: {
		code: "TCV",
		icon: Truck,
		color: getColors("stone"),
		label: "Traslado y custodia de dinero o valores",
		shortLabel: "Custodia/traslado",
		lfpiropiFraccion: "X",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 3210,
	},
	SPR: {
		code: "SPR",
		icon: Briefcase,
		color: getColors("blue"),
		label: "Servicios profesionales independientes",
		shortLabel: "Serv. profesionales",
		lfpiropiFraccion: "XI",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: "ALWAYS",
	},
	FEP: {
		code: "FEP",
		icon: Landmark,
		color: getColors("indigo"),
		label: "Fe pública - Notarios",
		shortLabel: "Notarios",
		lfpiropiFraccion: "XII-A",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: "ALWAYS",
	},
	FES: {
		code: "FES",
		icon: Stamp,
		color: getColors("purple"),
		label: "Fe pública - Corredores",
		shortLabel: "Corredores",
		lfpiropiFraccion: "XII-B",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: "ALWAYS",
		disabled: true,
		disabledReason: "No SAT XSD schema available for notice submission",
	},
	DON: {
		code: "DON",
		icon: Heart,
		color: getColors("pink"),
		label: "Recepción de donativos",
		shortLabel: "Donativos",
		lfpiropiFraccion: "XIII",
		identificationThresholdUma: 1605,
		noticeThresholdUma: 3210,
	},
	ARI: {
		code: "ARI",
		icon: KeyRound,
		color: getColors("teal"),
		label: "Derechos personales de uso o goce de bienes inmuebles",
		shortLabel: "Arrendamiento",
		lfpiropiFraccion: "XV",
		identificationThresholdUma: 1605,
		noticeThresholdUma: 3210,
	},
	AVI: {
		code: "AVI",
		icon: Bitcoin,
		color: getColors("violet"),
		label: "Operaciones con activos virtuales",
		shortLabel: "Activos virtuales",
		lfpiropiFraccion: "XVI",
		identificationThresholdUma: "ALWAYS",
		noticeThresholdUma: 210,
	},
};

// --- Public API ---

/** Get the visual config for an activity code */
export function getActivityVisual(code: ActivityCode): ActivityVisual {
	return ACTIVITY_VISUALS[code];
}

/** Get all activity visuals as an array */
export function getAllActivityVisuals(): ActivityVisual[] {
	return Object.values(ACTIVITY_VISUALS);
}

/** Get only enabled (non-disabled) activity visuals */
export function getEnabledActivityVisuals(): ActivityVisual[] {
	return Object.values(ACTIVITY_VISUALS).filter((v) => !v.disabled);
}

// --- Threshold helpers ---

export interface ThresholdStatus {
	exceedsIdentification: boolean;
	exceedsNotice: boolean;
	identificationMxn: number | null;
	noticeMxn: number | null;
}

/**
 * Compute whether an operation amount exceeds the LFPIORPI thresholds.
 * @param code - The activity code
 * @param amountMxn - The operation amount in MXN
 * @param umaValue - The daily UMA value in MXN
 * @returns Threshold status with MXN equivalents
 */
export function getThresholdStatus(
	code: ActivityCode,
	amountMxn: number,
	umaValue: number,
): ThresholdStatus {
	const visual = ACTIVITY_VISUALS[code];

	const identificationMxn =
		visual.identificationThresholdUma === "ALWAYS"
			? null
			: visual.identificationThresholdUma * umaValue;

	const noticeMxn =
		visual.noticeThresholdUma === "ALWAYS"
			? null
			: visual.noticeThresholdUma * umaValue;

	return {
		exceedsIdentification:
			visual.identificationThresholdUma === "ALWAYS" ||
			amountMxn >= (identificationMxn ?? 0),
		exceedsNotice:
			visual.noticeThresholdUma === "ALWAYS" || amountMxn >= (noticeMxn ?? 0),
		identificationMxn,
		noticeMxn,
	};
}
