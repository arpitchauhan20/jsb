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
    const botcheck = (formData.get("botcheck") || formData.get("_honey") || "").toString().trim();
    const website = (formData.get("website") || "").toString().trim();
    if (botcheck !== "" || website !== "") {
      return;
    }

    if (Date.now() - formStartTime < 1200) {
      return;
    }

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      service: formData.get("service"),
      message: formData.get("message")
    };

    if (btn) btn.disabled = true;
    setStatus("Sending…", "pending");

    try {
      if (hasGoogleScript) {
        await new Promise((resolve, reject) => {
          const iframe = document.createElement("iframe");
          const iframeName = `gs_contact_${Date.now()}`;
          iframe.name = iframeName;
          iframe.setAttribute("aria-hidden", "true");
          iframe.style.cssText = "position:absolute;width:0;height:0;border:0;clip:rect(0,0,0,0);visibility:hidden";
          document.body.appendChild(iframe);

          const hiddenForm = document.createElement("form");
          hiddenForm.method = "POST";
          hiddenForm.action = googleScriptUrl;
          hiddenForm.target = iframeName;
          hiddenForm.enctype = "application/x-www-form-urlencoded";
          hiddenForm.style.display = "none";

          const dataToSend = {
            token: gsSecret,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            service: payload.service,
            message: payload.message
          };

          Object.entries(dataToSend).forEach(([key, val]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = val == null ? "" : String(val);
            hiddenForm.appendChild(input);
          });

          document.body.appendChild(hiddenForm);

          let finished = false;
          const timer = window.setTimeout(() => {
            if (!finished) {
              finished = true;
              cleanup();
              reject(new Error("timeout"));
            }
          }, 30000);

          const cleanup = () => {
            window.clearTimeout(timer);
            iframe.remove();
            hiddenForm.remove();
          };

          const onDone = () => {
            if (!finished) {
              finished = true;
              cleanup();
              resolve();
            }
          };

          iframe.addEventListener("load", function onInitialLoad() {
            iframe.removeEventListener("load", onInitialLoad);
            iframe.addEventListener("load", onDone);
            hiddenForm.submit();
          });
          iframe.src = "about:blank";
        });

        setStatus("Thank you! Your message was sent. We will reply soon.", "ok");
        form.reset();
      } else {
        const res = await fetch(contactApi, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        let resData = {};
        try { resData = await res.json(); } catch {}
        if (res.ok && resData.success !== false) {
          setStatus("Thank you! Your message was sent. We will reply soon.", "ok");
          form.reset();
        } else {
          setStatus(resData.message || "Something went wrong. Please call +1 403-909-4626 or try again.", "err");
        }
      }
    } catch (err) {
      setStatus("Network error. Please call +1 403-909-4626 or try again.", "err");
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

