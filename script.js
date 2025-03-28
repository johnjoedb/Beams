// Example steel database: Section, Z (cm³), I (cm⁴)
const steelDatabase = [
  { section: "IPE200", Z: 938, I: 17600 },
  { section: "IPE240", Z: 1760, I: 38700 },
  { section: "IPE300", Z: 3340, I: 94600 },
  { section: "HEA200", Z: 2100, I: 46000 },
  { section: "HEA300", Z: 4740, I: 156000 },
  // Additional UK beams can be added here:
  { section: "UB203x133x25", Z: 134, I: 1360 },
  { section: "UB305x165x40", Z: 290, I: 4420 },
];

window.addEventListener("load", () => {
  // Populate dropdown with steel sections
  const sectionsSelect = document.getElementById("sections");
  steelDatabase.forEach((s, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.text = s.section;
    sectionsSelect.add(option);
  });

  // Set up Calculate button
  document.getElementById("calcBtn").addEventListener("click", runDesign);

  // Initialize charts
  createCharts();
});

function runDesign() {
  const span = parseFloat(document.getElementById("span").value); // m
  const udl = parseFloat(document.getElementById("udl").value); // kN/m
  const fy = parseFloat(document.getElementById("fy").value);   // MPa
  let E = parseFloat(document.getElementById("E").value);         // GPa
  E = E * 1e9; // convert to Pa

  // Selected steel section
  const idx = parseInt(document.getElementById("sections").value);
  const { section, Z, I } = steelDatabase[idx];
  
  // Convert from cm³ and cm⁴ to m³ and m⁴
  const Z_m3 = Z * 1e-6;
  const I_m4 = I * 1e-8;

  // Calculations
  const MEd = (udl * span * span) / 8; // kNm
  const VEd = (udl * span) / 2; // kN

  // Deflection
  const w_Nm = udl * 1000; // N/m
  const defl = (5 * w_Nm * Math.pow(span, 4)) / (384 * E * I_m4); // m
  const defl_mm = defl * 1000; // mm

  // Bending stress (Pa)
  const MEd_Nm = MEd * 1000;
  const sigma_b = MEd_Nm / Z_m3;

  // Shear stress (Pa) - simplified
  const VEd_N = VEd * 1000;
  const tau_v = VEd_N / (0.6 * Z_m3);

  // Eurocode checks
  const fy_Pa = fy * 1e6;
  const deflLimit = (span / 250) * 1000; // mm

  const ratioBending = sigma_b / fy_Pa;
  const ratioShear = tau_v / fy_Pa;
  const ratioDefl = defl_mm / deflLimit;
  
  const utilization = Math.max(ratioBending, ratioShear, ratioDefl);

  // Display results
  document.getElementById("momentRes").innerText = MEd.toFixed(2);
  document.getElementById("shearRes").innerText = VEd.toFixed(2);
  document.getElementById("deflRes").innerText = defl_mm.toFixed(2);
  document.getElementById("utilRes").innerText = utilization.toFixed(3);
  document.getElementById("checkRes").innerText = utilization <= 1 ? "OK" : "FAIL";

  // Update charts
  updateCharts(span, udl);
}

let momentChart, shearChart;
function createCharts() {
  const ctxM = document.getElementById("momentChart").getContext("2d");
  momentChart = new Chart(ctxM, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Bending Moment (kNm)",
        data: [],
        borderColor: "blue",
        fill: false
      }],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Position (m)" } },
        y: { title: { display: true, text: "Moment (kNm)" } },
      },
    },
  });

  const ctxS = document.getElementById("shearChart").getContext("2d");
  shearChart = new Chart(ctxS, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Shear (kN)",
        data: [],
        borderColor: "red",
        fill: false
      }],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Position (m)" } },
        y: { title: { display: true, text: "Shear (kN)" } },
      },
    },
  });
}

function updateCharts(span, udl) {
  const samples = 6;
  const xVals = [];
  const mVals = [];
  const vVals = [];

  for (let i = 0; i < samples; i++) {
    const x = (span * i) / (samples - 1);
    xVals.push(x.toFixed(2));
    const Mx = udl * x * (span - x) / 2;
    mVals.push(Mx.toFixed(2));
    let Vx = udl * (span / 2 - x);
    vVals.push(Vx.toFixed(2));
  }

  momentChart.data.labels = xVals;
  momentChart.data.datasets[0].data = mVals;
  momentChart.update();

  shearChart.data.labels = xVals;
  shearChart.data.datasets[0].data = vVals;
  shearChart.update();
}
