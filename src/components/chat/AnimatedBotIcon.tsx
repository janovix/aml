"use client";

import {
	useState,
	useEffect,
	useMemo,
	useRef,
	useCallback,
	useId,
} from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export type BotExpression =
	| "idle"
	| "thinking"
	| "success"
	| "error"
	| "warning"
	| "doubt"
	| "love"
	| "sad"
	| "surprised"
	| "angry"
	| "sleepy"
	| "wink";

interface AnimatedBotIconProps {
	expression?: BotExpression;
	size?: number;
	className?: string;
	enableSound?: boolean;
	volume?: number; // 0 to 1
}

// Sound configurations for each expression using Web Audio API
// null means no sound for that expression
const EXPRESSION_SOUNDS: Record<
	BotExpression,
	{
		frequency: number;
		type: OscillatorType;
		duration: number;
		pattern?: number[]; // Array of frequencies for multi-tone sounds
		ramp?: "up" | "down" | "none";
	} | null
> = {
	idle: null, // No sound for idle
	thinking: {
		frequency: 300,
		type: "sine",
		duration: 0.15,
		pattern: [300, 350, 300, 350],
		ramp: "none",
	},
	success: {
		frequency: 523,
		type: "sine",
		duration: 0.15,
		pattern: [523, 659, 784],
		ramp: "up",
	},
	error: {
		frequency: 200,
		type: "square",
		duration: 0.1,
		pattern: [200, 150, 200, 150],
		ramp: "down",
	},
	warning: {
		frequency: 440,
		type: "triangle",
		duration: 0.2,
		pattern: [440, 440],
		ramp: "none",
	},
	doubt: {
		frequency: 350,
		type: "sine",
		duration: 0.2,
		pattern: [350, 450, 400],
		ramp: "up",
	},
	love: {
		frequency: 523,
		type: "sine",
		duration: 0.2,
		pattern: [523, 659, 523, 659],
		ramp: "none",
	},
	sad: {
		frequency: 220,
		type: "sine",
		duration: 0.3,
		pattern: [220, 196, 175],
		ramp: "down",
	},
	surprised: {
		frequency: 600,
		type: "sine",
		duration: 0.1,
		pattern: [400, 600, 800],
		ramp: "up",
	},
	angry: {
		frequency: 150,
		type: "sawtooth",
		duration: 0.15,
		pattern: [150, 120, 150, 120],
		ramp: "none",
	},
	sleepy: null, // No sound for sleepy
	wink: {
		frequency: 500,
		type: "sine",
		duration: 0.1,
		pattern: [500, 600],
		ramp: "up",
	},
};

// Create and play a sound using Web Audio API
function playExpressionSound(expression: BotExpression, volume: number = 0.3) {
	if (typeof window === "undefined") return;

	const config = EXPRESSION_SOUNDS[expression];
	if (!config) return; // No sound for this expression

	try {
		const AudioContext =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof window.AudioContext })
				.webkitAudioContext;
		if (!AudioContext) return;

		const audioCtx = new AudioContext();
		const masterGain = audioCtx.createGain();
		masterGain.connect(audioCtx.destination);
		masterGain.gain.value = volume * 0.3; // Keep sounds subtle

		const frequencies = config.pattern || [config.frequency];
		const noteDuration = config.duration / frequencies.length;

		frequencies.forEach((freq, index) => {
			const oscillator = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(masterGain);

			oscillator.type = config.type;
			oscillator.frequency.value = freq;

			const startTime = audioCtx.currentTime + index * noteDuration;
			const endTime = startTime + noteDuration;

			// Apply envelope
			gainNode.gain.setValueAtTime(0, startTime);
			gainNode.gain.linearRampToValueAtTime(1, startTime + 0.01);

			if (config.ramp === "up") {
				gainNode.gain.linearRampToValueAtTime(1.2, endTime - 0.02);
			} else if (config.ramp === "down") {
				gainNode.gain.linearRampToValueAtTime(0.5, endTime - 0.02);
			}

			gainNode.gain.linearRampToValueAtTime(0, endTime);

			oscillator.start(startTime);
			oscillator.stop(endTime);
		});

		// Close audio context after sounds finish
		setTimeout(
			() => {
				audioCtx.close();
			},
			config.duration * 1000 + 100,
		);
	} catch {
		// Audio not supported or blocked
	}
}

// Simple neutral face - eyes with slight flat smile (most common)
const SIMPLE_NEUTRAL = {
	pixels: [
		// Square eyes
		[2, 2],
		[3, 2],
		[2, 3],
		[3, 3],
		[7, 2],
		[8, 2],
		[7, 3],
		[8, 3],
		// Slight flat smile (almost straight line with tiny upturn)
		[4, 6],
		[5, 6],
		[6, 6],
	],
};

// Standard happy face - dot eyes with smile
const HAPPY_SMILE = {
	pixels: [
		[2, 2],
		[3, 2],
		[2, 3],
		[3, 3],
		[7, 2],
		[8, 2],
		[7, 3],
		[8, 3],
		[3, 6],
		[4, 7],
		[5, 7],
		[6, 7],
		[7, 6],
	],
};

