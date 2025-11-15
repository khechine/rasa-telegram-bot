const Parsers = require("../utils/parsers");

class CustomerHandler {
  constructor(bot, rasaService) {
    this.bot = bot;
    this.rasaService = rasaService;
    this.customers = new Map(); // In-memory storage, replace with database in production
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
    // Generate unique ID
    const customerId = Date.now().toString();

    const customer = {
      id: customerId,
      name: customerData.name,
      email: customerData.email,
      createdAt: new Date().toISOString(),
    };

    // Store in memory (replace with database)
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
      const customers = Array.from(this.customers.values());

      if (customers.length === 0) {
        await this.sendMessage(
          chatId,
          "📝 Aucun client enregistré pour le moment."
        );
        return;
      }

      let message = "📋 Liste des clients:\n\n";
      customers.forEach((customer, index) => {
        message += `${index + 1}. **${customer.name}** (${customer.email})\n`;
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
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error("Client non trouvé");
    }

    Object.assign(customer, updates, { updatedAt: new Date().toISOString() });
    return customer;
  }

  async deleteCustomer(customerId) {
    return this.customers.delete(customerId);
  }

  getCustomer(customerId) {
    return this.customers.get(customerId);
  }
}

module.exports = CustomerHandler;
