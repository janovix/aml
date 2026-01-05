"use client";

import { useState, useEffect } from "react";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Edit,
	Flag,
	FileText,
	Building2,
	MapPin,
	Phone,
	Mail,
	Calendar,
	User,
	Hash,
} from "lucide-react";
import type { Client } from "../../types/client";
import { getClientDisplayName } from "../../types/client";
import { getClientById } from "../../lib/api/clients";
import { useToast } from "../../hooks/use-toast";
import { PageHero } from "@/components/page-hero";
import { PageHeroSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getPersonTypeStyle } from "../../lib/person-type-icon";
import { useLanguage } from "@/components/LanguageProvider";

interface ClientDetailsViewProps {
	clientId: string; // Client ID
}

/**
 * Skeleton component for ClientDetailsView
 * Used when loading the organization to show the appropriate skeleton
 */
export function ClientDetailsSkeleton(): React.ReactElement {
	return (
		<div className="space-y-6">
			<PageHeroSkeleton
				showStats={false}
				showBackButton={true}
				actionCount={3}
			/>
			{/* Content skeleton */}
			<div className="space-y-6">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{[1, 2].map((j) => (
									<div key={j} className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-5 w-40" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

export function ClientDetailsView({
	clientId,
}: ClientDetailsViewProps): React.JSX.Element {
	const { navigateTo } = useOrgNavigation();
	const { toast } = useToast();
	const { t } = useLanguage();
	const [client, setClient] = useState<Client | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchClient = async () => {
			try {
				setIsLoading(true);
				const data = await getClientById({
					id: clientId,
				});
				setClient(data);
			} catch (error) {
				console.error("Error fetching client:", error);
				toast({
					title: t("errorGeneric"),
					description: t("clientLoadError"),
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};
		fetchClient();
	}, [clientId, toast]);

	if (isLoading) {
		return <ClientDetailsSkeleton />;
	}

	if (!client) {
		return (
			<div className="space-y-6">
				<PageHero
					title={t("clientNotFound")}
					subtitle={`${t("clientNotExist")} (ID: ${clientId})`}
					icon={User}
					backButton={{
						label: t("clientBackToClients"),
						onClick: () => navigateTo("/clients"),
					}}
				/>
			</div>
		);
	}

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="space-y-6">
			<PageHero
				title={t("clientDetailsTitle")}
				subtitle={getClientDisplayName(client)}
				icon={client.personType === "physical" ? User : Building2}
				backButton={{
					label: t("clientBackToClients"),
					onClick: () => navigateTo("/clients"),
				}}
				actions={[
					{
						label: t("edit"),
						icon: Edit,
						onClick: () => navigateTo(`/clients/${clientId}/edit`),
					},
					{
						label: t("generateReport"),
						icon: FileText,
						onClick: () => {
							toast({
								title: t("comingSoon"),
								description: t("featureInDevelopment"),
							});
						},
						variant: "outline",
					},
					{
						label: t("markSuspicious"),
						icon: Flag,
						onClick: () => {
							toast({
								title: t("comingSoon"),
								description: t("featureInDevelopment"),
							});
						},
						variant: "outline",
					},
				]}
			/>

			<div className="space-y-6">
				{/* Información General Card - Enhanced with Person Type */}
				{(() => {
					const personTypeStyle = getPersonTypeStyle(client.personType);
					const PersonTypeIcon = personTypeStyle.icon;
					return (
						<Card>
							<CardContent className="p-6">
								<div className="flex flex-col sm:flex-row sm:items-center gap-6">
									{/* Person Type Section */}
									<div
										className={`flex items-center gap-4 rounded-xl border ${personTypeStyle.borderColor} ${personTypeStyle.bgColor} p-4 sm:min-w-[200px]`}
									>
										<div
											className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${personTypeStyle.bgColor}`}
										>
											<PersonTypeIcon
												className={`h-6 w-6 ${personTypeStyle.iconColor}`}
											/>
										</div>
										<div className="min-w-0">
											<p
												className={`font-semibold ${personTypeStyle.iconColor}`}
											>
												{personTypeStyle.label}
											</p>
											<p className="text-xs text-muted-foreground">
												{personTypeStyle.description}
											</p>
										</div>
									</div>

									{/* RFC Section */}
									<div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 flex-1">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
											<Hash className="h-6 w-6 text-muted-foreground" />
										</div>
										<div className="min-w-0">
											<p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
												RFC
											</p>
											<p className="font-mono text-lg font-semibold tracking-wide">
												{client.rfc}
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})()}

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							{client.personType === "physical" ? (
								<>
									<User className="h-5 w-5" />
									{t("clientPersonalData")}
								</>
							) : (
								<>
									<Building2 className="h-5 w-5" />
									{t("clientCompanyData")}
								</>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{client.personType === "physical"
										? t("clientFirstName")
										: t("clientBusinessName")}
								</dt>
								<dd className="text-base">{getClientDisplayName(client)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{t("clientRfc")}
								</dt>
								<dd className="text-base font-mono">{client.rfc}</dd>
							</div>
							{client.personType === "physical" && client.birthDate && (
								<div>
									<dt className="text-sm font-medium text-muted-foreground mb-1">
										{t("clientBirthDate")}
									</dt>
									<dd className="text-base">{formatDate(client.birthDate)}</dd>
								</div>
							)}
							{(client.personType === "moral" ||
								client.personType === "trust") &&
								client.incorporationDate && (
									<div>
										<dt className="text-sm font-medium text-muted-foreground mb-1">
											{t("clientConstitutionDate")}
										</dt>
										<dd className="text-base">
											{formatDate(client.incorporationDate)}
										</dd>
									</div>
								)}
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Phone className="h-5 w-5" />
							{t("clientContactInfo")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<Mail className="h-4 w-4" />
									{t("clientEmail")}
								</dt>
								<dd className="text-base">{client.email}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<Phone className="h-4 w-4" />
									{t("clientPhone")}
								</dt>
								<dd className="text-base">{client.phone}</dd>
							</div>
							<div className="md:col-span-2">
								<dt className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
									<MapPin className="h-4 w-4" />
									{t("clientAddressInfo")}
								</dt>
								<dd className="text-base">
									{client.street} {client.externalNumber}
									{client.internalNumber && ` Int. ${client.internalNumber}`}
									<br />
									{client.neighborhood && `${client.neighborhood}, `}
									C.P. {client.postalCode}
									<br />
									{client.city}, {client.stateCode}, {client.country}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Calendar className="h-5 w-5" />
							{t("clientTransactionHistory")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{t("clientRegistrationDate")}
								</dt>
								<dd className="text-base">{formatDate(client.createdAt)}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-muted-foreground mb-1">
									{t("clientLastUpdate")}
								</dt>
								<dd className="text-base">{formatDate(client.updatedAt)}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{t("clientComplianceNotes")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{client.notes || t("clientNoNotes")}
						</p>
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium">{t("clientLastUpdate")}:</span>{" "}
								{formatDate(client.updatedAt)}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
