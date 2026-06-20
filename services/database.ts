import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

import { seedCategories, seedPhrases } from "@/constants/seedData";
import type { Category, CategoryInput, ExportPayload, HistoryItem, Phrase, PhraseInput } from "@/types";

const DATABASE_NAME = "speakeasy.db";
const SEED_FLAG = "speakeasy.seeded.v1";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializedPromise: Promise<void> | null = null;

type CategoryRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  sort_order: number | null;
  is_default: number | null;
  created_at: string;
};

type PhraseRow = {
  id: string;
  text: string;
  label: string | null;
  emoji: string | null;
  color: string | null;
  category_id: string | null;
  voice_id: string | null;
  language: string | null;
  is_pinned: number | null;
  is_quick_access: number | null;
  sort_order: number | null;
  is_default: number | null;
  created_at: string;
};

type HistoryRow = {
  id: string;
  text: string;
  spoken_at: string;
};

const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  sort_order INTEGER,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phrases (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  label TEXT,
  emoji TEXT,
  color TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  voice_id TEXT,
  language TEXT,
  is_pinned INTEGER DEFAULT 0,
  is_quick_access INTEGER DEFAULT 0,
  sort_order INTEGER,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  spoken_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_phrases_category_sort ON phrases(category_id, is_pinned, sort_order);
CREATE INDEX IF NOT EXISTS idx_phrases_quick ON phrases(is_quick_access, sort_order);
CREATE INDEX IF NOT EXISTS idx_history_spoken ON history(spoken_at DESC);
`;

const nowIso = () => new Date().toISOString();

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const boolToInt = (value?: boolean | null) => (value ? 1 : 0);

const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const mapCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  color: row.color,
  sortOrder: row.sort_order ?? 0,
  isDefault: row.is_default === 1,
  createdAt: row.created_at
});

const mapPhrase = (row: PhraseRow): Phrase => ({
  id: row.id,
  text: row.text,
  label: row.label,
  emoji: row.emoji,
  color: row.color,
  categoryId: row.category_id,
  voiceId: row.voice_id,
  language: row.language,
  isPinned: row.is_pinned === 1,
  isQuickAccess: row.is_quick_access === 1,
  sortOrder: row.sort_order ?? 0,
  isDefault: row.is_default === 1,
  createdAt: row.created_at
});

const mapHistory = (row: HistoryRow): HistoryItem => ({
  id: row.id,
  text: row.text,
  spokenAt: row.spoken_at
});

const getDatabaseConnection = async () => {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
};

const runTransaction = async <T>(db: SQLite.SQLiteDatabase, work: () => Promise<T>) => {
  await db.execAsync("BEGIN TRANSACTION");
  try {
    const result = await work();
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
};

const seedDefaults = async (db: SQLite.SQLiteDatabase) => {
  const seeded = await AsyncStorage.getItem(SEED_FLAG);
  if (seeded) {
    return;
  }

  const createdAt = nowIso();
  await runTransaction(db, async () => {
    for (const category of seedCategories) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories
          (id, name, emoji, color, sort_order, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.emoji,
          category.color,
          category.sortOrder,
          boolToInt(category.isDefault),
          createdAt
        ]
      );
    }

    for (const phrase of seedPhrases) {
      await db.runAsync(
        `INSERT OR IGNORE INTO phrases
          (id, text, label, emoji, color, category_id, voice_id, language, is_pinned,
           is_quick_access, sort_order, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          phrase.id,
          phrase.text,
          phrase.label,
          phrase.emoji,
          phrase.color,
          phrase.categoryId,
          phrase.voiceId,
          phrase.language,
          boolToInt(phrase.isPinned),
          boolToInt(phrase.isQuickAccess),
          phrase.sortOrder,
          boolToInt(phrase.isDefault),
          createdAt
        ]
      );
    }
  });

  await AsyncStorage.setItem(SEED_FLAG, createdAt);
};

export const initializeDatabase = async () => {
  const db = await getDatabaseConnection();
  initializedPromise ??= (async () => {
    await db.execAsync(schemaSql);
    await seedDefaults(db);
  })();
  await initializedPromise;
  return db;
};

export const fetchCategories = async () => {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    "SELECT * FROM categories ORDER BY sort_order ASC, name COLLATE NOCASE ASC"
  );
  return rows.map(mapCategory);
};

export const fetchPhrases = async () => {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<PhraseRow>(
    `SELECT * FROM phrases
     ORDER BY is_pinned DESC, sort_order ASC, created_at ASC`
  );
  return rows.map(mapPhrase);
};

export const fetchHistory = async () => {
  const db = await initializeDatabase();
  const rows = await db.getAllAsync<HistoryRow>(
    "SELECT * FROM history ORDER BY spoken_at DESC LIMIT 20"
  );
  return rows.map(mapHistory);
};

const nextPhraseSortOrder = async (db: SQLite.SQLiteDatabase, categoryId: string | null) => {
  const row = categoryId
    ? await db.getFirstAsync<{ next_sort: number | null }>(
        "SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort FROM phrases WHERE category_id = ?",
        [categoryId]
      )
    : await db.getFirstAsync<{ next_sort: number | null }>(
        "SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort FROM phrases WHERE category_id IS NULL"
      );

  return row?.next_sort ?? 0;
};

