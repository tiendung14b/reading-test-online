const { createClient } = require('@libsql/client');
const client = createClient({ url: 'libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io', authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg' });

async function check() {
  const r1 = await client.execute("SELECT sql FROM sqlite_schema WHERE name = 'questions'");
  console.log('questions:', r1.rows[0].sql);

  const r2 = await client.execute("SELECT sql FROM sqlite_schema WHERE name = 'results'");
  console.log('results:', r2.rows[0].sql);

  const r3 = await client.execute("SELECT sql FROM sqlite_schema WHERE name = 'exercise_vocabularies'");
  console.log('exercise_vocabularies:', r3.rows[0].sql);
}

check().catch(console.error);