// Idle face variants - cycles through these friendly expressions
// Simple neutral face appears most frequently
const IDLE_VARIANTS = [
	// Simple neutral - most common (appears multiple times)
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Blink
	{
		pixels: [
			[2, 3],
			[3, 3],
			[7, 3],
			[8, 3],
			[5, 6],
		],
	},
	// Back to simple neutral
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Happy smile (occasional)
	HAPPY_SMILE,
	// Back to simple neutral
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Looking left with dot mouth
	{
		pixels: [
			[1, 2],
			[2, 2],
			[1, 3],
			[2, 3],
			[6, 2],
			[7, 2],
			[6, 3],
			[7, 3],
			[5, 6],
		],
	},
	// Back to simple neutral
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Looking right with dot mouth
	{
		pixels: [
			[3, 2],
			[4, 2],
			[3, 3],
			[4, 3],
			[8, 2],
			[9, 2],
			[8, 3],
			[9, 3],
			[5, 6],
		],
	},
	// Back to simple neutral
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Wink with dot mouth
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 3],
			[8, 3],
			[5, 6],
		],
	},
	// Back to simple neutral
	SIMPLE_NEUTRAL,
	SIMPLE_NEUTRAL,
	// Happy arc eyes ^_^ with smile (rare)
	{
		pixels: [
			[1, 3],
			[2, 2],
			[3, 2],
			[4, 3],
			[6, 3],
			[7, 2],
			[8, 2],
			[9, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Back to simple neutral
	SIMPLE_NEUTRAL,
];

// Sad face frames - tears drip down
// Sad face frames - tears drip down (only 2 frames for cleaner animation)
const SAD_FRAMES = [
	// Frame 0 - tears at top
	{
		pixels: [
			// Eyes
			[2, 1],
			[3, 1],
			[2, 2],
			[3, 2],
			[7, 1],
			[8, 1],
			[7, 2],
			[8, 2],
			// Tears - position 1
			[3, 3],
			[7, 3],
			// Frown
			[3, 7],
			[4, 6],
			[5, 6],
			[6, 6],
			[7, 7],
		],
	},
	// Frame 1 - tears move down
	{
		pixels: [
			[2, 1],
			[3, 1],
			[2, 2],
			[3, 2],
			[7, 1],
			[8, 1],
			[7, 2],
			[8, 2],
			// Tears - position 2
			[3, 4],
			[7, 4],
			[3, 7],
			[4, 6],
			[5, 6],
			[6, 6],
			[7, 7],
		],
	},
];

// Full X shape centered on display
const X_FULL = [
	[1, 0],
	[2, 0],
	[8, 0],
	[9, 0],
	[2, 1],
	[3, 1],
	[7, 1],
	[8, 1],
	[3, 2],
	[4, 2],
	[6, 2],
	[7, 2],
	[4, 3],
	[5, 3],
	[6, 3],
	[5, 4],
	[4, 5],
	[5, 5],
	[6, 5],
	[3, 6],
	[4, 6],
	[6, 6],
	[7, 6],
	[2, 7],
	[3, 7],
	[7, 7],
	[8, 7],
	[1, 8],
	[2, 8],
	[8, 8],
	[9, 8],
];

// Error X frames - various LED-style reveal animations
const ERROR_FRAMES = [
	// -- SEQUENCE 1: Scroll in from left, column by column --
	{ pixels: X_FULL.filter(([x]) => x <= 1) },
	{ pixels: X_FULL.filter(([x]) => x <= 3) },
	{ pixels: X_FULL.filter(([x]) => x <= 5) },
	{ pixels: X_FULL.filter(([x]) => x <= 7) },
	{ pixels: X_FULL },
	// Hold and blink
	{ pixels: X_FULL },
	{ pixels: X_FULL, bright: true },
	{ pixels: X_FULL },
	{ pixels: [], dim: true }, // Off
	{ pixels: X_FULL },
	{ pixels: [], dim: true }, // Off
	{ pixels: X_FULL },
	// -- SEQUENCE 2: Draw top to bottom row by row --
	{ pixels: X_FULL.filter(([, y]) => y <= 0) },
	{ pixels: X_FULL.filter(([, y]) => y <= 2) },
	{ pixels: X_FULL.filter(([, y]) => y <= 4) },
	{ pixels: X_FULL.filter(([, y]) => y <= 6) },
	{ pixels: X_FULL },
	// Hold and blink
	{ pixels: X_FULL },
	{ pixels: X_FULL, bright: true },
	{ pixels: X_FULL },
	{ pixels: [], dim: true }, // Off
	{ pixels: X_FULL },
	// -- SEQUENCE 3: Diagonal reveal --
	{ pixels: X_FULL.filter(([x, y]) => x + y <= 2) },
	{ pixels: X_FULL.filter(([x, y]) => x + y <= 5) },
	{ pixels: X_FULL.filter(([x, y]) => x + y <= 8) },
	{ pixels: X_FULL.filter(([x, y]) => x + y <= 11) },
	{ pixels: X_FULL },
	// Hold
	{ pixels: X_FULL },
	{ pixels: X_FULL, bright: true },
	{ pixels: X_FULL },
];

// Full checkmark shape
const CHECK_FULL = [
	[9, 0],
	[8, 1],
	[9, 1],
	[7, 2],
	[8, 2],
	[6, 3],
	[7, 3],
	[1, 4],
	[5, 4],
	[6, 4],
	[1, 5],
	[2, 5],
	[4, 5],
	[5, 5],
	[2, 6],
	[3, 6],
	[4, 6],
	[3, 7],
];

// Success checkmark frames - various LED-style reveal animations
const SUCCESS_FRAMES = [
	// -- SEQUENCE 1: Draw the checkmark stroke by stroke --
	// Start with tip of check
	{ pixels: [[3, 7]] },
	{
		pixels: [
			[2, 6],
			[3, 6],
			[3, 7],
		],
	},
	{
		pixels: [
			[1, 5],
			[2, 5],
			[2, 6],
			[3, 6],
			[3, 7],
		],
	},
	{
		pixels: [
			[1, 4],
			[1, 5],
			[2, 5],
			[2, 6],
			[3, 6],
			[3, 7],
		],
	},
	// Now draw upward stroke
	{
		pixels: [
			[1, 4],
			[1, 5],
			[2, 5],
			[4, 5],
			[2, 6],
			[3, 6],
			[4, 6],
			[3, 7],
		],
	},
	{
		pixels: [
			[1, 4],
			[5, 4],
			[6, 4],
			[1, 5],
			[2, 5],
			[4, 5],
			[5, 5],
			[2, 6],
			[3, 6],
			[4, 6],
			[3, 7],
		],
	},
	{ pixels: [...CHECK_FULL.filter(([, y]) => y >= 3)] },
	{ pixels: [...CHECK_FULL.filter(([, y]) => y >= 1)] },
	{ pixels: CHECK_FULL },
	// Hold with subtle blinks
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL, bright: true },
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL },
	// -- SEQUENCE 2: Fade in from dim to bright --
	{ pixels: CHECK_FULL, dim: true },
	{ pixels: CHECK_FULL, dim: true },
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL, bright: true },
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL },
	// -- SEQUENCE 3: Column reveal from right --
	{ pixels: CHECK_FULL.filter(([x]) => x >= 8) },
	{ pixels: CHECK_FULL.filter(([x]) => x >= 6) },
	{ pixels: CHECK_FULL.filter(([x]) => x >= 4) },
	{ pixels: CHECK_FULL.filter(([x]) => x >= 2) },
	{ pixels: CHECK_FULL },
	// Hold
	{ pixels: CHECK_FULL },
	{ pixels: CHECK_FULL, bright: true },
	{ pixels: CHECK_FULL },
];

