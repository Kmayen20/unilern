/**
 * Disparador "Pre sign-up" de Cognito (UniLern).
 * Runtime: Node.js 22.x. El SDK v3 ya viene incluido en el runtime de Lambda.
 *
 * 1. PreSignUp_ExternalProvider (primer inicio con Google): si existe una cuenta de correo + contraseña
 *    CONFIRMADA con el mismo correo y Google lo da como verificado, vincula Google a esa cuenta.
 * 2. PreSignUp_SignUp (registro con contraseña): si el correo ya entra con Google, rechaza el registro.
 *
 * Permisos del rol: cognito-idp:ListUsers y cognito-idp:AdminLinkProviderForUser sobre el pool.
 */
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient();

async function usersByEmail(userPoolId, email) {
  // El correo va dentro de un filtro entre comillas: se rechaza cualquier valor con comillas o barras.
  if (!/^[^"\\\s]+@[^"\\\s]+$/.test(email)) return [];
  const res = await client.send(new ListUsersCommand({ UserPoolId: userPoolId, Filter: `email = "${email}"` }));
  return res.Users ?? [];
}

export const handler = async (event) => {
  const { triggerSource, userPoolId, userName } = event;
  const attrs = event.request.userAttributes ?? {};
  const email = (attrs.email ?? "").toLowerCase();
  if (!email) return event;

  if (triggerSource === "PreSignUp_ExternalProvider") {
    // Solo se vincula si el proveedor confirma que el correo es del usuario (evita apropiarse de cuentas).
    if (String(attrs.email_verified) !== "true") return event;

    // userName llega como "google_<id>": proveedor "Google", id del usuario en Google.
    const sep = userName.indexOf("_");
    const provider = userName.slice(0, sep);
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const providerUserId = userName.slice(sep + 1);

    const native = (await usersByEmail(userPoolId, email)).find((u) => u.UserStatus === "CONFIRMED");
    if (native) {
      await client.send(
        new AdminLinkProviderForUserCommand({
          UserPoolId: userPoolId,
          DestinationUser: { ProviderName: "Cognito", ProviderAttributeValue: native.Username },
          SourceUser: { ProviderName: providerName, ProviderAttributeName: "Cognito_Subject", ProviderAttributeValue: providerUserId },
        }),
      );
      console.log(`Vinculado ${providerName} a la cuenta existente ${native.Username}`);
    }
    return event;
  }

  if (triggerSource === "PreSignUp_SignUp") {
    const external = (await usersByEmail(userPoolId, email)).some((u) => u.UserStatus === "EXTERNAL_PROVIDER");
    if (external) throw new Error("CUENTA_GOOGLE");
  }

  return event;
};
