import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getEntriesForUser, onWellnessUpdate } from "@/lib/storage";
import { RoutineEntry } from "@/types/app";

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
        mood: Number(((avgMood / 5) * 10).toFixed(2)),
        stress: Number(avgStress.toFixed(2)),
        sleep: Number(avgSleep.toFixed(2)),
      };
    });
}

function groupByWeek(entries: RoutineEntry[]) {
  const map = new Map<string, RoutineEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(0, 10);

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(entry);
  }

  return [...map.entries()]
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([weekStart, rows]) => {
      const avgMood = rows.reduce((acc, row) => acc + row.mood, 0) / rows.length;
      const avgStress = rows.reduce((acc, row) => acc + row.stress, 0) / rows.length;
      const avgSleep = rows.reduce((acc, row) => acc + row.sleepHours, 0) / rows.length;

      return {
        week: new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        mood: Number(((avgMood / 5) * 10).toFixed(2)),
        stress: Number(avgStress.toFixed(2)),
        sleep: Number(avgSleep.toFixed(2)),
      };
    });
}

function groupByMonth(entries: RoutineEntry[]) {
  const map = new Map<string, RoutineEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)?.push(entry);
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, rows]) => {
      const date = new Date(`${key}-01`);
      const avgMood = rows.reduce((acc, row) => acc + row.mood, 0) / rows.length;
      const avgStress = rows.reduce((acc, row) => acc + row.stress, 0) / rows.length;

      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        mood: Number(((avgMood / 5) * 10).toFixed(2)),
        stress: Number(avgStress.toFixed(2)),
      };
    });
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const ProgressPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RoutineEntry[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => {
      setEntries(getEntriesForUser(user.id));
    };

    refresh();
    return onWellnessUpdate(refresh);
  }, [user]);

  const weeklyData = useMemo(() => groupByWeek(entries), [entries]);
  const monthlyData = useMemo(() => groupByMonth(entries), [entries]);
  const dailyData = useMemo(() => groupByDay(entries), [entries]);

  const improvements = useMemo(() => {
    const recent = entries.slice(0, 14);
    const previous = entries.slice(14, 28);

    const safeAvg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);

    const recentMood = safeAvg(recent.map((entry) => entry.mood));
    const previousMood = safeAvg(previous.map((entry) => entry.mood));
    const recentStress = safeAvg(recent.map((entry) => entry.stress));
    const previousStress = safeAvg(previous.map((entry) => entry.stress));
    const recentSleep = safeAvg(recent.map((entry) => entry.sleepHours));
    const previousSleep = safeAvg(previous.map((entry) => entry.sleepHours));

    return [
      { label: "Mood", current: recentMood, previous: previousMood, unit: "/5", inverted: false },
      { label: "Stress", current: recentStress, previous: previousStress, unit: "/10", inverted: true },
      { label: "Sleep", current: recentSleep, previous: previousSleep, unit: "h", inverted: false },
      { label: "Logs", current: recent.length, previous: previous.length, unit: "", inverted: false },
    ];
  }, [entries]);

  return (
    <AppShell>
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Progress Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Long-term trends from your routine logs and wellness scores.</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {improvements.map((imp) => {
            const delta = imp.current - imp.previous;
            const positive = imp.inverted ? delta < 0 : delta >= 0;

            return (
              <div key={imp.label} className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <div className="text-2xl font-bold font-display text-foreground">
                  {imp.current.toFixed(imp.label === "Logs" ? 0 : 1)}
                  {imp.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{imp.label}</div>
                <div className={`text-xs font-medium mt-2 flex items-center justify-center gap-1 ${positive ? "text-success" : "text-warning"}`}>
                  <TrendingUp className={`h-3 w-3 ${positive ? "" : "rotate-180"}`} />
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-xl p-6 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Daily Routine Overview</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="30%">
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
                <Bar dataKey="mood" fill="hsl(239 84% 67%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sleep" fill="hsl(199 89% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-xl p-6 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Weekly Overview</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="30%">
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 32% 91%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="mood" fill="hsl(239 84% 67%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sleep" fill="hsl(199 89% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Monthly Mood vs Stress</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215 16% 47%)" }} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 32% 91%)",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                />
                <Line type="monotone" dataKey="mood" stroke="hsl(239 84% 67%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(239 84% 67%)" }} />
                <Line type="monotone" dataKey="stress" stroke="hsl(27 97% 64%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(27 97% 64%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
};

export default ProgressPage;
