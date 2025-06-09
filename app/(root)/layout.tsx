import { BackToTop } from "@/components/back-to-top";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import TurnstileGuard from '@/components/turnstile/turnstile-guard';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <TurnstileGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-190px)]">{children}</main>
      <Footer />
      <BackToTop />
    </TurnstileGuard>
  );
}
