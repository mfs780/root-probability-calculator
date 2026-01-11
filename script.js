// Dice Configuration
const die1 = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];
const die2 = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];

function calculateProbabilities() {
    let totalCombinations = 0;
    let distinctValues = {
        eq0: 0,
        eq1: 0,
        eq2: 0,
        eq3: 0,
        gt0: 0,
        gt1: 0,
        gt2: 0
    };

    // Brute force simulation of all combinations
    for (let i = 0; i < die1.length; i++) {
        for (let j = 0; j < die2.length; j++) {
            totalCombinations++;
            const diff = Math.abs(die1[i] - die2[j]);

            if (diff === 0) distinctValues.eq0++;
            if (diff === 1) distinctValues.eq1++;
            if (diff === 2) distinctValues.eq2++;
            if (diff === 3) distinctValues.eq3++;

            if (diff > 0) distinctValues.gt0++;
            if (diff > 1) distinctValues.gt1++;
            if (diff > 2) distinctValues.gt2++;
        }
    }

    return {
        eq0: (distinctValues.eq0 / totalCombinations) * 100,
        eq1: (distinctValues.eq1 / totalCombinations) * 100,
        eq2: (distinctValues.eq2 / totalCombinations) * 100,
        eq3: (distinctValues.eq3 / totalCombinations) * 100,
        gt0: (distinctValues.gt0 / totalCombinations) * 100,
        gt1: (distinctValues.gt1 / totalCombinations) * 100,
        gt2: (distinctValues.gt2 / totalCombinations) * 100
    };
}

const stats = calculateProbabilities();

// Update DOM
function updateUI() {
    updateStat('stat-eq', stats.eq0);
    updateStat('stat-eq1', stats.eq1);
    updateStat('stat-eq2', stats.eq2);
    updateStat('stat-eq3', stats.eq3);
    updateStat('stat-gt0', stats.gt0);
    updateStat('stat-gt1', stats.gt1);
    updateStat('stat-gt2', stats.gt2);

    drawChart();
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    const valueEl = el.querySelector('.value');
    const barEl = el.querySelector('.bar');

    // Animate number
    let current = 0;
    const increment = value / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(timer);
        }
        valueEl.textContent = current.toFixed(1) + '%';
    }, 20);

    // Animate bar
    setTimeout(() => {
        barEl.style.width = value + '%';
    }, 100);
}

// Custom Canvas Chart
function drawChart() {
    const canvas = document.getElementById('probabilityChart');
    const ctx = canvas.getContext('2d');

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const labels = ['=0', '=1', '=2', '=3', '>0', '>1', '>2'];
    const data = [
        stats.eq0, stats.eq1, stats.eq2, stats.eq3,
        stats.gt0, stats.gt1, stats.gt2
    ];
    // Extended color palette
    const colors = [
        '#8b5cf6', // Indigo (Core)
        '#a855f7', // Purple
        '#d946ef', // Fuchsia
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#6366f1'  // Indigo
    ];

    const padding = 40;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);
    const maxVal = 100; // Since it's percentage

    const barWidth = chartWidth / data.length - 20;

    // Draw Axis
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    // Draw Bars
    data.forEach((val, index) => {
        const x = padding + (index * (barWidth + 20)) + 10;
        const barHeight = (val / maxVal) * chartHeight;
        const y = rect.height - padding - barHeight;

        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, rect.height - padding);
        gradient.addColorStop(0, colors[index % colors.length]);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = gradient;

        // Bar
        // Animate Draw
        // For simplicity in this static script, we draw directly. 
        // Could add animation frame loop here for extra wow.
        ctx.fillRect(x, y, barWidth, barHeight);

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, rect.height - padding + 20);

        // Value on top
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Outfit';
        ctx.fillText(val.toFixed(1) + '%', x + barWidth / 2, y - 10);
    });
}

// Initial draw and handle resize
document.addEventListener('DOMContentLoaded', () => {
    // Only run chart stats if chart exists (Analytics Page)
    if (document.getElementById('probabilityChart')) {
        updateUI();
    }

    // Only run battle calc if inputs exist (Index Page)
    if (document.getElementById('att-dice')) {
        calculateBattle();

        // Bind Enter key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') calculateBattle();
        });
    }
});
window.addEventListener('resize', () => {
    if (document.getElementById('probabilityChart')) drawChart();
});

// --- Battle Simulator Logic ---

// Faces 0,1,2,3 correspond to the d12 {0,0,0, 1,1,1, 2,2,2, 3,3,3}
// Probabilities are identical to a d4 (0-3).
const FACES = [0, 1, 2, 3];

