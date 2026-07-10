import { t, getLang, setLang, applyStaticTranslations } from './i18n.js';

// ---------- Minetti metabolic cost model ----------
// C(i) in J/kg/m, i = grade as fraction (-0.45 to 0.45)
function minettiCost(i){
  i = Math.max(-0.45, Math.min(0.45, i));
  return 155.4*Math.pow(i,5) - 30.4*Math.pow(i,4) - 43.3*Math.pow(i,3) + 46.3*Math.pow(i,2) + 19.5*i + 3.6;
}
const C0 = minettiCost(0);

// ACSM (American College of Sports Medicine) running equation, shown as a
// second reference curve for comparison: VO2 = 0.2·speed + 0.9·speed·grade + 3.5.
// Cost per horizontal metre is speed-independent — (0.2v+0.9vi)/v = 0.2+0.9i —
// so, like Minetti's C(i), only the ratio to its flat value (0.2) matters here.
// It's linear (no braking-cost upturn on steep downhills) and is documented to
// run high versus directly measured VO2, but it's still the equation most
// commonly taught/used in sports-science settings, which is why it's useful
// as a reference rather than as the model driving the actual estimation.
function acsmCost(i){
  i = Math.max(-0.45, Math.min(0.45, i));
  return 0.2 + 0.9*i;
}
const ACSM_C0 = acsmCost(0);

function haversine(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const toRad = d => d*Math.PI/180;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function fmtPace(secPerKm){
  if(!isFinite(secPerKm) || secPerKm<=0) return '–';
  const m = Math.floor(secPerKm/60);
  const s = Math.round(secPerKm%60);
  return m+':'+String(s).padStart(2,'0');
}
function fmtTime(totalSec){
  totalSec = Math.round(totalSec);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  if(h>0) return h+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s';
  return m+'m '+String(s).padStart(2,'0')+'s';
}
function smoothArray(arr, window){
  const out = [];
  const half = Math.floor(window/2);
  for(let i=0;i<arr.length;i++){
    let sum=0,count=0;
    for(let j=Math.max(0,i-half); j<=Math.min(arr.length-1,i+half); j++){ sum+=arr[j]; count++; }
    out.push(sum/count);
  }
  return out;
}
function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function setStatus(el, msg, cls){ el.className='status '+(cls||''); el.textContent = msg; }

// Splits a GPX document into independent point-arrays, one per <trkseg>.
// Never bridges the gap between two segments (e.g. a paused recording that
// resumes somewhere else) — each segment's distance is accumulated on its own.
function extractTrkSegments(doc){
  const segEls = Array.from(doc.querySelectorAll('trkseg'));
  if(segEls.length){
    return segEls.map(seg => Array.from(seg.querySelectorAll('trkpt'))).filter(a=>a.length>1);
  }
  const pts = Array.from(doc.querySelectorAll('trkpt'));
  return pts.length>1 ? [pts] : [];
}
function parseXmlOrThrow(text){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if(doc.querySelector('parsererror')) throw new Error(t('errors.invalidXml'));
  return doc;
}

// Linear-interpolates elevation (and time, if present) at a given LOCAL
// distance `d` along a single track segment's point list (sorted by dist,
// starting at 0). Used to sample the profile at fixed-distance steps instead
// of at whatever spacing the raw GPS points happen to have.
function interpAtDist(pts, d){
  if(d <= pts[0].dist) return pts[0];
  const last = pts[pts.length-1];
  if(d >= last.dist) return last;
  let lo=0, hi=pts.length-1;
  while(hi-lo>1){
    const mid=(lo+hi)>>1;
    if(pts[mid].dist<=d) lo=mid; else hi=mid;
  }
  const p0=pts[lo], p1=pts[hi];
  const t = p1.dist>p0.dist ? (d-p0.dist)/(p1.dist-p0.dist) : 0;
  const out = { ele: p0.ele + (p1.ele-p0.ele)*t };
  if(p0.time!==undefined && p1.time!==undefined) out.time = p0.time + (p1.time-p0.time)*t;
  return out;
}

// Builds grade segments over fixed LINEAR-DISTANCE windows (e.g. every 20m),
// instead of between raw consecutive GPS points (which can be 1-3m apart at
// 1Hz recording — far too short a baseline for a noisy elevation channel).
// `rawSegs` is an array of { offset, pts } — one entry per <trkseg>, where
// `pts` uses LOCAL distance (starting at 0) and `offset` is where that
// segment sits on the track's GLOBAL distance scale (0 for training files,
// since only relative grade/pace matter there). Windows never span across a
// <trkseg> boundary. Returns segments with GLOBAL distStart/distEnd so they
// line up with the rest of the app (elevation profile, splits table, etc).
function buildWindowedSegments(rawSegs, windowM, needPace){
  const segments = [];
  for(const {offset, pts} of rawSegs){
    if(pts.length<2) continue;
    const segTotalDist = pts[pts.length-1].dist;
    let d = 0;
    while(d < segTotalDist){
      const dEnd = Math.min(d+windowM, segTotalDist);
      const stepDist = dEnd-d;
      if(stepDist < 1){ break; } // skip a negligible leftover tail
      const p0 = interpAtDist(pts, d);
      const p1 = interpAtDist(pts, dEnd);
      const grade = (p1.ele-p0.ele)/stepDist;
      const seg = { grade, dist: stepDist, distStart: offset+d, distEnd: offset+dEnd, eleStart: p0.ele, eleEnd: p1.ele };
      if(needPace){
        const dTime = p1.time - p0.time;
        if(!(dTime>0)){ d = dEnd; continue; } // skip windows with no time progress
        seg.actualPaceSecPerKm = (dTime/stepDist)*1000;
      }
      segments.push(seg);
      d = dEnd;
    }
  }
  return segments;
}

// ---------- STATE ----------
let baselinePaceSecPerKm = null;
let GRADE_BIN_SIZE = 0.02; // width of each grade "bin" (2% default) — configurable in the UI
let GRADE_WINDOW_M = 20; // linear-distance window (meters) used to compute grade itself — configurable in the UI
const KEY_POINT_MIN_ELEVATION_M = 30; // minimum prominence for a summit/valley to count as an "emblematic" point
let gradeSegments = []; // {grade, actualPaceSecPerKm, dist} — derived from trainingFiles
let usedActivities = []; // {name, dist} — derived from trainingFiles
let trainingFiles = []; // {id, name, dist, gainUp, segments} — source of truth for step 1
let trainingFileSeq = 0;
let targetTrack = null; // {points:[{dist,ele,lat,lon}], totalDist, gainUp, gainDown}

// ---------- STEP 1: TRAINING GPX UPLOADS ----------
const trainingDropzone = document.getElementById('trainingDropzone');
const trainingInput = document.getElementById('trainingInput');
const trainingStatus = document.getElementById('trainingStatus');
const activityListEl = document.getElementById('activityList');
const clearTrainingRow = document.getElementById('clearTrainingRow');

trainingDropzone.addEventListener('click', ()=>trainingInput.click());
trainingDropzone.addEventListener('dragover', e=>{e.preventDefault(); trainingDropzone.classList.add('drag');});
trainingDropzone.addEventListener('dragleave', ()=>trainingDropzone.classList.remove('drag'));
trainingDropzone.addEventListener('drop', e=>{
  e.preventDefault(); trainingDropzone.classList.remove('drag');
  if(e.dataTransfer.files.length) handleTrainingFiles(e.dataTransfer.files);
});
trainingInput.addEventListener('change', e=>{
  if(e.target.files.length) handleTrainingFiles(e.target.files);
  trainingInput.value = ''; // allow re-selecting the same file to reload it
});
document.getElementById('clearTrainingBtn').addEventListener('click', ()=>{
  trainingFiles = [];
  activityListEl.innerHTML = '';
  refreshTrainingDerived();
  setStatus(trainingStatus, t('misc.allRemoved'), '');
});

function readFileAsText(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error(t('errors.cantReadFile', {name: file.name})));
    reader.readAsText(file);
  });
}

