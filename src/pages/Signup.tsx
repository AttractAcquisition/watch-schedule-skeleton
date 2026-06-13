import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export default function Signup() {
  return (
    <AuthCard
      title="Create your Watch Schedule account"
      subtitle="Payment and vessel setup will follow after account creation."
    >
      <SignupForm />
    </AuthCard>
  );
}
