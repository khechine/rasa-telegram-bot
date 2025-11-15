const ERPNextService = require("../services/erpnextService");

class ReportHandler {
  constructor(erpnextService = null) {
    this.erpnextService = erpnextService;
    this.useERPNext = erpnextService && erpnextService.isConnected;
  }

  async generateReport(reportType, filters = {}, chatId) {
    if (!this.useERPNext) {
      await this.sendMessage(
        chatId,
        "❌ Fonction rapports non disponible (ERPNext non configuré)"
      );
      return;
    }

    try {
      let reportData;
      let reportTitle;
      let reportDescription;

      switch (reportType) {
        case "sales":
          reportData = await this.erpnextService.getSalesReport(filters);
          reportTitle = "📊 Rapport des Ventes";
          reportDescription = "Factures de vente soumises";
          break;

        case "customers":
          reportData = await this.erpnextService.getCustomerReport(filters);
          reportTitle = "👥 Rapport des Clients";
          reportDescription = "Liste des clients enregistrés";
          break;

        case "purchases":
          reportData = await this.erpnextService.getPurchaseReport(filters);
          reportTitle = "🛒 Rapport des Achats";
          reportDescription = "Factures d'achat soumises";
          break;

        case "invoices":
          reportData = await this.erpnextService.getInvoiceReport(filters);
          reportTitle = "📄 Rapport des Factures";
          reportDescription = "Factures clients avec statuts";
          break;

        case "quotations":
          reportData = await this.erpnextService.getQuotationReport(filters);
          reportTitle = "📝 Rapport des Devis";
          reportDescription = "Devis clients actifs";
          break;

        case "stock":
          reportData = await this.erpnextService.getStockReport(filters);
          reportTitle = "📦 Rapport de Stock";
          reportDescription = "Niveaux de stock par article";
          break;

        case "items":
          reportData = await this.erpnextService.getItemReport(filters);
          reportTitle = "📋 Catalogue des Articles";
          reportDescription = "Articles disponibles";
          break;

        case "dashboard":
          reportData = await this.erpnextService.getDashboardData();
          return await this.sendDashboardReport(chatId, reportData);

        case "financial":
          reportData = await this.erpnextService.getFinancialSummary(
            filters.period || "monthly"
          );
          return await this.sendFinancialReport(chatId, reportData);

        case "metrics":
          reportData = await this.erpnextService.getPerformanceMetrics();
          return await this.sendMetricsReport(chatId, reportData);

        default:
          // Try custom report
          try {
            reportData = await this.erpnextService.getCustomReport(
              reportType,
              filters
            );
            reportTitle = `📊 Rapport: ${reportType}`;
            reportDescription = "Rapport personnalisé";
          } catch (error) {
            await this.sendMessage(
              chatId,
              `❌ Rapport "${reportType}" non trouvé`
            );
            return;
          }
      }

      await this.sendFormattedReport(
        chatId,
        reportTitle,
        reportDescription,
        reportData,
        reportType
      );
    } catch (error) {
      console.error("Error generating report:", error);
      await this.sendMessage(
        chatId,
        `❌ Erreur lors de la génération du rapport: ${error.message}`
      );
    }
  }

  async sendFormattedReport(chatId, title, description, data, reportType) {
    let message = `${title}\n\n`;
    message += `📋 ${description}\n\n`;

    if (!data || data.length === 0) {
      message += "📭 Aucune donnée trouvée pour ce rapport.";
    } else {
      // Format based on report type
      switch (reportType) {
        case "sales":
        case "purchases":
        case "invoices":
          message += this.formatFinancialReport(data);
          break;

        case "customers":
          message += this.formatCustomerReport(data);
          break;

        case "quotations":
          message += this.formatQuotationReport(data);
          break;

        case "stock":
          message += this.formatStockReport(data);
          break;

        case "items":
          message += this.formatItemReport(data);
          break;

        default:
          message += this.formatGenericReport(data);
      }

      if (data.length >= 50) {
        message += `\n\n⚠️ Affichage limité aux 50 premiers résultats`;
      }
    }

    message += `\n\n📅 Généré le: ${new Date().toLocaleString("fr-TN")}`;

    await this.sendMessage(chatId, message);
  }

