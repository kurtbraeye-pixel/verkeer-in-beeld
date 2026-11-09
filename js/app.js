/* De app zelf: toestand, materiaalpaneel, tekenvlak, werkbalk, opslaan en exporteren. */
import {
  W,H,CX,CY,ROT,DIRLABEL,COLORS,SVGNS,SHAPES,ROUTES,
  TYPES,SECTIONS,ENTRY,LINES,BERMS,LANEMARKS,POSTS,B15LIST,
  copyPts,isPts,vbox,normV,follows,baseDims,dims,clamp,sanitizeItem
} from './types.js';
import {PRESETS,XPRESETS,RPRESETS} from './presets.js';

function renderTiles(){SECTIONS.forEach(fillTiles);if(document.getElementById('palQ').value)palSearch();}

var svg=document.getElementById('scene'),layer=document.getElementById('items'),selLayer=document.getElementById('sel');
var store={cross:{items:[],vw:240,hw:240,arm:null},road:{items:[],roadW:280,orient:'v'},round:{items:[],R:250,bike:''}},scene='cross';
var items=store.cross.items,roadS=store.road;
var selId=null,uid=0,undoStack=[],redoStack=[],dir='bottom',curColor=COLORS[0],drag=null;
var KEY='kruispunt-bouwer-v2';
var APP_VERSION='v36';   /* moet gelijk zijn aan VERSION in sw.js; anders verschijnt de melding "nieuwe versie" */
var ARMS=['top','bottom','left','right'];

/* Zet bewaarde gegevens (localStorage of een geopend bestand) om naar de toestand van de app.
   Alles wordt gecontroleerd, zodat een beschadigd bestand de app niet kan breken. */
