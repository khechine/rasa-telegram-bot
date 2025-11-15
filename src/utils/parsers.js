class Parsers {
  static parseIntent(response) {
    if (!response || !response.intent) {
      return null;
    }

    return {
      name: response.intent.name,
      confidence: response.intent.confidence,
    };
  }

  static parseEntities(response) {
    if (!response || !response.entities) {
      return [];
    }

    return response.entities.map((entity) => ({
      name: entity.entity,
      value: entity.value,
      start: entity.start,
      end: entity.end,
      confidence: entity.confidence || 1.0,
    }));
  }

  static getEntityValue(entities, entityName) {
    const entity = entities.find((e) => e.name === entityName);
    return entity ? entity.value : null;
  }

  static validateCustomerCreationEntities(entities) {
    const name = this.getEntityValue(entities, "customer_name");
    const email = this.getEntityValue(entities, "email");

    const errors = [];

    if (!name) {
      errors.push("Nom du client manquant");
    }

    if (!email) {
      errors.push("Email du client manquant");
    } else if (!this.isValidEmail(email)) {
      errors.push("Format d'email invalide");
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: { name, email },
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static parseCustomerDataFromEntities(entities) {
    return {
      name: this.getEntityValue(entities, "customer_name"),
      email: this.getEntityValue(entities, "email"),
      phone: this.getEntityValue(entities, "phone"),
      address: this.getEntityValue(entities, "address"),
    };
  }

  static detectIntentConfidence(intent) {
    if (!intent || !intent.confidence) {
      return "low";
    }

    const confidence = intent.confidence;

    if (confidence >= 0.9) {
      return "high";
    } else if (confidence >= 0.7) {
      return "medium";
    } else {
      return "low";
    }
  }

  static formatCustomerInfo(customer) {
    let info = `**Client créé:**\n`;
    info += `• Nom: ${customer.name}\n`;
    info += `• Email: ${customer.email}`;

    if (customer.phone) {
      info += `\n• Téléphone: ${customer.phone}`;
    }

    if (customer.address) {
      info += `\n• Adresse: ${customer.address}`;
    }

    return info;
  }

  // Parse quotation items from natural language
  static parseQuotationItems(text) {
    const items = [];
    const patterns = [
      /(\d+)\s+(.+?)(?=,\s*\d+|$)/gi, // "5 pains, 2 gateaux"
      /(\d+)\s*(.+)/gi, // "5 pains"
    ];

    let match;
    while ((match = patterns[0].exec(text)) !== null) {
      const quantity = parseInt(match[1]);
      const itemName = match[2].trim();
      if (quantity > 0 && itemName) {
        items.push({
          quantity: quantity,
          itemName: itemName.toLowerCase(),
          originalText: match[0],
        });
      }
    }

    // If no matches with commas, try single item pattern
    if (items.length === 0) {
      const singleMatch = text.match(/(\d+)\s+(.+)/);
      if (singleMatch) {
        const quantity = parseInt(singleMatch[1]);
        const itemName = singleMatch[2].trim();
        if (quantity > 0 && itemName) {
          items.push({
            quantity: quantity,
            itemName: itemName.toLowerCase(),
            originalText: singleMatch[0],
          });
        }
      }
    }

    return items;
  }

  // Extract customer name and email from quotation request
  static parseQuotationCustomer(text) {
    const customerPatterns = [
      /pour le client\s+(.+?)\s+avec\s+email\s+(.+?)(?:\s|$)/i,
      /client\s+(.+?)\s+email\s+(.+?)(?:\s|$)/i,
      /pour\s+(.+?)\s+email\s+(.+?)(?:\s|$)/i,
    ];

    for (const pattern of customerPatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          name: match[1].trim(),
          email: match[2].trim(),
        };
      }
    }

    return null;
  }

  // Validate quotation data
  static validateQuotationData(customer, items) {
    const errors = [];

    if (!customer || !customer.name) {
      errors.push("Nom du client manquant");
    }

    if (!customer || !customer.email) {
      errors.push("Email du client manquant");
    } else if (!this.isValidEmail(customer.email)) {
      errors.push("Format d'email invalide");
    }

    if (!items || items.length === 0) {
      errors.push("Aucun article spécifié");
    } else {
      items.forEach((item, index) => {
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Quantité invalide pour l'article ${index + 1}`);
        }
        if (!item.itemName || item.itemName.trim().length === 0) {
          errors.push(`Nom d'article manquant pour l'article ${index + 1}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: { customer, items },
    };
  }

  static formatQuotationSummary(quotation) {
    let summary = `📄 **Devis créé: ${quotation.id}**\n\n`;
    summary += `👤 **Client:** ${quotation.customerName}\n`;
    summary += `📧 **Email:** ${quotation.customerEmail}\n\n`;
    summary += `🛒 **Articles:**\n`;

    quotation.items.forEach((item, index) => {
      summary += `${index + 1}. ${item.quantity}x ${item.itemName}\n`;
      if (item.unitPrice) {
        summary += `   Prix: ${item.unitPrice} TND × ${item.quantity} = ${item.totalPrice} TND\n`;
      }
    });

    if (quotation.total) {
      summary += `\n💰 **Total: ${quotation.total} TND**\n`;
    }

    summary += `\n📅 **Date:** ${new Date().toLocaleDateString("fr-TN")}`;
    summary += `\n📊 **Statut:** ${quotation.status || "Draft"}`;

    return summary;
  }
}

module.exports = Parsers;
