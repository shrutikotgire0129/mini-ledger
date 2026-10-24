
import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/", async (req, res) => {
  const userId = Number(req.body.userId);
  const friendName = String(req.body.friendName ?? "").trim();
  const amount = Number(req.body.amount);
  const dueDate = String(req.body.dueDate ?? "").trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  if (!friendName || friendName.length > 100) {
    return res.status(400).json({ message: "Enter a valid friend's name" });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than zero" });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({ message: "Due date must use YYYY-MM-DD format" });
  }

  const parsedDate = new Date(`${dueDate}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dueDate
  ) {
    return res.status(400).json({ message: "Enter a valid due date" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, friend_name, amount, due_date, is_repaid, created_at`,
      [userId, friendName, amount, dueDate]
    );

    return res.status(201).json({
      message: "Loan added successfully",
      loan: result.rows[0],
    });
  } catch (error) {
    console.error("Add loan failed:", error);
    return res.status(500).json({ message: "Unable to add loan" });
  }
});

router.get("/", async (req, res) => {
  const userId = Number(req.query.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId query parameter is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
         id,
         user_id,
         friend_name,
         amount,
         due_date,
         is_repaid,
         created_at,
         (is_repaid = FALSE AND due_date < CURRENT_DATE) AS is_overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY due_date ASC, created_at DESC`,
      [userId]
    );

    return res.json({ loans: result.rows });
  } catch (error) {
    console.error("Fetch loans failed:", error);
    return res.status(500).json({ message: "Unable to fetch loans" });
  }
});

router.patch("/:id/repay", async (req, res) => {
  const loanId = Number(req.params.id);
  const userId = Number(req.body.userId);

  if (!Number.isInteger(loanId) || loanId <= 0) {
    return res.status(400).json({ message: "Valid loan ID is required" });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE loans
       SET is_repaid = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, friend_name, amount, due_date, is_repaid, created_at`,
      [loanId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found for this user" });
    }

    return res.json({
      message: "Loan marked as repaid",
      loan: result.rows[0],
    });
  } catch (error) {
    console.error("Mark loan repaid failed:", error);
    return res.status(500).json({ message: "Unable to update loan" });
  }
});

export default router;
