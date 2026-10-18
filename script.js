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
let TUTORS = [];
const sessions = [
  {t:'Dr. Carlos Mendoza',s:'Cálculo Multivariable',mode:'Online (Sala Integrada)',when:'Mañana, 16 Ene — 15:00 a 17:00',a:'Unirse a Videollamada',msg:'Conectando a la sala de videollamada…',primary:true},
  {t:'Lic. Clara Mendez',s:'Práctica Conversacional Inglés',mode:'Presencial',when:'Lunes, 19 Ene — 11:00 a 12:00',a:'Ver Dirección',msg:'La dirección se mostrará aquí cuando el backend esté conectado.'}
];
const history = [
  {d:'10 Ene 2026',h:'2 horas',t:'Dr. Carlos Mendoza',s:'Física Básica',n:5},
  {d:'08 Ene 2026',h:'1.5 horas',t:'Mtra. Alicia Delgado',s:'Repaso TOEFL',n:4}
];

/* ===== Cuentas (demo en localStorage: sin servidor) ===== */
let me = null, role = 'student';
function addTutor(u){
  const h = hash(u.email);
  TUTORS.push({id:'u'+h,name:u.name,subj:u.subj,cats:SUBJECTS.filter(s=>norm(u.subj).includes(norm(s).slice(0,5))),
    levels:LEVELS.filter(l=>norm(u.level).includes(norm(l).slice(0,5))),loc:LOCS.find(l=>norm(l)===norm(u.loc))||u.loc,
    mode:['Online'],price:u.price,rating:0,reviews:0,desc:`Tutor de ${u.subj}. Perfil recién creado en TutoresOn-Line.`,
    tags:u.subj.split(/,\s*/).slice(0,4),av:'Lunes:9-11;Miércoles:14-16',look:[h%4,h%5,h%6,h%2],verified:false});
}


function obtenerPanelUsuario() {
  if (!me) return 'login';

  if (me.role === 'tutor') {
    return 'dashTutor';
  }

  return 'dash';
}


function updateNav() {
  const conectado = me !== null;

  $('#navLogin').hidden = conectado;
  $('#navOut').hidden = !conectado;

  const botonRegistro = $('#navReg');

  botonRegistro.textContent = conectado
    ? 'Mi Panel'
    : 'Registrarse';

  botonRegistro.dataset.go = conectado
  ? obtenerPanelUsuario()
  : 'register';
}


/* ===== Navegación ===== */
function go(id) {
  const esPanel = ['dash', 'dashTutor'].includes(id);

  if (esPanel && !me) {
    toast('Inicia sesión para ver tu panel.');
    id = 'login';
  }

  // Impedir que un rol abra el panel de otro.
  if (esPanel && me) {
    id = obtenerPanelUsuario();
  }

  $$('.view').forEach(v => {
    v.hidden = v.id !== id;
  });

  // La barra inferior existente pertenece al estudiante.
  $('#tabbar').hidden = id !== 'dash';

  $$('#tabbar button').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === id);
  });

  $('#menu').classList.remove('open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');

  window.scrollTo({ top: 0 });

  if (id === 'results') renderResults();
  if (id === 'dash') renderDash();
  if (id === 'dashTutor') {
  renderDashTutor();
  cargarPerfilTutor();
}
}


/* ===== Eventos generales de navegación ===== */
document.addEventListener('click', e => {
  const boton = e.target.closest('[data-go]');

  if (!boton) return;

  e.preventDefault();

  const destino = boton.dataset.go;

  if (destino) {
    go(destino);
  }
});


