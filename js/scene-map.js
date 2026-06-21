window.SceneMap = (function () {
  let root, fc, pts, svg, gMap, gDots, gLegend, panel, dims, path, proj, color, rSize;
  let showDots = false, selected = null, maxFlats = 0;
  const M = { top: 8, right: 8, bottom: 60, left: 8 };

  function build(container, payload) {
    root = d3.select(container);
    fc = payload.districts;
    pts = payload.points || [];
    root.html("");
    const wrap = root.append("div").attr("class", "map-wrap");
    svg = wrap.append("svg").attr("width", "100%");
    gMap = svg.append("g").attr("class", "districts");
    gDots = svg.append("g").attr("class", "gb-dots");
    gLegend = svg.append("g").attr("class", "map-legend");
    panel = wrap.append("div").attr("class", "map-panel");

    maxFlats = d3.max(fc.features, (f) => f.properties.muni_flats);
    color = d3.scaleSequential().domain([0, maxFlats]).interpolator(d3.interpolate("#eef6f3", VHP.COLOR.protected));
    rSize = d3.scaleSqrt().domain([0, d3.max(pts, (p) => p.flats) || 1]).range([0.6, 7]);

    root.append("figure").attr("class", "viz").style("margin", "8px 0 0").append("figcaption")
      .html("Colour: municipal dwellings per district. Each gold dot is one of 1,776 Gemeindebau complexes, sized by its flats. Source: Stadt Wien Gemeindebau registry (data.gv.at).");

    layout();
    draw();
    defaultPanel();
  }

  function layout() {
    const m = VHP.measure(root.node(), 0.82, 640, 380);
    dims = { w: m.w, h: m.h };
    svg.attr("viewBox", `0 0 ${dims.w} ${dims.h}`).attr("height", dims.h);
    proj = d3.geoMercator().fitExtent([[M.left, M.top], [dims.w - M.right - 150, dims.h - M.bottom]], fc);
    path = d3.geoPath(proj);
  }

  function draw() {
    gMap.selectAll(".district").data(fc.features, (f) => f.properties.district).join("path")
      .attr("class", "district").attr("d", path)
      .attr("fill", (f) => color(f.properties.muni_flats))
      .on("mousemove", (e, f) => { setPanel(f.properties); VHP.moveTip(e); })
      .on("mouseenter", (e, f) => selectDistrict(f.properties.district))
      .on("mouseleave", () => { selectDistrict(null); defaultPanel(); });

    gDots.selectAll(".gb-dot").data(pts).join("circle")
      .attr("class", "gb-dot")
      .attr("cx", (p) => proj([p.lon, p.lat])[0]).attr("cy", (p) => proj([p.lon, p.lat])[1])
      .attr("r", 0)
      .on("mousemove", (e, p) => { VHP.showTip(`<b>${p.name || "Gemeindebau"}</b><br>${p.flats} flats${p.year ? " · built " + p.year : ""}`, e); VHP.moveTip(e); })
      .on("mouseleave", VHP.hideTip);

    updateDots(true);
    drawLegend();
  }

  function updateDots(immediate) {
    gDots.selectAll(".gb-dot").transition().duration(immediate || VHP.prefersReducedMotion ? 0 : 600)
      .attr("r", (p) => (showDots ? rSize(p.flats) : 0));
    gDots.style("pointer-events", showDots ? "auto" : "none");
  }

  function drawLegend() {
    gLegend.selectAll("*").remove();
    const lx = M.left + 4, ly = dims.h - 40, lw = 220, steps = 40;
    const sc = d3.scaleLinear().domain([0, steps - 1]).range([0, maxFlats]);
    gLegend.selectAll("rect").data(d3.range(steps)).join("rect")
      .attr("x", (d) => lx + (d * lw) / steps).attr("y", ly).attr("width", lw / steps + 0.6).attr("height", 10)
      .attr("fill", (d) => color(sc(d)));
    gLegend.append("text").attr("x", lx).attr("y", ly - 6).text("Fewer municipal flats").style("fill", "var(--muted)");
    gLegend.append("text").attr("x", lx + lw).attr("y", ly - 6).attr("text-anchor", "end").text("More").style("fill", "var(--muted)");
    gLegend.append("text").attr("x", lx).attr("y", ly + 24).text("0");
    gLegend.append("text").attr("x", lx + lw).attr("y", ly + 24).attr("text-anchor", "end").text(Math.round(maxFlats / 1000) + "k");
  }

  function selectDistrict(num) {
    selected = num;
    gMap.selectAll(".district").classed("sel", (f) => f.properties.district === num);
  }

  function setPanel(p) {
    panel.html(
      `<div class="pname">${p.label}</div>
       <div class="row"><span class="k">Municipal dwellings</span><span class="v" style="color:var(--protected)">${p.muni_flats.toLocaleString("en-GB")}</span></div>
       <div class="row"><span class="k">Gemeindebau complexes</span><span class="v">${p.muni_complexes}</span></div>
       <div class="row"><span class="k">Oldest complex</span><span class="v">${p.muni_oldest || "—"}</span></div>`
    );
  }

  function defaultPanel() {
    if (selected) return;
    panel.html(
      `<div class="pname">Vienna · 23 districts</div>
       <div class="hint">Hover a district to see how much municipal housing the city built there. Gold dots are individual Gemeindebau complexes.</div>`
    );
  }

  function step(i) {
    if (i <= 0) { showDots = false; gMap.selectAll(".district").classed("dim", false); }
    else if (i === 1) { showDots = true; gMap.selectAll(".district").classed("dim", false); }
    else {
      showDots = true;
      const thresh = d3.quantile(fc.features.map((f) => f.properties.muni_flats).sort(d3.ascending), 0.6);
      gMap.selectAll(".district").classed("dim", (f) => f.properties.muni_flats < thresh);
    }
    updateDots(false);
  }

  function resize() { if (!svg) return; layout(); draw(); }

  return { init: (c, d) => build(c, d), step, resize };
})();
