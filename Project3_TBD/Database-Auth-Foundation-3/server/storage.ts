import { eq, and, desc, or, ilike, ne } from "drizzle-orm";
import { db } from "./db";
import {
  users, tricks, sessions, sessionTricks, userTricks, achievements, gameResults, trainingGoals,
  friendships, challenges, forumPosts, forumComments, shopItems, userPurchases,
  type User, type InsertUser,
  type Trick, type InsertTrick,
  type Session, type InsertSession,
  type SessionTrick, type InsertSessionTrick,
  type UserTrick, type InsertUserTrick,
  type Achievement, type InsertAchievement,
  type GameResult, type InsertGameResult,
  type TrainingGoal, type InsertTrainingGoal,
  type Friendship, type InsertFriendship,
  type Challenge, type InsertChallenge,
  type ForumPost, type InsertForumPost,
  type ForumComment, type InsertForumComment,
  type ShopItem, type InsertShopItem,
  type UserPurchase,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getTricks(): Promise<Trick[]>;
  getTrick(id: number): Promise<Trick | undefined>;
  createTrick(trick: InsertTrick): Promise<Trick>;
  getTricksByDifficulty(difficulty: number): Promise<Trick[]>;
  getTricksByPropType(propType: string): Promise<Trick[]>;

  getSessions(userId: string): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<Session>): Promise<Session | undefined>;

  getSessionTricks(sessionId: number): Promise<SessionTrick[]>;
  createSessionTrick(st: InsertSessionTrick): Promise<SessionTrick>;
  updateSessionTrick(id: number, data: Partial<SessionTrick>): Promise<SessionTrick | undefined>;

  getUserTricks(userId: string): Promise<UserTrick[]>;
  getUserTrick(userId: string, trickId: number): Promise<UserTrick | undefined>;
  upsertUserTrick(ut: InsertUserTrick & Partial<UserTrick>): Promise<UserTrick>;

  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(a: InsertAchievement): Promise<Achievement>;

  createGameResult(gr: InsertGameResult): Promise<GameResult>;
  getGameResults(userId: string, gameType?: string): Promise<GameResult[]>;
  getGameResultsBest(userId: string): Promise<GameResult[]>;

  createTrainingGoal(goal: InsertTrainingGoal): Promise<TrainingGoal>;
  getTrainingGoals(userId: string): Promise<TrainingGoal[]>;
  updateTrainingGoal(id: number, data: Partial<TrainingGoal>): Promise<TrainingGoal | undefined>;
  deleteTrainingGoal(id: number): Promise<void>;

  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
  getFriendships(userId: string): Promise<Friendship[]>;
  createFriendship(data: InsertFriendship): Promise<Friendship>;
  updateFriendship(id: number, data: Partial<Friendship>): Promise<Friendship | undefined>;
  deleteFriendship(id: number): Promise<void>;

  getChallenges(userId: string): Promise<Challenge[]>;
  createChallenge(data: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: number, data: Partial<Challenge>): Promise<Challenge | undefined>;

  getForumPosts(category?: string): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(data: InsertForumPost): Promise<ForumPost>;
  deleteForumPost(id: number): Promise<void>;
  getForumComments(postId: number): Promise<ForumComment[]>;
  createForumComment(data: InsertForumComment): Promise<ForumComment>;
  getForumComment(id: number): Promise<ForumComment | undefined>;
  deleteForumComment(id: number): Promise<void>;

  getLeaderboard(gameType: string): Promise<GameResult[]>;

  getShopItems(): Promise<ShopItem[]>;
  getUserPurchases(userId: string): Promise<UserPurchase[]>;
  createPurchase(userId: string, itemId: number): Promise<UserPurchase>;
  hasPurchased(userId: string, itemId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getTricks(): Promise<Trick[]> {
    return db.select().from(tricks);
  }

  async getTrick(id: number): Promise<Trick | undefined> {
    const [trick] = await db.select().from(tricks).where(eq(tricks.id, id));
    return trick;
  }

  async createTrick(trick: InsertTrick): Promise<Trick> {
    const [created] = await db.insert(tricks).values(trick).returning();
    return created;
  }

  async getTricksByDifficulty(difficulty: number): Promise<Trick[]> {
    return db.select().from(tricks).where(eq(tricks.difficulty, difficulty));
  }

  async getTricksByPropType(propType: string): Promise<Trick[]> {
    return db.select().from(tricks).where(eq(tricks.propType, propType));
  }

  async getSessions(userId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db.update(sessions).set(data).where(eq(sessions.id, id)).returning();
    return session;
  }

  async getSessionTricks(sessionId: number): Promise<SessionTrick[]> {
    return db.select().from(sessionTricks).where(eq(sessionTricks.sessionId, sessionId));
  }

  async createSessionTrick(st: InsertSessionTrick): Promise<SessionTrick> {
    const [created] = await db.insert(sessionTricks).values(st).returning();
    return created;
  }

  async updateSessionTrick(id: number, data: Partial<SessionTrick>): Promise<SessionTrick | undefined> {
    const [updated] = await db.update(sessionTricks).set(data).where(eq(sessionTricks.id, id)).returning();
    return updated;
  }

  async getUserTricks(userId: string): Promise<UserTrick[]> {
    return db.select().from(userTricks).where(eq(userTricks.userId, userId));
  }

  async getUserTrick(userId: string, trickId: number): Promise<UserTrick | undefined> {
    const [ut] = await db.select().from(userTricks)
      .where(and(eq(userTricks.userId, userId), eq(userTricks.trickId, trickId)));
    return ut;
  }

  async upsertUserTrick(ut: InsertUserTrick & Partial<UserTrick>): Promise<UserTrick> {
    const existing = await this.getUserTrick(ut.userId, ut.trickId);
    if (existing) {
      const [updated] = await db.update(userTricks)
        .set(ut)
        .where(and(eq(userTricks.userId, ut.userId), eq(userTricks.trickId, ut.trickId)))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userTricks).values(ut).returning();
    return created;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(a: InsertAchievement): Promise<Achievement> {
    const [created] = await db.insert(achievements).values(a).returning();
    return created;
  }

  async createGameResult(gr: InsertGameResult): Promise<GameResult> {
    const [created] = await db.insert(gameResults).values(gr).returning();
    return created;
  }

  async getGameResults(userId: string, gameType?: string): Promise<GameResult[]> {
    if (gameType) {
      return db.select().from(gameResults)
        .where(and(eq(gameResults.userId, userId), eq(gameResults.gameType, gameType)))
        .orderBy(desc(gameResults.createdAt));
    }
    return db.select().from(gameResults)
      .where(eq(gameResults.userId, userId))
      .orderBy(desc(gameResults.createdAt));
  }

  async getGameResultsBest(userId: string): Promise<GameResult[]> {
    const all = await db.select().from(gameResults)
      .where(eq(gameResults.userId, userId))
      .orderBy(desc(gameResults.score));
    const bestByType: Record<string, GameResult> = {};
    for (const r of all) {
      if (!bestByType[r.gameType] || r.score > bestByType[r.gameType].score) {
        bestByType[r.gameType] = r;
      }
    }
    return Object.values(bestByType);
  }

  async createTrainingGoal(goal: InsertTrainingGoal): Promise<TrainingGoal> {
    const [created] = await db.insert(trainingGoals).values(goal).returning();
    return created;
  }

  async getTrainingGoals(userId: string): Promise<TrainingGoal[]> {
    return db.select().from(trainingGoals)
      .where(eq(trainingGoals.userId, userId))
      .orderBy(desc(trainingGoals.createdAt));
  }

  async updateTrainingGoal(id: number, data: Partial<TrainingGoal>): Promise<TrainingGoal | undefined> {
    const [updated] = await db.update(trainingGoals).set(data)
      .where(eq(trainingGoals.id, id)).returning();
    return updated;
  }

  async deleteTrainingGoal(id: number): Promise<void> {
    await db.delete(trainingGoals).where(eq(trainingGoals.id, id));
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    const results = await db.select().from(users)
      .where(ilike(users.username, `%${query}%`))
      .limit(20);
    if (excludeUserId) {
      return results.filter(u => u.id !== excludeUserId);
    }
    return results;
  }

  async getFriendships(userId: string): Promise<Friendship[]> {
    return db.select().from(friendships)
      .where(or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)))
      .orderBy(desc(friendships.createdAt));
  }

  async createFriendship(data: InsertFriendship): Promise<Friendship> {
    const [created] = await db.insert(friendships).values(data).returning();
    return created;
  }

  async updateFriendship(id: number, data: Partial<Friendship>): Promise<Friendship | undefined> {
    const [updated] = await db.update(friendships).set(data)
      .where(eq(friendships.id, id)).returning();
    return updated;
  }

  async deleteFriendship(id: number): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  async getChallenges(userId: string): Promise<Challenge[]> {
    return db.select().from(challenges)
      .where(or(eq(challenges.senderId, userId), eq(challenges.receiverId, userId)))
      .orderBy(desc(challenges.createdAt));
  }

  async createChallenge(data: InsertChallenge): Promise<Challenge> {
    const [created] = await db.insert(challenges).values(data).returning();
    return created;
  }

  async updateChallenge(id: number, data: Partial<Challenge>): Promise<Challenge | undefined> {
    const [updated] = await db.update(challenges).set(data)
      .where(eq(challenges.id, id)).returning();
    return updated;
  }

  async getForumPosts(category?: string): Promise<ForumPost[]> {
    if (category && category !== "all") {
      return db.select().from(forumPosts)
        .where(eq(forumPosts.category, category))
        .orderBy(desc(forumPosts.createdAt));
    }
    return db.select().from(forumPosts).orderBy(desc(forumPosts.createdAt));
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(data: InsertForumPost): Promise<ForumPost> {
    const [created] = await db.insert(forumPosts).values(data).returning();
    return created;
  }

  async deleteForumPost(id: number): Promise<void> {
    await db.delete(forumComments).where(eq(forumComments.postId, id));
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async getForumComments(postId: number): Promise<ForumComment[]> {
    return db.select().from(forumComments)
      .where(eq(forumComments.postId, postId))
      .orderBy(forumComments.createdAt);
  }

  async createForumComment(data: InsertForumComment): Promise<ForumComment> {
    const [created] = await db.insert(forumComments).values(data).returning();
    return created;
  }

  async getForumComment(id: number): Promise<ForumComment | undefined> {
    const rows = await db.select().from(forumComments).where(eq(forumComments.id, id));
    return rows[0];
  }

  async deleteForumComment(id: number): Promise<void> {
    await db.delete(forumComments).where(eq(forumComments.id, id));
  }

  async getLeaderboard(gameType: string): Promise<GameResult[]> {
    return db.select().from(gameResults)
      .where(eq(gameResults.gameType, gameType))
      .orderBy(desc(gameResults.score))
      .limit(50);
  }

  async getShopItems(): Promise<ShopItem[]> {
    return db.select().from(shopItems);
  }

  async getUserPurchases(userId: string): Promise<UserPurchase[]> {
    return db.select().from(userPurchases).where(eq(userPurchases.userId, userId));
  }

  async createPurchase(userId: string, itemId: number): Promise<UserPurchase> {
    const [purchase] = await db.insert(userPurchases).values({ userId, itemId }).returning();
    return purchase;
  }

  async hasPurchased(userId: string, itemId: number): Promise<boolean> {
    const rows = await db.select().from(userPurchases)
      .where(and(eq(userPurchases.userId, userId), eq(userPurchases.itemId, itemId)));
    return rows.length > 0;
  }
}

export const storage = new DatabaseStorage();
