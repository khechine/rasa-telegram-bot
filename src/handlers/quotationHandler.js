const Parsers = require("../utils/parsers");
const ERPNextService = require("../services/erpnextService");

class QuotationHandler {
  constructor(erpnextService = null) {
    this.erpnextService = erpnextService;
    this.useERPNext = erpnextService && erpnextService.isConnected;
  }

  async handleQuotationCreation(chatId, text) {
    try {
      // Parse the quotation request
      const customerInfo = Parsers.parseQuotationCustomer(text);
      const items = Parsers.parseQuotationItems(text);

      if (!customerInfo) {
        await this.sendMessage(
          chatId,
          "❌ Je n'ai pas trouvé les informations du client. Veuillez spécifier le nom et l'email (ex: 'pour le client Dupont avec email dupont@example.com')"
        );
        return;
      }

      if (!items || items.length === 0) {
        await this.sendMessage(
          chatId,
          "❌ Aucun article trouvé. Veuillez spécifier les articles (ex: '5 pains, 2 gateaux chocolat')"
        );
        return;
      }

      // Validate quotation data
      const validation = Parsers.validateQuotationData(customerInfo, items);
      if (!validation.isValid) {
        const errorMessage = `❌ Erreurs dans la demande:\n${validation.errors.join(
          "\n"
        )}`;
        await this.sendMessage(chatId, errorMessage);
        return;
      }

      // Check if ERPNext is available
      if (!this.useERPNext) {
        await this.sendMessage(
          chatId,
          "❌ Fonction devis non disponible (ERPNext non configuré)"
        );
        return;
      }

      // Show processing message
      await this.sendMessage(chatId, "🔄 Création du devis en cours...");

      // Create quotation with items
      const quotationData = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        items: items,
      };

      const quotation = await this.erpnextService.createQuotationWithItems(
        quotationData
      );

      // Generate PDF and send email
      try {
        // Generate PDF
        const pdfData = await this.erpnextService.generateQuotationPDF(
          quotation.id
        );

        // Send email with PDF
        await this.erpnextService.sendQuotationEmail(
          quotation.id,
          quotation.customerEmail,
          `Bonjour ${quotation.customerName},\n\nVeuillez trouver ci-joint votre devis personnalisé.\n\nCordialement,\nVotre équipe commerciale`
        );

        // Success message with summary
        const summary = Parsers.formatQuotationSummary(quotation);
        const successMessage = `${summary}\n\n✅ PDF envoyé avec succès à ${quotation.customerEmail}\n\nQue souhaitez-vous faire maintenant ?`;

        await this.sendMessage(chatId, successMessage);
      } catch (emailError) {
        console.error("Error sending email:", emailError);

        // Still show success but mention email issue
        const summary = Parsers.formatQuotationSummary(quotation);
        const partialSuccessMessage = `${summary}\n\n⚠️ Devis créé mais problème d'envoi email. Vous pouvez le récupérer manuellement.\n\nQue souhaitez-vous faire maintenant ?`;

        await this.sendMessage(chatId, partialSuccessMessage);
      }
    } catch (error) {
      console.error("Error handling quotation creation:", error);

      let errorMessage = "❌ Erreur lors de la création du devis";

      if (error.message.includes("Article non trouvé")) {
        errorMessage += `: ${error.message}\n\nVérifiez l'orthographe des articles ou contactez votre administrateur pour ajouter les articles manquants.`;
      } else {
        errorMessage += `: ${error.message}`;
      }

      await this.sendMessage(chatId, errorMessage);
    }
  }

  async getQuotationDetails(chatId, quotationId) {
    if (!this.useERPNext) {
      await this.sendMessage(
        chatId,
        "❌ Fonction devis non disponible (ERPNext non configuré)"
      );
      return;
    }

    try {
      const quotation = await this.erpnextService.getQuotationDetails(
        quotationId
      );

      if (!quotation) {
        await this.sendMessage(chatId, "❌ Devis non trouvé");
        return;
      }

      const summary = Parsers.formatQuotationSummary({
        id: quotation.id,
        customerName: quotation.customerName,
        customerEmail: "N/A", // Not included in details
        items: quotation.items,
        total: quotation.total,
        status: quotation.status,
        validTill: quotation.validTill,
        createdAt: quotation.transactionDate,
      });

      await this.sendMessage(chatId, summary);
    } catch (error) {
      console.error("Error getting quotation details:", error);
      await this.sendMessage(
        chatId,
        `❌ Erreur lors de la récupération du devis: ${error.message}`
      );
    }
  }

  async resendQuotationEmail(chatId, quotationId, email = null) {
    if (!this.useERPNext) {
      await this.sendMessage(
        chatId,
        "❌ Fonction devis non disponible (ERPNext non configuré)"
      );
      return;
    }

    try {
      // Get quotation details to find customer email
      const quotation = await this.erpnextService.getQuotationDetails(
        quotationId
      );
      const recipientEmail = email || quotation.customerEmail;

      if (!recipientEmail) {
        await this.sendMessage(
          chatId,
          "❌ Email du client non trouvé. Veuillez spécifier l'email."
        );
        return;
      }

      await this.erpnextService.sendQuotationEmail(
        quotationId,
        recipientEmail,
        `Bonjour,\n\nRetrouvez ci-joint votre devis ${quotationId}.\n\nCordialement,\nVotre équipe commerciale`
      );

      await this.sendMessage(
        chatId,
        `✅ Devis ${quotationId} renvoyé avec succès à ${recipientEmail}`
      );
    } catch (error) {
      console.error("Error resending quotation email:", error);
      await this.sendMessage(
        chatId,
        `❌ Erreur lors du renvoi du devis: ${error.message}`
      );
    }
  }

  async sendMessage(chatId, text) {
    // This will be set by the parent handler
    if (this.bot) {
      await this.bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    }
  }

  setBot(bot) {
    this.bot = bot;
  }
}

module.exports = QuotationHandler;
