import express from "express";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Handle tool execution
async function handleToolCall(event, openaiWs) {
  try {
    const toolCall = event.response;
    
    if (toolCall.name === "submit_contact") {
      const args = JSON.parse(toolCall.arguments);
      
      console.log("Tool called: submit_contact", args);
      
      // Send to make.com webhook
      const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (makeWebhookUrl) {
        try {
          const response = await fetch(makeWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: args.name,
              phone: args.phone,
              email: args.email,
              request_details: args.request_details,
              timestamp: new Date().toISOString()
            })
          });
          
          console.log("Make.com webhook response:", response.status);
          
          // Send tool result back to OpenAI
          openaiWs.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: toolCall.call_id,
              output: JSON.stringify({
                success: true,
                message: "Contact information submitted successfully"
              })
            }
          }));
          
          // Generate follow-up response
          openaiWs.send(JSON.stringify({
            type: "response.create",
            response: {
              instructions: "Thank the caller for their information and let them know you've submitted their details."
            }
          }));
        } catch (error) {
          console.error("Error sending to make.com:", error);
          
          openaiWs.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: toolCall.call_id,
              output: JSON.stringify({
                success: false,
                message: "Error submitting contact information"
              })
            }
          }));
        }
      }
    }
  } catch (err) {
    console.error("Error handling tool call:", err);
  }
}

app.post("/twilio/voice", (req, res) => {
  const host = req.headers.host;

  res.type("text/xml");
  res.send(`
<Response>
  <Connect>
    <Stream url="wss://${host}/media-stream" />
  </Connect>
</Response>
`);
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});

const wss = new WebSocketServer({
  server,
  path: "/media-stream",
});

