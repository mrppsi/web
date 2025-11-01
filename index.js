import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Ask Hugging Face ====================
async function askHuggingFace(prompt) {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${process.env.HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HF error: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data[0]?.generated_text || "Aaron no pudo generar respuesta 😅";
    return data.generated_text || "Aaron no pudo generar respuesta 😅";
  } catch (error) {
    console.error("❌ Error Hugging Face:", error);
    return "Aaron está ocupado, intenta preguntarle más tarde 😔";
  }
}
// ============================================================

// ==================== Discord Bot ==========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!aaron")) {
    await message.channel.sendTyping();
    const prompt = message.content.replace("!aaron", "").trim();
    const hfResponse = await askHuggingFace(prompt);
    await message.reply(hfResponse);
  }
});

client.login(process.env.DISCORD_TOKEN);

// ==================== Servidor web =========================
app.get("/", (req, res) => res.send("✅ AaronGPT está en línea."));
app.listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));
