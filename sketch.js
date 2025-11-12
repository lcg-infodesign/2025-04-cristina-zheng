// === Variabli globali ===
let volcanoTable;
let volcanoes = [];
let filteredVolcanoes = [];
let hoveredVolcano = null;
let worldMap;

// === Preload: carica dataset e immagini ===
function preload() {
  volcanoTable = loadTable('assets/data.csv', 'csv', 'header');
  worldMap = loadImage('worldmap.svg');
}

// === Setup: crea canvas e processa dati ===
function setup() {
  const vis = document.getElementById('visualization');
  let canvas = createCanvas(vis.clientWidth, vis.clientHeight);
  canvas.parent('visualization');

  processData();
  filteredVolcanoes = volcanoes;

  textFont('Arial');
  textAlign(CENTER, CENTER);

  // Gestione filtri
  const typeSelect = document.getElementById('typeFilter');
  typeSelect.addEventListener('change', applyFilters);
}

// === Legge il CSV ===
function processData() {
  volcanoes = [];
  for (let i = 0; i < volcanoTable.getRowCount(); i++) {
    const row = volcanoTable.getRow(i);
    volcanoes.push({
      name: row.get('Volcano Name'),
      country: row.get('Country'),
      type: row.get('TypeCategory'),
      status: row.get('Status'),
      lastEruption: row.get('Last Known Eruption'),
      lat: parseFloat(row.get('Latitude')),
      lon: parseFloat(row.get('Longitude')),
      elev: parseFloat(row.get('Elevation (m)'))
    });
  }
  console.log('Vulcani caricati:', volcanoes.length);
}

// === Disegno principale ===
function draw() {
  background(240);

  // mappa del mondo di sfondo
  imageMode(CORNER);
  image(worldMap, 25, 0, width, height);

  hoveredVolcano = null;

  filteredVolcanoes.forEach(v => {
  const pos = project(v.lat, v.lon);
  drawVolcanoGlyph(v, pos.x, pos.y);
  });

  if (hoveredVolcano) drawTooltip(hoveredVolcano);

  // legenda in basso
  drawLegend();
}


// === Conversione lat/lon → coordinate canvas ===
function project(lat, lon) {
  let x = map(lon, -180, 180, 0, width);
  let y = map(lat, 90, -90, 0, height);
  return { x, y };
}

// === Disegna icona vulcano ===
function drawVolcanoGlyph(v, x, y) {
  let size = 10;
  let fillColor = getColorByType(v.type);

  let d = dist(mouseX, mouseY, x, y);
  let hovered = d < size;
  if (hovered) hoveredVolcano = v;

  push();
  translate(x, y);
  noStroke();
  fill(fillColor);
  if (hovered) {
    stroke(255, 80, 0);
    strokeWeight(2);
  }

  const type = (v.type || "").toLowerCase();

  if (type.includes("strato")) {
    triangle(0, -size, -size * 0.6, size * 0.6, size * 0.6, size * 0.6);
  } else if (type.includes("cone")) {
    ellipse(0, 0, size, size);
  } else if (type.includes("maar") || type.includes("tuff")) {
    rectMode(CENTER);
    rect(0, 0, size, size);
  } else if (type.includes("crater")) {
    beginShape();
    vertex(0, -size);
    vertex(size, 0);
    vertex(0, size);
    vertex(-size, 0);
    endShape(CLOSE);
  } else if (type.includes("other") || type.includes("unknown")) {
  noFill();
  stroke(120);
  strokeWeight(1.5);
  ellipse(0, 0, size, size);
  } else {
    fill(150);
    ellipse(0, 0, size * 0.8, size * 0.8);
  }

  pop();
}

// === Colore in base al tipo
function getColorByType(type) {
  if (!type) return color(150);
  const lower = type.toLowerCase();

  if (lower.includes("strato")) return color(255, 60, 60);
  if (lower.includes("cone")) return color(0, 180, 90);
  if (lower.includes("maar") || lower.includes("tuff")) return color(160, 80, 255);
  if (lower.includes("crater")) return color(255, 150, 0);
  if (lower.includes("other") || lower.includes("unknown")) return color(180);
  return color(120);
}


// === Disegna legenda ===
function drawLegend() {
  rectMode(CORNER);
  fill(255, 230);
  rect(20, height - 140, 180, 130, 10);

  fill(0);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Legenda", 35, height - 125);

  let y = height - 105;
  drawLegendGlyph(50, y, "Stratovolcano", color(255, 60, 60), "triangle");
  drawLegendGlyph(50, y + 20, "Cone", color(0, 180, 90), "circle");
  drawLegendGlyph(50, y + 40, "Maars / Tuff ring", color(160, 80, 255), "square");
  drawLegendGlyph(50, y + 60, "Crater System", color(255, 150, 0), "diamond");
  drawLegendGlyph(50, y + 80, "Other / Unknown", color(150), "emptycircle");
}

// === piccoli glifi nella legenda
function drawLegendGlyph(x, y, label, col, shape) {
  push();
  translate(x, y);
  fill(col);
  noStroke();

  const s = 10;
  if (shape === "triangle") triangle(0, -s / 1.2, -s / 2, s / 1.2, s / 2, s / 1.2);
  else if (shape === "circle") ellipse(0, 0, s, s);
  else if (shape === "square") {
    rectMode(CENTER);
    rect(0, 0, s, s);
  } else if (shape === "emptycircle") {
  noFill();
  stroke(col);
  strokeWeight(1.5);
  ellipse(0, 0, s, s);
  } else if (shape === "emptycircle") {
    noFill();
    stroke(col);
    strokeWeight(1.5);
    ellipse(0, 0, s, s);
  }  else if (shape === "diamond") {
    beginShape();
    vertex(0, -s / 1.2);
    vertex(s / 1.2, 0);
    vertex(0, s / 1.2);
    vertex(-s / 1.2, 0);
    endShape(CLOSE);
  }
  pop();

  fill(0);
  noStroke();
  textSize(11);
  textAlign(LEFT, CENTER);
  text(label, x + 20, y);
}

// === Tooltip con info ===
function drawTooltip(v) {
  const pos = project(v.lat, v.lon);
  const lines = [
    `${v.name} (${v.country})`,
    `Stato: ${v.status}`,
    `Ultima eruzione: ${v.lastEruption}`,
    `Elevazione: ${v.elev} m`
  ];

  const boxWidth = 220;
  const lineHeight = 16;
  const boxHeight = lineHeight * lines.length + 12;

  fill(255);
  stroke(0);
  rectMode(CENTER);
  rect(pos.x, pos.y - 40, boxWidth, boxHeight, 6);

  noStroke();
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  let ty = pos.y - 40 - (lines.length - 1) * (lineHeight / 2);
  for (let line of lines) {
    text(line, pos.x, ty);
    ty += lineHeight;
  }
}

// === filtro ===
function applyFilters() {
  const typeVal = document.getElementById('typeFilter').value;

  filteredVolcanoes = volcanoes.filter(v => {
    if (typeVal === "all") return true;

    const type = (v.type || "").toLowerCase();

    if (typeVal === "Stratovolcano") return type.includes("strato");
    if (typeVal === "Cone") return type.includes("cone");
    if (typeVal === "Maar/Tuff") return type.includes("maar") || type.includes("tuff");
    if (typeVal === "Crater") return type.includes("crater");
    if (typeVal === "Other/Unknown") return type.includes("other") || type.includes("unknown");
    return false;
  });
}