// Thinking frames - dots cycle
const THINKING_FRAMES = [
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[3, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[3, 6],
			[5, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[3, 6],
			[5, 6],
			[7, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[5, 6],
			[7, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[7, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
		],
	},
];

// Love heart frames - pulsing heartbeat
const LOVE_FRAMES = [
	// Normal heart
	{
		pixels: [
			[2, 1],
			[3, 1],
			[4, 1],
			[6, 1],
			[7, 1],
			[8, 1],
			[1, 2],
			[2, 2],
			[3, 2],
			[4, 2],
			[5, 2],
			[6, 2],
			[7, 2],
			[8, 2],
			[9, 2],
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[2, 4],
			[3, 4],
			[4, 4],
			[5, 4],
			[6, 4],
			[7, 4],
			[8, 4],
			[3, 5],
			[4, 5],
			[5, 5],
			[6, 5],
			[7, 5],
			[4, 6],
			[5, 6],
			[6, 6],
			[5, 7],
		],
	},
	// Dimmer (contracted)
	{
		pixels: [
			[3, 2],
			[4, 2],
			[6, 2],
			[7, 2],
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[3, 4],
			[4, 4],
			[5, 4],
			[6, 4],
			[7, 4],
			[4, 5],
			[5, 5],
			[6, 5],
			[5, 6],
		],
		dim: true,
	},
	// Normal heart
	{
		pixels: [
			[2, 1],
			[3, 1],
			[4, 1],
			[6, 1],
			[7, 1],
			[8, 1],
			[1, 2],
			[2, 2],
			[3, 2],
			[4, 2],
			[5, 2],
			[6, 2],
			[7, 2],
			[8, 2],
			[9, 2],
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[2, 4],
			[3, 4],
			[4, 4],
			[5, 4],
			[6, 4],
			[7, 4],
			[8, 4],
			[3, 5],
			[4, 5],
			[5, 5],
			[6, 5],
			[7, 5],
			[4, 6],
			[5, 6],
			[6, 6],
			[5, 7],
		],
	},
	// Brighter (expanded)
	{
		pixels: [
			[2, 0],
			[3, 0],
			[4, 0],
			[6, 0],
			[7, 0],
			[8, 0],
			[1, 1],
			[2, 1],
			[3, 1],
			[4, 1],
			[5, 1],
			[6, 1],
			[7, 1],
			[8, 1],
			[9, 1],
			[0, 2],
			[1, 2],
			[2, 2],
			[3, 2],
			[4, 2],
			[5, 2],
			[6, 2],
			[7, 2],
			[8, 2],
			[9, 2],
			[10, 2],
			[0, 3],
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[10, 3],
			[1, 4],
			[2, 4],
			[3, 4],
			[4, 4],
			[5, 4],
			[6, 4],
			[7, 4],
			[8, 4],
			[9, 4],
			[2, 5],
			[3, 5],
			[4, 5],
			[5, 5],
			[6, 5],
			[7, 5],
			[8, 5],
			[3, 6],
			[4, 6],
			[5, 6],
			[6, 6],
			[7, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[5, 8],
		],
		bright: true,
	},
];

// Full exclamation mark shape
const EXCLAMATION_FULL = [
	// Vertical bar (thick)
	[4, 0],
	[5, 0],
	[6, 0],
	[4, 1],
	[5, 1],
	[6, 1],
	[4, 2],
	[5, 2],
	[6, 2],
	[4, 3],
	[5, 3],
	[6, 3],
	[5, 4],
	// Dot at bottom
	[4, 6],
	[5, 6],
	[6, 6],
	[4, 7],
	[5, 7],
	[6, 7],
];

// Full question mark shape
const QUESTION_MARK_FULL = [
	// Curved top
	[3, 0],
	[4, 0],
	[5, 0],
	[6, 0],
	[7, 0],
	[2, 1],
	[3, 1],
	[6, 1],
	[7, 1],
	[8, 1],
	[6, 2],
	[7, 2],
	[8, 2],
	[5, 3],
	[6, 3],
	[7, 3],
	[4, 4],
	[5, 4],
	[6, 4],
	[5, 5],
	// Dot at bottom
	[4, 7],
	[5, 7],
	[6, 7],
	[4, 8],
	[5, 8],
	[6, 8],
];

// Doubt frames - question mark with LED-style reveals
const DOUBT_FRAMES = [
	// -- SEQUENCE 1: Draw from top down --
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 0) },
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 1) },
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 2) },
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 3) },
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 4) },
	{ pixels: QUESTION_MARK_FULL.filter(([, y]) => y <= 5) },
	// Dot appears
	{ pixels: QUESTION_MARK_FULL },
	// Hold
	{ pixels: QUESTION_MARK_FULL },
	{ pixels: QUESTION_MARK_FULL },
	{ pixels: QUESTION_MARK_FULL, bright: true },
	{ pixels: QUESTION_MARK_FULL },
	// -- SEQUENCE 2: Blink --
	{ pixels: [], dim: true },
	{ pixels: QUESTION_MARK_FULL },
	{ pixels: QUESTION_MARK_FULL },
];

