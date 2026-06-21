(function () {
  const SCENES = {
    average: window.SceneAverage,
    breakdown: window.SceneBreakdown,
    map: window.SceneMap,
    funnel: window.SceneFunnel,
  };

  const C = "cleanedData/";

  proj4.defs(
    "EPSG:31256",
    "+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs"
  );

  const FUNNEL_STAGES = [
    {
      label: "Everyone who lives in Vienna",
      rule: "About half of all Viennese live in municipal or subsidised housing, and the city owns roughly 220,000 municipal flats. But that stock is allocated under rules a newcomer must clear from scratch.",
    },
    {
      label: "Adult with eligible legal status",
      rule: "You must be 18+ at signing and an Austrian / EU / EEA / Swiss citizen, a recognised refugee, or hold a long-term residence permit (NAG). This already excludes many recent non-EU arrivals.",
    },
    {
      label: "2+ years continuous residence in Vienna",
      rule: "You need two uninterrupted years registered with your primary residence in Vienna. New arrivals, exchange students and most recent migrants fail here \u2014 the single biggest barrier for our audience.",
    },
    {
      label: "Income within the legal caps",
      rule: "Net household income must stay under the WWFSG limits (2024: \u20ac57,600/yr for one person, \u20ac85,830 for two). These are generous ceilings, so most pass \u2014 but a household just above the line is shut out.",
    },
    {
      label: "A recognised housing need",
      rule: "For a Gemeindewohnung you also need a \u201cWohn-Ticket mit begr\u00fcndetem Wohnbedarf\u201d \u2014 a justified need such as overcrowding or an unfit flat. Simply wanting a cheaper flat does not count.",
    },
    {
      label: "Actually allocated a flat",
      rule: "Even when you qualify there is no legal entitlement to a flat, and offers can take many months on a waiting list. Restricting your preferred districts lengthens the wait further.",
    },
  ];

  const META = {
    sources: [
      {
        name: "Statistik Austria \u2014 Mikrozensus Wohnen / Wohnkosten",
        note: "Rent by contract duration and by tenure type; basis for the breakdown chart and calculator rates.",
        url: "https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen/wohnkosten",
      },
      {
        name: "Stadt Wien \u2014 Gemeindebau Standorte Wien (data.gv.at)",
        note: "Geolocated registry of 1,776 municipal housing complexes with dwelling counts and build years; drives the map.",
        url: "https://www.data.gv.at/datasets/a5987f3c-3131-4e6e-b91c-fe0756e69926?locale=de",
      },
      {
        name: "Stadt Wien \u2014 Bezirksgrenzen Wien (data.gv.at)",
        note: "Official district boundaries, reprojected to WGS84 in the browser.",
        url: "https://www.data.gv.at/",
      },
      {
        name: "Deloitte \u2014 Property Index 2025",
        note: "Average rent per m\u00b2 across European capitals, for the affordability comparison.",
        url: "https://www.deloitte.com/cz-sk/en/Industries/real-estate/research/property-index.html",
      },
      {
        name: "Wohnberatung Wien \u2014 Wiener Wohn-Ticket (Aufnahmeblatt 2024)",
        note: "Eligibility criteria and WWFSG net-income limits used in the funnel and calculator.",
        url: "https://wohnberatung-wien.at/wohn-ticket/allgemeines",
      },
    ],
    data_note:
      "All charts are loaded directly from the team's cleanedData/ (Statistik Austria Mikrozensus, Stadt Wien Gemeindebau registry and district boundaries). The map shows the real 1,776 municipal housing complexes and their dwelling counts per district. Per-stage pass-rates in the eligibility funnel are not published, so the band widths there are illustrative; the criteria themselves are the real Wiener Wohn-Ticket rules.",
  };

  const INCOME_CAPS = { 1: 4114, 2: 6131, 3: 6938, 4: 7744 };
  const SIZE_PERSONS = [1, 2, 3, 4];

  function typeKey(label) {
    if (label.indexOf("Gemeinde") === 0) return "gemeinde";
    if (label.indexOf("Genossen") === 0) return "genossenschaft";
    return "private";
  }

  function buildCities(rows) {
    const cities = rows.map((r) => ({ city: r.city, rent: +r.rent_per_m2 }));
    const vienna = cities.find((c) => /^vien/i.test(c.city));
    cities.sort((a, b) => b.rent - a.rent);
    return { vienna_rent: vienna ? vienna.rent : null, cities };
  }

  function buildBreakdown(typeRows, durRows, viennaRent) {
    return {
      vienna_average: viennaRent,
      by_duration: durRows.map((r) => ({ bin: r.duration, rent: +r.rent_per_m2 })),
      by_type: typeRows.map((r) => ({ key: typeKey(r.type), label: r.type, rent: +r.rent_per_m2 })),
    };
  }

  function buildCalc(cfg) {
    return {
      sizes: cfg.size_presets.map((p, i) => ({
        key: String(i + 1),
        label: p.label,
        m2: p.sqm,
        persons: SIZE_PERSONS[i] || SIZE_PERSONS[SIZE_PERSONS.length - 1],
      })),
      income_caps_month: INCOME_CAPS,
      rent_protected: cfg.rent_per_m2.municipal_housing,
      rent_cooperative: cfg.rent_per_m2.cooperative_housing,
      rent_market_new: cfg.rent_per_m2.private_rental,
      residency_required_years: 2,
      slider: cfg.slider,
    };
  }

  function reproject(coords) {
    if (typeof coords[0] === "number") return proj4("EPSG:31256", "WGS84", [coords[0], coords[1]]);
    return coords.map(reproject);
  }

  function ringArea(ring) {
    let a = 0;
    for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
      a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    return a / 2;
  }

  function fixPolygon(rings) {
    rings.forEach((ring, i) => {
      const a = ringArea(ring);
      if ((i === 0 && a > 0) || (i > 0 && a < 0)) ring.reverse();
    });
  }

  function titleCase(s) {
    return (s || "").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function collectCoords(c, out) {
    if (typeof c[0] === "number") out.push(c);
    else c.forEach((x) => collectCoords(x, out));
    return out;
  }

  function planarCentroid(geometry) {
    const pts = collectCoords(geometry.coordinates, []);
    let x = 0, y = 0;
    pts.forEach((p) => { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }

  function buildMap(v5a, v5b) {
    const agg = {};
    const points = [];
    v5b.features.forEach((f) => {
      const p = f.properties;
      const bez = p.BEZIRK;
      const flats = +p.WOHNUNGSANZAHL || 0;
      const year = parseInt(p.BAUJAHR, 10);
      if (!agg[bez]) agg[bez] = { flats: 0, complexes: 0, oldest: Infinity };
      agg[bez].flats += flats;
      agg[bez].complexes += 1;
      if (!isNaN(year) && year < agg[bez].oldest) agg[bez].oldest = year;
      const c = planarCentroid(f.geometry);
      points.push({
        lon: +c[0].toFixed(5),
        lat: +c[1].toFixed(5),
        flats: flats,
        bez: bez,
        name: titleCase(p.HOFNAME),
        year: isNaN(year) ? null : year,
      });
    });

    const features = v5a.features
      .map((f) => {
        const p = f.properties;
        const bez = p.BEZNR;
        const a = agg[bez] || { flats: 0, complexes: 0, oldest: Infinity };
        const geom = { type: f.geometry.type, coordinates: reproject(f.geometry.coordinates) };
        const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
        polys.forEach(fixPolygon);
        return {
          type: "Feature",
          geometry: geom,
          properties: {
            district: bez,
            name: p.NAMEK,
            label: bez + ". " + p.NAMEK,
            muni_flats: a.flats,
            muni_complexes: a.complexes,
            muni_oldest: isFinite(a.oldest) ? a.oldest : null,
          },
        };
      })
      .sort((x, y) => x.properties.district - y.properties.district);

    return { districts: { type: "FeatureCollection", features: features }, points: points };
  }

  Promise.all([
    d3.csv(C + "View2-averageRent_DifferentEuropeanCities.CSV"),
    d3.csv(C + "View3-averageRent_ByType.CSV"),
    d3.csv(C + "View4-averageRent_ByContractDuration.CSV"),
    d3.json(C + "View5a-bezirksgrenzen.json"),
    d3.json(C + "View5b-gemeindebautenLocation.json"),
    d3.json(C + "View7-calculatorConfig.json"),
  ])
    .then(
      ([v2, v3, v4, v5a, v5b, v7]) => {
        try {
          const cities = buildCities(v2);
          const breakdown = buildBreakdown(v3, v4, cities.vienna_rent);
          const map = buildMap(v5a, v5b);
          const calc = buildCalc(v7);
          boot({ cities, breakdown, map, calc });
        } catch (e) {
          console.error("Render error:", e);
        }
      },
      (err) => {
        console.error("Failed to load data:", err);
        document.getElementById("viz-average").innerHTML =
          '<p style="font-family:var(--mono);color:var(--market);padding:20px">Could not load the cleanedData files. Serve this over http:// (see README), don\'t open it from disk.</p>';
      }
    );

  function boot(d) {
    drawSkyline();
    SCENES.average.init(document.getElementById("viz-average"), d.cities);
    SCENES.breakdown.init(document.getElementById("viz-breakdown"), d.breakdown);
    SCENES.map.init(document.getElementById("viz-map"), d.map);
    SCENES.funnel.init(document.getElementById("viz-funnel"), { stages: FUNNEL_STAGES, widths_illustrative: true });
    window.SceneCalculator.init(document.getElementById("viz-calc"), d.calc);
    populateSources(META);
    setupScrolly();
    setupProgressAndRibbon();
    setupResize();
  }

  function drawSkyline() {
    const svg = d3.select(".hook__skyline");
    const W = 1440, H = 320;
    const rnd = d3.randomLcg(42);
    let x = 0;
    const back = [];
    while (x < W) {
      const w = 40 + rnd() * 70;
      const h = 70 + rnd() * 120;
      back.push({ x, w, h });
      x += w + 6;
    }
    svg.append("g").selectAll("rect").data(back).join("rect")
      .attr("x", (d) => d.x).attr("y", (d) => H - d.h).attr("width", (d) => d.w).attr("height", (d) => d.h)
      .attr("fill", "#1b1d24");

    x = 0;
    const front = [];
    while (x < W) {
      const w = 55 + rnd() * 80;
      const h = 40 + rnd() * 80;
      front.push({ x, w, h, roof: rnd() > 0.6 });
      x += w + 10;
    }
    const fg = svg.append("g");
    front.forEach((d) => {
      fg.append("rect").attr("x", d.x).attr("y", H - d.h).attr("width", d.w).attr("height", d.h).attr("fill", "#23262f");
      if (d.roof) {
        fg.append("path").attr("d", `M${d.x} ${H - d.h} L${d.x + d.w / 2} ${H - d.h - 26} L${d.x + d.w} ${H - d.h} Z`).attr("fill", "#23262f");
      }
      for (let wy = H - d.h + 12; wy < H - 10; wy += 22) {
        for (let wx = d.x + 8; wx < d.x + d.w - 8; wx += 16) {
          if (rnd() > 0.55) fg.append("rect").attr("x", wx).attr("y", wy).attr("width", 6).attr("height", 9)
            .attr("fill", rnd() > 0.5 ? "#b8893b" : "#3a3d45").attr("opacity", 0.9);
        }
      }
    });
    fg.append("path").attr("d", `M${W * 0.5} ${H} L${W * 0.5} 120 L${W * 0.5 + 8} 120 L${W * 0.5 + 8} ${H} Z`).attr("fill", "#2b2e38");
    fg.append("path").attr("d", `M${W * 0.5 - 4} 120 L${W * 0.5 + 4} 92 L${W * 0.5 + 12} 120 Z`).attr("fill", "#b8893b").attr("opacity", 0.85);
  }

  function setupScrolly() {
    const scroller = scrollama();
    scroller
      .setup({ step: ".step", offset: 0.6 })
      .onStepEnter((res) => {
        const el = res.element;
        el.classList.add("is-active");
        const scene = el.getAttribute("data-scene");
        const idx = +el.getAttribute("data-step");
        if (SCENES[scene]) SCENES[scene].step(idx);
      })
      .onStepExit((res) => {
        if (res.direction === "up" && res.element.getAttribute("data-step") === "0") {
          res.element.classList.remove("is-active");
        }
      });
    window.__scroller = scroller;
  }

  function setupProgressAndRibbon() {
    const bar = document.getElementById("progress");
    const ribbon = document.getElementById("ribbon");
    const dataZones = ["s-average", "s-breakdown", "s-map", "s-funnel"].map((id) => document.getElementById(id));

    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      const vh = window.innerHeight;
      const inData = dataZones.some((z) => {
        if (!z) return false;
        const r = z.getBoundingClientRect();
        return r.top < vh * 0.5 && r.bottom > vh * 0.5;
      });
      ribbon.classList.toggle("show", inData);
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function populateSources(meta) {
    const ul = document.getElementById("source-list");
    ul.innerHTML = meta.sources
      .map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a> \u2014 ${s.note}</li>`)
      .join("");
    document.getElementById("data-note").textContent = meta.data_note;
  }

  function setupResize() {
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        Object.values(SCENES).forEach((s) => s.resize && s.resize());
        window.SceneCalculator.resize && window.SceneCalculator.resize();
        if (window.__scroller) window.__scroller.resize();
      }, 180);
    });
  }
})();
