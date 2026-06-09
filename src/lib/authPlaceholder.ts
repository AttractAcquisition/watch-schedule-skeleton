// Watch Schedule — mock auth + subscription + onboarding state.
// TODO: replace with real Supabase auth + subscription lookup.

import type { PlanType, SubscriptionStatus, User } from "./types";

export type MockState =
  | "logged_out"
  | "logged_in_unpaid"
  | "logged_in_paid_new"
  | "logged_in_paid_onboarded";

export interface AuthState {
  mockState: MockState;
  isAuthenticated: boolean;
  user: User | null;
  subscriptionStatus: SubscriptionStatus;
  hasCompletedOnboarding: boolean;
  currentPlan: PlanType | null;
  vesselId: string | null;
}

const STORAGE_KEY = "ws.mockAuthState";

const MOCK_USER: User = {
  id: "user_demo",
  email: "captain@meridian.yacht",
  fullName: "Capt. James Whitcombe",
  initials: "JW",
};

function stateFor(mock: MockState): AuthState {
  switch (mock) {
    case "logged_out":
      return {
        mockState: mock,
        isAuthenticated: false,
        user: null,
        subscriptionStatus: "none",
        hasCompletedOnboarding: false,
        currentPlan: null,
        vesselId: null,
      };
    case "logged_in_unpaid":
      return {
        mockState: mock,
        isAuthenticated: true,
        user: MOCK_USER,
        subscriptionStatus: "none",
        hasCompletedOnboarding: false,
        currentPlan: null,
        vesselId: null,
      };
    case "logged_in_paid_new":
      return {
        mockState: mock,
        isAuthenticated: true,
        user: MOCK_USER,
        subscriptionStatus: "active",
        hasCompletedOnboarding: false,
        currentPlan: "triple_watch",
        vesselId: null,
      };
    case "logged_in_paid_onboarded":
      return {
        mockState: mock,
        isAuthenticated: true,
        user: MOCK_USER,
        subscriptionStatus: "active",
        hasCompletedOnboarding: true,
        currentPlan: "triple_watch",
        vesselId: "vessel_meridian",
      };
  }
}

function read(): MockState {
  if (typeof window === "undefined") return "logged_in_paid_onboarded";
  const v = window.localStorage.getItem(STORAGE_KEY) as MockState | null;
  return v ?? "logged_in_paid_onboarded";
}

type Listener = (s: AuthState) => void;
const listeners = new Set<Listener>();

export function getAuthState(): AuthState {
  return stateFor(read());
}

export function setMockState(next: MockState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  const s = stateFor(next);
  listeners.forEach((l) => l(s));
}

export function subscribeAuth(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ---- Placeholder backend functions ----

export async function signInWithEmail(_email: string, _password: string) {
  // TODO: connect to Supabase auth.signInWithPassword
  setMockState("logged_in_paid_onboarded");
  return { ok: true };
}

export async function signUpWithEmail(
  _email: string,
  _password: string,
  _plan?: PlanType
) {
  // TODO: connect to Supabase auth.signUp + create profile row
  setMockState("logged_in_unpaid");
  return { ok: true };
}

export async function signOut() {
  // TODO: Supabase auth.signOut
  setMockState("logged_out");
}

export async function getCurrentUser() {
  // TODO: Supabase auth.getUser
  return getAuthState().user;
}

export async function completeOnboarding() {
  // TODO: persist onboarding completion in Supabase
  setMockState("logged_in_paid_onboarded");
}
