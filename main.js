// Initial State
let nickname = localStorage.getItem('jujuNickname') || '';
let points = parseInt(localStorage.getItem('jujuPoints_' + nickname)) || 10000;
let isGameRunning = false;
let currentBet = null;
let hilowCurrentNum = Math.floor(Math.random() * 10) + 1;

// Mock Data for Rankings
let rankings = JSON.parse(localStorage.getItem('jujuRankings')) || [
    { name: '고니', points: 1000000 },
    { name: '아귀', points: 850000 },
    { name: '짝귀', points: 620000 },
    { name: '평경장', points: 450000 },
    { name: '정마담', points: 320000 },
    { name: '호구', points: 50000 }
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
    startLiveSimulation(); 
    initLadder();
    document.getElementById('hilow-num-display').innerText = hilowCurrentNum;
};

// --- Common Logic ---
function updatePointsDisplay() {
    document.getElementById('user-points').innerText = points.toLocaleString();
    if (nickname) {
        localStorage.setItem('jujuPoints_' + nickname, points);
    }
    updateRanking();
}

function showPage(pageId) {
    if (isGameRunning) return;
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    if (pageId === 'ladder') initLadder();
    currentBet = null;
}

function setBet(option, type) {
    if (isGameRunning) return;
    currentBet = option;
    const section = document.getElementById(`page-${type}`);
    section.querySelectorAll(`.bet-options button`).forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
}

// --- Dice Game Logic ---
function startDice() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('dice-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) { alert('베팅을 확인하세요!'); return; }
    if (amount > points) { alert('포인트가 부족합니다!'); return; }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const d1 = document.getElementById('dice-1');
    const d2 = document.getElementById('dice-2');
    
    let rollCount = 0;
    const interval = setInterval(() => {
        d1.innerText = Math.floor(Math.random() * 6) + 1;
        d2.innerText = Math.floor(Math.random() * 6) + 1;
        rollCount++;
        if (rollCount > 10) {
            clearInterval(interval);
            const res1 = Math.floor(Math.random() * 6) + 1;
            const res2 = Math.floor(Math.random() * 6) + 1;
            d1.innerText = res1;
            d2.innerText = res2;
            const sum = res1 + res2;
            
            let won = false;
            let multiplier = 0;
            if (currentBet === 'small' && sum >= 2 && sum <= 6) { won = true; multiplier = 2; }
            else if (currentBet === 'big' && sum >= 8 && sum <= 12) { won = true; multiplier = 2; }
            else if (currentBet === 'seven' && sum === 7) { won = true; multiplier = 5; }

            if (won) {
                const winAmt = amount * multiplier;
                points += winAmt;
                alert(`결과: ${sum}! 당첨! ${winAmt.toLocaleString()}P 획득!`);
            } else {
                alert(`결과: ${sum}. 아쉽습니다!`);
            }
            isGameRunning = false;
            updatePointsDisplay();
        }
    }, 100);
}

// --- Slot Machine Logic ---
function startSlot() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('slot-bet-amount').value);
    if (isNaN(amount) || amount < 100) { alert('금액을 확인하세요!'); return; }
    if (amount > points) { alert('포인트가 부족합니다!'); return; }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
    const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀'];
    
    let rollCount = 0;
    const interval = setInterval(() => {
        reels.forEach(r => r.innerText = symbols[Math.floor(Math.random() * symbols.length)]);
        rollCount++;
        if (rollCount > 15) {
            clearInterval(interval);
            const res = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
            reels.forEach((r, i) => r.innerText = res[i]);

            if (res[0] === res[1] && res[1] === res[2]) {
                const winAmt = amount * 10;
                points += winAmt;
                alert(`JACKPOT!!! ${winAmt.toLocaleString()}P 획득!`);
            } else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) {
                const winAmt = amount * 2;
                points += winAmt;
                alert(`당첨! ${winAmt.toLocaleString()}P 획득!`);
            } else {
                alert('꽝! 다음 기회에...');
            }
            isGameRunning = false;
            updatePointsDisplay();
        }
    }, 100);
}

// --- Hi-Low Game Logic ---
function startHiLow() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('hilow-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) { alert('베팅을 확인하세요!'); return; }
    if (amount > points) { alert('포인트가 부족합니다!'); return; }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const nextNum = Math.floor(Math.random() * 10) + 1;
    const display = document.getElementById('hilow-num-display');
    
    setTimeout(() => {
        display.innerText = nextNum;
        let won = false;
        if (currentBet === 'high' && nextNum > hilowCurrentNum) won = true;
        if (currentBet === 'low' && nextNum < hilowCurrentNum) won = true;
        if (nextNum === hilowCurrentNum) won = false; // Tie goes to house

        if (won) {
            const winAmt = amount * 2;
            points += winAmt;
            alert(`결과: ${nextNum}! 당첨! ${winAmt.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${nextNum}. 아쉽습니다!`);
        }
        
        hilowCurrentNum = nextNum;
        isGameRunning = false;
        updatePointsDisplay();
    }, 1000);
}

