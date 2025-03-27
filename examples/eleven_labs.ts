import { getVoiceProvider } from "../src";

// Example using ElevenLabs voice provider
async function elevenLabsExample() {
  // Replace with your actual ElevenLabs API key
  const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;

  if (!ELEVEN_LABS_API_KEY) {
    console.error("Please set the ELEVEN_LABS_API_KEY environment variable");
    return;
  }

  // Create the provider with the API key
  const provider = getVoiceProvider({
    elevenLabs: ELEVEN_LABS_API_KEY,
  });

  console.log(`Using voice provider: ${provider.name}`);

  try {
    // Get English voices
    console.log("Fetching English voices...");
    const englishVoices = await provider.getVoices({
      lang: "en-US",
      minVoices: 1,
    });

    console.log(`Found ${englishVoices.length} English voices:`);
    for (const voice of englishVoices.slice(0, 5)) {
      console.log(`- ${voice.name} (${voice.description || "No description"})`);
    }

    if (englishVoices.length > 0) {
      const voice = englishVoices[0];
      console.log(`\nUsing voice: ${voice.name}`);

      // Create an utterance
      const utterance = voice.createUtterance(
        "Hello! This is a test of the Eleven Labs text-to-speech API. " +
          "This voice sounds much more natural than standard browser voices.",
      );

      // Add event listeners
      utterance.onstart = () => console.log("Started speaking");
      utterance.onend = () => console.log("Finished speaking");

      console.log("Starting speech synthesis...");
      await utterance.start();

      // Wait for the speech to complete
      await new Promise<void>((resolve) => {
        utterance.onend = () => {
          console.log("Speech complete");
          resolve();
        };
      });
    }

    // Try other languages
    console.log("\nTrying Spanish voices...");
    const spanishVoices = await provider.getVoices({
      lang: "es-ES",
      minVoices: 1,
    });

    console.log(`Found ${spanishVoices.length} Spanish voices`);
    if (spanishVoices.length > 0) {
      const voice = spanishVoices[0];
      console.log(`Using voice: ${voice.name}`);

      const utterance = voice.createUtterance(
        "Hola! Esta es una prueba de la API de texto a voz de Eleven Labs. " +
          "Esta voz suena mucho más natural que las voces estándar del navegador.",
      );

      console.log("Starting Spanish speech synthesis...");
      await utterance.start();

      // Wait for the speech to complete
      await new Promise<void>((resolve) => {
        utterance.onend = () => {
          console.log("Spanish speech complete");
          resolve();
        };
      });
    }
  } catch (error) {
    console.error("Error in Eleven Labs example:", error);
  }
}

// Run the example
elevenLabsExample().catch(console.error);