function applyData(sv){
  if(!sv||typeof sv!=='object'||!sv.store||typeof sv.store!=='object')return false;
  uid=0;
  ['cross','road','round'].forEach(function(k){
    var s=sv.store[k]||{};
    store[k].items=(Array.isArray(s.items)?s.items:[]).map(sanitizeItem).filter(Boolean);
    store[k].items.forEach(function(i){i.id=++uid;});
    if(k==='cross'){
      store.cross.vw=clamp(+s.vw||240,160,720);store.cross.hw=clamp(+s.hw||240,160,640);
      store.cross.arm=ARMS.indexOf(s.arm)>-1?s.arm:null;
      store.cross.preset=XPRESETS.some(function(p){return p.id===s.preset;})?s.preset:null;
    }else if(k==='road'){
      store.road.roadW=clamp(+s.roadW||280,160,760);store.road.orient=s.orient==='h'?'h':'v';
      store.road.preset=PRESETS.some(function(p){return p.id===s.preset;})?s.preset:null;
    }else{
      store.round.R=clamp(+s.R||250,200,300);store.round.bike=s.bike===true?'apart':(['ring','apart'].indexOf(s.bike)>-1?s.bike:'');
      store.round.preset=RPRESETS.some(function(p){return p.id===s.preset;})?s.preset:null;
    }
  });
  scene=['road','round'].indexOf(sv.scene)>-1?sv.scene:'cross';
  items=store[scene].items;
  return true;
}
try{applyData(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}

/* Ongedaan maken / opnieuw: een momentopname bevat de items én de instellingen van de weg. */
function settings(){
  var s=store[scene];
  if(scene==='cross')return {vw:s.vw,hw:s.hw,arm:s.arm,preset:s.preset||null};
  if(scene==='road')return {roadW:s.roadW,orient:s.orient,preset:s.preset||null};
  return {R:s.R,bike:s.bike||'',preset:s.preset||null};
}
function snap(){return JSON.stringify({items:items,set:settings()});}
function restore(str){
  var o=JSON.parse(str);
  items=o.items;store[scene].items=items;Object.assign(store[scene],o.set);
  drawBase();renderDpad();renderTiles();render();
}
function pushHistory(s){undoStack.push(s);if(undoStack.length>60)undoStack.shift();redoStack=[];}
function mutate(fn){stopPlay();var b=snap();fn();if(snap()!==b)pushHistory(b);render();}
function find(id){for(var i=0;i<items.length;i++)if(items[i].id===id)return items[i];return null;}

/* ---------- palette ---------- */
function tileSvg(entry){
  var def=TYPES[entry.type],tmp={type:entry.type,color:curColor,state:entry.state,lanes:entry.lanes,text:entry.text,s:1,id:0};
  if(entry.type==='routepijl')tmp.pts=ROUTES[entry.shape==null?1:entry.shape];
  if(def.stretch){tmp.w=def.tw||def.w;tmp.h=def.th||def.h;}
  var b=baseDims(tmp),m=Math.max(b[0],b[1])/2+4,rot=follows(def)?ROT[dir]:0;
  var bg=def.kind==='mark'||def.onRoad?'<rect x="'+(-m)+'" y="'+(-m)+'" width="'+(2*m)+'" height="'+(2*m)+'" rx="'+(m/5)+'" fill="#6f6a64"/>':'';
  return '<svg viewBox="'+(-m)+' '+(-m)+' '+(2*m)+' '+(2*m)+'" aria-hidden="true">'+bg+'<g transform="rotate('+rot+')">'+def.draw(tmp)+'</g></svg>';
}
function fillTiles(sec){
  document.getElementById(sec.el).innerHTML=sec.entries.map(function(e){
    return '<button class="tile" type="button" data-key="'+e.key+'">'+tileSvg(e)+'<span>'+(e.label||TYPES[e.type].label)+'</span></button>';
  }).join('');
}
function renderDpad(){
  var cells=[['top','1/2'],['left','2/1'],['right','2/3'],['bottom','3/2']];
  document.getElementById('dpad').innerHTML=cells.map(function(c){
    return '<button class="dir'+(dir===c[0]?' on':'')+'"'+(store.cross.arm===c[0]&&scene==='cross'?' disabled':'')+' type="button" data-dir="'+c[0]+'" style="grid-area:'+c[1]+'" title="Komt van '+DIRLABEL[c[0]]+'" aria-label="Komt van '+DIRLABEL[c[0]]+'"><svg class="ic" style="transform:rotate('+ROT[c[0]]+'deg)"><use href="#i-arrow"/></svg></button>';
  }).join('')+'<div class="mid">komt<br>van</div>';
}
function renderSwatches(){
  document.getElementById('sw').innerHTML=COLORS.map(function(c){
    return '<button type="button" class="'+(c===curColor?'on':'')+'" data-color="'+c+'" style="background:'+c+'" aria-label="Kleur '+c+'"></button>';
  }).join('');
}
function renderPalette(){renderTiles();renderDpad();renderSwatches();}
/* zoeken in het materiaal: toont alleen de passende tegels en klapt hun groepen open; leeg = alles zoals voordien */
var ALIAS={agent_up:'politie agent bevoegd persoon',agent_side:'politie agent bevoegd persoon',light:'licht driekleurig',
  yield:'haaientanden driehoek voorrang',stop:'stoppen',priority:'voorrang',endpriority:'voorrang',b15:'voorrang',b17:'voorrang rechts',
  zebra:'oversteekplaats voetgangers',ped:'persoon wandelaar',bike:'fietser',tree:'boom',carD:'pech',truckD:'pech',tag:'letter',routepijl:'pijl route',
  f4a:'snelheid 30',f4b:'snelheid 30',school:'kinderen zone 30',a23:'school',f111:'fiets',f113:'fiets',f12a:'woonerf erf spelen',f12b:'woonerf erf einde',f99a:'voorbehouden weg fiets voetganger ruiter speed pedelec',f99b:'voorbehouden weg fiets voetganger',f99c:'voorbehouden weg tractor landbouw',f101a:'voorbehouden weg einde',f101b:'voorbehouden weg einde',f101c:'voorbehouden weg einde',f103:'voetgangerszone winkelstraat',f105:'voetgangerszone einde',speelstraat:'spelen kinderen c3',schoolstraat:'school kinderen c3',ruiter:'paard',f50:'fiets oversteekplaats',f111mark:'fietszone logo markering',c43:'snelheid',asfalt:'zijstraat'};
function norm(t){return String(t).toLowerCase().replace(/\u00AD/g,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
var palOpen=null;
function palSearch(){
  var q=norm(document.getElementById('palQ').value.trim()),pal=document.getElementById('palette'),secs=pal.querySelectorAll('details.sec'),any=false;
  if(q&&!palOpen){palOpen=[];secs.forEach(function(d){palOpen.push(d.open);});}
  pal.classList.toggle('searching',!!q);
  pal.querySelectorAll('.tile').forEach(function(t){
    var e=ENTRY[t.getAttribute('data-key')],hay=norm(t.textContent+' '+e.type+' '+(ALIAS[e.type]||''));
    var ok=!q||q.split(/\s+/).every(function(w){return hay.indexOf(w)>-1;});
    t.hidden=!ok;if(ok&&q)any=true;
  });
  /* van binnen naar buiten: een groep is zichtbaar als er een zichtbare tegel in zit */
  Array.prototype.slice.call(secs).reverse().forEach(function(d){
    var vis=!q||!!d.querySelector('.tile:not([hidden])');
    d.hidden=!vis;if(q&&vis)d.open=true;
  });
  if(!q&&palOpen){secs.forEach(function(d,i){d.open=palOpen[i];});palOpen=null;}
  document.getElementById('palNone').hidden=!q||any;
}
document.getElementById('palQ').addEventListener('input',palSearch);
document.getElementById('palQ').addEventListener('keydown',function(e){if(e.key==='Escape'){this.value='';palSearch();this.blur();}});

document.getElementById('dpad').addEventListener('click',function(e){
  var b=e.target.closest('[data-dir]');if(!b||b.disabled)return;
  dir=b.getAttribute('data-dir');renderDpad();renderTiles();
});
document.getElementById('sw').addEventListener('click',function(e){
  var b=e.target.closest('[data-color]');if(!b)return;
  curColor=b.getAttribute('data-color');renderSwatches();renderTiles();
  var it=find(selId);
  if(it&&TYPES[it.type].color)mutate(function(){it.color=curColor;});
});

/* ---------- plaatsen ---------- */
/* hv/hh: halve breedte van de verticale/horizontale weg; ey/ex: afstand van het midden tot waar die arm begint */
function G(){
  if(scene==='round')return {hv:120,hh:120,ey:store.round.R,ex:store.round.R};
  var c=store.cross;return {hv:c.vw/2,hh:c.hw/2,ey:c.hw/2,ex:c.vw/2};
}
function vehicleSpot(item){
  var g=G(),len=TYPES[item.type].h,B={
    bottom:{x:CX+g.hv/2,y:CY+g.ey+82+len/2,vx:0,vy:1,lx:1,ly:0},
    top:{x:CX-g.hv/2,y:CY-g.ey-82-len/2,vx:0,vy:-1,lx:-1,ly:0},
    left:{x:CX-g.ex-82-len/2,y:CY+g.hh/2,vx:-1,vy:0,lx:0,ly:1},
    right:{x:CX+g.ex+82+len/2,y:CY-g.hh/2,vx:1,vy:0,lx:0,ly:-1}
  }[dir];
  var off=item.type==='bike'?32:0,x,y;
  for(var k=0;k<6;k++){
    x=B.x+B.lx*off+B.vx*k*(len+22);y=B.y+B.ly*off+B.vy*k*(len+22);
    var busy=items.some(function(o){return TYPES[o.type].kind==='vehicle'&&Math.hypot(o.x-x,o.y-y)<70;});
    if(!busy)break;
  }
  return {x:x,y:y};
}
function sideMark(dist){return function(){var g=G();return {
  bottom:[CX+g.hv/2,CY+g.ey+dist],top:[CX-g.hv/2,CY-g.ey-dist],left:[CX-g.ex-dist,CY+g.hh/2],right:[CX+g.ex+dist,CY-g.hh/2]};};}
function across(dist){return function(){var g=G();return {bottom:[CX,CY+g.ey+dist],top:[CX,CY-g.ey-dist],left:[CX-g.ex-dist,CY],right:[CX+g.ex+dist,CY]};};}
var MARKPOS={
  zebra:across(30),
  fietsoversteek:across(90),
  stopline:sideMark(71),
  sharks:sideMark(60),
  opstelvak:sideMark(140),
  arrow_s:sideMark(170),
  dashed:function(){var g=G();return {bottom:[CX,CY+g.ey+170],top:[CX,CY-g.ey-170],left:[CX-g.ex-100,CY],right:[CX+g.ex+100,CY]};}
};
MARKPOS.arrow_r=MARKPOS.arrow_l=MARKPOS.arrow_sr=MARKPOS.arrow_sl=MARKPOS.arrow_mr=MARKPOS.arrow_ml=MARKPOS.bikesym=MARKPOS.arrow_s;
MARKPOS.solid=MARKPOS.ydashed=MARKPOS.tsolid=MARKPOS.tdashed=MARKPOS.dashed;
function markSpot(item){
  var g=G(),p=MARKPOS[item.type]()[dir],v={bottom:[0,1],top:[0,-1],left:[-1,0],right:[1,0]}[dir],len=TYPES[item.type].h,extra={};
  if(item.type==='zebra'||item.type==='fietsoversteek')extra.w=(dir==='bottom'||dir==='top')?g.hv*2:g.hh*2;
  if(item.type==='stopline'||item.type==='sharks'||item.type==='opstelvak')extra.w=Math.max(60,((dir==='bottom'||dir==='top')?g.hv:g.hh)-12);
  for(var k=0;k<5;k++){
    var xx=p[0]+v[0]*k*(len+14),yy=p[1]+v[1]*k*(len+14);
    var busy=items.some(function(o){return o.type===item.type&&Math.hypot(o.x-xx,o.y-yy)<20;});
    if(!busy){extra.x=xx;extra.y=yy;return extra;}
  }
  extra.x=p[0];extra.y=p[1];return extra;
}
function countOf(list){return items.filter(function(o){return list.indexOf(o.type)>-1;}).length;}
function postsFacing(rot){return items.filter(function(o){return POSTS.indexOf(o.type)>-1&&o.rot===rot;}).length;}
function objectSpot(item){
  var t=item.type;
  if(['agent_up','agent_side','barrier','cone','tag'].indexOf(t)>-1){return {x:CX+countOf([t])*44,y:CY};}
  var g=G();
  if(t==='ped'){
    /* op het voetpad links van de rijbaan (rechts staan de borden); elke volgende voetganger iets verder terug */
    var j=items.filter(function(o){return o.type==='ped'&&o.rot===ROT[dir];}).length*60,e=190+j;
    var Q={bottom:[CX-g.hv-30,CY+g.ey+e],top:[CX+g.hv+30,CY-g.ey-e],left:[CX-g.ex-e,CY-g.hh-30],right:[CX+g.ex+e,CY+g.hh+30]}[dir];
    return {x:Q[0],y:Q[1]};
  }
  /* borden en lichten: op de hoek rechts van de naderende bestuurder, elk volgend bord iets verder terug */
  var k=postsFacing(ROT[dir])*80,d=70;
  var P={bottom:[CX+g.hv+d,CY+g.ey+d+k],top:[CX-g.hv-d,CY-g.ey-d-k],left:[CX-g.ex-d-k,CY+g.hh+d],right:[CX+g.ex+d+k,CY-g.hh-d]}[dir];
  return {x:P[0],y:P[1]};
}
function crossPlace(it){
  var def=TYPES[it.type];
  if(def.kind==='vehicle')return vehicleSpot(it);
  if(MARKPOS[it.type])return markSpot(it);
  if(def.kind==='mark'||def.kind==='base'||['tree','triangleI','kuil'].indexOf(it.type)>-1)return {x:CX,y:CY};
  return objectSpot(it);
}
function roadPlace(it){
  var t=it.type,def=TYPES[t],v=roadS.orient==='v',RW=roadS.roadW,d2=dir;
  if(v){if(d2==='left')d2='bottom';if(d2==='right')d2='top';}else{if(d2==='bottom')d2='left';if(d2==='top')d2='right';}
  function pt(p,lat){
    return {bottom:[CX+lat,H-p],top:[CX-lat,p],left:[p,CY+lat],right:[W-p,CY-lat]}[d2];
  }
  var o,k,q;
  if(def.kind==='vehicle'){
    var len=def.h,lat=t==='bike'?100:70;
    for(k=0;k<6;k++){
      q=pt(60+len/2+k*(len+22),lat);
      var busy=items.some(function(o2){return TYPES[o2.type].kind==='vehicle'&&Math.hypot(o2.x-q[0],o2.y-q[1])<70;});
      if(!busy)break;
    }
    return {x:q[0],y:q[1],rot:ROT[d2]};
  }
  if(LINES.indexOf(t)>-1){
    var n=countOf([t]);
    return {x:CX+(v?n*40:0),y:CY+(v?0:n*40),rot:v?0:90,h:v?H:W};
  }
  if(BERMS.indexOf(t)>-1){
    var nb=countOf([t]),side=nb%2===0?1:-1,w=def.w,off=t==='midberm'?0:side*(RW/2+w/2);
    return {x:CX+(v?off:0),y:CY+(v?0:off),rot:v?0:90,h:v?H:W};
  }
  if(t==='asfalt')return {x:CX,y:CY,rot:v?0:90,w:v?W:H,h:190};
  if(t==='zebra'||t==='fietsoversteek')return {x:v?CX:250,y:v?250:CY,rot:v?0:90,w:Math.min(RW,560)};
  if(t==='tramrails')return {x:CX,y:CY,rot:v?0:90,h:v?H:W};
  if(t==='zigzag')return {x:v?CX+RW/2-16:CX,y:v?CY:CY+RW/2-16,rot:v?0:90,h:300};
  if(t==='suggestie')return {x:v?CX+RW/2-47:CX,y:v?CY:CY+RW/2-47,rot:v?0:90,h:v?H:W};
  if(t==='vlak')return {x:CX,y:CY,rot:v?0:90};
  if(t==='stopline'||t==='sharks'){q=pt(520,70);return {x:q[0],y:q[1],rot:ROT[d2],w:140};}
  if(t==='opstelvak'){q=pt(600,70);return {x:q[0],y:q[1],rot:ROT[d2],w:120};}
  if(LANEMARKS.indexOf(t)>-1){q=pt(210,70);return {x:q[0],y:q[1],rot:ROT[d2]};}
  if(t==='barrier'){return {x:CX+countOf([t])*30,y:CY,rot:v?0:90,w:300};}
  if(['agent_up','agent_side','cone','tag','baken','routepijl','tree','triangleI','kuil'].indexOf(t)>-1){return {x:CX+countOf([t])*44,y:CY};}
  if(t==='ped'){q=pt(260+countOf(['ped'])*60,RW/2+40);return {x:q[0],y:q[1],rot:ROT[d2]};}
  q=pt(240+postsFacing(ROT[d2])*150,RW/2+60);
  return {x:q[0],y:q[1],rot:ROT[d2]};
}
function addItem(entry,x,y){
  var def=TYPES[entry.type];
  var it={id:++uid,type:entry.type,x:0,y:0,s:1,rot:follows(def)?ROT[dir]:0};
  if(def.color)it.color=curColor;
  if(entry.state)it.state=entry.state;
  if(entry.lanes)it.lanes=entry.lanes.slice();
  if(entry.text)it.text=entry.text;
  if(def.stretch){it.w=def.w;it.h=def.h;}
  if(entry.type==='vlak')it.pts=copyPts(SHAPES[1]);
  if(entry.type==='routepijl'){it.shape=entry.shape==null?1:entry.shape;it.pts=copyPts(ROUTES[it.shape]);}
  var sp=scene==='road'?roadPlace(it):crossPlace(it);
  it.x=sp.x;it.y=sp.y;
  if(sp.rot!=null)it.rot=sp.rot;
  if(sp.w!=null&&def.stretch)it.w=sp.w;
  if(sp.h!=null&&def.stretch)it.h=sp.h;
  if(typeof x==='number'){it.x=x;it.y=y;}
  it.x=clamp(it.x,0,W);it.y=clamp(it.y,0,H);
  pushHistory(snap());items.push(it);selId=it.id;render();
}

/* ---------- tekenen ---------- */
function layerOf(it){var k=TYPES[it.type].kind;return k==='base'?0:(k==='mark'?1:2);}
var rafId=0;
function scheduleRender(){if(!rafId)rafId=requestAnimationFrame(render);}
function render(){
  if(rafId){cancelAnimationFrame(rafId);rafId=0;}
  layer.innerHTML=items.slice().sort(byLayer).map(itemSvg).join('');
  var it=find(selId);
  if(selId!==null&&!it)selId=null;
  selLayer.innerHTML=it?selMarkup(it):'';
  updateToolbar(it);
  document.getElementById('hint').hidden=items.length>0;
  if(typeof playUI==='function')playUI();
  saveState();
}
function byLayer(a,b){return layerOf(a)-layerOf(b);}
/* richtingaanwijzer (links, rechts of alarmlichten) en remlichten als oplichtende gloed op de hoeken van het voertuig */
function vehicleSignals(it,d){
  var x=d.w/2-6,yf=-d.h/2+6,yr=d.h/2-6,s='',b=it.blink;
  function glow(cx,cy,col,core){
    var c=' cx="'+cx+'" cy="'+cy+'"';
    return '<circle'+c+' r="15" fill="'+col+'" opacity=".3"/><circle'+c+' r="8" fill="'+col+'" opacity=".6"/><circle'+c+' r="3.8" fill="'+core+'"/>';
  }
  if(b==='l'||b==='h')s+=glow(-x,yf,'#ffa400','#fff1c2')+glow(-x,yr,'#ffa400','#fff1c2');
  if(b==='r'||b==='h')s+=glow(x,yf,'#ffa400','#fff1c2')+glow(x,yr,'#ffa400','#fff1c2');
  if(it.brake)s+=glow(-x+5,yr+1,'#ff1f1f','#ffd6d6')+glow(x-5,yr+1,'#ff1f1f','#ffd6d6');
  return s;
}
/* één onderdeel als SVG (ook gebruikt voor de miniaturen in de galerij) */
function itemSvg(it){
    var d=TYPES[it.type],b,hw;
    if(d.stretch&&it.w==null){it.w=d.w;it.h=d.h;}
    if(it.type==='vlak'&&!it.pts){var ow=it.w||160,oh=it.h||260;it.pts=[[-ow/2,-oh/2],[ow/2,-oh/2],[ow/2,oh/2],[-ow/2,oh/2]];}
    if(it.type==='routepijl'&&!it.pts)it.pts=copyPts(ROUTES[1]);
    b=baseDims(it);hw=d.stretch?Math.max(b[0],28):b[0];
    var hh=d.stretch?Math.max(b[1],28):b[1];
    return '<g data-id="'+it.id+'" transform="translate('+it.x.toFixed(1)+' '+it.y.toFixed(1)+')"'+(d.kind==='base'||d.kind==='mark'?'':' filter="url(#sh)"')+'>'+
      '<g transform="rotate('+it.rot+') scale('+(it.s*(it.flip||1))+' '+it.s+')">'+d.draw(it)+(d.signals?vehicleSignals(it,d):'')+
      (isPts(it)?'':'<rect x="'+(-hw/2)+'" y="'+(-hh/2)+'" width="'+hw+'" height="'+hh+'" fill="#000" fill-opacity="0"/>')+'</g></g>';
}
/* Opslaan in de browser gebeurt pas na een korte pauze, niet bij elke muisbeweging. */
var saveTimer=0;
function saveState(){clearTimeout(saveTimer);saveTimer=setTimeout(saveNow,300);}
function saveNow(){
  clearTimeout(saveTimer);
  store[scene].items=items;
  try{localStorage.setItem(KEY,JSON.stringify({scene:scene,store:store}));}catch(e){}
}
window.addEventListener('pagehide',saveNow);
document.addEventListener('visibilitychange',function(){if(document.hidden)saveNow();});
var HS=window.matchMedia&&matchMedia('(pointer: coarse)').matches?1.5:1;   /* grepen groter op aanraakschermen */
function handle(cls,mode,x,y,shape){
  var g='<g data-h="'+mode+'" class="'+cls+'" transform="translate('+x+' '+y+') scale('+HS+')">';
  if(shape==='sq')return g+'<rect x="-9" y="-9" width="18" height="18" rx="5" fill="#cc4e06" stroke="#fff" stroke-width="3"/></g>';
  return g+'<circle r="14" fill="#cc4e06" stroke="#fff" stroke-width="3"/>'+(shape==='rot'?
    '<path d="M-5.5 1.5A6 6 0 1 1 0 6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M-9.5 -1.5L-5.5 4.5 -1.5 -0.5Z" fill="#fff"/>':
    '<path d="M-5 5L5 -5M5 -5H0M5 -5V0M-5 5H0M-5 5V0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>')+'</g>';
}
function selMarkup(it){
  var d=TYPES[it.type],dm=dims(it),x0=-dm[0]/2,x1=dm[0]/2,y0=-dm[1]/2,y1=dm[1]/2,k,out;
  if(isPts(it)){var bb=vbox(it.pts),pd=it.type==='routepijl'?14:0;x0=(bb[0]-pd)*it.s;x1=(bb[2]+pd)*it.s;y0=(bb[1]-pd)*it.s;y1=(bb[3]+pd)*it.s;}
  x0-=8;x1+=8;y0-=8;y1+=8;
  var mx=(x0+x1)/2,my=(y0+y1)/2;
  out='<g transform="translate('+it.x.toFixed(1)+' '+it.y.toFixed(1)+') rotate('+it.rot+')">'+
    '<rect x="'+x0+'" y="'+y0+'" width="'+(x1-x0)+'" height="'+(y1-y0)+'" rx="6" fill="none" stroke="#cc4e06" stroke-width="2.5" stroke-dasharray="8 6" pointer-events="none"/>'+
    '<line x1="'+mx+'" y1="'+y0+'" x2="'+mx+'" y2="'+(y0-26*HS)+'" stroke="#cc4e06" stroke-width="2.5" pointer-events="none"/>';
  if(d.stretch){
    if(d.stretch.indexOf('w')>-1)out+=handle('h-w','w+',x1,my,'sq')+handle('h-w','w-',x0,my,'sq');
    if(d.stretch.indexOf('h')>-1)out+=handle('h-h','h+',mx,y1,'sq')+handle('h-h','h-',mx,y0,'sq');
    if(d.stretch==='wh')out+=handle('h-size','wh',x1,y1,'size');
  }else out+=handle('h-size','resize',x1,y1,'size');
  out+=handle('h-rot','rotate',mx,y0-38*HS,'rot');
  if(isPts(it)){
    var n=it.pts.length,pp=it.pts,sc=it.s,nm=it.type==='routepijl'?n-1:n;
    for(k=0;k<nm;k++){
      var a=pp[k],b=pp[(k+1)%n];
      out+='<g data-h="m:'+k+'" class="h-v" transform="translate('+((a[0]+b[0])/2*sc)+' '+((a[1]+b[1])/2*sc)+')"><circle r="'+(7*HS)+'" fill="#fff" stroke="#cc4e06" stroke-width="2.5"/><path d="M-3.5 0H3.5M0 -3.5V3.5" stroke="#cc4e06" stroke-width="2"/></g>';
    }
    for(k=0;k<n;k++){
      out+='<g data-h="v:'+k+'" class="h-v" transform="translate('+(pp[k][0]*sc)+' '+(pp[k][1]*sc)+')"><circle r="'+(10*HS)+'" fill="#cc4e06" stroke="#fff" stroke-width="3"/></g>';
    }
  }
  return out+'</g>';
}
var LANECYC=['s','l','r','sl','sr'],LANECH={s:'\u2191',l:'\u21B0',r:'\u21B1',sl:'\u2191\u21B0',sr:'\u2191\u21B1'};
function updateToolbar(it){
  renderInspector(it);
  document.getElementById('bUndo').disabled=undoStack.length===0;
  document.getElementById('bRedo').disabled=redoStack.length===0;
  document.getElementById('bClear').disabled=items.length===0;
}

/* ---------- eigenschappenpaneel ----------
   Het paneel wordt alleen opnieuw opgebouwd als er iets anders gekozen is (of de opbouw verandert);
   anders worden enkel de waarden bijgewerkt, zodat een schuifbalk tijdens het slepen niet verdwijnt. */
var insKey='',insBefore=null,SPEEDS=['20','30','50','70','90','120'],LIGHTS=[['red','Rood'],['orange','Oranje'],['green','Groen']];
function IC(n){return '<svg class="ic"><use href="#i-'+n+'"/></svg>';}
function itemLabel(it){return (it.type==='agent_up'||it.type==='agent_side')?'Bevoegd persoon':TYPES[it.type].label.replace(/\u00AD/g,'');}
function insField(label,inner,out){
  return '<div class="ins-field"><div class="ins-lab"><span>'+label+'</span>'+(out?'<output data-o="'+out+'"></output>':'')+'</div>'+inner+'</div>';
}
/* het zwevende venster gaat naar links als het over het gekozen onderdeel zou liggen */
function insPlace(it){
  var ins=document.getElementById('inspector'),g=layer.querySelector('[data-id="'+it.id+'"]');
  if(!g||getComputedStyle(ins).position!=='absolute'){ins.classList.remove('left');return;}
  ins.classList.remove('left');
  var a=ins.getBoundingClientRect(),b=g.getBoundingClientRect();
  if(b.right>a.left&&b.left<a.right&&b.bottom>a.top&&b.top<a.bottom)ins.classList.add('left');
}
function renderInspector(it){
  var body=document.getElementById('insBody'),empty=document.getElementById('insEmpty');
  document.getElementById('inspector').classList.toggle('has-sel',!!it);
  if(it)requestAnimationFrame(function(){if(sel()===it)insPlace(it);});
  if(!it){body.hidden=true;empty.hidden=false;insKey='';return;}
  var d=TYPES[it.type];
  var key=[it.id,it.type,(it.lanes||[]).join(''),d.color?it.color:'',it.state||'',it.beacon===false,!!it.solid,!!it.dash,it.blink||'',!!it.brake,it.side||'',it.order||'',it.route||'',scene].join('|');
  if(key===insKey){syncInspector(it);return;}
  insKey=key;empty.hidden=true;body.hidden=false;
  var h='<div class="ins-head"><h2>'+escHtml(itemLabel(it))+'</h2><button class="btn ghost icon" type="button" data-act="close" title="Sluiten (Esc)" aria-label="Sluiten">'+IC('x')+'</button></div>';
  if(d.stretch){
    if(d.stretch.indexOf('w')>-1)h+=insField('Breedte','<input type="range" data-k="w" min="20" max="1400" step="5" aria-label="Breedte">','w');
    if(d.stretch.indexOf('h')>-1)h+=insField('Lengte','<input type="range" data-k="h" min="20" max="1600" step="5" aria-label="Lengte">','h');
  }else h+=insField('Grootte','<input type="range" data-k="s" min="30" max="350" step="5" aria-label="Grootte">','s');
  h+=insField('Draaiing','<div class="ins-row"><input type="range" data-k="rot" min="0" max="355" step="5" aria-label="Draaiing">'+
    '<button class="btn icon" type="button" data-act="rotl" title="Kwartslag naar links" aria-label="Kwartslag naar links">'+IC('rotl')+'</button>'+
    '<button class="btn icon" type="button" data-act="rotr" title="Kwartslag naar rechts" aria-label="Kwartslag naar rechts">'+IC('rotr')+'</button></div>','rot');
  if(d.color)h+=insField('Kleur','<div class="sw ins-sw">'+COLORS.map(function(c){
    return '<button type="button" data-color="'+c+'"'+(c===it.color?' class="on"':'')+' style="background:'+c+'" aria-label="Kleur '+c+'"></button>';}).join('')+'</div>');
  if(it.type==='light')h+=insField('Licht','<div class="seg">'+LIGHTS.map(function(l){
    return '<button type="button" data-light="'+l[0]+'"'+((it.state||'red')===l[0]?' class="on"':'')+'>'+l[1]+'</button>';}).join('')+'</div>');
  if(d.signals){
    h+=insField('Richtingaanwijzer','<div class="seg">'+[['','Uit'],['l','Links'],['r','Rechts'],['h','Alarm']].map(function(o){
      return '<button type="button" data-blink="'+o[0]+'"'+((it.blink||'')===o[0]?' class="on"':'')+'>'+o[1]+'</button>';}).join('')+'</div>');
    h+='<label class="switch"><input type="checkbox" data-k="brake"'+(it.brake?' checked':'')+'> Remlichten aan</label>';
  }
  if(d.kind==='vehicle'||it.type==='ped'){
    h+=insField('Afspelen: vertrekt als','<div class="seg">'+[0,1,2,3,4,5].map(function(n){
      return '<button type="button" data-order="'+n+'"'+((it.order||0)===n?' class="on"':'')+'>'+(n?n+'e':'–')+'</button>';}).join('')+'</div>');
    var RT=scene==='cross'?[['l','Links af'],['s','Rechtdoor'],['r','Rechts af']]:scene==='round'?[['r','1e afrit'],['s','2e afrit'],['l','3e afrit'],['u','Keren']]:
      [['s','Rechtdoor'],['ml','Strook links'],['mr','Strook rechts'],['o','Hindernis voorbij'],['k','Kruisen'],['p','Stilstaan']].concat(countOf(['asfalt'])?[['l','Links af'],['r','Rechts af']]:[]);
    if(it.order&&RT&&it.type!=='ped')h+=insField('Rijdt','<div class="seg'+(RT.length>4?' wrap':'')+'">'+RT.map(function(o){
      return '<button type="button" data-route="'+o[0]+'"'+((it.route||'s')===o[0]?' class="on"':'')+'>'+o[1]+'</button>';}).join('')+'</div>');
  }
  if(d.beacon)h+='<label class="switch"><input type="checkbox" data-k="beacon"'+(it.beacon!==false?' checked':'')+'> Zwaailicht aan (prioritair)</label>';
  if(it.type==='c43')h+=insField('Maximumsnelheid','<select data-k="speed" aria-label="Maximumsnelheid">'+SPEEDS.map(function(v){
    return '<option value="'+v+'"'+((it.text||'50')===v?' selected':'')+'>'+v+' km/u</option>';}).join('')+'</select>');
  if(it.type==='b15')h+=insField('Zijweg','<div class="b15grid">'+B15LIST.map(function(o){
    return '<button type="button" data-b15="'+o[0]+'"'+((it.side||'a')===o[0]?' class="on"':'')+' title="'+o[1]+' (B15'+o[0]+')" aria-label="'+o[1]+'">'+
      '<svg viewBox="-40 -92 80 78" aria-hidden="true">'+TYPES.b15.draw({side:o[0]})+'</svg></button>';}).join('')+'</div>');
  if(it.type==='tag')h+=insField('Letter','<input class="ins-text" type="text" data-k="text" maxlength="2" value="'+escHtml(it.text||'A')+'" aria-label="Letter">');
  if(it.type==='lanesign'){
    var L=it.lanes||['s','s'];
    h+=insField('Rijstroken <small>klik om de pijl te wisselen</small>','<div class="lanes">'+L.map(function(c,i){
      return '<button class="btn" type="button" data-lane="'+i+'" title="Pijl van rijstrook '+(i+1)+' wijzigen">'+LANECH[c]+'</button>';}).join('')+
      (L.length<6?'<button class="btn icon" type="button" data-act="laneadd" title="Rijstrook erbij" aria-label="Rijstrook erbij">'+IC('plus')+'</button>':'')+
      (L.length>1?'<button class="btn icon" type="button" data-act="lanedel" title="Laatste rijstrook weg" aria-label="Laatste rijstrook weg">'+IC('minus')+'</button>':'')+'</div>');
    h+='<label class="switch"><input type="checkbox" data-k="solid"'+(it.solid?' checked':'')+'> Volle lijnen tussen de stroken</label>';
  }
  if(it.type==='routepijl')h+='<label class="switch"><input type="checkbox" data-k="dash"'+(it.dash?' checked':'')+'> Streepjeslijn</label>';
  if(isPts(it))h+='<button class="btn" type="button" data-act="shape">Andere vorm</button>';
  h+='<div class="ins-actions"><button class="btn" type="button" data-act="dup">'+IC('copy')+'<span>Kopie</span></button>'+
    '<button class="btn danger" type="button" data-act="del">'+IC('trash')+'<span>Verwijderen</span></button></div>';
  body.innerHTML=h;
  syncInspector(it);
}
function syncInspector(it){
  var body=document.getElementById('insBody');
  [].forEach.call(body.querySelectorAll('input[type=range]'),function(r){
    var k=r.getAttribute('data-k');
    r.value=k==='s'?Math.round(it.s*100):Math.round(it[k]||0);
  });
  [].forEach.call(body.querySelectorAll('output[data-o]'),function(o){
    var k=o.getAttribute('data-o');
    o.textContent=k==='s'?Math.round(it.s*100)+'%':(k==='rot'?Math.round(it.rot)+'°':Math.round(it[k]||0));
  });
}
(function(){
  var body=document.getElementById('insBody');
  /* schuifbalken: één schuifbeweging = één stap voor "ongedaan maken" */
  body.addEventListener('input',function(e){
    var el=e.target,k=el.getAttribute('data-k'),it=sel();if(!it||!k)return;
    if(el.type==='range'){
      if(insBefore===null)insBefore=snap();
      var v=+el.value;
      if(k==='s')it.s=v/100;else if(k==='rot')it.rot=v;else it[k]=v;
      render();
    }else if(k==='text'){
      var t=el.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,2);
      mutate(function(){it.text=t||'A';});
    }
  });
  body.addEventListener('change',function(e){
    var el=e.target,k=el.getAttribute('data-k'),it=sel();if(!it||!k)return;
    if(el.type==='range'){
      if(insBefore!==null&&snap()!==insBefore)pushHistory(insBefore);
      insBefore=null;updateToolbar(it);
    }else if(k==='beacon')mutate(function(){if(el.checked)delete it.beacon;else it.beacon=false;});
    else if(k==='solid')mutate(function(){it.solid=el.checked;});
    else if(k==='brake')mutate(function(){if(el.checked)it.brake=true;else delete it.brake;});
    else if(k==='dash')mutate(function(){it.dash=el.checked;});
    else if(k==='speed')mutate(function(){it.text=el.value;});
  });
  body.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    var it=sel();if(!it)return;
    if(b.hasAttribute('data-color')){
      var c=b.getAttribute('data-color');curColor=c;renderSwatches();renderTiles();
      mutate(function(){it.color=c;});return;
    }
    if(b.hasAttribute('data-blink')){var bl=b.getAttribute('data-blink');mutate(function(){if(bl)it.blink=bl;else delete it.blink;});return;}
    if(b.hasAttribute('data-order')){var on=+b.getAttribute('data-order');mutate(function(){if(on)it.order=on;else{delete it.order;delete it.route;}});return;}
    if(b.hasAttribute('data-route')){var ro=b.getAttribute('data-route');mutate(function(){it.route=ro;});return;}
    if(b.hasAttribute('data-b15')){var sd=b.getAttribute('data-b15');mutate(function(){it.side=sd;});return;}
    if(b.hasAttribute('data-light')){var st=b.getAttribute('data-light');mutate(function(){it.state=st;});return;}
    if(b.hasAttribute('data-lane')){
      var i=+b.getAttribute('data-lane');
      mutate(function(){it.lanes=(it.lanes||['s','s']).slice();it.lanes[i]=LANECYC[(LANECYC.indexOf(it.lanes[i])+1)%LANECYC.length];});return;
    }
    var act=b.getAttribute('data-act');
    if(act==='close'){selId=null;render();return;}
    if(act==='rotl')mutate(function(){it.rot=((it.rot-90)%360+360)%360;});
    else if(act==='rotr')mutate(function(){it.rot=(it.rot+90)%360;});
    else if(act==='laneadd')mutate(function(){it.lanes=(it.lanes||['s','s']).concat('s');});
    else if(act==='lanedel')mutate(function(){it.lanes=(it.lanes||['s','s']).slice(0,-1);});
    else if(act==='shape')mutate(function(){var arr=it.type==='routepijl'?ROUTES:SHAPES;it.shape=((it.shape==null?1:it.shape)+1)%arr.length;it.pts=copyPts(arr[it.shape]);});
    else if(act==='dup')dup();
    else if(act==='del')del();
  });
})();

