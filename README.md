# Rasa Telegram Bot - Gestion Client

Un bot Telegram intégré avec Rasa pour la gestion des clients et devis.

## Fonctionnalités

- 🤖 Intégration complète avec Rasa pour le traitement du langage naturel
- 👥 Création et gestion des clients
- 📄 Gestion des devis (en développement)
- 🎯 Reconnaissance d'intentions et extraction d'entités
- 🔒 Validation des données et gestion d'erreurs
- ⌨️ Interface avec boutons inline pour une meilleure UX

## Prérequis

- Node.js (version 18 ou supérieure)
- Rasa (serveur Rasa en cours d'exécution sur localhost:5005)
- Token de bot Telegram (obtenu auprès de @BotFather)

## Installation

1. Clonez le repository :

```bash
git clone <repository-url>
cd rasa-telegram-bot
```

2. Installez les dépendances :

```bash
npm install
```

3. Configurez les variables d'environnement :

```bash
cp .env.example .env
```

Éditez le fichier `.env` :

```env
TELEGRAM_TOKEN=votre_token_telegram_bot
RASA_URL=http://localhost:5005
RASA_WEBHOOK_PATH=/webhooks/rest/webhook
NODE_ENV=development
```

## Configuration Rasa

Assurez-vous que votre serveur Rasa est configuré avec les intents suivants :

- `create_customer` : Pour créer un nouveau client
- `list_customers` : Pour lister les clients
- `get_quotation` : Pour les devis
- `help` : Pour l'aide
- `greet` : Pour les salutations

Et les entités :

- `customer_name` : Nom du client
- `email` : Adresse email
- `phone` : Numéro de téléphone (optionnel)
- `address` : Adresse (optionnel)

## Utilisation

### Démarrage du bot

```bash
npm start
```

Ou en mode développement avec rechargement automatique :

```bash
npm run dev
```

### Démarrage de Rasa

Dans un terminal séparé, lancez votre serveur Rasa :

```bash
rasa run --enable-api
```

## Exemples d'interaction

### Création d'un client

```
Utilisateur: "Je veux créer un client nommé Dupont avec email dupont@example.com"
Bot: "Client Dupont créé avec succès ! Que souhaitez-vous faire maintenant ?"
[Créer un autre client] [Voir les devis] [Aide]
```

### Liste des clients

```
Utilisateur: "Voir mes clients"
Bot: "Liste des clients:
1. Dupont (dupont@example.com)
2. Martin (martin@test.com)"
```

## Structure du projet

```
rasa-telegram-bot/
├── src/
│   ├── handlers/
│   │   ├── messageHandler.js      # Gestion des messages texte
│   │   ├── callbackHandler.js     # Gestion des callbacks boutons
│   │   └── customerHandler.js     # Logique métier clients
│   ├── services/
│   │   └── rasaService.js         # Service d'intégration Rasa
│   └── utils/
│       ├── parsers.js             # Parsing intents/entités
│       └── responseBuilder.js     # Construction réponses
├── .env                            # Variables d'environnement
├── package.json                    # Dépendances et scripts
└── README.md                       # Documentation
```

## API Reference

### RasaService

- `sendMessage(message, senderId)` : Envoie un message à Rasa
- `parseRasaResponse(data)` : Parse la réponse de Rasa
- `getIntentName(response)` : Extrait le nom de l'intention
- `getEntityValue(response, entityName)` : Extrait la valeur d'une entité

### Parsers

- `parseIntent(response)` : Parse l'intention
- `parseEntities(response)` : Parse les entités
- `validateCustomerCreationEntities(entities)` : Valide les données client
- `detectIntentConfidence(intent)` : Évalue la confiance de l'intention

### ResponseBuilder

- `buildSuccessCustomerCreation(customer)` : Message succès création client
- `buildErrorResponse(errorMessage)` : Message d'erreur
- `buildHelpResponse()` : Message d'aide
- `buildWelcomeMessage()` : Message de bienvenue

## Tests

```bash
npm test
```

## Déploiement

1. Configurez vos variables d'environnement de production
2. Construisez l'application :

```bash
npm run build
```

3. Déployez sur votre serveur :

```bash
npm start
```

## Gestion d'erreurs

Le bot gère plusieurs types d'erreurs :

- Erreurs de connexion à Rasa
- Données de validation invalides
- Messages trop longs
- Limite de taux (rate limiting)
- Erreurs de callback Telegram

## Sécurité

- Validation des entrées utilisateur
- Rate limiting basique
- Gestion sécurisée des tokens
- Logs d'erreurs (pas de données sensibles)

## Développement futur

- [ ] Intégration base de données persistante
- [ ] Gestion complète des devis
- [ ] Authentification utilisateurs
- [ ] Analytics et métriques
- [ ] Support multi-langues
- [ ] Intégration webhook pour notifications

## Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## Support

Pour obtenir de l'aide :

- Ouvrez une issue sur GitHub
- Consultez la documentation Rasa
- Vérifiez les logs du bot pour les erreurs
