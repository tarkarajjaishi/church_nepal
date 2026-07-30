//! PDF rendering for reports.
//!
//! Written directly rather than through a PDF crate. The alternatives either
//! pull in a font-embedding stack and a layout engine (a large dependency for
//! one feature), or drive a headless browser (a browser, on the API host, to
//! print a table). A report is a heading, some figures and a grid of text —
//! and PDF's built-in Helvetica draws exactly that with no embedded font.
//!
//! What that costs, stated plainly: **WinAnsi only**. The base-14 fonts have
//! no Devanagari, so a Nepali book title renders as `?` here while the CSV
//! export carries it correctly as UTF-8. `transliterate_note` puts that on the
//! page rather than letting someone discover it in a board meeting. Embedding
//! a Unicode font is the fix when it matters; until then the file says so.
//!
//! Content is measured, escaped and clipped before it reaches the page — a
//! stray `)` in a donor's name would otherwise end the string operator early
//! and produce a file no reader will open.

use crate::models::report::*;

// Points. A4 is 595x842; landscape suits a table with five or six columns.
const PAGE_W: f32 = 842.0;
const PAGE_H: f32 = 595.0;
const MARGIN: f32 = 40.0;
const LINE: f32 = 14.0;

/// Escape the three characters that terminate or nest a PDF string literal.
///
/// Without this, a donor called `O'Brien (Jr)` closes the operand early and
/// the whole document fails to parse — the classic injection-shaped bug in a
/// format nobody thinks of as injectable.
fn esc(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 4);
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '(' => out.push_str("\\("),
            ')' => out.push_str("\\)"),
            // Helvetica is WinAnsi. Anything outside it has no glyph, and
            // emitting the raw byte produces mojibake rather than an error.
            c if (c as u32) < 32 => out.push(' '),
            c if (c as u32) < 127 => out.push(c),
            _ => out.push('?'),
        }
    }
    out
}

/// True when a value would lose characters in the PDF's WinAnsi encoding.
fn lossy(s: &str) -> bool {
    s.chars().any(|c| (c as u32) > 126)
}

/// Helvetica advance widths, in 1/1000 em, for the printable ASCII range.
///
/// Column widths are computed from real glyph widths rather than a character
/// count, because "IIIIIIIIII" and "MMMMMMMMMM" are the same length and very
/// different widths — and a table sized by count either wraps or leaves half
/// the page blank.
fn text_width(s: &str, size: f32) -> f32 {
    const W: [u16; 95] = [
        278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // ' ' .. '/'
        556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, // '0' .. '?'
        1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, // '@' .. 'O'
        667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, // 'P' .. '_'
        333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, // '`' .. 'o'
        556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, // 'p' .. '~'
    ];
    let mut total = 0f32;
    for c in s.chars() {
        let i = c as usize;
        let w = if (32..127).contains(&i) { W[i - 32] } else { 556 };
        total += w as f32;
    }
    total * size / 1000.0
}

/// Trim to fit, with an ellipsis, so a long title never runs into the next
/// column. Silent overlap is worse than visible truncation: one is a value you
/// know is cut, the other is two values you cannot tell apart.
///
/// Three full stops rather than "…": the ellipsis is outside WinAnsi, so it
/// would be measured at its own width and then drawn as a question mark.
/// Anything this file puts on the page itself must survive its own encoding.
fn clip(s: &str, max: f32, size: f32) -> String {
    if text_width(s, size) <= max {
        return s.to_string();
    }
    let dots = text_width("...", size);
    let mut out = String::new();
    for c in s.chars() {
        if text_width(&out, size) + text_width(&c.to_string(), size) + dots > max {
            break;
        }
        out.push(c);
    }
    out.push_str("...");
    out
}

struct Page {
    ops: String,
    y: f32,
}

impl Page {
    fn new() -> Self {
        Self { ops: String::new(), y: PAGE_H - MARGIN }
    }

    fn text(&mut self, x: f32, y: f32, size: f32, bold: bool, s: &str) {
        let font = if bold { "F2" } else { "F1" };
        self.ops
            .push_str(&format!("BT /{font} {size} Tf 1 0 0 1 {x:.1} {y:.1} Tm ({}) Tj ET\n", esc(s)));
    }

    fn rule(&mut self, y: f32, width: f32) {
        self.ops.push_str(&format!(
            "0.8 w 0.75 0.75 0.75 RG {MARGIN:.1} {y:.1} m {:.1} {y:.1} l S\n",
            MARGIN + width
        ));
    }

