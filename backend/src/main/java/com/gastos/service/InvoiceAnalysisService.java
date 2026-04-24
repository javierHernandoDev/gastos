package com.gastos.service;

import com.gastos.dto.InvoiceAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class InvoiceAnalysisService {

    private static final String AMT_PATTERN = "\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2}";

    // Possible Tesseract data paths depending on distro/version
    private static final String[] TESSDATA_CANDIDATES = {
        System.getenv("TESSDATA_PREFIX"),
        "/usr/share/tesseract-ocr/5/tessdata",
        "/usr/share/tesseract-ocr/4.00/tessdata",
        "/usr/share/tessdata",
        "/usr/local/share/tessdata",
    };

    public InvoiceAnalysisResponse analyze(MultipartFile file) {
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        try {
            String text;
            if (contentType.equals("application/pdf")) {
                text = extractFromPdf(file.getBytes());
            } else if (contentType.startsWith("image/")) {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
                text = ocr(img);
            } else {
                return InvoiceAnalysisResponse.builder()
                        .success(false)
                        .message("Formato no soportado. Use PDF, JPG o PNG.")
                        .build();
            }
            log.info("=== TEXTO EXTRAÍDO ===\n{}\n=====================", text);
            return parseText(text);
        } catch (Exception e) {
            log.error("Error procesando archivo", e);
            return InvoiceAnalysisResponse.builder()
                    .success(false)
                    .message("No se pudo procesar el archivo: " + e.getMessage())
                    .build();
        }
    }

    // ── EXTRACCIÓN DE TEXTO ───────────────────────────────────────────────────

    private String extractFromPdf(byte[] bytes) throws Exception {
        // Intento 1: texto digital con PDFBox (instantáneo y preciso)
        String text;
        try (PDDocument doc = PDDocument.load(bytes)) {
            text = new PDFTextStripper().getText(doc);
        }

        // Si el texto es demasiado corto, el PDF es escaneado → usar OCR
        if (text.trim().length() < 80) {
            log.info("PDF con poco texto ({}c), aplicando OCR...", text.trim().length());
            StringBuilder sb = new StringBuilder();
            try (PDDocument doc = PDDocument.load(bytes)) {
                PDFRenderer renderer = new PDFRenderer(doc);
                int pages = Math.min(doc.getNumberOfPages(), 3);
                for (int i = 0; i < pages; i++) {
                    BufferedImage img = renderer.renderImageWithDPI(i, 300, ImageType.GRAY);
                    sb.append(ocr(img)).append("\n");
                }
            }
            text = sb.toString();
        }
        return text;
    }

    private String ocr(BufferedImage image) throws Exception {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(findTessdataPath());
        tesseract.setLanguage("spa+eng");
        tesseract.setPageSegMode(3);  // fully automatic page segmentation
        return tesseract.doOCR(image);
    }

    private String findTessdataPath() {
        for (String path : TESSDATA_CANDIDATES) {
            if (path != null && new File(path).isDirectory()) {
                log.debug("Tessdata encontrado en: {}", path);
                return path;
            }
        }
        // último recurso: devolver el primer candidato no nulo
        for (String path : TESSDATA_CANDIDATES) {
            if (path != null) return path;
        }
        return "/usr/share/tesseract-ocr/4.00/tessdata";
    }

    // ── PARSEO ────────────────────────────────────────────────────────────────

    private InvoiceAnalysisResponse parseText(String text) {
        String name     = extractName(text);
        String date     = extractDate(text);
        Double amount   = extractAmount(text);
        String category = guessCategory(text);
        log.info("Resultado → name={} | date={} | amount={} | category={}", name, date, amount, category);
        return InvoiceAnalysisResponse.builder()
                .name(name).date(date).amount(amount).category(category)
                .success(true).build();
    }

    // ── FECHA ─────────────────────────────────────────────────────────────────

    private String extractDate(String text) {
        // Prioridad 1: etiqueta "Fecha[...]: DD/MM/YYYY"
        Matcher m = Pattern.compile(
                "fecha[^:\\n]{0,40}[:\\s]\\s*(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            String d = pad(m.group(1)), mo = pad(m.group(2)), y = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        // Prioridad 2: "15 de enero de 2025"
        m = Pattern.compile(
                "(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\\s+de\\s+(\\d{4})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            String d = pad(m.group(1)), mo = pad(String.valueOf(monthIndex(m.group(2)))), y = m.group(3);
            return y + "-" + mo + "-" + d;
        }

        // Prioridad 3: cualquier DD/MM/YYYY válido
        m = Pattern.compile("(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})").matcher(text);
        while (m.find()) {
            String d = pad(m.group(1)), mo = pad(m.group(2)), y = m.group(3);
            if (validDate(d, mo)) return y + "-" + mo + "-" + d;
        }

        // Prioridad 4: YYYY-MM-DD
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

    // ── IMPORTE ───────────────────────────────────────────────────────────────

    private Double extractAmount(String text) {
        // Prioridad 1: cerca de "Total factura / Total a pagar / Importe total"
        Matcher m = Pattern.compile(
                "(?:total\\s+a\\s+pagar|total\\s+factura|importe\\s+total|total\\s+con\\s+iva|total\\s+iva\\s+incluido|total)[^\\d€]{0,40}(" + AMT_PATTERN + ")",
                Pattern.CASE_INSENSITIVE).matcher(text);
        Double best = null;
        while (m.find()) {
            double v = toDouble(m.group(1));
            if (v > 0 && (best == null || v > best)) best = v;
        }
        if (best != null) return best;

        // Prioridad 2: cerca de "a pagar / importe / cuota"
        m = Pattern.compile(
                "(?:a\\s+pagar|importe|subtotal|cuota)[^\\d€]{0,40}(" + AMT_PATTERN + ")",
                Pattern.CASE_INSENSITIVE).matcher(text);
        while (m.find()) {
            double v = toDouble(m.group(1));
            if (v > 0 && (best == null || v > best)) best = v;
        }
        if (best != null) return best;

        // Prioridad 3: mayor importe con símbolo €
        m = Pattern.compile("€\\s*(" + AMT_PATTERN + ")|(" + AMT_PATTERN + ")\\s*€").matcher(text);
        double max = 0;
        while (m.find()) {
            String raw = m.group(1) != null ? m.group(1) : m.group(2);
            double v = toDouble(raw);
            if (v > max) max = v;
        }
        return max > 0 ? max : null;
    }

    // ── NOMBRE ────────────────────────────────────────────────────────────────

    private String extractName(String text) {
        // Etiqueta explícita
        Matcher m = Pattern.compile(
                "(?:concepto|descripci[oó]n\\s+del\\s+servicio|descripci[oó]n|servicio|objeto)[:\\s]+([^\\n\\r]{4,100})",
                Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return clean(m.group(1));

        // "Factura de/por [concepto]"
        m = Pattern.compile("factura\\s+(?:de|por)\\s+([^\\n\\r]{4,80})", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return clean(m.group(1));

        // Primera línea significativa que no parezca cabecera técnica
        for (String line : nonEmptyLines(text)) {
            String l = line.trim();
            if (l.length() < 4 || l.length() > 100) continue;
            if (l.matches("[\\d./\\-,€ ]+")) continue;
            if (l.matches("(?i)(nif|cif|dni|tel[eé]fono|fax|web|www|http|@|direcci[oó]n|c\\.p\\.|cp)[:\\s].*")) continue;
            if (l.matches("(?i)(p[aá]gina|page).*")) continue;
            return l.length() > 80 ? l.substring(0, 80) : l;
        }
        return null;
    }

    private String clean(String s) {
        return s.trim().replaceAll("\\s+", " ").substring(0, Math.min(s.trim().length(), 80));
    }

    private List<String> nonEmptyLines(String text) {
        List<String> result = new ArrayList<>();
        for (String l : text.split("\\r?\\n")) if (!l.trim().isEmpty()) result.add(l.trim());
        return result;
    }

    // ── CATEGORÍA ─────────────────────────────────────────────────────────────

    private String guessCategory(String text) {
        String t = text.toLowerCase();
        if (has(t, "hipoteca", "préstamo hipotecario", "prestamo hipotecario", "cuota hipotec")) return "Hipoteca";
        if (has(t, "electricidad", "endesa", "iberdrola", "naturgy", "gas natural", "fenosa",
                "repsol", "viesgo", "hidrocantábrico", "hidrocantabrico", "agua potable",
                "suministro eléctrico", "suministro electrico", "kwh", "kw")) return "Suministros";
        if (has(t, "seguro", "prima", "póliza", "poliza", "cobertura", "axa", "mapfre",
                "allianz", "generali", "mutua", "zurich", "linea directa", "línea directa")) return "Seguros";
        if (has(t, "comunidad de propietarios", "administrador de fincas",
                "junta de propietarios", "cuota comunidad", "gastos comunidad")) return "Comunidad";
        if (has(t, "obra", "reforma", "instalación", "instalacion", "fontanero",
                "electricista", "albañil", "alicatado", "pintura", "carpinter", "cerrajero")) return "Reformas";
        if (has(t, "mantenimiento", "reparación", "reparacion", "avería", "averia",
                "servicio técnico", "servicio tecnico", "revision", "revisión")) return "Mantenimiento";
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

    private String pad(String n) { return n.length() == 1 ? "0" + n : n; }

    private double toDouble(String s) {
        s = s.trim();
        if (s.contains(",") && s.contains(".")) {
            s = s.lastIndexOf(',') > s.lastIndexOf('.')
                    ? s.replace(".", "").replace(",", ".")
                    : s.replace(",", "");
        } else if (s.contains(",")) {
            String[] parts = s.split(",");
            s = (parts.length == 2 && parts[1].length() == 2) ? s.replace(",", ".") : s.replace(",", "");
        } else if (s.contains(".")) {
            String[] parts = s.split("\\.");
            if (parts.length > 2 || (parts.length == 2 && parts[1].length() == 3)) s = s.replace(".", "");
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
