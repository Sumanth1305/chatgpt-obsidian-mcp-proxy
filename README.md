# ChatGPT Obsidian MCP Proxy

A local proxy that lets ChatGPT connect to the Obsidian Local REST API MCP endpoint through a public HTTPS tunnel such as ngrok.

The proxy keeps your Obsidian API key on your machine. ChatGPT connects with **No Auth**, and this server adds the required `Authorization: Bearer ...` header before forwarding requests to Obsidian.

## Goal

Connect ChatGPT to Obsidian so ChatGPT can search, read, create, and append notes using the Obsidian Local REST API MCP server.

## Simple Explanation

There are four moving parts:

| Component | What it does | Example |
|---|---|---|
| ChatGPT | MCP client that wants to use tools | ChatGPT App / Connector |
| ngrok | Creates a public HTTPS URL | `https://xxxx.ngrok-free.app` |
| Proxy server | Adds the Obsidian API key automatically | `http://127.0.0.1:3000` |
| Obsidian | Stores and manages notes | `https://127.0.0.1:27124` |

## Architecture

```mermaid
flowchart LR
    A[ChatGPT App] -->|No Auth| B[ngrok HTTPS URL]
    B --> C[Local Proxy Server :3000]
    C -->|Adds Authorization Bearer API Key| D[Obsidian Local REST API :27124]
    D --> E[(Obsidian Vault)]
```

## Important Lesson

Do not paste the Obsidian API key into ChatGPT OAuth fields.

Obsidian Local REST API uses a bearer token:

```http
Authorization: Bearer YOUR_OBSIDIAN_API_KEY
```

ChatGPT OAuth fields are for real OAuth URLs such as auth URL, token URL, and registration URL. They are not for static API keys.

Correct setup:

```text
ChatGPT Authentication = No Auth
Proxy Server = Adds Obsidian API Key in the background
```

## Requirements

- Obsidian
- Obsidian Local REST API community plugin
- Node.js LTS
- ngrok or another HTTPS tunnel

## One-Time Setup Checklist

### 1. Set Up Obsidian

- [ ] Install Obsidian.
- [ ] Install the Local REST API community plugin.
- [ ] Enable the plugin.
- [ ] Copy the API key from Obsidian Settings > Local REST API > API Key.

Default Obsidian Local REST API endpoint:

```text
https://127.0.0.1:27124
```

MCP endpoint:

```text
https://127.0.0.1:27124/mcp/
```

### 2. Install Node.js

Install Node.js LTS.

Check installation:

```powershell
node -v
npm -v
```

Expected result:

```text
node version should appear
npm version should appear
```

### 3. Get This Project

Clone or download this repository, then open PowerShell in the project folder.

For this local setup, the project folder is:

```powershell
cd "C:\Users\suman\Documents\Obsidian Connector for GPT"
```

### 4. Install Dependencies

```powershell
npm install
```

### 5. Create Your Local `.env` File

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set:

```text
OBSIDIAN_API_KEY=your_local_rest_api_key
OBSIDIAN_TARGET=https://127.0.0.1:27124
PORT=3000
```

Do not commit `.env`. It contains the secret token for your vault.

## Daily Startup Procedure

Use this every time you want ChatGPT to connect to Obsidian.

### Step 1: Start Obsidian

- [ ] Open Obsidian.
- [ ] Confirm the Local REST API plugin is enabled.

Test Obsidian directly:

```powershell
curl.exe -k https://127.0.0.1:27124/
```

When the API key is included by the proxy later, the response should show:

```json
"authenticated": true
```

### Step 2: Start the Proxy Server

Open PowerShell in the project folder:

```powershell
cd "C:\Users\suman\Documents\Obsidian Connector for GPT"
```

Start the proxy:

```powershell
npm start
```

Expected output:

```text
Obsidian MCP proxy running on http://127.0.0.1:3000
Forwarding to https://127.0.0.1:27124
```

Keep this PowerShell window open. The proxy stops if you close the window or press `Ctrl+C`.

### Step 3: Test the Proxy

Open a second PowerShell window:

```powershell
curl.exe http://127.0.0.1:3000/
```

Expected output should contain:

```json
"authenticated": true
```

Then test the MCP endpoint:

```powershell
curl.exe http://127.0.0.1:3000/mcp/ -H "Accept: text/event-stream"
```

Possible behavior:

- It may keep the connection open.
- It may show streaming/event output.
- That is normal because MCP uses event streaming.

### Step 4: Start ngrok

Open a third PowerShell window.

If `ngrok.exe` is in your current folder:

```powershell
.\ngrok.exe http http://127.0.0.1:3000
```

If ngrok is available globally:

```powershell
ngrok http http://127.0.0.1:3000
```

Expected output:

```text
Forwarding  https://xxxx.ngrok-free.app -> http://127.0.0.1:3000
```

Copy the HTTPS URL.

Example:

```text
https://3a94-xxxx.ngrok-free.app
```

Your ChatGPT MCP URL becomes:

```text
https://3a94-xxxx.ngrok-free.app/mcp/
```

Always add `/mcp/` at the end when giving the URL to ChatGPT.

## ChatGPT App Configuration

Go to:

```text
ChatGPT > Settings > Apps / Connectors > Developer Mode > Create App
```

Use:

| Field | Value |
|---|---|
| Name | `Obsidian Notes` |
| Description | `Search, read, create, and append notes in my Obsidian vault.` |
| Connection | `Server URL` |
| Server URL | `https://YOUR-NGROK-URL.ngrok-free.app/mcp/` |
| Authentication | `No Auth` |

## Correct URL Format

Correct:

