import { json } from "@sveltejs/kit";
import crypto from "crypto";
import { z } from "zod";
import { collections } from "$lib/server/database";
import { sha256 } from "$lib/utils/sha256";
import { addWeeks } from "date-fns";
import { ObjectId } from "mongodb";
import { refreshSessionCookie } from "$lib/server/auth";
import { env as publicEnv } from "$env/dynamic/public";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const BodySchema = z.object({ idToken: z.string().min(10) });

// Firebase ID token verification using Google's JWKS (no admin SDK required)
const JWKS = createRemoteJWKSet(new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
));

export async function POST({ request, cookies }) {
  const body = await request.json();
  const { idToken } = BodySchema.parse(body);

  const projectId = publicEnv.PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return new Response("Missing PUBLIC_FIREBASE_PROJECT_ID", { status: 500 });
  }

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const uid = String(payload.sub);
  const email = (payload.email as string) ?? `user-${uid}@firebase.local`;
  const avatarUrl = (payload.picture as string) ?? "";
  const name = (payload.name as string) ?? email.split("@")[0];

  // Create our app session and user if missing
  const secretSessionId = crypto.randomUUID();
  const sessionId = await sha256(secretSessionId);

  let user = await collections.users.findOne({ email });
  if (!user) {
    const { insertedId } = await collections.users.insertOne({
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      username: email,
      name,
      email,
      avatarUrl,
      hfUserId: uid,
      isAdmin: false,
      isEarlyAccess: false,
    });
    user = { _id: insertedId } as any;
  }

  await collections.sessions.insertOne({
    _id: new ObjectId(),
    sessionId,
    userId: user._id,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: addWeeks(new Date(), 2),
  });

  // Set cookie for our app session
  refreshSessionCookie(cookies, secretSessionId);

  return json({ ok: true });
}


