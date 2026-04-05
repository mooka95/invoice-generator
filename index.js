const express = require("express");
const invoiceRoutes = require("./routes/invoice.route");

const app  = express();
app.use(express.json());
app.use("/api/v1", invoiceRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Invoice API running on http://localhost:${PORT}`));