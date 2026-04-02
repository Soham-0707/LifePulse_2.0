import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Shield, Sparkles } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AuthPage = () => {
  const { isAuthenticated, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "signin" ? "Welcome back" : "Create your account"),
    [mode],
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!email || !password || (mode === "signup" && !name)) {
      toast.error("Please fill all required fields.");
      setIsSubmitting(false);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password should be at least 6 characters.");
      setIsSubmitting(false);
      return;
    }

    const result =
      mode === "signin"
        ? signIn(email, password)
        : signUp(name, email, password);

    if (!result.ok) {
      toast.error(result.message);
      setIsSubmitting(false);
      return;
    }

    toast.success(result.message);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="hidden lg:flex relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(178_90%_45%/.2),transparent_45%),radial-gradient(circle_at_80%_40%,hsl(25_95%_56%/.2),transparent_48%),linear-gradient(145deg,hsl(205_44%_97%),hsl(198_60%_93%))]" />
        <div className="relative z-10 p-12 flex flex-col justify-between text-foreground">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">LifePulse AI</span>
          </Link>

          <div>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4">
              Your wellbeing command center, now powered by adaptive AI.
            </h1>
            <p className="max-w-xl text-muted-foreground text-lg">
              Log routines, detect difficult days early, get practical recovery steps, and listen to recommended playlists that match your emotional state.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-xl">
            {["Secure login", "Personalized analysis", "Spotify recommendations"].map((item) => (
              <div key={item} className="rounded-xl bg-white/70 border border-white p-3 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated p-6 sm:p-8"
        >
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-sm rounded-full border border-border px-3 py-1 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              Mental wellness assistant
            </div>
            <h2 className="text-3xl font-display font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">
              {mode === "signin"
                ? "Sign in to continue your wellness journey."
                : "Set up your profile in under a minute."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Johnson"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button type="submit" className="w-full h-11 mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-5 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Local demo auth is enabled for this MVP. Connect backend auth for production.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default AuthPage;
