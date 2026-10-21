import "./styles.css";
import { data, faqs } from "./data/catalog.js";
import { validateReservation, readSession } from "./lib/reservations.js";

("use strict");
const $ = (s) => document.querySelector(s);
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const I = (name, extra = "") =>
  `<span class="icon ${extra}" aria-hidden="true">${name}</span>`;
const state = {
  accepted: sessionStorage.getItem("ambrosial-age") === "yes",
  cart: readSession(sessionStorage, "ambrosial-cart", {}),
  favorites: new Set(readSession(sessionStorage, "ambrosial-favorites", [])),
  search: "",
  category: "Todos",
  availability: "Todos",
  onlyFavorites: false,
  detailQty: 1,
  form: {
    name: "",
    phone: "",
    prefix: "+52",
    city: "",
    delivery: "Por definir con el equipo",
    consent: false,
  },
  errors: {},
  submitting: false,
  receipt: null,
  messages: [],
  typing: false,
  faqSearch: "",
  faqCategory: "Todos",
  chatDraft: "",
  failNext: false,
  notification: false,
};
history.scrollRestoration = "manual";
let currentRoute = "";
let renderedPath = "";
let returnPath = "inicio";
let typingTimer;
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const product = (id) => data.find((p) => p.id === id);
const count = () => Object.values(state.cart).reduce((sum, n) => sum + n, 0);
const persist = () => {
  sessionStorage.setItem("ambrosial-cart", JSON.stringify(state.cart));
  sessionStorage.setItem(
    "ambrosial-favorites",
    JSON.stringify([...state.favorites]),
  );
};
const href = (label, route, classes = "btn btn-primary") =>
  `<a class="${classes}" href="#${route}">${label}</a>`;
const action = (label, name, classes = "btn btn-primary", attrs = "") =>
  `<button type="button" class="${classes}" data-action="${name}" ${attrs}>${label}</button>`;
const status = (p) =>
  `<span class="status ${p.status === "Disponible" ? "available" : p.status === "Agotado" ? "out" : "pending"}"><span class="status-dot"></span>${p.status === "Agotado" ? "Agotado temporalmente" : p.status}</span>`;
const favorite = (p) =>
  `<button type="button" class="icon-btn favorite ${state.favorites.has(p.id) ? "is-favorite" : ""}" data-action="favorite" data-id="${p.id}" aria-label="${state.favorites.has(p.id) ? "Quitar de" : "Añadir a"} favoritos: ${p.name}" aria-pressed="${state.favorites.has(p.id)}">${I("favorite")}</button>`;
const photo = (p, classes = "") =>
  `<div class="product-photo ${classes}"><img src="${asset(p.image)}" alt="Imagen de referencia de ${p.name}" width="400" height="300" loading="lazy"></div>`;
const note = (text, classes = "") =>
  `<div class="info-note ${classes}">${I("info")}<p>${text}</p></div>`;
