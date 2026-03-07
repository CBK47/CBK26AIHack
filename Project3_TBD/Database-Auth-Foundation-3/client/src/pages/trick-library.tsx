import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Star, CircleDot, Lightbulb, BookOpen, CheckCircle2, Trophy, Plus, Users, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Trick, UserTrick } from "@shared/schema";

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= level ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function TrickLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [propFilter, setPropFilter] = useState("all");
  const [objectsFilter, setObjectsFilter] = useState("all");
  const [selectedTrick, setSelectedTrick] = useState<Trick | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSiteswap, setNewSiteswap] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("1");
  const [newObjects, setNewObjects] = useState("3");
  const [newDescription, setNewDescription] = useState("");
  const [newTip, setNewTip] = useState("");

  const { data: tricks, isLoading } = useQuery<Trick[]>({
    queryKey: ["/api/tricks"],
  });

  const { data: userTricks } = useQuery<UserTrick[]>({
    queryKey: ["/api/user-tricks", user?.id],
    enabled: !!user?.id,
  });

  const addTrickMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tricks", {
        name: newName.trim(),
        siteswap: newSiteswap.trim() || null,
        difficulty: parseInt(newDifficulty),
        objectsCount: parseInt(newObjects),
        propType: "balls",
        description: newDescription.trim() || null,
        tip: newTip.trim() || null,
        videoUrl: null,
        prerequisites: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tricks"] });
      toast({ title: "Trick Added Successfully!", description: `"${newName}" has been added to the library.` });
      setShowAddForm(false);
      setNewName("");
      setNewSiteswap("");
      setNewDifficulty("1");
      setNewObjects("3");
      setNewDescription("");
      setNewTip("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to add trick", description: err.message, variant: "destructive" });
    },
  });

  const userTrickMap = new Map(
    (userTricks || []).map(ut => [ut.trickId, ut])
  );

  const filtered = tricks?.filter((trick) => {
    const matchesSearch = !search ||
      trick.name.toLowerCase().includes(search.toLowerCase()) ||
      trick.description?.toLowerCase().includes(search.toLowerCase()) ||
      trick.siteswap?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || trick.difficulty === parseInt(difficultyFilter);
    const matchesProp = propFilter === "all" || trick.propType === propFilter;
    const matchesObjects = objectsFilter === "all" || trick.objectsCount === parseInt(objectsFilter);
    return matchesSearch && matchesDifficulty && matchesProp && matchesObjects;
  }) || [];

  const propTypes = [...new Set(tricks?.map((t) => t.propType) || [])];
  const objectCounts = [...new Set(tricks?.map((t) => t.objectsCount) || [])].sort();

  const getPrereqNames = (prereqs: string | null) => {
    if (!prereqs) return [];
    return prereqs.split(",").map((id) => {
      const trick = tricks?.find((t) => t.id === parseInt(id.trim()));
      return trick?.name || `Trick #${id.trim()}`;
    });
  };

  const getMasteryLabel = (score: number) => {
    if (score >= 100) return "Mastered";
    if (score >= 30) return "Apprentice";
    if (score > 0) return "Learning";
    return null;
  };

  const canSubmit = newName.trim().length > 0 && parseInt(newObjects) >= 1;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Trick Library</h1>
          <p className="text-muted-foreground text-sm mt-1">{tricks?.length || 0} tricks available</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} data-testid="button-add-trick">
          <Plus className="w-4 h-4 mr-2" /> Add New Trick
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tricks, siteswaps..."
            className="pl-9"
            data-testid="input-search-tricks"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-difficulty-filter">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="1">Beginner</SelectItem>
            <SelectItem value="2">Easy</SelectItem>
            <SelectItem value="3">Intermediate</SelectItem>
            <SelectItem value="4">Advanced</SelectItem>
            <SelectItem value="5">Expert</SelectItem>
          </SelectContent>
        </Select>
        <Select value={objectsFilter} onValueChange={setObjectsFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-objects-filter">
            <SelectValue placeholder="Objects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counts</SelectItem>
            {objectCounts.map((c) => (
              <SelectItem key={c} value={c.toString()}>{c} {c === 1 ? "Ball" : "Balls"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={propFilter} onValueChange={setPropFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-prop-filter">
            <SelectValue placeholder="Prop Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Props</SelectItem>
            {propTypes.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No tricks found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trick) => {
            const ut = userTrickMap.get(trick.id);
            const masteryScore = ut?.masteryScore || 0;
            const totalCatches = ut?.personalBestCatches || 0;
            const isUnlocked = ut?.isUnlocked || false;
            const masteryLabel = getMasteryLabel(masteryScore);

            return (
              <Card
                key={trick.id}
                className="hover-elevate cursor-pointer transition-colors"
                onClick={() => setSelectedTrick(trick)}
                data-testid={`card-trick-${trick.id}`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{trick.name}</h3>
                        {isUnlocked && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <DifficultyStars level={trick.difficulty} />
                        <span className="text-xs text-muted-foreground">
                          {trick.objectsCount} {trick.propType}
                        </span>
                        {trick.isCustom && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1" data-testid={`badge-custom-${trick.id}`}>
                            <Users className="w-2.5 h-2.5" /> Community
                          </Badge>
                        )}
                      </div>
                    </div>
                    {trick.siteswap && (
                      <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {trick.siteswap}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {trick.description}
                  </p>
                  {trick.tip && (
                    <div className="flex items-start gap-2 text-xs">
                      <Lightbulb className="w-3 h-3 text-chart-4 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground line-clamp-1">{trick.tip}</span>
                    </div>
                  )}

                  {totalCatches > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {totalCatches} / 100 catches
                        </span>
                        {masteryLabel && (
                          <Badge
                            variant={isUnlocked ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isUnlocked && <Trophy className="w-3 h-3 mr-1" />}
                            {masteryLabel}
                          </Badge>
                        )}
                      </div>
                      <Progress value={masteryScore} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedTrick} onOpenChange={() => setSelectedTrick(null)}>
        {selectedTrick && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle data-testid="text-trick-detail-name">
                <div className="flex items-center gap-2">
                  {selectedTrick.name}
                  {userTrickMap.get(selectedTrick.id)?.isUnlocked && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  {selectedTrick.isCustom && (
                    <Badge variant="outline" className="text-xs gap-1 font-normal" data-testid="badge-custom-detail">
                      <Users className="w-3 h-3" /> User Contributed
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <DifficultyStars level={selectedTrick.difficulty} />
                  <span className="text-xs">
                    {selectedTrick.objectsCount} {selectedTrick.propType}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedTrick.siteswap && (
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Siteswap: <span className="font-mono font-medium">{selectedTrick.siteswap}</span></span>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedTrick.description}</p>
              </div>

              {selectedTrick.tip && (
                <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">{selectedTrick.tip}</p>
                  </div>
                </div>
              )}

              {selectedTrick.prerequisites && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                  <div className="flex flex-wrap gap-2">
                    {getPrereqNames(selectedTrick.prerequisites).map((name, i) => (
                      <Badge key={i} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const ut = userTrickMap.get(selectedTrick.id);
                if (!ut) return null;
                const score = ut.masteryScore || 0;
                const catches = ut.personalBestCatches || 0;
                return (
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-sm font-medium">Your Progress</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Catches</span>
                      <span className="font-bold">{catches}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mastery</span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      {catches >= 30 && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Apprentice (30+)
                        </Badge>
                      )}
                      {catches >= 100 && (
                        <Badge>
                          <Trophy className="w-3 h-3 mr-1" />
                          Mastered (100+)
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="text-add-trick-title">Contribute a Trick</DialogTitle>
            <DialogDescription>
              Add your own trick to the community library. It will be tagged as a user contribution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trick-name">Name *</Label>
              <Input
                id="trick-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Behind the Back Cascade"
                data-testid="input-trick-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trick-siteswap">Siteswap</Label>
              <Input
                id="trick-siteswap"
                value={newSiteswap}
                onChange={(e) => setNewSiteswap(e.target.value)}
                placeholder="e.g. 441, 531"
                className="font-mono"
                data-testid="input-trick-siteswap"
              />
              <p className="text-xs text-muted-foreground">Use standard siteswap notation (e.g., 441, 531)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                  <SelectTrigger data-testid="select-trick-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Beginner</SelectItem>
                    <SelectItem value="2">2 - Easy</SelectItem>
                    <SelectItem value="3">3 - Intermediate</SelectItem>
                    <SelectItem value="4">4 - Advanced</SelectItem>
                    <SelectItem value="5">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trick-objects">Objects *</Label>
                <Input
                  id="trick-objects"
                  type="number"
                  min={1}
                  max={12}
                  value={newObjects}
                  onChange={(e) => setNewObjects(e.target.value)}
                  data-testid="input-trick-objects"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trick-description">Description</Label>
              <Textarea
                id="trick-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe how this trick works..."
                rows={3}
                data-testid="input-trick-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trick-tip">Pro Tip</Label>
              <Textarea
                id="trick-tip"
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                placeholder="Any advice for learning this trick?"
                rows={2}
                data-testid="input-trick-tip"
              />
            </div>

            <Button
              className="w-full"
              onClick={() => addTrickMutation.mutate()}
              disabled={!canSubmit || addTrickMutation.isPending}
              data-testid="button-submit-trick"
            >
              {addTrickMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Submit Trick
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
