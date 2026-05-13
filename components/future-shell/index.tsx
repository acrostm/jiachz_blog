import React from "react";

import { FutureBackground } from "./future-background";

export const FutureShell = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="future-site min-h-screen">
      <FutureBackground />
      <div className="relative z-[1] min-h-screen">{children}</div>
    </div>
  );
};
