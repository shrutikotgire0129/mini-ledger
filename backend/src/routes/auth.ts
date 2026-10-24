
import { Router } from "express";
import { pool } from "../db";

const router = Router();

const otpStore = new Map<
  string,
  { otp: string; expiresAt: number }
>();

router.post("/send-otp", (req, res) => {
  const phone = String(req.body.phone ?? "").trim();

  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    return res.status(400).json({
      message: "Enter a valid phone number",
    });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`Mock OTP for ${phone}: ${otp}`);

  return res.json({
    message: "Mock OTP generated. Check the backend terminal.",
  });
});

router.post("/verify-otp", async (req, res) => {
  const phone = String(req.body.phone ?? "").trim();
  const otp = String(req.body.otp ?? "").trim();

  const savedOtp = otpStore.get(phone);

  if (
    !savedOtp ||
    savedOtp.expiresAt < Date.now() ||
    savedOtp.otp !== otp
  ) {
    return res.status(401).json({
      message: "Invalid or expired OTP",
    });
  }

  otpStore.delete(phone);

  try {
    const result = await pool.query(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone)
       DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone]
    );

    return res.json({
      message: "Login successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      message: "Unable to complete login",
    });
  }
});

export default router;
