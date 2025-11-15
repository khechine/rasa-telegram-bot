require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const RasaService = require("./services/rasaService");
const ERPNextService = require("./services/erpnextService");
const MessageHandler = require("./handlers/messageHandler");
const CallbackHandler = require("./handlers/callbackHandler");
const ReportHandler = require("./handlers/reportHandler");
const QuotationHandler = require("./handlers/quotationHandler");

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

// Initialize ERPNext service if configured
let erpnextService = null;
if (
  process.env.ERPNext_URL &&
  process.env.ERPNext_API_KEY &&
  process.env.ERPNext_API_SECRET
) {
  erpnextService = new ERPNextService(
    process.env.ERPNext_URL,
    process.env.ERPNext_API_KEY,
    process.env.ERPNext_API_SECRET
  );

  // Initialize ERPNext connection
  erpnextService.initialize().catch((error) => {
    console.warn(
      "ERPNext initialization failed, continuing without ERPNext integration:",
      error.message
    );
    erpnextService = null;
  });
}

const reportHandler = new ReportHandler(erpnextService);
reportHandler.setBot(bot);

const quotationHandler = new QuotationHandler(erpnextService);
quotationHandler.setBot(bot);

const messageHandler = new MessageHandler(
  bot,
  rasaService,
  erpnextService,
  reportHandler,
  quotationHandler
);
const callbackHandler = new CallbackHandler(
  bot,
  rasaService,
  erpnextService,
  reportHandler,
  quotationHandler
);

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