async function handleTrainingFiles(fileList){
  const files = Array.from(fileList).filter(f=>f.name.toLowerCase().endsWith('.gpx'));
  if(files.length===0){ setStatus(trainingStatus, t('misc.noGpxFiles'), 'err'); return; }

  setStatus(trainingStatus, t('misc.processing', {n: files.length}), 'pending');
  let addedCount = 0, updatedCount = 0, skippedCount = 0;

  for(const file of files){
    try{
      const text = await readFileAsText(file);
      const parsed = parseTrainingGpx(text);
      if(!parsed.hasTime){
        skippedCount++;
        addOrReplaceRow(null, file.name, t('misc.noTimestamps'), true);
        continue;
      }
      const segments = windowSegmentsForTrainingFile(parsed.rawSegs);
      if(segments.length===0){
        skippedCount++;
        addOrReplaceRow(null, file.name, t('misc.noValidSegments'), true);
        continue;
      }
      const existing = trainingFiles.find(f=>f.name===file.name);
      if(existing){
        existing.dist = parsed.totalDist;
        existing.gainUp = parsed.gainUp;
        existing.rawSegs = parsed.rawSegs;
        existing.segments = segments;
        updatedCount++;
        addOrReplaceRow(existing.id, file.name, (parsed.totalDist/1000).toFixed(1)+' km · D+'+Math.round(parsed.gainUp)+'m', false);
      }else{
        const id = 'tf'+(trainingFileSeq++);
        trainingFiles.push({id, name: file.name, dist: parsed.totalDist, gainUp: parsed.gainUp, rawSegs: parsed.rawSegs, segments});
        addedCount++;
        addOrReplaceRow(id, file.name, (parsed.totalDist/1000).toFixed(1)+' km · D+'+Math.round(parsed.gainUp)+'m', false);
      }
    }catch(err){
      skippedCount++;
      addOrReplaceRow(null, file.name, t('misc.fileReadErrorGeneric'), true);
    }
  }

  refreshTrainingDerived();

  if(gradeSegments.length < 20){
    setStatus(trainingStatus, t('misc.insufficientData'), 'err');
    return;
  }
  const parts = [];
  if(addedCount) parts.push(t('misc.addedSuffix', {n: addedCount}));
  if(updatedCount) parts.push(t('misc.updatedSuffix', {n: updatedCount}));
  if(skippedCount) parts.push(t('misc.skippedSuffix', {n: skippedCount}));
  setStatus(trainingStatus, parts.join(' · ')+' · '+t('misc.totalSegments', {n: gradeSegments.length}), 'ok');
}

// Creates or updates a row in the activity list. Rows tied to a trainingFiles
// entry (id !== null) get a delete (×) button; warning rows for skipped
// files (id === null) are just informational.
function addOrReplaceRow(id, name, metaText, isWarn){
  let row = id ? activityListEl.querySelector('[data-id="'+id+'"]') : null;
  if(!row){
    row = document.createElement('div');
    if(id) row.setAttribute('data-id', id);
    activityListEl.appendChild(row);
  }
  row.className = 'activity-row' + (isWarn ? ' warn' : '');
  const metaClass = isWarn ? 'meta warn' : 'meta';
  const delBtn = id ? '<button class="del-btn" data-remove="'+id+'" title="'+t('misc.removeTrainingTitle')+'">✕</button>' : '';
  row.innerHTML = '<span class="name">'+escapeHtml(name)+'</span><span class="row-actions"><span class="'+metaClass+'">'+metaText+'</span>'+delBtn+'</span>';
}

activityListEl.addEventListener('click', e=>{
  const btn = e.target.closest('[data-remove]');
  if(!btn) return;
  const id = btn.getAttribute('data-remove');
  trainingFiles = trainingFiles.filter(f=>f.id!==id);
  btn.closest('.activity-row').remove();
  refreshTrainingDerived();
  setStatus(trainingStatus, t('misc.trainingRemovedCount', {n: gradeSegments.length}), '');
});

// Rebuilds gradeSegments/usedActivities from trainingFiles and refreshes the
// baseline stats, effort-curve chart and downstream results.
function refreshTrainingDerived(){
  gradeSegments = trainingFiles.flatMap(f=>f.segments);
  usedActivities = trainingFiles.map(f=>({name:f.name, dist:f.dist}));
  clearTrainingRow.style.display = trainingFiles.length ? 'flex' : 'none';

  if(gradeSegments.length < 20){
    baselinePaceSecPerKm = null;
    document.getElementById('baselineStats').style.display='none';
    document.getElementById('gapChartWrap').style.display='none';
    document.getElementById('runnerProfileCard').style.display='none';
  }else{
    computeBaseline();
    renderGapChart();
    renderRunnerProfile();
  }
  maybeShowResults();
}

// Rebuilds every training file's grade/pace segments from its stored raw
// distance series using the current GRADE_WINDOW_M, then refreshes
// everything downstream (baseline, chart, profile, results).
function recomputeGradeWindow(){
  for(const f of trainingFiles){
    f.segments = windowSegmentsForTrainingFile(f.rawSegs);
  }
  refreshTrainingDerived(); // also calls maybeShowResults(), which re-windows the target track
}

