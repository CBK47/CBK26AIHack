import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Request, Response, NextFunction } from "express";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hash, salt] = stored.split(".");
  if (!hash || !salt) return false;
  try {
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedBuf = Buffer.from(hash, "hex");
    if (buf.length !== storedBuf.length) return false;
    return timingSafeEqual(buf, storedBuf);
  } catch {
    return false;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Extend express-session typings
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
