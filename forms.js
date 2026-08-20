/**
 * forms.js
 *
 * Replaces every trace of EmailJS. Posts both forms to /api/form, which is
 * the Cloudflare Pages Function that talks to Resend.
 *
 * Load it AFTER the reCAPTCHA script in your HTML:
 *   <script src="forms.js"></script>
 *   <script src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit" async defer></script>
 *
 * Then delete from main.js:
 *   - the EmailJS <script> tag and emailjs.init(...) call
 *   - both emailjs.send(...) blocks
 *   - the DRY_RUN constant and every check that uses it
 *   - the old onRecaptchaLoad function and the two widget id variables
 */

// Public site key. Safe to expose. The SECRET key lives in Cloudflare, never here.
const RECAPTCHA_SITE_KEY = "6LcP9Y8tAAAAACu7BNaJObB8Gh_d4V1cXMmiSg4R";

const ENDPOINT = "/api/form";

let registrationRecaptchaWidgetId;
let contactRecaptchaWidgetId;

const FORM_CONFIG = [
  {
    id: "registrationForm",
    type: "registration",
    successId: "formSuccess",
    errorId: "formError",
    errorDetailId: "formErrorDetails",
    sendingLabel: "Sending application...",
    getWidgetId: () => registrationRecaptchaWidgetId,
    setWidgetId: (id) => {
      registrationRecaptchaWidgetId = id;
    }
  },
  {
    id: "contactForm",
    type: "contact",
    successId: "contactSuccess",
    errorId: "contactError",
    errorDetailId: "contactErrorDetails",
    sendingLabel: "Sending message...",
    getWidgetId: () => contactRecaptchaWidgetId,
    setWidgetId: (id) => {
      contactRecaptchaWidgetId = id;
    }
  }
];

// Called by the reCAPTCHA script once it loads. Must stay on window.
window.onRecaptchaLoad = function onRecaptchaLoad() {
  FORM_CONFIG.forEach((config) => {
    const form = document.getElementById(config.id);
    if (!form) return;

    const target = form.querySelector(".g-recaptcha");
    if (!target || target.childElementCount > 0) return;

    config.setWidgetId(
      grecaptcha.render(target, { sitekey: RECAPTCHA_SITE_KEY })
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
      typeof grecaptcha !== "undefined"
        ? grecaptcha.getResponse(widgetId)
        : "";

    if (!token) {
      if (errorDetail) {
        errorDetail.textContent = "Complete the reCAPTCHA and try again.";
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
      payload["g-recaptcha-response"] = token;

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
      if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset(config.getWidgetId());
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