// Parses a training GPX: needs <time> per trkpt to derive pace.
// Smooths lat/lon (not just elevation) to damp GPS jitter, which otherwise
// inflates total distance, and never bridges across <trkseg> boundaries.
function parseTrainingGpx(text){
  const doc = parseXmlOrThrow(text);
  const trkSegs = extractTrkSegments(doc);
  const totalPts = trkSegs.reduce((s,a)=>s+a.length, 0);
  if(totalPts < 2) throw new Error(t('errors.notEnoughPoints'));

  const allTrkpts = trkSegs.flat();
  const hasTime = allTrkpts.every(pt=>{
    const t = pt.querySelector('time');
    return t && !isNaN(Date.parse(t.textContent));
  });
  if(!hasTime) return {hasTime:false, rawSegs:[], totalDist:0, gainUp:0};

  const rawSegs = [];
  let cumDist = 0, gainUp = 0;
  const NOISE_FLOOR_M = 0.25; // very light — just damps single-point GPS jitter (affects distance, not grade)

  for(const segPts of trkSegs){
    const raw = segPts.map(pt=>({
      lat: parseFloat(pt.getAttribute('lat')),
      lon: parseFloat(pt.getAttribute('lon')),
      ele: pt.querySelector('ele') ? parseFloat(pt.querySelector('ele').textContent) : 0,
      time: Date.parse(pt.querySelector('time').textContent)
    }));
    const sLat = smoothArray(raw.map(p=>p.lat), 3);
    const sLon = smoothArray(raw.map(p=>p.lon), 3);

    const localPts = [{dist:0, ele: raw[0].ele, time: raw[0].time/1000}];
    let localDist = 0;
    for(let i=1;i<raw.length;i++){
      const dDist = haversine(sLat[i-1], sLon[i-1], sLat[i], sLon[i]);
      const dEle = raw[i].ele - raw[i-1].ele;
      if(dEle>0) gainUp += dEle;
      if(dDist <= NOISE_FLOOR_M) continue;
      localDist += dDist;
      localPts.push({dist: localDist, ele: raw[i].ele, time: raw[i].time/1000});
    }
    if(localPts.length>=2){
      rawSegs.push({offset:0, pts: localPts});
      cumDist += localDist;
    }
  }
  return {hasTime:true, rawSegs, totalDist: cumDist, gainUp};
}

// (Re)builds a training file's grade/pace segments from its raw distance
// series using the current GRADE_WINDOW_M — called at load time and again
// whenever the window size setting changes.
function windowSegmentsForTrainingFile(rawSegs){
  return buildWindowedSegments(rawSegs, GRADE_WINDOW_M, true)
    .map(s => ({ grade: s.grade, actualPaceSecPerKm: s.actualPaceSecPerKm, dist: s.dist }));
}

function computeBaseline(){
  let weightedSum = 0, weightTotal = 0;
  for(const seg of gradeSegments){
    const flatEquivPace = seg.actualPaceSecPerKm * (C0 / minettiCost(seg.grade));
    weightedSum += flatEquivPace * seg.dist;
    weightTotal += seg.dist;
  }
  baselinePaceSecPerKm = weightedSum / weightTotal;

  document.getElementById('baselineStats').style.display='grid';
  document.getElementById('statBaseline').innerHTML = fmtPace(baselinePaceSecPerKm)+' <span>/km</span>';
  document.getElementById('statRuns').textContent = usedActivities.length;
  document.getElementById('statDist').innerHTML = (weightTotal/1000).toFixed(1)+' <span>km</span>';
  const longest = Math.max(...usedActivities.map(a=>a.dist));
  document.getElementById('statLongest').innerHTML = (longest/1000).toFixed(1)+' <span>km</span>';
}

// Goodness-of-fit of a model curve `costFn` (with its own costFn(0) baseline)
// against the runner's own binned observed pace-vs-grade data.
function fitStats(binPoints, costFn, cost0){
  if(binPoints.length===0) return {mape:null, r2:null};
  let errSum=0;
  const residuals=[], observed=[];
  for(const p of binPoints){
    const predicted = baselinePaceSecPerKm * costFn(p.grade)/cost0;
    errSum += Math.abs(predicted-p.pace)/p.pace;
    residuals.push(predicted-p.pace);
    observed.push(p.pace);
  }
  const mape = errSum/binPoints.length;
  const meanObs = observed.reduce((a,b)=>a+b,0)/observed.length;
  const ssRes = residuals.reduce((s,r)=>s+r*r,0);
  const ssTot = observed.reduce((s,o)=>s+(o-meanObs)*(o-meanObs),0);
  const r2 = ssTot>0 ? 1 - ssRes/ssTot : null;
  return {mape, r2};
}

document.getElementById('gradeWindowSelect').addEventListener('change', e=>{
  GRADE_WINDOW_M = parseFloat(e.target.value);
  if(trainingFiles.length) recomputeGradeWindow();
  else maybeShowResults();
});

document.getElementById('binSizeSelect').addEventListener('change', e=>{
  GRADE_BIN_SIZE = parseFloat(e.target.value);
  if(baselinePaceSecPerKm){
    renderGapChart();
    maybeShowResults(); // confidence card's grade-coverage/fit scores also depend on GRADE_BIN_SIZE
  }
});

