ALTER TABLE daily_control DROP CONSTRAINT IF EXISTS daily_control_payment_method_check;
ALTER TABLE daily_control ADD CHECK (payment_method IN ('credit_card', 'benefit_card', 'pix', 'transfer'));
