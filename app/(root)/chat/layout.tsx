import React from "react";

export const metadata = {
  title: "聊天室 | Jiachzha Blog",
  description: "实时聊天室，与其他用户进行交流",
};

export default function Layout({ children }: React.PropsWithChildren) {
  return <div className="chat-layout">{children}</div>;
}
