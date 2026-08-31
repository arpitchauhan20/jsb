const menuBtn = document.querySelector(".menu-btn");
const mobileNav = document.querySelector(".mobile-nav");
if (menuBtn && mobileNav) {
  const setOpen = (open) => {
    mobileNav.classList.toggle("open", open);
    menuBtn.classList.toggle("open", open);
    menuBtn.classList.toggle("active", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuBtn.innerHTML = open ? "&times;" : "&#9776;";
    document.body.classList.toggle("nav-open", open);
  };
  menuBtn.addEventListener("click", () => {
    setOpen(!mobileNav.classList.contains("open"));
  });
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) setOpen(false);
  });
}

document.querySelectorAll("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(target * p) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const form = document.querySelector("#service-form");
if (form) {
  const formStartTime = Date.now();
  const note = form.querySelector(".form-note");
  const btn = form.querySelector("[type=submit]");
  const googleScriptUrl = (form.dataset.googleScriptUrl || window.__GOOGLE_CONTACT_SCRIPT_URL__ || "").trim();
  const gsSecret = (form.dataset.gsSecret || window.__GS_CONTACT_SECRET__ || "").trim();
  const contactApi = (form.dataset.contactApi || window.__CONTACT_API_URL__ || "/api/contact").trim();
  const hasGoogleScript = Boolean(googleScriptUrl && gsSecret);

  const setStatus = (message, state) => {
    if (!note) return;
    note.textContent = message;
    note.className = "form-note" + (state ? " " + state : "");
    note.hidden = !message;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const botcheck = (formData.get("botcheck") || "").toString().trim();
    if (botcheck !== "") {
      setStatus("Thank you! Your message was sent. We will reply soon.", "ok");
      form.reset();
      return;
    }

    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      phone: (formData.get("phone") || "").toString().trim(),
      service: (formData.get("service") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim()
    };

    if (btn) btn.disabled = true;
    setStatus("Sending…", "pending");

    try {
      let sent = false;

      // 1. Try serverless backend /api/contact if available
      try {
        const res = await fetch(contactApi, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const resData = await res.json();
          if (resData && resData.success === true) {
            sent = true;
          }
        }
      } catch (apiErr) {
        console.warn("API endpoint unavailable, attempting direct delivery:", apiErr);
      }

      // 2. Direct delivery to Google Apps Script if API route was not used or failed
      if (!sent && googleScriptUrl) {
        const dataToSend = {
          token: gsSecret,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          service: payload.service,
          message: payload.message
        };

        const formParams = new URLSearchParams(dataToSend);
        await fetch(googleScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formParams.toString()
        });
        sent = true;
      }

      if (sent) {
        setStatus("Thank you! Your message was sent. We will reply soon.", "ok");
        form.reset();
      } else {
        setStatus("Something went wrong. Please call +1 403-909-4626 or try again.", "err");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setStatus("Something went wrong. Please call +1 403-909-4626 or try again.", "err");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// Register PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("ServiceWorker registration failed:", err);
    });
  });
}

