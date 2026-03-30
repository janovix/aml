import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
	DashboardLayout,
	type DashboardHeaderToolbarProps,
} from "../../components/layout/DashboardLayout";
import { ClientsPageContent } from "../../components/clients/ClientsPageContent";
import type { Language } from "@/lib/translations";
import type { NotificationSoundType } from "@/lib/settings/types";

/**
 * Story-only args: wired to `headerToolbar` so the dashboard header matches
 * production order (TooltipProvider wraps the header; SidebarTrigger, NavBreadcrumb,
 * LanguageSwitcher, ThemeSwitcher, NotificationsWidget, NavbarChatButton).
 */
type DashboardLayoutStoryArgs = ComponentProps<typeof DashboardLayout> & {
	currentLanguage: Language;
	notificationSound: boolean;
	notificationSoundType: NotificationSoundType;
	showPulse: boolean;
	maxVisible: number;
};

function splitStoryArgs(args: DashboardLayoutStoryArgs): {
	layout: ComponentProps<typeof DashboardLayout>;
	toolbar: DashboardHeaderToolbarProps;
} {
	const {
		currentLanguage,
		notificationSound,
		notificationSoundType,
		showPulse,
		maxVisible,
		...layout
	} = args;
	return {
		layout,
		toolbar: {
			currentLanguage,
			notificationSound,
			notificationSoundType,
			showPulse,
			maxVisible,
		},
	};
}

function DashboardLayoutWithHeaderControls(args: DashboardLayoutStoryArgs) {
	const { layout, toolbar } = splitStoryArgs(args);
	const [language, setLanguage] = useState<Language>(
		toolbar.currentLanguage ?? "es",
	);

	useEffect(() => {
		if (toolbar.currentLanguage !== undefined) {
			setLanguage(toolbar.currentLanguage);
		}
	}, [toolbar.currentLanguage]);

	const headerToolbar: DashboardHeaderToolbarProps = {
		...toolbar,
		currentLanguage: language,
		onLanguageChange: setLanguage,
	};

	return <DashboardLayout {...layout} headerToolbar={headerToolbar} />;
}

const meta = {
	title: "Layout/DashboardLayout",
	component: DashboardLayout,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Dashboard layout with sidebar and header. The header is wrapped in TooltipProvider (inside the layout) with toolbar controls: SidebarTrigger, NavBreadcrumb, LanguageSwitcher, ThemeSwitcher, NotificationsWidget, NavbarChatButton — same order as production.",
			},
		},
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
	tags: ["autodocs"],
	args: {
		children: <ClientsPageContent />,
		currentLanguage: "es" satisfies Language,
		notificationSound: true,
		notificationSoundType: "chime" satisfies NotificationSoundType,
		showPulse: true,
		maxVisible: 50,
	},
	argTypes: {
		currentLanguage: {
			control: "select",
			options: ["es", "en"] satisfies Language[],
			description:
				"LanguageSwitcher selection (synced with Storybook controls)",
		},
		notificationSound: {
			control: "boolean",
			description: "NotificationsWidget playSound",
		},
		notificationSoundType: {
			control: "select",
			options: [
				"chime",
				"bell",
				"pop",
				"ding",
				"none",
			] satisfies NotificationSoundType[],
			description: "NotificationsWidget soundType",
		},
		showPulse: {
			control: "boolean",
			description: "NotificationsWidget showPulse",
		},
		maxVisible: {
			control: { type: "number", min: 1, max: 100 },
			description: "NotificationsWidget maxVisible",
		},
	},
	render: (args) => <DashboardLayoutWithHeaderControls {...args} />,
} satisfies Meta<DashboardLayoutStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: <ClientsPageContent />,
	},
};

export const HeaderToolbar: Story = {
	name: "Header toolbar (controls)",
	parameters: {
		docs: {
			description: {
				story:
					"Use the controls panel to toggle language, notification sound, pulse, and max visible. ThemeSwitcher uses the same variant/size/shape/side/align as DashboardLayout (mini, sm, rounded, bottom, end).",
			},
		},
	},
};

export const Collapsed: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Mobile: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Tablet: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const WithOperations: Story = {
	args: {
		children: (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
					<p className="text-muted-foreground">
						Gestión de transacciones de vehículos
					</p>
				</div>
			</div>
		),
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/operations",
			},
		},
	},
};
