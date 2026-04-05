const COLOR = require("../constants/colors");

function drawLine(doc, x1, y, x2, color = COLOR.line) {
  doc.save().strokeColor(color).lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function drawRight(doc, text, rightEdge, y, options = {}) {
  const w = doc.widthOfString(text);
  doc.text(text, rightEdge - w, y, { lineBreak: false, ...options });
}

function infoBlock(doc, x, yStart, { name, address, taxNumber, vatNumber, bankName, bankAccount }) {
  const lineH = 14;
  let y = yStart;
  // ... same logic as before
  return y;
}

module.exports = { drawLine, drawRight, infoBlock };