import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "../firebase";

export async function adminCreateAuthUser(email: string, password: string) {
  const existing = getApps().find((a) => a.name === "SECONDARY_ADMIN_APP");
  const secondaryApp =
    existing ?? initializeApp(firebaseConfig, "SECONDARY_ADMIN_APP");
  const secondaryAuth = getAuth(secondaryApp);
  await setPersistence(secondaryAuth, inMemoryPersistence);
  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );
  await signOut(secondaryAuth);
  return cred.user;
}