// Sleepy face variants - cycles through these slowly
const SLEEPY_VARIANTS = [
	// Closed eyes, small mouth
	{
		pixels: [
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[4, 6],
			[5, 6],
			[6, 6],
		],
	},
	// Eyes slightly different position (subtle breathing)
	{
		pixels: [
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[5, 6],
		],
	},
	// Back to normal
	{
		pixels: [
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[4, 6],
			[5, 6],
			[6, 6],
		],
	},
	// Eyes barely open
	{
		pixels: [
			[2, 2],
			[3, 2],
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[7, 2],
			[8, 2],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[4, 6],
			[5, 6],
			[6, 6],
		],
	},
	// Back to closed
	{
		pixels: [
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[4, 6],
			[5, 6],
			[6, 6],
		],
	},
];

// Wink animation frames - winks a couple times
const WINK_FRAMES = [
	// Normal face with both eyes open
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Hold open
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// First wink - right eye closed
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Hold wink
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Back to open
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Hold open
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Second wink
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Hold wink
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	// Back to open - hold longer
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
	{
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
	},
];

// Angry face - full expression with furrowed brows and gritted teeth
const ANGRY_FULL = [
	// Furrowed angry eyebrows (V shape pointing down)
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 3],
	[4, 3],
	[10, 1],
	[9, 2],
	[8, 3],
	[7, 3],
	[6, 3],
	// Eyes underneath
	[2, 4],
	[3, 4],
	[7, 4],
	[8, 4],
	// Gritted teeth mouth
	[2, 7],
	[3, 7],
	[4, 7],
	[5, 7],
	[6, 7],
	[7, 7],
	[8, 7],
	[3, 8],
	[5, 8],
	[7, 8],
];

// Angry frames - intense with flashing
const ANGRY_FRAMES = [
	// -- SEQUENCE 1: Build up anger --
	// Just eyes
	{
		pixels: [
			[2, 4],
			[3, 4],
			[7, 4],
			[8, 4],
		],
	},
	// Eyes get intense (looking up)
	{
		pixels: [
			[2, 3],
			[3, 3],
			[7, 3],
			[8, 3],
		],
	},
	// Add brows forming
	{
		pixels: [
			[1, 2],
			[2, 3],
			[3, 3],
			[9, 2],
			[8, 3],
			[7, 3],
			[2, 4],
			[3, 4],
			[7, 4],
			[8, 4],
		],
	},
	// Full angry brows
	{
		pixels: [
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 3],
			[4, 3],
			[10, 1],
			[9, 2],
			[8, 3],
			[7, 3],
			[6, 3],
			[2, 4],
			[3, 4],
			[7, 4],
			[8, 4],
		],
	},
	// Add mouth
	{ pixels: ANGRY_FULL },
	// Hold
	{ pixels: ANGRY_FULL },
	// Flash bright (rage)
	{ pixels: ANGRY_FULL, bright: true },
	{ pixels: ANGRY_FULL },
	{ pixels: ANGRY_FULL, bright: true },
	{ pixels: ANGRY_FULL },
	// -- SEQUENCE 2: Pulsing anger --
	{ pixels: ANGRY_FULL },
	{ pixels: ANGRY_FULL, dim: true },
	{ pixels: ANGRY_FULL },
	{ pixels: ANGRY_FULL, bright: true },
	{ pixels: ANGRY_FULL },
	// -- SEQUENCE 3: Eyes narrow --
	{
		pixels: [
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 3],
			[4, 3],
			[10, 1],
			[9, 2],
			[8, 3],
			[7, 3],
			[6, 3],
			[2, 4],
			[3, 4],
			[7, 4],
			[8, 4],
			[2, 7],
			[3, 7],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 7],
			[8, 7],
			[3, 8],
			[5, 8],
			[7, 8],
		],
	},
	// Eyes as slits
	{
		pixels: [
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 3],
			[4, 3],
			[10, 1],
			[9, 2],
			[8, 3],
			[7, 3],
			[6, 3],
			[2, 4],
			[7, 4],
			[2, 7],
			[3, 7],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 7],
			[8, 7],
			[3, 8],
			[5, 8],
			[7, 8],
		],
	},
	// Back to full
	{ pixels: ANGRY_FULL },
	{ pixels: ANGRY_FULL },
];

