/* De app zelf: toestand, materiaalpaneel, tekenvlak, werkbalk, opslaan en exporteren. */
import {
  W,H,CX,CY,ROT,DIRLABEL,COLORS,SVGNS,SHAPES,ROUTES,
  TYPES,SECTIONS,ENTRY,LINES,BERMS,LANEMARKS,POSTS,
  copyPts,isPts,vbox,normV,follows,baseDims,dims,clamp,sanitizeItem
} from './types.js';
import {PRESETS,XPRESETS,RPRESETS} from './presets.js';

function renderTiles(){SECTIONS.forEach(fillTiles);}

var svg=document.getElementById('scene'),layer=document.getElementById('items'),selLayer=document.getElementById('sel');
var store={cross:{items:[],vw:240,hw:240,arm:null},road:{items:[],roadW:280,orient:'v'},round:{items:[],R:250,bike:''}},scene='cross';
var items=store.cross.items,roadS=store.road;
var selId=null,uid=0,undoStack=[],redoStack=[],dir='bottom',curColor=COLORS[0],drag=null;
var KEY='kruispunt-bouwer-v2';
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
function mutate(fn){var b=snap();fn();if(snap()!==b)pushHistory(b);render();}
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
  if(t==='asfalt')return {x:CX,y:CY,rot:v?90:0,w:W,h:190};
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
function renderInspector(it){
  var body=document.getElementById('insBody'),empty=document.getElementById('insEmpty');
  document.getElementById('inspector').classList.toggle('has-sel',!!it);
  if(!it){body.hidden=true;empty.hidden=false;insKey='';return;}
  var d=TYPES[it.type];
  var key=[it.id,it.type,(it.lanes||[]).join(''),d.color?it.color:'',it.state||'',it.beacon===false,!!it.solid,!!it.dash,it.blink||'',!!it.brake].join('|');
  if(key===insKey){syncInspector(it);return;}
  insKey=key;empty.hidden=true;body.hidden=false;
  var h='<h2>'+escHtml(itemLabel(it))+'</h2>';
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
  if(d.beacon)h+='<label class="switch"><input type="checkbox" data-k="beacon"'+(it.beacon!==false?' checked':'')+'> Zwaailicht aan (prioritair)</label>';
  if(it.type==='c43')h+=insField('Maximumsnelheid','<select data-k="speed" aria-label="Maximumsnelheid">'+SPEEDS.map(function(v){
    return '<option value="'+v+'"'+((it.text||'50')===v?' selected':'')+'>'+v+' km/u</option>';}).join('')+'</select>');
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
    if(b.hasAttribute('data-light')){var st=b.getAttribute('data-light');mutate(function(){it.state=st;});return;}
    if(b.hasAttribute('data-lane')){
      var i=+b.getAttribute('data-lane');
      mutate(function(){it.lanes=(it.lanes||['s','s']).slice();it.lanes[i]=LANECYC[(LANECYC.indexOf(it.lanes[i])+1)%LANECYC.length];});return;
    }
    var act=b.getAttribute('data-act');
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
  if(!undoStack.length)return;
  redoStack.push(snap());restore(undoStack.pop());
}
function redo(){
  if(!redoStack.length)return;
  undoStack.push(snap());restore(redoStack.pop());
}
document.getElementById('bUndo').onclick=undo;
document.getElementById('bRedo').onclick=redo;
document.getElementById('bClear').onclick=function(){
  if(!items.length)return;pushHistory(snap());items=[];store[scene].items=items;store[scene].preset=null;selId=null;drawBase();render();
};

document.addEventListener('keydown',function(e){
  var tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='select'||tag==='textarea'||!modal.hidden)return;
  if(document.body.classList.contains('present')){
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();presStep(1);return;}
    if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();presStep(-1);return;}
    if(e.key==='Escape'){setPresent(false);return;}
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
  pushHistory(snap());
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
  if(items.length)pushHistory(snap());
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