function renderGapChart(){
  const wrap = document.getElementById('gapChartWrap');
  wrap.style.display='block';
  const W=860,H=280,padL=54,padR=20,padT=14,padB=36;

  // bin observed segments by grade
  const binSize = GRADE_BIN_SIZE;
  const bins = {};
  for(const seg of gradeSegments){
    const g = Math.max(-0.30, Math.min(0.30, seg.grade));
    const key = Math.round(g/binSize);
    if(!bins[key]) bins[key]=[];
    bins[key].push(seg.actualPaceSecPerKm);
  }
  const binPoints = Object.keys(bins).map(k=>{
    const arr = bins[k].sort((a,b)=>a-b);
    const median = arr[Math.floor(arr.length/2)];
    return {grade: parseInt(k)*binSize, pace: median, n: arr.length};
  }).filter(p=>p.n>=3).sort((a,b)=>a.grade-b.grade);

  const gMin=-0.30, gMax=0.30;
  const paceVals = binPoints.map(p=>p.pace);
  const minettiVals = [], acsmVals = [];
  for(let g=gMin; g<=gMax+1e-9; g+=0.01){
    minettiVals.push(baselinePaceSecPerKm * minettiCost(g)/C0);
    acsmVals.push(baselinePaceSecPerKm * acsmCost(g)/ACSM_C0);
  }
  const pMin = Math.min(...paceVals, ...minettiVals, ...acsmVals)*0.92;
  const pMax = Math.max(...paceVals, ...minettiVals, ...acsmVals)*1.08;

  const x = g => padL + (g-gMin)/(gMax-gMin) * (W-padL-padR);
  const y = p => padT + (1 - (p-pMin)/(pMax-pMin)) * (H-padT-padB);

  let svg = `<svg viewBox="0 0 ${W} ${H}">`;

  // Y axis gridlines + pace labels
  const yTickCount = 5;
  for(let i=0;i<=yTickCount;i++){
    const p = pMin + (pMax-pMin)*i/yTickCount;
    svg += `<line x1="${padL}" y1="${y(p).toFixed(1)}" x2="${W-padR}" y2="${y(p).toFixed(1)}" stroke="#2c342e" stroke-width="1"/>`;
    svg += `<text x="${padL-8}" y="${(y(p)+3).toFixed(1)}" fill="#5b645a" font-size="10" font-family="JetBrains Mono" text-anchor="end">${fmtPace(p)}</text>`;
  }
  // Y axis title
  svg += `<text x="${14}" y="${padT+(H-padT-padB)/2}" fill="#5b645a" font-size="10" font-family="JetBrains Mono" text-anchor="middle" transform="rotate(-90 14 ${padT+(H-padT-padB)/2})">min/km</text>`;

  for(let g=-0.3; g<=0.3+1e-9; g+=0.1){
    svg += `<line x1="${x(g)}" y1="${padT}" x2="${x(g)}" y2="${H-padB}" stroke="#2c342e" stroke-width="1"/>`;
    svg += `<text x="${x(g)}" y="${H-padB+18}" fill="#5b645a" font-size="11" font-family="JetBrains Mono" text-anchor="middle">${Math.round(g*100)}%</text>`;
  }
  svg += `<line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#2c342e"/>`;
  svg += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#2c342e"/>`;
  // X axis title
  svg += `<text x="${padL+(W-padL-padR)/2}" y="${H-4}" fill="#5b645a" font-size="10" font-family="JetBrains Mono" text-anchor="middle">${t('chart.gradeAxis')}</text>`;

  // ACSM curve (dashed, drawn first so Minetti + dots sit on top)
  let acsmPath='';
  let gi=0;
  for(let g=gMin; g<=gMax+1e-9; g+=0.01, gi++){
    const p = baselinePaceSecPerKm * acsmCost(g)/ACSM_C0;
    acsmPath += (gi===0?'M':'L') + x(g).toFixed(1) + ' ' + y(p).toFixed(1) + ' ';
  }
  svg += `<path d="${acsmPath}" fill="none" stroke="#7d8fae" stroke-width="2" stroke-dasharray="5,4"/>`;

  // Minetti curve
  let modelPath='';
  gi=0;
  for(let g=gMin; g<=gMax+1e-9; g+=0.01, gi++){
    const p = baselinePaceSecPerKm * minettiCost(g)/C0;
    modelPath += (gi===0?'M':'L') + x(g).toFixed(1) + ' ' + y(p).toFixed(1) + ' ';
  }
  svg += `<path d="${modelPath}" fill="none" stroke="#c98a3b" stroke-width="2.5"/>`;

  // hoverable markers every 5% along each curve — lets you check the exact
  // predicted pace (and how it was computed) at any grade, not just eyeball it
  for(let g=gMin; g<=gMax+1e-9; g+=0.05){
    const gr = Math.round(g*100)/100;
    const pM = baselinePaceSecPerKm * minettiCost(gr)/C0;
    const pA = baselinePaceSecPerKm * acsmCost(gr)/ACSM_C0;
    svg += `<circle class="gap-hover" data-model="minetti" data-grade="${gr}" cx="${x(gr).toFixed(1)}" cy="${y(pM).toFixed(1)}" r="6" fill="#c98a3b" fill-opacity="0.16" stroke="none" style="cursor:pointer;"/>`;
    svg += `<circle class="gap-hover" data-model="acsm" data-grade="${gr}" cx="${x(gr).toFixed(1)}" cy="${y(pA).toFixed(1)}" r="6" fill="#7d8fae" fill-opacity="0.14" stroke="none" style="cursor:pointer;"/>`;
  }

  for(const p of binPoints){
    svg += `<circle cx="${x(p.grade).toFixed(1)}" cy="${y(p.pace).toFixed(1)}" r="${Math.min(3+p.n*0.3,8)}" fill="#7fa66c" fill-opacity="0.75"/>`;
  }

  svg += `</svg>`;
  const gapChartContainer = document.getElementById('gapChart');
  gapChartContainer.innerHTML = svg;

  const gapTooltip = document.getElementById('tooltip');
  gapChartContainer.querySelectorAll('.gap-hover').forEach(marker=>{
    marker.addEventListener('mousemove', ev=>{
      const g = parseFloat(marker.getAttribute('data-grade'));
      const isMinetti = marker.getAttribute('data-model')==='minetti';
      const costFn = isMinetti ? minettiCost : acsmCost;
      const cost0 = isMinetti ? C0 : ACSM_C0;
      const modelName = isMinetti ? 'Minetti' : 'ACSM';
      const ratio = costFn(g)/cost0;
      const pace = baselinePaceSecPerKm*ratio;
      const gradeStr = (g*100>=0?'+':'')+(g*100).toFixed(0)+'%';
      gapTooltip.innerHTML = t('chart.tooltipLine1', {model: modelName, grade: gradeStr})
        + fmtPace(baselinePaceSecPerKm)+'/km × '+ratio.toFixed(3)+' = <strong>'+fmtPace(pace)+'/km</strong>';
      gapTooltip.style.left = (ev.pageX+14)+'px';
      gapTooltip.style.top = (ev.pageY-10)+'px';
      gapTooltip.style.opacity = 1;
    });
    marker.addEventListener('mouseleave', ()=>{ gapTooltip.style.opacity=0; });
  });

  // goodness-of-fit for both models against this runner's own data
  const minettiFit = fitStats(binPoints, minettiCost, C0);
  const acsmFit = fitStats(binPoints, acsmCost, ACSM_C0);
  const fitEl = document.getElementById('gapFitStats');
  if(minettiFit.mape===null){
    fitEl.innerHTML = t('chart.notEnoughGradesFit');
  }else{
    const better = minettiFit.mape <= acsmFit.mape ? 'Minetti' : 'ACSM';
    fitEl.innerHTML =
      '<strong>'+t('chart.fitIntro')+'</strong> '
      + '<span style="color:var(--ochre)">●</span> Minetti — '+t('chart.avgDeviation')+' <strong>'+(minettiFit.mape*100).toFixed(1)+'%</strong>, R² '+(minettiFit.r2!==null?minettiFit.r2.toFixed(2):'–')+
      ' &nbsp;·&nbsp; <span style="color:#7d8fae">●</span> ACSM — '+t('chart.avgDeviation')+' <strong>'+(acsmFit.mape*100).toFixed(1)+'%</strong>, R² '+(acsmFit.r2!==null?acsmFit.r2.toFixed(2):'–')+
      ' &nbsp;·&nbsp; '+t('chart.fitConclusion', {n: binPoints.length, better});
  }

  renderGapWorkedExample();
}

// Renders a small worked-example table (using the runner's *real* baseline
// pace) inside the explanation, showing exactly how the orange curve's
// y-value at each grade is computed: baseline × C(grade)/C(0).
function renderGapWorkedExample(){
  const el = document.getElementById('gapWorkedExample');
  if(!el) return;
  const sampleGrades = [-0.30, -0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20, 0.30];
  let rows = sampleGrades.map(g=>{
    const c = minettiCost(g);
    const ratio = c/C0;
    const pace = baselinePaceSecPerKm*ratio;
    return '<tr><td>'+(g*100>=0?'+':'')+(g*100).toFixed(0)+'%</td><td>'+c.toFixed(2)+'</td><td>'+ratio.toFixed(3)+'</td><td>'+fmtPace(pace)+'/km</td></tr>';
  }).join('');
  el.innerHTML =
    '<table style="margin-top:8px;"><thead><tr><th>'+t('chart.worked.gradeHeader')+'</th><th>'+t('chart.worked.costHeader')+'</th><th>'+t('chart.worked.ratioHeader')+'</th><th>'+t('chart.worked.paceHeader')+'</th></tr></thead><tbody>'
    + rows + '</tbody></table>';
}


