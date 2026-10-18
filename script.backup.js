'use strict';
/* ===== Utilidades ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const money = n => '$' + n.toLocaleString('es-CO') + ' COP / h';
const stars = n => '★'.repeat(n) + `<span class="off">${'★'.repeat(5 - n)}</span>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hash = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0);
const rt = t => t.rating ? Math.round(t.rating) : 0;
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800)}
const store = {
  get(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
};

/* ===== Fotos de perfil (retratos ilustrados en SVG; se pueden cambiar con el campo "photo") ===== */
const SK=['#f3d2b3','#e0ac84','#b97f58','#8a5a3b'], HR=['#2a1a10','#5b3a1f','#141414','#9a6a35','#bdbdbd'],
      BG=['#dbeafe','#fef3c7','#fce7f3','#dcfce7','#ede9fe','#fee2e2'], SH=['#3b82f6','#0f766e','#7c3aed','#b45309','#334155','#be185d'];
function portrait([s,h,b,f], i){
  const sk=SK[s], hr=HR[h];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${BG[b]}"/>${f?`<path d="M26 44c0-24 12-30 24-30s24 6 24 30v34H26z" fill="${hr}"/>`:''}<path d="M12 100c2-22 18-30 38-30s36 8 38 30z" fill="${SH[i%6]}"/><rect x="43" y="58" width="14" height="16" rx="6" fill="${sk}"/><ellipse cx="50" cy="42" rx="17" ry="20" fill="${sk}"/><path d="M33 40c-2-16 8-24 18-24s20 6 17 24c-3-8-8-12-17-12s-14 3-18 12z" fill="${hr}"/><circle cx="43.5" cy="43" r="1.8" fill="#222"/><circle cx="56.5" cy="43" r="1.8" fill="#222"/><path d="M44 52q6 5 12 0" stroke="#7a3b2e" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const av = (t, c = '') => `<span class="avatar ${c}" aria-hidden="true"><img src="${t.photo || portrait(t.look, hash(t.id))}" alt=""></span>`;

/* ===== Datos ===== */
const SUBJECTS = ['Matemáticas','Física','Inglés','Programación','Química','Historia','Biología','Literatura'];
const LEVELS = ['Primaria','Secundaria','Preparatoria','Universidad'];
const LOCS = ['Bogotá','Medellín','Cali','Barranquilla'];
// T(id, nombre, título, materias, niveles, ciudad, modalidades, precio, calificación, reseñas, descripción, etiquetas, disponibilidad, [piel,cabello,fondo,largo])
const T = (id,name,subj,cats,levels,loc,mode,price,rating,reviews,desc,tags,av,look) =>
  ({id,name,subj,cats:cats.split(','),levels:levels.split(','),loc,mode:mode.split(','),price,rating,reviews,desc,tags:tags.split(','),av,look,verified:rating>=4.6});
let TUTORS = [
  T('ar','Prof. Alejandro Ruiz','Matemáticas e Ingeniería','Matemáticas','Universidad,Preparatoria','Bogotá','Online,Presencial',150000,4.9,203,'Ingeniero con más de diez años preparando estudiantes para parciales y exámenes de admisión.','Álgebra,Cálculo Diferencial,Estadística,Ingeniería','Lunes:9-11,14-16;Miércoles:15-18;Viernes:9-12',[1,0,0,0]),
  T('st','Dra. Sofía Torres','Química Orgánica y Biología','Química,Biología','Universidad,Preparatoria','Medellín','Online,Presencial',135000,4.7,98,'Doctora en química con experiencia en laboratorio y en la preparación de pruebas de ciencias.','Química Orgánica,Bioquímica,Biología Celular,Laboratorio','Martes:8-10,16-18;Jueves:14-17',[0,1,2,1]),
  T('cm','Lic. Clara Mendez','Inglés de Negocios y TOEFL','Inglés','Universidad','Barranquilla','Online,Presencial',170000,4.9,142,'Certificada en enseñanza de inglés. Preparo para TOEFL, entrevistas y comunicación empresarial.','TOEFL,Business English,Entrevistas,Writing','Lunes:11-12,15-17;Miércoles:10-12;Sábado:9-12',[1,1,1,1]),
  T('cmd','Dr. Carlos Mendoza','Física y Matemáticas Avanzadas','Física,Matemáticas','Preparatoria,Universidad','Bogotá','Online,Presencial',200000,4.8,127,'Sólida formación en ciencias exactas y más de ocho años capacitando estudiantes. Mi metodología simplifica los problemas complejos paso a paso.','Cálculo Integral,Álgebra Lineal,Física Mecánica,Termodinámica','Lunes:9-11,14-16;Jueves:16-19',[2,2,3,0]),
  T('ev','Elena Vargas','Matemáticas para Primaria','Matemáticas','Primaria','Bogotá','Online',65000,5.0,89,'Pedagoga especializada en aprendizaje lúdico, resolución de problemas y fortalecimiento de bases matemáticas.','Aritmética,Fracciones,Juegos Matemáticos,Refuerzo Escolar','Martes:15-18;Jueves:15-18;Sábado:9-11',[0,3,4,1]),
  T('jp','Juan Pablo Ríos','Programación en Python y Web','Programación','Universidad,Preparatoria','Medellín','Online',120000,4.8,76,'Desarrollador de software que enseña lógica de programación con proyectos reales desde la primera clase.','Python,JavaScript,HTML y CSS,Algoritmos','Lunes:18-21;Miércoles:18-21;Domingo:10-13',[1,2,5,0]),
  T('ld','Laura Díaz','Historia y Literatura','Historia,Literatura','Secundaria,Preparatoria','Cali','Presencial',80000,4.6,54,'Licenciada en ciencias sociales. Ayudo a comprender, analizar y escribir sobre historia y textos literarios.','Historia de Colombia,Análisis Literario,Ensayos,Comprensión Lectora','Martes:14-17;Viernes:14-17',[2,0,2,1]),
  T('mp','Mauricio Pérez','Inglés Conversacional','Inglés','Secundaria,Universidad','Barranquilla','Online',75000,4.5,61,'Clases dinámicas centradas en hablar con confianza, pronunciación y vocabulario para la vida diaria.','Conversación,Pronunciación,Vocabulario,Inglés Básico','Lunes:17-19;Miércoles:17-19;Sábado:8-11',[1,1,3,0]),
  T('vg','Valentina Gómez','Biología y Ciencias Naturales','Biología','Primaria,Secundaria','Cali','Presencial',70000,4.7,45,'Bióloga que explica la naturaleza con experimentos sencillos y material visual para que aprender sea divertido.','Ciencias Naturales,Ecología,Cuerpo Humano,Experimentos','Miércoles:14-17;Sábado:9-12',[0,3,3,1]),
  T('dh','Daniel Herrera','Física para Secundaria','Física','Secundaria,Preparatoria','Barranquilla','Presencial',90000,4.4,38,'Profesor de física con enfoque práctico: ejercicios resueltos, repaso para pruebas Saber y mucha paciencia.','Cinemática,Dinámica,Pruebas Saber,Electricidad','Martes:16-19;Jueves:16-19',[3,2,1,0]),
  T('ac','Andrea Castro','Java y Bases de Datos','Programación','Universidad','Bogotá','Online',160000,4.9,110,'Ingeniera de sistemas con experiencia en la industria. Te acompaño en Java, SQL y diseño de software.','Java,SQL,POO,Diseño de Software','Lunes:19-21;Jueves:19-21;Sábado:8-12',[1,4,4,1]),
  T('sn','Sebastián Núñez','Literatura y Redacción','Literatura','Secundaria,Universidad','Medellín','Online',60000,4.3,29,'Escritor y corrector de estilo. Mejora tu redacción académica, tus ensayos y tu comprensión de lectura.','Redacción,Ensayo,Ortografía,Narrativa','Martes:10-12;Viernes:16-18',[0,0,5,0])
];
const sessions = [
  {t:'Dr. Carlos Mendoza',s:'Cálculo Multivariable',mode:'Online (Sala Integrada)',when:'Mañana, 16 Ene — 15:00 a 17:00',a:'Unirse a Videollamada',msg:'Conectando a la sala de videollamada…',primary:true},
  {t:'Lic. Clara Mendez',s:'Práctica Conversacional Inglés',mode:'Presencial',when:'Lunes, 19 Ene — 11:00 a 12:00',a:'Ver Dirección',msg:'La dirección se mostrará aquí cuando el backend esté conectado.'}
];
const history = [
  {d:'10 Ene 2026',h:'2 horas',t:'Dr. Carlos Mendoza',s:'Física Básica',n:5},
  {d:'08 Ene 2026',h:'1.5 horas',t:'Mtra. Alicia Delgado',s:'Repaso TOEFL',n:4}
];

/* ===== Cuentas (demo en localStorage: sin servidor) ===== */
let users = store.get('tol_users', []), me = null, role = 'student';
function addTutor(u){
  const h = hash(u.email);
  TUTORS.push({id:'u'+h,name:u.name,subj:u.subj,cats:SUBJECTS.filter(s=>norm(u.subj).includes(norm(s).slice(0,5))),
    levels:LEVELS.filter(l=>norm(u.level).includes(norm(l).slice(0,5))),loc:LOCS.find(l=>norm(l)===norm(u.loc))||u.loc,
    mode:['Online'],price:u.price,rating:0,reviews:0,desc:`Tutor de ${u.subj}. Perfil recién creado en TutoresOn-Line.`,
    tags:u.subj.split(/,\s*/).slice(0,4),av:'Lunes:9-11;Miércoles:14-16',look:[h%4,h%5,h%6,h%2],verified:false});
}
users.filter(u => u.role === 'tutor').forEach(addTutor);
me = users.find(u => u.email === store.get('tol_me', '')) || null;
function updateNav(){
  $('#navLogin').hidden = !!me; $('#navOut').hidden = !me;
  const r = $('#navReg'); r.textContent = me ? 'Mi Panel' : 'Registrarse'; r.dataset.go = me ? 'dash' : 'register';
}

/* ===== Navegación ===== */
function go(id){
  if (id === 'dash' && !me){ toast('Inicia sesión para ver tu panel.'); id = 'login'; }
  $$('.view').forEach(v => v.hidden = v.id !== id);
  $('#tabbar').hidden = id !== 'dash';
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === id));
  $('#menu').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  window.scrollTo({top:0});
  if (id === 'results') renderResults();
  if (id === 'dash') renderDash();
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g){ e.preventDefault(); go(g.dataset.go); return; }
  const sc = e.target.closest('[data-scroll]');
  if (sc){ e.preventDefault(); $('#'+sc.dataset.scroll).scrollIntoView({behavior:'smooth'}); return; }
  const p = e.target.closest('[data-profile]'), b = e.target.closest('[data-book]'), m = e.target.closest('[data-msg]');
  if (p){ renderProfile(p.dataset.profile); go('profile'); }
  if (b) book(b.dataset.book);
  if (m) toast('Chat con el tutor: requiere backend de mensajería.');
});
$('#menuBtn').addEventListener('click', e => {
  const m = $('#menu'); m.classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', String(m.classList.contains('open')));
});
$('#navOut').addEventListener('click', e => {
  e.preventDefault(); me = null; store.set('tol_me', ''); updateNav(); go('home'); toast('Sesión cerrada.');
});

