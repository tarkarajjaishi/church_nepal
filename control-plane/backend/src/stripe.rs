use hmac::{Hmac, Mac};
use reqwest::Client;
use serde::Serialize;
use sha2::Sha256;
use std::env;

#[derive(Clone)]
pub struct StripeClient {
    client: Client,
    secret_key: String,
}

impl StripeClient {
    pub fn new(secret_key: impl Into<String>) -> Self {
        Self {
            client: Client::new(),
            secret_key: secret_key.into(),
        }
    }

    pub fn from_env() -> Self {
        let secret_key = env::var("STRIPE_SECRET_KEY").unwrap_or_default();
        Self::new(secret_key)
    }

    pub fn secret_key(&self) -> &str {
        &self.secret_key
    }

    pub fn enabled(&self) -> bool {
        !self.secret_key.is_empty()
    }

    async fn post<T: Serialize>(
        &self,
        path: &str,
        params: &T,
    ) -> Result<reqwest::Response, StripeError> {
        self.client
            .post(format!("https://api.stripe.com{path}"))
            .basic_auth(&self.secret_key, Some(""))
            .form(params)
            .send()
            .await
            .map_err(StripeError::Request)
    }

    pub async fn create_customer(
        &self,
        email: &str,
        name: Option<&str>,
    ) -> Result<StripeCustomer, StripeError> {
        #[derive(Serialize)]
        struct Params {
            email: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            name: Option<String>,
        }
        let resp = self
            .post("/v1/customers", &Params {
                email: email.to_string(),
                name: name.map(|s| s.to_string()),
            })
            .await?;
        let customer: StripeCustomer = resp.json().await?;
        Ok(customer)
    }

    pub async fn create_payment_intent(
        &self,
        amount_cents: i64,
        currency: &str,
        customer_id: Option<&str>,
    ) -> Result<StripePaymentIntent, StripeError> {
        #[derive(Serialize)]
        struct Params {
            amount: i64,
            currency: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            customer: Option<String>,
        }
        let resp = self
            .post("/v1/payment_intents", &Params {
                amount: amount_cents,
                currency: currency.to_string(),
                customer: customer_id.map(|s| s.to_string()),
            })
            .await?;
        let intent: StripePaymentIntent = resp.json().await?;
        Ok(intent)
    }

    pub async fn create_checkout_session(
        &self,
        params: &CreateCheckoutSessionParams,
    ) -> Result<StripeCheckoutSession, StripeError> {
        let resp = self
            .post("/v1/checkout/sessions", params)
            .await?;
        let session: StripeCheckoutSession = resp.json().await?;
        Ok(session)
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeCustomer {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripePaymentIntent {
    pub id: String,
    pub status: String,
    pub amount: i64,
    pub currency: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeCheckoutSession {
    pub id: String,
    pub url: Option<String>,
}

#[derive(Debug, serde::Serialize)]
pub struct CreateCheckoutSessionParams {
    pub mode: String,
    pub success_url: String,
    pub cancel_url: String,
    pub line_items: Vec<CreateCheckoutSessionLineItem>,
}

#[derive(Debug, serde::Serialize)]
pub struct CreateCheckoutSessionLineItem {
    pub price_data: CreateCheckoutSessionPriceData,
    pub quantity: i64,
}

#[derive(Debug, serde::Serialize)]
pub struct CreateCheckoutSessionPriceData {
    pub currency: String,
    pub product_data: CreateCheckoutSessionProductData,
    pub unit_amount: i64,
    pub recurring: CreateCheckoutSessionRecurring,
}

#[derive(Debug, serde::Serialize)]
pub struct CreateCheckoutSessionProductData {
    pub name: String,
}

#[derive(Debug, serde::Serialize)]
pub struct CreateCheckoutSessionRecurring {
    pub interval: String,
}

#[derive(Debug)]
pub enum StripeError {
    Request(reqwest::Error),
    Webhook(String),
}

impl std::fmt::Display for StripeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StripeError::Request(e) => write!(f, "stripe request error: {}", e),
            StripeError::Webhook(e) => write!(f, "stripe webhook error: {}", e),
        }
    }
}

impl std::error::Error for StripeError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            StripeError::Request(e) => Some(e),
            StripeError::Webhook(_) => None,
        }
    }
}

impl From<reqwest::Error> for StripeError {
    fn from(e: reqwest::Error) -> Self {
        StripeError::Request(e)
    }
}

pub fn verify_webhook(payload: &[u8], signature_header: &str, secret: &str) -> Result<(), StripeError> {
    let mut timestamp = None;
    let mut v1_signature = None;

    for part in signature_header.split(',') {
        let mut kv = part.split('=');
        let key = kv.next();
        let value = kv.next();
        match (key, value) {
            (Some("t"), Some(ts)) => timestamp = Some(ts),
            (Some("v1"), Some(sig)) => v1_signature = Some(sig),
            _ => {}
        }
    }

    let timestamp = timestamp
        .ok_or_else(|| StripeError::Webhook("missing timestamp in signature".into()))?;
    let v1_signature = v1_signature
        .ok_or_else(|| StripeError::Webhook("missing v1 signature".into()))?;

    let signed_payload = std::str::from_utf8(payload)
        .map_err(|_| StripeError::Webhook("invalid payload encoding".into()))?;
    let signed_payload = format!("{}.{}", timestamp, signed_payload);

    let mut mac =
        Hmac::<Sha256>::new_from_slice(secret.as_bytes())
            .map_err(|_| StripeError::Webhook("invalid secret length".into()))?;
    mac.update(signed_payload.as_bytes());
    let computed = mac.finalize();
    let computed_bytes = computed.into_bytes();

    let expected_bytes = hex::decode(v1_signature)
        .map_err(|_| StripeError::Webhook("invalid signature hex".into()))?;

    if computed_bytes.as_slice() == expected_bytes.as_slice() {
        Ok(())
    } else {
        Err(StripeError::Webhook("signature mismatch".into()))
    }
}