// Warning frames - exclamation mark with LED-style reveals
const WARNING_FRAMES = [
	// -- SEQUENCE 1: Draw from top down --
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 0) },
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 1) },
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 2) },
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 3) },
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 4) },
	// Dot appears
	{ pixels: EXCLAMATION_FULL },
	// Hold and blink
	{ pixels: EXCLAMATION_FULL },
	{ pixels: EXCLAMATION_FULL, bright: true },
	{ pixels: EXCLAMATION_FULL },
	{ pixels: [], dim: true }, // Off
	{ pixels: EXCLAMATION_FULL },
	{ pixels: [], dim: true }, // Off
	{ pixels: EXCLAMATION_FULL },
	// -- SEQUENCE 2: Alternating bar and dot --
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 4) }, // Just bar
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y >= 6) }, // Just dot
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y <= 4) }, // Just bar
	{ pixels: EXCLAMATION_FULL.filter(([, y]) => y >= 6) }, // Just dot
	{ pixels: EXCLAMATION_FULL }, // Full
	{ pixels: EXCLAMATION_FULL },
	{ pixels: EXCLAMATION_FULL, bright: true },
	{ pixels: EXCLAMATION_FULL },
];

// Surprised O_O face
const SURPRISED_FACE = [
	// Left O eye
	[1, 1],
	[2, 1],
	[3, 1],
	[1, 2],
	[3, 2],
	[1, 3],
	[2, 3],
	[3, 3],
	// Right O eye
	[7, 1],
	[8, 1],
	[9, 1],
	[7, 2],
	[9, 2],
	[7, 3],
	[8, 3],
	[9, 3],
	// O mouth
	[4, 5],
	[5, 5],
	[6, 5],
	[4, 6],
	[6, 6],
	[4, 7],
	[5, 7],
	[6, 7],
];

// Individual letters centered on display for OMG sequence
const LETTER_O = [
	// Big O centered
	[3, 1],
	[4, 1],
	[5, 1],
	[6, 1],
	[7, 1],
	[2, 2],
	[3, 2],
	[7, 2],
	[8, 2],
	[2, 3],
	[8, 3],
	[2, 4],
	[8, 4],
	[2, 5],
	[3, 5],
	[7, 5],
	[8, 5],
	[3, 6],
	[4, 6],
	[5, 6],
	[6, 6],
	[7, 6],
];

const LETTER_M = [
	// Big M centered
	[1, 1],
	[2, 1],
	[8, 1],
	[9, 1],
	[1, 2],
	[2, 2],
	[3, 2],
	[7, 2],
	[8, 2],
	[9, 2],
	[1, 3],
	[4, 3],
	[5, 3],
	[6, 3],
	[9, 3],
	[1, 4],
	[5, 4],
	[9, 4],
	[1, 5],
	[9, 5],
	[1, 6],
	[9, 6],
];

const LETTER_G = [
	// Big G centered
	[3, 1],
	[4, 1],
	[5, 1],
	[6, 1],
	[7, 1],
	[2, 2],
	[3, 2],
	[7, 2],
	[8, 2],
	[2, 3],
	[2, 4],
	[5, 4],
	[6, 4],
	[7, 4],
	[8, 4],
	[2, 5],
	[3, 5],
	[7, 5],
	[8, 5],
	[3, 6],
	[4, 6],
	[5, 6],
	[6, 6],
	[7, 6],
];

// Surprised frames - shows O_O face then O, M, G one at a time
const SURPRISED_FRAMES = [
	// Start with surprised face
	{ pixels: SURPRISED_FACE },
	{ pixels: SURPRISED_FACE },
	{ pixels: SURPRISED_FACE, bright: true },
	{ pixels: SURPRISED_FACE },
	{ pixels: SURPRISED_FACE },
	// Flash off
	{ pixels: [], dim: true },
	// O
	{ pixels: LETTER_O },
	{ pixels: LETTER_O },
	{ pixels: LETTER_O, bright: true },
	// Flash off
	{ pixels: [], dim: true },
	// M
	{ pixels: LETTER_M },
	{ pixels: LETTER_M },
	{ pixels: LETTER_M, bright: true },
	// Flash off
	{ pixels: [], dim: true },
	// G
	{ pixels: LETTER_G },
	{ pixels: LETTER_G },
	{ pixels: LETTER_G, bright: true },
	// Flash off
	{ pixels: [], dim: true },
	// Back to surprised face
	{ pixels: SURPRISED_FACE },
	{ pixels: SURPRISED_FACE },
	{ pixels: SURPRISED_FACE },
];

// Pixel grid for LCD display - 11x9 grid for face
// Each expression defines which pixels are "on" for the display
const LCD_EXPRESSIONS: Record<
	BotExpression,
	{ pixels: number[][]; color: string }
