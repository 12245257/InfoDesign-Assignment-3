window.SceneCalculator = (function () {
  let cfg, state, els;

  function build(container, payload) {
    cfg = payload;
    state = { residency: 1, income: 2600, size: "2" };

    const root = d3.select(container);
    root.html("");
    root
      .append("div")
      .attr("class", "calc__controls")
      .html(
        `<h3>Your situation</h3>
         <div class="ctrl">
           <label>Years living in Vienna <span class="val" id="c-res">1 yr</span></label>
           <input type="range" id="r-res" min="0" max="15" step="1" value="1">
         </div>
         <div class="ctrl">
           <label>Net household income / month <span class="val" id="c-inc">2,600€</span></label>
           <input type="range" id="r-inc" min="900" max="9000" step="100" value="2600">
         </div>
         <div class="ctrl">
           <label>Home size</label>
           <div class="segbtns" id="seg-size">
             ${cfg.sizes
               .map((s) => `<button data-size="${s.key}" class="${s.key === "2" ? "on" : ""}">${s.label}</button>`)
               .join("")}
           </div>
         </div>
         <p class="mono" style="font-size:11px;color:var(--muted);line-height:1.6;margin:6px 0 0">
           Estimate only. A municipal flat also requires eligible residency status and a recognised housing need — and there is no legal entitlement even when you qualify.
         </p>`
      );

    root
      .append("div")
      .attr("class", "calc__result")
      .html(
        `<div class="verdict" id="v-title">—</div>
         <div class="verdict-sub" id="v-sub"></div>
         <div class="path-row"><span class="k">Eligible for municipal / subsidised housing?</span><span class="v" id="p-elig">—</span></div>
         <div class="path-row"><span class="k">Your likely market today</span><span class="v" id="p-market">—</span></div>
         <div class="path-row"><span class="k">Estimated rent</span><span class="v" id="p-rent">—</span></div>
         <div class="path-row"><span class="k">Share of your income</span><span class="v" id="p-burden">—</span></div>
         <div class="burden-wrap">
           <div class="mono" style="font-size:11px;color:var(--muted);margin-bottom:6px">Rent-to-income · markers at 30% (affordable) and 40% (overburdened)</div>
           <div class="burden-bar"><div class="burden-fill" id="b-fill"></div><div class="burden-cap" id="b-30"></div><div class="burden-cap" id="b-40"></div></div>
         </div>
         <div class="calc__compare">
           <button id="c-copy">Copy my result</button><span class="copied" id="c-copied"></span>
         </div>`
      );

    els = {
      res: document.getElementById("r-res"),
      inc: document.getElementById("r-inc"),
      resV: document.getElementById("c-res"),
      incV: document.getElementById("c-inc"),
      vTitle: document.getElementById("v-title"),
      vSub: document.getElementById("v-sub"),
      pElig: document.getElementById("p-elig"),
      pMarket: document.getElementById("p-market"),
      pRent: document.getElementById("p-rent"),
      pBurden: document.getElementById("p-burden"),
      fill: document.getElementById("b-fill"),
      cap30: document.getElementById("b-30"),
      cap40: document.getElementById("b-40"),
      copy: document.getElementById("c-copy"),
      copied: document.getElementById("c-copied"),
    };

    els.res.addEventListener("input", () => { state.residency = +els.res.value; update(); });
    els.inc.addEventListener("input", () => { state.income = +els.inc.value; update(); });
    d3.select("#seg-size").selectAll("button").on("click", function () {
      state.size = this.getAttribute("data-size");
      d3.select("#seg-size").selectAll("button").classed("on", false);
      d3.select(this).classed("on", true);
      update();
    });
    els.copy.addEventListener("click", copyResult);

    els.cap30.style.left = "30%";
    els.cap40.style.left = "40%";
    update();
  }

  function compute() {
    const size = cfg.sizes.find((s) => s.key === state.size);
    const cap = cfg.income_caps_month[state.size] || 5000;
    const meetsResidency = state.residency >= cfg.residency_required_years;
    const meetsIncome = state.income <= cap;
    const eligible = meetsResidency && meetsIncome;

    const m2 = eligible ? cfg.rent_protected : cfg.rent_market_new;
    const rent = m2 * size.m2;
    const burden = (rent / state.income) * 100;
    return { size, cap, meetsResidency, meetsIncome, eligible, m2, rent, burden };
  }

  function update() {
    els.resV.textContent = state.residency + (state.residency === 1 ? " yr" : " yrs");
    els.incV.textContent = VHP.eur0(state.income);

    const r = compute();
    if (r.eligible) {
      els.vTitle.textContent = "You could reach the cheap Vienna.";
      els.vTitle.className = "verdict yes";
      els.vSub.textContent = "On paper you meet the basic criteria — but a flat still depends on a recognised need and a waiting list.";
    } else if (!r.meetsResidency) {
      els.vTitle.textContent = "You're locked out — for now.";
      els.vTitle.className = "verdict no";
      els.vSub.textContent = `You need ${cfg.residency_required_years} years of continuous Vienna residence before you can even register. Until then, the protected stock is off-limits.`;
    } else {
      els.vTitle.textContent = "Just above the line.";
      els.vTitle.className = "verdict no";
      els.vSub.textContent = "Your income sits above the legal ceiling for subsidised housing, so you'd rent on the open market.";
    }

    els.pElig.textContent = r.eligible ? "Yes — eligible to apply" : "No";
    els.pElig.className = "v " + (r.eligible ? "protected" : "market");
    els.pMarket.textContent = r.eligible ? "Protected / cooperative" : "New private lease";
    els.pMarket.className = "v " + (r.eligible ? "protected" : "market");
    els.pRent.textContent = `${VHP.eur0(r.rent)}/mo · ${VHP.eur(r.m2)}/m²`;
    els.pBurden.textContent = VHP.pct(r.burden);
    els.pBurden.className = "v " + (r.burden > 40 ? "market" : r.burden < 30 ? "protected" : "");

    const w = Math.min(100, r.burden);
    els.fill.style.width = w + "%";
    els.fill.style.background = r.burden > 40 ? VHP.COLOR.market : r.burden < 30 ? VHP.COLOR.protected : VHP.COLOR.accent;
  }

  function copyResult() {
    const r = compute();
    const txt = `My Vienna rent reality: ${r.size.label}, ${state.residency} yrs in Vienna, ${VHP.eur0(state.income)}/mo income → ${r.eligible ? "eligible for subsidised housing" : "stuck on the private market"}, est. ${VHP.eur0(r.rent)}/mo (${VHP.pct(r.burden)} of income). vienna-housing-paradox`;
    const done = () => { els.copied.textContent = "Copied ✓"; setTimeout(() => (els.copied.textContent = ""), 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(done);
    else done();
  }

  return { init: (c, d) => build(c, d), step: () => {}, resize: () => {} };
})();
