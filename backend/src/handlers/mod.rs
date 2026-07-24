pub mod attendance;
pub mod audit;
pub mod auth;
pub mod blog;
pub mod broadcasts;
pub mod campaigns;
pub mod contact_info;
pub mod contact_messages;
pub mod content_blocks;
pub mod dashboard;
pub mod donations;
pub mod event_rsvps;
pub mod events;
pub mod forms;
pub mod funds;
pub mod gallery;
pub mod groups;
pub mod leaders;
pub mod media;
pub mod member_applications;
pub mod members;
pub mod ministries;
pub mod newsletter;
pub mod notices;
pub mod offerings;
pub mod pagination_macros;
pub mod people;
pub mod pledges;
pub mod portfolio;
pub mod prayer_requests;
pub mod reports;
pub mod sermons;
pub mod service_times;
pub mod services;
pub mod settings;
pub mod storage;
pub mod team;
pub mod testimonies;
pub mod todos;
pub mod upload;
pub mod users;
pub mod verses;
pub mod volunteers;
pub mod webhooks;

// ── Validation infrastructure ────────────────────────────────────────────────

use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use validator::Validate;
use validator::ValidationErrors;

/// Structured 400-body returned when request validation fails.
/// Unlike a plain `AppError::bad_request(...)`, the response carries a
/// machine-readable `details` array so client UIs can surface per-field errors.
#[derive(Debug, serde::Serialize)]
pub struct ValidationError {
    pub errors: Vec<ValidationFieldError>,
}

#[derive(Debug, serde::Serialize)]
pub struct ValidationFieldError {
    pub field: String,
    pub message: String,
}

impl ValidationError {
    pub fn from_validation_errors(errors: ValidationErrors) -> Self {
        let field_errors: Vec<ValidationFieldError> = errors
            .field_errors()
            .iter()
            .flat_map(|(field, errs)| {
                errs.iter().map(move |e| ValidationFieldError {
                    field: field.to_string(),
                    message: e.to_string(),
                })
            })
            .collect();
        Self {
            errors: field_errors,
        }
    }

    pub fn new(errors: Vec<ValidationFieldError>) -> Self {
        Self { errors }
    }
}

impl IntoResponse for ValidationError {
    fn into_response(self) -> Response {
        let body = serde_json::json!({
            "error": "validation_failed",
            "details": self.errors
        });
        (StatusCode::BAD_REQUEST, Json(body)).into_response()
    }
}

/// Allow `?` on a `validator::ValidationErrors` directly in handler code:
/// `value.validate()?;` → returns structured 400 on failure.
impl From<ValidationErrors> for ValidationError {
    fn from(errors: ValidationErrors) -> Self {
        Self::from_validation_errors(errors)
    }
}

// ── Validation middleware ────────────────────────────────────────────────────

/// Middleware that drains and speculatively-validates the JSON body of every
/// POST/PUT request whose Content-Type is `application/json`.
///
/// Behaviour:
/// - Passes through GET/DELETE/PATCH/OPTIONS bodies without inspection.
/// - If the body is not well-formed JSON or fails `Valdiate::validate()`,
///   returns a structured 400 immediately (handler is never called).
/// - On success, appends the parsed bytes back so the downstream handler's
///   normal `Json<T>` extractor still works.
///
/// Clean to wire: add `validate_middleware::<YourType>(req, next).await` as
/// a per-route `.layer(...)` anywhere public/write endpoints are registered.

pub async fn validate_middleware<T>(mut req: Request<Body>, next: Next) -> Response
where
    T: serde::de::DeserializeOwned + Validate + Send + Sync + 'static,
{
    if req.method().is_safe() {
        return next.run(req).await;
    }

    let content_type = req
        .headers()
        .get(axum::http::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !content_type.contains("application/json") {
        return next.run(req).await;
    }

    let body_bytes = match axum::body::to_bytes(req.body_mut(), usize::MAX).await {
        Ok(bytes) => bytes,
        Err(_) => {
            return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                "error": "validation_failed",
                "details": [ValidationFieldError {
                    field: "body".into(),
                    message: "unable to read request body".into(),
                }]
            })))
            .into_response();
        }
    };

    match serde_json::from_slice::<T>(&body_bytes) {
        Ok(value) => {
            if let Err(validation_errors) = value.validate() {
                let err: ValidationError = validation_errors.into();
                return err.into_response();
            }
        }
        Err(_) => {
            return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                "error": "validation_failed",
                "details": [ValidationFieldError {
                    field: "body".into(),
                    message: "invalid JSON body".into(),
                }]
            })))
            .into_response();
        }
    }

    *req.body_mut() = Body::from(body_bytes);
    next.run(req).await
}

// ── Typed validated-JSON body extractor ──────────────────────────────────────

use axum::extract::rejection::JsonRejection;
use axum::extract::FromRequest;

/// `ValidatedJson<T>` is a drop-in replacement for axum's `Json<T>` extractor.
/// It deserialises the body AND runs `Validate::validate()` before the handler
/// runs — no extra middleware required.
///
/// Returns a structured 400 with a `details` array (field + message pairs)
/// on failure, so clients can surface precise error messages per field.

pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: serde::de::DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = Response;

    async fn from_request(req: &mut Request<Body>, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state)
            .await
            .map_err(|e| e.into_response())?;

        value
            .validate()
            .map_err(|e| {
                let ve = ValidationError::from_validation_errors(e);
                ve.into_response()
            })?;

        Ok(ValidatedJson(value))
    }
}
