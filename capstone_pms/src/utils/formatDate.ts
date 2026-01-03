import { Timestamp } from "firebase/firestore";

export function formatDate(value: any): string {
  if (!value) return "—";

  // Firestore Timestamp
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString();
  }

  // Some timestamps come as { seconds, nanoseconds }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleDateString();
  }

  // ISO string / YYYY-MM-DD
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString();
  }

  // JS Date
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return "—";
}
