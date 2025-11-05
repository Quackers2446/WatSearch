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
        throw new AuthError("Missing key ID in token")
    }
    const result = await (
        await fetch(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
        )
    ).json()

    const publicKey = result[kid] as string
    if (!publicKey) {
        throw new AuthError("Invalid key ID")
    }
    return publicKey
}

// Firebase project ID from the client config
const FIREBASE_PROJECT_ID = "watsearch-a8c9b"

/**
 * Verifies the Firebase ID token from the Authorization header using JWT verification
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The user's UID if valid, throws error otherwise
 */
export async function verifyAuthHeader(
    authHeader: string | null,
): Promise<string> {
    if (!authHeader) {
        throw new AuthError("No authorization header provided")
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!token) {
        throw new AuthError("No token provided in authorization header")
    }

    try {
        // Decode the token to get the header (without verification)
        const decoded = jwt.decode(token, { complete: true })
        
        if (!decoded || typeof decoded === "string") {
            throw new AuthError("Invalid token format")
        }

        const { header, payload } = decoded as {
            header: { kid?: string; alg?: string }
            payload: any
        }

        // Verify token structure
        if (!payload || !header) {
            throw new AuthError("Invalid token structure")
        }

        // Verify issuer
        if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
            throw new AuthError("Invalid token issuer")
        }

        // Verify audience
        if (payload.aud !== FIREBASE_PROJECT_ID) {
            throw new AuthError("Invalid token audience")
        }

        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
            throw new AuthError("Token has expired")
        }

        // Fetch the public key for verification
        const publicKey = await fetchPublicKey(header.kid)

        // Verify the token signature
        const verified = jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
        }) as jwt.JwtPayload

        // Return the user ID
        if (!verified.sub || !verified.user_id) {
            throw new AuthError("Token missing user ID")
        }

        return verified.user_id || verified.sub
    } catch (error: any) {
        if (error instanceof AuthError) {
            throw error
        }
        console.error("Token verification error:", error)
        throw new AuthError(`Invalid or expired token: ${error.message}`)
    }
}
