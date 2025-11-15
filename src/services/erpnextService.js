const { FrappeApp } = require("frappe-js-sdk");

class ERPNextService {
  constructor(url, apiKey, apiSecret) {
    this.url = url;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.frappe = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      this.frappe = new FrappeApp(this.url, {
        useToken: true,
        token: () => this.getToken(),
        type: "token",
      });

      // Test connection
      await this.testConnection();
      this.isConnected = true;
      console.log("ERPNext connection established successfully");
    } catch (error) {
      console.error("Failed to initialize ERPNext connection:", error.message);
      this.isConnected = false;
      throw error;
    }
  }

  getToken() {
    return btoa(`${this.apiKey}:${this.apiSecret}`);
  }

  async testConnection() {
    try {
      const response = await this.frappe.call({
        method: "frappe.handler.ping",
      });
      return response;
    } catch (error) {
      throw new Error(`ERPNext connection test failed: ${error.message}`);
    }
  }

  // Customer operations
  async createCustomer(customerData) {
    try {
      const customerPayload = {
        doctype: "Customer",
        customer_name: customerData.name,
        customer_type: "Individual",
        territory: "Rest Of The World",
        customer_group: "Individual",
      };

      // Add optional fields
      if (customerData.email) {
        customerPayload.email_id = customerData.email;
      }
      if (customerData.phone) {
        customerPayload.mobile_no = customerData.phone;
      }
      if (customerData.address) {
        // Create address as well
        customerPayload.addresses = [
          {
            doctype: "Address",
            address_title: customerData.name,
            address_type: "Billing",
            address_line1: customerData.address,
            city: "Unknown",
            country: "Tunisia",
          },
        ];
      }

      const response = await this.frappe.db.insert(customerPayload);
      return {
        id: response.name,
        name: response.customer_name,
        email: response.email_id,
        createdAt: response.creation,
      };
    } catch (error) {
      console.error("Error creating customer in ERPNext:", error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  async getCustomer(customerId) {
    try {
      const response = await this.frappe.db.get_doc("Customer", customerId);
      return {
        id: response.name,
        name: response.customer_name,
        email: response.email_id,
        phone: response.mobile_no,
        createdAt: response.creation,
      };
    } catch (error) {
      console.error("Error getting customer from ERPNext:", error);
      throw new Error(`Failed to get customer: ${error.message}`);
    }
  }

  async getCustomers() {
    try {
      const response = await this.frappe.db.get_list("Customer", {
        fields: ["name", "customer_name", "email_id", "mobile_no", "creation"],
        limit: 50,
      });

      return response.map((customer) => ({
        id: customer.name,
        name: customer.customer_name,
        email: customer.email_id,
        phone: customer.mobile_no,
        createdAt: customer.creation,
      }));
    } catch (error) {
      console.error("Error getting customers from ERPNext:", error);
      throw new Error(`Failed to get customers: ${error.message}`);
    }
  }

  async updateCustomer(customerId, updates) {
    try {
      const updatePayload = {};

      if (updates.name) updatePayload.customer_name = updates.name;
      if (updates.email) updatePayload.email_id = updates.email;
      if (updates.phone) updatePayload.mobile_no = updates.phone;

      const response = await this.frappe.db.set_value(
        "Customer",
        customerId,
        updatePayload
      );
      return {
        id: response.name,
        name: response.customer_name,
        email: response.email_id,
        phone: response.mobile_no,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error updating customer in ERPNext:", error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  // Quotation operations
  async createQuotation(quotationData) {
    try {
      const quotationPayload = {
        doctype: "Quotation",
        quotation_to: "Customer",
        party_name: quotationData.customerId,
        company: "Your Company", // Configure this
        items: quotationData.items || [],
        transaction_date: new Date().toISOString().split("T")[0],
      };

      const response = await this.frappe.db.insert(quotationPayload);
      return {
        id: response.name,
        customerId: response.party_name,
        status: response.status,
        total: response.total,
        createdAt: response.creation,
      };
    } catch (error) {
      console.error("Error creating quotation in ERPNext:", error);
      throw new Error(`Failed to create quotation: ${error.message}`);
    }
  }

  async getQuotations(customerId = null) {
    try {
      const filters = {};
      if (customerId) {
        filters.party_name = customerId;
      }

      const response = await this.frappe.db.get_list("Quotation", {
        fields: [
          "name",
          "party_name",
          "status",
          "total",
          "transaction_date",
          "creation",
        ],
        filters: filters,
        limit: 20,
      });

      return response.map((quotation) => ({
        id: quotation.name,
        customerId: quotation.party_name,
        status: quotation.status,
        total: quotation.total,
        date: quotation.transaction_date,
        createdAt: quotation.creation,
      }));
    } catch (error) {
      console.error("Error getting quotations from ERPNext:", error);
      throw new Error(`Failed to get quotations: ${error.message}`);
    }
  }

  // Sales Invoice operations
  async createSalesInvoice(invoiceData) {
    try {
      const invoicePayload = {
        doctype: "Sales Invoice",
        customer: invoiceData.customerId,
        company: "Your Company", // Configure this
        items: invoiceData.items || [],
        posting_date: new Date().toISOString().split("T")[0],
      };

      const response = await this.frappe.db.insert(invoicePayload);
      return {
        id: response.name,
        customerId: response.customer,
        status: response.status,
        total: response.total,
        createdAt: response.creation,
      };
    } catch (error) {
      console.error("Error creating sales invoice in ERPNext:", error);
      throw new Error(`Failed to create sales invoice: ${error.message}`);
    }
  }

  async getSalesInvoices(customerId = null) {
    try {
      const filters = {};
      if (customerId) {
        filters.customer = customerId;
      }

      const response = await this.frappe.db.get_list("Sales Invoice", {
        fields: [
          "name",
          "customer",
          "status",
          "total",
          "posting_date",
          "creation",
        ],
        filters: filters,
        limit: 20,
      });

      return response.map((invoice) => ({
        id: invoice.name,
        customerId: invoice.customer,
        status: invoice.status,
        total: invoice.total,
        date: invoice.posting_date,
        createdAt: invoice.creation,
      }));
    } catch (error) {
      console.error("Error getting sales invoices from ERPNext:", error);
      throw new Error(`Failed to get sales invoices: ${error.message}`);
    }
  }

  // Generic method for any DocType
  async getDocList(doctype, fields = ["name"], filters = {}, limit = 20) {
    try {
      const response = await this.frappe.db.get_list(doctype, {
        fields: fields,
        filters: filters,
        limit: limit,
      });
      return response;
    } catch (error) {
      console.error(`Error getting ${doctype} list from ERPNext:`, error);
      throw new Error(`Failed to get ${doctype} list: ${error.message}`);
    }
  }

  async getDoc(doctype, name) {
    try {
      const response = await this.frappe.db.get_doc(doctype, name);
      return response;
    } catch (error) {
      console.error(`Error getting ${doctype} ${name} from ERPNext:`, error);
      throw new Error(`Failed to get ${doctype}: ${error.message}`);
    }
  }

  async insertDoc(doctype, data) {
    try {
      const response = await this.frappe.db.insert({
        doctype: doctype,
        ...data,
      });
      return response;
    } catch (error) {
      console.error(`Error inserting ${doctype} in ERPNext:`, error);
      throw new Error(`Failed to insert ${doctype}: ${error.message}`);
    }
  }

  // Reporting methods
  async getSalesReport(filters = {}) {
    try {
      const query = {
        doctype: "Sales Invoice",
        fields: [
          "name",
          "customer",
          "posting_date",
          "total",
          "status",
          "grand_total",
        ],
        filters: {
          docstatus: 1, // Submitted documents only
          ...filters,
        },
        order_by: "posting_date desc",
        limit: 50,
      };

      const response = await this.frappe.db.get_list(query);
      return response;
    } catch (error) {
      console.error("Error getting sales report from ERPNext:", error);
      throw new Error(`Failed to get sales report: ${error.message}`);
    }
  }

  async getCustomerReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Customer", {
        fields: [
          "name",
          "customer_name",
          "email_id",
          "mobile_no",
          "territory",
          "customer_group",
          "creation",
        ],
        filters: filters,
        order_by: "creation desc",
        limit: 100,
      });
      return response;
    } catch (error) {
      console.error("Error getting customer report from ERPNext:", error);
      throw new Error(`Failed to get customer report: ${error.message}`);
    }
  }

  async getPurchaseReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Purchase Invoice", {
        fields: [
          "name",
          "supplier",
          "posting_date",
          "total",
          "status",
          "grand_total",
        ],
        filters: {
          docstatus: 1,
          ...filters,
        },
        order_by: "posting_date desc",
        limit: 50,
      });
      return response;
    } catch (error) {
      console.error("Error getting purchase report from ERPNext:", error);
      throw new Error(`Failed to get purchase report: ${error.message}`);
    }
  }

  async getInvoiceReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Sales Invoice", {
        fields: [
          "name",
          "customer",
          "posting_date",
          "due_date",
          "total",
          "outstanding_amount",
          "status",
        ],
        filters: {
          docstatus: 1,
          ...filters,
        },
        order_by: "posting_date desc",
        limit: 50,
      });
      return response;
    } catch (error) {
      console.error("Error getting invoice report from ERPNext:", error);
      throw new Error(`Failed to get invoice report: ${error.message}`);
    }
  }

  async getQuotationReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Quotation", {
        fields: [
          "name",
          "quotation_to",
          "party_name",
          "transaction_date",
          "total",
          "status",
          "valid_till",
        ],
        filters: {
          docstatus: ["!=", 2], // Not cancelled
          ...filters,
        },
        order_by: "transaction_date desc",
        limit: 50,
      });
      return response;
    } catch (error) {
      console.error("Error getting quotation report from ERPNext:", error);
      throw new Error(`Failed to get quotation report: ${error.message}`);
    }
  }

  async getStockReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Stock Ledger Entry", {
        fields: [
          "item_code",
          "warehouse",
          "posting_date",
          "actual_qty",
          "valuation_rate",
          "stock_value",
        ],
        filters: {
          ...filters,
          is_cancelled: 0,
        },
        order_by: "posting_date desc",
        limit: 100,
        group_by: "item_code, warehouse",
      });
      return response;
    } catch (error) {
      console.error("Error getting stock report from ERPNext:", error);
      throw new Error(`Failed to get stock report: ${error.message}`);
    }
  }

  async getItemReport(filters = {}) {
    try {
      const response = await this.frappe.db.get_list("Item", {
        fields: [
          "name",
          "item_name",
          "item_group",
          "stock_uom",
          "valuation_rate",
          "last_purchase_rate",
        ],
        filters: filters,
        order_by: "item_name",
        limit: 100,
      });
      return response;
    } catch (error) {
      console.error("Error getting item report from ERPNext:", error);
      throw new Error(`Failed to get item report: ${error.message}`);
    }
  }

  async getCustomReport(reportName, filters = {}) {
    try {
      // Use ERPNext's report API
      const response = await this.frappe.call({
        method: "frappe.desk.query_report.run",
        args: {
          report_name: reportName,
          filters: filters,
          ignore_prepared_report: 1,
        },
      });
      return response.message || [];
    } catch (error) {
      console.error(
        `Error getting custom report ${reportName} from ERPNext:`,
        error
      );
      throw new Error(`Failed to get custom report: ${error.message}`);
    }
  }

  async getDashboardData() {
    try {
      const [sales, customers, quotations, stock] = await Promise.allSettled([
        this.getSalesReport({ limit: 10 }),
        this.getCustomerReport({ limit: 10 }),
        this.getQuotationReport({ limit: 10 }),
        this.getStockReport({ limit: 10 }),
      ]);

      return {
        sales: sales.status === "fulfilled" ? sales.value : [],
        customers: customers.status === "fulfilled" ? customers.value : [],
        quotations: quotations.status === "fulfilled" ? quotations.value : [],
        stock: stock.status === "fulfilled" ? stock.value : [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting dashboard data from ERPNext:", error);
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  async getFinancialSummary(period = "monthly") {
    try {
      // Get financial data using ERPNext's built-in reports
      const salesData = await this.getCustomReport("Sales Analytics", {
        period: period,
        based_on: "Item",
      });

      const purchaseData = await this.getCustomReport("Purchase Analytics", {
        period: period,
        based_on: "Item",
      });

      return {
        sales: salesData,
        purchases: purchaseData,
        period: period,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting financial summary from ERPNext:", error);
      throw new Error(`Failed to get financial summary: ${error.message}`);
    }
  }

  async getPerformanceMetrics() {
    try {
      const [totalCustomers, totalSales, pendingInvoices, lowStockItems] =
        await Promise.allSettled([
          this.frappe.db.get_list("Customer", {
            fields: ["count(name) as total"],
          }),
          this.frappe.db.get_list("Sales Invoice", {
            fields: ["sum(grand_total) as total"],
            filters: { docstatus: 1 },
          }),
          this.frappe.db.get_list("Sales Invoice", {
            fields: ["count(name) as count"],
            filters: { docstatus: 1, outstanding_amount: [">", 0] },
          }),
          this.frappe.db.get_list("Bin", {
            fields: ["item_code", "actual_qty"],
            filters: { actual_qty: ["<=", 10] },
          }),
        ]);

      return {
        total_customers:
          totalCustomers.status === "fulfilled"
            ? totalCustomers.value[0]?.total || 0
            : 0,
        total_sales:
          totalSales.status === "fulfilled"
            ? totalSales.value[0]?.total || 0
            : 0,
        pending_invoices:
          pendingInvoices.status === "fulfilled"
            ? pendingInvoices.value[0]?.count || 0
            : 0,
        low_stock_items:
          lowStockItems.status === "fulfilled"
            ? lowStockItems.value.length || 0
            : 0,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting performance metrics from ERPNext:", error);
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }
}

module.exports = ERPNextService;
