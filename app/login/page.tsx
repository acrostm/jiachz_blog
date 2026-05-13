import { LoginForm } from "@/components/login-form";

// import { SignInPage } from "@/features/auth";
import { AuthExperienceShell } from "@/features/auth";

export default function LoginPage() {
  return (
    <AuthExperienceShell mode="sign-in">
      <LoginForm />
    </AuthExperienceShell>
  );
}
