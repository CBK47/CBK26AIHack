import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Dumbbell, Trophy, Flame, Clock, Target, Zap, ArrowRight, Star, BookOpen, BarChart3, TrendingUp, Coins } from "lucide-react";
import type { Session, Achievement, UserTrick, Trick } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions", user?.id],
    enabled: !!user?.id,
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements", user?.id],
    enabled: !!user?.id,
  });

  const { data: userTricks } = useQuery<UserTrick[]>({
    queryKey: ["/api/user-tricks", user?.id],
    enabled: !!user?.id,
  });

  const { data: tricks } = useQuery<Trick[]>({
    queryKey: ["/api/tricks"],
  });

  const recentSession = sessions?.[0];
  const totalPracticeTime = sessions?.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) || 0;
  const totalSessions = sessions?.length || 0;
  const unlockedCount = userTricks?.filter(ut => ut.isUnlocked).length || 0;
  const totalTricks = tricks?.length || 0;
  const xpProgress = user ? ((user.xp % 100) / 100) * 100 : 0;

  if (sessionsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back, {user?.username}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ready for your next practice session?
          </p>
        </div>
        <Link href="/training">
          <Button size="lg" data-testid="button-start-training">
            <Dumbbell className="w-4 h-4 mr-2" />
            Start Training
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Sessions</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-sessions">{totalSessions}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Practice Time</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-practice-time">{totalPracticeTime}m</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-chart-3/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-streak">{user?.currentStreak || 0} days</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-chart-4/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tricks Learned</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-tricks-learned">{unlockedCount}/{totalTricks}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-chart-5/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Level Progress</CardTitle>
            <Badge variant="secondary">Level {user?.level || 1}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">{user?.xp || 0} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" data-testid="progress-xp" />
              <p className="text-xs text-muted-foreground">{100 - (user?.xp || 0) % 100} XP until next level</p>
            </div>

            <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <div className="w-8 h-8 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-chart-4" />
              </div>
              <div>
                <p className="text-sm font-medium" data-testid="text-coins">{user?.coins || 0} Coins</p>
                <p className="text-xs text-muted-foreground">Earn 1 coin per 10 XP</p>
              </div>
            </div>

            {recentSession ? (
              <div className="rounded-md bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium">Last Session</p>
                  <Badge variant="outline" className="text-xs">
                    {new Date(recentSession.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{recentSession.durationMinutes || 0}m</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{recentSession.totalDrops}</p>
                    <p className="text-xs text-muted-foreground">Drops</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold capitalize">{recentSession.moodRating || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Mood</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md bg-muted/50 p-6 text-center">
                <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No sessions yet. Start your first training!</p>
                <Link href="/training">
                  <Button variant="secondary" size="sm" className="mt-3" data-testid="button-first-training">
                    Begin Training <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Achievements</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`text-achievement-${a.id}`}>{a.badgeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No achievements yet</p>
                <p className="text-xs text-muted-foreground mt-1">Complete training sessions to earn badges</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/training">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="button-quick-train">
                <Dumbbell className="w-5 h-5" />
                <span className="text-xs">Quick Train</span>
              </Button>
            </Link>
            <Link href="/tricks">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="button-quick-tricks">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">Browse Tricks</span>
              </Button>
            </Link>
            <Link href="/stats">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="button-quick-stats">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">View Stats</span>
              </Button>
            </Link>
            <Link href="/progression">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="button-quick-progression">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">Progression</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-gradient-to-br from-primary/10 to-primary/5 p-5 space-y-3">
              <h3 className="font-semibold text-sm">Suggested Session</h3>
              <p className="text-sm text-muted-foreground">
                {totalSessions === 0
                  ? "Start with the basics - a 15 minute cascade practice session will set a great foundation."
                  : totalSessions < 5
                    ? "Keep building your foundation. Try a 20-minute session focusing on technique refinement."
                    : "You're building momentum! Try a 30-minute variety session to expand your repertoire."
                }
              </p>
              <div className="pt-2">
                <Link href="/training">
                  <Button size="sm" data-testid="button-suggested-session">
                    Start Suggested Session <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
