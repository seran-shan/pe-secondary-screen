import Pusher from "pusher";
import { env } from "@/env";

// A singleton pattern is used to prevent multiple instances of the Pusher client
// in a serverless environment, which can cause issues during hot-reloading in development.
declare global {
  var pusherServer: Pusher | undefined;
}

export const pusherServer =
  global.pusherServer ??
  new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.PUSHER_KEY,
    secret: env.PUSHER_SECRET,
    cluster: env.PUSHER_CLUSTER,
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.pusherServer = pusherServer;
}
