const { OpenAI } = require("openai");

let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "missing"
  });
} catch (e) {
  console.warn("⚠️ OpenAI initialization failed: Missing or invalid API key.");
}

module.exports = (client) => {

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // Trigger only if message starts with !ai
    if (!message.content.toLowerCase().startsWith("!ai")) return;

    const prompt = message.content.slice(3).trim();
    if (!prompt) return message.reply("Please provide a question for me!");

    if (!process.env.OPENAI_API_KEY) {
      return message.reply("❌ AI System Error: API Key not configured.");
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful Discord assistant. Keep responses within 2000 characters." },
          { role: "user", content: prompt }
        ]
      });

      let reply = response.choices[0].message.content;
      
      if (reply.length > 2000) {
        reply = reply.substring(0, 1900) + "... (truncated)";
      }

      await message.reply(reply);

    } catch (err) {
      console.error("OpenAI API Error:", err.message);
      if (err.message.includes("429")) {
        return message.reply("❌ AI Error: Quota exceeded or limit reached. Please check the API billing.");
      }
      message.reply("❌ AI response failed.");
    }
  });

};