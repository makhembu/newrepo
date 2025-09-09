"use client";

import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

type Company = { name: string; address: string; email: string };
type Client = { name: string; address: string; email: string };
type GeneralItem = { description: string; quantity: number; rate: number };
type InvoiceItem = { refNo: string; date: string; startTime: string; finishTime: string; mileage: number };

export default function Home() {
  // Fixed company info (not editable)
  const company: Company = {
    name: 'Jambo Linguists',
    address:
      'First Floor, Radley House, Richardshaw Road, Pudsey, West Yorkshire, LS28 6LE, United Kingdom',
    email: 'jamii@jambolinguists.com',
  };
  
  const companyNumber = '15333696';
  const companyPhone = '+44 7708 580413';
  const bankDetails = {
    bank: 'Santander',
    accountName: 'Jambo Linguists Limited',
    sortCode: '09-01-29',
    accountNo: '96610174',
  };

  const [client, setClient] = useState<Client>({ name: '', address: '', email: '' });
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [generalItems, setGeneralItems] = useState<GeneralItem[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);
  const [taxIncluded, setTaxIncluded] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(20);
  
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [vatNumber, setVatNumber] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [language, setLanguage] = useState<string>('');

  const [docType, setDocType] = useState<'invoice' | 'remittance'>('remittance');
  // Single simple payment amount used everywhere
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const [hourRate, setHourRate] = useState<number>(20);
  const [minRate, setMinRate] = useState<number>(5);
  const [mileageRate, setMileageRate] = useState<number>(0.35);
  // Travel time (invoice only)
  const [travelTimeHours, setTravelTimeHours] = useState<number>(0);
  const [travelTimeRate, setTravelTimeRate] = useState<number>(0);

  // Use the bundled logo asset
  const logoSrc = '/logo-purple.jpeg';

  const handleGeneralItemChange: {
    (index: number, field: 'description', value: string): void;
    (index: number, field: 'quantity', value: number): void;
    (index: number, field: 'rate', value: number): void;
  } = (index: number, field: 'description' | 'quantity' | 'rate', value: string | number) => {
    const nextItems = [...generalItems];
    if (field === 'description') nextItems[index].description = value as string;
    if (field === 'quantity') nextItems[index].quantity = Number(value);
    if (field === 'rate') nextItems[index].rate = Number(value);
    setGeneralItems(nextItems);
  };

  // Persist form state to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jl-invoice-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.client) setClient(parsed.client);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.generalItems) setGeneralItems(parsed.generalItems);
        if (parsed.invoiceItems) setInvoiceItems(parsed.invoiceItems);
        if (typeof parsed.taxIncluded === 'boolean') setTaxIncluded(parsed.taxIncluded);
        if (typeof parsed.taxRate === 'number') setTaxRate(parsed.taxRate);
        if (parsed.invoiceDate) setInvoiceDate(parsed.invoiceDate);
        if (parsed.dueDate) setDueDate(parsed.dueDate);
        if (parsed.vatNumber) setVatNumber(parsed.vatNumber);
        if (parsed.venue) setVenue(parsed.venue);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.docType) setDocType(parsed.docType);
        if (typeof parsed.hourRate === 'number') setHourRate(parsed.hourRate);
        if (typeof parsed.minRate === 'number') setMinRate(parsed.minRate);
        if (typeof parsed.mileageRate === 'number') setMileageRate(parsed.mileageRate);
        if (typeof parsed.travelTimeHours === 'number') setTravelTimeHours(parsed.travelTimeHours);
        if (typeof parsed.travelTimeRate === 'number') setTravelTimeRate(parsed.travelTimeRate);
        if (typeof parsed.amountPaid === 'number') setAmountPaid(parsed.amountPaid);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const state = {
      client,
      invoiceNumber,
      generalItems,
      invoiceItems,
      taxIncluded,
      taxRate,
      invoiceDate,
      dueDate,
      vatNumber,
      docType,
      hourRate,
      minRate,
      mileageRate,
      travelTimeHours,
      travelTimeRate,
      amountPaid,
      venue,
      language,
    };
    try {
      localStorage.setItem('jl-invoice-state', JSON.stringify(state));
    } catch {}
  }, [client, invoiceNumber, generalItems, invoiceItems, taxIncluded, taxRate, invoiceDate, dueDate, vatNumber, docType, hourRate, minRate, mileageRate, travelTimeHours, travelTimeRate, amountPaid, venue, language]);

  const handleInvoiceItemChange: {
    (index: number, field: 'refNo' | 'date' | 'startTime' | 'finishTime', value: string): void;
    (index: number, field: 'mileage', value: number): void;
  } = (index: number, field: 'refNo' | 'date' | 'startTime' | 'finishTime' | 'mileage', value: string | number) => {
    const nextItems = [...invoiceItems];
    if (field === 'refNo') nextItems[index].refNo = value as string;
    if (field === 'date') nextItems[index].date = value as string;
    if (field === 'startTime') nextItems[index].startTime = value as string;
    if (field === 'finishTime') nextItems[index].finishTime = value as string;
    if (field === 'mileage') nextItems[index].mileage = Number(value);
    setInvoiceItems(nextItems);
  };

  const addGeneralItem = () => setGeneralItems([...generalItems, { description: '', quantity: 1, rate: 0 }]);
  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);

  const removeGeneralItem = (index: number) => setGeneralItems(generalItems.filter((_, i) => i !== index));
  const removeInvoiceItem = (index: number) => setInvoiceItems(invoiceItems.filter((_, i) => i !== index));

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

  const parseTime = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const roundCurrency = (value: number): number => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  const calculateInvoiceItemAmounts = (item: InvoiceItem, includeTravelTime: boolean = false) => {
    const startMin = parseTime(item.startTime);
    const finishMin = parseTime(item.finishTime);
    let durationMin = 0;
    if (finishMin >= startMin) {
      durationMin = finishMin - startMin;
    } else {
      // Overnight shift, add 24h
      durationMin = finishMin + (24 * 60 - startMin);
    }
    durationMin = Math.max(0, durationMin);

    const hours = Math.floor(durationMin / 60);
    const remMin = durationMin % 60;
    const hourCharge = roundCurrency(hours * hourRate);
    const minIncrements = Math.ceil(remMin / 15);
    const minCharge = roundCurrency(minIncrements * minRate);
    const mileCharge = roundCurrency(item.mileage * mileageRate);
    const travelCharge = includeTravelTime ? roundCurrency(travelTimeHours * travelTimeRate) : 0;
    const amount = roundCurrency(hourCharge + minCharge + mileCharge + travelCharge);
    return { hours, remMin, hourCharge, minCharge, mileCharge, travelCharge, amount };
  };

  // Build a fully vector PDF with jsPDF (no screenshots)
  const generatePDF = async () => {
    if (docType === 'remittance') {
      await generateRemittancePDF();
    } else {
      await generateInvoicePDF();
    }
  };

  const generateInvoicePDF = async () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;
  
    // Colors
    const textDark = { r: 17, g: 24, b: 39 };
    const borderLight = { r: 229, g: 231, b: 235 };
    const rowLight = { r: 248, g: 250, b: 252 };
    const headerFill = { r: 243, g: 244, b: 246 };
    const accent = { r: 107, g: 33, b: 168 };
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);
  
    // Logo + Company Info
    const logoDataUrl = await getDataUrl(logoSrc);
    const logoH = 18, logoW = 54;
    if (logoDataUrl) {
      try { pdf.addImage(logoDataUrl as string, 'JPEG', margin, y, logoW, logoH, undefined, 'FAST'); } catch {}
    }
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    const infoX = margin + (logoDataUrl ? logoW + 6 : 0);
  
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
  
    let cy = y + 6;
    for (const line of wrap(company.address, 70)) { pdf.text(line, infoX, cy); cy += 5; }
    pdf.text(`Tel: ${companyPhone}`, infoX, cy); cy += 5;
    pdf.text(company.email, infoX, cy);
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('INVOICE', pageWidth - margin, y + 6, { align: 'right' });
  
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Date: ${formatDateUK(invoiceDate)}`, pageWidth - margin, y + 12, { align: 'right' });
    pdf.text(`Invoice #: ${invoiceNumber || '—'}`, pageWidth - margin, y + 17, { align: 'right' });
    pdf.text(`Due Date: ${formatDateUK(dueDate)}`, pageWidth - margin, y + 22, { align: 'right' });
  
    const headerBottom = Math.max(y + logoH + 8, cy + 6);
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(margin, headerBottom, pageWidth - margin * 2, 1.5, 'F');
    y = headerBottom + 8;

    // (Bank details moved near totals/footer)
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Bill To', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y += 6;
    if (client.name) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(client.name, margin, y);
      pdf.setFont('helvetica', 'normal');
      y += 5;
    }
    // Address (multi-line, no label)
    if (client.address) {
      pdf.setFont('helvetica', 'normal');
      const maxW = pageWidth - margin * 2;
      for (const addrLine of splitMultiline(client.address)) {
        const parts = wrap(addrLine, maxW);
        for (const line of parts) { pdf.text(line, margin, y); y += 5; }
      }
    }
    // Inline label-value pairs for Email, Venue, Language
    const drawInline = (label: string, value: string) => {
      if (!value) return;
      pdf.setFont('helvetica', 'bold');
      const labelText = `${label}:`;
      pdf.text(labelText, margin, y);
      const labelW = pdf.getTextWidth(labelText + ' ');
      pdf.setFont('helvetica', 'normal');
      const maxW = pageWidth - margin * 2 - labelW;
      const parts = wrap(value, maxW);
      if (parts.length > 0) {
        pdf.text(parts[0], margin + labelW, y);
        for (let i = 1; i < parts.length; i++) { y += 5; pdf.text(parts[i], margin + labelW, y); }
      }
      y += 6;
    };
    drawInline('Email', client.email || '');
    drawInline('Venue', venue || '');
    drawInline('Language', language || '');
    // Ensure upcoming table header won't overflow current page
    const upcomingHeaderHeight = 8 + 12; // header bar + spacing before rows
    if (y + upcomingHeaderHeight + margin > pageHeight) {
      pdf.addPage();
      y = margin;
    }
  
    // Travel time now shown as a table column (not a separate line)

    // Table
    // Added an extra column for Travel Time
    const colWidths = [26, 22, 23, 23, 32, 40, 40, 34, 28];
    const colPositions = colWidths.reduce<number[]>((acc, w, i) => {
      acc.push((i === 0 ? margin : acc[i - 1] + colWidths[i - 1]));
      return acc;
    }, []);
    const headers = ['Description', 'Date', 'Start Time', 'Finish Time', `Hours x £${hourRate}`, `Mins (15min incr) x £${minRate}`, `Miles x £${mileageRate}`, `Travel Time x £${travelTimeRate}`, 'Total'];
  
    const headerH = 12;
    pdf.setFillColor(headerFill.r, headerFill.g, headerFill.b);
    pdf.rect(margin, y, pageWidth - margin * 2, headerH, 'F');
    pdf.setDrawColor(borderLight.r, borderLight.g, borderLight.b);
    pdf.rect(margin, y, pageWidth - margin * 2, headerH);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    headers.forEach((text, i) => {
      const alignRight = i === headers.length - 1;
      const maxW = colWidths[i] - 4;
      const lines = wrap(String(text), maxW).slice(0, 2);
      const baseX = alignRight ? colPositions[i] + colWidths[i] - 2 : colPositions[i] + 2;
      const firstY = y + 4;
      const secondY = y + 8;
      if (lines[0]) pdf.text(lines[0], baseX, firstY, { align: alignRight ? 'right' : 'left' });
      if (lines[1]) pdf.text(lines[1], baseX, secondY, { align: alignRight ? 'right' : 'left' });
    });

    let colLineX = margin;
    colWidths.forEach(w => {
      pdf.line(colLineX, y, colLineX, y + headerH);
      colLineX += w;
    });
    pdf.line(colLineX, y, colLineX, y + headerH);
    y += headerH + 4; // add a touch more space before body rows
  
    pdf.setFont('helvetica', 'normal');
    const rowHeight = 7;
    const extraLineHeight = 5; // additional height per wrapped line
    const rowPadding = 2;
    const tableRight = pageWidth - margin;
  
    for (let i = 0; i < invoiceItems.length; i++) {
      const it = invoiceItems[i];
      const { hours, remMin, hourCharge, minCharge, mileCharge, travelCharge, amount } = calculateInvoiceItemAmounts(it, true);
  
      // Compute wrapped lines for Description (no word breaking)
      const descMaxW = colWidths[0] - 4;
      const descLines = wrap(it.refNo || '', descMaxW);
      const rh = rowHeight + Math.max(0, descLines.length - 1) * extraLineHeight;

      if (y + rh + margin + 20 > pageHeight) { pdf.addPage(); y = margin; }
  
      if (i % 2 === 0) {
        pdf.setFillColor(rowLight.r, rowLight.g, rowLight.b);
        pdf.rect(margin, y - rowPadding, pageWidth - margin * 2, rh + rowPadding * 2, 'F');
      }
  
      const travelColValue = travelCharge > 0
        ? `${travelTimeHours} x £${travelTimeRate} = ${formatCurrency(travelCharge)}`
        : '';

      const rowValues = [
        it.refNo || '',
        formatDateUK(it.date),
        it.startTime || '',
        it.finishTime || '',
        `${hours} x £${hourRate} = ${formatCurrency(hourCharge)}`,
        `${remMin} mins (${Math.ceil(remMin / 15)} incr) = ${formatCurrency(minCharge)}`,
        `${it.mileage} miles = ${formatCurrency(mileCharge)}`,
        travelColValue,
        formatCurrency(amount)
      ];
      // Prevent overlap: fit text within column width (truncate with ellipsis if needed)
      const fitText = (text: string, maxWidth: number) => {
        let s = String(text || '');
        if (pdf.getTextWidth(s) <= maxWidth) return s;
        const ellipsis = '…';
        let low = 0, high = s.length;
        while (low < high) {
          const mid = Math.floor((low + high) / 2);
          const candidate = s.slice(0, mid) + ellipsis;
          if (pdf.getTextWidth(candidate) <= maxWidth) low = mid + 1; else high = mid;
        }
        const cut = Math.max(0, low - 1);
        return s.slice(0, cut) + ellipsis;
      };

      rowValues.forEach((val, idx) => {
        const alignRight = idx === rowValues.length - 1;
        const x = alignRight ? colPositions[idx] + colWidths[idx] - 2 : colPositions[idx] + 2;
        const maxW = colWidths[idx] - 4; // padding
        if (idx === 0) {
          // Description: draw wrapped lines without breaking words
          for (let li = 0; li < descLines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(descLines[li], maxW);
            pdf.text(out, x, lineY, { align: 'left' });
          }
        } else {
          const out = fitText(String(val), maxW);
          pdf.text(out, x, y, { align: alignRight ? 'right' : 'left' });
        }
      });
  
      pdf.setDrawColor(borderLight.r, borderLight.g, borderLight.b);
      pdf.line(margin, y + rh, tableRight, y + rh);
  
      colLineX = margin;
      colWidths.forEach(w => {
        pdf.line(colLineX, y - rowPadding, colLineX, y + rh);
        colLineX += w;
      });
      pdf.line(colLineX, y - rowPadding, colLineX, y + rh);
  
      y += rh;
    }
  
    // Totals box
    let boxY = y + 6;
    const boxW = 70, boxX = pageWidth - margin - boxW, lineH = 7;
    const boxH = taxIncluded ? lineH * 4 : lineH * 3;
    // If totals would overflow, move to next page
    if (boxY + boxH + 18 > pageHeight - margin) {
      pdf.addPage();
      boxY = margin;
    }
    pdf.setDrawColor(accent.r, accent.g, accent.b);
    pdf.setLineWidth(0.8);
    pdf.rect(boxX, boxY, boxW, boxH);
  
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal', boxX + 4, boxY + 5);
    pdf.text(formatCurrency(subTotal), boxX + boxW - 4, boxY + 5, { align: 'right' });
  
    if (taxIncluded) {
      pdf.text(`VAT (${taxRate}%)`, boxX + 4, boxY + 5 + lineH);
      pdf.text(formatCurrency(tax), boxX + boxW - 4, boxY + 5 + lineH, { align: 'right' });
    }
  
    pdf.setFont('helvetica', 'bold');
    const totalY = boxY + 5 + (taxIncluded ? lineH * 2 : lineH);
    pdf.text('Total', boxX + 4, totalY);
    pdf.text(formatCurrency(total), boxX + boxW - 4, totalY, { align: 'right' });

    // No amount owed shown on invoice; remittance handles payments
  
    // Bank details below totals (common placement)
    let bankBlockY = boxY + boxH + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Bank Details', pageWidth / 2, bankBlockY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    bankBlockY += 6;
    pdf.text(`Bank: ${bankDetails.bank}`, pageWidth / 2, bankBlockY, { align: 'center' }); bankBlockY += 5;
    pdf.text(`Account Name: ${bankDetails.accountName}`, pageWidth / 2, bankBlockY, { align: 'center' }); bankBlockY += 5;
    pdf.text(`Sort Code: ${bankDetails.sortCode}`, pageWidth / 2, bankBlockY, { align: 'center' }); bankBlockY += 5;
    pdf.text(`Account No. ${bankDetails.accountNo}`, pageWidth / 2, bankBlockY, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.text('Thank you for your business', pageWidth / 2, bankBlockY + 10, { align: 'center' });
  
    // Footer company number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Company No. ${companyNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    const fileSuffix = invoiceNumber ? `-${invoiceNumber}` : `-${new Date().toISOString().split('T')[0]}`;
    pdf.save(`invoice${fileSuffix}.pdf`);
  };
  

  

  const generateRemittancePDF = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;

    const textDark = { r: 17, g: 24, b: 39 };
    const border = { r: 209, g: 213, b: 219 };
    const accent = { r: 107, g: 33, b: 168 };
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);

    // Surrounding bounding box for the page content
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.8);
    pdf.rect(margin - 2, margin - 2, pageWidth - (margin * 2) + 4, pageHeight - (margin * 2) + 4);

    // Soft decorative background shapes for premium feel
    const soft = { r: 250, g: 245, b: 255 }; // very light purple
    // Top-right soft panel (reduced height, offset for better balance)
    pdf.setFillColor(soft.r, soft.g, soft.b);
    pdf.rect(pageWidth - margin - 90, y + 2, 90, 22, 'F');

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
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const rightLines = [
      'First Floor, Radley House,',
      'Richardshaw Road, Pudsey,',
      'West Yorkshire, LS28 6LE',
      'United Kingdom',
      `Tel: ${companyPhone}`,
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
    pdf.text('Invoice Number', rightX - 60, metaY);
    pdf.text('Invoice Date', rightX - 60, metaY + 9);
    pdf.text('Due Date', rightX - 60, metaY + 18);
    pdf.text('VAT Number', rightX - 60, metaY + 27);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceNumber || '—', rightX, metaY, { align: 'right' });
    pdf.text(formatDateUK(invoiceDate), rightX, metaY + 9, { align: 'right' });
    pdf.text(formatDateUK(dueDate), rightX, metaY + 18, { align: 'right' });
    pdf.text(vatNumber || '—', rightX, metaY + 27, { align: 'right' });

    // Accent separator to match HTML preview (purple bar)
    const metaBottom = metaY + 36;
    const hrY = Math.max(ly + 6, metaBottom + 2);
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(margin, hrY, pageWidth - margin * 2, 1.5, 'F');
    const paidTotal = amountPaid > 0 ? amountPaid : total;

    // Table headers styled like HTML preview (bank details moved to footer)
    const tblY = hrY + 16;
    const colDesc = margin;
    const colInvTotal = pageWidth - margin - 80;
    const colPaid = pageWidth - margin;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(margin, tblY - 4, pageWidth - margin * 2, 10, 'F');
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.rect(margin, tblY - 4, pageWidth - margin * 2, 10);
    pdf.text('Description', colDesc + 2, tblY + 2);
    pdf.text('Invoice Total', colInvTotal - 2, tblY + 2, { align: 'right' });
    pdf.text('Amount Paid', colPaid - 2, tblY + 2, { align: 'right' });

    // Add rows for each general item with proportional paid allocation (zebra striping)
    let rowY = tblY + 16;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const itemTotals = generalItems.map(it => roundCurrency(it.quantity * it.rate));
    const sumItems = itemTotals.reduce((s, n) => s + n, 0);
    const grossTotal = roundCurrency(sumItems + (taxIncluded ? tax : 0));
    const allocBase = grossTotal > 0 ? grossTotal : 1;
    let remainingPaid = Math.min(paidTotal, grossTotal);

    for (let i = 0; i < generalItems.length; i++) {
      const item = generalItems[i];
      const itemTotal = itemTotals[i];
      const itemVatShare = taxIncluded && sumItems > 0 ? (itemTotal / sumItems) * tax : 0;
      const itemGross = roundCurrency(itemTotal + itemVatShare);
      let itemPaid = roundCurrency((itemGross / allocBase) * Math.min(paidTotal, grossTotal));
      // Adjust last row to make sums match exactly
      if (i === generalItems.length - 1) itemPaid = roundCurrency(remainingPaid);
      remainingPaid = roundCurrency(remainingPaid - itemPaid);

      if (rowY + 20 > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        rowY = margin;
      }

      // Zebra background every other row
      if (i % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, rowY - 7, pageWidth - margin * 2, 14, 'F');
      }

      pdf.text(item.description || '', colDesc + 2, rowY);
      pdf.text(formatCurrency(itemTotal), colInvTotal - 2, rowY, { align: 'right' });
      pdf.text(formatCurrency(itemPaid), colPaid - 2, rowY, { align: 'right' });

      // Row divider
      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, rowY + 7, pageWidth - margin, rowY + 7);

      rowY += 14;
    }

    // Totals section
    let totalsY = rowY + 12;
    const totalsBoxW = 70;
    const totalsBoxX = pageWidth - margin - totalsBoxW - 2;
    const lineH = 7;
    const totalsBoxH = taxIncluded ? lineH * 4 : lineH * 3;
    
    // If totals would overflow the page, move to a new page first
    if (totalsY + totalsBoxH + 24 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      // redraw surrounding bounding box on the new page
      pdf.setDrawColor(border.r, border.g, border.b);
      pdf.setLineWidth(0.8);
      pdf.rect(margin - 2, margin - 2, pageWidth - (margin * 2) + 4, pdf.internal.pageSize.getHeight() - (margin * 2) + 4);
      totalsY = margin; // start totals at top content area
    }
    
    // Soft background behind totals box
    pdf.setFillColor(soft.r, soft.g, soft.b);
    pdf.rect(totalsBoxX - 4, totalsY - 4, totalsBoxW + 8, totalsBoxH + 8, 'F');

    // Light grey border like preview
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.5);
    pdf.rect(totalsBoxX, totalsY, totalsBoxW, totalsBoxH);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Subtotal', totalsBoxX + 4, totalsY + 5);
    pdf.text(formatCurrency(subTotal), totalsBoxX + totalsBoxW - 4, totalsY + 5, { align: 'right' });
    
    if (taxIncluded) {
      pdf.text(`VAT (${taxRate}%)`, totalsBoxX + 4, totalsY + 5 + lineH);
      pdf.text(formatCurrency(tax), totalsBoxX + totalsBoxW - 4, totalsY + 5 + lineH, { align: 'right' });
    }
    
    pdf.setFont('helvetica', 'bold');
    const totalY = totalsY + 5 + (taxIncluded ? lineH * 2 : lineH);
    pdf.text('Total GBP paid', totalsBoxX + 4, totalY);
    pdf.text(formatCurrency(paidTotal), totalsBoxX + totalsBoxW - 4, totalY, { align: 'right' });

    // Remaining balance if not fully paid
    if (paidTotal < total) {
      const remainY = totalY + 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(accent.r, accent.g, accent.b);
      pdf.text('Remaining Balance', totalsBoxX + 4, remainY);
      pdf.text(formatCurrency(roundCurrency(total - paidTotal)), totalsBoxX + totalsBoxW - 4, remainY, { align: 'right' });
      pdf.setTextColor(textDark.r, textDark.g, textDark.b);
    }

    // Bank details near footer (common placement)
    let bankY = totalsY + totalsBoxH + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Bank Details', pageWidth / 2, bankY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    bankY += 6;
    pdf.text(`Bank: ${bankDetails.bank}`, pageWidth / 2, bankY, { align: 'center' }); bankY += 5;
    pdf.text(`Account Name: ${bankDetails.accountName}`, pageWidth / 2, bankY, { align: 'center' }); bankY += 5;
    pdf.text(`Sort Code: ${bankDetails.sortCode}`, pageWidth / 2, bankY, { align: 'center' }); bankY += 5;
    pdf.text(`Account No. ${bankDetails.accountNo}`, pageWidth / 2, bankY, { align: 'center' });

    // Footer note
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Thank you for your business', pageWidth / 2, bankY + 10, { align: 'center' });

    // Footer company number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Company No. ${companyNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

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

  const travelAmount = useMemo(() => {
    if (docType !== 'invoice') return 0;
    return roundCurrency(Math.max(0, travelTimeHours) * Math.max(0, travelTimeRate));
  }, [docType, travelTimeHours, travelTimeRate]);

  const subTotal = useMemo(() => {
    const base = docType === 'remittance'
      ? generalItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)
      : invoiceItems.reduce((sum, item) => sum + calculateInvoiceItemAmounts(item, true).amount, 0);
    return roundCurrency(base);
  }, [docType, generalItems, invoiceItems]);

  const tax = useMemo(() => {
    const value = taxIncluded ? (subTotal * taxRate) / 100 : 0;
    return roundCurrency(value);
  }, [subTotal, taxIncluded, taxRate]);

  const total = useMemo(() => roundCurrency(subTotal + tax), [subTotal, tax]);

  // Paid and owed calculations (for UX and PDFs)
  const effectivePaid = useMemo(() => roundCurrency(Math.max(0, amountPaid)), [amountPaid]);

  const owed = useMemo(() => {
    const value = Math.max(0, total - effectivePaid);
    return roundCurrency(value);
  }, [total, effectivePaid]);

  const isOverpaid = useMemo(() => amountPaid > total, [amountPaid, total]);

  // Produce a standalone HTML string for iframe preview with premium styling
  const getPreviewHtml = (): string => {
    const styles = `
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f3f4f6; }
        .sheet { position: relative; max-width: 900px; width: 100%; margin: 16px auto; background: #ffffff; padding: clamp(16px, 2.5vw, 24px); border: 1px solid #e5e7eb; box-shadow: 0 10px 15px rgba(0,0,0,0.05); overflow: hidden; }
        .sheet { outline: 2px solid #e5e7eb; outline-offset: -6px; border-radius: 4px; }
        /* subtle decorative background */
        .sheet::before { content: ''; position: absolute; right: -40px; top: -40px; width: 300px; height: 160px; background: radial-gradient(120px 80px at 70% 40%, rgba(124,58,237,0.06), transparent 70%); }
        .sheet::after { content: ''; position: absolute; right: 20px; bottom: 24px; width: 320px; height: 160px; background: linear-gradient(180deg, rgba(124,58,237,0.06), rgba(124,58,237,0.0)); filter: blur(0.2px); }
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

    const f = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

    const companyHtml = `
      <p>${escapeHtml(company.address)}</p>
      <p>Tel: ${escapeHtml(companyPhone)}</p>
      <p>${escapeHtml(company.email)}</p>
    `;

    const clientHtml = `
      <h2>Customer</h2>
      <p><strong>${escapeHtml(client.name)}</strong></p>
      <p>${escapeHtml(client.address)}</p>
      <p><strong>${escapeHtml(client.email)}</strong></p>
    `;

    if (docType === 'remittance') {
      const rightBlock = `
        <div style="text-align:right">
          <img src="${logoSrc}" class="logo" alt="logo" />
          <p>First Floor, Radley House,</p>
          <p>Richardshaw Road, Pudsey,</p>
          <p>West Yorkshire, LS28 6LE</p>
          <p>United Kingdom</p>
          <p>Tel: ${escapeHtml(companyPhone)}</p>
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
          <p style="margin:0 0 6px 0"><strong>Invoice Number</strong><br/>${escapeHtml(invoiceNumber || '—')}</p>
          <p style="margin:0 0 6px 0"><strong>Invoice Date</strong><br/>${escapeHtml(formatDateUK(invoiceDate))}</p>
          <p style="margin:0 0 6px 0"><strong>Due Date</strong><br/>${escapeHtml(formatDateUK(dueDate))}</p>
          <p style="margin:0 0 6px 0"><strong>VAT Number</strong><br/>${escapeHtml(vatNumber || '—')}</p>
        </div>`;

      const itemTotals = generalItems.map(it => (it.quantity * it.rate));
      const sumItems = itemTotals.reduce((s, n) => s + n, 0);
      const grossTotal = +(sumItems + (taxIncluded ? tax : 0)).toFixed(2);
      const paidTotal = amountPaid > 0 ? amountPaid : total;
      const cappedPaid = Math.min(paidTotal, grossTotal);
      let remainingPaid = cappedPaid;
      const rowsHtml = generalItems.map((item, idx) => {
        const itemTotal = itemTotals[idx];
        const itemVatShare = taxIncluded && sumItems > 0 ? (itemTotal / sumItems) * tax : 0;
        const itemGross = itemTotal + itemVatShare;
        let itemPaid = +( (itemGross / (grossTotal || 1)) * cappedPaid ).toFixed(2);
        if (idx === generalItems.length - 1) itemPaid = +remainingPaid.toFixed(2);
        remainingPaid = +(remainingPaid - itemPaid).toFixed(2);
        return `
          <tr>
            <td>${escapeHtml(item.description || '')}</td>
            <td class="right">${f.format(itemTotal)}</td>
            <td class="right">${f.format(itemPaid)}</td>
          </tr>`;
      }).join('');
      const remaining = Math.max(0, +(grossTotal - cappedPaid).toFixed(2));

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
                    <th style="text-align:left;">Description</th>
                    <th class="right">Invoice Total</th>
                    <th class="right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
              <div class="totals" style="width: 300px; margin-left: auto;">
                <div class="totals-row"><span>Subtotal</span><span>${f.format(subTotal)}</span></div>
                ${taxIncluded ? `<div class=\"totals-row\"><span>VAT (${taxRate}%)</span><span>${f.format(tax)}</span></div>` : ''}
                <div class="totals-row total"><span>Total GBP paid</span><span>${f.format(paidTotal)}</span></div>
                ${paidTotal < total ? `<div class=\"totals-row\"><span><strong>Remaining Balance</strong></span><span><strong>${f.format(remaining)}</strong></span></div>` : ''}
              </div>
              <div class="thanks">Thank you for your business</div>
              <div class="thanks" style="margin-top: 6px;">Company No. ${companyNumber}</div>
            </div>
          </body>
        </html>`;
    } else {
      // Invoice preview
      const amountColHeader = 'Total';
      const itemsRows = invoiceItems
        .map(
          (it, idx) => {
            const { hours, remMin, hourCharge, minCharge, mileCharge, travelCharge, amount } = calculateInvoiceItemAmounts(it, true);
            const travelCell = travelCharge > 0
              ? `${travelTimeHours} x £${travelTimeRate} = ${f.format(travelCharge)}`
              : '';
            return `
            <tr>
              <td>${escapeHtml(it.refNo || '')}</td>
              <td>${formatDateUK(it.date)}</td>
              <td>${escapeHtml(it.startTime || '')}</td>
              <td>${escapeHtml(it.finishTime || '')}</td>
              <td>${hours} x £${hourRate} = ${f.format(hourCharge)}</td>
              <td>${remMin} mins (${Math.ceil(remMin / 15)} incr) x £${minRate} = ${f.format(minCharge)}</td>
              <td>${it.mileage} miles x £${mileageRate} = ${f.format(mileCharge)}</td>
              <td>${travelCell}</td>
              <td class="right">${f.format(amount)}</td>
            </tr>`;
          }
        )
        .join('');

      const subtotalStr = f.format(subTotal);
      const taxStr = f.format(tax);
      const totalStr = f.format(total);

      const jobDetailsHtml = `
        <div style="margin-top: 8px;">
          ${venue ? `<p><strong>Venue</strong>: ${escapeHtml(venue)}</p>` : ''}
          ${language ? `<p><strong>Language</strong>: ${escapeHtml(language)}</p>` : ''}
        </div>`;

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
                  <p>Date: ${formatDateUK(invoiceDate)}</p>
                  <p>Invoice #: ${escapeHtml(invoiceNumber || '—')}</p>
                  <p>Due Date: ${formatDateUK(dueDate)}</p>
                </div>
              </div>
              <div class="accent"></div>
              <div style="margin-top: 12px;">${clientHtml}${jobDetailsHtml}</div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align:left;">Description</th>
                    <th style="text-align:left;">Date</th>
                    <th style="text-align:left;">Start Time</th>
                    <th style="text-align:left;">Finish Time</th>
                    <th style="text-align:left;">Duration hours x £${hourRate}</th>
                    <th style="text-align:left;">Duration minutes x £${minRate} every 15 min</th>
                    <th style="text-align:left;">Mileage £${mileageRate} per mile</th>
                    <th style="text-align:left;">Travel Time x £${travelTimeRate}</th>
                    <th class="right">${amountColHeader}</th>
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
              <div style="text-align:center; margin: 14px 0 4px 0; font-size: 12px;">
                <strong>Bank Details</strong><br/>
                Bank: ${escapeHtml(bankDetails.bank)} &nbsp;|&nbsp; Account Name: ${escapeHtml(bankDetails.accountName)}<br/>
                Sort Code: ${escapeHtml(bankDetails.sortCode)} &nbsp;|&nbsp; Account No. ${escapeHtml(bankDetails.accountNo)}
              </div>
              <div class="thanks">Thank you for your business</div>
              <div class="thanks" style="margin-top: 6px;">Company No. ${companyNumber}</div>
            </div>
          </body>
        </html>
      `;
    }
  };

  // Optionally memoize preview HTML to reduce regeneration while typing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoPreviewHtml = useMemo(() => getPreviewHtml(), [
    docType,
    client,
    invoiceNumber,
    generalItems,
    invoiceItems,
    taxIncluded,
    taxRate,
    invoiceDate,
    dueDate,
    vatNumber,
    hourRate,
    minRate,
    mileageRate,
    amountPaid,
    owed,
    venue,
    language,
  ]);

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
      <h1 className="text-2xl font-bold mb-2">Jambo Linguists Invoice Generator</h1>
      <p className="text-sm mb-4" style={{ color: '#4b5563' }}>Fill in the boxes below. We save as you type. When youre ready, press Download.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form column */}
        <div className="bg-white rounded p-4" style={{ border: '1px solid #e5e7eb', color: '#111827' }}>
          <h2 className="text-lg font-semibold mb-1">Details</h2>
          <p className="text-sm mb-3" style={{ color: '#6b7280' }}>Choose what you want to make, then enter who its for and the dates.</p>

          {/* Document Type Toggle */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as 'invoice' | 'remittance')}
              className="w-full p-2 rounded"
              style={{ border: '1px solid #d1d5db' }}
            >
              <option value="remittance">Remittance Advice</option>
              <option value="invoice">Invoice</option>
            </select>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Remittance Advice shows what was paid. Invoice shows what is owed.</p>
          </div>

          {/* Client */}
          <div className="mb-4">
            <h3 className="font-medium mb-1">Customer (Bill To)</h3>
            <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Who is this for? Add their name, address and email.</p>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              placeholder="e.g. Acme Ltd. or Jane Smith"
              className="w-full p-2 rounded mb-2"
              style={{ border: '1px solid #d1d5db' }}
            />
            <textarea
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              placeholder="Street, City, Postcode"
              className="w-full p-2 rounded mb-2"
              rows={3}
              style={{ border: '1px solid #d1d5db' }}
            />
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full p-2 rounded"
              style={{ border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Invoice meta */}
          <div className="mb-4">
            <h3 className="font-medium mb-1">Invoice</h3>
            <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Add the invoice number and dates. VAT number is optional.</p>
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
                onClick={docType === 'remittance' ? addGeneralItem : addInvoiceItem}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              >
                Add another item
              </button>
            </div>
            {docType === 'invoice' ? (
              <p className="text-xs" style={{ color: '#6b7280' }}>Enter each job with times and mileage. We add up hours, round minutes to the next 15 minutes, and include mileage.</p>
            ) : (
              <p className="text-xs" style={{ color: '#6b7280' }}>For each line, fill Description, Rate and Quantity. The total is Rate  d7 Quantity.</p>
            )}

            {docType === 'invoice' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm mb-1">Hour Rate (£)</label>
                  <input
                    type="number"
                    value={hourRate}
                    onChange={(e) => setHourRate(Number(e.target.value))}
                    className="w-full p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Minute Rate (£ per 15 min)</label>
                  <input
                    type="number"
                    value={minRate}
                    onChange={(e) => setMinRate(Number(e.target.value))}
                    className="w-full p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Mileage Rate (£ per mile)</label>
                  <input
                    type="number"
                    value={mileageRate}
                    onChange={(e) => setMileageRate(Number(e.target.value))}
                    className="w-full p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Travel Time (hours)</label>
                  <input
                    type="number"
                    value={travelTimeHours}
                    onChange={(e) => setTravelTimeHours(Number(e.target.value))}
                    className="w-full p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    min={0}
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Travel Time Rate (£/hour)</label>
                  <input
                    type="number"
                    value={travelTimeRate}
                    onChange={(e) => setTravelTimeRate(Number(e.target.value))}
                    className="w-full p-2 rounded"
                    style={{ border: '1px solid #d1d5db' }}
                    min={0}
                    step="0.01"
                  />
                </div>
                
              </div>
            )}

            {docType === 'remittance' && null}

            <div className="space-y-3">
              {docType === 'remittance' ? (
                generalItems.map((it, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-b pb-3"
                  >
                    <div className="col-span-6 relative">
                      <input
                        type="text"
                        id={`desc-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => handleGeneralItemChange(index, "description", e.target.value)}
                      />
                      <label
                        htmlFor={`desc-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Description
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="number"
                        id={`rate-${index}`}
                        className="peer w-full border rounded p-2 text-right placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Rate"
                        value={it.rate}
                        min={0}
                        step="0.01"
                        onChange={(e) =>
                          handleGeneralItemChange(index, "rate", Number(e.target.value))
                        }
                      />
                      <label
                        htmlFor={`rate-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Rate
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="number"
                        id={`qty-${index}`}
                        className="peer w-full border rounded p-2 text-right placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Qty"
                        value={it.quantity}
                        min={0}
                        onChange={(e) =>
                          handleGeneralItemChange(index, "quantity", Number(e.target.value))
                        }
                      />
                      <label
                        htmlFor={`qty-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Quantity
                      </label>
                    </div>
                    <div className="col-span-1 text-right font-semibold">
                      {(it.quantity * it.rate).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {generalItems.length > 1 && (
                        <button
                          onClick={() => removeGeneralItem(index)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: "#ef4444" }}
                          title="Remove item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                invoiceItems.map((it, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-b pb-3"
                  >
                    <div className="col-span-2 relative">
                      <input
                        type="text"
                        id={`refno-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Description"
                        value={it.refNo}
                        onChange={(e) => handleInvoiceItemChange(index, "refNo", e.target.value)}
                      />
                      <label
                        htmlFor={`refno-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Description
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="date"
                        id={`date-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={it.date}
                        onChange={(e) => handleInvoiceItemChange(index, "date", e.target.value)}
                      />
                      <label
                        htmlFor={`date-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Date
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="time"
                        id={`start-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={it.startTime}
                        onChange={(e) => handleInvoiceItemChange(index, "startTime", e.target.value)}
                      />
                      <label
                        htmlFor={`start-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Start Time
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="time"
                        id={`finish-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={it.finishTime}
                        onChange={(e) => handleInvoiceItemChange(index, "finishTime", e.target.value)}
                      />
                      <label
                        htmlFor={`finish-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Finish Time
                      </label>
                    </div>
                    <div className="col-span-2 relative">
                      <input
                        type="number"
                        id={`mileage-${index}`}
                        className="peer w-full border rounded p-2 text-right placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Mileage"
                        value={it.mileage}
                        min={0}
                        step="0.1"
                        onChange={(e) => handleInvoiceItemChange(index, "mileage", Number(e.target.value))}
                      />
                      <label
                        htmlFor={`mileage-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Mileage
                      </label>
                    </div>
                    <div className="col-span-1 text-right font-semibold">
                      {calculateInvoiceItemAmounts(it).amount.toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {invoiceItems.length > 1 && (
                        <button
                          onClick={() => removeInvoiceItem(index)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: "#ef4444" }}
                          title="Remove item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tax controls */}
            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={taxIncluded}
                  onChange={(e) => setTaxIncluded(e.target.checked)}
                />
                Apply VAT
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Rate %:</span>
                <input
                  className="p-2 rounded w-24 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="text-right mt-3 font-semibold">
              {docType === 'remittance' ? 'Total GBP paid' : 'Total'}: {(docType === 'remittance' ? (amountPaid > 0 ? amountPaid : total) : total).toFixed(2)}
            </div>
          </div>

          {/* Payment (remittance only) */}
          {docType === 'remittance' && (
          <div className="mt-4">
            <h3 className="font-medium mb-1">Payment</h3>
            <p className="text-xs mb-2" style={{ color: '#6b7280' }}>If some money was paid already, type it here.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Amount paid (£)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded"
                  style={{ border: '1px solid #d1d5db' }}
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <p className="text-sm" style={{ color: '#111827' }}>Amount owed: <strong>{formatCurrency(owed)}</strong></p>
              </div>
            </div>
            {isOverpaid && (
              <p className="text-xs mt-2" style={{ color: '#b91c1c' }}>Amount paid cant be more than the total.</p>
            )}
          </div>
          )}

          {(() => {
            const downloadLabel = docType === 'remittance' ? 'Download Remittance PDF' : 'Download Invoice PDF';
            const disabled = false;
            return (
              <button
                onClick={generatePDF}
                className="w-full py-3 rounded font-medium"
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}
                aria-label={downloadLabel}
                disabled={disabled}
              >
                {downloadLabel}
              </button>
            );
          })()}
          {docType === 'invoice' && (
          <div className="mt-3">
            <h3 className="font-medium mb-1">Job details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Venue</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  style={{ border: '1px solid #d1d5db' }}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Location / address"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Language</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  style={{ border: '1px solid #d1d5db' }}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English ↔️ Somali"
                />
              </div>
            </div>
          </div>
          )}
          <button
            onClick={() => {
              setClient({ name: '', address: '', email: '' });
              setInvoiceNumber('');
              setGeneralItems([{ description: '', quantity: 1, rate: 0 }]);
              setInvoiceItems([{ refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);
              setTaxIncluded(false);
              setTaxRate(20);
              setInvoiceDate('');
              setDueDate('');
              setVatNumber('');
              setDocType('remittance');
              setHourRate(20);
              setMinRate(5);
              setMileageRate(0.35);
              setTravelTimeHours(0);
              setTravelTimeRate(0);
              setAmountPaid(0);
              setVenue('');
              setLanguage('');
              try { localStorage.removeItem('jl-invoice-state'); } catch {}
            }}
            className="w-full py-3 rounded font-medium mt-2"
            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
          >
            Reset
          </button>
        </div>

        {/* Preview column */}
        <div style={{ color: '#111827' }}>
          <h2 className="text-lg font-semibold mb-1">Preview</h2>
          <p className="text-sm mb-2" style={{ color: '#6b7280' }}>This is exactly what your PDF will look like.</p>
          <div className="w-full bg-white rounded overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <iframe
              title="Preview"
              className="w-full"
              style={{ height: 'min(1100px, 80vh)' }}
              srcDoc={memoPreviewHtml}
            />
          </div>
        </div>
      </div>

      
    </div>
  );
}
