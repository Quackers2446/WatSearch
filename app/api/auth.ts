// JWT public keys are listed here: https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
// For more information, see https://firebase.google.com/docs/auth/admin/verify-id-tokens

import jwt from "jsonwebtoken"

export class AuthError extends Error {
    public constructor(message?: string) {
        super(message ?? "Invalid token")
    }
}

async function fetchPublicKey(kid: string | undefined): Promise<string> {
    if (!kid) {
        throw new AuthError()
    }
    const result = await (
        await fetch(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
        )
    ).json()

    return result[kid] as string
}

/** Verify access token and return user ID, or throw an error */
export async function verifyAuthHeader(
    header?: string | null,
): Promise<string> {
    if (!header || !header.startsWith("Bearer")) {
        throw new AuthError()
    }

    const token = header.slice("Bearer ".length)

    const decodedToken = jwt.decode(token, { complete: true })

    if (
        decodedToken === null ||
        decodedToken.header.alg !== "RS256" ||
        decodedToken.header.typ !== "JWT"
    ) {
        throw new AuthError()
    }

    const publicKey = await fetchPublicKey(decodedToken.header.kid)

    if (!publicKey) {
        throw new AuthError("No public key")
    }

    const payload = jwt.verify(token, publicKey)

    if (
        typeof payload === "string" ||
        payload.aud !== "watsearch-a8c9b" ||
        !payload.exp ||
        payload.exp < Date.now() / 1000 ||
        !payload.iat ||
        payload.iat > Date.now() / 1000 ||
        payload.iss != "https://securetoken.google.com/watsearch-a8c9b" ||
        !payload.sub
    ) {
        throw new AuthError()
    }

    return payload.sub
}
