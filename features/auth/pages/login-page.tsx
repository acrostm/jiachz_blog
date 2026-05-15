import { LoginForm } from "@/components/login-form";

import { AuthExperienceShell } from "../components/auth-experience-shell";

export function LoginPage() {
  return (
    <AuthExperienceShell mode="sign-in">
      <LoginForm />
    </AuthExperienceShell>
  );
}
