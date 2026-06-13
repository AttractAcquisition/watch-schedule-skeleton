import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Watch Schedule
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is off-watch.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
