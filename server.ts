import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body decoding with 20MB limit for base64 snapshots
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint to process captured image, decide/apply style, and generate image & poem
app.post("/api/stylize", async (req, res) => {
  try {
    const { image, styleOverride, weirdnessLevel = "normal" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing snapshot image data." });
    }

    // Clean up base64 image data
    const parts = image.split(";base64,");
    const mimeType = parts[0].split(":")[1] || "image/jpeg";
    const base64Data = parts[1] || image;

    // We use gemini-3.5-flash for analyzing the image, deciding art style, and generating the poem
    const model = "gemini-3.5-flash";

    // Build critical art analysis prompt
    const instructions = `
You are an eccentric, elite Parisian art critic named Jean-Pierre. You wear a black beret, sip espresso, and speak with an incredibly thick, cartoonish French accent.
You have been asked to analyze a photograph snapped by a user, translate/stylize it into a magnificent, famous art style or artist, and then compose a passionate poem critique about this brand new masterwork with a thick phonetic French accent.

Analyze the user's photo and produce a direct structured JSON response containing:
1. "detectedSubject": A brief, graceful description of the primary object or scene in the photo (e.g. "a ceramic coffee cup resting on a rustic wood surface").
2. "artStyleDecided": A famous, distinct art style or specific historical artist (e.g., "Vincent van Gogh's Swirling Post-Impressionism", "Pablo Picasso's Cubism", "Claude Monet's Impressionism", "Katsushika Hokusai's Ukiyo-e", "Salvador Dalí's Mind-boggling Surrealism", "Yayoi Kusama's Polka-Dot Obliteration", "Keith Haring's Neo-Expressionist Pop Art").
   - IMPORTANT: If a custom style override is provided ("${styleOverride || ""}"), you MUST respect this override and use it as the declared style!
3. "imageGenerationPrompt": A highly descriptive, painterly, vivid text description that can be fed into an image generator to create this new masterpiece.
   - It should describe a polished, completed work of art featuring the 'detectedSubject' rendered entirely within the chosen or overridden style of 'artStyleDecided'.
   - Describe lighting, color palette, custom textures (thick impasto, digital vectors, gold foil details, flat graphic lines), and composition based on the original.
   - Address the weirdness factor: "${weirdnessLevel}".
     - If weirdness is "normal", stay faithful to the genuine aesthetic of the art style.
     - If weirdness is "weirder", inject whimsical, bizarre, or slightly surreal twists (e.g. swirling cosmic clouds, glowing eyes, clock-melting furniture, flying dream-like structures) to make the painting eccentric, but keep the subject recognizable.
     - If weirdness is "extremely-weird", turn it into an absolute fever-dream of psychedelic abstraction, melting geometries, floating bioluminescent creatures, gravity-defying details, and absurd surrealist comedy while the shape of the original item is humorously discernible.
   - DO NOT mention "original snapshot" or "the user's camera photo" in this prompt. Describe the finished, professional artwork.
4. "poemAccentFrench": A passionate, funny 3-stanza poem (about 12 lines total) praising this brand-new masterpiece.
   - The poem MUST be written in English but spelled and phrased with an incredibly strong, thick phonetic French accent!
   - Use French vocalizations and spelling variations, e.g., "ze" (the), "zis" (this), "zose" (those), "vairy" (very), "brooshstroke" (brushstroke), "painteeng" (painting), "magnifique", "mon cher", "c'est magnifique", "sacré bleu", "hon-hon-hon", "nature-morte", "majestique".
   - Make it sound like you are passionately gesturing with your hands, completely blown away by the genius of this brand new artwork. Include line breaks (\\n) in the string for graceful display.
`;

    // Process analysis
    const analysisResponse = await ai.models.generateContent({
      model: model,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        instructions,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedSubject: {
              type: Type.STRING,
              description: "A short, literal description of what is in the photo.",
            },
            artStyleDecided: {
              type: Type.STRING,
              description: "The name of the famous artist/style to apply.",
            },
            imageGenerationPrompt: {
              type: Type.STRING,
              description: "Highly detailed painting prompt emphasizing style and weirdness if requested.",
            },
            poemAccentFrench: {
              type: Type.STRING,
              description: "Lovely dramatic poem with heavy phonetic French spelling and accent.",
            },
          },
          required: ["detectedSubject", "artStyleDecided", "imageGenerationPrompt", "poemAccentFrench"],
        },
      },
    });

    const resultText = analysisResponse.text;
    if (!resultText) {
      throw new Error("Failed to retrieve analysis from GenAI.");
    }

    const analysis = JSON.parse(resultText);
    const { artStyleDecided, imageGenerationPrompt, poemAccentFrench, detectedSubject } = analysis;

    console.log("Subject:", detectedSubject);
    console.log("Style applied:", artStyleDecided);
    console.log("Generating image with prompt:", imageGenerationPrompt);

    // Call Image Generator using gemini-2.5-flash-image (default model for general image tasks)
    let generatedBase64 = "";
    try {
      console.log("Attempting image generation using gemini-2.5-flash-image...");
      const imgRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: imageGenerationPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });
      
      let foundImage = false;
      if (imgRes.candidates?.[0]?.content?.parts) {
        for (const part of imgRes.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedBase64 = `data:image/png;base64,${part.inlineData.data}`;
            foundImage = true;
            break;
          }
        }
      }
      if (!foundImage) {
        throw new Error("The image generation model did not return any image data parts.");
      }
    } catch (err: any) {
      console.error("Image generation failed with:", err.message || err);
      // Construct a premium/paid-plan-aware user-friendly error message if it's a quota or billing problem
      const errorMsg = err.message || JSON.stringify(err);
      if (
        errorMsg.includes("quota") || 
        errorMsg.includes("Quota exceeded") || 
        errorMsg.includes("paid plans") ||
        errorMsg.includes("billing") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        throw new Error(
          "PAID_PLAN_REQUIRED: Ah, mon ami! Generating fine art requires a paid Gemini API Key or a billing plan inside AI Studio. Please tap the Settings button in your AI Studio top-right, go to Secrets, and link/select a paid API key."
        );
      } else {
        throw new Error(`Artistic rendition failed: ${errorMsg}`);
      }
    }

    // Return the successful package
    res.json({
      detectedSubject,
      artStyleDecided,
      poem: poemAccentFrench,
      generatedImageUrl: generatedBase64,
      imageGenerationPrompt,
    });

  } catch (error: any) {
    console.error("Error in /api/stylize endpoint:", error);
    res.status(500).json({
      error: error.message || "A catastrophic artistic breakdown occurred inside ze server kitchen.",
    });
  }
});

// Setup Vite & static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development server with hot module replacement routing
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server linked as Express middleware.");
  } else {
    // Serving built production static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express full-stack server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to boot full-stack server:", err);
});
