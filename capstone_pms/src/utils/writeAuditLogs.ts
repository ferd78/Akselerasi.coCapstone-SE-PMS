import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export type AuditAction =
  | "EVALUATION_SUBMITTED"
  | "REWARD_APPROVED"
  | "USER_CREATED"
  | "FEEDBACK_REQUEST_SENT"
  | "FEEDBACK_SUBMITTED";

export type AuditLogMeta = Record<string, any>;

export async function writeAuditLog(params: {
  action: AuditAction;
  details: string;
  ip?: string;
  meta?: AuditLogMeta;
}) {
  const actor =
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    auth.currentUser?.uid ||
    "Unknown";

  await addDoc(collection(db, "auditLogs"), {
    timestamp: serverTimestamp(),
    actor,
    action: params.action,
    details: params.details,
    ip: params.ip ?? "—",
    meta: params.meta ?? {},
  });
}