/* ===== Inicio ===== */
const tutorCard = t => `
  <article class="card tutor">
    ${av(t)}
    <h3>${esc(t.name)}</h3><span class="sm-t">${esc(t.subj)}</span>
    <span class="stars" role="img" aria-label="${rt(t)} de 5 estrellas">${stars(rt(t))}</span>
    <span class="pr">${money(t.price)}</span>
    <button class="btn outline" data-profile="${t.id}">Ver Perfil</button>
  </article>`;
$('#featured').innerHTML = ['ar','cm','ac'].map(id => tutorCard(TUTORS.find(t => t.id === id))).join('');
$('#subjects').innerHTML = SUBJECTS.map(s => `<button type="button">${s}</button>`).join('');
$('#subjects').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  $('#fSubject').value = e.target.textContent; $('#heroForm').requestSubmit();
});

/* ===== Resultados ===== */
function fillSelect(sel, vals){ $(sel).insertAdjacentHTML('beforeend', vals.map(v => `<option>${esc(v)}</option>`).join('')) }
fillSelect('#sSubject', SUBJECTS); fillSelect('#sLevel', LEVELS); fillSelect('#sLoc', LOCS);

$('#heroForm').addEventListener('submit', e => {
  e.preventDefault();
  const pick = (sel, v) => { const o = $$(sel + ' option').find(o => o.value && norm(o.value) === norm(v)); return o ? o.value : ''; };
  const sj = $('#fSubject').value.trim(), lv = $('#fLevel').value.trim(), lc = $('#fLoc').value.trim();
  $('#filters').reset();
  const s = pick('#sSubject', sj); $('#sSubject').value = s; $('#q').value = s ? '' : sj;
  $('#sLevel').value = pick('#sLevel', lv); $('#sLoc').value = pick('#sLoc', lc);
  $('#filters').classList.add('open'); $('#filtersBtn').setAttribute('aria-expanded', 'true');
  go('results');
});

