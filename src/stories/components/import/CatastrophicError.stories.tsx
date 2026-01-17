import type { Meta, StoryObj } from "@storybook/react";
import { CatastrophicError } from "@/components/import/CatastrophicError";

const meta: Meta<typeof CatastrophicError> = {
	title: "Import/CatastrophicError",
	component: CatastrophicError,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		onReset: () => {
			console.log("Reset clicked");
		},
	},
};

export default meta;

type Story = StoryObj<typeof CatastrophicError>;

export const FileParseError: Story = {
	args: {
		error: {
			type: "FILE_PARSE_ERROR",
			message: "No se pudo leer el archivo Excel",
			details:
				"El archivo parece estar corrupto o en un formato no soportado. Por favor verifica que el archivo sea un Excel válido (.xlsx, .xls) o CSV.",
			timestamp: new Date().toISOString(),
		},
		onRetry: () => {
			console.log("Retry clicked");
		},
	},
};

export const NetworkError: Story = {
	args: {
		error: {
			type: "NETWORK_ERROR",
			message: "Error de conexión con el servidor",
			details:
				"No se pudo establecer conexión con el servidor. Verifica tu conexión a internet e intenta nuevamente.",
			timestamp: new Date().toISOString(),
		},
		onRetry: () => {
			console.log("Retry clicked");
		},
	},
};

export const ValidationError: Story = {
	args: {
		error: {
			type: "VALIDATION_ERROR",
			message: "El archivo no tiene el formato esperado",
			details:
				"Las columnas del archivo no coinciden con la plantilla. Asegúrate de usar la plantilla correcta para el tipo de datos que deseas importar.",
			timestamp: new Date().toISOString(),
		},
	},
};

export const ServerError: Story = {
	args: {
		error: {
			type: "SERVER_ERROR",
			message: "Error interno del servidor",
			details:
				"Ocurrió un error inesperado en el servidor. Nuestro equipo ha sido notificado. Por favor intenta más tarde.",
			timestamp: new Date().toISOString(),
		},
		onRetry: () => {
			console.log("Retry clicked");
		},
	},
};

export const QuotaExceeded: Story = {
	args: {
		error: {
			type: "QUOTA_EXCEEDED",
			message: "Límite de importaciones alcanzado",
			details:
				"Has alcanzado el límite de importaciones para este mes. Contacta a ventas para aumentar tu límite.",
			timestamp: new Date().toISOString(),
		},
	},
};

export const MinimalError: Story = {
	args: {
		error: {
			type: "UNKNOWN_ERROR",
			message: "Ocurrió un error inesperado",
			timestamp: new Date().toISOString(),
		},
	},
};

export const WithoutRetry: Story = {
	args: {
		error: {
			type: "PERMANENT_ERROR",
			message:
				"El archivo contiene datos inválidos que no pueden ser procesados",
			details:
				"Este tipo de error no puede ser resuelto con un reintento. Por favor corrige los datos en el archivo y vuelve a subirlo.",
			timestamp: new Date().toISOString(),
		},
	},
};
