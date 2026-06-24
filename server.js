const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const https = require("https");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const OBSIDIAN_TARGET = process.env.OBSIDIAN_TARGET || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY;

if (!OBSIDIAN_API_KEY) {
  console.error("Missing OBSIDIAN_API_KEY. Copy .env.example to .env and add your Obsidian Local REST API key.");
  process.exit(1);
}

const agent = new https.Agent({
  rejectUnauthorized: false,
});

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    target: OBSIDIAN_TARGET,
  });
});

app.use(
  "/",
  createProxyMiddleware({
    target: OBSIDIAN_TARGET,
    changeOrigin: true,
    secure: false,
    agent,
    ws: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("Authorization", `Bearer ${OBSIDIAN_API_KEY}`);
      },
      error: (err, _req, res) => {
        console.error("Proxy error:", err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
        }
        res.end(JSON.stringify({ error: "Unable to reach Obsidian Local REST API" }));
      },
    },
  })
);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Obsidian MCP proxy running on http://127.0.0.1:${PORT}`);
  console.log(`Forwarding to ${OBSIDIAN_TARGET}`);
});
