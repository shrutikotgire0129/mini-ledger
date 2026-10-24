
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from the .env file");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("Database connected successfully!");
    console.log("Database time:", result.rows[0].current_time);
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}