// ---------- STEP 2: TARGET GPX ----------
const dropzone = document.getElementById('dropzone');
const gpxInput = document.getElementById('gpxInput');
const gpxStatus = document.getElementById('gpxStatus');

dropzone.addEventListener('click', ()=>gpxInput.click());
dropzone.addEventListener('dragover', e=>{e.preventDefault(); dropzone.classList.add('drag');});
dropzone.addEventListener('dragleave', ()=>dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', e=>{
  e.preventDefault(); dropzone.classList.remove('drag');
  if(e.dataTransfer.files.length) handleGpxFile(e.dataTransfer.files[0]);
});
gpxInput.addEventListener('change', e=>{
  if(e.target.files.length) handleGpxFile(e.target.files[0]);
  gpxInput.value = ''; // allow re-selecting the same file to reload it
});

document.getElementById('removeTargetBtn').addEventListener('click', ()=>{
  targetTrack = null;
  document.getElementById('targetActionsRow').style.display='none';
  setStatus(gpxStatus, t('misc.targetRemoved'), '');
  maybeShowResults();
});

function handleGpxFile(file){
  setStatus(gpxStatus, t('misc.readingFile', {name: file.name}), 'pending');
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const track = parseTargetGpx(e.target.result);
      targetTrack = track;
      setStatus(gpxStatus, t('misc.trackLoaded', {dist: (track.totalDist/1000).toFixed(1), gainUp: Math.round(track.gainUp), gainDown: Math.round(track.gainDown)}), 'ok');
      document.getElementById('targetActionsRow').style.display='flex';
      maybeShowResults();
    }catch(err){
      setStatus(gpxStatus, t('misc.gpxReadError', {msg: err.message}), 'err');
    }
  };
  reader.readAsText(file);
}

// Parses the target GPX: only needs lat/lon/ele, time is irrelevant here.
function parseTargetGpx(text){
  const doc = parseXmlOrThrow(text);
  const trkSegs = extractTrkSegments(doc);
  const totalPts = trkSegs.reduce((s,a)=>s+a.length, 0);
  if(totalPts < 2) throw new Error(t('errors.notEnoughPoints'));

  let cumDist = 0, gainUp=0, gainDown=0;
  const points = [];
  const rawSegs = [];
  const NOISE_FLOOR_M = 0.25; // very light — just damps single-point GPS jitter (affects distance, not grade)

  for(const segPts of trkSegs){
    const raw = segPts.map(pt=>{
      const eleEl = pt.querySelector('ele');
      return {
        lat: parseFloat(pt.getAttribute('lat')),
        lon: parseFloat(pt.getAttribute('lon')),
        ele: eleEl ? parseFloat(eleEl.textContent) : 0
      };
    });
    const sLat = smoothArray(raw.map(p=>p.lat), 3);
    const sLon = smoothArray(raw.map(p=>p.lon), 3);

    if(points.length===0) points.push({dist:0, ele: raw[0].ele, lat: raw[0].lat, lon: raw[0].lon});

    const segOffset = cumDist;
    const localPts = [{dist:0, ele: raw[0].ele}];
    let localDist = 0;
    for(let i=1;i<raw.length;i++){
      const d = haversine(sLat[i-1], sLon[i-1], sLat[i], sLon[i]);
      if(d <= NOISE_FLOOR_M) continue;
      cumDist += d;
      localDist += d;
      const dEle = raw[i].ele - raw[i-1].ele;
      if(dEle>0) gainUp+=dEle; else gainDown+=-dEle;
      points.push({dist: cumDist, ele: raw[i].ele, lat: raw[i].lat, lon: raw[i].lon});
      localPts.push({dist: localDist, ele: raw[i].ele});
    }
    if(localPts.length>=2) rawSegs.push({offset: segOffset, pts: localPts});
  }
  return { points, rawSegs, totalDist: cumDist, gainUp, gainDown };
}

// ---------- STEP 3: RESULTS ----------
function maybeShowResults(){
  if(baselinePaceSecPerKm && targetTrack){
    computeAndRenderResults();
  }else{
    document.getElementById('resultsSection').style.display='none';
  }
  if(baselinePaceSecPerKm) renderRunnerProfile();
}

function computeAndRenderResults(){
  const windowedSegs = buildWindowedSegments(targetTrack.rawSegs, GRADE_WINDOW_M, false);
  const segments = [];
  let cumTime = 0;
  for(const w of windowedSegs){
    const pace = baselinePaceSecPerKm * (minettiCost(w.grade)/C0); // sec per km
    const segTime = (pace/1000) * w.dist;
    cumTime += segTime;
    segments.push({distStart: w.distStart, distEnd: w.distEnd, eleStart: w.eleStart, eleEnd: w.eleEnd, grade: w.grade, pace, segTime, cumTime, cumDist: w.distEnd});
  }

  const longestTested = usedActivities.length ? Math.max(...usedActivities.map(a=>a.dist)) : targetTrack.totalDist;
  let riegelFactor = 1;
  let riegelText = '';
  if(targetTrack.totalDist > longestTested * 1.15){
    riegelFactor = Math.pow(targetTrack.totalDist/longestTested, 0.06);
    riegelText = t('misc.riegelApplied', {dist: (targetTrack.totalDist/1000).toFixed(1), longest: (longestTested/1000).toFixed(1), factor: riegelFactor.toFixed(3)});
  } else {
    riegelText = t('misc.riegelNotApplied');
  }
  document.getElementById('riegelNote').textContent = riegelText;

  const totalTime = cumTime * riegelFactor;
  const avgPace = (totalTime/targetTrack.totalDist)*1000;

  document.getElementById('resultsSection').style.display='block';
  document.getElementById('resultTime').textContent = fmtTime(totalTime);
  document.getElementById('resultPace').innerHTML = fmtPace(avgPace)+'<span>/km</span>';
  document.getElementById('resultDist').textContent = (targetTrack.totalDist/1000).toFixed(1)+' km · D+'+Math.round(targetTrack.gainUp)+'m · D-'+Math.round(targetTrack.gainDown)+'m';

  renderProfileChart(segments, riegelFactor);
  renderKeyPointsTable(targetTrack.points, segments, riegelFactor);
  renderSplitsTable(segments, riegelFactor);
  renderConfidence(computeConfidence(segments, riegelFactor));
}

