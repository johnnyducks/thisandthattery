/*
 * Quiet share menu. A small typewriter "↗ share" link opens a text-only dropdown:
 *   Copy link · Share… (the phone's own share sheet, which includes Instagram / TikTok / Facebook
 *   apps) · Facebook · Story image for Instagram & TikTok · Email
 * No platform logos anywhere. Links point at s/<slug>.html (which carries that item's preview
 * image) and are tagged utm_source=<channel>&utm_medium=share&utm_campaign=<issue>&utm_content=<slug>.
 *
 *   <button class="share-btn" data-share="ch-duel">↗ share</button>
 */
(function () {
  const M = window.TT_SHARE_MANIFEST || { items: {} };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (slug, source) => `${location.origin}/s/${slug}.html?` + new URLSearchParams({ utm_source: source, utm_medium: "share", utm_campaign: M.campaign || "site", utm_content: slug });
  const track = (channel, slug) => window.TT_TRACK?.("Share", { channel, item: slug });
  let menu = null, owner = null;

  function close() { if (menu) { menu.remove(); menu = null; owner?.setAttribute("aria-expanded", "false"); owner = null; } }

  function open(btn) {
    close();
    const slug = btn.dataset.share, item = M.items[slug] || { title: document.title };
    owner = btn; btn.setAttribute("aria-expanded", "true");
    menu = document.createElement("div");
    menu.className = "share-menu"; menu.setAttribute("role", "menu");
    menu.innerHTML = `
      <div class="share-title">${esc(item.title)}</div>
      <button role="menuitem" data-act="copy">Copy link</button>
      ${navigator.share ? `<button role="menuitem" data-act="native">Share…</button>` : ""}
      <a role="menuitem" data-act="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link(slug, "facebook"))}">Facebook</a>
      ${item.story ? `<a role="menuitem" data-act="story" href="${esc(item.story)}" download="${esc(slug)}-story.jpg">Story image <small>for Instagram &amp; TikTok</small></a>` : ""}
      <a role="menuitem" data-act="email" href="mailto:?subject=${encodeURIComponent(item.title + " · This & Thattery")}&body=${encodeURIComponent(link(slug, "email"))}">Email</a>`;
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect(), mw = menu.offsetWidth;
    menu.style.left = Math.max(12, Math.min(innerWidth - mw - 12, r.left + scrollX)) + "px";
    menu.style.top = r.bottom + scrollY + 8 + "px";
    menu.querySelector("button, a").focus();
    menu.addEventListener("click", async e => {
      const el = e.target.closest("[data-act]"); if (!el) return;
      const act = el.dataset.act;
      if (act === "copy") {
        e.preventDefault();
        try { await navigator.clipboard.writeText(link(slug, "copy")); el.textContent = "Copied ✓"; } catch (err) { prompt("Copy this link:", link(slug, "copy")); }
        track("copy", slug); setTimeout(close, 900); return;
      }
      if (act === "native") {
        e.preventDefault();
        try { await navigator.share({ title: item.title, url: link(slug, "native") }); track("native", slug); } catch (err) {}
        close(); return;
      }
      track(act, slug); setTimeout(close, 100);
    });
  }

  document.addEventListener("click", e => {
    const b = e.target.closest(".share-btn");
    if (b) { e.preventDefault(); menu && owner === b ? close() : open(b); return; }
    if (menu && !e.target.closest(".share-menu")) close();
  });
  document.addEventListener("keydown", e => {
    if (!menu) return;
    if (e.key === "Escape") { const o = owner; close(); o?.focus(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); const items = [...menu.querySelectorAll("[data-act]")], i = items.indexOf(document.activeElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    }
  });
  addEventListener("resize", close);

  window.TT_SHARE = { button: (slug, label = "share") => `<button type="button" class="share-btn" data-share="${esc(slug)}" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">↗</span> ${esc(label)}</button>` };
})();
