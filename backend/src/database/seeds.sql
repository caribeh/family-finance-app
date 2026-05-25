-- Seed data for development/testing

-- Insert two users (password for both is "123456")
INSERT INTO users (name, email, password_hash, weekly_budget_limit) VALUES
  ('Usuario', 'user@test.com', '$2b$10$LJ3m4ys3Lk8ZqKqKqKqKqO5ZqKqKqKqKqKqKqKqKqKqKqKqKqKq', 300.00),
  ('Esposa', 'wife@test.com', '$2b$10$LJ3m4ys3Lk8ZqKqKqKqKqO5ZqKqKqKqKqKqKqKqKqKqKqKqKqKq', 250.00);

-- Note: The password hash above is a placeholder. Use the registration endpoint to create real users with proper bcrypt hashes.
