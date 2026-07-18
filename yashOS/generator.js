const KIND_LIBRARY = [
  {
    kind: "calculator",
    keywords: ["calc", "calculator", "math", "budget", "equation", "numbers"],
    title: "Calculator",
    icon: "∑",
    accent: "#1f5fa8",
    accentHi: "#6ca6f2",
    summary: "A compact utility for quick arithmetic, budgeting, and side calculations.",
    tags: ["math", "utility", "quick"],
    panelTitles: ["Display", "Keypad", "Behavior"],
    window: { width: 420, height: 540 },
  },
  {
    kind: "notes",
    keywords: ["note", "notes", "notepad", "memo", "journal", "write"],
    title: "Notepad",
    icon: "N",
    accent: "#5d4bb3",
    accentHi: "#9f8bef",
    summary: "A lightweight place to capture ideas, scratch text, and short documents.",
    tags: ["text", "capture", "writing"],
    panelTitles: ["Paper", "Quick Actions", "Notes"],
    window: { width: 520, height: 520 },
  },
  {
    kind: "todo",
    keywords: ["todo", "task", "tracker", "list", "planner", "habit"],
    title: "Task Board",
    icon: "☑",
    accent: "#0d7d67",
    accentHi: "#44b39d",
    summary: "A task board for simple planning, checklists, and daily execution.",
    tags: ["tasks", "planning", "board"],
    panelTitles: ["Backlog", "Actions", "Checklist"],
    window: { width: 540, height: 520 },
  },
  {
    kind: "timer",
    keywords: ["timer", "clock", "stopwatch", "countdown", "pomodoro"],
    title: "Focus Timer",
    icon: "⏱",
    accent: "#ad5f1f",
    accentHi: "#f1a64d",
    summary: "A focused countdown tool for work blocks, breaks, and timing sessions.",
    tags: ["time", "focus", "sessions"],
    panelTitles: ["Timer", "Schedule", "Status"],
    window: { width: 420, height: 500 },
  },
  {
    kind: "dashboard",
    keywords: ["dashboard", "analytics", "admin", "stats", "overview", "control"],
    title: "Command Center",
    icon: "▣",
    accent: "#8a3f68",
    accentHi: "#d57aa6",
    summary: "A clean control surface for metrics, status cards, and operational overviews.",
    tags: ["metrics", "overview", "control"],
    panelTitles: ["Summary", "Signals", "Modules"],
    window: { width: 620, height: 540 },
  },
  {
    kind: "chat",
    keywords: ["chat", "assistant", "message", "messenger", "support", "bot"],
    title: "Chat Client",
    icon: "✦",
    accent: "#2862a3",
    accentHi: "#74aaf2",
    summary: "A conversation surface for support, assistants, or internal messaging.",
    tags: ["conversation", "support", "assistant"],
    panelTitles: ["Conversation", "Shortcuts", "Context"],
    window: { width: 580, height: 560 },
  },
  {
    kind: "browser",
    keywords: ["browser", "web", "site", "page", "search", "internet"],
    title: "Web Viewer",
    icon: "◎",
    accent: "#4f6f1d",
    accentHi: "#8abf47",
    summary: "A web-style shell for surfacing pages, links, or lightweight content.",
    tags: ["web", "links", "viewer"],
    panelTitles: ["Address", "Pages", "Status"],
    window: { width: 620, height: 500 },
  },
];

const DEFAULT_KIND = {
  kind: "custom",
  title: "Custom App",
  icon: "★",
  accent: "#0a3b73",
  accentHi: "#2b74c5",
  summary: "A prompt-driven application shell with a retro Windows personality.",
  tags: ["custom", "generated", "shell"],
  panelTitles: ["Overview", "Layout", "Behaviors"],
  window: { width: 600, height: 540 },
};

