const Parsers = require("../utils/parsers");
const ERPNextService = require("../services/erpnextService");

class CustomerHandler {
  constructor(bot, rasaService, erpnextService = null) {
    this.bot = bot;
    this.rasaService = rasaService;
    this.erpnextService = erpnextService;
    this.customers = new Map(); // Fallback in-memory storage
    this.useERPNext = erpnextService && erpnextService.isConnected;
  }

  async handleCustomerCreation(chatId, rasaResponse) {
    try {
      const entities = Parsers.parseEntities(rasaResponse);
      const validation = Parsers.validateCustomerCreationEntities(entities);

      if (!validation.isValid) {
        const errorMessage = `❌ Erreur lors de la création du client:\n${validation.errors.join(
          "\n"
        )}`;
        await this.sendMessage(chatId, errorMessage);
        return;
      }

      const customerData = validation.data;

      // Create customer (in-memory for now)
      const customer = await this.createCustomer(customerData);

      // Send success message with keyboard
      const successMessage = this.buildSuccessResponse(customer);
      await this.sendMessage(
        chatId,
        successMessage.text,
        successMessage.options
      );
    } catch (error) {
      console.error("Error handling customer creation:", error);
      await this.sendMessage(
        chatId,
        "❌ Une erreur est survenue lors de la création du client."
      );
    }
  }

  async createCustomer(customerData) {
    if (this.useERPNext) {
      try {
        const erpnextCustomer = await this.erpnextService.createCustomer(
          customerData
        );
        return erpnextCustomer;
      } catch (error) {
        console.error(
          "ERPNext customer creation failed, falling back to local storage:",
          error.message
        );
        // Fall back to local storage if ERPNext fails
      }
    }

    // Fallback to in-memory storage
    const customerId = Date.now().toString();
    const customer = {
      id: customerId,
      name: customerData.name,
      email: customerData.email,
      createdAt: new Date().toISOString(),
    };

    this.customers.set(customerId, customer);
    return customer;
  }

  buildSuccessResponse(customer) {
    const text = `✅ Client *${customer.name}* créé avec succès !\n\nQue souhaitez-vous faire maintenant ?`;

    const options = {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Créer un autre client", callback_data: "create_customer" }],
          [{ text: "Voir les devis", callback_data: "get_quotation" }],
          [{ text: "Aide", callback_data: "help" }],
        ],
      },
    };

    return { text, options };
  }

  async getCustomers(chatId) {
    try {
      let customers = [];

      if (this.useERPNext) {
        try {
          customers = await this.erpnextService.getCustomers();
        } catch (error) {
          console.error(
            "ERPNext customer retrieval failed, falling back to local storage:",
            error.message
          );
          customers = Array.from(this.customers.values());
        }
      } else {
        customers = Array.from(this.customers.values());
      }

      if (customers.length === 0) {
        await this.sendMessage(
          chatId,
          "📝 Aucun client enregistré pour le moment."
        );
        return;
      }

      let message = "📋 Liste des clients:\n\n";
      customers.forEach((customer, index) => {
        message += `${index + 1}. **${customer.name}**`;
        if (customer.email) {
          message += ` (${customer.email})`;
        }
        message += "\n";
      });

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error getting customers:", error);
      await this.sendMessage(
        chatId,
        "❌ Erreur lors de la récupération des clients."
      );
    }
  }

  async sendMessage(chatId, text, options = {}) {
    await this.bot.sendMessage(chatId, text, options);
  }

  // Additional methods for customer management
  async updateCustomer(customerId, updates) {
    if (this.useERPNext) {
      try {
        return await this.erpnextService.updateCustomer(customerId, updates);
      } catch (error) {
        console.error(
          "ERPNext customer update failed, falling back to local storage:",
          error.message
        );
      }
    }

    // Fallback to local storage
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error("Client non trouvé");
    }

    Object.assign(customer, updates, { updatedAt: new Date().toISOString() });
    return customer;
  }

  async deleteCustomer(customerId) {
    if (this.useERPNext) {
      // Note: ERPNext doesn't typically allow customer deletion, but we can mark as disabled
      try {
        await this.erpnextService.updateCustomer(customerId, { disabled: 1 });
        return true;
      } catch (error) {
        console.error("ERPNext customer deletion failed:", error.message);
        return false;
      }
    }

    return this.customers.delete(customerId);
  }

  async getCustomer(customerId) {
    if (this.useERPNext) {
      try {
        return await this.erpnextService.getCustomer(customerId);
      } catch (error) {
        console.error(
          "ERPNext customer retrieval failed, falling back to local storage:",
          error.message
        );
        return this.customers.get(customerId);
      }
    }

    return this.customers.get(customerId);
  }

  // ERPNext-specific methods
  async getQuotations(chatId, customerId = null) {
    if (!this.useERPNext) {
      await this.sendMessage(
        chatId,
        "❌ Fonction devis non disponible (ERPNext non configuré)"
      );
      return;
    }

    try {
      const quotations = await this.erpnextService.getQuotations(customerId);

      if (quotations.length === 0) {
        await this.sendMessage(chatId, "📄 Aucun devis trouvé.");
        return;
      }

      let message = "📄 Liste des devis:\n\n";
      quotations.forEach((quotation, index) => {
        message += `${index + 1}. **Devis ${quotation.id}**\n`;
        message += `   Client: ${quotation.customerId}\n`;
        message += `   Statut: ${quotation.status}\n`;
        message += `   Total: ${quotation.total || "N/A"} TND\n`;
        message += `   Date: ${new Date(quotation.date).toLocaleDateString(
          "fr-TN"
        )}\n\n`;
      });

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error getting quotations:", error);
      await this.sendMessage(
        chatId,
        "❌ Erreur lors de la récupération des devis."
      );
    }
  }

  async getSalesInvoices(chatId, customerId = null) {
    if (!this.useERPNext) {
      await this.sendMessage(
        chatId,
        "❌ Fonction factures non disponible (stockage local uniquement)"
      );
      return;
    }

    try {
      const invoices = await this.erpnextService.getSalesInvoices(customerId);

      if (invoices.length === 0) {
        await this.sendMessage(chatId, "📄 Aucune facture trouvée.");
        return;
      }

      let message = "📄 Liste des factures:\n\n";
      invoices.forEach((invoice, index) => {
        message += `${index + 1}. **Facture ${invoice.id}**\n`;
        message += `   Client: ${invoice.customerId}\n`;
        message += `   Statut: ${invoice.status}\n`;
        message += `   Total: ${invoice.total || "N/A"} TND\n`;
        message += `   Date: ${new Date(invoice.date).toLocaleDateString(
          "fr-TN"
        )}\n\n`;
      });

      await this.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error getting sales invoices:", error);
      await this.sendMessage(
        chatId,
        "❌ Erreur lors de la récupération des factures."
      );
    }
  }
}

module.exports = CustomerHandler;
