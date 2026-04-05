const PDFDocument = require("pdfkit");
const { drawLine, drawRight, infoBlock } = require("../helpers/Pdf.helpers");
const { checkPageBreak } = require("../helpers/AutoPageBreak.helpers");
const { drawPageFooter } = require("../Components/PageFooter.component")

const COLOR = require("../constants/colors");

function buildInvoicePDF(params, res) {
  const doc = new PDFDocument({ size: "A4", margin: 0, layout: 'landscape' });
    let pageNumber = 1;
  doc.on('pageAdded', () => {
    pageNumber++;
    drawPageFooter(doc, { pageNumber, PAGE_H: doc.page.height, RIGHT });
  });

  // Pipe directly to HTTP response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="invoice_${params.number || "document"}.pdf"`
  );
  doc.pipe(res);

  const PAGE_W = doc.page.width;   // 595
  const PAGE_H = doc.page.height;  // 842
  const M = 45;                    // margin
  const RIGHT = PAGE_W - M;
  const COL_MID = PAGE_W / 2;

  // ── Logo ────────────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .fillColor(COLOR.blue)
    .font("Helvetica-Bold")
    .text("LO", M, 45, { lineBreak: false })
    .text("GO", M, 67, { lineBreak: false });

  // ── INVOICE + Serial / Date ─────────────────────────────────────────────────
  const invoiceNumber = params.number || "INVOICE000001";
  const invoiceDate   = params.date   || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  drawPageFooter(doc, { pageNumber, PAGE_H: doc.page.height, RIGHT });
  doc
    .fontSize(22)
    .fillColor(COLOR.dark)
    .font("Helvetica-Bold")
    .text("INVOICE", M, 115, { lineBreak: false });

  doc.fontSize(8.5).fillColor(COLOR.gray).font("Helvetica");
  drawRight(doc, `Serial No:  `, 510, 110);
  doc.fillColor(COLOR.dark).font("Helvetica-Bold");
  drawRight(doc, invoiceNumber, 555, 110);

  doc.fillColor(COLOR.gray).font("Helvetica");
  drawRight(doc, `Invoice date:  `, 510, 126);
  doc.fillColor(COLOR.dark).font("Helvetica-Bold");
  drawRight(doc, invoiceDate, 555, 126);

  // ── Divider ─────────────────────────────────────────────────────────────────
  drawLine(doc, M, 148, RIGHT);

  // ── Seller / Buyer headers ──────────────────────────────────────────────────
  const Y_SECTION = 162;

  doc.fontSize(14).fillColor(COLOR.dark).font("Helvetica-Bold");
  doc.text("Seller", M, Y_SECTION, { lineBreak: false });
  doc.text("Buyer",  COL_MID, Y_SECTION, { lineBreak: false });

  drawLine(doc, M,        Y_SECTION + 18, COL_MID - 10);
  drawLine(doc, COL_MID,  Y_SECTION + 18, RIGHT);

  // ── Info block helper ────────────────────────────────────────────────────────
  function infoBlock(x, yStart, { name, address, taxNumber, vatNumber, bankName, bankAccount }) {
    const lineH = 14;
    let y = yStart;

    doc.fontSize(9).fillColor(COLOR.dark).font("Helvetica-Bold");
    doc.text(name || "", x, y, { lineBreak: false });
    y += lineH;

    const fields = [
      address     && ["Address:",      address],
      taxNumber   && ["Tax Number:",   taxNumber],
      vatNumber   && ["VAT Number:",   vatNumber],
      bankName    && ["Bank Name:",    bankName],
      bankAccount && ["Bank Account:", bankAccount],
    ].filter(Boolean);

    doc.fontSize(8).font("Helvetica");
    for (const [label, value] of fields) {
      doc.fillColor(COLOR.gray).text(`${label} `, x, y, { lineBreak: false, continued: true });
      doc.fillColor(COLOR.dark).text(value, { lineBreak: false });
      y += lineH;
    }
    return y;
  }

  const Y_INFO = Y_SECTION + 28;

  infoBlock(M, Y_INFO, {
    name:        params.seller_company_name,
    address:     params.seller_address,
    taxNumber:   params.seller_tax_number,
    vatNumber:   params.seller_vat_number,
    bankName:    params.seller_bank_name,
    bankAccount: params.seller_bank_account,
  });

  infoBlock(COL_MID, Y_INFO, {
    name:      params.buyer_company_name,
    address:   params.buyer_address,
    taxNumber: params.buyer_tax_number,
    vatNumber: params.buyer_vat_number,
  });

  // ── Services Table ───────────────────────────────────────────────────────────
  const CONTENT_W = RIGHT - M;
  const COL_W = {
    desc:     CONTENT_W * 0.30,
    units:    CONTENT_W * 0.12,
    qty:      CONTENT_W * 0.10,
    price:    CONTENT_W * 0.13,
    discount: CONTENT_W * 0.15,
    subtotal: CONTENT_W * 0.20,
  };

  const COL_X = {
    desc:     M,
    units:    M + COL_W.desc,
    qty:      M + COL_W.desc + COL_W.units,
    price:    M + COL_W.desc + COL_W.units + COL_W.qty,
    discount: M + COL_W.desc + COL_W.units + COL_W.qty + COL_W.price,
    subtotal: RIGHT,
  };

  const Y_TABLE = Y_INFO + 105;
  drawLine(doc, M, Y_TABLE, RIGHT);

  // Headers
  const Y_HEADER = Y_TABLE + 14;
  doc.fontSize(8).fillColor(COLOR.gray).font("Helvetica-Bold");
  doc.text("Description", COL_X.desc,    Y_HEADER, { lineBreak: false });
  doc.text("Units",       COL_X.units,   Y_HEADER, { lineBreak: false });
  drawRight(doc, "Qty",       COL_X.qty      + COL_W.qty,      Y_HEADER);
  drawRight(doc, "Price",     COL_X.price    + COL_W.price,    Y_HEADER);
  drawRight(doc, "Discount",  COL_X.discount + COL_W.discount, Y_HEADER);
  drawRight(doc, "Sub total", COL_X.subtotal,                  Y_HEADER);

  drawLine(doc, M, Y_HEADER + 12, RIGHT);

  // Rows
  let services = [];
  try {
    services = typeof params.services === "string"
      ? JSON.parse(params.services)
      : params.services || [];
  } catch (_) {}

  let totalDiscount = 0;
  let taxableAmount  = 0;
  let yRow = Y_HEADER + 24;

  for (const svc of services) {
    yRow = checkPageBreak(doc, yRow); 
    const qty      = parseFloat(svc.quantity || 0);
    const price    = parseFloat(svc.price    || 0);
    const discount = parseFloat(svc.discount || 0);
    const subtotal = qty * price - discount;

    totalDiscount += discount;
    taxableAmount  += subtotal;

    doc.fontSize(8).fillColor(COLOR.dark).font("Helvetica");
    doc.text(svc.name  || "", COL_X.desc,  yRow, { lineBreak: false });
    doc.text(svc.units || "", COL_X.units, yRow, { lineBreak: false });
    drawRight(doc, `${qty.toLocaleString()}`,          COL_X.qty      + COL_W.qty,      yRow);
    drawRight(doc, `${price.toFixed(2)}$`,             COL_X.price    + COL_W.price,    yRow);
    drawRight(doc, `${discount.toLocaleString()}$`,    COL_X.discount + COL_W.discount, yRow);
    drawRight(doc, `${subtotal.toLocaleString()}.00$`, COL_X.subtotal,                  yRow);

    yRow += 18;
  }

  drawLine(doc, M, yRow + 2, RIGHT);

  // ── Totals ───────────────────────────────────────────────────────────────────
  const taxRate    = parseFloat(params.tax      || 0);
  const shipping   = parseFloat(params.shipping || 0);
  const serviceFee = parseFloat(params.service_fee || 0);
  const totalTaxes = taxableAmount * (taxRate / 100);
  const grandTotal = taxableAmount + totalTaxes + shipping + serviceFee;

  const LABEL_X = RIGHT - 160;

  function summaryRow(label, value, y, bold = false) {
    const font = bold ? "Helvetica-Bold" : "Helvetica";
    doc.fontSize(8).font(font).fillColor(bold ? COLOR.dark : COLOR.gray);
    doc.text(label, LABEL_X, y, { lineBreak: false });
    doc.fillColor(COLOR.dark);
    drawRight(doc, value, RIGHT, y);
  }

  let ySum = yRow + 14;
  summaryRow("Total discount",  `${totalDiscount.toLocaleString()}.00$`, ySum);
  summaryRow("Taxable amount",  `${taxableAmount.toLocaleString()}.00$`, ySum + 16);
  summaryRow("Tax rate",        `${taxRate}%`,                           ySum + 32);
  summaryRow("Total taxes",     `${totalTaxes.toLocaleString()}.00$`,    ySum + 48);
  if (shipping)   summaryRow("Shipping",    `${shipping}.00$`,    ySum + 64);
  if (serviceFee) summaryRow("Service Fee", `${serviceFee}.00$`,  ySum + 80);

  const yGrand = ySum + (shipping || serviceFee ? 96 : 64);
  drawLine(doc, LABEL_X, yGrand - 6, RIGHT, COLOR.dark);
  summaryRow("Grand Total", `${grandTotal.toLocaleString()}.00$`, yGrand, true);
  // drawPageFooter(doc, { pageNumber: 1, PAGE_H, RIGHT });
  doc.end();
}

module.exports = { buildInvoicePDF };