const OFFLINE_TEMPLATES = {
  paint: {
    title: "Paint Studio",
    icon: "🎨",
    accent: "#a81f3e",
    accentHi: "#f26c8d",
    summary: "A retro canvas paint box to draw, sketch, and doodle.",
    tags: ["paint", "canvas", "drawing", "art"],
    window: { width: 500, height: 460 },
    html: `
      <div class="paint-container">
        <div class="paint-toolbar">
          <div class="paint-colors">
            <button class="paint-color is-active" style="background: #000000" data-color="#000000" title="Black"></button>
            <button class="paint-color" style="background: #ff0000" data-color="#ff0000" title="Red"></button>
            <button class="paint-color" style="background: #00ff00" data-color="#00ff00" title="Green"></button>
            <button class="paint-color" style="background: #0000ff" data-color="#0000ff" title="Blue"></button>
            <button class="paint-color" style="background: #ffff00" data-color="#ffff00" title="Yellow"></button>
            <button class="paint-color" style="background: #ff00ff" data-color="#ff00ff" title="Magenta"></button>
            <button class="paint-color" style="background: #ffffff; border: 1px solid #777" data-color="#ffffff" title="White (Eraser)"></button>
          </div>
          <div class="paint-sizes">
            <label>Size:
              <select class="paint-size-select">
                <option value="2">Thin</option>
                <option value="5" selected>Medium</option>
                <option value="10">Thick</option>
                <option value="20">Huge</option>
              </select>
            </label>
          </div>
          <button class="button paint-clear-btn" style="padding: 2px 8px;">Clear</button>
        </div>
        <div class="paint-canvas-wrapper">
          <canvas width="476" height="340"></canvas>
        </div>
      </div>
    `,
    css: `
      [data-window-id="{{ID}}"] .paint-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        gap: 8px;
        background: #c0c0c0;
      }
      [data-window-id="{{ID}}"] .paint-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px;
        border: 2px solid;
        border-color: #ffffff #808080 #808080 #ffffff;
        background: #d4d0c8;
        gap: 10px;
      }
      [data-window-id="{{ID}}"] .paint-colors {
        display: flex;
        gap: 4px;
      }
      [data-window-id="{{ID}}"] .paint-color {
        width: 20px;
        height: 20px;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        cursor: pointer;
        padding: 0;
      }
      [data-window-id="{{ID}}"] .paint-color.is-active {
        border-color: #ffffff #808080 #808080 #ffffff;
        outline: 1px solid #000;
      }
      [data-window-id="{{ID}}"] .paint-canvas-wrapper {
        flex: 1;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #ffffff;
        position: relative;
        overflow: hidden;
      }
      [data-window-id="{{ID}}"] canvas {
        display: block;
        background: #ffffff;
        cursor: crosshair;
      }
    `,
    js: `
      const canvas = container.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const clearBtn = container.querySelector('.paint-clear-btn');
      const colorBtns = container.querySelectorAll('.paint-color');
      const sizeSelect = container.querySelector('.paint-size-select');

      let drawing = false;
      let currentColor = '#000000';
      let currentSize = 5;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      function resizeCanvas() {
        const wrapper = canvas.parentElement;
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      
      setTimeout(resizeCanvas, 100);

      function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function startDrawing(e) {
        drawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
      }

      function draw(e) {
        if (!drawing) return;
        const pos = getMousePos(e);
        ctx.lineWidth = currentSize;
        ctx.strokeStyle = currentColor;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        e.preventDefault();
      }

      function stopDrawing() {
        drawing = false;
      }

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          colorBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          currentColor = btn.dataset.color;
        });
      });

      sizeSelect.addEventListener('change', () => {
        currentSize = parseInt(sizeSelect.value, 10);
      });

      clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    `
  },
  snake: {
    title: "Retro Snake",
    icon: "🐍",
    accent: "#1f7d2a",
    accentHi: "#6cf27b",
    summary: "A retro pixel snake game with high score tracking.",
    tags: ["game", "snake", "arcade", "retro"],
    window: { width: 440, height: 520 },
    html: `
      <div class="snake-container">
        <div class="snake-header">
          <div class="snake-score">Score: <strong class="snake-score-val">0</strong></div>
          <button class="button snake-start-btn">Start Game</button>
        </div>
        <div class="snake-canvas-wrapper">
          <canvas width="400" height="320"></canvas>
          <div class="snake-overlay">
            <span class="snake-overlay-text">Press Start to Play</span>
          </div>
        </div>
        <div class="snake-controls">
          <div class="snake-row"><button class="button snake-btn snake-up" data-dir="up">▲</button></div>
          <div class="snake-row">
            <button class="button snake-btn snake-left" data-dir="left">◀</button>
            <button class="button snake-btn snake-down" data-dir="down">▼</button>
            <button class="button snake-btn snake-right" data-dir="right">▶</button>
          </div>
        </div>
      </div>
    `,
    css: `
      [data-window-id="{{ID}}"] .snake-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        gap: 8px;
        background: #c0c0c0;
        font-family: monospace;
      }
      [data-window-id="{{ID}}"] .snake-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #000000;
        color: #00ff00;
      }
      [data-window-id="{{ID}}"] .snake-score {
        font-size: 14px;
      }
      [data-window-id="{{ID}}"] .snake-canvas-wrapper {
        position: relative;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #000000;
      }
      [data-window-id="{{ID}}"] canvas {
        display: block;
        background: #000000;
        width: 100%;
        height: 300px;
      }
      [data-window-id="{{ID}}"] .snake-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00ff00;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        white-space: pre-line;
      }
      [data-window-id="{{ID}}"] .snake-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }
      [data-window-id="{{ID}}"] .snake-row {
        display: flex;
        gap: 4px;
      }
      [data-window-id="{{ID}}"] .snake-btn {
        width: 44px;
        height: 34px;
        font-size: 16px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
    js: `
      const canvas = container.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const scoreVal = container.querySelector('.snake-score-val');
      const startBtn = container.querySelector('.snake-start-btn');
      const overlay = container.querySelector('.snake-overlay');
      const overlayText = container.querySelector('.snake-overlay-text');

      const grid = 16;
      let snake = [{x: 160, y: 160}];
      let direction = 'right';
      let nextDirection = 'right';
      let food = {x: 80, y: 80};
      let score = 0;
      let gameInterval = null;
      let gameActive = false;

      function generateFood() {
        food.x = Math.floor(Math.random() * (canvas.width / grid)) * grid;
        food.y = Math.floor(Math.random() * (canvas.height / grid)) * grid;
      }

      function gameLoop() {
        direction = nextDirection;
        const head = {x: snake[0].x, y: snake[0].y};

        if (direction === 'left') head.x -= grid;
        if (direction === 'right') head.x += grid;
        if (direction === 'up') head.y -= grid;
        if (direction === 'down') head.y += grid;

        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
          endGame();
          return;
        }

        for (let i = 0; i < snake.length; i++) {
          if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
            return;
          }
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
          score += 10;
          scoreVal.textContent = score;
          generateFood();
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
          } catch(e) {}
        } else {
          snake.pop();
        }

        drawGame();
      }

      function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Food
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(food.x + 2, food.y + 2, grid - 4, grid - 4);

        // Snake
        ctx.fillStyle = '#00ff00';
        snake.forEach((part, index) => {
          ctx.fillRect(part.x + 1, part.y + 1, grid - 2, grid - 2);
          if (index === 0) {
            ctx.fillStyle = '#008800';
            ctx.fillRect(part.x + 4, part.y + 4, grid - 8, grid - 8);
            ctx.fillStyle = '#00ff00';
          }
        });
      }

      function startGame() {
        if (gameActive) return;
        snake = [{x: 160, y: 160}];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreVal.textContent = score;
        generateFood();
        overlay.style.display = 'none';
        gameActive = true;
        startBtn.textContent = 'Running';
        startBtn.disabled = true;
        drawGame();
        gameInterval = setInterval(gameLoop, 150);
      }

      function endGame() {
        clearInterval(gameInterval);
        gameActive = false;
        startBtn.textContent = 'Restart';
        startBtn.disabled = false;
        overlay.style.display = 'flex';
        overlayText.textContent = 'Game Over\\nScore: ' + score;
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(220, audioCtx.currentTime);
          osc.frequency.setValueAtTime(110, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
          osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        } catch(e) {}
      }

      startBtn.addEventListener('click', startGame);

      container.querySelectorAll('.snake-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = btn.dataset.dir;
          if (dir === 'left' && direction !== 'right') nextDirection = 'left';
          if (dir === 'right' && direction !== 'left') nextDirection = 'right';
          if (dir === 'up' && direction !== 'down') nextDirection = 'up';
          if (dir === 'down' && direction !== 'up') nextDirection = 'down';
        });
      });

      const keyHandler = (e) => {
        if (!gameActive) return;
        if (['ArrowUp', 'KeyW'].includes(e.code) && direction !== 'down') { nextDirection = 'up'; e.preventDefault(); }
        if (['ArrowDown', 'KeyS'].includes(e.code) && direction !== 'up') { nextDirection = 'down'; e.preventDefault(); }
        if (['ArrowLeft', 'KeyA'].includes(e.code) && direction !== 'right') { nextDirection = 'left'; e.preventDefault(); }
        if (['ArrowRight', 'KeyD'].includes(e.code) && direction !== 'left') { nextDirection = 'right'; e.preventDefault(); }
      };
      
      window.addEventListener('keydown', keyHandler);

      const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
          window.removeEventListener('keydown', keyHandler);
          clearInterval(gameInterval);
          observer.disconnect();
        }
      });
      observer.observe(document.body, {childList: true, subtree: true});
    `
  },
  weather: {
    title: "Weather Station",
    icon: "☁",
    accent: "#1f5d7d",
    accentHi: "#6ccbf2",
    summary: "A retro weather forecasting terminal.",
    tags: ["weather", "forecast", "climate"],
    window: { width: 460, height: 400 },
    html: `
      <div class="weather-container">
        <div class="weather-search-bar">
          <input type="text" class="weather-city-input" placeholder="Type city: London, Paris, Tokyo..." value="San Francisco" />
          <button class="button weather-search-btn">Search</button>
        </div>
        <div class="weather-card">
          <div class="weather-main">
            <div class="weather-condition-icon">☀️</div>
            <div class="weather-temp-info">
              <h2 class="weather-city-name">San Francisco</h2>
              <div class="weather-temp"><span class="weather-temp-val">68</span>°F</div>
              <div class="weather-desc">Clear Sunny</div>
            </div>
          </div>
          <div class="weather-stats">
            <div class="weather-stat">Humidity: <strong class="weather-humidity">55%</strong></div>
            <div class="weather-stat">Wind: <strong class="weather-wind">8 mph</strong></div>
            <div class="weather-stat">Pressure: <strong class="weather-pressure">1012 hPa</strong></div>
          </div>
          <div class="weather-forecast-grid">
            <div class="weather-forecast-day">
              <div class="weather-forecast-name">Mon</div>
              <div class="weather-forecast-icon">☀️</div>
              <div class="weather-forecast-temp">70°</div>
            </div>
            <div class="weather-forecast-day">
              <div class="weather-forecast-name">Tue</div>
              <div class="weather-forecast-icon">☁️</div>
              <div class="weather-forecast-temp">65°</div>
            </div>
            <div class="weather-forecast-day">
              <div class="weather-forecast-name">Wed</div>
              <div class="weather-forecast-icon">🌧️</div>
              <div class="weather-forecast-temp">58°</div>
            </div>
          </div>
        </div>
      </div>
    `,
    css: `
      [data-window-id="{{ID}}"] .weather-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        gap: 8px;
        background: #c0c0c0;
        font-family: sans-serif;
      }
      [data-window-id="{{ID}}"] .weather-search-bar {
        display: flex;
        gap: 6px;
      }
      [data-window-id="{{ID}}"] .weather-city-input {
        flex: 1;
        height: 28px;
        padding: 2px 6px;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #ffffff;
        font-size: 12px;
      }
      [data-window-id="{{ID}}"] .weather-card {
        flex: 1;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #2b5b84;
        color: #ffffff;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      [data-window-id="{{ID}}"] .weather-main {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      [data-window-id="{{ID}}"] .weather-condition-icon {
        font-size: 48px;
      }
      [data-window-id="{{ID}}"] .weather-city-name {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      [data-window-id="{{ID}}"] .weather-temp {
        font-size: 28px;
        font-weight: bold;
      }
      [data-window-id="{{ID}}"] .weather-desc {
        font-size: 11px;
        color: #b3d1ff;
      }
      [data-window-id="{{ID}}"] .weather-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        padding: 6px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid #ffffff;
        font-size: 10px;
        text-align: center;
      }
      [data-window-id="{{ID}}"] .weather-forecast-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: auto;
      }
      [data-window-id="{{ID}}"] .weather-forecast-day {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #808080;
        padding: 6px;
        text-align: center;
        font-size: 10px;
      }
      [data-window-id="{{ID}}"] .weather-forecast-icon {
        font-size: 20px;
        margin: 4px 0;
      }
    `,
    js: `
      const input = container.querySelector('.weather-city-input');
      const btn = container.querySelector('.weather-search-btn');
      const cityName = container.querySelector('.weather-city-name');
      const tempVal = container.querySelector('.weather-temp-val');
      const desc = container.querySelector('.weather-desc');
      const humidity = container.querySelector('.weather-humidity');
      const wind = container.querySelector('.weather-wind');
      const pressure = container.querySelector('.weather-pressure');
      const mainIcon = container.querySelector('.weather-condition-icon');
      const forecastDayEls = container.querySelectorAll('.weather-forecast-day');

      const conditions = [
        { text: 'Sunny Clear', temp: 75, icon: '☀️', humidity: '40%', wind: '6 mph', pressure: '1016 hPa', forecast: [['Mon', '☀️', '78°'], ['Tue', '☀️', '76°'], ['Wed', '☁️', '70°']] },
        { text: 'Overcast Cloudy', temp: 58, icon: '☁️', humidity: '72%', wind: '12 mph', pressure: '1011 hPa', forecast: [['Mon', '☁️', '60°'], ['Tue', '🌧️', '55°'], ['Wed', '🌧️', '52°']] },
        { text: 'Light Showers', temp: 52, icon: '🌧️', humidity: '85%', wind: '15 mph', pressure: '1008 hPa', forecast: [['Mon', '🌧️', '50°'], ['Tue', '🌧️', '52°'], ['Wed', '☁️', '56°']] },
        { text: 'Heavy Thunderstorms', temp: 64, icon: '⛈️', humidity: '92%', wind: '22 mph', pressure: '1004 hPa', forecast: [['Mon', '⛈️', '66°'], ['Tue', '🌧️', '60°'], ['Wed', '☁️', '62°']] },
        { text: 'Snow Flurries', temp: 28, icon: '❄️', humidity: '80%', wind: '9 mph', pressure: '1020 hPa', forecast: [['Mon', '❄️', '30°'], ['Tue', '❄️', '26°'], ['Wed', '☁️', '32°']] }
      ];

      function searchWeather() {
        const city = input.value.trim();
        if (!city) return;

        btn.textContent = 'Wait...';
        btn.disabled = true;

        setTimeout(() => {
          btn.textContent = 'Search';
          btn.disabled = false;

          let choice = Math.abs(city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % conditions.length;
          
          const lowerCity = city.toLowerCase();
          if (lowerCity.includes('london')) choice = 2;
          if (lowerCity.includes('tokyo') || lowerCity.includes('miami')) choice = 0;
          if (lowerCity.includes('seattle')) choice = 2;
          if (lowerCity.includes('snow') || lowerCity.includes('anchorage')) choice = 4;

          const cond = conditions[choice];
          cityName.textContent = city.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
          tempVal.textContent = cond.temp;
          desc.textContent = cond.text;
          humidity.textContent = cond.humidity;
          wind.textContent = cond.wind;
          pressure.textContent = cond.pressure;
          mainIcon.textContent = cond.icon;

          forecastDayEls.forEach((el, idx) => {
            const item = cond.forecast[idx];
            el.querySelector('.weather-forecast-name').textContent = item[0];
            el.querySelector('.weather-forecast-icon').textContent = item[1];
            el.querySelector('.weather-forecast-temp').textContent = item[2];
          });
        }, 500);
      }

      btn.addEventListener('click', searchWeather);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchWeather();
      });
    `
  },
  music: {
    title: "Tape Player",
    icon: "📻",
    accent: "#2c2c2c",
    accentHi: "#555555",
    summary: "A retro cassette audio deck with synth audio generation.",
    tags: ["music", "audio", "cassette", "synth"],
    window: { width: 480, height: 440 },
    html: `
      <div class="tape-container">
        <div class="tape-shell">
          <div class="tape-wheel tape-wheel-left"></div>
          <div class="tape-wheel tape-wheel-right"></div>
          <div class="tape-label">RETRO MIX TAPE</div>
        </div>
        <div class="tape-display">
          <div class="tape-track-name">Track 1: Synth Sunrise</div>
          <div class="tape-time">00:00</div>
        </div>
        <div class="tape-visualizer-wrapper">
          <canvas width="440" height="60"></canvas>
        </div>
        <div class="tape-controls">
          <button class="button tape-btn tape-prev" title="Previous">|◀</button>
          <button class="button tape-btn tape-play" title="Play">▶ Play</button>
          <button class="button tape-btn tape-stop" title="Stop">■ Stop</button>
          <button class="button tape-btn tape-next" title="Next">▶|</button>
        </div>
        <div class="tape-volume">
          <span>Vol:</span>
          <input type="range" class="tape-volume-slider" min="0" max="100" value="50" />
        </div>
      </div>
    `,
    css: `
      [data-window-id="{{ID}}"] .tape-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        gap: 8px;
        background: #c0c0c0;
        font-family: monospace;
        user-select: none;
      }
      [data-window-id="{{ID}}"] .tape-shell {
        height: 140px;
        background: #222;
        border: 4px solid #444;
        border-radius: 8px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: inset 0 0 10px #000;
      }
      [data-window-id="{{ID}}"] .tape-wheel {
        width: 44px;
        height: 44px;
        border: 6px dashed #777;
        border-radius: 50%;
        position: absolute;
        top: 42px;
        background: #111;
      }
      [data-window-id="{{ID}}"] .tape-wheel-left {
        left: 80px;
      }
      [data-window-id="{{ID}}"] .tape-wheel-right {
        right: 80px;
      }
      [data-window-id="{{ID}}"] .tape-wheel.is-spinning {
        animation: tape-spin 2s linear infinite;
      }
      @keyframes tape-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      [data-window-id="{{ID}}"] .tape-label {
        position: absolute;
        bottom: 12px;
        background: #e8ded2;
        color: #433;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: bold;
        border: 1px solid #777;
      }
      [data-window-id="{{ID}}"] .tape-display {
        padding: 6px;
        background: #000;
        color: #00ff00;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        display: flex;
        justify-content: space-between;
      }
      [data-window-id="{{ID}}"] .tape-visualizer-wrapper {
        height: 64px;
        background: #000;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
      }
      [data-window-id="{{ID}}"] canvas {
        display: block;
        width: 100%;
        height: 60px;
      }
      [data-window-id="{{ID}}"] .tape-controls {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      [data-window-id="{{ID}}"] .tape-btn {
        min-width: 64px;
        height: 32px;
      }
      [data-window-id="{{ID}}"] .tape-volume {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        justify-content: center;
      }
      [data-window-id="{{ID}}"] .tape-volume-slider {
        flex: 1;
        max-width: 200px;
      }
    `,
    js: `
      const playBtn = container.querySelector('.tape-play');
      const stopBtn = container.querySelector('.tape-stop');
      const prevBtn = container.querySelector('.tape-prev');
      const nextBtn = container.querySelector('.tape-next');
      const trackName = container.querySelector('.tape-track-name');
      const timeEl = container.querySelector('.tape-time');
      const wheels = container.querySelectorAll('.tape-wheel');
      const canvas = container.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const volumeSlider = container.querySelector('.tape-volume-slider');

      const tracks = [
        { title: 'Synth Sunrise', freq1: 440, freq2: 554, freq3: 659 },
        { title: '8-Bit Odyssey', freq1: 523, freq2: 659, freq3: 784 },
        { title: 'Cyber Sunset', freq1: 349, freq2: 440, freq3: 523 },
        { title: 'Vapor Wave', freq1: 293, freq2: 349, freq3: 440 }
      ];

      let currentTrackIdx = 0;
      let playing = false;
      let time = 0;
      let timerInterval = null;
      let synthAudioCtx = null;
      let oscillator = null;
      let gainNode = null;

      function drawVisualizer() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';

        const numBars = 32;
        const barWidth = canvas.width / numBars;
        for (let i = 0; i < numBars; i++) {
          let height = 0;
          if (playing) {
            const seed = Math.sin(time * 2 + i * 0.5) * 15 + Math.cos(time * 5 - i * 0.2) * 10;
            height = Math.max(2, 20 + seed + Math.random() * 10);
          } else {
            height = 2;
          }
          ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 2, height);
        }
      }

      drawVisualizer();
      let visualizerTimer = setInterval(drawVisualizer, 100);

      function startAudio() {
        try {
          if (!synthAudioCtx) {
            synthAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
          }

          oscillator = synthAudioCtx.createOscillator();
          gainNode = synthAudioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(synthAudioCtx.destination);

          const track = tracks[currentTrackIdx];
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(track.freq1, synthAudioCtx.currentTime);
          
          const vol = parseFloat(volumeSlider.value) / 100 * 0.08;
          gainNode.gain.setValueAtTime(vol, synthAudioCtx.currentTime);

          oscillator.start();
        } catch (e) {
          console.warn('Audio Context error:', e);
        }
      }

      function stopAudio() {
        if (oscillator) {
          try {
            oscillator.stop();
            oscillator.disconnect();
          } catch (e) {}
          oscillator = null;
        }
      }

      function updateTrackDisplay() {
        trackName.textContent = \`Track \${currentTrackIdx + 1}: \${tracks[currentTrackIdx].title}\`;
      }

      function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
      }

      function play() {
        if (playing) return;
        playing = true;
        wheels.forEach(w => w.classList.add('is-spinning'));
        playBtn.textContent = '⏸ Pause';
        startAudio();

        timerInterval = setInterval(() => {
          time++;
          timeEl.textContent = formatTime(time);
          
          if (oscillator && synthAudioCtx) {
            const track = tracks[currentTrackIdx];
            const freqs = [track.freq1, track.freq2, track.freq3];
            const nextFreq = freqs[time % freqs.length];
            oscillator.frequency.setValueAtTime(nextFreq, synthAudioCtx.currentTime);
          }
        }, 1000);
      }

      function pause() {
        if (!playing) return;
        playing = false;
        wheels.forEach(w => w.classList.remove('is-spinning'));
        playBtn.textContent = '▶ Play';
        stopAudio();
        clearInterval(timerInterval);
      }

      playBtn.addEventListener('click', () => {
        if (playing) {
          pause();
        } else {
          play();
        }
      });

      stopBtn.addEventListener('click', () => {
        pause();
        time = 0;
        timeEl.textContent = formatTime(time);
      });

      prevBtn.addEventListener('click', () => {
        const wasPlaying = playing;
        pause();
        currentTrackIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
        updateTrackDisplay();
        if (wasPlaying) play();
      });

      nextBtn.addEventListener('click', () => {
        const wasPlaying = playing;
        pause();
        currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
        updateTrackDisplay();
        if (wasPlaying) play();
      });

      volumeSlider.addEventListener('input', () => {
        if (gainNode && synthAudioCtx) {
          const vol = parseFloat(volumeSlider.value) / 100 * 0.08;
          gainNode.gain.setValueAtTime(vol, synthAudioCtx.currentTime);
        }
      });

      const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
          pause();
          stopAudio();
          clearInterval(visualizerTimer);
          clearInterval(timerInterval);
          observer.disconnect();
        }
      });
      observer.observe(document.body, {childList: true, subtree: true});
    `
  },
  general: {
    title: "Forge Console",
    icon: "⚙",
    accent: "#444444",
    accentHi: "#777777",
    summary: "An interactive prompt execution space.",
    tags: ["console", "forge", "workspace"],
    window: { width: 500, height: 460 },
    html: `
      <div class="console-container">
        <div class="console-box">
          <p class="console-label">App Forge Simulation Engine v1.0</p>
          <div class="console-prompt-details">
            <div>Prompt: <strong class="console-query">...</strong></div>
            <div>Status: <span class="console-status">ONLINE</span></div>
          </div>
        </div>
        
        <div class="console-panels">
          <div class="console-panel">
            <h4 style="margin:0 0 6px;">Checklist Planner</h4>
            <div class="console-todo-list"></div>
            <form class="console-todo-form" style="display:flex;gap:4px;margin-top:6px;">
              <input type="text" class="console-todo-input" placeholder="Add custom task..." required style="flex:1;height:24px;font-size:11px;" />
              <button type="submit" class="button" style="padding:2px 8px;">Add</button>
            </form>
          </div>

          <div class="console-panel">
            <h4 style="margin:0 0 6px;">Retro Sound Board</h4>
            <div class="console-sound-btns">
              <button class="button console-sound-btn" data-sound="coin">💰 Coin</button>
              <button class="button console-sound-btn" data-sound="laser">⚡ Laser</button>
              <button class="button console-sound-btn" data-sound="beep">🔔 Beep</button>
              <button class="button console-sound-btn" data-sound="warp">🚀 Warp</button>
            </div>
          </div>
        </div>
        
        <div class="console-log-wrapper">
          <div class="console-log-header">Console Logs</div>
          <div class="console-logs"></div>
        </div>
      </div>
    `,
    css: `
      [data-window-id="{{ID}}"] .console-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 8px;
        gap: 8px;
        background: #c0c0c0;
        font-family: monospace;
        font-size: 11px;
      }
      [data-window-id="{{ID}}"] .console-box {
        padding: 6px;
        background: #000;
        color: #00ff00;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
      }
      [data-window-id="{{ID}}"] .console-label {
        margin: 0 0 4px;
        font-weight: bold;
        border-bottom: 1px dashed #00ff00;
        padding-bottom: 2px;
      }
      [data-window-id="{{ID}}"] .console-prompt-details {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
      }
      [data-window-id="{{ID}}"] .console-panels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      [data-window-id="{{ID}}"] .console-panel {
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #d4d0c8;
        padding: 8px;
        display: flex;
        flex-direction: column;
      }
      [data-window-id="{{ID}}"] .console-todo-list {
        flex: 1;
        max-height: 80px;
        overflow-y: auto;
        border: 1px solid #777;
        background: #fff;
        padding: 4px;
      }
      [data-window-id="{{ID}}"] .console-todo-item {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 2px;
      }
      [data-window-id="{{ID}}"] .console-sound-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 4px;
      }
      [data-window-id="{{ID}}"] .console-sound-btn {
        font-size: 10px;
        height: 28px;
        padding: 0;
      }
      [data-window-id="{{ID}}"] .console-log-wrapper {
        flex: 1;
        border: 2px solid;
        border-color: #808080 #ffffff #ffffff #808080;
        background: #000;
        color: #fff;
        display: flex;
        flex-direction: column;
        min-height: 80px;
      }
      [data-window-id="{{ID}}"] .console-log-header {
        background: #555;
        color: #fff;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: bold;
      }
      [data-window-id="{{ID}}"] .console-logs {
        flex: 1;
        padding: 4px;
        overflow-y: auto;
        font-size: 10px;
      }
    `,
    js: `
      const queryLabel = container.querySelector('.console-query');
      const todoList = container.querySelector('.console-todo-list');
      const todoForm = container.querySelector('.console-todo-form');
      const todoInput = container.querySelector('.console-todo-input');
      const logsEl = container.querySelector('.console-logs');

      queryLabel.textContent = \`"\${windowDef.prompt || 'Custom Workspace'}"\`;

      function addLog(text) {
        const time = new Date().toLocaleTimeString();
        const item = document.createElement('div');
        item.textContent = \`[\${time}] \${text}\`;
        logsEl.appendChild(item);
        logsEl.scrollTop = logsEl.scrollHeight;
      }

      addLog('Initializing custom application workspace...');
      addLog('Ready for interaction.');

      const soundBtns = container.querySelectorAll('.console-sound-btn');
      soundBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.sound;
          addLog(\`Playing sound: \${type.toUpperCase()}\`);
          
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);

            if (type === 'coin') {
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
              osc.start(); osc.stop(audioCtx.currentTime + 0.35);
            } else if (type === 'laser') {
              osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
              osc.start(); osc.stop(audioCtx.currentTime + 0.25);
            } else if (type === 'beep') {
              osc.frequency.setValueAtTime(440, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
              osc.start(); osc.stop(audioCtx.currentTime + 0.15);
            } else if (type === 'warp') {
              osc.frequency.setValueAtTime(150, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
              gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
              osc.start(); osc.stop(audioCtx.currentTime + 0.45);
            }
          } catch (e) {
            addLog('Audio synth error (context blocked).');
          }
        });
      });

      const items = ['Configure details', 'Add layout rules', 'Test interaction'];
      function renderItems() {
        todoList.innerHTML = '';
        items.forEach((item, idx) => {
          const div = document.createElement('div');
          div.className = 'console-todo-item';
          div.innerHTML = \`
            <input type="checkbox" id="item-\${idx}" />
            <label for="item-\${idx}">\${item}</label>
          \`;
          todoList.appendChild(div);
          
          div.querySelector('input').addEventListener('change', (e) => {
            addLog(\`Task "\${item}" completion toggled: \${e.target.checked}\`);
          });
        });
      }

      renderItems();

      todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const task = todoInput.value.trim();
        if (task) {
          items.push(task);
          todoInput.value = '';
          renderItems();
          addLog(\`Added task: "\${task}"\`);
        }
      });
    `
  },
  producer_consumer: {
    title: "Multi-Threaded Producer-Consumer C++ Simulator",
    icon: "sliders",
    accent: "#0d7d67",
    accentHi: "#44b39d",
    summary: "POSIX threads and mutex lock simulation using a circular queue buffer.",
    tags: ["c++", "threads", "mutex", "systems"],
    window: { width: 560, height: 500 },
    html: `
      <div class="prod-cons-container retro-panel" style="padding: 12px; display: flex; flex-direction: column; gap: 12px; height: 100%; box-sizing: border-box; overflow: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 8px;">
          <div>
            <h3 style="margin: 0; font-size: 13px; color: #111; font-weight: bold;">C++ Circular Buffer Simulator</h3>
            <p style="margin: 2px 0 0; font-size: 10px; color: #666; font-family: monospace;">CSE 325 Project 4 Thread Visualizer</p>
          </div>
          <div style="font-family: monospace; font-size: 11px; background: #fdfcf7; padding: 4px 8px; border: 2px solid #111; border-radius: 4px; font-weight: bold;">
            Mutex: <span class="mutex-status" style="color: #0d7d67;">UNLOCKED</span>
          </div>
        </div>

        <!-- Buffer Visualization -->
        <div class="buffer-visualization" style="background: #fff; border: 2px solid #111; border-radius: 6px; padding: 10px; box-shadow: inset 2px 2px 0px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 6px; font-family: monospace;">
            <span>Circular Buffer [Capacity: 8]</span>
            <span>Size: <span class="buffer-size-label">0/8</span></span>
          </div>
          <div class="buffer-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px;">
            <div class="buffer-slot" data-index="0" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[0]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="1" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[1]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="2" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[2]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="3" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[3]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="4" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[4]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="5" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[5]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="6" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[6]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
            <div class="buffer-slot" data-index="7" style="border: 2px solid #111; border-radius: 4px; padding: 8px 4px; text-align: center; font-family: monospace; font-size: 11px; background: #f0f0f0; transition: all 0.2s;">
              <div style="font-size: 8px; color: #888; margin-bottom: 4px;">[7]</div>
              <div class="slot-val" style="font-weight: bold;">-</div>
            </div>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 8px; font-family: monospace; font-size: 10px; color: #666; justify-content: center;">
            <span><span style="display: inline-block; width: 8px; height: 8px; background: #cceeff; border: 1px solid #111; border-radius: 2px;"></span> Producer (In): <span class="prod-ptr">0</span></span>
            <span><span style="display: inline-block; width: 8px; height: 8px; background: #ffe6cc; border: 1px solid #111; border-radius: 2px;"></span> Consumer (Out): <span class="cons-ptr">0</span></span>
          </div>
        </div>

        <!-- Controls Panel -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Producer Settings -->
          <div class="retro-card" style="padding: 8px; border: 2px solid #111; background: #fdfcf7;">
            <h4 style="margin: 0 0 6px; font-size: 11px; color: #111; font-weight: bold; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; background: #33aaff; border-radius: 50%;"></span>
              Producer Thread
            </h4>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
              <label style="display: flex; justify-content: space-between;">
                <span>Speed: <span class="prod-speed-val">1.5s</span></span>
                <input type="range" class="prod-speed" min="500" max="3000" step="100" value="1500" style="width: 70px; height: 12px; margin: 0;">
              </label>
              <div style="display: flex; gap: 4px;">
                <button class="retro-btn start-prod-btn" style="flex: 1; padding: 4px; font-size: 9px; cursor: pointer;">Auto Run</button>
                <button class="retro-btn step-prod-btn" style="flex: 1; padding: 4px; font-size: 9px; cursor: pointer;">Produce (Step)</button>
              </div>
            </div>
          </div>

          <!-- Consumer Settings -->
          <div class="retro-card" style="padding: 8px; border: 2px solid #111; background: #fdfcf7;">
            <h4 style="margin: 0 0 6px; font-size: 11px; color: #111; font-weight: bold; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; background: #ff8833; border-radius: 50%;"></span>
              Consumer Thread
            </h4>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
              <label style="display: flex; justify-content: space-between;">
                <span>Speed: <span class="cons-speed-val">1.5s</span></span>
                <input type="range" class="cons-speed" min="500" max="3000" step="100" value="1500" style="width: 70px; height: 12px; margin: 0;">
              </label>
              <div style="display: flex; gap: 4px;">
                <button class="retro-btn start-cons-btn" style="flex: 1; padding: 4px; font-size: 9px; cursor: pointer;">Auto Run</button>
                <button class="retro-btn step-cons-btn" style="flex: 1; padding: 4px; font-size: 9px; cursor: pointer;">Consume (Step)</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Thread Console Logs -->
        <div style="flex: 1; display: flex; flex-direction: column; min-height: 100px;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px; font-family: monospace; display: flex; justify-content: space-between;">
            <span>Thread Execution Trace</span>
            <button class="clear-logs-btn" style="background: none; border: none; font-size: 9px; color: #666; cursor: pointer; text-decoration: underline; padding: 0;">Clear Trace</button>
          </div>
          <div class="retro-terminal console-logs" style="flex: 1; min-height: 100px; padding: 6px 8px;">
            <p class="retro-log-line" style="color: #888;">[Trace] POSIX threads spawned. Mutex lock init successful.</p>
          </div>
        </div>
      </div>
    `,
    css: ``,
    js: `
      const buffer = new Array(8).fill(null);
      let size = 0;
      let inPtr = 0;
      let outPtr = 0;
      let prodInterval = null;
      let consInterval = null;
      let itemCounter = 1;
      let mutexLocked = false;

      const bufferSizeLabel = container.querySelector(".buffer-size-label");
      const mutexStatus = container.querySelector(".mutex-status");
      const prodPtrLabel = container.querySelector(".prod-ptr");
      const consPtrLabel = container.querySelector(".cons-ptr");
      const consoleLogs = container.querySelector(".console-logs");

      const prodSpeedSlider = container.querySelector(".prod-speed");
      const prodSpeedVal = container.querySelector(".prod-speed-val");
      const startProdBtn = container.querySelector(".start-prod-btn");
      const stepProdBtn = container.querySelector(".step-prod-btn");

      const consSpeedSlider = container.querySelector(".cons-speed");
      const consSpeedVal = container.querySelector(".cons-speed-val");
      const startConsBtn = container.querySelector(".start-cons-btn");
      const stepConsBtn = container.querySelector(".step-cons-btn");
      
      const clearLogsBtn = container.querySelector(".clear-logs-btn");

      function logTrace(msg, color = "#39ff14") {
        const p = document.createElement("p");
        p.className = "retro-log-line";
        p.style.color = color;
        
        const time = new Date().toLocaleTimeString();
        p.textContent = \`[\${time}] \${msg}\`;
        consoleLogs.appendChild(p);
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
        
        while (consoleLogs.childElementCount > 40) {
          consoleLogs.removeChild(consoleLogs.firstChild);
        }
      }

      function acquireMutex(threadName, callback) {
        if (mutexLocked) {
          logTrace(\`[Acquire] \${threadName} blocked. Mutex currently locked.\`, "#ff3939");
          return false;
        }
        mutexLocked = true;
        mutexStatus.textContent = "LOCKED";
        mutexStatus.style.color = "#a81f3e";
        
        logTrace(\`[Lock] \${threadName} acquired mutex lock.\`, "#ffff39");
        
        setTimeout(() => {
          callback();
          mutexLocked = false;
          mutexStatus.textContent = "UNLOCKED";
          mutexStatus.style.color = "#0d7d67";
          logTrace(\`[Unlock] \${threadName} released mutex lock.\`, "#39ff14");
        }, 400);
        
        return true;
      }

      function updateSlotsDOM() {
        const slots = container.querySelectorAll(".buffer-slot");
        slots.forEach((slot, index) => {
          const valEl = slot.querySelector(".slot-val");
          if (buffer[index] !== null) {
            valEl.textContent = \`Item \${buffer[index]}\`;
            slot.style.background = "#cceeff";
          } else {
            valEl.textContent = "-";
            slot.style.background = "#f0f0f0";
          }
          
          if (index === inPtr && index === outPtr) {
            slot.style.border = "2px dashed #9f3fed";
          } else if (index === inPtr) {
            slot.style.border = "2px solid #33aaff";
          } else if (index === outPtr) {
            slot.style.border = "2px solid #ff8833";
          } else {
            slot.style.border = "2px solid #111";
          }
        });

        bufferSizeLabel.textContent = \`\${size}/8\`;
        prodPtrLabel.textContent = inPtr;
        consPtrLabel.textContent = outPtr;
      }

      function produceItem(manual = false) {
        const threadId = manual ? "0x7f09 (Manual)" : "0x7f02 (Producer)";
        
        if (size >= 8) {
          logTrace(\`[Overflow] Thread \${threadId} buffer full! Producer waiting...\`, "#ffaa33");
          return false;
        }

        return acquireMutex(\`Thread \${threadId}\`, () => {
          const itemNum = itemCounter++;
          buffer[inPtr] = itemNum;
          logTrace(\`[Write] Thread \${threadId} wrote Item \${itemNum} to slot \${inPtr}.\`, "#33aaff");
          inPtr = (inPtr + 1) % 8;
          size++;
          updateSlotsDOM();
        });
      }

      function consumeItem(manual = false) {
        const threadId = manual ? "0x7f10 (Manual)" : "0x7f03 (Consumer)";
        
        if (size <= 0) {
          logTrace(\`[Underflow] Thread \${threadId} buffer empty! Consumer waiting...\`, "#ffaa33");
          return false;
        }

        return acquireMutex(\`Thread \${threadId}\`, () => {
          const itemNum = buffer[outPtr];
          buffer[outPtr] = null;
          logTrace(\`[Read] Thread \${threadId} read Item \${itemNum} from slot \${outPtr}.\`, "#ff8833");
          outPtr = (outPtr + 1) % 8;
          size--;
          updateSlotsDOM();
        });
      }

      prodSpeedSlider.addEventListener("input", (e) => {
        const val = (e.target.value / 1000).toFixed(1);
        prodSpeedVal.textContent = \`\${val}s\`;
        if (prodInterval) {
          stopProducer();
          startProducer();
        }
      });

      consSpeedSlider.addEventListener("input", (e) => {
        const val = (e.target.value / 1000).toFixed(1);
        consSpeedVal.textContent = \`\${val}s\`;
        if (consInterval) {
          stopConsumer();
          startConsumer();
        }
      });

      stepProdBtn.addEventListener("click", () => produceItem(true));
      stepConsBtn.addEventListener("click", () => consumeItem(true));

      function startProducer() {
        startProdBtn.textContent = "Pause";
        startProdBtn.style.background = "#ffbbbb";
        prodInterval = setInterval(() => {
          produceItem(false);
        }, prodSpeedSlider.value);
        logTrace("[System] Producer thread set to ACTIVE status.", "#33aaff");
      }

      function stopProducer() {
        startProdBtn.textContent = "Auto Run";
        startProdBtn.style.background = "";
        clearInterval(prodInterval);
        prodInterval = null;
        logTrace("[System] Producer thread set to BLOCKED status.", "#888");
      }

      function startConsumer() {
        startConsBtn.textContent = "Pause";
        startConsBtn.style.background = "#ffbbbb";
        consInterval = setInterval(() => {
          consumeItem(false);
        }, consSpeedSlider.value);
        logTrace("[System] Consumer thread set to ACTIVE status.", "#ff8833");
      }

      function stopConsumer() {
        startConsBtn.textContent = "Auto Run";
        startConsBtn.style.background = "";
        clearInterval(consInterval);
        consInterval = null;
        logTrace("[System] Consumer thread set to BLOCKED status.", "#888");
      }

      startProdBtn.addEventListener("click", () => {
        if (prodInterval) stopProducer();
        else startProducer();
      });

      startConsBtn.addEventListener("click", () => {
        if (consInterval) stopConsumer();
        else startConsumer();
      });
      
      clearLogsBtn.addEventListener("click", () => {
        consoleLogs.innerHTML = "";
        logTrace("[Trace] Trace cleared.");
      });

      const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(container)) {
          clearInterval(prodInterval);
          clearInterval(consInterval);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      updateSlotsDOM();
    `
  }
};

