import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON middleware for API
  app.use(express.json());

  // API Mock for "SMS Notification"
  app.post("/api/recover-access", (req, res) => {
    const { phone, email } = req.body;
    console.log(`[SIMULATED SMS] Recovery message sent to ${phone} for ${email}`);
    res.json({ success: true, message: "Recovery message sent!" });
  });

  // API for Exporting CSV
  app.get("/api/export/:type", (req, res) => {
    const { type } = req.params;
    // In a real app, this would fetch from DB and generate a CSV
    // Here we just return a status or sample file header
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
    res.status(200).send("ID,Name,Value,Status,Date\n1,Demo Lead,1000,COMPLETED,2026-04-25");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
