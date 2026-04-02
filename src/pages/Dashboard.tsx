import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Moon, Activity, AlertTriangle, Smile } from "lucide-react";
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function groupByDay(entries: RoutineEntry[]) {
  const map = new Map<string, RoutineEntry[]>();

  for (const entry of entries) {
    if (!map.has(entry.date)) {
      map.set(entry.date, []);
    }
    map.get(entry.date)?.push(entry);
  }

  return [...map.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, rows]) => {
      const avgMood = rows.reduce((acc, row) => acc + row.mood, 0) / rows.length;
      const avgStress = rows.reduce((acc, row) => acc + row.stress, 0) / rows.length;
      const avgSleep = rows.reduce((acc, row) => acc + row.sleepHours, 0) / rows.length;

      return {
        day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        mood: Number(((avgMood / 5) * 10).toFixed(1)),
        stress: Number(avgStress.toFixed(1)),
        sleep: Number(avgSleep.toFixed(1)),
      };
    });
}

const Dashboard = () => {
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

      let latestAnalysis = getAnalysisForUser(user.id);
      if (userEntries.length && !latestAnalysis) {
        const generated = analyzeLatestWellness(userEntries);
        if (generated) {
          saveAnalysisForUser(user.id, generated);
          latestAnalysis = generated;
        }
      }
      setAnalysis(latestAnalysis);
    };

    refresh();
    return onWellnessUpdate(refresh);
  }, [user]);

  const chartData = useMemo(() => {
    return groupByDay(entries);
  }, [entries]);

  const metrics = useMemo(() => {
    const source = entries.slice(0, 7);
    if (!source.length) {
      return {
        avgMood: 0,
        avgStress: 0,
        avgSleep: 0,
      };
    }

    const sumMood = source.reduce((acc, entry) => acc + entry.mood, 0);
    const sumStress = source.reduce((acc, entry) => acc + entry.stress, 0);
    const sumSleep = source.reduce((acc, entry) => acc + entry.sleepHours, 0);

    return {
      avgMood: sumMood / source.length,
      avgStress: sumStress / source.length,
      avgSleep: sumSleep / source.length,
    };
  }, [entries]);

  const summaryCards = [
    {
      label: "Avg Mood",
      value: metrics.avgMood ? `${metrics.avgMood.toFixed(1)}/5` : "N/A",
      change: analysis ? `${Math.round((1 - analysis.riskScore) * 100)}% stability` : "No data",
      up: true,
      icon: Smile,
      color: "text-primary",
    },
    {
      label: "Stress Level",
      value: metrics.avgStress ? `${metrics.avgStress.toFixed(1)}/10` : "N/A",
      change: analysis ? `${Math.round(analysis.riskScore * 100)}% risk` : "No data",
      up: !analysis || analysis.riskScore < 0.5,
      icon: Activity,
      color: "text-warning",
    },
    {
      label: "Sleep Avg",
      value: metrics.avgSleep ? `${metrics.avgSleep.toFixed(1)}h` : "N/A",
      change: entries.length ? `${entries.length} logs total` : "No logs",
      up: metrics.avgSleep >= 6.5,
      icon: Moon,
      color: "text-accent",
    },
  ];

  const alertMessage = analysis
    ? analysis.status === "needs-support"
      ? "The model sees signs of a difficult day. Open Insights for a focused recovery plan."
      : analysis.status === "watch"
        ? "Today looks manageable but sensitive. Follow one short reset action from Insights."
        : "Current pattern looks balanced. Keep your routine momentum."
    : "Add your first daily log to activate personalized analysis.";

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">
            Welcome, {user?.name ?? "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI wellness dashboard updates from your latest routine entries.
          </p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <card.icon className={`h-5 w-5 ${card.color}`} />
                <span className={`text-xs font-medium flex items-center gap-1 ${card.up ? "text-success" : "text-warning"}`}>
                  {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.change}
                </span>
              </div>
              <div className="text-2xl font-bold font-display text-foreground">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Mood & Stress Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(27 97% 64%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(27 97% 64%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 32% 91%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                />
                <Area type="monotone" dataKey="mood" stroke="hsl(239 84% 67%)" fill="url(#moodGradient)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="stress" stroke="hsl(27 97% 64%)" fill="url(#stressGradient)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Sleep Patterns</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 32% 91%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                />
                <Line type="monotone" dataKey="sleep" stroke="hsl(199 89% 60%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(199 89% 60%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <h2 className="font-display font-semibold text-foreground mb-3">Model Alert</h2>
          <div
            className={`rounded-xl p-4 border flex items-start gap-3 ${
              analysis?.status === "needs-support"
                ? "bg-warning/5 border-warning/20"
                : analysis?.status === "watch"
                  ? "bg-accent/5 border-accent/20"
                  : "bg-success/5 border-success/20"
            }`}
          >
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{alertMessage}</p>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
};

export default Dashboard;
