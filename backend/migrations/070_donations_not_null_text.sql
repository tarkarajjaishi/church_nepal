-- Fix: GET /donations and GET /donations/export-csv returned 500 for every
-- request, on every tenant, for as long as any refunded donation existed.
--
-- `donations.gateway_refund_id` is nullable, but `models::Donation` declares it
-- `String`. sqlx refuses to decode NULL into a non-Option, so the whole list
-- endpoint failed with "unexpected null; try decoding as an `Option`" — a 500
-- that no test covered because the offering module has its own tables and
-- nobody was reading the legacy donations list.
--
-- `notes` and `refund_reason` are the same shape and were one NULL away from
-- the identical failure, so all three are fixed together rather than only the
-- column that happened to blow up.
--
-- NOT NULL DEFAULT '' rather than `Option<String>` in the model: every other
-- table in this schema treats "no text" as the empty string, and a client that
-- has to distinguish null from "" for a refund reference has been handed a
-- distinction that means nothing.

UPDATE donations SET gateway_refund_id = '' WHERE gateway_refund_id IS NULL;
UPDATE donations SET notes = '' WHERE notes IS NULL;
UPDATE donations SET refund_reason = '' WHERE refund_reason IS NULL;

ALTER TABLE donations
    ALTER COLUMN gateway_refund_id SET DEFAULT '',
    ALTER COLUMN gateway_refund_id SET NOT NULL,
    ALTER COLUMN notes SET DEFAULT '',
    ALTER COLUMN notes SET NOT NULL,
    ALTER COLUMN refund_reason SET DEFAULT '',
    ALTER COLUMN refund_reason SET NOT NULL;
