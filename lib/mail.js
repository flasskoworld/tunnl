// Sends a single-use sign-in link via Resend. Swap the
// fetch target for any other provider (Postmark, SES); the shape here
// is intentionally minimal so that swap is a one-function change.
export async function sendMagicLink(email, link, { purchased = false } = {}) {
  const subject = purchased
    ? "Your TUNNL Starter workspace is ready"
    : "Sign in to TUNNL";

  const intro = purchased
    ? "Starter is ready. Sign in to open your 14-Day Plan, Decision Tools, and Sprint Report."
    : "Use the secure link below to sign in to TUNNL.";

  const body = `
    <p>${intro}</p>
    <p><a href="${link}">Open TUNNL →</a></p>
    <p style="color:#2742C7;font-size:12px">This single-use link expires in 15 minutes. If you didn't request it, ignore this email.</p>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "TUNNL <onboarding@resend.dev>",
        to: [email],
        subject,
        html: body,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend send failed:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Mail send error:", e);
    return false;
  }
}