const nextCategorySortOrder = async (db: SQLite.SQLiteDatabase) => {
  const row = await db.getFirstAsync<{ next_sort: number | null }>(
    "SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort FROM categories"
  );
  return row?.next_sort ?? 0;
};

export const createPhrase = async (input: PhraseInput) => {
  const db = await initializeDatabase();
  const categoryId = input.categoryId ?? null;
  const id = makeId("phrase");
  const sortOrder = input.sortOrder ?? (await nextPhraseSortOrder(db, categoryId));

  await db.runAsync(
    `INSERT INTO phrases
      (id, text, label, emoji, color, category_id, voice_id, language, is_pinned,
       is_quick_access, sort_order, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.text.trim(),
      clean(input.label),
      clean(input.emoji),
      clean(input.color),
      categoryId,
      clean(input.voiceId),
      clean(input.language),
      boolToInt(input.isPinned),
      boolToInt(input.isQuickAccess),
      sortOrder,
      boolToInt(input.isDefault),
      nowIso()
    ]
  );

  return id;
};

export const updatePhrase = async (id: string, input: PhraseInput) => {
  const db = await initializeDatabase();
  await db.runAsync(
    `UPDATE phrases
     SET text = ?,
         label = ?,
         emoji = ?,
         color = ?,
         category_id = ?,
         voice_id = ?,
         language = ?,
         is_pinned = ?,
         is_quick_access = ?,
         sort_order = COALESCE(?, sort_order)
     WHERE id = ?`,
    [
      input.text.trim(),
      clean(input.label),
      clean(input.emoji),
      clean(input.color),
      input.categoryId ?? null,
      clean(input.voiceId),
      clean(input.language),
      boolToInt(input.isPinned),
      boolToInt(input.isQuickAccess),
      input.sortOrder ?? null,
      id
    ]
  );
};

export const deletePhrase = async (id: string) => {
  const db = await initializeDatabase();
  await db.runAsync("DELETE FROM phrases WHERE id = ?", [id]);
};

export const reorderPhrases = async (ids: string[]) => {
  const db = await initializeDatabase();
  await runTransaction(db, async () => {
    for (const [sortOrder, id] of ids.entries()) {
      await db.runAsync("UPDATE phrases SET sort_order = ? WHERE id = ?", [sortOrder, id]);
    }
  });
};

export const createCategory = async (input: CategoryInput) => {
  const db = await initializeDatabase();
  const id = makeId("category");
  const sortOrder = input.sortOrder ?? (await nextCategorySortOrder(db));

  await db.runAsync(
    `INSERT INTO categories (id, name, emoji, color, sort_order, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      clean(input.emoji),
      clean(input.color),
      sortOrder,
      boolToInt(input.isDefault),
      nowIso()
    ]
  );

  return id;
};

export const updateCategory = async (id: string, input: CategoryInput) => {
  const db = await initializeDatabase();
  await db.runAsync(
    `UPDATE categories
     SET name = ?, emoji = ?, color = ?, sort_order = COALESCE(?, sort_order)
     WHERE id = ?`,
    [
      input.name.trim(),
      clean(input.emoji),
      clean(input.color),
      input.sortOrder ?? null,
      id
    ]
  );
};

export const deleteCategory = async (id: string) => {
  const db = await initializeDatabase();
  await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
};

export const addHistoryItem = async (text: string) => {
  const db = await initializeDatabase();
  await runTransaction(db, async () => {
    await db.runAsync("INSERT INTO history (id, text, spoken_at) VALUES (?, ?, ?)", [
      makeId("history"),
      text.trim(),
      nowIso()
    ]);
    await db.runAsync(
      `DELETE FROM history
       WHERE id NOT IN (
         SELECT id FROM history ORDER BY spoken_at DESC LIMIT 20
       )`
    );
  });
};

export const clearHistory = async () => {
  const db = await initializeDatabase();
  await db.runAsync("DELETE FROM history");
};

export const exportLibrary = async (): Promise<ExportPayload> => {
  const [categories, phrases] = await Promise.all([fetchCategories(), fetchPhrases()]);
  return {
    version: 1,
    exportedAt: nowIso(),
    categories,
    phrases
  };
};

export const importLibrary = async (payload: ExportPayload) => {
  if (payload.version !== 1 || !Array.isArray(payload.categories) || !Array.isArray(payload.phrases)) {
    throw new Error("This is not a SpeakEasy backup file.");
  }

  const db = await initializeDatabase();
  await runTransaction(db, async () => {
    for (const category of payload.categories) {
      await db.runAsync(
        `INSERT OR REPLACE INTO categories
          (id, name, emoji, color, sort_order, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.name,
          category.emoji,
          category.color,
          category.sortOrder,
          boolToInt(category.isDefault),
          category.createdAt || nowIso()
        ]
      );
    }

    for (const phrase of payload.phrases) {
      await db.runAsync(
        `INSERT OR REPLACE INTO phrases
          (id, text, label, emoji, color, category_id, voice_id, language, is_pinned,
           is_quick_access, sort_order, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          phrase.id,
          phrase.text,
          phrase.label,
          phrase.emoji,
          phrase.color,
          phrase.categoryId,
          phrase.voiceId,
          phrase.language,
          boolToInt(phrase.isPinned),
          boolToInt(phrase.isQuickAccess),
          phrase.sortOrder,
          boolToInt(phrase.isDefault),
          phrase.createdAt || nowIso()
        ]
      );
    }
  });
};
