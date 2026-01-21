
import { GoogleGenAI } from "@google/genai";
import { ItemType, IllustrationStyle, VisualTone } from "../types";

export class GeminiService {
  constructor() {}

  async generateKitItem(
    childImageBase64: string,
    itemType: ItemType,
    config: {
      age?: string;
      features?: string;
      style: IllustrationStyle;
      tone: VisualTone;
      themeImage?: string | null;
    }
  ): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const styleDesc = config.style === 'pixar' 
      ? "Professional 3D Disney/Pixar movie style, high quality render, octane render, soft subsurface scattering, cinematic lighting" 
      : "Professional 2D flat cartoon illustration, clean thick lines, vibrant modern vector art, children's book style";

    const toneDesc = {
      cute: "Soft pastel colors, very sweet and gentle, heart/sparkle elements",
      adventurous: "Dynamic lighting, bold colors, exploration elements, action pose",
      magical: "Glow effects, ethereal lighting, star dust, whimsical atmosphere",
      fun: "Bright saturated colors, funny expression, festive and high energy"
    }[config.tone];

    let itemPrompt = "";
    switch (itemType) {
      case 'character':
        itemPrompt = "Full body standing pose, iconic character design, character concept sheet style. The child should be wearing an outfit directly inspired by the 'theme reference image'.";
        break;
      case 'expressions':
        itemPrompt = "Sheet of 4 different facial expressions of the same child (laughing, surprised, winking, smiling), organized grid. The child must be wearing the themed clothing from the reference.";
        break;
      case 'topper':
        itemPrompt = "Action pose jumping or holding a themed prop from the reference image, perfect for a cake topper, die-cut style, white border.";
        break;
      case 'tags':
        itemPrompt = "Close-up portrait inside a decorative themed frame that matches the ornaments in the 'theme reference image'.";
        break;
      case 'stickers':
        itemPrompt = "Collection of 3 small themed icons/poses of the child, sticker style with white borders, using elements like animals or objects found in the 'theme reference image'.";
        break;
      case 'invitation':
        itemPrompt = "Scenic illustration. Place the child inside a background that perfectly recreates the environment shown in the 'theme reference image'. No text.";
        break;
      case 'age_number':
        itemPrompt = `The child happily hugging or leaning against a large decorative 3D number "${config.age || '?'}", where the number itself is decorated with textures and patterns from the 'theme reference image'.`;
        break;
      case 'panel':
        itemPrompt = "Wide horizontal landscape illustration, cinematic background. An epic expansion of the world shown in the 'theme reference image', with the child as the protagonist.";
        break;
    }

    const themeContext = config.themeImage 
      ? `THEME INTEGRATION: You MUST look at the 'theme reference image' provided. 
         1. CLOTHING: Dress the child in the same style of clothes (e.g., if it's a safari photo, use safari vests and hats).
         2. PROPS: Include objects, animals, or icons seen in that photo.
         3. PALETTE: Use the exact same color scheme.
         The child should look like they are part of THAT specific party world.`
      : "ENVIRONMENT: Use a generic professional and festive party theme style based on the chosen tone.";

    const fullPrompt = `
      TASK: Create a professional illustration of a child.
      
      CHILD REFERENCE: High facial resemblance to the 'child photo provided'. ${config.features ? `Specific facial traits: ${config.features}.` : ""} ${config.age ? `Appears to be ${config.age} years old.` : ""}
      
      ${themeContext}
      
      STYLE & TONE: ${styleDesc}. ${toneDesc}.
      
      ITEM TYPE SPECIFICS: ${itemPrompt}
      
      CRITICAL RULES:
      - ONLY ONE CHILD (EXCEPT FOR THE EXPRESSIONS SHEET).
      - NO TEXT OR NUMBERS (EXCEPT FOR THE 'AGE NUMBER' ITEM).
      - THE CHILD'S FACE MUST BE RECOGNIZABLE FROM THE PHOTO.
      - BACKGROUND: MUST BE PLAIN WHITE for character, topper, tags, stickers, and age_number. Scenic for panel and invitation.
      - HIGH QUALITY, CLEAN, NO DISTORTIONS.
    `;

    try {
      const parts: any[] = [
        { 
          inlineData: { 
            data: childImageBase64.split(',')[1] || childImageBase64, 
            mimeType: 'image/png' 
          } 
        }
      ];

      if (config.themeImage) {
        parts.push({ 
          inlineData: { 
            data: config.themeImage.split(',')[1] || config.themeImage, 
            mimeType: 'image/png' 
          } 
        });
      }

      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { 
          imageConfig: { 
            aspectRatio: itemType === 'panel' ? "16:9" : "1:1" 
          } 
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error generating ${itemType}:`, error);
      return null;
    }
  }
}
