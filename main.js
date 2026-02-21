// Initial State
let points = 10000;
let currentBet = null;
let currentBetAmount = 0;

// Update UI
function updatePointsDisplay() {
    document.getElementById('user-points').innerText = points.toLocaleString();
}

// Navigation
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');

    if(pageId === 'ladder') {
        drawLadderGrid();
    }
}

// Betting Logic
function setBet(option) {
    currentBet = option;
    alert(`선택된 베팅: ${option === 'odd' ? '홀' : option === 'even' ? '짝' : option === 'red' ? '빨강' : '검정'}`);
}

// --- Roulette Game ---
function startRoulette() {
    const amount = parseInt(document.getElementById('roulette-bet-amount').value);
    
    if(!currentBet || isNaN(amount) || amount <= 0) {
        alert('베팅 옵션과 금액을 확인해 주세요!');
        return;
    }
    
    if(amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    points -= amount;
    updatePointsDisplay();

    const wheel = document.getElementById('roulette-wheel');
    const randomSpin = 360 * 5 + Math.floor(Math.random() * 360); // At least 5 spins
    wheel.style.transform = `rotate(${randomSpin}deg)`;

    setTimeout(() => {
        const resultAngle = randomSpin % 360;
        const sectionSize = 45; // 360/8
        const index = Math.floor(resultAngle / sectionSize);
        const color = index % 2 === 0 ? 'red' : 'black';

        if(color === currentBet) {
            const winAmount = amount * 2;
            points += winAmount;
            alert(`결과: ${color.toUpperCase()}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${color.toUpperCase()}. 아쉽습니다!`);
        }
        updatePointsDisplay();
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${resultAngle}deg)`;
        setTimeout(() => wheel.style.transition = 'transform 3s cubic-bezier(0.3, 0, 0.2, 1)', 50);
    }, 3000);
}

// --- Ladder Game (Simple Simulation) ---
const canvas = document.getElementById('ladder-canvas');
const ctx = canvas?.getContext('2d');

function drawLadderGrid() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(100, 50); ctx.lineTo(100, 450);
    ctx.moveTo(300, 50); ctx.lineTo(300, 450);
    ctx.stroke();

    // Random horizontal lines
    for(let i = 100; i < 400; i += 60) {
        if(Math.random() > 0.5) {
            ctx.beginPath();
            ctx.moveTo(100, i);
            ctx.lineTo(300, i);
            ctx.stroke();
        }
    }
}

function startLadder() {
    const amount = parseInt(document.getElementById('ladder-bet-amount').value);
    if(!currentBet || isNaN(amount) || amount <= 0) {
        alert('베팅 옵션과 금액을 확인해 주세요!');
        return;
    }

    if(amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    points -= amount;
    updatePointsDisplay();

    // Simulation logic (Odd/Even based on random result)
    setTimeout(() => {
        const result = Math.random() > 0.5 ? 'odd' : 'even';
        if(result === currentBet) {
            const winAmount = Math.floor(amount * 1.9);
            points += winAmount;
            alert(`결과: ${result === 'odd' ? '홀' : '짝'}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${result === 'odd' ? '홀' : '짝'}. 아쉽습니다!`);
        }
        updatePointsDisplay();
        drawLadderGrid();
    }, 1000);
}

// Initial Call
updatePointsDisplay();
