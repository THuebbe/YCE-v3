-- Customers cancel their own booking from a link in the confirmation email
-- (they have no accounts). The link carries the order id and this random
-- token; orders from before this have none, so no link.
alter table orders add column if not exists cancel_token text;
