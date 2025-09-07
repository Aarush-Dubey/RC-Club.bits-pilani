
'use server';

/**
 * This script is for testing the server-side authentication with ImageKit.
 * It checks for the necessary environment variables and attempts to generate
 * the authentication parameters required for client-side uploads.
 * 
 * To run this test, use the command: `npm run test:imagekit`
 */

import 'dotenv/config';
import { getUploadAuthParams } from "@imagekit/next/server";
import { randomUUID } from 'crypto';

async function testImageKitAuth() {
    console.log("--- Starting ImageKit Auth Test ---");

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
        console.error("\n❌ Error: ImageKit environment variables are not set.");
        console.log("Please ensure IMAGEKIT_PRIVATE_KEY and NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY are defined in your .env file.\n");
        return;
    }

    console.log("\n✅ Public Key found:", publicKey);
    console.log("✅ Private Key found: [hidden for security]");

    try {
        const token = randomUUID();
        console.log("\nGenerated Token:", token);

        const authParams = getUploadAuthParams({
            privateKey: privateKey,
            publicKey: publicKey,
            token: token,
        });

        console.log("\n✅ Successfully generated authentication parameters:");
        console.log({
            token: authParams.token,
            expire: authParams.expire,
            signature: authParams.signature,
        });
        console.log("\n--- Test Passed ---");

    } catch (error) {
        console.error("\n❌ Error generating ImageKit auth params:", error);
        console.log("\n--- Test Failed ---");
    }
}

testImageKitAuth();
