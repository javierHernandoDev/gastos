package com.gastos.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gastos.dto.InvoiceAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceAnalysisService {

    @Value("${GOOGLE_AI_API_KEY:}")
    private String apiKey;

    private final ObjectMapper objectMapper;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=";

    private static final String PROMPT =
        "Analiza esta factura y extrae: fecha, importe total y tipo de gasto. " +
        "Responde ÚNICAMENTE con JSON válido sin texto adicional:\n" +
        "{\"date\":\"YYYY-MM-DD\",\"amount\":123.45,\"category\":\"nombre\"}\n" +
        "Para category elige la más adecuada: Hipoteca, Suministros, Seguros, " +
        "Comunidad, Reformas, Mantenimiento, Otros. " +
        "Si no puedes determinar un campo usa null.";

    public String listModels() {
        try {
            RestTemplate rest = new RestTemplate();
            return rest.getForObject(
                "https://generativelanguage.googleapis.com/v1/models?key=" + apiKey,
                String.class);
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    public InvoiceAnalysisResponse analyze(MultipartFile file) {
        if (apiKey == null || apiKey.isBlank()) {
            return InvoiceAnalysisResponse.builder()
                    .success(false)
                    .message("GOOGLE_AI_API_KEY no configurada en el servidor")
                    .build();
        }

        try {
            String contentType = file.getContentType() != null ? file.getContentType() : "";
            String rawResponse;

            if (contentType.startsWith("image/")) {
                rawResponse = callWithImage(file.getBytes(), contentType);
            } else if (contentType.equals("application/pdf")) {
                String text = extractPdfText(file.getBytes());
                rawResponse = callWithText(text);
            } else {
                return InvoiceAnalysisResponse.builder()
                        .success(false)
                        .message("Formato no soportado. Usa PDF, JPG o PNG")
                        .build();
            }

            return parseResponse(rawResponse);

        } catch (Exception e) {
            log.error("Error analizando factura", e);
            return InvoiceAnalysisResponse.builder()
                    .success(false)
                    .message("Error al analizar: " + e.getMessage())
                    .build();
        }
    }

    private String extractPdfText(byte[] bytes) throws Exception {
        try (PDDocument doc = PDDocument.load(bytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private String callWithImage(byte[] bytes, String mediaType) throws Exception {
        String base64 = Base64.getEncoder().encodeToString(bytes);

        Map<String, Object> inlineData = new LinkedHashMap<>();
        inlineData.put("mime_type", mediaType);
        inlineData.put("data", base64);

        Map<String, Object> imagePart = new LinkedHashMap<>();
        imagePart.put("inline_data", inlineData);

        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", PROMPT);

        return post(List.of(imagePart, textPart));
    }

    private String callWithText(String text) throws Exception {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("text", "Texto de la factura:\n\n" + text + "\n\n" + PROMPT);

        return post(List.of(textPart));
    }

    private String post(List<Map<String, Object>> parts) throws Exception {
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", parts);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        RestTemplate rest = new RestTemplate(factory);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String json = objectMapper.writeValueAsString(body);
        ResponseEntity<String> response = rest.postForEntity(
                GEMINI_URL + apiKey, new HttpEntity<>(json, headers), String.class);
        return response.getBody();
    }

    private InvoiceAnalysisResponse parseResponse(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw);
        String text = root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();

        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start == -1 || end == -1) {
            return InvoiceAnalysisResponse.builder()
                    .success(false).message("No se encontraron datos en la factura").build();
        }

        JsonNode data = objectMapper.readTree(text.substring(start, end + 1));
        String date = data.path("date").isNull() ? null : data.path("date").asText(null);
        Double amount = data.path("amount").isNull() ? null : data.path("amount").asDouble();
        String category = data.path("category").isNull() ? null : data.path("category").asText(null);

        return InvoiceAnalysisResponse.builder()
                .date(date).amount(amount).category(category)
                .success(true).build();
    }
}
