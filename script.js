const items = [
    { id: 'pres', large: 'Presentation (5点)', med: '', list: ['走る姿、歩く姿、立つ姿、テーブルレポート', '立ち振る舞い、説得力', '声の使い方 (声を使ってリードする姿含)'] },
    { id: 'mech', large: 'Mechanics (5点)', med: 'プライマリ・メカニズム', list: ['トレイルの立つ位置や見るべきところを理解している', 'リードの立つ位置や見るべきところを理解している', 'リードで右に行くタイミングを理解している', '二人で10人のプレーヤーを視野の中に入れることができている'] },
    { id: 'guid_f', large: 'Guideline (Playcalling) (5点)', med: 'ファウル', list: ['基本的なファウル（ガイドライン）の判定が安定してできる', 'イリーガルスクリーンを判定できる', 'ブロッキング・チャージングを判定できる', 'TF/UFの判定ができる'] },
    { id: 'guid_v', large: '', med: 'バイオレーション', list: ['トラベリングを判定できる', 'OOBの判定が正しくできる', '3秒・5秒・8秒を判定できる'] },
    { id: 'ctrl', large: 'Game control (5点)', med: 'ゲームコントロール', list: ['基本的なルールを理解している、適用できている', 'ゲームクロックを管理することができる', 'ショットクロックを管理することができる', 'TOと連携してゲームを運営することができる', 'コーチやプレーヤーとコミュニケーションをとることができる'] }
];

let currentMode = 'serious';
let gender = null;

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
            html += `<td class="col-small">${item}</td>`;
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
    const s = ['', '+', '-'];
    el.innerText = s[(s.indexOf(el.innerText) + 1) % 3];
    if (currentMode === 'simple') autoCalc();
    saveData();
}

function setMode(m) {
    currentMode = m;
    const overlay = document.getElementById('overlay');
    if(overlay) overlay.style.display = 'none';
    
    const badge = document.getElementById('mode-badge');
    if(badge) badge.innerText = m === 'serious' ? '本格モード' : '簡単モード';
    
    document.querySelectorAll('.score-input').forEach(i => i.readOnly = (m === 'simple'));
    if (m === 'simple') autoCalc();
    saveData();
}

function toggleMode() { setMode(currentMode === 'serious' ? 'simple' : 'serious'); }

function autoCalc() {
    const groups = { 'pres': {p:0, m:0}, 'mech': {p:0, m:0}, 'guid': {p:0, m:0}, 'ctrl': {p:0, m:0} };
    document.querySelectorAll('.pm-cell').forEach(td => {
        let c = td.getAttribute('data-cat');
        if (c === 'guid_f' || c === 'guid_v') c = 'guid';
        if (td.innerText === '+') groups[c].p++;
        if (td.innerText === '-') groups[c].m++;
    });
    for (let k in groups) {
        let score = 2 + Math.floor(groups[k].p / 2) - Math.floor(groups[k].m / 2);
        const input = document.getElementById(`score-${k}`);
        if (input) input.value = Math.max(1, Math.min(5, score));
    }
    calc();
}

function calc() {
    let total = 0;
    document.querySelectorAll('.score-input').forEach(i => total += parseInt(i.value) || 0);
    document.getElementById('total-score').innerText = total;
    
    let grade = '-';
    if (total >= 16) {
        grade = 'A';
    } else if (total >= 12) {
        grade = 'B';
    } else if (total >= 8) {
        grade = 'C';
    } else {
        grade = '-'; // 「評価なし」から「-」に変更
    }
    
    document.getElementById('grade-display').innerText = grade;
}

function selectGender(type) {
    gender = type;
    document.getElementById('oval-male').classList.toggle('selected', type === 'male');
    document.getElementById('oval-female').classList.toggle('selected', type === 'female');
    document.getElementById('box-male').style.display = (type === 'male' ? 'flex' : 'none');
    document.getElementById('box-female').style.display = (type === 'female' ? 'flex' : 'none');
    saveData();
}

function saveData() {
    const d = { mode: currentMode, gender, inputs: {}, pm: {} };
    document.querySelectorAll('.save-data').forEach(e => d.inputs[e.id] = e.value);
    document.querySelectorAll('.pm-cell').forEach(e => d.pm[e.id] = e.innerText);
    localStorage.setItem('ref_eval_final_hq_v3', JSON.stringify(d));
}

function loadData() {
    const saved = localStorage.getItem('ref_eval_final_hq_v3');
    if (!saved) return;
    const d = JSON.parse(saved);
    for (let id in d.inputs) {
        const el = document.getElementById(id);
        if (el) el.value = d.inputs[id];
    }
    for (let id in d.pm) {
        const el = document.getElementById(id);
        if (el) el.innerText = d.pm[id];
    }
    if (d.gender) selectGender(d.gender);
    if (d.mode) setMode(d.mode);
    calc();
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('sheet-area');
    
    window.scrollTo(0,0);
    
    const canvas = await html2canvas(element, { 
        scale: 5, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (cloned) => {
            cloned.getElementById('sheet-area').style.overflow = 'visible';
        }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
    
    const name = document.getElementById('ref-name').value || 'Evaluation_Sheet';
    pdf.save(`${name}_2022.pdf`);
}

function confirmReset() { 
    if (confirm("リセットしますか？")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

window.onload = buildTable;
