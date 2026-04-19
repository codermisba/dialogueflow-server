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
  client = new SessionsClient({
    keyFilename: "iron-flash-491913-r5-4a6fe7867d2e.json", // local JSON file
  });
  console.log("Dialogflow client initialized with local JSON file.");
} catch (err) {
  console.error("Failed to initialize Dialogflow client:", err);
  process.exit(1);
}

app.post("/api/dialogflow", async (req, res) => {
  const { text } = req.body;
  console.log("Received text:", text);

  const sessionPath = client.projectAgentSessionPath(
    "iron-flash-491913-r5", // project_id from your JSON
    "local-session-" + Date.now()
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
let reply = result.fulfillmentText || "";
let suggestions = [];
let links = [];

if (result.fulfillmentMessages) {
  result.fulfillmentMessages.forEach(msg => {
    // Text replies
    if (msg.text && msg.text.text.length > 0) {
      reply = msg.text.text[0];
    }
    if (msg.simpleResponses && msg.simpleResponses.simpleResponses.length > 0) {
      reply = msg.simpleResponses.simpleResponses[0].textToSpeech;
    }

    // Suggestion chips
    if (msg.suggestions && msg.suggestions.suggestions) {
      msg.suggestions.suggestions.forEach(opt => {
        if (opt.title) suggestions.push(opt.title);
      });
    }

    // ✅ Link-out suggestions
    if (msg.linkOutSuggestion && msg.linkOutSuggestion.destinationName && msg.linkOutSuggestion.uri) {
      links.push({
        name: msg.linkOutSuggestion.destinationName,
        url: msg.linkOutSuggestion.uri
      });
    }

    // Custom Payload richContent chips
    if (msg.payload && msg.payload.fields && msg.payload.fields.richContent) {
      const richContent = msg.payload.fields.richContent.listValue.values;
      richContent.forEach(block => {
        const items = block.listValue.values;
        items.forEach(item => {
          if (item.structValue.fields.type.stringValue === "chips") {
            const options = item.structValue.fields.options.listValue.values;
            options.forEach(opt => {
              suggestions.push(opt.structValue.fields.text.stringValue);
            });
          }
        });
      });
    }
  });
}

console.log("Dialogflow reply:", reply);
console.log("Suggestions:", suggestions);
console.log("Links:", links);

console.log("Raw fulfillmentMessages:", JSON.stringify(result.fulfillmentMessages, null, 2));


// ✅ Return links along with reply and suggestions
res.json({ reply, suggestions, links });

  } catch (err) {
    console.error("Dialogflow error:", err.message, err);
    res.status(500).json({ reply: "Error contacting Dialogflow." });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});

