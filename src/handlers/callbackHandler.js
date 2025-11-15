const ResponseBuilder = require("../utils/responseBuilder");
const CustomerHandler = require("./customerHandler");

class CallbackHandler {
  constructor(bot, rasaService, erpnextService = null) {
    this.bot = bot;
    this.rasaService = rasaService;
    this.customerHandler = new CustomerHandler(
      bot,
      rasaService,
      erpnextService
    );
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const callbackData = query.data;

    try {
      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery(query.id);

      // Handle different callback actions
      switch (callbackData) {
        case "create_customer":
          await this.handleCreateCustomerCallback(chatId);
          break;

        case "list_customers":
          await this.handleListCustomersCallback(chatId);
          break;

        case "get_quotation":
          await this.handleQuotationCallback(chatId);
          break;

        case "get_invoices":
          await this.handleInvoicesCallback(chatId);
          break;

        case "help":
          await this.handleHelpCallback(chatId);
          break;

        default:
          // Handle dynamic callbacks or unknown ones
          await this.handleUnknownCallback(chatId, callbackData);
          break;
      }
    } catch (error) {
      console.error("Error handling callback:", error);
      await this.sendErrorMessage(
        chatId,
        "Une erreur est survenue lors du traitement de votre demande."
      );
    }
  }

  async handleCreateCustomerCallback(chatId) {
    const response = ResponseBuilder.buildCallbackResponse("create_customer");
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: {
        force_reply: true, // Force user to reply to this message
      },
    });
  }

  async handleListCustomersCallback(chatId) {
    await this.customerHandler.getCustomers(chatId);
  }

  async handleQuotationCallback(chatId) {
    await this.customerHandler.getQuotations(chatId);
  }

  async handleInvoicesCallback(chatId) {
    await this.customerHandler.getSalesInvoices(chatId);
  }

  async handleHelpCallback(chatId) {
    const response = ResponseBuilder.buildHelpResponse();
    await this.bot.sendMessage(chatId, response.text, {
      parse_mode: response.parse_mode,
      reply_markup: response.reply_markup,
    });
  }

  async handleUnknownCallback(chatId, callbackData) {
    console.warn(`Unknown callback data: ${callbackData}`);

    const response = {
      text: "🤔 Action non reconnue. Voici le menu principal:",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: ResponseBuilder.getMainMenuKeyboard(),
      },
    };

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

  // Additional utility methods
  async editMessage(chatId, messageId, newText, options = {}) {
    await this.bot.editMessageText(newText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: options.parse_mode || "Markdown",
      reply_markup: options.reply_markup,
    });
  }

  async deleteMessage(chatId, messageId) {
    try {
      await this.bot.deleteMessage(chatId, messageId);
    } catch (error) {
      console.warn("Could not delete message:", error.message);
    }
  }
}

module.exports = CallbackHandler;
