class ResponseBuilder {
  static buildSuccessCustomerCreation(customer) {
    const text = `✅ Client *${customer.name}* créé avec succès !\n\nQue souhaitez-vous faire maintenant ?`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildErrorResponse(errorMessage) {
    return {
      text: `❌ ${errorMessage}`,
      parse_mode: "Markdown",
    };
  }

  static buildValidationErrorResponse(errors) {
    let text = "❌ Erreurs de validation:\n";
    errors.forEach((error, index) => {
      text += `${index + 1}. ${error}\n`;
    });

    return {
      text,
      parse_mode: "Markdown",
    };
  }

  static buildHelpResponse() {
    const text =
      `🤖 *Bot de Gestion Client*\n\n` +
      `Je peux vous aider avec:\n\n` +
      `• Créer un nouveau client\n` +
      `• Consulter la liste des clients\n` +
      `• Gérer les devis\n\n` +
      `Exemples de commandes:\n` +
      `• "Créer un client Dupont dupont@email.com"\n` +
      `• "Voir mes clients"\n` +
      `• "Aide"\n\n` +
      `Que souhaitez-vous faire ?`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildWelcomeMessage() {
    const text =
      `👋 Bonjour ! Je suis votre assistant de gestion client.\n\n` +
      `Je peux vous aider à:\n` +
      `• Créer et gérer vos clients\n` +
      `• Consulter les devis\n` +
      `• Et bien plus encore !\n\n` +
      `Comment puis-je vous aider aujourd'hui ?`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildCustomerListResponse(customers) {
    if (!customers || customers.length === 0) {
      return {
        text: "📝 Aucun client enregistré pour le moment.",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: this.getMainMenuKeyboard(),
        },
      };
    }

    let text = "📋 Liste des clients:\n\n";
    customers.forEach((customer, index) => {
      text += `${index + 1}. **${customer.name}** (${customer.email})\n`;
      text += `   Créé le: ${new Date(customer.createdAt).toLocaleDateString(
        "fr-FR"
      )}\n\n`;
    });

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildQuotationResponse() {
    const text =
      `📄 *Gestion des Devis*\n\n` +
      `Fonctionnalité en cours de développement.\n\n` +
      `Que souhaitez-vous faire d'autre ?`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildLowConfidenceResponse(intentName, confidence) {
    const text =
      `🤔 Je ne suis pas sûr de comprendre votre demande (${Math.round(
        confidence * 100
      )}% de confiance).\n\n` +
      `Pouvez-vous reformuler ou utiliser les boutons ci-dessous ?`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static buildFallbackResponse() {
    const text =
      `🤔 Désolé, je n'ai pas compris votre message.\n\n` +
      `Voici ce que je peux faire pour vous:`;

    return {
      text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: this.getMainMenuKeyboard(),
      },
    };
  }

  static getMainMenuKeyboard() {
    return [
      [{ text: "👤 Créer un client", callback_data: "create_customer" }],
      [{ text: "📋 Voir les clients", callback_data: "list_customers" }],
      [{ text: "📄 Voir les devis", callback_data: "get_quotation" }],
      [{ text: "📄 Voir les factures", callback_data: "get_invoices" }],
      [{ text: "❓ Aide", callback_data: "help" }],
    ];
  }

  static getYesNoKeyboard(action) {
    return [
      [
        { text: "✅ Oui", callback_data: `${action}_yes` },
        { text: "❌ Non", callback_data: `${action}_no` },
      ],
    ];
  }

  static buildCallbackResponse(callbackData) {
    const responses = {
      create_customer: {
        text: 'Parfait ! Dites-moi le nom et l\'email du client à créer.\n\nExemple: "Créer Dupont avec email dupont@example.com"',
      },
      list_customers: {
        text: "Voici la liste de vos clients:",
      },
      get_quotation: {
        text: "Fonction devis en développement...",
      },
      help: {
        text: "Voici l'aide disponible:",
      },
    };

    return {
      text: responses[callbackData] || "Action non reconnue",
      parse_mode: "Markdown",
    };
  }
}

module.exports = ResponseBuilder;
