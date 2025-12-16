import { useState, useCallback } from "react";

interface ToastProps {
	title: string;
	description?: string;
	variant?: "default" | "destructive";
}

export function useToast() {
	const [toasts, setToasts] = useState<ToastProps[]>([]);

	const toast = useCallback((props: ToastProps) => {
		// For now, just add to state
		// In a real app, this would integrate with a toast notification system
		setToasts((prev) => [...prev, props]);

		// Auto-remove after 3 seconds
		setTimeout(() => {
			setToasts((prev) => prev.slice(1));
		}, 3000);
	}, []);

	return { toast, toasts };
}
