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
    const display = document.getElementById('hilow-num-display');
    if (display) display.innerText = hilowCurrentNum;
    
    // Ensure roulette visibility
    const wheel = document.getElementById('roulette-wheel');
    if (wheel) wheel.style.display = 'block';
};

// --- Common Logic ---
function updatePointsDisplay() {
    const el = document.getElementById('user-points');
    if (el) el.innerText = points.toLocaleString();
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
    document.querySelectorAll('.bet-options button').forEach(b => b.classList.remove('selected'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setBet(btn, option, type) {
    if (isGameRunning) return;
    currentBet = option;
    const section = document.getElementById(`page-${type}`);
    section.querySelectorAll(`.bet-options button`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function quickBet(type, value) {
    if (isGameRunning) return;
    const input = document.getElementById(`${type}-bet-amount`);
    if (value === 'all') {
        input.value = points;
    } else {
        const currentVal = parseInt(input.value) || 0;
        input.value = currentVal + value;
    }
}

// --- Dice Game Logic ---
function startDice() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('dice-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) { alert('베팅 옵션과 최소 100P 이상의 금액을 확인하세요!'); return; }
    if (amount > points) { alert('보유 포인트가 부족합니다!'); return; }

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
        if (rollCount > 15) {
            clearInterval(interval);
            const res1 = Math.floor(Math.random() * 6) + 1;
            const res2 = Math.floor(Math.random() * 6) + 1;
            d1.innerText = res1;
            d2.innerText = res2;
            const sum = res1 + res2;
            
            let multiplier = 0;
            if (currentBet === 'small' && sum >= 2 && sum <= 6) multiplier = 2;
            else if (currentBet === 'big' && sum >= 8 && sum <= 12) multiplier = 2;
            else if (currentBet === 'seven' && sum === 7) multiplier = 5;

            if (multiplier > 0) {
                const winAmt = amount * multiplier;
                points += winAmt;
                alert(`결과: ${sum}! 축하합니다! ${winAmt.toLocaleString()}P 획득!`);
            } else {
                alert(`결과: ${sum}. 다음 기회에...`);
            }
            isGameRunning = false;
            updatePointsDisplay();
        }
    }, 80);
}

// --- Slot Machine Logic ---
function startSlot() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('slot-bet-amount').value);
    if (isNaN(amount) || amount < 100) { alert('최소 100P 이상의 베팅 금액을 입력하세요!'); return; }
    if (amount > points) { alert('보유 포인트가 부족합니다!'); return; }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const reels = [document.getElementById('reel-1'), document.getElementById('reel-2'), document.getElementById('reel-3')];
    const symbols = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀'];
    
    let rollCount = 0;
    const interval = setInterval(() => {
        reels.forEach(r => r.innerText = symbols[Math.floor(Math.random() * symbols.length)]);
        rollCount++;
        if (rollCount > 20) {
            clearInterval(interval);
            const res = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
            reels.forEach((r, i) => r.innerText = res[i]);

            if (res[0] === res[1] && res[1] === res[2]) {
                const winAmt = amount * 10;
                points += winAmt;
                alert(`잭팟!!! ${winAmt.toLocaleString()}P 획득!`);
            } else if (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]) {
                const winAmt = amount * 2;
                points += winAmt;
                alert(`당첨! ${winAmt.toLocaleString()}P 획득!`);
            } else {
                alert('아쉽습니다! 다음 기회에...');
            }
            isGameRunning = false;
            updatePointsDisplay();
        }
    }, 70);
}

// --- Hi-Low Game Logic ---
function startHiLow() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('hilow-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) { alert('베팅 옵션과 금액을 확인하세요!'); return; }
    if (amount > points) { alert('보유 포인트가 부족합니다!'); return; }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const nextNum = Math.floor(Math.random() * 10) + 1;
    const display = document.getElementById('hilow-num-display');
    
    setTimeout(() => {
        display.innerText = nextNum;
        let won = (currentBet === 'high' && nextNum > hilowCurrentNum) || 
                  (currentBet === 'low' && nextNum < hilowCurrentNum);
        
        if (won) {
            const winAmt = amount * 2;
            points += winAmt;
            alert(`결과: ${nextNum}! 승리! ${winAmt.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${nextNum}. 패배하셨습니다.`);
        }
        
        hilowCurrentNum = nextNum;
        isGameRunning = false;
        updatePointsDisplay();
    }, 800);
}

