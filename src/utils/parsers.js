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
}

module.exports = Parsers;
