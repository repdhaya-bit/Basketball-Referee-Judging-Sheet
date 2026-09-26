const items = [
    { id: 'pres', large: 'Presentation (5点)', med: '', list: ['走る姿、歩く姿、立つ姿、テーブルレポート', '立ち振る舞い、説得力', '声の使い方 (声を使ってリードする姿含)'] },
    { id: 'mech', large: 'Mechanics (5点)', med: 'プライマリ・メカニズム', list: ['トレイルの立つ位置や見るべきところを理解している', 'リードの立つ位置や見るべきところを理解している', 'リードで右に行くタイミングを理解している', '二人で10人のプレーヤーを視野の中に入れることができている'] },
    { id: 'guid_f', large: 'Guideline (Playcalling) (5点)', med: 'ファウル', list: ['基本的なファウル（ガイドライン）の判定が安定してできる', 'イリーガルスクリーンを判定できる', 'ブロッキング・チャージングを判定できる', 'TF/UFの判定ができる'] },
    { id: 'guid_v', large: '', med: 'バイオレーション', list: ['トラベリングを判定できる', 'OOBの判定が正しくできる', '3秒・5秒・8秒を判定できる'] },
    { id: 'ctrl', large: 'Game control (5点)', med: 'ゲームコントロール', list: ['基本的なルールを理解している、適用できている', 'ゲームクロックを管理することができる', 'ショットクロックを管理することができる', 'TOと連携してゲームを運営することができる', 'コーチやプレーヤーとコミュニケーションをとることができる'] }
];

let currentMode = 'serious';

function buildTable() {
    const tbody = document.getElementById('eval-body');
    let html = '';
    let rowIdx = 0;
    items.forEach(cat => {
        cat.list.forEach((item, idx) => {
            html += `<tr class="eval-row">`;
            if (idx === 0 && cat.large !== "") {
                const rowSpan = cat.id === 'guid_f' ? 7 : cat.list.length;
                html += `<td class="center" rowspan="${rowSpan}" style="font-weight:bold;">${cat.large}</td>`;
            }
            if (idx === 0) html += `<td class="center" rowspan="${cat.list.length}">${cat.med}</td>`;
            html += `<td style="white-space:nowrap;overflow:hidden;">${item}</td>`;
            html += `<td class="pm-cell" id="pm-${rowIdx}" data-cat="${cat.id}" onclick="togglePM(this)"></td>`;
            if (idx === 0 && cat.id !== 'guid_v') {
                const gKey = (cat.id === 'guid_f' || cat.id === 'guid_v') ? 'guid' : cat.id;
                const gSpan = (cat.id === 'guid_f') ? 7 : cat.list.length;
                html += `<td class="score-cell center" rowspan="${gSpan}"><input type="number" class="score-input save-data" id="score-${gKey}" value="2" min="1" max="5" onchange="calc(); saveData();"></td>`;
            }
            html += `</tr>`;
            rowIdx++;
        });
    });
    tbody.innerHTML = html;
    document.querySelectorAll('.save-data').forEach(e => e.addEventListener('input', saveData));
    loadData();
}

function togglePM(el) {
    const syms = ['', '+', '-'];
    el.innerText = syms[(syms.indexOf(el.innerText) + 1) % 3];
    if (currentMode === 'simple') autoCalc();
    saveData();
}

function setMode(m) {
    currentMode = m;
    document.getElementById('overlay').style.display = 'none';
    
    const settingsBtn = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (m === 'simple') {
        settingsBtn.style.display = 'block';
    } else {
        settingsBtn.style.display = 'none';
        settingsPanel.style.display = 'none';
    }

    document.getElementById('mode-badge').innerText = (m === 'serious' ? '本格モード' : '簡単モード');
    document.querySelectorAll('.score-input').forEach(i => i.readOnly = (m === 'simple'));
    if (m === 'simple') autoCalc();
    saveData();
}

function toggleMode() { 
    setMode(currentMode === 'serious' ? 'simple' : 'serious'); 
}

// 簡単設定パネルの開閉
function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
}

// 右側リボンの折りたたみ
function toggleRibbon() {
    const ribbon = document.getElementById('controls-ribbon');
    const toggleBtn = document.getElementById('ribbon-toggle-btn');
    ribbon.classList.toggle('collapsed');
    
    if (ribbon.classList.contains('collapsed')) {
        toggleBtn.innerText = 'メニューを表示';
    } else {
        toggleBtn.innerText = 'メニューを隠す';
    }
}

function autoCalc() {
    const pLim = parseInt(document.getElementById('plus-threshold').value) || 2;
    const mLim = parseInt(document.getElementById('minus-threshold').value) || 2;
    const grps = { 'pres': 0, 'mech': 0, 'guid': 0, 'ctrl': 0 };
    document.querySelectorAll('.pm-cell').forEach(td => {
        let cat = td.getAttribute('data-cat');
        if (cat === 'guid_f' || cat === 'guid_v') cat = 'guid';
        if (td.innerText === '+') grps[cat]++;
        if (td.innerText === '-') grps[cat]--;
    });
    for (let k in grps) {
        let val = grps[k];
        let score = 2;
        if (val > 0) score += Math.floor(val / pLim);
        if (val < 0) score -= Math.floor(Math.abs(val) / mLim);
        const input = document.getElementById(`score-${k}`);
        if (input) input.value = Math.max(1, Math.min(5, score));
    }
    calc();
}

