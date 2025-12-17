"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ComboboxContextValue = {
	open: boolean;
	setOpen: (next: boolean) => void;
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

	const setOpen = React.useCallback(
		(next: boolean) => {
			onOpenChange?.(next);
			if (openProp === undefined) setUncontrolledOpen(next);
		},
		[onOpenChange, openProp],
	);

	const value = React.useMemo<ComboboxContextValue>(
		() => ({ open, setOpen }),
		[open, setOpen],
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
	const { open, setOpen } = useComboboxContext();
	return (
		<button
			type="button"
			data-slot="combobox-trigger"
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
	const { open } = useComboboxContext();
	if (!open) return null;
	return (
		<div
			data-slot="combobox-content"
			className={cn(
				"mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
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
		<div className="border-b p-2">
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

function ComboboxList({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="combobox-list"
			role="listbox"
			className={cn("max-h-60 overflow-auto p-1", className)}
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
