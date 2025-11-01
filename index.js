import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});

// Evitar duplicados
const processingMessages = new Set();

async function askHuggingFace(prompt) {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    // GPT2 devuelve array con generated_text
    if (Array.isArray(data)) return data[0]?.generated_text || "No pude generar respuesta 😅";
    return data.generated_text || "No pude generar respuesta 😅";
  } catch (error) {
    console.error("❌ Error Hugging Face:", error);
    return "Ocurrió un error al procesar tu mensaje 😔";
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!aaron")) {
    const messageId = message.id;
    if (processingMessages.has(messageId)) return;
    processingMessages.add(messageId);

    const prompt = message.content.replace("!aaron", "").trim();
    if (!prompt) {
      processingMessages.delete(messageId);
      return message.reply("Escribe algo después de !aaron para preguntarme.");
    }

    await message.channel.sendTyping();
    const respuesta = await askHuggingFace(prompt);
    await message.reply(respuesta);

    processingMessages.delete(messageId);
  }
});

// Servidor web para Render
app.get("/", (req, res) => res.send("✅ AaronGPT está en línea."));
app.listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