/* ---------- slepen op het tekenvlak ---------- */
function pt(e){
  var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
  var r=p.matrixTransform(svg.getScreenCTM().inverse());return {x:r.x,y:r.y};
}
function toLocal(p,it){
  var a=it.rot*Math.PI/180,dx=p.x-it.x,dy=p.y-it.y;
  return {x:dx*Math.cos(a)+dy*Math.sin(a),y:-dx*Math.sin(a)+dy*Math.cos(a)};
}
var lastV=null;
svg.addEventListener('pointerdown',function(e){
  if(play){stopPlay();}
  if(e.button!==0)return;
  var h=e.target.closest('[data-h]'),g=e.target.closest('#items [data-id]'),p=pt(e);
  if(h&&selId!==null){
    var it=find(selId),mode=h.getAttribute('data-h'),b=baseDims(it),lp=toLocal(p,it),before=snap();
    if(mode.indexOf('v:')===0){
      var vi=+mode.slice(2),now=Date.now();
      if(lastV&&lastV.id===selId&&lastV.i===vi&&now-lastV.t<400&&it.pts.length>(it.type==='vlak'?3:2)){
        pushHistory(before);it.pts.splice(vi,1);lastV=null;normV(it);render();e.preventDefault();return;
      }
      lastV={id:selId,i:vi,t:now};
      drag={mode:'vertex',id:selId,i:vi,before:before};
    }else if(mode.indexOf('m:')===0){
      var mi=+mode.slice(2),pp=it.pts,a=pp[mi],b2=pp[(mi+1)%pp.length];
      pp.splice(mi+1,0,[(a[0]+b2[0])/2,(a[1]+b2[1])/2]);
      drag={mode:'vertex',id:selId,i:mi+1,before:before};
    }else if(mode==='rotate'||mode==='resize'){
      drag={mode:mode,id:selId,s0:it.s,d0:Math.max(10,Math.hypot(p.x-it.x,p.y-it.y)),before:before};
    }else{
      var sgx=mode==='w+'||mode==='wh'?1:(mode==='w-'?-1:0),sgy=mode==='h+'||mode==='wh'?1:(mode==='h-'?-1:0);
      drag={mode:'stretch',id:selId,sgx:sgx,sgy:sgy,w0:b[0],h0:b[1],cx:it.x,cy:it.y,
        ox:sgx?lp.x-sgx*(b[0]/2+8):0,oy:sgy?lp.y-sgy*(b[1]/2+8):0,before:before};
    }
  }else if(g){
    var id=+g.getAttribute('data-id'),item=find(id),idx=items.indexOf(item);
    if(idx<items.length-1){items.push(items.splice(idx,1)[0]);}
    selId=id;drag={mode:'move',id:id,dx:p.x-item.x,dy:p.y-item.y,before:snap()};
    render();
  }else{selId=null;render();return;}
  try{svg.setPointerCapture(e.pointerId);}catch(x){}
  e.preventDefault();
});
svg.addEventListener('pointermove',function(e){
  if(!drag)return;
  var it=find(drag.id);if(!it)return;
  var p=pt(e);
  if(drag.mode==='move'){it.x=clamp(p.x-drag.dx,0,W);it.y=clamp(p.y-drag.dy,0,H);}
  else if(drag.mode==='resize'){it.s=clamp(drag.s0*Math.hypot(p.x-it.x,p.y-it.y)/drag.d0,.3,3.5);}
  else if(drag.mode==='rotate'){
    var a=Math.atan2(p.y-it.y,p.x-it.x)*180/Math.PI+90;
    a=((a%360)+360)%360;
    if(e.shiftKey)a=Math.round(a/15)*15;
    else[0,90,180,270,360].forEach(function(k){if(Math.abs(a-k)<6)a=k;});
    it.rot=Math.round(a)%360;
  }else if(drag.mode==='vertex'){var lq=toLocal(p,it);it.pts[drag.i]=[lq.x/it.s,lq.y/it.s];}
  else if(drag.mode==='stretch'){
    var c={x:drag.cx,y:drag.cy,rot:it.rot},lp=toLocal(p,c),sx=0,sy=0,ra=it.rot*Math.PI/180;
    if(drag.sgx){
      var ex=lp.x-drag.ox-drag.sgx*8,nw=clamp(drag.sgx*ex+drag.w0/2,20,1400);
      it.w=Math.round(nw);sx=drag.sgx*(it.w-drag.w0)/2;
    }
    if(drag.sgy){
      var ey=lp.y-drag.oy-drag.sgy*8,nh=clamp(drag.sgy*ey+drag.h0/2,20,1600);
      it.h=Math.round(nh);sy=drag.sgy*(it.h-drag.h0)/2;
    }
    it.x=drag.cx+sx*Math.cos(ra)-sy*Math.sin(ra);
    it.y=drag.cy+sx*Math.sin(ra)+sy*Math.cos(ra);
  }
  scheduleRender();
});
function endDrag(){
  if(!drag)return;
  if(drag.mode==='vertex'){var vt=find(drag.id);if(vt)normV(vt);}
  if(snap()!==drag.before)pushHistory(drag.before);
  drag=null;render();
}
svg.addEventListener('pointerup',endDrag);
svg.addEventListener('pointercancel',endDrag);

