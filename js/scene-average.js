window.SceneAverage = (function () {
  let root, data, svg, gBars, xScale, yScale, dims;
  let started = false, shown = false, spotlight = false;
  const M = { top: 14, right: 64, bottom: 30, left: 104 };

  // Create the main layout and static elements
  function build(container, payload) {
    root = d3.select(container);
    data = payload;
    root.html("");

    root.append("div").attr("class", "avg-number").style("text-align", "center")
      .html(
        `<div class="mono" style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)">Average rent in Vienna</div>
         <div class="display" id="avg-big" style="font-size:clamp(56px,11vw,116px);color:var(--ink);line-height:1">0.0€</div>
         <div class="mono" style="font-size:13px;color:var(--muted)">per m² · per month</div>`
      );

    const fig = root.append("figure").attr("class", "viz").style("margin", "18px 0 0");
    svg = fig.append("svg").attr("width", "100%");
    gBars = svg.append("g");
    fig.append("figcaption").attr("id", "avg-cap").html(
      "Average residential rent per m², selected European cities. Vienna is the cheapest of the group."
    );

    layout();
    drawChart();
  }

  function isVienna(d) { return d.city.toLowerCase().startsWith("vien"); }
  function color(d) { return isVienna(d) ? VHP.COLOR.protected : VHP.COLOR.marketSoft; }

  // Calc chart diemnsions and layout
  function layout() {
    const m = VHP.measure(root.node(), 0.62, 520, 300);
    dims = { w: m.w, h: data.cities.length * 44 + M.top + M.bottom };
    svg.attr("viewBox", `0 0 ${dims.w} ${dims.h}`).attr("height", dims.h);
    xScale = d3.scaleLinear().domain([0, d3.max(data.cities, (d) => d.rent) * 1.08]).range([M.left, dims.w - M.right]);
    yScale = d3.scaleBand().domain(data.cities.map((d) => d.city)).range([M.top, dims.h - M.bottom]).padding(0.28);
  }

  
  function drawChart() {
    gBars.selectAll("*").remove();

    gBars.append("g").attr("class", "gridline").attr("transform", `translate(0,${dims.h - M.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-(dims.h - M.top - M.bottom)).tickFormat(""));
    gBars.append("g").attr("class", "axis x").attr("transform", `translate(0,${dims.h - M.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => d + "€"));
    gBars.append("g").attr("class", "axis y").attr("transform", `translate(${M.left},0)`)
      .call(d3.axisLeft(yScale).tickSize(0)).call((g) => g.select(".domain").remove())
      .selectAll("text").style("font-family", "var(--body)").style("font-size", "14px")
      .style("font-weight", (c) => (c.toLowerCase().startsWith("vien") ? 700 : 400))
      .style("fill", (c) => (c.toLowerCase().startsWith("vien") ? VHP.COLOR.protected : "var(--ink)"));

    gBars.selectAll(".city-bar").data(data.cities, (d) => d.city).join("rect")
      .attr("class", "city-bar")
      .attr("x", xScale(0)).attr("y", (d) => yScale(d.city))
      .attr("width", (d) => Math.max(0, xScale(d.rent) - xScale(0)))
      .attr("height", yScale.bandwidth()).attr("rx", 2).attr("fill", color)
      .attr("opacity", 0)
      .on("mousemove", (e, d) => { VHP.showTip(`<b>${d.city}</b><br>${VHP.eur(d.rent)} / m² · month`, e); VHP.moveTip(e); })
      .on("mouseleave", VHP.hideTip);

    gBars.selectAll(".city-val").data(data.cities, (d) => d.city).join("text")
      .attr("class", "city-val bar-label")
      .attr("y", (d) => yScale(d.city) + yScale.bandwidth() / 2 + 5)
      .attr("x", (d) => xScale(d.rent) + 8)
      .attr("fill", (d) => (isVienna(d) ? VHP.COLOR.protected : "var(--muted)"))
      .text((d) => VHP.eur(d.rent)).attr("opacity", 0);

    applyVisibility(true);
    root.select("#avg-cap").style("opacity", shown ? 1 : 0);
  }

  function applyVisibility(immediate) {
    const reduce = VHP.prefersReducedMotion || immediate;
    const barOpacity = (d) => (!shown ? 0 : spotlight && !isVienna(d) ? 0.3 : 1);
    gBars.selectAll(".city-bar").transition().duration(reduce ? 0 : 420).attr("opacity", barOpacity);
    gBars.selectAll(".city-val").transition().duration(reduce ? 0 : 420).attr("opacity", shown ? 1 : 0);
  }

  function step(i) {
    if (i >= 0 && !started) {
      started = true;
      VHP.countUp(document.getElementById("avg-big"), 0, data.vienna_rent, VHP.prefersReducedMotion ? 0 : 1300, (v) => VHP.eur(v, 1));
    }
    shown = shown || i >= 1;
    spotlight = i >= 2;
    root.select("#avg-cap").transition().duration(300).style("opacity", shown ? 1 : 0);
    applyVisibility(false);
  }

  
  function resize() {
    if (!svg) return;
    layout();
    drawChart();
    if (started) document.getElementById("avg-big").textContent = VHP.eur(data.vienna_rent, 1);
  }

  return { init: (c, d) => build(c, d), step, resize };
})();
