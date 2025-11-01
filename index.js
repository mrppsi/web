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

async function askHuggingFace(prompt) {
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      throw new Error(`HF error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || data.generated_text || "No recibí respuesta 😅";
  } catch (error) {
    console.error("❌ Error Hugging Face:", error);
    return "Ocurrió un error al conectar con mi núcleo 😔";
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!aaron")) {
    const prompt = message.content.replace("!aaron", "").trim();
    if (!prompt) return message.reply("Escribe algo después de !aaron para preguntarme.");

    await message.channel.sendTyping();
    const respuesta = await askHuggingFace(prompt);
    message.reply(respuesta);
  }
});

app.get("/", (req, res) => res.send("✅ AaronGPT está en línea."));
app.listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
