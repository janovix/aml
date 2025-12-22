"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { cn } from "@/lib/utils";

type ComboboxContextValue = {
	open: boolean;
	setOpen: (next: boolean) => void;
	triggerId: string;
};

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext() {
	const ctx = React.useContext(ComboboxContext);
	if (!ctx) {
		throw new Error("Combobox components must be used within <Combobox />");
	}
	return ctx;
}

type ComboboxProps = {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	// The reference implementation includes these props; we keep them for compatibility.
	type?: string;
	data?: unknown[];
	children: React.ReactNode;
};

function Combobox({
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	children,
}: ComboboxProps) {
	const [uncontrolledOpen, setUncontrolledOpen] =
		React.useState<boolean>(defaultOpen);
	const open = openProp ?? uncontrolledOpen;
	const triggerId = React.useId();

	const setOpen = React.useCallback(
		(next: boolean) => {
			onOpenChange?.(next);
			if (openProp === undefined) setUncontrolledOpen(next);
		},
		[onOpenChange, openProp],
	);

	const value = React.useMemo<ComboboxContextValue>(
		() => ({ open, setOpen, triggerId }),
		[open, setOpen, triggerId],
	);

	return (
		<ComboboxContext.Provider value={value}>
			{children}
		</ComboboxContext.Provider>
	);
}

function ComboboxTrigger({
	className,
	children,
	disabled,
	...props
}: React.ComponentProps<"button">) {
	const { open, setOpen, triggerId } = useComboboxContext();
	return (
		<button
			type="button"
			data-slot="combobox-trigger"
			data-combobox-id={triggerId}
			aria-haspopup="listbox"
			aria-expanded={open}
			disabled={disabled}
			className={cn(className)}
			onClick={() => setOpen(!open)}
			{...props}
		>
			{children}
		</button>
	);
}

function ComboboxContent({
	className,
	children,
	filter: _filter,
	...props
}: React.ComponentProps<"div"> & {
	// kept for compat (unused in this lightweight implementation)
	filter?: unknown;
}) {
	const { open, triggerId, setOpen } = useComboboxContext();
	const contentRef = React.useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = React.useState<{
		top: number;
		left: number;
		width: number;
	}>({ top: 0, left: 0, width: 0 });

	React.useEffect(() => {
		if (!open) return;

		// Find the trigger element for this specific combobox
		const trigger = document.querySelector(
			`[data-combobox-id="${triggerId}"][data-slot="combobox-trigger"]`,
		) as HTMLElement;
		if (!trigger) return;

		const updatePosition = () => {
			if (!trigger) return;

			const rect = trigger.getBoundingClientRect();
			const scrollY = window.scrollY;
			const scrollX = window.scrollX;
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Dropdown maxHeight from style (400px)
			const dropdownMaxHeight = 400;
			const gap = 4; // Gap between trigger and dropdown
			const minPadding = 8; // Minimum padding from viewport edges

			// Try to get actual dropdown height if content is rendered
			let dropdownHeight = dropdownMaxHeight;
			if (contentRef.current) {
				const contentRect = contentRef.current.getBoundingClientRect();
				if (contentRect.height > 0) {
					dropdownHeight = Math.min(contentRect.height, dropdownMaxHeight);
				}
			}

			// Calculate available space
			const spaceBelow = viewportHeight - rect.bottom - gap;
			const spaceAbove = rect.top - gap;

			// Default: position below, align left edge with trigger
			let top = rect.bottom + scrollY + gap;
			let left = rect.left + scrollX;
			let width = Math.max(rect.width, 250); // Minimum width

			// Determine if we should position above based on available space
			// Check if dropdown fits below, considering its actual/max height
			const fitsBelow = spaceBelow >= dropdownHeight;
			const fitsAbove = spaceAbove >= dropdownHeight;

			if (!fitsBelow && fitsAbove) {
				// Not enough space below, but enough above - position above
				top = rect.top + scrollY - dropdownHeight - gap;
				// Ensure we don't go above viewport
				top = Math.max(scrollY + minPadding, top);
			} else if (!fitsBelow && !fitsAbove) {
				// Not enough space in either direction
				// Position where there's more space, but ensure visibility
				if (spaceAbove > spaceBelow) {
					// More space above, position above but clamp
					top = rect.top + scrollY - Math.min(dropdownHeight, spaceAbove - gap);
					top = Math.max(scrollY + minPadding, top);
				} else {
					// More space below, position below but clamp
					top = rect.bottom + scrollY + gap;
					const maxTop =
						viewportHeight +
						scrollY -
						minPadding -
						Math.min(dropdownHeight, spaceBelow);
					top = Math.min(top, maxTop);
				}
			}
			// else: fitsBelow is true, use default position below

			// Ensure content stays within viewport
			const maxWidth = Math.min(viewportWidth - 16, 400); // 16px padding from edges
			width = Math.min(width, maxWidth);

			// Keep aligned with trigger left edge, but adjust if it would overflow
			const maxLeft = viewportWidth - width - minPadding;
			if (left + width > viewportWidth - minPadding) {
				// If dropdown would overflow right, shift left to fit
				left = Math.max(minPadding, viewportWidth - width - minPadding);
			} else {
				// Ensure minimum left padding
				left = Math.max(minPadding, left);
			}

			setPosition({ top, left, width });
		};

		// Initial position calculation with small delay to ensure DOM is ready
		const timeoutId = setTimeout(() => {
			updatePosition();
			// Recalculate position after content renders to get actual height
			setTimeout(() => {
				updatePosition();
			}, 50);
		}, 0);

		// Use ResizeObserver to recalculate when content size changes
		let resizeObserver: ResizeObserver | null = null;
		// Set up ResizeObserver after a delay to ensure content is rendered
		const observerTimeoutId = setTimeout(() => {
			if (contentRef.current && typeof ResizeObserver !== "undefined") {
				resizeObserver = new ResizeObserver(() => {
					updatePosition();
				});
				resizeObserver.observe(contentRef.current);
			}
		}, 100);

		// Handle click outside to close
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				contentRef.current &&
				!contentRef.current.contains(target) &&
				trigger &&
				!trigger.contains(target)
			) {
				setOpen(false);
			}
		};

		// Handle escape key to close
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		// Update position on scroll and resize
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			clearTimeout(timeoutId);
			clearTimeout(observerTimeoutId);
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open, triggerId, setOpen]);

	if (!open) return null;

	const content = (
		<div
			ref={contentRef}
			data-slot="combobox-content"
			className={cn(
				"fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-lg",
				className,
			)}
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				width: `${position.width}px`,
				maxHeight: "400px",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
			{...props}
		>
			{children}
		</div>
	);

	// Use Portal to render outside the normal flow
	if (typeof window !== "undefined") {
		return ReactDOM.createPortal(content, document.body);
	}

	return content;
}

