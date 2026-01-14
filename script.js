// Dice Configuration
const die1 = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];
const die2 = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3];

// Faction Presets - maps faction selection to ability states
const FACTION_PRESETS = {
    attacker: {
        'none': { extraHit: false, ignoreFirstHit: false },
        'eyrie-commander': { extraHit: true, ignoreFirstHit: false },
        'hundreds-wrathful': { extraHit: true, ignoreFirstHit: false },
        'hundreds-stubborn': { extraHit: false, ignoreFirstHit: true },
        'vagabond-ronin': { extraHit: true, ignoreFirstHit: false },
        'keepers-relic': { extraHit: false, ignoreFirstHit: true }
    },
    defender: {
        'none': { guerrillaWar: false, ignoreFirstHit: false },
        'woodland-alliance': { guerrillaWar: true, ignoreFirstHit: false },
        'keepers-relic': { guerrillaWar: false, ignoreFirstHit: true },
        'hundreds-stubborn': { guerrillaWar: false, ignoreFirstHit: true }
    }
};

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
        // Bind faction dropdowns to apply presets
        const attFaction = document.getElementById('att-faction');
        const defFaction = document.getElementById('def-faction');

        if (attFaction) {
            attFaction.addEventListener('change', (e) => {
                applyAttackerPreset(e.target.value);
                calculateBattle();
            });
        }

        if (defFaction) {
            defFaction.addEventListener('change', (e) => {
                applyDefenderPreset(e.target.value);
                calculateBattle();
            });
        }

        // Auto-recalculate on any input change
        const allInputs = document.querySelectorAll('select, input[type="checkbox"]');
        allInputs.forEach(input => {
            input.addEventListener('change', calculateBattle);
        });

        // Initial calculation
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

// Apply faction preset to checkboxes
function applyAttackerPreset(faction) {
    const preset = FACTION_PRESETS.attacker[faction] || FACTION_PRESETS.attacker['none'];
    document.getElementById('att-extra-hit').checked = preset.extraHit;
    document.getElementById('att-ignore-hit').checked = preset.ignoreFirstHit;
}

function applyDefenderPreset(faction) {
    const preset = FACTION_PRESETS.defender[faction] || FACTION_PRESETS.defender['none'];
    document.getElementById('def-guerrilla-war').checked = preset.guerrillaWar;
    document.getElementById('def-ignore-hit').checked = preset.ignoreFirstHit;
}

// Read current ability states from UI
function getAbilities() {
    return {
        attacker: {
            extraHit: document.getElementById('att-extra-hit')?.checked || false,
            ignoreFirstHit: document.getElementById('att-ignore-hit')?.checked || false,
            foilAmbush: document.getElementById('att-foil-ambush')?.checked || false
        },
        defender: {
            guerrillaWar: document.getElementById('def-guerrilla-war')?.checked || false,
            ignoreFirstHit: document.getElementById('def-ignore-hit')?.checked || false,
            ambush: document.getElementById('def-ambush')?.checked || false
        }
    };
}

