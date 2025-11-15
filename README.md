# Rasa Telegram Bot - ERPNext Integration

Un bot Telegram intelligent intégré avec Rasa et ERPNext pour la gestion complète des clients, devis et factures.

## 🚀 Démarrage rapide

1. **Clonez et installez :**

   ```bash
   git clone <repository-url>
   cd rasa-telegram-bot
   npm install
   ```

2. **Configurez l'environnement :**

   ```bash
   # Copiez et éditez le fichier .env
   cp .env.example .env
   ```

   Éditez `.env` avec vos configurations :

   ```env
   # Telegram
   TELEGRAM_TOKEN=votre_token_telegram

   # Rasa
   RASA_URL=http://localhost:5005
   RASA_WEBHOOK_PATH=/webhooks/rest/webhook

   # ERPNext
   ERPNext_URL=https://votre-instance-erpnext.com
   ERPNext_API_KEY=votre_api_key
   ERPNext_API_SECRET=votre_api_secret
   ```

3. **Lancez les services :**

   ```bash
   # Terminal 1: Rasa
   rasa run --enable-api

   # Terminal 2: Bot
   npm start
   ```

## ✨ Fonctionnalités

### 🤖 Intelligence Artificielle

- **Rasa NLU** : Traitement du langage naturel avancé
- **Reconnaissance d'intentions** : create_customer, list_customers, get_quotation, etc.
- **Extraction d'entités** : nom, email, téléphone, adresse

### 🏢 Intégration ERPNext Complète

- **Gestion clients** : CRUD complet (Création, consultation, mise à jour)
- **Devis** : Création et suivi des quotations
- **Factures** : Gestion des sales invoices
- **Achats** : Suivi des purchase invoices
- **Stock** : Gestion des niveaux de stock
- **Articles** : Catalogue des produits

### 📊 Rapports Complets

- **Rapports de ventes** : Factures, montants, statuts
- **Rapports clients** : Liste, segments, territoires
- **Rapports achats** : Fournisseurs, commandes
- **Rapports devis** : Conversions, valeurs
- **Rapports stock** : Niveaux, alertes, mouvements
- **Rapports financiers** : Revenus, dépenses, marges
- **Métriques performance** : KPIs, indicateurs clés
- **Tableau de bord** : Vue d'ensemble temps réel
- **Rapports personnalisés** : Support des rapports ERPNext custom

### 💬 Interface Utilisateur Avancée

- **Menu principal** : Navigation hiérarchique
- **Menu rapports** : Accès rapide à tous les rapports
- **Boutons inline** : Navigation intuitive
- **Messages formatés** : Markdown avec emojis
- **Gestion d'erreurs** : Messages explicites et contextuels
- **Validation automatique** : Emails, données requises
- **Pagination** : Gestion des listes longues

### 🧪 Qualité du Code

- **15 tests unitaires** : Couverture complète
- **Architecture modulaire** : Services, handlers, utils
- **Fallback gracieux** : Fonctionne sans ERPNext si nécessaire

## 📋 Prérequis

- **Node.js** ≥ 18.0.0
- **Token Telegram Bot** (obtenu via @BotFather)
- **Serveur Rasa** opérationnel (optionnel mais recommandé)
- **Instance ERPNext** avec API activée (optionnel)

## 🔧 Configuration ERPNext

### 1. Créer une API Key

1. Allez dans **User** > **API Key**
2. Créez une nouvelle clé pour votre utilisateur
3. Copiez l'**API Key** et le **API Secret**

### 2. Configurer les permissions

Assurez-vous que l'utilisateur a les droits sur :

- **Customer** (création, lecture)
- **Quotation** (création, lecture)
- **Sales Invoice** (création, lecture)

### 3. URL de l'instance

Utilisez l'URL complète de votre instance ERPNext :

```
https://yourcompany.erpnext.com
```

## 🎯 Utilisation

### Création d'un client

```
Utilisateur: "Je veux créer un client nommé Dupont avec email dupont@example.com"
Bot: ✅ Client Dupont créé avec succès !
[👤 Créer un autre client] [📋 Voir les clients] [📄 Voir les devis]
```

### Gestion des rapports

```
Utilisateur: "Rapport de ventes"
Bot: 📊 Rapport des Ventes
📋 Factures de vente soumises

1. SINV-2025-0001
   Client/Fournisseur: Dupont
   Date: 15/11/2025
   Montant: 2500.00 TND
   Statut: Paid

💰 Total: 2500.00 TND (1 documents)
```

### Menu interactif

- **📊 Rapports** : Accès au menu complet des rapports
- **📈 Dashboard** : Vue d'ensemble des métriques
- **💰 Ventes** : Rapport de ventes détaillé
- **👥 Clients** : Liste et analyse clients
- **📦 Stock** : Niveaux et alertes de stock
- **📈 Financier** : Analyse financière mensuelle

### Commandes vocales

- "Donne-moi le rapport des ventes"
- "Montre-moi les clients"
- "Quel est le stock actuel ?"
- "Tableau de bord"
- "Rapport financier du mois"
- "Métriques de performance"

### Commandes disponibles

- `/start` : Initialisation
- `/help` : Aide détaillée
- `/customers` : Liste rapide des clients

## 📁 Architecture

```
├── src/
│   ├── services/
│   │   ├── rasaService.js      # API Rasa
│   │   └── erpnextService.js   # API ERPNext
│   ├── handlers/
│   │   ├── messageHandler.js   # Messages texte
│   │   ├── callbackHandler.js  # Boutons inline
│   │   └── customerHandler.js  # Logique métier
│   └── utils/
│       ├── parsers.js          # Parsing NLU
│       └── responseBuilder.js  # Construction réponses
├── test/
└── .env                        # Configuration
```

## 🧪 Tests

```bash
npm test  # Lance tous les tests (15 tests)
```

## 🔄 Mode de fonctionnement

Le bot fonctionne en **deux modes** :

### Mode ERPNext activé

- Toutes les données sont stockées dans ERPNext
- Fonctionnalités complètes : clients, devis, factures
- Synchronisation temps réel

### Mode local (fallback)

- Stockage en mémoire local
- Fonctionnalités de base : clients uniquement
- Si ERPNext n'est pas disponible

## 🚀 Déploiement

### Production

```bash
# Build
npm run build

# Déploiement avec PM2
pm2 start src/app.js --name rasa-telegram-bot
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

## 🔒 Sécurité

- **Tokens chiffrés** : API keys stockées de manière sécurisée
- **Validation stricte** : Toutes les entrées utilisateur validées
- **Rate limiting** : Protection contre les abus
- **Logs sécurisés** : Pas de données sensibles dans les logs

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ pour simplifier la gestion d'entreprise**
