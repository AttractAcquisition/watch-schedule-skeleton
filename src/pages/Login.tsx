import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { DevMockStatePanel } from "@/components/DevMockStatePanel";

export default function Login() {
  return (
    <>
      <AuthCard
        title="Sign in to your vessel dashboard"
        subtitle="Secure access for captains and yacht teams."
      >
        <LoginForm />
      </AuthCard>
      <div className="mx-auto -mt-8 mb-12 w-full max-w-md px-4">
        <DevMockStatePanel compact />
      </div>
    </>
  );
}
