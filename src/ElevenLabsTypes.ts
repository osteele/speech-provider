import { z } from "zod";

/**
 * Zod schema for validating ElevenLabs voice data.
 * This schema ensures that the API response matches the expected format.
 */
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

/**
 * Type definition for ElevenLabs voice data.
 * This interface extends Record<string, unknown> to allow for additional properties
 * that might be present in the API response but not explicitly typed here.
 *
 * @see https://github.com/elevenlabs/elevenlabs-js/blob/60f70f0c3d2ed73599c97836f0a46eeb0944e757/src/api/types/Voice.ts#L7
 */
export interface ElevenLabsVoiceData extends Record<string, unknown> {
  /** The unique identifier for the voice */
  voice_id: string;
  /** The display name of the voice */
  name?: string;
  /** A description of the voice */
  description?: string;
  /** Whether the voice is premade or professional */
  category: "premade" | "professional";
  /** Labels describing the voice's characteristics */
  labels: {
    /** The accent of the voice */
    accent: string;
    /** A description of the voice */
    description: string;
    /** The age category of the voice */
    age: "young" | "middle aged" | "middle-aged" | "middle_aged" | "old";
    /** The gender of the voice */
    gender: "male" | "female" | "non-binary";
    /** The language code for the voice */
    language: string;
    /** The intended use case for the voice */
    use_case:
      | "social media"
      | "news"
      | "conversational"
      | "narration"
      | "characters"
      | "social_media"
      | "narrative_story";
  };
  /** URL to preview the voice */
  preview_url: string;
  /** The permission level for the voice */
  permission_on_resource: "admin" | null;
  /** The subscription tiers that can access this voice */
  available_for_tiers: ("plus" | "pro" | "enterprise")[];
  /** IDs of the base models used for this voice */
  high_quality_base_model_ids: string[];
  /** Whether this is a legacy voice */
  is_legacy: false;
  /** Whether this is a mixed voice */
  is_mixed: false;
  // these are observed empty or null: samples, settings, sharing, safety_control, fine_tuning, voice_verification
}
