const ResponseBuilder = require("../utils/responseBuilder");
const CustomerHandler = require("./customerHandler");
const Parsers = require("../utils/parsers");

class MessageHandler {
  constructor(bot, rasaService, erpnextService = null, reportHandler = null) {
    this.bot = bot;
    this.rasaService = rasaService;
    this.customerHandler = new CustomerHandler(
      bot,
      rasaService,
      erpnextService
    );
    this.reportHandler = reportHandler;
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      // Skip if message doesn't contain text
      if (!text) {
        return;
      }

      // Handle special commands
      if (text.startsWith("/")) {
        await this.handleCommand(chatId, text);
        return;
      }

      // Send message to Rasa for NLU processing
      const rasaResponse = await this.rasaService.sendMessage(
        text,
        chatId.toString()
      );

      // Process the response based on intent
      await this.processIntent(chatId, rasaResponse);
    } catch (error) {
      console.error("Error handling message:", error);
      await this.sendErrorMessage(
        chatId,
        "Une erreur est survenue lors du traitement de votre message."
      );
    }
  }

  async handleCommand(chatId, command) {
    switch (command) {
      case "/start":
        await this.handleStartCommand(chatId);
        break;
      case "/help":
        await this.handleHelpCommand(chatId);
        break;
      case "/customers":
        await this.customerHandler.getCustomers(chatId);
        break;
      default:
        await this.bot.sendMessage(
          chatId,
          "Commande non reconnue. Tapez /help pour voir les commandes disponibles."
        );
        break;
    }
  }

  async handleStartCommand(chatId) {
    const response = ResponseBuilder.buildWelcomeMessage();
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: response.reply_markup,
    });
  }

  async handleHelpCommand(chatId) {
    const response = ResponseBuilder.buildHelpResponse();
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: response.reply_markup,
    });
  }

  async processIntent(chatId, rasaResponse) {
    const intent = Parsers.parseIntent(rasaResponse);
    const entities = Parsers.parseEntities(rasaResponse);

    // Check confidence level
    const confidenceLevel = Parsers.detectIntentConfidence(intent);

    if (confidenceLevel === "low") {
      const response = ResponseBuilder.buildLowConfidenceResponse(
        intent?.name,
        intent?.confidence
      );
      await this.bot.sendMessage(chatId, response.text, {
        parse_mode: response.parse_mode,
        reply_markup: response.reply_markup,
      });
      return;
    }

    // Route based on intent
    switch (intent?.name) {
      case "create_customer":
        await this.customerHandler.handleCustomerCreation(chatId, rasaResponse);
        break;

      case "list_customers":
        await this.customerHandler.getCustomers(chatId);
        break;

      case "get_quotation":
        await this.customerHandler.getQuotations(chatId);
        break;

      case "get_invoices":
        await this.customerHandler.getSalesInvoices(chatId);
        break;

      case "get_report":
      case "sales_report":
        await this.reportHandler.generateReport("sales", {}, chatId);
        break;

      case "customer_report":
        await this.reportHandler.generateReport("customers", {}, chatId);
        break;

      case "purchase_report":
        await this.reportHandler.generateReport("purchases", {}, chatId);
        break;

      case "quotation_report":
        await this.reportHandler.generateReport("quotations", {}, chatId);
        break;

      case "stock_report":
        await this.reportHandler.generateReport("stock", {}, chatId);
        break;

      case "dashboard":
        await this.reportHandler.generateReport("dashboard", {}, chatId);
        break;

      case "financial_report":
        await this.reportHandler.generateReport("financial", {}, chatId);
        break;

      case "metrics":
        await this.reportHandler.generateReport("metrics", {}, chatId);
        break;

      case "help":
        await this.handleHelpCommand(chatId);
        break;

      case "greet":
        await this.handleGreeting(chatId);
        break;

      default:
        // Try custom report names from ERPNext report names
        if (this.reportHandler && intent?.name) {
          try {
            await this.reportHandler.generateReport(intent.name, {}, chatId);
            return;
          } catch (error) {
            // Continue to fallback if custom report fails
          }
        }
        await this.handleFallback(chatId, rasaResponse);
        break;
    }
  }

  async handleGreeting(chatId) {
    const response = ResponseBuilder.buildWelcomeMessage();
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: response.reply_markup,
    });
  }

  async handleFallback(chatId, rasaResponse) {
    const response = ResponseBuilder.buildFallbackResponse();
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: response.reply_markup,
    });
  }

  async sendErrorMessage(chatId, message) {
    const response = ResponseBuilder.buildErrorResponse(message);
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
    });
  }

  // Additional validation methods
  validateMessage(msg) {
    const errors = [];

    if (!msg.chat || !msg.chat.id) {
      errors.push("Invalid chat information");
    }

    if (!msg.text || msg.text.trim().length === 0) {
      errors.push("Empty message text");
    }

    if (msg.text && msg.text.length > 4096) {
      errors.push("Message too long (max 4096 characters)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Rate limiting (basic implementation)
  static messageCounts = new Map();

  checkRateLimit(chatId) {
    const now = Date.now();
    const userMessages = MessageHandler.messageCounts.get(chatId) || [];

    // Remove messages older than 1 minute
    const recentMessages = userMessages.filter(
      (timestamp) => now - timestamp < 60000
    );

    if (recentMessages.length >= 10) {
      // Max 10 messages per minute
      return false;
    }

    recentMessages.push(now);
    MessageHandler.messageCounts.set(chatId, recentMessages);
    return true;
  }
}

module.exports = MessageHandler;
