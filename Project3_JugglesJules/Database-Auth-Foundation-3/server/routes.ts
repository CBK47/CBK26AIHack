import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertTrickSchema, insertSessionSchema, insertSessionTrickSchema, insertGameResultSchema, insertTrainingGoalSchema, insertFriendshipSchema, insertChallengeSchema, insertForumPostSchema, insertForumCommentSchema } from "@shared/schema";
import { z } from "zod";
import { processSessionXP } from "./xp";
import { jsPDF } from "jspdf";
import { hashPassword, verifyPassword, requireAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/tricks", async (_req, res) => {
    const allTricks = await storage.getTricks();
    res.json(allTricks);
  });

  app.get("/api/tricks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid trick ID" });
    const trick = await storage.getTrick(id);
    if (!trick) return res.status(404).json({ message: "Trick not found" });
    res.json(trick);
  });

  app.get("/api/tricks/filter/difficulty/:level", async (req, res) => {
    const level = parseInt(req.params.level);
    if (isNaN(level) || level < 1 || level > 5) return res.status(400).json({ message: "Difficulty must be 1-5" });
    const filtered = await storage.getTricksByDifficulty(level);
    res.json(filtered);
  });

  app.get("/api/tricks/filter/prop/:propType", async (req, res) => {
    const filtered = await storage.getTricksByPropType(req.params.propType);
    res.json(filtered);
  });

  app.post("/api/tricks", requireAuth, async (req, res) => {
    const schema = insertTrickSchema.extend({
      name: z.string().min(1, "Name is required"),
      objectsCount: z.number().min(1, "Objects count must be at least 1"),
      difficulty: z.number().min(1).max(5),
    });
    const parsed = schema.safeParse({ ...req.body, isCustom: true });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const trick = await storage.createTrick(parsed.data);
    res.status(201).json(trick);
  });

  app.post("/api/sessions", requireAuth, async (req, res) => {
    const parsed = insertSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid session data", errors: parsed.error.flatten() });
    const session = await storage.createSession(parsed.data);
    res.status(201).json(session);
  });

  app.get("/api/sessions/:userId", requireAuth, async (req, res) => {
    const sessions = await storage.getSessions(req.params.userId);
    res.json(sessions);
  });

  app.get("/api/session/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid session ID" });
    const session = await storage.getSession(id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  });

  app.patch("/api/session/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid session ID" });
    const existing = await storage.getSession(id);
    if (!existing) return res.status(404).json({ message: "Session not found" });
    if (existing.userId !== req.session.userId) return res.status(403).json({ message: "Forbidden" });
    const updated = await storage.updateSession(id, req.body);
    res.json(updated);
  });

  app.post("/api/session-tricks", requireAuth, async (req, res) => {
    const parsed = insertSessionTrickSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const st = await storage.createSessionTrick(parsed.data);
    res.status(201).json(st);
  });

  app.get("/api/session-tricks/:sessionId", requireAuth, async (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) return res.status(400).json({ message: "Invalid session ID" });
    const sessionTricks = await storage.getSessionTricks(sessionId);
    res.json(sessionTricks);
  });

  app.patch("/api/session-tricks/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateSessionTrick(id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.get("/api/user-tricks/:userId", requireAuth, async (req, res) => {
    const userTricks = await storage.getUserTricks(req.params.userId);
    res.json(userTricks);
  });

  app.post("/api/user-tricks", requireAuth, async (req, res) => {
    const ut = await storage.upsertUserTrick(req.body);
    res.json(ut);
  });

  app.get("/api/achievements/:userId", requireAuth, async (req, res) => {
    const achievements = await storage.getAchievements(req.params.userId);
    res.json(achievements);
  });

  app.post("/api/achievements", requireAuth, async (req, res) => {
    const achievement = await storage.createAchievement(req.body);
    res.status(201).json(achievement);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) return res.status(409).json({ message: "Username already taken" });
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) return res.status(409).json({ message: "Email already in use" });
    const hashed = await hashPassword(password);
    const user = await storage.createUser({ username, email, password: hashed });
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/user/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/user/:id", requireAuth, async (req, res) => {
    if (req.session.userId !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Prevent privilege escalation via body
    const { password: _p, id: _id, ...safeBody } = req.body;
    const user = await storage.updateUser(req.params.id, safeBody);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/session/process-xp", requireAuth, async (req, res) => {
    const { userId, trickResults } = req.body;
    if (!userId || !trickResults || !Array.isArray(trickResults)) {
      return res.status(400).json({ message: "userId and trickResults array are required" });
    }
    try {
      const result = await processSessionXP(userId, trickResults);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/reports/weekly/:userId", requireAuth, async (req, res) => {
    try {
      const userId = req.params.userId;
      const sessions = await storage.getSessions(userId);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weeklySessions = sessions.filter(s => new Date(s.createdAt) >= sevenDaysAgo);

      const totalTime = weeklySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const totalDrops = weeklySessions.reduce((sum, s) => sum + s.totalDrops, 0);
      const sessionCount = weeklySessions.length;

      const moodCounts: Record<string, number> = {};
      weeklySessions.forEach(s => {
        const mood = s.moodRating || "Unrated";
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });

      let bestTrickRuns: Array<{ trickName: string; catches: number }> = [];
      for (const session of weeklySessions) {
        const sTricks = await storage.getSessionTricks(session.id);
        for (const st of sTricks) {
          const trick = await storage.getTrick(st.trickId);
          if (trick) {
            bestTrickRuns.push({
              trickName: trick.name,
              catches: st.catchesActual || 0,
            });
          }
        }
      }
      bestTrickRuns.sort((a, b) => b.catches - a.catches);
      bestTrickRuns = bestTrickRuns.slice(0, 5);

      const doc = new jsPDF();
      const purple = [107, 33, 168];

      doc.setFillColor(purple[0], purple[1], purple[2]);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Just Juggle", 15, 18);
      doc.setFontSize(11);
      doc.text("Weekly Progress Report", 15, 27);
      const dateRange = `${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
      doc.text(dateRange, 195, 27, { align: "right" });

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.text(`Player: ${user.username}  |  Level ${user.level}  |  ${user.xp} XP  |  ${user.coins || 0} Coins`, 15, 45);

      let y = 58;
      doc.setFillColor(245, 245, 250);
      doc.rect(12, y - 5, 186, 32, "F");
      doc.setFontSize(12);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text("Weekly Summary", 15, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Sessions Completed: ${sessionCount}`, 15, y);
      doc.text(`Total Practice Time: ${Math.floor(totalTime / 60)}h ${totalTime % 60}m`, 105, y);
      y += 8;
      doc.text(`Total Drops: ${totalDrops}`, 15, y);
      doc.text(`Avg Drops/Session: ${sessionCount > 0 ? Math.round(totalDrops / sessionCount) : 0}`, 105, y);

      y += 18;
      doc.setFontSize(12);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text("Top Trick Performances", 15, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (bestTrickRuns.length > 0) {
        for (const run of bestTrickRuns) {
          doc.text(`${run.trickName}: ${run.catches} catches`, 20, y);
          y += 7;
        }
      } else {
        doc.text("No trick data recorded this week", 20, y);
        y += 7;
      }

      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text("Mood Distribution", 15, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (Object.keys(moodCounts).length > 0) {
        for (const [mood, count] of Object.entries(moodCounts)) {
          doc.text(`${mood}: ${count} session${count > 1 ? "s" : ""}`, 20, y);
          y += 7;
        }
      } else {
        doc.text("No mood data recorded", 20, y);
        y += 7;
      }

      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text("Daily Breakdown", 15, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const dayMap: Record<string, { sessions: number; minutes: number; drops: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        dayMap[key] = { sessions: 0, minutes: 0, drops: 0 };
      }

      weeklySessions.forEach(s => {
        const d = new Date(s.createdAt);
        const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        if (dayMap[key]) {
          dayMap[key].sessions++;
          dayMap[key].minutes += s.durationMinutes || 0;
          dayMap[key].drops += s.totalDrops;
        }
      });

      for (const [day, data] of Object.entries(dayMap)) {
        if (data.sessions > 0) {
          doc.text(`${day}: ${data.sessions} session(s), ${data.minutes}min, ${data.drops} drops`, 20, y);
        } else {
          doc.setTextColor(160, 160, 160);
          doc.text(`${day}: Rest day`, 20, y);
          doc.setTextColor(60, 60, 60);
        }
        y += 7;
      }

      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text("Generated by Just Juggle", 105, 285, { align: "center" });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="just-juggle-weekly-${new Date().toISOString().split("T")[0]}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/game-results", requireAuth, async (req, res) => {
    const parsed = insertGameResultSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const result = await storage.createGameResult(parsed.data);
    res.status(201).json(result);
  });

  app.get("/api/game-results/:userId", requireAuth, async (req, res) => {
    const gameType = req.query.gameType as string | undefined;
    const results = await storage.getGameResults(req.params.userId, gameType);
    res.json(results);
  });

  app.get("/api/game-results/:userId/best", requireAuth, async (req, res) => {
    const results = await storage.getGameResultsBest(req.params.userId);
    const bestMap: Record<string, number> = {};
    for (const r of results) {
      bestMap[r.gameType] = r.score;
    }
    res.json(bestMap);
  });

  app.post("/api/training-goals", requireAuth, async (req, res) => {
    const parsed = insertTrainingGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const goal = await storage.createTrainingGoal(parsed.data);
    res.status(201).json(goal);
  });

  app.get("/api/training-goals/:userId", requireAuth, async (req, res) => {
    const goals = await storage.getTrainingGoals(req.params.userId);
    res.json(goals);
  });

  app.patch("/api/training-goals/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const goals = await storage.getTrainingGoals(req.session.userId!);
    if (!goals.some(g => g.id === id)) return res.status(403).json({ message: "Forbidden" });
    const goal = await storage.updateTrainingGoal(id, req.body);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  });

  app.delete("/api/training-goals/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const goals = await storage.getTrainingGoals(req.session.userId!);
    if (!goals.some(g => g.id === id)) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteTrainingGoal(id);
    res.status(204).send();
  });

  app.post("/api/training/generate", requireAuth, async (req, res) => {
    const { duration, energyLevel, focusPoint, userId } = req.body;
    const allTricks = await storage.getTricks();
    let userTricksData: any[] = [];
    if (userId) {
      userTricksData = await storage.getUserTricks(userId);
    }

    let filteredTricks = [...allTricks];

    if (energyLevel === "Low" || energyLevel === "Just want to chill") {
      filteredTricks = filteredTricks.filter(t => t.difficulty <= 2);
    } else if (energyLevel === "Moderate") {
      filteredTricks = filteredTricks.filter(t => t.difficulty <= 3);
    }

    if (focusPoint === "New Trick Learning") {
      const unlockedIds = new Set(userTricksData.filter(ut => ut.isUnlocked).map(ut => ut.trickId));
      const newTricks = filteredTricks.filter(t => !unlockedIds.has(t.id));
      if (newTricks.length > 0) filteredTricks = newTricks;
    } else if (focusPoint === "Technique Refinement") {
      filteredTricks = filteredTricks.filter(t => t.difficulty <= 3);
    } else if (focusPoint === "Endurance Building") {
      filteredTricks = filteredTricks.filter(t => t.difficulty <= 2);
    }

    const minutesPerTrick = 3;
    const numTricks = Math.min(Math.ceil((duration || 15) / minutesPerTrick), filteredTricks.length);

    const shuffled = filteredTricks.sort(() => Math.random() - 0.5);
    const selectedTricks = shuffled.slice(0, numTricks);

    const trainingSet = selectedTricks.map(trick => {
      let catches = 30;
      if (trick.difficulty >= 4) catches = 10;
      else if (trick.difficulty === 3) catches = 20;
      else if (trick.difficulty === 2) catches = 25;

      if (focusPoint === "Endurance Building") catches *= 2;

      return {
        trick,
        catchesGoal: catches,
      };
    });

    res.json({ trainingSet, duration, energyLevel, focusPoint });
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    const q = req.query.q as string;
    const excludeId = req.query.excludeId as string | undefined;
    if (!q || q.length < 2) return res.json([]);
    const results = await storage.searchUsers(q, excludeId);
    res.json(results.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      level: u.level,
      totalXp: u.totalXp,
      currentStreak: u.currentStreak,
    })));
  });

  app.get("/api/friends/:userId", requireAuth, async (req, res) => {
    const friendshipList = await storage.getFriendships(req.params.userId);
    res.json(friendshipList);
  });

  app.post("/api/friends", requireAuth, async (req, res) => {
    const parsed = insertFriendshipSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const existing = await storage.getFriendships(parsed.data.requesterId);
    const alreadyExists = existing.some(f =>
      (f.requesterId === parsed.data.requesterId && f.receiverId === parsed.data.receiverId) ||
      (f.requesterId === parsed.data.receiverId && f.receiverId === parsed.data.requesterId)
    );
    if (alreadyExists) return res.status(409).json({ message: "Friendship already exists or pending" });
    const friendship = await storage.createFriendship(parsed.data);
    res.status(201).json(friendship);
  });

  app.patch("/api/friends/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateFriendship(id, req.body);
    if (!updated) return res.status(404).json({ message: "Friendship not found" });
    res.json(updated);
  });

  app.delete("/api/friends/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteFriendship(id);
    res.status(204).send();
  });

  app.get("/api/challenges/:userId", requireAuth, async (req, res) => {
    const challengeList = await storage.getChallenges(req.params.userId);
    res.json(challengeList);
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    const parsed = insertChallengeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const challenge = await storage.createChallenge(parsed.data);
    res.status(201).json(challenge);
  });

  app.patch("/api/challenges/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateChallenge(id, req.body);
    if (!updated) return res.status(404).json({ message: "Challenge not found" });
    res.json(updated);
  });

  app.get("/api/forum/posts", requireAuth, async (req, res) => {
    const category = req.query.category as string | undefined;
    const posts = await storage.getForumPosts(category);
    res.json(posts);
  });

  app.get("/api/forum/posts/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const post = await storage.getForumPost(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/forum/posts", requireAuth, async (req, res) => {
    const parsed = insertForumPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const post = await storage.createForumPost(parsed.data);
    res.status(201).json(post);
  });

  app.delete("/api/forum/posts/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const post = await storage.getForumPost(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.userId !== req.session.userId) return res.status(403).json({ message: "Not authorized" });
    await storage.deleteForumPost(id);
    res.status(204).send();
  });

  app.get("/api/forum/posts/:postId/comments", requireAuth, async (req, res) => {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) return res.status(400).json({ message: "Invalid post ID" });
    const comments = await storage.getForumComments(postId);
    res.json(comments);
  });

  app.post("/api/forum/comments", requireAuth, async (req, res) => {
    const parsed = insertForumCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const comment = await storage.createForumComment(parsed.data);
    res.status(201).json(comment);
  });

  app.delete("/api/forum/comments/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const comment = await storage.getForumComment(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== req.session.userId) return res.status(403).json({ message: "Not authorized" });
    await storage.deleteForumComment(id);
    res.status(204).send();
  });

  app.get("/api/leaderboard/:gameType", requireAuth, async (req, res) => {
    const results = await storage.getLeaderboard(req.params.gameType);
    const userIds = [...new Set(results.map(r => r.userId))];
    const userMap: Record<string, any> = {};
    for (const uid of userIds) {
      const u = await storage.getUser(uid);
      if (u) {
        const { password: _, ...safe } = u;
        userMap[uid] = safe;
      }
    }
    res.json(results.map(r => ({ ...r, user: userMap[r.userId] })));
  });

  app.get("/api/shop/items", requireAuth, async (_req, res) => {
    const items = await storage.getShopItems();
    res.json(items);
  });

  app.get("/api/shop/purchases/:userId", requireAuth, async (req, res) => {
    const purchases = await storage.getUserPurchases(req.params.userId);
    res.json(purchases);
  });

  app.post("/api/shop/buy", requireAuth, async (req, res) => {
    const { userId, itemId } = req.body;
    if (!userId || !itemId) return res.status(400).json({ message: "userId and itemId required" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const items = await storage.getShopItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const alreadyOwned = await storage.hasPurchased(userId, itemId);
    if (alreadyOwned) return res.status(400).json({ message: "Already owned" });

    if (item.requirement) {
      const match = item.requirement.match(/Level (\d+)/);
      if (match && user.level < parseInt(match[1])) {
        return res.status(400).json({ message: `Requires ${item.requirement}` });
      }
    }

    if (user.coins < item.price) {
      return res.status(400).json({ message: "Not enough coins" });
    }

    const newCoins = user.coins - item.price;
    await storage.updateUser(userId, { coins: newCoins });
    const purchase = await storage.createPurchase(userId, itemId);

    if (item.type === "trick" && item.data) {
      try {
        const trickData = JSON.parse(item.data);
        const existingTrick = (await storage.getTricks()).find(t => t.name === item.name);
        if (!existingTrick) {
          const allTricks = await storage.getTricks();
          const prereqIds = (trickData.prereqNames || [])
            .map((name: string) => allTricks.find(t => t.name === name)?.id)
            .filter(Boolean);
          await storage.createTrick({
            name: item.name,
            description: item.description || "",
            siteswap: trickData.siteswap || "3",
            difficulty: trickData.difficulty || 4,
            objectsCount: trickData.objectsCount || 3,
            propType: trickData.propType || "balls",
            tip: trickData.tip || "",
            videoUrl: null,
            prerequisites: prereqIds.length > 0 ? prereqIds.join(",") : null,
          });
        }
      } catch (e) {
        console.error("Failed to create trick from shop item:", e);
      }
    }

    const updatedUser = await storage.getUser(userId);
    const { password: _, ...safeUser } = updatedUser!;
    res.json({ purchase, user: safeUser });
  });

  return httpServer;
}
