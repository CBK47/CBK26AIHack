import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Star, CheckCircle2, Circle, TrendingUp, Trophy, Award, Flame, Target, Sparkles, Clock, Crown, Gem, Sunrise, Moon, Timer, Dumbbell, Zap, Medal, Play, Shuffle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { Trick, UserTrick, Achievement } from "@shared/schema";
import { BADGE_CATALOG } from "@shared/badges";

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

const BADGE_ICON_MAP: Record<string, any> = {
  play: Play,
  target: Target,
  zap: Zap,
  dumbbell: Dumbbell,
  award: Award,
  medal: Medal,
  timer: Timer,
  sparkles: Sparkles,
  shuffle: Shuffle,
  sunrise: Sunrise,
  moon: Moon,
  flame: Flame,
  crown: Crown,
  star: Star,
  trophy: Trophy,
  "check-circle": CheckCircle,
  gem: Gem,
  clock: Clock,
  hourglass: Timer,
};

export default function ProgressionPage() {
  const { user } = useAuth();

  const { data: tricks, isLoading: tricksLoading } = useQuery<Trick[]>({
    queryKey: ["/api/tricks"],
  });

  const { data: userTricks, isLoading: utLoading } = useQuery<UserTrick[]>({
    queryKey: ["/api/user-tricks", user?.id],
    enabled: !!user?.id,
  });

  const { data: achievements, isLoading: achLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user?.id,
  });

  const isLoading = tricksLoading || utLoading || achLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  const userTrickMap = new Map(
    (userTricks || []).map(ut => [ut.trickId, ut])
  );

  const earnedBadgeNames = new Set((achievements || []).map(a => a.badgeName));

  const sortedTricks = [...(tricks || [])].sort((a, b) => a.difficulty - b.difficulty);

  const difficultyGroups = sortedTricks.reduce((acc, trick) => {
    const key = trick.difficulty;
    if (!acc[key]) acc[key] = [];
    acc[key].push(trick);
    return acc;
  }, {} as Record<number, Trick[]>);

  const difficultyLabels: Record<number, string> = {
    1: "Beginner",
    2: "Easy",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
  };

  const unlockedCount = (userTricks || []).filter(ut => ut.isUnlocked).length;
  const totalTricks = tricks?.length || 0;
  const overallProgress = totalTricks > 0 ? (unlockedCount / totalTricks) * 100 : 0;

  const getPrereqNames = (prereqs: string | null) => {
    if (!prereqs) return [];
    return prereqs.split(",").map((id) => {
      const trick = tricks?.find((t) => t.id === parseInt(id.trim()));
      return trick?.name || `Trick #${id.trim()}`;
    });
  };

  const arePrereqsMet = (trick: Trick) => {
    if (!trick.prerequisites) return true;
    const prereqIds = trick.prerequisites.split(",").map(id => parseInt(id.trim()));
    return prereqIds.every(id => userTrickMap.get(id)?.isUnlocked);
  };

  const badgeCategories = [
    { key: "session", label: "Session Badges" },
    { key: "skill", label: "Skill Badges" },
    { key: "streak", label: "Streak Badges" },
    { key: "special", label: "Special Badges" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-progression-title">Trick Progression</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your mastery journey</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-sm">Overall Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unlockedCount} of {totalTricks} tricks unlocked
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {Math.round(overallProgress)}%
            </Badge>
          </div>
          <Progress value={overallProgress} className="h-2" data-testid="progress-overall" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-chart-4" />
            Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {badgeCategories.map(cat => {
            const badges = BADGE_CATALOG.filter(b => b.category === cat.key);
            if (badges.length === 0) return null;
            return (
              <div key={cat.key}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {badges.map(badge => {
                    const earned = earnedBadgeNames.has(badge.name);
                    const IconComp = BADGE_ICON_MAP[badge.icon] || Trophy;
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          earned ? "bg-primary/5 border-primary/20" : "opacity-50"
                        }`}
                        data-testid={`badge-${badge.id}`}
                      >
                        <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 ${
                          earned ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <IconComp className={`w-5 h-5 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`text-xs font-medium ${earned ? "" : "text-muted-foreground"}`}>{badge.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                        {earned && (
                          <Badge variant="secondary" className="text-xs mt-1.5">Earned</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {(() => {
            const masteryBadges = (achievements || []).filter(a => a.badgeName.startsWith("Mastered:"));
            if (masteryBadges.length === 0) return null;
            return (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Mastery Achievements</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {masteryBadges.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg border p-3 text-center bg-primary/5 border-primary/20"
                      data-testid={`badge-mastery-${a.id}`}
                    >
                      <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 bg-primary/10">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium">{a.badgeName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.unlockedAt).toLocaleDateString()}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1.5">Earned</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {Object.entries(difficultyGroups).map(([difficulty, tricksList]) => {
        const level = parseInt(difficulty);
        const unlockedInGroup = tricksList.filter(t => userTrickMap.get(t.id)?.isUnlocked).length;
        const groupProgress = (unlockedInGroup / tricksList.length) * 100;

        return (
          <div key={difficulty} className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-base">{difficultyLabels[level] || `Level ${level}`}</h2>
                <DifficultyStars level={level} />
                <Badge variant="outline" className="text-xs">
                  {unlockedInGroup}/{tricksList.length}
                </Badge>
              </div>
              <div className="w-32">
                <Progress value={groupProgress} className="h-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tricksList.map((trick) => {
                const ut = userTrickMap.get(trick.id);
                const isUnlocked = ut?.isUnlocked || false;
                const masteryScore = ut?.masteryScore || 0;
                const personalBest = ut?.personalBestCatches || 0;
                const prereqsMet = arePrereqsMet(trick);

                return (
                  <Card
                    key={trick.id}
                    className={`hover-elevate transition-colors ${
                      isUnlocked ? "" : "opacity-75"
                    }`}
                    data-testid={`card-progression-${trick.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isUnlocked ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {isUnlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : prereqsMet ? (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-sm">{trick.name}</h3>
                            {trick.siteswap && (
                              <Badge variant="outline" className="text-xs font-mono shrink-0">
                                {trick.siteswap}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{trick.description}</p>

                          {personalBest > 0 && (
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Mastery</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Progress value={masteryScore} className="h-1 w-16" />
                                  <span className="text-xs font-medium">{masteryScore}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Catches</p>
                                <p className="text-xs font-medium">{personalBest}</p>
                              </div>
                            </div>
                          )}

                          {!isUnlocked && trick.prerequisites && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">Requires:</span>
                              {getPrereqNames(trick.prerequisites).map((name, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {totalTricks === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No tricks available</h3>
            <p className="text-sm text-muted-foreground">The trick library is being set up.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
