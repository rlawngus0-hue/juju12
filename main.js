// Initial State
let points = parseInt(localStorage.getItem('jujuPoints')) || 10000;
let nickname = localStorage.getItem('jujuNickname') || '';
let isGameRunning = false;
let currentBet = null;

// Mock Data for Rankings (Expanded)
let rankings = JSON.parse(localStorage.getItem('jujuRankings')) || [
    { name: '고니', points: 1000000 },
    { name: '아귀', points: 850000 },
    { name: '짝귀', points: 620000 },
    { name: '평경장', points: 450000 },
    { name: '정마담', points: 320000 },
    { name: '호구', points: 50000 },
    { name: '박무석', points: 120000 },
    { name: '고광렬', points: 210000 }
];

// Initialize UI
window.onload = () => {
    if (!nickname) {
        document.getElementById('nickname-modal').style.display = 'flex';
    } else {
        document.getElementById('nickname-modal').style.display = 'none';
        document.getElementById('user-nickname').innerText = `[${nickname}]`;
        updatePointsDisplay();
    }
    updateRanking();
    startLiveSimulation(); // Start simulation
    initLadder();
};

// --- Live Simulation Logic (Mocking other players) ---
function startLiveSimulation() {
    setInterval(() => {
        // Randomly pick 1-2 players to change their score
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < count; i++) {
            const playerIndex = Math.floor(Math.random() * rankings.length);
            const player = rankings[playerIndex];
            
            // Don't change the current user's score automatically
            if (player.name === nickname) continue;

            const win = Math.random() > 0.5;
            const change = Math.floor(Math.random() * 50000);
            if (win) player.points += change;
            else player.points = Math.max(0, player.points - change);
        }
        updateRanking();
    }, 4000); // Every 4 seconds
}

// --- Nickname & Ranking Logic ---
function saveNickname() {
    const input = document.getElementById('nickname-input').value.trim();
    if (input.length < 2) {
        alert('닉네임은 최소 2글자 이상이어야 합니다!');
        return;
    }
    nickname = input;
    localStorage.setItem('jujuNickname', nickname);
    document.getElementById('nickname-modal').style.display = 'none';
    document.getElementById('user-nickname').innerText = `[${nickname}]`;
    updatePointsDisplay();
}

function updateRanking() {
    // Current user ranking update
    const userRankIndex = rankings.findIndex(r => r.name === nickname);
    if (userRankIndex !== -1) {
        rankings[userRankIndex].points = points;
    } else if (nickname) {
        rankings.push({ name: nickname, points: points });
    }

    // Sort rankings by points
    rankings.sort((a, b) => b.points - a.points);
    
    // Save to localStorage
    localStorage.setItem('jujuRankings', JSON.stringify(rankings.slice(0, 15)));

    // Render Ranking Table
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.innerHTML = '';
    
    rankings.slice(0, 10).forEach((rank, index) => {
        const row = document.createElement('tr');
        if (rank.name === nickname) row.classList.add('my-rank');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td style="color: ${rank.name === nickname ? 'var(--accent-color)' : 'white'}">${rank.name}</td>
            <td style="color: #ffd700">${rank.points.toLocaleString()}P</td>
        `;
        list.appendChild(row);
    });
}

// Update UI
function updatePointsDisplay() {
    document.getElementById('user-points').innerText = points.toLocaleString();
    localStorage.setItem('jujuPoints', points);
    updateRanking(); // Update ranking whenever points change
}

// Navigation
function showPage(pageId) {
    if (isGameRunning) return;
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');

    if (pageId === 'ladder') {
        initLadder();
    }
}

// Betting Selection
function setBet(option, type) {
    if (isGameRunning) return;
    currentBet = option;
    
    const section = document.getElementById(`page-${type}`);
    const buttons = section.querySelectorAll(`.bet-options button`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
}

// --- Roulette Game Logic ---
function startRoulette() {
    if (isGameRunning) return;
    const amountInput = document.getElementById('roulette-bet-amount');
    const amount = parseInt(amountInput.value);
    
    if (!currentBet || isNaN(amount) || amount < 100) {
        alert('베팅 옵션과 금액(최소 100P)을 확인해 주세요!');
        return;
    }
    
    if (amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const wheel = document.getElementById('roulette-wheel');
    const extraSpins = 360 * 8;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = extraSpins + randomAngle;

    wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
        const normalizedAngle = (360 - (randomAngle % 360)) % 360;
        const sectionIndex = Math.floor(normalizedAngle / 45);
        const resultColor = sectionIndex % 2 === 0 ? 'red' : 'black';

        if (resultColor === currentBet) {
            const winAmount = amount * 2;
            points += winAmount;
            alert(`결과: ${resultColor === 'red' ? '빨강' : '검정'}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${resultColor === 'red' ? '빨강' : '검정'}. 아쉽습니다!`);
        }
        
        isGameRunning = false;
        updatePointsDisplay();
        
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${randomAngle}deg)`;
        currentBet = null;
        amountInput.value = '';
        document.querySelectorAll('.page.active .bet-options button').forEach(b => b.classList.remove('selected'));
    }, 4500);
}

