import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, X, Play, Square, SkipForward, Volume2 } from "lucide-react";
import type { Trick } from "@shared/schema";

interface SequenceStep {
  trick: Trick;
  catches: number;
  notes: string;
}

export default function SequenceBuilder() {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [selectedTrickId, setSelectedTrickId] = useState<string>("");
  const [catches, setCatches] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);

  const { data: tricks } = useQuery<Trick[]>({
    queryKey: ["/api/tricks"],
  });

  const addStep = () => {
    if (!selectedTrickId || !tricks) return;
    const trick = tricks.find(t => t.id === parseInt(selectedTrickId));
    if (!trick) return;
    setSteps([...steps, { trick, catches, notes: "" }]);
    setSelectedTrickId("");
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const newSteps = [...steps];
    const [item] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, item);
    setSteps(newSteps);
  };

  const updateStepCatches = (index: number, value: number) => {
    const newSteps = [...steps];
    newSteps[index].catches = value;
    setSteps(newSteps);
  };

  const updateStepNotes = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].notes = value;
    setSteps(newSteps);
  };

  const startPlayback = () => {
    if (steps.length === 0) return;
    setIsPlaying(true);
    setCurrentStep(0);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `${steps[0].trick.name}, ${steps[0].catches} catches`
      );
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          clearInterval(interval);
          setIsPlaying(false);
          return 0;
        }
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            `${steps[next].trick.name}, ${steps[next].catches} catches`
          );
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }
        return next;
      });
    }, 8000);

    setPlayInterval(interval);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playInterval) clearInterval(playInterval);
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  const skipStep = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `${steps[next].trick.name}, ${steps[next].catches} catches`
        );
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    } else {
      stopPlayback();
    }
  };

  const totalCatches = steps.reduce((sum, s) => sum + s.catches, 0);
  const estimatedMinutes = Math.ceil(steps.length * 2.5);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-sequences-title">Sequence Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">Create custom training routines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Trick to Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={selectedTrickId} onValueChange={setSelectedTrickId}>
              <SelectTrigger className="flex-1 min-w-[200px]" data-testid="select-add-trick">
                <SelectValue placeholder="Choose a trick..." />
              </SelectTrigger>
              <SelectContent>
                {tricks?.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name} ({t.objectsCount} {t.propType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={catches}
              onChange={(e) => setCatches(parseInt(e.target.value) || 10)}
              className="w-24"
              min={1}
              max={200}
              placeholder="Catches"
              data-testid="input-catches"
            />
            <Button onClick={addStep} disabled={!selectedTrickId} data-testid="button-add-step">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{steps.length} tricks</Badge>
              <Badge variant="outline">{totalCatches} catches</Badge>
              <Badge variant="outline">~{estimatedMinutes} min</Badge>
            </div>
            <div className="flex gap-2">
              {isPlaying ? (
                <>
                  <Button variant="outline" size="sm" onClick={skipStep} data-testid="button-skip">
                    <SkipForward className="w-4 h-4 mr-1" /> Skip
                  </Button>
                  <Button variant="destructive" size="sm" onClick={stopPlayback} data-testid="button-stop">
                    <Square className="w-4 h-4 mr-1" /> Stop
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={startPlayback} data-testid="button-play">
                  <Play className="w-4 h-4 mr-1" /> Play Sequence
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <Card
                key={index}
                className={`transition-colors ${isPlaying && index === currentStep ? "ring-2 ring-primary" : ""}`}
                data-testid={`card-step-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => moveStep(index, index - 1)}
                        disabled={index === 0}
                      >
                        <span className="text-xs">^</span>
                      </Button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => moveStep(index, index + 1)}
                        disabled={index === steps.length - 1}
                      >
                        <span className="text-xs rotate-180">^</span>
                      </Button>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{step.trick.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {step.trick.objectsCount} {step.trick.propType}
                        </Badge>
                        {isPlaying && index === currentStep && (
                          <Badge className="text-xs">
                            <Volume2 className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        )}
                      </div>
                      <Input
                        value={step.notes}
                        onChange={(e) => updateStepNotes(index, e.target.value)}
                        placeholder="Add notes..."
                        className="h-7 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={step.catches}
                        onChange={(e) => updateStepCatches(index, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">catches</span>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                      data-testid={`button-remove-step-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {steps.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Build Your Sequence</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add tricks from the library to create a custom training routine. You can reorder, set catch goals, and play the sequence with audio cues.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
