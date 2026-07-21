# Research Foundations + Project Outline

**Rent as Terrain: Making Manhattan’s Housing Pressure Tangible** is Ci Song’s first-draft research website for Summer Colloquium 2026 at Columbia GSAPP.

The project uses D3 to translate ZIP-level asking-rent estimates into a 64-cell Manhattan terrain. A cinematic chapter system, adapted from Ci Song’s earlier `Precendent-Study/iteration`, connects the same dataset to a vertical computational drawing, a kinetic material proposal (Plan A), and a projection-mapped alternative (Plan B).

## Published website

https://cisanotheraccount.github.io/Research-Foundations-Project-Outline/

## Run locally

From this directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Data

- `data/neighborhood_year.csv` contains annual neighborhood/ZIP observations.
- `data/hex_cell_year.csv` connects 64 physical/digital cells to the same annual values.
- `data/manhattan_boundaries.geojson` is a simplified contextual outline and is not intended for parcel analysis.
- 2015–2025 values are annual averages computed from Zillow’s public ZORI smoothed ZIP-level monthly rent estimates.
- 2010–2014 remain blank because the selected ZIP-level series does not publish those years; the project does not interpolate them.
- ZORI represents an asking-rent estimate, not every executed lease or every renter’s housing burden.

To regenerate the derived CSV files after downloading Zillow’s ZIP-level ZORI CSV:

```bash
node scripts/prepare-data.mjs /path/to/Zip_zori_uc_sfrcondomfr_sm_month.csv
```

## Technical structure

The site is static HTML, CSS, SVG, JavaScript, and WebGL. D3 v7 drives the rent terrain; a local Three.js module drives the grayscale particle chapters. D3 loads from jsDelivr with `vendor/d3.v7.min.js` as a local fallback. All project paths are relative so the site works from the GitHub Pages repository subdirectory.

## Material directions

- **Plan A — Primary Material Direction:** a 64-column kinetic rent terrain, preceded by an eight-column functional prototype.
- **Plan B — Alternative Material Strategy:** projection mapping the same data and timeline onto a simplified white Manhattan model.

Plan B changes the material strategy only; the research question, data, drawing language, and rhetorical argument remain the same.

## Sources

Primary source links and methodological caveats are listed in the website’s Sources section.
