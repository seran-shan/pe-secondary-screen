import { Client, Receiver } from "@upstash/qstash";
import { env } from "@/env";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

if (!env.QSTASH_URL || !env.QSTASH_TOKEN) {
  console.warn("QStash URL or Token not found, queueing will be disabled.");
}

export const qstash =
  env.QSTASH_URL && env.QSTASH_TOKEN
    ? new Client({
        baseUrl: env.QSTASH_URL,
        token: env.QSTASH_TOKEN,
      })
    : null;

if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY) {
  throw new Error(
    "QStash signing keys are not found in the environment variables.",
  );
}
const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export function verifyRequest<T>(
  handler: (
    body: T,
  ) => Promise<NextResponse | Response> | NextResponse | Response,
): (req: NextRequest) => Promise<NextResponse | Response> {
  return async (req) => {
    const signature = (await headers()).get("upstash-signature");
    if (!signature) {
      return new NextResponse("`upstash-signature` header is missing", {
        status: 401,
      });
    }

    const body = await req.text();

    const isValid = await receiver.verify({ signature, body });
    if (!isValid) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    try {
      const jsonBody = JSON.parse(body) as T;
      return handler(jsonBody);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Malformed JSON";
      return new NextResponse(`Invalid JSON body: ${message}`, {
        status: 400,
      });
    }
  };
}