  formatFinancialReport(data) {
    let message = "";
    let total = 0;

    data.forEach((item, index) => {
      message += `${index + 1}. **${item.name}**\n`;
      message += `   Client/Fournisseur: ${
        item.customer || item.supplier || "N/A"
      }\n`;
      message += `   Date: ${new Date(item.posting_date).toLocaleDateString(
        "fr-TN"
      )}\n`;
      message += `   Montant: ${item.total || item.grand_total || 0} TND\n`;
      message += `   Statut: ${item.status}\n`;

      if (item.outstanding_amount) {
        message += `   Restant: ${item.outstanding_amount} TND\n`;
      }

      message += "\n";
      total += item.total || item.grand_total || 0;
    });

    message += `💰 **Total: ${total.toFixed(2)} TND** (${
      data.length
    } documents)`;
    return message;
  }

  formatCustomerReport(data) {
    let message = "";

    data.forEach((customer, index) => {
      message += `${index + 1}. **${customer.customer_name}**\n`;
      if (customer.email_id) message += `   📧 ${customer.email_id}\n`;
      if (customer.mobile_no) message += `   📱 ${customer.mobile_no}\n`;
      if (customer.territory) message += `   📍 ${customer.territory}\n`;
      message += `   🏢 ${customer.customer_group}\n`;
      message += `   📅 Créé: ${new Date(customer.creation).toLocaleDateString(
        "fr-TN"
      )}\n\n`;
    });

    message += `👥 **Total: ${data.length} clients**`;
    return message;
  }

  formatQuotationReport(data) {
    let message = "";
    let total = 0;

    data.forEach((quotation, index) => {
      message += `${index + 1}. **${quotation.name}**\n`;
      message += `   Client: ${quotation.party_name}\n`;
      message += `   Date: ${new Date(
        quotation.transaction_date
      ).toLocaleDateString("fr-TN")}\n`;
      message += `   Montant: ${quotation.total || 0} TND\n`;
      message += `   Statut: ${quotation.status}\n`;

      if (quotation.valid_till) {
        message += `   Valide jusqu'au: ${new Date(
          quotation.valid_till
        ).toLocaleDateString("fr-TN")}\n`;
      }

      message += "\n";
      total += quotation.total || 0;
    });

    message += `📊 **Total devis: ${total.toFixed(2)} TND** (${
      data.length
    } devis)`;
    return message;
  }

  formatStockReport(data) {
    let message = "";
    const groupedByItem = {};

    // Group by item
    data.forEach((item) => {
      if (!groupedByItem[item.item_code]) {
        groupedByItem[item.item_code] = [];
      }
      groupedByItem[item.item_code].push(item);
    });

    let index = 1;
    Object.keys(groupedByItem).forEach((itemCode) => {
      const itemData = groupedByItem[itemCode][0]; // Take first for summary
      const totalQty = groupedByItem[itemCode].reduce(
        (sum, item) => sum + item.actual_qty,
        0
      );

      message += `${index}. **${itemCode}**\n`;
      message += `   Quantité: ${totalQty}\n`;
      message += `   Valeur: ${itemData.valuation_rate || 0} TND/unité\n`;
      message += `   Entrepôt: ${itemData.warehouse}\n\n`;

      index++;
    });

    message += `📦 **${Object.keys(groupedByItem).length} articles en stock**`;
    return message;
  }

  formatItemReport(data) {
    let message = "";

    data.forEach((item, index) => {
      message += `${index + 1}. **${item.item_name}**\n`;
      message += `   Code: ${item.name}\n`;
      message += `   Catégorie: ${item.item_group}\n`;
      message += `   Unité: ${item.stock_uom}\n`;
      message += `   Prix de vente: ${item.valuation_rate || 0} TND\n`;

      if (item.last_purchase_rate) {
        message += `   Dernier achat: ${item.last_purchase_rate} TND\n`;
      }

      message += "\n";
    });

    message += `📋 **Total: ${data.length} articles**`;
    return message;
  }

