import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = import.meta.env.VITE_COGNITO_REGION as string;
const APP_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;

if (!REGION || !APP_CLIENT_ID) {
  console.error("Missing Cognito env vars. Check VITE_COGNITO_REGION and VITE_COGNITO_CLIENT_ID");
}

const cognito = new CognitoIdentityProviderClient({ region: REGION });

export async function startForgotPassword(username: string) {
  const cmd = new ForgotPasswordCommand({
    ClientId: APP_CLIENT_ID,
    Username: username,
  });
  const res = await cognito.send(cmd);
  return res;
}

export async function confirmForgotPassword(params: {
  username: string;
  code: string;
  newPassword: string;
}) {
  const cmd = new ConfirmForgotPasswordCommand({
    ClientId: APP_CLIENT_ID,
    Username: params.username,
    ConfirmationCode: params.code,
    Password: params.newPassword,
  });
  const res = await cognito.send(cmd);
  return res;
}