export const MASTER_APP_PROMPT = `You are AppForge, a UI generator for a retro Windows-style portfolio.

Return JSON only. No markdown, no prose, no code fences.

Required schema:
{
  "title": string,
  "kind": "calculator" | "notes" | "todo" | "timer" | "dashboard" | "chat" | "browser" | "custom",
  "icon": string,
  "summary": string,
  "accent": string,
  "accentHi": string,
  "window": { "width": number, "height": number },
  "tags": string[],
  "panels": [
    { "title": string, "body": string, "bullets": string[] }
  ],
  "actions": [
    { "label": string, "intent": string }
  ],
  "notes": string[]
}

Rules:
- Make the output valid JSON that a browser can render directly.
- Keep the window self-contained and functional.
- Prefer simple, accessible controls.
- Use the prompt to infer the app's purpose, core UI, and the smallest useful set of interactions.
- If the request is ambiguous, produce a safe general-purpose app shell instead of inventing fragile behavior.
- Keep descriptions short and actionable.
- Ensure the app can be rendered without external dependencies.
`;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "app";
}

function titleCase(value) {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word ? word[0].toUpperCase() + word.slice(1) : "")
    .join(" ");
}

function inferKind(query) {
  const normalized = query.toLowerCase();
  return KIND_LIBRARY.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword))) || DEFAULT_KIND;
}

