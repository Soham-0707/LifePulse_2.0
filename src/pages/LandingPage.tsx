import { motion } from "framer-motion";
import { Brain, Heart, LineChart, Sparkles, ArrowRight, Shield, Bot, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Advanced algorithms analyze your patterns to predict stress risks and identify behavioral triggers before they impact you.",
  },
  {
    icon: Heart,
    title: "Mood Tracking",
    description: "Log your daily emotional state with intuitive emoji sliders and watch your mood patterns evolve over time.",
  },
  {
    icon: LineChart,
    title: "Smart Analytics",
    description: "Beautiful visualizations of your sleep, stress, and activity data with weekly and monthly trend analysis.",
  },
  {
    icon: Sparkles,
    title: "Personalized Tips",
    description: "Get tailored meditation exercises, breathing techniques, and productivity tips based on your unique data.",
  },
  {
    icon: Bot,
    title: "Copilot AI Coach",
    description: "Bring your API key and chat with an assistant that understands your latest routine logs and risk analysis.",
  },
  {
    icon: Music2,
    title: "Spotify Recovery Playlists",
    description: "When your day is rough, LifePulse recommends playlists tuned for calm, focus, or emotional reset.",
  },
  {
    icon: Shield,
    title: "Gentle Alerts",
    description: "Supportive notifications when patterns suggest you might need a break — never alarming, always caring.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,hsl(179_93%_40%/.15),transparent_35%),radial-gradient(circle_at_80%_20%,hsl(26_100%_57%/.2),transparent_45%),linear-gradient(170deg,hsl(204_48%_97%),hsl(193_62%_92%))]">
      {/* Nav */}
      <nav className="container mx-auto flex items-center justify-between py-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">LifePulse</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="font-display text-sm">Login</Button>
          </Link>
          <Link to="/auth">
            <Button className="font-display text-sm bg-foreground text-background border-0 shadow-glow">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-1.5 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary font-display">AI-Powered Wellness Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold font-display text-foreground leading-tight mb-6">
            Log Your Day.
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-accent)" }}>
              Let AI Support You.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            LifePulse trains on your routine inputs to detect hard days early, suggest practical recovery steps,
            and recommend Spotify playlists to help you reset.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-foreground text-background border-0 shadow-glow font-display text-base px-8 h-12">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="font-display text-base px-8 h-12 border-border">
                Create Account
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-20"
        >
            {[
              { value: "24/7", label: "AI Guidance" },
              { value: "100%", label: "Personalized" },
              { value: "Instant", label: "Risk Detection" },
            ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold font-display text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
            Everything you need for mental clarity
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A thoughtfully designed toolkit to help you understand and improve your mental wellness, one day at a time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="gradient-primary rounded-2xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-glow"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-4">
            Your journey to better mental health starts now
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
            Join thousands who've already discovered a calmer, more mindful way of living with LifePulse 2.0.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-card text-foreground hover:bg-card/90 font-display text-base px-8 h-12">
              Get Started — It's Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 LifePulse 2.0. Built with care for your mind.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