    fn band(&mut self, y: f32, width: f32, height: f32) {
        self.ops.push_str(&format!(
            "0.95 0.95 0.95 rg {MARGIN:.1} {:.1} {width:.1} {height:.1} re f 0 0 0 rg\n",
            y - 3.0
        ));
    }
}

fn format_value(v: &serde_json::Value, kind: ColumnKind) -> String {
    if v.is_null() {
        return String::new();
    }
    match kind {
        ColumnKind::Money => v
            .as_i64()
            .map(|n| {
                let (sign, n) = if n < 0 { ("-", -n) } else { ("", n) };
                format!("{sign}{}.{:02}", n / 100, n % 100)
            })
            .unwrap_or_default(),
        ColumnKind::Percent => v.as_f64().map(|n| format!("{n:.1}%")).unwrap_or_default(),
        ColumnKind::Duration => v
            .as_i64()
            .map(|h| if h < 24 { format!("{h}h") } else { format!("{}d {}h", h / 24, h % 24) })
            .unwrap_or_default(),
        _ => match v {
            serde_json::Value::String(s) => s.clone(),
            other => other.to_string(),
        },
    }
}

fn numeric(kind: ColumnKind) -> bool {
    matches!(
        kind,
        ColumnKind::Money | ColumnKind::Number | ColumnKind::Percent | ColumnKind::Duration
    )
}

/// Render a report as a PDF document.
pub fn render(r: &Report) -> Vec<u8> {
    let usable = PAGE_W - MARGIN * 2.0;
    let body = 9.0f32;

    // Column widths from the widest of the header and the values, capped so
    // one long free-text column cannot squeeze every number off the page.
    let sample: Vec<&serde_json::Value> = r.rows.iter().take(200).collect();
    let mut widths: Vec<f32> = r
        .columns
        .iter()
        .map(|c| {
            let mut w = text_width(&c.label, body) + 12.0;
            for row in &sample {
                let v = row.get(&c.key).unwrap_or(&serde_json::Value::Null);
                w = w.max(text_width(&format_value(v, c.kind), body) + 12.0);
            }
            w.min(usable * 0.35)
        })
        .collect();

    let total: f32 = widths.iter().sum();
    if total > 0.0 {
        let scale = usable / total;
        for w in widths.iter_mut() {
            *w *= scale;
        }
    }

    let mut pages: Vec<Page> = Vec::new();
    let mut p = Page::new();

    // --- Heading ---------------------------------------------------------
    p.text(MARGIN, p.y, 18.0, true, &r.name);
    p.y -= 20.0;
    p.text(MARGIN, p.y, 9.0, false, &r.description);
    p.y -= 13.0;
    p.text(
        MARGIN,
        p.y,
        9.0,
        false,
        &format!(
            "{} to {}   -   compared with {} to {}",
            r.from, r.to, r.compare_from, r.compare_to
        ),
    );
    p.y -= 8.0;
    p.rule(p.y, usable);
    p.y -= 18.0;

    // --- Headline figures ------------------------------------------------
    if !r.stats.is_empty() {
        let per = usable / r.stats.len() as f32;
        let top = p.y;
        for (i, s) in r.stats.iter().enumerate() {
            let x = MARGIN + per * i as f32;
            p.text(x, top, 7.5, false, &s.label.to_uppercase());
            p.text(x, top - 15.0, 13.0, true, &format_value(&serde_json::json!(s.value), s.kind));
            if let Some(c) = s.change {
                let arrow = if c > 0.0 { "+" } else { "" };
                p.text(x, top - 27.0, 7.5, false, &format!("{arrow}{c}% vs previous"));
            } else {
                p.text(x, top - 27.0, 7.5, false, "no baseline");
            }
        }
        p.y = top - 40.0;
        p.rule(p.y, usable);
        p.y -= 18.0;
    }

    if let Some(msg) = &r.unavailable {
        p.text(MARGIN, p.y, 10.0, false, msg);
        pages.push(p);
        return assemble(pages);
    }

    // --- Table -----------------------------------------------------------
    let header = |p: &mut Page, widths: &[f32]| {
        p.band(p.y, usable, LINE);
        let mut x = MARGIN;
        for (c, w) in r.columns.iter().zip(widths) {
            let label = clip(&c.label, w - 8.0, body);
            let tx = if numeric(c.kind) { x + w - 6.0 - text_width(&label, body) } else { x + 4.0 };
            p.text(tx, p.y, body, true, &label);
            x += w;
        }
        p.y -= LINE;
    };
    header(&mut p, &widths);

    for row in &r.rows {
        if p.y < MARGIN + LINE * 3.0 {
            pages.push(std::mem::replace(&mut p, Page::new()));
            p.y = PAGE_H - MARGIN;
            // Repeat the header on every page — a table whose columns are
            // named only on page one is unreadable from page two.
            header(&mut p, &widths);
        }
        let mut x = MARGIN;
        for (c, w) in r.columns.iter().zip(&widths) {
            let v = clip(&format_value(row.get(&c.key).unwrap_or(&serde_json::Value::Null), c.kind), w - 8.0, body);
            let tx = if numeric(c.kind) { x + w - 6.0 - text_width(&v, body) } else { x + 4.0 };
            p.text(tx, p.y, body, false, &v);
            x += w;
        }
        p.y -= LINE;
    }

    // --- Totals ----------------------------------------------------------
    if let Some(totals) = r.totals.as_object().filter(|t| !t.is_empty()) {
        if p.y < MARGIN + LINE * 2.0 {
            pages.push(std::mem::replace(&mut p, Page::new()));
            p.y = PAGE_H - MARGIN;
        }
        p.y += 3.0;
        p.rule(p.y + LINE - 4.0, usable);
        let mut x = MARGIN;
        for (i, (c, w)) in r.columns.iter().zip(&widths).enumerate() {
            let v = if i == 0 {
                "Total".to_string()
            } else {
                totals
                    .get(&c.key)
                    .map(|t| format_value(t, c.kind))
                    .unwrap_or_default()
            };
            let tx = if numeric(c.kind) && i > 0 { x + w - 6.0 - text_width(&v, body) } else { x + 4.0 };
            p.text(tx, p.y, body, true, &v);
            x += w;
        }
        p.y -= LINE;
    }

    // Say it on the page rather than let it be discovered in a meeting.
    if let Some(note) = transliterate_note(r) {
        p.y -= 10.0;
        p.text(MARGIN, p.y, 7.5, false, &note);
    }

    pages.push(p);
    assemble(pages)
}

