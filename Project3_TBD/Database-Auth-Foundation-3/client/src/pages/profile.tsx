import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Palette, Target, Bell, Check, Trash2, Plus, Save, Crown, Clock } from "lucide-react";
import { requestNotificationPermission, scheduleReminder } from "@/lib/notifications";
import type { TrainingGoal } from "@shared/schema";

const THEMES = [
  { name: "Purple", hue: 262 },
  { name: "Blue", hue: 217 },
  { name: "Green", hue: 142 },
  { name: "Orange", hue: 25 },
  { name: "Rose", hue: 346 },
  { name: "Teal", hue: 174 },
] as const;

export function applyTheme(themeName: string) {
  const theme = THEMES.find((t) => t.name.toLowerCase() === themeName.toLowerCase());
  if (!theme) return;
  const hue = theme.hue;
  const lightVal = `${hue} 80% 50%`;
  const darkVal = `${hue} 80% 60%`;
  const isDark = document.documentElement.classList.contains("dark");
  const val = isDark ? darkVal : lightVal;
  document.documentElement.style.setProperty("--primary", val);
  document.documentElement.style.setProperty("--ring", val);
  document.documentElement.style.setProperty("--sidebar-primary", val);
  document.documentElement.style.setProperty("--sidebar-ring", val);
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [preferredStyle, setPreferredStyle] = useState(user?.preferredStyle || "");
  const [skillLevel, setSkillLevel] = useState(user?.skillLevel || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeTheme, setActiveTheme] = useState(user?.preferredTheme || "Purple");

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || "18:00");
  const [reminderMessage, setReminderMessage] = useState(user?.reminderMessage || "Time to juggle!");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  );

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  const { data: goals, isLoading: goalsLoading } = useQuery<TrainingGoal[]>({
    queryKey: ["/api/training-goals", user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user?.preferredTheme) {
      applyTheme(user.preferredTheme);
      setActiveTheme(user.preferredTheme);
    }
  }, [user?.preferredTheme]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const res = await apiRequest("PATCH", `/api/user/${user.id}`, {
        displayName,
        preferredStyle,
        skillLevel,
      });
      const updated = await res.json();
      setUser({ ...user, ...updated });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleThemeSelect = async (themeName: string) => {
    if (!user?.id) return;
    setActiveTheme(themeName);
    applyTheme(themeName);
    try {
      const res = await apiRequest("PATCH", `/api/user/${user.id}`, {
        preferredTheme: themeName,
      });
      const updated = await res.json();
      setUser({ ...user, ...updated });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGoal = async () => {
    if (!user?.id || !goalTitle.trim()) return;
    setAddingGoal(true);
    try {
      await apiRequest("POST", "/api/training-goals", {
        userId: user.id,
        title: goalTitle.trim(),
        description: goalDescription.trim() || null,
        targetDate: goalTargetDate ? new Date(goalTargetDate).toISOString() : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/training-goals", user.id] });
      setGoalTitle("");
      setGoalDescription("");
      setGoalTargetDate("");
      setShowGoalForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingGoal(false);
    }
  };

  const handleToggleGoal = async (goal: TrainingGoal) => {
    if (!user?.id) return;
    try {
      await apiRequest("PATCH", `/api/training-goals/${goal.id}`, {
        isCompleted: !goal.isCompleted,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/training-goals", user.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!user?.id) return;
    try {
      await apiRequest("DELETE", `/api/training-goals/${goalId}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/training-goals", user.id] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;
    setSavingNotifications(true);
    try {
      const res = await apiRequest("PATCH", `/api/user/${user.id}`, {
        notificationsEnabled,
        reminderTime: notificationsEnabled ? reminderTime : null,
        reminderMessage: notificationsEnabled ? reminderMessage : null,
      });
      const updated = await res.json();
      setUser({ ...user, ...updated });
      if (notificationsEnabled && reminderTime) {
        scheduleReminder(reminderTime, reminderMessage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotifications(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary" data-testid="text-avatar-initial">
            {(user.displayName || user.username)?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-profile-username">
            {user.username}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary" data-testid="text-profile-level">
              <Crown className="w-3 h-3 mr-1" />
              Level {user.level || 1}
            </Badge>
            <Badge variant="outline" data-testid="text-profile-xp">{user.xp || 0} XP</Badge>
            <Badge variant="outline" data-testid="text-profile-coins">{user.coins || 0} Coins</Badge>
            <Badge variant="outline" data-testid="text-profile-streak">{user.currentStreak || 0} Day Streak</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              data-testid="input-display-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredStyle">Preferred Style</Label>
            <Select value={preferredStyle} onValueChange={setPreferredStyle}>
              <SelectTrigger data-testid="select-preferred-style">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Balls">Balls</SelectItem>
                <SelectItem value="Clubs">Clubs</SelectItem>
                <SelectItem value="Rings">Rings</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skillLevel">Skill Level</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger data-testid="select-skill-level">
                <SelectValue placeholder="Select skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            data-testid="button-save-profile"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Color Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {THEMES.map((theme) => {
              const isActive = activeTheme.toLowerCase() === theme.name.toLowerCase();
              return (
                <button
                  key={theme.name}
                  onClick={() => handleThemeSelect(theme.name)}
                  className="flex flex-col items-center gap-2 group"
                  data-testid={`button-theme-${theme.name.toLowerCase()}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                    }`}
                    style={{ backgroundColor: `hsl(${theme.hue}, 80%, 50%)` }}
                  >
                    {isActive && <Check className="w-5 h-5 text-white" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Training Goals</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGoalForm(!showGoalForm)}
            data-testid="button-add-goal"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showGoalForm && (
            <div className="rounded-md bg-muted/50 p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="goalTitle">Title</Label>
                <Input
                  id="goalTitle"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Goal title"
                  data-testid="input-goal-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalDescription">Description (optional)</Label>
                <Input
                  id="goalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Goal description"
                  data-testid="input-goal-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalTargetDate">Target Date (optional)</Label>
                <Input
                  id="goalTargetDate"
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  data-testid="input-goal-target-date"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddGoal}
                  disabled={addingGoal || !goalTitle.trim()}
                  data-testid="button-submit-goal"
                >
                  {addingGoal ? "Adding..." : "Add"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowGoalForm(false)}
                  data-testid="button-cancel-goal"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {goalsLoading ? (
            <p className="text-sm text-muted-foreground">Loading goals...</p>
          ) : goals && goals.length > 0 ? (
            goals.map((goal) => (
              <div
                key={goal.id}
                className={`flex items-start gap-3 rounded-md bg-muted/50 p-3 ${
                  goal.isCompleted ? "opacity-60" : ""
                }`}
                data-testid={`card-goal-${goal.id}`}
              >
                <button
                  onClick={() => handleToggleGoal(goal)}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    goal.isCompleted
                      ? "bg-primary border-primary"
                      : "border-input"
                  }`}
                  data-testid={`checkbox-goal-${goal.id}`}
                >
                  {goal.isCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${goal.isCompleted ? "line-through" : ""}`}
                    data-testid={`text-goal-title-${goal.id}`}
                  >
                    {goal.title}
                  </p>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                  )}
                  {goal.targetDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteGoal(goal.id)}
                  data-testid={`button-delete-goal-${goal.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Target className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No training goals yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifPermission !== "granted" && (
            <div className="rounded-md bg-muted/50 border p-3 space-y-2">
              <p className="text-sm text-muted-foreground">Enable browser notifications to receive daily reminders.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setNotifPermission(perm);
                }}
                data-testid="button-enable-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          )}
          {notifPermission === "granted" && (
            <div className="rounded-md bg-primary/5 border border-primary/20 p-2">
              <p className="text-xs text-primary flex items-center gap-1"><Check className="w-3 h-3" /> Notifications enabled</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Daily Reminders</Label>
              <p className="text-xs text-muted-foreground">Get reminded to practice every day</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              data-testid="switch-daily-reminders"
            />
          </div>
          {notificationsEnabled && (
            <div className="space-y-3 pl-1">
              <div className="space-y-1">
                <Label className="text-sm flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Reminder Time
                </Label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-40"
                  data-testid="input-reminder-time"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Custom Message</Label>
                <Input
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="Time to juggle!"
                  data-testid="input-reminder-message"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Weekly Progress Reports</Label>
              <p className="text-xs text-muted-foreground">Receive a weekly summary of your progress</p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
              data-testid="switch-weekly-reports"
            />
          </div>
          <Button
            onClick={handleSaveNotifications}
            disabled={savingNotifications}
            data-testid="button-save-notifications"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingNotifications ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
