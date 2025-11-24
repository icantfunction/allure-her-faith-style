import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { COGNITO_CONFIG } from "@/config/cognito.config";

const REGION = import.meta.env.VITE_AWS_REGION || COGNITO_CONFIG.REGION;
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || COGNITO_CONFIG.USER_POOL_ID;
const APP_CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID || COGNITO_CONFIG.APP_CLIENT_ID;

if (!REGION || !USER_POOL_ID || !APP_CLIENT_ID) {
  throw new Error("Missing env: VITE_AWS_REGION, VITE_USER_POOL_ID, VITE_APP_CLIENT_ID");
}

const pool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: APP_CLIENT_ID,
});

export function getCurrentUser(): CognitoUser | null {
  return pool.getCurrentUser();
}

export function getSession(): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err: any, session: CognitoUserSession | null) => {
      if (err || !session) return reject(err ?? new Error("No session"));
      if (session.isValid()) return resolve(session);
      user.refreshSession(session.getRefreshToken(), (e: any, refreshed: CognitoUserSession | null) => {
        if (e || !refreshed) return reject(e ?? new Error("Refresh failed"));
        resolve(refreshed);
      });
    });
  });
}

export async function getIdToken(): Promise<string> {
  const s = await getSession();
  return s.getIdToken().getJwtToken();
}

export function isAuthenticated(): Promise<boolean> {
  return getSession().then(() => true).catch(() => false);
}

export function signIn(username: string, password: string): Promise<CognitoUserSession> {
  const user = new CognitoUser({ Username: username, Pool: pool });
  const auth = new AuthenticationDetails({ Username: username, Password: password });
  return new Promise((resolve, reject) => {
    user.authenticateUser(auth, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error("New password required")),
    });
  });
}

export function signOut(): void {
  const u = getCurrentUser();
  if (u) u.signOut();
  localStorage.removeItem(`CognitoIdentityServiceProvider.${APP_CLIENT_ID}.LastAuthUser`);
}
