const { buildInvoicePDF } = require("../services/pdf.service");

function createInvoice(req, res) {
  const { number, buyer_company_name, seller_company_name, services, tax } = req.body;

  const missing = [];
  if (!number)              missing.push("number");
  if (!buyer_company_name)  missing.push("buyer_company_name");
  if (!seller_company_name) missing.push("seller_company_name");
  if (!services)            missing.push("services");
  if (tax === undefined)    missing.push("tax");

  if (missing.length > 0)
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });

  try {
    buildInvoicePDF(req.body, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
}

module.exports = { createInvoice };