// Single-pass "zigzag" scan: walks the elevation profile tracking a running
// extreme, and commits it as a summit/valley pivot once the profile reverses
// by at least `thresholdM` from it. Filters GPS/altimeter noise so only
// genuinely significant climbs/descents show up, not every wiggle.
function detectKeyElevationPoints(points, thresholdM){
  const pivots = [];
  if(points.length < 2) return pivots;

  let curExtIdx = 0, curExtType = null, lastPivotIdx = 0;
  for(let i=1;i<points.length;i++){
    const e = points[i].ele;

    if(curExtType===null){
      if(e > points[lastPivotIdx].ele){ curExtType='max'; curExtIdx=i; }
      else if(e < points[lastPivotIdx].ele){ curExtType='min'; curExtIdx=i; }
      continue;
    }

    const extEle = points[curExtIdx].ele;
    if(curExtType==='max'){
      if(e > extEle){ curExtIdx=i; }
      else if(extEle - e >= thresholdM){
        pivots.push({idx: curExtIdx, type: 'summit'});
        lastPivotIdx = curExtIdx; curExtType='min'; curExtIdx=i;
      }
    }else{
      if(e < extEle){ curExtIdx=i; }
      else if(e - extEle >= thresholdM){
        pivots.push({idx: curExtIdx, type: 'valley'});
        lastPivotIdx = curExtIdx; curExtType='max'; curExtIdx=i;
      }
    }
  }
  return pivots;
}

// Finds the estimated (pre-Riegel) cumulative time at a given distance along
// the target track, using the same windowed segments as the splits table.
function cumTimeAtDist(segments, dist){
  for(const s of segments){ if(s.distEnd >= dist) return s.cumTime; }
  return segments.length ? segments[segments.length-1].cumTime : 0;
}

function buildKeyPointsRows(points, segments, riegelFactor){
  const pivots = detectKeyElevationPoints(points, KEY_POINT_MIN_ELEVATION_M);
  const rows = [];
  let prevIdx = 0, prevTime = 0;
  for(const p of pivots){
    const dist = points[p.idx].dist;
    const ele = points[p.idx].ele;
    const legDist = dist - points[prevIdx].dist;
    const legEleChange = ele - points[prevIdx].ele;
    const cumTime = cumTimeAtDist(segments, dist) * riegelFactor;
    const legPace = legDist>0 ? ((cumTime-prevTime)/legDist)*1000 : null;
    rows.push({type: p.type, dist, ele, legDist, legEleChange, cumTime, legPace});
    prevIdx = p.idx; prevTime = cumTime;
  }
  return rows;
}

function renderKeyPointsTable(points, segments, riegelFactor){
  const wrap = document.getElementById('keyPointsWrap');
  const rows = buildKeyPointsRows(points, segments, riegelFactor);
  if(rows.length===0){ wrap.style.display='none'; return; }
  wrap.style.display='block';

  document.getElementById('keyPointsBody').innerHTML = rows.map(r=>{
    const typeLabel = r.type==='summit' ? t('step3.keyPoints.typeSummit') : t('step3.keyPoints.typeValley');
    const legStr = t('step3.keyPoints.legFormat', {sign: r.legEleChange>=0?'+':'', m: Math.round(r.legEleChange), km: (r.legDist/1000).toFixed(1)});
    const legClass = r.legEleChange>=0 ? 'grade-up' : 'grade-down';
    return '<tr><td>'+(r.dist/1000).toFixed(1)+'</td><td>'+typeLabel+'</td><td>'+Math.round(r.ele)+' m</td>'
      + '<td class="'+legClass+'">'+legStr+'</td>'
      + '<td>'+(r.legPace!==null ? fmtPace(r.legPace)+'/km' : '–')+'</td>'
      + '<td>'+fmtTime(r.cumTime)+'</td></tr>';
  }).join('');
}

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

// Composite, non-statistical confidence indicator combining: how much
// training data underpins the baseline pace, how much of the target track's
// grade profile is actually backed by observed training segments (vs. the
// model extrapolating), how well the Minetti model fits the runner's own
// observed pace-vs-grade curve, and how far the race distance stretches
// beyond anything already tested.
// Buckets the runner's own segments into five grade zones and compares
// observed pace against what the Minetti model predicts from their flat
// baseline in each — the residual is a relative "this terrain costs you
// more/less than your own average efficiency would suggest" signal, which is
// what turns into concrete strengths/areas-to-improve.
const RUNNER_PROFILE_ZONES = [
  { key:'strongDown', min:-Infinity, max:-0.15 },
  { key:'modDown',    min:-0.15, max:-0.05 },
  { key:'flat',       min:-0.05, max:0.05 },
  { key:'modUp',      min:0.05, max:0.15 },
  { key:'strongUp',   min:0.15, max:Infinity }
];

function computeRunnerProfile(){
  const zones = RUNNER_PROFILE_ZONES.map(z=>({...z, label: t('profile.zones.'+z.key+'.label'), range: t('profile.zones.'+z.key+'.range')}));
  for(const z of zones){
    let distSum=0, obsWeighted=0, predWeighted=0;
    for(const seg of gradeSegments){
      if(seg.grade>=z.min && seg.grade<z.max){
        distSum += seg.dist;
        obsWeighted += seg.actualPaceSecPerKm*seg.dist;
        predWeighted += (baselinePaceSecPerKm*minettiCost(seg.grade)/C0)*seg.dist;
      }
    }
    z.distKm = distSum/1000;
    if(distSum>0){
      z.obsPace = obsWeighted/distSum;
      z.predPace = predWeighted/distSum;
      z.residualPct = (z.obsPace-z.predPace)/z.predPace*100; // + = slower than model = relative weak spot
    }else{
      z.obsPace=null; z.predPace=null; z.residualPct=null;
    }
  }

  if(targetTrack){
    const pts = targetTrack.points;
    let totalD=0;
    for(const z of zones) z.targetDist = 0;
    for(let i=1;i<pts.length;i++){
      const dDist = pts[i].dist - pts[i-1].dist;
      if(dDist<=0) continue;
      const g = (pts[i].ele - pts[i-1].ele) / dDist;
      totalD += dDist;
      for(const z of zones){ if(g>=z.min && g<z.max){ z.targetDist += dDist; break; } }
    }
    for(const z of zones) z.targetPct = totalD>0 ? (z.targetDist/totalD)*100 : null;
  }
  return zones;
}

function zoneTip(z){
  if(z.distKm < 1) return t('profile.notEnoughZoneData');
  const r = z.residualPct;
  const mag = Math.abs(r);
  const advice = {
    strongDown: r>0
      ? (mag>25 ? t('profile.advice.strongDown.slowBig') : t('profile.advice.strongDown.slowSmall'))
      : t('profile.advice.strongDown.fast'),
    modDown: r>0 ? t('profile.advice.modDown.slow') : t('profile.advice.modDown.fast'),
    flat: r>0 ? t('profile.advice.flat.slow') : t('profile.advice.flat.fast'),
    modUp: r>0 ? t('profile.advice.modUp.slow') : t('profile.advice.modUp.fast'),
    strongUp: r>0
      ? (mag>25 ? t('profile.advice.strongUp.slowBig') : t('profile.advice.strongUp.slowSmall'))
      : t('profile.advice.strongUp.fast')
  };
  return advice[z.key];
}

