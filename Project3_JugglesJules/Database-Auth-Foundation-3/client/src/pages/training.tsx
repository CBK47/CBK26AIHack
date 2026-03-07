import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Play, Pause, SkipForward, RotateCcw, Check, Minus, Plus, Timer, ArrowLeft, ArrowRight, Trophy, Sparkles, Star, Volume2, VolumeX, Coins, Mic, MicOff, Music } from "lucide-react";
import type { Trick } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useMetronomeEngine } from "@/components/metronome";
import { useSpeechRecognition } from "@/lib/speech";

interface TrainingTrick {
  trick: Trick;
  catchesGoal: number;
}

interface MilestoneEvent {
  type: "apprentice" | "mastered";
  trickName: string;
  trickId: number;
  totalCatches: number;
}

interface BadgeEvent {
  badgeId: string;
  badgeName: string;
}

interface XPProcessResult {
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  totalCoins: number;
  level: number;
  milestones: MilestoneEvent[];
  newBadges: BadgeEvent[];
}

type Phase = "setup" | "training" | "review" | "complete";

export default function TrainingPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
  const [duration, setDuration] = useState(20);
  const [energyLevel, setEnergyLevel] = useState("Moderate");
  const [focusPoint, setFocusPoint] = useState("Variety & Flow");
  const [trainingSet, setTrainingSet] = useState<TrainingTrick[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drops, setDrops] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [moodRating, setMoodRating] = useState("");
  const [notes, setNotes] = useState("");

  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const [xpResult, setXpResult] = useState<XPProcessResult | null>(null);
  const [showMasteryDialog, setShowMasteryDialog] = useState(false);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [handsFreeEnabled, setHandsFreeEnabled] = useState(false);
  const [trainingBpm, setTrainingBpm] = useState(100);
  const [trickCatchCount, setTrickCatchCount] = useState(0);
  const [trickCountdown, setTrickCountdown] = useState<number | null>(null);
  const [trickActive, setTrickActive] = useState(false);
  const trickCatchRef = useRef(0);
  const trickCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const onTrainingBeat = useCallback(() => {
    if (!trickActive) return;
    trickCatchRef.current += 1;
    setTrickCatchCount(trickCatchRef.current);
  }, [trickActive]);

  const trainingMetronome = useMetronomeEngine(trickActive ? onTrainingBeat : undefined);

  const dropsRef = useRef(drops);
  const currentIndexRef = useRef(currentIndex);
  dropsRef.current = drops;
  currentIndexRef.current = currentIndex;

  const stopHandsFree = useCallback(() => {
    trainingMetronome.stop();
    setTrickActive(false);
    setTrickCountdown(null);
    if (trickCountdownRef.current) {
      clearInterval(trickCountdownRef.current);
      trickCountdownRef.current = null;
    }
  }, [trainingMetronome]);

  const startTrickCountdown = useCallback(() => {
    setTrickCountdown(3);
    setTrickCatchCount(0);
    trickCatchRef.current = 0;
    setTrickActive(false);

    let count = 3;
    if (trickCountdownRef.current) clearInterval(trickCountdownRef.current);
    trickCountdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(trickCountdownRef.current!);
        trickCountdownRef.current = null;
        setTrickCountdown(null);
        setTrickActive(true);
        trainingMetronome.start(trainingBpm);
      } else {
        setTrickCountdown(count);
      }
    }, 1000);
  }, [trainingBpm, trainingMetronome]);

  const handleTrainingDrop = useCallback(() => {
    if (!trickActive) return;
    trainingMetronome.stop();
    setTrickActive(false);
    const newDrops = [...dropsRef.current];
    newDrops[currentIndexRef.current]++;
    setDrops(newDrops);
    startTrickCountdown();
  }, [trickActive, trainingMetronome, startTrickCountdown]);

  const { isListening: trainingMicListening, isSupported: trainingMicSupported, permissionDenied: trainingMicDenied } = useSpeechRecognition({
    keyword: "drop",
    enabled: handsFreeEnabled && trickActive,
    onKeyword: handleTrainingDrop,
  });

  const speak = (text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    if (timerInterval) clearInterval(timerInterval);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const generateTraining = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/training/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, energyLevel, focusPoint, userId: user?.id }),
      });
      const data = await res.json();
      setTrainingSet(data.trainingSet);
      setDrops(new Array(data.trainingSet.length).fill(0));
      setCurrentIndex(0);
      setTimer(0);

      const session = await apiRequest("POST", "/api/sessions", {
        userId: user?.id,
        durationMinutes: duration,
        energyLevel,
        focusPoint,
      });
      const sessionData = await session.json();
      setSessionId(sessionData.id);

      setPhase("training");
      startTimer();
      if (audioEnabled && data.trainingSet.length > 0) {
        speak(`Training started. First trick: ${data.trainingSet[0].trick.name}. ${data.trainingSet[0].catchesGoal} catches.`);
      }
      if (handsFreeEnabled) {
        startTrickCountdown();
      }
    } catch (err: any) {
      toast({ title: "Error generating training", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const recordDrop = () => {
    const newDrops = [...drops];
    newDrops[currentIndex]++;
    setDrops(newDrops);
  };

  const nextTrick = () => {
    stopHandsFree();
    if (currentIndex < trainingSet.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      speak(`Next: ${trainingSet[nextIdx].trick.name}. ${trainingSet[nextIdx].catchesGoal} catches.`);
      if (handsFreeEnabled) {
        setTimeout(() => startTrickCountdown(), 500);
      }
    } else {
      pauseTimer();
      setPhase("review");
      speak("Session complete. Time to review.");
    }
  };

  const prevTrick = () => {
    stopHandsFree();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (handsFreeEnabled) {
        setTimeout(() => startTrickCountdown(), 500);
      }
    }
  };

  const finishSession = async () => {
    if (!sessionId || saving) return;
    setSaving(true);

    const totalDrops = drops.reduce((sum, d) => sum + d, 0);

    try {
      await apiRequest("PATCH", `/api/session/${sessionId}`, {
        totalDrops,
        moodRating,
        notes,
        durationMinutes: Math.ceil(timer / 60),
      });

      const trickResults = [];
      for (let i = 0; i < trainingSet.length; i++) {
        const catchesActual = Math.max(0, trainingSet[i].catchesGoal - drops[i]);
        await apiRequest("POST", "/api/session-tricks", {
          sessionId,
          trickId: trainingSet[i].trick.id,
          catchesGoal: trainingSet[i].catchesGoal,
          catchesActual,
          drops: drops[i],
        });
        trickResults.push({
          trickId: trainingSet[i].trick.id,
          trickName: trainingSet[i].trick.name,
          catchesActual,
          drops: drops[i],
        });
      }

      const xpRes = await apiRequest("POST", "/api/session/process-xp", {
        userId: user?.id,
        trickResults,
      });
      const xpData: XPProcessResult = await xpRes.json();
      setXpResult(xpData);

      if (user) {
        setUser({ ...user, xp: xpData.totalXp, level: xpData.level, coins: xpData.totalCoins });
      }

      for (const milestone of xpData.milestones) {
        if (milestone.type === "apprentice") {
          toast({
            title: "Nice Progress!",
            description: `You've reached 30 catches on "${milestone.trickName}"! Keep it up, Apprentice!`,
          });
        }
      }

      for (const badge of xpData.newBadges) {
        toast({
          title: "Badge Earned!",
          description: badge.badgeName,
        });
      }

      const masteredMilestones = xpData.milestones.filter(m => m.type === "mastered");
      if (masteredMilestones.length > 0) {
        setCurrentMilestoneIndex(0);
        setShowMasteryDialog(true);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/sessions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-tricks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements", user?.id] });
      setPhase("complete");
    } catch (err: any) {
      toast({ title: "Error saving session", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentTrick = trainingSet[currentIndex];
  const progressPercent = trainingSet.length > 0 ? ((currentIndex + 1) / trainingSet.length) * 100 : 0;

  const masteredMilestones = xpResult?.milestones.filter(m => m.type === "mastered") || [];

  if (phase === "setup") {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-training-title">Training Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your training session</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Parameters</CardTitle>
            <CardDescription>Customize your training to match how you're feeling today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Training Duration</label>
                <Badge variant="secondary" data-testid="text-duration">{duration} min</Badge>
              </div>
              <Slider
                value={[duration]}
                onValueChange={([val]) => setDuration(val)}
                min={10}
                max={60}
                step={5}
                data-testid="slider-duration"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 min</span>
                <span>60 min</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Energy Level</label>
              <Select value={energyLevel} onValueChange={setEnergyLevel}>
                <SelectTrigger data-testid="select-energy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High - Ready to push my limits</SelectItem>
                  <SelectItem value="Moderate">Moderate - Steady practice</SelectItem>
                  <SelectItem value="Low">Low - Taking it easy</SelectItem>
                  <SelectItem value="Just want to chill">Just want to chill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Focus Point</label>
              <Select value={focusPoint} onValueChange={setFocusPoint}>
                <SelectTrigger data-testid="select-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technique Refinement">Technique Refinement</SelectItem>
                  <SelectItem value="Endurance Building">Endurance Building</SelectItem>
                  <SelectItem value="New Trick Learning">New Trick Learning</SelectItem>
                  <SelectItem value="Variety & Flow">Variety & Flow</SelectItem>
                  <SelectItem value="Performance Prep">Performance Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Audio Cues</p>
                <p className="text-xs text-muted-foreground">Announce trick names via speech</p>
              </div>
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                data-testid="button-toggle-audio"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-primary" /> Hands-Free Mode
                  </p>
                  <p className="text-xs text-muted-foreground">Metronome counts catches, say "Drop" to log drops</p>
                </div>
                <Button
                  variant={handsFreeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (handsFreeEnabled) stopHandsFree();
                    setHandsFreeEnabled(!handsFreeEnabled);
                  }}
                  data-testid="button-toggle-handsfree"
                >
                  {handsFreeEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>
              {handsFreeEnabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Music className="w-3 h-3" /> BPM
                    </label>
                    <Badge variant="secondary" className="text-xs" data-testid="text-training-bpm">{trainingBpm} BPM</Badge>
                  </div>
                  <Slider
                    value={[trainingBpm]}
                    min={40}
                    max={200}
                    step={5}
                    onValueChange={([val]) => setTrainingBpm(val)}
                    data-testid="slider-training-bpm"
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={generateTraining}
              disabled={generating}
              data-testid="button-generate-training"
            >
              {generating ? "Generating..." : "Generate Training Set"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "training" && currentTrick) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Trick {currentIndex + 1} of {trainingSet.length}
            </p>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-current-trick">
              {currentTrick.trick.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setAudioEnabled(!audioEnabled)}
              data-testid="button-audio-toggle-training"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-mono font-bold" data-testid="text-timer">{formatTime(timer)}</span>
            <Button size="icon" variant="ghost" onClick={timerRunning ? pauseTimer : startTimer} data-testid="button-timer-toggle">
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Progress value={progressPercent} className="h-1.5" />

        {handsFreeEnabled && trickCountdown !== null && (
          <div className="flex items-center justify-center py-4">
            <motion.div
              key={trickCountdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-primary"
              data-testid="text-trick-countdown"
            >
              {trickCountdown}
            </motion.div>
          </div>
        )}

        {handsFreeEnabled && trickActive && (
          <Card className="border-primary/30">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-75 flex items-center justify-center ${trainingMetronome.beat
                      ? "border-primary bg-primary/20 scale-110"
                      : "border-muted-foreground/20 bg-muted/30 scale-100"
                    }`}
                  data-testid="training-metronome-pulse"
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-75 ${trainingMetronome.beat ? "bg-primary" : "bg-muted-foreground/20"
                      }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Catches</p>
                  <p className="text-2xl font-mono font-bold text-primary" data-testid="text-trick-catches">{trickCatchCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {trainingMicListening && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-green-600 dark:text-green-400"
                    data-testid="training-mic-listening"
                  >
                    <Mic className="w-4 h-4" />
                  </motion.div>
                )}
                <Badge variant="outline" className="text-xs">
                  <Music className="w-3 h-3 mr-1" /> {trainingBpm} BPM
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleTrainingDrop}
                  data-testid="button-handsfree-drop"
                >
                  <Minus className="w-3 h-3 mr-1" /> Drop
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {currentTrick.trick.objectsCount} {currentTrick.trick.propType}
              </Badge>
              <Badge variant="outline">
                Difficulty {currentTrick.trick.difficulty}/5
              </Badge>
              {currentTrick.trick.siteswap && (
                <Badge variant="outline">
                  Siteswap: {currentTrick.trick.siteswap}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {currentTrick.trick.description}
            </p>

            {currentTrick.trick.tip && (
              <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                <p className="text-sm">
                  <span className="font-medium text-primary">Tip: </span>
                  {currentTrick.trick.tip}
                </p>
              </div>
            )}

            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-muted-foreground">Goal</p>
              <p className="text-4xl font-bold" data-testid="text-catches-goal">{currentTrick.catchesGoal} catches</p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-4">Manual Drop Log</p>
                <div className="flex flex-col items-center gap-6">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full sm:w-64 h-24 text-2xl font-black rounded-2xl shadow-lg active:scale-95 transition-all flex flex-col gap-1"
                    onClick={recordDrop}
                    data-testid="button-drop-plus"
                  >
                    <Plus className="w-8 h-8" />
                    DROP
                  </Button>

                  <div className="flex items-center gap-8">
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-12 h-12 rounded-full"
                      onClick={() => {
                        const newDrops = [...drops];
                        newDrops[currentIndex] = Math.max(0, newDrops[currentIndex] - 1);
                        setDrops(newDrops);
                      }}
                      data-testid="button-drop-minus"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                      <span className="text-4xl font-mono font-black" data-testid="text-drops-count">
                        {drops[currentIndex]}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">Drops</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-3">
          <Button
            variant="outline"
            className="h-12"
            onClick={prevTrick}
            disabled={currentIndex === 0}
            data-testid="button-prev-trick"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            className="h-12 hidden sm:flex"
            onClick={() => {
              const newDrops = [...drops];
              newDrops[currentIndex] = 0;
              setDrops(newDrops);
            }}
            data-testid="button-reset-trick"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button className="h-12" onClick={nextTrick} data-testid="button-next-trick">
            {currentIndex === trainingSet.length - 1 ? (
              <>Finish <Check className="w-4 h-4 ml-1" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    const totalDrops = drops.reduce((sum, d) => sum + d, 0);
    const totalCatches = trainingSet.reduce((sum, item, i) => sum + Math.max(0, item.catchesGoal - drops[i]), 0);
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session Review</h1>
          <p className="text-muted-foreground text-sm mt-1">How did your training go?</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold" data-testid="text-review-time">{formatTime(timer)}</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-review-drops">{totalDrops}</p>
                <p className="text-xs text-muted-foreground">Total Drops</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary" data-testid="text-review-catches">{totalCatches}</p>
                <p className="text-xs text-muted-foreground">Total Catches</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{trainingSet.length}</p>
                <p className="text-xs text-muted-foreground">Tricks</p>
              </div>
            </div>
            <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-sm">
                <Sparkles className="w-4 h-4 inline mr-1 text-primary" />
                You'll earn <span className="font-bold text-primary">{totalCatches} XP</span> from catches this session
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How did you feel?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["Great", "Good", "Okay", "Challenging", "Frustrated"].map((mood) => (
                <Button
                  key={mood}
                  variant={moodRating === mood ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMoodRating(mood)}
                  data-testid={`button-mood-${mood.toLowerCase()}`}
                >
                  {mood}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations about your session..."
                data-testid="input-session-notes"
              />
            </div>

            <Button className="w-full" onClick={finishSession} disabled={saving} data-testid="button-save-session">
              {saving ? "Saving..." : "Save Session & Earn XP"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trick Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingSet.map((item, i) => {
                const catches = Math.max(0, item.catchesGoal - drops[i]);
                return (
                  <div key={i} className="flex items-center justify-between gap-2 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.trick.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {catches} catches / {item.catchesGoal} goal
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        +{catches} XP
                      </Badge>
                      <Badge variant={drops[i] === 0 ? "default" : "secondary"}>
                        {drops[i]} drops
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <>
        <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Session Complete!</h1>
            <p className="text-muted-foreground mt-2">Your progress has been saved.</p>
          </div>

          {xpResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-left">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-semibold">XP Earned</span>
                    </div>
                    <span className="text-xl font-bold text-primary">+{xpResult.xpEarned}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>Total XP</span>
                    <span className="font-medium">{xpResult.totalXp}</span>
                  </div>
                  {xpResult.coinsEarned > 0 && (
                    <motion.div
                      className="flex items-center justify-between gap-4 text-sm"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <div className="flex items-center gap-1 text-chart-4">
                        <Coins className="w-4 h-4" />
                        <span className="font-medium">Coins Earned</span>
                      </div>
                      <motion.span
                        className="font-bold text-chart-4 text-lg"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                        data-testid="text-coins-earned-animated"
                      >
                        +{xpResult.coinsEarned}
                      </motion.span>
                    </motion.div>
                  )}
                  <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>Level</span>
                    <Badge variant="secondary">Level {xpResult.level}</Badge>
                  </div>
                  {xpResult.milestones.length > 0 && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones</p>
                      {xpResult.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {m.type === "mastered" ? (
                            <Trophy className="w-4 h-4 text-chart-4" />
                          ) : (
                            <Star className="w-4 h-4 text-chart-4" />
                          )}
                          <span className="text-sm">
                            {m.type === "apprentice"
                              ? `Apprentice: ${m.trickName} (30 catches)`
                              : `Mastered: ${m.trickName} (100 catches)`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {xpResult.newBadges.length > 0 && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Badges Earned</p>
                      {xpResult.newBadges.map((b, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{b.badgeName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setPhase("setup"); setTimer(0); setXpResult(null); }} data-testid="button-new-session">
              New Session
            </Button>
            <a href="/">
              <Button data-testid="button-back-dashboard">Back to Dashboard</Button>
            </a>
          </div>
        </div>

        <Dialog open={showMasteryDialog} onOpenChange={setShowMasteryDialog}>
          <DialogContent className="text-center max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="w-16 h-16 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-4"
                >
                  <Trophy className="w-8 h-8 text-chart-4" />
                </motion.div>
                Achievement Unlocked!
              </DialogTitle>
            </DialogHeader>
            {masteredMilestones[currentMilestoneIndex] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-lg font-bold">
                  {masteredMilestones[currentMilestoneIndex].trickName}
                </p>
                <p className="text-muted-foreground text-sm">
                  You've reached 100 catches and mastered this trick! +100 bonus XP awarded.
                </p>
                <Badge className="text-sm">The Master</Badge>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      if (currentMilestoneIndex < masteredMilestones.length - 1) {
                        setCurrentMilestoneIndex(currentMilestoneIndex + 1);
                      } else {
                        setShowMasteryDialog(false);
                      }
                    }}
                    data-testid="button-dismiss-mastery"
                  >
                    {currentMilestoneIndex < masteredMilestones.length - 1 ? "Next Achievement" : "Awesome!"}
                  </Button>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
