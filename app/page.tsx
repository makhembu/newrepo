"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';

type Company = { name: string; address: string; email: string };
type Client = { name: string; address: string; email: string };
type Item = { description: string; quantity: number; rate: number };

export default function Home() {
  // Fixed company info (not editable)
  const company: Company = {
    name: 'Jambo Linguists',
    address:
      'First Floor, Radley House, Richardshaw Road, Pudsey, West Yorkshire, LS28 6LE, United Kingdom',
    email: 'info@jambolinguists.com',
  };

  const [client, setClient] = useState<Client>({ name: '', address: '', email: '' });
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [taxIncluded, setTaxIncluded] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(20);
  
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [vatNumber, setVatNumber] = useState<string>('');

  // Use the bundled logo asset
  const logoSrc = '/logo-purple.jpeg';

  const handleItemChange: {
    (index: number, field: 'description', value: string): void;
    (index: number, field: 'quantity', value: number): void;
    (index: number, field: 'rate', value: number): void;
  } = (index: number, field: 'description' | 'quantity' | 'rate', value: string | number) => {
    const nextItems = [...items];
    if (field === 'description') nextItems[index].description = value as string;
    if (field === 'quantity') nextItems[index].quantity = Number(value);
    if (field === 'rate') nextItems[index].rate = Number(value);
    setItems(nextItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0 }]);

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  // Format currency amounts in GBP (UK)
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  // Format date as dd/mm/yyyy for UK
  const formatDateUK = (value: string): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB');
  };

  // Build a fully vector PDF with jsPDF (no screenshots)
  const generatePDF = async () => {
    await generateRemittancePDF();
    return;
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    // Colors
    const textDark = { r: 17, g: 24, b: 39 };
    const borderLight = { r: 229, g: 231, b: 235 };
    const rowLight = { r: 248, g: 250, b: 252 };
    const headerFill = { r: 243, g: 244, b: 246 };
    const accent = { r: 107, g: 33, b: 168 }; // purple
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);

    // Header: logo + company + invoice meta
    const logoDataUrl = await getDataUrl(logoSrc);
    const logoH = 18;
    const logoW = 54; // assume ~3:1
    if (logoDataUrl) {
      try { pdf.addImage(logoDataUrl as string, 'JPEG', margin, y, logoW, logoH, undefined, 'FAST'); } catch {}
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    const infoX = margin + (logoDataUrl ? logoW + 6 : 0);
    pdf.text(company.name, infoX, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const wrap = (text: string, maxWidth: number) => {
      const words = (text || '').split(' ');
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (pdf.getTextWidth(test) > maxWidth) { if (line) lines.push(line); line = w; } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    };
    let cy = y + 11;
    for (const line of wrap(company.address, 70)) { pdf.text(line, infoX, cy); cy += 5; }
    pdf.text(company.email, infoX, cy);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('INVOICE', pageWidth - margin, y + 6, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, y + 12, { align: 'right' });
    pdf.text(`Invoice #: ${invoiceNumber || '—'}`, pageWidth - margin, y + 17, { align: 'right' });

    // Accent line
    const headerBottom = Math.max(y + logoH + 8, cy + 6);
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(margin, headerBottom, pageWidth - margin * 2, 1.5, 'F');
    y = headerBottom + 8;

    // Bill To section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Bill To', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y += 6;
    if (client.name) { pdf.text(client.name, margin, y); y += 5; }
    if (client.address) { for (const line of wrap(client.address, pageWidth - margin * 2)) { pdf.text(line, margin, y); y += 5; } }
    if (client.email) { pdf.text(client.email, margin, y); y += 6; }

    // Items table header with fill
    const colDescX = margin;
    const colQtyX = pageWidth - margin - 60;
    const colRateX = pageWidth - margin - 35;
    const colAmtX = pageWidth - margin - 5;
    pdf.setFillColor(headerFill.r, headerFill.g, headerFill.b);
    pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    pdf.setDrawColor(borderLight.r, borderLight.g, borderLight.b);
    pdf.rect(margin, y, pageWidth - margin * 2, 8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', colDescX + 2, y + 5);
    pdf.text('Qty', colQtyX, y + 5, { align: 'right' });
    pdf.text('Rate', colRateX, y + 5, { align: 'right' });
    pdf.text('Amount', colAmtX, y + 5, { align: 'right' });
    y += 10;

    // Table rows with zebra background
    pdf.setFont('helvetica', 'normal');
    const rowHeight = 7;
    const tableRight = pageWidth - margin;
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      const amount = it.quantity * it.rate;
      if (i % 2 === 0) {
        pdf.setFillColor(rowLight.r, rowLight.g, rowLight.b);
        pdf.rect(margin, y - 1, pageWidth - margin * 2, rowHeight + 2, 'F');
      }
      // Description wrapping
      const descLines = wrap(it.description || '', colQtyX - colDescX - 6);
      let lineY = y;
      for (const line of descLines) { pdf.text(line, colDescX + 2, lineY); lineY += 5; }
      pdf.text(String(it.quantity), colQtyX, y, { align: 'right' });
      pdf.text(formatCurrency(it.rate), colRateX, y, { align: 'right' });
      pdf.text(formatCurrency(amount), colAmtX, y, { align: 'right' });
      pdf.setDrawColor(borderLight.r, borderLight.g, borderLight.b);
      pdf.line(margin, y + rowHeight, tableRight, y + rowHeight);
      y += rowHeight;
    }

    // Totals box on right
    const boxW = 70;
    const boxX = pageWidth - margin - boxW;
    const boxY = y + 6;
    const lineH = 7;
    const boxH = taxIncluded ? lineH * 4 : lineH * 3;
    pdf.setDrawColor(borderLight.r, borderLight.g, borderLight.b);
    pdf.rect(boxX, boxY, boxW, boxH);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal', boxX + 4, boxY + 5);
    pdf.text(formatCurrency(items.reduce((s, it) => s + it.quantity * it.rate, 0)), boxX + boxW - 4, boxY + 5, { align: 'right' });
    if (taxIncluded) {
      pdf.text(`VAT (${taxRate}%)`, boxX + 4, boxY + 5 + lineH);
      pdf.text(formatCurrency((items.reduce((s, it) => s + it.quantity * it.rate, 0) * taxRate) / 100), boxX + boxW - 4, boxY + 5 + lineH, { align: 'right' });
    }
    pdf.setFont('helvetica', 'bold');
    const totalY = boxY + 5 + (taxIncluded ? lineH * 2 : lineH);
    pdf.text('Total', boxX + 4, totalY);
    pdf.text(formatCurrency(items.reduce((s, it) => s + it.quantity * it.rate, 0) + (taxIncluded ? (items.reduce((s, it) => s + it.quantity * it.rate, 0) * taxRate) / 100 : 0)), boxX + boxW - 4, totalY, { align: 'right' });

    // Footer note
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you for your business', pageWidth / 2, boxY + boxH + 12, { align: 'center' });

    const fileSuffix = invoiceNumber ? `-${invoiceNumber}` : `-${new Date().toISOString().split('T')[0]}`;
    pdf.save(`invoice${fileSuffix}.pdf`);
  };

  const generateRemittancePDF = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;

    const textDark = { r: 17, g: 24, b: 39 };
    const border = { r: 209, g: 213, b: 219 };
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);

    // Company logo on the right first
    const logoDataUrl = await getDataUrl(logoSrc);
    const rightX = pageWidth - margin;
    let ry = y;
    if (logoDataUrl) {
      // Maintain provided aspect ratio 563x172 (~3.273:1) within max bounds
      const ratio = 563 / 172;
      const maxW = 40; // mm
      const maxH = 18; // mm
      let w = Math.min(maxW, maxH * ratio);
      let h = w / ratio;
      try { pdf.addImage(logoDataUrl as string, 'JPEG', rightX - w, ry, w, h, undefined, 'FAST'); } catch {}
      ry += h + 2;
    }

    // Header row: title on the left, logo on the right (same row)
    const titleY = y + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('REMITTANCE ADVICE', margin, titleY);

    // Compute the baseline after header row and start company/recipient beneath
    const headerBottom = Math.max(ry, titleY + 2);

    // Company name and address on the right, below header row
    let companyY = headerBottom + 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Jambo Linguists', rightX, companyY, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    companyY += 6;
    const rightLines = [
      'Jambo Linguists',
      'First Floor, Radley House,',
      'Richardshaw Road, Pudsey,',
      'West Yorkshire, LS28 6LE',
      'United Kingdom',
    ];
    for (const line of rightLines) { pdf.text(line, rightX, companyY, { align: 'right' }); companyY += 5; }

    // Left recipient block under header row with label and emphasis
    let lx = margin;
    let ly = headerBottom + 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Customer', lx, ly);
    ly += 6;
    if (client.name) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(client.name, lx, ly);
      ly += 5;
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const line of splitMultiline(client.address)) { pdf.text(line, lx, ly); ly += 5; }
    if (client.email) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(client.email, lx, ly);
      ly += 5;
    }

    // Invoice meta (right column) starts below company address
    const metaY = companyY + 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Date', rightX - 60, metaY);
    pdf.text('Due Date', rightX - 60, metaY + 8);
    pdf.text('VAT Number', rightX - 60, metaY + 14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDateUK(invoiceDate), rightX, metaY, { align: 'right' });
    pdf.text(formatDateUK(dueDate), rightX, metaY + 8, { align: 'right' });
    pdf.text(vatNumber || '—', rightX, metaY + 16, { align: 'right' });

    // Horizontal rule and Total GBP paid
    const metaBottom = metaY + 16;
    const hrY = Math.max(ly + 6, metaBottom + 6);
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.line(margin, hrY, pageWidth - margin, hrY);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Total GBP paid', rightX - 60, hrY + 6);
    pdf.text(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(total), rightX, hrY + 6, { align: 'right' });

    // Table headers
    const tblY = hrY + 16;
    const colDate = margin;
    const colRef = margin + 40;
    const colInvTotal = pageWidth - margin - 80;
    const colPaid = pageWidth - margin;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Date', colDate, tblY);
    pdf.text('Reference', colRef, tblY);
    pdf.text('Invoice Total', colInvTotal, tblY, { align: 'right' });
    pdf.text('Amount Paid', colPaid, tblY, { align: 'right' });

    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.line(margin, tblY + 3, pageWidth - margin, tblY + 3);

    // One-row summary (for this simple case)
    const rowY = tblY + 10;
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDateUK(invoiceDate), colDate, rowY);
    pdf.text(invoiceNumber || '—', colRef, rowY);
    const f = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
    pdf.text(f.format(total), colInvTotal, rowY, { align: 'right' });
    pdf.text(f.format(total), colPaid, rowY, { align: 'right' });

    // Footer note
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Thank you for your business', pageWidth / 2, rowY + 20, { align: 'center' });

    const fileSuffix = invoiceNumber ? `-remittance-${invoiceNumber}` : `-remittance-${new Date().toISOString().split('T')[0]}`;
    pdf.save(`remittance${fileSuffix}.pdf`);
  };

  function splitMultiline(text: string): string[] {
    return (text || '').split(/\r?\n|,\s*/).filter(Boolean);
  }

  async function getDataUrl(src: string): Promise<string | null> {
    if (!src) return null;
    if (src.startsWith('data:')) return src;
    try {
      const res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  const subTotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = taxIncluded ? (subTotal * taxRate) / 100 : 0;
  const total = subTotal + tax;

  // Produce a standalone HTML string for iframe preview with premium styling
  const getInvoiceHtml = (): string => {
    const styles = `
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f3f4f6; }
        .sheet { max-width: 900px; width: 100%; margin: 16px auto; background: #ffffff; padding: clamp(16px, 2.5vw, 24px); border: 1px solid #e5e7eb; box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .logo { height: 56px; }
        .accent { height: 4px; background: #6b21a8; margin: 12px 0 16px; }
        h1 { margin: 0 0 8px 0; font-size: 20px; }
        h2 { margin: 0; font-size: 16px; }
        p { margin: 2px 0; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 10px 8px; font-size: 12px; }
        thead tr { background: #f3f4f6; border: 1px solid #e5e7eb; }
        tbody tr { border-bottom: 1px solid #f1f5f9; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .right { text-align: right; }
        .totals { width: 260px; margin-left: auto; margin-top: 12px; border: 1px solid #e5e7eb; padding: 8px 12px; }
        .totals-row { display: flex; justify-content: space-between; margin: 6px 0; }
        .totals-row.total { font-weight: 700; }
        .thanks { margin-top: 24px; font-size: 12px; color: #4b5563; text-align: center; }
      </style>
    `;

    const itemsRows = items
      .map(
        (it) => `
        <tr>
          <td>${escapeHtml(it.description || '')}</td>
          <td class="right">${it.quantity}</td>
          <td class="right">${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(it.rate)}</td>
          <td class="right">${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(it.quantity * it.rate)}</td>
        </tr>`
      )
      .join('');

    const f1 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
    const subtotalStr = f1.format(subTotal);
    const taxStr = f1.format(tax);
    const totalStr = f1.format(total);

    const companyHtml = `
      <h1>${escapeHtml(company.name)}</h1>
      <p>${escapeHtml(company.address)}</p>
      <p>${escapeHtml(company.email)}</p>
    `;

    const clientHtml = `
      <h2>Customer</h2>
      <p><strong>${escapeHtml(client.name)}</strong></p>
      <p>${escapeHtml(client.address)}</p>
      <p><strong>${escapeHtml(client.email)}</strong></p>
    `;

    const f2 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

    {
      const rightBlock = `
        <div style="text-align:right">
          <img src="${logoSrc}" class="logo" alt="logo" />
          <h2 style="margin-top:6px">Jambo Linguists</h2>
          <p>First Floor, Radley House,</p>
          <p>Richardshaw Road, Pudsey,</p>
          <p>West Yorkshire, LS28 6LE</p>
          <p>United Kingdom</p>
        </div>`;
      const leftBlock = `
        <div>
          <h1>REMITTANCE ADVICE</h1>
          <p>${escapeHtml(client.name)}</p>
          <p>${escapeHtml(client.address)}</p>
          <p>${escapeHtml(client.email)}</p>
        </div>`;
      const metaBlock = `
        <div style="text-align:right">
          <p style="margin:0 0 6px 0"><strong>Invoice Date</strong><br/>${escapeHtml(formatDateUK(invoiceDate))}</p>
          <p style="margin:0 0 6px 0"><strong>Due Date</strong><br/>${escapeHtml(formatDateUK(dueDate))}</p>
          <p><strong>VAT Number</strong><br/>${escapeHtml(vatNumber || '—')}</p>
        </div>`;

      return `
        <!doctype html>
        <html>
          <head><meta charset="utf-8" />${styles}</head>
          <body>
            <div class="sheet">
              <div class="row">
                ${leftBlock}
                ${rightBlock}
              </div>
              <div class="row" style="margin-top:12px;">
                <div></div>
                ${metaBlock}
              </div>
              <div class="accent"></div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align:left;">Reference</th>
                    <th class="right">Invoice Total</th>
                    <th class="right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${escapeHtml(invoiceNumber || '—')}</td>
                    <td class="right">${f2.format(total)}</td>
                    <td class="right">${f2.format(total)}</td>
                  </tr>
                </tbody>
              </table>
              <div class="totals" style="width: 300px; margin-left: auto;">
                <div class="totals-row total"><span>Total GBP paid</span><span>${f2.format(total)}</span></div>
              </div>
              <div class="thanks">Thank you for your business</div>
            </div>
          </body>
        </html>`;
    }

    return `
      <!doctype html>
      <html>
        <head><meta charset="utf-8" />${styles}</head>
        <body>
          <div class="sheet">
            <div class="row">
              <div>
                <img src="${logoSrc}" class="logo" alt="logo" />
                ${companyHtml}
              </div>
              <div style="text-align:right">
                <h2>Invoice</h2>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Invoice #: ${escapeHtml(invoiceNumber || '—')}</p>
              </div>
            </div>
            <div class="accent"></div>
            <div style="margin-top: 12px;">${clientHtml}</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align:left;">Description</th>
                  <th class="right">Qty</th>
                  <th class="right">Rate</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
            <div class="totals">
              <div class="totals-row"><span>Subtotal</span><span>${subtotalStr}</span></div>
              ${taxIncluded ? `<div class="totals-row"><span>VAT (${taxRate}%)</span><span>${taxStr}</span></div>` : ''}
              <div class="totals-row total"><span>Total</span><span>${totalStr}</span></div>
            </div>
            <div class="thanks">Thank you for your business</div>
          </div>
        </body>
      </html>
    `;
  };

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return (
    <div className="container mx-auto p-6" style={{ color: '#111827', backgroundColor: '#f8fafc' }}>
      <h1 className="text-2xl font-bold mb-4">Jambo Linguists Invoice Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form column */}
        <div className="bg-white rounded p-4" style={{ border: '1px solid #e5e7eb', color: '#111827' }}>
          <h2 className="text-lg font-semibold mb-3">Details</h2>

          {/* Client */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Customer (Bill To)</h3>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              placeholder="Client name"
              className="w-full p-2 rounded mb-2"
              style={{ border: '1px solid #d1d5db' }}
            />
            <textarea
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              placeholder="Client address"
              className="w-full p-2 rounded mb-2"
              rows={3}
              style={{ border: '1px solid #d1d5db' }}
            />
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              placeholder="Client email"
              className="w-full p-2 rounded"
              style={{ border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Invoice meta */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Invoice</h3>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Invoice number"
              className="w-full p-2 rounded"
              style={{ border: '1px solid #d1d5db' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm mb-1">Invoice Date</label>
                <input
                  type="date"
                  className="p-2 rounded w-full"
                  style={{ border: '1px solid #d1d5db' }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Due Date</label>
                <input
                  type="date"
                  className="p-2 rounded w-full"
                  style={{ border: '1px solid #d1d5db' }}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">VAT Number</label>
                <input
                  type="text"
                  className="p-2 rounded w-full"
                  style={{ border: '1px solid #d1d5db' }}
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="e.g. GB123456789"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Items</h3>
              <button
                onClick={addItem}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              >
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-6 p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    type="text"
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                  <input
                    className="col-span-2 p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    type="number"
                    min={0}
                    placeholder="Qty"
                    value={it.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  />
                  <input
                    className="col-span-2 p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    type="number"
                    min={0}
                    placeholder="Rate"
                    value={it.rate}
                    onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                  />
                  <div className="col-span-1 text-right text-sm" title="Amount">
                    {(it.quantity * it.rate).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="px-2 py-1 rounded text-sm"
                        style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Tax controls */}
            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={taxIncluded} onChange={(e) => setTaxIncluded(e.target.checked)} />
                Apply VAT
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Rate %:</span>
                <input
                  className="p-2 rounded w-24"
                  style={{ border: '1px solid #d1d5db' }}
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="text-right mt-3 font-semibold">Total: {total.toFixed(2)}</div>
          </div>

          <button
            onClick={generatePDF}
            className="w-full py-3 rounded font-medium"
            style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
          >
            Download PDF
          </button>
        </div>

        {/* Preview column */}
        <div style={{ color: '#111827' }}>
          <h2 className="text-lg font-semibold mb-3">Live Preview</h2>
          <div className="w-full bg-white rounded overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <iframe
              title="Invoice Preview"
              className="w-full"
              style={{ height: 'min(1100px, 80vh)' }}
              srcDoc={getInvoiceHtml()}
            />
          </div>
        </div>
      </div>

      
    </div>
  );
}