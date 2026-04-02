import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import AppShell from "@/components/AppShell";
import WellnessChat from "@/components/WellnessChat";
import { useAuth } from "@/context/AuthContext";

const CoachPage = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Copilot Wellness Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your API key and chat with an assistant aware of your routine data and latest analysis.
          </p>
        </div>

        <WellnessChat user={user} />
      </motion.div>
    </AppShell>
  );
};

export default CoachPage;
