// tr-proxy — transparent reverse proxy for TokenRouter that turns OFF model
// "thinking"/reasoning on every chat-completion request. Reasoning models like
// GLM-5.2 are slow because they emit long chains of thought before acting; the
// switch to disable that isn't reachable through Kilo's config, so we flip it
// here instead. Everything else is passed through unchanged (including streaming).
//
// Run it, then set the tool's baseURL to  http://127.0.0.1:8787/v1

use axum::{
    body::{Body, Bytes},
    extract::State,
    http::{HeaderMap, Method, StatusCode, Uri},
    response::Response,
    routing::any,
    Router,
};
use std::sync::Arc;

const UPSTREAM: &str = "https://api.tokenrouter.com";
const LISTEN: &str = "127.0.0.1:8787";

#[tokio::main]
async fn main() {
    let client = reqwest::Client::new();
    let app = Router::new()
        .route("/", any(proxy))
        .route("/{*path}", any(proxy))
        .with_state(Arc::new(client));

    let listener = tokio::net::TcpListener::bind(LISTEN)
        .await
        .expect("bind 127.0.0.1:8787");
    println!("tr-proxy: http://{LISTEN}  ->  {UPSTREAM}   (reasoning forced OFF)");
    axum::serve(listener, app).await.unwrap();
}

async fn proxy(
    State(client): State<Arc<reqwest::Client>>,
    method: Method,
    uri: Uri,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response, StatusCode> {
    let path_q = uri.path_and_query().map(|pq| pq.as_str()).unwrap_or("/").to_string();
    let url = format!("{UPSTREAM}{path_q}");
    let started = std::time::Instant::now();

    let out_body = inject_no_think(&body);
    let injected = out_body.len() != body.len();
    eprintln!("--> {method} {path_q}  (body {}B, inject={injected})", body.len());

    let mut req = client.request(method, &url);
    for (name, value) in headers.iter() {
        // Drop hop-by-hop / length / host / encoding headers; reqwest sets its own.
        let n = name.as_str().to_ascii_lowercase();
        if matches!(
            n.as_str(),
            "host" | "content-length" | "connection" | "accept-encoding"
        ) {
            continue;
        }
        req = req.header(name, value);
    }
    req = req.body(out_body);

    let upstream = req.send().await.map_err(|_| StatusCode::BAD_GATEWAY)?;

    // Buffer the full upstream response (including SSE streams) then return it.
    // With reasoning forced off each model turn is ~1s, so buffering is fine and
    // avoids incremental-flush issues between reqwest's stream and axum.
    let status = upstream.status();
    let resp_headers = upstream.headers().clone();
    let bytes = upstream.bytes().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
    eprintln!("<-- {status} {path_q}  ({} bytes, {:?})", bytes.len(), started.elapsed());

    let mut builder = Response::builder().status(status);
    for (name, value) in resp_headers.iter() {
        let n = name.as_str().to_ascii_lowercase();
        if matches!(n.as_str(), "content-length" | "transfer-encoding" | "connection") {
            continue;
        }
        builder = builder.header(name, value);
    }
    builder
        .body(Body::from(bytes))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Inject the "skip thinking" flags into a JSON chat-completion request body.
/// Non-JSON or non-chat bodies pass through untouched.
fn inject_no_think(body: &[u8]) -> Vec<u8> {
    if body.is_empty() {
        return Vec::new();
    }
    let Ok(mut v) = serde_json::from_slice::<serde_json::Value>(body) else {
        return body.to_vec();
    };
    if let Some(obj) = v.as_object_mut() {
        if obj.contains_key("messages") {
            // Cover the common vendor spellings — whichever the model honors wins,
            // the rest are ignored. All three were verified to work on TokenRouter.
            obj.insert("reasoning_effort".into(), serde_json::Value::String("none".into()));
            obj.insert("enable_thinking".into(), serde_json::Value::Bool(false));
            obj.insert(
                "chat_template_kwargs".into(),
                serde_json::json!({ "enable_thinking": false }),
            );
        }
    }
    serde_json::to_vec(&v).unwrap_or_else(|_| body.to_vec())
}
