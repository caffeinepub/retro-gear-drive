import { Gauge, Settings, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { Score } from "../backend.d";
import { useGetAllScores } from "../hooks/useQueries";

interface HomePageProps {
  onPlay: () => void;
  lastScore: bigint | null;
}

export default function HomePage({ onPlay, lastScore }: HomePageProps) {
  const { data: scores, isLoading } = useGetAllScores();

  const sortedScores = scores
    ? [...scores].sort((a, b) => (b.score > a.score ? 1 : -1)).slice(0, 10)
    : [];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#1E2A38",
        color: "#fff",
        fontFamily: "Bricolage Grotesque, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{ background: "#2B3645", borderBottom: "1px solid #4A5667" }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pixel car logo */}
            <div className="relative w-10 h-7">
              <div
                style={{ background: "#C56A2C", borderRadius: 2 }}
                className="absolute top-0 left-1 right-1 h-3"
              />
              <div
                style={{ background: "#E07A3A", borderRadius: 3 }}
                className="absolute top-2 left-0 right-0 h-4"
              />
              <div
                style={{
                  background: "#1A1A2E",
                  borderRadius: "50%",
                  width: 8,
                  height: 8,
                  bottom: 0,
                  left: 2,
                }}
                className="absolute"
              />
              <div
                style={{
                  background: "#1A1A2E",
                  borderRadius: "50%",
                  width: 8,
                  height: 8,
                  bottom: 0,
                  right: 2,
                }}
                className="absolute"
              />
            </div>
            <span
              className="font-display font-bold text-lg tracking-widest uppercase"
              style={{ color: "#C56A2C" }}
            >
              Retro Gear Drive
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm tracking-wide uppercase"
              style={{ color: "#C9D2DC" }}
            >
              Features
            </a>
            <a
              href="#scores"
              className="text-sm tracking-wide uppercase"
              style={{ color: "#C9D2DC" }}
            >
              Scores
            </a>
            <a
              href="#controls"
              className="text-sm tracking-wide uppercase"
              style={{ color: "#C9D2DC" }}
            >
              Controls
            </a>
          </nav>
          <button
            type="button"
            data-ocid="nav.play_button"
            onClick={onPlay}
            className="px-5 py-2 rounded font-display font-bold uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#C56A2C", color: "#fff" }}
          >
            Play Now
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section style={{ background: "#1E2A38" }} className="py-20 px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
            {/* Game screenshot card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{
                boxShadow:
                  "0 0 40px rgba(197,106,44,0.25), 0 8px 40px rgba(0,0,0,0.7)",
                border: "2px solid #4A5667",
              }}
            >
              {/* Pixel art preview of top-down road */}
              <div
                style={{
                  background: "#2D3B2D",
                  height: 280,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Grass */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, #1F2E1F 0%, #2D3B2D 100%)",
                  }}
                />
                {/* Road */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 200,
                    top: 0,
                    bottom: 0,
                    background: "#3A3A3A",
                  }}
                />
                {/* Lane lines */}
                {[0, 60, 120, 180, 240].map((y) => (
                  <div
                    key={y}
                    style={{
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 4,
                      height: 30,
                      top: y,
                      background: "#ddd",
                      opacity: 0.8,
                    }}
                  />
                ))}
                {/* Player car */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    bottom: 50,
                    width: 32,
                    height: 50,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 4,
                      right: 4,
                      height: 18,
                      background: "#C56A2C",
                      borderRadius: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "#E07A3A",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      width: 8,
                      height: 10,
                      background: "#111",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 8,
                      height: 10,
                      background: "#111",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 4,
                      width: 24,
                      height: 12,
                      background: "#87CEEB",
                      opacity: 0.6,
                      borderRadius: 2,
                    }}
                  />
                </div>
                {/* Obstacle car */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: 10,
                    top: 60,
                    width: 28,
                    height: 46,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 3,
                      right: 3,
                      height: 16,
                      background: "#4466AA",
                      borderRadius: 3,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "#3355AA",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      width: 7,
                      height: 9,
                      background: "#111",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 7,
                      height: 9,
                      background: "#111",
                      borderRadius: 2,
                    }}
                  />
                </div>
                {/* HUD preview bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 44,
                    background: "rgba(22,30,42,0.95)",
                    borderTop: "2px solid #4A5667",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    padding: "0 16px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#C56A2C",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                      }}
                    >
                      GEAR
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 20,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      3
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#C56A2C",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                      }}
                    >
                      SPEED
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      87 km/h
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#C56A2C",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                      }}
                    >
                      RPM
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      3,400
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#C56A2C",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 2,
                      }}
                    >
                      DIST
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      512m
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <h1
                className="font-display font-extrabold uppercase tracking-widest"
                style={{ fontSize: "clamp(36px,6vw,56px)", lineHeight: 1.1 }}
              >
                RETRO <span style={{ color: "#C56A2C" }}>GEAR</span> DRIVE
              </h1>
              <p
                style={{ color: "#C9D2DC", maxWidth: 480, lineHeight: 1.6 }}
                className="text-base"
              >
                Master the manual transmission. Feel the clutch. Conquer the
                road. A top-down pixel racer with true gear mechanics.
              </p>

              {lastScore !== null && (
                <div
                  className="px-4 py-2 rounded"
                  style={{
                    background: "rgba(197,106,44,0.15)",
                    border: "1px solid #C56A2C",
                    color: "#C56A2C",
                    fontSize: 14,
                  }}
                >
                  Last run: <strong>{lastScore.toString()}m</strong>
                </div>
              )}

              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  data-ocid="hero.play_button"
                  onClick={onPlay}
                  className="px-8 py-3 rounded font-display font-bold uppercase tracking-widest text-base transition-all hover:brightness-110 active:scale-95"
                  style={{
                    background: "#C56A2C",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(197,106,44,0.4)",
                  }}
                >
                  🏎 Start Engine
                </button>
                <a
                  href="#controls"
                  data-ocid="hero.controls_button"
                  className="px-8 py-3 rounded font-display font-bold uppercase tracking-widest text-base transition-all hover:brightness-110"
                  style={{
                    background: "#2B3645",
                    color: "#C9D2DC",
                    border: "1px solid #4A5667",
                  }}
                >
                  Controls
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          style={{
            background: "#263140",
            borderTop: "1px solid #4A5667",
            borderBottom: "1px solid #4A5667",
          }}
          className="py-16 px-6"
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="font-display font-bold uppercase tracking-widest text-center mb-12"
              style={{ fontSize: 22, color: "#C56A2C", letterSpacing: "0.2em" }}
            >
              GAME FEATURES
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <Settings
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "#C56A2C" }}
                    />
                  ),
                  title: "MANUAL TRANSMISSION",
                  desc: "5 gears + neutral with real clutch mechanics. Stall the engine if you slip up!",
                },
                {
                  icon: (
                    <Gauge
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "#C56A2C" }}
                    />
                  ),
                  title: "RPM SIMULATION",
                  desc: "Live RPM gauge with optimal shift zones. Red-line your engine or miss the powerband.",
                },
                {
                  icon: (
                    <Zap
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "#C56A2C" }}
                    />
                  ),
                  title: "RETRO PIXEL ART",
                  desc: "Low-fi top-down graphics with arcade feel. Dodge traffic and rack up distance.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-xl"
                  style={{ background: "#2B3645", border: "1px solid #4A5667" }}
                >
                  {f.icon}
                  <h3
                    className="font-display font-bold uppercase tracking-widest"
                    style={{ fontSize: 14, color: "#fff" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{ color: "#C9D2DC", fontSize: 14, lineHeight: 1.6 }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* High Scores */}
        <section
          id="scores"
          style={{ background: "#1E2A38" }}
          className="py-16 px-6"
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="font-display font-bold uppercase tracking-widest text-center mb-10"
              style={{ fontSize: 22, color: "#C56A2C", letterSpacing: "0.2em" }}
            >
              HIGH SCORES
            </h2>
            <div
              className="max-w-xl mx-auto rounded-xl overflow-hidden"
              style={{ border: "1px solid #4A5667" }}
            >
              <div
                style={{
                  background: "#2B3645",
                  padding: "12px 20px",
                  borderBottom: "1px solid #4A5667",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Trophy size={16} style={{ color: "#C56A2C" }} />
                <span
                  className="font-display font-bold uppercase tracking-widest"
                  style={{ fontSize: 13, color: "#C56A2C" }}
                >
                  TOP PLAYERS
                </span>
              </div>
              {isLoading ? (
                <div
                  data-ocid="scores.loading_state"
                  style={{
                    background: "#263140",
                    padding: 32,
                    textAlign: "center",
                    color: "#C9D2DC",
                  }}
                >
                  Loading scores...
                </div>
              ) : sortedScores.length === 0 ? (
                <div
                  data-ocid="scores.empty_state"
                  style={{
                    background: "#263140",
                    padding: 32,
                    textAlign: "center",
                    color: "#C9D2DC",
                  }}
                >
                  No scores yet. Be the first to play!
                </div>
              ) : (
                <div style={{ background: "#263140" }}>
                  {sortedScores.map((s: Score, i: number) => (
                    <div
                      key={`score-${s.playerName}-${i}`}
                      data-ocid={`scores.item.${i + 1}`}
                      className="flex items-center justify-between px-5 py-3"
                      style={{
                        borderBottom:
                          i < sortedScores.length - 1
                            ? "1px solid #4A5667"
                            : "none",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className="font-display font-bold"
                          style={{
                            fontSize: 16,
                            color: i < 3 ? "#C56A2C" : "#6E7C8A",
                            minWidth: 24,
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span style={{ color: "#fff", fontSize: 15 }}>
                          {s.playerName || "Anonymous"}
                        </span>
                      </div>
                      <span
                        className="font-display font-bold"
                        style={{ color: "#C56A2C", fontSize: 16 }}
                      >
                        {s.score.toString()}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Controls Reference */}
        <section
          id="controls"
          style={{ background: "#263140", borderTop: "1px solid #4A5667" }}
          className="py-16 px-6"
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="font-display font-bold uppercase tracking-widest text-center mb-10"
              style={{ fontSize: 22, color: "#C56A2C", letterSpacing: "0.2em" }}
            >
              CONTROLS
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["W / ↑", "Accelerate"],
                ["S / ↓", "Brake / Reverse"],
                ["A / ←", "Steer Left"],
                ["D / →", "Steer Right"],
                ["Shift / C", "Hold Clutch"],
                ["E", "Gear Up"],
                ["Q", "Gear Down"],
                ["Enter / Space", "Start Engine"],
              ].map(([key, action]) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-5 py-3 rounded-lg"
                  style={{ background: "#2B3645", border: "1px solid #4A5667" }}
                >
                  <kbd
                    className="font-display font-bold px-3 py-1 rounded"
                    style={{
                      background: "#3A4657",
                      color: "#C56A2C",
                      fontSize: 13,
                      border: "1px solid #C56A2C",
                    }}
                  >
                    {key}
                  </kbd>
                  <span style={{ color: "#C9D2DC", fontSize: 14 }}>
                    {action}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="text-center mt-8"
              style={{ color: "#6E7C8A", fontSize: 13 }}
            >
              Tip: Hold clutch before shifting! Release slowly to avoid
              stalling.
            </p>
          </div>
        </section>
      </main>

      <footer
        style={{ background: "#161E2A", borderTop: "1px solid #4A5667" }}
        className="py-10 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[
              { title: "Game", links: ["Play Now", "High Scores", "Controls"] },
              { title: "About", links: ["How to Play", "Updates", "Roadmap"] },
              { title: "Community", links: ["Discord", "Twitter", "Reddit"] },
              { title: "Support", links: ["FAQ", "Bug Report", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <h4
                  className="font-display font-bold uppercase tracking-widest mb-3"
                  style={{ fontSize: 12, color: "#C56A2C" }}
                >
                  {col.title}
                </h4>
                {col.links.map((l) => (
                  <div
                    key={l}
                    className="mb-2"
                    style={{
                      color: "#6E7C8A",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid #4A5667",
              paddingTop: 20,
              textAlign: "center",
              color: "#4A5667",
              fontSize: 12,
            }}
          >
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              style={{ color: "#C56A2C" }}
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
