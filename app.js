(function(){
  // ---- Safe boot & error overlay ----
  var overlay = document.getElementById('error-overlay');
  var errlog = document.getElementById('errlog');
  var reloadBtn = document.getElementById('reload-btn');
  if (reloadBtn) reloadBtn.addEventListener('click', function(){ location.reload(); });
  function showError(e){
    try{
      if (overlay) overlay.classList.remove('hidden');
      if (errlog) errlog.textContent = (e && (e.stack||e.message||e.toString())) || String(e);
    }catch(_){}
  }
  window.addEventListener('error', function(ev){ showError(ev.error||ev.message); });
  window.addEventListener('unhandledrejection', function(ev){ showError(ev.reason||ev); });

  // ---- Data ----
  var GLOBAL_LS = { users:"mh_users_v1", current:"mh_user_current_v1" };
  var LEGACY = "mh_v1_state";
  var APP_VERSION = "v1.6.0-final"; // Versión final con todas las correcciones

  // --- ESTRUCTURA COMPLETA DE BLOQUES (NIVEL 2) ---
  var BLOQUES = [
    // --- RESIDENCE (Bloques individuales, ahora Nivel 2) - RANGOS AMPLIADOS ---
    { id: "A", label: "A", from: 2100, to: 2109 }, // Rango ampliado
    { id: "B", label: "B", from: 2200, to: 2209 }, // Rango ampliado
    { id: "C", label: "C", from: 2300, to: 2309 }, // Rango ampliado
    { id: "D", label: "D", from: 2400, to: 2409 }, // Rango ampliado
    // --- VILLAS - RANGO AMPLIADO ---
    { id: "V", label: "VILLAS", from: 3101, to: 3109 }, // Rango ampliado
    // --- BRINKMANN (4 PLANTAS, P1, P2, P3, P4) ---
    { id: "BR-1", label: "BRINKMANN P1", from: 101, to: 129 },
    { id: "BR-2", label: "BRINKMANN P2", from: 201, to: 241 }, 
    { id: "BR-3", label: "BRINKMANN P3", from: 301, to: 345 },
    { id: "BR-4", label: "BRINKMANN P4", from: 401, to: 443 },
    // --- DARKO (5 PLANTAS, P1 a P5) ---
    { id: "DR-1", label: "DARKO P1", from: 100, to: 138 },
    { id: "DR-2", label: "DARKO P2", from: 200, to: 238 },
    { id: "DR-3", label: "DARKO P3", from: 300, to: 338 },
    { id: "DR-4", label: "DARKO P4", from: 400, to: 438 },
    { id: "DR-5", label: "DARKO P5", from: 500, to: 538 },
    // --- LEIRO TOWER (8 PLANTAS) ---
    { id: "LT-1", label: "LEIRO TOWER P1", from: 1101, to: 1115 },
    { id: "LT-2", label: "LEIRO TOWER P2", from: 1201, to: 1219 },
    { id: "LT-3", label: "LEIRO TOWER P3", from: 1300, to: 1321 },
    { id: "LT-4", label: "LEIRO TOWER P4", from: 1400, to: 1421 },
    { id: "LT-5", label: "LEIRO TOWER P5", from: 1500, to: 1521 },
    { id: "LT-6", label: "LEIRO TOWER P6", from: 1600, to: 1621 },
    { id: "LT-7", label: "LEIRO TOWER P7", from: 1700, to: 1721 },
    { id: "LT-8", label: "LEIRO SUITES P8", from: 1800, to: 1821 }, 
  ];
  
  // --- ESTRUCTURA DE AGRUPACIÓN (NIVEL 1) ---
  var BLOQUES_AGRUPADOS = [
      { id: "Residence", label: "Residence", blocks: ["A", "B", "C", "D"], icon: "🏢" },
      { id: "Villas", label: "Villas", blocks: ["V"], icon: "🏡" },
      { id: "Leiro", label: "Leiro Tower", blocks: BLOQUES.filter(b => b.id.startsWith("LT-")).map(b => b.id), icon: "🏙️" },
      { id: "Darko", label: "Darko (Pares)", blocks: BLOQUES.filter(b => b.id.startsWith("DR-")).map(b => b.id), icon: "🏨" },
      { id: "Brinkmann", label: "Brinkmann (Impares)", blocks: BLOQUES.filter(b => b.id.startsWith("BR-")).map(b => b.id), icon: "🏛️" },
  ];

  // Función de ayuda para buscar un bloque por ID
  function getBlockById(id) {
      return BLOQUES.find(function(x){ return x.id === id; });
  }

  // --- Constantes (CHECKS, COLORS, etc.) ---
  var CHECKS = [
    { id: "luces", label: "Luces" },
    { id: "agua_caliente", label: "Agua caliente" },
    { id: "hidrokit", label: "Hidrokit" },
    { id: "aire", label: "Aire acondicionado (funciona, temp adecuada)" },
    { id: "sensor_inundacion", label: "Sensor de inundación" },
    { id: "jacuzzi", label: "Jacuzzi" },
    { id: "tapa_llave", label: "Tapa de acceso a la llave" },
    { id: "cerradura_electrica", label: "Cerradura eléctrica" },
    { id: "bis_armarios", label: "Bisagras armarios" },
    { id: "bis_puertas_ext", label: "Bisagras puertas exteriores" },
    { id: "humedades", label: "Humedades" },
    { id: "desperfectos", label: "Desperfectos" },
  ];
  var COLORS = { none:"#e5e7eb", review:"#f59e0b", ok:"#10b981", fail:"#ef4444", dark:"#0f172a", white:"#ffffff", border:"#cbd5e1" };
  
  // --- Funciones utilitarias ---
  function labelState(s){ return s==="ok"?"OK":s==="fail"?"Fallo":s==="pending"?"Por revisar":s==="auto"?"Auto":"—"; }
  function nsKey(a){ return "mh_v1_"+a+"_state"; }
  function hashPIN(pin){ var h=5381; for (var i=0;i<pin.length;i++){ h=((h<<5)+h)+pin.charCodeAt(i); h|=0; } return "h"+(h>>>0).toString(16); }
  function nowISO(){ var d=new Date(); function p(n){return String(n).padStart(2,"0");} return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); }
  function autoOverallFromRoom(room){
    var items = (room&&room.items)||{};
    var vals = Object.keys(items).map(function(k){return items[k]}).filter(function(v){return v!=="none"});
    var hasFail = vals.indexOf("fail")>=0;
    var hasPend = vals.indexOf("pending")>=0;
    var anyItemNote = room&&room.itemNotes && Object.keys(room.itemNotes).some(function(k){ return (room.itemNotes[k]||"").trim().length>0; });
    var anyRoomNote = room && (room.notes||"").trim().length>0;
    if (hasFail) return "fail";
    if (!hasFail && !hasPend && (anyItemNote || anyRoomNote)) return "fail";
    if (hasPend) return "pending";
    if (vals.length===0) return room&&room.assumeOk ? "ok" : "none";
    return "ok";
  }

  // ---- State & persistence ----
  function loadUsers(){ try{ return JSON.parse(localStorage.getItem(GLOBAL_LS.users)||"{}"); }catch(e){ return {}; } }
  function saveUsers(u){ try{ localStorage.setItem(GLOBAL_LS.users, JSON.stringify(u)); }catch(e){} }
  function loadCurrent(){ return localStorage.getItem(GLOBAL_LS.current)||null; }
  function setCurrent(a){ if(a)localStorage.setItem(GLOBAL_LS.current,a); else localStorage.removeItem(GLOBAL_LS.current); }

  var appState = {
    page: "plan",
    selZone: null,     // Nivel 1: Residence, Villas, Leiro, etc.
    selBlock: null,    // Nivel 2: Bloque A, V, BR-1, DR-3, LT-8, etc.
    selRoom: null,
    filter: "",
    statusFilter: "all",
    users: loadUsers(),
    aliasLower: loadCurrent(),
    dataByUser: {} // lazy-load por usuario
  };

  function getUserProfile(){ return appState.aliasLower ? appState.users[appState.aliasLower] : null; }
  function getUserData(){ var k=appState.aliasLower; if(!k) return {}; if(!appState.dataByUser[k]){ try{ var s=localStorage.getItem(nsKey(k)); appState.dataByUser[k]= s? JSON.parse(s): {}; }catch(e){ appState.dataByUser[k]={}; } } return appState.dataByUser[k]; }
  function setUserData(updater){
    var k=appState.aliasLower; if(!k) return;
    var cur = getUserData();
    var next = updater(cur);
    appState.dataByUser[k]=next;
    try{ localStorage.setItem(nsKey(k), JSON.stringify(next)); }catch(e){}
    render();
  }

  // ---- Routing ----
  function parseHash(){
    var h=(location.hash||"").replace(/^#\/?/,"");
    if (!h) return {page:"plan",block:null,room:null};
    var p=h.split("/");
    if (p[0]==="parte"||p[0]==="cuenta"||p[0]==="auth") return {page:p[0],block:null,room:null};
    var block=p[0]||null; var room=p[1]?Number(p[1]):null;
    return {page:"plan",block:block,room:room};
  }
  function setRouteTo(pg,room){
    if (pg==="parte"||pg==="cuenta"||pg==="auth"){ location.hash = "#/"+pg; return; }
    var block=pg;
    if (!block) location.hash=""; else if (!room) location.hash="#/"+block; else location.hash="#/"+block+"/"+room;
  }
  
  function applyRoute(){
    var r=parseHash();
    appState.page = getUserProfile()? r.page : "auth";
    
    if (appState.page==="plan" && getUserProfile()){
      if (!r.block){ 
          appState.selZone=null; 
          appState.selBlock=null; 
          appState.selRoom=null; 
      }
      else{
        var b = getBlockById(r.block);
        appState.selBlock=b||null; 
        appState.selRoom=r.room||null;
        
        // Determinar la zona superior automáticamente
        if (appState.selBlock) {
            var zone = BLOQUES_AGRUPADOS.find(z => z.blocks.includes(appState.selBlock.id));
            appState.selZone = zone ? zone.id : null;
        } else {
            appState.selZone = null;
        }
      }
    } else { 
      appState.selZone=null; 
      appState.selBlock=null; 
      appState.selRoom=null; 
    }
    render();
  }
  
  window.addEventListener("hashchange", applyRoute);

  // ---- DOM helpers ----
  function el(tag, attrs){
    var e=document.createElement(tag);
    if(attrs){ for (var k in attrs){
      if (k==="class") e.className = attrs[k];
      else if (k==="style"){ for (var sk in attrs[k]) e.style[sk]=attrs[k][sk]; }
      else if (k.slice(0,2)==="on" && typeof attrs[k]==="function"){ e.addEventListener(k.slice(2).toLowerCase(), attrs[k]); }
      else if (attrs[k]!==undefined && attrs[k]!==null){ e.setAttribute(k, attrs[k]); }
    } }
    for (var i=2;i<arguments.length;i++){
      var c=arguments[i];
      if (c==null) continue;
      if (Array.isArray(c)){ c.forEach(function(n){ if(n!=null) e.appendChild(typeof n==="string"?document.createTextNode(n):n); }); }
      else e.appendChild(typeof c==="string"?document.createTextNode(c):c);
    }
    return e;
  }

  // ---- Views ----
  function Header(){
    var actions=[];
    
    // Lógica de navegación DE VUELTA
    if (appState.page==="plan"){
        if (appState.selRoom!=null){
          // Nivel 3: Habitación -> Nivel 2: Bloque/Planta
          actions.push(el('button',{class:'btn-light',onclick:function(){ setRouteTo(appState.selBlock.id,null); }},'← Planta'));
        } else if (appState.selBlock){
          // Nivel 2: Bloque/Planta -> Nivel 1: Tipo de Zona
          actions.push(el('button',{class:'btn-light',onclick:function(){ appState.selBlock=null; appState.selRoom=null; render(); }},'← Zonas'));
        } else if (appState.selZone) {
            // Nivel 1: Tipo de Zona -> Nivel 0: Plano General
            actions.push(el('button',{class:'btn-light',onclick:function(){ appState.selZone=null; appState.selBlock=null; appState.selRoom=null; setRouteTo(null, null); }},'← Plano'));
        }
    } else if (appState.page==="parte" || appState.page==="cuenta" || appState.page==="auth"){
        actions.push(el('button',{class:'btn-light',onclick:function(){ setRouteTo(null,null); }},'← Plano'));
    }

    actions.push(el('button',{class:'btn',onclick:function(){ setRouteTo("parte"); }},'Parte'));
    actions.push(el('button',{class:'btn-primary',onclick:function(){ setRouteTo("cuenta"); }}, getUserProfile()?("Usuario: "+getUserProfile().alias):"Acceder"));
    
    return el('header',{class:'container'},
      el('h1',null,'Mantenimiento Hotel · Residences'),
      el('div',{class:'actions'}, actions)
    );
  }

  function ZoneTile(item){
    var data=getUserData();
    var rooms = [];
    var blocksToProcess = [];
    
    var isZoneGroup = !!item.blocks;
    if (isZoneGroup) {
        // Nivel 1: Es un grupo (Zona)
        blocksToProcess = item.blocks.map(getBlockById).filter(b => b);
    } else {
        // Nivel 2: Es un bloque/planta individual
        blocksToProcess = [item];
    }

    blocksToProcess.forEach(b => {
        for(var i=b.from; i<=b.to; i++) rooms.push(i);
    });

    var overalls=rooms.map(function(n){ var r=data[n]; var o=(r && r.overall && r.overall!=="auto")? r.overall : (r?autoOverallFromRoom(r):"none"); return o; });
    var total=rooms.length;
    var fail=overalls.filter(function(x){return x==="fail"}).length;
    var rev=overalls.filter(function(x){return x==="pending"}).length;
    var ok=overalls.filter(function(x){return x==="ok"}).length;
    var none=overalls.filter(function(x){return x==="none"}).length;
    
    var progress = el('div',{class:'progress',style:{marginTop:'8px'}},
      el('div',{style:{height:'100%',width:(fail/total*100)+'%',background:'#ef4444',float:'left'}}),
      el('div',{style:{height:'100%',width:(rev/total*100)+'%',background:'#f59e0b',float:'left'}}),
      el('div',{style:{height:'100%',width:(ok/total*100)+'%',background:'#10b981',float:'left'}})
    );
    
    var clickHandler;
    var subtitle;
    var labelText = item.label || item.id;
    var icon = item.icon || (item.id==="V"?"🏡":"🏢");
    
    if (isZoneGroup) {
        // Clic en ZONA (Nivel 1) -> Pasar a Nivel 2 (Plantas/Bloques)
        clickHandler = function(){ appState.selZone = item.id; appState.selBlock = null; render(); };
        subtitle = `Total Habitaciones: ${total}`;
    } else {
        // Clic en BLOQUE/PLANTA (Nivel 2) -> Pasar a Nivel 3 (Habitaciones)
        clickHandler = function(){ setRouteTo(item.id,null); };
        subtitle = `Habitaciones: ${rooms[0]}–${rooms[rooms.length-1]}`;
    }
    
    return el('button',{class:'tile',onclick:clickHandler},
      el('div',{style:{width:'100%'}},
        el('div',{style:{fontSize:'24px'}}, icon),
        el('div',null, labelText),
        el('div',{class:'kv',style:{marginTop:'4px'}}, subtitle),
        el('div',{class:'kv',style:{marginTop:'4px'}}, "Fallo: "+fail+" · Rev: "+rev+" · OK: "+ok+" · Sin marcar: "+none),
        progress
      )
    );
  }

  function RoomChip(n){
    var data=getUserData(); var r=data[n]||{}; var overall=(r.overall && r.overall!=="auto")? r.overall : autoOverallFromRoom(r);
    var key=(overall==="pending"?"review":overall);
    var COLORS_MAP={ none:"#e5e7eb", review:"#f59e0b", ok:"#10b981", fail:"#ef4444" };
    var bg=COLORS_MAP[key]||COLORS_MAP.none;
    var isNone=key==="none"; var color=isNone?"#0f172a":"#ffffff"; var border=isNone?"#cbd5e1":"transparent";
    var realBg=isNone?"#ffffff":bg;
    return el('button',{class:'room',style:{background:realBg,color:color,borderColor:border},onclick:function(){ setRouteTo(appState.selBlock.id,n); }}, String(n));
  }

  // Crea la herramienta para añadir una nueva incidencia (dropdown + botón)
  function AddIncidencia(room, remainingChecks){
    var sel = el('select',null);
    remainingChecks.forEach(function(c){ sel.appendChild(el('option',{value:c.id},c.label)); });
    var btn = el('button',{class:'btn-primary',disabled:remainingChecks.length===0,onclick:function(){
      if(remainingChecks.length===0) return;
      var id=sel.value;
      setUserData(function(s){ var rr=s[room]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.items[id]="fail"; var next=Object.assign({},s); next[room]=rr; return next; });
    }},'Añadir incidencia');
    return el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}},sel,btn);
  }

  // Vista de la lista de incidencias activas para la habitación
  function IncidenciasView(room){
    var data=getUserData(); var r=data[room]||{}; var items=r.items||{}; var itemNotes=r.itemNotes||{};

    function visibles(){ return Object.keys(items).filter(function(k){return items[k]==='fail' || items[k]==='pending'}); }
    function remaining(){
      var set={}; visibles().forEach(function(k){ set[k]=true; });
      return CHECKS.filter(function(c){ return !set[c.id]; });
    }
    function setItem(id,val){
      setUserData(function(s){ var rr=s[room]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.items[id]=val; var next=Object.assign({},s); next[room]=rr; return next; });
    }
    function setNote(id,text){
      setUserData(function(s){ var rr=s[room]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.itemNotes=rr.itemNotes||{}; rr.itemNotes[id]=text; var next=Object.assign({},s); next[room]=rr; return next; });
    }
    function quitar(id){
      setUserData(function(s){ var rr=s[room]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.items[id]="none"; var next=Object.assign({},s); next[room]=rr; return next; });
    }

    var section = el('section',{class:'card'},
      el('h3',null, 'Incidencias ', AddIncidencia(room, remaining()))
    );

    var grid = el('div',{class:'grid',style:{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',marginTop:'8px'}});
    var vis = visibles();
    if (vis.length===0) grid.appendChild(el('div',{class:'kv'},'Sin incidencias añadidas.'));
    vis.forEach(function(id){
      var c = CHECKS.find(function(x){return x.id===id}) || {label:id};
      var cur=items[id]||"none"; var note=itemNotes[id]||"";
      var card = el('div',{class:'card',style:{marginTop:0,padding:'10px'}},
        el('div',{style:{display:'flex',alignItems:'center',gap:'8px',justifyContent:'space-between'}},
          el('div',{style:{fontSize:'14px'}}, c.label),
          el('button',{class:'btn',onclick:function(){ quitar(id); }}, 'Quitar')
        ),
        el('div',{style:{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginTop:'8px'}},
          (function(){
            var wrap = el('div',null);
            var b1 = el('button',{class:'btn',onclick:function(){ setItem(id,'fail'); },style:{background: cur==='fail'?'#ef4444':'#fff',color: cur==='fail'?'#fff':'#ef4444',border:'1px solid #ef4444'}}, 'Fallo');
            var b2 = el('button',{class:'btn',onclick:function(){ setItem(id,'pending'); },style:{background: cur==='pending'?'#f59e0b':'#fff',color: cur==='pending'?'#fff':'#f59e0b',border:'1px solid #f59e0b'}}, 'Por revisar');
            wrap.appendChild(b1); wrap.appendChild(document.createTextNode(' ')); wrap.appendChild(b2);
            return wrap;
          })(),
          (function(){
            var inp = el('input',{class:'small',placeholder:'Observación del elemento',value:note});
            inp.addEventListener('input', function(){ setNote(id, inp.value); });
            return inp;
          })()
        )
      );
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }
  
  // Formulario para añadir nuevas medidas
  function MeasureForm(room){
    var wrap = el('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap'}});
    var sel = el('select',null,
      el('option',{value:'madera'},'Madera'),
      el('option',{value:'ceramica'},'Cerámica'),
      el('option',{value:'mueble'},'Mueble'),
      el('option',{value:'enser'},'Enser'),
      el('option',{value:'otro'},'Otro')
    );
    var medida = el('input',{class:'small',placeholder:'Medida (ej. 60x90 cm)'});
    var detalle = el('input',{class:'small',placeholder:'Detalle opcional'});
    var btn = el('button',{class:'btn-primary',onclick:function(){
      if(!medida.value.trim()) return;
      var m={tipo:sel.value,medida:medida.value.trim()}; if(detalle.value.trim()) m.detalle=detalle.value.trim();
      setUserData(function(s){ var r=s[room]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto"}; var next=Object.assign({},s); r.measures=(r.measures||[]).concat([m]); next[room]=r; return next; });
      medida.value=""; detalle.value="";
    }},'Añadir');
    wrap.appendChild(sel); wrap.appendChild(medida); wrap.appendChild(detalle); wrap.appendChild(btn);
    return wrap;
  }

  // Vista de parte de incidencias (para copiar/exportar - EL SISTEMA DE TICKETS)
  function ParteView(){
    var byBlock={};
    var u=getUserProfile();
    var data=getUserData();
    BLOQUES.forEach(function(b){
      var rooms=[]; for(var i=b.from;i<=b.to;i++) rooms.push(i);
      var entries=[];
      rooms.forEach(function(n){
        var r=data[n]||{}; var items=r.items||{}; var itemNotes=r.itemNotes||{};
        var fails=Object.keys(items).filter(function(k){return items[k]==='fail'});
        var revs=Object.keys(items).filter(function(k){return items[k]==='pending'});
        var detalle=[];
        // Recopilar fallos y revisiones
        fails.forEach(function(k){ var lab=(CHECKS.find(function(c){return c.id===k})||{}).label||k; var note=(itemNotes[k]||"").trim(); detalle.push({tipo:"Fallo",item:k,label:lab+(note?(" — obs: "+note):"")}); });
        revs.forEach(function(k){ var lab=(CHECKS.find(function(c){return c.id===k})||{}).label||k; var note=(itemNotes[k]||"").trim(); detalle.push({tipo:"Por revisar",item:k,label:lab+(note?(" — obs: "+note):"")}); });
        var roomNote=(r.notes||"").trim();
        var anyItemNoteOnly = Object.keys(itemNotes).some(function(k){ var v=(itemNotes[k]||"").trim(); var st=items[k]; return v.length>0 && (!st||st==='none'||st==='ok'); });
        
        // Recopilar notas de elementos que no son fallo/revisión
        if (anyItemNoteOnly){
            Object.keys(itemNotes).forEach(function(k){
                var note=(itemNotes[k]||"").trim(); if(!note) return; var st=items[k];
                if (!st||st==='none'||st==='ok'){ var lab=(CHECKS.find(function(c){return c.id===k})||{}).label||k; detalle.push({tipo:'Nota (OK/Ninguno)',item:k,label:lab+' — obs: '+note}); }
            });
        }
        // Recopilar nota general si existe y no se ha añadido un fallo/revisión
        if (detalle.length===0 && roomNote){ detalle.push({tipo:'Nota General',item:'observacion_general',label:roomNote}); }

        if (detalle.length > 0 || (r.measures && r.measures.length > 0) || roomNote) { 
            entries.push({room:n,detalle:detalle,measures:(r.measures||[]),notes:roomNote}); 
        }
      });
      byBlock[b.id]=entries;
    });

    function onCSV(){
      var rows=[["Usuario","Bloque","Residencia","Tipo de Incidencia","Elemento/Punto","Detalle/Observación","Medidas","Notas Generales"]];
      var alias=(getUserProfile()&&getUserProfile().alias)||'anon';
      BLOQUES.forEach(function(b){
        (byBlock[b.id]||[]).forEach(function(e){
          var medidas=(e.measures||[]).map(function(m){return "["+m.tipo+"] "+m.medida+(m.detalle?(" — "+m.detalle):"")}).join(" | ");
          
          if (e.detalle.length===0 && (e.measures.length || e.notes)){ 
              rows.push([alias,b.id,String(e.room),"","","",medidas,e.notes||""]);
          } else {
            e.detalle.forEach(function(d){
              var parts=d.label.split(" — obs: "); 
              rows.push([alias,b.id,String(e.room),d.tipo,parts[0],parts[1]||"",medidas,e.notes||""]);
            });
          }
        });
      });
      var csv=rows.map(function(r){ return r.map(function(x){ var s=(x==null?"":String(x)); return /[\",\n;]/.test(s)?('"'+s.replace(/\"/g,'""')+'"'):s; }).join(","); }).join("\n");
      var blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
      var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="parte_"+(((getUserProfile()||{}).alias)||"anon")+"_"+nowISO().replace(/[: ]/g,'-')+".csv";
      document.body.appendChild(a); a.click(); a.remove();
    }

    var main = el('main',{class:'container'},
      el('div',{style:{display:'flex',gap:'8px',alignItems:'center',justifyContent:'space-between'}},
        el('h2',null,'Parte de Mantenimiento (Tickets)'),
        el('div',null,
          el('button',{class:'btn',onclick:function(){ window.print(); }},'Imprimir'),
          el('button',{class:'btn-primary',style:{marginLeft:'8px'},onclick:onCSV},'Exportar CSV')
        )
      )
    );

    Object.keys(byBlock).forEach(function(bid){
      var entries=byBlock[bid]; var section = el('section',{class:'card'},
        el('h3',null,'Bloque '+(getBlockById(bid)||{}).label || bid),
        entries.length===0 ? el('div',{class:'kv'},'Sin fallos, por revisar o notas.') : el('div',null)
      );
      if (entries.length>0){
        entries.sort(function(a,b){return a.room-b.room;}).forEach(function(e){
          var item = el('div',{style:{margin:'8px 0',padding:'8px',border:'1px solid var(--b2)',borderRadius:'10px'}},
            el('div',{style:{fontWeight:700}}, 'Residencia '+e.room),
            el('ul',{style:{margin:'6px 0 0 18px'}},
              e.detalle.map(function(d){ return el('li',null, el('strong',null,d.tipo+': '), d.label); })
            )
          );
          if (e.measures && e.measures.length){
            item.appendChild(el('div',{class:'kv',style:{marginTop:'6px'}}, el('strong',null,'Medidas: '), e.measures.map(function(m){return '['+m.tipo+'] '+m.medida+(m.detalle?(' — '+m.detalle):'');}).join(' | ')));
          }
          if (e.notes && e.detalle.length > 0){
            item.appendChild(el('div',{class:'kv',style:{marginTop:'6px'}}, el('strong',null,'Notas Generales: '), e.notes));
          }
          section.appendChild(item);
        });
      }
      main.appendChild(section);
    });

    return main;
  }
  
  // Vista de gestión de cuenta
  function CuentaView(){
    var profile=getUserProfile();
    function logout(){ setCurrent(null); appState.aliasLower=null; appState.page='auth'; render(); }
    function onExport(){
      var alias=(profile&&profile.alias)||'anon';
      var data = localStorage.getItem(nsKey(appState.aliasLower)) || "{}";
      var payload = { type:"mh-profile", version:APP_VERSION, alias:alias, storedAt: new Date().toISOString(), data: JSON.parse(data) };
      var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="mh-"+alias+"-"+nowISO().replace(/[: ]/g,'-')+".mhjson"; document.body.appendChild(a); a.click(); a.remove();
    }
    function onImport(file){
      var fr=new FileReader();
      fr.onload=function(){
        try{
          var payload=JSON.parse(fr.result);
          if (!payload || !payload.data){ alert("Archivo inválido"); return; }
          localStorage.setItem(nsKey(appState.aliasLower), JSON.stringify(payload.data));
          location.reload();
        }catch(e){ alert("No se pudo importar"); }
      };
      fr.readAsText(file);
    }
    var fileInput = el('input',{type:'file',accept:'.mhjson,application/json',style:{display:'none'}});
    fileInput.addEventListener('change', function(e){ var f=e.target.files&&e.target.files[0]; if(f) onImport(f); });

    return el('main',{class:'container'},
      el('div',{class:'card'},
        el('h3',null, 'Usuario actual: ', profile?profile.alias:"—"),
        el('div',{class:'kv'},'Gestiona perfiles, copia de seguridad y migración.'),
        el('div',{style:{marginTop:'10px',display:'flex',gap:'8px',flexWrap:'wrap'}},
          el('button',{class:'btn',onclick:function(){ location.hash="#/auth"; }},'Cambiar usuario'),
          el('button',{class:'btn',onclick:logout},'Cerrar sesión'),
          el('button',{class:'btn',onclick:onExport},'Exportar datos (.mhjson)'),
          fileInput,
          el('button',{class:'btn',onclick:function(){ fileInput.click(); }},'Importar datos')
        )
      ),
      el('div',{class:'card'},
        el('h3',null,'Perfiles'),
        el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}},
          Object.values(loadUsers()).map(function(u){
            return el('span',{class:'badge'}, u.alias, ' ', el('button',{class:'btn',style:{marginLeft:'8px'},onclick:function(){
              var users=loadUsers(); if(!confirm('Eliminar perfil '+u.alias+'?')) return; delete users[u.alias.toLowerCase()]; saveUsers(users); if((profile&&profile.alias)===u.alias){ setCurrent(null); appState.aliasLower=null; location.hash="#/auth"; } render();
            }}, 'Eliminar'));
          })
        )
      )
    );
  }
  
  // Vista de autenticación/login (corregida)
  function AuthView(){
    var users=loadUsers();
    var alias=""; var pin=""; var msg="";
    var main=el('main',{class:'container'},
      el('div',{class:'card',style:{maxWidth:'440px',margin:'64px auto'}},
        el('h2',null,'Acceder'),
        el('div',{class:'kv'},'Perfiles locales. Alias + PIN de 4–8 dígitos.'),
        (function(){
          var box=el('div',{style:{display:'grid',gap:'8px',marginTop:'12px'}});
          var a=el('input',{placeholder:'Alias (ej. Frank)'});
          var p=el('input',{placeholder:'PIN',type:'password'});
          var m=el('div',{style:{color:'#b91c1c'}});
          var btn=el('button',{class:'btn-primary'},'Entrar / Crear perfil');
          a.addEventListener('input',function(){ alias=a.value; });
          p.addEventListener('input',function(){ pin=p.value; });
          btn.addEventListener('click',function(){
            var al=alias.trim(); var pi=pin.trim(); 
            if(!al||pi.length<4){ m.textContent="Alias y PIN (mínimo 4 dígitos) requeridos"; return; }
            var key=al.toLowerCase(); var u=users[key]; var h=hashPIN(pi);
            
            if(!u){
              // Crear nuevo usuario
              users[key]={alias:al,pinHash:h,createdAt:new Date().toISOString()}; saveUsers(users);
              // Migrar datos LEGACY si existen
              try{ var legacy=localStorage.getItem(LEGACY); if(legacy && !localStorage.getItem(nsKey(key))){ localStorage.setItem(nsKey(key), legacy); localStorage.removeItem(LEGACY);} }catch(e){}
              setCurrent(key); appState.aliasLower=key; location.hash=""; return;
            }
            if(u.pinHash!==h){ m.textContent="PIN incorrecto"; return; }
            
            // Iniciar sesión
            setCurrent(key); appState.aliasLower=key; location.hash=""; 
          });
          box.appendChild(a); box.appendChild(p); box.appendChild(btn); box.appendChild(m);
          return box;
        })(),
        Object.values(users).length>0 ? el('div',{style:{marginTop:'12px'}},
          el('div',{class:'kv'},'Perfiles existentes:'),
          el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'6px'}},
            Object.values(users).map(function(u){ var b=el('button',{class:'btn'},u.alias); b.addEventListener('click',function(){ alias=u.alias; document.activeElement.blur(); }); return b; })
          )
        ) : null
      )
    );
    return main;
  }
  
  function MainView(){
    var root = el('div',null,
      Header()
    );

    // --- VISTAS ESPECIALES (Auth, Parte, Cuenta) ---
    if (appState.page==="auth"){ root.appendChild(AuthView()); return root; }
    if (appState.page==="cuenta"){ root.appendChild(CuentaView()); return root; }
    if (appState.page==="parte"){ root.appendChild(ParteView()); return root; }

    // NIVEL 1: Selección de Zona (Plano General)
    if (!appState.selZone && !appState.selBlock){
      var plan = el('main',{class:'container'},
        el('h2',null, 'Plano General'),
        el('div',{class:'plan'},
          BLOQUES_AGRUPADOS.map(function(z){ return ZoneTile(z); })
        ),
        el('p',{class:'kv',style:{marginTop:'10px'}}, 'Usuario: ', (getUserProfile()?getUserProfile().alias:"—"), '. Pulsa una zona para ver el detalle.')
      );
      root.appendChild(plan);
      return root;
    }

    // NIVEL 2: Detalle de Zona / Plantas (Muestra bloques/plantas de una Zona)
    if (appState.selZone && appState.selBlock==null){
        var zone = BLOQUES_AGRUPADOS.find(z => z.id === appState.selZone);
        if (!zone) { appState.selZone=null; setRouteTo(null, null); return MainView(); }
        
        var main = el('main',{class:'container'},
            el('h2',null, zone.label),
            el('p',{class:'kv'}, 'Selecciona un bloque/planta para ver las habitaciones.')
        );

        var blocksToShow = zone.blocks.map(getBlockById).filter(b => b);

        main.appendChild(el('div',{class:'plan'},
            blocksToShow.map(function(b){ return ZoneTile(b); })
        ));

        root.appendChild(main);
        return root;
    }

    // NIVEL 3: Habitaciones de un Bloque/Planta
    if (appState.selBlock && appState.selRoom==null){
      var b=appState.selBlock;
      var rooms=[]; for(var i=b.from;i<=b.to;i++) rooms.push(i);
      var data=getUserData();
      function roomOverall(n){ var r=data[n]||{}; return (r.overall && r.overall!=="auto")? r.overall : autoOverallFromRoom(r); }
      var filtered = rooms.filter(function(n){
        if (appState.filter && String(n).indexOf(appState.filter.trim())<0) return false;
        if (appState.statusFilter==="all") return true;
        return roomOverall(n)===appState.statusFilter;
      });
      
      var main = el('main',{class:'container'},
        el('h2',null, 'Bloque '+b.label),
        (function(){
          var tb=el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',margin:'8px 0'}});
          var inp=el('input',{placeholder:'Filtrar número…', value: appState.filter}); 
          inp.addEventListener('input',function(){ appState.filter=inp.value; render(); });
          tb.appendChild(inp);
          ['all','fail','pending','ok','none'].forEach(function(s){
            var btn=el('span',{class: 'badge'+(appState.statusFilter===s?' active':''),onclick:function(){ appState.statusFilter=s; render(); }}, s);
            tb.appendChild(btn);
          });
          return tb;
        })(),
        el('div',{class:'rooms'},
          filtered.map(function(n){ return RoomChip(n); })
        )
      );
      root.appendChild(main);
      return root;
    }

    // NIVEL 4: Detalle de Habitación
    if (appState.selRoom!=null){
      var n=appState.selRoom; var data=getUserData(); var r=data[n]||{items:{},itemNotes:{},notes:"",measures:[],overall:"none",assumeOk:false};
      var overall = (r.overall && r.overall!=="auto")? r.overall : autoOverallFromRoom(r);

      function resetRoom(){
        setUserData(function(s){ var next=Object.assign({},s); next[n]={items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; return next; });
      }
      function toggleAssumeOk(){
        setUserData(function(s){ var rr=s[n]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.assumeOk=!rr.assumeOk; var next=Object.assign({},s); next[n]=rr; return next; });
      }
      function setOverallState(val){
        setUserData(function(s){ var rr=s[n]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.overall=val; var next=Object.assign({},s); next[n]=rr; return next; });
      }
      function setNotes(val){
        setUserData(function(s){ var rr=s[n]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.notes=val; var next=Object.assign({},s); next[n]=rr; return next; });
      }

      var main = el('main',{class:'container'},
        el('div',{style:{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}},
          el('h2',null, 'Residencia ', String(n)),
          el('span',{class:'badge',style:{marginLeft:'auto',background:overall==="auto"?"#334155":(overall==="ok"?COLORS.ok:overall==="fail"?COLORS.fail:overall==="pending"?COLORS.review:COLORS.none),color:"#fff"}}, labelState(overall)),
          el('button',{class:'btn',onclick:toggleAssumeOk}, r.assumeOk?'Asumir resto OK: Sí':'Asumir resto OK: No'),
          el('button',{class:'btn-danger',onclick:resetRoom}, 'Reiniciar habitación')
        ),
        IncidenciasView(n),
        el('section',{class:'card'},
          el('h3',null,'Medidas para sustituciones'),
          MeasureForm(n),
          (function(){
            var list = el('ul',{style:{marginTop:'8px',paddingLeft:'18px'}});
            var arr = (r.measures||[]);
            if (!arr.length){ list.appendChild(el('li',{class:'kv'},'Sin medidas aún.')); return list; }
            arr.forEach(function(m,idx){
              var li=el('li',{style:{marginBottom:'4px'}},
                el('span',{style:{fontFamily:'monospace'}}, '['+m.tipo+'] '+m.medida),
                m.detalle? el('span',null,' — '+m.detalle): null,
                el('button',{class:'btn',style:{marginLeft:'8px'},onclick:function(){
                  setUserData(function(s){ var rr=s[n]||{items:{},itemNotes:{},notes:"",measures:[],overall:"auto",assumeOk:false}; rr.measures=(rr.measures||[]).filter(function(_,i){return i!==idx}); var next=Object.assign({},s); next[n]=rr; return next; });
                }}, 'Eliminar')
              );
              list.appendChild(li);
            });
            return list;
          })()
        ),
        el('section',{class:'card'},
          el('h3',null,'Observaciones'),
          (function(){
            var ta=el('textarea',{style:{width:'100%',minHeight:'90px'}});
            ta.value=r.notes||""; ta.addEventListener('input', function(){ setNotes(ta.value); });
            return ta;
          })()
        ),
        el('section',{class:'container',style:{paddingLeft:0}},
          el('span',null,'Estado global: '),
          ['ok','fail','pending','auto'].map(function(s){
            var btn=el('span',{class:'badge',onclick:function(){ setOverallState(s); }}, labelState(s));
            return btn;
          })
        ),
        el('footer',{class:'container kv'}, APP_VERSION)
      );
      root.appendChild(main);
      return root;
    }

    return root;
  }

  // ---- Render & Boot ----
  function render(){
    try{
      var root = document.getElementById('app');
      if (!root) return;
      root.innerHTML='';
      root.appendChild(MainView());
      if (overlay) overlay.classList.add('hidden');
    }catch(e){ showError(e); }
  }

  applyRoute();
  render();
})();