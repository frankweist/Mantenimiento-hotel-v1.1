(function(){
  // ... (Safe boot & error overlay - Sin cambios) ...

  var GLOBAL_LS = { users:"mh_users_v1", current:"mh_user_current_v1" };
  var LEGACY = "mh_v1_state";
  var APP_VERSION = "v1.3.5-local-offline-3lvl"; // Versión actualizada

  // --- BLOQUES ORIGINALES (USADOS INTERNAMENTE) ---
  var BLOQUES = [
    { id: "A", label: "A", from: 2100, to: 2107 },
    { id: "B", label: "B", from: 2200, to: 2207 },
    { id: "C", label: "C", from: 2300, to: 2307 },
    { id: "D", label: "D", from: 2400, to: 2401 },
    { id: "V", label: "VILLAS", from: 3101, to: 3106 },
    // --- BRINKMANN ---
    { id: "BR-1", label: "BRINKMANN P1", from: 101, to: 129 },
    { id: "BR-2", label: "BRINKMANN P2", from: 201, to: 241 },
    { id: "BR-3", label: "BRINKMANN P3", from: 301, to: 345 },
    { id: "BR-4", label: "BRINKMANN P4", from: 401, to: 443 },
    // --- DARKO ---
    { id: "DR-1", label: "DARKO P1", from: 100, to: 138 },
    { id: "DR-2", label: "DARKO P2", from: 200, to: 238 },
    { id: "DR-3", label: "DARKO P3", from: 300, to: 338 },
    { id: "DR-4", label: "DARKO P4", from: 400, to: 438 },
    { id: "DR-5", label: "DARKO P5", from: 500, to: 538 },
    // --- LEIRO TOWER ---
    { id: "LT-1", label: "LEIRO TOWER P1", from: 1101, to: 1115 },
    { id: "LT-2", label: "LEIRO TOWER P2", from: 1201, to: 1219 },
    { id: "LT-3", label: "LEIRO TOWER P3", from: 1300, to: 1321 },
    { id: "LT-4", label: "LEIRO TOWER P4", from: 1400, to: 1421 },
    { id: "LT-5", label: "LEIRO TOWER P5", from: 1500, to: 1521 },
    { id: "LT-6", label: "LEIRO TOWER P6", from: 1600, to: 1621 },
    { id: "LT-7", label: "LEIRO TOWER P7", from: 1700, to: 1721 },
    { id: "LT-8", label: "LEIRO SUITES P8", from: 1800, to: 1821 }, 
  ];
  
  // --- NUEVA ESTRUCTURA DE AGRUPACIÓN (NIVEL 1) ---
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

  // --- El resto de constantes (CHECKS, COLORS, etc.) - Sin cambios ---
  var CHECKS = [
    // ... (sin cambios) ...
  ];
  var COLORS = { none:"#e5e7eb", review:"#f59e0b", ok:"#10b981", fail:"#ef4444", dark:"#0f172a", white:"#ffffff", border:"#cbd5e1" };
  // ... (resto de funciones utilitarias - Sin cambios) ...

  // ---- State & persistence ----

  var appState = {
    page: "plan",
    selZone: null,     // Nivel 1: Residence, Villas, Leiro, etc.
    selBlock: null,    // Nivel 2: Bloque A, V, BR-1, DR-3, LT-8, etc. (objeto completo)
    selRoom: null,
    filter: "",
    statusFilter: "all",
    users: loadUsers(),
    aliasLower: loadCurrent(),
    dataByUser: {} 
  };
  
  // ... (funciones de autenticación y datos - Sin cambios) ...

  // ---- Routing ----
  // La ruta ahora puede ser: #/zona (no implementado en hash), #/bloque, o #/bloque/habitacion
  function parseHash(){
    var h=(location.hash||"").replace(/^#\/?/,"");
    if (!h) return {page:"plan",block:null,room:null};
    var p=h.split("/");
    if (p[0]==="parte"||p[0]==="cuenta"||p[0]==="auth") return {page:p[0],block:null,room:null};
    var block=p[0]||null; var room=p[1]?Number(p[1]):null;
    return {page:"plan",block:block,room:room};
  }
  
  function setRouteTo(pg, room){
    if (pg==="parte"||pg==="cuenta"||pg==="auth"){ location.hash = "#/"+pg; return; }
    var blockId = pg;
    if (!blockId) location.hash=""; 
    else if (!room) location.hash="#/"+blockId; 
    else location.hash="#/"+blockId+"/"+room;
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

  // ... (el() y Header - Sin cambios, salvo para la navegación) ...
  function Header(){
    var actions=[];
    
    // Nueva lógica de navegación en el Header
    if (appState.page==="plan"){
        if (appState.selRoom!=null){
          // Nivel 3: Habitación -> Nivel 2: Bloque/Planta
          actions.push(el('button',{class:'btn-light',onclick:function(){ setRouteTo(appState.selBlock.id,null); }},'← Planta'));
        } else if (appState.selBlock){
          // Nivel 2: Bloque/Planta -> Nivel 1: Tipo de Zona (o Plano si es Residence/Villas)
          var zone = BLOQUES_AGRUPADOS.find(z => z.blocks.includes(appState.selBlock.id));
          if (zone && (zone.id === "Residence" || zone.id === "Villas")) {
              actions.push(el('button',{class:'btn-light',onclick:function(){ setRouteTo(null,null); }},'← Plano'));
          } else {
               // Para Leiro, Darko, Brinkmann, volvemos a la vista de Plantas (nivel 2)
              actions.push(el('button',{class:'btn-light',onclick:function(){ appState.selBlock=null; render(); }},'← Zonas'));
          }
        } else if (appState.selZone) {
             // Nivel 1: Tipo de Zona -> Nivel 0: Plano General
            actions.push(el('button',{class:'btn-light',onclick:function(){ appState.selZone=null; render(); }},'← Plano'));
        }
    }
    
    actions.push(el('button',{class:'btn',onclick:function(){ setRouteTo("parte"); }},'Parte'));
    actions.push(el('button',{class:'btn-primary',onclick:function(){ setRouteTo("cuenta"); }}, getUserProfile()?("Usuario: "+getUserProfile().alias):"Acceder"));
    
    return el('header',{class:'container'},
      el('h1',null,'Mantenimiento Hotel · Residences'),
      el('div',{class:'actions'}, actions)
    );
  }

  // ... (BlockTile, RoomChip, MeasureForm, ParteView, AddIncidencia, IncidenciasView, CuentaView, AuthView - Sin cambios) ...

  // Función mejorada para mostrar bloques o zonas
  function ZoneTile(item){
    var isBlock = item.id in getBlockById; // item es un bloque individual
    var data=getUserData();
    var rooms = [];
    var blocksToProcess = [];
    
    // Determinar qué bloques procesar
    if (item.blocks) {
        // Es un grupo (Zona: Leiro, Darko, etc.)
        blocksToProcess = item.blocks.map(getBlockById).filter(b => b);
    } else {
        // Es un bloque individual (A, B, V, BR-1, etc.)
        blocksToProcess = [item];
    }

    // Recoger todas las habitaciones de los bloques seleccionados
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
    
    if (item.blocks) {
        // Clic en ZONA (Nivel 1) -> Pasar al Nivel 2
        clickHandler = function(){ appState.selZone = item.id; appState.selBlock = null; render(); };
        subtitle = `Total Habitaciones: ${total}`;
    } else if (item.id === "A" || item.id === "B" || item.id === "C" || item.id === "D" || item.id === "V") {
        // Clic en Residence/Villas (Bloque, Nivel 2) -> Pasar al Nivel 3 (Habitaciones)
        clickHandler = function(){ setRouteTo(item.id,null); };
        subtitle = `Habitaciones: ${rooms[0]}–${rooms[rooms.length-1]}`;
    } else {
        // Clic en Planta (Leiro, Darko, Brinkmann - Nivel 2) -> Pasar al Nivel 3 (Habitaciones)
        clickHandler = function(){ setRouteTo(item.id,null); };
        subtitle = `Habitaciones: ${rooms[0]}–${rooms[rooms.length-1]}`;
    }
    
    return el('button',{class:'tile',onclick:clickHandler},
      el('div',{style:{width:'100%'}},
        el('div',{style:{fontSize:'24px'}}, item.icon || "🏠"),
        el('div',null, item.label),
        el('div',{class:'kv',style:{marginTop:'4px'}}, subtitle),
        el('div',{class:'kv',style:{marginTop:'4px'}}, "Fallo: "+fail+" · Rev: "+rev+" · OK: "+ok),
        progress
      )
    );
  }

  function MainView(){
    var root = el('div',null,
      Header()
    );

    // --- VISTAS ESPECIALES (Auth, Parte, Cuenta) ---
    if (appState.page==="auth"){ root.appendChild(AuthView()); return root; }
    if (appState.page==="cuenta"){ root.appendChild(CuentaView()); return root; }
    if (appState.page==="parte"){ root.appendChild(ParteView()); return root; }

    // --- VISTA PLAN DE DISTRIBUCIÓN ---

    // NIVEL 1: Selección de Zona (Residence, Villas, Leiro, Darko, Brinkmann)
    if (!appState.selZone){
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

    // NIVEL 2: Detalle de Zona / Plantas
    if (appState.selZone && !appState.selBlock){
        var zone = BLOQUES_AGRUPADOS.find(z => z.id === appState.selZone);
        if (!zone) { setRouteTo(null, null); return root; }
        
        var isFlatList = zone.id === "Residence" || zone.id === "Villas";
        
        var main = el('main',{class:'container'},
            el('h2',null, zone.label),
            el('p',{class:'kv'}, isFlatList ? 'Selecciona una habitación para ver/editar.': 'Selecciona una planta para ver las habitaciones.')
        );

        var blocksToShow = zone.blocks.map(getBlockById).filter(b => b);

        if (isFlatList) {
             // Si es Residence o Villas, saltamos al nivel 3 (habitaciones)
             // El Nivel 2 se convierte en la lista de habitaciones.
             var allRooms = [];
             blocksToShow.forEach(b => {
                 for (let i = b.from; i <= b.to; i++) allRooms.push(i);
             });
             
             // Creamos un bloque "virtual" para agrupar todas las habitaciones y usar la lógica de filtrado de MainView
             appState.selBlock = { id: zone.id, label: zone.label, from: allRooms[0], to: allRooms[allRooms.length - 1], isVirtual: true };
             return MainView();
             
        } else {
            // Si es Leiro, Darko, Brinkmann, mostramos las plantas/bloques
            main.appendChild(el('div',{class:'plan'},
                blocksToShow.map(function(b){ return ZoneTile(b); })
            ));
        }

        root.appendChild(main);
        return root;
    }

    // NIVEL 3: Habitaciones de un Bloque (o de un grupo virtual como Residence)
    if (appState.selBlock && appState.selRoom==null){
      var b=appState.selBlock;
      var rooms=[]; 
      
      // Si el bloque es "virtual" (Residence/Villas), cargamos todas las habitaciones
      if (b.isVirtual) {
          var zone = BLOQUES_AGRUPADOS.find(z => z.id === appState.selZone);
          if (zone) {
              zone.blocks.map(getBlockById).filter(blk => blk).forEach(blk => {
                  for(var i=blk.from;i<=blk.to;i++) rooms.push(i);
              });
          }
      } else {
          // Bloque normal (Planta)
          for(var i=b.from;i<=b.to;i++) rooms.push(i);
      }
      
      var data=getUserData();
      function roomOverall(n){ var r=data[n]||{}; return (r.overall && r.overall!=="auto")? r.overall : autoOverallFromRoom(r); }
      var filtered = rooms.filter(function(n){
        if (appState.filter && String(n).indexOf(appState.filter.trim())<0) return false;
        if (appState.statusFilter==="all") return true;
        return roomOverall(n)===appState.statusFilter;
      });
      
      var main = el('main',{class:'container'},
        el('h2',null, 'Residencias en '+b.label),
        (function(){
          var tb=el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',margin:'8px 0'}});
          var inp=el('input',{placeholder:'Filtrar número…', value: appState.filter}); inp.addEventListener('input',function(){ appState.filter=inp.value; render(); });
          tb.appendChild(inp);
          ['all','fail','pending','ok','none'].forEach(function(s){
            var btn=el('span',{class: 'badge'+(appState.statusFilter===s?' active':''),onclick:function(){ appState.statusFilter=s; render(); }}, s);
            tb.appendChild(btn);
          });
          return tb;
        })(),
        el('div',{class:'rooms'},
          filtered.map(function(n){ return RoomChip(n); })
        ),
        filtered.length === 0 ? el('p',{class:'kv',style:{marginTop:'12px'}}, 'No se encontraron residencias con el filtro aplicado.') : null
      );
      root.appendChild(main);
      return root;
    }

    // NIVEL 4: Detalle de Habitación
    if (appState.selRoom!=null){
       // ... (Lógica de IncidenciasView y detalle de habitación - Sin cambios) ...
    }

    return root;
  }

  // ---- Render & Boot ----
  // ... (render y applyRoute en el arranque - Sin cambios) ...
  applyRoute();
  render();
})();