const COLOR = require("../constants/colors");

function drawPageFooter(doc, { pageNumber, RIGHT, PAGE_H }) {
  const y = PAGE_H - 30;
  const centerX = RIGHT / 2;
  doc
    .fontSize(7)
    .fillColor(COLOR.gray)
    .font('Helvetica')
    .text(`Page ${pageNumber}`, 0, y, { align: 'center', width: RIGHT });
}
module.exports = {
    drawPageFooter
}