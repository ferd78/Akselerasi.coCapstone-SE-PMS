import type { User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc, limit } from "firebase/firestore";
import { db } from "../firebase";

export async function resolveEmployeeId(user: User | null | undefined): Promise<string> {
  if (!user) return "emp1";
  try {
    const uid = user.uid;
    if (uid) {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) return userDocSnap.id;
    }

    if (user.email) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", user.email), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) return qSnap.docs[0].id;
      if (user.uid) {
        const newDocRef = doc(db, "users", user.uid);
        const newDoc = {
          name: user.displayName || "",
          email: user.email,
          role: "employee",
          createdAt: new Date().toISOString(),
        };
        await setDoc(newDocRef, newDoc);
        console.debug("resolveEmployeeId: created users/", newDocRef.id, "for", user.email);
        return newDocRef.id;
      }
    }
  } catch (err) {
    console.warn("resolveEmployeeId error", err);
  }
  console.debug("resolveEmployeeId: falling back to 'emp1' for", user?.email);
  return "emp1";
}