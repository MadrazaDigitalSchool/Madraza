package com.madraza.service;

import com.itextpdf.html2pdf.HtmlConverter;
import com.madraza.entity.*;
import com.madraza.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * @author Hafdala Mehdi Sidi
 */
@Service
public class PdfService {

    @Autowired private ApunteRepository            apunteRepository;
    @Autowired private UsuarioRepository           usuarioRepository;
    @Autowired private AsignacionUsuarioRepository asignacionUsuarioRepository;
    @Autowired private TestRepository              testRepository;
    @Autowired private IntentoRepository           intentoRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional(readOnly = true)
    public byte[] generarTestPdf(Long testId, Long usuarioId) {
        Test test = testRepository.findById(testId)
            .orElseThrow(() -> new IllegalArgumentException("Test no encontrado"));

        verificarPremium(usuarioId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(buildTestHtml(test), baos);
        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generarResultadoPdf(Long intentoId, Long usuarioId) {
        Intento intento = intentoRepository.findById(intentoId)
            .orElseThrow(() -> new IllegalArgumentException("Resultado no encontrado"));

        if (!intento.getUsuario().getId().equals(usuarioId))
            throw new SecurityException("No tienes permiso para exportar este resultado");

        verificarPremium(usuarioId);

        List<RespuestaIntento> respuestas = intento.getRespuestas();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(buildResultadoHtml(intento, respuestas), baos);
        return baos.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] generarApuntePdf(Long apunteId, Long usuarioId) {
        Apunte apunte = apunteRepository.findById(apunteId)
            .orElseThrow(() -> new IllegalArgumentException("Apunte no encontrado"));

        boolean esOwner      = apunte.getUsuario().getId().equals(usuarioId);
        boolean tieneAsignado = asignacionUsuarioRepository.tieneApunteAsignado(usuarioId, apunteId);

        if (!esOwner && !tieneAsignado)
            throw new SecurityException("No tienes permiso para exportar este apunte");

        if (esOwner) {
            Usuario u = usuarioRepository.findById(usuarioId).orElseThrow();
            boolean esPremium = u.isSuscripcionActiva()
                && (u.getSuscripcionExpiry() == null || u.getSuscripcionExpiry().isAfter(LocalDateTime.now()));
            if (!esPremium)
                throw new SecurityException("La exportación a PDF es exclusiva de usuarios Premium");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(buildHtml(apunte), baos);
        return baos.toByteArray();
    }

    private void verificarPremium(Long usuarioId) {
        Usuario u = usuarioRepository.findById(usuarioId).orElseThrow();
        boolean esPremium = u.isSuscripcionActiva()
            && (u.getSuscripcionExpiry() == null || u.getSuscripcionExpiry().isAfter(LocalDateTime.now()));
        if (!esPremium)
            throw new SecurityException("La exportación a PDF es exclusiva de usuarios Premium");
    }

    private String buildTestHtml(Test test) {
        String titulo    = esc(test.getTitulo());
        String categoria = esc(test.getCategoria());
        String dificultad = switch (test.getDificultad()) {
            case "BAJA"  -> "Fácil";
            case "MEDIA" -> "Media";
            case "ALTA"  -> "Difícil";
            default      -> test.getDificultad();
        };
        String fecha = test.getCreatedAt() != null ? test.getCreatedAt().format(FMT) : "";
        String desc  = test.getDescripcion() != null ? "<p class='descripcion'>" + esc(test.getDescripcion()) + "</p>" : "";
        String tiempo = test.getTiempoLimite() != null ? (test.getTiempoLimite() / 60) + " min" : "Sin límite";

        StringBuilder preguntas = new StringBuilder();
        List<Pregunta> lista = test.getPreguntas();
        for (int i = 0; i < lista.size(); i++) {
            Pregunta p = lista.get(i);
            preguntas.append("<div class='pregunta-item'>")
                .append("<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:6px'>")
                .append("<tr>")
                .append("<td width='28' valign='top'><span class='pregunta-num'>").append(i + 1).append("</span></td>")
                .append("<td valign='top' class='pregunta-texto'>").append(esc(p.getEnunciado())).append("</td>")
                .append("<td width='48' valign='top' class='pregunta-pts'>").append(p.getPuntos()).append(" pt</td>")
                .append("</tr></table>");
            if (!p.getOpciones().isEmpty()) {
                preguntas.append("<ul class='opciones'>");
                for (Opcion o : p.getOpciones()) {
                    preguntas.append("<li class='opcion").append(o.isEsCorrecta() ? " opcion-ok" : "").append("'>")
                        .append(o.isEsCorrecta() ? "✓ " : "○ ")
                        .append(esc(o.getTexto())).append("</li>");
                }
                preguntas.append("</ul>");
            }
            if (p.getExplicacion() != null && !p.getExplicacion().isBlank()) {
                preguntas.append("<div class='explicacion'>💡 ").append(esc(p.getExplicacion())).append("</div>");
            }
            preguntas.append("</div>");
        }

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>" + CSS + CSS_TEST + "</style></head><body>"
            + header(fecha)
            + "<div class='body-content'>"
            + "<h1 class='titulo'>" + titulo + "</h1>"
            + "<div class='chips-row'>"
            + "<span class='chip-cat'>" + categoria + "</span>"
            + "<span class='chip-dif'>" + dificultad + "</span>"
            + "</div>"
            + desc
            + "<div class='meta-row'>⏱ " + tiempo + " &nbsp;&nbsp; 📋 "
            + lista.size() + " pregunta" + (lista.size() != 1 ? "s" : "") + "</div>"
            + "<hr class='divider'/>"
            + "<div class='preguntas'>" + preguntas + "</div>"
            + "</div>"
            + footer()
            + "</body></html>";
    }

    private String buildResultadoHtml(Intento intento, List<RespuestaIntento> respuestas) {
        Test test    = intento.getTest();
        String titulo = test != null ? esc(test.getTitulo()) : "Test";
        String fecha  = intento.getFin() != null ? intento.getFin().format(FMT) : LocalDateTime.now().format(FMT);
        long mins     = intento.getTiempoEmpleado() / 60;
        long segs     = intento.getTiempoEmpleado() % 60;
        String tiempo = mins + "m " + segs + "s";
        int pct       = (int) intento.getPorcentaje();
        String colorPct = pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

        StringBuilder desglose = new StringBuilder();
        for (int i = 0; i < respuestas.size(); i++) {
            RespuestaIntento r = respuestas.get(i);
            Pregunta p = r.getPregunta();
            String estado = r.isPendienteCorreccion() ? "⏳ Pendiente"
                : r.isEsCorrecta() ? "✓ Correcta" : "✗ Incorrecta";
            String claseEstado = r.isPendienteCorreccion() ? "pendiente"
                : r.isEsCorrecta() ? "correcto" : "incorrecto";

            String claseItem = "resp-item-" + claseEstado;
            desglose.append("<div class='resp-item ").append(claseItem).append("'>")
                .append("<table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:4px'>")
                .append("<tr>")
                .append("<td width='24' valign='top'><span class='resp-num'>").append(i + 1).append("</span></td>")
                .append("<td valign='top' class='resp-enunciado'>").append(esc(p.getEnunciado())).append("</td>")
                .append("<td width='90' valign='top' class='resp-estado'>").append(estado).append("</td>")
                .append("</tr></table>");

            if (p.getTipo().equals("TEXTO_LIBRE")) {
                desglose.append("<p class='resp-texto'><strong>Tu respuesta:</strong> ")
                    .append(r.getTextoLibre() != null ? esc(r.getTextoLibre()) : "Sin respuesta")
                    .append("</p>");
            } else if (r.getOpcionSeleccionada() != null) {
                desglose.append("<p class='resp-texto'><strong>Tu respuesta:</strong> ")
                    .append(esc(r.getOpcionSeleccionada().getTexto())).append("</p>");
                if (!r.isEsCorrecta()) {
                    p.getOpciones().stream().filter(Opcion::isEsCorrecta).findFirst().ifPresent(ok ->
                        desglose.append("<p class='resp-correcta'><strong>Respuesta correcta:</strong> ")
                            .append(esc(ok.getTexto())).append("</p>")
                    );
                }
            }
            desglose.append("</div>");
        }

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>" + CSS + CSS_RESULTADO + "</style></head><body>"
            + header(fecha)
            + "<div class='body-content'>"
            + "<h1 class='titulo'>" + titulo + "</h1>"
            + "<p class='meta'>Realizado el " + fecha + " &nbsp;·&nbsp; Tiempo: " + tiempo + "</p>"
            + "<div class='score-box'>"
            + "<div class='score-circle' style='border-color:" + colorPct + ";color:" + colorPct + "'>" + pct + "%</div>"
            + "<table class='stats-table' cellpadding='0' cellspacing='0'><tr>"
            + "<td class='stat-cell'><span class='stat-v-ok'>" + intento.getCorrectas() + "</span><span class='stat-l'>Correctas</span></td>"
            + "<td class='stat-cell'><span class='stat-v-ko'>" + intento.getIncorrectas() + "</span><span class='stat-l'>Incorrectas</span></td>"
            + "<td class='stat-cell'><span class='stat-v'>" + intento.getTotalPreguntas() + "</span><span class='stat-l'>Total</span></td>"
            + "<td class='stat-cell'><span class='stat-v'>" + intento.getPuntuacion() + "</span><span class='stat-l'>Puntos</span></td>"
            + "</tr></table>"
            + "</div>"
            + "<hr class='divider'/>"
            + "<h2 class='seccion-titulo'>Revisión de respuestas</h2>"
            + "<div class='desglose'>" + desglose + "</div>"
            + "</div>"
            + footer()
            + "</body></html>";
    }

    private String buildHtml(Apunte apunte) {
        String titulo    = apunte.getTitulo()    != null ? esc(apunte.getTitulo())    : "Sin título";
        String contenido = preprocesarHtml(apunte.getContenido());
        String tags      = apunte.getTags()      != null ? apunte.getTags()           : "";
        String fecha     = apunte.getCreatedAt() != null ? apunte.getCreatedAt().format(FMT) : "";

        StringBuilder tagsHtml = new StringBuilder();
        if (!tags.isBlank()) {
            tagsHtml.append("<div class='tags'>");
            for (String tag : tags.split(","))
                tagsHtml.append("<span class='tag'>").append(esc(tag.trim())).append("</span> ");
            tagsHtml.append("</div>");
        }

        String testHtml = apunte.getTestAsociado() != null
            ? "<p class='meta'><strong>Test asociado:</strong> " + esc(apunte.getTestAsociado().getTitulo()) + "</p>"
            : "";

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>" + CSS + "</style></head><body>"
            + header(fecha)
            + "<div class='body-content'>"
            + "<h1 class='titulo'>" + titulo + "</h1>"
            + "<p class='meta'>Creado el " + fecha + "</p>"
            + tagsHtml
            + testHtml
            + "<hr class='divider'/>"
            + "<div class='contenido'>" + contenido + "</div>"
            + "</div>"
            + footer()
            + "</body></html>";
    }

    private String header(String fecha) {
        return "<div class='header'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr>"
            + "<td class='header-brand'>Madraza</td>"
            + "<td class='header-fecha'>" + fecha + "</td>"
            + "</tr></table>"
            + "</div>";
    }

    private String footer() {
        String hoy = LocalDateTime.now().format(FMT);
        return "<div class='footer'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr>"
            + "<td class='footer-left'>Madraza</td>"
            + "<td class='footer-right'>Exportado el " + hoy + "</td>"
            + "</tr></table>"
            + "</div>";
    }

    /** Limpia el HTML de Quill para compatibilidad con iText. */
    private String preprocesarHtml(String html) {
        if (html == null || html.isBlank()) return "<p>&nbsp;</p>";

        html = html.replace("<p><br></p>", "<p>&nbsp;</p>");
        html = html.replace("<p><br/></p>", "<p>&nbsp;</p>");

        html = html.replaceAll("<p([^>]*)><br\\s*/?>", "<p$1>&nbsp;");

        // Imágenes: forzar max-width para que no desborden la página
        html = html.replaceAll(
            "<img([^>]*?)(?:style=\"[^\"]*\")?([^>]*?)(/?)>",
            "<img$1$2 style=\"max-width:100%;height:auto;\"$3>"
        );

        // Tablas de Quill: quitar width absolutos que desborden
        html = html.replaceAll("(<table[^>]*?)\\s+width=\"[^\"]*\"", "$1");
        html = html.replaceAll("(<col[^>]*?)\\s+width=\"[^\"]*\"", "$1");


        return html;
    }

    private String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static final String CSS = """
        @page { size: A4; margin: 0; }
        body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0;
               color: #1f2937; font-size: 11pt; }
        table { border-collapse: collapse; }
        .header { background: #4f46e5; color: white; padding: 14px 20mm; width: 100%; }
        .header-brand { font-size: 18pt; font-weight: bold; color: white; }
        .header-fecha  { font-size: 10pt; color: white; text-align: right; vertical-align: middle; }
        .body-content  { padding: 14px 20mm 20mm; }
        .titulo  { font-size: 20pt; font-weight: bold; margin: 0 0 6px; color: #111827; }
        .meta    { color: #6b7280; font-size: 10pt; margin: 0 0 4px; }
        .tags    { margin: 8px 0; }
        .tag     { background: #ede9fe; color: #4f46e5; padding: 2px 8px; border-radius: 10px;
                   font-size: 10pt; margin-right: 4px; display: inline-block; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
        .contenido      { line-height: 1.7; word-wrap: break-word; overflow-wrap: break-word; }
        .contenido p    { margin: 0 0 8px; word-wrap: break-word; overflow-wrap: break-word; }
        .contenido h1   { font-size: 16pt; margin: 14px 0 6px; }
        .contenido h2   { font-size: 14pt; margin: 12px 0 4px; }
        .contenido h3   { font-size: 12pt; margin: 10px 0 4px; }
        .contenido ul, .contenido ol { padding-left: 20px; margin: 4px 0; }
        .contenido li   { margin: 3px 0; word-wrap: break-word; overflow-wrap: break-word; }
        .contenido blockquote { border-left: 3px solid #4f46e5; margin: 8px 0;
                                padding-left: 12px; color: #6b7280; }
        .contenido code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px;
                          font-family: monospace; font-size: 10pt; word-break: break-all; }
        .contenido pre  { background: #f3f4f6; padding: 10px; border-radius: 6px;
                          font-family: monospace; font-size: 10pt;
                          white-space: pre-wrap; word-break: break-all; }
        .contenido img  { max-width: 100%; height: auto; display: block; }
        .contenido table { max-width: 100%; table-layout: fixed; word-break: break-word; }
        .contenido td, .contenido th { word-break: break-word; overflow-wrap: break-word;
                                       padding: 4px 6px; }
        .contenido span { word-wrap: break-word; overflow-wrap: break-word; }
        .contenido a    { word-break: break-all; }
        .ql-align-center  { text-align: center; }
        .ql-align-right   { text-align: right; }
        .ql-align-justify { text-align: justify; }
        .ql-indent-1 { padding-left: 3em; }
        .ql-indent-2 { padding-left: 6em; }
        .ql-indent-3 { padding-left: 9em; }
        .ql-syntax   { background: #f3f4f6; padding: 10px; font-family: monospace;
                       font-size: 10pt; white-space: pre-wrap; word-break: break-all; }
        .footer { padding: 8px 20mm; border-top: 1px solid #e5e7eb;
                  color: #9ca3af; font-size: 9pt; margin-top: 24px; }
        .footer-left  { color: #9ca3af; font-size: 9pt; }
        .footer-right { color: #9ca3af; font-size: 9pt; text-align: right; }
        """;

    private static final String CSS_TEST = """
        .chips-row { margin: 8px 0; }
        .chip-cat { background: #dbeafe; color: #1d4ed8; padding: 2px 10px;
                    border-radius: 10px; font-size: 10pt; margin-right: 6px; display: inline-block; }
        .chip-dif { background: #fef9c3; color: #854d0e; padding: 2px 10px;
                    border-radius: 10px; font-size: 10pt; display: inline-block; }
        .descripcion { color: #6b7280; font-size: 11pt; margin: 8px 0; }
        .meta-row { margin: 8px 0 14px; color: #6b7280; font-size: 10pt; }
        .preguntas { margin-top: 8px; }
        .pregunta-item { border: 1px solid #e5e7eb; border-radius: 6px;
                         padding: 10px 12px; margin-bottom: 12px; }
        .pregunta-num { background: #4f46e5; color: white; border-radius: 50%;
                        width: 22px; height: 22px; font-size: 9pt; font-weight: bold;
                        text-align: center; line-height: 22px; display: inline-block; }
        .pregunta-texto { font-size: 11pt; }
        .pregunta-pts { color: #6b7280; font-size: 10pt; text-align: right; }
        .opciones { list-style: none; padding: 0; margin: 6px 0 0 32px; }
        .opciones li { padding: 3px 0; font-size: 10pt; color: #374151; }
        .opcion-ok { color: #16a34a; font-weight: bold; }
        .explicacion { margin: 6px 0 0 32px; color: #6b7280; font-size: 10pt; font-style: italic; }
        """;

    private static final String CSS_RESULTADO = """
        .score-box { margin: 16px 0; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; border: 4px solid;
                        font-size: 20pt; font-weight: bold; text-align: center;
                        line-height: 76px; display: inline-block; vertical-align: middle; }
        .stats-table { margin-left: 20px; display: inline-block; vertical-align: middle; }
        .stat-cell { text-align: center; padding: 0 14px; }
        .stat-v { font-size: 18pt; font-weight: bold; color: #1f2937; display: block; }
        .stat-v-ok { font-size: 18pt; font-weight: bold; color: #16a34a; display: block; }
        .stat-v-ko { font-size: 18pt; font-weight: bold; color: #dc2626; display: block; }
        .stat-l { font-size: 9pt; color: #6b7280; display: block; }
        .seccion-titulo { font-size: 14pt; margin: 0 0 10px; color: #374151; }
        .resp-item { padding: 10px 12px; border-left: 4px solid #e5e7eb;
                     border-radius: 4px; margin-bottom: 10px; }
        .resp-item-correcto { border-left-color: #16a34a; background: #f0fdf4; }
        .resp-item-incorrecto { border-left-color: #dc2626; background: #fef2f2; }
        .resp-item-pendiente { border-left-color: #d97706; background: #fffbeb; }
        .resp-num { background: #4f46e5; color: white; border-radius: 50%;
                    width: 20px; height: 20px; font-size: 9pt; font-weight: bold;
                    text-align: center; line-height: 20px; display: inline-block; }
        .resp-enunciado { font-size: 11pt; }
        .resp-estado { font-size: 10pt; font-weight: 600; text-align: right; }
        .resp-texto { margin: 4px 0 0 28px; font-size: 10pt; color: #374151; }
        .resp-correcta { margin: 2px 0 0 28px; font-size: 10pt; color: #16a34a; }
        """;
}
