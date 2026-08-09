import { z } from "zod";

/** The fields required by the runtime, while permitting new API properties. */
export const ElevenLabsVoiceDataSchema = z
  .object({
    voice_id: z.string().min(1),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    labels: z.record(z.string()).nullish(),
    verified_languages: z
      .array(
        z
          .object({
            language: z.string().min(1),
          })
          .passthrough(),
      )
      .nullable()
      .optional(),
    voice_verification: z
      .object({
        language: z.string().min(1).nullish(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const ElevenLabsVoicesResponseSchema = z
  .object({
    voices: z.array(ElevenLabsVoiceDataSchema),
  })
  .passthrough();

export type ElevenLabsVoiceData = z.infer<typeof ElevenLabsVoiceDataSchema>;
