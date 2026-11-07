// All business facts in one place. Anything marked TODO must be confirmed by the client before launch.
export const site = {
  // The live domain. Used for canonical URLs, sitemap and schema.
  url: "https://chimexprime.com.ng",
  brand: "Chimex Luxe Marble & Interiors",
  brandShort: "Chimex Luxe",
  legalName: "Chimexprime Global Ventures", // name on the Google Business Profile
  phoneDisplay: "+234 706 934 1675",
  phoneHref: "tel:+2347069341675",
  whatsapp: "2347069341675",
  street: "Alafia Street",
  locality: "Ajeromi-Ifelodun",
  region: "Lagos State",
  postalCode: "102103",
  country: "NG",
  mapQuery: "Chimexprime Global Ventures, Alafia St, Ajeromi-Ifelodun, Lagos 102103",
  // TODO: paste the Google Business Profile share link (Google Maps → Share) when available.
  googleBusinessUrl: "",
  facebookUrl: "", // TODO: the Facebook page "Chimexprime Global Ventures" link, if wanted
  email: "", // TODO: business email, if any
  // Analytics: leave empty until the client creates them. Nothing loads while empty.
  ga4Id: "",
  gscVerification: "",
};

export const wa = (msg) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`;
export const WA_GENERAL = "Hello, I found your website and would like to enquire about your marble, granite and quartz services.";

// Genuine Google reviews (copied from the Google Business Profile, Nov 2026). Only add real reviews here.
export const reviews = [
  { name: "Kamorudeen Raheem", text: "Very satisfactory.", source: "Google review", stars: 5 },
  { name: "Olaleye Samuel", text: "Great product and service, he didn't stress me, I had some corrections afterwards but he delivered great work.", source: "Google review", stars: 5 },
  { name: "Eletu Hamed", text: "Reasonable price.", source: "Google review", stars: 5 },
];

// Real project photos. Materials are NOT named until the client confirms them.
export const photos = {
  "black-stone-kitchen-island": { alt: "Kitchen with black stone countertops, a matching island top and dark cabinets with gold handles", cat: "kitchens" },
  "white-kitchen-black-countertop": { alt: "White kitchen cabinets with black stone countertops and a black island top", cat: "kitchens" },
  "l-shaped-kitchen-white-countertops": { alt: "L-shaped kitchen with white stone countertops and an island, installed by Chimex Luxe", cat: "kitchens" },
  "white-countertop-and-backsplash": { alt: "White stone kitchen countertop with a matching stone backsplash", cat: "kitchens" },
  "grey-stone-l-shaped-countertop": { alt: "Light grey veined stone countertop fitted around an L-shaped kitchen", cat: "kitchens" },
  "grey-veined-stone-island": { alt: "Kitchen island with a light grey veined stone top", cat: "kitchens" },
  "white-countertop-upstand-dark-cabinets": { alt: "White stone countertop with a matching upstand on dark kitchen cabinets", cat: "kitchens" },
  "white-countertop-sink-run": { alt: "White stone countertop with an undermount sink beneath a kitchen window", cat: "kitchens" },
  "white-l-shaped-countertop-dark-cabinets": { alt: "L-shaped white stone countertop with upstands on dark cabinets", cat: "kitchens" },
  "undermount-sink-cutout": { alt: "Stone countertop with a precise cut-out for an undermount black sink", cat: "fabrication" },
  "hob-cutout-countertop": { alt: "Stone countertop cut to fit a built-in gas hob", cat: "fabrication" },
  "installer-cutting-countertop": { alt: "Chimex Luxe installer cutting a white stone countertop on site", cat: "fabrication" },
  "polishing-countertop-edge": { alt: "Installer polishing the edge of a white stone island countertop", cat: "fabrication" },
  "island-countertop-fitting": { alt: "White stone countertop being fitted on a kitchen island", cat: "fabrication" },
  "stone-bathroom-vanity-top": { alt: "White veined stone bathroom vanity top with an undermount basin and upstand", cat: "bathrooms" },
  "white-stone-tombstone": { alt: "White stone grave monument with an engraved headstone, cross and white pebble infill", cat: "monuments" },
};

export const galleryCats = [
  { id: "kitchens", label: "Kitchen countertops" },
  { id: "fabrication", label: "Fabrication & installation" },
  { id: "bathrooms", label: "Bathroom vanity tops" },
  { id: "monuments", label: "Tombstones & monuments" },
];

const faqCost = { q: "How much will my countertop cost?", a: "Every job is priced on its own measurements. The final price depends on the stone you choose, the total length and depth of the worktops, the number of cut-outs (sink, hob, tap holes), edge details, backsplashes, and access to the site. Send us your kitchen measurements or photos on WhatsApp and we will prepare a quotation." };
const faqVisit = { q: "Can you come and measure?", a: "Yes. Send us your location on WhatsApp and we will arrange a time to inspect the space and take accurate measurements before fabrication." };

export const services = [
  {
    slug: "marble-kitchen-countertops-lagos",
    nav: "Marble Kitchen Countertops",
    h1: "Marble Kitchen Countertops in Lagos",
    title: "Marble Kitchen Countertops in Lagos | Chimex Luxe",
    meta: "Elegant marble kitchen countertops and kitchen marble tops, fabricated and installed in Lagos. See our work and request a quotation on WhatsApp.",
    keyword: "marble kitchen countertops",
    secondary: ["kitchen marble tops", "marble countertops in Lagos", "custom marble countertops"],
    wa: "Hello, I found your website and I'm interested in marble kitchen countertops. Please send me information and a quotation.",
    images: ["l-shaped-kitchen-white-countertops", "white-countertop-and-backsplash", "polishing-countertop-edge"],
    intro: "Nothing changes the feel of a kitchen like a marble countertop. The natural veining, the cool smooth surface and the way it catches the light make every kitchen look finished and expensive. We supply, cut and install marble kitchen tops that are measured for your space and finished by hand on site.",
    sections: [
      ["Why homeowners choose marble", "<p>Marble is a natural stone, so no two slabs are the same. That is exactly why people love it: your kitchen top will have its own pattern. A well-finished marble countertop works with modern flat-panel cabinets as well as classic designs, and it pairs beautifully with matching marble backsplashes.</p><p>Marble is softer than granite and reacts to acids such as lemon juice and vinegar, so it needs a little care. We explain how to protect and clean it when we hand over the job, so your countertop keeps its beauty.</p>"],
      ["What is included", "<ul><li>Site inspection and accurate measurement</li><li>Help choosing a slab and finish that suits your kitchen</li><li>Fabrication: cutting to size, edge profiling and polishing</li><li>Cut-outs for sinks, hobs and taps</li><li>Installation, levelling and joint finishing</li><li>Matching marble backsplashes on request</li></ul>"],
    ],
    benefits: ["Unique natural veining in every slab", "A bright, luxurious look", "Cool, smooth surface for baking and pastry", "Pairs with matching backsplashes and islands"],
    applications: ["Kitchen worktops", "Kitchen islands", "Backsplashes", "Breakfast bars"],
    faqs: [
      { q: "Is marble a good choice for a Nigerian kitchen?", a: "Yes, as long as you are happy to care for it. Marble is beautiful but can etch with acidic foods and stain if spills are left for long. Wiping spills quickly and using a suitable sealer keeps it looking good. If you cook heavily every day and want minimal care, we may also suggest granite or quartz." },
      faqCost, faqVisit,
    ],
    related: ["granite-kitchen-countertops-lagos", "quartz-kitchen-countertops-lagos", "kitchen-countertop-installation-lagos"],
  },
  {
    slug: "granite-kitchen-countertops-lagos",
    nav: "Granite Kitchen Countertops",
    h1: "Granite Kitchen Countertops in Lagos",
    title: "Granite Kitchen Countertops in Lagos | Chimex Luxe",
    meta: "Durable granite kitchen countertops and granite kitchen tops for Lagos homes. Fabrication and installation, with real project photos. Get a quote on WhatsApp.",
    keyword: "granite kitchen countertops",
    secondary: ["granite kitchen tops in Lagos", "granite countertop installation", "granite fabrication"],
    wa: "Hello, I am interested in your granite kitchen countertop services in Lagos. I would like to request a quotation.",
    images: ["black-stone-kitchen-island", "white-kitchen-black-countertop", "grey-veined-stone-island"],
    intro: "Granite is the hard-working choice for busy kitchens. It stands up well to daily cooking, hot pots and heavy use, and it comes in deep blacks, speckled greys and dramatic patterns. We fabricate and install granite kitchen tops that are cut precisely for your cabinets, sink and hob.",
    sections: [
      ["Built for real cooking", "<p>Granite is one of the hardest natural stones used for worktops. It resists scratches and everyday wear, which makes it popular in Nigerian homes where the kitchen is used heavily. Dark granites hide marks well, while lighter granites keep a kitchen bright.</p>"],
      ["Our granite service", "<ul><li>Measurement and template of your kitchen</li><li>Slab selection and colour advice</li><li>Precision cutting, edge finishing and polishing</li><li>Sink, hob and tap cut-outs</li><li>Installation and finishing on site</li><li>Islands, upstands and backsplashes</li></ul>"],
    ],
    benefits: ["Very hard-wearing for daily cooking", "Good resistance to heat and scratches", "Wide range of colours and patterns", "Dark options hide everyday marks"],
    applications: ["Kitchen worktops", "Islands and breakfast bars", "Upstands and backsplashes", "Outdoor kitchens"],
    faqs: [
      { q: "Is granite better than marble for a kitchen?", a: "For most busy kitchens, granite needs less care because it is harder and less sensitive to acidic spills. Marble is chosen for its soft, elegant veining. Read our full comparison, Marble vs Granite Kitchen Countertops, or message us and we will help you decide." },
      faqCost, faqVisit,
    ],
    related: ["marble-kitchen-countertops-lagos", "quartz-kitchen-countertops-lagos", "kitchen-countertop-installation-lagos"],
  },
  {
    slug: "quartz-kitchen-countertops-lagos",
    nav: "Quartz Kitchen Countertops",
    h1: "Quartz Kitchen Countertops in Lagos",
    title: "Quartz Kitchen Countertops in Lagos | Chimex Luxe",
    meta: "Modern quartz kitchen countertops for Lagos homes: consistent colour, low maintenance and a clean finish. Fabrication and installation. Request a quote.",
    keyword: "quartz kitchen countertops",
    secondary: ["quartz countertops in Lagos", "quartz countertop installation", "luxury kitchen countertops"],
    wa: "Hello, I would like to enquire about quartz kitchen countertops and installation. Please assist me.",
    images: ["white-countertop-and-backsplash", "island-countertop-fitting", "l-shaped-kitchen-white-countertops"],
    intro: "Quartz countertops give you the look of stone with a very consistent colour and a surface that is easy to keep clean. They suit modern kitchens, apartments and developments where a uniform, contemporary finish matters. We cut, fit and finish quartz worktops to your exact layout.",
    sections: [
      ["What is a quartz countertop?", "<p>Quartz worktops are engineered surfaces made mostly from crushed natural quartz bound with resin. Because they are manufactured, the colour and pattern are consistent from slab to slab, and the surface is non-porous, so it does not need sealing.</p><p>Quartz should be protected from very hot pans (always use a trivet) and is not usually recommended for outdoor areas in direct sun.</p>"],
      ["Our quartz service", "<ul><li>Measurement and layout planning</li><li>Colour and finish selection</li><li>Fabrication, edging and cut-outs</li><li>Installation, seams and finishing</li><li>Matching backsplashes and island tops</li></ul>"],
    ],
    benefits: ["Consistent colour and pattern", "Non-porous, easy to clean", "No sealing needed", "Clean, modern look"],
    applications: ["Modern kitchens", "Apartments and developments", "Islands and backsplashes", "Bathroom vanity tops"],
    faqs: [
      { q: "Is quartz the same as granite?", a: "No. Granite is a natural stone quarried in slabs. Quartz worktops are engineered from crushed quartz and resin. Both are durable; quartz is more uniform and non-porous, while granite handles heat better and every slab is unique." },
      faqCost, faqVisit,
    ],
    related: ["marble-kitchen-countertops-lagos", "granite-kitchen-countertops-lagos", "kitchen-countertop-installation-lagos"],
  },
  {
    slug: "marble-slabs-stone-supply-lagos",
    nav: "Marble Slabs & Stone Supply",
    h1: "Marble Slabs and Stone Supply in Lagos",
    title: "Marble Slabs for Sale in Lagos | Stone Supply | Chimex Luxe",
    meta: "Looking for marble slabs for sale or reliable marble suppliers in Lagos? We source marble, granite and quartz for homes, contractors and developers.",
    keyword: "marble slabs for sale",
    secondary: ["marble suppliers in Lagos", "marble and granite suppliers in Nigeria", "marble countertop suppliers"],
    wa: "Hello, I am looking for marble slabs. Please send me available options and prices.",
    images: ["grey-veined-stone-island", "white-countertop-and-backsplash", "black-stone-kitchen-island"],
    intro: "We source marble, granite and quartz for homeowners, contractors, interior designers and developers. Whether you need slabs for one kitchen or stone for a full project, we help you choose the right material and can cut and install it for you.",
    sections: [
      ["Supply with fabrication", "<p>Buying a slab is only the beginning. The way stone is cut, joined and finished decides how the final surface looks. Because we fabricate and install, we can advise on slab size, pattern direction and where joints will fall before you buy, so there are fewer surprises on site.</p>"],
      ["Who we supply", "<ul><li>Homeowners building or renovating</li><li>Contractors and site engineers</li><li>Architects and interior designers</li><li>Property developers and commercial projects</li></ul>"],
    ],
    benefits: ["Advice on the right stone for each space", "Supply plus cutting and installation", "Options for kitchens, bathrooms and monuments", "One contact from selection to finish"],
    applications: ["Countertops and islands", "Vanity tops", "Tabletops", "Backsplashes and wall features", "Monuments"],
    faqs: [
      { q: "Which stones can you supply?", a: "We work with marble, granite and quartz. Availability of specific colours changes, so message us on WhatsApp with the look you want and we will share current options." },
      { q: "Can I buy a slab and have you install it?", a: "Yes. We can supply the stone and handle the fabrication and installation, or advise you if you are working with your own contractor." },
      faqVisit,
    ],
    related: ["marble-kitchen-countertops-lagos", "granite-kitchen-countertops-lagos", "marble-granite-installation-services-lagos"],
  },
  {
    slug: "kitchen-countertop-installation-lagos",
    nav: "Countertop Fabrication & Installation",
    h1: "Kitchen Countertop Fabrication and Installation in Lagos",
    title: "Kitchen Countertop Installation in Lagos | Chimex Luxe",
    meta: "Professional kitchen countertop fabrication and installation in Lagos: measuring, cutting, sink and hob cut-outs, polishing and fitting. Watch our team at work.",
    keyword: "kitchen countertop installation",
    secondary: ["kitchen countertop installers in Lagos", "kitchen countertop fabrication", "stone fabrication in Lagos"],
    wa: "Hello, I need kitchen countertop fabrication and installation. Please can we discuss my kitchen?",
    images: ["installer-cutting-countertop", "undermount-sink-cutout", "hob-cutout-countertop", "polishing-countertop-edge"],
    video: "fabrication-installation",
    intro: "A beautiful slab can still look poor if it is badly cut or fitted. Our team measures carefully, cuts precisely around your sink and hob, polishes the edges and fits every piece level and tight. The result is a countertop that looks like it was made for your kitchen, because it was.",
    sections: [
      ["Precision where it matters", "<p>The details give a countertop away: the gap around an undermount sink, the straightness of an edge, how two pieces meet at a corner. We take time over cut-outs for sinks, hobs and taps and finish edges on site so they are smooth and even.</p>"],
      ["What we fabricate", "<ul><li>Straight runs, L-shaped and U-shaped worktops</li><li>Kitchen islands and breakfast bars</li><li>Undermount and inset sink cut-outs</li><li>Hob and tap cut-outs</li><li>Edge profiles and polishing</li><li>Upstands and backsplashes</li></ul>"],
    ],
    benefits: ["Accurate measuring before cutting", "Clean, precise cut-outs", "Hand-polished edges", "Level, tight joints and finishing"],
    applications: ["New kitchens", "Kitchen renovations", "Developments and apartments", "Commercial kitchens and counters"],
    faqs: [
      { q: "Do you install stone that I bought elsewhere?", a: "Message us with details of the stone and your kitchen. We will tell you whether we can work with it and what is involved." },
      { q: "Should cabinets be fixed before you measure?", a: "Yes. Base cabinets should be installed and level before final measurement, so the countertop fits exactly." },
      faqVisit,
    ],
    related: ["marble-granite-installation-services-lagos", "marble-kitchen-countertops-lagos", "granite-kitchen-countertops-lagos"],
  },
  {
    slug: "marble-granite-installation-services-lagos",
    nav: "Marble & Granite Installation",
    h1: "Marble and Granite Installation Services in Lagos",
    title: "Marble Installation Services in Lagos | Chimex Luxe",
    meta: "Marble and granite installation services in Lagos for kitchens, bathrooms, tabletops and custom stonework. Careful fitting and finishing. Request a quote.",
    keyword: "marble installation services",
    secondary: ["marble and granite installation", "granite fabrication and installation", "marble fabricators in Lagos"],
    wa: "Hello, I need marble or granite installation. Please send me details and a quotation.",
    images: ["island-countertop-fitting", "stone-bathroom-vanity-top", "grey-stone-l-shaped-countertop"],
    intro: "From kitchen worktops to vanity tops, tabletops and custom pieces, we install marble and granite with care. We handle the heavy lifting, cutting, fitting and finishing, so the stone looks its best and lasts.",
    sections: [
      ["Installation for every space", "<ul><li>Kitchen countertops and islands</li><li>Bathroom vanity tops and upstands</li><li>Tabletops and dining surfaces</li><li>Backsplashes and stone wall features</li><li>Custom stone pieces</li></ul>"],
      ["Working with contractors and designers", "<p>We work alongside builders, architects and interior designers on new builds and renovations. Share your drawings or site photos and we will plan the stone work around your timeline.</p>"],
    ],
    benefits: ["Experienced handling of heavy stone", "Clean finishing and joints", "One team from cutting to fitting", "Works with your contractor or designer"],
    applications: ["Homes", "New developments", "Offices and commercial spaces", "Hospitality interiors"],
    faqs: [faqVisit, faqCost],
    related: ["kitchen-countertop-installation-lagos", "bathroom-countertops-vanity-tops-lagos", "marble-slabs-stone-supply-lagos"],
  },
  {
    slug: "bathroom-countertops-vanity-tops-lagos",
    nav: "Bathroom Vanity Tops",
    h1: "Bathroom Countertops and Vanity Tops in Lagos",
    title: "Marble Bathroom Countertops & Vanity Tops in Lagos | Chimex Luxe",
    meta: "Marble, granite and quartz bathroom countertops and vanity tops in Lagos, with undermount basin cut-outs and upstands. See our work and get a quote.",
    keyword: "marble bathroom countertops",
    secondary: ["vanity tops in Lagos", "bathroom countertops", "granite vanity tops"],
    wa: "Hello, I am interested in a stone bathroom countertop / vanity top. Please send me a quotation.",
    images: ["stone-bathroom-vanity-top"],
    intro: "A stone vanity top turns an ordinary bathroom into something special. We cut vanity tops to size, make clean cut-outs for undermount or inset basins and taps, and add matching upstands that protect the wall.",
    sections: [
      ["Made to fit your bathroom", "<ul><li>Single and double vanity tops</li><li>Undermount and inset basin cut-outs</li><li>Tap holes and upstands</li><li>Polished, smooth edges</li></ul>"],
    ],
    benefits: ["Elegant natural stone finish", "Precise basin and tap cut-outs", "Matching upstands", "Easy to wipe clean"],
    applications: ["Master bathrooms", "Guest toilets", "Hotels and apartments", "Office washrooms"],
    faqs: [faqCost, faqVisit],
    related: ["marble-granite-installation-services-lagos", "marble-kitchen-countertops-lagos", "marble-slabs-stone-supply-lagos"],
  },
  {
    slug: "granite-tombstones-lagos",
    nav: "Tombstones & Grave Monuments",
    h1: "Granite and Marble Tombstones in Lagos",
    title: "Granite Tombstones & Grave Monuments in Lagos | Chimex Luxe",
    meta: "Dignified granite and marble tombstones and grave monuments in Lagos, with engraved headstones and custom designs. Speak to us on WhatsApp.",
    keyword: "granite tombstones in Lagos",
    secondary: ["custom granite tombstones", "grave monuments", "marble headstones"],
    wa: "Hello, I would like to enquire about a tombstone / grave monument. Please can you assist me?",
    images: ["white-stone-tombstone"],
    intro: "A memorial should honour a life with dignity and last for generations. We fabricate and install tombstones and grave monuments in stone, with engraved headstones and designs tailored to your family's wishes.",
    sections: [
      ["How we help families", "<p>We understand this is a sensitive time. We will listen to what you want, suggest stone and layout options, prepare the inscription with you, and install the monument with care. Tell us about the grave size and any design you have in mind.</p>"],
      ["What we make", "<ul><li>Full grave monuments and covers</li><li>Headstones with engraved inscriptions</li><li>Crosses and decorative details</li><li>Pebble infill and borders</li></ul>"],
    ],
    benefits: ["Durable stone that lasts", "Engraved, personalised inscriptions", "Custom designs", "Respectful, careful installation"],
    applications: ["Family graves", "Memorial headstones", "Church and community cemeteries"],
    faqs: [
      { q: "Can we choose the wording and design?", a: "Yes. You decide the inscription and we will show you the layout before engraving." },
      { q: "How do I get a quotation?", a: "Send us the grave dimensions, location and any design ideas on WhatsApp. We will advise on options and prepare a quotation." },
    ],
    related: ["marble-slabs-stone-supply-lagos", "marble-granite-installation-services-lagos"],
  },
];
