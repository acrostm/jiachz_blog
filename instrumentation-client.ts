import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/api/auth/callback/credentials", method: "POST" },
    { path: "/api/message-board", method: "POST" },
    { path: "/api/auth/register", method: "POST" },
    { path: "/api/upload/avatar", method: "POST" },
  ],
});
