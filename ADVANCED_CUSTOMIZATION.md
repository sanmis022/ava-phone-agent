# Advanced Customization Guide

## 1. Collecting Additional Information

### Add Phone Number Field

Edit `server.js` - in the `tools` section (~line 155), update properties:

```javascript
properties: {
  name: {
    type: "string",
    description: "Caller's full name"
  },
  email: {
    type: "string",
    description: "Caller's email address"
  },
  phone: {
    type: "string",
    description: "Caller's phone number"
  },
  reason: {
    type: "string",
    description: "Reason for calling or inquiry subject"
  }
}
```

And add phone to required fields:
```javascript
required: ["name", "email", "phone", "reason"]
```

Then update agent instructions to ask for phone:
```
2. Greet the caller warmly in their language
3. Ask for their name
4. Ask for their phone number
5. Ask for their email address
6. Ask what they're calling about (briefly)
7. When you have name, email, phone, and reason - call the submit_contact tool
```

### The Tool Will Now Include Phone

```javascript
// In handleToolCall function, the args will have:
{
  name: "John",
  email: "john@email.com",
  phone: "+1234567890",
  reason: "Interested in pricing"
}
```

## 2. Different Response Behaviors

### Make Agent Ask Custom Questions

Change the initial response (line ~187):
```javascript
// Instead of:
instructions: "Greet the caller warmly and ask for their name."

// Use:
instructions: "Answer the caller's question about our services first, then collect their contact info."
```

### Add Context from URL Parameters

You can pass context when Twilio calls your endpoint. Modify:

```javascript
app.post("/twilio/voice", (req, res) => {
  const host = req.headers.host;
  const context = req.query.context || "general"; // e.g., /twilio/voice?context=sales
  
  // Use context when setting up OpenAI session
  // ...
  instructions: `Your context: ${context}. ...`
```

### Different Agent Personalities

Create multiple instruction sets:

```javascript
const instructions = {
  sales: "You are a friendly sales representative...",
  support: "You are a helpful support specialist...",
  billing: "You are a professional billing coordinator..."
};

// Then use in session:
instructions: instructions[callContext]
```

## 3. Multiple Tool Actions

### Add a Scheduling Tool

```javascript
tools: [
  {
    type: "function",
    name: "submit_contact",
    // ... existing tool
  },
  {
    type: "function",
    name: "schedule_appointment",
    description: "Schedule an appointment with a team member",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string" },
        preferred_time: { type: "string" },
        timezone: { type: "string" }
      },
      required: ["email", "preferred_time"]
    }
  }
]
```

Then handle both tools in `handleToolCall`:

```javascript
async function handleToolCall(event, openaiWs) {
  const toolCall = event.response;
  
  if (toolCall.name === "submit_contact") {
    // existing code
  } else if (toolCall.name === "schedule_appointment") {
    const args = JSON.parse(toolCall.arguments);
    // Handle scheduling
    // POST to make.com or calendar API
  }
}
```

## 4. Store Conversation History

### Save Transcript to Database

```javascript
// Add at top of wss.on("connection")
let transcript = [];

// In twilioWs.on("message"):
if (data.event === "media") {
  // Could log audio chunks here
}

// In openaiWs.on("message"):
if (event.type === "response.text.done") {
  transcript.push({
    role: "assistant",
    text: event.text,
    timestamp: new Date()
  });
}

// When storing:
if (data.event === "stop") {
  // Save transcript to database/file
  console.log("Transcript:", JSON.stringify(transcript));
  
  // Could POST to make.com here too
  await fetch(process.env.TRANSCRIPT_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ transcript, streamSid })
  });
}
```

## 5. Conditional Workflows

### Route Based on Reason

Make your make.com webhook receive the reason, then:

In make.com, add a router module:

```
Webhook ? Router
         ?? "Sales" ? Send to Sales Queue
         ?? "Support" ? Send to Support Team  
         ?? "Billing" ? Send to Billing Dept
```

Or do the routing in your Node.js:

```javascript
// In handleToolCall:
const args = JSON.parse(toolCall.arguments);
const webhookUrl = getWebhookByReason(args.reason);

await fetch(webhookUrl, {
  method: "POST",
  body: JSON.stringify(args)
});
```

## 6. Advanced: Multi-Language Transcription

Currently the agent responds in detected language. To also get transcripts in original language:

```javascript
// Listen for transcription events from OpenAI
if (event.type === "conversation.item.input_audio_transcription.completed") {
  console.log("Transcription:", event.item.input.transcript);
  transcript.push({
    role: "user",
    text: event.item.input.transcript
  });
}
```

## 7. Error Handling & Retry Logic

### Retry Failed Webhook Calls

```javascript
async function retryWebhook(url, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (response.ok) return response;
      
      if (i < maxRetries - 1) {
        // Wait before retry: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    } catch (err) {
      if (i === maxRetries - 1) throw err;
    }
  }
}

// Use in handleToolCall:
await retryWebhook(makeWebhookUrl, {
  name: args.name,
  email: args.email,
  reason: args.reason
});
```

## 8. Custom Audio Settings

### Change Voice

```javascript
session: {
  // ...
  audio: {
    output: {
      format: { type: "audio/pcmu" },
      voice: "shimmer"  // Options: alloy, echo, fable, onyx, nova, shimmer
    }
  }
}
```

### Adjust Voice Activity Detection

```javascript
input: {
  format: { type: "audio/pcmu" },
  turn_detection: {
    type: "server_vad",
    silence_duration_ms: 1000  // Increase for longer pauses
  }
}
```

## 9. A/B Testing Different Agents

Create different agents for testing:

```javascript
const agents = {
  control: { instructions: "Standard greeting...", voice: "alloy" },
  test_a: { instructions: "Friendly greeting...", voice: "nova" },
  test_b: { instructions: "Professional greeting...", voice: "shimmer" }
};

// In webhook, pass ?agent=test_a
const selectedAgent = agents[req.query.agent || "control"];
```

## 10. Logging & Monitoring

### Structured Logging

```javascript
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...data
  }));
}

// Usage:
log("info", "Tool called", {
  toolName: "submit_contact",
  email: args.email,
  streamSid
});

log("error", "Webhook failed", {
  reason: error.message,
  url: webhookUrl
});
```

---

These customizations can be mixed and matched to create your ideal workflow!