function renderRunnerProfile(){
  const card = document.getElementById('runnerProfileCard');
  const zones = computeRunnerProfile();
  const withData = zones.filter(z=>z.distKm>=1);

  if(withData.length===0){
    card.style.display='block';
    document.getElementById('runnerProfileSummary').textContent = t('profile.notEnoughVariety');
    document.getElementById('runnerProfileZones').innerHTML='';
    document.getElementById('runnerProfileTargetNote').textContent='';
    return;
  }
  card.style.display='block';

  const worst = [...withData].sort((a,b)=>b.residualPct-a.residualPct)[0];
  const best = [...withData].sort((a,b)=>a.residualPct-b.residualPct)[0];
  document.getElementById('runnerProfileSummary').innerHTML =
    t('profile.summaryWorst', {label: worst.label.toLowerCase(), pct: (worst.residualPct>0?'+':'')+worst.residualPct.toFixed(0)})
    + t('profile.summaryBest', {label: best.label.toLowerCase(), pct: (best.residualPct>0?'+':'')+best.residualPct.toFixed(0)});

  document.getElementById('runnerProfileZones').innerHTML = zones.map(z=>{
    let residualHtml, barHtml='';
    if(z.distKm < 1){
      residualHtml = '<span style="color:var(--text-faint)">'+t('profile.notEnoughDataShort')+'</span>';
    }else{
      const c = z.residualPct>10 ? 'var(--ember)' : (z.residualPct>0 ? 'var(--ochre)' : 'var(--moss)');
      residualHtml = '<span style="color:'+c+'">'+t('profile.vsModel', {sign: z.residualPct>0?'+':'', pct: z.residualPct.toFixed(0)})+'</span>';
      const pct = clamp(50 + z.residualPct*1.5, 4, 96);
      barHtml = '<div class="factor-bar-track"><div class="factor-bar-fill" style="width:'+pct+'%; background:'+c+';"></div></div>';
    }
    const targetTag = (z.targetPct!==undefined && z.targetPct!==null && z.targetPct>=5)
      ? '<span class="zone-target-tag">'+t('profile.targetPctSuffix', {pct: Math.round(z.targetPct)})+'</span>' : '';
    return '<div class="zone-row">'
      + '<div class="zone-top"><span class="zname">'+z.label+' <span style="color:var(--text-faint); font-weight:400;">('+z.range+')</span></span><span class="zresidual">'+residualHtml+'</span></div>'
      + '<div class="zone-meta">'+t('profile.kmAnalyzed', {km: z.distKm.toFixed(1)})+(z.obsPace?t('profile.realVsModel', {obs: fmtPace(z.obsPace), pred: fmtPace(z.predPace)}):'')+'</div>'
      + barHtml
      + '<div class="zone-tip" style="margin-top:8px;">'+zoneTip(z)+'</div>'
      + targetTag
      + '</div>';
  }).join('');

  const targetNoteEl = document.getElementById('runnerProfileTargetNote');
  if(targetTrack){
    const worstWithTarget = withData.filter(z=>z.targetPct!==null).sort((a,b)=>b.residualPct-a.residualPct)[0];
    if(worstWithTarget && worstWithTarget.residualPct>10 && worstWithTarget.targetPct>=15){
      targetNoteEl.innerHTML = t('profile.targetWarning', {pct: Math.round(worstWithTarget.targetPct), label: worstWithTarget.label.toLowerCase()});
    }else{
      targetNoteEl.textContent='';
    }
  }else{
    targetNoteEl.textContent='';
  }
}


function computeConfidence(targetSegments, riegelFactor){
  const binSize = GRADE_BIN_SIZE;

  // 1) data volume
  const totalTrainedKm = gradeSegments.reduce((s,seg)=>s+seg.dist,0)/1000;
  const volumeScore = clamp((totalTrainedKm/60)*100, 0, 100);

  // 2) grade coverage: how much of the target distance falls in grade bins
  // that are meaningfully represented in the training data
  const trainedDistByBin = {};
  for(const seg of gradeSegments){
    const g = clamp(seg.grade, -0.30, 0.30);
    const key = Math.round(g/binSize);
    trainedDistByBin[key] = (trainedDistByBin[key]||0) + seg.dist;
  }
  const COVERAGE_THRESHOLD_M = 150;
  let coveredDist = 0, totalTargetDist = 0;
  for(const seg of targetSegments){
    const dDist = seg.distEnd - seg.distStart;
    totalTargetDist += dDist;
    const g = clamp(seg.grade, -0.30, 0.30);
    const key = Math.round(g/binSize);
    if((trainedDistByBin[key]||0) >= COVERAGE_THRESHOLD_M) coveredDist += dDist;
  }
  const coverageScore = totalTargetDist > 0 ? (coveredDist/totalTargetDist)*100 : 0;

  // 3) model fit: mean absolute % error between the Minetti curve and the
  // runner's own median observed pace, per grade bin (bins with n>=3 only)
  const binsForFit = {};
  for(const seg of gradeSegments){
    const g = clamp(seg.grade, -0.30, 0.30);
    const key = Math.round(g/binSize);
    if(!binsForFit[key]) binsForFit[key]=[];
    binsForFit[key].push(seg.actualPaceSecPerKm);
  }
  let errSum=0, errCount=0;
  Object.keys(binsForFit).forEach(k=>{
    const arr = binsForFit[k].sort((a,b)=>a-b);
    if(arr.length<3) return;
    const median = arr[Math.floor(arr.length/2)];
    const g = parseInt(k)*binSize;
    const predicted = baselinePaceSecPerKm * minettiCost(g)/C0;
    errSum += Math.abs(predicted-median)/median;
    errCount++;
  });
  const mape = errCount>0 ? errSum/errCount : 0.30; // pessimistic default if too little data to check
  const fitScore = clamp(100 - mape*250, 0, 100);

  // 4) distance extrapolation beyond anything tested (bigger Riegel factor = more speculative)
  const distScore = clamp(100 - (riegelFactor-1)*800, 0, 100);

  const overall = 0.25*volumeScore + 0.35*coverageScore + 0.25*fitScore + 0.15*distScore;
  let label, colorVar;
  if(overall>=75){ label=t('confidence.high'); colorVar='var(--moss)'; }
  else if(overall>=50){ label=t('confidence.medium'); colorVar='var(--ochre)'; }
  else { label=t('confidence.low'); colorVar='var(--ember)'; }

  return {
    overall, label, colorVar,
    factors: [
      { name:t('confidence.factorVolume.name'), score: volumeScore,
        note: t('confidence.factorVolume.note', {km: totalTrainedKm.toFixed(0), n: usedActivities.length}) },
      { name:t('confidence.factorCoverage.name'), score: coverageScore,
        note: t('confidence.factorCoverage.note', {pct: Math.round(coverageScore)}) },
      { name:t('confidence.factorFit.name'), score: fitScore,
        note: t('confidence.factorFit.note', {mape: (mape*100).toFixed(1)}) },
      { name:t('confidence.factorDistance.name'), score: distScore,
        note: riegelFactor>1.001 ? t('confidence.factorDistance.noteApplied', {factor: riegelFactor.toFixed(3)}) : t('confidence.factorDistance.noteNotApplied') }
    ]
  };
}

