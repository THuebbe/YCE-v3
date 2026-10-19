-- The customer's display as they saw it at booking (Review step capture,
-- Vercel Blob), shown in their confirmation email and the Order Summary PDF.
alter table orders add column if not exists display_image_url text;
