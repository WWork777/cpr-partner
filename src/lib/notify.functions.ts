import { createServerFn } from "@tanstack/react-start";

type ApplicationPayload = {
  name: string;
  phone: string;
  city?: string | null;
  message?: string | null;
  course_title?: string | null;
  page_url?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

export const notifyApplication = createServerFn({ method: "POST" })
  .validator((d: ApplicationPayload) => d)
  .handler(async ({ data }) => {
    if (!isEnabled(process.env.NOTIFICATIONS_ENABLED, true)) {
      return { ok: false, reason: "disabled" };
    }

    const settings = await getNotificationSettings();
    if (settings.enabled === false) {
      return { ok: false, reason: "disabled" };
    }

    const payload = normalizePayload(data);
    const results = await Promise.allSettled([
      sendTelegramNotification(payload),
      sendMailNotification(payload, settings.recipient),
    ]);

    const channels = {
      telegram: getSettledResult(results[0]),
      mail: getSettledResult(results[1]),
    };

    return {
      ok: channels.telegram.ok || channels.mail.ok,
      channels,
    };
  });

type NotifySettings = {
  enabled?: boolean;
  recipient?: string;
};

type NormalizedApplicationPayload = Required<ApplicationPayload>;

type NotifyChannelResult = {
  ok: boolean;
  reason?: string;
};

function normalizePayload(data: ApplicationPayload): NormalizedApplicationPayload {
  return {
    name: data.name.trim(),
    phone: data.phone.trim(),
    city: data.city?.trim() || "",
    message: data.message?.trim() || "",
    course_title: data.course_title?.trim() || "",
    page_url: data.page_url?.trim() || "",
    referrer: data.referrer?.trim() || "",
    utm_source: data.utm_source?.trim() || "",
    utm_medium: data.utm_medium?.trim() || "",
    utm_campaign: data.utm_campaign?.trim() || "",
  };
}

async function getNotificationSettings(): Promise<NotifySettings> {
  const envRecipient = process.env.MAIL_TO || process.env.NOTIFY_EMAIL_TO || "";
  const fallback: NotifySettings = {
    enabled: true,
    recipient: envRecipient,
  };

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return fallback;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: row } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "notifications")
      .maybeSingle();
    const value = (row?.value ?? {}) as NotifySettings;
    if (value.enabled === false) return { enabled: false, recipient: "" };
    return {
      enabled: value.enabled ?? true,
      recipient: value.recipient || envRecipient,
    };
  } catch (error) {
    console.error("getNotificationSettings error", error);
    return fallback;
  }
}

async function sendTelegramNotification(data: NormalizedApplicationPayload): Promise<NotifyChannelResult> {
  if (!isEnabled(process.env.TG_NOTIFICATIONS_ENABLED, true)) {
    return { ok: false, reason: "disabled" };
  }

  const proxyUrl = process.env.TG_PROXY_URL || "https://tg-proxy.parsikovevgenij470.workers.dev";
  const chatId = process.env.TG_CHAT_ID;
  const botToken = process.env.TG_BOT_TOKEN;
  if (!proxyUrl) return { ok: false, reason: "no_proxy_url" };
  if (!chatId) return { ok: false, reason: "no_chat_id" };

  const endpoint = getTelegramEndpoint(proxyUrl, botToken);
  const body = {
    chat_id: chatId,
    text: formatTelegramMessage(data),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.TG_PROXY_SECRET) {
    headers["X-TG-Proxy-Secret"] = process.env.TG_PROXY_SECRET;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("Telegram notify error", response.status, await response.text());
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Telegram notify exception", error);
    return { ok: false, reason: "exception" };
  }
}

