import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Headphones, Sparkles, TrendingUp } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { analyzeLatestWellness } from "@/lib/wellnessModel";
import {
  getAnalysisForUser,
  getEntriesForUser,
  onWellnessUpdate,
  saveAnalysisForUser,
} from "@/lib/storage";
import { AnalysisResult, RoutineEntry } from "@/types/app";

const statusMap = {
  balanced: {
    title: "Balanced day detected",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  watch: {
    title: "Watch mode: moderate pressure",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  "needs-support": {
    title: "Needs support: difficult day risk",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
};

const InsightsPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => {
      const userEntries = getEntriesForUser(user.id);
      setEntries(userEntries);

      const generated = analyzeLatestWellness(userEntries);
      if (generated) {
        saveAnalysisForUser(user.id, generated);
        setAnalysis(generated);
      } else {
        setAnalysis(getAnalysisForUser(user.id));
      }
    };

    refresh();
    return onWellnessUpdate(refresh);
  }, [user]);

  const latestEntry = useMemo(() => entries[0] ?? null, [entries]);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Insights & Recovery Plan
          </h1>
          <p className="text-muted-foreground mt-1">
            The model reviews your latest routine and highlights actions for better emotional stability.
          </p>
        </div>

        {!analysis && (
          <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            Submit your first log entry to generate AI insights.
          </div>
        )}

        {analysis && (
          <>
            <div className={`rounded-xl border p-5 ${statusMap[analysis.status].bg} ${statusMap[analysis.status].border}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-5 w-5 ${statusMap[analysis.status].color}`} />
                <h2 className={`font-display font-semibold ${statusMap[analysis.status].color}`}>
                  {statusMap[analysis.status].title}
                </h2>
              </div>
              <p className="text-sm text-foreground">
                Risk score: {(analysis.riskScore * 100).toFixed(1)}% | Model confidence: {(analysis.confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-3">Why the model flagged this</h3>
                <div className="space-y-2">
                  {analysis.reasons.map((reason) => (
                    <div key={reason} className="text-sm rounded-lg bg-muted px-3 py-2 text-foreground">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-3">Recommended actions</h3>
                <div className="space-y-2">
                  {analysis.actions.map((action) => (
                    <div key={action} className="text-sm rounded-lg bg-primary/10 px-3 py-2 text-foreground">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Headphones className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Spotify recommendation</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {analysis.playlist.mood} - {analysis.playlist.title}
              </p>
              <a
                href={analysis.playlist.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium"
              >
                Open playlist
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </>
        )}

        {latestEntry && (
          <div className="bg-card rounded-xl p-6 border border-border shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Latest submitted signals
            </h3>
            <div className="grid sm:grid-cols-5 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">Mood: {latestEntry.mood}/5</div>
              <div className="rounded-lg bg-muted p-3">Stress: {latestEntry.stress}/10</div>
              <div className="rounded-lg bg-muted p-3">Sleep: {latestEntry.sleepHours}h</div>
              <div className="rounded-lg bg-muted p-3">Energy: {latestEntry.energy}/10</div>
              <div className="rounded-lg bg-muted p-3">Social: {latestEntry.social}/10</div>
            </div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
};

export default InsightsPage;