function ComboboxInput({
	className,
	value,
	onValueChange,
	...props
}: Omit<React.ComponentProps<"input">, "onChange"> & {
	onValueChange?: (value: string) => void;
}) {
	return (
		<div className="sticky top-0 z-10 border-b bg-popover p-2">
			<input
				data-slot="combobox-input"
				className={cn(
					"w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
					className,
				)}
				value={value ?? ""}
				onChange={(e) => onValueChange?.(e.target.value)}
				{...props}
			/>
		</div>
	);
}

function ComboboxList({
	className,
	onScrollToBottom,
	...props
}: React.ComponentProps<"div"> & {
	onScrollToBottom?: () => void | Promise<void>;
}) {
	const listRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const list = listRef.current;
		if (!list || !onScrollToBottom) {
			return;
		}

		let isLoading = false;

		const handleScroll = async () => {
			if (isLoading) {
				return;
			}

			const { scrollTop, scrollHeight, clientHeight } = list;
			const threshold = 50; // Trigger when 50px from bottom

			if (scrollTop + clientHeight >= scrollHeight - threshold) {
				isLoading = true;
				try {
					await onScrollToBottom();
				} finally {
					// Small delay to prevent rapid firing
					setTimeout(() => {
						isLoading = false;
					}, 300);
				}
			}
		};

		list.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			list.removeEventListener("scroll", handleScroll);
		};
	}, [onScrollToBottom]);

	return (
		<div
			ref={listRef}
			data-slot="combobox-list"
			role="listbox"
			className={cn("flex-1 overflow-auto p-1", className)}
			style={{ maxHeight: "calc(400px - 100px)" }} // Account for input and summary height
			{...props}
		/>
	);
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="combobox-empty"
			className={cn(
				"px-3 py-6 text-center text-sm text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function ComboboxGroup({
	className,
	heading,
	children,
	...props
}: React.ComponentProps<"div"> & { heading?: string }) {
	return (
		<div data-slot="combobox-group" className={cn("p-1", className)} {...props}>
			{heading ? (
				<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
					{heading}
				</div>
			) : null}
			<div className="space-y-1">{children}</div>
		</div>
	);
}

function ComboboxItem({
	className,
	onSelect,
	children,
	...props
}: React.ComponentProps<"div"> & { value?: string; onSelect?: () => void }) {
	const { setOpen } = useComboboxContext();
	return (
		<div
			data-slot="combobox-item"
			role="option"
			tabIndex={0}
			className={cn(
				"cursor-pointer select-none rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
				className,
			)}
			onClick={() => {
				onSelect?.();
				// close on select, matching typical combobox behavior
				setOpen(false);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect?.();
					setOpen(false);
				}
			}}
			{...props}
		>
			{children}
		</div>
	);
}

export {
	Combobox,
	ComboboxTrigger,
	ComboboxContent,
	ComboboxInput,
	ComboboxList,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxItem,
};
