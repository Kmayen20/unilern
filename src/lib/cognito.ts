import "server-only";
import { createHmac } from "node:crypto";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * Llamadas directas a la API de Cognito para las pantallas propias de correo + contraseña
 * (iniciar sesión, crear cuenta, confirmar correo, recuperar contraseña).
 * Google usa el flujo OAuth del dominio de Cognito vía Auth.js (proveedor "cognito").
 *
 * El app client debe tener secreto y el flujo ALLOW_USER_PASSWORD_AUTH habilitado.
 * El pool usa el correo como nombre de usuario y el atributo `name` como nombre visible.
 */

function config() {
  const clientId = process.env.AUTH_COGNITO_ID;
  const clientSecret = process.env.AUTH_COGNITO_SECRET;
  const issuer = process.env.AUTH_COGNITO_ISSUER; // https://cognito-idp.<region>.amazonaws.com/<poolId>
  if (!clientId || !clientSecret || !issuer) throw new Error("Cognito no está configurado (.env)");
  const region = new URL(issuer).hostname.split(".")[1];
  return { clientId, clientSecret, region };
}

let client: CognitoIdentityProviderClient | undefined;
function cognito() {
  // Estas operaciones son públicas: el SDK las envía sin firma, no hacen falta credenciales de IAM.
  client ??= new CognitoIdentityProviderClient({ region: config().region });
  return client;
}

function secretHash(username: string) {
  const { clientId, clientSecret } = config();
  return createHmac("sha256", clientSecret).update(username + clientId).digest("base64");
}

export type CognitoUser = { sub: string; email: string; name: string };

/** Error conocido de Cognito traducido a un código propio. */
export function cognitoErrorCode(e: unknown): string {
  const name = (e as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAuthorizedException":
      return "credenciales";
    case "UserNotFoundException":
      return "credenciales";
    case "UserNotConfirmedException":
      return "no_confirmado";
    case "UsernameExistsException":
      return "existe";
    case "InvalidPasswordException":
      return "clave_debil";
    case "CodeMismatchException":
      return "codigo";
    case "ExpiredCodeException":
      return "codigo_vencido";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "limite";
    case "InvalidParameterException":
      return "parametro";
    case "UserLambdaValidationException":
      // Mensaje del disparador Pre sign-up (aws/lambda/presignup-vincular).
      return String((e as { message?: string })?.message ?? "").includes("CUENTA_GOOGLE") ? "cuenta_google" : "desconocido";
    default:
      console.error("Cognito:", e);
      return "desconocido";
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
}

/** Valida correo + contraseña contra Cognito. Lanza el error de Cognito si falla. */
export async function signInWithPassword(email: string, password: string): Promise<CognitoUser> {
  const { clientId } = config();
  const res = await cognito().send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: { USERNAME: email, PASSWORD: password, SECRET_HASH: secretHash(email) },
    }),
  );
  const idToken = res.AuthenticationResult?.IdToken;
  if (!idToken) throw Object.assign(new Error("Desafío no soportado"), { name: "NotAuthorizedException" });
  // El token viene directo de Cognito por TLS en esta misma petición: basta con leer sus claims.
  const claims = decodeJwtPayload(idToken);
  const mail = String(claims.email ?? email);
  return { sub: String(claims.sub), email: mail, name: String(claims.name ?? mail.split("@")[0]) };
}

export async function signUp(name: string, email: string, password: string) {
  const { clientId } = config();
  await cognito().send(
    new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      SecretHash: secretHash(email),
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    }),
  );
}

export async function confirmSignUp(email: string, code: string) {
  const { clientId } = config();
  await cognito().send(
    new ConfirmSignUpCommand({ ClientId: clientId, Username: email, ConfirmationCode: code, SecretHash: secretHash(email) }),
  );
}

export async function resendConfirmation(email: string) {
  const { clientId } = config();
  await cognito().send(
    new ResendConfirmationCodeCommand({ ClientId: clientId, Username: email, SecretHash: secretHash(email) }),
  );
}

export async function forgotPassword(email: string) {
  const { clientId } = config();
  await cognito().send(new ForgotPasswordCommand({ ClientId: clientId, Username: email, SecretHash: secretHash(email) }));
}

export async function confirmForgotPassword(email: string, code: string, password: string) {
  const { clientId } = config();
  await cognito().send(
    new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
      Password: password,
      SecretHash: secretHash(email),
    }),
  );
}
