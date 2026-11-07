/* zenus — ancienne progression conservée, courbe désormais autonome et hors ligne. */
(() => {
  'use strict';
  const backButton = document.getElementById('back-button');
  const canvas = document.getElementById('progressChart');
  const showcase = document.getElementById('badges-showcase');
  const get = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  };
  const dates = get('sessionDates', []);
  const badges = get('badges', []);
  const badgeDates = get('badgeDates', {});
  backButton.addEventListener('click', () => { window.location.href = 'index.html'; });
  function drawChart() {
    const counts = {};
    (Array.isArray(dates) ? dates : []).forEach(value => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) counts[value] = (counts[value] || 0) + 1;
    });
    const labels = Object.keys(counts).sort().slice(-14);
    const width = Math.max(280,canvas.getBoundingClientRect().width || 750);
    const height = 285;
    const ratio = Math.min(2,window.devicePixelRatio||1);
    canvas.width = Math.round(width*ratio);
    canvas.height = height*ratio;
    canvas.style.aspectRatio = `${width} / ${height}`;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.clearRect(0,0,width,height);
    if (!labels.length) {
      ctx.font = '15px Segoe UI, sans-serif'; ctx.fillStyle='#546278';
      ctx.fillText('Aucune séance enregistrée pour le moment.',17,65);
      return;
    }
    const top=28,bottom=height-48,left=40,right=width-17;
    const max = Math.max(2,...labels.map(d=>counts[d]));
    const maxY = Math.ceil(max / 2) * 2;
    ctx.font = '12px Segoe UI, sans-serif'; ctx.textAlign='right';
    for (let i=0;i<=4;i++) {
      const y=bottom-(bottom-top)*i/4;
      ctx.strokeStyle='rgba(88,105,130,0.18)';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
      ctx.fillStyle='#546278';ctx.fillText(String(Math.round(maxY*i/4*10)/10),left-10,y+4);
    }
    const span=Math.max(labels.length-1,1);
    ctx.lineWidth=3;ctx.strokeStyle='#6872d5';ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
    labels.forEach((d,i)=>{
      const x=left+(right-left)*i/span;
      const y=bottom-counts[d]/maxY*(bottom-top);
      if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });
    ctx.stroke();
    labels.forEach((d,i)=>{
      const x=left+(right-left)*i/span;
      const y=bottom-counts[d]/maxY*(bottom-top);
      ctx.fillStyle='#596acc';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
      if(labels.length<=7 || i%2===0 || i===labels.length-1){
        ctx.textAlign='center';ctx.fillStyle='#4b5563';ctx.font='11px Segoe UI, sans-serif';ctx.fillText(d.slice(5).replace('-','/'),x,bottom+22);
      }
    });
  }
  function renderBadges() {
    showcase.replaceChildren();
    if (!Array.isArray(badges) || !badges.length) {
      const p=document.createElement('p');p.textContent='Aucun badge pour le moment.';showcase.append(p);return;
    }
    badges.forEach(label=>{
      if(typeof label!=='string') return;
      const el=document.createElement('div');el.className='badge-item';
      const title=document.createElement('strong');title.textContent=label;
      const date=document.createElement('div');date.style.fontSize='.8em';date.textContent='Obtenu le : '+((badgeDates&&badgeDates[label])||'date inconnue');
      el.append(title,date);showcase.append(el);
    });
  }
  if('ResizeObserver' in window) new ResizeObserver(drawChart).observe(canvas.parentElement);
  else window.addEventListener('resize', drawChart);
  drawChart();renderBadges();
})();
