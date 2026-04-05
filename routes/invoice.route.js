const express = require("express");
const router  = express.Router();
const { createInvoice } = require("../controllers/invoice.controller");

router.post("/invoice", createInvoice);
router.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = router;