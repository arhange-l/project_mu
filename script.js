document.addEventListener('DOMContentLoaded', () => {
  const levels = document.querySelectorAll('.level');
  const dots = document.querySelectorAll('.level-dot');
  const progress = document.getElementById('progress');
  const musicBtn = document.getElementById('music-toggle');
  const audio = document.getElementById('bg-music');
  let current = 0;
  const total = levels.length - 1;

  // Навигация
  window.goNext = () => { if (current < total) { current++; updateUI(current); } };
  window.goBack = () => { if (current > 0) { current--; updateUI(current); } };
  window.goRestart = () => { current = 0; updateUI(0); };

  function updateUI(idx) {
    levels.forEach(l => l.classList.remove('active'));
    document.getElementById(`level-${idx}`).classList.add('active');
    dots.forEach(d => d.classList.remove('active'));
    dots[idx].classList.add('active');
    progress.style.width = `${(idx / total) * 100}%`;
  }

  // Старт
  document.getElementById('startBtn').addEventListener('click', goNext);
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.level);
      if (target >= current) { current = target; updateUI(current); }
    });
  });

  // Музыка
  let isPlaying = false;
  musicBtn.addEventListener('click', () => {
    if (isPlaying) { audio.pause(); musicBtn.textContent = '🎵 Музыка'; }
    else { audio.play().catch(e => console.log("Нужно взаимодействие")); musicBtn.textContent = '⏸ Пауза'; }
    isPlaying = !isPlaying;
  });

  // Галерея (Canvas + LocalStorage)
  const canvas = document.getElementById('gallery-canvas');
  const ctx = canvas.getContext('2d');
  const uploadInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const clearBtn = document.getElementById('clear-gallery');
  
  let images = [];
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    render();
  }
  window.addEventListener('resize', resizeCanvas);

  // Загрузка из LocalStorage
  function loadGallery() {
    const saved = localStorage.getItem('milana_gallery');
    if (saved) {
      images = JSON.parse(saved);
      images.forEach(imgObj => {
        const img = new Image();
        img.src = imgObj.src;
        img.onload = () => {
          imgObj.el = img; // Привязываем загруженный объект
          render();
        };
      });
    }
  }

  function saveGallery() {
    const data = images.map(img => ({ src: img.el.src, x: img.x, y: img.y, w: img.w, h: img.h }));
    localStorage.setItem('milana_gallery', JSON.stringify(data));
  }

  function addImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(200 / img.width, 200 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        images.push({
          el: img, x: Math.random() * (canvas.width - w), y: Math.random() * (canvas.height - h), w, h
        });
        saveGallery();
        render();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  uploadBtn.addEventListener('click', () => uploadInput.click());
  uploadInput.addEventListener('change', e => [...e.target.files].forEach(addImage));
  
  clearBtn.addEventListener('click', () => {
    if(confirm('Удалить все фото из галереи?')) {
      images = [];
      localStorage.removeItem('milana_gallery');
      render();
    }
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    images.forEach(img => {
      ctx.drawImage(img.el, img.x, img.y, img.w, img.h);
      ctx.strokeStyle = 'rgba(212,175,55,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(img.x, img.y, img.w, img.h);
    });
  }

  // Drag & Drop
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handleDown(e) {
    const pos = getPos(e);
    for (let i = images.length - 1; i >= 0; i--) {
      const img = images[i];
      if (pos.x >= img.x && pos.x <= img.x + img.w && pos.y >= img.y && pos.y <= img.y + img.h) {
        dragging = img;
        dragOffset = { x: pos.x - img.x, y: pos.y - img.y };
        break;
      }
    }
  }
  function handleMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const pos = getPos(e);
    dragging.x = pos.x - dragOffset.x;
    dragging.y = pos.y - dragOffset.y;
    render();
  }
  function handleUp() { dragging = null; saveGallery(); }

  canvas.addEventListener('mousedown', handleDown);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleUp);
  canvas.addEventListener('mouseleave', handleUp);
  canvas.addEventListener('touchstart', handleDown, { passive: false });
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchend', handleUp);

  resizeCanvas();
  loadGallery();
});