/* ---------- slepen vanuit de lijst ---------- */
var pend=null,ghost=null,suppressClick=false;
document.getElementById('palette').addEventListener('pointerdown',function(e){
  var t=e.target.closest('.tile');if(!t||e.button!==0)return;
  pend={key:t.getAttribute('data-key'),x:e.clientX,y:e.clientY,svg:t.querySelector('svg').outerHTML};
  window.addEventListener('pointermove',palMove);window.addEventListener('pointerup',palUp);window.addEventListener('pointercancel',palCancel);
});
function palMove(e){
  if(!pend)return;
  if(!ghost&&Math.hypot(e.clientX-pend.x,e.clientY-pend.y)>6){
    ghost=document.createElement('div');ghost.className='dragghost';ghost.innerHTML=pend.svg;document.body.appendChild(ghost);
  }
  if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}
}
function palCleanup(){
  window.removeEventListener('pointermove',palMove);window.removeEventListener('pointerup',palUp);window.removeEventListener('pointercancel',palCancel);
  if(ghost){ghost.remove();ghost=null;}
}
function palCancel(){pend=null;palCleanup();}
function palUp(e){
  var p=pend,wasDrag=!!ghost;pend=null;palCleanup();
  if(!p)return;
  var entry=ENTRY[p.key];
  if(wasDrag){
    var r=svg.getBoundingClientRect();
    if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){
      var q=pt(e);addItem(entry,q.x,q.y);
    }
  }else{addItem(entry);}
  suppressClick=true;setTimeout(function(){suppressClick=false;},0);
}
document.getElementById('palette').addEventListener('click',function(e){
  var t=e.target.closest('.tile');if(!t||suppressClick)return;
  if(e.detail===0)addItem(ENTRY[t.getAttribute('data-key')]);
});

/* ---------- werkbalk ---------- */
function sel(){return find(selId);}
function scaleItem(it,f){
  var d=TYPES[it.type];
  if(d.stretch){
    if(d.stretch.indexOf('w')>-1)it.w=Math.round(clamp(it.w*f,20,1400));
    if(d.stretch.indexOf('h')>-1)it.h=Math.round(clamp(it.h*f,20,1600));
  }else it.s=clamp(it.s*f,.3,3.5);
}
function dup(){
  var it=sel();if(!it)return;
  pushHistory(snap());
  var c=JSON.parse(JSON.stringify(it));c.id=++uid;c.x=clamp(c.x+36,0,W);c.y=clamp(c.y+36,0,H);
  items.push(c);selId=c.id;render();
}
function del(){var it=sel();if(!it)return;mutate(function(){items=items.filter(function(i){return i.id!==it.id;});store[scene].items=items;selId=null;});}
function undo(){
  stopPlay();if(!undoStack.length)return;
  redoStack.push(snap());restore(undoStack.pop());
}
function redo(){
  stopPlay();if(!redoStack.length)return;
  undoStack.push(snap());restore(redoStack.pop());
}
document.getElementById('bUndo').onclick=undo;
document.getElementById('bRedo').onclick=redo;
document.getElementById('bClear').onclick=function(){
  if(!items.length)return;autoKeep();pushHistory(snap());items=[];store[scene].items=items;store[scene].preset=null;selId=null;drawBase();render();
};

document.addEventListener('keydown',function(e){
  var tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='select'||tag==='textarea'||!modal.hidden)return;
  if(document.body.classList.contains('present')){
    if(e.key===' '&&playGroups().length){e.preventDefault();if(play&&!play.moving&&play.gi>=play.groups.length)stopPlay();else playStep(false);return;}
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();presStep(1);return;}
    if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();presStep(-1);return;}
    if(e.key==='Escape'){setPresent(false);return;}
    if(e.key.toLowerCase()==='p'&&!e.ctrlKey&&!e.metaKey){inkPen(!ink.on);return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&ink.strokes.length){e.preventDefault();ink.strokes.pop();inkRender();return;}
  }
  var k=e.key.toLowerCase();
  if((e.ctrlKey||e.metaKey)&&(k==='y'||(k==='z'&&e.shiftKey))){e.preventDefault();redo();return;}
  if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();undo();return;}
  var it=sel();if(!it)return;
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();del();}
  else if(e.key==='Escape'){selId=null;render();}
  else if(e.key==='+'||e.key==='='){mutate(function(){scaleItem(it,1.1);});}
  else if(e.key==='-'){mutate(function(){scaleItem(it,1/1.1);});}
  else if(e.key.indexOf('Arrow')===0&&tag!=='button'){
    e.preventDefault();var st=e.shiftKey?20:4;
    mutate(function(){
      if(e.key==='ArrowLeft')it.x=clamp(it.x-st,0,W);
      if(e.key==='ArrowRight')it.x=clamp(it.x+st,0,W);
      if(e.key==='ArrowUp')it.y=clamp(it.y-st,0,H);
      if(e.key==='ArrowDown')it.y=clamp(it.y+st,0,H);
    });
  }
});

/* ---------- situaties: kruispunt of rechte weg ---------- */
function drawBase(){
  var road=scene==='road',round=scene==='round',a=document.getElementById('rAsph'),v=roadS.orient==='v',w=roadS.roadW;
  document.getElementById('base-cross').setAttribute('display',scene==='cross'?'inline':'none');
  document.getElementById('base-road').setAttribute('display',road?'inline':'none');
  document.getElementById('base-round').setAttribute('display',round?'inline':'none');
  if(round)drawRound();
  if(v){a.setAttribute('x',CX-w/2);a.setAttribute('y',0);a.setAttribute('width',w);a.setAttribute('height',H);}
  else{a.setAttribute('x',0);a.setAttribute('y',CY-w/2);a.setAttribute('width',W);a.setAttribute('height',w);}
  document.getElementById('sCross').className=scene==='cross'?'on':'';
  document.getElementById('sRoad').className=road?'on':'';
  document.getElementById('sRound').className=round?'on':'';
  document.getElementById('roadbar').hidden=!road;
  document.getElementById('crossbar').hidden=scene!=='cross';
  document.getElementById('roundbar').hidden=!round;
  document.getElementById('roundR').value=store.round.R;
  document.getElementById('roundBike').value=store.round.bike||'';

  drawCross();
  document.getElementById('roadW').value=w;
  presetButtons();
  document.getElementById('oV').className='btn'+(v?' on':'');
  document.getElementById('oH').className='btn'+(v?'':' on');
}
function crossPaths(c){
  var x0=CX-c.vw/2,x1=CX+c.vw/2,y0=CY-c.hw/2,y1=CY+c.hw/2,r=36,arm=c.arm,d;
  var TL='M0 0H'+x0+'V'+(y0-r)+'A'+r+' '+r+' 0 0 1 '+(x0-r)+' '+y0+'H0Z',
      TR='M'+W+' 0H'+x1+'V'+(y0-r)+'A'+r+' '+r+' 0 0 0 '+(x1+r)+' '+y0+'H'+W+'Z',
      BL='M0 '+H+'H'+x0+'V'+(y1+r)+'A'+r+' '+r+' 0 0 0 '+(x0-r)+' '+y1+'H0Z',
      BR='M'+W+' '+H+'H'+x1+'V'+(y1+r)+'A'+r+' '+r+' 0 0 1 '+(x1+r)+' '+y1+'H'+W+'Z';
  if(arm==='top')d=['M0 0H'+W+'V'+y0+'H0Z',BL,BR];
  else if(arm==='bottom')d=[TL,TR,'M0 '+y1+'H'+W+'V'+H+'H0Z'];
  else if(arm==='left')d=['M0 0H'+x0+'V'+H+'H0Z',TR,BR];
  else if(arm==='right')d=[TL,BL,'M'+x1+' 0H'+W+'V'+H+'H'+x1+'Z'];
  else d=[TL,TR,BL,BR];
  return d.map(function(q){return '<path d="'+q+'"/>';}).join('');
}
function crossSvg(c){
  var h=crossPaths(c);
  return '<rect width="1000" height="860" fill="#6f6a64"/><g stroke="#b7a578" stroke-width="6" stroke-linejoin="round" fill="#dccda6">'+h+'</g><g fill="url(#paving)">'+h+'</g>';
}
function roadSvg(s){
  var w=s.roadW,v=s.orient!=='h';
  return '<rect width="1000" height="860" fill="#93c9a4"/>'+(v?'<rect x="'+(CX-w/2)+'" y="0" width="'+w+'" height="'+H+'" fill="#6f6a64"/>':'<rect x="0" y="'+(CY-w/2)+'" width="'+W+'" height="'+w+'" fill="#6f6a64"/>');
}
function drawCross(){
  var c=store.cross,arm=c.arm;
  if(arm&&dir===arm&&typeof renderDpad==='function'){dir={top:'bottom',bottom:'top',left:'right',right:'left'}[arm];renderDpad();}
  var h=crossPaths(c);
  document.getElementById('cStroke').innerHTML=h;document.getElementById('cFill').innerHTML=h;
  document.getElementById('kType4').className='btn'+(arm?'':' on');
  document.getElementById('kTypeT').className='btn'+(arm?' on':'');
  document.getElementById('tSide').hidden=!arm;
  var stem={top:'bottom',bottom:'top',left:'right',right:'left'}[arm];
  document.querySelectorAll('[data-stem]').forEach(function(b){b.className='btn'+(b.getAttribute('data-stem')===stem?' on':'');});
  document.getElementById('crossVW').value=c.vw;document.getElementById('crossHW').value=c.hw;
}
/* afstand van het midden tot elke zijde van het achthoekige aparte fietspad */
var BIKE_D=330;
/* rotonde: armen met stoeprand, middeneiland met overrijdbare rand, druppelvormige middengeleiders */
function drawRound(){document.getElementById('base-round').innerHTML=roundSvg(store.round.R,store.round.bike);}
function roundSvg(R,bike){
  var ri=Math.round(R*.48),kerb='#b7a578',g='',
      shapes='<rect x="380" y="0" width="240" height="860"/><rect x="0" y="310" width="1000" height="240"/><circle cx="500" cy="430" r="'+R+'"/>';
  g+='<rect width="1000" height="860" fill="#dccda6"/><rect width="1000" height="860" fill="url(#paving)"/>';
  g+='<g fill="#6f6a64" stroke="'+kerb+'" stroke-width="12">'+shapes+'</g><g fill="#6f6a64">'+shapes+'</g>';
  g+='<circle cx="500" cy="430" r="'+(ri+22)+'" fill="#948f87" stroke="#d9d5cb" stroke-width="3"/>';
  g+='<circle cx="500" cy="430" r="'+ri+'" fill="#7fb782" stroke="#d9d5cb" stroke-width="6"/>';
  var apart=bike==='apart',D=BIKE_D,isl='fill="#7fb782" stroke="#d9d5cb" stroke-width="4" stroke-linejoin="round"';
  [0,90,180,270].forEach(function(r){
    var t='<g transform="rotate('+r+' 500 430)">';
    if(apart){
      /* middengeleider onderbroken voor de fietsoversteek: een stuk tussen ring en oversteek, een stuk erna */
      var c1=430+D-16,c2=430+D+16;
      t+='<path d="M486 '+c1+'L514 '+c1+'L519 '+(430+R+26)+'Q500 '+(430+R+4)+' 481 '+(430+R+26)+'Z" '+isl+'/>';
      t+='<path d="M486 '+c2+'L514 '+c2+'L500 '+(c2+44)+'Z" '+isl+'/>';
    }else{
      t+='<path d="M500 '+(430+R+96)+'L519 '+(430+R+26)+'Q500 '+(430+R+4)+' 481 '+(430+R+26)+'Z" '+isl+'/>';
    }
    g+=t+'</g>';
  });
  if(bike==='ring'){
    /* fietspad op de rotonde: rode strook langs de buitenrand van de ring, rondom, met aan beide zijden een witte onderbroken lijn */
    g+='<circle cx="500" cy="430" r="'+(R-15)+'" fill="none" stroke="#b85c46" stroke-width="28"/>';
    g+='<g fill="none" stroke="#f3f3ee" stroke-width="4" stroke-dasharray="14 10"><circle cx="500" cy="430" r="'+(R-31)+'"/><circle cx="500" cy="430" r="'+(R-3)+'"/></g>';
  }
  if(apart){
    /* vrijliggend fietspad: een achthoek zoals een stopbord; de platte zijden steken de armen recht over.
       Op de oversteek zelf ligt gewoon asfalt met aan beide kanten witte blokjes; het fietspad ernaast is rood. */
    var o='',pts=[],k,rv=D/Math.cos(Math.PI/8);
    for(k=0;k<8;k++){var a=(22.5+45*k)*Math.PI/180;pts.push((500+rv*Math.cos(a)).toFixed(1)+','+(430+rv*Math.sin(a)).toFixed(1));}
    g+='<polygon points="'+pts.join(' ')+'" fill="none" stroke="#b85c46" stroke-width="28" stroke-linejoin="round"/>';
    g+='<g fill="#6f6a64"><rect x="380" y="'+(430+D-15)+'" width="240" height="30"/><rect x="380" y="'+(430-D-15)+'" width="240" height="30"/>'+
      '<rect x="'+(500+D-15)+'" y="310" width="30" height="240"/><rect x="'+(500-D-15)+'" y="310" width="30" height="240"/></g>';
    [-9,9].forEach(function(k){
      [430+D+k,430-D+k].forEach(function(y){o+='M380 '+y+'H620';});
      [500+D+k,500-D+k].forEach(function(x){o+='M'+x+' 310V550';});
    });
    g+='<path d="'+o+'" fill="none" stroke="#f3f3ee" stroke-width="10" stroke-dasharray="10 10"/>';
  }
  return g;
}
var OPP={top:'bottom',bottom:'top',left:'right',right:'left'};
function setArm(a){
  mutate(function(){store.cross.arm=a;});
  if(a&&dir===a){dir=OPP[a];}
  drawCross();renderDpad();renderTiles();
}
document.getElementById('kType4').onclick=function(){setArm(null);};
document.getElementById('kTypeT').onclick=function(){if(!store.cross.arm)setArm('top');};
document.getElementById('tSide').addEventListener('click',function(e){
  var b=e.target.closest('[data-stem]');if(!b)return;
  setArm(OPP[b.getAttribute('data-stem')]);
});
/* Een schuifbeweging telt als één stap voor "ongedaan maken". */
var sliderBefore=null;
function slider(id,fn){
  var el=document.getElementById(id);
  el.addEventListener('input',function(){if(sliderBefore===null)sliderBefore=snap();fn(+el.value);saveState();});
  el.addEventListener('change',function(){
    if(sliderBefore!==null&&snap()!==sliderBefore)pushHistory(sliderBefore);
    sliderBefore=null;updateToolbar(find(selId));
  });
}
slider('crossVW',function(v){store.cross.vw=v;drawCross();});
slider('crossHW',function(v){store.cross.hw=v;drawCross();});
function setScene(name){
  if(name===scene)return;
  stopPlay();
  store[scene].items=items;scene=name;items=store[scene].items;
  undoStack=[];redoStack=[];selId=null;drawBase();renderDpad();render();
}
document.getElementById('sCross').onclick=function(){setScene('cross');};
document.getElementById('sRoad').onclick=function(){setScene('road');};
document.getElementById('sRound').onclick=function(){setScene('round');};
slider('roundR',function(v){store.round.R=v;drawRound();});
document.getElementById('roundBike').addEventListener('change',function(e){
  var v=e.target.value;mutate(function(){store.round.bike=v;});drawRound();
});
slider('roadW',function(v){roadS.roadW=v;drawBase();});
function setOrient(o){mutate(function(){roadS.orient=o;});drawBase();}
document.getElementById('oV').onclick=function(){setOrient('v');};
document.getElementById('oH').onclick=function(){setOrient('h');};

