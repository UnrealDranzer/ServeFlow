import { formatCurrency, formatDateTime } from "@/lib/format";

export function printBill({ order, businessName, currency = "INR", timezone = "Asia/Kolkata" }) {
  const printWindow = window.open("", "_blank", "width=400,height=700");

  if (!printWindow) {
    alert("Please allow popups to print the bill.");
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e5e5;font-size:13px;">
          ${item.itemNameSnapshot}
        </td>
        <td style="padding:6px 4px;border-bottom:1px dashed #e5e5e5;text-align:center;font-size:13px;">
          ${item.quantity}
        </td>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e5e5;text-align:right;font-size:13px;">
          ${formatCurrency(item.itemPriceSnapshot, currency)}
        </td>
        <td style="padding:6px 0;border-bottom:1px dashed #e5e5e5;text-align:right;font-size:13px;font-weight:600;">
          ${formatCurrency(item.lineTotal, currency)}
        </td>
      </tr>
    `
    )
    .join("");

  const noteHtml = order.customerNote
    ? `<div style="margin:12px 0;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e;">
        <strong>Note:</strong> ${order.customerNote}
       </div>`
    : "";

  const statusLabel = order.status
    ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Bill - #${order.id.slice(0, 8)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          max-width: 380px;
          margin: 0 auto;
          padding: 24px 16px;
          color: #1a1a1a;
          background: #fff;
        }
        @media print {
          body { padding: 8px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #111;">
        <h1 style="font-size:20px;font-weight:800;letter-spacing:-0.5px;margin-bottom:2px;">
          ${businessName || "ServeFlow Restaurant"}
        </h1>
        <p style="font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;">Tax Invoice</p>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;color:#555;">
        <div>
          <p><strong>Order</strong> #${order.id.slice(0, 8)}</p>
          <p><strong>Table</strong> ${order.source?.name || "-"}</p>
        </div>
        <div style="text-align:right;">
          <p>${formatDateTime(order.placedAt, timezone)}</p>
          <p style="text-transform:capitalize;">${statusLabel}</p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="padding:6px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;">Item</th>
            <th style="padding:6px 4px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;">Qty</th>
            <th style="padding:6px 0;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;">Price</th>
            <th style="padding:6px 0;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${noteHtml}

      <div style="border-top:2px solid #111;margin-top:12px;padding-top:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:#666;">
          <span>Subtotal</span>
          <span>${formatCurrency(order.subtotal, currency)}</span>
        </div>
        ${Number(order.taxAmount) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:#666;">
          <span>Tax</span>
          <span>${formatCurrency(order.taxAmount, currency)}</span>
        </div>` : ""}
        ${Number(order.discountAmount) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;color:#666;">
          <span>Discount</span>
          <span>-${formatCurrency(order.discountAmount, currency)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #ddd;font-size:18px;font-weight:800;">
          <span>TOTAL</span>
          <span>${formatCurrency(order.total, currency)}</span>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px dashed #ccc;">
        <p style="font-size:13px;font-weight:600;color:#333;">Thank you for dining with us!</p>
        <p style="font-size:10px;color:#aaa;margin-top:4px;">Powered by ServeFlow</p>
      </div>

      <div class="no-print" style="text-align:center;margin-top:24px;">
        <button onclick="window.print()" style="
          padding:10px 32px;
          background:#111;
          color:#fff;
          border:none;
          border-radius:8px;
          font-size:14px;
          font-weight:600;
          cursor:pointer;
        ">
          Print Bill
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
