const { createClient } = require('@libsql/client');
const client = createClient({ url: 'libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io', authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg' });

async function fix() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        daily_limit INTEGER NOT NULL DEFAULT 15,
        usage_count INTEGER NOT NULL DEFAULT 0,
        last_access_date DATE DEFAULT CURRENT_DATE
      )
    `);
    
    // Insert initial tokens
    await client.execute(`INSERT OR IGNORE INTO api_keys (token, daily_limit) VALUES ('AIzaSyCYO8JKEnOri4Smjd_dl7U1dCuyHeqRhNg', 15)`);
    await client.execute(`INSERT OR IGNORE INTO api_keys (token, daily_limit) VALUES ('AIzaSyDr392LhuCatcipgaIOEzC8CP0hnpp9FFo', 15)`);
    
    console.log('Created api_keys table and inserted initial tokens.');
  } catch (err) {
    console.error('Error:', err);
  }
}

fix();