function brand(compact = false) {
  return `<a class="brand ${compact ? "compact" : ""}" href="#inicio" aria-label="Ambrosial Pharmacy, inicio"><span class="brand-avatar"><img src="${asset("images/site/abc7929d02070d27.jpg")}" alt="" width="44" height="44"></span><span><small>ATENCIÓN ESPECIALIZADA</small><strong>Ambrosial Pharmacy</strong></span></a>`;
}
function header(title = "", back = "inicio", support = true) {
  return title
    ? `<header class="page-header"><a href="#${back}" class="icon-btn" aria-label="Volver">${I("arrow_back")}</a><h1>${title}</h1>${support ? href(I("support_agent") + "<span>Ayuda</span>", "contacto", "support-link") : '<span class="header-spacer"></span>'}</header>`
    : `<header class="brand-header">${brand()}${action(I("notifications"), "notifications", "icon-btn", 'aria-label="Notificaciones"')}</header>`;
}
function nav(active) {
  return `<nav class="bottom-nav" aria-label="Navegación principal">${[
    ["inicio", "home", "Inicio"],
    ["catalogo", "grid_view", "Catálogo"],
    ["reserva", "assignment", "Reservas"],
    ["ayuda", "support_agent", "Ayuda"],
  ]
    .map(
      ([r, i, label]) =>
        `<a href="#${r}" class="nav-item ${active === r ? "active" : ""}" ${active === r ? 'aria-current="page"' : ""}><span class="nav-icon">${I(i)}${r === "reserva" && count() ? `<span class="nav-count">${count()}</span>` : ""}</span><span class="nav-label">${label}</span></a>`,
    )
    .join("")}</nav>`;
}
function layout(content, route, options = {}) {
  const dock = options.dock;
  return `<div class="prototype-bar"><span><span class="prototype-dot"></span> Prototipo interactivo</span><span>Ambrosial Pharmacy ${action(I("restart_alt"), "restart", "prototype-reset", 'aria-label="Reiniciar prototipo"')}</span></div><div class="app-shell page-${route}" data-testid="app-screen">${options.header ?? header()}<main id="main" tabindex="-1" class="${options.mainClass || ""}">${content}</main>${dock ? nav(dock) : ""}</div>`;
}
function compactCard(p) {
  return `<article class="product-card compact-card"><div class="card-top">${status(p)}${favorite(p)}</div><a class="photo-link" href="#producto/${p.id}" aria-label="Ver ${p.name}">${photo(p)}</a><div class="card-description"><h3><a href="#producto/${p.id}">${p.name}</a></h3><p>${p.subtitle}</p></div><div class="card-footer"><span>Consulta<br>disponibilidad</span><a class="arrow-btn" href="#producto/${p.id}" aria-label="Consultar ${p.name}">${I("north_east")}</a></div></article>`;
}
function home() {
  return layout(
    `<section class="home-intro"><h1>Tu Farmacia Especializada<span>Online Pharmacy</span></h1><form class="search-bar" id="home-search">${I("search")}<input name="query" type="search" placeholder="Buscar péptido o compuesto" aria-label="Buscar péptido o compuesto"><button type="submit">Buscar ${I("arrow_forward")}</button></form></section><section class="categories section"><div class="section-heading"><h2>Categorías</h2><a href="#catalogo">Ver todo</a></div><div class="category-rail">${[
      ["Péptidos", "biotech", "blue"],
      ["Inyectables", "vaccines", "peach"],
      ["Cadena fría", "ac_unit", "mint"],
      ["Viales", "medication_liquid", "purple"],
      ["Accesorios", "medical_services", "pink"],
    ]
      .map(
        ([name, i, color], idx) =>
          `<button class="category-tile ${idx === 0 ? "selected" : ""}" data-action="home-category" data-value="${name}"><span class="category-box"><span class="category-inner ${color}">${I(i)}</span></span><span>${name}</span></button>`,
      )
      .join(
        "",
      )}</div></section><section class="section"><div class="section-heading"><div><h2>Péptidos destacados</h2><p>Conoce el catálogo y consulta al equipo.</p></div><a href="#catalogo">Ver todos</a></div><div class="product-grid">${data.map(compactCard).join("")}</div></section><section class="assurance-card">${I("verified_user")}<div><h3>Información y atención cercana</h3><p>Consulta la documentación de cada producto y recibe acompañamiento del equipo antes de solicitar una reserva.</p><a href="#educacion">¿Qué son los péptidos? ${I("arrow_forward")}</a></div></section><p class="demo-caption">Catálogo de demostración · Imágenes de referencia</p>`,
    "inicio",
    { dock: "inicio" },
  );
}
function catalogCard(p) {
  return `<article class="product-card catalog-card"><div class="card-top">${status(p)}${favorite(p)}</div><a class="photo-link" href="#producto/${p.id}" aria-label="Ver ${p.name}">${photo(p)}<span class="image-caption">Imagen de referencia</span></a><div class="catalog-copy"><p class="eyebrow">${p.category}</p><h2>${p.name}</h2>${p.id === "tirzepatida" ? note("Presentación pendiente de confirmación según disponibilidad.") : ""}<p class="muted">Consulta disponibilidad y condiciones</p></div>${href(p.status === "Agotado" ? I("notifications_active") + "Consultar disponibilidad" : p.status === "Por confirmar" ? I("chat_bubble_outline") + "Consultar al equipo" : "Ver ficha y reservar " + I("arrow_forward"), p.status === "Agotado" ? "contacto" : `producto/${p.id}`, `btn ${p.status === "Disponible" ? "btn-primary" : "btn-soft"}`)}</article>`;
}
function filteredProducts() {
  return data.filter(
    (p) =>
      (state.category === "Todos" || p.tags.includes(state.category)) &&
      (state.availability === "Todos" || p.status === state.availability) &&
      (!state.onlyFavorites || state.favorites.has(p.id)) &&
      p.name.toLowerCase().includes(state.search.toLowerCase().trim()),
  );
}
function results() {
  const list = filteredProducts();
  return `<div class="results-heading"><p aria-live="polite">${list.length} producto${list.length === 1 ? "" : "s"} encontrado${list.length === 1 ? "" : "s"}</p>${action(I("restart_alt") + "Limpiar filtros", "clear-filters", "text-btn")}</div>${list.length ? `<div class="catalog-list">${list.map(catalogCard).join("")}</div>` : `<div class="empty-state">${I(state.onlyFavorites ? "favorite" : "search_off")}<h2>${state.onlyFavorites ? "Tus favoritos aparecerán aquí" : "No encontramos productos"}</h2><p>${state.onlyFavorites ? "Toca el corazón de un producto para guardarlo." : "Prueba otro nombre o cambia los filtros de búsqueda."}</p>${action("Ver todo el catálogo", "clear-filters", "btn btn-primary")}</div>`}`;
}
function catalog() {
  return layout(
    `<section class="catalog-tools"><div class="search-bar">${I("search")}<input id="catalog-search" type="search" value="${escapeHTML(state.search)}" placeholder="Buscar por nombre…" aria-label="Buscar por nombre">${action(I("tune"), "focus-filters", "search-filter-btn", 'aria-label="Ir a filtros"')}</div><div class="chip-row" aria-label="Categoría">${["Todos", "Péptidos", "Accesorios"].map((c) => action(c, "category", `chip ${state.category === c ? "selected" : ""}`, `data-value="${c}" aria-pressed="${state.category === c}"`)).join("")}${action(I("favorite"), "filter-favorites", `chip favorite-filter ${state.onlyFavorites ? "selected" : ""}`, `aria-label="Mostrar favoritos" aria-pressed="${state.onlyFavorites}"`)}</div><div class="availability-filter" id="availability-filter"><span>Estado</span><div class="availability-options">${["Todos", "Disponible", "Por confirmar", "Agotado"].map((s) => action(s === "Disponible" ? "Disponibles" : s === "Agotado" ? "Agotados" : s, "availability", `mini-chip ${state.availability === s ? "selected" : ""}`, `data-value="${s}" aria-pressed="${state.availability === s}"`)).join("")}</div></div></section><section id="catalog-results">${results()}</section>${note("Las existencias son simuladas. El equipo confirma disponibilidad y condiciones de cada presentación.", "catalog-disclaimer")}${href(I("support_agent") + "Hablar con una persona", "contacto", "btn btn-dark")}`,
    "catalogo",
    {
      header: `<header class="catalog-header"><div class="catalog-heading"><span class="icon-disc">${I("medical_services")}</span><div><h1>Catálogo</h1><p>Formulaciones y péptidos<br>especializados</p></div></div>${href(I("help") + "Ayuda", "ayuda", "support-link")}</header>`,
      dock: "catalogo",
    },
  );
}
function quantity(id, value) {
  return `<div class="quantity" aria-label="Cantidad de ${escapeHTML(id === "detail" ? "producto" : product(id)?.name)}">${action(I("remove"), "quantity-minus", "quantity-btn", `data-id="${id}" aria-label="Reducir cantidad" ${value <= 1 ? "disabled" : ""}`)}<output aria-live="polite">${value}</output>${action(I("add"), "quantity-plus", "quantity-btn", `data-id="${id}" aria-label="Aumentar cantidad" ${value >= 5 ? "disabled" : ""}`)}</div>`;
}
function detail(id) {
  const p = product(id);
  if (!p) return catalog();
  const canReserve = p.status !== "Agotado";
  return layout(
    `<section class="detail-visual"><div class="detail-top"><a href="#catalogo" class="icon-btn" aria-label="Volver al catálogo">${I("arrow_back")}</a>${favorite(p)}</div>${photo(p, "detail-photo")}<span class="reference-pill">${I("photo_camera")} Imagen de referencia</span></section><section class="detail-sheet"><div class="detail-heading"><div><h1>${p.name}</h1><p>${p.subtitle}</p></div>${status(p)}</div><div class="detail-selection"><div><span class="eyebrow">Presentación</span><strong>Por confirmar</strong></div>${quantity("detail", state.detailQty)}</div>${note("La disponibilidad y las condiciones de esta presentación se confirman con el equipo.")}<section class="detail-description"><h2>Descripción</h2><p>${p.description}</p></section><div class="detail-facts"><div>${I("ac_unit")}<span>Conservación<strong>Según presentación</strong></span></div><div>${I("description")}<span>Documentación<strong>Consulta al equipo</strong></span></div></div><details class="detail-docs"><summary>Información y documentación ${I("expand_more")}</summary><p>Solicita la documentación disponible, lote y caducidad de la presentación específica. Las imágenes y existencias de este prototipo son de referencia.</p></details>${href(I("chat_bubble_outline") + "Hablar con una persona", "contacto", "text-link centered")}${canReserve ? action(I("add") + "Solicitar reserva", "add-to-cart", "btn btn-primary", `data-id="${p.id}"`) : href(I("notifications_active") + "Consultar disponibilidad", "contacto")}<p class="fine-print">Solicitud de demostración. No se realiza ningún pago.</p></section>`,
    "producto",
    { header: "", mainClass: "detail-main" },
  );
}
function cartRow(id, q, receipt = false) {
  const p = product(id);
  return `<article class="reserve-card">${photo(p, "reserve-photo")}<div class="reserve-info"><div class="reserve-title"><h2>${p.name}</h2>${!receipt ? action(I("delete_outline"), "remove-from-cart", "small-icon-btn", `data-id="${p.id}" aria-label="Eliminar ${p.name}"`) : ""}</div><p>Presentación por confirmar</p>${receipt ? `<span class="receipt-qty">${q} unidad${q > 1 ? "es" : ""}</span>` : `<div class="reserve-bottom"><span>Reserva</span>${quantity(id, q)}</div>`}</div></article>`;
}
function reservation() {
  const entries = Object.entries(state.cart);
  return layout(
    entries.length
      ? `<section class="reservation-list">${entries.map(([id, q]) => cartRow(id, q)).join("")}</section>${href(I("add") + "Agregar más productos", "catalogo", "btn btn-outline")}<section class="summary-card"><div class="section-heading"><h2>Resumen de solicitud</h2><span class="soft-badge">${entries.length} producto${entries.length === 1 ? "" : "s"}</span></div><div class="summary-lines"><div><span>Unidades seleccionadas</span><strong>${count()} unidades</strong></div><div><span>Disponibilidad</span><strong class="blue-text">Por confirmar</strong></div></div>${note("No se solicita pago en esta etapa. El equipo te contactará por WhatsApp para revisar los detalles.")}</section>${href("Continuar con mis datos " + I("arrow_forward"), "datos")}<div class="trust-footer"><span>${I("support_agent")} Atención personal</span><a href="#privacidad">${I("lock")} Privacidad de datos</a></div>`
      : `<div class="empty-state large">${I("shopping_bag")}<h2>Tu reserva empieza aquí</h2><p>Explora el catálogo y agrega los productos que te interesan.</p>${href("Explorar catálogo " + I("arrow_forward"), "catalogo")}${href("Hablar con una persona", "contacto", "text-link")}</div>`,
    "reserva",
    { header: header("Mi reserva", "catalogo", false), dock: "reserva" },
  );
}
function field(key, label, placeholder, type = "text", autocomplete = "") {
  const error = state.errors[key];
  return `<div class="form-field ${error ? "has-error" : ""}"><label for="${key}">${label}</label><div class="input-wrap">${I(key === "name" ? "person_outline" : key === "city" ? "location_on" : "call")}<input id="${key}" name="${key}" type="${type}" value="${escapeHTML(state.form[key])}" placeholder="${placeholder}" ${autocomplete ? `autocomplete="${autocomplete}"` : ""} ${error ? `aria-invalid="true" aria-describedby="${key}-error"` : ""}></div>${error ? `<p class="field-error" id="${key}-error">${I("error_outline")}${error}</p>` : ""}</div>`;
}
function formPage() {
  if (!count()) return reservation();
  const totalProducts = Object.keys(state.cart).length;
  return layout(
    `<div class="step-card"><div><strong>Paso 2 de 2</strong><span>Finalización</span></div><h2>Información de contacto y entrega</h2><div class="progress-track"><span></span></div></div><details class="selection-summary"><summary><span class="icon-disc">${I("assignment")}</span><span><strong>Resumen de selección</strong><small>${totalProducts} producto${totalProducts === 1 ? "" : "s"} · ${count()} unidades</small></span><span class="blue-text">Ver detalle</span>${I("expand_more")}</summary><div class="selection-items">${Object.entries(
      state.cart,
    )
      .map(
        ([id, q]) =>
          `<div><span>${product(id).name}</span><strong>${q} unidad${q > 1 ? "es" : ""}</strong></div>`,
      )
      .join(
        "",
      )}</div></details><form id="reservation-form" novalidate><fieldset ${state.submitting ? "disabled" : ""}>${field("name", "Nombre completo", "Ej. María González", "text", "name")}<div class="form-field ${state.errors.phone ? "has-error" : ""}"><label for="phone">WhatsApp de contacto</label><div class="phone-input"><label class="sr-only" for="prefix">Prefijo internacional</label><select id="prefix" name="prefix">${[
      ["+52", "MX +52"],
      ["+1", "US +1"],
      ["+57", "CO +57"],
      ["+34", "ES +34"],
      ["+54", "AR +54"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${state.form.prefix === v ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" value="${escapeHTML(state.form.phone)}" placeholder="Ej. 55 1234 5678" ${state.errors.phone ? 'aria-invalid="true" aria-describedby="phone-error"' : ""}></div><p class="input-help">${I("info")}Te escribiremos aquí para confirmar disponibilidad y condiciones.</p>${state.errors.phone ? `<p class="field-error" id="phone-error">${I("error_outline")}${state.errors.phone}</p>` : ""}</div>${field("city", "Ciudad de residencia", "Ej. Ciudad de México", "text", "address-level2")}<fieldset class="delivery-options"><legend>Modalidad de entrega preferida <span>Elige 1</span></legend>${[
      [
        "Recoger en farmacia",
        "storefront",
        "Consulta condiciones de la sucursal",
      ],
      [
        "Envío a domicilio",
        "local_shipping",
        "Cobertura y condiciones por confirmar",
      ],
      ["Por definir con el equipo", "forum", "Acordar vía WhatsApp"],
    ]
      .map(
        ([v, i, t]) =>
          `<label class="delivery-option"><input type="radio" name="delivery" value="${v}" ${state.form.delivery === v ? "checked" : ""}><span class="icon-disc">${I(i)}</span><span><strong>${v}</strong><small>${t}</small></span></label>`,
      )
      .join(
        "",
      )}</fieldset><div class="consent-card ${state.errors.consent ? "has-error" : ""}"><label><input id="consent" name="consent" type="checkbox" ${state.form.consent ? "checked" : ""} ${state.errors.consent ? 'aria-invalid="true" aria-describedby="consent-error"' : ""}><span>Autorizo que me contacten por WhatsApp para atender esta solicitud de reserva.</span></label><a href="#privacidad">Aviso de privacidad y protección de datos</a>${state.errors.consent ? '<p class="field-error" id="consent-error">Autoriza el contacto para atender la solicitud.</p>' : ""}</div>${note("No solicitamos datos bancarios, pagos ni información médica sensible en esta etapa.", "privacy-note")}${state.failNext ? '<p class="field-error" role="alert">No pudimos procesar la solicitud. Tus datos se conservan. Inténtalo de nuevo.</p>' : ""}<button class="btn btn-primary" type="submit" ${state.submitting ? "disabled" : ""}>${state.submitting ? '<span class="spinner"></span> Enviando solicitud…' : "Enviar solicitud de reserva " + I("arrow_forward")}</button><p class="fine-print">Prototipo: usa datos ficticios. No se transmite información.</p></fieldset></form>`,
    "datos",
    { header: header("Datos de<br>contacto", "reserva") },
  );
}
function receiptPage() {
  const r = state.receipt;
  if (!r) return reservation();
  return layout(
    `<section class="success-intro"><span class="success-icon">${I("check_circle")}</span><span class="soft-badge">SOLICITUD ENVIADA</span><h1>Recibimos tu solicitud</h1><p>El equipo revisará la disponibilidad y te contactará por WhatsApp para confirmar los detalles.</p></section><section class="receipt-card"><div class="receipt-top"><div><span class="eyebrow">Folio de referencia</span><strong>${r.folio}</strong></div><span class="status pending"><span class="status-dot"></span>Pendiente de confirmación</span></div><h2>Productos solicitados (${Object.keys(r.cart).length})</h2><div class="receipt-products">${Object.entries(
      r.cart,
    )
      .map(([id, q]) => cartRow(id, q, true))
      .join(
        "",
      )}</div><div class="receipt-data"><div><span>Solicitante</span><strong>${escapeHTML(r.form.name)}</strong></div><div><span>Canal WhatsApp</span><strong>${escapeHTML(r.form.prefix)} ··· ${escapeHTML(r.form.phone.slice(-4))}</strong></div><div><span>Ciudad de destino</span><strong>${escapeHTML(r.form.city)}</strong></div><div><span>Entrega preferida</span><strong class="blue-text">${escapeHTML(r.form.delivery)}</strong></div></div></section>${note("Esta solicitud de demostración no constituye una reserva definitiva, compra ni prescripción. No se realizó ningún cobro.")}${href(I("chat_bubble_outline") + "Hablar por WhatsApp", "contacto")}${href(I("arrow_back") + "Volver al inicio", "inicio", "btn btn-outline")}${href("¿Tienes dudas? Visita nuestras preguntas frecuentes " + I("arrow_forward"), "ayuda", "text-link centered")}`,
    "recibida",
    {
      header: `<header class="brand-header">${brand(true)}${href("Ayuda", "ayuda", "support-link")}</header>`,
    },
  );
}
function faqList() {
  const query = state.faqSearch.toLowerCase().trim();
  const matches = faqs
    .map((f, i) => ({ ...f, i }))
    .filter(
      (f) =>
        (!query || (f.title + " " + f.text).toLowerCase().includes(query)) &&
        (state.faqCategory === "Todos" || String(f.i) === state.faqCategory),
    );
  return matches.length
    ? matches
        .map(
          (f) =>
            `<details class="faq-card" ${query || state.faqCategory !== "Todos" ? "open" : ""} id="faq-${f.i}"><summary><span class="icon-disc">${I(f.icon)}</span><h3>${f.title}</h3>${I("expand_more")}</summary><p>${f.text}</p></details>`,
        )
        .join("")
    : '<div class="empty-state"><h3>No encontramos ese tema</h3><p>Prueba otra búsqueda o habla con una persona.</p></div>';
}
function helpPage() {
  return layout(
    `<section class="help-intro"><span class="soft-badge">${I("support_agent")} Centro de ayuda</span><h1>Ayuda y consultas</h1><p>Información, atención y reservas.</p>${href(I("support_agent") + "Contacto directo", "contacto", "btn btn-outline btn-fit")}</section><section class="help-hero"><div><span class="hero-chat-icon">${I("forum")}</span><div><span class="hero-badge">Asistente informativo</span><h2>Resolvamos<br>tus dudas</h2><p>Encuentra información del catálogo, reservas y opciones de entrega.</p></div></div>${href("Iniciar conversación " + I("arrow_forward"), "chat", "btn btn-white")}</section><div class="search-bar">${I("search")}<input id="faq-search" type="search" placeholder="Buscar un tema de ayuda…" value="${escapeHTML(state.faqSearch)}" aria-label="Buscar preguntas frecuentes"></div><div class="chip-row help-categories">${[
      ["Todos", "Todos"],
      ["0", "Envíos"],
      ["1", "Conservación"],
      ["2", "Reservas"],
    ]
      .map(([id, t]) =>
        action(
          t,
          "faq-category",
          `chip ${state.faqCategory === id ? "selected" : ""}`,
          `data-value="${id}"`,
        ),
      )
      .join(
        "",
      )}</div><section><h2 class="section-title">Preguntas frecuentes</h2><div id="faq-list" class="faq-list">${faqList()}</div></section>${note("La información general no sustituye una consulta profesional. Para dudas sobre tu salud o tratamiento, consulta a un profesional.")}${href(I("support_agent") + "Hablar con una persona", "contacto", "btn btn-dark")}`,
    "ayuda",
    { dock: "ayuda" },
  );
}
function chatMessages() {
  return `<div class="chat-date">Hoy · Asistente informativo</div><div class="message-row assistant"><span class="chat-avatar">${I("medical_services")}</span><div class="message-bubble"><p>¡Hola! Puedo ayudarte a encontrar información del catálogo, reservas y atención. ¿Qué te gustaría saber?</p></div></div>${!state.messages.length ? `<div class="chat-suggestions"><p>Sugerencias para empezar</p>${["¿Cómo solicito una reserva?", "Consultar disponibilidad", "Información de envíos", "Documentación de productos"].map((t) => action(I("arrow_outward") + t, "chat-suggestion", "suggestion", `data-value="${t}"`)).join("")}</div>` : ""}${state.messages.map((m) => `<div class="message-row ${m.role}">${m.role === "assistant" ? `<span class="chat-avatar">${I("medical_services")}</span>` : ""}<div class="message-bubble"><p>${escapeHTML(m.text)}</p>${m.source ? href(I("description") + `<span>${m.label}<small>Ver información de referencia</small></span>` + I("north_east"), m.source, "message-source") : ""}</div></div>`).join("")}${state.typing ? '<div class="message-row assistant"><span class="chat-avatar">' + I("smart_toy") + '</span><div class="typing-indicator" role="status">El asistente está escribiendo <span></span><span></span><span></span></div></div>' : ""}`;
}
function chatPage() {
  return layout(
    `<div class="chat-notice">${note("Asistente informativo del catálogo. Para consultas clínicas, solicita atención profesional.")}</div><div class="chat-messages" id="chat-messages" aria-live="polite" aria-relevant="additions">${chatMessages()}</div><div class="chat-composer-area">${href(I("support_agent") + "Hablar con una persona", "contacto", "human-chat-link")}<form id="chat-form" class="chat-composer"><label class="sr-only" for="message">Tu mensaje</label><textarea id="message" name="message" rows="1" maxlength="500" placeholder="Escribe tu consulta aquí…">${escapeHTML(state.chatDraft)}</textarea><button type="submit" class="send-btn" aria-label="Enviar mensaje" ${state.typing ? "disabled" : ""}>${I("send")}</button></form><span class="chat-caption">Respuestas de demostración basadas en las FAQ.</span></div>`,
    "chat",
    {
      header: `<header class="chat-header"><a href="#ayuda" class="icon-btn" aria-label="Volver a ayuda">${I("arrow_back")}</a><span class="assistant-avatar">${I("medical_services")}</span><h1>Asistente<br>informativo</h1>${href(I("support_agent") + "Humano", "contacto", "support-link")}</header>`,
      mainClass: "chat-main",
    },
  );
}
function contactPage() {
  return layout(
    `<section class="contact-intro"><span class="success-icon">${I("support_agent")}</span><h1>Estamos para ayudarte</h1><p>Una persona del equipo podrá revisar tu consulta y los detalles de tu solicitud.</p></section><section class="contact-card"><span class="soft-badge">CONTACTO POR WHATSAPP</span><h2>Atención personalizada</h2><p>El número oficial se conectará en la versión final. Este prototipo no envía mensajes ni abre conversaciones reales.</p>${action(I("check") + "Entendido, volver", "back", "btn btn-primary")}${href("Consultar preguntas frecuentes", "ayuda", "text-link centered")}</section><p class="fine-print">No se muestra disponibilidad ni tiempo de respuesta sin confirmar.</p>`,
    "contacto",
    { header: header("Contacto", state.receipt ? "recibida" : "ayuda", false) },
  );
}
function gate() {
  return layout(
    `<section class="gate-card"><span class="soft-badge">${I("shield")} Acceso al catálogo</span><h1>Antes de continuar</h1>${note("Este sitio está dirigido a personas mayores de 18 años. Ofrece información general y permite solicitar información o reservas. No sustituye una consulta médica ni indica que un producto sea adecuado para ti.")}<label class="gate-check"><input id="adult" type="checkbox"><span><strong>Confirmo que soy mayor de 18 años</strong><small>Requisito para continuar al catálogo.</small></span></label><label class="gate-check"><input id="read" type="checkbox"><span><strong>He leído el aviso informativo</strong><small>Comprendo el alcance de la información.</small></span></label>${href("Leer aviso completo " + I("expand_more"), "aviso-completo", "text-link")}<button type="button" id="gate-continue" data-action="accept" class="btn btn-primary" disabled>Continuar ${I("arrow_forward")}</button>${href("Salir", "salida", "text-link centered")}</section><div class="gate-footer">${I("lock")} Tu información merece cuidado.</div>`,
    "aviso",
    { header: `<header class="brand-header">${brand(true)}</header>` },
  );
}
function legalPage(which) {
  const privacy = which === "privacidad";
  return layout(
    `<article class="legal-card"><span class="soft-badge">INFORMACIÓN DEL PROTOTIPO</span><h1>${privacy ? "Aviso de privacidad" : "Aviso informativo"}</h1><p>${privacy ? "Este prototipo funciona en tu navegador. Los datos del formulario se mantienen en memoria y no se transmiten a una farmacia ni a ningún servidor. Utiliza datos ficticios." : "La información mostrada es general y no sustituye la evaluación de un profesional. Las fotografías, existencias y presentaciones son de demostración."}</p><h2>${privacy ? "Datos y contacto" : "Sobre las solicitudes"}</h2><p>${privacy ? "En la versión final se especificarán el responsable, las finalidades del tratamiento, el plazo de conservación y los medios para ejercer tus derechos. Este texto es provisional." : "Enviar una solicitud no confirma disponibilidad, precio, compra, entrega ni idoneidad de un producto. El equipo debe revisar las condiciones aplicables."}</p><h2>Antes de publicar</h2><p>Los textos definitivos, documentos y condiciones deben ser revisados y proporcionados por la farmacia.</p>${action("Volver", "back", "btn btn-primary")}</article>`,
    which,
    {
      header: header(
        privacy ? "Privacidad" : "Aviso informativo",
        privacy ? "datos" : "aviso",
        false,
      ),
    },
  );
}
function education() {
  return layout(
    `<section class="education-card"><span class="icon-disc">${I("biotech")}</span><h1>¿Qué son los péptidos?</h1><p>Los péptidos son cadenas de aminoácidos. Sus propiedades y usos dependen de cada compuesto y de su presentación.</p><h2>Información para decidir mejor</h2><p>En el catálogo puedes conocer los productos de referencia y consultar su documentación con el equipo. Una ficha informativa no determina si un producto es adecuado para ti.</p>${note("Para dudas sobre tu salud o tratamiento, consulta a un profesional.")}${href("Explorar catálogo " + I("arrow_forward"), "catalogo")}${href("Hablar con una persona", "contacto", "btn btn-outline")}</section>`,
    "educacion",
    { header: header("Información", "inicio") },
  );
}
function render() {
  let r = location.hash.slice(1) || "aviso";
  if (!state.accepted && !["aviso", "aviso-completo", "salida"].includes(r))
    r = "aviso";
  const parts = r.split("/");
  currentRoute = parts[0];
  renderedPath = r;
  document.body.dataset.page = currentRoute;
  let output;
  switch (currentRoute) {
    case "inicio":
      output = home();
      break;
    case "catalogo":
      output = catalog();
      break;
    case "producto":
      output = detail(parts[1]);
      break;
    case "reserva":
      output = reservation();
      break;
    case "datos":
      output = formPage();
      break;
    case "recibida":
      output = receiptPage();
      break;
    case "ayuda":
      output = helpPage();
      break;
    case "chat":
      output = chatPage();
      break;
    case "contacto":
      output = contactPage();
      break;
    case "privacidad":
    case "aviso-completo":
      output = legalPage(currentRoute);
      break;
    case "educacion":
      output = education();
      break;
    case "salida":
      output = layout(
        `<div class="empty-state large">${I("waving_hand")}<h1>Hasta pronto</h1><p>Este espacio está dirigido a personas adultas.</p>${href("Volver al aviso", "aviso")}</div>`,
        "salida",
        { header: "" },
      );
      break;
    default:
      output = gate();
  }
  $("#app").innerHTML = output;
  document.title = `${{ inicio: "Inicio", catalogo: "Catálogo", producto: "Producto", reserva: "Mi reserva", datos: "Datos de contacto", ayuda: "Ayuda", chat: "Chat informativo", recibida: "Solicitud recibida" }[currentRoute] || "Bienvenido"} · Ambrosial Pharmacy`;
  if (currentRoute === "chat")
    requestAnimationFrame(() => {
      const messages = $("#chat-messages");
      messages.scrollTop = messages.scrollHeight;
    });
}
function navigate(route) {
  if (location.hash.slice(1) === route) render();
  else location.hash = route;
}
let toastTimer;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}
function showAdded(p) {
  const overlay = $("#overlay-root");
  overlay.innerHTML = `<dialog class="bottom-sheet" aria-labelledby="added-title"><div class="sheet-handle"></div><button class="icon-btn sheet-close" data-action="close-sheet" aria-label="Cerrar">${I("close")}</button><span class="success-icon">${I("check_circle")}</span><h2 id="added-title">Agregado a tu reserva</h2><p>${p.name} · ${state.detailQty} unidad${state.detailQty > 1 ? "es" : ""}</p><p class="muted">Puedes agregar más productos antes de enviar la solicitud.</p>${href("Ver mi reserva " + I("arrow_forward"), "reserva")}${action("Seguir explorando", "close-sheet", "btn btn-outline")}</dialog>`;
  const d = overlay.querySelector("dialog");
  d.showModal();
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
}
function updateResults() {
  const target = $("#catalog-results");
  if (target) target.innerHTML = results();
}
function updateChat() {
  const area = $("#chat-messages");
  if (!area) return;
  area.innerHTML = chatMessages();
  area.scrollTop = area.scrollHeight;
  const submit = $("#chat-form button");
  if (submit) submit.disabled = state.typing;
}
function ask(text) {
  if (state.typing || !text.trim()) return;
  const value = text.trim().slice(0, 500);
  state.messages.push({ role: "user", text: value });
  state.chatDraft = "";
  state.typing = true;
  const input = $("#message");
  if (input) {
    input.value = "";
    input.style.height = "";
  }
  updateChat();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const lower = value.toLowerCase();
    let m = {
      role: "assistant",
      text: "No tengo información verificada sobre eso. Puedes contactar al equipo para resolver tu consulta.",
      source: "contacto",
      label: "Hablar con una persona",
    };
    if (
      /dosis|mezcl|inyec|embaraz|tratamiento|reconst|jering|tomar|usar|segur|adelgaz/.test(
        lower,
      )
    )
      m = {
        role: "assistant",
        text: "Para dudas sobre dosis, administración o si un producto es adecuado para ti, consulta a un profesional. Puedo ayudarte con información del catálogo y del proceso de reserva.",
        source: "contacto",
        label: "Solicitar atención personal",
      };
    else if (/reserv|apartar/.test(lower))
      m = {
        role: "assistant",
        text: faqs[2].text,
        source: "ayuda",
        label: "Cómo solicitar una reserva",
      };
    else if (/env[ií]o|entrega/.test(lower))
      m = {
        role: "assistant",
        text: faqs[0].text,
        source: "ayuda",
        label: "Envíos y entregas",
      };
    else if (/document|autentic|lote/.test(lower))
      m = {
        role: "assistant",
        text: faqs[3].text,
        source: "ayuda",
        label: "Documentación de productos",
      };
    else if (/conserv|fr[ií]o/.test(lower))
      m = {
        role: "assistant",
        text: faqs[1].text,
        source: "ayuda",
        label: "Conservación y almacenamiento",
      };
    else if (/disponib|tirzep|retatr|aod|bpc|producto/.test(lower))
      m = {
        role: "assistant",
        text: "Puedes consultar las fichas del catálogo. La disponibilidad y las condiciones se confirman con el equipo; las existencias de este prototipo son simuladas.",
        source: "catalogo",
        label: "Explorar el catálogo",
      };
    state.messages.push(m);
    state.typing = false;
    updateChat();
  }, 750);
}
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "adult" || t.id === "read")
    $("#gate-continue").disabled = !($("#adult").checked && $("#read").checked);
  if (t.id === "catalog-search") {
    state.search = t.value;
    updateResults();
  }
  if (t.id === "faq-search") {
    state.faqSearch = t.value;
    $("#faq-list").innerHTML = faqList();
  }
  if (["name", "phone", "city", "prefix"].includes(t.name))
    state.form[t.name] = t.value;
  if (t.name === "message") {
    state.chatDraft = t.value;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 112) + "px";
  }
});
document.addEventListener("change", (e) => {
  if (e.target.name === "delivery") state.form.delivery = e.target.value;
  if (e.target.name === "consent") state.form.consent = e.target.checked;
  if (e.target.name === "prefix") state.form.prefix = e.target.value;
});
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t || t.disabled) return;
  const id = t.dataset.id;
  switch (t.dataset.action) {
    case "accept":
      if ($("#adult").checked && $("#read").checked) {
        state.accepted = true;
        sessionStorage.setItem("ambrosial-age", "yes");
        navigate("inicio");
      }
      break;
    case "favorite":
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      persist();
      t.classList.toggle("is-favorite", state.favorites.has(id));
      t.setAttribute("aria-pressed", String(state.favorites.has(id)));
      t.setAttribute(
        "aria-label",
        `${state.favorites.has(id) ? "Quitar de" : "Añadir a"} favoritos: ${product(id).name}`,
      );
      toast(
        state.favorites.has(id)
          ? "Producto guardado en favoritos"
          : "Producto eliminado de favoritos",
      );
      if (state.onlyFavorites) updateResults();
      break;
    case "home-category":
      state.category = t.dataset.value;
      state.search = "";
      navigate("catalogo");
      break;
    case "category":
      state.category = t.dataset.value;
      render();
      break;
    case "availability":
      state.availability = t.dataset.value;
      render();
      break;
    case "filter-favorites":
      state.onlyFavorites = !state.onlyFavorites;
      render();
      break;
    case "clear-filters":
      state.search = "";
      state.category = "Todos";
      state.availability = "Todos";
      state.onlyFavorites = false;
      render();
      break;
    case "focus-filters":
      $("#availability-filter button")?.focus();
      break;
    case "quantity-plus":
    case "quantity-minus": {
      const d = t.dataset.action === "quantity-plus" ? 1 : -1;
      if (id === "detail")
        state.detailQty = Math.max(1, Math.min(5, state.detailQty + d));
      else state.cart[id] = Math.max(1, Math.min(5, (state.cart[id] || 1) + d));
      persist();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      break;
    }
    case "add-to-cart": {
      const p = product(id);
      if (p.status === "Agotado") break;
      const old = state.cart[id] || 0;
      state.cart[id] = Math.min(5, old + state.detailQty);
      persist();
      if (old + state.detailQty > 5)
        toast("Máximo de demostración: 5 unidades por producto");
      showAdded(p);
      break;
    }
    case "remove-from-cart":
      delete state.cart[id];
      persist();
      render();
      toast("Producto eliminado de la reserva");
      break;
    case "close-sheet":
      $("#overlay-root dialog")?.close();
      break;
    case "chat-suggestion":
      ask(t.dataset.value);
      break;
    case "faq-category":
      state.faqCategory = t.dataset.value;
      render();
      break;
    case "notifications":
      toast("No tienes notificaciones nuevas");
      break;
    case "back":
      navigate(state.accepted ? returnPath : "aviso");
      break;
    case "restart":
      sessionStorage.removeItem("ambrosial-age");
      sessionStorage.removeItem("ambrosial-cart");
      sessionStorage.removeItem("ambrosial-favorites");
      location.hash = "aviso";
      location.reload();
      break;
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "home-search") {
    e.preventDefault();
    state.search = new FormData(e.target).get("query").trim();
    state.category = "Todos";
    navigate("catalogo");
    return;
  }
  if (e.target.id === "chat-form") {
    e.preventDefault();
    ask(state.chatDraft);
    return;
  }
  if (e.target.id !== "reservation-form") return;
  e.preventDefault();
  if (state.submitting) return;
  state.errors = validateReservation(state.form);
  const digits = state.form.phone.replace(/[\s()+.-]/g, "");
  if (Object.keys(state.errors).length) {
    render();
    const first = $('[aria-invalid="true"]');
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  state.submitting = true;
  render();
  setTimeout(() => {
    state.submitting = false;
    state.receipt = {
      folio: "DEMO-" + String(Date.now()).slice(-6),
      cart: { ...state.cart },
      form: { ...state.form, phone: digits },
    };
    state.cart = {};
    persist();
    navigate("recibida");
  }, 900);
});
document.addEventListener("keydown", (e) => {
  if (e.target.id === "message" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    ask(state.chatDraft);
  }
});
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1).split("/")[0];
  if (
    ["contacto", "privacidad", "aviso-completo"].includes(next) &&
    !["contacto", "privacidad", "aviso-completo"].includes(currentRoute)
  )
    returnPath = renderedPath || "inicio";
  $("#overlay-root dialog")?.close();
  state.detailQty = 1;
  render();
  window.scrollTo(0, 0);
  $("#main")?.focus({ preventScroll: true });
  requestAnimationFrame(() =>
    window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
  );
});
render();
