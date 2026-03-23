import * as dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini SDK (using the official Google Generative AI SDK as requested)
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("WARNING: No Gemini API key found in environment variables (GEMINI_API_KEY or API_KEY)");
  }
  const genAI = new GoogleGenerativeAI(apiKey || "");
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // API routes
  app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is responsive" });
  });

  /* 
  // API routes (Moved to client-side in src/lib/gemini.ts)
  app.post('/api/simulate', async (req, res) => {
    // ...
  });
  app.post('/api/validate', async (req, res) => {
    // ...
  });
  */

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