// --- Ranking & Sim (Existing) ---
function saveNickname() {
    const input = document.getElementById('nickname-input').value.trim();
    if (input.length < 2) return;
    nickname = input;
    localStorage.setItem('jujuNickname', nickname);
    points = parseInt(localStorage.getItem('jujuPoints_' + nickname)) || 10000;
    location.reload();
}
function logout() { localStorage.removeItem('jujuNickname'); location.reload(); }
function updateRanking() {
    const userIdx = rankings.findIndex(r => r.name === nickname);
    if (userIdx !== -1) rankings[userIdx].points = points;
    else if (nickname) rankings.push({ name: nickname, points: points });
    rankings.sort((a, b) => b.points - a.points);
    localStorage.setItem('jujuRankings', JSON.stringify(rankings.slice(0, 30)));
    const list = document.getElementById('ranking-list');
    if (!list) return;
    list.innerHTML = '';
    rankings.slice(0, 10).forEach((rank, idx) => {
        const row = document.createElement('tr');
        if (rank.name === nickname) row.classList.add('my-rank');
        row.innerHTML = `<td>${idx+1}</td><td style="color:${rank.name===nickname?'var(--accent-color)':'white'}">${rank.name}</td><td style="color:#ffd700">${rank.points.toLocaleString()}P</td>`;
        list.appendChild(row);
    });
}
function startLiveSimulation() {
    setInterval(() => {
        rankings.forEach(p => {
            if (p.name !== nickname) {
                const change = Math.floor(Math.random() * 50000) * (Math.random() > 0.5 ? 1 : -1);
                p.points = Math.max(0, p.points + change);
            }
        });
        updateRanking();
    }, 5000);
}

// --- Roulette & Ladder (Existing) ---
function startRoulette() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('roulette-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) return;
    if (amount > points) return;
    isGameRunning = true; points -= amount; updatePointsDisplay();
    const wheel = document.getElementById('roulette-wheel');
    const randomAngle = Math.floor(Math.random() * 360);
    wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    wheel.style.transform = `rotate(${360 * 8 + randomAngle}deg)`;
    setTimeout(() => {
        const normalizedAngle = (360 - (randomAngle % 360)) % 360;
        const resColor = Math.floor(normalizedAngle / 45) % 2 === 0 ? 'red' : 'black';
        if (resColor === currentBet) { points += amount * 2; alert('당첨!'); } else alert('꽝!');
        isGameRunning = false; updatePointsDisplay();
        wheel.style.transition = 'none'; wheel.style.transform = `rotate(${randomAngle}deg)`;
    }, 4500);
}

const canvas = document.getElementById('ladder-canvas');
const ctx = canvas?.getContext('2d');
function initLadder() { if(!ctx)return; canvas.width=400; canvas.height=500; ladderPaths=generateLadder(); drawLadder(); }
function generateLadder() { const connectors=[]; for(let i=1;i<6;i++) if(Math.random()>0.4) connectors.push(50+i*70); return {connectors}; }
function drawLadder() { ctx.strokeStyle='#5d4037'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(100,50); ctx.lineTo(100,450); ctx.moveTo(300,50); ctx.lineTo(300,450); ctx.stroke(); ladderPaths.connectors.forEach(y=>{ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(300,y);ctx.stroke();}); }
async function startLadder() {
    const amount = parseInt(document.getElementById('ladder-bet-amount').value);
    if(!currentBet || isNaN(amount) || amount<100) return;
    if(amount>points) return;
    isGameRunning=true; points-=amount; updatePointsDisplay();
    let curX = Math.random()>0.5?100:300; let curY=50; ctx.strokeStyle='#ffd700'; ctx.lineWidth=10;
    for(let ty of ladderPaths.connectors.sort((a,b)=>a-b)){ await animateLine(curX,curY,curX,ty); curY=ty; let nx=curX===100?300:100; await animateLine(curX,curY,nx,curY); curX=nx; }
    await animateLine(curX,curY,curX,450);
    const res = curX===100?'odd':'even';
    if(res===currentBet){ points+=Math.floor(amount*1.9); alert('당첨!'); } else alert('꽝!');
    isGameRunning=false; updatePointsDisplay(); initLadder();
}
function animateLine(x1,y1,x2,y2){ return new Promise(resolve=>{ const start=performance.now(); function step(now){ const p=Math.min((now-start)/400,1); ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1+(x2-x1)*p,y1+(y2-y1)*p);ctx.stroke(); if(p<1)requestAnimationFrame(step); else resolve(); } requestAnimationFrame(step); }); }