/// Warn on the page when values could not be drawn in the PDF's font.
fn transliterate_note(r: &Report) -> Option<String> {
    let affected = r
        .rows
        .iter()
        .filter(|row| {
            r.columns.iter().any(|c| {
                matches!(row.get(&c.key), Some(serde_json::Value::String(s)) if lossy(s))
            })
        })
        .count();
    (affected > 0).then(|| {
        format!(
            "Note: {affected} row(s) contain characters this PDF font cannot draw and show as \"?\". \
             Export as CSV for the full text."
        )
    })
}

/// Stitch the pages into a PDF file with a correct cross-reference table.
fn assemble(pages: Vec<Page>) -> Vec<u8> {
    let n = pages.len().max(1);
    // 1 catalog, 2 pages tree, 3+4 fonts, then a page and a content stream each.
    let mut objects: Vec<String> = Vec::new();

    let kids: String = (0..n).map(|i| format!("{} 0 R ", 5 + i * 2)).collect();
    objects.push("<< /Type /Catalog /Pages 2 0 R >>".into());
    objects.push(format!("<< /Type /Pages /Kids [{kids}] /Count {n} >>"));
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>".into());
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>".into());

    for (i, page) in pages.iter().enumerate() {
        let content_id = 6 + i * 2;
        objects.push(format!(
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] \
             /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {content_id} 0 R >>"
        ));
        objects.push(format!(
            "<< /Length {} >>\nstream\n{}\nendstream",
            page.ops.len() + 1,
            page.ops
        ));
    }

    let mut out = String::from("%PDF-1.4\n");
    let mut offsets = Vec::with_capacity(objects.len());
    for (i, body) in objects.iter().enumerate() {
        offsets.push(out.len());
        out.push_str(&format!("{} 0 obj\n{body}\nendobj\n", i + 1));
    }

    let xref_at = out.len();
    out.push_str(&format!("xref\n0 {}\n0000000000 65535 f \n", objects.len() + 1));
    for off in &offsets {
        out.push_str(&format!("{off:010} 00000 n \n"));
    }
    out.push_str(&format!(
        "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n",
        objects.len() + 1
    ));
    out.into_bytes()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn report(rows: Vec<serde_json::Value>) -> Report {
        Report {
            key: "giving-summary".into(),
            name: "Giving summary".into(),
            description: "What came in".into(),
            from: chrono::NaiveDate::from_ymd_opt(2026, 1, 1).unwrap(),
            to: chrono::NaiveDate::from_ymd_opt(2026, 7, 31).unwrap(),
            compare_from: chrono::NaiveDate::from_ymd_opt(2025, 6, 1).unwrap(),
            compare_to: chrono::NaiveDate::from_ymd_opt(2025, 12, 31).unwrap(),
            stats: vec![Stat {
                label: "Total given".into(),
                value: 837_000,
                kind: ColumnKind::Money,
                hint: None,
                change: Some(4.6),
            }],
            columns: vec![
                Column::new("donor", "Donor", ColumnKind::Text),
                Column::new("total", "Given", ColumnKind::Money),
            ],
            rows,
            series: vec![],
            unavailable: None,
            total_rows: 0,
            totals: serde_json::json!({ "total": 837_000 }),
        }
    }

    #[test]
    fn a_name_with_brackets_cannot_break_the_document() {
        // `)` ends a PDF string operand. Unescaped, this produces a file no
        // reader will open — and donor names really do contain brackets.
        let pdf = render(&report(vec![
            serde_json::json!({ "donor": "O'Brien (Jr) \\ Co", "total": 1000 }),
        ]));
        let text = String::from_utf8_lossy(&pdf);
        assert!(text.contains("O'Brien \\(Jr\\) \\\\ Co"));
        assert!(text.starts_with("%PDF-1.4"));
        assert!(text.ends_with("%%EOF\n"));
    }

    #[test]
    fn the_cross_reference_table_points_at_real_objects() {
        // A wrong offset here is the difference between a file that opens and
        // one that reports "damaged" with no other clue.
        let pdf = render(&report(vec![serde_json::json!({ "donor": "A", "total": 1 })]));
        let text = String::from_utf8_lossy(&pdf);
        let start: usize = text
            .rsplit("startxref\n")
            .next()
            .unwrap()
            .lines()
            .next()
            .unwrap()
            .parse()
            .unwrap();
        assert!(text[start..].starts_with("xref"), "startxref must point at the table");

        for line in text[start..].lines().skip(2) {
            if !line.ends_with(" n ") {
                break;
            }
            let off: usize = line.split_whitespace().next().unwrap().parse().unwrap();
            assert!(text[off..].contains(" 0 obj"), "offset {off} is not an object");
        }
    }

    #[test]
    fn long_rows_spill_onto_more_pages_and_repeat_the_header() {
        let rows: Vec<_> = (0..200)
            .map(|i| serde_json::json!({ "donor": format!("Donor {i}"), "total": i * 100 }))
            .collect();
        let pdf = render(&report(rows));
        let text = String::from_utf8_lossy(&pdf);
        let pages = text.matches("/Type /Page ").count();
        assert!(pages > 1, "200 rows should not fit on one page");
        assert_eq!(text.matches("(Donor) Tj").count(), pages, "header on every page");
    }

    #[test]
    fn money_is_written_from_minor_units() {
        assert_eq!(format_value(&serde_json::json!(123_456), ColumnKind::Money), "1234.56");
        assert_eq!(format_value(&serde_json::json!(5), ColumnKind::Money), "0.05");
        assert_eq!(format_value(&serde_json::json!(-250), ColumnKind::Money), "-2.50");
        assert_eq!(format_value(&serde_json::json!(123_456), ColumnKind::Number), "123456");
    }

    #[test]
    fn text_the_font_cannot_draw_is_flagged_on_the_page() {
        // Helvetica has no Devanagari. Silently printing "?" and saying
        // nothing is how a Nepali title becomes a mystery in a board meeting.
        let r = report(vec![serde_json::json!({ "donor": "परमेश्वरको वचन", "total": 100 })]);
        assert!(transliterate_note(&r).is_some());
        let plain = report(vec![serde_json::json!({ "donor": "Bishal Rai", "total": 100 })]);
        assert!(transliterate_note(&plain).is_none());
    }

    #[test]
    fn nothing_this_file_draws_itself_is_outside_the_font() {
        // The separator and the ellipsis are ours, not the data's. Drawing
        // them as "?" makes our own chrome look like broken user content.
        let pdf = render(&report(vec![serde_json::json!({ "donor": "A", "total": 1 })]));
        let text = String::from_utf8_lossy(&pdf);
        let drawn: Vec<&str> = text
            .split("(")
            .filter_map(|c| c.split(") Tj").next().filter(|_| c.contains(") Tj")))
            .collect();
        for d in drawn {
            assert!(!d.contains('?'), "our own text should not contain a replacement: {d}");
        }
    }

    #[test]
    fn a_wide_value_is_clipped_rather_than_overlapping_its_neighbour() {
        let long = "M".repeat(200);
        let out = clip(&long, 100.0, 9.0);
        assert!(out.ends_with("..."), "got {out}");
        assert!(text_width(&out, 9.0) <= 100.0);
        // Something that fits is left exactly as it was.
        assert_eq!(clip("Bishal Rai", 500.0, 9.0), "Bishal Rai");
    }
}
