const ResponseBuilder = require("../utils/responseBuilder");
const CustomerHandler = require("./customerHandler");

class CallbackHandler {
  constructor(
    bot,
    rasaService,
    erpnextService = null,
    reportHandler = null,
    quotationHandler = null
  ) {
    this.bot = bot;
    this.rasaService = rasaService;
    this.customerHandler = new CustomerHandler(
      bot,
      rasaService,
      erpnextService
    );
    this.reportHandler = reportHandler;
    this.quotationHandler = quotationHandler;
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

        case "reports_menu":
          await this.handleReportsMenuCallback(chatId);
          break;

        case "pos_reports_menu":
          await this.handlePOSReportsMenuCallback(chatId);
          break;

        case "back_to_main":
          await this.handleBackToMainCallback(chatId);
          break;

        case "create_quotation":
          await this.handleCreateQuotationCallback(chatId);
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

  async handleReportsMenuCallback(chatId) {
    const message =
      "📊 *Menu des Rapports*\n\nChoisissez le type de rapport souhaité :";
    await this.bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: ResponseBuilder.getReportsMenuKeyboard(),
      },
    });
  }

  async handlePOSReportsMenuCallback(chatId) {
    const message =
      "🏪 *Rapports Ventes POS*\n\nChoisissez le rapport souhaité :";
    await this.bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: ResponseBuilder.getPOSReportsMenuKeyboard(),
      },
    });
  }

  async handleBackToMainCallback(chatId) {
    const message = "🏠 Retour au menu principal";
    await this.bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: ResponseBuilder.getMainMenuKeyboard(),
      },
    });
  }

  async handleCreateQuotationCallback(chatId) {
    const message =
      "📝 Création de devis\n\nDites-moi les articles et le client (ex: '5 pains, 2 gateaux chocolat pour le client Dupont avec email dupont@example.com')";
    await this.bot.sendMessage(chatId, message, {
      reply_markup: {
        force_reply: true,
      },
    });
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
