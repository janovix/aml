import type { Meta, StoryObj } from "@storybook/react";
import { RowStatusTable } from "@/components/import/RowStatusTable";
import type { RowDisplayData } from "@/types/import";

const meta: Meta<typeof RowStatusTable> = {
	title: "Import/RowStatusTable",
	component: RowStatusTable,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className="h-[600px] w-full">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof RowStatusTable>;

const generateRows = (count: number): RowDisplayData[] => {
	const statuses = ["SUCCESS", "WARNING", "ERROR", "PENDING"] as const;
	const names = [
		"Juan Pérez García",
		"María López Hernández",
		"Carlos Rodríguez Sánchez",
		"Ana Martínez Torres",
		"Pedro González Ramírez",
		"Empresa ABC SA de CV",
		"Comercializadora XYZ",
		"Servicios Integrales MX",
	];
	const rfcs = [
		"PEGJ900515HDFRRL09",
		"LOHM850320MDFRRL05",
		"ROSC780112HDFRRL07",
		"MATA920808MDFRRL03",
		"GORP750225HDFRRL01",
		"EAB200115ABC",
		"CXY190320XYZ",
		"SIM180808MXX",
	];
	const messages: Record<string, string | null> = {
		SUCCESS: "Cliente creado exitosamente",
		WARNING: "Cliente creado con datos incompletos",
		ERROR: null,
		PENDING: null,
	};
	const errors: Record<string, string[] | null> = {
		SUCCESS: null,
		WARNING: null,
		ERROR: [
			"RFC inválido: formato incorrecto",
			"Email no es válido",
			"Campo obligatorio faltante: teléfono",
		],
		PENDING: null,
	};

	return Array.from({ length: count }, (_, i) => {
		const status = statuses[i % statuses.length];
		return {
			rowNumber: i + 1,
			data: {
				nombre: names[i % names.length],
				rfc: rfcs[i % rfcs.length],
				email: `cliente${i + 1}@example.com`,
				telefono: `+52 55 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
			},
			status,
			message: messages[status],
			errors: errors[status],
			entityId:
				status === "SUCCESS" ? `CLT${String(i + 1).padStart(9, "0")}` : null,
		};
	});
};

export const Empty: Story = {
	args: {
		rows: [],
		currentRow: 0,
	},
};

export const FewRows: Story = {
	args: {
		rows: generateRows(5),
		currentRow: 3,
	},
};

export const ManyRows: Story = {
	args: {
		rows: generateRows(50),
		currentRow: 25,
	},
};

export const AllSuccess: Story = {
	args: {
		rows: Array.from({ length: 20 }, (_, i) => ({
			rowNumber: i + 1,
			data: {
				nombre: `Cliente ${i + 1}`,
				rfc: `RFC${String(i + 1).padStart(10, "0")}`,
				email: `cliente${i + 1}@example.com`,
				telefono: "+52 55 1234 5678",
			},
			status: "SUCCESS" as const,
			message: "Cliente creado exitosamente",
			errors: null,
			entityId: `CLT${String(i + 1).padStart(9, "0")}`,
		})),
		currentRow: 20,
	},
};

export const AllErrors: Story = {
	args: {
		rows: Array.from({ length: 10 }, (_, i) => ({
			rowNumber: i + 1,
			data: {
				nombre: `Cliente ${i + 1}`,
				rfc: "INVALID",
				email: "not-an-email",
				telefono: "123",
			},
			status: "ERROR" as const,
			message: null,
			errors: [
				"RFC inválido: formato incorrecto",
				"Email no es válido",
				"Teléfono debe tener al menos 10 dígitos",
			],
			entityId: null,
		})),
		currentRow: 10,
	},
};

export const MixedWithWarnings: Story = {
	args: {
		rows: [
			{
				rowNumber: 1,
				data: {
					nombre: "Juan Pérez",
					rfc: "PEGJ900515HDR",
					email: "juan@example.com",
					telefono: "+52 55 1234 5678",
				},
				status: "SUCCESS",
				message: "Cliente creado exitosamente",
				errors: null,
				entityId: "CLT000000001",
			},
			{
				rowNumber: 2,
				data: {
					nombre: "María López",
					rfc: "LOHM850320MDR",
					email: "maria@example.com",
					telefono: "",
				},
				status: "WARNING",
				message: "Cliente creado sin teléfono - se recomienda actualizar",
				errors: null,
				entityId: "CLT000000002",
			},
			{
				rowNumber: 3,
				data: {
					nombre: "",
					rfc: "INVALID_RFC",
					email: "invalid",
					telefono: "123",
				},
				status: "ERROR",
				message: null,
				errors: [
					"Nombre es obligatorio",
					"RFC inválido",
					"Email inválido",
					"Teléfono muy corto",
				],
				entityId: null,
			},
			{
				rowNumber: 4,
				data: {
					nombre: "Carlos Rodríguez",
					rfc: "ROSC780112HDR",
					email: "carlos@example.com",
					telefono: "+52 55 9876 5432",
				},
				status: "PENDING",
				message: null,
				errors: null,
				entityId: null,
			},
			{
				rowNumber: 5,
				data: {
					nombre: "Duplicado",
					rfc: "PEGJ900515HDR",
					email: "dup@example.com",
					telefono: "+52 55 1111 2222",
				},
				status: "SKIPPED",
				message: "Omitido: RFC ya existe en el sistema",
				errors: null,
				entityId: null,
			},
		],
		currentRow: 4,
	},
};

export const Processing: Story = {
	args: {
		rows: [
			...Array.from({ length: 5 }, (_, i) => ({
				rowNumber: i + 1,
				data: {
					nombre: `Cliente ${i + 1}`,
					rfc: `RFC${String(i + 1).padStart(10, "0")}`,
					email: `cliente${i + 1}@example.com`,
					telefono: "+52 55 1234 5678",
				},
				status: "SUCCESS" as const,
				message: "Cliente creado exitosamente",
				errors: null,
				entityId: `CLT${String(i + 1).padStart(9, "0")}`,
			})),
			...Array.from({ length: 15 }, (_, i) => ({
				rowNumber: i + 6,
				data: {
					nombre: `Cliente ${i + 6}`,
					rfc: `RFC${String(i + 6).padStart(10, "0")}`,
					email: `cliente${i + 6}@example.com`,
					telefono: "+52 55 1234 5678",
				},
				status: "PENDING" as const,
				message: null,
				errors: null,
				entityId: null,
			})),
		],
		currentRow: 6,
	},
};