/* ---------- voorbeeldsituaties ---------- */
var PSETS={cross:{list:XPRESETS,el:'presetC'},road:{list:PRESETS,el:'preset'},round:{list:RPRESETS,el:'presetR'}};
function curPreset(){var id=store[scene].preset;return PSETS[scene].list.filter(function(p){return p.id===id;})[0]||null;}
function applyPreset(p){
  stopPlay();autoKeep();pushHistory(snap());
  var st=store[scene];
  if(scene==='cross'){st.vw=p.vw;st.hw=p.hw;st.arm=p.arm;}
  else if(scene==='road'){st.roadW=p.roadW;st.orient='v';}
  else{st.R=p.R||250;st.bike=p.bike||'';}
  st.preset=p.id;
  items=p.build();items.forEach(function(i){i.id=++uid;});
  st.items=items;selId=null;drawBase();renderDpad();render();presLabel();
}
/* de knop "Voorbeelden" toont de naam van het gekozen voorbeeld */
function presetButtons(){
  Object.keys(PSETS).forEach(function(k){
    var id=store[k].preset,p=PSETS[k].list.filter(function(x){return x.id===id;})[0];
    document.getElementById(PSETS[k].el).querySelector('span').textContent=p?p.label:'Voorbeelden';
  });
}
Object.keys(PSETS).forEach(function(k){
  document.getElementById(PSETS[k].el).addEventListener('click',function(){openGallery(k);});
});

/* leeg tekenvlak voor de huidige situatie (ongedaan maken brengt de vorige tekening terug) */
function startEmpty(){
  stopPlay();autoKeep();if(items.length)pushHistory(snap());
  items=[];store[scene].items=items;store[scene].preset=null;selId=null;drawBase();render();presLabel();
}

/* ---------- galerij met miniaturen ---------- */
var SCENE_NAMES={cross:'Kruispunt',road:'Rechte weg',round:'Rotonde'},thumbSeq=0;
function sceneDefaults(k,p){
  if(k==='cross')return p?{vw:p.vw,hw:p.hw,arm:p.arm}:{vw:240,hw:240,arm:null};
  if(k==='road')return {roadW:p?p.roadW:280,orient:'v'};
  return {R:p&&p.R||250,bike:p&&p.bike||''};
}
function thumbSvg(k,p){return thumbOf(k,sceneDefaults(k,p),p?p.build():[]);}
function thumbOf(k,s,its){
  var base=k==='cross'?crossSvg(s):(k==='road'?roadSvg(s):roundSvg(s.R||250,s.bike||''));
  its=its.map(function(it){var c=JSON.parse(JSON.stringify(it));c.id=90000+(++thumbSeq);return c;});
  return '<svg viewBox="0 0 1000 860" aria-hidden="true">'+base+its.sort(byLayer).map(itemSvg).join('')+'</svg>';
}

function openGallery(which){
  which=which||scene;
  var c=openDialog('<h2 id="modalTitle">Kies een voorbeeld</h2>'+
    '<div class="seg gal-tabs" role="group" aria-label="Situatie">'+Object.keys(PSETS).map(function(k){
      return '<button type="button" data-gs="'+k+'">'+SCENE_NAMES[k]+'</button>';}).join('')+'</div>'+
    '<div class="gal" id="gal"></div>'+
    '<div class="row"><button class="btn" type="button" data-close>Sluiten</button></div>','wide');
  function fill(k){
    which=k;
    [].forEach.call(c.querySelectorAll('[data-gs]'),function(b){b.classList.toggle('on',b.getAttribute('data-gs')===k);});
    var cur=store[k].preset;
    c.querySelector('#gal').innerHTML=
      '<button class="gal-card" type="button" data-empty="1"><div class="gal-thumb">'+thumbSvg(k,null)+'</div><b>Leeg beginnen</b><span>'+SCENE_NAMES[k]+' zonder onderdelen</span></button>'+
      PSETS[k].list.map(function(p){
        return '<button class="gal-card'+(p.id===cur?' on':'')+'" type="button" data-pid="'+p.id+'"><div class="gal-thumb">'+thumbSvg(k,p)+'</div>'+
          '<b>'+escHtml(p.label)+'</b>'+(p.q?'<span class="badge">Met meerkeuzevraag</span>':'')+'</button>';
      }).join('');
  }
  fill(which);
  c.addEventListener('click',function(e){
    var t=e.target.closest('[data-gs]');if(t){fill(t.getAttribute('data-gs'));return;}
    var card=e.target.closest('[data-pid],[data-empty]');if(!card)return;
    var k=which;closeModal();
    if(scene!==k)setScene(k);
    if(card.hasAttribute('data-empty'))startEmpty();
    else applyPreset(PSETS[k].list.filter(function(p){return p.id===card.getAttribute('data-pid');})[0]);
  });
}

/* ---------- pen in de presentatiemodus: schrijven en aanduiden op het digibord ----------
   De lijnen liggen boven de tekening, horen er niet bij en verdwijnen bij een ander voorbeeld of na de presentatie. */
var ink={on:false,col:'#e3262e',strokes:[],cur:null},inkLayer=document.getElementById('ink');
function inkPts(st){return st.p.map(function(q){return q.x.toFixed(1)+','+q.y.toFixed(1);}).join(' ');}
function inkLine(st){return '<polyline points="'+inkPts(st)+'" fill="none" stroke="'+st.c+'" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';}
function inkRender(){inkLayer.innerHTML=ink.strokes.map(inkLine).join('');inkUI();}
function inkUI(){
  var pen=document.getElementById('pPen');pen.classList.toggle('on',ink.on);pen.setAttribute('aria-pressed',ink.on);
  document.getElementById('pInkCols').hidden=!ink.on;
  document.getElementById('pInkUndo').hidden=!ink.strokes.length;
  document.getElementById('pInkClear').hidden=!ink.strokes.length;
  document.querySelectorAll('#pInkCols [data-ink]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-ink')===ink.col);});
  document.body.classList.toggle('inking',ink.on&&document.body.classList.contains('present'));
}
function inkClear(){ink.strokes=[];ink.cur=null;inkRender();}
function inkPen(on){ink.on=on;inkUI();}
/* luisteraars in de vangfase: zolang de pen aan staat, gaat niets door naar het verslepen van onderdelen */
svg.addEventListener('pointerdown',function(e){
  if(!ink.on||!document.body.classList.contains('present'))return;
  e.stopImmediatePropagation();e.preventDefault();
  if(play)stopPlay();
  try{svg.setPointerCapture(e.pointerId);}catch(er){}
  ink.cur={c:ink.col,p:[pt(e)]};ink.strokes.push(ink.cur);
  inkLayer.insertAdjacentHTML('beforeend',inkLine(ink.cur));
},true);
svg.addEventListener('pointermove',function(e){
  if(!ink.cur)return;
  e.stopImmediatePropagation();
  var q=pt(e),l=ink.cur.p[ink.cur.p.length-1];
  if(Math.hypot(q.x-l.x,q.y-l.y)<2.5)return;
  ink.cur.p.push(q);inkLayer.lastChild.setAttribute('points',inkPts(ink.cur));
},true);
function inkEnd(e){if(!ink.cur)return;e.stopImmediatePropagation();ink.cur=null;inkUI();}
svg.addEventListener('pointerup',inkEnd,true);
svg.addEventListener('pointercancel',inkEnd,true);
document.getElementById('pPen').onclick=function(){inkPen(!ink.on);};
document.getElementById('pInkCols').onclick=function(e){var b=e.target.closest('[data-ink]');if(!b)return;ink.col=b.getAttribute('data-ink');inkPen(true);};
document.getElementById('pInkUndo').onclick=function(){ink.strokes.pop();inkRender();};
document.getElementById('pInkClear').onclick=inkClear;

/* ---------- presentatiemodus: alleen de tekening, schermvullend; pijltjes = vorig/volgend voorbeeld ---------- */
function presLabel(){var p=curPreset();document.getElementById('pLabel').textContent=p?p.label:'Eigen tekening';}
function presStep(d){
  var L=PSETS[scene].list,p=curPreset(),i=p?L.indexOf(p):-1;
  i=i<0?(d>0?0:L.length-1):(i+d+L.length)%L.length;
  inkClear();applyPreset(L[i]);
}
function setPresent(on){
  document.body.classList.toggle('present',on);
  if(!on){inkClear();inkPen(false);}
  if(on){
    selId=null;render();presLabel();
    var el=document.documentElement;
    if(el.requestFullscreen&&!document.fullscreenElement)el.requestFullscreen().catch(function(){});
  }else if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});
}
document.addEventListener('fullscreenchange',function(){
  if(!document.fullscreenElement&&document.body.classList.contains('present'))setPresent(false);
});
document.getElementById('bPresent').onclick=function(){setPresent(true);};
document.getElementById('pExit').onclick=function(){setPresent(false);};
document.getElementById('pPrev').onclick=function(){presStep(-1);};
document.getElementById('pNext').onclick=function(){presStep(1);};

/* ---------- afspelen: voertuigen vertrekken stap voor stap in de ingestelde volgorde ---------- */
/* it.order = 1, 2, 3 … (gelijke nummers rijden samen); it.route = s rechtdoor, l links, r rechts, u keren (rotonde) */
var play=null,playRaf=0;
var PLAYSPEED={ped:80,ruiter:110,bike:170,brom:210,tram:220};
function movers(){return items.filter(function(o){return o.order;});}
function playGroups(){
  var nums=[];movers().forEach(function(o){[o.order,o.order2].forEach(function(n){if(n&&nums.indexOf(n)<0)nums.push(n);});});
  return nums.sort(function(a,b){return a-b;}).map(function(n){var g=items.filter(function(o){return o.order===n||o.order2===n;}).map(function(o){return o.id;});g.n=n;return g;});
}
/* route als lijst punten in het tekenvlak, tot buiten beeld */
function routePts(it){
  var h=it.rot*Math.PI/180,r=[Math.cos(h),Math.sin(h)],f=[Math.sin(h),-Math.cos(h)];
  function W2(X,Y){return [CX+X*r[0]-Y*f[0],CY+X*r[1]-Y*f[1]];}   /* X naar rechts, Y naar achter (lokaal) */
  var X0=(it.x-CX)*r[0]+(it.y-CY)*r[1],Y0=-((it.x-CX)*f[0]+(it.y-CY)*f[1]),pts=[],q;
  var route=it.type==='ped'?'s':(it.route||'s');
  function bez(a,k,b){for(var t=0;t<=1.0001;t+=.05){var u=1-t;pts.push(W2(u*u*a[0]+2*u*t*k[0]+t*t*b[0],u*u*a[1]+2*u*t*k[1]+t*t*b[1]));}}
  /* een voetganger steekt over en blijft dan staan */
  if(it.type==='ped')return [[it.x,it.y],[it.x+f[0]*300,it.y+f[1]*300]];
  if(scene==='road'&&(route==='l'||route==='r')){var tr=roadTurn(it,route,f,r);if(tr)return clipPts(tr);}
  if(scene==='road'&&['ml','mr','o','p','k'].indexOf(route)>-1)return clipPts(roadMove(it,route,f,r));
  if(scene==='round'){
    var R=store.round.R,Rl=(Math.round(R*.48)+22+R)/2,dx=it.x-CX,dy=it.y-CY,phi,dist=Math.hypot(dx,dy);
    /* wie al op de ring rijdt (ook een fietser op het fietspad van de rotonde), blijft op zijn eigen afstand van het midden */
    var tang=dist?(dy*f[0]-dx*f[1])/dist:0;   /* 1 = rijdt mee in de draairichting van de ring */
    if(dist<=R+4&&dist>=Math.round(R*.48)+22&&tang>.7)Rl=dist;
    if(dist>Rl+4&&dx*f[0]+dy*f[1]>=0)route='s';   /* rijdt weg van de rotonde */
    else if(dist>Rl+4){
      /* rechtdoor naar de ring tot op de rijstrook */
      var b=dx*f[0]+dy*f[1],c=dx*dx+dy*dy-Rl*Rl,disc=b*b-c;
      if(disc<0)route='s';
      else{var t0=-b-Math.sqrt(disc);pts.push([it.x,it.y]);q=[it.x+f[0]*t0,it.y+f[1]*t0];pts.push(q);phi=Math.atan2(q[1]-CY,q[0]-CX);}
    }else{pts.push([it.x,it.y]);phi=Math.atan2(dy,dx);}
    if(phi!=null){
      /* uitritten: rechterrijstrook van elke arm; tegenwijzerzin = hoek neemt af */
      var base=Math.asin(Math.min(.9,60/Rl)),n={r:1,s:2,l:3,u:4}[route]||2,cand=[],k,ex;
      /* de n-de uitrit na het oprijden */
      for(k=-8;k<8;k++){var a2=base+k*Math.PI/2;if(a2<phi-.05)cand.push(a2);}
      cand.sort(function(a,b){return b-a;});ex=cand[n-1];
      var ea=ex+.3,da=ex-base;   /* vloeiend van de ring naar de uitrit */
      if(ea>phi)ea=phi;
      for(var a3=phi;a3>ea;a3-=.06)pts.push([CX+Rl*Math.cos(a3),CY+Rl*Math.sin(a3)]);
      var s0=[CX+Rl*Math.cos(ea),CY+Rl*Math.sin(ea)],e=[CX+Rl*Math.cos(ex),CY+Rl*Math.sin(ex)],e2=[e[0]+Math.cos(da)*70,e[1]+Math.sin(da)*70];
      routeExit=s0;pts.push(s0);
      for(var t1=.1;t1<=1.0001;t1+=.1){var u1=1-t1;pts.push([u1*u1*s0[0]+2*u1*t1*e[0]+t1*t1*e2[0],u1*u1*s0[1]+2*u1*t1*e[1]+t1*t1*e2[1]]);}
      pts.push([e2[0]+Math.cos(da)*1500,e2[1]+Math.sin(da)*1500]);
      return clipPts(pts);
    }
  }
  if(scene==='cross'&&route!=='s'){
    var g=G(),vert=Math.abs(Math.sin(h))<.5,eIn=vert?g.ey:g.ex,eOut=vert?g.ex:g.ey,o=X0;
    pts.push(W2(X0,Y0));
    if(route==='r'){bez([o,Math.max(eIn,o+10)],[o,o],[Math.max(eOut,o+10),o]);pts.push(W2(1500,o));}
    /* links af: ruim, voorbij het midden van het kruispunt (dat blijft links), zodat twee tegenliggers die
       allebei links afslaan achter elkaar om rijden, met de linkerkanten naar elkaar toe */
    else{pts.push(W2(o,Math.min(eIn,20)));bez([o,Math.min(eIn,20)],[o,-o-70],[-Math.max(170,o+110),-o]);pts.push(W2(-1500,-o));}
    return clipPts(pts);
  }
  pts.push([it.x,it.y]);pts.push(W2(X0,-1500));
  return clipPts(pts);
}
/* rechte weg: links of rechts afslaan in een zijweg (onderdeel "Zijweg (asfalt)") vóór het voertuig */
function roadTurn(it,route,f,r){
  var d=route==='r'?r:[-r[0],-r[1]],best=null,RW=roadS.roadW;
  var X0=(it.x-CX)*r[0]+(it.y-CY)*r[1];   /* zijwaartse afstand tot het midden van de weg */
  items.forEach(function(o){
    if(o.type!=='asfalt')return;
    var a=o.rot*Math.PI/180,ax=[Math.cos(a),Math.sin(a)],nn=[-ax[1],ax[0]],dn=f[0]*nn[0]+f[1]*nn[1];
    if(Math.abs(dn)<.7)return;   /* de zijweg moet de weg dwars kruisen */
    var t=((o.x-it.x)*nn[0]+(o.y-it.y)*nn[1])/dn;
    if(t<o.h/2*(o.s||1))return;   /* de zijweg moet vóór het voertuig liggen */
    /* reikt de zijweg tot aan de kant waar we naartoe willen? */
    var K0=[it.x+f[0]*t,it.y+f[1]*t],side=(route==='r'?RW/2-X0:RW/2+X0)+90;
    var tip=[K0[0]+d[0]*side,K0[1]+d[1]*side];
    if(Math.abs((tip[0]-o.x)*ax[0]+(tip[1]-o.y)*ax[1])>o.w/2*(o.s||1))return;
    if(!best||t<best.t)best={t:t,o:o,side:side};
  });
  if(!best)return null;
  /* rechterrijstrook van de zijweg: voor wie rechts afslaat aan de kant van waar hij komt, links af aan de overkant */
  var q=best.o.h*(best.o.s||1)/4,lane=route==='r'?best.t-q:best.t+q;
  var K=[it.x+f[0]*lane,it.y+f[1]*lane],rad=route==='r'?Math.min(70,Math.max(30,RW/2-X0-10)):Math.min(140,RW/2+X0);
  var A=[K[0]-f[0]*rad,K[1]-f[1]*rad],B=[K[0]+d[0]*rad,K[1]+d[1]*rad],pts=[[it.x,it.y]];
  if(lane-rad>0)pts.push(A);else A=[it.x,it.y];
  for(var k=1;k<=20;k++){var tt=k/20,v=1-tt;pts.push([v*v*A[0]+2*v*tt*K[0]+tt*tt*B[0],v*v*A[1]+2*v*tt*K[1]+tt*tt*B[1]]);}
  pts.push([B[0]+d[0]*1500,B[1]+d[1]*1500]);
  return pts;
}
/* rechte weg: van rijstrook wisselen (ml/mr), een hindernis voorbijrijden (o) of aan de kant stilstaan (p).
   De route bestaat uit rechte stukken en zachte S-bochten; routeBlinks = wanneer de richtingaanwijzer knippert. */
