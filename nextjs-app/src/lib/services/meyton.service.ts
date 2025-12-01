import mysql from 'mysql2/promise';
import { query } from '../db/postgres';

// Global Meyton pool with improved connection handling
let meytonPool: mysql.Pool | null = null;

const getMeytonPool = async () => {
  if (!meytonPool) {
    meytonPool = mysql.createPool({
      host: process.env.MEYTON_DB_HOST,
      port: parseInt(process.env.MEYTON_DB_PORT),
      database: process.env.MEYTON_DB_NAME,
      user: process.env.MEYTON_DB_USER,
      password: process.env.MEYTON_DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Reconnect settings
      connectTimeout: 10000,
      // Prevent connection timeout - increased to 10 minutes
      idleTimeout: 600000, // 10 minutes
      maxIdle: 10,
    });
    
    // Test connection on pool creation
    try {
      const connection = await meytonPool.getConnection();
      console.log('✅ Meyton MySQL pool initialized and tested successfully');
      connection.release();
    } catch (error) {
      console.error('❌ Failed to initialize Meyton MySQL pool:', error);
      meytonPool = null;
      throw error;
    }
  }
  return meytonPool;
};

/**
 * Execute a query with automatic retry on connection loss
 */
const executeQuery = async (queryFn: (pool: mysql.Pool) => Promise<any>, retries = 2): Promise<any> => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await getMeytonPool();
      return await queryFn(pool);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ECONNRESET' ||
        error.message?.includes('Connection lost') ||
        error.message?.includes('server closed the connection');
      
      if (isConnectionError && attempt < retries) {
        console.warn(`⚠️  Connection lost, attempting to reconnect (attempt ${attempt + 1}/${retries})...`);
        
        // Reset the pool to force reconnection
        if (meytonPool) {
          try {
            await meytonPool.end();
          } catch (e) {
            // Ignore errors when closing
          }
          meytonPool = null;
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      // If it's not a connection error or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Format Ring01 values (last digit is decimal place)
 * Example: 3558 -> 355.8, 1045 -> 104.5
 */
export const formatRing01 = (value: any): number => {
  if (!value) return 0;
  const numValue = parseFloat(value);
  return numValue / 10;
};

/**
 * Format Teiler01 values (last digit is decimal place)
 * Example: 493 -> 49.3, 1751 -> 175.1, 3266 -> 326.6, 12456 -> 1245.6
 */
export const formatTeiler01 = (value: any): number => {
  if (!value) return 0;
  const numValue = parseFloat(value);
  return numValue / 10; // Last digit is decimal place
};

/**
 * Fetches shooting data for a specific shooter (by Name)
 */
export const getShootingData = async (shooterId: string, options: any = {}) => {
  try {
    // Parse shooter ID (format: "Nachname|Vorname")
    const [lastname, firstname] = shooterId.split('|');
    
    if (!lastname || !firstname) {
      throw new Error(`Invalid shooter ID format: ${shooterId}`);
    }
    
    let sql = `
      SELECT 
        s.ScheibenID,
        s.Nachname,
        s.Vorname,
        s.SportpassID,
        s.Verein,
        s.Disziplin,
        s.Zeitstempel as shooting_date,
        s.Trefferzahl as shots_count,
        s.TotalRing as total_score,
        s.TotalRing01 as total_score_decimal
      FROM 
        Scheiben s
      WHERE 
        s.Nachname = ? AND s.Vorname = ?
    `;
    
    const params: any[] = [lastname, firstname];
    
    if (options.startDate) {
      sql += ' AND s.Zeitstempel >= ?';
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      sql += ' AND s.Zeitstempel <= ?';
      params.push(options.endDate);
    }
    
    sql += ' ORDER BY s.Zeitstempel DESC';
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(options.limit));
    }
    
    const [rows] = await executeQuery(async (pool) => {
      return await pool.execute(sql, params);
    });
    return rows;
  } catch (error) {
    console.error('Error fetching Meyton shooting data:', error);
    throw new Error('Failed to retrieve shooting data from Meyton database');
  }
};

/**
 * Get detailed shot data for a specific session
 */
