const cron = require('node-cron');
const BillReminder = require('../models/BillReminder');
const ReminderConfig = require('../models/ReminderConfig');
const { sendBillReminder } = require('./notificationService');

function initScheduler() {
  const time = process.env.NOTIFICATION_TIME || '08:00';
  const [hour, minute] = time.split(':').map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    console.log(`Invalid NOTIFICATION_TIME: ${time}, using 08:00`);
    hour = 8;
    minute = 0;
  }

  const cronExpr = `${minute} ${hour} * * *`;

  console.log(`Bill reminder scheduler set for ${time} daily (${cronExpr})`);

  cron.schedule(cronExpr, async () => {
    try {
      const today = new Date();
      const day = today.getDate();
      const reminders = await BillReminder.findActiveByDueDay(day);

      if (reminders.length === 0) {
        console.log(`No bill reminders due today (day ${day})`);
        return;
      }

      console.log(`Found ${reminders.length} bill reminder(s) due today`);

      for (const reminder of reminders) {
        const config = await ReminderConfig.findByWorkspaceId(reminder.workspace_id);
        await sendBillReminder(reminder, reminder.email, reminder.user_name, config);
      }
    } catch (err) {
      console.error('Bill reminder scheduler error:', err.message);
    }
  });
}

module.exports = { initScheduler };