var LANE=128,routeBlinks=null;
function roadMove(it,route,f,r){
  var pts=[[it.x,it.y]],pos=[it.x,it.y],len=0,lat=0,bl=[];
  function straight(d){if(d<=0)return;pos=[pos[0]+f[0]*d,pos[1]+f[1]*d];pts.push(pos);len+=d;}
  /* S-bocht: over afstand d vooruit, dx zijwaarts (+ = naar rechts) */
  function curve(d,dx){
    var p0=pos;for(var k=1;k<=16;k++){var t=k/16,e=(1-Math.cos(Math.PI*t))/2;pts.push([p0[0]+f[0]*d*t+r[0]*dx*e,p0[1]+f[1]*d*t+r[1]*dx*e]);}
    pos=pts[pts.length-1];bl.push([len-60,len+Math.hypot(d,dx)*.8,dx<0?'l':'r']);len+=Math.hypot(d,dx);lat+=dx;
  }
  if(route==='ml'||route==='mr'){straight(120);curve(220,route==='ml'?-LANE:LANE);straight(1500);}
  /* kruisen op een smalle weg: even naar rechts uitwijken en terug naar het midden, zonder richtingaanwijzer */
  else if(route==='k'){straight(10);curve(120,62);straight(90);curve(120,-62);straight(1500);bl=[];}
  else if(route==='p'){
    /* tot tegen de rechterkant van de weg en daar blijven staan */
    var X0=(it.x-CX)*r[0]+(it.y-CY)*r[1],dx=Math.max(10,roadS.roadW/2-X0-TYPES[it.type].w/2-8);
    straight(80);curve(200,dx);straight(60);
    bl[bl.length-1][1]=len+400;   /* blijft knipperen terwijl hij stilstaat */
  }else{
    /* hindernis: het dichtstbijzijnde onderdeel vóór het voertuig, in dezelfde rijstrook */
    var best=null;
    items.forEach(function(o){
      if(o===it||o.type==='tag')return;var k=TYPES[o.type].kind;
      if(k!=='vehicle'&&['tree','kuil','cone','triangleI','barrier','truckD'].indexOf(o.type)<0)return;
      var F=(o.x-it.x)*f[0]+(o.y-it.y)*f[1],Lt=Math.abs((o.x-it.x)*r[0]+(o.y-it.y)*r[1]);
      if(F>40&&Lt<60&&(!best||F<best.F))best={F:F,hl:(TYPES[o.type].h||80)*(o.s||1)/2};
    });
    var F0=best?best.F:360,hl=best?best.hl:60,half=TYPES[it.type].h/2;
    straight(F0-hl-half-50-200);curve(200,-LANE);straight(hl*2+half*2+60);curve(200,LANE);straight(1500);
  }
  routeBlinks=bl;
  return pts;
}
/* knip de route af zodra het voertuig helemaal buiten beeld is */
function clipPts(p){
  function out(q){return q[0]<-140||q[0]>W+140||q[1]<-140||q[1]>H+140;}
  for(var i=1;i<p.length;i++)if(out(p[i])){
    /* zoek het punt op het laatste stuk waar het voertuig net buiten beeld is */
    var a=p[i-1],b=p[i],lo=0,hi=1,k;
    for(k=0;k<20;k++){var m=(lo+hi)/2;if(out([a[0]+(b[0]-a[0])*m,a[1]+(b[1]-a[1])*m]))hi=m;else lo=m;}
    return p.slice(0,i).concat([[a[0]+(b[0]-a[0])*hi,a[1]+(b[1]-a[1])*hi]]);
  }
  return p;
}
var routeExit=null;
function prepRoute(it){
  routeExit=null;routeBlinks=null;
  var p=routePts(it).filter(function(q,i,arr){return !i||Math.hypot(q[0]-arr[i-1][0],q[1]-arr[i-1][1])>.5;}),L=[0],end;
  for(var i=1;i<p.length;i++)L.push(L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));
  end=L[L.length-1];
  /* bl = lijst [van, tot, richting]: wanneer de richtingaanwijzer knippert (afstand langs de route) */
  var m={p:p,L:L,d:0,v:it.pace||PLAYSPEED[it.type]||280,bl:[]};
  if(routeExit){
    /* rotonde: niet knipperen bij het oprijden, wel rechts vlak voor de uitrit */
    for(i=0;i<p.length;i++)if(p[i]===routeExit)m.bl.push([Math.max(0,L[i]-120),L[i]+90,'r']);
  }else if(routeBlinks)m.bl=routeBlinks;
  else if(it.route==='l'||it.route==='r')m.bl.push([0,end*.7,it.route]);
  return m;
}
function routeAt(m){
  var p=m.p,L=m.L,d=Math.min(m.d,m.stop||L[L.length-1],L[L.length-1]),i=1;
  while(i<L.length-1&&L[i]<d)i++;
  var a=p[i-1],b=p[i],seg=(L[i]-L[i-1])||1,t=(d-L[i-1])/seg;
  return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,rot:(Math.atan2(b[0]-a[0],-(b[1]-a[1]))*180/Math.PI+360)%360};
}
function playStep(auto){
  if(play&&play.moving)return;
  if(!play){var gr=playGroups();if(!gr.length)return;play={groups:gr,gi:0,ov:{},moving:null,auto:false,tags:tagLinks()};selId=null;}
  if(play.gi>=play.groups.length){if(!auto)return;stopPlay();playStep(true);return;}
  play.auto=!!auto;
  var mv={},stepN=play.groups[play.gi].n;
  play.groups[play.gi].forEach(function(id){
    var it=find(id);if(!it)return;mv[id]=prepRoute(it);
    /* wie onderweg stopt (hold), rijdt in zijn tweede stap (order2) vanaf daar verder */
    if(it.hold){if(it.order2===stepN)mv[id].d=mv[id].from=it.hold;else mv[id].stop=it.hold;}
  });
  /* wie in dezelfde stap recht achter een trager voertuig rijdt (zelfde richting, zelfde strook), blijft erachter */
  play.groups[play.gi].forEach(function(id){
    var b=find(id);if(!b||!mv[id])return;
    play.groups[play.gi].forEach(function(id2){
      var a=find(id2);if(!a||id2===id||!mv[id2]||(a.route&&a.route!=='s')||(b.route&&b.route!=='s'))return;
      var dr=Math.abs(((a.rot-b.rot)%360+540)%360-180);if(dr>15)return;
      var h=b.rot*Math.PI/180,dx=a.x-b.x,dy=a.y-b.y,ahead=dx*Math.sin(h)-dy*Math.cos(h),side=dx*Math.cos(h)+dy*Math.sin(h);
      if(ahead>0&&ahead<450&&Math.abs(side)<40)mv[id].v=Math.min(mv[id].v,mv[id2].v);
    });
  });
  play.moving=mv;play.gi++;play.last=0;
  playRaf=requestAnimationFrame(playTick);
  playUI();
}
function playTick(ts){
  playRaf=0;if(!play||!play.moving)return;
  var dt=play.last?Math.min(.05,(ts-play.last)/1000):0,busy=false;play.last=ts;
  Object.keys(play.moving).forEach(function(id){
    var m=play.moving[id],ease=1;
    if(m.stop)ease=Math.max(.22,Math.min(1,(m.stop-m.d)/90));   /* remt af tot de stopplaats */
    else if(m.from)ease=Math.min(1,.25+(m.d-m.from)/110);   /* trekt rustig op */
    m.d+=m.v*dt*ease;
    var pos=routeAt(m),it=find(+id);
    var bk=m.bl.filter(function(b){return m.d>=b[0]&&m.d<b[1];})[0];
    play.ov[id]={x:pos.x,y:pos.y,rot:pos.rot,blink:bk?bk[2]:(it&&it.blink)};
    /* het lettertje bij dit voertuig rijdt mee en blijft op dezelfde plaats ten opzichte van het voertuig */
    if(it)(play.tags[id]||[]).forEach(function(tg){
      var a=(pos.rot-it.rot)*Math.PI/180,ox=tg.x-it.x,oy=tg.y-it.y;
      play.ov[tg.id]={x:pos.x+ox*Math.cos(a)-oy*Math.sin(a),y:pos.y+ox*Math.sin(a)+oy*Math.cos(a)};
    });
    if(m.d<Math.min(m.stop||Infinity,m.L[m.L.length-1]))busy=true;
  });
  renderPlay();
  if(busy){playRaf=requestAnimationFrame(playTick);return;}
  play.moving=null;playUI();
  if(play.auto&&play.gi<play.groups.length)setTimeout(function(){if(play&&!play.moving&&play.auto)playStep(true);},450);
}
/* elk lettertje (A, B …) hoort bij het dichtstbijzijnde voertuig of de dichtstbijzijnde voetganger */
function tagLinks(){
  var out={};
  items.forEach(function(tg){
    if(tg.type!=='tag')return;
    var best=null,bd=150;
    items.forEach(function(o){
      if(TYPES[o.type].kind!=='vehicle'&&o.type!=='ped')return;
      var dd=Math.hypot(o.x-tg.x,o.y-tg.y);if(dd<bd){bd=dd;best=o;}
    });
    if(best)(out[best.id]=out[best.id]||[]).push(tg);
  });
  return out;
}
function renderPlay(){
  layer.innerHTML=items.map(function(it){var o=play&&play.ov[it.id];return o?Object.assign({},it,o):it;}).sort(byLayer).map(itemSvg).join('');
  selLayer.innerHTML='';
}
function stopPlay(){
  if(!play)return;
  if(playRaf)cancelAnimationFrame(playRaf);playRaf=0;play=null;render();
}
/* knoppen: alleen zichtbaar als er voertuigen met een volgorde zijn */
function playUI(){
  var n=playGroups().length,done=play?play.gi:0,end=play&&!play.moving&&done>=n;
  ['playGrp','pPlayGrp'].forEach(function(gid){var g=document.getElementById(gid);if(g)g.hidden=!n;});
  [['bStep','pStep'],['bPlay','pPlay'],['bReset','pReset']].forEach(function(pair){
    pair.forEach(function(bid){var b=document.getElementById(bid);if(!b)return;
      if(bid==='bStep'||bid==='pStep'){b.disabled=end||!!(play&&play.moving);b.querySelector('span').textContent='Stap '+Math.min(done+1,n)+' van '+n;}
      if(bid==='bReset'||bid==='pReset')b.disabled=!play;
    });
  });
}
['bPlay','pPlay'].forEach(function(id){document.getElementById(id).onclick=function(){playStep(true);};});
['bStep','pStep'].forEach(function(id){document.getElementById(id).onclick=function(){playStep(false);};});
['bReset','pReset'].forEach(function(id){document.getElementById(id).onclick=stopPlay;});

