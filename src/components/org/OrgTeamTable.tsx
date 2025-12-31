"use client";

import { useEffect, useMemo, useState } from "react";
import {
	MoreHorizontal,
	UserPlus,
	Mail,
	Shield,
	UserX,
	Search,
	Clock,
	RefreshCw,
	XCircle,
	Send,
	ChevronDown,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	useOrgStore,
	type OrganizationMember,
	type OrganizationRole,
	type OrganizationInvitation,
} from "@/lib/org-store";
import {
	listMembers,
	inviteMember,
	listInvitations,
	cancelInvitation,
	resendInvitation,
} from "@/lib/auth/organizations";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

const roleLabels: Record<OrganizationRole, string> = {
	owner: "Owner",
	admin: "Administrator",
	manager: "Manager",
	member: "Member",
	analyst: "Analyst",
	readonly: "Read-only",
};

const roleColors: Record<OrganizationRole, string> = {
	owner: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	admin: "bg-purple-500/10 text-purple-600 border-purple-500/20",
	manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	member: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	analyst: "bg-green-500/10 text-green-600 border-green-500/20",
	readonly: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export function OrgTeamTable() {
	const { toast } = useToast();
	const { currentOrg, members, setMembers } = useOrgStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [isLoading, setIsLoading] = useState(false);
	const [isInviting, setIsInviting] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<OrganizationRole>("member");
	const [openInvite, setOpenInvite] = useState(false);

	// Invitations state
	const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
	const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
	const [invitationsOpen, setInvitationsOpen] = useState(true);
	const [processingInvitationId, setProcessingInvitationId] = useState<
		string | null
	>(null);

	useEffect(() => {
		let cancelled = false;
		async function loadMembers() {
			if (!currentOrg) return;
			setIsLoading(true);
			const result = await listMembers(currentOrg.id);
			if (cancelled) return;
			if (result.data) {
				setMembers(result.data);
			} else if (result.error) {
				toast({
					variant: "destructive",
					title: "Failed to load members",
					description: result.error,
				});
			}
			setIsLoading(false);
		}
		loadMembers();
		return () => {
			cancelled = true;
		};
	}, [currentOrg?.id, setMembers, toast]);

	// Load pending invitations
	useEffect(() => {
		let cancelled = false;
		async function loadInvitations() {
			if (!currentOrg) return;
			setIsLoadingInvitations(true);
			const result = await listInvitations(currentOrg.id, "pending");
			if (cancelled) return;
			if (result.data) {
				setInvitations(result.data);
			}
			setIsLoadingInvitations(false);
		}
		loadInvitations();
		return () => {
			cancelled = true;
		};
	}, [currentOrg?.id]);

	const filteredMembers = useMemo(() => {
		const currentMembers = members.filter(
			(member) => member.organizationId === currentOrg?.id,
		);

		return currentMembers.filter((member) => {
			const nameMatch = (member.name || member.email || member.userId || "")
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === "all" || member.role === roleFilter;
			return nameMatch && matchesRole;
		});
	}, [currentOrg?.id, members, roleFilter, searchQuery]);

	const formatDate = (dateString?: string) => {
		if (!dateString) return "—";
		return new Date(dateString).toLocaleDateString("en-US", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const formatDateTime = (dateString?: string) => {
		if (!dateString) return "—";
		return new Date(dateString).toLocaleDateString("en-US", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const isExpired = (expiresAt: string) => {
		return new Date(expiresAt) < new Date();
	};

	const handleInvite = async () => {
		if (!currentOrg || !inviteEmail) return;
		setIsInviting(true);
		const result = await inviteMember({
			email: inviteEmail,
			role: inviteRole,
			organizationId: currentOrg.id,
		});

		if (result.error) {
			toast({
				variant: "destructive",
				title: "Failed to send invitation",
				description: result.error,
			});
		} else {
			toast({
				title: "Invitation sent",
				description: `${inviteEmail} was invited as ${roleLabels[inviteRole]}.`,
			});
			// Refresh invitations list
			const invResult = await listInvitations(currentOrg.id, "pending");
			if (invResult.data) {
				setInvitations(invResult.data);
			}
			setInviteEmail("");
			setInviteRole("member");
			setOpenInvite(false);
		}
		setIsInviting(false);
	};

	const handleCancelInvitation = async (invitation: OrganizationInvitation) => {
		if (!currentOrg) return;
		setProcessingInvitationId(invitation.id);

		const result = await cancelInvitation(invitation.id);
		if (result.error) {
			toast({
				variant: "destructive",
				title: "Failed to cancel invitation",
				description: result.error,
			});
		} else {
			toast({
				title: "Invitation canceled",
				description: `The invitation to ${invitation.email} has been canceled.`,
			});
			setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
		}
		setProcessingInvitationId(null);
	};

	const handleResendInvitation = async (invitation: OrganizationInvitation) => {
		if (!currentOrg) return;
		setProcessingInvitationId(invitation.id);

		const result = await resendInvitation({
			email: invitation.email,
			role: invitation.role,
			organizationId: currentOrg.id,
		});

		if (result.error) {
			toast({
				variant: "destructive",
				title: "Failed to resend invitation",
				description: result.error,
			});
		} else {
			toast({
				title: "Invitation resent",
				description: `The invitation was resent to ${invitation.email}.`,
			});
			// Refresh invitations to get updated expiration
			const invResult = await listInvitations(currentOrg.id, "pending");
			if (invResult.data) {
				setInvitations(invResult.data);
			}
		}
		setProcessingInvitationId(null);
	};

	if (!currentOrg) {
		return null;
	}

	const pendingCount = invitations.filter(
		(inv) => inv.status === "pending",
	).length;

	return (
		<div className="space-y-6">
			{/* Pending Invitations Section */}
			{pendingCount > 0 && (
				<Card>
					<Collapsible open={invitationsOpen} onOpenChange={setInvitationsOpen}>
						<CardHeader className="pb-3">
							<CollapsibleTrigger asChild>
								<div className="flex items-center justify-between cursor-pointer group">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
											<Clock className="h-5 w-5 text-amber-600" />
										</div>
										<div>
											<CardTitle className="text-base">
												Pending Invitations
											</CardTitle>
											<CardDescription>
												{pendingCount}{" "}
												{pendingCount === 1
													? "invitation awaiting response"
													: "invitations awaiting response"}
											</CardDescription>
										</div>
									</div>
									<ChevronDown
										className={`h-5 w-5 text-muted-foreground transition-transform ${
											invitationsOpen ? "rotate-180" : ""
										}`}
									/>
								</div>
							</CollapsibleTrigger>
						</CardHeader>
						<CollapsibleContent>
							<CardContent className="pt-0">
								<div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
									<div className="rounded-md border min-w-[500px]">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Email</TableHead>
													<TableHead>Role</TableHead>
													<TableHead>Sent</TableHead>
													<TableHead>Expires</TableHead>
													<TableHead className="w-[100px]"></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{isLoadingInvitations && (
													<TableRow>
														<TableCell
															colSpan={5}
															className="text-center text-muted-foreground"
														>
															Loading invitations...
														</TableCell>
													</TableRow>
												)}
												{!isLoadingInvitations &&
													invitations
														.filter((inv) => inv.status === "pending")
														.map((invitation) => (
															<TableRow key={invitation.id}>
																<TableCell>
																	<div className="flex items-center gap-3">
																		<Avatar className="h-8 w-8 shrink-0">
																			<AvatarFallback className="text-xs">
																				{invitation.email
																					.split("@")[0]
																					.slice(0, 2)
																					.toUpperCase()}
																			</AvatarFallback>
																		</Avatar>
																		<div className="min-w-0">
																			<p className="font-medium truncate text-sm">
																				{invitation.email}
																			</p>
																			{invitation.inviterName && (
																				<p className="text-xs text-muted-foreground">
																					Invited by {invitation.inviterName}
																				</p>
																			)}
																		</div>
																	</div>
																</TableCell>
																<TableCell>
																	<Badge
																		variant="outline"
																		className={
																			roleColors[invitation.role] ||
																			roleColors.member
																		}
																	>
																		{roleLabels[invitation.role] ||
																			invitation.role}
																	</Badge>
																</TableCell>
																<TableCell className="text-muted-foreground text-sm whitespace-nowrap">
																	{formatDateTime(invitation.createdAt)}
																</TableCell>
																<TableCell>
																	{isExpired(invitation.expiresAt) ? (
																		<Badge
																			variant="destructive"
																			className="text-xs"
																		>
																			Expired
																		</Badge>
																	) : (
																		<span className="text-muted-foreground text-sm whitespace-nowrap">
																			{formatDateTime(invitation.expiresAt)}
																		</span>
																	)}
																</TableCell>
																<TableCell>
																	<div className="flex items-center gap-1">
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8"
																			onClick={() =>
																				handleResendInvitation(invitation)
																			}
																			disabled={
																				processingInvitationId === invitation.id
																			}
																			title="Resend invitation"
																		>
																			{processingInvitationId ===
																			invitation.id ? (
																				<RefreshCw className="h-4 w-4 animate-spin" />
																			) : (
																				<Send className="h-4 w-4" />
																			)}
																		</Button>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 text-destructive hover:text-destructive"
																			onClick={() =>
																				handleCancelInvitation(invitation)
																			}
																			disabled={
																				processingInvitationId === invitation.id
																			}
																			title="Cancel invitation"
																		>
																			<XCircle className="h-4 w-4" />
																		</Button>
																	</div>
																</TableCell>
															</TableRow>
														))}
											</TableBody>
										</Table>
									</div>
								</div>
							</CardContent>
						</CollapsibleContent>
					</Collapsible>
				</Card>
			)}

			{/* Team Members Section */}
			<Card className="overflow-hidden">
				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="min-w-0">
							<CardTitle>Team Members</CardTitle>
							<CardDescription>
								Manage access and permissions for your organization
							</CardDescription>
						</div>
						<Dialog open={openInvite} onOpenChange={setOpenInvite}>
							<DialogTrigger asChild>
								<Button className="gap-2">
									<UserPlus className="h-4 w-4" />
									Invite member
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Invite member</DialogTitle>
									<DialogDescription>
										Send an email invitation to join the organization.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="invite-email">Email address</Label>
										<Input
											id="invite-email"
											type="email"
											required
											value={inviteEmail}
											onChange={(e) => setInviteEmail(e.target.value)}
											placeholder="person@company.com"
										/>
									</div>
									<div className="space-y-2">
										<Label>Role</Label>
										<Select
											value={inviteRole}
											onValueChange={(value) =>
												setInviteRole(value as OrganizationRole)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="owner">Owner</SelectItem>
												<SelectItem value="admin">Administrator</SelectItem>
												<SelectItem value="manager">Manager</SelectItem>
												<SelectItem value="member">Member</SelectItem>
												<SelectItem value="analyst">Analyst</SelectItem>
												<SelectItem value="readonly">Read-only</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setInviteEmail("");
												setInviteRole("member");
											}}
										>
											Cancel
										</Button>
									</DialogClose>
									<Button
										type="button"
										onClick={handleInvite}
										disabled={isInviting || !inviteEmail}
									>
										{isInviting ? "Sending..." : "Send invitation"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name or email..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Select value={roleFilter} onValueChange={setRoleFilter}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Filter by role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All roles</SelectItem>
								<SelectItem value="owner">Owner</SelectItem>
								<SelectItem value="admin">Administrator</SelectItem>
								<SelectItem value="manager">Manager</SelectItem>
								<SelectItem value="member">Member</SelectItem>
								<SelectItem value="analyst">Analyst</SelectItem>
								<SelectItem value="readonly">Read-only</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
						<div className="rounded-md border min-w-[600px]">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Member</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead className="w-[50px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading && (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center text-muted-foreground"
											>
												Loading members...
											</TableCell>
										</TableRow>
									)}
									{!isLoading &&
										filteredMembers.map((member) => (
											<TableRow key={member.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<Avatar className="h-9 w-9 shrink-0">
															<AvatarImage
																src={member.avatar || "/placeholder.svg"}
																alt={
																	member.name ?? member.email ?? member.userId
																}
															/>
															<AvatarFallback>
																{(member.name || member.email || "??")
																	.split(" ")
																	.map((n) => n[0])
																	.join("")
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<p className="font-medium truncate">
																{member.name || member.email || member.userId}
															</p>
															<p className="text-sm text-muted-foreground truncate">
																{member.email || "Email not available"}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={
															roleColors[member.role] || roleColors.member
														}
													>
														{roleLabels[member.role] || member.role}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															member.status === "active"
																? "default"
																: "secondary"
														}
													>
														{member.status === "active" ? "Active" : "Pending"}
													</Badge>
												</TableCell>
												<TableCell className="text-muted-foreground whitespace-nowrap">
													{formatDate(member.joinedAt || member.invitedAt)}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
															>
																<MoreHorizontal className="h-4 w-4" />
																<span className="sr-only">Actions</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuLabel>Actions</DropdownMenuLabel>
															<DropdownMenuSeparator />
															<DropdownMenuItem>
																<Mail className="mr-2 h-4 w-4" />
																Send message
															</DropdownMenuItem>
															<DropdownMenuItem>
																<Shield className="mr-2 h-4 w-4" />
																Change role
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem className="text-destructive">
																<UserX className="mr-2 h-4 w-4" />
																Remove from team
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</div>
					</div>

					{!isLoading && filteredMembers.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							No members found with the selected filters
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
