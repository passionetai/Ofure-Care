/**
 * POST /api/form
 *
 * Single endpoint for both the registration and contact forms.
 * The browser sends JSON with a `formType` of "registration" or "contact".
 *
 * Required environment variables (set as SECRETS in the Cloudflare dashboard):
 *   RESEND_API_KEY   re_xxxxxxxxxxxx
 *   TURNSTILE_SECRET the secret key from Cloudflare Turnstile
 *   CONTACT_INBOX    where notifications land, e.g. ofurecare.enquiries@gmail.com
 *   MAIL_FROM        e.g. Ofure Care Website <noreply@ofurecare.com>
 *
 * Nothing in this file is site-specific, so the same file works on both
 * ofurecare.com and ofureorphanage.com. Only the env vars differ.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CAPTCHA_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_FIELD_LENGTH = 5000;

const FORMS = {
  registration: {
    subject: (d) => `Training application: ${d.fullName}`,
    required: ["fullName", "email", "phone"],
    layout: [
      ["fullName", "Full name"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["education", "Highest education"],
      ["motivation", "Why they want to train"]
    ]
  },
  contact: {
    subject: (d) => `Website enquiry: ${d.name || d.fullName || "no name given"}`,
    required: ["email", "message"],
    layout: [
      ["name", "Name"],
      ["fullName", "Full name"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["subject", "Subject"],
      ["message", "Message"]
    ]
  }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[ch])
  );
}

function buildHtml(config, data, meta) {
  const rows = config.layout
    .filter(([key]) => String(data[key] || "").trim())
    .map(
      ([key, label]) => `
        <tr>
          <td style="padding:10px 20px 10px 0;vertical-align:top;font-weight:600;
                     color:#1e3d59;white-space:nowrap;border-bottom:1px solid #eee;">
            ${label}
          </td>
          <td style="padding:10px 0;color:#333;border-bottom:1px solid #eee;">
            ${escapeHtml(data[key]).replace(/\n/g, "<br>")}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#1e3d59;margin:0 0 6px;">${config.subject(data)}</h2>
      <p style="color:#777;font-size:13px;margin:0 0 20px;">
        Submitted from ${escapeHtml(meta.host)} on ${escapeHtml(meta.time)}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        ${rows}
      </table>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        Reply to this email to respond directly to the sender.
      </p>
    </div>
  `;
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "We could not read that submission." }, 400);
  }

  const config = FORMS[data.formType];
  if (!config) {
    return json({ ok: false, error: "Unknown form." }, 400);
  }

  // Honeypot. Bots fill hidden fields, people do not.
  // Return success so the bot has no signal that it was caught.
  if (data.website) {
    return json({ ok: true });
  }

  const missing = config.required.filter(
    (field) => !String(data[field] || "").trim()
  );
  if (missing.length) {
    return json({ ok: false, error: "Fill in every required field." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
    return json({ ok: false, error: "Enter a valid email address." }, 400);
  }

  const tooLong = Object.values(data).some(
    (value) => typeof value === "string" && value.length > MAX_FIELD_LENGTH
  );
  if (tooLong) {
    return json({ ok: false, error: "That submission is too long." }, 400);
  }

  // Verify Turnstile server side. Doing this in the browser proves nothing.
  const token = data["cf-turnstile-response"] || "";

  let captcha = null;
  let captchaError = null;
  try {
    captcha = await fetch(CAPTCHA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET || "",
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || ""
      })
    }).then((r) => r.json());
  } catch (err) {
    captchaError = String(err);
    console.error("Turnstile request failed:", err);
  }

  if (!captcha || captcha.success !== true) {
    console.error("Turnstile rejected:", JSON.stringify(captcha));
    // TEMPORARY DIAGNOSTICS - remove the `debug` block once this works
    return json(
      {
        ok: false,
        error: "Verification failed. Please try again.",
        debug: {
          secretPresent: Boolean(env.TURNSTILE_SECRET),
          secretLength: (env.TURNSTILE_SECRET || "").length,
          tokenPresent: Boolean(token),
          tokenLength: token.length,
          fetchError: captchaError,
          cloudflareSaid: captcha
        }
      },
      400
    );
  }

  const meta = {
    host: new URL(request.url).hostname,
    time: new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })
  };

  const send = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.CONTACT_INBOX],
      reply_to: data.email,
      subject: config.subject(data),
      html: buildHtml(config, data, meta)
    })
  });

  if (!send.ok) {
    // Shows up in the Cloudflare dashboard under Functions real-time logs.
    console.error("Resend rejected the send:", send.status, await send.text());
    return json(
      {
        ok: false,
        error:
          "We could not send that just now. Please try again, or call us on +234 706 235 4224."
      },
      502
    );
  }

  return json({ ok: true });
}
