import type { Meta, StoryObj } from "@storybook/react";
import { PageHero } from "../../components/page-hero/page-hero";
import type { StatCard } from "../../components/page-hero/page-hero";
import { Users, FileText, AlertTriangle, TrendingUp, Plus } from "lucide-react";

const defaultStats: StatCard[] = [
	{
		label: "Total Users",
		value: 1250,
		icon: Users,
	},
	{
		label: "Active Sessions",
		value: 342,
		icon: TrendingUp,
		variant: "primary",
	},
	{
		label: "Documents",
		value: 89,
		icon: FileText,
	},
];

const meta = {
	title: "Components/PageHero",
	component: PageHero,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Dashboard",
		subtitle: "Overview of your system",
		icon: Users,
		stats: defaultStats,
	},
};

export const WithCTA: Story = {
	args: {
		title: "Users",
		subtitle: "Manage your user accounts",
		icon: Users,
		stats: defaultStats,
		ctaLabel: "Add User",
		ctaIcon: Plus,
		onCtaClick: () => {
			console.log("CTA clicked");
		},
	},
};

export const SingleStat: Story = {
	args: {
		title: "Reports",
		subtitle: "View and manage reports",
		icon: FileText,
		stats: [
			{
				label: "Total Reports",
				value: 45,
				icon: FileText,
			},
		],
		ctaLabel: "New Report",
		ctaIcon: Plus,
	},
};

export const ManyStats: Story = {
	args: {
		title: "Analytics",
		subtitle: "Comprehensive analytics dashboard",
		icon: TrendingUp,
		stats: [
			...defaultStats,
			{
				label: "Revenue",
				value: "$125,000",
				icon: TrendingUp,
			},
			{
				label: "Growth",
				value: "+15%",
				icon: TrendingUp,
			},
			{
				label: "Alerts",
				value: 12,
				icon: AlertTriangle,
			},
		],
	},
};

export const Mobile: Story = {
	args: {
		title: "Dashboard",
		subtitle: "Overview of your system",
		icon: Users,
		stats: defaultStats,
		ctaLabel: "Add User",
		ctaIcon: Plus,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};
