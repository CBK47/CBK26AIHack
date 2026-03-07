import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, GripHorizontal, RotateCcw, Info } from "lucide-react";

interface LineConfig {
  label: string;
  color: string;
  yPercent: number;
}

const DEFAULT_LINES: LineConfig[] = [
  { label: "Ceiling", color: "#a855f7", yPercent: 15 },
  { label: "Forehead", color: "#3b82f6", yPercent: 35 },
  { label: "Chin", color: "#22c55e", yPercent: 50 },
];

export default function HeightChallenge() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lines, setLines] = useState<LineConfig[]>(DEFAULT_LINES);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      setCameraError("Could not access camera. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const handlePointerDown = (index: number) => {
    setDraggingIndex(index);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingIndex === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = Math.max(5, Math.min(95, (y / rect.height) * 100));
    setLines(prev => {
      const next = [...prev];
      next[draggingIndex] = { ...next[draggingIndex], yPercent: percent };
      return next;
    });
  }, [draggingIndex]);

  const handlePointerUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const resetLines = () => setLines(DEFAULT_LINES);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-height-challenge-title">Height Challenge</h1>
        <p className="text-muted-foreground text-sm mt-1">Align yourself with the camera for consistent height tracking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Camera Alignment Tool</CardTitle>
          <CardDescription>
            Position yourself in frame and drag the guide lines to match your chin, forehead, and ceiling throw height
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {!cameraActive ? (
              <Button onClick={startCamera} data-testid="button-start-camera">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopCamera} data-testid="button-stop-camera">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}
            <Button variant="outline" onClick={resetLines} data-testid="button-reset-lines">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Lines
            </Button>
          </div>

          {cameraError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{cameraError}</p>
            </div>
          )}

          <div
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden select-none touch-none"
            style={{ aspectRatio: "4/3" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {cameraActive && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 640 480"
                preserveAspectRatio="none"
              >
                <ellipse
                  cx="320" cy="180" rx="80" ry="100"
                  fill="none"
                  stroke="rgba(168,85,247,0.4)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />
                <path
                  d="M240,280 Q240,220 260,200 Q280,180 320,180 Q360,180 380,200 Q400,220 400,280 L440,380 L200,380 Z"
                  fill="none"
                  stroke="rgba(168,85,247,0.3)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />
              </svg>
            )}

            {cameraActive && lines.map((line, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-center group"
                style={{ top: `${line.yPercent}%`, transform: "translateY(-50%)" }}
              >
                <div
                  className="absolute inset-x-0 border-t-2 border-dashed"
                  style={{ borderColor: line.color }}
                />
                <div
                  className="absolute left-3 px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: line.color }}
                >
                  {line.label}
                </div>
                <div
                  className="absolute right-3 cursor-grab active:cursor-grabbing pointer-events-auto p-1.5 rounded hover:bg-white/20 transition-colors"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handlePointerDown(i);
                  }}
                  data-testid={`handle-line-${line.label.toLowerCase()}`}
                >
                  <GripHorizontal className="w-4 h-4" style={{ color: line.color }} />
                </div>
              </div>
            ))}

            {!cameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                <Camera className="w-12 h-12 mb-3" />
                <p className="text-sm">Click "Start Camera" to begin</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">1</Badge>
              <p>Start the camera and stand at your normal juggling distance from the device.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
              <p>Align your head and shoulders with the dotted silhouette outline.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
              <p>Drag the guide lines to match your chin, forehead, and desired ceiling height for throws.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">4</Badge>
              <p>Use the Ceiling line as your target throw height. Keep your throws below this line for consistent patterns.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