// Logic for Root: High roll (Attacker) vs Low roll (Defender)
// Now with faction ability support
// IMPORTANT: "Ignore First Hit" is a ONE-TIME effect per battle.
// If used on ambush, it cannot also reduce dice damage.
function calculateBattle() {
    const attCount = parseInt(document.getElementById('att-dice').value);
    const defCount = parseInt(document.getElementById('def-dice').value);
    const abilities = getAbilities();

    // Matrix [A-Loss][D-Loss] -> Count
    // Using 5x5 matrix: 0,1,2,3,4+ for both
    const matrix = Array(5).fill().map(() => Array(5).fill(0));
    let totalScenarios = 0;

    // Metrics for Expected Value
    let totalAttLost = 0;
    let totalDefLost = 0;

    // Brute force 144 combos
    for (let i = 0; i < die1.length; i++) {
        for (let j = 0; j < die2.length; j++) {
            totalScenarios++;

            // Track if "Ignore First Hit" has been consumed this battle
            let attackerIgnoreUsed = false;
            let defenderIgnoreUsed = false;

            // === PHASE 1: AMBUSH (pre-battle) ===
            // Ambush happens BEFORE dice roll and affects attacker's damage capacity
            let ambushDamage = 0;
            let attRemainingWarriors = attCount;

            if (abilities.defender.ambush && !abilities.attacker.foilAmbush) {
                ambushDamage = 2;

                // Attacker's Ignore First Hit can reduce ambush damage by 1
                if (abilities.attacker.ignoreFirstHit && !attackerIgnoreUsed) {
                    ambushDamage -= 1;
                    attackerIgnoreUsed = true; // CONSUMED - cannot be used on dice damage
                }

                // Cap ambush damage by attacker warriors
                ambushDamage = Math.min(ambushDamage, attCount);

                // Attacker loses warriors from ambush (reduces their damage capacity)
                attRemainingWarriors = attCount - ambushDamage;
            }

            // === PHASE 2: DICE ROLL ===
            const val1 = die1[i];
            const val2 = die2[j];

            // Dice allocation - Guerrilla War swaps who gets the high roll
            let rawAttDamage, rawDefDamage;
            if (abilities.defender.guerrillaWar) {
                // Woodland Alliance: Defender gets high roll, attacker gets low
                rawAttDamage = Math.min(val1, val2);
                rawDefDamage = Math.max(val1, val2);
            } else {
                // Normal: Attacker gets high roll, defender gets low
                rawAttDamage = Math.max(val1, val2);
                rawDefDamage = Math.min(val1, val2);
            }

            // Extra Hit ability: Attacker deals +1 damage
            if (abilities.attacker.extraHit) {
                rawAttDamage += 1;
            }

            // Defenseless bonus: +1 extra hit if defender has 0 warriors
            if (defCount === 0) {
                rawAttDamage += 1;
            }

            // === PHASE 3: CALCULATE HITS FROM DICE ===
            // Attacker's hits limited by REMAINING warriors (after ambush) AND defender count
            let defLost = Math.min(rawAttDamage, attRemainingWarriors, defCount);

            // Defender's hits limited by their warriors AND attacker's remaining warriors
            let diceDamageToAtt = Math.min(rawDefDamage, defCount, attRemainingWarriors);

            // === PHASE 4: APPLY IGNORE FIRST HIT TO DICE DAMAGE ===
            // Attacker's ignore (only if NOT already used on ambush)
            if (abilities.attacker.ignoreFirstHit && !attackerIgnoreUsed && diceDamageToAtt > 0) {
                diceDamageToAtt -= 1;
                attackerIgnoreUsed = true;
            }

            // Defender's ignore first hit (reduces damage from attacker's dice)
            if (abilities.defender.ignoreFirstHit && !defenderIgnoreUsed && defLost > 0) {
                defLost -= 1;
                defenderIgnoreUsed = true;
            }

            // === TOTAL LOSSES ===
            let attLost = ambushDamage + diceDamageToAtt;
            attLost = Math.min(attLost, attCount); // Can't lose more warriors than you have

            // Accumulate for EV
            totalAttLost += attLost;
            totalDefLost += defLost;

            // Cap at 4 for matrix display (4 = "4+")
            const matrixAttLost = Math.min(attLost, 4);
            const matrixDefLost = Math.min(defLost, 4);
            matrix[matrixAttLost][matrixDefLost]++;
        }
    }

    const evAtt = totalScenarios > 0 ? (totalAttLost / totalScenarios).toFixed(2) : 0;
    const evDef = totalScenarios > 0 ? (totalDefLost / totalScenarios).toFixed(2) : 0;

    renderBattleMatrix(matrix, totalScenarios, evAtt, evDef, abilities);
}

function renderBattleMatrix(matrix, total, evAtt, evDef, abilities) {
    const container = document.getElementById('table-wrapper');
    const evContainer = document.getElementById('ev-results');

    if (total === 0) {
        container.innerHTML = '<div style="padding:1rem">No Dice Selected</div>';
        evContainer.innerHTML = '';
        return;
    }

    // Build active abilities summary
    const activeAbilities = [];
    if (abilities?.defender?.guerrillaWar) activeAbilities.push('Guerrilla War');
    if (abilities?.attacker?.extraHit) activeAbilities.push('Extra Hit (Att)');
    if (abilities?.attacker?.ignoreFirstHit) activeAbilities.push('Ignore Hit (Att)');
    if (abilities?.defender?.ignoreFirstHit) activeAbilities.push('Ignore Hit (Def)');
    if (abilities?.defender?.ambush && !abilities?.attacker?.foilAmbush) activeAbilities.push('Ambush');
    if (abilities?.defender?.ambush && abilities?.attacker?.foilAmbush) activeAbilities.push('Ambush (Foiled)');

    const abilitySummary = activeAbilities.length > 0
        ? `<div class="abilities-active">Active: ${activeAbilities.join(', ')}</div>`
        : '';

    // --- EV Display ---
    evContainer.innerHTML = `
        ${abilitySummary}
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

    // Determine matrix size based on whether we have non-zero values in row/col 4
    const hasRow4 = matrix[4].some(v => v > 0);
    const hasCol4 = matrix.some(row => row[4] > 0);
    const matrixSize = (hasRow4 || hasCol4) ? 5 : 4;

    // Calculate Row/Col Sums
    const rowSums = Array(matrixSize).fill(0);
    const colSums = Array(matrixSize).fill(0);

    for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
            rowSums[r] += matrix[r][c];
            colSums[c] += matrix[r][c];
        }
    }

    let html = '<table class="matrix-table">';

    // Header Row: Defender Losses (Columns)
    html += '<thead><tr><th>Att \\ Def</th>';
    for (let c = 0; c < matrixSize; c++) {
        const label = c === 4 ? '4+' : c;
        html += `<th>D Lost ${label}</th>`;
    }
    html += '<th class="sum-col">Total</th></tr></thead>';

    html += '<tbody>';

    // Rows: Attacker Losses
    for (let r = 0; r < matrixSize; r++) {
        html += '<tr>';
        // Row Header
        const rowLabel = r === 4 ? '4+' : r;
        html += `<th>A Lost ${rowLabel}</th>`;

        // Data Cells
        for (let c = 0; c < matrixSize; c++) {
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
    for (let c = 0; c < matrixSize; c++) {
        const colPct = ((colSums[c] / total) * 100).toFixed(1);
        html += `<td>${colPct}%</td>`;
    }
    html += '<td>100%</td></tr>'; // Corner

    html += '</tbody></table>';

    container.innerHTML = html;
}
