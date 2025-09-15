"use client";

import Pusher from "pusher-js";

// This is a singleton pattern to avoid creating multiple pusher instances
declare global {
  var pusherClient: Pusher | undefined;
}

const pusherClient =
  global.pusherClient ??
  new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/agent/pusher-auth",
    authTransport: "ajax",
    auth: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.pusherClient = pusherClient;
}

export { pusherClient };