/* ---------- opslaan als afbeelding ---------- */
function renderPng(){
  return new Promise(function(res,rej){
    var clone=svg.cloneNode(true);
    var s=clone.querySelector('#sel');if(s)s.remove();
    var k=clone.querySelector('#ink');if(k)k.remove();
    clone.setAttribute('xmlns',SVGNS);clone.setAttribute('width',W);clone.setAttribute('height',H);
    var str=new XMLSerializer().serializeToString(clone);
    var img=new Image();
    img.onload=function(){
      var c=document.createElement('canvas');c.width=W*2;c.height=H*2;
      var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);
      c.toBlob(function(b){b?res(b):rej(new Error('png'));},'image/png');
    };
    img.onerror=function(){rej(new Error('svg'));};
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(str);
  });
}
function stamp(){
  var d=new Date();function z(n){return (n<10?'0':'')+n;}
  return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'-'+z(d.getHours())+z(d.getMinutes());
}
function download(blob,name){
  var a=document.createElement('a'),url=URL.createObjectURL(blob);
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

function escHtml(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* ---------- dialoogvenster en meldingen ---------- */
var modal=document.getElementById('modal'),modalCard=document.getElementById('modalCard');
function openDialog(html,cls){
  var fresh=modalCard.cloneNode(false);modalCard.replaceWith(fresh);modalCard=fresh;
  modalCard.className='card'+(cls?' '+cls:'');
  modalCard.innerHTML=html;modal.hidden=false;
  var f=modalCard.querySelector('[autofocus]')||modalCard.querySelector('button,input');
  if(f)f.focus();
  return modalCard;
}
function closeModal(){modal.hidden=true;modalCard.innerHTML='';}
function showModal(msg){
  openDialog('<h2 id="modalTitle">Let op</h2><p>'+escHtml(msg)+'</p><div class="row"><button class="btn primary" type="button" data-close autofocus>Sluiten</button></div>');
}
modal.addEventListener('click',function(e){if(e.target===modal||e.target.closest('[data-close]'))closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)closeModal();});
var toastEl=document.getElementById('toast'),toastTimer=0;
function toast(msg){
  toastEl.textContent=msg;toastEl.hidden=false;
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.hidden=true;},4000);
}

/* ---------- over deze app ---------- */
document.getElementById('bAbout').onclick=function(){
  openDialog('<div class="about-hero"><img src="icons/icon.svg" alt=""><div><h2 id="modalTitle">Verkeer in beeld</h2>'+
    '<div>Kurt Braeye · Ligo Midden- en Zuid-West-Vlaanderen</div></div></div>'+
    '<p>Teken verkeerssituaties op een kruispunt, een rechte weg of een rotonde, met Belgische verkeersborden en wegmarkeringen. '+
    'Gebruik ze op het digibord (Presenteren), als afbeelding in je les (Opslaan) of als werkblad met meerkeuzevraag.</p>'+
    '<dl class="keys">'+
      '<dt><kbd>Ctrl</kbd> <kbd>Z</kbd></dt><dd>Ongedaan maken</dd>'+
      '<dt><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Z</kbd></dt><dd>Opnieuw</dd>'+
      '<dt><kbd>Delete</kbd></dt><dd>Gekozen onderdeel verwijderen</dd>'+
      '<dt><kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd></dt><dd>Gekozen onderdeel verschuiven (met Shift: sneller)</dd>'+
      '<dt><kbd>+</kbd> <kbd>−</kbd></dt><dd>Groter / kleiner</dd>'+
      '<dt><kbd>Esc</kbd></dt><dd>Selectie opheffen of presentatie stoppen</dd>'+
    '</dl>'+
    '<div class="row"><button class="btn" type="button" id="aWelcome">Welkomstscherm tonen</button><button class="btn primary" type="button" data-close autofocus>Sluiten</button></div>');
  modalCard.querySelector('#aWelcome').onclick=function(){showWelcome();};
};

/* ---------- welkomstscherm: korte rondleiding in 3 stappen ----------
   Verschijnt bij elke keer openen, tenzij "niet meer tonen" aangevinkt is.
   Na een nieuwe versie met NEWS verschijnt het altijd één keer, met de vernieuwingen bij de juiste stap.
   Bij een nieuwe versie: NEWS.id aanpassen en de items vervangen (step = 1, 2 of 3). */
var WELCOME_OFF='verkeer-welkom-uit',NEWS_SEEN='verkeer-nieuws-gezien';
var NEWS={id:'v36',items:[
  {step:1,t:'Negen nieuwe voorbeelden: fietsstraat met inhalende fietser, woonerf, voetgangerszone, voorbehouden weg, weg met middenrijbaan, zebrapad, oversteekplaats voor fietsers, speelstraat en schoolstraat.'},
  {step:2,t:'Nieuw in het materiaal: de ruiter, het bord oversteekplaats fietsers (F50) en het logo van de fietsstraat om op de weg te leggen.'}
]};
function welcomeOff(){try{return localStorage.getItem(WELCOME_OFF)==='1';}catch(e){return false;}}
function newsUnseen(){try{return localStorage.getItem(NEWS_SEEN)!==NEWS.id;}catch(e){return false;}}
/* klein strookje met enkele onderdelen uit de materiaallijst */
function welcomeStrip(){
  var its=[{type:'car',x:60,y:80,rot:0,color:'#d33a2f'},{type:'bike',x:150,y:80,rot:0,color:'#2d63c8'},{type:'ped',x:215,y:80,rot:0},
    {type:'b15',x:300,y:150,side:'a'},{type:'light',x:390,y:150},{type:'stop',x:475,y:150}];
  return '<svg viewBox="0 0 540 170" aria-hidden="true">'+its.map(function(o){
    var c={id:90000+(++thumbSeq),s:1,rot:0};for(var k in o)c[k]=o[k];return itemSvg(sanitizeItem(c)||c);}).join('')+'</svg>';
}
var WSTEPS=[
  {t:'Kies een situatie',
   d:'Bovenaan kies je een kruispunt, een rechte weg of een rotonde. Of vertrek van een kant-en-klaar voorbeeld, sommige met een meerkeuzevraag. Met Openen vind je je eigen tekeningen terug.',
   pic:function(){return '<div class="wpic three">'+['cross','road','round'].map(function(k){
     return '<figure><div class="gal-thumb">'+thumbSvg(k,null)+'</div><figcaption>'+SCENE_NAMES[k]+'</figcaption></figure>';}).join('')+'</div>';}},
  {t:'Voeg materiaal toe',
   d:'Klik of sleep weggebruikers, verkeerslichten, borden en markeringen uit de lijst links. Klik een onderdeel aan om het rechts in te stellen: kleur, grootte, richtingaanwijzer …',
   pic:function(){return '<div class="wpic strip">'+welcomeStrip()+'</div>';}},
  {t:'Gebruik het in je les',
   d:'Presenteren toont de tekening schermvullend op het digibord, Afspelen laat de voertuigen in de juiste volgorde vertrekken. Opslaan maakt een afbeelding voor je les, Werkblad drukt een blad af met een meerkeuzevraag.',
   pic:function(){var p=XPRESETS.filter(function(x){return x.id==='c1';})[0];
     return '<div class="wpic use"><div class="gal-thumb">'+thumbSvg('cross',p)+'</div><div class="wchips">'+
       [['present','Presenteren'],['play','Afspelen'],['save','Opslaan'],['print','Werkblad']].map(function(b){return '<span>'+IC(b[0])+b[1]+'</span>';}).join('')+'</div></div>';}}
];
function showWelcome(){
  var fresh=newsUnseen(),i=0;
  try{localStorage.setItem(NEWS_SEEN,NEWS.id);}catch(e){}
  var c=openDialog('<div class="about-hero"><img src="icons/icon.svg" alt=""><div><h2 id="modalTitle">'+(fresh&&!welcomeFirst()?'Nieuw in Verkeer in beeld':'Welkom bij Verkeer in beeld')+'</h2>'+
    '<div>'+(fresh&&!welcomeFirst()?'Klik door de 3 stappen: bij elke stap zie je wat er veranderde.':'Teken verkeerssituaties voor je les, in drie stappen.')+'</div></div></div>'+
    '<div class="wdots" role="tablist" aria-label="Stappen">'+WSTEPS.map(function(st,k){
      var n=NEWS.items.filter(function(x){return x.step===k+1;}).length;
      return '<button type="button" role="tab" data-ws="'+k+'"><b>'+(k+1)+'</b><span>'+st.t+'</span>'+(n?'<i>nieuw</i>':'')+'</button>';}).join('')+'</div>'+
    '<div class="wbody" id="wBody"></div>'+
    '<div class="row welcome-row"><label class="check"><input type="checkbox" id="wHide"'+(welcomeOff()?' checked':'')+'> Niet meer tonen</label>'+
    '<span id="wBtns"></span></div>','welcome');
  function show(k){
    i=k;var st=WSTEPS[k],news=NEWS.items.filter(function(x){return x.step===k+1;});
    c.querySelector('#wBody').innerHTML=st.pic()+'<h3>'+(k+1)+'. '+st.t+'</h3><p>'+st.d+'</p>'+
      (news.length?'<div class="wnews"><b>Nieuw</b><ul>'+news.map(function(x){return '<li>'+escHtml(x.t)+'</li>';}).join('')+'</ul></div>':'');
    [].forEach.call(c.querySelectorAll('[data-ws]'),function(b){var on=+b.getAttribute('data-ws')===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
    c.querySelector('#wBtns').innerHTML=(k>0?'<button class="btn ghost" type="button" data-wgo="-1">'+IC('left')+'<span>Vorige</span></button>':'')+
      (k<WSTEPS.length-1?'<button class="btn primary" type="button" data-wgo="1"><span>Volgende</span>'+IC('right')+'</button>':
        '<button class="btn" type="button" id="wEmpty">Leeg beginnen</button><button class="btn primary" type="button" id="wGallery">'+IC('grid')+'<span>Kies een voorbeeld</span></button>');
    var f=c.querySelector('#wBtns .primary');if(f)f.focus();
  }
  c.addEventListener('click',function(e){
    var t=e.target.closest('[data-ws]');if(t){show(+t.getAttribute('data-ws'));return;}
    t=e.target.closest('[data-wgo]');if(t){show(i+ +t.getAttribute('data-wgo'));return;}
    if(e.target.closest('#wGallery')){openGallery();return;}
    if(e.target.closest('#wEmpty')){closeModal();startEmpty();}
  });
  c.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT')return;
    if(e.key==='ArrowRight'&&i<WSTEPS.length-1){show(i+1);e.preventDefault();}
    if(e.key==='ArrowLeft'&&i>0){show(i-1);e.preventDefault();}
  });
  c.querySelector('#wHide').onchange=function(e){try{if(e.target.checked)localStorage.setItem(WELCOME_OFF,'1');else localStorage.removeItem(WELCOME_OFF);}catch(x){}};
  show(0);
}
/* eerste bezoek: nog nooit een tekening of instelling bewaard */
var firstVisit=(function(){try{return !localStorage.getItem(NEWS_SEEN)&&!localStorage.getItem(KEY);}catch(e){return true;}})();
function welcomeFirst(){return firstVisit;}

/* ---------- opslaan: één knop, twee keuzes ---------- */
document.getElementById('bSave').onclick=function(){
  var c=openDialog('<h2 id="modalTitle">Opslaan</h2>'+
    '<button class="choice" type="button" data-save="lib" autofocus><b>Bij mijn tekeningen</b><span>Bewaar de tekening met een naam in deze browser. Je opent ze later terug via "Openen".</span></button>'+
    '<button class="choice" type="button" data-save="png"><b>Afbeelding</b><span>Voor Word, PowerPoint of een e-mail. De afbeelding wordt gedownload en meteen gekopieerd, zodat je ze ook kunt plakken met Ctrl+V.</span></button>'+
    '<button class="choice" type="button" data-save="json"><b>Werkbestand</b><span>Een bestand om op een ander toestel verder te tekenen of door te geven aan een collega. Bewaart het kruispunt, de rechte weg en de rotonde samen.</span></button>'+
    '<div class="row"><button class="btn" type="button" data-close>Annuleren</button></div>');
  c.querySelector('[data-save="lib"]').onclick=function(){openLibrary(true);};
  c.querySelector('[data-save="png"]').onclick=savePng;
  c.querySelector('[data-save="json"]').onclick=saveJson;
};
function savePng(){
  closeModal();
  var pngP=renderPng(),clip=null;
  try{
    if(navigator.clipboard&&window.ClipboardItem){
      clip=navigator.clipboard.write([new ClipboardItem({'image/png':pngP})]).then(function(){return true;},function(){return false;});
    }
  }catch(e){}
  Promise.all([pngP,clip]).then(function(r){
    download(r[0],'verkeerssituatie-'+stamp()+'.png');
    toast(r[1]?'Afbeelding gedownload en gekopieerd: plak ze met Ctrl+V in Word.':'Afbeelding gedownload.');
  }).catch(function(){showModal('De afbeelding kon niet gemaakt worden. Probeer het opnieuw.');});
}
function saveJson(){
  closeModal();saveNow();
  var data=JSON.stringify({app:'verkeer-in-beeld',version:1,scene:scene,store:store});
  download(new Blob([data],{type:'application/json'}),'verkeerssituatie-'+stamp()+'.json');
  toast('Werkbestand gedownload. Open het later met de knop "Openen".');
}
var fileIn=document.getElementById('fileIn');
document.getElementById('bImport').onclick=function(){openLibrary(false);};
fileIn.addEventListener('change',function(){
  var f=fileIn.files[0];fileIn.value='';
  if(f)openFile(f);
});
/* een werkbestand openen; wat er nu getekend staat, komt eerst automatisch bij "mijn tekeningen" */
function openFile(f){
  closeModal();
  f.text().then(function(txt){
    var data=JSON.parse(txt);
    if(!data||!data.store)throw new Error('formaat');
    var was=scene;['cross','road','round'].forEach(function(k){scene=k;items=store[k].items;autoKeep();});
    scene=was;items=store[scene].items;
    if(!applyData(data))throw new Error('formaat');
    stopPlay();undoStack=[];redoStack=[];selId=null;
    drawBase();renderPalette();render();presLabel();saveNow();
    toast('Werkbestand geopend. Je vorige tekening staat bij "Mijn tekeningen".');
  }).catch(function(){
    showModal('Dit bestand kon niet geopend worden. Kies een werkbestand (.json) dat je eerder via "Opslaan" hebt gemaakt.');
  });
}
/* een werkbestand in het venster slepen opent het ook */
function hasFiles(e){return e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>-1;}
window.addEventListener('dragover',function(e){if(hasFiles(e)){e.preventDefault();e.dataTransfer.dropEffect='copy';document.body.classList.add('dropping');}});
window.addEventListener('dragleave',function(e){if(!e.relatedTarget)document.body.classList.remove('dropping');});
window.addEventListener('drop',function(e){
  if(!hasFiles(e))return;
  e.preventDefault();document.body.classList.remove('dropping');
  var f=e.dataTransfer.files[0];
  if(f&&/\.json$/i.test(f.name))openFile(f);
  else if(f)showModal('Sleep een werkbestand (.json) in het venster om het te openen.');
});