function buildPanels(kindEntry, query, title) {
  const request = query.trim();
  return [
    {
      title: kindEntry.panelTitles[0],
      body: `Built from the prompt: ${request || title}.`,
      bullets: [
        `Focus: ${kindEntry.kind}`,
        `Primary goal: ${kindEntry.summary}`,
        "Self-contained window",
      ],
    },
    {
      title: kindEntry.panelTitles[1],
      body: "The launcher turns the prompt into a manifest, then the desktop renders it as a window shell.",
      bullets: [
        "Accessible controls",
        "Window chrome and taskbar integration",
        "Prompt-driven content",
      ],
    },
    {
      title: kindEntry.panelTitles[2],
      body: "This version is intentionally conservative so it behaves reliably before any model-backed generation is wired in.",
      bullets: [
        "Predictable layout",
        "Stable fallback behavior",
        "Backend-ready JSON contract",
      ],
    },
  ];
}

export function buildGeneratedApp(query, count = 0) {
  const kindEntry = inferKind(query);
  let title = kindEntry.title || titleCase(query) || "Custom App";
  const slug = slugify(title);
  
  let html = "";
  let css = "";
  let js = "";
  let tags = kindEntry.tags || [];
  let summary = kindEntry.summary || "";
  let accent = kindEntry.accent || "#0a3b73";
  let accentHi = kindEntry.accentHi || "#2b74c5";
  let windowSize = kindEntry.window || { width: 600, height: 540 };
  let icon = kindEntry.icon || "★";

  // If the query was categorized as custom, try to match offline interactive templates
  if (kindEntry.kind === "custom") {
    const q = query.toLowerCase();
    let matchedTemplate = null;

    if (q.includes("producer") || q.includes("consumer") || q.includes("buffer") || q.includes("thread")) {
      matchedTemplate = OFFLINE_TEMPLATES.producer_consumer;
    } else if (q.includes("paint") || q.includes("draw") || q.includes("canvas") || q.includes("sketch") || q.includes("doodle") || q.includes("art")) {
      matchedTemplate = OFFLINE_TEMPLATES.paint;
    } else if (q.includes("game") || q.includes("snake") || q.includes("play") || q.includes("arcade") || q.includes("score")) {
      matchedTemplate = OFFLINE_TEMPLATES.snake;
    } else if (q.includes("weather") || q.includes("forecast") || q.includes("temp") || q.includes("climate") || q.includes("rain") || q.includes("sun")) {
      matchedTemplate = OFFLINE_TEMPLATES.weather;
    } else if (q.includes("music") || q.includes("player") || q.includes("audio") || q.includes("song") || q.includes("tape") || q.includes("cassette")) {
      matchedTemplate = OFFLINE_TEMPLATES.music;
    } else {
      matchedTemplate = OFFLINE_TEMPLATES.general;
    }

    if (matchedTemplate) {
      title = matchedTemplate.title;
      icon = matchedTemplate.icon;
      accent = matchedTemplate.accent;
      accentHi = matchedTemplate.accentHi;
      summary = matchedTemplate.summary;
      tags = matchedTemplate.tags;
      windowSize = matchedTemplate.window;
      html = matchedTemplate.html;
      css = matchedTemplate.css;
      js = matchedTemplate.js;
    }
  }

  return {
    id: `gen-${slug}-${Date.now().toString(36)}-${count + 1}`,
    kind: kindEntry.kind,
    title,
    icon,
    summary,
    accent,
    accentHi,
    prompt: query.trim(),
    tags,
    window: windowSize,
    html,
    css,
    js,
    panels: buildPanels(kindEntry, query, title),
    actions: [
      { label: "Open launcher", intent: "open-launcher" },
      { label: "Generate another app", intent: "generate-again" },
      { label: "Reset desktop", intent: "reset-layout" },
    ],
    notes: [
      "This app was generated locally from the launcher prompt.",
      "The master prompt contract is ready for a backend model.",
    ],
  };
}
