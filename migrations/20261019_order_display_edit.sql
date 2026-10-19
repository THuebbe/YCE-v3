-- Milestone 5: agencies edit an order's display (message, name, style,
-- colors, theme) until the signs go out.

-- What the customer chose, so the edit form starts from it. Orders from
-- before this only have message/message_text/theme.
alter table orders add column if not exists display_config jsonb;