function renderConfidence(conf){
  document.getElementById('confScoreLabel').innerHTML = conf.label+' <span style="color:var(--text-faint); font-size:14px; font-weight:500;">('+Math.round(conf.overall)+'/100)</span>';
  document.getElementById('confScoreLabel').style.color = conf.colorVar;
  const bar = document.getElementById('confScoreBar');
  bar.style.width = clamp(conf.overall,0,100)+'%';
  bar.style.background = conf.colorVar;

  const factorsEl = document.getElementById('confFactors');
  factorsEl.innerHTML = conf.factors.map(f=>{
    const c = f.score>=75 ? 'var(--moss)' : (f.score>=50 ? 'var(--ochre)' : 'var(--ember)');
    return '<div class="factor-row">'
      + '<div class="factor-top"><span class="fname">'+f.name+'</span><span class="fscore">'+Math.round(f.score)+'/100</span></div>'
      + '<div class="factor-bar-track"><div class="factor-bar-fill" style="width:'+clamp(f.score,0,100)+'%; background:'+c+';"></div></div>'
      + '<div class="factor-note">'+f.note+'</div>'
      + '</div>';
  }).join('');
}

function paceColor(pace, baseline){
  const ratio = pace/baseline;
  if(ratio < 0.95) return '#7fa66c';
  if(ratio < 1.05) return '#8a9489';
  if(ratio < 1.35) return '#c98a3b';
  return '#c9613f';
}

function renderProfileChart(segments, riegelFactor){
  const W=860,H=260,padL=50,padR=20,padT=16,padB=30;
  const totalDist = targetTrack.totalDist;
  const eles = targetTrack.points.map(p=>p.ele);
  const eMin = Math.min(...eles), eMax = Math.max(...eles);
  const x = d => padL + (d/totalDist)*(W-padL-padR);
  const y = e => padT + (1-(e-eMin)/(eMax-eMin||1))*(H-padT-padB);

  let svg = `<svg viewBox="0 0 ${W} ${H}" id="profileSvg">`;
  for(let i=0;i<=4;i++){
    const e = eMin + (eMax-eMin)*i/4;
    svg += `<line x1="${padL}" y1="${y(e).toFixed(1)}" x2="${W-padR}" y2="${y(e).toFixed(1)}" stroke="#2c342e" stroke-width="1"/>`;
    svg += `<text x="${padL-8}" y="${(y(e)+3).toFixed(1)}" fill="#5b645a" font-size="10" font-family="JetBrains Mono" text-anchor="end">${Math.round(e)}m</text>`;
  }

  for(let i=0;i<segments.length;i++){
    const s = segments[i];
    const x1 = x(s.distStart), x2 = x(s.distEnd);
    const yTop1 = y(s.eleStart);
    const yTop2 = y(s.eleEnd);
    const color = paceColor(s.pace, baselinePaceSecPerKm);
    svg += `<polygon data-i="${i}" points="${x1.toFixed(1)},${yTop1.toFixed(1)} ${x2.toFixed(1)},${yTop2.toFixed(1)} ${x2.toFixed(1)},${H-padB} ${x1.toFixed(1)},${H-padB}" fill="${color}" fill-opacity="0.75"/>`;
  }
  let outline = '';
  targetTrack.points.forEach((p,i)=>{ outline += (i===0?'M':'L') + x(p.dist).toFixed(1) + ' ' + y(p.ele).toFixed(1) + ' '; });
  svg += `<path d="${outline}" fill="none" stroke="#eae7dd" stroke-width="1" stroke-opacity="0.5"/>`;

  for(let i=0;i<=4;i++){
    const d = totalDist*i/4;
    svg += `<text x="${x(d).toFixed(1)}" y="${H-padB+16}" fill="#5b645a" font-size="10" font-family="JetBrains Mono" text-anchor="middle">${(d/1000).toFixed(1)}km</text>`;
  }

  svg += `</svg>`;
  const container = document.getElementById('profileChart');
  container.innerHTML = svg;

  const tooltip = document.getElementById('tooltip');
  container.querySelectorAll('polygon').forEach(poly=>{
    poly.addEventListener('mousemove', ev=>{
      const i = parseInt(poly.getAttribute('data-i'));
      const s = segments[i];
      tooltip.innerHTML = t('profile.tooltip', {dist: (s.distEnd/1000).toFixed(2), grade: (s.grade*100).toFixed(1), pace: fmtPace(s.pace), time: fmtTime(s.cumTime*riegelFactor)});
      tooltip.style.left = (ev.pageX+14)+'px';
      tooltip.style.top = (ev.pageY-10)+'px';
      tooltip.style.opacity = 1;
    });
    poly.addEventListener('mouseleave', ()=>{ tooltip.style.opacity=0; });
  });
}

function renderSplitsTable(segments, riegelFactor){
  const body = document.getElementById('splitsBody');
  body.innerHTML='';
  const totalDist = targetTrack.totalDist;
  const kmMarks = Math.ceil(totalDist/1000);
  let segIdx=0;
  let prevCumTime = 0, prevCumDist = 0;

  for(let km=1; km<=kmMarks; km++){
    const markDist = Math.min(km*1000, totalDist);
    while(segIdx < segments.length-1 && segments[segIdx].cumDist < markDist) segIdx++;
    const s = segments[Math.min(segIdx, segments.length-1)];
    const cumTimeAtMark = s.cumTime * riegelFactor;
    const splitDist = markDist - prevCumDist;
    const splitTime = cumTimeAtMark - prevCumTime;
    const splitPace = (splitTime/splitDist)*1000;

    const startEleIdx = targetTrack.points.findIndex(p=>p.dist>=prevCumDist);
    const endEleIdx = targetTrack.points.findIndex(p=>p.dist>=markDist);
    const eleStart = targetTrack.points[Math.max(0,startEleIdx)]?.ele ?? 0;
    const eleEnd = targetTrack.points[endEleIdx===-1?targetTrack.points.length-1:endEleIdx]?.ele ?? eleStart;
    const gainKm = eleEnd - eleStart;
    const avgGrade = (gainKm/splitDist)*100;

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${km}</td><td>${fmtPace(splitPace)}</td><td>${fmtTime(splitTime)}</td><td>${fmtTime(cumTimeAtMark)}</td>
      <td class="${gainKm>=0?'grade-up':'grade-down'}">${gainKm>=0?'+':''}${Math.round(gainKm)}m</td>
      <td class="${avgGrade>=0?'grade-up':'grade-down'}">${avgGrade>=0?'+':''}${avgGrade.toFixed(1)}%</td>`;
    body.appendChild(tr);

    prevCumTime = cumTimeAtMark;
    prevCumDist = markDist;
  }
}

// ---------- i18n wiring ----------
const langSelect = document.getElementById('langSelect');
langSelect.value = getLang();
langSelect.addEventListener('change', e=>{
  if(!setLang(e.target.value)) return;
  applyStaticTranslations();
  refreshTrainingDerived(); // re-renders chart/profile/results with the new language
});
applyStaticTranslations();
