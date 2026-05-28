# Troubleshooting Checklist

Use this when something isn't working.

## ?? Server Won't Start

### npm start fails
- [ ] Run `npm install` - install all dependencies
- [ ] Check Node.js version: `node --version` (need v14+)
- [ ] Check `.env` file exists and has PORT=3000
- [ ] Try deleting `node_modules` and running `npm install` again
- [ ] Check port 3000 isn't already in use

### Port 3000 in use error
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port in .env
PORT=3001
```

## ?? OpenAI Connection Fails

### Error: "Authorization failed"
- [ ] Check `OPENAI_API_KEY` in `.env` is correct
- [ ] Key should start with `sk-`
- [ ] Make sure you didn't copy extra spaces
- [ ] Generate a new key from openai.com if unsure
- [ ] Verify account has access to realtime API

### Error: "OPENAI_API_KEY undefined"
- [ ] `.env` file is not being read
- [ ] Make sure `.env` is in the root directory
- [ ] Restart server after creating `.env`
- [ ] Check syntax: `OPENAI_API_KEY=sk-xxxx` (no spaces)

### OpenAI WebSocket times out
- [ ] Check internet connection
- [ ] Verify OpenAI API isn't down: https://status.openai.com
- [ ] Check firewall isn't blocking WebSocket
- [ ] Try connecting from different network

## ?? Agent Not Responding to Caller

### Agent doesn't greet
- [ ] Check server logs - any errors?
- [ ] Verify OpenAI connection succeeded (look for "OpenAI connected" in logs)
- [ ] Make sure audio is being received (check for "Stream started" in logs)
- [ ] Verify Twilio is sending audio correctly

### Agent gives generic error messages
- [ ] This usually means OpenAI error - check console logs
- [ ] Look for `"OpenAI error"` in logs
- [ ] Paste error message into Google to diagnose
- [ ] Common: API key wrong, model unavailable, rate limited

## ?? Data Not Reaching make.com

### Webhook not being called
- [ ] Check agent actually collects all info (name, email, reason)
- [ ] Look for `"Tool called: submit_contact"` in logs
- [ ] If no log line appears, agent isn't calling the tool
- [ ] Agent might think it doesn't have all info - speak clearly

### Webhook returns error
- [ ] Check `MAKE_WEBHOOK_URL` in `.env` is correct
- [ ] Webhook URL should start with `https://`
- [ ] Copy-paste from make.com (don't retype)
- [ ] Check if make.com scenario is published/active
- [ ] Test webhook manually:

```bash
curl -X POST "https://hook.us2.make.com/xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","reason":"testing"}'
```

### No "Tool called" message in logs
- [ ] Agent might not think it has enough info
- [ ] Agent might not recognize when to call tool
- [ ] Check server.js has correct tool definition
- [ ] Verify agent instructions mention the tool

## ?? Agent Doesn't Understand Speech

### Agent says "I didn't understand"
- [ ] Speak more clearly and slowly
- [ ] Avoid background noise
- [ ] Make sure microphone is working
- [ ] Wait for agent to finish speaking before talking
- [ ] Use natural speech, not spelling out

### Agent doesn't detect language correctly
- [ ] For Chinese: Speak clearly in Mandarin
- [ ] Agent should auto-detect from speech
- [ ] If starting in English, it might stay in English
- [ ] Try saying sentence entirely in one language
- [ ] Check OpenAI logs for transcription

## ?? Email Not Sending from make.com

### Email module not set up
- [ ] Check your make.com scenario has email module
- [ ] Email module comes after HTTP Webhook
- [ ] Verify email address field is mapped: `{{1.email}}`

### Email not actually sending
- [ ] Check make.com execution logs
- [ ] Verify sender email is authenticated
- [ ] Check email isn't going to spam
- [ ] Verify recipient email is in correct format
- [ ] Test scenario manually in make.com

### Wrong data in email
- [ ] Check email template uses correct field names
- [ ] Should be: `{{1.name}}`, `{{1.email}}`, `{{1.reason}}`
- [ ] Names are case-sensitive in make.com
- [ ] Look at actual webhook data received in make.com logs

## ?? Twilio Connection Issues

### "Stream started" never appears in logs
- [ ] Twilio webhook not set up correctly
- [ ] Check Twilio endpoint is: `https://yourdomain.com/twilio/voice`
- [ ] Endpoint should POST to `/twilio/voice`
- [ ] Make sure server is publicly accessible
- [ ] For testing locally: use ngrok to expose local server

```bash
# Install ngrok, then:
ngrok http 3000
# Use the ngrok URL as Twilio webhook
```

### "Twilio connected" in logs but no audio
- [ ] Audio stream not starting
- [ ] Check Twilio voice config: needs to connect to `/media-stream`
- [ ] Verify WebSocket path is `/media-stream`
- [ ] Check firewall allows WebSocket connections

## ?? Performance/Slow Issues

### Agent responds very slowly
- [ ] This might be normal (OpenAI latency)
- [ ] Check server CPU/memory usage
- [ ] If many concurrent calls, may hit rate limits
- [ ] Verify internet connection speed
- [ ] Check OpenAI API status

### Server crashes after a few calls
- [ ] Memory leak possible
- [ ] Restart server: `npm start`
- [ ] Check for infinite loops in code
- [ ] Look for WebSocket connections not closing
- [ ] Monitor with: `npm run monitor` (if available)

## ?? Verification Steps

Run setup verification:
```bash
node verify-setup.js
```

This checks:
- ? Node.js installed
- ? Files in place
- ? Dependencies installed
- ? .env configured
- ? Code is correct

## ?? Debug Mode

Enable detailed logging:

Edit `server.js` - change console.log to:
```javascript
function log(msg, data) {
  console.log(`[${new Date().toISOString()}] ${msg}`, data || "");
}

// Then use: log("message", {details})
```

This adds timestamps to all logs.

## ?? Quick Test

Minimal test to verify everything works:

1. Start server: `npm start`
2. Look for these logs (in order):
   - `Server running on port 3000`
   - `Twilio connected`
   - `OpenAI connected`
3. If all three appear, connection is working
4. Call number - if agent says hello, you're good!

## ?? If All Else Fails

1. **Check the .md files**
   - QUICK_START.md
   - MVP_SETUP.md
   - MAKE_COM_SETUP.md

2. **Check logs carefully**
   - Look for actual error messages
   - Search logs for "error" or "Error"
   - Google the exact error message

3. **Verify keys**
   - Copy .env values fresh from OpenAI/make.com
   - Remove extra spaces
   - Test keys independently

4. **Try minimal test**
   - Start fresh: delete node_modules, npm install
   - Use fresh .env
   - Test one thing at a time

5. **Ask for help**
   - Include full error log
   - Say what step is failing
   - Mention what you're trying to do

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOENT: no such file or directory, open '.env'` | No .env file | Create .env from .env.example |
| `Cannot find module 'node-fetch'` | Missing dependency | Run: npm install |
| `Authorization failed` | Bad OpenAI key | Check key in .env, get new one |
| `MAKE_WEBHOOK_URL undefined` | Not in .env | Add MAKE_WEBHOOK_URL to .env |
| `EADDRINUSE: address already in use :::3000` | Port in use | Use different port or kill process |
| `WebSocket is not defined` | Missing import | Check imports at top of server.js |
| `JSON.parse error` | Malformed JSON | Check webhook body format |

---

Most issues are:
1. Missing `.env` file ? Create it
2. Wrong API key ? Regenerate from OpenAI
3. Port in use ? Use different port
4. Dependency missing ? Run npm install

Try these three things first! ??
