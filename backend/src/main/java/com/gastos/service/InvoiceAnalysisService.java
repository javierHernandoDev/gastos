package com.gastos.service;

import com.gastos.dto.InvoiceAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class InvoiceAnalysisService {

    public InvoiceAnalysisResponse analyze(MultipartFile file) {
        String contentType = file.getContentType() != null ? file.getContentType() : "";

        if (!contentType.equals("application/pdf")) {
            return InvoiceAnalysisResponse.builder()
                    .success(false)
                    .message("El análisis automático solo funciona con PDF. El archivo se adjuntará igualmente.")
                    .build();
        }

        try {
            String text = extractPdfText(file.getBytes());
            return parseText(text);
        } catch (Exception e) {
            log.error("Error procesando PDF", e);
            return InvoiceAnalysisResponse.builder()
                    .success(false)
                    .message("No se pudo leer el PDF")
                    .build();
        }
    }

    private String extractPdfText(byte[] bytes) throws Exception {
        try (PDDocument doc = PDDocument.load(bytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private InvoiceAnalysisResponse parseText(String text) {
        return InvoiceAnalysisResponse.builder()
                .name(extractName(text))
                .date(extractDate(text))
                .amount(extractAmount(text))
                .category(guessCategory(text))
                .success(true)
                .build();
    }

    private String extractName(String text) {
        // Look for explicit label: "Concepto:", "Descripción:", "Servicio:", "Factura Nº" + line
        Matcher m = Pattern.compile(
                "(?:concepto|descripci[oó]n|servicio|objeto)[:\\s]+([^\\n\\r]{3,80})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return m.group(1).trim();

        // "FACTURA" followed by a short label on the same or next non-blank line
        m = Pattern.compile("FACTURA[^\\n]*\\n+([A-ZÁÉÍÓÚÑ][^\\n]{3,60})", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String candidate = m.group(1).trim();
            // Skip if it looks like a date or number
            if (!candidate.matches(".*\\d{4}.*") && !candidate.toLowerCase().startsWith("n")) {
                return candidate;
            }
        }

        // Use first meaningful non-empty line (>= 4 chars, not a number/date)
        for (String line : text.split("\\r?\\n")) {
            String l = line.trim();
            if (l.length() >= 4 && !l.matches("[\\d./\\-,€ ]+") && !l.toLowerCase().startsWith("página")
                    && !l.toLowerCase().startsWith("page")) {
                return l.length() > 80 ? l.substring(0, 80) : l;
            }
        }
        return null;
    }

    private String extractDate(String text) {
        // YYYY-MM-DD
        Matcher m = Pattern.compile("(\\d{4})[/\\-.](\\d{2})[/\\-.](\\d{2})").matcher(text);
        if (m.find()) return m.group(1) + "-" + m.group(2) + "-" + m.group(3);

        // DD/MM/YYYY or DD-MM-YYYY
        m = Pattern.compile("(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})").matcher(text);
        if (m.find()) {
            String d = pad(m.group(1)), mo = pad(m.group(2)), y = m.group(3);
            return y + "-" + mo + "-" + d;
        }

        // "15 de enero de 2025"
        m = Pattern.compile("(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+de\\s+(\\d{4})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String d = pad(m.group(1)), mo = pad(String.valueOf(monthIndex(m.group(2)))), y = m.group(3);
            return y + "-" + mo + "-" + d;
        }

        return null;
    }

    private Double extractAmount(String text) {
        // Look near keywords: total, importe, a pagar
        Pattern keywordAmount = Pattern.compile(
                "(?:total|importe total|a pagar|total a pagar|subtotal)[^\\d]{0,20}(\\d{1,6}[.,]\\d{2})",
                Pattern.CASE_INSENSITIVE);
        Matcher m = keywordAmount.matcher(text);
        if (m.find()) return toDouble(m.group(1));

        // €123,45 or 123,45 €
        Pattern euroAmount = Pattern.compile("€\\s*(\\d{1,6}[.,]\\d{2})|(\\d{1,6}[.,]\\d{2})\\s*€");
        m = euroAmount.matcher(text);
        double max = 0;
        while (m.find()) {
            String raw = m.group(1) != null ? m.group(1) : m.group(2);
            double val = toDouble(raw);
            if (val > max) max = val;
        }
        return max > 0 ? max : null;
    }

    private String guessCategory(String text) {
        String t = text.toLowerCase();
        if (has(t, "hipoteca", "préstamo hipotecario", "prestamo hipotecario")) return "Hipoteca";
        if (has(t, "electricidad", "endesa", "iberdrola", "naturgy", "gas natural", "fenosa",
                "repsol", "viesgo", "hidrocantábrico", "agua", "suministro", "tarifa eléctrica")) return "Suministros";
        if (has(t, "seguro", "prima", "póliza", "poliza", "axa", "mapfre", "allianz",
                "generali", "mutua", "zurich")) return "Seguros";
        if (has(t, "comunidad de propietarios", "comunidad", "administrador de fincas",
                "junta de propietarios")) return "Comunidad";
        if (has(t, "obra", "reforma", "instalación", "instalacion", "fontanero",
                "electricista", "albañil", "alicatado", "pintura")) return "Reformas";
        if (has(t, "mantenimiento", "reparación", "reparacion", "avería", "averia",
                "servicio técnico", "revision", "revisión")) return "Mantenimiento";
        return "Otros";
    }

    private boolean has(String text, String... keywords) {
        for (String k : keywords) if (text.contains(k)) return true;
        return false;
    }

    private String pad(String n) {
        return n.length() == 1 ? "0" + n : n;
    }

    private double toDouble(String s) {
        s = s.trim();
        if (s.contains(",") && s.contains(".")) {
            s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(".", "").replace(",", ".") : s.replace(",", "");
        } else {
            s = s.replace(",", ".");
        }
        try { return Double.parseDouble(s); } catch (Exception e) { return 0; }
    }

    private int monthIndex(String name) {
        return switch (name.toLowerCase()) {
            case "enero" -> 1; case "febrero" -> 2; case "marzo" -> 3;
            case "abril" -> 4; case "mayo" -> 5; case "junio" -> 6;
            case "julio" -> 7; case "agosto" -> 8; case "septiembre" -> 9;
            case "octubre" -> 10; case "noviembre" -> 11; case "diciembre" -> 12;
            default -> 1;
        };
    }
}
