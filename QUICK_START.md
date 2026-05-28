# Quick Start Guide

## What Changed

Your Twilio + OpenAI phone agent now includes:

? **Defined Conversation Flow**: Agent follows: Greet ? Get Name ? Get Email ? Get Reason ? Submit

? **Tool Integration**: When agent collects all info, it automatically calls a tool

? **make.com Webhook**: Data gets sent to your make.com flow for email sending

## Setup (5 mins)

### 1. Update `.env` file
```
PORT=3000
OPENAI_API_KEY=your_openai_key
MAKE_WEBHOOK_URL=your_make.com_webhook_url
```

### 2. Install new dependency
```bash
npm install
```

### 3. Run it
```bash
npm start
```

## How Data Flows to make.com

```
Phone Call
    ?
Twilio receives audio
    ?
OpenAI processes + gathers: name, email, reason
    ?
When complete: Agent calls submit_contact tool
    ?
Tool sends JSON to make.com webhook:
   {
     "name": "John",
     "email": "john@email.com", 
     "reason": "Want info about plans",
     "timestamp": "2024-01-15T..."
   }
    ?
make.com receives ? Triggers your email flow
    ?
Email sent out ?
```

## Customize Agent Behavior

Edit `server.js` around line 117 (the `instructions` field):

```javascript
instructions: `
You are Ava, a bilingual AI phone receptionist...
// Change this text to modify how agent behaves
`
```

## Add More Fields to Collect

Edit the `tools` definition (line ~155):

```javascript
tools: [
  {
    type: "function",
    name: "submit_contact",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        reason: { type: "string" },
        // ADD MORE FIELDS HERE
        phone: { type: "string" },
        company: { type: "string" }
      },
      required: ["name", "email", "reason"] // Update required fields
    }
  }
]
```

Then update the agent instructions to ask for these new fields!

## Test It

1. Call your Twilio number
2. Agent asks for name ? say your name
3. Agent asks for email ? say your email  
4. Agent asks for reason ? give a reason
5. Agent submits data to make.com ? your email flow triggers

Check console logs for `Tool called: submit_contact` to confirm it worked.

## File Changes Summary

- `server.js` - Added tool definition, handling, and make.com webhook call
- `package.json` - Added `node-fetch` dependency
- `MVP_SETUP.md` - Detailed setup guide
- `.env.example` - Environment variables template
