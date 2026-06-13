import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <AuthCard
      title="Sign in to your vessel dashboard"
      subtitle="Secure access for captains and yacht teams."
    >
      <LoginForm />
    </AuthCard>
  );
}
