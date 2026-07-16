use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct EsewaConfig {
    pub merchant_id: String,
    pub secret_key: String,
    pub base_url: String,
}

impl EsewaConfig {
    pub fn from_env() -> Self {
        Self {
            merchant_id: std::env::var("ESEWA_MERCHANT_ID").unwrap_or_default(),
            secret_key: std::env::var("ESEWA_SECRET_KEY").unwrap_or_default(),
            base_url: std::env::var("ESEWA_BASE_URL")
                .unwrap_or_else(|_| "https://uat.esewa.com.np".to_string()),
        }
    }
}

pub fn build_payment_url(
    config: &EsewaConfig,
    donation_id: &str,
    amount: i64,
    _product_service: &str,
    _product_delivery_charge: i64,
    _product_tax_charge: i64,
) -> String {
    format!(
        "{}/epay/main?url=http://localhost:3000/give/success?donation_id={}&amt={}&pid={}&scd={}&su=http://localhost:3002/api/donations/callback/esewa?donation_id={}",
        config.base_url, donation_id, amount, donation_id, config.merchant_id, donation_id
    )
}

pub fn verify_signature(params: &EsewaCallback, secret: &str) -> bool {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;
    type HmacSha256 = Hmac<Sha256>;

    let msg = format!("total_amount={},transaction_uuid={},product_code={}", params.amt, params.oid, "EPAYTEST");
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(msg.as_bytes());
    let result = mac.finalize();
    let computed = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &result.into_bytes());
    computed == params.ref_id
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EsewaCallback {
    pub oid: String,
    pub amt: String,
    #[serde(rename = "refId")]
    pub ref_id: String,
    #[serde(rename = "refId2")]
    pub ref_id2: Option<String>,
}
