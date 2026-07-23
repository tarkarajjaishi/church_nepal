use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
        let secret_key = std::env::var("STRIPE_SECRET_KEY").unwrap_or_default();
        Self::new(secret_key)
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
            .post(format!("https://api.stripe.com{}", path))
            .basic_auth(&self.secret_key, Some(""))
            .form(params)
            .send()
            .await
            .map_err(StripeError::Request)
    }

    pub async fn create_checkout_session(
        &self,
        amount_cents: i64,
        currency: &str,
        donor_email: &str,
        donation_id: &str,
        success_url: &str,
        cancel_url: &str,
    ) -> Result<StripeCheckoutSession, StripeError> {
        let mut params = HashMap::new();
        params.insert("success_url", format!("{}?donation_id={}", success_url, donation_id));
        params.insert("cancel_url", format!("{}?donation_id={}", cancel_url, donation_id));
        params.insert("payment_method_types[0]", "card");
        params.insert("line_items[0][price_data][currency]", currency.to_string());
        params.insert(
            "line_items[0][price_data][product_data][name]",
            "Church Donation",
        );
        params.insert(
            "line_items[0][price_data][unit_amount]",
            amount_cents.to_string(),
        );
        params.insert("line_items[0][quantity]", "1");
        params.insert("mode", "payment");
        params.insert("customer_email", donor_email.to_string());
        params.insert("metadata[donation_id]", donation_id.to_string());

        let resp = self.post("/v1/checkout/sessions", &params).await?;
        let session: StripeCheckoutSession = resp.json().await?;
        Ok(session)
    }

    pub async fn verify_payment(
        &self,
        session_id: &str,
    ) -> Result<StripeVerifyResponse, StripeError> {
        let resp = self
            .get(&format!("/v1/checkout/sessions/{}", session_id))
            .await?;
        let session: StripeCheckoutSession = resp.json().await?;
        Ok(StripeVerifyResponse {
            id: session.id,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
        })
    }

    pub async fn create_subscription(
        &self,
        customer_id: &str,
        amount_cents: i64,
        interval: &str,
    ) -> Result<StripeSubscription, StripeError> {
        #[derive(Serialize)]
        struct CreateProduct {
            name: String,
        }
        let product = self
            .post("/v1/products", &CreateProduct { name: "Recurring Donation".to_string() })
            .await?
            .json::<StripeProduct>()
            .await?;

        #[derive(Serialize)]
        struct CreatePrice {
            product: String,
            unit_amount: i64,
            currency: String,
            recurring: StripePriceRecurring,
        }
        let price = self
            .post("/v1/prices", &CreatePrice {
                product: product.id,
                unit_amount: amount_cents,
                currency: "usd".to_string(),
                recurring: StripePriceRecurring { interval: interval.to_string() },
            })
            .await?
            .json::<StripePrice>()
            .await?;

        #[derive(Serialize)]
        struct CreateSub {
            customer: String,
            items: Vec<StripeSubItem>,
        }
        let sub = self
            .post("/v1/subscriptions", &CreateSub {
                customer: customer_id.to_string(),
                items: vec![StripeSubItem { price: price.id }],
            })
            .await?
            .json::<StripeSubscription>()
            .await?;
        Ok(sub)
    }

    pub async fn cancel_subscription(
        &self,
        subscription_id: &str,
    ) -> Result<StripeSubscription, StripeError> {
        let resp = self
            .post(&format!("/v1/subscriptions/{}/cancel", subscription_id), &())
            .await?;
        let sub: StripeSubscription = resp.json().await?;
        Ok(sub)
    }

    pub async fn subscription_status(
        &self,
        subscription_id: &str,
    ) -> Result<String, StripeError> {
        let resp = self
            .get(&format!("/v1/subscriptions/{}", subscription_id))
            .await?;
        let sub: StripeSubscription = resp.json().await?;
        Ok(sub.status)
    }

    pub async fn refund_payment(
        &self,
        payment_intent_id: &str,
        amount_cents: Option<i64>,
    ) -> Result<StripeRefund, StripeError> {
        #[derive(Serialize)]
        struct RefundParams {
            payment_intent: String,
            amount: Option<i64>,
        }
        let resp = self
            .post("/v1/refunds", &RefundParams {
                payment_intent: payment_intent_id.to_string(),
                amount: amount_cents,
            })
            .await?;
        let refund: StripeRefund = resp.json().await?;
        Ok(refund)
    }
}

impl StripeClient {
    async fn get(&self, path: &str) -> Result<reqwest::Response, StripeError> {
        self.client
            .get(format!("https://api.stripe.com{}", path))
            .basic_auth(&self.secret_key, Some(""))
            .send()
            .await
            .map_err(StripeError::Request)
    }
}

#[derive(Debug, Serialize)]
pub struct StripePriceRecurring {
    pub interval: String,
}

#[derive(Debug, Serialize)]
pub struct StripeSubItem {
    pub price: String,
}

#[derive(Debug, Deserialize)]
pub struct StripeProduct {
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct StripePrice {
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct StripeSubscription {
    pub id: String,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct StripeRefund {
    pub id: String,
    pub status: String,
    pub amount: i64,
}

#[derive(Debug, Deserialize)]
pub struct StripeCheckoutSession {
    pub id: String,
    pub url: String,
    pub payment_status: String,
    pub amount_total: Option<i64>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug)]
pub struct StripeVerifyResponse {
    pub id: String,
    pub payment_status: String,
    pub amount_total: Option<i64>,
}

#[derive(Debug)]
pub enum StripeError {
    Request(reqwest::Error),
}

impl std::fmt::Display for StripeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StripeError::Request(e) => write!(f, "stripe request error: {}", e),
        }
    }
}

impl std::error::Error for StripeError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            StripeError::Request(e) => Some(e),
        }
    }
}

impl From<reqwest::Error> for StripeError {
    fn from(e: reqwest::Error) -> Self {
        StripeError::Request(e)
    }
}
