import { isValidPhoneNumber } from "react-phone-number-input";

export function validatePhone(phone?: string): {
	isValid: boolean;
	error?: string;
} {
	if (!phone) {
		return {
			isValid: false,
			error: "El teléfono es obligatorio",
		};
	}

	if (!isValidPhoneNumber(phone)) {
		return {
			isValid: false,
			error: "Número de teléfono inválido",
		};
	}

	if (/(.)\1{6,}/.test(phone)) {
		return {
			isValid: false,
			error: "Número de teléfono no válido",
		};
	}

	return { isValid: true };
}
