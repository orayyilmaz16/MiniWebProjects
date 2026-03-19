import { create } from "zustand";
import { login as dbLogin, registerUser,type SessionUser, updateProfile, changePassword } from "../lib/db";


type AuthState = {
  user: SessionUser | null;
  token: string | null; // demo token
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  updateDisplayName: (displayName: string) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
};

const KEY = "authent_session_v1";

function makeToken() {
  return `demo_${crypto.getRandomValues(new Uint32Array(4)).join("")}_${Date.now()}`;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  hydrate: () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { user: SessionUser; token: string };
    set({ user: parsed.user, token: parsed.token });
  },

  login: async (email, password) => {
    const user = await dbLogin({ email, password });
    const token = makeToken();
    localStorage.setItem(KEY, JSON.stringify({ user, token }));
    set({ user, token });
  },

  register: async (email, displayName, password) => {
    const user = await registerUser({ email, displayName, password });
    const token = makeToken();
    localStorage.setItem(KEY, JSON.stringify({ user, token }));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem(KEY);
    set({ user: null, token: null });
  },

  updateDisplayName: async (displayName) => {
    const current = get().user;
    if (!current) return;
    const updated = updateProfile(current.id, displayName);
    const token = get().token;
    localStorage.setItem(KEY, JSON.stringify({ user: updated, token }));
    set({ user: updated });
  },

  changePassword: async (oldPass, newPass) => {
    const current = get().user;
    if (!current) return;
    await changePassword(current.id, oldPass, newPass);
  },
}));
