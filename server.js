// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { SessionsClient } from "@google-cloud/dialogflow";

console.log("Starting Dialogflow server...");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // allow requests from your React frontend

let client;
try {
  if (process.env.DIALOGFLOW_CLIENT_EMAIL && process.env.DIALOGFLOW_PRIVATE_KEY) {
    // Render / Production: use environment variables
    client = new SessionsClient({
      credentials: {
        client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
        private_key: process.env.DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      projectId: process.env.DIALOGFLOW_PROJECT_ID,
    });
    console.log("Dialogflow client initialized with environment variables.");
  } else {
    // Local development: use JSON file
    client = new SessionsClient({
      keyFilename: "iron-flash-491913-r5-4a6fe7867d2e.json",
    });
    console.log("Dialogflow client initialized with local JSON file.");
  }
} catch (err) {
  console.error("Failed to initialize Dialogflow client:", err);
  process.exit(1);
}

app.post("/api/dialogflow", async (req, res) => {
  const { text } = req.body;
  console.log("Received text:", text);

  const sessionPath = client.projectAgentSessionPath(
    process.env.DIALOGFLOW_PROJECT_ID || "iron-flash-491913-r5",
    "session-" + Date.now()
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode: "en-US",
      },
    },
  };

  try {
    const responses = await client.detectIntent(request);
    const result = responses[0].queryResult;
    console.log("Dialogflow reply:", result.fulfillmentText);
    res.json({ reply: result.fulfillmentText });
  } catch (err) {
    console.error("Dialogflow error:", err.message, err);
    res.status(500).json({ reply: "Error contacting Dialogflow." });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`✅ Server running on http://localhost:${port}`)
);
