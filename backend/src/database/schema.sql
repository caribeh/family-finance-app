CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (only the admin who logs in)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    theme VARCHAR(10) NOT NULL DEFAULT 'light',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Members (family members without login)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_role VARCHAR(50) NOT NULL DEFAULT 'Membro',
    monthly_budget_limit DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    account_type VARCHAR(20) NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings')),
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credit Cards
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    name VARCHAR(50) NOT NULL,
    brand VARCHAR(30),
    credit_limit DECIMAL(10,2) NOT NULL CHECK (credit_limit > 0),
    available_limit DECIMAL(10,2) NOT NULL CHECK (available_limit >= 0),
    closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Benefit Cards
CREATE TABLE benefit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Meal Vouchers
CREATE TABLE meal_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    monthly_credit DECIMAL(10,2) NOT NULL CHECK (monthly_credit > 0),
    available_balance DECIMAL(10,2) NOT NULL CHECK (available_balance >= 0),
    credit_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fixed Incomes
CREATE TABLE fixed_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fixed Expenses
CREATE TABLE fixed_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    category VARCHAR(50) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'meal_voucher', 'pix', 'debit')),
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Debts
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    creditor_debtor VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    paid_installments INTEGER NOT NULL DEFAULT 0 CHECK (paid_installments >= 0),
    start_date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('debt', 'loan')),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credit Card Expenses
CREATE TABLE credit_card_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    installment_amount DECIMAL(10,2) NOT NULL CHECK (installment_amount > 0),
    total_installments INTEGER NOT NULL DEFAULT 1 CHECK (total_installments > 0),
    current_installment INTEGER NOT NULL DEFAULT 1 CHECK (current_installment > 0),
    establishment VARCHAR(100),
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Meal Voucher Expenses
CREATE TABLE meal_voucher_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_voucher_id UUID NOT NULL REFERENCES meal_vouchers(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    establishment VARCHAR(100),
    expense_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Daily Expenses (legacy)
CREATE TABLE daily_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'meal_voucher')),
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    meal_voucher_id UUID REFERENCES meal_vouchers(id) ON DELETE SET NULL,
    paid_by VARCHAR(10) NOT NULL CHECK (paid_by IN ('user', 'wife')),
    category VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Daily Control (unified)
CREATE TABLE daily_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'meal_voucher')),
    description VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'benefit_card', 'pix', 'transfer')),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    meal_voucher_id UUID REFERENCES meal_vouchers(id) ON DELETE SET NULL,
    benefit_card_id UUID REFERENCES benefit_cards(id) ON DELETE SET NULL,
    category VARCHAR(50),
    source VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Investments
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    institution VARCHAR(100),
    applied_amount DECIMAL(10,2) NOT NULL CHECK (applied_amount > 0),
    current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    application_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Debt Payments
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    daily_control_id UUID REFERENCES daily_control(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bill Reminders
CREATE TABLE bill_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reminder config (per workspace notification settings)
CREATE TABLE reminder_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    email_recipient VARCHAR(255),
    telegram_chat_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_members_workspace ON members(workspace_id);
CREATE INDEX idx_bank_accounts_workspace ON bank_accounts(workspace_id);
CREATE INDEX idx_bank_accounts_member ON bank_accounts(member_id);
CREATE INDEX idx_credit_cards_workspace ON credit_cards(workspace_id);
CREATE INDEX idx_credit_cards_member ON credit_cards(member_id);
CREATE INDEX idx_meal_vouchers_workspace ON meal_vouchers(workspace_id);
CREATE INDEX idx_fixed_incomes_workspace ON fixed_incomes(workspace_id);
CREATE INDEX idx_fixed_expenses_workspace ON fixed_expenses(workspace_id);
CREATE INDEX idx_debts_workspace ON debts(workspace_id);
CREATE INDEX idx_cc_expenses_workspace ON credit_card_expenses(workspace_id);
CREATE INDEX idx_mv_expenses_workspace ON meal_voucher_expenses(workspace_id);
CREATE INDEX idx_daily_expenses_workspace ON daily_expenses(workspace_id);
CREATE INDEX idx_daily_control_workspace ON daily_control(workspace_id);
CREATE INDEX idx_daily_control_member ON daily_control(member_id);
CREATE INDEX idx_daily_control_date ON daily_control(date);
CREATE INDEX idx_investments_workspace ON investments(workspace_id);
CREATE INDEX idx_debt_payments_workspace ON debt_payments(workspace_id);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX idx_benefit_cards_workspace ON benefit_cards(workspace_id);
CREATE INDEX idx_benefit_cards_member ON benefit_cards(member_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_vouchers_updated_at BEFORE UPDATE ON meal_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_incomes_updated_at BEFORE UPDATE ON fixed_incomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixed_expenses_updated_at BEFORE UPDATE ON fixed_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cc_expenses_updated_at BEFORE UPDATE ON credit_card_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mv_expenses_updated_at BEFORE UPDATE ON meal_voucher_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_expenses_updated_at BEFORE UPDATE ON daily_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_control_updated_at BEFORE UPDATE ON daily_control FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_benefit_cards_updated_at BEFORE UPDATE ON benefit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
