// The walkthrough's script: which real screen the phone shows, where it scrolls, what gets
// highlighted, and the headings, captions and floating cards around it. Times are seconds.
// Scroll values come from element positions recorded by capture.mjs, so they follow the real layout.

export default function timeline(m) {
  const A = (shot, name) => {
    const a = m.shots[shot].anchors[name];
    if (!a) throw new Error(`Missing anchor ${shot}.${name}`);
    return a;
  };
  /** Scroll so the element sits `from` app pixels below the top of the visible screen. */
  const at = (shot, name, from = 140) => Math.max(0, A(shot, name).y - from);
  const facts = m.facts;
  const phone = (t, o = {}) => ({ t, cx: 540, cy: 1000, s: 0.9, ry: 0, rx: 0, blur: 0, dim: 0, ...o });

  // Stage boundaries
  const T = { s1: 7, s2: 15.5, s3: 23, s4: 32.5, s5: 40.5, s6: 54, s7: 60, s8: 68, s9: 75.5, s10: 82.5, end: 88, duration: 94 };

  return {
    duration: T.duration,
    stages: T,
    screenOn: [3.3, 3.8],
    demoNote: [T.s1 + 0.5, T.end - 0.5],
    sweeps: [3.3, T.s1, T.s2, T.s3, T.s4, T.s5, T.s6, T.s7, T.s8, T.s9, T.s10, T.end],
    rings: [[3.2, 7.4], [T.end, T.duration]],

    phone: [
      phone(0, { cy: 1120, s: 0.82, ry: -34, rx: 10, dim: 0.85 }),
      phone(3.0, { cy: 1080, s: 0.84, ry: -28, rx: 8, dim: 0.55 }),
      phone(4.6, { cy: 1010, s: 0.9, ry: 0, rx: 2 }),
      phone(6.6, { cy: 1000, s: 0.9, ry: 6 }),
      phone(T.s1, {}),
      phone(T.s2 - 0.4, { ry: -4 }),
      phone(T.s2, {}),
      phone(T.s3, { ry: 3 }),
      phone(T.s4, {}),
      phone(T.s4 + 3.6, { cx: 680 }),
      phone(T.s4 + 7.4, { cx: 680 }),
      phone(T.s5, {}),
      phone(T.s5 + 6.6, {}),
      phone(T.s5 + 7.2, { s: 0.62, cy: 1060, blur: 6, dim: 0.5 }),
      phone(T.s5 + 10.6, { s: 0.62, cy: 1060, blur: 6, dim: 0.5 }),
      phone(T.s5 + 11.2, {}),
      phone(T.s6, { ry: -3 }),
      phone(T.s7, {}),
      phone(T.s8, { ry: 3 }),
      phone(T.s9, {}),
      phone(T.s10, { ry: -3 }),
      phone(T.end - 0.3, {}),
      phone(T.end + 1.6, { cy: 900, s: 0.78, ry: -14, rx: 4 }),
      phone(T.duration, { cy: 890, s: 0.78, ry: 10, rx: 3 }),
    ],

    // ---------- What the phone screen shows ----------
    screens: [
      { t0: 0, t1: T.s1, shot: "calc-0", scroll: [0] },
      // Stage 1: setup
      { t0: T.s1, t1: T.s1 + 1.4, shot: "setup-empty", scroll: [40] },
      { t0: T.s1 + 1.4, t1: T.s1 + 3.6, shot: "setup", scroll: [40], fade: 0.5 },
      { t0: T.s1 + 3.6, t1: T.s1 + 6, shot: "setup", scroll: [40, at("setup", "currency", 120)] },
      { t0: T.s1 + 6, t1: T.s2, shot: "setup", scroll: [at("setup", "currency", 120), at("setup", "signature", 120)], st0: T.s1 + 6, st1: T.s1 + 7 },
      // Stage 2: pricing
      { t0: T.s2, t1: T.s2 + 3, shot: "pricing", scroll: [40] },
      { t0: T.s2 + 3, t1: T.s3, shot: "pricing", scroll: [40, at("pricing", "carpet", 300)] },
      // Stage 3: define the job (each change is a real recalculation)
      { t0: T.s3, t1: T.s3 + 2, shot: "calc-0", scroll: [40] },
      { t0: T.s3 + 2, t1: T.s3 + 3.6, shot: "calc-0", scroll: [40, at("calc-0", "job", 30)] },
      { t0: T.s3 + 3.6, t1: T.s3 + 5.2, shot: "calc-1", scroll: [at("calc-1", "job", 30)] },
      { t0: T.s3 + 5.2, t1: T.s3 + 6.8, shot: "calc-2", scroll: [at("calc-2", "job", 30)] },
      { t0: T.s3 + 6.8, t1: T.s3 + 8.0, shot: "calc-3", scroll: [at("calc-3", "job", 30)] },
      { t0: T.s3 + 8.0, t1: T.s4, shot: "calc-4", scroll: [at("calc-4", "job", 30)] },
      // Stage 4: costs and the private breakdown
      { t0: T.s4, t1: T.s4 + 3.4, shot: "calc-4", scroll: [at("calc-4", "job", 30), at("calc-4", "costs", 40)], st1: T.s4 + 1 },
      { t0: T.s4 + 3.4, t1: T.s5, shot: "calc-4", scroll: [at("calc-4", "costs", 40), at("calc-4", "yourView", 60)], st1: T.s4 + 4.4 },
      // Stage 5: itemised quote → customer quote → share
      { t0: T.s5, t1: T.s5 + 3.2, shot: "calc-5", scroll: [at("calc-5", "services", 60)] },
      { t0: T.s5 + 3.2, t1: T.s5 + 5.2, shot: "calc-5", scroll: [at("calc-5", "services", 60), at("calc-5", "quote", 80)] },
      { t0: T.s5 + 5.2, t1: T.s5 + 11.2, shot: "calc-5", scroll: [at("calc-5", "quote", 80), at("calc-5", "total", 280)], st1: T.s5 + 6.6 },
      { t0: T.s5 + 11.2, t1: T.s6, shot: "calc-5", scroll: [at("calc-5", "total", 280), at("calc-5", "pdf", 420)], st1: T.s5 + 12 },
      // Stage 6: history and follow-up
      { t0: T.s6, t1: T.s7, shot: "history-sent", scroll: [0] },
      // Stage 7: invoice
      { t0: T.s7, t1: T.s7 + 3.6, shot: "invoice-form", scroll: [40, at("invoice-form", "payment", 60)], st1: T.s7 + 1.2 },
      { t0: T.s7 + 3.6, t1: T.s8, shot: "invoice", scroll: [at("invoice", "amountDue", 140)] },
      // Stage 8: delivery report
      { t0: T.s8, t1: T.s8 + 2.4, shot: "delivery-form", scroll: [at("delivery-form", "photos", 60)] },
      { t0: T.s8 + 2.4, t1: T.s9, shot: "delivery", scroll: [at("delivery", "report", 130), at("delivery", "review", 560)], st0: T.s8 + 4.6, st1: T.s8 + 5.6 },
      // Stage 9: dashboard
      { t0: T.s9, t1: T.s10, shot: "dashboard", scroll: [40, at("dashboard", "chart", 230)], st0: T.s9 + 4.4, st1: T.s9 + 5.6 },
      // Stage 10: proposals
      { t0: T.s10, t1: T.s10 + 2, shot: "proposal-home", scroll: [0] },
      { t0: T.s10 + 2, t1: T.end, shot: "proposal-1", scroll: [0, 260], st0: T.s10 + 3.2, st1: T.end },
      // Final: the customer quote total
      { t0: T.end, t1: T.duration, shot: "calc-5", scroll: [at("calc-5", "quote", 80)], fade: 0.6 },
    ],

    // ---------- Highlights on the real interface ----------
    highlights: [
      { t0: T.s1 + 1.6, t1: T.s1 + 3.4, anchor: "bizName", tap: true },
      { t0: T.s1 + 4.8, t1: T.s1 + 6, anchor: "currency", tap: true },
      { t0: T.s1 + 7.2, t1: T.s2 - 0.1, anchor: "sigName" },
      { t0: T.s2 + 0.6, t1: T.s2 + 2.9, anchor: "staffPay", h: 119 },
      { t0: T.s3 + 0.5, t1: T.s3 + 2, anchor: "client", h: 330 },
      { t0: T.s3 + 3.0, t1: T.s3 + 5.0, anchor: "type", tap: true },
      { t0: T.s3 + 5.0, t1: T.s3 + 6.6, anchor: "bed", dx: -48, w: 146, tap: true },
      { t0: T.s3 + 6.6, t1: T.s3 + 8.0, anchor: "staffNum", dx: -48, w: 146, tap: true },
      { t0: T.s3 + 8.0, t1: T.s4 - 0.1, anchor: "difficulty", tap: true },
      { t0: T.s4 + 1.1, t1: T.s4 + 2.2, anchor: "trans" },
      { t0: T.s4 + 2.2, t1: T.s4 + 3.4, anchor: "profit" },
      { t0: T.s5 + 0.4, t1: T.s5 + 3.1, anchor: "item1", h: 225, w: 330, dx: -11 },
      { t0: T.s5 + 6.8, t1: T.s5 + 7.3, anchor: "total", pad: 30 },
      { t0: T.s5 + 12.1, t1: T.s6 - 0.1, anchor: "pdf", w: 330 },
      { t0: T.s6 + 0.6, t1: T.s6 + 2.4, anchor: "card", w: 300, h: 100, dy: -6 },
      { t0: T.s6 + 2.4, t1: T.s7 - 0.1, anchor: "status", w: 300 },
      { t0: T.s7 + 1.3, t1: T.s7 + 3.5, anchor: "received", h: 196 },
      { t0: T.s7 + 3.9, t1: T.s7 + 5.6, anchor: "received", w: 290, h: 60, dx: 0, dy: -6 },
      { t0: T.s7 + 5.6, t1: T.s8 - 0.1, anchor: "balance", h: 80, dy: -30 },
      { t0: T.s8 + 0.3, t1: T.s8 + 2.3, anchor: "photos", h: 180 },
      { t0: T.s8 + 2.8, t1: T.s8 + 4.5, anchor: "gallery" },
      { t0: T.s8 + 5.8, t1: T.s9 - 0.1, anchor: "review", tap: true },
      { t0: T.s9 + 0.5, t1: T.s9 + 1.5, anchor: "quoted", h: 75, dy: -12 },
      { t0: T.s9 + 1.5, t1: T.s9 + 2.5, anchor: "won", h: 75, dy: -12 },
      { t0: T.s9 + 2.5, t1: T.s9 + 3.5, anchor: "revenue", h: 75, dy: -12 },
      { t0: T.s9 + 3.5, t1: T.s9 + 4.5, anchor: "outstanding", h: 75, dy: -12 },
      { t0: T.s10 + 0.6, t1: T.s10 + 1.9, anchor: "start", tap: true },
      { t0: T.s10 + 2.4, t1: T.s10 + 3.6, anchor: "corporate", tap: true },
    ],

    // ---------- Headings at the top ----------
    headings: [
      { t0: 0.5, t1: 3.3, title: "STOP GUESSING<br>YOUR <em>CLEANING PRICES.</em>" },
      { t0: 3.6, t1: T.s1 - 0.1, title: "MEET <em>CLEANING<br>CALCULATOR PRO</em>", size: 70 },
      { t0: T.s1, t1: T.s2 - 0.1, stage: "STAGE 01", title: "SET UP YOUR<br><em>BUSINESS</em>" },
      { t0: T.s2, t1: T.s3 - 0.1, stage: "STAGE 02", title: "SET YOUR<br><em>PRICES</em>" },
      { t0: T.s3, t1: T.s4 - 0.1, stage: "STAGE 03", title: "DEFINE THE<br><em>CLEANING JOB</em>" },
      { t0: T.s4, t1: T.s5 - 0.1, stage: "STAGE 04", title: "SEE EVERY<br><em>COST</em>" },
      { t0: T.s5, t1: T.s6 - 0.1, stage: "STAGE 05", title: "SEND A<br><em>PROFESSIONAL QUOTE</em>" },
      { t0: T.s6, t1: T.s7 - 0.1, stage: "STAGE 06", title: "FOLLOW UP<br><em>EVERY QUOTE</em>" },
      { t0: T.s7, t1: T.s8 - 0.1, stage: "STAGE 07", title: "INVOICE &amp;<br><em>GET PAID</em>" },
      { t0: T.s8, t1: T.s9 - 0.1, stage: "STAGE 08", title: "DELIVER &amp;<br><em>GET REVIEWS</em>" },
      { t0: T.s9, t1: T.s10 - 0.1, stage: "STAGE 09", title: "TRACK YOUR<br><em>BUSINESS</em>" },
      { t0: T.s10, t1: T.end - 0.1, stage: "STAGE 10", title: "WIN BIGGER<br><em>CONTRACTS</em>" },
      { t0: T.end, t1: T.duration, title: "PRICE WITH<br><em>CONFIDENCE.</em>" },
    ],

    // ---------- Captions under the phone ----------
    captions: [
      { t0: T.s1 + 0.4, t1: T.s1 + 4.4, text: "Your name, logo, phone &amp; currency", sub: "Set once. Used on every quote and invoice." },
      { t0: T.s1 + 4.6, t1: T.s2 - 0.2, text: "Bank details, terms &amp; signature", sub: "Added to your documents automatically" },
      { t0: T.s2 + 0.4, t1: T.s3 - 0.2, text: "Your own rates. <em style='font-style:normal;color:#FFC857'>For your eyes only.</em>", sub: "Staff pay, feeding, materials and equipment for each service" },
      { t0: T.s3 + 0.4, t1: T.s3 + 2.8, text: "Add the client's details" },
      { t0: T.s3 + 3.0, t1: T.s4 - 0.2, text: "Choose the job. Watch the price update.", sub: "Cleaning type · bedrooms · staff · difficulty" },
      { t0: T.s4 + 0.4, t1: T.s4 + 3.4, text: "Transport, overhead &amp; your profit" },
      { t0: T.s4 + 3.6, t1: T.s5 - 0.2, text: "Your private breakdown", sub: "Every cost and your profit, hidden from the customer" },
      { t0: T.s5 + 0.4, t1: T.s5 + 3.2, text: "Several services in one quote", sub: "Each with its own editable price" },
      { t0: T.s5 + 3.4, t1: T.s5 + 6.8, text: "A branded quotation, ready to send" },
      { t0: T.s5 + 11.4, t1: T.s6 - 0.2, text: "Save as PDF, share on WhatsApp,<br>or save to History" },
      { t0: T.s6 + 0.4, t1: T.s7 - 0.2, text: "Track every quote", sub: "Draft · Sent · Accepted · Lost, with follow-up dates and a WhatsApp follow-up button" },
      { t0: T.s7 + 0.4, t1: T.s7 + 3.6, text: "Load the quote. Record the payment." },
      { t0: T.s7 + 3.8, t1: T.s8 - 0.2, text: "The balance is worked out for you", sub: "Invoices are numbered and saved automatically" },
      { t0: T.s8 + 0.4, t1: T.s8 + 2.6, text: "Add before &amp; after photos" },
      { t0: T.s8 + 2.8, t1: T.s9 - 0.2, text: "A completion report for your client", sub: "Then ask for a review on WhatsApp in one tap" },
      { t0: T.s9 + 0.4, t1: T.s10 - 0.2, text: "Money quoted, jobs won, revenue &amp; balances", sub: "Plus follow-ups due and a 6-month revenue chart" },
      { t0: T.s10 + 0.4, t1: T.end - 0.2, text: "Commercial cleaning proposals", sub: "Guided questions → a professional A4 PDF" },
    ],

    // ---------- Opening problem cards ----------
    problems: [
      { t0: 0.6, t1: 3.4, left: 70, top: 700, text: "How much should I charge?", rot: -4, strike: 2.7 },
      { t0: 1.0, t1: 3.4, left: 380, top: 980, text: "Did I forget transport?", rot: 3, strike: 2.85 },
      { t0: 1.4, t1: 3.4, left: 110, top: 1250, text: "Is there any profit left?", rot: -2, strike: 3.0 },
    ],

    // ---------- Service-type chips (stage 2) ----------
    chips: [
      ["Regular", 40, 620], ["Deep", 810, 640], ["Post-Construction", 20, 790], ["Move-In / Out", 790, 810],
      ["Upholstery", 30, 960], ["Carpet", 840, 980], ["Fumigation", 40, 1130], ["Custom space", 790, 1150],
    ].map(([text, left, top], i) => ({ t0: T.s2 + 3.2 + i * 0.35, t1: T.s3 - 0.2, text, left, top, rot: i % 2 ? 3 : -3 })),

    // ---------- Floating cards cropped from the real screens ----------
    cards: [
      // Stage 4: the private breakdown pulled out of the phone
      { t0: T.s4 + 4.4, t1: T.s5 - 0.2, shot: "calc-4", anchor: "yourView", x: 20, y: -14, w: 350, h: 360, left: 40, top: 600, width: 470, tilt: 8, from: { x: 300, y: 200 }, tag: "YOUR VIEW" },
      // Stage 5: split screen. What you see vs what your customer sees
      { t0: T.s5 + 7.3, t1: T.s5 + 10.8, shot: "calc-5", anchor: "yourView", x: 20, y: -14, w: 350, h: 360, left: 30, top: 640, width: 490, tilt: 6, from: { x: 260, y: 120 }, tag: "YOU SEE" },
      { t0: T.s5 + 7.6, t1: T.s5 + 10.8, shot: "calc-5", anchor: "total", x: 20, y: -70, w: 350, h: 220, left: 560, top: 720, width: 490, tilt: -6, from: { x: -260, y: 120 }, tag: "CUSTOMER SEES", tagStyle: "background:#fff;color:#4b3fb0" },
      // Stage 8: before & after, enlarged
      { t0: T.s8 + 3.0, t1: T.s8 + 5.6, shot: "delivery", anchor: "gallery", x: 20, y: -36, w: 350, h: 210, left: 560, top: 560, width: 480, tilt: -6, from: { x: -240, y: 200 } },
      // Stage 9: dashboard tiles stacking beside the phone
      { t0: T.s9 + 0.7, t1: T.s10 - 0.3, shot: "dashboard", anchor: "quoted", x: 20, y: -26, w: 350, h: 104, left: 20, top: 560, width: 330, tilt: 8, from: { x: 200, y: 0 } },
      { t0: T.s9 + 1.7, t1: T.s10 - 0.3, shot: "dashboard", anchor: "won", x: 20, y: -26, w: 350, h: 104, left: 730, top: 700, width: 330, tilt: -8, from: { x: -200, y: 0 } },
      { t0: T.s9 + 2.7, t1: T.s10 - 0.3, shot: "dashboard", anchor: "revenue", x: 20, y: -26, w: 350, h: 104, left: 20, top: 1180, width: 330, tilt: 8, from: { x: 200, y: 0 } },
      { t0: T.s9 + 3.7, t1: T.s10 - 0.3, shot: "dashboard", anchor: "outstanding", x: 20, y: -26, w: 350, h: 104, left: 730, top: 1320, width: 330, tilt: -8, from: { x: -200, y: 0 } },
    ],

    // ---------- Text callouts ----------
    callouts: [
      { t0: T.s1 + 4.8, t1: T.s1 + 6.8, left: 700, top: 760, width: 340, text: "26 currencies", sub: "Naira, Cedi, Shilling, Rand and more" },
      { t0: T.s3 + 3.0, t1: T.s4 - 0.2, left: 690, top: 600, width: 370, big: true, text: facts["calc-0"].total, sub: "Live quote total", values: [
        { t: T.s3 + 3.0, text: facts["calc-0"].total },
        { t: T.s3 + 3.6, text: facts["calc-1"].total },
        { t: T.s3 + 5.2, text: facts["calc-2"].total },
        { t: T.s3 + 6.8, text: facts["calc-3"].total },
        { t: T.s3 + 8.0, text: facts["calc-4"].total },
      ] },
      { t0: T.s3 + 3.6, t1: T.s4 - 0.2, left: 20, top: 640, width: 290, text: "Deep Cleaning", sub: "Residential" },
      { t0: T.s3 + 5.2, t1: T.s4 - 0.2, left: 20, top: 820, width: 290, text: "3 bedrooms" },
      { t0: T.s3 + 6.8, t1: T.s4 - 0.2, left: 20, top: 960, width: 290, text: "3 staff" },
      { t0: T.s3 + 8.0, t1: T.s4 - 0.2, left: 20, top: 1100, width: 290, text: "Difficulty × 1.2", sub: "A harder job raises the staff cost" },
      { t0: T.s5 + 0.6, t1: T.s5 + 3.1, left: 720, top: 640, width: 330, big: true, text: facts["calc-5"].total, sub: "Deep Cleaning + Upholstery" },
      { t0: T.s7 + 4.0, t1: T.s8 - 0.3, left: 700, top: 640, width: 350, big: true, text: "₦222,300", sub: "Balance due, after ₦148,200 received" },
      { t0: T.s6 + 2.4, t1: T.s7 - 0.3, left: 720, top: 700, width: 330, text: "Follow-up reminders", sub: "Quotes due a follow-up get a red badge" },
    ],

    // ---------- Connector lines from cards to the phone ----------
    links: [
      { t0: T.s4 + 4.6, t1: T.s5 - 0.3, shot: "calc-4", anchor: "yourView", ax: 0, fx: 505, fy: 760 },
      { t0: T.s7 + 4.2, t1: T.s8 - 0.3, shot: "invoice", anchor: "balance", fx: 700, fy: 700 },
    ],

    hero: { t0: T.end + 1.0, top: 1350, name: "CLEANING", name2: "CALCULATOR PRO", sub: "Quotes · Invoices · Delivery reports · Dashboard · Proposals" },
  };
}
