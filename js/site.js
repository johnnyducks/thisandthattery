/*
 * Site chrome shared by every page: the thin sticky nav bar and the newsletter form.
 *
 *   TT_SITE.nav({ links: [{ href, label, id? }], sponsor?: { href, label }, alwaysShow?: bool })
 *   TT_SITE.newsletter(element, { source })   // renders the signup form into element
 *
 * The nav bar slides in once the reader scrolls past the page's header (body.past-cover),
 * or immediately on pages without a cover (alwaysShow).
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function nav({ links = [], sponsor = null, alwaysShow = false, home = "index.html" } = {}) {
    const bar = document.createElement("nav");
    bar.className = "topnav" + (alwaysShow ? " always" : "");
    bar.setAttribute("aria-label", "Site");
    bar.innerHTML = `
      <a class="topnav-logo" href="${esc(home)}#top" aria-label="This & Thattery home"><b>TT</b><span>This &amp; Thattery</span></a>
      <div class="topnav-links">${links.map(l => `<a href="${esc(l.href)}" ${l.id ? `data-nav="${esc(l.id)}"` : ""}>${l.html || esc(l.label)}</a>`).join("")}</div>
      <div class="topnav-end">
        ${sponsor ? `<a class="topnav-sponsor" href="${esc(sponsor.href)}"><small>${esc(sponsor.kicker || "Featured")}</small>${esc(sponsor.label)}</a>` : ""}
        <a class="topnav-sub" href="#newsletter">Subscribe</a>
      </div>
      <i class="topnav-progress" aria-hidden="true"></i>`;
    document.body.prepend(bar);
    if (alwaysShow) document.body.classList.add("past-cover");

    // reading progress along the bottom edge of the bar
    const prog = bar.querySelector(".topnav-progress");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // highlight the section in view
    const ids = links.filter(l => l.id).map(l => l.id);
    if (ids.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) bar.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === en.target.dataset.navTarget));
      }), { rootMargin: "-45% 0px -50% 0px" });
      ids.forEach(id => { const el = document.getElementById(id); if (el) { el.dataset.navTarget = id; io.observe(el); } });
    }
    return bar;
  }

  function newsletter(el, { source = "site", title = "The Thattery Dispatch", dek = "One odd pairing, delivered when a new issue goes to press. No spam, unsubscribe anytime." } = {}) {
    el.classList.add("nl");
    el.id = el.id || "newsletter";
    el.innerHTML = `
      <div class="nl-card">
        <div class="nl-stamp" aria-hidden="true">POST<br>CARD</div>
        <div class="nl-copy">
          <div class="nl-kicker">Newsletter</div>
          <h2>${esc(title)}</h2>
          <p>${esc(dek)}</p>
        </div>
        <form class="nl-form" novalidate>
          <label class="nl-field"><span>Your email</span>
            <input type="email" name="email" required autocomplete="email" placeholder="you@example.com" maxlength="254">
          </label>
          <label class="nl-hp" aria-hidden="true">Leave this empty<input type="text" name="company" tabindex="-1" autocomplete="off"></label>
          <button type="submit">Send me the next issue →</button>
          <p class="nl-msg" role="status" aria-live="polite"></p>
        </form>
      </div>`;
    const form = el.querySelector("form"), msg = el.querySelector(".nl-msg"), btn = form.querySelector("button");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.className = "nl-msg bad"; msg.textContent = "That email doesn't look right."; form.email.focus(); return; }
      btn.disabled = true; msg.className = "nl-msg"; msg.textContent = "Posting your card…";
      try {
        const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, company: form.company.value, source }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || (r.status === 404 ? "Signup isn't switched on yet. Please try again soon." : "Something went wrong. Please try again."));
        form.reset(); msg.className = "nl-msg good";
        msg.textContent = j.message || "Almost done: check your inbox and click the confirmation link.";
      } catch (err) { msg.className = "nl-msg bad"; msg.textContent = err.message; }
      finally { btn.disabled = false; }
    });
  }

  window.TT_SITE = { nav, newsletter };
})();