// --- Ladder Game Logic ---
const canvas = document.getElementById('ladder-canvas');
const ctx = canvas?.getContext('2d');
let ladderPaths = [];

function initLadder() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ladderPaths = generateLadder();
    drawLadder();
}

function generateLadder() {
    const connectors = [];
    const steps = 6;
    const h = (canvas.height - 100) / steps;

    for (let i = 1; i < steps; i++) {
        if (Math.random() > 0.4) {
            connectors.push(50 + i * h);
        }
    }
    return { connectors, h };
}

function drawLadder() {
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(100, 50); ctx.lineTo(100, 450);
    ctx.moveTo(300, 50); ctx.lineTo(300, 450);
    ctx.stroke();

    ladderPaths.connectors.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(300, y);
        ctx.stroke();
    });

    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Noto Sans KR';
    ctx.fillText('시작', 80, 35); ctx.fillText('시작', 280, 35);
    ctx.fillText('홀', 90, 480); ctx.fillText('짝', 290, 480);
}

async function startLadder() {
    if (isGameRunning) return;
    const amountInput = document.getElementById('ladder-bet-amount');
    const amount = parseInt(amountInput.value);
    
    if (!currentBet || isNaN(amount) || amount < 100) {
        alert('베팅 옵션과 금액을 확인해 주세요!');
        return;
    }

    if (amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    let currentX = Math.random() > 0.5 ? 100 : 300;
    let currentY = 50;
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 10;

    const sortedConnectors = [...ladderPaths.connectors].sort((a, b) => a - b);
    for (let targetY of sortedConnectors) {
        await animateLine(currentX, currentY, currentX, targetY);
        currentY = targetY;
        let nextX = currentX === 100 ? 300 : 100;
        await animateLine(currentX, currentY, nextX, currentY);
        currentX = nextX;
    }
    await animateLine(currentX, currentY, currentX, 450);

    const result = currentX === 100 ? 'odd' : 'even';
    if (result === currentBet) {
        const winAmount = Math.floor(amount * 1.9);
        points += winAmount;
        alert(`결과: ${result === 'odd' ? '홀' : '짝'}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
    } else {
        alert(`결과: ${result === 'odd' ? '홀' : '짝'}. 아쉽습니다!`);
    }

    isGameRunning = false;
    updatePointsDisplay();
    initLadder();
    currentBet = null;
    amountInput.value = '';
    document.querySelectorAll('.page.active .bet-options button').forEach(b => b.classList.remove('selected'));
}

function animateLine(x1, y1, x2, y2) {
    return new Promise(resolve => {
        const duration = 400;
        const startTime = performance.now();
        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
            ctx.stroke();
            if (progress < 1) requestAnimationFrame(step);
            else resolve();
        }
        requestAnimationFrame(step);
    });
}
