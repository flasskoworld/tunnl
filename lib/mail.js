// Sends the sign-in email via Resend (https://resend.com — free tier
// covers early volume). Every email carries both a tappable magic link
// and a 6-digit code — same trust model, two ways to use it. Swap the
// fetch target for any other provider (Postmark, SES); the shape here
// is intentionally minimal so that swap is a one-function change.
export async function sendMagicLink(email, link, code, { purchased = false } = {}) {
  const subject = purchased
    ? "Your Protocol is ready — sign in to TUNNL"
    : "Your TUNNL sign-in code";

  const intro = purchased
    ? "The Protocol is commissioned. Sign in to open it — priorities, the Vault, and the Ledger are unlocked."
    : "Sign in to TUNNL — tap the link, or enter the code on the page.";

  const body = `
    <p>${intro}</p>
    <p><a href="${link}">Open TUNNL →</a></p>
    <p style="font-size:20px;letter-spacing:4px;font-family:monospace;color:#2742C7">${code}</p>
    <p style="color:#2742C7;font-size:12px">The link and the code both expire in 10–15 minutes and can only be used once. If you didn't request this, ignore this email.</p>
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
