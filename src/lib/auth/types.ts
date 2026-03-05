import type { serverAuthClient } from "./serverAuthClient";

type InferredSession = typeof serverAuthClient.$Infer.Session;

export type SessionUser = InferredSession["user"];
export type SessionData = InferredSession["session"];
export type Session = { user: SessionUser; session: SessionData } | null;
