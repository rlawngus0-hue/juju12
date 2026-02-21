// Initial State
let points = 10000;
let currentBet = null;
let isGameRunning = false;

// Update UI
function updatePointsDisplay() {
    document.getElementById('user-points').innerText = points.toLocaleString();
}

// Navigation
function showPage(pageId) {
    if(isGameRunning) return;
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');

    if(pageId === 'ladder') {
        initLadder();
    }
}

// Betting Selection
function setBet(option, type) {
    if(isGameRunning) return;
    currentBet = option;
    
    // UI Feedback for Selection
    const buttons = document.querySelectorAll(`.page.active .bet-options button`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
}

// --- Roulette Game Logic ---
function startRoulette() {
    if(isGameRunning) return;
    const amount = parseInt(document.getElementById('roulette-bet-amount').value);
    
    if(!currentBet || isNaN(amount) || amount < 100) {
        alert('최소 100P 이상 베팅 옵션을 선택해 주세요!');
        return;
    }
    
    if(amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    const wheel = document.getElementById('roulette-wheel');
    const extraSpins = 360 * 8; // At least 8 spins for tension
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = extraSpins + randomAngle;

    wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
        // Correcting the angle calculation: Pointer is at 0 degrees (top).
        // Since the wheel rotates clockwise, the result is determined by (totalRotation % 360).
        // Sections: 0-45 Red, 45-90 Black, ...
        // However, wheel rotation shifts the colors under the pointer. 
        // A clockwise rotation of X degrees brings the color originally at -X degrees to the top.
        const normalizedAngle = (360 - (randomAngle % 360)) % 360;
        const sectionIndex = Math.floor(normalizedAngle / 45);
        const resultColor = sectionIndex % 2 === 0 ? 'red' : 'black';

        if(resultColor === currentBet) {
            const winAmount = amount * 2;
            points += winAmount;
            alert(`결과: ${resultColor === 'red' ? '빨강' : '검정'}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
        } else {
            alert(`결과: ${resultColor === 'red' ? '빨강' : '검정'}. 아쉽습니다!`);
        }
        
        isGameRunning = false;
        updatePointsDisplay();
        
        // Reset transition for next spin
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${randomAngle}deg)`;
    }, 4500);
}

// --- Ladder Game Logic (Animated) ---
const canvas = document.getElementById('ladder-canvas');
const ctx = canvas?.getContext('2d');
let ladderPaths = [];

function initLadder() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ladderPaths = generateLadder();
    drawLadder();
}

function generateLadder() {
    const paths = [[], []]; // Vertical lines at x=100 and x=300
    const steps = 6;
    const h = (canvas.height - 100) / steps;
    const connectors = [];

    for(let i = 1; i < steps; i++) {
        if(Math.random() > 0.4) {
            connectors.push(50 + i * h);
        }
    }
    return { connectors, steps, h };
}

function drawLadder() {
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(100, 50); ctx.lineTo(100, 450);
    ctx.moveTo(300, 50); ctx.lineTo(300, 450);
    ctx.stroke();

    // Horizontal steps
    ladderPaths.connectors.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(300, y);
        ctx.stroke();
    });

    // Start/End labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Noto Sans KR';
    ctx.fillText('시작', 80, 35); ctx.fillText('시작', 280, 35);
    ctx.fillText('홀', 90, 480); ctx.fillText('짝', 290, 480);
}

async function startLadder() {
    if(isGameRunning) return;
    const amount = parseInt(document.getElementById('ladder-bet-amount').value);
    
    if(!currentBet || isNaN(amount) || amount < 100) {
        alert('베팅 옵션과 금액을 확인해 주세요!');
        return;
    }

    if(amount > points) {
        alert('보유 포인트가 부족합니다.');
        return;
    }

    isGameRunning = true;
    points -= amount;
    updatePointsDisplay();

    // Start from a random side
    let currentX = Math.random() > 0.5 ? 100 : 300;
    let currentY = 50;
    
    // Animation
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 10;

    const moveAlongLadder = async () => {
        const sortedConnectors = [...ladderPaths.connectors].sort((a,b) => a - b);
        
        for(let targetY of sortedConnectors) {
            // Move down to connector
            await animateLine(currentX, currentY, currentX, targetY);
            currentY = targetY;
            // Move across connector
            let nextX = currentX === 100 ? 300 : 100;
            await animateLine(currentX, currentY, nextX, currentY);
            currentX = nextX;
        }
        // Move to the bottom
        await animateLine(currentX, currentY, currentX, 450);
    };

    await moveAlongLadder();

    const result = currentX === 100 ? 'odd' : 'even';
    if(result === currentBet) {
        const winAmount = Math.floor(amount * 1.9);
        points += winAmount;
        alert(`결과: ${result === 'odd' ? '홀' : '짝'}! 축하합니다! ${winAmount.toLocaleString()}P 획득!`);
    } else {
        alert(`결과: ${result === 'odd' ? '홀' : '짝'}. 아쉽습니다!`);
    }

    isGameRunning = false;
    updatePointsDisplay();
    initLadder(); // Reset for next game
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

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

// Initial Call
updatePointsDisplay();
initLadder();
