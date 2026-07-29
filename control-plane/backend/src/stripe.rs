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

    pub async fn create_billing_portal_session(
        &self,
        customer_id: &str,
        return_url: &str,
    ) -> Result<StripeBillingPortalSession, StripeError> {
        #[derive(Serialize)]
        struct Params {
            customer: String,
            return_url: String,
        }
        let resp = self
            .post("/v1/billing_portal/sessions", &Params {
                customer: customer_id.to_string(),
                return_url: return_url.to_string(),
            })
            .await?;
        let session: StripeBillingPortalSession = resp.json().await?;
        Ok(session)
    }

    pub async fn list_invoices(
        &self,
        customer_id: Option<&str>,
        limit: i32,
    ) -> Result<Vec<StripeInvoice>, StripeError> {
        #[derive(Serialize)]
        struct Params {
            customer: Option<String>,
            limit: i32,
        }
        let resp = self
            .post("/v1/invoices", &Params {
                customer: customer_id.map(|s| s.to_string()),
                limit,
            })
            .await?;
        let list: StripeInvoiceListResponse = resp.json().await?;
        Ok(list.data)
    }

    pub async fn list_subscriptions(
        &self,
        customer_id: Option<&str>,
        status: Option<&str>,
        limit: i32,
    ) -> Result<Vec<StripeSubscription>, StripeError> {
        #[derive(Serialize)]
        struct Params {
            customer: Option<String>,
            status: Option<String>,
            limit: i32,
        }
        let resp = self
            .post("/v1/subscriptions", &Params {
                customer: customer_id.map(|s| s.to_string()),
                status: status.map(|s| s.to_string()),
                limit,
            })
            .await?;
        let list: StripeSubscriptionListResponse = resp.json().await?;
        Ok(list.data)
    }

    pub async fn refund_payment(
        &self,
        payment_intent_id: &str,
        amount: Option<i64>,
    ) -> Result<StripeRefund, StripeError> {
        #[derive(Serialize)]
        struct Params {
            payment_intent: String,
            amount: Option<i64>,
        }
        let resp = self
            .post(
                "/v1/refunds",
                &Params {
                    payment_intent: payment_intent_id.to_string(),
                    amount,
                },
            )
            .await?;
        let refund: StripeRefund = resp.json().await?;
        Ok(refund)
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeBillingPortalSession {
    pub id: String,
    pub url: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeInvoice {
    pub id: String,
    pub amount_due: i64,
    pub amount_paid: i64,
    pub status: String,
    pub invoice_pdf: Option<String>,
    pub period_start: i64,
    pub period_end: i64,
    pub created: i64,
    pub customer: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeInvoiceListResponse {
    pub data: Vec<StripeInvoice>,
    pub has_more: bool,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeSubscription {
    pub id: String,
    pub customer: String,
    pub status: String,
    pub current_period_start: i64,
    pub current_period_end: i64,
    pub cancel_at_period_end: bool,
    pub canceled_at: Option<i64>,
    pub cancel_at: Option<i64>,
    pub plan: Option<StripeSubscriptionPlan>,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeSubscriptionPlan {
    pub id: Option<String>,
    pub amount: Option<i64>,
    pub interval: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeSubscriptionListResponse {
    pub data: Vec<StripeSubscription>,
    pub has_more: bool,
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

#[derive(Debug, serde::Deserialize)]
pub struct StripeRefund {
    pub id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct StripeRefund {
    pub id: String,
    pub amount: i64,
    pub currency: String,
    pub status: String,
    pub payment_intent: String,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stripe_client_new() {
        let client = StripeClient::new("sk_test_123");
        assert_eq!(client.secret_key(), "sk_test_123");
        assert!(client.enabled());
    }

    #[test]
    fn test_stripe_client_from_env() {
        std::env::set_var("STRIPE_SECRET_KEY", "sk_env_key");
        let client = StripeClient::from_env();
        assert_eq!(client.secret_key(), "sk_env_key");
        assert!(client.enabled());
        std::env::remove_var("STRIPE_SECRET_KEY");
    }

    #[test]
    fn test_stripe_client_disabled_when_empty() {
        let client = StripeClient::new("");
        assert!(!client.enabled());
        std::env::set_var("STRIPE_SECRET_KEY", "");
        let client2 = StripeClient::from_env();
        assert!(!client2.enabled());
        std::env::remove_var("STRIPE_SECRET_KEY");
    }

    // Note: Testing the HTTP client methods would require mocking; omitted for brevity.
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_stripe_client_new() {
        let client = StripeClient::new("sk_test_123");
        assert_eq!(client.secret_key(), "sk_test_123");
        assert!(client.enabled());
    }

    #[test]
    fn test_stripe_client_from_env() {
        env::set_var("STRIPE_SECRET_KEY", "sk_live_from_env");
        let client = StripeClient::from_env();
        assert_eq!(client.secret_key(), "sk_live_from_env");
        assert!(client.enabled());
        env::remove_var("STRIPE_SECRET_KEY");
        let client = StripeClient::from_env();
        assert_eq!(client.secret_key(), "");
        assert!(!client.enabled());
    }

    #[test]
    fn test_verify_webhook_valid() {
        // This test mirrors the example from Stripe docs.
        let secret = "whsec_12345";
        let payload = b"{\"id\":\"evt_123\"}";
        // We need to generate a timestamp and a signature.
        // We'll use the same algorithm as the function.
        use std::time::{SystemTime, UNIX_EPOCH};
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_secs();
        let signed_payload = format!("{}.{}", timestamp, std::str::from_utf8(payload).unwrap());
        // Compute HMAC SHA256
        use hmac::{Hmac, Mac};
        type HmacSha256 = Hmac<Sha256>;
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(signed_payload.as_bytes());
        let result = mac.finalize();
        let signature = hex::encode(result.into_bytes());
        let header = format!("t={},v1={}", timestamp, signature);

        assert!(verify_webhook(payload, &header, secret).is_ok());
    }

    #[test]
    fn test_verify_webhook_invalid_signature() {
        let payload = b"{}";
        let header = "t=12345,v1=invalidsig";
        let secret = "whsec_12345";
        assert!(verify_webhook(payload, header, secret).is_err());
    }

    // Note: Testing the async HTTP client methods would require mocking.
    // We can use mockall to mock reqwest::Client, but for brevity we skip.
    // The important thing is that the logic is covered by the above tests.
}
