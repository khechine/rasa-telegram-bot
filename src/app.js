require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const RasaService = require("./services/rasaService");
const MessageHandler = require("./handlers/messageHandler");
const CallbackHandler = require("./handlers/callbackHandler");

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error("TELEGRAM_TOKEN is not set in environment variables");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const rasaService = new RasaService(
  process.env.RASA_URL,
  process.env.RASA_WEBHOOK_PATH
);
const messageHandler = new MessageHandler(bot, rasaService);
const callbackHandler = new CallbackHandler(bot, rasaService);

console.log("Bot is running...");

bot.on("message", (msg) => {
  messageHandler.handleMessage(msg);
});

bot.on("callback_query", (query) => {
  callbackHandler.handleCallback(query);
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error.message);
});

process.on("SIGINT", () => {
  console.log("Bot stopped.");
  process.exit(0);
});
