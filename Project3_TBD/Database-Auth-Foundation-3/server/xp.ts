import { storage } from "./storage";
import { BADGE_CATALOG } from "@shared/badges";

export interface MilestoneEvent {
  type: "apprentice" | "mastered";
  trickName: string;
  trickId: number;
  totalCatches: number;
}

export interface BadgeEvent {
  badgeId: string;
  badgeName: string;
}

export interface XPProcessResult {
  xpEarned: number;
  coinsEarned: number;
  totalXp: number;
  totalCoins: number;
  level: number;
  milestones: MilestoneEvent[];
  newBadges: BadgeEvent[];
}

export async function processSessionXP(
  userId: string,
  trickResults: Array<{
    trickId: number;
    trickName: string;
    catchesActual: number;
    drops: number;
  }>
): Promise<XPProcessResult> {
  let xpEarned = 0;
  const milestones: MilestoneEvent[] = [];

  for (const result of trickResults) {
    const catches = result.catchesActual;
    xpEarned += catches;

    const existing = await storage.getUserTrick(userId, result.trickId);
    const prevCatches = existing?.personalBestCatches || 0;
    const newTotalCatches = prevCatches + catches;
    const newMastery = Math.min(100, Math.floor((newTotalCatches / 100) * 100));
    const wasUnlocked = existing?.isUnlocked || false;

    if (prevCatches < 30 && newTotalCatches >= 30) {
      milestones.push({
        type: "apprentice",
        trickName: result.trickName,
        trickId: result.trickId,
        totalCatches: newTotalCatches,
      });
    }

    if (!wasUnlocked && newTotalCatches >= 100) {
      xpEarned += 100;
      milestones.push({
        type: "mastered",
        trickName: result.trickName,
        trickId: result.trickId,
        totalCatches: newTotalCatches,
      });

      await storage.createAchievement({
        userId,
        badgeName: `Mastered: ${result.trickName}`,
      });
    }

    await storage.upsertUserTrick({
      userId,
      trickId: result.trickId,
      isUnlocked: newTotalCatches >= 100,
      personalBestCatches: newTotalCatches,
      masteryScore: newMastery,
    });
  }

  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  const newTotalXp = (user.xp || 0) + xpEarned;
  const newLevel = Math.floor(newTotalXp / 100) + 1;
  const expectedTotalCoins = Math.floor(newTotalXp / 10);
  const coinsEarned = expectedTotalCoins - (user.coins || 0);
  const newTotalCoins = expectedTotalCoins;

  await storage.updateUser(userId, {
    xp: newTotalXp,
    level: newLevel,
    coins: newTotalCoins,
  });

  const newBadges = await checkAndAwardBadges(userId, newLevel, trickResults);

  return {
    xpEarned,
    coinsEarned,
    totalXp: newTotalXp,
    totalCoins: newTotalCoins,
    level: newLevel,
    milestones,
    newBadges,
  };
}

async function checkAndAwardBadges(
  userId: string,
  newLevel: number,
  trickResults: Array<{ trickId: number; catchesActual: number; drops: number }>
): Promise<BadgeEvent[]> {
  const existingAchievements = await storage.getAchievements(userId);
  const existingNames = new Set(existingAchievements.map(a => a.badgeName));
  const newBadges: BadgeEvent[] = [];

  const awardBadge = async (badgeId: string) => {
    const badge = BADGE_CATALOG.find(b => b.id === badgeId);
    if (!badge) return;
    if (existingNames.has(badge.name)) return;
    await storage.createAchievement({ userId, badgeName: badge.name });
    existingNames.add(badge.name);
    newBadges.push({ badgeId: badge.id, badgeName: badge.name });
  };

  const sessions = await storage.getSessions(userId);
  const totalSessions = sessions.length;
  const userTricks = await storage.getUserTricks(userId);

  if (totalSessions >= 1) await awardBadge("first_session");
  if (totalSessions >= 10) await awardBadge("sessions_10");
  if (totalSessions >= 25) await awardBadge("sessions_25");
  if (totalSessions >= 50) await awardBadge("sessions_50");

  const totalCatchesAll = userTricks.reduce((sum, ut) => sum + (ut.personalBestCatches || 0), 0);
  if (totalCatchesAll >= 100) await awardBadge("first_100_catches");
  if (totalCatchesAll >= 500) await awardBadge("first_500_catches");

  const masteredCount = userTricks.filter(ut => ut.isUnlocked).length;
  if (masteredCount >= 1) await awardBadge("first_mastery");
  if (masteredCount >= 3) await awardBadge("master_3");
  const allTricks = await storage.getTricks();
  if (masteredCount >= allTricks.length && allTricks.length > 0) await awardBadge("master_all");

  const totalDropsInSession = trickResults.reduce((sum, r) => sum + r.drops, 0);
  if (totalDropsInSession === 0 && trickResults.length > 0) await awardBadge("perfect_run");

  if (trickResults.length >= 5) await awardBadge("variety_5");

  const latestSession = sessions[0];
  if (latestSession && (latestSession.durationMinutes || 0) >= 30) await awardBadge("marathon");

  const now = new Date();
  const hour = now.getHours();
  if (hour < 7) await awardBadge("early_bird");
  if (hour >= 22) await awardBadge("night_owl");

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  if (totalMinutes >= 60) await awardBadge("practice_1h");
  if (totalMinutes >= 600) await awardBadge("practice_10h");
  if (totalMinutes >= 3000) await awardBadge("practice_50h");

  if (newLevel >= 5) await awardBadge("level_5");
  if (newLevel >= 10) await awardBadge("level_10");

  const streakDays = calculateStreak(sessions.map(s => new Date(s.createdAt)));
  if (streakDays >= 3) await awardBadge("streak_3");
  if (streakDays >= 7) await awardBadge("streak_7");
  if (streakDays >= 30) await awardBadge("streak_30");

  await storage.updateUser(userId, { currentStreak: streakDays });

  return newBadges;
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = new Set(
    dates.map(d => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    })
  );

  const sortedDays = [...uniqueDays].sort((a, b) => b - a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const oneDayMs = 86400000;

  if (sortedDays[0] !== todayTime && sortedDays[0] !== todayTime - oneDayMs) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i - 1] - sortedDays[i] === oneDayMs) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
