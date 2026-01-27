import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Input> = {
	title: "UI/Input",
	component: Input,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "select",
			options: [
				"text",
				"email",
				"password",
				"number",
				"tel",
				"url",
				"search",
				"date",
				"time",
				"datetime-local",
			],
		},
		disabled: {
			control: "boolean",
		},
		required: {
			control: "boolean",
		},
	},
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
	args: {
		placeholder: "Type something…",
	},
};

export const WithValue: Story = {
	args: {
		defaultValue: "Hello",
	},
};

export const WithLabel: Story = {
	render: () => (
		<div className="space-y-2 w-64">
			<Label htmlFor="input-example">Email</Label>
			<Input id="input-example" type="email" placeholder="email@example.com" />
		</div>
	),
};

export const Password: Story = {
	args: {
		type: "password",
		placeholder: "Enter password",
	},
};

export const Number: Story = {
	args: {
		type: "number",
		placeholder: "Enter a number",
	},
};

export const Disabled: Story = {
	args: {
		placeholder: "Disabled input",
		disabled: true,
	},
};

export const Required: Story = {
	render: () => (
		<div className="space-y-2 w-64">
			<Label htmlFor="required-input">Required Field</Label>
			<Input
				id="required-input"
				placeholder="This field is required"
				required
			/>
		</div>
	),
};

export const Invalid: Story = {
	args: {
		placeholder: "Invalid input",
		"aria-invalid": true,
		defaultValue: "invalid@",
	},
};
