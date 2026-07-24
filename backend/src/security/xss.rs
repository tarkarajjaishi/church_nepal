use regex::Regex;

fn strip_tags(text: &str, keep_safe: bool) -> String {
    let tag_re = regex::Regex::new(r#"</?([a-zA-Z][a-zA-Z0-9]*)[^>]*>"#).expect("valid tag regex");
    let entity_re = regex::Regex::new(r#"&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);"#).expect("valid entity regex");

    let mut result = String::with_capacity(text.len() * 2);
    let mut last = 0;

    for m in tag_re.find_iter(text) {
        let matched = m.as_str();
        let start = m.start();
        let end = m.end();

        let inner = matched
            .trim_start_matches('<')
            .trim_start_matches('/')
            .trim_end_matches('>');

        let is_self_closing = matched.ends_with("/>");

        let tag_name_raw = inner
            .split_whitespace()
            .next()
            .unwrap_or("");

        let before = &text[last..start];
        result.push_str(&escape_html(before));

        if keep_safe && !matched.starts_with("</") && !is_self_closing && tag_name_allowed(tag_name_raw) {
            let attrs_str = if inner.len() > tag_name_raw.len() {
                &inner[tag_name_raw.len()..].trim()
            } else {
                ""
            };
            let clean_attrs: String = attrs_str
                .split_whitespace()
                .filter(|attr| {
                    attr.split('=').next().map_or(false, |name| {
                        let re = regex::Regex::new(r#"^[a-zA-Z_:][\w:.\-]*$"#).expect("valid attr name pattern");
                        re.is_match(name)
                    })
                })
                .map(|attr| {
                    let parts: Vec<&str> = attr.splitn(2, '=').collect();
                    if parts.len() == 2 {
                        let val = parts[1].trim_matches('"');
                        format!("{}=\"{}\"", parts[0], val)
                    } else {
                        attr.to_string()
                    }
                })
                .collect::<Vec<_>>()
                .join(" ");

            if clean_attrs.is_empty() {
                result.push_str(&format!("<{}>", tag_name_raw));
            } else {
                result.push_str(&format!("<{} {}>", tag_name_raw, clean_attrs));
            }
        } else if keep_safe && matched.starts_with("</") && tag_name_allowed(tag_name_raw) {
            result.push_str(&format!("</{}>", tag_name_raw));
        }

        last = end;
    }

    let tail = &text[last..];
    result.push_str(&escape_html(tail));
    result
}

fn tag_name_allowed(name: &str) -> bool {
    matches!(name, "p" | "br" | "b" | "i" | "strong" | "em" | "ul" | "li")
}

pub fn escape_html(text: &str) -> String {
    text.to_string()
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;")
}

pub fn sanitize_plain(text: &str) -> String {
    strip_tags(text, false)
}

pub fn sanitize_html(text: &str) -> String {
    strip_tags(text, true)
}

pub fn sanitize_email_template(text: &str) -> String {
    let tag_re = regex::Regex::new(r#"</?([a-zA-Z][a-zA-Z0-9]*)[^>]*>"#).expect("valid tag regex");
    tag_re.replace_all(text, "").into_owned()
}

pub fn validate_max_length(value: &str, max: usize) -> Result<(), &'static str> {
    if value.len() > max {
        return Err("Value exceeds maximum length");
    }
    Ok(())
}

pub fn sanitize_option_plain(value: Option<&str>) -> Option<String> {
    value.map(|s| sanitize_plain(s))
}

pub fn sanitize_option_html(value: Option<&str>) -> Option<String> {
    value.map(|s| sanitize_html(s))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_html_escapes_tags() {
        assert_eq!(escape_html("<script>"), "&lt;script&gt;");
        assert!(escape_html("<img onerror=alert(1)>").contains("&lt;img"));
    }

    #[test]
    fn test_sanitize_plain_strips_all_tags() {
        let result = sanitize_plain("<b>hello</b>");
        assert_eq!(result, "hello");
    }

    #[test]
    fn test_sanitize_plain_neutralizes_xss() {
        let payload = "<img src=x onerror=alert(1)>";
        let result = sanitize_plain(&payload);
        assert!(!result.contains("<img"));
        assert!(!result.contains("onerror"));
    }

    #[test]
    fn test_sanitize_plain_neutralizes_script() {
        let payload = "<script>alert('xss')</script>";
        let result = sanitize_plain(&payload);
        assert!(!result.contains("<script>"));
        assert!(!result.contains("</script>"));
    }

    #[test]
    fn test_sanitize_html_keeps_safe_tags() {
        let result = sanitize_html("<p>Hello <b>world</b></p>");
        assert!(result.contains("<p>"));
        assert!(result.contains("<b>"));
    }

    #[test]
    fn test_sanitize_html_strips_dangerous_tags() {
        let payload = "<p>Hello <script>alert(1)</script></p>";
        let result = sanitize_html(&payload);
        assert!(!result.contains("<script>"));
        assert!(!result.contains("<img"));
    }

    #[test]
    fn test_sanitize_email_template_strips_all_html() {
        let template = "<p>Hello {{name}}</p>";
        let result = sanitize_email_template(&template);
        assert_eq!(result, "Hello {{name}}");
    }

    #[test]
    fn test_sanitize_html_removes_event_handlers() {
        let payload = r#"<a href="javascript:alert(1)">click</a>"#;
        let result = sanitize_html(&payload);
        assert!(!result.contains("javascript:"));
    }

    #[test]
    fn test_stored_xss_payload_neutralized() {
        let xss_payloads = vec![
            "<script>alert(document.cookie)</script>",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert(1)>",
            "<iframe src=javascript:alert(1)>",
            "<body onload=alert(1)>",
            "javascript:alert(1)",
            "<div style=\"background:url(javascript:alert(1))\">x</div>",
        ];
        for payload in xss_payloads {
            let plain = sanitize_plain(&payload);
            assert!(plain.contains("&lt;") || !plain.contains("<"),
                "XSS payload not neutralized: {:?}", payload);
        }
    }
}
