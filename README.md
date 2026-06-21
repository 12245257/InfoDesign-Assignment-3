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

Using interactive visualizations and narrative storytelling, we reveal how housing affordability differs across different aggregational groups. In particular here we take contract types, housing sectors and demographic groups into account. This should allow users to explore both the structural causes and personal implications of Viennas housing system.

---

## Features

- Interactive scrollytelling experience
- Multiple coordinated visualizations using D3.js
- Rent breakdown chart
- Interactive map of Viennas housing landscape
- Housing eligibility funnel
- Personal rent calculator
- Hover tooltips
- Responsive web design

---

## Technologies we used

The technologies and libraries used for the project will be documented as the implementation progresses. Examples below:
- HTML
- CSS
- JavaScript
- D3.js
- Scrollama

---

## Data Sources

### Statistik Austria – Mikrozensus Wohnen / Wohnkosten

Quarterly survey data on housing costs, rent levels, contract age, tenure type, apartment size, and household income.

https://www.statistik.at/statistiken/bevoelkerung-und-soziales/wohnen/wohnkosten

### Stadt Wien – Gemeindebau Standorte Wien

Geolocated registry of Vienna's municipal housing complexes.

https://www.data.gv.at/datasets/a5987f3c-3131-4e6e-b91c-fe0756e69926?locale=de

### Stadt Wien – Bezirksgrenzen Wien

Geographic boundary dataset for Vienna's municipal districts.

https://www.data.gv.at/datasets/2ee6b8bf-6292-413c-bb8b-bd22dbb2ad4b?locale=de

### Wohnberatung Wien - Wiener Wohn-Ticket

Eligibility rules and income limits.

https://wohnberatung-wien.at/wohn-ticket/allgemeines

### Deloitte - Property Index 2025

Extracted average rent cost data across European capitals

https://www.deloitte.com/cz-sk/en/Industries/real-estate/research/property-index.html

---



###

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
├── css/
│   └── styles.css
│
├── js/
|   ├── config.js
│   ├── main.js
│   ├── scene-average.js
│   ├── scene-breakdown.js
│   ├── scene-map.js
│   ├── scene-funnel.js
│   └── scene-calculator.js
│
├── vendor/
|   ├── d3.v7.min.js
│   ├── scrollama.min.js
│   └── scene-calculator.js
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

Debugging
