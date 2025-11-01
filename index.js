import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";

dotenv.config();

// ---------------------------
// Servidor Express para Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("AaronGPT activo con HF 😎"));
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// ---------------------------
// Inicializar Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------------------
// Función para llamar Hugging Face
async function askHFModel(prompt) {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`HF error: ${res.status} ${txt}`);
      return "Aaron está ocupado, inténtalo más tarde 😅";
    }

    const data = await res.json();
    // El output de HF puede variar según el modelo
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    return "Aaron no pudo generar una respuesta 😅";
  } catch (err) {
    console.error("Error Hugging Face:", err);
    return "Aaron está ocupado, inténtalo más tarde 😅";
  }
}

// ---------------------------
// Listener !aaron
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("!aaron")) return;

  const pregunta = message.content.slice(6).trim();
  if (!pregunta) return message.reply("Escribe algo después de !aaron 😎");

  // Personalidad Aaron: 50% respuesta + HF
  let preRespuesta = "Aaron solo usa el 50% de su poder 😏\n";
  const hfRespuesta = await askHFModel(pregunta);
  message.reply(preRespuesta + hfRespuesta);
});

// ---------------------------
// Login Discord
client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});
