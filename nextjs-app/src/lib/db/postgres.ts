import { Pool } from 'pg';

// Create a connection pool for PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shooting_club',
  user: process.env.DB_USER || 'dbuser',
  password: process.env.DB_PASSWORD || 'dbpassword',
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL connection error:', err);
  } else {
    console.log('PostgreSQL connected successfully');
  }
});

// Export query function
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

