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
}

module.exports = ERPNextService;