  formatGenericReport(data) {
    let message = "";

    data.forEach((item, index) => {
      message += `${index + 1}. **${
        item.name || item.title || `Item ${index + 1}`
      }**\n`;

      // Display key fields
      Object.keys(item).forEach((key) => {
        if (key !== "name" && item[key] && typeof item[key] !== "object") {
          message += `   ${key}: ${item[key]}\n`;
        }
      });

      message += "\n";
    });

    message += `📊 **${data.length} éléments**`;
    return message;
  }

  async sendDashboardReport(chatId, data) {
    let message = "📊 **Tableau de Bord ERPNext**\n\n";

    // Sales summary
    if (data.sales && data.sales.length > 0) {
      const totalSales = data.sales.reduce(
        (sum, sale) => sum + (sale.grand_total || 0),
        0
      );
      message += `💰 **Ventes récentes:** ${totalSales.toFixed(2)} TND\n`;
      message += `   ${data.sales.length} factures\n\n`;
    }

    // Customers
    if (data.customers && data.customers.length > 0) {
      message += `👥 **Clients actifs:** ${data.customers.length}\n\n`;
    }

    // Quotations
    if (data.quotations && data.quotations.length > 0) {
      const totalQuotes = data.quotations.reduce(
        (sum, quote) => sum + (quote.total || 0),
        0
      );
      message += `📝 **Devis en cours:** ${totalQuotes.toFixed(2)} TND\n`;
      message += `   ${data.quotations.length} devis\n\n`;
    }

    // Stock alerts
    if (data.stock && data.stock.length > 0) {
      const lowStockItems = data.stock.filter(
        (item) => item.actual_qty <= 10
      ).length;
      if (lowStockItems > 0) {
        message += `⚠️ **Stock faible:** ${lowStockItems} articles\n\n`;
      }
    }

    message += `📅 Dernière mise à jour: ${new Date(
      data.timestamp
    ).toLocaleString("fr-TN")}`;

    await this.sendMessage(chatId, message);
  }

  async sendFinancialReport(chatId, data) {
    let message = `💰 **Résumé Financier - ${data.period}**\n\n`;

    if (data.sales && data.sales.length > 0) {
      const totalSales = data.sales.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      );
      message += `📈 **Ventes:** ${totalSales.toFixed(2)} TND\n`;
    }

    if (data.purchases && data.purchases.length > 0) {
      const totalPurchases = data.purchases.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      );
      message += `📉 **Achats:** ${totalPurchases.toFixed(2)} TND\n`;
    }

    if (data.sales && data.purchases) {
      const profit =
        data.sales.reduce((sum, item) => sum + (item.total || 0), 0) -
        data.purchases.reduce((sum, item) => sum + (item.total || 0), 0);
      message += `💎 **Marge:** ${profit.toFixed(2)} TND\n`;
    }

    message += `\n📅 Généré le: ${new Date(data.generated_at).toLocaleString(
      "fr-TN"
    )}`;

    await this.sendMessage(chatId, message);
  }

  async sendMetricsReport(chatId, data) {
    let message = "📈 **Métriques de Performance**\n\n";

    message += `👥 **Clients totaux:** ${data.total_customers}\n`;
    message += `💰 **Ventes totales:** ${data.total_sales.toFixed(2)} TND\n`;
    message += `⏳ **Factures en attente:** ${data.pending_invoices}\n`;
    message += `📦 **Articles stock faible:** ${data.low_stock_items}\n`;

    message += `\n📅 Généré le: ${new Date(data.generated_at).toLocaleString(
      "fr-TN"
    )}`;

    await this.sendMessage(chatId, message);
  }

  async sendMessage(chatId, text) {
    // This will be set by the parent handler
    if (this.bot) {
      await this.bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    }
  }

  setBot(bot) {
    this.bot = bot;
  }
}

module.exports = ReportHandler;