> = {
	idle: {
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 2],
			[8, 2],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
		color: "#a3ffb0",
	},
	thinking: {
		pixels: [
			[2, 2],
			[3, 2],
			[7, 2],
			[8, 2],
			[3, 6],
		],
		color: "#a3ffb0",
	},
	success: {
		pixels: [
			[9, 0],
			[8, 1],
			[9, 1],
			[7, 2],
			[8, 2],
			[6, 3],
			[7, 3],
			[1, 4],
			[5, 4],
			[6, 4],
			[1, 5],
			[2, 5],
			[4, 5],
			[5, 5],
			[2, 6],
			[3, 6],
			[4, 6],
			[3, 7],
		],
		color: "#4ade80",
	},
	error: {
		pixels: [
			[1, 0],
			[2, 0],
			[8, 0],
			[9, 0],
			[2, 1],
			[3, 1],
			[7, 1],
			[8, 1],
			[3, 2],
			[4, 2],
			[6, 2],
			[7, 2],
			[4, 3],
			[5, 3],
			[6, 3],
			[5, 4],
			[4, 5],
			[5, 5],
			[6, 5],
			[3, 6],
			[4, 6],
			[6, 6],
			[7, 6],
			[2, 7],
			[3, 7],
			[7, 7],
			[8, 7],
			[1, 8],
			[2, 8],
			[8, 8],
			[9, 8],
		],
		color: "#ff6b6b",
	},
	warning: {
		pixels: [
			// Vertical bar (thick)
			[4, 0],
			[5, 0],
			[6, 0],
			[4, 1],
			[5, 1],
			[6, 1],
			[4, 2],
			[5, 2],
			[6, 2],
			[4, 3],
			[5, 3],
			[6, 3],
			[5, 4],
			// Dot at bottom
			[4, 6],
			[5, 6],
			[6, 6],
			[4, 7],
			[5, 7],
			[6, 7],
		],
		color: "#fbbf24",
	},
	doubt: {
		pixels: [
			// Full question mark
			[3, 0],
			[4, 0],
			[5, 0],
			[6, 0],
			[7, 0],
			[2, 1],
			[3, 1],
			[6, 1],
			[7, 1],
			[8, 1],
			[6, 2],
			[7, 2],
			[8, 2],
			[5, 3],
			[6, 3],
			[7, 3],
			[4, 4],
			[5, 4],
			[6, 4],
			[5, 5],
			[4, 7],
			[5, 7],
			[6, 7],
			[4, 8],
			[5, 8],
			[6, 8],
		],
		color: "#fbbf24",
	},
	love: {
		pixels: [
			[2, 1],
			[3, 1],
			[4, 1],
			[6, 1],
			[7, 1],
			[8, 1],
			[1, 2],
			[2, 2],
			[3, 2],
			[4, 2],
			[5, 2],
			[6, 2],
			[7, 2],
			[8, 2],
			[9, 2],
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			[2, 4],
			[3, 4],
			[4, 4],
			[5, 4],
			[6, 4],
			[7, 4],
			[8, 4],
			[3, 5],
			[4, 5],
			[5, 5],
			[6, 5],
			[7, 5],
			[4, 6],
			[5, 6],
			[6, 6],
			[5, 7],
		],
		color: "#f472b6",
	},
	sad: {
		pixels: [
			[2, 1],
			[3, 1],
			[2, 2],
			[3, 2],
			[7, 1],
			[8, 1],
			[7, 2],
			[8, 2],
			[3, 3],
			[7, 3],
			[3, 7],
			[4, 6],
			[5, 6],
			[6, 6],
			[7, 7],
		],
		color: "#60a5fa",
	},
	surprised: {
		pixels: [
			[1, 1],
			[2, 1],
			[3, 1],
			[1, 2],
			[3, 2],
			[1, 3],
			[2, 3],
			[3, 3],
			[7, 1],
			[8, 1],
			[9, 1],
			[7, 2],
			[9, 2],
			[7, 3],
			[8, 3],
			[9, 3],
			[4, 5],
			[5, 5],
			[6, 5],
			[4, 6],
			[6, 6],
			[4, 7],
			[5, 7],
			[6, 7],
		],
		color: "#ffffff",
	},
	angry: {
		pixels: [
			// Furrowed angry eyebrows (V shape pointing down)
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 3],
			[4, 3],
			[10, 1],
			[9, 2],
			[8, 3],
			[7, 3],
			[6, 3],
			// Eyes underneath
			[2, 4],
			[3, 4],
			[7, 4],
			[8, 4],
			// Gritted teeth mouth
			[2, 7],
			[3, 7],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 7],
			[8, 7],
			[3, 8],
			[5, 8],
			[7, 8],
		],
		color: "#ff6b6b",
	},
	sleepy: {
		pixels: [
			// Closed line eyes
			[1, 3],
			[2, 3],
			[3, 3],
			[4, 3],
			[6, 3],
			[7, 3],
			[8, 3],
			[9, 3],
			// Small mouth
			[4, 6],
			[5, 6],
			[6, 6],
		],
		color: "#a3ffb0",
	},
	wink: {
		pixels: [
			[2, 2],
			[3, 2],
			[2, 3],
			[3, 3],
			[7, 3],
			[8, 3],
			[3, 6],
			[4, 7],
			[5, 7],
			[6, 7],
			[7, 6],
		],
		color: "#a3ffb0",
	},
};

// Frame-based animation config - slower intervals for clear LED visualization
const FRAME_ANIMATIONS: Record<
	string,
	{
		frames: { pixels: number[][]; bright?: boolean; dim?: boolean }[];
		interval: number;
		color: string;
	}
> = {
	error: { frames: ERROR_FRAMES, interval: 350, color: "#ff6b6b" },
	success: { frames: SUCCESS_FRAMES, interval: 200, color: "#4ade80" },
	sad: { frames: SAD_FRAMES, interval: 600, color: "#60a5fa" },
	thinking: { frames: THINKING_FRAMES, interval: 400, color: "#a3ffb0" },
	love: { frames: LOVE_FRAMES, interval: 500, color: "#f472b6" },
	warning: { frames: WARNING_FRAMES, interval: 467, color: "#fbbf24" },
	doubt: { frames: DOUBT_FRAMES, interval: 300, color: "#fbbf24" },
	sleepy: {
		frames: SLEEPY_VARIANTS.map((v) => ({ pixels: v.pixels })),
		interval: 2000,
		color: "#a3ffb0",
	},
	wink: { frames: WINK_FRAMES, interval: 400, color: "#a3ffb0" },
	angry: { frames: ANGRY_FRAMES, interval: 300, color: "#ff6b6b" },
	surprised: { frames: SURPRISED_FRAMES, interval: 350, color: "#ffffff" },
};

