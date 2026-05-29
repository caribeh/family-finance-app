const { pool } = require('../config/database');

const ReminderConfig = {
  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM reminder_config WHERE workspace_id = $1',
      [workspaceId]
    );
    return result.rows[0];
  },

  async upsert(workspaceId, { emailRecipient, telegramChatId }) {
    const existing = await this.findByWorkspaceId(workspaceId);
    if (existing) {
      const fields = [];
      const values = [];
      let idx = 1;
      if (emailRecipient !== undefined) {
        fields.push(`email_recipient = $${idx++}`);
        values.push(emailRecipient);
      }
      if (telegramChatId !== undefined) {
        fields.push(`telegram_chat_id = $${idx++}`);
        values.push(telegramChatId);
      }
      if (fields.length === 0) return existing;
      values.push(workspaceId);
      const result = await pool.query(
        `UPDATE reminder_config SET ${fields.join(', ')}, updated_at = NOW() WHERE workspace_id = $${idx} RETURNING *`,
        values
      );
      return result.rows[0];
    }
    const result = await pool.query(
      `INSERT INTO reminder_config (workspace_id, email_recipient, telegram_chat_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [workspaceId, emailRecipient || null, telegramChatId || null]
    );
    return result.rows[0];
  },
};

module.exports = ReminderConfig;
