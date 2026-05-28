# Quick Reference Guide

## ?? Setup (Copy-Paste)

### Step 1: Install
```bash
npm install
```

### Step 2: Create .env
```bash
# Copy this to your .env file
PORT=3000
OPENAI_API_KEY=sk-xxxx (get from openai.com)
MAKE_WEBHOOK_URL=https://hook.us2.make.com/xxxx (from make.com)
```

### Step 3: Run
```bash
npm start
```

### Step 4: Call
- Call your Twilio number
- Complete the flow
- Check console for "Tool called: submit_contact"

## ?? What Agent Does

```
Greeting     ? "Hi! What's your name?"
Get Name     ? "Nice to meet you John! What's your email?"
Get Email    ? "Thanks! What are you calling about?"
Get Reason   ? [Collects all info]
Submit       ? "I've submitted your details. Someone will reach out!"
```

## ?? Data Flow

```
Call ? Audio to OpenAI ? Agent Responds
?
Agent Collects:
  - Name
  - Email  
  - Reason

Agent calls tool submit_contact
?
Server POSTs to make.com:
  {
    "name": "John Doe",
    "email": "john@email.com",
    "reason": "Want pricing info",
    "timestamp": "2024-01-15T..."
  }
?
make.com webhook receives ? Email sent
```

## ?? Customize in 30 Seconds

### Change greeting
Edit `server.js` line 187:
```javascript
instructions: "Greet the caller warmly and ask for their name."
```

### Change what to ask
Edit `server.js` lines 119-132 (CONVERSATION FLOW section)

### Change what to collect
Edit `server.js` lines 156-172 (properties section)

## ?? Check If Working

### Console Should Show:
```
Server running on port 3000
Twilio connected
OpenAI connected
Stream started: xxxxx
Tool called: submit_contact { name: '...', email: '...', reason: '...' }
Make.com webhook response: 200
```

### Check make.com:
- Look at webhook execution logs
- Should see POST with name/email/reason
- Check email got sent

## ? Quick Fixes

| Problem | Fix |
|---------|-----|
| `Cannot find module` | Run: `npm install` |
| `MAKE_WEBHOOK_URL undefined` | Update `.env` |
| `Authorization failed` | Check OPENAI_API_KEY |
| `Port 3000 in use` | Change PORT in `.env` |
| `Agent doesn't talk` | Check OpenAI key is correct |
| `No tool called message` | Speak clearly, complete conversation |

## ?? File Locations

| What | Where |
|------|-------|
| Main code | `server.js` |
| Dependencies | `package.json` |
| Config | `.env` (create from .env.example) |
| Instructions | `server.js` lines 119-135 |
| Tool definition | `server.js` lines 149-174 |
| Webhook handler | `server.js` lines 12-49 |

## ?? Languages

- **English** - Automatic detection + response ?
- **Mandarin Chinese** - Automatic detection + response ?
- **Mixed** - Responds in most recent language ?

## ?? Common Customizations

### Add Phone Field
1. Edit tool properties (add phone)
2. Edit required fields (add phone)
3. Edit instructions (ask for phone)
4. Data will now include phone ?

### Change Agent Name
Replace "Ava" with your name in instructions

### Change Business Name
Replace "Standard Business" with your company

### Different Voices
Change `voice: "alloy"` to: shimmer, echo, nova, fable, onyx

## ?? Example Implementation

### 1-Minute Setup
```bash
npm install
# Edit .env with your keys
npm start
# Make test call
```

### 5-Minute Customization
```javascript
// Edit server.js lines 119-132
// Change "What's your name?" to your greeting
// Change "Ask about product" to what you want
```

### 15-Minute Full Test
```bash
npm install
npm start
Call number
Verify in make.com logs
Check email received
```

## ?? make.com Setup

1. Create new scenario
2. Add HTTP Webhook (webhooks ? custom)
3. Copy webhook URL
4. Paste in `.env` as `MAKE_WEBHOOK_URL`
5. Add email module
6. Map fields: `{{1.name}}`, `{{1.email}}`, `{{1.reason}}`
7. Publish scenario
8. Done ?

## ?? Environment Variables

```
# Required
PORT=3000
OPENAI_API_KEY=sk-xxxxx
MAKE_WEBHOOK_URL=https://hook.us2.make.com/xxxxx
```

Copy from:
- OpenAI: Settings ? API keys
- make.com: Create webhook ? Copy URL
- Port: Any free port (usually 3000)

## ?? Testing Checklist

- [ ] npm install succeeds
- [ ] Server starts: `npm start`
- [ ] "Server running" in console
- [ ] Can call Twilio number
- [ ] Agent says hello
- [ ] Agent asks for name
- [ ] Agent asks for email
- [ ] Agent asks for reason
- [ ] "Tool called" message appears
- [ ] make.com receives webhook
- [ ] Email arrives

## ?? Emergency Reset

If something breaks:
```bash
# Kill server (Ctrl+C)
# Delete node_modules
rm -rf node_modules

# Reinstall
npm install

# Check setup
node verify-setup.js

# Try again
npm start
```

## ?? Live Example

**Caller**: Calls number
**Agent**: "Hi! What's your name?"
**Caller**: "Sarah"
**Agent**: "Hi Sarah! What's your email?"
**Caller**: "sarah@company.com"
**Agent**: "What are you calling about?"
**Caller**: "Pricing information"
**Agent**: [Submits to make.com]
**Agent**: "Thanks! You'll hear from us soon."
[Email sent to sarah@company.com] ?

## ?? Success = 3 Things

1. **Server runs** - "Server running on port 3000"
2. **Agent works** - Says hello when you call
3. **Data flows** - "Tool called" in console + make.com receives it

If you have these 3, you're done. ?

## ?? Need Help?

1. Check logs: `npm start` shows everything
2. Run verify: `node verify-setup.js`
3. Read TROUBLESHOOTING.md
4. Check QUICK_START.md
5. See ADVANCED_CUSTOMIZATION.md

## One More Thing

This is production-ready code. You can:
- ? Deploy to any Node.js server
- ? Add more fields easily
- ? Integrate with CRM
- ? Add multiple tools
- ? Create different agents

Start simple. Iterate later.

---

**That's it. You got this.** ??