```text
https://xxxx.ngrok-free.app/mcp/
```

Wrong:

```text
https://xxxx.ngrok-free.app
https://127.0.0.1:27124/mcp/
http://127.0.0.1:3000/mcp/
```

Why:

- ChatGPT cannot access your local `127.0.0.1`.
- ChatGPT needs a public HTTPS URL.
- ngrok gives that public HTTPS URL.

## Validation Flow

```mermaid
flowchart TD
    A[Start Obsidian] --> B[Test https://127.0.0.1:27124]
    B --> C[Start Proxy on Port 3000]
    C --> D[Test http://127.0.0.1:3000]
    D --> E{authenticated true?}
    E -->|No| F[Check API key in .env]
    E -->|Yes| G[Start ngrok to port 3000]
    G --> H[Copy HTTPS ngrok URL]
    H --> I[Add /mcp/]
    I --> J[Create ChatGPT App with No Auth]
    J --> K[Use Obsidian from ChatGPT]
```

## Troubleshooting

### Problem 1: ChatGPT Shows OAuth Fields

Meaning: ChatGPT is asking for OAuth setup.

Fix: Do not use OAuth. Use:

```text
Authentication = No Auth
```

The proxy handles the Obsidian API key.

### Problem 2: ngrok Shows Requests to `/.well-known/...` with 404

Example:

```text
GET /.well-known/oauth-authorization-server 404
GET /.well-known/openid-configuration 404
GET /.well-known/oauth-protected-resource 404
```

Meaning: ChatGPT is trying OAuth discovery.

Fix: Set ChatGPT Authentication to `No Auth` and confirm the server URL ends with:

```text
/mcp/
```

### Problem 3: ngrok Shows `POST / 404`

Meaning: ChatGPT is calling the root path instead of the MCP path.

Fix: Your ChatGPT URL is probably missing `/mcp/`.

Use:

```text
https://xxxx.ngrok-free.app/mcp/
```

Do not use:

```text
https://xxxx.ngrok-free.app
```

### Problem 4: Proxy Test Does Not Show `authenticated: true`

Run:

```powershell
curl.exe http://127.0.0.1:3000/
```

If output shows:

```json
"authenticated": false
```

Check:

- Is Obsidian open?
- Is Local REST API enabled?
- Is the API key correct in `.env`?
- Did you restart `npm start` after changing `.env`?

### Problem 5: PowerShell Says `curl -k` Is Invalid

PowerShell treats `curl` as `Invoke-WebRequest`.

Use:

```powershell
curl.exe -k https://127.0.0.1:27124/
```

Do not use:

```powershell
curl -k https://127.0.0.1:27124/
```

### Problem 6: MCP Endpoint Says Client Must Accept `text/event-stream`

Example error:

```json
{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept text/event-stream"},"id":null}
```

Meaning: This is actually good. It means the MCP endpoint exists and expects event streaming.

Fix for manual testing:

```powershell
curl.exe http://127.0.0.1:3000/mcp/ -H "Accept: text/event-stream"
```

## Stop Everything Safely

To stop the proxy:

```text
Go to the proxy PowerShell window and press Ctrl+C.
```

To stop ngrok:

```text
Go to the ngrok PowerShell window and press Ctrl+C.
```

To fully shut down:

- [ ] Stop ChatGPT usage.
- [ ] Stop ngrok.
- [ ] Stop proxy.
- [ ] Close Obsidian if not needed.

## Security Rules

Treat the ngrok URL like a temporary doorway into your Obsidian vault.

- Do not share the ngrok URL.
- Stop ngrok when not using it.
- Stop the proxy when not using it.
- Do not upload `.env` to GitHub.
- Do not expose this permanently without stronger authentication.
- Keep Obsidian vault backups.
- Avoid enabling destructive tools like delete, move, or rename until you are comfortable.

## Mental Model

```mermaid
flowchart LR
    A[Wrong Idea] --> B[Paste API key into OAuth fields]
    C[Correct Idea] --> D[Use No Auth in ChatGPT]
    D --> E[Proxy adds API key]
    E --> F[Obsidian accepts request]
```

## Quick Command Cheat Sheet

Start proxy:

```powershell
cd "C:\Users\suman\Documents\Obsidian Connector for GPT"
npm start
```

Test proxy:

```powershell
curl.exe http://127.0.0.1:3000/
```

Start ngrok:

```powershell
ngrok http http://127.0.0.1:3000
```

ChatGPT URL format:

```text
https://YOUR-NGROK-URL.ngrok-free.app/mcp/
```

ChatGPT Authentication:

```text
No Auth
```

## Final Success Checklist

- [ ] Obsidian is open.
- [ ] Local REST API plugin is enabled.
- [ ] `.env` contains the correct Obsidian API key.
- [ ] Proxy is running on port `3000`.
- [ ] `curl.exe http://127.0.0.1:3000/` shows `authenticated: true`.
- [ ] ngrok is forwarding to `http://127.0.0.1:3000`.
- [ ] ChatGPT server URL ends with `/mcp/`.
- [ ] ChatGPT Authentication is `No Auth`.
- [ ] ChatGPT connector creates successfully.

## Final Target State

```text
ChatGPT
  -> ngrok HTTPS URL /mcp/
  -> Local proxy on port 3000
  -> Obsidian Local REST API on port 27124
  -> Obsidian vault notes
```

Once this works, ChatGPT can help maintain notes, study plans, CTI dashboards, SOC investigation templates, and learning logs directly inside Obsidian.

## Full Runbook

See [docs/runbook.md](docs/runbook.md) for the repo-maintained setup runbook.