export const getSessionShotData = async (scheibenId: string) => {
  try {
    const sql = `
      SELECT 
        ScheibenID,
        Stellung,
        Treffer as shot_number,
        Ring as score,
        Ring01 as score_decimal,
        x as x_coordinate,
        y as y_coordinate,
        Zeitstempel as shot_time,
        Millisekunden as milliseconds,
        Teiler01 as precision_value,
        Innenzehner as inner_ten
      FROM 
        Treffer
      WHERE 
        ScheibenID = ?
      ORDER BY 
        Stellung, Treffer ASC
    `;

    const [rows] = await executeQuery(async (pool) => {
      return await pool.execute(sql, [scheibenId]);
    });
    return rows;
  } catch (error) {
    console.error('Error fetching session shot data:', error);
    throw new Error('Failed to retrieve shot data from Meyton database');
  }
};

/**
 * Get all shooters from the Meyton database
 * Returns unique shooters identified by Name (Nachname + Vorname)
 * Each name appears only ONCE
 */
export const getAllShooters = async () => {
  try {
    // Get unique shooters by Name ONLY (one entry per unique Nachname+Vorname)
    // We take the most recent entry for each name
    const [rows] = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        CONCAT(Nachname, '|', Vorname) AS ShooterID,
        Nachname AS Lastname,
        Vorname AS Firstname,
        SportpassID,
        Verein AS club_name,
        Zeitstempel AS last_activity
      FROM Scheiben s1
      WHERE Nachname IS NOT NULL 
        AND Nachname != ''
        AND Vorname IS NOT NULL 
        AND Vorname != ''
        AND Zeitstempel = (
          SELECT MAX(Zeitstempel)
          FROM Scheiben s2
          WHERE s2.Nachname = s1.Nachname 
            AND s2.Vorname = s1.Vorname
        )
      GROUP BY Nachname, Vorname, SportpassID, Verein, Zeitstempel
      ORDER BY Nachname, Vorname
    `);
    });
    
    // Remove duplicates in JavaScript (in case SQL didn't work perfectly)
    const uniqueShooters = new Map();
    (rows as any[]).forEach((shooter: any) => {
      const key = shooter.ShooterID;
      if (!uniqueShooters.has(key)) {
        uniqueShooters.set(key, shooter);
      }
    });
    
    const uniqueArray = Array.from(uniqueShooters.values());
    
    console.log(`✅ Found ${uniqueArray.length} unique shooters in Meyton DB (by Name)`);
    
    return uniqueArray;
  } catch (error) {
    console.error('❌ Error fetching shooters from Meyton:', error);
    throw error;
  }
};

/**
 * Get shooter by ID (Name-based: "Nachname|Vorname")
 */
export const getShooterById = async (shooterId: string) => {
  try {
    // Split the ID back into Nachname and Vorname
    const [lastname, firstname] = shooterId.split('|');
    
    if (!lastname || !firstname) {
      console.log(`⚠️  Invalid shooter ID format: ${shooterId}`);
      return null;
    }
    
    const [rows]: any = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        CONCAT(Nachname, '|', Vorname) AS ShooterID,
        Nachname AS Lastname,
        Vorname AS Firstname,
        SportpassID,
        Verein AS club_name
      FROM Scheiben
      WHERE Nachname = ? AND Vorname = ?
      ORDER BY Zeitstempel DESC
      LIMIT 1
    `, [lastname, firstname]);
    });
    
    if (rows.length === 0) {
      console.log(`⚠️  No shooter found: ${firstname} ${lastname}`);
      return null;
    }
    
    console.log(`✅ Found shooter: ${rows[0].Firstname} ${rows[0].Lastname} (Sportpass: ${rows[0].SportpassID || 'N/A'})`);
    return rows[0];
  } catch (error) {
    console.error(`❌ Error fetching shooter ${shooterId} from Meyton:`, error);
    throw error;
  }
};

/**
 * Search shooters by name
 */
