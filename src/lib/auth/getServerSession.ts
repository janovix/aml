import { serverAuthClient } from "./serverAuthClient";
import type { Session } from "./types";

export async function getServerSession(): Promise<Session> {
	try {
		const result = await serverAuthClient.getSession();
		if (!result.data) return null;
		const { user, session } = result.data;
		return {
			user: {
				...user,
				createdAt: new Date(user.createdAt),
				updatedAt: new Date(user.updatedAt),
			},
			session: {
				...session,
				expiresAt: new Date(session.expiresAt),
				createdAt: new Date(session.createdAt),
				updatedAt: new Date(session.updatedAt),
			},
		};
	} catch {
		return null;
	}
}
