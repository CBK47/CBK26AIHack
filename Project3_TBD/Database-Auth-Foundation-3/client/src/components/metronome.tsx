import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Play, Square, Music } from "lucide-react";
import { Link } from "wouter";
import type { UserPurchase } from "@shared/schema";

export function useMetronomeEngine(onBeatCallback?: () => void) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(false);
  const bpmRef = useRef(120);
  const onBeatRef = useRef(onBeatCallback);
  onBeatRef.current = onBeatCallback;

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(() => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
    setBeat(true);
    setTimeout(() => setBeat(false), 80);
    onBeatRef.current?.();
  }, [getAudioCtx]);

  const start = useCallback((bpm: number) => {
    bpmRef.current = bpm;
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    setIsPlaying(true);
    playBeep();
    const interval = 60000 / bpm;
    timerRef.current = window.setInterval(() => {
      playBeep();
    }, interval);
  }, [getAudioCtx, playBeep]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setBeat(false);
  }, []);

  const updateBpm = useCallback((bpm: number) => {
    bpmRef.current = bpm;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      playBeep();
      timerRef.current = window.setInterval(() => {
        playBeep();
      }, 60000 / bpm);
    }
  }, [playBeep]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { isPlaying, beat, start, stop, updateBpm };
}

export function Metronome({ mini = false }: { mini?: boolean }) {
  const { user } = useAuth();
  const [bpm, setBpm] = useState(120);
  const { isPlaying, beat, start, stop, updateBpm } = useMetronomeEngine();

  const { data: purchases } = useQuery<UserPurchase[]>({
    queryKey: ["/api/shop/purchases", user?.id],
    enabled: !!user?.id,
  });

  const { data: shopItems } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/shop/items"],
  });

  const metronomeItem = shopItems?.find(i => i.name === "Pro Metronome");
  const isUnlocked = purchases?.some(p => metronomeItem && p.itemId === metronomeItem.id) ?? false;

  const handleBpmChange = (val: number[]) => {
    const newBpm = val[0];
    setBpm(newBpm);
    if (isPlaying) updateBpm(newBpm);
  };

  const toggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start(bpm);
    }
  };

  if (!isUnlocked) {
    if (mini) {
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-dashed">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Metronome</span>
          <Link href="/shop">
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" data-testid="link-unlock-metronome">
              Unlock
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Pro Metronome — Locked</p>
          <Link href="/shop">
            <Button variant="outline" size="sm" data-testid="link-unlock-metronome-full">
              Unlock in Shop (100 coins)
            </Button>
          </Link>
        </div>
        <CardContent className="p-6 opacity-30 pointer-events-none">
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-5 h-5" />
            <span className="font-semibold">Pro Metronome</span>
          </div>
          <div className="h-12 bg-muted rounded-lg" />
          <div className="mt-4 h-8 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (mini) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border" data-testid="metronome-mini">
        <Button
          size="sm"
          variant={isPlaying ? "destructive" : "default"}
          className="shrink-0 px-2"
          onClick={toggle}
          data-testid="button-metronome-toggle"
        >
          {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        <div
          className={`w-3 h-3 rounded-full shrink-0 transition-all duration-75 ${
            beat ? "bg-primary scale-125" : "bg-muted-foreground/30 scale-100"
          }`}
          data-testid="metronome-beat-indicator"
        />
        <Slider
          value={[bpm]}
          min={60}
          max={180}
          step={1}
          onValueChange={handleBpmChange}
          className="flex-1"
          data-testid="slider-metronome-bpm"
        />
        <span className="text-xs font-mono w-12 text-right tabular-nums" data-testid="text-metronome-bpm">
          {bpm} BPM
        </span>
      </div>
    );
  }

  return (
    <Card data-testid="metronome-full">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <span className="font-semibold">Pro Metronome</span>
          </div>
          <span className="text-2xl font-mono font-bold tabular-nums" data-testid="text-metronome-bpm-large">
            {bpm}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-full border-4 transition-all duration-75 flex items-center justify-center ${
              beat
                ? "border-primary bg-primary/20 scale-110"
                : "border-muted-foreground/20 bg-muted/30 scale-100"
            }`}
            data-testid="metronome-pulse"
          >
            <div
              className={`w-6 h-6 rounded-full transition-all duration-75 ${
                beat ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>60 BPM</span>
            <span>180 BPM</span>
          </div>
          <Slider
            value={[bpm]}
            min={60}
            max={180}
            step={1}
            onValueChange={handleBpmChange}
            data-testid="slider-metronome-bpm-full"
          />
        </div>

        <Button
          onClick={toggle}
          className="w-full"
          variant={isPlaying ? "destructive" : "default"}
          data-testid="button-metronome-toggle-full"
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
