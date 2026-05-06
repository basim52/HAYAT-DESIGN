import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Order, InvoiceConfig } from '../types';

export const generateInvoicePDF = async (order: Order, config: InvoiceConfig) => {
  const invoiceElement = document.createElement('div');
  invoiceElement.style.width = '800px';
  invoiceElement.style.padding = '40px';
  invoiceElement.style.background = '#ffffff';
  invoiceElement.style.fontFamily = 'Arial, sans-serif';
  invoiceElement.style.direction = 'rtl';
  invoiceElement.style.position = 'absolute';
  invoiceElement.style.left = '-9999px';
  invoiceElement.style.top = '0';

  const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = config.isTaxEnabled ? (subtotal * (config.vatRate / 100)) : 0;
  const totalWithVat = subtotal + vatAmount + (order.shippingCost || 0) - (order.discount || 0);

  invoiceElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #5830b0; padding-bottom: 20px; margin-bottom: 30px;">
      <div style="text-align: right;">
        <h1 style="margin: 0; color: #5830b0; font-size: 28px;">${config.isTaxEnabled ? 'فاتورة ضريبية' : 'فاتورة طلب'}</h1>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">رقم الطلب: #${order.id.slice(-6).toUpperCase()}</p>
        <p style="margin: 5px 0; font-size: 14px; color: #666;">التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
      </div>
      <div style="text-align: left;">
        ${config.logoUrl ? `<img src="${config.logoUrl}" style="max-height: 80px; max-width: 150px; object-contain;" />` : `<h2 style="margin:0; color: #5830b0;">${config.storeName}</h2>`}
      </div>
    </div>

    <div style="display: grid; grid-cols: 2; gap: 40px; margin-bottom: 30px; display: flex; justify-content: space-between;">
      <div style="flex: 1;">
        <h3 style="font-size: 14px; color: #5830b0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">بيانات العميل</h3>
        <p style="margin: 5px 0; font-size: 13px;"><b>الاسم:</b> ${order.customerName}</p>
        <p style="margin: 5px 0; font-size: 13px;"><b>المدينة:</b> ${order.city || '-'}</p>
        <p style="margin: 5px 0; font-size: 13px;"><b>العنوان:</b> ${order.address}</p>
        <p style="margin: 5px 0; font-size: 13px;"><b>الجوال:</b> ${order.phone}</p>
      </div>
      <div style="flex: 1; text-align: left;">
        <h3 style="font-size: 14px; color: #5830b0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">بيانات المتجر</h3>
        <p style="margin: 5px 0; font-size: 13px;"><b>المتجر:</b> ${config.storeName}</p>
        ${config.isTaxEnabled ? `<p style="margin: 5px 0; font-size: 13px;"><b>الرقم الضريبي:</b> ${config.taxNumber || '-'}</p>` : ''}
        <p style="margin: 5px 0; font-size: 13px;"><b>العنوان:</b> ${config.storeAddress}</p>
        <p style="margin: 5px 0; font-size: 13px;"><b>التواصل:</b> ${config.phone}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #5830b0; font-size: 13px;">المنتج</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #5830b0; font-size: 13px;">الكمية</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #5830b0; font-size: 13px;">السعر</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #5830b0; font-size: 13px;">المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; text-align: right; font-size: 12px;">${item.name}</td>
            <td style="padding: 12px; text-align: center; font-size: 12px;">${item.quantity}</td>
            <td style="padding: 12px; text-align: left; font-size: 12px;">${item.price} ر.س</td>
            <td style="padding: 12px; text-align: left; font-size: 12px;">${(item.price * item.quantity).toFixed(2)} ر.س</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 250px; background: #f8f9fa; padding: 20px; rounded: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span style="color: #666;">المجموع الفرعي:</span>
          <span>${subtotal.toFixed(2)} ر.س</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span style="color: #666;">الشحن:</span>
          <span>${(order.shippingCost || 0).toFixed(2)} ر.س</span>
        </div>
        ${order.discount ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #dc3545;">
            <span>الخصم:</span>
            <span>-${order.discount.toFixed(2)} ر.س</span>
          </div>
        ` : ''}
        ${config.isTaxEnabled ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px;">
          <span style="color: #666;">الضريبة (${config.vatRate}%):</span>
          <span>${vatAmount.toFixed(2)} ر.س</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; border-top: 2px solid #5830b0; pt: 12px; margin-top: 10px; font-weight: bold; font-size: 16px; color: #5830b0;">
          <span>الإجمالي:</span>
          <span>${totalWithVat.toFixed(2)} ر.س</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px;">
      <p>${config.footerMessage || 'شكراً لتعاملكم معنا'}</p>
      <p>هذه الفاتورة تم إصدارها آلياً ولا تتطلب توقيعاً</p>
    </div>
  `;

  document.body.appendChild(invoiceElement);

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${order.id.slice(-6).toUpperCase()}.pdf`);
  } finally {
    document.body.removeChild(invoiceElement);
  }
};
