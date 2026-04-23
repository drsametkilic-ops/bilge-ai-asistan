/**
 * WhatsApp Cloud API — ortam: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 * @param {string} to E.164 benzeri (ülke kodu ile)
 * @param {string} text
 */
export async function sendWhatsAppText(to, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    console.warn("[whatsapp] WHATSAPP_ACCESS_TOKEN veya WHATSAPP_PHONE_NUMBER_ID eksik");
    return false;
  }
  const digits = String(to).replace(/\D/g, "");
  if (!digits) return false;

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: digits,
      type: "text",
      text: { body: String(text).slice(0, 4096) },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[whatsapp] send failed:", res.status, errText);
    return false;
  }
  return true;
}
