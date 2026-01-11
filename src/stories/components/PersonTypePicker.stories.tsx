import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
	PersonTypePicker,
	type PersonTypePickerProps,
} from "@/components/clients/PersonTypePicker";
import type { PersonType } from "@/types/client";
import { LanguageProvider } from "@/components/LanguageProvider";

const meta: Meta<typeof PersonTypePicker> = {
	title: "Components/PersonTypePicker",
	component: PersonTypePicker,
	decorators: [
		(Story) => (
			<LanguageProvider>
				<div className="max-w-2xl p-4">
					<Story />
				</div>
			</LanguageProvider>
		),
	],
	argTypes: {
		value: {
			control: "select",
			options: ["physical", "moral", "trust"] satisfies PersonType[],
			description: "The currently selected person type",
		},
		onChange: {
			action: "onChange",
			description: "Callback when person type is changed",
		},
		disabled: {
			control: "boolean",
			description: "Whether the picker is disabled",
		},
	},
};

export default meta;

type Story = StoryObj<typeof PersonTypePicker>;

// Interactive wrapper to handle state
function InteractivePersonTypePicker(
	props: PersonTypePickerProps & { onChange?: (value: PersonType) => void },
) {
	const [value, setValue] = useState<PersonType>(props.value);
	return (
		<PersonTypePicker
			{...props}
			value={value}
			onChange={(newValue) => {
				setValue(newValue);
				props.onChange?.(newValue);
			}}
		/>
	);
}

export const Default: Story = {
	args: {
		value: "physical",
		disabled: false,
	},
	render: (args) => <InteractivePersonTypePicker {...args} />,
};

export const PhysicalSelected: Story = {
	args: {
		value: "physical",
		disabled: false,
	},
	render: (args) => <InteractivePersonTypePicker {...args} />,
};

export const MoralSelected: Story = {
	args: {
		value: "moral",
		disabled: false,
	},
	render: (args) => <InteractivePersonTypePicker {...args} />,
};

export const TrustSelected: Story = {
	args: {
		value: "trust",
		disabled: false,
	},
	render: (args) => <InteractivePersonTypePicker {...args} />,
};

export const Disabled: Story = {
	args: {
		value: "physical",
		disabled: true,
	},
};
