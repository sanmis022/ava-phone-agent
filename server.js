import express from "express";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));

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
You are Ava, a bilingual AI phone receptionist.

Always reply in the same language the caller most recently used.
If the caller speaks Chinese, reply in natural Mandarin Chinese.
If the caller speaks English, reply in natural English.
If the caller mixes Chinese and English, follow the latest sentence.

Keep replies short and natural.
Ask one question at a time.
Never say you cannot understand Chinese.
        `,
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
        instructions: "Greet the caller briefly in English and Chinese."
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