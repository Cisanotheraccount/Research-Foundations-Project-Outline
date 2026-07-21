import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourcePath = process.argv[2] || "/private/tmp/zori.csv";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(file, headers, rows) {
  const output = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(projectRoot, file), `${output}\n`);
}

const neighborhoodByZip = new Map([
  ["10034", "Inwood"],
  ["10040", "Fort George"],
  ["10033", "Washington Heights South"],
  ["10032", "Washington Heights"],
  ["10039", "Sugar Hill"],
  ["10031", "Hamilton Heights"],
  ["10030", "Central Harlem North"],
  ["10027", "Morningside Heights"],
  ["10026", "Central Harlem South"],
  ["10035", "East Harlem North"],
  ["10037", "Harlem River"],
  ["10025", "Upper West Side North"],
  ["10024", "Upper West Side"],
  ["10029", "East Harlem"],
  ["10023", "Lincoln Square"],
  ["10128", "Carnegie Hill"],
  ["10028", "Upper East Side"],
  ["10069", "Riverside South"],
  ["10021", "Lenox Hill"],
  ["10065", "Upper East Side South"],
  ["10019", "Midtown West"],
  ["10036", "Times Square"],
  ["10022", "Midtown East"],
  ["10017", "Turtle Bay"],
  ["10016", "Murray Hill"],
  ["10018", "Garment District"],
  ["10001", "Chelsea North"],
  ["10010", "Flatiron"],
  ["10011", "Chelsea"],
  ["10014", "West Village"],
  ["10003", "Greenwich Village"],
  ["10009", "East Village"],
  ["10002", "Lower East Side"],
  ["10012", "SoHo"],
  ["10013", "Tribeca"],
  ["10005", "Financial District East"],
  ["10038", "Civic Center"],
  ["10007", "Tribeca South"],
  ["10006", "World Trade Center"],
  ["10004", "Financial District South"],
  ["10280", "Battery Park City"],
  ["10282", "Battery Park City North"],
]);

const cellRows = [
  ["10034", "10040"],
  ["10034", "10040"],
  ["10033", "10032", "10039"],
  ["10033", "10032", "10031"],
  ["10031", "10030", "10027"],
  ["10027", "10026", "10035", "10037"],
  ["10025", "10024", "10029", "10035"],
  ["10024", "10023", "10128", "10029", "10028"],
  ["10023", "10069", "10021", "10128", "10065"],
  ["10019", "10036", "10022", "10017", "10016"],
  ["10036", "10018", "10001", "10010", "10016"],
  ["10011", "10014", "10003", "10009", "10002"],
  ["10014", "10012", "10003", "10002"],
  ["10013", "10005", "10038", "10002"],
  ["10007", "10006", "10004"],
  ["10007", "10004", "10280"],
  ["10280", "10282"],
  ["10282", "10004"],
];

const sourceRows = parseCsv(fs.readFileSync(sourcePath, "utf8"));
const zoriRows = sourceRows.filter((row) => row.CountyName === "New York County" && neighborhoodByZip.has(row.RegionName));
const years = Array.from({ length: 16 }, (_, index) => 2010 + index);

const annualByZip = new Map();
for (const row of zoriRows) {
  const annual = new Map();
  for (const year of years) {
    const values = Object.entries(row)
      .filter(([key, value]) => key.startsWith(`${year}-`) && value !== "")
      .map(([, value]) => Number(value))
      .filter(Number.isFinite);
    annual.set(year, values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
  }
  annualByZip.set(row.RegionName, annual);
}

const observedValues = [...annualByZip.values()].flatMap((annual) => [...annual.values()].filter(Number.isFinite));
const minRent = Math.min(...observedValues);
const maxRent = Math.max(...observedValues);
const heightForRent = (rent) => 8 + ((rent - minRent) / (maxRent - minRent)) * 62;
const yoy = (rent, prior) => (Number.isFinite(rent) && Number.isFinite(prior) && prior !== 0 ? ((rent - prior) / prior) * 100 : null);

const neighborhoodRows = [];
for (const [zip, name] of neighborhoodByZip) {
  const annual = annualByZip.get(zip) || new Map();
  for (const year of years) {
    const rent = annual.get(year) ?? null;
    const prior = annual.get(year - 1) ?? null;
    neighborhoodRows.push({
      neighborhood: `${name} (${zip})`,
      year,
      median_asking_rent: Number.isFinite(rent) ? Math.round(rent) : "",
      yoy_pct: Number.isFinite(yoy(rent, prior)) ? yoy(rent, prior).toFixed(1) : "",
    });
  }
}

const cells = [];
cellRows.forEach((row, rowIndex) => {
  row.forEach((zip, columnIndex) => {
    cells.push({
      cellId: `H${String(cells.length + 1).padStart(2, "0")}`,
      row: rowIndex,
      column: columnIndex,
      zip,
      neighborhood: neighborhoodByZip.get(zip),
    });
  });
});

if (cells.length !== 64) throw new Error(`Expected 64 cells, received ${cells.length}`);

const cellRowsOutput = [];
for (const cell of cells) {
  const annual = annualByZip.get(cell.zip) || new Map();
  for (const year of years) {
    const rent = annual.get(year) ?? null;
    const prior = annual.get(year - 1) ?? null;
    cellRowsOutput.push({
      cell_id: cell.cellId,
      neighborhood: `${cell.neighborhood} (${cell.zip})`,
      year,
      rent: Number.isFinite(rent) ? Math.round(rent) : "",
      yoy_pct: Number.isFinite(yoy(rent, prior)) ? yoy(rent, prior).toFixed(1) : "",
      height_mm: Number.isFinite(rent) ? heightForRent(rent).toFixed(1) : "",
    });
  }
}

writeCsv("data/neighborhood_year.csv", ["neighborhood", "year", "median_asking_rent", "yoy_pct"], neighborhoodRows);
writeCsv("data/hex_cell_year.csv", ["cell_id", "neighborhood", "year", "rent", "yoy_pct", "height_mm"], cellRowsOutput);

const boundary = {
  type: "FeatureCollection",
  metadata: {
    title: "Simplified Manhattan boundary",
    note: "A lightweight contextual outline for the research prototype; not for parcel-level analysis.",
  },
  features: [
    {
      type: "Feature",
      properties: { name: "Manhattan", geometry_status: "simplified" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-73.9338, 40.8820], [-73.9230, 40.8780], [-73.9210, 40.8680], [-73.9300, 40.8460],
          [-73.9340, 40.8280], [-73.9420, 40.8070], [-73.9520, 40.7870], [-73.9620, 40.7700],
          [-73.9720, 40.7500], [-73.9840, 40.7290], [-73.9970, 40.7080], [-74.0110, 40.7005],
          [-74.0190, 40.7060], [-74.0150, 40.7190], [-74.0080, 40.7350], [-74.0000, 40.7540],
          [-73.9910, 40.7730], [-73.9820, 40.7930], [-73.9730, 40.8120], [-73.9620, 40.8330],
          [-73.9500, 40.8540], [-73.9430, 40.8720], [-73.9338, 40.8820],
        ]],
      },
    },
  ],
};

fs.writeFileSync(path.join(projectRoot, "data/manhattan_boundaries.geojson"), `${JSON.stringify(boundary, null, 2)}\n`);
console.log(`Prepared ${neighborhoodRows.length} neighborhood-year rows and ${cellRowsOutput.length} cell-year rows.`);
console.log(`Observed annual rent range: $${Math.round(minRent).toLocaleString()}–$${Math.round(maxRent).toLocaleString()}.`);
