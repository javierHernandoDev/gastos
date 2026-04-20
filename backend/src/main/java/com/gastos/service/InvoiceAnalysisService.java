package com.gastos.service;

import com.gastos.dto.InvoiceAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class InvoiceAnalysisService {

    // Matches amounts with or without thousands separator: 1.234,56 / 1,234.56 / 123,45 / 1.234.567,89
    private static final String AMT_PATTERN = "\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2}";

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
            log.info("=== PDF TEXT EXTRACTED ===\n{}\n=========================", text);
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
        String name     = extractName(text);
        String date     = extractDate(text);
        Double amount   = extractAmount(text);
        String category = guessCategory(text);
        log.info("Extracted → name={} | date={} | amount={} | category={}", name, date, amount, category);
        return InvoiceAnalysisResponse.builder()
                .name(name)
                .date(date)
                .amount(amount)
                .category(category)
                .success(true)
                .build();
    }

    // ── DATE ──────────────────────────────────────────────────────────────────

    private String extractDate(String text) {
        // Priority 1: labeled "Fecha[...]: DD/MM/YYYY" or "Fecha[...]: YYYY-MM-DD"
        Matcher m = Pattern.compile(
                "fecha[^:\\n]{0,40}[:\\s]\\s*(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            String d = pad(m.group(1)), mo = pad(m.group(2)), y = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        m = Pattern.compile(
                "fecha[^:\\n]{0,40}[:\\s]\\s*(\\d{4})[/\\-.](\\d{2})[/\\-.](\\d{2})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            String y = m.group(1), mo = m.group(2), d = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        // Priority 2: "15 de enero de 2025"
        m = Pattern.compile(
                "(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+de\\s+(\\d{4})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String d = pad(m.group(1)), mo = pad(String.valueOf(monthIndex(m.group(2)))), y = m.group(3);
            return y + "-" + mo + "-" + d;
        }

        // Priority 3: any DD/MM/YYYY with valid day/month
        m = Pattern.compile("(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})").matcher(text);
        while (m.find()) {
            String d = pad(m.group(1)), mo = pad(m.group(2)), y = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        // Priority 4: YYYY-MM-DD (last resort, prone to false positives)
        m = Pattern.compile("(20\\d{2})[/\\-.](\\d{2})[/\\-.](\\d{2})").matcher(text);
        while (m.find()) {
            String y = m.group(1), mo = m.group(2), d = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        return null;
    }

    private boolean validDate(String d, String mo) {
        int day = Integer.parseInt(d), month = Integer.parseInt(mo);
        return day >= 1 && day <= 31 && month >= 1 && month <= 12;
    }

    // ── AMOUNT ────────────────────────────────────────────────────────────────

    private Double extractAmount(String text) {
        // Priority 1: "Total a pagar", "Total factura", "Importe total" + amount
        Matcher m = Pattern.compile(
                "(?:total\\s+a\\s+pagar|total\\s+factura|importe\\s+total|total\\s+con\\s+iva|total\\s+iva\\s+incluido|total)[^\\d€]{0,40}(" + AMT_PATTERN + ")",
                Pattern.CASE_INSENSITIVE).matcher(text);
        Double best = null;
        while (m.find()) {
            double v = toDouble(m.group(1));
            if (v > 0 && (best == null || v > best)) best = v;
        }
        if (best != null) return best;

        // Priority 2: "a pagar", "importe", "subtotal" + amount
        m = Pattern.compile(
                "(?:a\\s+pagar|importe|subtotal|cuota)[^\\d€]{0,40}(" + AMT_PATTERN + ")",
                Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            double v = toDouble(m.group(1));
            if (v > 0 && (best == null || v > best)) best = v;
        }
        if (best != null) return best;

        // Priority 3: largest € amount in document
        m = Pattern.compile("€\\s*(" + AMT_PATTERN + ")|(" + AMT_PATTERN + ")\\s*€").matcher(text);
        double max = 0;
        while (m.find()) {
            String raw = m.group(1) != null ? m.group(1) : m.group(2);
            double v = toDouble(raw);
            if (v > max) max = v;
        }
        return max > 0 ? max : null;
    }

    // ── NAME ──────────────────────────────────────────────────────────────────

    private String extractName(String text) {
        // Priority 1: explicit concept/service label
        Matcher m = Pattern.compile(
                "(?:concepto|descripci[oó]n\\s+del\\s+servicio|descripci[oó]n|servicio|objeto\\s+de\\s+factura|objeto)[:\\s]+([^\\n\\r]{4,100})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return clean(m.group(1));

        // Priority 2: "Factura de [concepto]" or "Factura por [concepto]"
        m = Pattern.compile("factura\\s+(?:de|por)\\s+([^\\n\\r]{4,80})", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return clean(m.group(1));

        // Priority 3: first meaningful line that is NOT a company header or address
        List<String> lines = nonEmptyLines(text);
        // Skip typical header lines (all caps company name, address, NIF, etc.) and use second or third line
        for (String line : lines) {
            String l = line.trim();
            if (l.length() < 4 || l.length() > 100) continue;
            if (l.matches("[\\d./\\-,€ ]+")) continue;                          // only numbers
            if (l.matches("(?i)(nif|cif|dni|teléfono|tel[eé]fono|fax|web|www|http|@|dirección|direcci[oó]n|c\\.p\\.|cp)[:\\s].*")) continue;
            if (l.matches("(?i)(p[aá]gina|page).*")) continue;
            return l.length() > 80 ? l.substring(0, 80) : l;
        }
        return null;
    }

    private String clean(String s) {
        s = s.trim().replaceAll("\\s+", " ");
        return s.length() > 80 ? s.substring(0, 80) : s;
    }

    private List<String> nonEmptyLines(String text) {
        List<String> result = new ArrayList<>();
        for (String l : text.split("\\r?\\n")) {
            if (!l.trim().isEmpty()) result.add(l.trim());
        }
        return result;
    }

    // ── CATEGORY ──────────────────────────────────────────────────────────────

    private String guessCategory(String text) {
        String t = text.toLowerCase();
        if (has(t, "hipoteca", "préstamo hipotecario", "prestamo hipotecario", "cuota hipotec")) return "Hipoteca";
        if (has(t, "electricidad", "endesa", "iberdrola", "naturgy", "gas natural", "fenosa",
                "repsol", "viesgo", "hidrocantábrico", "hidrocantabrico", "agua potable",
                "suministro eléctrico", "suministro electrico", "tarifa eléctrica", "tarifa electrica",
                "consumo eléctrico", "consumo electrico", "kw", "kwh")) return "Suministros";
        if (has(t, "seguro", "prima", "póliza", "poliza", "cobertura", "axa", "mapfre", "allianz",
                "generali", "mutua", "zurich", "linea directa", "línea directa")) return "Seguros";
        if (has(t, "comunidad de propietarios", "administrador de fincas", "junta de propietarios",
                "cuota comunidad", "gastos comunidad")) return "Comunidad";
        if (has(t, "obra", "reforma", "instalación", "instalacion", "fontanero",
                "electricista", "albañil", "alicatado", "pintura", "carpinter", "cerrajero")) return "Reformas";
        if (has(t, "mantenimiento", "reparación", "reparacion", "avería", "averia",
                "servicio técnico", "servicio tecnico", "revision", "revisión", "asistencia técnica")) return "Mantenimiento";
        if (has(t, "internet", "fibra", "móvil", "movil", "teléfono", "telefono", "movistar",
                "vodafone", "orange", "yoigo", "digi", "pepephone", "telecomunicaciones")) return "Telecomunicaciones";
        if (has(t, "alquiler", "arrendamiento", "renta mensual")) return "Alquiler";
        return "Otros";
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private boolean has(String text, String... keywords) {
        for (String k : keywords) if (text.contains(k)) return true;
        return false;
    }

    private String pad(String n) {
        return n.length() == 1 ? "0" + n : n;
    }

    private double toDouble(String s) {
        s = s.trim();
        // European format: 1.234,56 → both present, comma last → thousands=dot, decimal=comma
        if (s.contains(",") && s.contains(".")) {
            s = s.lastIndexOf(',') > s.lastIndexOf('.')
                    ? s.replace(".", "").replace(",", ".")   // 1.234,56 → 1234.56
                    : s.replace(",", "");                    // 1,234.56 → 1234.56
        } else if (s.contains(",")) {
            // Could be decimal comma (123,45) or thousands (1,234) — treat as decimal if 2 decimals
            String[] parts = s.split(",");
            s = (parts.length == 2 && parts[1].length() == 2)
                    ? s.replace(",", ".")     // 123,45 → 123.45
                    : s.replace(",", "");     // 1,234 → 1234 (thousands)
        }
        // dots only: 1.234.567 → thousands; 123.45 → decimal
        else if (s.contains(".")) {
            String[] parts = s.split("\\.");
            if (parts.length > 2 || (parts.length == 2 && parts[1].length() == 3)) {
                s = s.replace(".", ""); // 1.234 or 1.234.567 → thousands separator
            }
            // else leave as is (123.45 already valid decimal)
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
