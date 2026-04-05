# Invoice PDF Generator API

A minimal Node.js/Express API that generates invoice PDFs on the fly — no storage, no URLs, just a POST and get back a PDF.

## Setup

```bash
npm install
npm start
# API runs on http://localhost:3000
```

## Endpoint

### `POST /invoice`

**Content-Type:** `application/json`  
**Response:** `application/pdf` (binary, inline)

### Request Body

| Field | Required | Type | Description |
|---|---|---|---|
| `number` | ✅ | string | Invoice number e.g. `INVOICE000001` |
| `seller_company_name` | ✅ | string | Seller name or company |
| `buyer_company_name` | ✅ | string | Buyer name or company |
| `services` | ✅ | array | List of service objects (see below) |
| `tax` | ✅ | number | Tax rate as percentage e.g. `20` |
| `date` | optional | string | Invoice date, defaults to today |
| `seller_address` | optional | string | |
| `seller_tax_number` | optional | string | |
| `seller_vat_number` | optional | string | |
| `seller_bank_name` | optional | string | |
| `seller_bank_account` | optional | string | |
| `buyer_address` | optional | string | |
| `buyer_tax_number` | optional | string | |
| `buyer_vat_number` | optional | string | |
| `shipping` | optional | number | Shipping cost |
| `service_fee` | optional | number | Additional service fee |

### Service object format

```json
{
  "name": "My Service",
  "units": "Hours",
  "quantity": "1000",
  "price": "30",
  "discount": "1000"
}
```

## Example

```bash
curl -X POST http://localhost:3000/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "number": "INVOICE000001",
    "date": "Jan 1, 2022",
    "seller_company_name": "Acme Corp",
    "seller_address": "123 Seller Street",
    "seller_tax_number": "TX-123456",
    "seller_vat_number": "VAT-789",
    "seller_bank_name": "First National Bank",
    "seller_bank_account": "0012-3456-7890",
    "buyer_company_name": "Client Ltd",
    "buyer_address": "456 Buyer Avenue",
    "buyer_tax_number": "TX-654321",
    "buyer_vat_number": "VAT-321",
    "services": [
      {
        "name": "My Service",
        "units": "Hours",
        "quantity": "1000",
        "price": "30",
        "discount": "1000"
      }
    ],
    "tax": 20,
    "shipping": 30,
    "service_fee": 10
  }' \
  --output invoice.pdf
```
