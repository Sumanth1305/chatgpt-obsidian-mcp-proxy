# ChatGPT to Obsidian MCP Setup Runbook

## Goal

Connect ChatGPT to Obsidian so ChatGPT can search, read, create, and append notes through the Obsidian Local REST API MCP server.

## Moving Parts

| Component | What it does | Example |
|---|---|---|
| ChatGPT | MCP client that wants to use tools | ChatGPT App / Connector |
| ngrok | Creates a public HTTPS URL | `https://xxxx.ngrok-free.app` |
| Proxy server | Adds the Obsidian API key automatically | `http://127.0.0.1:3000` |
| Obsidian | Stores and manages notes | `https://127.0.0.1:27124` |

## Final Working Architecture

```mermaid
flowchart LR
    A[ChatGPT App] -->|No Auth| B[ngrok HTTPS URL]
    B --> C[Local Proxy Server :3000]
    C -->|Adds Authorization Bearer API Key| D[Obsidian Local REST API :27124]
    D --> E[(Obsidian Vault)]
```

## Important Lesson Learned

Do not paste the Obsidian API key into OAuth fields.

Obsidian Local REST API uses a bearer token:

```http
Authorization: Bearer YOUR_OBSIDIAN_API_KEY
```

ChatGPT's OAuth fields are for proper OAuth URLs such as authorization URL, token URL, and registration URL. They are not for static API keys.

Correct approach:

```text
ChatGPT Authentication = No Auth
Proxy Server = Adds Obsidian API Key in the background
```

## One-Time Setup Checklist

### 1. Obsidian Setup

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

### 3. Install This Project

```powershell
cd "C:\Projects\chatgpt-obsidian-mcp-proxy"
npm install
Copy-Item .env.example .env
```

Update `.env` with your Obsidian Local REST API key.

## Daily Startup Procedure

### Step 1: Start Obsidian

- [ ] Open Obsidian.
- [ ] Confirm the Local REST API plugin is enabled.

Test Obsidian directly:

```powershell
curl.exe -k https://127.0.0.1:27124/
```

With the API key configured correctly, the proxied response should show:

```json
"authenticated": true
```

### Step 2: Start the Proxy Server

Open PowerShell:

```powershell
cd "C:\Projects\chatgpt-obsidian-mcp-proxy"
npm start
```

Expected output:

```text
Obsidian MCP proxy running on http://127.0.0.1:3000
Forwarding to https://127.0.0.1:27124
```

Keep this PowerShell window open.

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
- This is normal because MCP uses event streaming.

### Step 4: Start ngrok

Open another PowerShell window.

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

Always add `/mcp/` at the end.

## ChatGPT App Configuration

Go to ChatGPT Settings > Apps / Connectors > Developer Mode > Create App.

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

ChatGPT cannot access your local `127.0.0.1`. It needs the public HTTPS URL from ngrok.

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

### ChatGPT Shows OAuth Fields

Use:

```text
Authentication = No Auth
```

The proxy handles the Obsidian API key.

### ngrok Shows Requests to `/.well-known/...` with 404

ChatGPT is trying OAuth discovery. Set ChatGPT Authentication to `No Auth` and confirm the server URL ends with `/mcp/`.

### ngrok Shows `POST / 404`

ChatGPT is calling the root path instead of the MCP path. Use:

```text
https://xxxx.ngrok-free.app/mcp/
```

### Proxy Test Does Not Show `authenticated: true`

Check:

- Is Obsidian open?
- Is the Local REST API plugin enabled?
- Is the API key correct in `.env`?
- Did you restart `npm start` after changing `.env`?

### PowerShell Says `curl -k` Is Invalid

PowerShell treats `curl` as `Invoke-WebRequest`.

Use:

```powershell
curl.exe -k https://127.0.0.1:27124/
```

### MCP Endpoint Says Client Must Accept `text/event-stream`

This means the MCP endpoint exists and expects event streaming.

Use:

```powershell
curl.exe http://127.0.0.1:3000/mcp/ -H "Accept: text/event-stream"
```

## Stop Everything Safely

To stop proxy:

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

- Do not share the ngrok URL.
- Stop ngrok when not using it.
- Stop the proxy when not using it.
- Do not upload `.env` to GitHub.
- Do not expose this permanently without stronger authentication.
- Keep Obsidian vault backups.
- Avoid enabling destructive tools like delete, move, or rename until you are comfortable.

## Mental Model to Remember

```mermaid
flowchart LR
    A[Wrong Idea] --> B[Paste API key into OAuth fields]
    C[Correct Idea] --> D[Use No Auth in ChatGPT]
    D --> E[Proxy adds API key]
    E --> F[Obsidian accepts request]
```

## Quick Command Cheat Sheet

### Start proxy

```powershell
cd "C:\Projects\chatgpt-obsidian-mcp-proxy"
npm start
```

### Test proxy

```powershell
curl.exe http://127.0.0.1:3000/
```

### Start ngrok

```powershell
ngrok http http://127.0.0.1:3000
```

### ChatGPT URL format

```text
https://YOUR-NGROK-URL.ngrok-free.app/mcp/
```

### ChatGPT Authentication

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
