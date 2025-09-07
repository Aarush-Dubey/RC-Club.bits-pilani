
/**
 * This file defines an API route for generating authentication parameters for ImageKit uploads.
 * It securely creates a token, expiration timestamp, and signature on the server-side,
 * which are then sent to the client to authorize direct image uploads to ImageKit.
 * This prevents exposing the private API key in the browser.
 */
import { config } from 'dotenv';
config();
import { getUploadAuthParams } from "@imagekit/next/server"

export async function GET() {
    // Your application logic to authenticate the user could go here.
    // For this demo, we'll assume the user is authenticated.
    console.log("--- Generating ImageKit Auth ---");

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
        console.error("❌ ImageKit keys are not configured on the server.");
        return Response.json({ error: "ImageKit keys are not configured." }, { status: 500 });
    }

    // Generate a unique token for each request to prevent replay attacks
    const token = crypto.randomUUID();

    try {
        const { expire, signature } = getUploadAuthParams({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
            token: token,
        })
        
        console.log("✅ Successfully generated ImageKit auth params:", { token, expire, signature });
        return Response.json({ token, expire, signature })

    } catch(error) {
        console.error("❌ Error generating ImageKit auth params:", error);
        return Response.json({ error: "Failed to generate signature." }, { status: 500 });
    }
}
