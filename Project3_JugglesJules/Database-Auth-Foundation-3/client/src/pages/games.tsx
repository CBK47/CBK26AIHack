import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Timer, Trophy, Target, Zap, Dumbbell, Layers,
  ArrowLeft, Minus, Plus, Check, X, Play, Square, RotateCcw, ArrowUp, Shuffle, Info, Infinity, Mic, MicOff, Music
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Trick } from "@shared/schema";
import { useMetronomeEngine } from "@/components/metronome";
import { useSpeechRecognition } from "@/lib/speech";

type GameType = "cascade_count" | "flash" | "siteswap" | "balance" | "sequence" | "height_challenge";
type ViewState = { view: "hub" } | { view: "setup"; gameType: GameType } | { view: "active"; gameType: GameType } | { view: "results"; gameType: GameType };

const SITESWAP_LIST = ["333", "423", "441", "531", "534", "51", "50505", "552", "42", "40"];
const BALANCE_POSE_POOL = [
  { name: "One Leg Stand", duration: 30 },
  { name: "Squat Hold", duration: 20 },
  { name: "Lunge Position", duration: 25 },
  { name: "Tippy Toes", duration: 20 },
  { name: "Eyes Closed", duration: 15 },
  { name: "Heel-to-Toe Walk", duration: 20 },
  { name: "Wide Stance", duration: 25 },
  { name: "Kneeling", duration: 20 },
];

const JUGGLING_PATTERN_POOL = [
  "Cascade",
  "Reverse Cascade",
  "Columns",
  "Under the Leg",
  "Behind the Back",
  "Two in One Hand",
  "Half Shower",
  "Over the Top",
  "Windmill",
  "Chops",
];

