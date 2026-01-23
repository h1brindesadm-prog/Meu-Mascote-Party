
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
      themePrompt?: string;
    }
  ): Promise<string | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const styleDesc = config.style === 'pixar' 
      ? "Professional 3D Disney/Pixar animation style, high-end 3D render, octane render, soft subsurface scattering, cinematic lighting, 4k resolution, voluminous hair, expressive eyes" 
      : "Professional 2D vector flat cartoon illustration, clean thick tapered lines, vibrant modern colors, children's book style, sharp details, minimalist shading";

    const toneDesc = {
      cute: "Soft pastel color palette, sweet and gentle mood, heart and sparkle atmospheric elements",
      adventurous: "Dynamic cinematic lighting, bold saturated colors, exploration and action elements",
      magical: "Glow effects, ethereal magical sparkles, whimsical star dust, dreamy atmosphere",
      fun: "Bright pop colors, high energy, festive party mood, joyful expression"
    }[config.tone];

    let itemPrompt = "";
    switch (itemType) {
      case 'character':
        itemPrompt = "Full body standing mascot character. The child wears a professional outfit themed after the reference. High facial similarity to the child photo.";
        break;
      case 'expressions':
        itemPrompt = "A character sheet showcasing 4 different facial expressions (laughing, surprised, happy, winking) of the EXACT same child. Consistent clothing. Grid layout.";
        break;
      case 'topper':
        itemPrompt = "Dynamic action pose of the child mascot, perfect for a die-cut cake topper. Thick white outline around the character. White background.";
        break;
      case 'tags':
        itemPrompt = "Bust portrait of the child inside a beautiful decorative circular themed border. Flat design elements around the head. White background.";
        break;
      case 'stickers':
        itemPrompt = "Set of 3 small themed stickers of the child in different funny poses. Each sticker has a thick white border. White background.";
        break;
      case 'invitation':
        itemPrompt = "Complete scenic digital invitation background. The child is integrated into a detailed environment inspired by the theme. Cinematic composition. No text.";
        break;
      case 'age_number':
        itemPrompt = `The child mascot happily leaning against a giant decorative 3D number "${config.age || '1'}". The number is textured and decorated according to the theme. White background.`;
        break;
      case 'panel':
        itemPrompt = "Ultra-wide 16:9 cinematic decorative panel. High detail landscape of the theme's world with the child as the central hero. Epic lighting.";
        break;
    }

    const fullPrompt = `
      **CRITICAL MISSION: HIGH-FIDELITY FACIAL REPLICATION.** Your most important task is to meticulously analyze the provided 'child photo' and replicate every facial detail with extreme accuracy into the final illustration. This is not a generic character; it is a specific child.
      
      **FACIAL ANALYSIS CHECKLIST (MANDATORY):**
      - **Eye Shape & Color:** Perfectly match the shape (almond, round, etc.) and color.
      - **Eyebrows:** Match the shape, thickness, and arch.
      - **Nose:** Replicate the bridge, tip, and nostril shape.
      - **Mouth:** Match the lip thickness, smile shape, and any visible teeth details.
      - **Face Shape:** Match the jawline, chin, and cheek structure.
      - **Hair:** Replicate the color, texture (curly, straight), and hairline.
      - **Unique Features:** Include any visible freckles, moles, or dimples.
      
      TASK: Create a professional illustration of a child mascot for a party kit based on the above analysis.
      
      CORE REQUIREMENT: Maintain the HIGHEST POSSIBLE FACIAL CONSISTENCY with the 'child photo'. The resemblance must be undeniable.
      CHILD TRAITS (ADDITIONAL): ${config.features || "No extra features provided by user."}. 
      ESTIMATED AGE: ${config.age || "child age"}.
      
      STYLE: ${styleDesc}.
      TONE/VIBE: ${toneDesc}.
      
      ITEM SPECIFICATION: ${itemPrompt}
      
      IMPORTANT RULES:
      - The character MUST have the same meticulously replicated face in every generation.
      - The clothing and theme colors MUST match the 'theme reference image' if provided.
      - NO TEXT (except for age_number).
      - BACKGROUND: MUST BE PLAIN WHITE for 'character', 'expressions', 'topper', 'tags', 'stickers', and 'age_number'. Scenic/Environment for 'panel' and 'invitation'.
    `;

    try {
      // Limpeza do base64 para garantir envio correto
      const childData = childImageBase64.includes(',') ? childImageBase64.split(',')[1] : childImageBase64;
      
      const parts: any[] = [
        { 
          inlineData: { 
            data: childData, 
            mimeType: 'image/jpeg' // Usar jpeg por ser mais comum
          } 
        }
      ];

      if (config.themeImage) {
        const themeData = config.themeImage.includes(',') ? config.themeImage.split(',')[1] : config.themeImage;
        parts.push({ 
          inlineData: { 
            data: themeData, 
            mimeType: 'image/jpeg'
          } 
        });
      }

      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { 
          imageConfig: { 
            aspectRatio: (itemType === 'panel' || itemType === 'invitation') ? "16:9" : "1:1" 
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
      console.error(`Gemini Error (${itemType}):`, error);
      return null;
    }
  }
}
