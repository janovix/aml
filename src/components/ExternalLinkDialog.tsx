"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogBody,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";

const STORAGE_KEY = "janovix_skip_external_link_warning";

const BARE_DOMAIN_RE = /^[\w-]+(\.[\w-]+)+(\/.*)?\s*$/;

/** Detects full URLs (`https://…`) and bare domains (`mx.linkedin.com`). */
export function looksLikeUrl(value: string): boolean {
	return /^https?:\/\//i.test(value) || BARE_DOMAIN_RE.test(value);
}

/** Ensures the string has an `https://` prefix so it can be used as an href. */
export function ensureProtocol(value: string): string {
	return /^https?:\/\//i.test(value) ? value : `https://${value.trim()}`;
}

/** Extracts hostname from a URL or bare domain string. */
export function extractHostname(value: string): string {
	try {
		return new URL(ensureProtocol(value)).hostname;
	} catch {
		return value;
	}
}

function getSkipWarning(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === "true";
	} catch {
		return false;
	}
}

function setSkipWarning(value: boolean) {
	try {
		localStorage.setItem(STORAGE_KEY, String(value));
	} catch {
		/* noop – SSR / incognito */
	}
}

export function useExternalLinkRedirect() {
	const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);

	const handleExternalLink = React.useCallback(
		(url: string, e?: React.MouseEvent) => {
			e?.preventDefault();
			if (getSkipWarning()) {
				window.open(url, "_blank", "noopener,noreferrer");
				return;
			}
			setPendingUrl(url);
		},
		[],
	);

	const confirm = React.useCallback(() => {
		if (pendingUrl) {
			window.open(pendingUrl, "_blank", "noopener,noreferrer");
		}
		setPendingUrl(null);
	}, [pendingUrl]);

	const cancel = React.useCallback(() => {
		setPendingUrl(null);
	}, []);

	return {
		pendingUrl,
		isOpen: pendingUrl !== null,
		handleExternalLink,
		confirm,
		cancel,
	};
}

interface ExternalLinkDialogProps {
	open: boolean;
	url: string | null;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ExternalLinkDialog({
	open,
	url,
	onConfirm,
	onCancel,
}: ExternalLinkDialogProps) {
	const [dontShowAgain, setDontShowAgain] = React.useState(false);

	const handleConfirm = () => {
		if (dontShowAgain) {
			setSkipWarning(true);
		}
		onConfirm();
		setDontShowAgain(false);
	};

	const handleCancel = () => {
		onCancel();
		setDontShowAgain(false);
	};

	const hostname = React.useMemo(() => {
		if (!url) return "";
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}, [url]);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ExternalLink className="h-5 w-5" />
						Redirección a sitio externo
					</DialogTitle>
					<DialogDescription>
						Serás redirigido a un sitio web de terceros.
					</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Estás a punto de visitar{" "}
							<span className="font-medium text-foreground">{hostname}</span>.
							Este sitio no está bajo el control de Janovix y puede tener sus
							propias políticas de privacidad y términos de uso.
						</p>
						{url && (
							<div className="rounded-md bg-muted p-3 text-xs break-all font-mono text-muted-foreground">
								{url}
							</div>
						)}
						<div className="flex items-center gap-2">
							<Checkbox
								id="skip-external-warning"
								checked={dontShowAgain}
								onCheckedChange={(checked) =>
									setDontShowAgain(checked === true)
								}
							/>
							<label
								htmlFor="skip-external-warning"
								className="text-sm cursor-pointer select-none"
							>
								No volver a mostrar este aviso
							</label>
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button onClick={handleConfirm}>
						<ExternalLink className="h-4 w-4 mr-2" />
						Continuar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
