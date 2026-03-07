import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, serial, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  coins: integer("coins").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  preferredTheme: text("preferred_theme").default("dark").notNull(),
  displayName: text("display_name"),
  preferredStyle: text("preferred_style"),
  skillLevel: text("skill_level"),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  reminderTime: text("reminder_time"),
  reminderMessage: text("reminder_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tricks = pgTable("tricks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  siteswap: text("siteswap"),
  difficulty: integer("difficulty").notNull(),
  objectsCount: integer("objects_count").notNull(),
  propType: text("prop_type").notNull().default("balls"),
  videoUrl: text("video_url"),
  tip: text("tip"),
  prerequisites: text("prerequisites"),
  isCustom: boolean("is_custom").default(false).notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  durationMinutes: integer("duration_minutes"),
  energyLevel: text("energy_level"),
  focusPoint: text("focus_point"),
  totalDrops: integer("total_drops").default(0).notNull(),
  moodRating: text("mood_rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionTricks = pgTable("session_tricks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  trickId: integer("trick_id").references(() => tricks.id).notNull(),
  catchesGoal: integer("catches_goal"),
  catchesActual: integer("catches_actual"),
  drops: integer("drops").default(0).notNull(),
});

export const userTricks = pgTable("user_tricks", {
  userId: text("user_id").references(() => users.id).notNull(),
  trickId: integer("trick_id").references(() => tricks.id).notNull(),
  isUnlocked: boolean("is_unlocked").default(false).notNull(),
  personalBestCatches: integer("personal_best_catches").default(0).notNull(),
  masteryScore: integer("mastery_score").default(0).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.trickId] }),
]);

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  badgeName: text("badge_name").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  xp: true,
  level: true,
  currentStreak: true,
  preferredTheme: true,
});

export const insertTrickSchema = createInsertSchema(tricks).omit({
  id: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  totalDrops: true,
});

export const insertSessionTrickSchema = createInsertSchema(sessionTricks).omit({
  id: true,
});

export const insertUserTrickSchema = createInsertSchema(userTricks).omit({
  isUnlocked: true,
  personalBestCatches: true,
  masteryScore: true,
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  gameType: text("game_type").notNull(),
  score: integer("score").default(0).notNull(),
  timeSeconds: integer("time_seconds").default(0).notNull(),
  drops: integer("drops").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingGoals = pgTable("training_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  gameType: text("game_type").notNull(),
  targetScore: integer("target_score").default(0).notNull(),
  senderScore: integer("sender_score"),
  receiverScore: integer("receiver_score"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  requirement: text("requirement"),
  data: text("data"),
});

export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  itemId: integer("item_id").references(() => shopItems.id).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true,
});
export const insertUserPurchaseSchema = createInsertSchema(userPurchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertGameResultSchema = createInsertSchema(gameResults).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingGoalSchema = createInsertSchema(trainingGoals).omit({
  id: true,
  createdAt: true,
  isCompleted: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Trick = typeof tricks.$inferSelect;
export type InsertTrick = z.infer<typeof insertTrickSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SessionTrick = typeof sessionTricks.$inferSelect;
export type InsertSessionTrick = z.infer<typeof insertSessionTrickSchema>;
export type UserTrick = typeof userTricks.$inferSelect;
export type InsertUserTrick = z.infer<typeof insertUserTrickSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type TrainingGoal = typeof trainingGoals.$inferSelect;
export type InsertTrainingGoal = z.infer<typeof insertTrainingGoalSchema>;

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  status: true,
});
export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  senderScore: true,
  receiverScore: true,
  status: true,
});
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
});
export const insertForumCommentSchema = createInsertSchema(forumComments).omit({
  id: true,
  createdAt: true,
});

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = z.infer<typeof insertUserPurchaseSchema>;