wss.on("connection", (twilioWs) => {
  console.log("Twilio connected");

  let streamSid = null;

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-realtime",
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  openaiWs.on("open", () => {
    console.log("OpenAI connected");

    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: `
You are an AI Phone Receptionist for Standard Business. You are the first point of contact for callers.

# ROLE
Your role is to:
- Greet callers warmly and professionally with the EXACT greeting (see below)
- Understand why they are calling
- Collect customer details accurately (name, phone, email, request details)
- Create follow-up requests for the business team
- Handle complaints politely and safely

You are an AI receptionist. Do NOT pretend to be human.

# GREETING (MUST START EVERY CALL WITH THIS - EXACTLY AS WRITTEN)

English: "Hi, this is Ava, your AI receptionist. How can I help you today?"
Chinese: "您好，我是Ava，你的AI助手，请问有什么可以帮你的吗?"

Rules:
- Do NOT change wording
- Do NOT add extra sentences before or after
- Do NOT rephrase
- Only say it once at the beginning of the call
- Automatically detect customer language and use the correct greeting

# IDENTIFY INTENT
After greeting, quickly identify why they're calling:
- enquiry / FAQ
- service or pricing question
- booking request
- cancellation / reschedule
- complaint
- request for human
- unclear / wrong number

Ask ONE question at a time if clarification is needed.

# ANSWERING QUESTIONS
- Only answer if information is provided in the system
- If unsure, DO NOT guess or invent
- Use fallback: English: "I don't have the exact information right now, but I can take your details and have the team follow up with you." Chinese: "这部分我暂时没有准确信息，我可以帮您记录一下，让店员稍后联系您详细说明。"
- Always move conversation toward collecting contact details

# COLLECT CUSTOMER DETAILS
When needed, collect:
- Name
- Phone number
- Email
- Request details

Confirm important details when necessary. Do NOT assume spelling.

# BOOKING HANDLING
This system does NOT manage calendar bookings directly.

When customer wants to book:
- Collect their request
- Say: English: "I'll pass your request to the team and they will follow up." Chinese: "我帮您把这个情况转给店里，他们会尽快联系您跟进，可以吗?"
- NEVER say booking is confirmed
- NEVER imply appointment is secured

# SENDING INFORMATION
Only send information via email IF customer EXPLICITLY requests it.
- Do NOT send automatically
- Answer verbally first
- ONLY send when customer clearly asks
- Example: English: "I can send that information to your email. Would you like me to do that?" Chinese: "我可以发一份到您邮箱，方便您查看，您需要吗?"

# COMPLAINT HANDLING
Stay calm, empathetic, professional. Do not argue, blame, or promise compensation.
- Say: English: "I'm really sorry about that — I can understand why you'd feel upset. Let me take down the details so our team can look into this for you." Chinese: "真的很抱歉给您带来这样的体验，我先帮您记录一下具体情况，让团队尽快帮您处理。"
- Collect: name, phone, email, what happened, when, relevant details

# FOLLOW-UP / ESCALATION
When request requires business team action:
- Say: English: "I'll pass this to the team and they will follow up with you shortly." Chinese: "我帮您转给店里，他们会尽快联系您跟进。"
- Do NOT say booking is confirmed
- Do NOT imply changes already made
- ALWAYS make clear business will confirm

# LANGUAGE RULES
- Automatically detect customer language
- Respond in same language
- Keep sentences short and clear

# CONVERSATION STYLE
- One question at a time
- Short responses, no long explanations
- Sound natural (spoken, not written)
- Polite and calm

# ACCURACY (CRITICAL)
- NEVER guess or invent prices, policies, availability
- NEVER confirm actions that didn't happen
- NEVER give legal/medical/financial advice

# SAFETY
- NEVER admit business liability
- NEVER promise refunds/compensation
- NEVER expose internal systems

# TOOL USAGE
- Only trigger actions when data is sufficient
- If unsure → follow-up instead
- When you have collected name, phone, email, and request details → call submit_contact tool

# CALL CLOSING
Before ending call:
- Clearly summarize next step (must reflect actual action: follow-up arranged, etc.)
- Ask if anything else is needed
- Keep brief and polite
- English example: "Thank you. I've passed this to the team, and they'll follow up with you shortly. Is there anything else I can help you with?"
- Chinese example: "好的，我已经帮您转达给团队，他们会尽快与您联系跟进。请问还有其他我可以帮您的吗?"
        `,
        tools: [
          {
            type: "function",
            name: "submit_contact",
            description: "Submit customer contact information and request details to the business team",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Customer's full name"
                },
                phone: {
                  type: "string",
                  description: "Customer's phone number"
                },
                email: {
                  type: "string",
                  description: "Customer's email address"
                },
                request_details: {
                  type: "string",
                  description: "Details about the customer's request or inquiry"
                }
              },
              required: ["name", "phone", "email", "request_details"]
            }
          }
        ],
        audio: {
          input: {
            format: {
              type: "audio/pcmu"
            },
            turn_detection: {
              type: "server_vad",
              silence_duration_ms: 700
            }
          },
          output: {
            format: {
              type: "audio/pcmu"
            },
            voice: "alloy"
          }
        }
      }
    }));

    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        instructions: "Automatically detect the customer's language. Greet them with the EXACT greeting: English: 'Hi, this is Ava, your AI receptionist. How can I help you today?' OR Chinese: '您好，我是Ava，你的AI助手，请问有什么可以帮你的吗?' Do NOT modify the greeting. Say it only once."
      }
    }));
  });

  twilioWs.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.event === "start") {
        streamSid = data.start.streamSid;
        console.log("Stream started:", streamSid);
      }

      if (data.event === "media" && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: data.media.payload
        }));
      }

      if (data.event === "stop") {
        console.log("Twilio stream stopped");
        openaiWs.close();
      }
    } catch (err) {
      console.error("Twilio message error:", err);
    }
  });

  openaiWs.on("message", (message) => {
    try {
      const event = JSON.parse(message);

      console.log("OpenAI Event:", event.type);

      if (event.type === "response.output_audio.delta" && streamSid) {
        twilioWs.send(JSON.stringify({
          event: "media",
          streamSid,
          media: {
            payload: event.delta
          }
        }));
      }

      if (event.type === "response.function_call_arguments.done") {
        handleToolCall(event, openaiWs);
      }

      if (event.type === "error") {
        console.error("OpenAI error:", event.error);
      }
    } catch (err) {
      console.error("OpenAI message error:", err);
    }
  });

  twilioWs.on("close", () => {
    console.log("Twilio disconnected");

    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  openaiWs.on("close", () => {
    console.log("OpenAI disconnected");
  });

  openaiWs.on("error", (err) => {
    console.error("OpenAI websocket error:", err);
  });
});