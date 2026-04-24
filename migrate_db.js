const { createClient } = require('@libsql/client');

const client = createClient({
  url: "libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg"
});

async function migrate() {
  try {
    console.log("Starting migration...");
    // 1. Rename table
    await client.execute("ALTER TABLE exercises RENAME TO exercises_old");
    
    // 2. Create new table
    await client.execute(`
      CREATE TABLE exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('reading', 'cloze', 'rewriting')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Copy data
    await client.execute(`
      INSERT INTO exercises (id, title, content, type, created_at)
      SELECT id, title, content, type, created_at FROM exercises_old
    `);

    // 4. Drop old table
    await client.execute("DROP TABLE exercises_old");

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
