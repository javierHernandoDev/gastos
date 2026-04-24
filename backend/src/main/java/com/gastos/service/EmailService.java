package com.gastos.service;

import com.gastos.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@Slf4j
public class EmailService {

    @Value("${resend.api-key:}")
    private String apiKey;

    private final HttpClient http = HttpClient.newHttpClient();

    @Async
    public void sendBudgetAlert(User user, double totalSpent, double budget) {
        log.info("Comprobando alerta presupuesto → apiKey={} user={} total={} budget={}",
                apiKey.isBlank() ? "NO CONFIGURADA" : "ok", user.getEmail(), totalSpent, budget);

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY no configurada — añádela en Railway para recibir alertas por email.");
            return;
        }

        try {
            NumberFormat fmt = NumberFormat.getCurrencyInstance(new Locale("es", "ES"));
            String totalStr  = fmt.format(totalSpent);
            String budgetStr = fmt.format(budget);
            double pct       = Math.round((totalSpent / budget) * 100.0);

            String body = """
                {
                  "from": "Gastos del Hogar <onboarding@resend.dev>",
                  "to": ["%s"],
                  "subject": "⚠️ Has superado tu límite mensual de gastos",
                  "html": %s
                }
                """.formatted(user.getEmail(), toJsonString(buildHtml(user.getName(), totalStr, budgetStr, pct)));

            log.info("Enviando email via Resend a {}...", user.getEmail());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                log.info("✅ Email enviado correctamente a {}", user.getEmail());
            } else {
                log.error("❌ Resend respondió con {} → {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("❌ Error enviando email a {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    private String toJsonString(String html) {
        return "\"" + html
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "") + "\"";
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
                    <tr>
                      <td style="background:#ef4444;padding:28px 32px;">
                        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">⚠️ Límite mensual superado</p>
                        <p style="margin:6px 0 0;font-size:14px;color:#fecaca;">Mi Hogar · Gastos del Hogar</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px;">
                        <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hola <strong>%s</strong>,</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#374151;">Has superado tu límite mensual de gastos.</p>
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                          <tr>
                            <td width="48%%" style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#ef4444;font-weight:600;text-transform:uppercase;">Total gastado</p>
                              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ef4444;">%s</p>
                            </td>
                            <td width="4%%"></td>
                            <td width="48%%" style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#16a34a;font-weight:600;text-transform:uppercase;">Tu límite</p>
                              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#16a34a;">%s</p>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Porcentaje utilizado: <strong style="color:#ef4444;">%.0f%%</strong></p>
                        <div style="background:#fee2e2;border-radius:999px;height:10px;">
                          <div style="background:#ef4444;height:10px;width:100%%;border-radius:999px;"></div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f1f5f9;padding:16px 32px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Mi Hogar · este correo es automático</p>
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