function resCard(t){
  const rate = t.rating ? `<span class="stars">${stars(rt(t))}</span> <b>${t.rating.toFixed(1)}</b> <span class="muted">(${t.reviews})</span>` : '<span class="muted">Tutor nuevo</span>';
  return `<article class="card res">
    <div class="top">${av(t)}
      <div class="col"><div><h3>${esc(t.name)}</h3> ${t.verified ? '<span class="badge">Verificado</span>' : ''}</div>
        <span class="sub blue" style="font-size:.85rem">${esc(t.subj)}</span>
        <span class="rate">${rate}</span>
        <span class="mode">${t.mode.length > 1 ? 'Online / Presencial' : t.mode[0]}</span></div></div>
    <div class="tags" style="margin-top:12px">${t.levels.map(l => `<span>${l}</span>`).join('')}<span>📍 ${esc(t.loc)}</span></div>
    <p class="desc">${esc(t.desc)}</p>
    <div class="foot-r"><b>${money(t.price)}</b>
      <button class="btn primary" data-book="${t.id}">Reservar</button>
      <button class="btn outline" data-profile="${t.id}">Ver Perfil</button></div></article>`;
}
function renderResults(){
  const q = norm($('#q').value.trim()), sub = $('#sSubject').value, lvl = $('#sLevel').value,
        mode = $('#sMode').value, loc = $('#sLoc').value, max = +$('#sPrice').value || Infinity, sort = $('#sort').value;
  const list = TUTORS.filter(t => {
    const hay = norm([t.name, t.subj, t.desc, t.tags.join(' ')].join(' '));
    return (!q || q.split(/\s+/).every(w => hay.includes(w)))
      && (!sub || t.cats.includes(sub)) && (!lvl || t.levels.includes(lvl))
      && (!mode || t.mode.includes(mode)) && (!loc || t.loc === loc) && t.price <= max;
  });
  if (sort === 'price') list.sort((a,b) => a.price - b.price);
  if (sort === 'rating') list.sort((a,b) => b.rating - a.rating);
  $('#count').textContent = list.length; $('#countLbl').textContent = list.length === 1 ? 'tutor disponible' : 'tutores disponibles';
  $('#resultList').innerHTML = list.length ? list.map(resCard).join('')
    : '<p class="empty">No hay tutores con estos filtros. Prueba limpiarlos o buscar otra materia.</p>';
}
$('#filtersBtn').addEventListener('click', e => {
  const f = $('#filters'); f.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(f.classList.contains('open')));
});
$('#filters').addEventListener('input', renderResults);
$('#filters').addEventListener('submit', e => e.preventDefault());
$('#sort').addEventListener('change', renderResults);
$('#clear').addEventListener('click', () => { $('#filters').reset(); renderResults(); });