/* ---------- presentatiemodus: alleen de tekening, schermvullend; pijltjes = vorig/volgend voorbeeld ---------- */
function presLabel(){var p=curPreset();document.getElementById('pLabel').textContent=p?p.label:'Eigen tekening';}
function presStep(d){
  var L=PSETS[scene].list,p=curPreset(),i=p?L.indexOf(p):-1;
  i=i<0?(d>0?0:L.length-1):(i+d+L.length)%L.length;
  applyPreset(L[i]);
}
function setPresent(on){
  document.body.classList.toggle('present',on);
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

/* ---------- opslaan als afbeelding ---------- */
function renderPng(){
  return new Promise(function(res,rej){
    var clone=svg.cloneNode(true);
    var s=clone.querySelector('#sel');if(s)s.remove();
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

/* ---------- welkomstscherm (bij elke keer openen, tenzij "niet meer tonen" aangevinkt is) ---------- */
var WELCOME_OFF='verkeer-welkom-uit';
function welcomeOff(){try{return localStorage.getItem(WELCOME_OFF)==='1';}catch(e){return false;}}
function showWelcome(){
  openDialog('<div class="about-hero"><img src="icons/icon.svg" alt=""><div><h2 id="modalTitle">Welkom bij Verkeer in beeld</h2>'+
    '<div>Teken verkeerssituaties voor je les, in een paar klikken.</div></div></div>'+
    '<ol class="steps">'+
      '<li><b>Kies een situatie</b><span>Kruispunt, rechte weg of rotonde, of vertrek van een kant-en-klaar voorbeeld.</span></li>'+
      '<li><b>Voeg materiaal toe</b><span>Klik of sleep voertuigen, borden en markeringen uit de lijst links.</span></li>'+
      '<li><b>Pas aan en gebruik</b><span>Rechts stel je het gekozen onderdeel in. Presenteer op het digibord, sla op als afbeelding of druk een werkblad af.</span></li>'+
    '</ol>'+
    '<div class="row welcome-row"><label class="check"><input type="checkbox" id="wHide"'+(welcomeOff()?' checked':'')+'> Niet meer tonen</label>'+
    '<button class="btn" type="button" id="wEmpty">Leeg beginnen</button>'+
    '<button class="btn primary" type="button" id="wGallery" autofocus>'+IC('grid')+'<span>Kies een voorbeeld</span></button></div>');
  modalCard.querySelector('#wGallery').onclick=function(){openGallery();};
  modalCard.querySelector('#wEmpty').onclick=function(){closeModal();startEmpty();};
  modalCard.querySelector('#wHide').onchange=function(e){try{if(e.target.checked)localStorage.setItem(WELCOME_OFF,'1');else localStorage.removeItem(WELCOME_OFF);}catch(x){}};
}

/* ---------- opslaan: één knop, twee keuzes ---------- */
document.getElementById('bSave').onclick=function(){
  var c=openDialog('<h2 id="modalTitle">Opslaan</h2>'+
    '<button class="choice" type="button" data-save="png" autofocus><b>Afbeelding</b><span>Voor Word, PowerPoint of een e-mail. De afbeelding wordt gedownload en meteen gekopieerd, zodat je ze ook kunt plakken met Ctrl+V.</span></button>'+
    '<button class="choice" type="button" data-save="json"><b>Werkbestand</b><span>Om later verder te tekenen in deze app: open het met de knop "Openen". Bewaart het kruispunt, de rechte weg en de rotonde samen.</span></button>'+
    '<div class="row"><button class="btn" type="button" data-close>Annuleren</button></div>');
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
document.getElementById('bImport').onclick=function(){fileIn.click();};
fileIn.addEventListener('change',function(){
  var f=fileIn.files[0];fileIn.value='';
  if(!f)return;
  var hasWork=store.cross.items.length||store.road.items.length||store.round.items.length;
  if(hasWork&&!confirm('Dit vervangt je huidige tekeningen. Doorgaan?'))return;
  f.text().then(function(txt){
    if(!applyData(JSON.parse(txt)))throw new Error('formaat');
    undoStack=[];redoStack=[];selId=null;
    drawBase();renderPalette();render();saveNow();
  }).catch(function(){
    showModal('Dit bestand kon niet geopend worden. Kies een werkbestand (.json) dat je eerder via "Opslaan" hebt gemaakt.');
  });
});

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
/* het welkomstscherm verschijnt bij elke keer openen, tenzij "niet meer tonen" aangevinkt is */
if(!welcomeOff())setTimeout(showWelcome,250);

/* Offline werken en installeren als app (alleen via http(s), niet via file://). */
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
