import { SessionProvider } from "next-auth/react";

import { BackToTop } from "@/components/back-to-top";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <SessionProvider>
      <div className="min-h-screen">
        <Navbar />
        <main className="relative z-[1] min-h-[calc(100vh-190px)]">
          {children}
        </main>
        <Footer />
        <BackToTop />
      </div>
    </SessionProvider>
  );
}
