// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; 
import { SessionsClient } from "@google-cloud/dialogflow";

console.log("Starting Dialogflow server...");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // <-- allow requests from your React frontend

let client;
try {
  // Load service account JSON directly for local testing
  client = new SessionsClient({
    keyFilename: "iron-flash-491913-r5-4a6fe7867d2e.json"
  });
  console.log("Dialogflow client initialized.");
} catch (err) {
  console.error("Failed to initialize Dialogflow client:", err);
  process.exit(1);
}

app.post("/api/dialogflow", async (req, res) => {
  const { text } = req.body;
  console.log("Received text:", text);

  const sessionPath = client.projectAgentSessionPath(
    "iron-flash-491913-r5", // project_id from your JSON
    "local-session" // session ID
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
    console.error("Dialogflow error:", err.message,err);
    res.status(500).json({ reply: "Error contacting Dialogflow." });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
