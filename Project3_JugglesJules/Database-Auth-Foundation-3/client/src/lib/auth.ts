import { create } from "zustand";

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
  logout: () => void;
}

const stored = typeof window !== "undefined" ? localStorage.getItem("justjuggle_user") : null;

export const useAuth = create<AuthState>((set) => ({
  user: stored ? JSON.parse(stored) : null,
  setUser: (user) => {
    if (user) {
      localStorage.setItem("justjuggle_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("justjuggle_user");
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("justjuggle_user");
    set({ user: null });
  },
}));