function generateRandomPairings(count: number) {
  const shuffledPoses = [...BALANCE_POSE_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  const shuffledPatterns = [...JUGGLING_PATTERN_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffledPoses.map((pose, i) => ({
    pose: pose.name,
    pattern: shuffledPatterns[i],
    duration: pose.duration,
  }));
}
const HEIGHT_LEVELS = ["Chin Height", "Head Height", "Above Head", "Ceiling Height"];

interface GameDef {
  type: GameType;
  title: string;
  description: string;
  icon: typeof Timer;
}

const GAMES: GameDef[] = [
  { type: "cascade_count", title: "Cascade Count", description: "Count your consecutive catches and beat your record", icon: Target },
  { type: "flash", title: "Flash", description: "Achieve target catches as fast as possible with zero drops", icon: Zap },
  { type: "siteswap", title: "Siteswap Challenge", description: "Perform a random siteswap pattern for a set duration", icon: Layers },
  { type: "balance", title: "Balance & Juggling", description: "Juggle cascade while holding various balance poses", icon: Dumbbell },
  { type: "sequence", title: "Sequence Challenge", description: "Complete a random sequence of tricks in order", icon: Trophy },
  { type: "height_challenge", title: "Height Challenge", description: "Maintain juggling at increasing heights", icon: ArrowUp },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useTimer(countDown?: number) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        if (countDown !== undefined) {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setRunning(false);
            return 0;
          }
          return next;
        }
        return prev + 1;
      });
    }, 1000);
  }, [countDown]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback((initial?: number) => {
    stop();
    setTime(initial ?? 0);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { time, running, start, stop, reset, setTime };
}

export default function GamesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewState, setViewState] = useState<ViewState>({ view: "hub" });
  const [drops, setDrops] = useState(0);
  const [saving, setSaving] = useState(false);

  const [cascadeBpm, setCascadeBpm] = useState(100);
  const [cascadeCatchCount, setCascadeCatchCount] = useState(0);
  const [cascadeCountdown, setCascadeCountdown] = useState<number | null>(null);
  const [cascadeActive, setCascadeActive] = useState(false);
  const [cascadeStopped, setCascadeStopped] = useState(false);
  const cascadeCatchRef = useRef(0);
  const cascadeDropRef = useRef(0);
  const cascadeCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const [flashTarget, setFlashTarget] = useState(5);
  const [siteswapDuration, setSiteswapDuration] = useState(30);
  const [siteswapPattern, setSiteswapPattern] = useState("");
  const [heightLevel, setHeightLevel] = useState("Chin Height");

  const [balancePoseIndex, setBalancePoseIndex] = useState(0);
  const [balancePoseTime, setBalancePoseTime] = useState(0);
  const [balancePosesCompleted, setBalancePosesCompleted] = useState(0);
  const [balanceTotalTime, setBalanceTotalTime] = useState(0);
  const [balanceFinished, setBalanceFinished] = useState(false);
  const [balancePairings, setBalancePairings] = useState(() => generateRandomPairings(5));

  const [sequenceTricks, setSequenceTricks] = useState<Trick[]>([]);
  const [sequenceResults, setSequenceResults] = useState<("complete" | "dropped" | null)[]>([]);
  const [sequenceCurrentIndex, setSequenceCurrentIndex] = useState(0);

  const [finalTime, setFinalTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const timer = useTimer();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const balanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: personalBests } = useQuery<Record<string, number>>({
    queryKey: ["/api/game-results", user?.id, "best"],
    enabled: !!user?.id,
  });

  const { data: allTricks } = useQuery<Trick[]>({
    queryKey: ["/api/tricks"],
  });

  const onCascadeBeat = useCallback(() => {
    if (!cascadeActive) return;
    cascadeCatchRef.current += 1;
    setCascadeCatchCount(cascadeCatchRef.current);
  }, [cascadeActive]);

  const metronome = useMetronomeEngine(cascadeActive ? onCascadeBeat : undefined);

  const handleCascadeDrop = useCallback(() => {
    if (!cascadeActive || cascadeStopped) return;
    metronome.stop();
    timer.stop();
    setCascadeActive(false);
    setCascadeStopped(true);
    cascadeDropRef.current += 1;
    setDrops(cascadeDropRef.current);
  }, [cascadeActive, cascadeStopped, metronome, timer]);

  const { isListening: micListening, isSupported: micSupported, permissionDenied: micDenied } = useSpeechRecognition({
    keyword: "drop",
    enabled: cascadeActive && !cascadeStopped,
    onKeyword: handleCascadeDrop,
  });

  const startCascadeCountdown = useCallback(() => {
    setCascadeCountdown(3);
    setCascadeCatchCount(0);
    setCascadeActive(false);
    setCascadeStopped(false);
    cascadeCatchRef.current = 0;
    cascadeDropRef.current = 0;
    setDrops(0);
    timer.reset();

    let count = 3;
    if (cascadeCountdownRef.current) clearInterval(cascadeCountdownRef.current);
    cascadeCountdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(cascadeCountdownRef.current!);
        cascadeCountdownRef.current = null;
        setCascadeCountdown(null);
        setCascadeActive(true);
        timer.start();
        metronome.start(cascadeBpm);
      } else {
        setCascadeCountdown(count);
      }
    }, 1000);
  }, [cascadeBpm, metronome, timer]);

  const resetCascadeRun = useCallback(() => {
    setCascadeStopped(false);
    setCascadeCatchCount(0);
    cascadeCatchRef.current = 0;
    cascadeDropRef.current = 0;
    setDrops(0);
    startCascadeCountdown();
  }, [startCascadeCountdown]);

  const finishCascade = useCallback(() => {
    metronome.stop();
    setCascadeActive(false);
    timer.stop();
    setFinalScore(cascadeCatchRef.current);
    setFinalTime(timer.time);
    setViewState({ view: "results", gameType: "cascade_count" });
  }, [metronome, timer]);

  const resetGame = () => {
    setDrops(0);
    setSaving(false);
    setFinalTime(0);
    setFinalScore(0);
    timer.reset();
    metronome.stop();
    setCascadeActive(false);
    setCascadeStopped(false);
    setCascadeCountdown(null);
    setCascadeCatchCount(0);
    cascadeCatchRef.current = 0;
    cascadeDropRef.current = 0;
    if (cascadeCountdownRef.current) clearInterval(cascadeCountdownRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (balanceTimerRef.current) clearInterval(balanceTimerRef.current);
    setBalancePoseIndex(0);
    setBalancePoseTime(0);
    setBalancePosesCompleted(0);
    setBalanceTotalTime(0);
    setBalanceFinished(false);
    setSequenceCurrentIndex(0);
    setSequenceResults([]);
  };

  const goToHub = () => {
    resetGame();
    setViewState({ view: "hub" });
  };

  const startGame = (gameType: GameType) => {
    resetGame();
    if (gameType === "cascade_count") {
      setViewState({ view: "active", gameType });
      startCascadeCountdown();
    } else if (gameType === "balance") {
      const pairings = balancePairings;
      setViewState({ view: "active", gameType });
      startBalance(pairings);
    } else if (gameType === "sequence") {
      startSequence();
      setViewState({ view: "active", gameType });
    } else {
      setViewState({ view: "active", gameType });
      if (gameType === "flash" || gameType === "height_challenge") {
        timer.reset();
        timer.start();
      } else if (gameType === "siteswap") {
        const pattern = SITESWAP_LIST[Math.floor(Math.random() * SITESWAP_LIST.length)];
        setSiteswapPattern(pattern);
        timer.reset(siteswapDuration);
        startCountdown(siteswapDuration);
      }
    }
  };

  const startCountdown = (duration: number) => {
    timer.setTime(duration);
    if (countdownRef.current) clearInterval(countdownRef.current);
    const startTs = Date.now();
    countdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      const remaining = duration - elapsed;
      if (remaining <= 0) {
        timer.setTime(0);
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        completeSiteswap(duration);
      } else {
        timer.setTime(remaining);
      }
    }, 1000);
  };

  const completeSiteswap = (duration?: number) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    const dur = duration ?? siteswapDuration;
    const score = Math.max(0, dur - drops * 5);
    setFinalTime(dur);
    setFinalScore(score);
    setViewState({ view: "results", gameType: "siteswap" });
  };


  const completeFlash = () => {
    timer.stop();
    const bonus = drops === 0 ? flashTarget * 2 : 0;
    const score = Math.max(0, flashTarget + bonus - drops * 2);
    setFinalTime(timer.time);
    setFinalScore(score);
    setViewState({ view: "results", gameType: "flash" });
  };

  const startBalance = (pairings?: typeof balancePairings) => {
    const usePairings = pairings || balancePairings;
    setBalancePoseIndex(0);
    setBalancePoseTime(usePairings[0].duration);
    setBalancePosesCompleted(0);
    setBalanceTotalTime(0);
    setBalanceFinished(false);
    setDrops(0);
    runBalanceTimer(0, usePairings[0].duration, 0, 0, usePairings);
  };

  const runBalanceTimer = (poseIdx: number, poseTimeLeft: number, totalT: number, completed: number, pairings: typeof balancePairings) => {
    if (balanceTimerRef.current) clearInterval(balanceTimerRef.current);
    let localTime = poseTimeLeft;
    let localTotal = totalT;
    balanceTimerRef.current = setInterval(() => {
      localTime--;
      localTotal++;
      setBalancePoseTime(localTime);
      setBalanceTotalTime(localTotal);
      if (localTime <= 0) {
        const nextCompleted = completed + 1;
        setBalancePosesCompleted(nextCompleted);
        const nextIdx = poseIdx + 1;
        if (nextIdx >= pairings.length) {
          clearInterval(balanceTimerRef.current!);
          balanceTimerRef.current = null;
          setBalanceFinished(true);
          return;
        }
        setBalancePoseIndex(nextIdx);
        const nextDur = pairings[nextIdx].duration;
        setBalancePoseTime(nextDur);
        clearInterval(balanceTimerRef.current!);
        runBalanceTimer(nextIdx, nextDur, localTotal, nextCompleted, pairings);
      }
    }, 1000);
  };

  const completeBalance = () => {
    if (balanceTimerRef.current) {
      clearInterval(balanceTimerRef.current);
      balanceTimerRef.current = null;
    }
    const completed = balanceFinished ? balancePairings.length : balancePosesCompleted;
    const score = Math.max(0, completed * 20 - drops * 3);
    setFinalTime(balanceTotalTime);
    setFinalScore(score);
    setViewState({ view: "results", gameType: "balance" });
  };

  useEffect(() => {
    if (balanceFinished && viewState.view === "active" && "gameType" in viewState && viewState.gameType === "balance") {
      completeBalance();
    }
  }, [balanceFinished]);

  const startSequence = () => {
    if (!allTricks || allTricks.length === 0) return;
    const count = Math.min(allTricks.length, 3 + Math.floor(Math.random() * 4));
    const shuffled = [...allTricks].sort(() => Math.random() - 0.5).slice(0, count);
    setSequenceTricks(shuffled);
    setSequenceResults(new Array(shuffled.length).fill(null));
    setSequenceCurrentIndex(0);
    setDrops(0);
  };

  const markSequenceTrick = (result: "complete" | "dropped") => {
    const newResults = [...sequenceResults];
    newResults[sequenceCurrentIndex] = result;
    setSequenceResults(newResults);
    if (result === "dropped") {
      setDrops((d) => d + 1);
    }
    const nextIdx = sequenceCurrentIndex + 1;
    if (nextIdx >= sequenceTricks.length) {
      const completed = newResults.filter((r) => r === "complete").length;
      const totalDrops = newResults.filter((r) => r === "dropped").length;
      const score = Math.max(0, completed * 25 - totalDrops * 5);
      setFinalScore(score);
      setFinalTime(0);
      setViewState({ view: "results", gameType: "sequence" });
    } else {
      setSequenceCurrentIndex(nextIdx);
    }
  };

  const completeHeight = () => {
    timer.stop();
    const score = Math.max(0, timer.time - drops * 10);
    setFinalTime(timer.time);
    setFinalScore(score);
    setViewState({ view: "results", gameType: "height_challenge" });
  };

  const saveResult = async (gameType: GameType) => {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      let metadata: Record<string, unknown> = {};
      if (gameType === "cascade_count") metadata = { bpm: cascadeBpm, catches: cascadeCatchCount, drops };
      else if (gameType === "flash") metadata = { target: flashTarget };
      else if (gameType === "siteswap") metadata = { pattern: siteswapPattern, duration: siteswapDuration };
      else if (gameType === "balance") metadata = { posesCompleted: balancePosesCompleted, pairings: balancePairings };
      else if (gameType === "sequence") metadata = { tricksTotal: sequenceTricks.length, tricksCompleted: sequenceResults.filter((r) => r === "complete").length };
      else if (gameType === "height_challenge") metadata = { level: heightLevel };

      await apiRequest("POST", "/api/game-results", {
        userId: user.id,
        gameType,
        score: finalScore,
        timeSeconds: finalTime,
        drops,
        metadata: JSON.stringify(metadata),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/game-results", user.id, "best"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-results", user.id] });
      toast({ title: "Result saved!", description: `Score: ${finalScore}` });
      goToHub();
    } catch (err: any) {
      toast({ title: "Error saving result", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (viewState.view === "hub") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-games-title">Games</h1>
          <p className="text-muted-foreground text-sm mt-1">Challenge yourself with juggling mini-games</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const best = personalBests?.[game.type];
            return (
              <Card key={game.type} className="hover-elevate" data-testid={`card-game-${game.type}`}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base" data-testid={`text-game-title-${game.type}`}>{game.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{game.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {best !== undefined && best !== null && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Best:</span>
                      <Badge variant="secondary" data-testid={`text-best-score-${game.type}`}>{best}</Badge>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetGame();
                      setViewState({ view: "setup", gameType: game.type });
                    }}
                    data-testid={`button-play-${game.type}`}
                  >
                    <Play className="w-4 h-4 mr-2" /> Play
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (viewState.view === "setup") {
    const { gameType } = viewState;
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 max-w-2xl mx-auto space-y-6"
      >
        <Button variant="ghost" onClick={goToHub} data-testid="button-back-hub">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
        </Button>

        {gameType === "cascade_count" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Cascade Count</CardTitle>
              <CardDescription>Hands-free counting synced to a metronome beat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" /> Metronome BPM
                  </label>
                  <Badge variant="secondary" data-testid="text-cascade-bpm">{cascadeBpm} BPM</Badge>
                </div>
                <Slider
                  value={[cascadeBpm]}
                  min={40}
                  max={200}
                  step={5}
                  onValueChange={([val]) => setCascadeBpm(val)}
                  data-testid="slider-cascade-bpm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>40 BPM</span>
                  <span>200 BPM</span>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 border p-3 space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" /> How It Works
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Press <strong>Start</strong> → 3-second countdown</li>
                  <li>Metronome begins — each beat = 1 catch counted</li>
                  <li>Say <strong>"Drop"</strong> or tap the manual drop button to stop</li>
                  <li>Your final catch count is saved</li>
                </ol>
              </div>

              {!micSupported && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">
                    <MicOff className="w-3.5 h-3.5 inline mr-1" />
                    Voice recognition not supported in this browser. You can still use the manual drop button.
                  </p>
                </div>
              )}

              <Button className="w-full" size="lg" onClick={() => startGame("cascade_count")} data-testid="button-start-game">
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {gameType === "flash" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Flash</CardTitle>
              <CardDescription>Select target catches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted/50 border p-3">
                <p className="text-sm text-muted-foreground" data-testid="text-flash-instructions">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  Perform a specific number of catches as quickly and cleanly as possible. The timer stops when you hit your target!
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[5, 7, 10, 15].map((t) => (
                  <Button
                    key={t}
                    variant={flashTarget === t ? "default" : "outline"}
                    onClick={() => setFlashTarget(t)}
                    data-testid={`button-target-${t}`}
                    className="toggle-elevate"
                  >
                    {t} catches
                  </Button>
                ))}
              </div>
              <Button className="w-full" onClick={() => startGame("flash")} data-testid="button-start-game">
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {gameType === "siteswap" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Siteswap Challenge</CardTitle>
              <CardDescription>Pick a duration, then juggle the pattern</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {[30, 60, 90].map((d) => (
                  <Button
                    key={d}
                    variant={siteswapDuration === d ? "default" : "outline"}
                    onClick={() => setSiteswapDuration(d)}
                    data-testid={`button-duration-${d}`}
                    className="toggle-elevate"
                  >
                    {d}s
                  </Button>
                ))}
              </div>
              <Button className="w-full" onClick={() => startGame("siteswap")} data-testid="button-start-game">
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {gameType === "balance" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Balance & Juggling</CardTitle>
              <CardDescription>Juggle a pattern while holding balance poses. {balancePairings.length} rounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {balancePairings.map((pairing, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm" data-testid={`text-pairing-${i}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{pairing.pattern}</Badge>
                      <span className="text-muted-foreground">+</span>
                      <span>{pairing.pose}</span>
                    </div>
                    <Badge variant="secondary">{pairing.duration}s</Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setBalancePairings(generateRandomPairings(5))}
                data-testid="button-reroll"
              >
                <Shuffle className="w-4 h-4 mr-2" /> Re-roll
              </Button>
              <Button className="w-full" onClick={() => startGame("balance")} data-testid="button-start-game">
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {gameType === "sequence" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Sequence Challenge</CardTitle>
              <CardDescription>Complete a random sequence of 3-6 tricks in order</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => startGame("sequence")} data-testid="button-start-game" disabled={!allTricks || allTricks.length === 0}>
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}

        {gameType === "height_challenge" && (
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-setup-title">Height Challenge</CardTitle>
              <CardDescription>Select a height level and maintain juggling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {HEIGHT_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={heightLevel === level ? "default" : "outline"}
                    onClick={() => setHeightLevel(level)}
                    data-testid={`button-level-${level.toLowerCase().replace(/\s+/g, "-")}`}
                    className="toggle-elevate"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <Button className="w-full" onClick={() => startGame("height_challenge")} data-testid="button-start-game">
                <Play className="w-4 h-4 mr-2" /> Start
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  if (viewState.view === "active") {
    const { gameType } = viewState;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-6 max-w-2xl mx-auto space-y-6"
      >
        <Button variant="ghost" onClick={goToHub} data-testid="button-back-hub">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {gameType === "cascade_count" && (
          <>
            {cascadeCountdown !== null ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <motion.div
                  key={cascadeCountdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-8xl font-bold text-primary"
                  data-testid="text-countdown"
                >
                  {cascadeCountdown}
                </motion.div>
                <p className="text-muted-foreground text-sm">Get ready...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-xl font-bold" data-testid="text-active-title">Cascade Count</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      <Music className="w-3 h-3 mr-1" /> {cascadeBpm} BPM
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-lg font-mono font-bold" data-testid="text-timer">{formatTime(timer.time)}</span>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 flex flex-col items-center space-y-6">
                    <div
                      className={`w-20 h-20 rounded-full border-4 transition-all duration-75 flex items-center justify-center ${
                        metronome.beat
                          ? "border-primary bg-primary/20 scale-110"
                          : "border-muted-foreground/20 bg-muted/30 scale-100"
                      }`}
                      data-testid="metronome-pulse"
                    >
                      <div
                        className={`w-8 h-8 rounded-full transition-all duration-75 ${
                          metronome.beat ? "bg-primary" : "bg-muted-foreground/20"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Catches</p>
                      <motion.p
                        key={cascadeCatchCount}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="text-6xl font-mono font-bold text-primary"
                        data-testid="text-catch-count"
                      >
                        {cascadeCatchCount}
                      </motion.p>
                    </div>

                    {cascadeActive && !cascadeStopped && (
                      <div className="flex items-center gap-2">
                        {micListening ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400" data-testid="mic-status-listening">
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <Mic className="w-4 h-4" />
                            </motion.div>
                            <span>Listening for "Drop"...</span>
                          </div>
                        ) : micDenied ? (
                          <div className="flex items-center gap-2 text-sm text-destructive" data-testid="mic-status-denied">
                            <MicOff className="w-4 h-4" />
                            <span>Mic access denied</span>
                          </div>
                        ) : !micSupported ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="mic-status-unsupported">
                            <MicOff className="w-4 h-4" />
                            <span>Voice not supported</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {cascadeStopped ? (
                      <div className="space-y-4 w-full text-center">
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                          <p className="text-sm font-medium text-destructive">
                            Drop! Final count: {cascadeCatchCount} catches
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button variant="outline" onClick={resetCascadeRun} data-testid="button-reset-run">
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                          </Button>
                          <Button onClick={finishCascade} data-testid="button-finish-session">
                            <Check className="w-4 h-4 mr-2" /> Finish Session
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        variant="destructive"
                        className="w-32 h-16 rounded-xl text-lg"
                        onClick={handleCascadeDrop}
                        data-testid="button-drop"
                      >
                        <Minus className="w-6 h-6 mr-2" /> Drop
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {gameType === "flash" && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold" data-testid="text-active-title">Flash</h2>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-mono font-bold" data-testid="text-timer">{formatTime(timer.time)}</span>
              </div>
            </div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Target Catches</p>
                  <p className="text-3xl font-bold" data-testid="text-target">{flashTarget}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drops</p>
                  <p className="text-4xl font-bold" data-testid="text-drops">{drops}</p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-32 h-32 rounded-full text-xl"
                  onClick={() => setDrops((d) => d + 1)}
                  data-testid="button-drop"
                >
                  <Minus className="w-8 h-8" />
                </Button>
                <Button onClick={completeFlash} data-testid="button-complete">
                  <Check className="w-4 h-4 mr-2" /> Complete
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {gameType === "siteswap" && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold" data-testid="text-active-title">Siteswap Challenge</h2>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-mono font-bold" data-testid="text-timer">{formatTime(timer.time)}</span>
              </div>
            </div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Pattern</p>
                  <p className="text-6xl font-mono font-bold tracking-widest" data-testid="text-siteswap-pattern">{siteswapPattern}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drops</p>
                  <p className="text-4xl font-bold" data-testid="text-drops">{drops}</p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-32 h-32 rounded-full text-xl"
                  onClick={() => setDrops((d) => d + 1)}
                  data-testid="button-drop"
                >
                  <Minus className="w-8 h-8" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {gameType === "balance" && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold" data-testid="text-active-title">Balance & Juggling</h2>
              <Badge variant="secondary" data-testid="text-pose-progress">
                Round {balancePoseIndex + 1} / {balancePairings.length}
              </Badge>
            </div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Juggle</p>
                  <Badge variant="outline" className="text-base px-3 py-1" data-testid="text-pattern-name">
                    {balancePairings[balancePoseIndex]?.pattern}
                  </Badge>
                  <p className="text-sm text-muted-foreground">while doing</p>
                  <p className="text-2xl font-bold" data-testid="text-pose-name">{balancePairings[balancePoseIndex]?.pose}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                  <p className="text-4xl font-mono font-bold" data-testid="text-pose-timer">{balancePoseTime}s</p>
                </div>
                <Progress value={(balancePoseTime / (balancePairings[balancePoseIndex]?.duration || 1)) * 100} className="h-2" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drops</p>
                  <p className="text-3xl font-bold" data-testid="text-drops">{drops}</p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-24 h-24 rounded-full text-xl"
                  onClick={() => setDrops((d) => d + 1)}
                  data-testid="button-drop"
                >
                  <Minus className="w-6 h-6" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {gameType === "sequence" && (
          <>
            <h2 className="text-xl font-bold" data-testid="text-active-title">Sequence Challenge</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                {sequenceTricks.map((trick, i) => {
                  const result = sequenceResults[i];
                  const isCurrent = i === sequenceCurrentIndex;
                  return (
                    <div
                      key={trick.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-md border ${isCurrent ? "border-primary bg-primary/5" : ""}`}
                      data-testid={`sequence-trick-${i}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCurrent ? "text-primary" : ""}`}>{trick.name}</p>
                        {trick.siteswap && <p className="text-xs text-muted-foreground">Siteswap: {trick.siteswap}</p>}
                      </div>
                      {result === "complete" && <Check className="w-5 h-5 text-green-500" />}
                      {result === "dropped" && <X className="w-5 h-5 text-destructive" />}
                      {result === null && isCurrent && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" onClick={() => markSequenceTrick("complete")} data-testid={`button-trick-complete-${i}`}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => markSequenceTrick("dropped")} data-testid={`button-trick-drop-${i}`}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}

        {gameType === "height_challenge" && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold" data-testid="text-active-title">Height Challenge</h2>
              <Badge variant="secondary" data-testid="text-height-level">{heightLevel}</Badge>
            </div>
            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Time at Height</p>
                  <p className="text-4xl font-mono font-bold" data-testid="text-timer">{formatTime(timer.time)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Drops</p>
                  <p className="text-3xl font-bold" data-testid="text-drops">{drops}</p>
                </div>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-32 h-32 rounded-full text-xl"
                  onClick={() => setDrops((d) => d + 1)}
                  data-testid="button-drop"
                >
                  <Minus className="w-8 h-8" />
                </Button>
                <Button onClick={completeHeight} data-testid="button-stop">
                  <Square className="w-4 h-4 mr-2" /> Stop
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    );
  }

  if (viewState.view === "results") {
    const { gameType } = viewState;
    const gameDef = GAMES.find((g) => g.type === gameType)!;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 max-w-2xl mx-auto space-y-6"
      >
        <Button variant="ghost" onClick={goToHub} data-testid="button-back-hub">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
        </Button>

        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          >
            <Trophy className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold" data-testid="text-results-title">{gameDef.title} - Results</h2>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-primary" data-testid="text-final-score">{finalScore}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              {finalTime > 0 && (
                <div>
                  <p className="text-2xl font-bold" data-testid="text-final-time">{formatTime(finalTime)}</p>
                  <p className="text-xs text-muted-foreground">Time</p>
                </div>
              )}
              <div>
                <p className="text-2xl font-bold" data-testid="text-final-drops">{drops}</p>
                <p className="text-xs text-muted-foreground">Drops</p>
              </div>
            </div>

            {gameType === "siteswap" && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">Pattern</p>
                <p className="text-xl font-mono font-bold" data-testid="text-result-pattern">{siteswapPattern}</p>
              </div>
            )}

            {gameType === "cascade_count" && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">BPM</p>
                <p className="text-xl font-bold" data-testid="text-result-bpm">{cascadeBpm}</p>
              </div>
            )}

            {gameType === "balance" && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">Poses Completed</p>
                <p className="text-xl font-bold" data-testid="text-result-poses">{balancePosesCompleted} / {balancePairings.length}</p>
              </div>
            )}

            {gameType === "sequence" && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">Tricks Completed</p>
                <p className="text-xl font-bold" data-testid="text-result-tricks">
                  {sequenceResults.filter((r) => r === "complete").length} / {sequenceTricks.length}
                </p>
              </div>
            )}

            {gameType === "height_challenge" && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-xl font-bold" data-testid="text-result-level">{heightLevel}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button className="flex-1" onClick={() => saveResult(gameType)} disabled={saving} data-testid="button-save-result">
            {saving ? "Saving..." : "Save Result"}
          </Button>
          <Button variant="outline" onClick={() => { resetGame(); setViewState({ view: "setup", gameType }); }} data-testid="button-play-again">
            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}
