// Shared-shell navigation keeps Google credentials in tab memory between pages.
const PORTAL_PATHS = Object.freeze(["/", "/apps/", "/favorites/", "/account/", "/settings/", "/help/", "/admin/"]);
const PAGE_PANEL_PATHS = Object.freeze({
  "account-modal": "/account/", "settings-modal": "/settings/",
  "help-modal": "/help/", "admin-modal": "/admin/"
});
let portalRouterReady = false;

function canonicalPortalPath(pathname) {
  if (pathname === "/index.html") return "/";
  for (const path of PORTAL_PATHS) {
    if (pathname === path) return path;
    if (path !== "/" && (pathname === path.slice(0, -1) || pathname === path + "index.html")) return path;
  }
  return "404";
}

function currentPortalRoute() {
  return canonicalPortalPath(window.location.pathname);
}

function portalRouteCopy(path) {
  const english = state.lang === "en";
  const copy = {
    "/apps/": ["แอปทั้งหมด", "All applications", "ค้นหาและเปิดแอปที่คุณมีสิทธิ์ใช้งาน", "Find and open the applications available to you."],
    "/favorites/": ["รายการโปรด", "Favorites", "แอปที่คุณติดดาวไว้ พร้อมเปิดใช้งานจากที่เดียว", "Your starred applications, ready when you need them."],
    "/account/": ["บัญชีของคุณ", "Your account", "จัดการข้อมูลบัญชีที่ใช้กับ Koo Mean", "Manage the account you use with Koo Mean."],
    "/settings/": ["การตั้งค่า", "Settings", "ปรับ Portal ให้เหมาะกับการใช้งานของคุณ", "Make the Portal work the way you prefer."],
    "/help/": ["ช่วยเหลือ", "Help", "ทำความรู้จัก Portal และค้นหาคำตอบที่ต้องการ", "Get to know the Portal and find the answers you need."],
    "/admin/": ["จัดการระบบ", "Administration", "ดูแลแอปและสิทธิ์การเข้าถึงของผู้ใช้งาน", "Manage applications and user access."]
  };
  const pair = copy[path];
  return pair ? {title: pair[english ? 1 : 0], description: pair[english ? 3 : 2]} : {title:"Koo Mean Portal", description:""};
}

function renderPortalRoute({focus = false} = {}) {
  if (!portalRouterReady) return;
  const path = currentPortalRoute();
  const home = path === "/", missing = path === "404";
  const catalog = home || path === "/apps/" || path === "/favorites/";
  $("home").hidden = !home;
  $("app-catalog").hidden = !catalog;
  $("favorites-filter").hidden = path === "/favorites/";
  $("not-found").hidden = !missing;
  $("page-header").hidden = home || missing;
  const copy = portalRouteCopy(path);
  $("page-heading").textContent = copy.title;
  $("page-description").textContent = copy.description;
  document.title = missing ? "404 · Koo Mean Portal" : home ? "Koo Mean Portal" : copy.title + " · Koo Mean Portal";
  document.documentElement.dataset.route = missing ? "404" : path;

  const signedIn = Boolean(state.user && state.verified);
  const protectedPage = path === "/account/" || path === "/admin/";
  const allowed = path === "/admin/" ? isAdmin() : !protectedPage || signedIn;
  for (const [id, panelPath] of Object.entries(PAGE_PANEL_PATHS)) {
    const panel = $(id);
    panel.hidden = panelPath !== path || !allowed;
    panel.inert = panel.hidden;
    panel.setAttribute("aria-hidden", String(panel.hidden));
  }
  const guard = $("route-guard");
  guard.hidden = !protectedPage || allowed;
  if (!guard.hidden) {
    const english = state.lang === "en";
    const denied = signedIn && path === "/admin/";
    const title = denied ? (english ? "Administrator access required" : "หน้านี้สำหรับผู้ดูแลระบบ") : (english ? "Sign in to continue" : "เข้าสู่ระบบเพื่อดำเนินการต่อ");
    const description = denied ? (english ? "Your account does not have permission to manage this Portal." : "บัญชีของคุณยังไม่มีสิทธิ์จัดการ Portal") : (english ? "Use your Google Account to open this page." : "ใช้บัญชี Google ของคุณเพื่อเปิดหน้านี้");
    guard.replaceChildren();
    const heading = document.createElement("h2"); heading.textContent = title;
    const paragraph = document.createElement("p"); paragraph.textContent = description;
    guard.append(heading, paragraph);
    if (!denied) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "btn btn-primary";
      button.dataset.action = "login"; button.textContent = english ? "Sign in with Google" : "เข้าสู่ระบบด้วย Google";
      guard.append(button);
    }
  } else guard.replaceChildren();

  document.querySelectorAll("a[data-route], button[data-route]").forEach(link => {
    const target = link.dataset.route || link.getAttribute("href");
    let selected = false;
    try { selected = canonicalPortalPath(new URL(target, window.location.href).pathname) === path && !missing; } catch {}
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  if (focus && document.documentElement.dataset.maintenance !== "active") {
    const target = missing ? $("not-found").querySelector("h1") : home ? $("hero-title") : $("page-heading");
    if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
    window.scrollTo({top:0, behavior:"instant"});
  }
  window.dispatchEvent(new CustomEvent("portal-route-change", {detail:{path}}));
}

function navigatePortal(path, {replace = false, focus = true} = {}) {
  if (document.documentElement.dataset.maintenance === "active") return false;
  let url;
  try { url = new URL(path, window.location.href); } catch { return false; }
  if (url.origin !== window.location.origin) return false;
  const canonical = canonicalPortalPath(url.pathname);
  if (canonical !== "404") url.pathname = canonical;
  const destination = url.pathname + url.search + url.hash;
  if (destination !== window.location.pathname + window.location.search + window.location.hash) {
    window.history[replace ? "replaceState" : "pushState"]({}, "", destination);
  }
  renderPortalRoute({focus});
  renderApplications();
  return true;
}

function initPortalRouter() {
  if (portalRouterReady) return;
  const outlet = $("route-outlet");
  for (const id of Object.keys(PAGE_PANEL_PATHS)) {
    const panel = $(id);
    panel.classList.remove("modal-backdrop", "open"); panel.classList.add("route-panel");
    panel.removeAttribute("role"); panel.removeAttribute("aria-modal");
    panel.removeAttribute("inert"); panel.inert = false;
    panel.querySelectorAll("[data-close-modal]").forEach(button => {button.hidden = true;});
    outlet.append(panel);
  }
  portalRouterReady = true;
  const canonical = currentPortalRoute();
  if (canonical !== "404" && canonical !== window.location.pathname) {
    window.history.replaceState({}, "", canonical + window.location.search + window.location.hash);
  }
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[data-route]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    let url;
    try { url = new URL(link.href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin || canonicalPortalPath(url.pathname) === "404") return;
    event.preventDefault(); navigatePortal(url.href);
  });
  window.addEventListener("popstate", () => {
    renderPortalRoute({focus:document.documentElement.dataset.maintenance !== "active"});
    renderApplications();
  });
  window.addEventListener("koo-language-change", () => renderPortalRoute());
  renderPortalRoute();
}
