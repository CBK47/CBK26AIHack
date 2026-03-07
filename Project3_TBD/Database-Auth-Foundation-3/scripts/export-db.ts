import pg from "pg";

const TABLE_ORDER = [
  "users",
  "tricks",
  "sessions",
  "session_tricks",
  "user_tricks",
  "achievements",
  "game_results",
  "training_goals",
  "shop_items",
  "user_purchases",
  "friendships",
  "challenges",
  "forum_posts",
  "forum_comments",
];

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function exportDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const lines: string[] = [];

  lines.push("-- Just Juggle database export");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");

  for (const table of TABLE_ORDER) {
    const exists = await pool.query(
      `SELECT to_regclass('public.${table}') AS t`
    );
    if (!exists.rows[0].t) {
      lines.push(`-- Table "${table}" does not exist, skipping.`);
      lines.push("");
      continue;
    }

    const { rows } = await pool.query(`SELECT * FROM "${table}"`);
    if (rows.length === 0) {
      lines.push(`-- Table "${table}" is empty.`);
      lines.push("");
      continue;
    }

    const columns = Object.keys(rows[0]);
    lines.push(`-- ${table} (${rows.length} rows)`);
    lines.push(`DELETE FROM "${table}";`);

    for (const row of rows) {
      const vals = columns.map((col) => escapeValue(row[col]));
      lines.push(
        `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${vals.join(", ")});`
      );
    }

    const serialCols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_default LIKE 'nextval%'`,
      [table]
    );
    for (const sc of serialCols.rows) {
      lines.push(
        `SELECT setval(pg_get_serial_sequence('"${table}"', '${sc.column_name}'), COALESCE((SELECT MAX("${sc.column_name}") FROM "${table}"), 1));`
      );
    }

    lines.push("");
  }

  lines.push("COMMIT;");
  lines.push("");

  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(process.cwd(), "export.sql");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`Database exported to ${outPath} (${rows(lines)} statements)`);

  await pool.end();
}

function rows(lines: string[]): number {
  return lines.filter((l) => l.startsWith("INSERT")).length;
}

exportDatabase().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
