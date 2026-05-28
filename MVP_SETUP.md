# Ava Phone Agent - MVP Setup Guide

## What's New in This MVP

This implementation adds the ability to:
1. ? **Guide the conversation** - Agent follows a specific flow: Greeting ? Name ? Email ? Reason ? Submit
2. ? **Extract details** - Automatically captures caller's name, email, and reason for calling
3. ? **Send to make.com** - Submits collected data to your make.com webhook for email sending

## How It Works

### Agent Flow
1. Agent greets caller warmly
2. Asks for caller's name
3. Asks for caller's email
4. Asks what they're calling about
5. When all info is collected, calls the `submit_contact` tool
6. Tool sends data to make.com webhook
7. Agent thanks caller and confirms submission

### Language Support
- ? Automatically detects English vs Chinese
- ? Responds in the same language as the caller
- ? Handles language mixing naturally

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env` file (copy from `.env.example`):
```bash
PORT=3000
OPENAI_API_KEY=sk-xxxxx
MAKE_WEBHOOK_URL=https://hook.us2.make.com/xxxxxxx
```

### 3. Get Your make.com Webhook URL
1. Go to your make.com flow
2. Add an HTTP webhook trigger module
3. Copy the webhook URL
4. Paste it in `.env` as `MAKE_WEBHOOK_URL`

### 4. Set Up Twilio
1. Create a Twilio voice webhook pointing to: `https://yourdomain.com/twilio/voice`
2. Your phone number should be configured to POST to this endpoint

### 5. Start the Server
```bash
npm start
```

## Data Sent to make.com

When the agent collects information, it sends this JSON to your webhook:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "reason": "Interested in your services",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Customization Options

### Change the agent's personality
Edit the `instructions` in `server.js` line ~117 to modify how the agent behaves

### Change what information is collected
Edit the `tools` definition in `server.js` (around line ~155) to add/remove fields

### Change the greeting message
Edit line ~187 to customize the initial greeting

## Example Conversation Flow

**Caller:** Calls in
**Agent:** "Hi! This is Ava from Standard Business. What's your name?"
**Caller:** "I'm Sarah"
**Agent:** "Nice to meet you Sarah! What's the best email to reach you?"
**Caller:** "sarah@company.com"
**Agent:** "Great! What are you calling about today?"
**Caller:** "I want to learn more about your plans"
**Agent:** [Calls submit_contact tool with name, email, reason]
**Agent:** "Thank you for that information Sarah! I've submitted your details and someone will reach out to you soon."

## Troubleshooting

### Agent not collecting information
- Check console logs for OpenAI errors
- Verify `OPENAI_API_KEY` is correct
- Make sure the realtime model is available in your OpenAI account

### Data not reaching make.com
- Check the `MAKE_WEBHOOK_URL` in your `.env`
- Look at console logs for webhook response status
- Verify your make.com flow is set to accept JSON

### Language detection not working
- The agent detects language from caller speech
- Ensure your OpenAI API key supports the realtime model
- Test with clear speech in each language

## Next Steps (Future Enhancements)

- Add more tools (calendar booking, CRM integration, etc.)
- Store call recordings or transcripts
- Add callback functionality
- Create different flows for different dial options
- Add sentiment analysis to route urgent calls
