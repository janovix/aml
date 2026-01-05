"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useClientSearch } from "@/hooks/useClientSearch";
import { getClientById } from "@/lib/api/clients";
import { getClientDisplayName } from "@/types/client";
import { useJwt } from "@/hooks/useJwt";
import type { Client } from "@/types/client";

interface ClientFilterPopoverProps {
	activeValues: string[];
	onToggleFilter: (value: string) => void;
	onClear: () => void;
	clearText?: string;
	label?: string;
}

export function ClientFilterPopover({
	activeValues,
	onToggleFilter,
	onClear,
	clearText = "Limpiar",
	label = "Cliente",
}: ClientFilterPopoverProps) {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const { jwt } = useJwt();
	const listRef = useRef<HTMLDivElement>(null);

	const activeCount = activeValues.length;
	const clientId = activeValues[0]; // Client filter is single-select

	const {
		items: clients,
		loading,
		error,
		setSearchTerm: setClientSearchTerm,
		pagination,
	} = useClientSearch({
		pageSize: 15,
		debounceMs: 350,
		enabled: open, // Only search when popover is open
		initialSearch: searchTerm,
	});

	const hasMore = pagination ? pagination.page < pagination.totalPages : false;
	const loadingMore = false; // useClientSearch doesn't support loadMore yet

	// Fetch selected client by ID when filter is active
	useEffect(() => {
		if (clientId && jwt && !selectedClient) {
			getClientById({ id: clientId, jwt })
				.then((client) => {
					setSelectedClient(client);
				})
				.catch(() => {
					// Client might not exist - ignore
				});
		} else if (!clientId) {
			setSelectedClient(null);
		}
	}, [clientId, jwt, selectedClient]);

	// Reset search when popover closes
	useEffect(() => {
		if (!open) {
			setSearchTerm("");
			setClientSearchTerm("");
		}
	}, [open, setClientSearchTerm]);

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setClientSearchTerm(value);
	};

	const handleSelect = (clientId: string) => {
		if (activeValues.includes(clientId)) {
			onToggleFilter(clientId); // Deselect
		} else {
			// Clear previous selection and select new one (single-select)
			if (activeValues.length > 0) {
				activeValues.forEach((id) => onToggleFilter(id));
			}
			onToggleFilter(clientId);
		}
	};

	// Note: Infinite scroll for client search can be added later if needed
	// For now, we show the first page of results (15 clients)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					className={cn(
						"flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
						"border hover:bg-secondary/50",
						activeCount > 0
							? "bg-primary/5 border-primary/30 text-foreground"
							: "bg-transparent border-border text-muted-foreground hover:text-foreground",
					)}
				>
					<Users className="h-3.5 w-3.5" />
					<span className="hidden sm:inline">{label}</span>
					{activeCount > 0 && (
						<Badge
							variant="secondary"
							className="h-4 px-1 text-[10px] bg-primary text-primary-foreground ml-0.5"
						>
							{activeCount}
						</Badge>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<div className="px-3 py-2.5 border-b border-border">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">{label}</span>
						{activeCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onClear}
								className="h-6 px-2 text-xs text-muted-foreground"
							>
								{clearText}
							</Button>
						)}
					</div>
				</div>
				<Command shouldFilter={false} className="rounded-lg">
					<CommandInput
						value={searchTerm}
						onValueChange={handleSearchChange}
						placeholder="Buscar cliente..."
						className="h-9"
					/>
					<CommandList ref={listRef} className="max-h-64 overflow-y-auto">
						{loading && (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							</div>
						)}
						{!loading && error && (
							<CommandEmpty>
								<div className="py-4 text-sm text-destructive">{error}</div>
							</CommandEmpty>
						)}
						{!loading && !error && clients.length === 0 && (
							<CommandEmpty>
								<div className="py-4 text-sm text-muted-foreground">
									No se encontraron clientes
								</div>
							</CommandEmpty>
						)}
						{!loading && !error && clients.length > 0 && (
							<CommandGroup>
								{clients.map((client) => {
									const isSelected = activeValues.includes(client.id);
									const displayName =
										getClientDisplayName(client) || client.rfc || client.id;
									return (
										<CommandItem
											key={client.id}
											value={client.id}
											onSelect={() => handleSelect(client.id)}
											className="flex items-center gap-2.5 px-2.5 py-2"
										>
											<span
												className={cn(
													"flex items-center justify-center h-4 w-4 rounded border transition-colors flex-shrink-0",
													isSelected
														? "bg-primary border-primary"
														: "border-border",
												)}
											>
												{isSelected && (
													<Check className="h-3 w-3 text-primary-foreground" />
												)}
											</span>
											<span className="flex-1 text-left text-sm text-foreground">
												{displayName}
											</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
