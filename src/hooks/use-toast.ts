import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
	title?: string;
	description?: string;
	variant?:
		| "default"
		| "success"
		| "warning"
		| "error"
		| "info"
		| "loading"
		| "destructive"
		| "failure";
}

export function useToast() {
	const toast = useCallback((props: ToastProps) => {
		const { title, description, variant = "default" } = props;

		if (
			variant === "destructive" ||
			variant === "error" ||
			variant === "failure"
		) {
			sonnerToast.error(title, { description });
			return;
		}

		if (variant === "success") {
			sonnerToast.success(title, { description });
			return;
		}

		if (variant === "warning") {
			sonnerToast.warning(title, { description });
			return;
		}

		if (variant === "info") {
			sonnerToast.info(title, { description });
			return;
		}

		if (variant === "loading") {
			sonnerToast.loading(title, { description });
			return;
		}

		sonnerToast(title, { description });
	}, []);

	return { toast };
}

export { toast as sonnerToast } from "sonner";
