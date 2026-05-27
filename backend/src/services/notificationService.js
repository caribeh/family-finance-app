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

async function sendTelegram(message, botToken, chatId) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const id = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !id) {
    console.log('Telegram not configured.');
    return false;
  }

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
      console.error('Telegram API error:', err);
      return false;
    }

    console.log('Telegram message sent');
    return true;
  } catch (err) {
    console.error('Failed to send Telegram:', err.message);
    return false;
  }
}

async function sendBillReminder(reminder, userEmail, userName, config) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR');
  const subject = `Lembrete: ${reminder.name} vence hoje!`;
  const text = `Olá ${userName},\n\nLembrete de conta a pagar:\n\n${reminder.name} - vence hoje (dia ${reminder.due_day})\n\nData: ${dateStr}\n\nAtenciosamente,\nFamily Finance`;
  const telegramMessage = `<b>${subject}</b>\n\nConta: ${reminder.name}\nVencimento: dia ${reminder.due_day}\nData: ${dateStr}`;

  let sentEmail = false;
  let sentTelegram = false;

  const emailTo = config?.email_recipient || userEmail;
  if (emailTo) {
    sentEmail = await sendEmail(emailTo, subject, text);
  }

  if (config?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN) {
    sentTelegram = await sendTelegram(telegramMessage, config?.telegram_bot_token, config?.telegram_chat_id);
  }

  return { sentEmail, sentTelegram };
}

async function sendTestNotification(emailRecipient, telegramBotToken, telegramChatId, userName) {
  const subject = 'Teste de notificacao - Family Finance';
  const text = `Olá ${userName},\n\nEsta é uma mensagem de teste do Family Finance.\nSe você recebeu este e-mail, as notificações estão configuradas corretamente!\n\nAtenciosamente,\nFamily Finance`;
  const telegramMessage = `<b>${subject}</b>\n\n${text}`;

  let sentEmail = false;
  let sentTelegram = false;

  if (emailRecipient) {
    sentEmail = await sendEmail(emailRecipient, subject, text);
  }

  if (telegramBotToken && telegramChatId) {
    sentTelegram = await sendTelegram(telegramMessage, telegramBotToken, telegramChatId);
  }

  return { sentEmail, sentTelegram };
}

module.exports = { sendEmail, sendTelegram, sendBillReminder, sendTestNotification };
