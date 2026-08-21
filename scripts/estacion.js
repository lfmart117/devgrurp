/* DEVGRU-ES :: linea de datos de estacion — capital, coordenadas, condiciones
   y hora local del pais del visitante, resueltos por IP.
   Servicios publicos sin clave: ipapi.co, restcountries.com, open-meteo.com */

(function stationData(){
  const elStation = document.getElementById('data-station');
  const elCoord   = document.getElementById('data-coord');
  const elCond    = document.getElementById('data-conditions');
  const elTime    = document.getElementById('data-time');
  if(!elStation || !elCoord || !elCond || !elTime) return;

  const FALLBACK = {
    country: 'Colombia',
    capital: 'Bogotá',
    lat: 4.7110,
    lon: -74.0721,
    offsetMinutes: -300
  };

  const CONDITIONS = {
    0:'Despejado', 1:'Mayormente despejado', 2:'Parcialmente nublado', 3:'Cubierto',
    45:'Niebla', 48:'Niebla helada',
    51:'Llovizna ligera', 53:'Llovizna', 55:'Llovizna intensa',
    61:'Lluvia ligera', 63:'Lluvia', 65:'Lluvia intensa',
    71:'Nieve ligera', 73:'Nieve', 75:'Nieve intensa',
    80:'Chubascos ligeros', 81:'Chubascos', 82:'Chubascos intensos',
    95:'Tormenta eléctrica', 96:'Tormenta con granizo', 99:'Tormenta severa'
  };

  function set(el, label, value){
    el.classList.remove('is-loading');
    el.innerHTML = label + ' <b>' + value + '</b>';
  }

  function formatCoord(lat, lon){
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lon >= 0 ? 'E' : 'O';
    return Math.abs(lat).toFixed(2) + '\u00B0' + ns + ' ' + Math.abs(lon).toFixed(2) + '\u00B0' + ew;
  }

  function offsetFromTimezone(tz){
    if(!tz) return null;
    const m = tz.match(/UTC([+-])(\d{2}):(\d{2})/);
    if(!m) return null;
    return (m[1] === '-' ? -1 : 1) * (parseInt(m[2],10) * 60 + parseInt(m[3],10));
  }

  function startClock(offsetMinutes){
    function tick(){
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const local = new Date(utc + offsetMinutes * 60000);
      const hh = String(local.getHours()).padStart(2,'0');
      const mm = String(local.getMinutes()).padStart(2,'0');
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const off = String(Math.floor(Math.abs(offsetMinutes)/60)).padStart(2,'0');
      set(elTime, 'Local', hh + ':' + mm + ' UTC' + sign + off);
    }
    tick();
    setInterval(tick, 30000);
  }

  async function loadConditions(lat, lon){
    try{
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true');
      if(!res.ok) throw new Error('conditions unavailable');
      const data = await res.json();
      const now = data.current_weather;
      const desc = CONDITIONS[now.weathercode] || 'Sin lectura';
      set(elCond, 'Condiciones', Math.round(now.temperature) + '\u00B0C, ' + desc);
    }catch(e){
      set(elCond, 'Condiciones', 'Sin lectura');
    }
  }

  function apply(country, capital, lat, lon, offsetMinutes){
    set(elStation, 'Estación', capital + ', ' + country);
    set(elCoord, 'Coordenadas', formatCoord(lat, lon));
    startClock(offsetMinutes);
    loadConditions(lat, lon);
  }

  async function init(){
    try{
      const ipRes = await fetch('https://ipapi.co/json/');
      if(!ipRes.ok) throw new Error('lookup failed');
      const ip = await ipRes.json();
      if(!ip.country_code) throw new Error('no country');

      const cRes = await fetch('https://restcountries.com/v3.1/alpha/' + ip.country_code + '?fields=name,translations,capital,capitalInfo,timezones');
      if(!cRes.ok) throw new Error('country lookup failed');
      const arr = await cRes.json();
      const c = Array.isArray(arr) ? arr[0] : arr;

      const capital = (c.capital && c.capital[0]) || FALLBACK.capital;
      const latlng = (c.capitalInfo && c.capitalInfo.latlng) || null;
      const lat = latlng ? latlng[0] : FALLBACK.lat;
      const lon = latlng ? latlng[1] : FALLBACK.lon;
      const country = (c.translations && c.translations.spa && c.translations.spa.common)
                   || (c.name && c.name.common)
                   || ip.country_name
                   || FALLBACK.country;
      const offset = offsetFromTimezone(c.timezones && c.timezones[0]);

      apply(country, capital, lat, lon, offset === null ? FALLBACK.offsetMinutes : offset);
    }catch(e){
      apply(FALLBACK.country, FALLBACK.capital, FALLBACK.lat, FALLBACK.lon, FALLBACK.offsetMinutes);
    }
  }

  init();
})();
