import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(",")[index] ?? ""])));
}

const rows = parseCsv(fs.readFileSync(path.join(projectRoot, "data/hex_cell_year.csv"), "utf8"));
const cells = new Map();
for (const row of rows) {
  if (!cells.has(row.cell_id)) cells.set(row.cell_id, []);
  cells.get(row.cell_id).push(row);
}

const failures = [];
if (rows.length !== 1024) failures.push(`Expected 1024 cell-year rows; found ${rows.length}.`);
if (cells.size !== 64) failures.push(`Expected 64 cells; found ${cells.size}.`);

for (const [cellId, series] of cells) {
  series.sort((a, b) => Number(a.year) - Number(b.year));
  if (series.length !== 16) failures.push(`${cellId} has ${series.length} years instead of 16.`);
  for (const row of series.filter((item) => Number(item.year) <= 2014)) {
    if (row.rent !== "" || row.height_mm !== "") failures.push(`${cellId} ${row.year} should remain unavailable.`);
  }
  for (let index = 1; index < series.length; index += 1) {
    const current = series[index];
    const prior = series[index - 1];
    if (current.rent === "" || prior.rent === "" || current.yoy_pct === "") continue;
    const expected = ((Number(current.rent) - Number(prior.rent)) / Number(prior.rent)) * 100;
    if (Math.abs(expected - Number(current.yoy_pct)) > 0.11) failures.push(`${cellId} ${current.year} YoY mismatch.`);
  }
}

const observed = rows.filter((row) => row.rent !== "");
const heights = [...observed]
  .map((row) => ({ rent: Number(row.rent), height: Number(row.height_mm) }))
  .sort((a, b) => a.rent - b.rent);
for (let index = 1; index < heights.length; index += 1) {
  if (heights[index].rent > heights[index - 1].rent && heights[index].height < heights[index - 1].height) {
    failures.push("Physical height is not monotonic with rent.");
    break;
  }
}

const samples = [
  ["H01", 2015], ["H18", 2020], ["H32", 2025], ["H47", 2019], ["H64", 2025],
].map(([cellId, year]) => rows.find((row) => row.cell_id === cellId && Number(row.year) === year));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS · ${cells.size} cells · ${rows.length} cell-year rows · ${observed.length} observed values.`);
  console.table(samples.map((row) => ({
    cell: row.cell_id,
    neighborhood: row.neighborhood,
    year: row.year,
    rent: row.rent || "No data",
    yoy: row.yoy_pct || "No data",
    height_mm: row.height_mm || "No data",
  })));
}