// --- Ranking & Simulation ---
function saveNickname() {
    const input = document.getElementById('nickname-input').value.trim();
    if (input.length < 2) { alert('닉네임은 2자 이상 입력하세요!'); return; }
    nickname = input;
    localStorage.setItem('jujuNickname', nickname);
    points = parseInt(localStorage.getItem('jujuPoints_' + nickname)) || 10000;
    location.reload();
}
function logout() { if(isGameRunning) return; localStorage.removeItem('jujuNickname'); location.reload(); }
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
        row.innerHTML = `<td>${idx+1}</td><td style="color:${rank.name===nickname?'var(--neon-yellow)':'white'}">${rank.name}</td><td style="color:var(--neon-yellow)">${rank.points.toLocaleString()}P</td>`;
        list.appendChild(row);
    });
}
function startLiveSimulation() {
    setInterval(() => {
        rankings.forEach(p => {
            if (p.name !== nickname) {
                const change = Math.floor(Math.random() * 30000) * (Math.random() > 0.5 ? 1 : -1);
                p.points = Math.max(0, p.points + change);
            }
        });
        updateRanking();
    }, 6000);
}

// --- Roulette & Ladder ---
function startRoulette() {
    if (isGameRunning) return;
    const amount = parseInt(document.getElementById('roulette-bet-amount').value);
    if (!currentBet || isNaN(amount) || amount < 100) { alert('베팅 옵션과 금액을 확인하세요!'); return; }
    if (amount > points) { alert('보유 포인트가 부족합니다!'); return; }
    
    isGameRunning = true; points -= amount; updatePointsDisplay();
    const wheel = document.getElementById('roulette-wheel');
    const randomAngle = Math.floor(Math.random() * 360);
    wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    wheel.style.transform = `rotate(${360 * 8 + randomAngle}deg)`;
    setTimeout(() => {
        const normalizedAngle = (360 - (randomAngle % 360)) % 360;
        const resColor = Math.floor(normalizedAngle / 45) % 2 === 0 ? 'red' : 'black';
        if (resColor === currentBet) { points += amount * 2; alert('축하합니다! 당첨!'); } else alert('아쉽게도 꽝입니다!');
        isGameRunning = false; updatePointsDisplay();
        wheel.style.transition = 'none'; wheel.style.transform = `rotate(${randomAngle}deg)`;
    }, 4500);
}

const canvas = document.getElementById('ladder-canvas');
const ctx = canvas?.getContext('2d');
function initLadder() { if(!ctx)return; canvas.width=400; canvas.height=500; ladderPaths=generateLadder(); drawLadder(); }
function generateLadder() { const connectors=[]; for(let i=1;i<6;i++) if(Math.random()>0.4) connectors.push(50+i*70); return {connectors}; }
function drawLadder() { ctx.strokeStyle='#ffffff'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(100,50); ctx.lineTo(100,450); ctx.moveTo(300,50); ctx.lineTo(300,450); ctx.stroke(); ctx.strokeStyle='#ffffff'; ladderPaths.connectors.forEach(y=>{ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(300,y);ctx.stroke();}); }
async function startLadder() {
    const amount = parseInt(document.getElementById('ladder-bet-amount').value);
    if(!currentBet || isNaN(amount) || amount<100) { alert('베팅 옵션과 금액을 확인하세요!'); return; }
    if(amount>points) { alert('포인트가 부족합니다!'); return; }
    isGameRunning=true; points-=amount; updatePointsDisplay();
    let curX = Math.random()>0.5?100:300; let curY=50; ctx.strokeStyle= '#ff00ff'; ctx.lineWidth=10;
    const sorted = [...ladderPaths.connectors].sort((a,b)=>a-b);
    for(let ty of sorted){ await animateLine(curX,curY,curX,ty); curY=ty; let nx=curX===100?300:100; await animateLine(curX,curY,nx,curY); curX=nx; }
    await animateLine(curX,curY,curX,450);
    const res = curX===100?'odd':'even';
    if(res===currentBet){ points+=Math.floor(amount*1.9); alert('성공! 당첨!'); } else alert('실패! 다음 기회에...');
    isGameRunning=false; updatePointsDisplay(); initLadder();
}
function animateLine(x1,y1,x2,y2){ return new Promise(resolve=>{ const start=performance.now(); function step(now){ const p=Math.min((now-start)/400,1); ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1+(x2-x1)*p,y1+(y2-y1)*p);ctx.stroke(); if(p<1)requestAnimationFrame(step); else resolve(); } requestAnimationFrame(step); }); }
