async function sendEmail(to, subject, text) {
  const nodemailer = require('nodemailer');

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !pass) {
    console.log('Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS env vars.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587'),
      secure: port === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
    });

    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return false;
  }
}

async function sendTelegram(message, chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) {
    console.log('Telegram not configured.');
    return false;
  }

  try {
    const ids = chatId.split(',').map((s) => s.trim()).filter(Boolean);
    console.log(`Sending Telegram to ${ids.length} chat ID(s): ${ids.join(', ')}`);
    let allOk = true;

    for (const id of ids) {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: id,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error(`Telegram API error for chat ${id}:`, err);
          allOk = false;
        } else {
          console.log(`Telegram sent to chat ${id}`);
        }
      } catch (innerErr) {
        console.error(`Telegram request failed for chat ${id}:`, innerErr.message);
        allOk = false;
      }
    }

    return allOk;
  } catch (err) {
    console.error('Failed to send Telegram:', err.message);
    return false;
  }
}

async function sendBillReminder(reminder, userEmail, userName, config) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR');
  const subject = `Lembrete: ${reminder.name} vence hoje!`;
  const text = `Ola ${userName},\n\nLembrete de conta a pagar:\n\n${reminder.name} - vence hoje (dia ${reminder.due_day})\n\nData: ${dateStr}\n\nAtenciosamente,\nFamily Finance`;
  const telegramMessage = `<b>${subject}</b>\n\nConta: ${reminder.name}\nVencimento: dia ${reminder.due_day}\nData: ${dateStr}`;

  let sentEmail = false;
  let sentTelegram = false;

  const emailTo = config?.email_recipient || userEmail;
  if (emailTo) {
    sentEmail = await sendEmail(emailTo, subject, text);
  }

  if (process.env.TELEGRAM_BOT_TOKEN && config?.telegram_chat_id) {
    sentTelegram = await sendTelegram(telegramMessage, config.telegram_chat_id);
  }

  return { sentEmail, sentTelegram };
}

async function sendTestNotification(emailRecipient, telegramChatId, userName) {
  const subject = 'Teste de notificacao - Family Finance';
  const text = `Ola ${userName},\n\nEsta e uma mensagem de teste do Family Finance.\nSe voce recebeu este e-mail, as notificacoes estao configuradas corretamente!\n\nAtenciosamente,\nFamily Finance`;
  const telegramMessage = `<b>${subject}</b>\n\n${text}`;

  let sentEmail = false;
  let sentTelegram = false;

  if (emailRecipient) {
    sentEmail = await sendEmail(emailRecipient, subject, text);
  }

  if (telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
    sentTelegram = await sendTelegram(telegramMessage, telegramChatId);
  }

  return { sentEmail, sentTelegram };
}

module.exports = { sendEmail, sendTelegram, sendBillReminder, sendTestNotification };
