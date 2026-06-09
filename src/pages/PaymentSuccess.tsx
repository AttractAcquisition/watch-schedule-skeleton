import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { setMockState } from "@/lib/authPlaceholder";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel max-w-md p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border">
          <Check className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Subscription active</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your Watch Schedule subscription is ready. Continue to vessel setup.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            setMockState("logged_in_paid_new");
            navigate("/onboarding");
          }}
        >
          Set up vessel
        </Button>
      </div>
    </div>
  );
}
