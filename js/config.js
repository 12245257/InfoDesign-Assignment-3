window.VHP = (function () {

  // Shared color palette that we used across all charts and UI elements
  const COLOR = {
    ink: "#1a1c22",
    paper: "#fbfaf7",
    protected: "#138a72",
    protectedSoft: "#9fd4c6",
    market: "#d23b2c",
    marketSoft: "#f0b2aa",
    accent: "#b8893b",
    muted: "#6b6f76",
    line: "#ded7c9",
  };

  // Creates a color scale based on the rent values in the dataset
  function rentScale(values) {
    const ext = d3.extent(values);
    return d3
      .scaleSequential()
      .domain([ext[0], ext[1]])
      .interpolator(d3.interpolateYlOrRd);
  }

  // correct formatting of values
  const eur = (v, dp = 2) =>
    v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + "€";
  const eur0 = (v) => Math.round(v).toLocaleString("en-GB") + "€";
  const pct = (v) => Math.round(v) + "%";

  let tipEl = null;

  // Create the tooltip once or reuse it if active
  function tip() {
    if (!tipEl) {
      tipEl = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    }
    return tipEl;
  }

  
  function showTip(html, event) {
    tip()
      .html(html)
      .style("opacity", 1)
      .style("left", event.clientX + 14 + "px")
      .style("top", event.clientY + 14 + "px");
  }

  // Keeps the tooltip visible
  function moveTip(event) {
    const t = tip();
    const w = t.node().offsetWidth;

    // Move the tooltip to the left if it gets too close to the edge
    const x = event.clientX + 14 + w > window.innerWidth ? event.clientX - 14 - w : event.clientX + 14;
    t.style("left", x + "px").style("top", event.clientY + 14 + "px");
  }
  
  function hideTip() {
    tip().style("opacity", 0);
  }

  // Animate a number from one value to another
  function countUp(node, a, b, dur, fmt) {
    d3.select(node)
      .transition()
      .duration(dur)
      .ease(d3.easeCubicOut)
      .tween("text", function () {
        const i = d3.interpolateNumber(a, b);
        return function (t) {
          this.textContent = fmt(i(t));
        };
      });
  }

  // Set size for visualisations
  function measure(el, ratio = 0.62, maxH = 560, minH = 320) {
    const w = el.clientWidth;
    const h = Math.max(minH, Math.min(maxH, w * ratio));
    return { w, h };
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    COLOR,
    rentScale,
    eur,
    eur0,
    pct,
    showTip,
    moveTip,
    hideTip,
    countUp,
    measure,
    prefersReducedMotion,
  };
})();
