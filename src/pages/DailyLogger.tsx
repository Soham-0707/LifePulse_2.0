import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { addEntry, createId, getEntriesForUser, saveAnalysisForUser } from "@/lib/storage";
import { analyzeLatestWellness } from "@/lib/wellnessModel";
import { RoutineEntry } from "@/types/app";

const moods = [
  { label: "Great", value: 5 },
  { label: "Good", value: 4 },
  { label: "Okay", value: 3 },
  { label: "Low", value: 2 },
  { label: "Bad", value: 1 },
];

const activities = [
  "Exercise",
  "Meditation",
  "Reading",
  "Socializing",
  "Nature",
  "Music",
  "Work",
  "Gaming",
  "Study",
  "Family time",
];

const DailyLogger = () => {
  const { user } = useAuth();
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [stress, setStress] = useState([5]);
  const [sleep, setSleep] = useState([7]);
  const [energy, setEnergy] = useState([6]);
  const [social, setSocial] = useState([5]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [journal, setJournal] = useState("");
  const [saved, setSaved] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(user && selectedMood && journal.trim());
  }, [journal, selectedMood, user]);

  const toggleActivity = (label: string) => {
    setSelectedActivities((prev) =>
      prev.includes(label) ? prev.filter((activity) => activity !== label) : [...prev, label],
    );
  };

  const handleSave = () => {
    if (!user) {
      return;
    }

    if (!selectedMood) {
      toast.error("Please choose your mood first.");
      return;
    }

    if (!journal.trim()) {
      toast.error("Please write a short journal note.");
      return;
    }

    const entry: RoutineEntry = {
      id: createId("entry"),
      userId: user.id,
      date: entryDate,
      mood: selectedMood,
      stress: stress[0],
      sleepHours: sleep[0],
      energy: energy[0],
      social: social[0],
      activities: selectedActivities,
      journal: journal.trim(),
      createdAt: new Date().toISOString(),
    };

    addEntry(entry);

    const allEntries = getEntriesForUser(user.id);
    const analysis = analyzeLatestWellness(allEntries);
    if (analysis) {
      saveAnalysisForUser(user.id, analysis);
    }

    setSaved(true);
    toast.success("Routine logged and analyzed. Check Insights for your AI report.");

    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 max-w-3xl"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground">Daily Routine Logger</h1>
          <p className="text-muted-foreground mt-1">
            Submit your routine details so the wellness model can detect difficult days early.
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
          <h2 className="font-display font-semibold text-foreground">Entry Details</h2>
          <div className="space-y-1.5 max-w-xs">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">How is your mood?</h2>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  selectedMood === mood.value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Stress Level</h2>
              <span className="text-sm font-display font-bold text-warning">{stress[0]}/10</span>
            </div>
            <Slider value={stress} onValueChange={setStress} max={10} min={1} step={1} className="w-full" />
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Hours of Sleep</h2>
              <span className="text-sm font-display font-bold text-accent">{sleep[0]}h</span>
            </div>
            <Slider value={sleep} onValueChange={setSleep} max={12} min={1} step={0.5} className="w-full" />
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Energy</h2>
              <span className="text-sm font-display font-bold text-success">{energy[0]}/10</span>
            </div>
            <Slider value={energy} onValueChange={setEnergy} max={10} min={1} step={1} className="w-full" />
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">Social Connection</h2>
              <span className="text-sm font-display font-bold text-primary">{social[0]}/10</span>
            </div>
            <Slider value={social} onValueChange={setSocial} max={10} min={1} step={1} className="w-full" />
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Activities Today</h2>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <button
                key={activity}
                onClick={() => toggleActivity(activity)}
                className={`px-4 py-2 rounded-full text-sm border transition-all ${
                  selectedActivities.includes(activity)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="font-display font-semibold text-foreground mb-4">Journal</h2>
          <Textarea
            value={journal}
            onChange={(event) => setJournal(event.target.value)}
            placeholder="Describe your day, feelings, and any triggers."
            className="min-h-[130px] resize-none border-border"
          />
        </div>

        <Button
          onClick={handleSave}
          size="lg"
          className="w-full h-12"
          disabled={!canSubmit}
        >
          {saved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? "Saved and analyzed" : "Submit routine and run model"}
        </Button>
      </motion.div>
    </AppShell>
  );
};

export default DailyLogger;