/* ---------- mijn tekeningen: meerdere tekeningen met een naam, bewaard in deze browser ----------
   Elke tekening is één situatie: {id, name, date, scene, set (instellingen van de weg), items}.
   Wordt een eigen tekening vervangen (voorbeeld, leeg beginnen, wissen, openen), dan komt ze eerst
   als "Automatisch bewaard" in de lijst; daarvan blijven er maximaal AUTO_MAX. */
var LIB_KEY='verkeer-tekeningen',AUTO_MAX=5;
function libLoad(){
  try{var a=JSON.parse(localStorage.getItem(LIB_KEY)||'[]');
    return Array.isArray(a)?a.filter(function(d){return d&&PSETS[d.scene]&&Array.isArray(d.items)&&typeof d.name==='string';}):[];
  }catch(e){return [];}
}
function libStore(a){
  try{localStorage.setItem(LIB_KEY,JSON.stringify(a));return true;}
  catch(e){showModal('Er is geen plaats meer in deze browser. Verwijder enkele tekeningen of bewaar ze als werkbestand.');return false;}
}
function noIds(list){return JSON.stringify(list,function(k,v){return k==='id'?undefined:v;});}
function curEntry(){
  store[scene].items=items;var st=settings();delete st.preset;
  return {scene:scene,set:st,preset:store[scene].preset||null,items:JSON.parse(noIds(items))};
}
function sameEntry(a,b){return a.scene===b.scene&&noIds(a.items)===noIds(b.items)&&JSON.stringify(a.set)===JSON.stringify(b.set);}
/* niets te bewaren: leeg, of een voorbeeld waaraan niets veranderd is */
function pristine(){
  if(!items.length)return true;
  var p=curPreset();return !!p&&noIds(items.map(sanitizeItem))===noIds(p.build().map(sanitizeItem));
}
function autoKeep(){
  if(pristine())return;
  var e=curEntry(),lib=libLoad();
  if(lib.some(function(d){return sameEntry(d,e);}))return;
  e.id=Date.now();e.date=e.id;e.auto=true;e.name='Automatisch bewaard';
  lib.unshift(e);
  var n=0;lib=lib.filter(function(d){return !d.auto||++n<=AUTO_MAX;});
  try{localStorage.setItem(LIB_KEY,JSON.stringify(lib));}catch(x){}
}
function libDate(t){
  var d=new Date(t),M=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  return d.getDate()+' '+M[d.getMonth()]+' '+d.getFullYear()+', '+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
}
function defaultName(){var p=curPreset();return p?p.label:SCENE_NAMES[scene]+' – '+libDate(Date.now()).split(',')[0];}
function libSaveCurrent(name){
  name=name.trim().slice(0,80);if(!name)return false;
  var lib=libLoad(),e=curEntry(),old=lib.filter(function(d){return !d.auto&&d.name.toLowerCase()===name.toLowerCase();})[0];
  if(old&&!confirm('Er bestaat al een tekening "'+old.name+'". Wil je die vervangen?'))return false;
  if(old)lib=lib.filter(function(d){return d!==old;});
  e.id=Date.now();e.date=e.id;e.name=name;
  lib.unshift(e);
  if(!libStore(lib))return false;
  libName[scene]=name;
  return true;
}
var libName={};   /* naam van de tekening die per situatie geopend werd, als voorstel bij opnieuw bewaren */
function libOpen(e){
  stopPlay();autoKeep();
  if(scene!==e.scene)setScene(e.scene);
  pushHistory(snap());
  var st=store[scene],s=e.set||{};
  if(scene==='cross'){st.vw=clamp(+s.vw||240,160,720);st.hw=clamp(+s.hw||240,160,640);st.arm=ARMS.indexOf(s.arm)>-1?s.arm:null;}
  else if(scene==='road'){st.roadW=clamp(+s.roadW||280,160,760);st.orient=s.orient==='h'?'h':'v';}
  else{st.R=clamp(+s.R||250,200,300);st.bike=['ring','apart'].indexOf(s.bike)>-1?s.bike:'';}
  st.preset=PSETS[scene].list.some(function(p){return p.id===e.preset;})?e.preset:null;
  items=e.items.map(sanitizeItem).filter(Boolean);items.forEach(function(i){i.id=++uid;});
  st.items=items;selId=null;libName[scene]=e.auto?null:e.name;
  closeModal();drawBase();renderDpad();renderTiles();render();presLabel();saveNow();
  toast('"'+e.name+'" geopend.');
}
function openLibrary(saving){
  var c=openDialog('<h2 id="modalTitle">Mijn tekeningen</h2>'+
    '<form class="libsave" id="libForm"><label for="libName">Huidige tekening bewaren als</label>'+
      '<div class="librow"><input id="libName" type="text" maxlength="80" autocomplete="off" value="'+escHtml(libName[scene]||defaultName())+'">'+
      '<button class="btn primary" type="submit">'+IC('save')+'<span>Bewaren</span></button></div></form>'+
    '<div class="gal lib" id="libList"></div>'+
    '<p class="small">Je tekeningen staan in deze browser op dit toestel. Wil je ze op een ander toestel gebruiken of doorgeven? Kies dan bij Opslaan een werkbestand.</p>'+
    '<div class="row"><button class="btn" type="button" id="libFile">'+IC('open')+'<span>Werkbestand openen …</span></button><button class="btn" type="button" data-close>Sluiten</button></div>','wide');
  var list=c.querySelector('#libList'),inp=c.querySelector('#libName');
  function fill(){
    var lib=libLoad();
    list.innerHTML=lib.length?lib.map(function(d){
      return '<div class="gal-card lib-card" data-lid="'+d.id+'"><button class="lib-open" type="button" data-lopen="'+d.id+'" title="Openen"><div class="gal-thumb">'+thumbOf(d.scene,d.set||{},d.items.map(sanitizeItem).filter(Boolean))+'</div>'+
        '<b>'+escHtml(d.name)+'</b><span>'+SCENE_NAMES[d.scene]+' · '+libDate(d.date)+'</span>'+(d.auto?'<span class="badge">Automatisch bewaard</span>':'')+'</button>'+
        '<div class="lib-acts"><button class="btn ghost icon" type="button" data-lren="'+d.id+'" title="Naam wijzigen" aria-label="Naam wijzigen">'+IC('pencil')+'</button>'+
        '<button class="btn ghost icon" type="button" data-ldel="'+d.id+'" title="Verwijderen" aria-label="Verwijderen">'+IC('trash')+'</button></div></div>';
    }).join(''):'<p class="lib-empty">Nog geen tekeningen bewaard.</p>';
  }
  fill();
  c.querySelector('#libForm').onsubmit=function(e){
    e.preventDefault();
    if(!items.length){showModal('Er staat nog niets op de tekening om te bewaren.');return;}
    if(libSaveCurrent(inp.value)){fill();toast('Bewaard bij "Mijn tekeningen".');}
  };
  c.querySelector('#libFile').onclick=function(){fileIn.click();};
  list.addEventListener('click',function(e){
    var lib=libLoad(),b,id;
    if((b=e.target.closest('[data-lopen]'))){id=+b.getAttribute('data-lopen');var d=lib.filter(function(x){return x.id===id;})[0];if(d)libOpen(d);return;}
    if((b=e.target.closest('[data-lren]'))){
      id=+b.getAttribute('data-lren');var r=lib.filter(function(x){return x.id===id;})[0];if(!r)return;
      var nm=prompt('Nieuwe naam voor de tekening:',r.auto?'':r.name);
      if(nm&&nm.trim()){r.name=nm.trim().slice(0,80);delete r.auto;libStore(lib);fill();}
      return;
    }
    if((b=e.target.closest('[data-ldel]'))){
      id=+b.getAttribute('data-ldel');var x=lib.filter(function(q){return q.id===id;})[0];if(!x)return;
      if(confirm('"'+x.name+'" verwijderen? Dit kan niet ongedaan gemaakt worden.')){libStore(lib.filter(function(q){return q!==x;}));fill();}
    }
  });
  if(saving){inp.focus();inp.select();}
}

/* ---------- werkblad: tekening + meerkeuzevraag, afdrukken of als PDF bewaren ---------- */
var LETTERS='ABCD';
document.getElementById('bSheet').onclick=function(){
  var p=curPreset(),q=(p&&p.q)||{question:'',answers:[],correct:0},img=null;
  var ans=q.answers.concat(['','','','']).slice(0,4);
  var c=openDialog('<h2 id="modalTitle">Werkblad afdrukken</h2><div class="ws"><div class="wsForm">'+
    '<label class="field">Titel<input id="wsTitle" value="'+escHtml(p?p.label:'Verkeerssituatie')+'"></label>'+
    '<label class="field">Vraag<textarea id="wsQ" rows="2" placeholder="Bijvoorbeeld: Wie mag als eerste doorrijden?">'+escHtml(q.question)+'</textarea></label>'+
    '<fieldset class="field"><legend>Antwoorden <small>duid het juiste aan, laat leeg wat je niet nodig hebt</small></legend>'+
    ans.map(function(a,i){
      return '<div class="ans"><input type="radio" name="wsOk" value="'+i+'"'+(i===q.correct?' checked':'')+' aria-label="Antwoord '+LETTERS[i]+' is juist"><b>'+LETTERS[i]+'</b><input id="wsA'+i+'" value="'+escHtml(a)+'" aria-label="Antwoord '+LETTERS[i]+'"></div>';
    }).join('')+'</fieldset>'+
    '<label class="check"><input type="checkbox" id="wsName" checked> Lijnen voor naam en datum</label>'+
    '<label class="check"><input type="checkbox" id="wsKey" checked> Antwoordsleutel op een aparte pagina</label>'+
    '<p class="small">Tip: kies in het afdrukvenster "Opslaan als PDF" om er een PDF van te maken.</p>'+
    '</div><div class="wsPrevWrap" aria-label="Voorbeeld van het werkblad"><div class="wsPrev" id="wsPrev"><p class="small">Voorbeeld wordt gemaakt…</p></div></div></div>'+
    '<div class="row"><button class="btn" type="button" data-close>Annuleren</button><button class="btn primary" type="button" id="wsPrint" disabled>Afdrukken</button></div>','wide');
  function read(){
    var okEl=c.querySelector('input[name="wsOk"]:checked'),ok=okEl?+okEl.value:-1,list=[],i;
    for(i=0;i<4;i++){var t=c.querySelector('#wsA'+i).value.trim();if(t)list.push({t:t,ok:i===ok});}
    return {title:c.querySelector('#wsTitle').value.trim()||'Verkeerssituatie',q:c.querySelector('#wsQ').value.trim(),
      answers:list,name:c.querySelector('#wsName').checked,key:c.querySelector('#wsKey').checked&&list.some(function(a){return a.ok;})};
  }
  /* het voorbeeld toont exact wat er afgedrukt wordt, en verandert mee terwijl je typt */
  function preview(){
    if(!img)return;
    var o=read();
    c.querySelector('#wsPrev').innerHTML=sheetPage(o,img,false)+(o.key?sheetPage(o,img,true):'');
  }
  c.addEventListener('input',preview);c.addEventListener('change',preview);
  c.querySelector('#wsTitle').focus();
  renderPng().then(function(blob){
    return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.readAsDataURL(blob);});
  }).then(function(url){
    img=url;preview();c.querySelector('#wsPrint').disabled=false;
  }).catch(function(){c.querySelector('#wsPrev').innerHTML='<p class="small">Het voorbeeld kon niet gemaakt worden.</p>';});
  c.querySelector('#wsPrint').onclick=function(){var o=read();closeModal();printSheet(o,img);};
};
function sheetPage(o,img,key){
  return '<section class="sheet"><h1>'+escHtml(o.title)+'</h1>'+
    (key?'<div class="keylabel">Antwoordsleutel</div>':(o.name?'<div class="nameline"><span>Naam: ________________________________</span><span>Datum: ______________</span></div>':''))+
    '<img src="'+img+'" alt="">'+
    (o.q?'<p class="q">'+escHtml(o.q)+'</p>':'')+
    (o.answers.length?'<ol class="mc">'+o.answers.map(function(a,i){
      var mark=key&&a.ok;
      return '<li'+(mark?' class="ok"':'')+'><span class="box">'+(mark?'✓':'')+'</span><b>'+LETTERS[i]+'</b><span>'+escHtml(a.t)+'</span></li>';
    }).join('')+'</ol>':'')+
    '<footer>Verkeer in beeld · Kurt Braeye · Ligo Midden- en Zuid-West-Vlaanderen</footer></section>';
}
function printSheet(o,img){
  var box=document.getElementById('print');
  box.innerHTML=sheetPage(o,img,false)+(o.key?sheetPage(o,img,true):'');
  var imgs=[].slice.call(box.querySelectorAll('img'));
  Promise.all(imgs.map(function(im){return im.complete?0:new Promise(function(r){im.onload=im.onerror=r;});})).then(function(){window.print();});
}
window.addEventListener('afterprint',function(){document.getElementById('print').innerHTML='';});

renderPalette();
var openKey='kruispunt-bouwer-open';
try{
  var op=JSON.parse(localStorage.getItem(openKey)||'null');
  if(Array.isArray(op))[].forEach.call(document.querySelectorAll('details.sec'),function(d){d.open=op.indexOf(d.getAttribute('data-sec'))>-1;});
}catch(e){}
document.getElementById('palette').addEventListener('toggle',function(){
  try{
    var o=[].filter.call(document.querySelectorAll('details.sec'),function(d){return d.open;}).map(function(d){return d.getAttribute('data-sec');});
    localStorage.setItem(openKey,JSON.stringify(o));
  }catch(e){}
},true);
drawBase();
render();
/* het welkomstscherm verschijnt bij elke keer openen, tenzij "niet meer tonen" aangevinkt is; na een nieuwe versie altijd één keer */
if(!welcomeOff()||newsUnseen())setTimeout(showWelcome,250);

/* Offline werken en installeren als app (alleen via http(s), niet via file://). */
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
/* Nieuwe versie online? Kijk bij het openen, elk half uur en telkens het venster terug zichtbaar wordt
   (een digibord blijft soms dagen open staan). Dan verschijnt bovenaan een balk om te vernieuwen. */
function checkUpdate(){
  if(location.protocol.indexOf('http')!==0||!navigator.onLine)return;
  fetch('sw.js',{cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(t){
    var m=t.match(/VERSION\s*=\s*'([^']+)'/);
    if(m&&m[1]!==APP_VERSION)document.getElementById('updBar').hidden=false;
  }).catch(function(){});
}
document.getElementById('updGo').onclick=function(){
  saveNow();
  var go=function(){location.reload();};
  if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
    navigator.serviceWorker.getRegistration().then(function(r){return r&&r.update();}).then(go,go);
  }else go();
};
document.getElementById('updLater').onclick=function(){document.getElementById('updBar').hidden=true;};
setTimeout(checkUpdate,4000);
setInterval(checkUpdate,30*60000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)checkUpdate();});
