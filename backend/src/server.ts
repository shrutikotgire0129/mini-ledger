
import express from "express";
import cors from "cors";
import { testDatabaseConnection } from "./db";
import authRouter from "./routes/auth";
import loansRouter from "./routes/loans";
import summaryRouter from "./routes/summary";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "MiniLedger API is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/loans", loansRouter);
app.use("/api/summary", summaryRouter);

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch {
    console.error("Server startup failed. Check your database configuration.");
    process.exit(1);
  }
}

startServer();