async function sendMailNotification(
  data: NormalizedApplicationPayload,
  recipientFromSettings?: string,
): Promise<NotifyChannelResult> {
  if (!isEnabled(process.env.MAIL_NOTIFICATIONS_ENABLED, true)) {
    return { ok: false, reason: "disabled" };
  }

  const recipient = recipientFromSettings || process.env.MAIL_TO || process.env.NOTIFY_EMAIL_TO;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!recipient) return { ok: false, reason: "no_recipient" };
  if (!host) return { ok: false, reason: "no_smtp_host" };
  if (!user || !pass) return { ok: false, reason: "no_smtp_auth" };

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 465),
      secure: parseBoolean(process.env.SMTP_SECURE, true),
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: recipient,
      subject: `Новая заявка${data.course_title ? `: ${data.course_title}` : ""}`,
      text: formatPlainMessage(data),
      html: formatHtmlMessage(data),
    });

    return { ok: true };
  } catch (error) {
    console.error("Mail notify exception", error);
    return { ok: false, reason: "exception" };
  }
}

function getTelegramEndpoint(proxyUrl: string, botToken?: string) {
  const base = proxyUrl.replace(/\/+$/, "");
  if (/\/sendMessage$/i.test(base)) return base;
  if (botToken) return `${base}/bot${botToken}/sendMessage`;
  return base;
}

function formatTelegramMessage(data: NormalizedApplicationPayload) {
  return [
    "<b>Новая заявка с сайта ЦПР Партнер</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(data.name)}`,
    `<b>Телефон:</b> ${escapeHtml(data.phone)}`,
    data.city ? `<b>Город:</b> ${escapeHtml(data.city)}` : "",
    data.course_title ? `<b>Курс:</b> ${escapeHtml(data.course_title)}` : "",
    data.message ? `<b>Комментарий:</b>\n${escapeHtml(data.message)}` : "",
    data.page_url ? `<b>Страница:</b> ${escapeHtml(data.page_url)}` : "",
    formatUtmLine(data) ? `<b>UTM:</b> ${escapeHtml(formatUtmLine(data))}` : "",
  ].filter(Boolean).join("\n");
}

function formatPlainMessage(data: NormalizedApplicationPayload) {
  return [
    "Новая заявка с сайта ЦПР Партнер",
    "",
    `Имя: ${data.name}`,
    `Телефон: ${data.phone}`,
    data.city ? `Город: ${data.city}` : "",
    data.course_title ? `Курс: ${data.course_title}` : "",
    data.message ? `Комментарий:\n${data.message}` : "",
    data.page_url ? `Страница: ${data.page_url}` : "",
    data.referrer ? `Referrer: ${data.referrer}` : "",
    formatUtmLine(data) ? `UTM: ${formatUtmLine(data)}` : "",
  ].filter(Boolean).join("\n");
}

function formatHtmlMessage(data: NormalizedApplicationPayload) {
  return `
    <h2>Новая заявка с сайта ЦПР Партнер</h2>
    <p><b>Имя:</b> ${escapeHtml(data.name)}</p>
    <p><b>Телефон:</b> ${escapeHtml(data.phone)}</p>
    ${data.city ? `<p><b>Город:</b> ${escapeHtml(data.city)}</p>` : ""}
    ${data.course_title ? `<p><b>Курс:</b> ${escapeHtml(data.course_title)}</p>` : ""}
    ${data.message ? `<p><b>Комментарий:</b><br>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>` : ""}
    ${data.page_url ? `<p><b>Страница:</b> ${escapeHtml(data.page_url)}</p>` : ""}
    ${data.referrer ? `<p><b>Referrer:</b> ${escapeHtml(data.referrer)}</p>` : ""}
    ${formatUtmLine(data) ? `<p><b>UTM:</b> ${escapeHtml(formatUtmLine(data))}</p>` : ""}
  `.trim();
}

function formatUtmLine(data: NormalizedApplicationPayload) {
  return [
    data.utm_source ? `source=${data.utm_source}` : "",
    data.utm_medium ? `medium=${data.utm_medium}` : "",
    data.utm_campaign ? `campaign=${data.utm_campaign}` : "",
  ].filter(Boolean).join(", ");
}

function getSettledResult(result: PromiseSettledResult<NotifyChannelResult>): NotifyChannelResult {
  if (result.status === "fulfilled") return result.value;
  console.error("notify channel rejected", result.reason);
  return { ok: false, reason: "exception" };
}

function isEnabled(value: string | undefined, defaultValue: boolean) {
  if (value == null || value === "") return defaultValue;
  return parseBoolean(value, defaultValue);
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value == null) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
