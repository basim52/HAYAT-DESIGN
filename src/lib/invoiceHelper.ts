import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order, InvoiceConfig } from '../types';
import arabicReshaper from 'arabic-reshaper';

const fixArabicContent = (text: string | number | undefined | null) => {
  if (text === undefined || text === null) return '';
  const str = text.toString();
  
  // If it's Arabic, we use the reshaper to get the correct character forms
  if (/[\u0600-\u06FF]/.test(str)) {
    try {
      return arabicReshaper.reshape(str);
    } catch (e) {
      return str;
    }
  }
  return str;
};

export const generateInvoicePDF = async (order: Order, config: InvoiceConfig) => {
  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = config.isTaxEnabled ? (subtotal * (config.vatRate / 100)) : 0;
  const totalWithVat = subtotal + vatAmount + (order.shippingCost || 0) - (order.discount || 0);

  // Add Google Fonts
  if (!document.getElementById('invoice-fonts')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'invoice-fonts';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }

  await document.fonts.ready;

  const invoiceElement = document.createElement('div');
  invoiceElement.id = 'invoice-render-container';
  invoiceElement.style.width = '800px';
  invoiceElement.style.padding = '60px';
  invoiceElement.style.background = '#ffffff';
  invoiceElement.style.fontFamily = "'Inter', 'Cairo', sans-serif";
  invoiceElement.style.direction = 'ltr'; 
  invoiceElement.style.position = 'fixed';
  invoiceElement.style.left = '-9999px';
  invoiceElement.style.top = '0';
  invoiceElement.style.textAlign = 'left';
  invoiceElement.style.color = '#1e293b';

  const isTaxEnabled = config.isTaxEnabled ?? false;

  invoiceElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 6px solid #5830b0; padding-bottom: 30px; margin-bottom: 40px;">
      <div style="text-align: left;">
        <h1 style="margin: 0; color: #5830b0; font-size: 38px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">${isTaxEnabled ? 'Tax Invoice' : 'Order Invoice'}</h1>
        <div style="margin-top: 15px;">
          <p style="margin: 3px 0; font-size: 16px; color: #64748b; font-weight: 600;">Bill No: <span style="color: #14b8a6;">#${order.id.slice(-6).toUpperCase()}</span></p>
          <p style="margin: 3px 0; font-size: 14px; color: #94a3b8;">Issue Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div style="text-align: right;">
        ${config.logoUrl ? `<img src="${config.logoUrl}" style="max-height: 120px; max-width: 240px; object-fit: contain;" />` : `<h2 style="margin:0; color: #5830b0; font-size: 32px; font-weight: 800; font-family: 'Cairo', sans-serif;">${fixArabicContent(config.storeName)}</h2>`}
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; gap: 40px; margin-bottom: 50px;">
      <div style="flex: 1; border-left: 4px solid #ccfbf1; padding-left: 20px;">
        <h3 style="font-size: 13px; color: #14b8a6; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 800;">Customer Information</h3>
        <div style="line-height: 1.6; font-size: 15px;">
          <p style="margin: 4px 0; color: #1e293b; font-family: 'Cairo', sans-serif;"><strong>Name:</strong> ${fixArabicContent(order.customerName)}</p>
          <p style="margin: 4px 0; color: #1e293b; font-family: 'Cairo', sans-serif;"><strong>City:</strong> ${fixArabicContent(order.city || '-')}</p>
          <p style="margin: 4px 0; color: #1e293b; font-family: 'Cairo', sans-serif;"><strong>Address:</strong> ${fixArabicContent(order.address)}</p>
          <p style="margin: 4px 0; color: #1e293b;"><strong>Contact:</strong> ${order.phone}</p>
        </div>
      </div>
      <div style="flex: 1; border-left: 4px solid #ede9fe; padding-left: 20px;">
        <h3 style="font-size: 13px; color: #5830b0; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; font-weight: 800;">Merchant Information</h3>
        <div style="line-height: 1.6; font-size: 15px;">
          <p style="margin: 4px 0; color: #1e293b; font-family: 'Cairo', sans-serif;"><strong>Merchant:</strong> ${fixArabicContent(config.storeName)}</p>
          ${isTaxEnabled ? `<p style="margin: 4px 0; color: #1e293b;"><strong>TRN:</strong> ${config.taxNumber || '-'}</p>` : ''}
          <p style="margin: 4px 0; color: #1e293b; font-family: 'Cairo', sans-serif;"><strong>Address:</strong> ${fixArabicContent(config.storeAddress)}</p>
          <p style="margin: 4px 0; color: #1e293b;"><strong>Phone:</strong> ${config.phone}</p>
        </div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #5830b0;">
          <th style="padding: 18px 12px; text-align: left; font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase;">Item Description</th>
          <th style="padding: 18px 12px; text-align: center; font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
          <th style="padding: 18px 12px; text-align: right; font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase;">Unit Price</th>
          <th style="padding: 18px 12px; text-align: right; font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 18px 12px; font-size: 14px; font-weight: 500; font-family: 'Cairo', sans-serif;">${fixArabicContent(item.name)}</td>
            <td style="padding: 18px 12px; text-align: center; font-size: 14px;">${item.quantity}</td>
            <td style="padding: 18px 12px; text-align: right; font-size: 14px;">${item.price.toFixed(2)} SAR</td>
            <td style="padding: 18px 12px; text-align: right; font-size: 14px; font-weight: 700; color: #5830b0;">${(item.price * item.quantity).toFixed(2)} SAR</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 60px;">
      <div style="width: 350px; background: #ffffff; padding: 25px; border: 2px solid #5830b0; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
          <span style="color: #64748b; font-weight: 600;">Sub-Total:</span>
          <span style="font-weight: 700;">${subtotal.toFixed(2)} SAR</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
          <span style="color: #64748b; font-weight: 600;">Shipping:</span>
          <span style="font-weight: 700;">${(order.shippingCost || 0).toFixed(2)} SAR</span>
        </div>
        ${order.discount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px; color: #ef4444;">
            <span style="font-weight: 600;">Discount:</span>
            <span style="font-weight: 700;">-${order.discount.toFixed(2)} SAR</span>
          </div>
        ` : ''}
        ${isTaxEnabled ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #14b8a6;">
          <span style="font-weight: 600;">VAT (${config.vatRate}%):</span>
          <span style="font-weight: 700;">${vatAmount.toFixed(2)} SAR</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; border-top: 2px solid #5830b0; padding-top: 15px; margin-top: 5px;">
          <span style="font-size: 20px; font-weight: 800; color: #5830b0; text-transform: uppercase;">Total:</span>
          <span style="font-size: 22px; font-weight: 800; color: #5830b0;">${totalWithVat.toFixed(2)} SAR</span>
        </div>
      </div>
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 13px;">
      <p style="color: #5830b0; font-size: 18px; font-weight: 700; margin-bottom: 10px; font-family: 'Cairo', sans-serif;">${fixArabicContent(config.footerMessage || 'Thank you for choosing us')}</p>
      <p>This invoice was generated electronically.</p>
    </div>
  `;

  document.body.appendChild(invoiceElement);

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 4, // Higher scale for extreme clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const element = clonedDoc.getElementById('invoice-render-container');
        if (element) {
          element.style.left = '0';
          element.style.position = 'relative';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    return pdf;
  } catch (error) {
    console.error('PDF Generation error:', error);
    throw error;
  } finally {
    document.body.removeChild(invoiceElement);
  }
};

export const shareInvoicePDF = async (order: Order, config: InvoiceConfig) => {
  try {
    const pdf = await generateInvoicePDF(order, config);
    const fileName = `invoice-${order.id.slice(-6).toUpperCase()}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const shareText = `*طلب جديد من حياة ديزاين*\n` +
      `رقم الطلب: #${order.id.slice(-6).toUpperCase()}\n` +
      `الاسم: ${order.customerName}\n` +
      `الإجمالي: ${order.total} ر.س\n\n` +
      `مرفق فاتورة الطلب (PDF).`;

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `فاتورة طلب #${order.id.slice(-6).toUpperCase()}`,
          text: shareText
        });
        return true;
      } catch (shareErr) {
        // If share fails (e.g. gesture expired or cancelled), fallback to download
        console.warn('Native share failed or cancelled:', shareErr);
        pdf.save(fileName);
        return false;
      }
    } else {
      // Fallback: Download and return false so caller can handle WhatsApp text fallback
      pdf.save(fileName);
      return false;
    }
  } catch (error) {
    console.error('Sharing failed:', error);
    return false;
  }
};
