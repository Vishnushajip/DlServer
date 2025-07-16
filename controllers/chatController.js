import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

const serviceAccount = JSON.parse(
  fs.readFileSync(
    "./dland-1ad12-firebase-adminsdk-fbsvc-ea2e6dfb8f.json",
    "utf8"
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_NAME,
  });
}

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.VERTEX_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const chatWithAI = async (req, res) => {
  const userQuery = req.body.query;

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const snapshot = await db
      .collection("properties")
      .select("name", "price", "bhk", "location", "propertyDescription", "images")
      .get();

    const properties = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        location: data.location || "N/A",
        price: data.price || "N/A",
        bhk: data.bhk || "N/A",
        description: (data.propertyDescription || "N/A").slice(0, 120),
        image: data.images?.[0] || null,
      };
    });

    const propertyContext = properties
      .map(
        (prop) => `Property ID: ${prop.id}
Name: ${prop.name}
Location: ${prop.location}
Price: ₹${prop.price}
BHK: ${prop.bhk}
Description: ${prop.description}
Image: ${prop.image}
---`
      )
      .join("\n");

    const prompt = `
You are Dreamie, the official AI assistant for Dreams Land Realty.

Instructions:
- Understand the user's query and match with the property list.
- Filter only relevant properties if user specifies location or budget or type.
- Always return valid clean JSON in below format.
- DO NOT explain anything outside the JSON structure.
- DO NOT wrap JSON in strings.

If relevant properties found, respond like:
{
  "response": {
    "type": "property_list",
    "message": "short summary of matching properties",
    "properties": [
      {
        "id": "property_id",
        "name": "property_name",
        "location": "property_location or 'N/A'",
        "price": "property_price or 'N/A'",
        "bhk": "BHK_count or 'N/A'",
        "description": "short_description or 'N/A'",
        "image": "first_image_url or null"
      }
    ],
    "contact_info": {
      "message": "For more details or to schedule viewings:",
      "phone": "6238061066",
      "email": "info@dreamslandrealty.com",
      "whatsapp": "Available",
      "help_support": "Visit your profile's Help & Support section to raise queries"
    }
  }
}

If the user asks a general question (e.g., about company or services), respond like:
{
  "response": {
    "type": "general_info",
    "message": "Your helpful answer here...",
    "contact_info": {
      "phone": "6238061066",
      "email": "info@dreamslandrealty.com",
      "whatsapp": "Available",
      "help_support": "Visit your profile's Help & Support section to raise queries"
    }
  }
}

Company Info:
- Location: AllKerala
- Services: Buying/Selling Residential & Commercial Properties, Rental Listings, Land Sales, Consultation

Available Properties:
${propertyContext}

User Query: ${userQuery}
    `.trim();

    const stream = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    });

    let responseText = "";
    for await (const chunk of stream.stream) {
      const text = chunk.text();
      responseText += text;
      res.write(`data: ${text}\n\n`);
    }

    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error("❌ Server Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        response: {
          type: "general_info",
          message: "Something went wrong. Please try again.",
          contact_info: {
            phone: "6238061066",
            email: "info@dreamslandrealty.com",
            whatsapp: "Available",
            help_support: "Visit your profile's Help & Support section to raise queries"
          }
        }
      });
    }
  }
};
