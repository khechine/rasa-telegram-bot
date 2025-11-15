const axios = require("axios");

class RasaService {
  constructor(rasaUrl, webhookPath) {
    this.rasaUrl = rasaUrl;
    this.webhookPath = webhookPath;
    this.fullUrl = `${rasaUrl}${webhookPath}`;
  }

  async sendMessage(message, senderId = "telegram_user") {
    try {
      // Try webhook endpoint first (for conversational responses)
      const webhookPayload = {
        sender: senderId,
        message: {
          text: message,
        },
      };

      const webhookResponse = await axios.post(this.fullUrl, webhookPayload, {
        timeout: 5000, // 5 seconds timeout
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If webhook returns data, use it
      if (
        webhookResponse.data &&
        Array.isArray(webhookResponse.data) &&
        webhookResponse.data.length > 0
      ) {
        return this.parseRasaResponse(webhookResponse.data);
      }

      // Fallback to NLU parsing endpoint
      const nluUrl = `${this.rasaUrl}/model/parse`;
      const nluPayload = {
        text: message,
      };

      const nluResponse = await axios.post(nluUrl, nluPayload, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Convert NLU response to webhook format
      const webhookFormat = [
        {
          intent: nluResponse.data.intent,
          entities: nluResponse.data.entities || [],
          text: nluResponse.data.text || message,
        },
      ];

      return this.parseRasaResponse(webhookFormat);
    } catch (error) {
      console.error("Error communicating with Rasa:", error.message);
      throw new Error(`Failed to get response from Rasa: ${error.message}`);
    }
  }

  parseRasaResponse(rasaData) {
    // Handle empty response (no intent recognized)
    if (!Array.isArray(rasaData) || rasaData.length === 0) {
      return {
        intent: { name: "nlu_fallback", confidence: 0.0 },
        entities: [],
        text: "",
      };
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
