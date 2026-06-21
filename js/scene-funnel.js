window.SceneFunnel = (function () {
  let root, stages, svg, g, dims, revealed = 0, activeRule = 0, ruleBox;
  const M = { top: 30, right: 20, bottom: 20, left: 20 };
  const ROW = 54, GAP = 30;

  const WIDTHS = [1.0, 0.86, 0.66, 0.58, 0.4, 0.24];

  function build(container, payload) {
    root = d3.select(container);
    stages = payload.stages;
    root.html("");
    const fig = root.append("figure").attr("class", "viz").style("margin", 0);
    svg = fig.append("svg").attr("width", "100%");
    g = svg.append("g");
    ruleBox = root.append("div").attr("class", "funnel-rule step__card")
      .style("opacity", 1).style("border-left-color", "var(--market)").style("margin-top", "10px");
    fig.append("figcaption").html(
      "Each band is a real eligibility criterion (Wohnberatung Wien, Wiener Wohn-Ticket). Band widths are illustrative — they show that the criteria stack, not a measured share of applicants."
    );
    layout();
    draw();
    showRule(0);
  }

  function layout() {
    const m = VHP.measure(root.node(), 0.86, 600, 380);
    const need = M.top + M.bottom + stages.length * (ROW + GAP);
    dims = { w: m.w, h: Math.max(m.h, need) };
    svg.attr("viewBox", `0 0 ${dims.w} ${dims.h}`).attr("height", dims.h);
  }

  function draw() {
    const cx = dims.w / 2;
    const full = dims.w - M.left - M.right;
    g.selectAll("*").remove();
    stages.forEach((s, i) => {
      const w = full * (WIDTHS[i] !== undefined ? WIDTHS[i] : 0.2);
      const yTop = M.top + i * (ROW + GAP);
      const isLast = i === stages.length - 1;
      const grp = g.append("g").attr("class", "funnel-stage funnel-band").classed("off", i >= revealed)
        .attr("data-i", i).style("cursor", "pointer")
        .on("mouseenter", () => showRule(i)).on("click", () => { showRule(i); setActive(i); });

      grp.append("rect").attr("x", cx - w / 2).attr("y", yTop).attr("width", w).attr("height", ROW).attr("rx", 5)
        .attr("fill", isLast ? VHP.COLOR.protected : d3.interpolateRgb("#3f6f66", VHP.COLOR.protected)(i / (stages.length - 1)));

      grp.append("text").attr("class", "funnel-name").attr("x", cx).attr("y", yTop - 6).attr("text-anchor", "middle")
        .style("font-family", "var(--display)").style("font-weight", 700).style("font-size", "14px").style("fill", "var(--ink)")
        .text(`${i + 1}. ${s.label}`);
      grp.append("text").attr("class", "funnel-pct").attr("x", cx).attr("y", yTop + ROW / 2 + 5).attr("text-anchor", "middle")
        .text(i === 0 ? "start here" : "must also qualify");
    });
    setActive(activeRule);
  }

  function setActive(i) {
    activeRule = i;
    g.selectAll(".funnel-stage").style("filter", function () {
      return +this.getAttribute("data-i") === i ? "drop-shadow(0 3px 10px rgba(0,0,0,.22))" : "none";
    });
  }

  function showRule(i) {
    const s = stages[i];
    ruleBox.html(
      `<span class="tag market">Requirement ${i + 1} of ${stages.length}</span>
       <h3 style="font-size:20px;margin:0 0 6px">${s.label}</h3>
       <p style="margin:0;font-size:16px">${s.rule}</p>`
    );
  }

  function step(i) {
    revealed = Math.max(1, Math.min(stages.length, i + 2));
    g.selectAll(".funnel-band").classed("off", function () { return +this.getAttribute("data-i") >= revealed; });
    const newest = Math.min(revealed - 1, stages.length - 1);
    showRule(newest);
    setActive(newest);
  }

  function resize() {
    if (!svg) return;
    layout();
    draw();
  }

  return { init: (c, d) => build(c, d), step, resize };
})();