// Logic for Root: High roll (Attacker) vs Low roll (Defender)
function calculateBattle() {
    const attCount = parseInt(document.getElementById('att-dice').value);
    const defCount = parseInt(document.getElementById('def-dice').value);

    // Matrix [A-Loss][D-Loss] -> Count
    // Since losses can be 0,1,2,3, we need a 4x4 matrix
    const matrix = Array(4).fill().map(() => Array(4).fill(0));
    let totalScenarios = 0;

    // Metrics for Expected Value
    let totalAttLost = 0;
    let totalDefLost = 0;

    // Brute force 144 combos
    for (let i = 0; i < die1.length; i++) {
        for (let j = 0; j < die2.length; j++) {
            totalScenarios++;

            const val1 = die1[i];
            const val2 = die2[j];

            const rawAttDamage = Math.max(val1, val2);
            const rawDefDamage = Math.min(val1, val2);

            let defLost = Math.min(rawAttDamage, attCount); // Damage dealt
            let attLost = Math.min(rawDefDamage, defCount); // Damage dealt

            // Cap by existing units
            defLost = Math.min(defLost, defCount);
            attLost = Math.min(attLost, attCount);

            // Accumulate for EV
            totalAttLost += attLost;
            totalDefLost += defLost;

            if (attLost <= 3 && defLost <= 3) {
                matrix[attLost][defLost]++;
            }
        }
    }

    const evAtt = totalScenarios > 0 ? (totalAttLost / totalScenarios).toFixed(2) : 0;
    const evDef = totalScenarios > 0 ? (totalDefLost / totalScenarios).toFixed(2) : 0;

    renderBattleMatrix(matrix, totalScenarios, evAtt, evDef);
}

function renderBattleMatrix(matrix, total, evAtt, evDef) {
    const container = document.getElementById('table-wrapper');
    const evContainer = document.getElementById('ev-results');

    if (total === 0) {
        container.innerHTML = '<div style="padding:1rem">No Dice Selected</div>';
        evContainer.innerHTML = '';
        return;
    }

    // --- EV Display ---
    evContainer.innerHTML = `
        <div class="ev-stat">
            <h3>Avg Attacker Loss</h3>
            <div class="value" style="color:#f87171">${evAtt}</div>
        </div>
        <div class="ev-stat">
            <h3>Avg Defender Loss</h3>
            <div class="value" style="color:#4ade80">${evDef}</div>
        </div>
        <div class="ev-stat">
             <h3>Net Change (Def - Att)</h3>
             <div class="value" style="color:#fff">${(evDef - evAtt).toFixed(2)}</div>
        </div>
    `;

    // Calculate Row/Col Sums
    const rowSums = [0, 0, 0, 0];
    const colSums = [0, 0, 0, 0];

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            rowSums[r] += matrix[r][c];
            colSums[c] += matrix[r][c];
        }
    }

    let html = '<table class="matrix-table">';

    // Header Row: Defender Losses (Columns)
    html += '<thead><tr><th>Att \\ Def</th>';
    for (let c = 0; c < 4; c++) {
        html += `<th>D Lost ${c}</th>`;
    }
    html += '<th class="sum-col">Total</th></tr></thead>';

    html += '<tbody>';

    // Rows: Attacker Losses
    for (let r = 0; r < 4; r++) {
        // Skip row if completely empty (optional, but requested "4x4" implies showing all)
        // Let's show all 0-3 for consistency

        html += '<tr>';
        // Row Header
        html += `<th>A Lost ${r}</th>`;

        // Data Cells
        for (let c = 0; c < 4; c++) {
            const count = matrix[r][c];
            const percent = ((count / total) * 100).toFixed(1);
            const opacity = count > 0 ? 1 : 0.3;
            // Highlight High Probabilities
            const bg = count > 0 ? `rgba(139, 92, 246, ${Math.min(count / total * 2, 0.5)})` : 'transparent';

            html += `<td style="opacity:${opacity}; background:${bg}">
                <div class="cell-val">${percent}%</div>
                <div class="cell-count">(${count})</div>
            </td>`;
        }

        // Row Sum
        const rowPct = ((rowSums[r] / total) * 100).toFixed(1);
        html += `<td class="sum-col">${rowPct}%</td>`;
        html += '</tr>';
    }

    // Footer Row: Column Sums
    html += '<tr class="sum-row"><th>Total</th>';
    for (let c = 0; c < 4; c++) {
        const colPct = ((colSums[c] / total) * 100).toFixed(1);
        html += `<td>${colPct}%</td>`;
    }
    html += '<td>100%</td></tr>'; // Corner

    html += '</tbody></table>';

    container.innerHTML = html;
}
