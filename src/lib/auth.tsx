// Watch Schedule — real Supabase auth + app-state provider.
// Replaces the old authPlaceholder mock. Exposes session, profile,
// subscription and vessel, plus derived gate flags used for routing.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { ProfileRow, SubscriptionRow, VesselRow } from "./database.types";
import type { PlanType } from "./types";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  subscription: SubscriptionRow | null;
  vessel: VesselRow | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPaid: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    options?: { fullName?: string; plan?: PlanType },
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshAppState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PAID_STATUSES = new Set<SubscriptionRow["status"]>(["active", "trialing"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [vessel, setVessel] = useState<VesselRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard against state updates after unmount / stale async loads.
  const activeUserId = useRef<string | null>(null);

  const loadAppState = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      setSubscription(null);
      setVessel(null);
      return;
    }

    // Each query is tolerant of the table not existing yet (pre-migration),
    // so the app still renders rather than crashing.
    const [profileRes, subRes, vesselRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("vessels")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (activeUserId.current !== userId) return; // a newer load superseded us

    if (profileRes.error) console.warn("[auth] profile load failed:", profileRes.error.message);
    if (subRes.error) console.warn("[auth] subscription load failed:", subRes.error.message);
    if (vesselRes.error) console.warn("[auth] vessel load failed:", vesselRes.error.message);

    setProfile(profileRes.data ?? null);
    setSubscription(subRes.data ?? null);
    setVessel(vesselRes.data ?? null);
  }, []);

  const refreshAppState = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    activeUserId.current = data.session?.user.id ?? null;
    await loadAppState(data.session?.user.id ?? null);
  }, [loadAppState]);

  useEffect(() => {
    let mounted = true;

    // Initial session load.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      activeUserId.current = data.session?.user.id ?? null;
      await loadAppState(data.session?.user.id ?? null);
      if (mounted) setIsLoading(false);
    });

    // React to login / logout / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      const uid = nextSession?.user.id ?? null;
      activeUserId.current = uid;
      await loadAppState(uid);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAppState]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options?.fullName ?? "",
          intended_plan: options?.plan ?? null,
        },
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // When email confirmation is enabled, there is a user but no session yet.
    const needsConfirmation = !!data.user && !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    setVessel(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isPaid = !!subscription && PAID_STATUSES.has(subscription.status);
    return {
      user: session?.user ?? null,
      session,
      profile,
      subscription,
      vessel,
      isLoading,
      isAuthenticated: !!session,
      isPaid,
      hasCompletedOnboarding: !!vessel?.onboarding_completed,
      signIn,
      signUp,
      signOut,
      refreshAppState,
    };
  }, [session, profile, subscription, vessel, isLoading, signIn, signUp, signOut, refreshAppState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}

// Small helpers for display.
export function initialsFromName(name?: string | null, email?: string | null): string {
  const source = (name || "").trim();
  if (source) {
    const parts = source.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "—";
}
