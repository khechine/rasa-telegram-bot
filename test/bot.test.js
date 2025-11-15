const MessageHandler = require("../src/handlers/messageHandler");
const CallbackHandler = require("../src/handlers/callbackHandler");
const RasaService = require("../src/services/rasaService");
const Parsers = require("../src/utils/parsers");
const ResponseBuilder = require("../src/utils/responseBuilder");

// Mock Telegram Bot
const mockBot = {
  sendMessage: jest.fn().mockResolvedValue({}),
  answerCallbackQuery: jest.fn().mockResolvedValue({}),
  editMessageText: jest.fn().mockResolvedValue({}),
  deleteMessage: jest.fn().mockResolvedValue({}),
};

// Mock Rasa Service
const mockRasaService = {
  sendMessage: jest.fn(),
};

describe("Bot Integration Tests", () => {
  let messageHandler;
  let callbackHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    messageHandler = new MessageHandler(mockBot, mockRasaService);
    callbackHandler = new CallbackHandler(mockBot, mockRasaService);
  });

  describe("Customer Creation Flow", () => {
    test("should handle valid customer creation", async () => {
      const mockMsg = {
        chat: { id: 123 },
        text: "Je veux créer un client nommé Dupont avec email dupont@example.com",
      };

      const mockRasaResponse = {
        intent: { name: "create_customer", confidence: 0.95 },
        entities: [
          { entity: "customer_name", value: "Dupont", start: 22, end: 28 },
          { entity: "email", value: "dupont@example.com", start: 35, end: 53 },
        ],
        text: mockMsg.text,
      };

      mockRasaService.sendMessage.mockResolvedValue(mockRasaResponse);

      await messageHandler.handleMessage(mockMsg);

      expect(mockRasaService.sendMessage).toHaveBeenCalledWith(
        mockMsg.text,
        "123"
      );
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Dupont"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        })
      );
    });

    test("should handle invalid email in customer creation", async () => {
      const mockMsg = {
        chat: { id: 123 },
        text: "Créer client Dupont email invalid-email",
      };

      const mockRasaResponse = {
        intent: { name: "create_customer", confidence: 0.95 },
        entities: [
          { entity: "customer_name", value: "Dupont", start: 14, end: 20 },
          { entity: "email", value: "invalid-email", start: 26, end: 39 },
        ],
        text: mockMsg.text,
      };

      mockRasaService.sendMessage.mockResolvedValue(mockRasaResponse);

      await messageHandler.handleMessage(mockMsg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Format d'email invalide"),
        {}
      );
    });

    test("should handle missing customer name", async () => {
      const mockMsg = {
        chat: { id: 123 },
        text: "Créer client avec email dupont@example.com",
      };

      const mockRasaResponse = {
        intent: { name: "create_customer", confidence: 0.95 },
        entities: [
          { entity: "email", value: "dupont@example.com", start: 21, end: 39 },
        ],
        text: mockMsg.text,
      };

      mockRasaService.sendMessage.mockResolvedValue(mockRasaResponse);

      await messageHandler.handleMessage(mockMsg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Nom du client manquant"),
        {}
      );
    });
  });

  describe("Callback Handling", () => {
    test("should handle create_customer callback", async () => {
      const mockQuery = {
        id: "query123",
        message: { chat: { id: 123 } },
        data: "create_customer",
      };

      await callbackHandler.handleCallback(mockQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("query123");
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          text: expect.stringContaining("nom et l'email du client"),
        }),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        })
      );
    });

    test("should handle help callback", async () => {
      const mockQuery = {
        id: "query123",
        message: { chat: { id: 123 } },
        data: "help",
      };

      await callbackHandler.handleCallback(mockQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("query123");
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Bot de Gestion Client"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        })
      );
    });
  });

  describe("Parsers", () => {
    test("should parse intent correctly", () => {
      const response = {
        intent: { name: "create_customer", confidence: 0.95 },
      };

      const intent = Parsers.parseIntent(response);
      expect(intent.name).toBe("create_customer");
      expect(intent.confidence).toBe(0.95);
    });

    test("should parse entities correctly", () => {
      const response = {
        entities: [
          { entity: "customer_name", value: "Dupont", start: 22, end: 28 },
          { entity: "email", value: "dupont@example.com", start: 35, end: 53 },
        ],
      };

      const entities = Parsers.parseEntities(response);
      expect(entities).toHaveLength(2);
      expect(entities[0].name).toBe("customer_name");
      expect(entities[0].value).toBe("Dupont");
    });

    test("should validate customer creation entities - valid", () => {
      const entities = [
        { name: "customer_name", value: "Dupont" },
        { name: "email", value: "dupont@example.com" },
      ];

      const validation = Parsers.validateCustomerCreationEntities(entities);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.data.name).toBe("Dupont");
      expect(validation.data.email).toBe("dupont@example.com");
    });

    test("should validate customer creation entities - invalid email", () => {
      const entities = [
        { name: "customer_name", value: "Dupont" },
        { name: "email", value: "invalid-email" },
      ];

      const validation = Parsers.validateCustomerCreationEntities(entities);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Format d'email invalide");
    });

    test("should detect confidence levels", () => {
      expect(Parsers.detectIntentConfidence({ confidence: 0.95 })).toBe("high");
      expect(Parsers.detectIntentConfidence({ confidence: 0.75 })).toBe(
        "medium"
      );
      expect(Parsers.detectIntentConfidence({ confidence: 0.5 })).toBe("low");
    });
  });

  describe("Response Builder", () => {
    test("should build success customer creation response", () => {
      const customer = { id: "1", name: "Dupont", email: "dupont@example.com" };
      const response = ResponseBuilder.buildSuccessCustomerCreation(customer);

      expect(response.text).toContain("Dupont");
      expect(response.text).toContain("créé avec succès");
      expect(response.parse_mode).toBe("Markdown");
      expect(response.reply_markup).toBeDefined();
    });

    test("should build error response", () => {
      const response = ResponseBuilder.buildErrorResponse("Test error");
      expect(response.text).toContain("❌ Test error");
      expect(response.parse_mode).toBe("Markdown");
    });

    test("should build help response", () => {
      const response = ResponseBuilder.buildHelpResponse();
      expect(response.text).toContain("🤖 *Bot de Gestion Client*");
      expect(response.parse_mode).toBe("Markdown");
      expect(response.reply_markup).toBeDefined();
    });
  });

  describe("Commands", () => {
    test("should handle /start command", async () => {
      const mockMsg = {
        chat: { id: 123 },
        text: "/start",
      };

      await messageHandler.handleMessage(mockMsg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("👋 Bonjour"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        })
      );
    });

    test("should handle /help command", async () => {
      const mockMsg = {
        chat: { id: 123 },
        text: "/help",
      };

      await messageHandler.handleMessage(mockMsg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("🤖 *Bot de Gestion Client*"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.any(Object),
        })
      );
    });
  });
});