function LCDPixel({
	x,
	y,
	color,
	pixelSize,
	opacity = 1,
}: {
	x: number;
	y: number;
	color: string;
	pixelSize: number;
	opacity?: number;
}) {
	return (
		<rect
			x={x * pixelSize + 1}
			y={y * pixelSize + 1}
			width={pixelSize - 2}
			height={pixelSize - 2}
			rx={1}
			fill={color}
			opacity={opacity}
		/>
	);
}

function LCDDisplay({
	expression,
	width,
	height,
	idleVariantIndex = 0,
	animationFrame = 0,
	ids,
}: {
	expression: BotExpression;
	width: number;
	height: number;
	idleVariantIndex?: number;
	animationFrame?: number;
	ids: {
		lcdGrid: string;
		pixelGlow: string;
		lcdBg: string;
	};
}) {
	const pixelSize = width / 11;

	// Determine which pixels to render
	const isIdle = expression === "idle";
	const frameAnimation = FRAME_ANIMATIONS[expression];

	let pixels: number[][];
	let color: string;
	let opacity = 1;

	if (isIdle) {
		pixels = IDLE_VARIANTS[idleVariantIndex % IDLE_VARIANTS.length].pixels;
		color = "#a3ffb0";
	} else if (frameAnimation) {
		const frame =
			frameAnimation.frames[animationFrame % frameAnimation.frames.length];
		pixels = frame.pixels;
		color = frame.bright ? "#ffffff" : frameAnimation.color;
		opacity = frame.dim ? 0.5 : 1;
	} else {
		const config = LCD_EXPRESSIONS[expression];
		pixels = config.pixels;
		color = config.color;
	}

	return (
		<g>
			{/* LCD background with grid effect */}
			<defs>
				<pattern
					id={ids.lcdGrid}
					patternUnits="userSpaceOnUse"
					width={pixelSize}
					height={pixelSize}
				>
					<rect
						width={pixelSize}
						height={pixelSize}
						fill="transparent"
						stroke="#1a2a1a"
						strokeWidth="0.5"
					/>
				</pattern>
				<filter id={ids.pixelGlow} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.5" result="glow" />
					<feMerge>
						<feMergeNode in="glow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				<linearGradient id={ids.lcdBg} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#0d1a0d" />
					<stop offset="50%" stopColor="#0a140a" />
					<stop offset="100%" stopColor="#071007" />
				</linearGradient>
			</defs>

			{/* LCD screen background */}
			<rect
				x="0"
				y="0"
				width={width}
				height={height}
				rx="4"
				fill={`url(#${ids.lcdBg})`}
			/>

			{/* Grid overlay */}
			<rect
				x="0"
				y="0"
				width={width}
				height={height}
				rx="4"
				fill={`url(#${ids.lcdGrid})`}
				opacity="0.5"
			/>

			{/* Scanline effect */}
			{Array.from({ length: Math.floor(height / 3) }).map((_, i) => (
				<line
					key={`scan-${i}`}
					x1="0"
					y1={i * 3}
					x2={width}
					y2={i * 3}
					stroke="#ffffff"
					strokeWidth="0.3"
					opacity="0.03"
				/>
			))}

			{/* Render pixels with glow */}
			<g filter={`url(#${ids.pixelGlow})`}>
				{pixels.map((pixel) => (
					<LCDPixel
						key={`pixel-${pixel[0]}-${pixel[1]}`}
						x={pixel[0]}
						y={pixel[1]}
						color={color}
						pixelSize={pixelSize}
						opacity={opacity}
					/>
				))}
			</g>

			{/* Screen reflection */}
			<ellipse
				cx={width * 0.3}
				cy={height * 0.2}
				rx={width * 0.15}
				ry={height * 0.08}
				fill="white"
				opacity="0.03"
			/>
		</g>
	);
}

