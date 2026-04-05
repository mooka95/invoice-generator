

function checkPageBreak(doc, y, rowHeight = 20) {
const PAGE_H = doc.page.height;
const BOTTOM_MARGIN = 50;
  if (y + rowHeight > PAGE_H - BOTTOM_MARGIN) {
    doc.addPage();
    return 45; // reset Y to top margin
  }
  return y;
}
module.exports = {
    checkPageBreak
}