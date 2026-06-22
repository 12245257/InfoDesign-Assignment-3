window.SceneBreakdown = (function () {
  let root, data, svg, g, dims, mode = "duration", avg;
  const M = { top: 22, right: 18, bottom: 64, left: 52 };

  function build(container, payload) {
    root = d3.select(container);
    data = payload;
    avg = payload.vienna_average;
    root.html("");

    const bar = root.append("div").attr("class", "toggle-row");
    bar.append("button").attr("class", "tg on").attr("data-mode", "duration").text("By contract age")
      .on("click", function () { setMode("duration", this); });
    bar.append("button").attr("class", "tg").attr("data-mode", "type").text("By housing type")
      .on("click", function () { setMode("type", this); });

    const fig = root.append("figure").attr("class", "viz").style("margin", "8px 0 0");
    svg = fig.append("svg").attr("width", "100%");
    g = svg.append("g");
    fig.append("figcaption").attr("id", "bd-cap").html(captionFor());

    layout();
    render();
  }

  function rows() {
    return mode === "duration"
      ? data.by_duration.map((d) => ({ label: d.bin, rent: d.rent }))
      : data.by_type.map((d) => ({ label: d.label, rent: d.rent, key: d.key }));
  }

  function captionFor() {
    return mode === "duration"
      ? "Average rent per m² by how long the contract has run. A lease signed today costs roughly double a decades-old one. Source: Statistik Austria, Mikrozensus Wohnen."
      : "Average rent per m² by housing sector. The private market is the expensive door; municipal and cooperative flats stay cheap. Source: Statistik Austria, Mikrozensus Wohnen.";
  }

  function colorFor(d, ext) {
    if (mode === "type") {
      return d.key === "gemeinde" ? VHP.COLOR.protected : d.key === "genossenschaft" ? VHP.COLOR.accent : VHP.COLOR.market;
    }
    const t = (d.rent - ext[0]) / (ext[1] - ext[0] || 1);
    return d3.interpolateRgb(VHP.COLOR.protected, VHP.COLOR.market)(t);
  }

  function layout() {
    const m = VHP.measure(root.node(), 0.62, 560, 320);
    dims = { w: m.w, h: m.h };
    svg.attr("viewBox", `0 0 ${dims.w} ${dims.h}`).attr("height", dims.h);
  }

  function render() {
    const data_ = rows();
    const ext = d3.extent(data_, (d) => d.rent);
    const x = d3.scaleBand().domain(data_.map((d) => d.label)).range([M.left, dims.w - M.right]).padding(mode === "type" ? 0.42 : 0.24);
    const y = d3.scaleLinear().domain([0, d3.max(data_, (d) => d.rent) * 1.12]).range([dims.h - M.bottom, M.top]);
    const reduce = VHP.prefersReducedMotion;

    g.selectAll(".gridline").data([0]).join("g").attr("class", "gridline").attr("transform", `translate(${M.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(dims.w - M.left - M.right)).tickFormat(""));

    g.selectAll(".axis-y").data([0]).join("g").attr("class", "axis axis-y").attr("transform", `translate(${M.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "€"));

    const ax = g.selectAll(".axis-x").data([0]).join("g").attr("class", "axis axis-x").attr("transform", `translate(0,${dims.h - M.bottom})`)
      .call(d3.axisBottom(x).tickSize(0));
    ax.selectAll("text").style("font-size", "12.5px").style("fill", "var(--ink)")
      .call(wrap, x.bandwidth() + 10);
    ax.select(".domain").attr("stroke", "var(--line)");

    g.selectAll(".bar").data(data_, (d) => d.label).join(
      (enter) => enter.append("rect").attr("class", "bar").attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
        .attr("y", y(0)).attr("height", 0).attr("rx", 3),
      (update) => update,
      (exit) => exit.transition().duration(reduce ? 0 : 250).attr("y", y(0)).attr("height", 0).remove()
    )
      .attr("fill", (d) => colorFor(d, ext))
      .on("mousemove", (e, d) => { VHP.showTip(`<b>${d.label}</b><br>${VHP.eur(d.rent)} / m² · month`, e); VHP.moveTip(e); })
      .on("mouseleave", VHP.hideTip)
      .transition().duration(reduce ? 0 : 720).ease(d3.easeCubicOut)
      .attr("x", (d) => x(d.label)).attr("width", x.bandwidth())
      .attr("y", (d) => y(d.rent)).attr("height", (d) => y(0) - y(d.rent));

    g.selectAll(".bar-val").data(data_, (d) => d.label).join("text")
      .attr("class", "bar-val bar-label").attr("text-anchor", "middle")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("fill", "var(--ink)").text((d) => VHP.eur(d.rent))
      .transition().duration(reduce ? 0 : 720).attr("y", (d) => y(d.rent) - 8);

    const yl = y(avg);
    const avgLine = g.selectAll(".avg-line").data([0]).join("line").attr("class", "avg-line")
      .attr("x1", M.left).attr("x2", dims.w - M.right).attr("stroke", VHP.COLOR.ink)
      .attr("stroke-dasharray", "5 4").attr("stroke-width", 1.2).attr("opacity", 0.6);
    avgLine.raise().transition().duration(reduce ? 0 : 500).attr("y1", yl).attr("y2", yl);
    const avgLab = g.selectAll(".avg-lab").data([0]).join("text").attr("class", "avg-lab mono")
      .attr("x", dims.w - M.right).attr("text-anchor", "end").attr("fill", VHP.COLOR.ink)
      .style("font-size", "11px").text(`Vienna average ${VHP.eur(avg, 1)}`);
    avgLab.raise().transition().duration(reduce ? 0 : 500).attr("y", yl + 15);
  }

  function setMode(m, btn) {
    if (m === mode) return;
    mode = m;
    if (btn) { root.selectAll(".tg").classed("on", false); d3.select(btn).classed("on", true); }
    else { root.selectAll(".tg").classed("on", function () { return this.getAttribute("data-mode") === m; }); }
    root.select("#bd-cap").html(captionFor());
    render();
  }

  function wrap(sel, width) {
    sel.each(function () {
      const text = d3.select(this);
      const node = text.node();
      if (!node || typeof node.getComputedTextLength !== "function") return;
      const words = text.text().split(/\s+/);
      if (words.length < 2) return;
      text.text(null);
      let line = [], lineNo = 0;
      const y = text.attr("y") || 0;
      let tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", "0.71em");
      words.forEach((w) => {
        line.push(w);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
          line.pop(); tspan.text(line.join(" ")); line = [w];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNo * 1.05 + 0.7 + "em").text(w);
        }
      });
    });
  }

  function step(i) {
    if (i <= 1) setMode("duration");
    else setMode("type");
  }

  function resize() { if (!svg) return; layout(); render(); }

  return { init: (c, d) => build(c, d), step, resize };
})();
