import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Configuración
const app = express();
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL;

// Crear cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Mensaje al iniciar
client.once("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});

// Función para consultar Hugging Face
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

    // Algunos modelos devuelven array, otros texto directo
    return data[0]?.generated_text || data.generated_text || "No pude generar respuesta 😅";
  } catch (error) {
    console.error("❌ Error Hugging Face:", error);
    return "Ocurrió un error al procesar tu mensaje 😔";
  }
}

// Evitar duplicados: solo procesar un mensaje a la vez
const processingMessages = new Set();

// Escucha mensajes en Discord
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!aaron")) {
    const messageId = message.id;
    if (processingMessages.has(messageId)) return; // evita duplicados
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

// Servidor web para mantener Render activo
app.get("/", (req, res) => res.send("✅ AaronGPT está en línea."));
app.listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));

// Inicia sesión en Discord
client.login(process.env.DISCORD_TOKEN);