export function AnimatedBotIcon({
	expression = "idle",
	size = 120,
	className,
	enableSound = false,
	volume = 0.3,
}: AnimatedBotIconProps) {
	const [idleVariantIndex, setIdleVariantIndex] = useState(0);
	const [animationFrame, setAnimationFrame] = useState(0);
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const prevExpressionRef = useRef<BotExpression>(expression);

	// Generate unique IDs for SVG elements to avoid collisions across instances
	const uniqueId = useId();
	const ids = useMemo(
		() => ({
			// LCD display IDs
			lcdGrid: `lcdGrid-${uniqueId}`,
			pixelGlow: `pixelGlow-${uniqueId}`,
			lcdBg: `lcdBg-${uniqueId}`,
			// Helmet gradient IDs
			helmetMain: `helmetMain-${uniqueId}`,
			helmetHighlight: `helmetHighlight-${uniqueId}`,
			helmetDark: `helmetDark-${uniqueId}`,
			stripeGrad: `stripeGrad-${uniqueId}`,
			screenBezel: `screenBezel-${uniqueId}`,
		}),
		[uniqueId],
	);

	// Play sound when expression changes
	useEffect(() => {
		if (enableSound && expression !== prevExpressionRef.current) {
			playExpressionSound(expression, volume);
		}
		prevExpressionRef.current = expression;
	}, [expression, enableSound, volume]);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Theme-aware colors
	// Light mode: Purple (hue ~293)
	// Dark mode: Pink (hue ~307)
	const colors = useMemo(() => {
		const isDark = mounted && resolvedTheme === "dark";
		// Pink for dark, Purple for light
		const hue = isDark ? 307 : 293;
		const chroma = isDark ? 0.11 : 0.22;

		return {
			// Main helmet gradient
			mainStart: `oklch(${isDark ? 0.65 : 0.58} ${chroma} ${hue})`,
			mainMid: `oklch(${isDark ? 0.55 : 0.48} ${chroma + 0.02} ${hue})`,
			mainEnd: `oklch(${isDark ? 0.45 : 0.38} ${chroma - 0.02} ${hue})`,
			// Highlight gradient
			highlightStart: `oklch(${isDark ? 0.82 : 0.72} ${chroma - 0.06} ${hue - 2})`,
			highlightEnd: `oklch(${isDark ? 0.65 : 0.55} ${chroma} ${hue})`,
			// Dark gradient
			darkStart: `oklch(${isDark ? 0.5 : 0.4} ${chroma - 0.04} ${hue})`,
			darkEnd: `oklch(${isDark ? 0.35 : 0.28} ${chroma - 0.08} ${hue})`,
			// Stripe gradient
			stripeStart: `oklch(${isDark ? 0.75 : 0.65} ${chroma - 0.08} ${hue - 2})`,
			stripeMid: `oklch(${isDark ? 0.62 : 0.52} ${chroma - 0.02} ${hue})`,
			stripeEnd: `oklch(${isDark ? 0.52 : 0.42} ${chroma - 0.04} ${hue})`,
		};
	}, [mounted, resolvedTheme]);

	// Cycle through idle variants when in idle state
	useEffect(() => {
		if (expression !== "idle") return;

		const interval = setInterval(() => {
			setIdleVariantIndex((prev) => (prev + 1) % IDLE_VARIANTS.length);
		}, 4000);

		return () => clearInterval(interval);
	}, [expression]);

	// Handle frame-based animations for other expressions
	useEffect(() => {
		const frameAnimation = FRAME_ANIMATIONS[expression];
		if (!frameAnimation) return;

		setAnimationFrame(0); // Reset animation when expression changes

		const interval = setInterval(() => {
			setAnimationFrame((prev) => (prev + 1) % frameAnimation.frames.length);
		}, frameAnimation.interval);

		return () => clearInterval(interval);
	}, [expression]);

	const screenWidth = 50;
	const screenHeight = 40;

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("", className)}
			aria-label={`Bot ${expression}`}
		>
			<defs>
				{/* Theme-aware metallic gradient for helmet - Purple in light, Pink in dark */}
				<linearGradient id={ids.helmetMain} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor={colors.mainStart} />
					<stop offset="40%" stopColor={colors.mainMid} />
					<stop offset="100%" stopColor={colors.mainEnd} />
				</linearGradient>

				<linearGradient
					id={ids.helmetHighlight}
					x1="0%"
					y1="0%"
					x2="0%"
					y2="100%"
				>
					<stop offset="0%" stopColor={colors.highlightStart} />
					<stop offset="100%" stopColor={colors.highlightEnd} />
				</linearGradient>

				<linearGradient id={ids.helmetDark} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor={colors.darkStart} />
					<stop offset="100%" stopColor={colors.darkEnd} />
				</linearGradient>

				<linearGradient id={ids.stripeGrad} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor={colors.stripeStart} />
					<stop offset="50%" stopColor={colors.stripeMid} />
					<stop offset="100%" stopColor={colors.stripeEnd} />
				</linearGradient>

				<linearGradient id={ids.screenBezel} x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#1a1a2e" />
					<stop offset="100%" stopColor="#0a0a14" />
				</linearGradient>
			</defs>

			{/* Main bot group */}
			<g>
				{/* Main helmet body - rounded rectangle */}
				<rect
					x="12"
					y="18"
					width="76"
					height="72"
					rx="20"
					fill={`url(#${ids.helmetMain})`}
				/>

				{/* Helmet top highlight */}
				<rect
					x="20"
					y="18"
					width="60"
					height="20"
					rx="10"
					fill={`url(#${ids.helmetHighlight})`}
					opacity="0.4"
				/>

				{/* Center stripe */}
				<rect
					x="46"
					y="14"
					width="8"
					height="54"
					rx="3"
					fill={`url(#${ids.stripeGrad})`}
				/>

				{/* Screen bezel */}
				<rect
					x="20"
					y="35"
					width="60"
					height="50"
					rx="8"
					fill={`url(#${ids.screenBezel})`}
				/>

				{/* LCD Screen */}
				<g transform="translate(25, 40)">
					<LCDDisplay
						expression={expression}
						width={screenWidth}
						height={screenHeight}
						idleVariantIndex={idleVariantIndex}
						animationFrame={animationFrame}
						ids={{
							lcdGrid: ids.lcdGrid,
							pixelGlow: ids.pixelGlow,
							lcdBg: ids.lcdBg,
						}}
					/>
				</g>

				{/* Screen glass reflection */}
				<rect
					x="22"
					y="37"
					width="56"
					height="46"
					rx="6"
					fill="white"
					opacity="0.02"
				/>

				{/* Bottom chin detail */}
				<rect
					x="35"
					y="82"
					width="30"
					height="4"
					rx="2"
					fill={`url(#${ids.helmetDark})`}
				/>
			</g>
		</svg>
	);
}