function calc() {
    let total = 0;
    document.querySelectorAll('.score-input').forEach(i => total += parseInt(i.value) || 0);
    document.getElementById('total-score').innerText = total;
    let grade = (total >= 16) ? 'A' : (total >= 12) ? 'B' : (total >= 8) ? 'C' : '-';
    document.getElementById('grade-display').innerText = grade;
}

// キャプチャ処理（入力値・改行の維持）
async function generateCanvas() {
    const element = document.getElementById('sheet-area');
    const replacements = [];

    // 1. Textarea を div に置換（拡大後の高さを維持）
    element.querySelectorAll('textarea').forEach(ta => {
        const div = document.createElement('div');
        div.innerText = ta.value;
        div.style.cssText = window.getComputedStyle(ta).cssText;
        div.style.height = "auto";
        div.style.minHeight = "145px";
        div.style.whiteSpace = "pre-wrap";
        div.style.background = "transparent";
        ta.parentElement.appendChild(div);
        ta.style.display = "none";
        replacements.push({ orig: ta, repl: div });
    });

    // 2. Input / Select を div に置換してベースラインズレを防止
    element.querySelectorAll('input, select').forEach(el => {
        let valText = '';
        if (el.tagName === 'SELECT') {
            valText = el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '';
            if (valText === '選択') valText = '';
        } else {
            valText = el.value;
        }

        const span = document.createElement('div');
        span.innerText = valText;
        const style = window.getComputedStyle(el);
        span.style.cssText = style.cssText;
        span.style.display = 'inline-block';
        span.style.lineHeight = style.height;
        span.style.verticalAlign = 'middle';
        span.style.background = 'transparent';
        span.style.overflow = 'hidden';

        el.parentElement.appendChild(span);
        el.style.display = 'none';
        replacements.push({ orig: el, repl: span });
    });

    const canvas = await html2canvas(element, { 
        scale: 2.5, 
        useCORS: true,
        width: element.offsetWidth,
        height: element.offsetHeight
    });

    replacements.forEach(r => {
        r.orig.style.display = '';
        r.repl.remove();
    });

    return canvas;
}

async function showPreview() {
    const overlay = document.getElementById('preview-overlay');
    const container = document.getElementById('preview-container');
    overlay.style.display = 'flex';
    container.innerHTML = "<p style='color:#a1a1a6;'>生成中...</p>";
    
    const canvas = await generateCanvas();
    container.innerHTML = "";
    container.appendChild(canvas);
}

function closePreview() {
    document.getElementById('preview-overlay').style.display = 'none';
}

function handleOverlayClick(e) {
    if (e.target.id === 'preview-overlay') {
        closePreview();
    }
}

function handleResetOverlayClick(e) {
    if (e.target.id === 'reset-overlay') {
        closeResetModal();
    }
}

async function saveAsImage() {
    const canvas = await generateCanvas();
    const link = document.createElement('a');
    link.download = `${document.getElementById('ref-name').value || 'Evaluation'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function saveAsPDF() {
    const canvas = await generateCanvas();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
    pdf.save(`${document.getElementById('ref-name').value || 'Evaluation'}.pdf`);
}

function saveAsRefsheet() {
    const data = localStorage.getItem('ref_eval_v4');
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${document.getElementById('ref-name').value || 'referee'}.refsheet`;
    link.click();
}

function importRefsheet(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        localStorage.setItem('ref_eval_v4', e.target.result);
        location.reload();
    };
    reader.readAsText(file);
}

function confirmReset() {
    document.getElementById('reset-overlay').style.display = 'flex';
}

function closeResetModal() {
    document.getElementById('reset-overlay').style.display = 'none';
}

function executeReset() {
    localStorage.clear();
    location.reload();
}

function saveData() {
    const d = { 
        currentMode, 
        plusThreshold: document.getElementById('plus-threshold').value,
        minusThreshold: document.getElementById('minus-threshold').value,
        inputs: {}, pm: {} 
    };
    document.querySelectorAll('.save-data').forEach(e => d.inputs[e.id] = e.value);
    document.querySelectorAll('.pm-cell').forEach(e => d.pm[e.id] = e.innerText);
    localStorage.setItem('ref_eval_v4', JSON.stringify(d));
}

function loadData() {
    const saved = localStorage.getItem('ref_eval_v4');
    if (!saved) return;
    const d = JSON.parse(saved);
    if (d.plusThreshold) document.getElementById('plus-threshold').value = d.plusThreshold;
    if (d.minusThreshold) document.getElementById('minus-threshold').value = d.minusThreshold;
    for (let id in d.inputs) if (document.getElementById(id)) document.getElementById(id).value = d.inputs[id];
    for (let id in d.pm) if (document.getElementById(id)) document.getElementById(id).innerText = d.pm[id];
    if (d.currentMode) setMode(d.currentMode);
    calc();
}

window.onload = buildTable;
