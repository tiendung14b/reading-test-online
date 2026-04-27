const { createClient } = require('@libsql/client');
const client = createClient({ url: 'libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io', authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg' });

async function fix() {
  try {
    await client.execute('ALTER TABLE results ADD COLUMN ai_evaluation TEXT');
    console.log('Added ai_evaluation column to results table.');
  } catch (err) {
    console.error('Error adding column:', err);
  }
}

fix();
