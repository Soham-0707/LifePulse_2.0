import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Home, PenLine, Lightbulb, BarChart3, Menu, X, Bot, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/logger", icon: PenLine, label: "Log" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
  { to: "/progress", icon: BarChart3, label: "Progress" },
  { to: "/coach", icon: Bot, label: "AI Coach" },
];

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,hsl(178_90%_40%/.08),transparent_35%),radial-gradient(circle_at_85%_20%,hsl(26_96%_55%/.12),transparent_42%),hsl(205_45%_98%)] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-card/90 backdrop-blur p-6 fixed h-full">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">LifePulse AI</span>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-display text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-xl bg-muted p-4 mt-auto space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="font-display text-sm font-semibold text-foreground truncate">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center">
            <Brain className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold text-foreground">LifePulse AI</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="lg:hidden fixed inset-0 z-40 bg-card pt-16 p-6 overflow-y-auto"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-display text-base ${
                      active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-xl bg-muted p-4 mt-6 space-y-3">
              <p className="font-display text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border flex justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-display ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