/* ===== Perfil (según el tutor elegido) ===== */
const availHtml = t => t.av.split(';').map(d => {
  const [day, sl] = d.split(':');
  return `<div class="avail"><b>${day}</b>${sl.split(',').map(x => { const [a,b] = x.split('-'); return `<span class="tag">${a.padStart(2,'0')}:00 - ${b.padStart(2,'0')}:00</span>` }).join('')}</div>`;
}).join('');
function renderProfile(id){
  const t = TUTORS.find(x => x.id === id); if (!t) return;
  const rate = t.rating ? `<span class="stars">${stars(rt(t))}</span> <b>${t.rating.toFixed(1)}</b> <span class="muted">(${t.reviews} reseñas)</span>` : '<span class="muted">Tutor nuevo, aún sin reseñas</span>';
  $('#profileBox').innerHTML = `
    <button class="back" data-go="results">← <span>Resultados</span></button>
    <div class="p-head">${av(t, 'lg')}
      <div><h1 class="h-md">${esc(t.name)}</h1>${t.verified ? '<span class="badge">Verificado</span>' : ''}
        <p class="sub blue">${esc(t.subj)}</p><p class="rate">${rate}</p><p class="muted sm">📍 ${esc(t.loc)}</p></div></div>
    <div class="pgrid">
      <div>
        <h3 class="h-sm">Sobre mí</h3><p class="text">${esc(t.desc)}</p>
        <h3 class="h-sm">Materias y Niveles</h3>
        <div class="tags">${t.tags.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <div class="tags" style="margin-top:10px">${t.levels.map(x => `<span>${x}</span>`).join('')}</div>
        <h3 class="h-sm">Disponibilidad Semanal</h3>${availHtml(t)}
      </div>
      <aside class="box">
        <small class="cap">TARIFA</small>
        <p class="price"><b>$${t.price.toLocaleString('es-CO')}</b> <span>COP / hora</span></p>
        <ul class="checks"><li>Modalidad: ${t.mode.join(' o ')}</li><li>Garantía de primera clase satisfactoria</li></ul>
        <button class="btn primary" data-book="${t.id}">Reservar Sesión</button>
        <button class="btn outline" data-msg="${t.id}">Enviar Mensaje</button>
      </aside>
    </div>`;
}
function book(id){
  const t = TUTORS.find(x => x.id === id); if (!t) return;
  if (!me){ toast(`Inicia sesión para reservar con ${t.name}.`); return go('login'); }
  sessions.push({t:t.name,s:t.subj,mode:t.mode.length > 1 ? 'Online / Presencial' : t.mode[0],when:'Horario por confirmar',a:'Ver Detalle',msg:'El tutor confirmará tu horario pronto.'});
  toast(`Solicitud enviada a ${t.name}. Revísala en tu panel.`);
}

