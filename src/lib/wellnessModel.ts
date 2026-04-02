import { AnalysisResult, PlaylistRecommendation, RoutineEntry, WellnessStatus } from "@/types/app";

interface TrainingExample {
  features: number[];
  label: number;
}

const POSITIVE_WORDS = [
  "happy",
  "grateful",
  "calm",
  "productive",
  "excited",
  "good",
  "great",
  "peaceful",
  "focused",
  "energized",
  "better",
  "joy",
  "nice",
];

const NEGATIVE_WORDS = [
  "anxious",
  "stress",
  "stressed",
  "sad",
  "tired",
  "panic",
  "overwhelmed",
  "bad",
  "burnout",
  "angry",
  "lonely",
  "worse",
  "pain",
  "depressed",
];

const PLAYLISTS: Record<WellnessStatus, PlaylistRecommendation> = {
  balanced: {
    title: "Feel Good Focus",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0",
    mood: "Keep your positive momentum",
  },
  watch: {
    title: "Lo-Fi Recharge",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
    mood: "Stay steady and reset your headspace",
  },
  "needs-support": {
    title: "Calm Healing Sessions",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY",
    mood: "Gentle support for difficult moments",
  },
};

function sentimentScore(text: string) {
  const lowered = text.toLowerCase();
  const words = lowered.split(/[^a-z]+/).filter(Boolean);
  if (!words.length) {
    return 0;
  }

  let score = 0;
  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) {
      score += 1;
    }
    if (NEGATIVE_WORDS.includes(word)) {
      score -= 1;
    }
  }

  return Math.max(-1, Math.min(1, score / words.length));
}

function featureVector(entry: RoutineEntry) {
  const hasExercise = entry.activities.some((activity) => activity.toLowerCase().includes("exercise"));
  const hasMeditation = entry.activities.some((activity) => activity.toLowerCase().includes("meditation"));
  const heavyWork = entry.activities.some((activity) => activity.toLowerCase().includes("work"));
  const sleepDebt = entry.sleepHours < 6 ? 1 : 0;

  return [
    1,
    entry.mood / 5,
    entry.stress / 10,
    Math.min(1, entry.sleepHours / 10),
    entry.energy / 10,
    entry.social / 10,
    hasExercise ? 1 : 0,
    hasMeditation ? 1 : 0,
    heavyWork ? 1 : 0,
    sentimentScore(entry.journal),
    sleepDebt,
  ];
}

function estimateLabel(entry: RoutineEntry) {
  const score =
    (5 - entry.mood) * 1.8 +
    entry.stress * 1.5 +
    (7.5 - entry.sleepHours) * 1.2 +
    (6 - entry.energy) * 0.9 +
    (5 - entry.social) * 0.7;

  return score > 12 ? 1 : 0;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildBaseDataset() {
  const examples: TrainingExample[] = [];

  for (let i = 1; i <= 180; i += 1) {
    const mood = 1 + Math.floor(seededRandom(i) * 5);
    const stress = 1 + Math.floor(seededRandom(i + 11) * 10);
    const sleepHours = Math.round((3 + seededRandom(i + 17) * 6) * 10) / 10;
    const energy = 1 + Math.floor(seededRandom(i + 23) * 10);
    const social = 1 + Math.floor(seededRandom(i + 29) * 10);

    const entry: RoutineEntry = {
      id: `synthetic_${i}`,
      userId: "synthetic",
      date: "2026-01-01",
      mood,
      stress,
      sleepHours,
      energy,
      social,
      activities: [
        stress > 6 ? "Work" : "Exercise",
        sleepHours < 5.5 ? "Gaming" : "Meditation",
      ],
      journal: stress > 6 ? "I feel stressed and tired today" : "I feel calm and productive today",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    examples.push({ features: featureVector(entry), label: estimateLabel(entry) });
  }

  return examples;
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function trainModel(examples: TrainingExample[], iterations = 700, learningRate = 0.2) {
  const size = examples[0]?.features.length ?? 0;
  let weights = new Array(size).fill(0);

  for (let epoch = 0; epoch < iterations; epoch += 1) {
    const gradients = new Array(size).fill(0);

    for (const example of examples) {
      const prediction = sigmoid(dot(weights, example.features));
      const error = prediction - example.label;

      for (let i = 0; i < size; i += 1) {
        gradients[i] += error * example.features[i];
      }
    }

    for (let i = 0; i < size; i += 1) {
      weights[i] -= (learningRate * gradients[i]) / examples.length;
    }
  }

  return weights;
}

function dot(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function classifyRisk(probability: number): WellnessStatus {
  if (probability >= 0.66) {
    return "needs-support";
  }
  if (probability >= 0.4) {
    return "watch";
  }
  return "balanced";
}

function generateReasons(entry: RoutineEntry, riskScore: number) {
  const reasons: string[] = [];

  if (entry.stress >= 7) {
    reasons.push("Stress score is high today.");
  }
  if (entry.sleepHours < 6) {
    reasons.push("Sleep is below the healthy range.");
  }
  if (entry.energy <= 4) {
    reasons.push("Low energy can amplify emotional strain.");
  }
  if (entry.social <= 4) {
    reasons.push("Limited social connection can worsen mood.");
  }
  if (sentimentScore(entry.journal) < -0.2) {
    reasons.push("Journal text carries negative emotional signals.");
  }

  if (!reasons.length) {
    if (riskScore > 0.4) {
      reasons.push("Pattern mix suggests a moderate emotional load.");
    } else {
      reasons.push("Metrics are currently stable and supportive.");
    }
  }

  return reasons;
}

function generateActions(status: WellnessStatus, entry: RoutineEntry) {
  const base = [
    "Take a 10-minute mindful breathing break.",
    "Hydrate and step away from screens for 15 minutes.",
  ];

  if (entry.sleepHours < 6) {
    base.push("Prioritize a sleep reset tonight: reduce caffeine after 2 PM.");
  }
  if (entry.stress >= 7) {
    base.push("Split major tasks into 25-minute focus blocks with recovery pauses.");
  }
  if (!entry.activities.some((activity) => activity.toLowerCase().includes("exercise"))) {
    base.push("Add light movement today: a 20-minute walk can reduce stress.");
  }

  if (status === "balanced") {
    base.push("Keep your current rhythm and repeat what worked today.");
  }

  if (status === "needs-support") {
    base.push("Reach out to a trusted friend or family member today.");
    base.push("If this pattern continues, consider speaking with a mental health professional.");
  }

  return base.slice(0, 5);
}

export function analyzeLatestWellness(entries: RoutineEntry[]): AnalysisResult | null {
  if (!entries.length) {
    return null;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latest = sorted[0];

  const recent = sorted.slice(0, 8);
  const examples: TrainingExample[] = [
    ...buildBaseDataset(),
    ...recent.map((entry) => ({ features: featureVector(entry), label: estimateLabel(entry) })),
  ];

  const weights = trainModel(examples);
  const riskScore = sigmoid(dot(weights, featureVector(latest)));//sigmoid(z)
  const status = classifyRisk(riskScore);
 
  return {
    status,
    riskScore,
    confidence: 0.65 + Math.min(0.3, recent.length * 0.03),
    reasons: generateReasons(latest, riskScore),
    actions: generateActions(status, latest),
    playlist: PLAYLISTS[status],
    generatedAt: new Date().toISOString(),
  };
}
