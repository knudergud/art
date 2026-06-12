export interface StylizeResult {
  detectedSubject: string;
  artStyleDecided: string;
  poem: string;
  generatedImageUrl: string;
  imageGenerationPrompt: string;
}

export type WeirdnessLevel = "normal" | "weirder" | "extremely-weird";

export interface StyleChip {
  name: string;
  desc: string;
}

export const FAMOUS_ART_STYLES: StyleChip[] = [
  { name: "Van Gogh", desc: "Thick swirling oil paint & starry sky textures" },
  { name: "Picasso Cubism", desc: "Deconstructed geometric portraits & angles" },
  { name: "Da Vinci Renaissance", desc: "Sfumato shading & delicate vintage realism" },
  { name: "Salvador Dalí Surrealism", desc: "Melting clocks, desert landscapes & floating visuals" },
  { name: "Monet Impressionism", desc: "Soft pastel waterlily ponds & dapple light" },
  { name: "Katsushika Hokusai", desc: "Japanese Ukiyo-e woodblock waves & ink outlines" },
  { name: "Yayoi Kusama", desc: "Bizarre vibrant polka-dot obliteration loops" },
  { name: "Henri Matisse", desc: "Vibrant abstract paper cutouts with bold colors" },
  { name: "Retro Futurist Synthwave", desc: "Glowing 1980s neon wires & dark horizons" },
  { name: "Stop-Motion Claymation", desc: "Crude whimsical clay shapes with fingerprint wrinkles" },
];
