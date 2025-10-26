"use client";

import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

type Company = { name: string; address: string; email: string };
type Client = { name: string; address: string; email: string };
type GeneralItem = { description: string; quantity: number; rate: number };
type InvoiceItem = { description: string; refNo: string; date: string; startTime: string; finishTime: string; mileage: number };

export default function Home() {
  // Fixed company info (not editable)
  const company: Company = {
    name: 'Jambo Linguists',
    address:
      'First Floor, Radley House, Richardshaw Road, Pudsey, West Yorkshire, LS28 6LE, United Kingdom',
    email: 'jamii@jambolinguists.com',
  };
  
  const companyNumber = '15333696';
  const companyPhone = '+447938065717';
  const bankDetails = {
    bank: 'Santander',
    accountName: 'Jambo Linguists Limited',
    sortCode: '090129',
    accountNo: '96610194',
  };

  const [client, setClient] = useState<Client>({ name: '', address: '', email: '' });
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [generalItems, setGeneralItems] = useState<GeneralItem[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ description: '', refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);
  const [taxIncluded, setTaxIncluded] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(20);
  
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [vatNumber, setVatNumber] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [language, setLanguage] = useState<string>('');

  const [docType, setDocType] = useState<'invoice' | 'remittance'>('remittance');
  // Single simple payment amount used everywhere
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  // Letterhead selection
  const [letterheadStyle, setLetterheadStyle] = useState<'none' | 'classic' | 'modern' | 'geometric'>('none');

  const [hourRate, setHourRate] = useState<number>(20);
  const [minRate, setMinRate] = useState<number>(5);
  const [mileageRate, setMileageRate] = useState<number>(0.35);
  // Travel time (invoice only)
  const [travelTimeHours, setTravelTimeHours] = useState<number>(0);
  const [travelTimeRate, setTravelTimeRate] = useState<number>(0);
  // Minutes charging toggle (invoice only)
  const [minutesEnabled, setMinutesEnabled] = useState<boolean>(false);

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
        if (parsed.invoiceItems) setInvoiceItems(parsed.invoiceItems.map((it: any) => ({ description: it.description ?? '', refNo: it.refNo ?? '', date: it.date ?? '', startTime: it.startTime ?? '', finishTime: it.finishTime ?? '', mileage: Number(it.mileage ?? 0) })));
        if (typeof parsed.taxIncluded === 'boolean') setTaxIncluded(parsed.taxIncluded);
        if (typeof parsed.taxRate === 'number') setTaxRate(parsed.taxRate);
        if (parsed.invoiceDate) setInvoiceDate(parsed.invoiceDate);
        if (parsed.dueDate) setDueDate(parsed.dueDate);
        if (parsed.vatNumber) setVatNumber(parsed.vatNumber);
        if (parsed.paymentTerms) setPaymentTerms(parsed.paymentTerms);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.venue) setVenue(parsed.venue);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.docType) setDocType(parsed.docType);
        // If invoice number missing, set standby prefix
        if (!parsed.invoiceNumber) {
          setInvoiceNumber('JLL-');
        }
        if (typeof parsed.minutesEnabled === 'boolean') setMinutesEnabled(parsed.minutesEnabled);
        if (typeof parsed.hourRate === 'number') setHourRate(parsed.hourRate);
        if (typeof parsed.minRate === 'number') setMinRate(parsed.minRate);
        if (typeof parsed.mileageRate === 'number') setMileageRate(parsed.mileageRate);
        if (typeof parsed.travelTimeHours === 'number') setTravelTimeHours(parsed.travelTimeHours);
        if (typeof parsed.travelTimeRate === 'number') setTravelTimeRate(parsed.travelTimeRate);
        if (typeof parsed.amountPaid === 'number') setAmountPaid(parsed.amountPaid);
        if (parsed.letterheadStyle) setLetterheadStyle(parsed.letterheadStyle);
      }
    } catch {}
  }, []);

  // On first load without any saved state, ensure an invoice number prefix exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jl-invoice-state');
      if (!saved) {
        setInvoiceNumber((prev) => (prev && prev.trim().length > 0 ? prev : 'JLL-'));
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
      paymentTerms,
      paymentMethod,
      docType,
      hourRate,
      minRate,
      mileageRate,
      travelTimeHours,
      travelTimeRate,
      amountPaid,
      venue,
      language,
      letterheadStyle,
      minutesEnabled,
    };
    try {
      localStorage.setItem('jl-invoice-state', JSON.stringify(state));
    } catch {}
  }, [client, invoiceNumber, generalItems, invoiceItems, taxIncluded, taxRate, invoiceDate, dueDate, vatNumber, paymentTerms, paymentMethod, docType, hourRate, minRate, mileageRate, travelTimeHours, travelTimeRate, amountPaid, venue, language, letterheadStyle]);

  const handleInvoiceItemChange: {
    (index: number, field: 'description' | 'refNo' | 'date' | 'startTime' | 'finishTime', value: string): void;
    (index: number, field: 'mileage', value: number): void;
  } = (index: number, field: 'description' | 'refNo' | 'date' | 'startTime' | 'finishTime' | 'mileage', value: string | number) => {
    const nextItems = [...invoiceItems];
    if (field === 'description') nextItems[index].description = value as string;
    if (field === 'refNo') nextItems[index].refNo = value as string;
    if (field === 'date') nextItems[index].date = value as string;
    if (field === 'startTime') nextItems[index].startTime = value as string;
    if (field === 'finishTime') nextItems[index].finishTime = value as string;
    if (field === 'mileage') nextItems[index].mileage = Number(value);
    setInvoiceItems(nextItems);
  };

  const addGeneralItem = () => setGeneralItems([...generalItems, { description: '', quantity: 1, rate: 0 }]);
  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { description: '', refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);

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

  const toBlock = (value: string): string => (value || '').toUpperCase();

  const parseTime = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const roundCurrency = (value: number): number => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  const calculateInvoiceItemAmounts = (item: InvoiceItem, includeTravelTime: boolean = false, includeMinuteCharge: boolean = false) => {
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
    const minChargeRaw = roundCurrency(minIncrements * minRate);
    const minCharge = includeMinuteCharge ? minChargeRaw : 0;
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
    const accentDark = { r: 88, g: 28, b: 135 };
    const accentLight = { r: 139, g: 92, b: 246 };
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);

    // Enterprise background: outer frame and soft panels
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.6);
    pdf.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);
    // Soft top-right brand panel
    pdf.setFillColor(246, 243, 255);
    pdf.rect(pageWidth - margin - 70, margin, 70, 24, 'F');
    // Soft bottom-left panel
    pdf.setFillColor(249, 250, 251);
    pdf.rect(margin, pageHeight - margin - 24, 90, 20, 'F');
  
    // Render letterhead if selected
    const logoDataUrl = await getDataUrl(logoSrc);
    y = renderLetterhead(pdf, pageWidth, margin, y, logoDataUrl);
    
    // Helper function for text wrapping (word-aware)
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
    // Hyphen-aware wrapper for IDs like LST-RBH-080925-SWA (splits after '-')
    const wrapHyphenAware = (text: string, maxWidth: number) => {
      const tokens = String(text || '').split(/(?<=-)|\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = '';
      for (const t of tokens) {
        const test = line ? line + t : t;
        if (pdf.getTextWidth(test) > maxWidth) { if (line) lines.push(line); line = t; } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    };
    // Slash-aware wrapper for dates like 08/09/2025 (splits after '/')
    const wrapSlashAware = (text: string, maxWidth: number) => {
      const tokens = String(text || '').split(/(?<=\/)|\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = '';
      for (const t of tokens) {
        const test = line ? line + t : t;
        if (pdf.getTextWidth(test) > maxWidth) { if (line) lines.push(line); line = t; } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    };

    // If no letterhead, show traditional header
    if (letterheadStyle === 'none') {
      // Logo + Company Info
      const logoH = 18, logoW = 54;
      if (logoDataUrl) {
        try { pdf.addImage(logoDataUrl as string, 'JPEG', margin, y, logoW, logoH, undefined, 'FAST'); } catch {}
      }
    
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const infoX = margin + (logoDataUrl ? logoW + 6 : 0);
    
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    
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
      pdf.text(`VAT Number: ${vatNumber || '—'}`, pageWidth - margin, y + 27, { align: 'right' });
    
      const headerBottom = Math.max(y + logoH + 8, cy + 6);
      pdf.setFillColor(accent.r, accent.g, accent.b);
      pdf.rect(margin, headerBottom, pageWidth - margin * 2, 1.5, 'F');
      y = headerBottom + 8;
    } else {
      // With letterhead, add invoice details below
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('INVOICE', pageWidth - margin, y - 10, { align: 'right' });
    
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Date: ${formatDateUK(invoiceDate)}`, pageWidth - margin, y - 4, { align: 'right' });
      pdf.text(`Invoice #: ${invoiceNumber || '—'}`, pageWidth - margin, y + 1, { align: 'right' });
      pdf.text(`Due Date: ${formatDateUK(dueDate)}`, pageWidth - margin, y + 6, { align: 'right' });
      pdf.text(`VAT Number: ${vatNumber || '—'}`, pageWidth - margin, y + 11, { align: 'right' });
      
      // Add separator line
      pdf.setFillColor(accent.r, accent.g, accent.b);
      pdf.rect(margin, y + 10, pageWidth - margin * 2, 1.5, 'F');
      y += 18;
    }

    // (Bank details moved near totals/footer)
  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Bill To', margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y += 6;
    if (client.name) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(toBlock(client.name), margin, y);
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
    // Build dynamic columns (omit minutes column if minute rate is not set)
    const includeMinutes = minutesEnabled && minRate > 0;
    let columns: { key: string; w: number; header: string; align?: 'left' | 'right' }[] = [
      { key: 'desc', w: 24, header: 'Description' },
      { key: 'ref', w: 28, header: 'Ref No.' },
      { key: 'date', w: 22, header: 'Date' },
      { key: 'start', w: 20, header: 'Start Time' },
      { key: 'finish', w: 20, header: 'Finish Time' },
      { key: 'hours', w: 36, header: `Hours x £${hourRate}` },
      { key: 'miles', w: 30, header: `Miles x £${mileageRate}` },
      { key: 'travel', w: 28, header: `Travel Time x £${travelTimeRate}` },
      { key: 'amount', w: 22, header: 'Total', align: 'right' },
    ];
    if (includeMinutes) {
      // Insert minutes column and keep balanced widths
      columns = [
        { key: 'desc', w: 24, header: 'Description' },
        { key: 'ref', w: 35, header: 'Ref No.' },
        { key: 'date', w: 22, header: 'Date' },
        { key: 'start', w: 18, header: 'Start Time' },
        { key: 'finish', w: 18, header: 'Finish Time' },
        { key: 'hours', w: 33, header: `Hours x £${hourRate}` },
        { key: 'mins', w: 36, header: `Mins (15min incr) x £${minRate}` },
        { key: 'miles', w: 26, header: `Miles x £${mileageRate}` },
        { key: 'travel', w: 28, header: `Travel Time x £${travelTimeRate}` },
        { key: 'amount', w: 22, header: 'Total', align: 'right' },
      ];
    } else {
      // Redistribute the 32mm from the omitted minutes column across key columns
      columns = columns.map(c => {
        if (c.key === 'desc') return { ...c, w: c.w + 8 };
        if (c.key === 'date') return { ...c, w: 20 };
        if (c.key === 'ref') return { ...c, w: c.w + 9 };
        if (c.key === 'hours') return { ...c, w: 33 };
        if (c.key === 'miles') return { ...c, w: c.w + 4 };
        if (c.key === 'start') return { ...c, w: 16 };
        if (c.key === 'finish') return { ...c, w: 16 };
        return c;
      });
      // Ensure travel is roughly equal to hours when minutes are off
      columns = columns.map(c => (c.key === 'travel' ? { ...c, w: 34 } : c));
      // Nudge amount down slightly to give date a little extra room
      columns = columns.map(c => (c.key === 'amount' ? { ...c, w: Math.max(20, c.w - 2) } : c));
    }

    // Scale columns to fill available table width exactly
    const availableTableW = pageWidth - margin * 2;
    const currentTableW = columns.reduce((s, c) => s + c.w, 0);
    if (currentTableW > 0) {
      const scale = availableTableW / currentTableW;
      columns = columns.map(c => ({ ...c, w: +(c.w * scale).toFixed(2) }));
    }

    const colWidths = columns.map(c => c.w);
    const colPositions = colWidths.reduce<number[]>((acc, w, i) => {
      acc.push(i === 0 ? margin : acc[i - 1] + colWidths[i - 1]);
      return acc;
    }, []);
    const tableW = colWidths.reduce((s, n) => s + n, 0);
  
    const headerH = 12;
    // Brand bar header like inspirations
    pdf.setFillColor(accentDark.r, accentDark.g, accentDark.b);
    pdf.rect(margin, y, tableW, headerH, 'F');
    pdf.setDrawColor(accentDark.r, accentDark.g, accentDark.b);
    pdf.rect(margin, y, tableW, headerH);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    columns.forEach((col, i) => {
      const alignRight = i === columns.length - 1;
      const maxW = colWidths[i] - 4;
      const lines = wrap(String(col.header), maxW).slice(0, 2);
      const baseX = (col.align === 'right' || alignRight) ? colPositions[i] + colWidths[i] - 2 : colPositions[i] + 2;
      const firstY = y + 4;
      const secondY = y + 8;
      if (lines[0]) pdf.text(lines[0], baseX, firstY, { align: (col.align === 'right' || alignRight) ? 'right' : 'left' });
      if (lines[1]) pdf.text(lines[1], baseX, secondY, { align: (col.align === 'right' || alignRight) ? 'right' : 'left' });
    });

    let colLineX = margin;
    colWidths.forEach(w => {
      pdf.line(colLineX, y, colLineX, y + headerH);
      colLineX += w;
    });
    pdf.line(colLineX, y, colLineX, y + headerH);
    y += headerH + 4; // add a touch more space before body rows
    // Reset text color after brand header
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);
  
    pdf.setFont('helvetica', 'normal');
    const rowHeight = 7;
    const extraLineHeight = 5; // additional height per wrapped line
    const rowPadding = 2;
    const tableRight = pageWidth - margin;
  
    for (let i = 0; i < invoiceItems.length; i++) {
      const it = invoiceItems[i];
      const { hours, remMin, hourCharge, minCharge, mileCharge, travelCharge, amount } = calculateInvoiceItemAmounts(it, true, includeMinutes);
  
      // Compute wrapped lines for Description (no word breaking)
      const descMaxW = colWidths[0] - 4;
      const descLines = wrap(it.description || '', descMaxW);
      // If minutes/ref/date/miles columns are included, compute their wrapped lines too for row height calculations
      let minsLines: string[] = [];
      const minsIndex = includeMinutes ? columns.findIndex(c => c.key === 'mins') : -1;
      if (includeMinutes && minsIndex >= 0) {
        const minsMaxW = colWidths[minsIndex] - 4;
        const minsText = `${remMin} mins (${Math.ceil(remMin / 15)} incr) = ${formatCurrency(minCharge)}`;
        minsLines = wrap(minsText, minsMaxW);
      }
      let refLines: string[] = [];
      const refIndex = columns.findIndex(c => c.key === 'ref');
      if (refIndex >= 0) {
        const refMaxW = colWidths[refIndex] - 4;
        refLines = wrapHyphenAware(it.refNo || '', refMaxW);
      }
      let dateLines: string[] = [];
      const dateIndex = columns.findIndex(c => c.key === 'date');
      if (dateIndex >= 0) {
        const dateMaxW = colWidths[dateIndex] - 4;
        const dateText = formatDateUK(it.date);
        dateLines = wrapSlashAware(dateText, dateMaxW);
      }
      let milesLines: string[] = [];
      const milesIndex = columns.findIndex(c => c.key === 'miles');
      if (milesIndex >= 0) {
        const milesMaxW = colWidths[milesIndex] - 4;
        const milesText = `${it.mileage} miles = ${formatCurrency(mileCharge)}`;
        milesLines = wrap(milesText, milesMaxW);
      }
      let travelLines: string[] = [];
      const travelIndex = columns.findIndex(c => c.key === 'travel');
      if (travelIndex >= 0) {
        const travelMaxW = colWidths[travelIndex] - 4;
        const travelText = travelCharge > 0
          ? `${travelTimeHours} x £${travelTimeRate} = ${formatCurrency(travelCharge)}`
          : '';
        travelLines = wrap(travelText, travelMaxW);
      }
      const wrappedLinesCount = Math.max(
        descLines.length,
        minsLines.length || 1,
        refLines.length || 1,
        dateLines.length || 1,
        milesLines.length || 1,
        travelLines.length || 1
      );
      const rh = rowHeight + Math.max(0, wrappedLinesCount - 1) * extraLineHeight;

      if (y + rh + margin + 20 > pageHeight) { pdf.addPage(); y = margin; }
  
      if (i % 2 === 0) {
        pdf.setFillColor(rowLight.r, rowLight.g, rowLight.b);
        pdf.rect(margin, y - rowPadding, pageWidth - margin * 2, rh + rowPadding * 2, 'F');
      }
  
      const travelColValue = travelCharge > 0
        ? `${travelTimeHours} x £${travelTimeRate} = ${formatCurrency(travelCharge)}`
        : '';

      const rowValues = [
        it.description || '',
        it.refNo || '',
        formatDateUK(it.date),
        it.startTime || '',
        it.finishTime || '',
        `${hours} x £${hourRate} = ${formatCurrency(hourCharge)}`,
        ...(includeMinutes ? [`${remMin} mins (${Math.ceil(remMin / 15)} incr) = ${formatCurrency(minCharge)}`] : []),
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
        } else if (includeMinutes && minsIndex === idx) {
          // Minutes column: render wrapped lines
          const lines = minsLines.length ? minsLines : [String(val)];
          for (let li = 0; li < lines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(lines[li], maxW);
            pdf.text(out, x, lineY, { align: 'left' });
          }
        } else if (refIndex === idx) {
          const lines = refLines.length ? refLines : [String(val)];
          for (let li = 0; li < lines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(lines[li], maxW);
            pdf.text(out, x, lineY, { align: 'left' });
          }
        } else if (dateIndex === idx) {
          const lines = dateLines.length ? dateLines : [String(val)];
          for (let li = 0; li < lines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(lines[li], maxW);
            pdf.text(out, x, lineY, { align: 'left' });
          }
        } else if (milesIndex === idx) {
          const lines = milesLines.length ? milesLines : [String(val)];
          for (let li = 0; li < lines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(lines[li], maxW);
            pdf.text(out, x, lineY, { align: 'left' });
          }
        } else if (travelIndex === idx) {
          const lines = travelLines.length ? travelLines : [String(val)];
          for (let li = 0; li < lines.length; li++) {
            const lineY = y + li * extraLineHeight;
            const out = fitText(lines[li], maxW);
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
    // Emphasized total row like "button" style
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(boxX, totalY - 5, boxW, lineH + 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Amount Due', boxX + 4, totalY);
    pdf.text(formatCurrency(total), boxX + boxW - 4, totalY, { align: 'right' });
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);

    // No amount owed shown on invoice; remittance handles payments
  
    // Payment terms/method and bank details below totals (common placement)
    let bankBlockY = boxY + boxH + 10;
    if (paymentTerms || paymentMethod) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      if (paymentTerms) { pdf.text(`Payment Terms: ${paymentTerms}`, margin, bankBlockY); bankBlockY += 5; }
      if (paymentMethod) { pdf.text(`Payment Method: ${paymentMethod}`, margin, bankBlockY); bankBlockY += 7; }
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const bankLine1 = `Bank: ${bankDetails.bank} | Account Name: ${bankDetails.accountName}`;
    const bankLine2 = `Sort Code: ${bankDetails.sortCode} | Account No. ${bankDetails.accountNo}`;
    pdf.text(bankLine1, pageWidth / 2, bankBlockY, { align: 'center' }); bankBlockY += 5;
    pdf.text(bankLine2, pageWidth / 2, bankBlockY, { align: 'center' });
    
    // Footer elements with proper spacing - ensure they fit on current page
    const footerStartY = bankBlockY + 12;
    const footerMinY = pageHeight - 20; // Reserve 20mm from bottom for footer
    
    // If footer would be too close to bottom, adjust bank details spacing
    let actualFooterY = Math.max(footerStartY, footerMinY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Thank you for your business', pageWidth / 2, actualFooterY, { align: 'center' });
  
    // Footer company number - positioned below thank you message
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Company No. ${companyNumber}`, pageWidth / 2, actualFooterY + 8, { align: 'center' });

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

    // Enterprise background frame
    pdf.setDrawColor(border.r, border.g, border.b);
    pdf.setLineWidth(0.8);
    pdf.rect(margin - 3, margin - 3, pageWidth - (margin * 2) + 6, pageHeight - (margin * 2) + 6);

    // Soft decorative background panels
    const soft = { r: 250, g: 245, b: 255 };
    pdf.setFillColor(soft.r, soft.g, soft.b);
    pdf.rect(pageWidth - margin - 80, y + 2, 80, 22, 'F');
    pdf.setFillColor(249, 250, 251);
    pdf.rect(margin, pageHeight - margin - 24, 90, 18, 'F');

    // Render letterhead if selected
    const logoDataUrl = await getDataUrl(logoSrc);
    y = renderLetterhead(pdf, pageWidth, margin, y, logoDataUrl);
    
    // If no letterhead, show traditional header
    if (letterheadStyle === 'none') {
      // Company logo on the right first
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
      y = companyY + 4;
    } else {
      // With letterhead, add remittance title below
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('REMITTANCE ADVICE', margin, y);
      y += 12;
    }

    // Define variables for remittance layout
    const rightX = pageWidth - margin;
    let companyY = y;

    // Left recipient block under header row with label and emphasis
    let lx = margin;
    let ly = y;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Customer', lx, ly);
    ly += 6;
    if (client.name) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(toBlock(client.name), lx, ly);
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

  // Footer placement for payment terms/method (bank details intentionally omitted)
  let bankY = totalsY + totalsBoxH + 10;
  if (paymentTerms) { pdf.text(`Payment Terms: ${paymentTerms}`, margin, bankY); bankY += 5; }
  if (paymentMethod) { pdf.text(`Payment Method: ${paymentMethod}`, margin, bankY); bankY += 7; }

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

  // Letterhead design functions
  const renderLetterhead = (pdf: jsPDF, pageWidth: number, margin: number, y: number, logoDataUrl: string | null) => {
    if (letterheadStyle === 'none') return y;

    const accent = { r: 107, g: 33, b: 168 };
    const softAccent = { r: 124, g: 58, b: 237 };
    const lightGray = { r: 243, g: 244, b: 246 };
    
    switch (letterheadStyle) {
      case 'classic':
        return renderClassicLetterhead(pdf, pageWidth, margin, y, logoDataUrl, accent);
      case 'modern':
        return renderModernLetterhead(pdf, pageWidth, margin, y, logoDataUrl, accent, lightGray);
      case 'geometric':
        return renderGeometricLetterhead(pdf, pageWidth, margin, y, logoDataUrl, accent, softAccent);
      default:
        return y;
    }
  };

  const renderClassicLetterhead = (pdf: jsPDF, pageWidth: number, margin: number, y: number, logoDataUrl: string | null, accent: { r: number; g: number; b: number }) => {
    // Clean executive top bar with logo
    const topY = y - 8;
    const headerH = 24;
    
    // Main header bar
    pdf.setFillColor(88, 28, 135);
    pdf.rect(0, topY, pageWidth, headerH, 'F');
    
    // Logo centered in header
    if (logoDataUrl) {
      const logoH = 16, logoW = 48;
      const logoX = (pageWidth - logoW) / 2;
      try { 
        pdf.addImage(logoDataUrl as string, 'JPEG', logoX, topY + 4, logoW, logoH, undefined, 'FAST'); 
      } catch {}
    }

    // Company contact below header
    let infoY = topY + headerH + 8;
    pdf.setTextColor(17, 24, 39);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const centerX = pageWidth / 2;
    const info = [company.address, `Tel: ${companyPhone}`, company.email];
    for (const line of info) { 
      pdf.text(line, centerX, infoY, { align: 'center' }); 
      infoY += 4; 
    }
    
    return infoY + 6;
  };

  const renderModernLetterhead = (pdf: jsPDF, pageWidth: number, margin: number, y: number, logoDataUrl: string | null, accent: { r: number; g: number; b: number }, lightGray: { r: number; g: number; b: number }) => {
    // Swiss left rule with strong brand column
    const rightX = pageWidth - margin;
    const brandW = 12;
    pdf.setFillColor(accent.r, accent.g, accent.b);
    pdf.rect(margin, y - 2, brandW, 30, 'F');
    
    // Header band
    pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
    pdf.rect(margin + brandW + 2, y, pageWidth - margin * 2 - brandW - 2, 24, 'F');
    
    // Logo and company
    if (logoDataUrl) {
      const logoH = 16, logoW = 48;
      try { pdf.addImage(logoDataUrl as string, 'JPEG', margin + brandW + 6, y + 4, logoW, logoH, undefined, 'FAST'); } catch {}
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(17, 24, 39);
    pdf.text(company.name, margin + brandW + 6, y + 22);
    
    // Right-aligned contact
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const lines = [company.address.split(',')[0], `Tel: ${companyPhone}`, company.email];
    let cy = y + 6;
    for (const line of lines) { pdf.text(line, rightX, cy, { align: 'right' }); cy += 4; }
    
    // Bottom hairline
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 26, pageWidth - margin, y + 26);
    
    return y + 34;
  };

  const renderGeometricLetterhead = (pdf: jsPDF, pageWidth: number, margin: number, y: number, logoDataUrl: string | null, accent: { r: number; g: number; b: number }, softAccent: { r: number; g: number; b: number }) => {
    // Header + Footer rails with geometric accents
    const railH = 16;
    pdf.setFillColor(softAccent.r, softAccent.g, softAccent.b);
    pdf.rect(0, y - 4, pageWidth, railH, 'F');
    
    // Diagonal accent on right
    pdf.setFillColor(accent.r, accent.g, accent.b);
    const rightX = pageWidth - margin;
    pdf.triangle(rightX - 28, y - 4, rightX, y - 4, rightX, y + railH - 4, 'F');
    
    // Logo and company stacked
    if (logoDataUrl) {
      const logoH = 14, logoW = 44;
      try { pdf.addImage(logoDataUrl as string, 'JPEG', margin + 2, y - 2, logoW, logoH, undefined, 'FAST'); } catch {}
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(company.name, margin + 2, y + 9);
    
    // Contact microtext below rail
    pdf.setTextColor(17, 24, 39);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    let cy = y + railH + 4;
    const details = [company.address, `Tel: ${companyPhone}`, company.email];
    for (const d of details) { pdf.text(d, margin, cy); cy += 4; }
    
    // Footer rail will be added by caller if needed; return new y
    return cy + 4;
  };

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
      : invoiceItems.reduce((sum, item) => sum + calculateInvoiceItemAmounts(item, true, minutesEnabled).amount, 0);
    return roundCurrency(base);
  }, [docType, generalItems, invoiceItems, minutesEnabled]);

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
        body { margin: 0; font-family: Inter, Arial, Helvetica, sans-serif; color: #111827; background: #f1f5f9; }
        .sheet { position: relative; max-width: 960px; width: 100%; margin: 24px auto; background: #ffffff; padding: clamp(18px, 2.5vw, 28px); border: 1px solid #e5e7eb; box-shadow: 0 18px 28px rgba(2,6,23,0.08); overflow: hidden; border-radius: 6px; }
        .sheet { outline: 2px solid #e5e7eb; outline-offset: -8px; }
        /* enterprise decorative background */
        .sheet::before { content: ''; position: absolute; right: -30px; top: -30px; width: 360px; height: 180px; background: radial-gradient(140px 90px at 70% 40%, rgba(124,58,237,0.06), transparent 70%); }
        .sheet::after { content: ''; position: absolute; left: -20px; bottom: -20px; width: 340px; height: 160px; background: linear-gradient(180deg, rgba(2,6,23,0.04), rgba(2,6,23,0.0)); filter: blur(0.4px); }
        .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .logo { height: 56px; filter: saturate(1.1) contrast(1.05); }
        .accent { height: 4px; background: #6b21a8; margin: 12px 0 16px; border-radius: 2px; }
        h1 { margin: 0 0 8px 0; font-size: 22px; letter-spacing: 0.2px; }
        h2 { margin: 0; font-size: 18px; letter-spacing: 0.15px; }
        p { margin: 2px 0; font-size: 12px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 10px 8px; font-size: 12px; vertical-align: top; }
        .wrap-ref { word-break: break-word; overflow-wrap: anywhere; }
        thead tr { background: #f3f4f6; border: 1px solid #e5e7eb; }
        tbody tr { border-bottom: 1px solid #eef2f7; }
        tbody tr:nth-child(even) { background: #fafbfc; }
        .right { text-align: right; }
        .totals { width: 280px; margin-left: auto; margin-top: 12px; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 6px; box-shadow: 0 6px 10px rgba(2,6,23,0.04); }
        .totals-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .totals-row.total { font-weight: 700; }
        .thanks { margin-top: 24px; font-size: 12px; color: #4b5563; text-align: center; }
        
        /* Letterhead styles */
        .letterhead-classic { margin-bottom: 18px; position: relative; overflow: hidden; border-radius: 6px; }
        .letterhead-classic .topbar { height: 60px; background: linear-gradient(120deg, #581c87, #7c3aed); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; color: #fff; font-weight: 800; letter-spacing: 0.5px; }
        .letterhead-classic .topbar::after { content: ''; position: absolute; left: 0; right: 0; bottom: -18px; height: 36px; background: radial-gradient(60% 60% at 50% -20%, rgba(99,102,241,0.5), transparent 60%); }
        .letterhead-classic .contact { font-size: 11px; text-align: center; margin-top: 8px; }
        
        .letterhead-modern { margin-bottom: 18px; display: grid; grid-template-columns: 12px 1fr; gap: 10px; align-items: center; }
        .letterhead-modern .rail { width: 12px; height: 48px; background: #6b21a8; border-radius: 2px; }
        .letterhead-modern .content { background: #f3f4f6; padding: 10px 14px; border-radius: 4px; box-shadow: inset 0 0 0 1px #e5e7eb; }
        .letterhead-modern .company-name { font-size: 16px; font-weight: 700; margin: 0; }
        .letterhead-modern .contact { font-size: 10px; text-align: right; line-height: 1.3; }
        .letterhead-modern .accent-bar { height: 3px; background: #6b21a8; margin-top: 8px; border-radius: 2px; }
        
        .letterhead-geometric { position: relative; margin-bottom: 20px; padding-top: 8px; }
        .letterhead-geometric .geometric-shapes { position: absolute; top: 0; right: 0; width: 140px; height: 70px; }
        .letterhead-geometric .triangle { position: absolute; top: 0; right: 0; width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 40px solid rgba(124,58,237,0.24); }
        .letterhead-geometric .square { position: absolute; bottom: 6px; left: 0; width: 24px; height: 24px; background: rgba(124,58,237,0.16); }
        .letterhead-geometric .content { position: relative; z-index: 1; }
        .letterhead-geometric .company-name { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .letterhead-geometric .contact { font-size: 10px; line-height: 1.4; }
        .letterhead-geometric .contact-item { display: flex; align-items: center; margin: 2px 0; }
        .letterhead-geometric .dot { width: 4px; height: 4px; background: #6b21a8; border-radius: 50%; margin-right: 8px; }
        .letterhead-geometric .dashed-line { height: 2px; background: repeating-linear-gradient(to right, #6b21a8 0px, #6b21a8 4px, transparent 4px, transparent 8px); margin-top: 10px; border-radius: 1px; }
      </style>
    `;

    const f = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

    const generateLetterheadHtml = () => {
      if (letterheadStyle === 'none') return '';
      
      const logoHtml = `<img src="${logoSrc}" class="logo" alt="logo" style="height: 40px;" />`;
      
      switch (letterheadStyle) {
        case 'classic':
          return `
            <div class="letterhead-classic">
              <div class="topbar">
                <img src="${logoSrc}" class="logo" alt="logo" style="height: 40px;" />
              </div>
              <div class="contact">
                ${escapeHtml(company.address)} · Tel: ${escapeHtml(companyPhone)} · ${escapeHtml(company.email)}
              </div>
            </div>
          `;
        case 'modern':
          return `
            <div class="letterhead-modern">
              <div class="rail"></div>
              <div class="content">
                <div class="row" style="align-items:center;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    ${logoHtml}
                    <div class="company-name">${escapeHtml(company.name)}</div>
                  </div>
                  <div class="contact">
                    ${escapeHtml(company.address.split(',')[0])}<br/>
                    Tel: ${escapeHtml(companyPhone)}<br/>
                    ${escapeHtml(company.email)}
                  </div>
                </div>
                <div class="accent-bar"></div>
              </div>
            </div>
          `;
        case 'geometric':
          return `
            <div class="letterhead-geometric">
              <div class="geometric-shapes">
                <div class="triangle"></div>
                <div class="square"></div>
              </div>
              <div class="content">
                <div style="display:flex; align-items:center; gap:10px;">
                  ${logoHtml}
                  <div class="company-name">${escapeHtml(company.name)}</div>
                </div>
                <div class="contact">
                  <div class="contact-item">
                    <div class="dot"></div>
                    <span>${escapeHtml(company.address)}</span>
                  </div>
                  <div class="contact-item">
                    <div class="dot"></div>
                    <span>Tel: ${escapeHtml(companyPhone)}</span>
                  </div>
                  <div class="contact-item">
                    <div class="dot"></div>
                    <span>${escapeHtml(company.email)}</span>
                  </div>
                </div>
                <div class="dashed-line"></div>
              </div>
            </div>
          `;
        default:
          return '';
      }
    };

    const companyHtml = `
      <p>${escapeHtml(company.address)}</p>
      <p>Tel: ${escapeHtml(companyPhone)}</p>
      <p>${escapeHtml(company.email)}</p>
    `;

    const clientHtml = `
      <h2>Customer</h2>
      <p><strong>${escapeHtml((client.name || '').toUpperCase())}</strong></p>
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
          <p>${escapeHtml((client.name || '').toUpperCase())}</p>
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
              ${generateLetterheadHtml()}
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
              ${paymentTerms ? `<div class="thanks">Payment Terms: ${escapeHtml(paymentTerms)}</div>` : ''}
              ${paymentMethod ? `<div class="thanks">Payment Method: ${escapeHtml(paymentMethod)}</div>` : ''}
              <div class="thanks">Thank you for your business</div>
              <div class="thanks" style="margin-top: 6px;">Company No. ${companyNumber}</div>
            </div>
          </body>
        </html>`;
    } else {
      // Invoice preview
      const amountColHeader = 'Amount Due';
      const itemsRows = invoiceItems
        .map(
          (it, idx) => {
            const { hours, remMin, hourCharge, minCharge, mileCharge, travelCharge, amount } = calculateInvoiceItemAmounts(it, true);
            const travelCell = travelCharge > 0
              ? `${travelTimeHours} x £${travelTimeRate} = ${f.format(travelCharge)}`
              : '';
            return `
            <tr>
              <td>${escapeHtml(it.description || '')}</td>
              <td class="wrap-ref">${escapeHtml(it.refNo || '')}</td>
              <td>${formatDateUK(it.date)}</td>
              <td>${escapeHtml(it.startTime || '')}</td>
              <td>${escapeHtml(it.finishTime || '')}</td>
              <td>${hours} x £${hourRate} = ${f.format(hourCharge)}</td>
              ${minutesEnabled && minRate > 0 ? `<td>${remMin} mins (${Math.ceil(remMin / 15)} incr) x £${minRate} = ${f.format(minCharge)}</td>` : ''}
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
              ${generateLetterheadHtml()}
              <div class="row">
                <div>
                  ${letterheadStyle === 'none' ? `<img src="${logoSrc}" class="logo" alt="logo" />${companyHtml}` : ''}
                </div>
                <div style="text-align:right">
                  <h2>Invoice</h2>
                  <p>Date: ${formatDateUK(invoiceDate)}</p>
                  <p>Invoice #: ${escapeHtml(invoiceNumber || '—')}</p>
                  <p>Due Date: ${formatDateUK(dueDate)}</p>
                  <p>VAT Number: ${escapeHtml(vatNumber || '—')}</p>
                </div>
              </div>
              <div class="accent"></div>
              <div style="margin-top: 12px;">${clientHtml}${jobDetailsHtml}</div>
              <table>
                <thead>
                  <tr>
                    <th style="text-align:left;">Description</th>
                    <th style="text-align:left;">Ref No.</th>
                    <th style="text-align:left;">Date</th>
                    <th style="text-align:left;">Start</th>
                    <th style="text-align:left;">Finish</th>
                    <th style="text-align:left;">Hours x £${hourRate}</th>
                    ${minutesEnabled && minRate > 0 ? `<th style=\"text-align:left;\">Mins x £${minRate} (15m)</th>` : ''}
                    <th style="text-align:left;">Miles x £${mileageRate}</th>
                    <th style="text-align:left;">Travel x £${travelTimeRate}</th>
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
                <div class="totals-row total"><span>Amount Due</span><span>${totalStr}</span></div>
              </div>
              <div style="text-align:center; margin: 14px 0 4px 0; font-size: 12px;">
                ${paymentTerms ? `<div>Payment Terms: ${escapeHtml(paymentTerms)}</div>` : ''}
                ${paymentMethod ? `<div>Payment Method: ${escapeHtml(paymentMethod)}</div>` : ''}
                <!-- Bank details intentionally omitted for remittance -->
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
    paymentTerms,
    paymentMethod,
    hourRate,
    minRate,
    mileageRate,
    amountPaid,
    owed,
    venue,
    language,
    letterheadStyle,
    minutesEnabled,
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
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={minutesEnabled}
                      onChange={(e) => setMinutesEnabled(e.target.checked)}
                    />
                    Charge minutes (15 min increments)
                  </label>
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
                    className="border rounded-lg p-3 bg-gray-50"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    {/* First Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
                    <div className="sm:col-span-4 relative">
                      <input
                        type="text"
                        id={`desc-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Description"
                        value={it.description}
                        onChange={(e) => handleInvoiceItemChange(index, "description", e.target.value)}
                      />
                      <label
                        htmlFor={`desc-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Description
                      </label>
                    </div>
                    <div className="sm:col-span-4 relative">
                      <input
                        type="text"
                        id={`refno-${index}`}
                        className="peer w-full border rounded p-2 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Ref No."
                        value={it.refNo}
                        onChange={(e) => handleInvoiceItemChange(index, "refNo", e.target.value)}
                      />
                      <label
                        htmlFor={`refno-${index}`}
                        className="absolute left-2 -top-2.5 bg-white px-1 text-xs text-gray-500 peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all"
                      >
                        Ref No.
                      </label>
                    </div>
                    <div className="sm:col-span-3 relative">
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
                    <div className="sm:col-span-1 flex items-center justify-end">
                      <span className="text-sm font-semibold">
                        {calculateInvoiceItemAmounts(it, true, minutesEnabled).amount.toFixed(2)}
                      </span>
                    </div>
                    </div>
                    
                    {/* Second Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3 relative">
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
                    <div className="sm:col-span-3 relative">
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
                    <div className="sm:col-span-5 relative">
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
                    <div className="sm:col-span-1 flex justify-end items-end">
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
              {docType === 'remittance' ? 'Total GBP paid' : 'Amount Due'}: {(docType === 'remittance' ? (amountPaid > 0 ? amountPaid : total) : total).toFixed(2)}
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

          {/* Payment terms/method (both doc types) */}
          <div className="mt-4">
            <h3 className="font-medium mb-1">Payment Terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Terms</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  style={{ border: '1px solid #d1d5db' }}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30, late fee 2%/mo"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Preferred Payment Method</label>
                <input
                  type="text"
                  className="w-full p-2 rounded"
                  style={{ border: '1px solid #d1d5db' }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g. Bank transfer"
                />
              </div>
            </div>
          </div>

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
              // set standby invoice number prefix on reset
              setInvoiceNumber('JLL-');
              setGeneralItems([{ description: '', quantity: 1, rate: 0 }]);
              setInvoiceItems([{ description: '', refNo: '', date: '', startTime: '', finishTime: '', mileage: 0 }]);
              setMinutesEnabled(false);
              setTaxIncluded(false);
              setTaxRate(20);
              setInvoiceDate('');
              setDueDate('');
              setVatNumber('');
              setPaymentTerms('');
              setPaymentMethod('');
              setDocType('remittance');
              setHourRate(20);
              setMinRate(5);
              setMileageRate(0.35);
              setTravelTimeHours(0);
              setTravelTimeRate(0);
              setAmountPaid(0);
              setVenue('');
              setLanguage('');
              setLetterheadStyle('none');
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