$('#navOut').addEventListener('click', async e => {
  e.preventDefault();

  try {
    const respuesta = await fetch('/api/auth/logout', {
      method: 'POST'
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    me = null;

    updateNav();
    go('home');

    toast('Sesión cerrada correctamente.');

  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    toast('No fue posible cerrar la sesión. Inténtalo nuevamente.');
  }
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
$('#featured').innerHTML =
  '<p class="empty">Cargando tutores destacados...</p>';
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
      
${t.tipoPerfil === 'registrado'
  ? `<button class="btn primary" data-book="${esc(t.id)}">
       Solicitar tutoría
     </button>`
  : `<button class="btn outline" type="button" disabled
       title="Este perfil es de demostración">
       Solo demostración
     </button>`
}

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


/* ===== Abrir el perfil público de un tutor ===== */
document.addEventListener('click', e => {
  const boton = e.target.closest('[data-profile]');

  if (!boton) return;

  e.preventDefault();

  const tutorId = boton.dataset.profile;

  renderProfile(tutorId);
  go('profile');
});


/* ===== Perfil (según el tutor elegido) ===== */

document.addEventListener('click', e => {
  const boton = e.target.closest('[data-book]');

  if (!boton) return;

  e.preventDefault();

  const tutorId = boton.dataset.book;
  book(tutorId);
});


const availHtml = t => {
  if (!t.av || !t.av.trim()) {
    return '<p class="muted">Este tutor todavía no tiene horarios registrados.</p>';
  }

  return t.av.split(';').map(d => {
    const separador = d.indexOf(':');

    if (separador === -1) return '';

    const dia = d.slice(0, separador);
    const intervalos = d.slice(separador + 1);

    const horarios = intervalos.split(',').map(intervalo => {
      const [inicio, fin] = intervalo.split('-');

      if (!inicio || !fin) return '';

      const normalizarHora = hora =>
        /^\d{1,2}$/.test(hora)
          ? hora.padStart(2, '0') + ':00'
          : hora;

      return `
        <span class="tag">
          ${esc(normalizarHora(inicio))} - ${esc(normalizarHora(fin))}
        </span>
      `;
    }).join('');

    return `
      <div class="avail">
        <b>${esc(dia)}</b>
        ${horarios}
      </div>
    `;
  }).join('');
};


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

        ${t.tipoPerfil === 'registrado'
          ? `<button class="btn primary" data-book="${esc(t.id)}">
              Solicitar tutoría
            </button>`
          : `<button class="btn outline" type="button" disabled
              title="Este perfil es de demostración">
              Solo demostración
            </button>`
      }
        <button class="btn outline" data-msg="${t.id}">Enviar Mensaje</button>
      </aside>
    </div>`;
}

function book(id) {
  const t = TUTORS.find(x => x.id === id);

  if (!t) return;

  if (t.tipoPerfil !== 'registrado') {
    toast('Este tutor es de demostración y no admite solicitudes.');
    return;
  }

  if (!me) {
    toast(`Inicia sesión para solicitar una tutoría con ${t.name}.`);
    return go('login');
  }

  if (me.role !== 'estudiante') {
    toast('Solo los estudiantes pueden solicitar tutorías.');
    return;
  }

  toast('Estamos preparando el sistema de solicitudes de tutoría.');
}


/* ===== Login y registro ===== */
$$('.seg button').forEach(b => {
  b.addEventListener('click', () => {
    role = b.dataset.role;

    $$('.seg button').forEach(x => {
      x.classList.toggle('on', x === b);
    });

    $('#tutorExtra').hidden = role !== 'tutor';

    console.log('Rol seleccionado:', role);
  });
});

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();

  const f = e.target;
  const err = $('#loginErr');

  const email = f.elements.email.value.trim().toLowerCase();
  const pw = f.elements.pw.value;

  err.textContent = '';

  const boton = f.querySelector('[type="submit"]');
  if (boton) boton.disabled = true;

  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, pw })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      err.textContent =
        resultado.mensaje || 'No fue posible iniciar sesión.';
      return;
    }

    const usuario = resultado.usuario;

    // Adaptamos los datos del backend al frontend actual.
    me = {
      id: usuario.id,
      name: usuario.nombre,
      email: usuario.correo,
      role: usuario.rol
    };

    f.reset();
    updateNav();

    // Abrir el panel correspondiente al rol autenticado.
    go(obtenerPanelUsuario());

    toast(`Bienvenido, ${me.name.split(' ')[0]}.`);

    console.log('Usuario autenticado:', {
      nombre: me.name,
      rol: me.role
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    err.textContent =
      'No se pudo conectar con el servidor.';
  } finally {
    if (boton) boton.disabled = false;
  }
});


/* ===== Panel del tutor ===== */
let perfilTutorActual = null;
async function cargarPerfilTutor() {
  const contenedor = $('#tutorProfileInfo');

  if (!contenedor || !me || me.role !== 'tutor') return;

  contenedor.innerHTML =
    '<p class="muted">Cargando información...</p>';

  try {
    const respuesta = await fetch('/api/tutores/mi-perfil');

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    
    const resultado = await respuesta.json();
    const usuario = resultado.perfil;
    const perfil = usuario.perfilTutor || {};

    perfilTutorActual = perfil;

    // Mostrar los horarios recuperados desde MongoDB.
    mostrarDisponibilidadTutor(perfil.disponibilidad || []);


    // Comprobar los nombres reales de las propiedades.
    console.log('Perfil profesional recuperado:', perfil);

    const mostrar = valor => {
      if (Array.isArray(valor)) {
        return valor.length ? valor.join(', ') : 'No registrado';
      }

      return valor !== undefined &&
             valor !== null &&
             String(valor).trim() !== ''
        ? String(valor)
        : 'No registrado';
    };

    contenedor.innerHTML = `
      <div class="tutor-profile-details">
        <p><strong>Nombre:</strong> ${esc(usuario.nombre)}</p>
        <p><strong>Correo:</strong> ${esc(usuario.correo)}</p>
        <p><strong>Materias:</strong> ${esc(mostrar(perfil.materias))}</p>
        <p><strong>Nivel educativo:</strong> ${esc(mostrar(perfil.nivel))}</p>
        <p><strong>Ubicación:</strong> ${esc(mostrar(perfil.ubicacion))}</p>
        <p><strong>Tarifa por hora:</strong> ${
          typeof perfil.precioHora === 'number'
            ? esc(money(perfil.precioHora))
            : 'No registrado'
      }</p>
      <p><strong>Estado:</strong> ${esc(mostrar(perfil.estadoPublicacion))}</p>

    `;

    const estado = $('#tutorStatus');

    if (estado) {
      estado.textContent =
        mostrar(perfil.estadoPublicacion);
    }

  } catch (error) {
    console.error('Error al cargar perfil del tutor:', error);

    contenedor.innerHTML =
      '<p class="muted">No fue posible cargar tu perfil profesional.</p>';
  }
}

function renderDashTutor() {
  if (!me || me.role !== 'tutor') return;

  const nombre = me.name || 'Tutor';
  const primerNombre = nombre.split(' ')[0];

  $('#tutorHi').textContent = `Hola, ${primerNombre}`;

  $('#tutorAv').textContent = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(palabra => palabra[0])
    .join('')
    .toUpperCase();
}


/* ===== Edición del perfil profesional ===== */

const formularioTutor = $('#editTutorProfileForm');
const botonEditarTutor = $('#editTutorProfileBtn');
const botonCancelarTutor = $('#cancelEditTutorProfile');
const mensajeTutor = $('#editTutorProfileMsg');

// Abrir el formulario con los datos actuales.
botonEditarTutor.addEventListener('click', () => {
  if (!perfilTutorActual) {
    toast('Espera a que termine de cargar tu perfil.');
    return;
  }

  const perfil = perfilTutorActual;

  $('#editTutorMaterias').value =
    Array.isArray(perfil.materias)
      ? perfil.materias.join(', ')
      : '';

  $('#editTutorNivel').value = perfil.nivel || 'Universidad';
  $('#editTutorUbicacion').value = perfil.ubicacion || '';
  $('#editTutorPrecio').value = perfil.precioHora ?? '';

  mensajeTutor.textContent = '';

  formularioTutor.hidden = false;
  botonEditarTutor.hidden = true;
});

// Cancelar la edición.
botonCancelarTutor.addEventListener('click', () => {
  formularioTutor.reset();
  formularioTutor.hidden = true;
  botonEditarTutor.hidden = false;
  mensajeTutor.textContent = '';
});

// Guardar los cambios en MongoDB.
formularioTutor.addEventListener('submit', async e => {
  e.preventDefault();

  const materias = $('#editTutorMaterias').value
    .split(',')
    .map(materia => materia.trim())
    .filter(Boolean);

  const datos = {
    materias,
    nivel: $('#editTutorNivel').value,
    ubicacion: $('#editTutorUbicacion').value.trim(),
    precioHora: Number($('#editTutorPrecio').value)
  };

  const botonGuardar =
    formularioTutor.querySelector('[type="submit"]');

  botonGuardar.disabled = true;
  mensajeTutor.textContent = 'Guardando cambios...';

  try {
    const respuesta = await fetch('/api/tutores/mi-perfil', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mensajeTutor.textContent =
        resultado.mensaje || 'No fue posible guardar los cambios.';
      return;
    }

    perfilTutorActual = resultado.perfilTutor;

    formularioTutor.hidden = true;
    botonEditarTutor.hidden = false;

    // Actualizar los datos visibles desde MongoDB.
    await cargarPerfilTutor();

    toast('Perfil profesional actualizado correctamente.');

  } catch (error) {
    console.error('Error al guardar perfil:', error);
    mensajeTutor.textContent =
      'No se pudo conectar con el servidor.';
  } finally {
    botonGuardar.disabled = false;
  }
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
  const featured = document.querySelector("#featured");
  const resultList = document.querySelector("#resultList");

  try {
    const respuesta = await fetch("/api/tutores");

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error("La API no devolvió un arreglo");
    }

    TUTORS = datos.filter(t =>
      typeof t.id === "string" &&
      typeof t.name === "string" &&
      typeof t.subj === "string" &&
      typeof t.desc === "string" &&
      typeof t.loc === "string" &&
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

    const destacados = ["ar", "cm", "ac"]
      .map(id => TUTORS.find(t => t.id === id))
      .filter(Boolean);

    featured.innerHTML = destacados.length
      ? destacados.map(tutorCard).join("")
      : '<p class="empty">No hay tutores destacados.</p>';

    renderResults();

    console.log(
      `${TUTORS.length} tutores cargados desde MongoDB`
    );

  } catch (error) {
    console.error("Error al cargar tutores:", error);

    featured.innerHTML =
      '<p class="empty">No se pudieron cargar los tutores.</p>';

    if (resultList) {
      resultList.innerHTML =
        '<p class="empty">Error al consultar el catálogo. Recarga la página.</p>';
    }

    toast("No se pudo conectar con el catálogo de tutores.");
  }
}


async function recuperarSesion() {
  try {
    const respuesta = await fetch('/api/auth/me');

    if (respuesta.status === 401) {
      me = null;
      return;
    }

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const resultado = await respuesta.json();
    const usuario = resultado.usuario;

    me = {
      id: usuario.id,
      name: usuario.nombre,
      email: usuario.correo,
      role: usuario.rol
    };

    console.log('Sesión recuperada correctamente.');

  } catch (error) {
    console.error('No fue posible recuperar la sesión:', error);
  }
}

async function iniciarAplicacion() {
  await recuperarSesion();

  updateNav();
  go('home');

  cargarTutoresDesdeAPI();
}


/* ===== Gestión de disponibilidad del tutor ===== */

let disponibilidadTutorActual = [];

function mostrarDisponibilidadTutor(horarios) {
  disponibilidadTutorActual = [...horarios];

  const lista = document.querySelector('#listaDisponibilidadTutor');

  if (!lista) return;

  if (horarios.length === 0) {
    lista.innerHTML = `
      <p class="muted">Todavía no tienes horarios registrados.</p>
    `;
    return;
  }

  const ordenDias = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves',
    'Viernes', 'Sábado', 'Domingo'
  ];

  const horariosOrdenados = [...horarios].sort((a, b) => {
    const diferencia =
      ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia);

    return diferencia || a.inicio.localeCompare(b.inicio);
  });

  lista.innerHTML = horariosOrdenados.map(horario => {
    const indiceOriginal = horarios.indexOf(horario);

    return `
      <div class="row between" style="margin: 12px 0; gap: 12px;">
        <div>
          <strong>${horario.dia}</strong>
          <p class="muted">
            ${horario.inicio} - ${horario.fin}
          </p>
        </div>

        <button
          type="button"
          class="btn outline sm"
          data-eliminar-horario="${indiceOriginal}"
        >
          Eliminar
        </button>
      </div>
    `;
  }).join('');
}

async function guardarDisponibilidadTutor(horarios) {
  const respuesta = await fetch('/api/tutores/mi-disponibilidad', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      disponibilidad: horarios
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      resultado.mensaje || 'No fue posible guardar los horarios.'
    );
  }

  mostrarDisponibilidadTutor(resultado.disponibilidad);

  return resultado;
}

/* ===== Agregar un horario ===== */

document.querySelector('#formDisponibilidadTutor')
  .addEventListener('submit', async e => {
    e.preventDefault();

    const dia = document.querySelector('#dispDia').value;
    const inicio = document.querySelector('#dispInicio').value;
    const fin = document.querySelector('#dispFin').value;

    const mensaje = document.querySelector(
      '#mensajeDisponibilidadTutor'
    );

    if (inicio >= fin) {
      mensaje.textContent =
        'La hora de inicio debe ser anterior a la hora de finalización.';
      return;
    }

    const nuevosHorarios = [
      ...disponibilidadTutorActual,
      { dia, inicio, fin }
    ];

    const boton = e.currentTarget.querySelector('[type="submit"]');
    boton.disabled = true;
    mensaje.textContent = 'Guardando horario...';

    try {
      await guardarDisponibilidadTutor(nuevosHorarios);

      e.currentTarget.reset();
      mensaje.textContent = 'Horario agregado correctamente.';

    } catch (error) {
      mensaje.textContent = error.message;
    } finally {
      boton.disabled = false;
    }
  });

/* ===== Eliminar un horario ===== */

document.querySelector('#listaDisponibilidadTutor')
  .addEventListener('click', async e => {
    const boton = e.target.closest('[data-eliminar-horario]');

    if (!boton) return;

    const indice = Number(boton.dataset.eliminarHorario);

    const nuevosHorarios = disponibilidadTutorActual.filter(
      (_, i) => i !== indice
    );

    const mensaje = document.querySelector(
      '#mensajeDisponibilidadTutor'
    );

    boton.disabled = true;
    mensaje.textContent = 'Eliminando horario...';

    try {
      await guardarDisponibilidadTutor(nuevosHorarios);
      mensaje.textContent = 'Horario eliminado correctamente.';
    } catch (error) {
      mensaje.textContent = error.message;
      boton.disabled = false;
    }
  });

iniciarAplicacion();

