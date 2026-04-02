import { createContext, useContext, useMemo, useState } from "react";
import { createId, getSessionUser, getUsers, saveSessionUser, saveUsers } from "@/lib/storage";
import { SessionUser, UserAccount } from "@/types/app";

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  signUp: (name: string, email: string, password: string) => { ok: boolean; message: string };
  signIn: (email: string, password: string) => { ok: boolean; message: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toSessionUser(account: UserAccount): SessionUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getSessionUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signUp: (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const users = getUsers();

        if (users.some((candidate) => candidate.email === normalizedEmail)) {
          return { ok: false, message: "An account with this email already exists." };
        }

        const account: UserAccount = {
          id: createId("user"),
          name: name.trim(),
          email: normalizedEmail,
          password,
          createdAt: new Date().toISOString(),
        };

        saveUsers([...users, account]);

        const sessionUser = toSessionUser(account);
        saveSessionUser(sessionUser);
        setUser(sessionUser);

        return { ok: true, message: "Account created successfully." };
      },
      signIn: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const users = getUsers();
        const account = users.find(
          (candidate) => candidate.email === normalizedEmail && candidate.password === password,
        );

        if (!account) {
          return { ok: false, message: "Invalid email or password." };
        }

        const sessionUser = toSessionUser(account);
        saveSessionUser(sessionUser);
        setUser(sessionUser);

        return { ok: true, message: "Signed in successfully." };
      },
      signOut: () => {
        saveSessionUser(null);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
