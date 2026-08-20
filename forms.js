/**
 * forms.js
 *
 * Replaces every trace of EmailJS. Posts both forms to /api/form, which is
 * the Cloudflare Pages Function that talks to Resend.
 *
 * Load it BEFORE the Turnstile script in your HTML:
 *   <script src="forms.js"></script>
 *   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit" async defer></script>
 *
 * Then delete from main.js:
 *   - every EmailJS script tag, init call and send block
 */

// Public site key. Safe to expose. The SECRET key lives in Cloudflare, never here.
const TURNSTILE_SITE_KEY = "0x4AAAAAAEWzaAlIsbpIv2MQ";

const ENDPOINT = "/api/form";

let registrationWidgetId;
let contactWidgetId;

const FORM_CONFIG = [
  {
    id: "registrationForm",
    type: "registration",
    successId: "formSuccess",
    errorId: "formError",
    errorDetailId: "formErrorDetails",
    sendingLabel: "Sending application...",
    getWidgetId: () => registrationWidgetId,
    setWidgetId: (id) => {
      registrationWidgetId = id;
    }
  },
  {
    id: "contactForm",
    type: "contact",
    successId: "contactSuccess",
    errorId: "contactError",
    errorDetailId: "contactErrorDetails",
    sendingLabel: "Sending message...",
    getWidgetId: () => contactWidgetId,
    setWidgetId: (id) => {
      contactWidgetId = id;
    }
  }
];

// Called by the Turnstile script once it loads. Must stay on window.
window.onTurnstileLoad = function onTurnstileLoad() {
  FORM_CONFIG.forEach((config) => {
    const form = document.getElementById(config.id);
    if (!form) return;

    const target = form.querySelector(".cf-turnstile");
    if (!target || target.childElementCount > 0) return;

    config.setWidgetId(
      turnstile.render(target, { sitekey: TURNSTILE_SITE_KEY })
    );
  });
};

function show(el) {
  if (el) el.classList.remove("hidden");
}

function hide(el) {
  if (el) el.classList.add("hidden");
}

function collect(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function attach(config) {
  const form = document.getElementById(config.id);
  if (!form) return;

  const success = document.getElementById(config.successId);
  const error = document.getElementById(config.errorId);
  const errorDetail = document.getElementById(config.errorDetailId);
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    hide(success);
    hide(error);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const widgetId = config.getWidgetId();
    const token =
      typeof turnstile !== "undefined" ? turnstile.getResponse(widgetId) : "";

    if (!token) {
      if (errorDetail) {
        errorDetail.textContent =
          "Wait for the verification check to finish, then try again.";
      }
      show(error);
      return;
    }

    const originalLabel = button ? button.innerHTML : "";
    if (button) {
      button.disabled = true;
      button.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> ' + config.sendingLabel;
    }

    try {
      const payload = collect(form);
      payload.formType = config.type;
      payload["cf-turnstile-response"] = token;

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({ ok: false }));

      if (response.ok && result.ok) {
        form.reset();
        show(success);
        setTimeout(
          () => success && success.scrollIntoView({ behavior: "smooth" }),
          100
        );
      } else {
        if (errorDetail) {
          errorDetail.textContent =
            result.error || "Something went wrong. Please try again.";
        }
        show(error);
      }
    } catch (err) {
      console.error("Form submission failed:", err);
      if (errorDetail) {
        errorDetail.textContent =
          "Check your internet connection and try again.";
      }
      show(error);
    } finally {
      if (typeof turnstile !== "undefined") {
        turnstile.reset(config.getWidgetId());
      }
      if (button) {
        button.disabled = false;
        button.innerHTML = originalLabel;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  FORM_CONFIG.forEach(attach);
});