/* ===== Login y registro ===== */
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, err = $('#loginErr');
  const u = users.find(x => x.email === f.elements.email.value.trim().toLowerCase() && x.pw === f.elements.pw.value);
  if (!u){ err.textContent = 'Correo o contraseña incorrectos.'; return; }
  err.textContent = ''; me = u; store.set('tol_me', u.email); f.reset(); updateNav(); go('dash'); toast(`Bienvenido, ${u.name.split(' ')[0]}.`);
});
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  role = b.dataset.role; $$('.seg button').forEach(x => x.classList.toggle('on', x === b)); $('#tutorExtra').hidden = role !== 'tutor';
}));
$('#regForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, v = n => f.elements[n].value.trim(), err = m => { $('#regErr').textContent = m };
  const name = v('name'), email = v('email').toLowerCase(), pw = f.elements.pw.value;
  if (name.length < 3) return err('Escribe tu nombre completo.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return err('Escribe un correo electrónico válido.');
  if (pw.length < 8) return err('La contraseña debe tener mínimo 8 caracteres.');
  if (pw !== f.elements.pw2.value) return err('Las contraseñas no coinciden.');
  if (users.some(u => u.email === email)) return err('Ese correo ya está registrado. Inicia sesión.');
  const u = {name, email, pw, role};
  if (role === 'tutor'){
    const subj = v('subj'), level = v('level'), loc = v('loc'), price = parseInt(v('price').replace(/\D/g, ''), 10);
    if (!subj || !level || !loc || !price) return err('Completa los datos del tutor (materia, nivel, zona y tarifa).');
    Object.assign(u, {subj, level, loc, price}); addTutor(u);
  }
  err(''); users.push(u); store.set('tol_users', users); store.set('tol_me', email); me = u;
  f.reset(); updateNav(); go('dash'); toast(role === 'tutor' ? 'Cuenta de tutor creada. Ya apareces en las búsquedas.' : 'Cuenta creada. ¡Bienvenido!');
});

