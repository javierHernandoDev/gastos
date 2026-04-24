package com.gastos.service;

import com.gastos.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Async
    public void sendBudgetAlert(User user, double totalSpent, double budget) {
        log.info("Comprobando alerta presupuesto → fromAddress='{}' user={} total={} budget={}",
                fromAddress, user.getEmail(), totalSpent, budget);
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("MAIL_USERNAME no configurado — no se envía email. Añade MAIL_USERNAME y MAIL_PASSWORD en Railway.");
            return;
        }
        try {
            NumberFormat fmt = NumberFormat.getCurrencyInstance(new Locale("es", "ES"));
            String totalStr  = fmt.format(totalSpent);
            String budgetStr = fmt.format(budget);
            double pct = Math.round((totalSpent / budget) * 100.0);

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject("⚠️ Has superado tu límite mensual de gastos");
            helper.setText(buildHtml(user.getName(), totalStr, budgetStr, pct), true);
            mailSender.send(msg);
            log.info("Alerta de presupuesto enviada a {}", user.getEmail());
        } catch (Exception e) {
            log.error("Error enviando email de alerta a {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String buildHtml(String name, String total, String budget, double pct) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="background:#ef4444;padding:28px 32px;">
                        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">⚠️ Límite mensual superado</p>
                        <p style="margin:6px 0 0;font-size:14px;color:#fecaca;">Mi Hogar · Gastos del Hogar</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:32px;">
                        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#374151;">
                          Has superado tu límite mensual de gastos. Aquí tienes el resumen:
                        </p>
                        <!-- Stats -->
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                          <tr>
                            <td width="48%%" style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#ef4444;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Total gastado</p>
                              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ef4444;">%s</p>
                            </td>
                            <td width="4%%"></td>
                            <td width="48%%" style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Tu límite</p>
                              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#16a34a;">%s</p>
                            </td>
                          </tr>
                        </table>
                        <!-- Progress bar -->
                        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Porcentaje utilizado: <strong style="color:#ef4444;">%.0f%%</strong></p>
                        <div style="background:#fee2e2;border-radius:999px;height:10px;overflow:hidden;">
                          <div style="background:#ef4444;height:10px;width:100%%;border-radius:999px;"></div>
                        </div>
                        <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">
                          Revisa tus gastos en la aplicación para ver en qué categorías estás gastando más.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background:#f1f5f9;padding:16px 32px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Mi Hogar · Gastos del Hogar — este correo es automático, no respondas</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(name, total, budget, pct);
    }
}
