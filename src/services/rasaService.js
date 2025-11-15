const axios = require("axios");

class RasaService {
  constructor(rasaUrl, webhookPath) {
    this.rasaUrl = rasaUrl;
    this.webhookPath = webhookPath;
    this.fullUrl = `${rasaUrl}${webhookPath}`;
  }

  async sendMessage(message, senderId = "telegram_user") {
    try {
      const payload = {
        sender: senderId,
        message: message,
      };

      const response = await axios.post(this.fullUrl, payload, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          "Content-Type": "application/json",
        },
      });

      return this.parseRasaResponse(response.data);
    } catch (error) {
      console.error("Error communicating with Rasa:", error.message);
      throw new Error(`Failed to get response from Rasa: ${error.message}`);
    }
  }

  parseRasaResponse(rasaData) {
    if (!Array.isArray(rasaData) || rasaData.length === 0) {
      throw new Error("Invalid Rasa response format");
    }

    const firstResponse = rasaData[0];

    // Extract intent
    const intent = firstResponse.intent
      ? {
          name: firstResponse.intent.name,
          confidence: firstResponse.intent.confidence,
        }
      : null;

    // Extract entities
    const entities = firstResponse.entities
      ? firstResponse.entities.map((entity) => ({
          entity: entity.entity,
          value: entity.value,
          start: entity.start,
          end: entity.end,
          confidence: entity.confidence,
        }))
      : [];

    // Extract text
    const text = firstResponse.text || "";

    return {
      intent,
      entities,
      text,
    };
  }

  getIntentName(response) {
    return response.intent ? response.intent.name : null;
  }

  getEntities(response) {
    return response.entities || [];
  }

  getEntityValue(response, entityName) {
    const entities = this.getEntities(response);
    const entity = entities.find((e) => e.entity === entityName);
    return entity ? entity.value : null;
  }

  getIntentConfidence(response) {
    return response.intent ? response.intent.confidence : 0;
  }
}

module.exports = RasaService;