export const searchShootersByName = async (searchQuery: string) => {
  try {
    const searchTerm = `%${searchQuery}%`;
    
    const [rows] = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        s1.ScheibenID AS shooter_id,
        s1.Nachname AS last_name,
        s1.Vorname AS first_name,
        s1.Verein AS club_name,
        s1.Zeitstempel AS last_activity
      FROM Scheiben s1
      INNER JOIN (
        SELECT 
          Nachname, 
          Vorname, 
          MAX(Zeitstempel) AS max_timestamp
        FROM Scheiben
        WHERE 
          Nachname LIKE ? OR 
          Vorname LIKE ? OR
          CONCAT(Vorname, ' ', Nachname) LIKE ? OR
          CONCAT(Nachname, ' ', Vorname) LIKE ?
        GROUP BY Nachname, Vorname
      ) s2 ON s1.Nachname = s2.Nachname 
          AND s1.Vorname = s2.Vorname 
          AND s1.Zeitstempel = s2.max_timestamp
      ORDER BY s1.Nachname, s1.Vorname
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);
    });
    
    return rows;
  } catch (error) {
    console.error(`Error searching shooters with query "${searchQuery}":`, error);
    throw error;
  }
};

/**
 * Get shooter sessions (by Name)
 */
export const getShooterSessions = async (shooterId: string) => {
  try {
    console.log(`Fetching sessions for shooter: ${shooterId} from Meyton database`);
    
    // Parse shooter ID (format: "Nachname|Vorname")
    const [lastname, firstname] = shooterId.split('|');
    
    if (!lastname || !firstname) {
      throw new Error(`Invalid shooter ID format: ${shooterId}`);
    }
    
    // Get all sessions for this shooter (by name) with retry logic
    const [sessionRows] = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        ScheibenID AS session_id,
        Zeitstempel AS session_date,
        Disziplin AS discipline,
        TotalRing AS total_score,
        TotalRing01 AS total_score_decimal,
        Trefferzahl AS shots_count,
        BesterTeiler01 AS best_teiler_raw
      FROM Scheiben
      WHERE Nachname = ? AND Vorname = ?
      ORDER BY Zeitstempel DESC
    `, [lastname, firstname]);
    });
    
    console.log(`Found ${(sessionRows as any[]).length} sessions in Meyton database for shooter: ${firstname} ${lastname}`);
    
    return sessionRows;
  } catch (error) {
    console.error(`Error fetching sessions for shooter ${shooterId}:`, error);
    throw error;
  }
};

/**
 * Get session details including shots
 */
export const getSessionDetails = async (sessionId: string) => {
  try {
    // Get session info
    const [sessionRows]: any = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        ScheibenID AS session_id,
        Zeitstempel AS session_date,
        Disziplin AS discipline,
        TotalRing AS total_score,
        TotalRing01 AS total_score_decimal,
        Trefferzahl AS shots_count
      FROM Scheiben
      WHERE ScheibenID = ?
    `, [sessionId]);
    });
    
    if (sessionRows.length === 0) {
      return null;
    }
    
    const session = sessionRows[0];
    
    // Get series data
    const [seriesRows] = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        Serie AS series_number,
        Ring AS score,
        Ring01 AS score_decimal
      FROM Serien
      WHERE ScheibenID = ?
      ORDER BY Serie
    `, [sessionId]);
    });
    
    session.series = seriesRows;
    
    // Get shot data
    const [shotRows] = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        Treffer AS shot_number,
        x,
        y,
        Ring AS score,
        Ring01 AS score_decimal,
        Teiler01 AS decimal_center,
        Innenzehner AS inner_ten,
        Zeitstempel AS timestamp
      FROM Treffer
      WHERE ScheibenID = ?
      ORDER BY Treffer
    `, [sessionId]);
    });
    
    session.shots = shotRows;
    
    return session;
  } catch (error) {
    console.error(`Error fetching details for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get shooter statistics
 */
export const getShooterStatistics = async (shooterId: string, options: any = {}) => {
  try {
    const { startDate, endDate } = options;
    
    let sql = `
      SELECT 
        COUNT(DISTINCT ss.id) AS total_sessions,
        COUNT(sr.id) AS total_series,
        COUNT(s.id) AS total_shots,
        AVG(sr.result) AS average_result,
        MAX(sr.result) AS best_result,
        MIN(sr.result) AS worst_result
      FROM shootingsession ss
      LEFT JOIN series sr ON ss.id = sr.shootingsession_id
      LEFT JOIN shot s ON sr.id = s.series_id
      WHERE ss.shooter_id = ?
    `;
    
    const queryParams: any[] = [shooterId];
    
    if (startDate) {
      sql += ' AND ss.date >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND ss.date <= ?';
      queryParams.push(endDate);
    }
    
    const [rows]: any = await executeQuery(async (pool) => {
      return await pool.query(sql, queryParams);
    });
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error(`Error fetching statistics for shooter ${shooterId}:`, error);
    throw error;
  }
};

/**
 * Cache session data in our database
 */
export const cacheSessionData = async (userId: number, shooterId: string, sessionId: string, sessionData: any) => {
  try {
    // Check if session already exists in cache
    const existingSession = await query(
      'SELECT id FROM meyton_data WHERE shooter_id = $1 AND session_id = $2',
      [shooterId, sessionId]
    );
    
    if (existingSession.rows.length > 0) {
      // Update existing session
      await query(
        'UPDATE meyton_data SET shooting_data = $1, updated_at = NOW() WHERE shooter_id = $2 AND session_id = $3',
        [sessionData, shooterId, sessionId]
      );
    } else {
      // Insert new session
      await query(
        'INSERT INTO meyton_data (user_id, shooter_id, session_id, shooting_data, session_date) VALUES ($1, $2, $3, $4, $5)',
        [userId, shooterId, sessionId, sessionData, new Date(sessionData.session_date)]
      );
    }
  } catch (error) {
    console.error(`Error caching session data for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get all shots (Treffer) for a specific session with coordinates and analysis data
 */
export const getSessionShots = async (sessionId: string) => {
  try {
    console.log(`📊 Fetching shots for session ID: ${sessionId}`);
    
    const [shotRows]: any = await executeQuery(async (pool) => {
      return await pool.query(`
      SELECT 
        Treffer as shot_number,
        Stellung,
        x,
        y,
        Ring,
        Ring01,
        Teiler01,
        Innenzehner,
        Zeitstempel,
        Millisekunden
      FROM Treffer
      WHERE ScheibenID = ?
      ORDER BY Treffer ASC
    `, [sessionId]);
    });
    
    if (shotRows.length === 0) {
      console.log(`⚠️  No shots found for session ${sessionId}`);
      return { shots: [] };
    }
    
    // Format shots data
    const shots = shotRows.map((shot: any) => ({
      shot_number: shot.shot_number,
      stellung: shot.Stellung,
      x: parseFloat(shot.x) / 100, // Convert from 1/100 mm to mm
      y: parseFloat(shot.y) / 100, // Convert from 1/100 mm to mm
      ring: shot.Ring, // Normal ring (100 = 10.0)
      ring01: shot.Ring01, // Ring with decimal (105 = 10.5)
      score: formatRing01(shot.Ring01), // Formatted score (10.5)
      teiler01: shot.Teiler01 ? formatTeiler01(shot.Teiler01) : null, // Teiler in mm
      innenzehner: shot.Innenzehner === 1,
      timestamp: shot.Zeitstempel,
      millisekunden: shot.Millisekunden
    }));
    
    console.log(`✅ Found ${shots.length} shots for session ${sessionId}`);
    
    return { shots };
  } catch (error) {
    console.error(`❌ Error fetching shots for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Test the MySQL connection
 * Useful for health checks
 */
export const testMeytonConnection = async (): Promise<boolean> => {
  try {
    await executeQuery(async (pool) => {
      return await pool.query('SELECT 1');
    });
    return true;
  } catch (error) {
    console.error('❌ Meyton connection test failed:', error);
    return false;
  }
};

/**
 * Close the MySQL connection pool
 * Should be called when the application shuts down
 */
export const closeMeytonPool = async (): Promise<void> => {
  if (meytonPool) {
    try {
      await meytonPool.end();
      meytonPool = null;
      console.log('✅ Meyton MySQL pool closed successfully');
    } catch (error) {
      console.error('❌ Error closing Meyton MySQL pool:', error);
    }
  }
};

