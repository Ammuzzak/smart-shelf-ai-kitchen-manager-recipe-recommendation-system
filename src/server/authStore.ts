import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const USER_DATA_DIR = path.join(DATA_DIR, 'userdata');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserKitchenData {
  inventory: any[];
  wasteRecords: any[];
  shoppingItems: any[];
  chefHistory: any[];
  preferences: Record<string, any>;
}

// Ensure data storage directories and files exist
export function initAuthStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USER_DATA_DIR)) {
      fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}), 'utf8');
    }
  } catch (err) {
    console.error('Failed to initialize auth store:', err);
  }
}

// Read all users
function readUsers(): StoredUser[] {
  initAuthStore();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

// Write users
function writeUsers(users: StoredUser[]): void {
  initAuthStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Read sessions
function readSessions(): Record<string, { userId: string; expiresAt: number; createdAt: number }> {
  initAuthStore();
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// Write sessions
function writeSessions(sessions: Record<string, { userId: string; expiresAt: number; createdAt: number }>): void {
  initAuthStore();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

// Cryptographic password hashing using scrypt (memory-hard, resistant to GPU attacks)
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Verify password with timing-safe comparison
function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const actualHash = hashPassword(password, salt);
    const actualBuf = Buffer.from(actualHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    if (actualBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

// Sign up new user
export function signUpUser(name: string, email: string, password: string): { token: string; user: PublicUser } {
  const trimmedName = (name || '').trim();
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!trimmedName) {
    const err: any = new Error('Name is required.');
    err.status = 400;
    throw err;
  }

  if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    const err: any = new Error('A valid email address is required.');
    err.status = 400;
    throw err;
  }

  if (!password || password.length < 6) {
    const err: any = new Error('Password must be at least 6 characters.');
    err.status = 400;
    throw err;
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    const err: any = new Error('An account with this email already exists. Please sign in instead.');
    err.status = 409;
    throw err;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const createdAt = new Date().toISOString();

  const newUser: StoredUser = {
    id: userId,
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt,
  };

  users.push(newUser);
  writeUsers(users);

  // Initialize completely clean and isolated user dataset
  const initialData: UserKitchenData = {
    inventory: [],
    wasteRecords: [],
    shoppingItems: [],
    chefHistory: [],
    preferences: {
      cuisine: 'South Indian',
      diet: 'Flexible',
      theme: 'dark',
    },
  };
  saveUserData(userId, initialData);

  // Issue session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readSessions();
  sessions[token] = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  writeSessions(sessions);

  return {
    token,
    user: {
      id: userId,
      name: trimmedName,
      email: normalizedEmail,
      createdAt,
    },
  };
}

// Log in existing user
export function loginUser(email: string, password: string): { token: string; user: PublicUser } {
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (!normalizedEmail || !password) {
    const err: any = new Error('Email and password are required.');
    err.status = 400;
    throw err;
  }

  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    const err: any = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    const err: any = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  // Issue session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readSessions();
  sessions[token] = {
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  writeSessions(sessions);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

// Log out user
export function logoutUser(token: string): boolean {
  if (!token) return true;
  const sessions = readSessions();
  if (sessions[token]) {
    delete sessions[token];
    writeSessions(sessions);
  }
  return true;
}

// Get user profile from session token
export function getUserByToken(token: string): PublicUser | null {
  if (!token) return null;
  const sessions = readSessions();
  const session = sessions[token];
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    delete sessions[token];
    writeSessions(sessions);
    return null;
  }

  const users = readUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// Get user-specific isolated data
export function getUserData(userId: string): UserKitchenData {
  initAuthStore();
  const userFile = path.join(USER_DATA_DIR, `${userId}.json`);
  if (!fs.existsSync(userFile)) {
    const initialData: UserKitchenData = {
      inventory: [],
      wasteRecords: [],
      shoppingItems: [],
      chefHistory: [],
      preferences: {
        cuisine: 'South Indian',
        diet: 'Flexible',
        theme: 'dark',
      },
    };
    fs.writeFileSync(userFile, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(userFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read data for user ${userId}:`, err);
    return {
      inventory: [],
      wasteRecords: [],
      shoppingItems: [],
      chefHistory: [],
      preferences: {},
    };
  }
}

// Save user-specific isolated data
export function saveUserData(userId: string, data: Partial<UserKitchenData>): void {
  initAuthStore();
  const userFile = path.join(USER_DATA_DIR, `${userId}.json`);
  let existing: UserKitchenData;
  try {
    if (fs.existsSync(userFile)) {
      existing = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    } else {
      existing = {
        inventory: [],
        wasteRecords: [],
        shoppingItems: [],
        chefHistory: [],
        preferences: {},
      };
    }
  } catch {
    existing = {
      inventory: [],
      wasteRecords: [],
      shoppingItems: [],
      chefHistory: [],
      preferences: {},
    };
  }

  const updated: UserKitchenData = {
    inventory: data.inventory !== undefined ? data.inventory : existing.inventory,
    wasteRecords: data.wasteRecords !== undefined ? data.wasteRecords : existing.wasteRecords,
    shoppingItems: data.shoppingItems !== undefined ? data.shoppingItems : existing.shoppingItems,
    chefHistory: data.chefHistory !== undefined ? data.chefHistory : existing.chefHistory,
    preferences: data.preferences !== undefined ? data.preferences : existing.preferences,
  };

  fs.writeFileSync(userFile, JSON.stringify(updated, null, 2), 'utf8');
}