/* ===== Panel del estudiante ===== */
function renderDash(){
  $('#dashHi').textContent = me ? `Hola, ${me.name.split(' ')[0]}` : 'Hola';
  $('#dashAv').textContent = me ? me.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '';
  $('#upcoming').innerHTML = sessions.map((s,i) => `
    <article class="card sess"><div class="t"><div><h3>${esc(s.t)}</h3><span class="m">${esc(s.s)}</span></div><span class="tag">${esc(s.mode)}</span></div>
      <p class="when">${esc(s.when)}</p>
      <div class="acts"><button class="btn ${s.primary?'primary':'soft'}" data-act="${i}">${s.a}</button><button class="cancel" data-cancel="${i}">Cancelar</button></div></article>`).join('')
    || '<p class="empty">No tienes sesiones próximas. Busca un tutor para reservar.</p>';
  $('#history').innerHTML = history.map(h => `<div class="hist"><small>${h.d}</small><b class="r" style="font-weight:600">${h.h}</b>
      <b>${h.t}</b><span class="stars r">${stars(h.n)}</span><small>${h.s}</small></div>`).join('');
  $('#favs').innerHTML = ['cmd','cm'].map(id => { const t = TUTORS.find(x => x.id === id);
    return `<button class="fav" data-profile="${id}">${av(t)}${esc(t.name)}</button>`; }).join('');
}
$('#upcoming').addEventListener('click', e => {
  const a = e.target.closest('[data-act]'), c = e.target.closest('[data-cancel]');
  if (a) toast(sessions[+a.dataset.act].msg);
  if (c && confirm('¿Cancelar esta sesión?')){ sessions.splice(+c.dataset.cancel,1); renderDash(); toast('Sesión cancelada.'); }
});
$('#tabbar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (['dash','results'].includes(b.dataset.tab)) go(b.dataset.tab); else toast('Próximamente.');
});


async function cargarTutoresDesdeAPI() {
  try {
    const respuesta = await fetch("/api/tutores");

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los tutores");
    }

    const datos = await respuesta.json();

    // Usar únicamente documentos con la estructura
    // que espera nuestro frontend.
    const tutoresValidos = datos.filter(t =>
      typeof t.id === "string" &&
      typeof t.name === "string" &&
      typeof t.subj === "string" &&
      Array.isArray(t.cats) &&
      Array.isArray(t.levels) &&
      Array.isArray(t.mode) &&
      Array.isArray(t.tags) &&
      Array.isArray(t.look) &&
      typeof t.av === "string" &&
      typeof t.price === "number" &&
      typeof t.rating === "number" &&
      typeof t.reviews === "number"
    );

    TUTORS = tutoresValidos;

    console.log("Tutores cargados desde MongoDB:", TUTORS);

    // Actualizar las tarjetas destacadas
    const destacados = TUTORS.slice(0, 3);
    document.querySelector("#featured").innerHTML =
      destacados.map(tutorCard).join("");

    // Actualizar resultados
    renderResults();

  } catch (error) {
    console.error("Error al cargar tutores:", error);
    toast("No se pudieron cargar los tutores.");
  }
}

cargarTutoresDesdeAPI();


updateNav();
go('home');
