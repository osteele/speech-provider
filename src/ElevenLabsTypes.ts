import { z } from "zod";

export const ElevenLabsVoiceDataSchema = z
  .object({
    voice_id: z.string(),
    name: z.string().optional(),
    description: z.string().nullable(),
    category: z.enum(["premade", "professional"]),
    labels: z.object({
      accent: z.string(),
      age: z.string(),
      gender: z.string(),
      language: z.string().optional(),
      use_case: z.enum(["social media"]),
    }),
    preview_url: z.string(),
    samples: z.null(),
    settings: z.null(),
    sharing: z.null(),
    safety_control: z.null(),
    fine_tuning: z.record(z.any()),
    is_legacy: z.literal(false),
    is_mixed: z.literal(false),
    high_quality_base_model_ids: z.array(z.string()),
    available_for_tiers: z.array(z.enum(["plus", "pro", "enterprise"])),
    voice_verification: z.record(z.any()),
    permission_on_resource: z.null(),
  })
  .strict();

// see https://github.com/elevenlabs/elevenlabs-js/blob/60f70f0c3d2ed73599c97836f0a46eeb0944e757/src/api/types/Voice.ts#L7
export interface ElevenLabsVoiceData extends Record<string, unknown> {
  voice_id: string;
  name?: string;
  description?: string;
  category: "premade" | "professional";
  labels: {
    accent: string;
    description: string;
    age: "young" | "middle aged" | "middle-aged" | "middle_aged" | "old";
    gender: "male" | "female" | "non-binary";
    language: string;
    use_case:
      | "social media"
      | "news"
      | "conversational"
      | "narration"
      | "characters"
      | "social_media"
      | "narrative_story";
  };
  preview_url: string;
  permission_on_resource: "admin" | null;
  available_for_tiers: ("plus" | "pro" | "enterprise")[];
  high_quality_base_model_ids: string[];
  is_legacy: false;
  is_mixed: false;
  // these are observed empty or null: samples, settings, sharing, safety_control, fine_tuning, voice_verification
}
