"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import type { Country, Value as PhoneValue } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

import "react-phone-number-input/style.css";

type PhoneInputProps = Omit<
	React.ComponentProps<"input">,
	"onChange" | "value" | "ref"
> &
	Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
		onChange?: (value: PhoneValue) => void;
		className?: string;
	};

const PhoneInput = React.forwardRef<
	React.ElementRef<typeof RPNInput.default>,
	PhoneInputProps
>(({ className, onChange, value, ...props }, ref) => {
	// Normalize phone value to E.164 format (remove spaces) before passing to library
	const normalizedValue = React.useMemo(() => {
		if (!value || typeof value !== "string") {
			return value || undefined;
		}
		// Remove all spaces from the phone number to ensure E.164 format
		const cleaned = value.replace(/\s/g, "");
		return cleaned || undefined;
	}, [value]);

	return (
		<RPNInput.default
			ref={ref}
			className={cn(
				"flex h-9 w-full rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				className,
			)}
			international
			defaultCountry="MX"
			countrySelectComponent={CountrySelect}
			inputComponent={NumberInput}
			value={normalizedValue}
			/**
			 * Handles the onChange event.
			 *
			 * react-phone-number-input might trigger the onChange event as undefined
			 * when a valid phone number is not entered. To prevent this,
			 * the value is coerced to an empty string.
			 *
			 * @param {E164Number | undefined} value - The entered value
			 */
			onChange={(value) => onChange?.(value || ("" as PhoneValue))}
			{...props}
		/>
	);
});
PhoneInput.displayName = "PhoneInput";

const NumberInput = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
	return (
		<input
			ref={ref}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 bg-transparent px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				className,
			)}
			{...props}
		/>
	);
});
NumberInput.displayName = "NumberInput";

type CountrySelectOption = { label: string; value: Country };

type CountrySelectProps = {
	value?: Country;
	onChange?: (value: Country | undefined) => void;
	options: CountrySelectOption[];
	name?: string;
};

const CountrySelect = ({ value, onChange, options }: CountrySelectProps) => {
	const [open, setOpen] = React.useState(false);

	const selectedOption = options.find((option) => option.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="h-9 gap-1 border-r-0 rounded-r-none px-3"
				>
					{selectedOption && flags[selectedOption.value] ? (
						<span className="text-lg leading-none">
							{String.fromCharCode(
								...String(flags[selectedOption.value])
									.split("")
									.map((char: string) => 127397 + char.charCodeAt(0)),
							)}
						</span>
					) : null}
					<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Search country..." />
					<CommandList>
						<CommandEmpty>No country found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={() => {
										onChange?.(
											option.value === value ? undefined : option.value,
										);
										setOpen(false);
									}}
								>
									{flags[option.value] && (
										<span className="mr-2 text-lg leading-none">
											{String.fromCharCode(
												...String(flags[option.value])
													.split("")
													.map((char: string) => 127397 + char.charCodeAt(0)),
											)}
										</span>
									)}
									<CheckIcon
										className={cn(
											"ml-auto h-4 w-4",
											value === option.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export { PhoneInput };
export type { PhoneInputProps };
