import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ maxInstances: 10 });
export const health = onRequest((req, res) => {
	res.send("Functions disabled for this project. Frontend uses direct Firestore reads.");
});