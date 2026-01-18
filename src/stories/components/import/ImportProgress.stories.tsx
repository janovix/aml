import type { Meta, StoryObj } from "@storybook/react";
import { ImportProgress } from "@/components/import/ImportProgress";
import type { ImportState } from "@/types/import";

const meta: Meta<typeof ImportProgress> = {
	title: "Import/ImportProgress",
	component: ImportProgress,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		onReset: () => {
			console.log("Reset clicked");
		},
	},
	decorators: [
		(Story) => (
			<div className="w-[500px]">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof ImportProgress>;

const baseState: ImportState = {
	status: "processing",
	importId: "IMP123456789",
	fileName: "clientes_enero_2026.xlsx",
	entityType: "CLIENT",
	totalRows: 150,
	processedRows: 0,
	successCount: 0,
	warningCount: 0,
	errorCount: 0,
	rows: [],
	error: null,
};

export const Uploading: Story = {
	args: {
		state: {
			...baseState,
			status: "uploading",
			totalRows: 0,
		},
	},
};

export const Processing: Story = {
	args: {
		state: {
			...baseState,
			status: "processing",
			processedRows: 75,
			successCount: 70,
			warningCount: 3,
			errorCount: 2,
		},
	},
};

export const HalfwayComplete: Story = {
	args: {
		state: {
			...baseState,
			status: "processing",
			processedRows: 75,
			successCount: 68,
			warningCount: 5,
			errorCount: 2,
		},
	},
};

export const AlmostComplete: Story = {
	args: {
		state: {
			...baseState,
			status: "processing",
			processedRows: 145,
			successCount: 138,
			warningCount: 4,
			errorCount: 3,
		},
	},
};

export const Completed: Story = {
	args: {
		state: {
			...baseState,
			status: "completed",
			processedRows: 150,
			successCount: 142,
			warningCount: 5,
			errorCount: 3,
		},
	},
};

export const Failed: Story = {
	args: {
		state: {
			...baseState,
			status: "failed",
			processedRows: 50,
			successCount: 45,
			warningCount: 3,
			errorCount: 2,
		},
	},
};

export const AllSuccess: Story = {
	args: {
		state: {
			...baseState,
			status: "completed",
			processedRows: 150,
			successCount: 150,
			warningCount: 0,
			errorCount: 0,
		},
	},
};

export const ManyErrors: Story = {
	args: {
		state: {
			...baseState,
			status: "completed",
			processedRows: 150,
			successCount: 80,
			warningCount: 20,
			errorCount: 50,
		},
	},
};
