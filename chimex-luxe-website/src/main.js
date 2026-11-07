// Mobile menu
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}

// Click tracking: WhatsApp, phone and other key actions. Sends to GA4 when it is configured.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el) return;
  const detail = { event_category: "lead", event_label: el.dataset.label || location.pathname, page_path: location.pathname };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: el.dataset.track, ...detail });
  if (typeof window.gtag === "function") window.gtag("event", el.dataset.track, detail);
});

// Gallery filters
const filters = document.querySelector(".filters");
if (filters) {
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const cat = b.dataset.cat;
    document.querySelectorAll(".mosaic figure").forEach((f) => { f.hidden = cat !== "all" && f.dataset.cat !== cat; });
  });
}

// Lightbox
const box = document.querySelector("dialog.lightbox");
if (box) {
  const img = box.querySelector("img");
  const cap = box.querySelector("p");
  document.querySelectorAll("[data-full]").forEach((b) => b.addEventListener("click", () => {
    img.src = b.dataset.full; img.alt = b.dataset.alt; cap.textContent = b.dataset.alt;
    box.showModal();
  }));
  box.querySelector(".x").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
}

// Enquiry form → opens WhatsApp with the details filled in (the enquiry is delivered as a WhatsApp message).
const form = document.getElementById("enquiry");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const err = form.querySelector(".err");
    const name = (f.get("name") || "").trim();
    const phone = (f.get("phone") || "").trim();
    if (!name || !phone) { err.textContent = "Please enter your name and phone number."; return; }
    err.textContent = "";
    const lines = [
      "Hello Chimexprime Global Ventures, I'd like a quotation.",
      `Name: ${name}`,
      `Phone: ${phone}`,
      f.get("email") ? `Email: ${f.get("email")}` : "",
      `Service: ${f.get("service")}`,
      f.get("location") ? `Project location: ${f.get("location")}` : "",
      f.get("details") ? `Details: ${f.get("details")}` : "",
      "(I will send photos of the space in this chat.)",
    ].filter(Boolean);
    const url = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "form_submit", form: "enquiry", service: f.get("service") });
    if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form: "enquiry", service: f.get("service") });
    window.location.href = url;
  });
}
