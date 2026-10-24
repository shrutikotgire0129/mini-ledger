
import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const userId = Number(req.query.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "Valid userId query parameter is required",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_lent,
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = TRUE), 0) AS total_repaid,
         COALESCE(SUM(amount) FILTER (WHERE is_repaid = FALSE), 0) AS outstanding_amount,
         COALESCE(
           SUM(amount) FILTER (
             WHERE is_repaid = FALSE AND due_date < CURRENT_DATE
           ),
           0
         ) AS overdue_amount
       FROM loans
       WHERE user_id = $1`,
      [userId]
    );

    return res.json({
      summary: result.rows[0],
    });
  } catch (error) {
    console.error("Fetch summary failed:", error);
    return res.status(500).json({
      message: "Unable to fetch loan summary",
    });
  }
});

export default router;
