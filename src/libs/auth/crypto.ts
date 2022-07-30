import { AuthChain, Authenticator } from "beland-crypto";
import { Request } from "express";

function extractAuthorizationHeader(req: Request): string {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.trim().split(" ");

    if (parts.length === 2) {
      const scheme = parts[0] as string;
      const credentials = parts[1] as string;

      if (/^Bearer$/i.test(scheme)) {
        return credentials;
      }
    }
  }

  throw new Error(
    'Bad Authorization header format. Format is "Authorization: Bearer <token>"'
  );
}

function extractAuthChain(req: Request): AuthChain {
  const credentials = extractAuthorizationHeader(req);
  const authChain = JSON.parse(Buffer.from(credentials, "base64").toString());
  if (authChain.length === 0) {
    throw Error("Invalid auth chain");
  }
  const user = authChain[0].payload;
  if (!user) {
    throw Error("Missing ETH address in auth chain");
  }
  return authChain;
}

export async function verify(req: Request) {
  const authChain = extractAuthChain(req);
  const entityId = req.method.toLowerCase() + ":" + req.baseUrl + req.path;
  const res = await Authenticator.validateSignature(
    entityId,
    authChain,
    null as any,
    Date.now()
  );

  if (!res.ok) {
    return {
      user: authChain[0]?.payload,
    };
  }

  throw new Error(res.message);
}
