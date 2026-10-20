/* =========================================================
   Thiệp 20/10 – hiệu ứng (không dùng thư viện ngoài)
   ========================================================= */
(() => {
  "use strict";

  // Người dùng có bật "giảm chuyển động" không?
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth < 600;

  /* ---------------------------------------------------------
     0. LƯỚI ẢNH NỀN (~20 ảnh nhỏ)
     Thêm ảnh: chép file vào thư mục rồi ghi tên vào PHOTOS.
     Ít hơn 20 ảnh thì ảnh sẽ được lặp lại cho đủ ô.
     --------------------------------------------------------- */
  const PHOTOS = [
    "CP-web.jpg",
    // "anh2.jpg",
    // "anh3.jpg",
  ];
  const TILE_COUNT = 20;

  function createPhotoGrid() {
    const grid = document.getElementById("bgGrid");
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = document.createElement("div");
      tile.className = "bg__tile";
      tile.style.backgroundImage = `url("${PHOTOS[i % PHOTOS.length]}")`;
      tile.style.setProperty("--r", (Math.random() * 6 - 3).toFixed(1) + "deg");
      tile.style.setProperty("--d", (i * 0.05).toFixed(2) + "s");
      grid.appendChild(tile);
    }
  }

  /* ---------------------------------------------------------
     1. CÁNH HOA / TRÁI TIM RƠI
     Đổi số lượng ở PETAL_COUNT
     --------------------------------------------------------- */
  const PETAL_COUNT = isMobile ? 14 : 24;
  const HEART_COLORS = ["#f06b8f", "#e8476f", "#ff9fb8", "#e9c77b"];

  function createPetals() {
    if (reduceMotion) return;
    const box = document.getElementById("petals");
    const rand = (min, max) => Math.random() * (max - min) + min;

    for (let i = 0; i < PETAL_COUNT; i++) {
      const el = document.createElement("span");
      const isHeart = Math.random() < 0.35;
      el.className = "petal " + (isHeart ? "petal--heart" : "petal--leaf");
      if (isHeart) el.textContent = "❤";
      el.style.setProperty("--x", rand(0, 100) + "vw");
      el.style.setProperty("--size", rand(isHeart ? 12 : 10, isHeart ? 22 : 18) + "px");
      el.style.setProperty("--dur", rand(9, 16) + "s");
      el.style.setProperty("--delay", rand(-16, 0) + "s"); // số âm: có cánh hoa ngay khi mở trang
      el.style.setProperty("--sway", rand(20, 70) + "px");
      el.style.setProperty("--c", HEART_COLORS[i % HEART_COLORS.length]);
      box.appendChild(el);
    }
  }

  /* ---------------------------------------------------------
     2. HIỆU ỨNG ĐÁNH MÁY CHO LỜI CHÚC
     Nội dung lấy từ thẻ #wish trong index.html
     --------------------------------------------------------- */
  const TYPE_SPEED = 38;      // ms mỗi ký tự (càng nhỏ càng nhanh)
  const TYPE_START_DELAY = 900; // chờ bìa thiệp lật xong

  // Chuẩn bị sẵn khi tải trang, trả về hàm bắt đầu gõ (gọi khi mở thiệp)
  function typewriter() {
    const el = document.getElementById("wish");
    const chars = Array.from(el.textContent.trim()); // Array.from để không cắt đôi emoji
    if (reduceMotion) return () => {};

    // Giữ chiều cao cố định để thiệp không bị giật khi chữ hiện dần
    el.style.minHeight = el.offsetHeight + "px";
    el.setAttribute("aria-label", chars.join(""));
    el.textContent = "";

    const text = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "caret";
    el.append(text, caret);

    let i = 0;
    const tick = () => {
      text.textContent += chars[i++];
      if (i < chars.length) {
        // Dừng lâu hơn một chút sau dấu câu cho tự nhiên
        const pause = /[.,!?–]/.test(chars[i - 1]) ? TYPE_SPEED * 6 : TYPE_SPEED;
        setTimeout(tick, pause);
      } else {
        setTimeout(() => caret.remove(), 1500);
        el.style.minHeight = "";
      }
    };
    return () => setTimeout(tick, TYPE_START_DELAY);
  }

  /* ---------------------------------------------------------
     3. PHÁO HOA / TRÁI TIM TRÊN CANVAS
     --------------------------------------------------------- */
  const canvas = document.getElementById("fireworks");
  const ctx = canvas.getContext("2d");
  const FW_COLORS = ["#e8476f", "#ff8fab", "#ffd1df", "#e9c77b", "#ffffff", "#c72c58"];
  let particles = [];
  let running = false;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  // Một chùm nổ tại (x, y)
  function burst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.011 + Math.random() * 0.012,
        size: 6 + Math.random() * 9,
        heart: Math.random() < 0.55,
        color: FW_COLORS[(Math.random() * FW_COLORS.length) | 0],
      });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.vx *= 0.98;
      p.vy = p.vy * 0.98 + 0.06; // trọng lực nhẹ
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      if (p.heart) {
        drawHeart(p.x, p.y, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(loop);
    else running = false;
  }

  // Bắn từ nút + vài chùm ngẫu nhiên trên màn hình
  function celebrate(fromEl) {
    if (reduceMotion) return;
    const r = fromEl.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, isMobile ? 40 : 60);
    const extra = isMobile ? 3 : 5;
    for (let i = 0; i < extra; i++) {
      setTimeout(() => {
        burst(
          innerWidth * (0.15 + Math.random() * 0.7),
          innerHeight * (0.12 + Math.random() * 0.4),
          isMobile ? 30 : 45
        );
      }, 250 + i * 320);
    }
  }

  /* ---------------------------------------------------------
     4. NHẠC NỀN
     - Bắt đầu khi bấm "Mở quà" lần đầu (trình duyệt chặn tự phát)
     - Âm lượng tăng dần trong 3 giây; bài hát tự lặp (thuộc tính loop)
     --------------------------------------------------------- */
  const audio = document.getElementById("bgm");
  const musicBox = document.getElementById("music");
  const musicBtn = document.getElementById("musicBtn");
  const MAX_VOLUME = 0.8;
  const FADE_MS = 3000;
  let fadeFrame = 0;

  function fadeIn() {
    cancelAnimationFrame(fadeFrame);
    const start = performance.now();
    audio.volume = 0;
    const step = (now) => {
      const t = Math.min((now - start) / FADE_MS, 1);
      audio.volume = t * MAX_VOLUME;
      if (t < 1) fadeFrame = requestAnimationFrame(step);
    };
    fadeFrame = requestAnimationFrame(step);
  }

  function setPlaying(on) {
    musicBox.classList.toggle("playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
  }

  function playMusic() {
    audio.volume = 0;
    const p = audio.play();
    if (p && p.then) {
      p.then(() => { setPlaying(true); fadeIn(); })
       .catch(() => setPlaying(false)); // thiếu file hoặc bị chặn
    }
  }

  function pauseMusic() {
    cancelAnimationFrame(fadeFrame);
    audio.pause();
    setPlaying(false);
  }

  musicBtn.addEventListener("click", () => {
    audio.paused ? playMusic() : pauseMusic();
  });

  // Không tìm thấy file nhạc → làm mờ nút
  audio.addEventListener("error", () => {
    musicBox.classList.add("missing");
    setPlaying(false);
  });

  /* ---------------------------------------------------------
     5. NÚT "MỞ QUÀ"
     --------------------------------------------------------- */
  const giftBtn = document.getElementById("giftBtn");
  const secret = document.getElementById("secret");
  let opened = false;

  giftBtn.addEventListener("click", () => {
    celebrate(giftBtn);
    if (opened) return; // bấm lại chỉ bắn thêm pháo hoa

    opened = true;
    secret.classList.add("show");
    giftBtn.classList.add("opened");
    giftBtn.textContent = "Bắn thêm tim 💖";
    if (audio.paused) playMusic();
    setTimeout(() => secret.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }), 300);
  });

  /* ---------------------------------------------------------
     KHỞI ĐỘNG
     --------------------------------------------------------- */
  createPhotoGrid();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  createPetals();
  const startTyping = typewriter();

  /* ---------------------------------------------------------
     6. MỞ BÌA THIỆP
     --------------------------------------------------------- */
  const card = document.getElementById("card");
  const cover = document.getElementById("cover");
  const inside = document.getElementById("inside");

  cover.addEventListener("click", () => {
    if (card.classList.contains("open")) return;
    card.classList.add("open");
    cover.setAttribute("aria-expanded", "true");
    inside.inert = false;
    startTyping();
    // Lật xong thì ẩn hẳn bìa, chuyển focus vào nút mở quà
    setTimeout(() => {
      cover.hidden = true;
      giftBtn.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 1200);
  });
})();
