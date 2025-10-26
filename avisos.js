
(function(){
  function el(tag, attrs){ const e=document.createElement(tag);
    attrs=attrs||{}; Object.keys(attrs).forEach(k=>{
      if(k==="class") e.className=attrs[k];
      else if(k==="style") Object.assign(e.style, attrs[k]);
      else if(k.startsWith("on") && typeof attrs[k]==="function") e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }); for(let i=2;i<arguments.length;i++){ const c=arguments[i];
      if(c==null) continue; if(Array.isArray(c)) c.forEach(n=>e.appendChild(typeof n==="string"?document.createTextNode(n):n));
      else e.appendChild(typeof c==="string"?document.createTextNode(c):c);
    } return e;
  }
  const LS_AVISOS = "mh_avisos_v1";
  const LS_FALLOS  = "mh_fallos_tipos_v1";
  const DEFAULT_TIPOS = [
    {id:"ac", etiqueta:"A/C", activo:true},
    {id:"drain", etiqueta:"Desagüe", activo:true},
    {id:"tv", etiqueta:"Mando TV", activo:true},
    {id:"door_terr", etiqueta:"Puerta terraza", activo:true},
    {id:"lock", etiqueta:"Cerradura", activo:true},
    {id:"lights", etiqueta:"Luces", activo:true},
    {id:"shower", etiqueta:"Ducha pierde", activo:true}
  ];
  function getTipos(){ try{ const t=JSON.parse(localStorage.getItem(LS_FALLOS)||"null"); if(Array.isArray(t)) return t; }catch(e){} return DEFAULT_TIPOS.slice(); }
  function setTipos(arr){ localStorage.setItem(LS_FALLOS, JSON.stringify(arr)); }
  function getAvisos(){ try{ const a=JSON.parse(localStorage.getItem(LS_AVISOS)||"[]"); if(Array.isArray(a)) return a; }catch(e){} return []; }
  function setAvisos(a){ localStorage.setItem(LS_AVISOS, JSON.stringify(a)); }
  function addAviso(obj){ const a=getAvisos(); a.push(obj); setAvisos(a); }
  function updateAviso(id, patch){ const a=getAvisos(); const i=a.findIndex(x=>x.id===id); if(i>=0){ a[i]=Object.assign({},a[i],patch); setAvisos(a); } }
  function removeAviso(id){ setAvisos(getAvisos().filter(x=>x.id!==id)); }

  function nowISO(){ const d=new Date(); const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); }

  function renderAvisos(){
    let root=document.getElementById("avisos-root");
    if(!root){ root=el("div",{id:"avisos-root",class:"container"}); document.body.appendChild(root); }
    root.innerHTML="";
    root.appendChild(el("div",{class:"card"},
      el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
        el("h1",null,"Avisos"),
        el("div",null, el("button",{class:"btn",onclick:()=>{ location.hash=""; }}, "← Volver"))
      )
    ));

    let falloSel=null;
    const tipos = getTipos().filter(t=>t.activo);
    const inpRoom = el("input",{class:"small",placeholder:"Habitación o ubicación",style:{width:"140px"}});
    const inpTxt  = el("input",{class:"small",placeholder:"Descripción rápida",style:{flex:"1"}});
    const chipWrap = el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",margin:"6px 0"}},
      ...tipos.map(t=>{
        const b=el("button",{class:"badge",onclick:(ev)=>{
          falloSel=t.id; [...chipWrap.children].forEach(c=>c.classList.remove("active"));
          b.classList.add("active");
        }}, t.etiqueta);
        return b;
      })
    );
    const save = el("button",{class:"btn-primary",onclick:()=>{
      const raw=(inpRoom.value||"").trim();
      const room=/^\d+$/.test(raw) ? Number(raw) : null;
      const ubic=room? "" : raw;
      const falloTxt=(inpTxt.value||"").trim();
      addAviso({ id:"av_"+Math.random().toString(36).slice(2),
        tsCreado:new Date().toISOString(), tsInicio:null, tsCierre:null,
        estado:"pendiente", room, ubicacionTxt:ubic, falloId:falloSel, falloTxt, prioridad:"normal" });
      renderAvisos();
    }}, "Guardar");
    root.appendChild(el("div",{class:"card"},
      el("h3",null,"Alta rápida"),
      el("div",{style:{display:"flex",gap:"8px",alignItems:"center"}}, inpRoom, chipWrap, inpTxt, save)
    ));

    const sel = el("select",null,
      el("option",{value:"todos"},"todos"),
      el("option",{value:"pendiente"},"pendiente"),
      el("option",{value:"curso"},"curso"),
      el("option",{value:"resuelto"},"resuelto"),
      el("option",{value:"cerrado"},"cerrado")
    );
    root.appendChild(el("div",{class:"card"}, el("label",null,"Estado: ", sel)));

    const list = el("div",null);
    root.appendChild(list);

    function tarjeta(a){
      const tipo = (getTipos().find(t=>t.id===a.falloId)||{}).etiqueta;
      const titulo = "#"+(a.room??a.ubicacionTxt)+" · "+(tipo || a.falloTxt || "Aviso");
      const pill = el("span",{class:"badge"}, a.estado.toUpperCase());
      const btnIniciar = el("button",{class:"btn",onclick:()=>{ updateAviso(a.id,{estado:"curso", tsInicio:new Date().toISOString()}); renderAvisos(); }}, "Iniciar");
      const btnResolver= el("button",{class:"btn-primary",onclick:()=>{ updateAviso(a.id,{estado:"resuelto", tsCierre:new Date().toISOString()}); renderAvisos(); }}, "Resolver");
      const btnCerrar  = el("button",{class:"btn",onclick:()=>{ updateAviso(a.id,{estado:"cerrado", tsCierre:new Date().toISOString()}); renderAvisos(); }}, "Cerrar s/incidencia");
      const btnBorrar  = el("button",{class:"btn-danger",onclick:()=>{ removeAviso(a.id); renderAvisos(); }}, "Borrar");

      return el("div",{class:"card"},
        el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
          el("h3",null, titulo), pill
        ),
        a.falloTxt ? el("div",{class:"kv"}, a.falloTxt) : null,
        el("div",{style:{display:"flex",gap:"6px",marginTop:"6px"}}, btnIniciar, btnResolver, btnCerrar, btnBorrar)
      );
    }

    function renderList(){
      const estado=sel.value;
      const arr=getAvisos().filter(a=>estado==="todos"||a.estado===estado)
                           .sort((a,b)=>a.tsCreado<b.tsCreado?-1:1);
      list.innerHTML="";
      if(arr.length===0) list.appendChild(el("div",{class:"card"},"Sin avisos."));
      else arr.forEach(a=>list.appendChild(tarjeta(a)));
    }
    sel.onchange=renderList;
    renderList();
  }

  function attachHeaderButton(){
    const header = document.querySelector("header .actions") || document.querySelector("header") || document.body;
    const btn = document.createElement("button");
    btn.className="btn";
    btn.textContent="Avisos";
    btn.addEventListener("click", ()=>{ location.hash="#/avisos"; });
    header.appendChild(btn);
  }

  function switcher(){
    const app = document.getElementById("app");
    const av  = document.getElementById("avisos-root");
    if((location.hash||"").startsWith("#/avisos")){
      if(app) app.style.display="none";
      renderAvisos();
      if(av) av.style.display="";
    }else{
      if(app) app.style.display="";
      if(av) av.style.display="none";
    }
  }

  window.addEventListener("hashchange", switcher);
  window.addEventListener("DOMContentLoaded", ()=>{ attachHeaderButton(); switcher(); });
})();