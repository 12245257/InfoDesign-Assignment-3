# InfoDesign Assignment 3: Vienna's Housing Paradox

**Affordable city, unequal reality — an interactive scrollytelling on Vienna's two-tier rental market**

## Authors Group 26:
- Daniel Petriceanu, 12320180
- Hannes Niederhauser, 12245257
- Leonhard Gruber-Stadler, 12527180

## Overview

Vienna is internationally recognized for its affordable housing system and its high quality of life. However, average rent statistics often hide a significant divide between longterm residents with access to subsidized housing and newcomers who rely on the private rental market.

This project tries to answer the question:
**"For whom is Vienna actually still affordable in 2026, and who is being left out?"**

Using interactive visualizations and narrative storytelling we reveal how housing affordability differs across different aggregational groups. In particular here we take Contract types, housing sectors and demographic groups into account. This should allow users to explore both the structural causes and personal implications of Viennas housing system.

---

## Features

- Interactive scrollytelling experience
- Multiple coordinated visualizations using D3.js
- Interactive map of Viennas housing landscape
- Housing eligibility funnel
- Personal rent calculator
- Responsive web design

---

## Technologies we used

The technologies and libraries used for the project will be documented as the implementation progresses. Examples below:
- HTML
- JavaScript
- D3.js

---

## Data Sources

### Statistik Austria – Mikrozensus Wohnen / Wohnkosten

Quarterly survey data on housing costs, rent levels, contract age, tenure type, apartment size, and household income.

https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen/wohnkosten

### Stadt Wien – Wohnen in Wien Gemeindebauten

Geolocated registry of Vienna's municipal housing complexes.

other link!

### Stadt Wien – Registerzählung Wohnungen

Housing statistics aggregated by Vienna's statistical districts.

other link!

---

## Project Structure

Example structure we could use, see below. Update based on actual structure we will use!
```text
InfoDesign Assignment 3/
│
├── data/
│   ├── rents.csv
│   ├── districts.json
│   └── gemeindebau.json
│
├── src/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── view1-introduction.js
│   │   ├── view2-average rent.js
│   │   ├── view3-two viennas.js
│   │   ├── view4-map.js
│   │   ├── view5-eligibility.js
│   │   └── view6-calculator.js
│   │
│   └── add ons/
│
├── index.html
├── README.md
└── .gitignore
```
---

## Contribution Statement

The contribution statement will be completed upon final submission and will describe each team member's responsibilities and implementation work.

---

## AI Usage Disclosure

None
