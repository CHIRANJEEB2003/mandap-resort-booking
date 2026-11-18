// One-time script to create the mandap_booking database
// Run: PGPASSWORD=<your postgres password> [PGPORT=5432] node create-db.js
const { Client } = require('pg');

async function setup() {
  // Connect to default postgres database to create our DB
  const client = new Client({
    host: '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    user: 'postgres',
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database (ignore error if already exists)
    try {
      await client.query('CREATE DATABASE mandap_booking');
      console.log('Created database: mandap_booking');
    } catch (e) {
      if (e.code === '42P04') {
        console.log('Database mandap_booking already exists — continuing');
      } else {
        throw e;
      }
    }

    // Create mandap user
    try {
      await client.query("CREATE USER mandap WITH PASSWORD 'mandap_pass'");
      console.log('Created user: mandap');
    } catch (e) {
      if (e.code === '42710') {
        console.log('User mandap already exists — continuing');
      } else {
        throw e;
      }
    }

    await client.query('GRANT ALL PRIVILEGES ON DATABASE mandap_booking TO mandap');
    await client.query('ALTER DATABASE mandap_booking OWNER TO mandap');
    console.log('Granted privileges to mandap user');

    await client.end();

    // Grant schema permissions via a second connection to the new DB
    const client2 = new Client({
      host: '127.0.0.1',
      port: Number(process.env.PGPORT || 5432),
      user: 'postgres',
      password: process.env.PGPASSWORD,
      database: 'mandap_booking',
    });
    await client2.connect();
    await client2.query('GRANT ALL ON SCHEMA public TO mandap');
    await client2.end();
    console.log('Schema permissions granted');

    console.log('\nDatabase setup complete. Now run:');
    console.log('  npx prisma migrate dev --name init');
    console.log('  node prisma/seed.js');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
