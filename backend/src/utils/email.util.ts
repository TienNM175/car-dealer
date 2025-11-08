// backend/src/utils/email.util.ts
import nodemailer from 'nodemailer';
import config from '../config/environment';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export class EmailUtil {
  private static transporter: nodemailer.Transporter;

  static {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
      },
      // Nếu dùng Gmail, có thể dùng app password
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.warn('⚠️  Email service not configured:', error.message);
      } else {
        console.log('✅ Email service configured successfully');
      }
    });
  }

  /**
   * Send test drive confirmation email
   */
  static async sendTestDriveConfirmation(data: {
    customerName: string;
    customerEmail: string;
    vehicleModel: string;
    vehicleVariant?: string;
    manufacturerName: string;
    scheduledDate: Date;
    dealerName: string;
    dealerPhone?: string;
    dealerAddress?: string;
    dealerCity?: string;
    staffName?: string;
    notes?: string;
  }): Promise<boolean> {
    try {
      const {
        customerName,
        customerEmail,
        vehicleModel,
        vehicleVariant,
        manufacturerName,
        scheduledDate,
        dealerName,
        dealerPhone,
        dealerAddress,
        dealerCity,
        staffName,
        notes,
      } = data;

      const dateStr = scheduledDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 8px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 20px;
              color: #333;
            }
            .booking-details {
              background: #f8f9fa;
              border-left: 4px solid #1976D2;
              padding: 20px;
              margin: 25px 0;
              border-radius: 5px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
              width: 140px;
            }
            .detail-value {
              color: #1976D2;
              font-weight: 500;
              flex: 1;
              text-align: right;
            }
            .vehicle-section {
              background: #e3f2fd;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .vehicle-name {
              font-size: 18px;
              font-weight: 700;
              color: #1976D2;
              margin-bottom: 8px;
            }
            .dealer-info {
              background: #fff3e0;
              border-left: 4px solid #ff9800;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .dealer-info h3 {
              margin: 0 0 10px 0;
              color: #ff9800;
              font-size: 16px;
            }
            .dealer-info p {
              margin: 5px 0;
              color: #333;
              font-size: 14px;
            }
            .cta-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: #e8f5e9;
              border-radius: 8px;
            }
            .cta-text {
              font-size: 14px;
              color: #2e7d32;
              margin-bottom: 10px;
            }
            .instructions {
              background: #fce4ec;
              border-left: 4px solid #e91e63;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-size: 14px;
              color: #c2185b;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
              font-size: 12px;
              color: #999;
            }
            .footer p {
              margin: 5px 0;
            }
            .button {
              display: inline-block;
              background: #1976D2;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              margin-top: 10px;
            }
            .button:hover {
              background: #1565C0;
            }
            @media (max-width: 600px) {
              .detail-row {
                flex-direction: column;
              }
              .detail-value {
                text-align: left;
                margin-top: 5px;
              }
              .header h1 {
                font-size: 22px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>⚡ EVM - Xác Nhận Lịch Lái Thử</h1>
              <p>Xe Điện Hàng Đầu Việt Nam</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">
                <p>Xin chào <strong>${customerName}</strong>,</p>
                <p>Cảm ơn bạn đã đặt lịch lái thử tại EVM! ✨</p>
                <p>Dưới đây là các chi tiết về lịch hẹn của bạn:</p>
              </div>

              <!-- Vehicle Section -->
              <div class="vehicle-section">
                <div class="vehicle-name">
                  🚗 ${manufacturerName} ${vehicleModel}${vehicleVariant ? ' ' + vehicleVariant : ''}
                </div>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Hãy sẵn sàng trải nghiệm công nghệ xe điện tiên tiến!
                </p>
              </div>

              <!-- Booking Details -->
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">📅 Ngày & Giờ:</span>
                  <span class="detail-value">${dateStr}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏢 Đại Lý:</span>
                  <span class="detail-value">${dealerName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Thành Phố:</span>
                  <span class="detail-value">${dealerCity || 'Liên hệ'}</span>
                </div>
              </div>

              <!-- Dealer Info -->
              <div class="dealer-info">
                <h3>📞 Thông Tin Liên Hệ Đại Lý</h3>
                ${dealerPhone ? `<p><strong>Điện thoại:</strong> <a href="tel:${dealerPhone}" style="color: #ff9800; text-decoration: none;">${dealerPhone}</a></p>` : ''}
                ${dealerAddress ? `<p><strong>Địa chỉ:</strong> ${dealerAddress}</p>` : ''}
                ${staffName ? `<p><strong>Nhân viên phụ trách:</strong> ${staffName}</p>` : ''}
              </div>

              <!-- Instructions -->
              <div class="instructions">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Vui lòng đến sớm 10-15 phút trước giờ hẹn</li>
                  <li>Mang theo CMND/CCCD và bằng lái xe</li>
                  <li>Nếu cần thay đổi lịch, vui lòng liên hệ đại lý trước 24 giờ</li>
                  ${notes ? `<li>${notes}</li>` : ''}
                </ul>
              </div>

              <!-- CTA -->
              <div class="cta-section">
                <div class="cta-text">
                  ✅ Lịch hẹn của bạn đã được xác nhận!
                </div>
                <p style="margin: 10px 0; color: #2e7d32; font-size: 13px;">
                  Đội ngũ EVM sẽ sẵn sàng hỗ trợ bạn với những thông tin chi tiết về xe.
                </p>
              </div>

              <!-- Questions Section -->
              <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976D2; font-size: 14px;">
                  <strong>❓ Có câu hỏi?</strong><br/>
                  Vui lòng liên hệ với chúng tôi qua:
                </p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">
                  📞 Hotline: 1900-XXXX | 💬 Chat: <a href="#" style="color: #1976D2; text-decoration: none;">www.evm.vn/chat</a>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>EVM - Electric Vehicle Market</strong></p>
              <p>Nền tảng mua bán xe điện hàng đầu tại Việt Nam</p>
              <p style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                Email này được gửi tự động, vui lòng không trả lời trực tiếp.
              </p>
              <p style="color: #ccc;">© 2025 EVM. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions: EmailOptions = {
        to: customerEmail,
        subject: `✅ Xác Nhận Lịch Lái Thử - ${manufacturerName} ${vehicleModel}`,
        html,
        replyTo: config.SMTP_REPLY_TO || config.SMTP_USER,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test drive confirmation email sent:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send test drive email:', error.message);
      return false;
    }
  }

  /**
   * Send generic email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: config.SMTP_USER,
        ...options,
      });
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }
}