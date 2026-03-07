import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingDown, Clock, Flame, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@shared/schema";

export default function StatsPage() {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const totalSessions = sessions?.length || 0;
  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) || 0;
  const totalDrops = sessions?.reduce((sum, s) => sum + s.totalDrops, 0) || 0;
  const avgDropsPerSession = totalSessions > 0 ? Math.round(totalDrops / totalSessions) : 0;

  const dropsOverTime = (sessions || [])
    .slice(0, 20)
    .reverse()
    .map((s, i) => ({
      session: `#${i + 1}`,
      drops: s.totalDrops,
      duration: s.durationMinutes || 0,
    }));

  const moodDistribution = (sessions || []).reduce((acc, s) => {
    const mood = s.moodRating || "Unrated";
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodData = Object.entries(moodDistribution).map(([name, value]) => ({ name, value }));

  const focusDistribution = (sessions || []).reduce((acc, s) => {
    const focus = s.focusPoint || "Unspecified";
    acc[focus] = (acc[focus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const focusData = Object.entries(focusDistribution).map(([name, value]) => ({ name, value }));

  const COLORS = [
    "hsl(262, 70%, 55%)",
    "hsl(280, 65%, 60%)",
    "hsl(200, 70%, 55%)",
    "hsl(45, 85%, 55%)",
    "hsl(340, 75%, 55%)",
  ];

  const weeklyData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekMap: Record<string, number> = {};
    days.forEach(d => weekMap[d] = 0);
    (sessions || []).forEach(s => {
      const day = days[new Date(s.createdAt).getDay()];
      weekMap[day] += (s.durationMinutes || 0);
    });
    return days.map(d => ({ day: d, minutes: weekMap[d] }));
  })();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-stats-title">Statistics</h1>
          <p className="text-muted-foreground text-sm mt-1">Your juggling journey in numbers</p>
        </div>
        {totalSessions > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/api/reports/weekly/${user?.id}`, "_blank");
            }}
            data-testid="button-download-pdf"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Weekly Report PDF
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Sessions</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-stat-sessions">{totalSessions}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Practice Time</p>
                <p className="text-2xl font-bold mt-1">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</p>
              </div>
              <Clock className="w-5 h-5 text-chart-3" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Drops</p>
                <p className="text-2xl font-bold mt-1">{totalDrops}</p>
              </div>
              <TrendingDown className="w-5 h-5 text-chart-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Drops/Session</p>
                <p className="text-2xl font-bold mt-1">{avgDropsPerSession}</p>
              </div>
              <Flame className="w-5 h-5 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {totalSessions === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No data yet</h3>
            <p className="text-sm text-muted-foreground">Complete your first training session to see your stats here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Drops Over Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dropsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="session" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Line type="monotone" dataKey="drops" stroke="hsl(262, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Practice by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value} min`, "Practice Time"]}
                      />
                      <Bar dataKey="minutes" fill="hsl(200, 70%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Mood Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {moodData.length > 0 ? (
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={moodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {moodData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No mood data yet</p>
                )}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {moodData.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{m.name} ({m.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Focus Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-2">
                  {focusData.map((f, i) => (
                    <div key={f.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate">{f.name}</span>
                        <span className="font-medium">{f.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(f.value / totalSessions) * 100}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(sessions || []).slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground min-w-[70px]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.focusPoint || "General"}</p>
                        <p className="text-xs text-muted-foreground">{s.durationMinutes}min - {s.energyLevel} energy</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.totalDrops === 0 ? "default" : "secondary"}>
                        {s.totalDrops} drops
                      </Badge>
                      {s.moodRating && (
                        <Badge variant="outline">{s.moodRating}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
