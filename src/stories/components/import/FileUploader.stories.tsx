import type { Meta, StoryObj } from "@storybook/react";
import { FileUploader } from "@/components/import/FileUploader";

const meta: Meta<typeof FileUploader> = {
	title: "Import/FileUploader",
	component: FileUploader,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		isUploading: {
			control: "boolean",
			description: "Shows loading state when file is being uploaded",
		},
	},
	args: {
		onFileUpload: (file, entityType) => {
			console.log("File uploaded:", file.name, "Entity type:", entityType);
		},
	},
};

export default meta;

type Story = StoryObj<typeof FileUploader>;

export const Default: Story = {
	args: {
		isUploading: false,
	},
};

export const Uploading: Story = {
	args: {
		isUploading: true,
	},
};
