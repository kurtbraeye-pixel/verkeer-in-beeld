/* De app zelf: toestand, materiaalpaneel, tekenvlak, werkbalk, opslaan en exporteren. */
import {
  W,H,CX,CY,ROT,ARROW,DIRLABEL,COLORS,SVGNS,SHAPES,ROUTES,
  TYPES,SECTIONS,ENTRY,LINES,BERMS,LANEMARKS,
  copyPts,isPts,vbox,normV,follows,baseDims,dims,clamp,sanitizeItem
} from './types.js';
import {PRESETS,XPRESETS} from './presets.js';

function renderTiles(){SECTIONS.forEach(fillTiles);}

var svg=document.getElementById('scene'),layer=document.getElementById('items'),selLayer=document.getElementById('sel');
var store={cross:{items:[],vw:240,hw:240,arm:null},road:{items:[],roadW:280,orient:'v'}},scene='cross';
var items=store.cross.items,roadS=store.road;
var selId=null,uid=0,undoStack=[],redoStack=[],dir='bottom',curColor=COLORS[0],drag=null;
var KEY='kruispunt-bouwer-v2';
var ARMS=['top','bottom','left','right'];

/* Zet bewaarde gegevens (localStorage of een geopend bestand) om naar de toestand van de app.
   Alles wordt gecontroleerd, zodat een beschadigd bestand de app niet kan breken. */
function applyData(sv){
  if(!sv||typeof sv!=='object'||!sv.store||typeof sv.store!=='object')return false;
  uid=0;
  ['cross','road'].forEach(function(k){
    var s=sv.store[k]||{};
    store[k].items=(Array.isArray(s.items)?s.items:[]).map(sanitizeItem).filter(Boolean);
    store[k].items.forEach(function(i){i.id=++uid;});
    if(k==='cross'){
      store.cross.vw=clamp(+s.vw||240,160,720);store.cross.hw=clamp(+s.hw||240,160,640);
      store.cross.arm=ARMS.indexOf(s.arm)>-1?s.arm:null;
    }else{
      store.road.roadW=clamp(+s.roadW||280,160,760);store.road.orient=s.orient==='h'?'h':'v';
    }
  });
  scene=sv.scene==='road'?'road':'cross';
  items=store[scene].items;
  return true;
}
try{
  var sv=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!sv){
    var old=JSON.parse(localStorage.getItem('kruispunt-bouwer-v1')||'null');
    if(old&&Array.isArray(old.items))sv={scene:'cross',store:{cross:{items:old.items}}};
  }
  applyData(sv);
}catch(e){}

/* Ongedaan maken / opnieuw: een momentopname bevat de items én de instellingen van de weg. */
function settings(){
  var s=store[scene];
  return scene==='cross'?{vw:s.vw,hw:s.hw,arm:s.arm}:{roadW:s.roadW,orient:s.orient};
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
  var bg=def.kind==='mark'?'<rect x="'+(-m)+'" y="'+(-m)+'" width="'+(2*m)+'" height="'+(2*m)+'" rx="'+(m/5)+'" fill="#6f6a64"/>':'';
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
    return '<button class="dir'+(dir===c[0]?' on':'')+'"'+(store.cross.arm===c[0]&&scene==='cross'?' disabled':'')+' type="button" data-dir="'+c[0]+'" style="grid-area:'+c[1]+'" title="Komt van '+DIRLABEL[c[0]]+'" aria-label="Komt van '+DIRLABEL[c[0]]+'">'+ARROW[c[0]]+'</button>';
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
function G(){var c=store.cross;return {hv:c.vw/2,hh:c.hw/2};}
function vehicleSpot(item){
  var g=G(),len=TYPES[item.type].h,B={
    bottom:{x:CX+g.hv/2,y:CY+g.hh+82+len/2,vx:0,vy:1,lx:1,ly:0},
    top:{x:CX-g.hv/2,y:CY-g.hh-82-len/2,vx:0,vy:-1,lx:-1,ly:0},
    left:{x:CX-g.hv-82-len/2,y:CY+g.hh/2,vx:-1,vy:0,lx:0,ly:1},
    right:{x:CX+g.hv+82+len/2,y:CY-g.hh/2,vx:1,vy:0,lx:0,ly:-1}
  }[dir];
  var off=item.type==='bike'?32:0,x,y;
  for(var k=0;k<6;k++){
    x=B.x+B.lx*off+B.vx*k*(len+22);y=B.y+B.ly*off+B.vy*k*(len+22);
    var busy=items.some(function(o){return TYPES[o.type].kind==='vehicle'&&Math.hypot(o.x-x,o.y-y)<70;});
    if(!busy)break;
  }
  return {x:x,y:y};
}
function lanePos(dd,g){return {bottom:[CX+g.hv/2,0],top:[CX-g.hv/2,0],left:[0,CY+g.hh/2],right:[0,CY-g.hh/2]}[dd];}
function sideMark(dist){return function(){var g=G();return {
  bottom:[CX+g.hv/2,CY+g.hh+dist],top:[CX-g.hv/2,CY-g.hh-dist],left:[CX-g.hv-dist,CY+g.hh/2],right:[CX+g.hv+dist,CY-g.hh/2]};};}
var MARKPOS={
  zebra:function(){var g=G();return {bottom:[CX,CY+g.hh+30],top:[CX,CY-g.hh-30],left:[CX-g.hv-30,CY],right:[CX+g.hv+30,CY]};},
  stopline:sideMark(71),
  sharks:sideMark(60),
  arrow_s:sideMark(170),
  dashed:function(){var g=G();return {bottom:[CX,CY+g.hh+170],top:[CX,CY-g.hh-170],left:[CX-g.hv-100,CY],right:[CX+g.hv+100,CY]};}
};
MARKPOS.arrow_r=MARKPOS.arrow_l=MARKPOS.arrow_sr=MARKPOS.arrow_sl=MARKPOS.arrow_mr=MARKPOS.arrow_ml=MARKPOS.arrow_s;
MARKPOS.solid=MARKPOS.ydashed=MARKPOS.tsolid=MARKPOS.tdashed=MARKPOS.dashed;
function markSpot(item){
  var g=G(),p=MARKPOS[item.type]()[dir],v={bottom:[0,1],top:[0,-1],left:[-1,0],right:[1,0]}[dir],len=TYPES[item.type].h,extra={};
  if(item.type==='zebra')extra.w=(dir==='bottom'||dir==='top')?g.hv*2:g.hh*2;
  if(item.type==='stopline'||item.type==='sharks')extra.w=Math.max(60,((dir==='bottom'||dir==='top')?g.hv:g.hh)-12);
  for(var k=0;k<5;k++){
    var xx=p[0]+v[0]*k*(len+14),yy=p[1]+v[1]*k*(len+14);
    var busy=items.some(function(o){return o.type===item.type&&Math.hypot(o.x-xx,o.y-yy)<20;});
    if(!busy){extra.x=xx;extra.y=yy;return extra;}
  }
  extra.x=p[0];extra.y=p[1];return extra;
}
function countOf(list){return items.filter(function(o){return list.indexOf(o.type)>-1;}).length;}
function objectSpot(item){
  var t=item.type;
  if(['agent_up','agent_side','barrier','cone','tag'].indexOf(t)>-1){return {x:CX+countOf([t])*44,y:CY};}
  var group=(t==='ped'||t==='cyclist')?['ped','cyclist']:(t==='light'?['light']:['stop','yield','priority','endpriority','noentry','ahead','mergesign','mergesign_l','lanesign','workwarn']);
  var g=G(),CORNERS=[[CX+g.hv+70,CY+g.hh+70],[CX-g.hv-70,CY-g.hh-70],[CX+g.hv+70,CY-g.hh-70],[CX-g.hv-70,CY+g.hh+70]];
  var n=countOf(group),c=CORNERS[n%4],row=Math.floor(n/4),sx=c[0]<CX?-1:1;
  return {x:c[0]+sx*row*60,y:c[1]};
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
  if(t==='zebra')return {x:v?CX:250,y:v?250:CY,rot:v?0:90,w:Math.min(RW,560)};
  if(t==='vlak')return {x:CX,y:CY,rot:v?0:90};
  if(t==='stopline'||t==='sharks'){q=pt(520,70);return {x:q[0],y:q[1],rot:ROT[d2],w:140};}
  if(LANEMARKS.indexOf(t)>-1){q=pt(210,70);return {x:q[0],y:q[1],rot:ROT[d2]};}
  if(t==='barrier'){return {x:CX+countOf([t])*30,y:CY,rot:v?0:90,w:300};}
  if(['agent_up','agent_side','cone','tag','baken','routepijl','tree','triangleI','kuil'].indexOf(t)>-1){return {x:CX+countOf([t])*44,y:CY};}
  var group=(t==='ped'||t==='cyclist')?['ped','cyclist']:(t==='light'?['light']:['stop','yield','priority','endpriority','noentry','ahead','mergesign','mergesign_l','lanesign','workwarn']);
  var ng=countOf(group),a=[620,470,320,170][ng%4],edge=RW/2+60;
  return v?{x:CX+edge,y:a}:{x:a+60,y:CY+edge};
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
  var order=items.slice().sort(function(a,b){return layerOf(a)-layerOf(b);});
  layer.innerHTML=order.map(function(it){
    var d=TYPES[it.type],b,hw;
    if(d.stretch&&it.w==null){it.w=d.w;it.h=d.h;}
    if(it.type==='vlak'&&!it.pts){var ow=it.w||160,oh=it.h||260;it.pts=[[-ow/2,-oh/2],[ow/2,-oh/2],[ow/2,oh/2],[-ow/2,oh/2]];}
    if(it.type==='routepijl'&&!it.pts)it.pts=copyPts(ROUTES[1]);
    b=baseDims(it);hw=d.stretch?Math.max(b[0],28):b[0];
    var hh=d.stretch?Math.max(b[1],28):b[1];
    return '<g data-id="'+it.id+'" transform="translate('+it.x.toFixed(1)+' '+it.y.toFixed(1)+')"'+(d.kind==='base'||d.kind==='mark'?'':' filter="url(#sh)"')+'>'+
      '<g transform="rotate('+it.rot+') scale('+(it.s*(it.flip||1))+' '+it.s+')">'+d.draw(it)+
      (isPts(it)?'':'<rect x="'+(-hw/2)+'" y="'+(-hh/2)+'" width="'+hw+'" height="'+hh+'" fill="#000" fill-opacity="0"/>')+'</g></g>';
  }).join('');
  var it=find(selId);
  if(selId!==null&&!it)selId=null;
  selLayer.innerHTML=it?selMarkup(it):'';
  updateToolbar(it);
  document.getElementById('hint').hidden=items.length>0;
  saveState();
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
function handle(cls,mode,x,y,shape){
  var g='<g data-h="'+mode+'" class="'+cls+'" transform="translate('+x+' '+y+')">';
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
    '<line x1="'+mx+'" y1="'+y0+'" x2="'+mx+'" y2="'+(y0-26)+'" stroke="#cc4e06" stroke-width="2.5" pointer-events="none"/>';
  if(d.stretch){
    if(d.stretch.indexOf('w')>-1)out+=handle('h-w','w+',x1,my,'sq')+handle('h-w','w-',x0,my,'sq');
    if(d.stretch.indexOf('h')>-1)out+=handle('h-h','h+',mx,y1,'sq')+handle('h-h','h-',mx,y0,'sq');
    if(d.stretch==='wh')out+=handle('h-size','wh',x1,y1,'size');
  }else out+=handle('h-size','resize',x1,y1,'size');
  out+=handle('h-rot','rotate',mx,y0-38,'rot');
  if(isPts(it)){
    var n=it.pts.length,pp=it.pts,sc=it.s,nm=it.type==='routepijl'?n-1:n;
    for(k=0;k<nm;k++){
      var a=pp[k],b=pp[(k+1)%n];
      out+='<g data-h="m:'+k+'" class="h-v" transform="translate('+((a[0]+b[0])/2*sc)+' '+((a[1]+b[1])/2*sc)+')"><circle r="7" fill="#fff" stroke="#cc4e06" stroke-width="2.5"/><path d="M-3.5 0H3.5M0 -3.5V3.5" stroke="#cc4e06" stroke-width="2"/></g>';
    }
    for(k=0;k<n;k++){
      out+='<g data-h="v:'+k+'" class="h-v" transform="translate('+(pp[k][0]*sc)+' '+(pp[k][1]*sc)+')"><circle r="10" fill="#cc4e06" stroke="#fff" stroke-width="3"/></g>';
    }
  }
  return out+'</g>';
}
var LANECYC=['s','l','r','sl','sr'],LANECH={s:'\u2191',l:'\u21B0',r:'\u21B1',sl:'\u2191\u21B0',sr:'\u2191\u21B1'};
function buildLaneEd(it){
  var box=document.getElementById('laneEd');
  box.innerHTML='';
  if(!(it&&it.type==='lanesign')){box.hidden=true;return;}
  box.hidden=false;
  var L=it.lanes||['s','s'];
  function mk(txt,title,fn){var b=document.createElement('button');b.type='button';b.className='btn';b.textContent=txt;b.title=title;b.onclick=function(){mutate(function(){it.lanes=(it.lanes||['s','s']).slice();fn(it.lanes);});};box.appendChild(b);}
  L.forEach(function(c,i){mk(LANECH[c],'Pijl van rijstrook '+(i+1)+' wijzigen',function(l){l[i]=LANECYC[(LANECYC.indexOf(l[i])+1)%LANECYC.length];});});
  if(L.length<6)mk('+','Rijstrook erbij',function(l){l.push('s');});
  if(L.length>1)mk('\u2212','Laatste rijstrook weg',function(l){l.pop();});
}
var ids=['bSmall','bBig','bRotL','bRotR','bFlip','bDup','bDel'];
function updateToolbar(it){
  ids.forEach(function(i){document.getElementById(i).disabled=!it;});
  document.getElementById('bLight').hidden=!(it&&it.type==='light');
  document.getElementById('bLine').hidden=!(it&&(it.type==='lanesign'||it.type==='routepijl'));
  if(it)document.getElementById('bLine').textContent=it.type==='routepijl'?'Streepjes aan/uit':'Lijnen: onderbroken / vol';
  document.getElementById('bShape').hidden=!(it&&isPts(it));
  buildLaneEd(it);
  var lab='Niets gekozen';
  if(it){lab=(it.type==='agent_up'||it.type==='agent_side')?'Bevoegd persoon':(it.type==='lanesign'?'Rijstrookbord':TYPES[it.type].label);}
  document.getElementById('selLabel').textContent=lab;
  document.getElementById('bUndo').disabled=undoStack.length===0;
  document.getElementById('bRedo').disabled=redoStack.length===0;
  document.getElementById('bClear').disabled=items.length===0;
}

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
    ghost=document.createElement('div');ghost.className='ghost';ghost.innerHTML=pend.svg;document.body.appendChild(ghost);
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
document.getElementById('bSmall').onclick=function(){var it=sel();if(it)mutate(function(){scaleItem(it,1/1.15);});};
document.getElementById('bBig').onclick=function(){var it=sel();if(it)mutate(function(){scaleItem(it,1.15);});};
document.getElementById('bRotL').onclick=function(){var it=sel();if(it)mutate(function(){it.rot=((it.rot-90)%360+360)%360;});};
document.getElementById('bRotR').onclick=function(){var it=sel();if(it)mutate(function(){it.rot=(it.rot+90)%360;});};
document.getElementById('bFlip').onclick=function(){var it=sel();if(it)mutate(function(){it.flip=(it.flip||1)*-1;});};
document.getElementById('bLight').onclick=function(){
  var it=sel();if(!it)return;
  mutate(function(){var o=['red','orange','green'];it.state=o[(o.indexOf(it.state||'red')+1)%3];});
};
document.getElementById('bLine').onclick=function(){var it=sel();if(it)mutate(function(){if(it.type==='routepijl')it.dash=!it.dash;else it.solid=!it.solid;});};
document.getElementById('bShape').onclick=function(){
  var it=sel();if(!it)return;
  mutate(function(){var arr=it.type==='routepijl'?ROUTES:SHAPES;it.shape=((it.shape==null?1:it.shape)+1)%arr.length;it.pts=copyPts(arr[it.shape]);});
};
document.getElementById('bDup').onclick=function(){
  var it=sel();if(!it)return;
  pushHistory(snap());
  var c=JSON.parse(JSON.stringify(it));c.id=++uid;c.x=clamp(c.x+36,0,W);c.y=clamp(c.y+36,0,H);
  items.push(c);selId=c.id;render();
};
function del(){var it=sel();if(!it)return;mutate(function(){items=items.filter(function(i){return i.id!==it.id;});store[scene].items=items;selId=null;});}
document.getElementById('bDel').onclick=del;
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
  if(!items.length)return;pushHistory(snap());items=[];store[scene].items=items;selId=null;render();
};

document.addEventListener('keydown',function(e){
  var tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='select')return;
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
  var road=scene==='road',a=document.getElementById('rAsph'),v=roadS.orient==='v',w=roadS.roadW;
  document.getElementById('base-cross').setAttribute('display',road?'none':'inline');
  document.getElementById('base-road').setAttribute('display',road?'inline':'none');
  if(v){a.setAttribute('x',CX-w/2);a.setAttribute('y',0);a.setAttribute('width',w);a.setAttribute('height',H);}
  else{a.setAttribute('x',0);a.setAttribute('y',CY-w/2);a.setAttribute('width',W);a.setAttribute('height',w);}
  document.getElementById('sCross').className=road?'':'on';
  document.getElementById('sRoad').className=road?'on':'';
  document.getElementById('roadbar').hidden=!road;
  document.getElementById('crossbar').hidden=road;
  drawCross();
  document.getElementById('roadW').value=w;
  document.getElementById('oV').className='btn'+(v?' on':'');
  document.getElementById('oH').className='btn'+(v?'':' on');
}
function drawCross(){
  var c=store.cross,x0=CX-c.vw/2,x1=CX+c.vw/2,y0=CY-c.hw/2,y1=CY+c.hw/2,r=36;
  var TL='M0 0H'+x0+'V'+(y0-r)+'A'+r+' '+r+' 0 0 1 '+(x0-r)+' '+y0+'H0Z',
      TR='M'+W+' 0H'+x1+'V'+(y0-r)+'A'+r+' '+r+' 0 0 0 '+(x1+r)+' '+y0+'H'+W+'Z',
      BL='M0 '+H+'H'+x0+'V'+(y1+r)+'A'+r+' '+r+' 0 0 0 '+(x0-r)+' '+y1+'H0Z',
      BR='M'+W+' '+H+'H'+x1+'V'+(y1+r)+'A'+r+' '+r+' 0 0 1 '+(x1+r)+' '+y1+'H'+W+'Z';
  var arm=c.arm,d;
  if(arm&&dir===arm&&typeof renderDpad==='function'){dir={top:'bottom',bottom:'top',left:'right',right:'left'}[arm];renderDpad();}
  if(arm==='top')d=['M0 0H'+W+'V'+y0+'H0Z',BL,BR];
  else if(arm==='bottom')d=[TL,TR,'M0 '+y1+'H'+W+'V'+H+'H0Z'];
  else if(arm==='left')d=['M0 0H'+x0+'V'+H+'H0Z',TR,BR];
  else if(arm==='right')d=[TL,BL,'M'+x1+' 0H'+W+'V'+H+'H'+x1+'Z'];
  else d=[TL,TR,BL,BR];
  var h=d.map(function(q){return '<path d="'+q+'"/>';}).join('');
  document.getElementById('cStroke').innerHTML=h;document.getElementById('cFill').innerHTML=h;
  document.getElementById('kType4').className='btn'+(arm?'':' on');
  document.getElementById('kTypeT').className='btn'+(arm?' on':'');
  document.getElementById('tSide').hidden=!arm;
  var stem={top:'bottom',bottom:'top',left:'right',right:'left'}[arm];
  document.querySelectorAll('[data-stem]').forEach(function(b){b.className='btn'+(b.getAttribute('data-stem')===stem?' on':'');});
  document.getElementById('crossVW').value=c.vw;document.getElementById('crossHW').value=c.hw;
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
slider('roadW',function(v){roadS.roadW=v;drawBase();});
function setOrient(o){mutate(function(){roadS.orient=o;});drawBase();}
document.getElementById('oV').onclick=function(){setOrient('v');};
document.getElementById('oH').onclick=function(){setOrient('h');};

(function(){
  var sel=document.getElementById('presetC');
  XPRESETS.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.label;sel.appendChild(o);});
  sel.addEventListener('change',function(){
    var p=XPRESETS.filter(function(x){return x.id===sel.value;})[0];
    sel.value='';
    if(!p||scene!=='cross')return;
    pushHistory(snap());
    store.cross.vw=p.vw;store.cross.hw=p.hw;store.cross.arm=p.arm;
    items=p.build();items.forEach(function(i){i.id=++uid;});
    store.cross.items=items;selId=null;drawBase();renderDpad();render();
  });
})();
(function(){
  var sel=document.getElementById('preset');
  PRESETS.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.label;sel.appendChild(o);});
  sel.addEventListener('change',function(){
    var p=PRESETS.filter(function(x){return x.id===sel.value;})[0];
    sel.value='';
    if(!p)return;
    if(scene!=='road')return;
    pushHistory(snap());
    roadS.roadW=p.roadW;roadS.orient='v';
    items=p.build();items.forEach(function(i){i.id=++uid;});
    store.road.items=items;selId=null;drawBase();render();
  });
})();

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

var modal=document.getElementById('modal'),modalImg=document.getElementById('modalImg'),
    modalDl=document.getElementById('modalDownload'),modalUrl=null;
function showModal(msg,url){
  modalImg.hidden=modalDl.hidden=!url;
  if(url){modalImg.src=url;modalDl.href=url;modalDl.download='verkeerssituatie-'+stamp()+'.png';}
  else modalImg.removeAttribute('src');
  document.getElementById('modalMsg').textContent=msg;
  modal.hidden=false;
  document.getElementById('modalClose').focus();
}
document.getElementById('bSave').onclick=function(){
  var pngP=renderPng(),copied=false,clip=null;
  try{
    if(navigator.clipboard&&window.ClipboardItem){
      clip=navigator.clipboard.write([new ClipboardItem({'image/png':pngP})]).then(function(){copied=true;},function(){});
    }
  }catch(e){}
  Promise.all([pngP,clip]).then(function(r){
    if(modalUrl)URL.revokeObjectURL(modalUrl);
    modalUrl=URL.createObjectURL(r[0]);
    showModal((copied?'De afbeelding is gekopieerd. Plak ze met Ctrl+V in Word. ':'')+'Of klik op "Downloaden" om ze als bestand te bewaren.',modalUrl);
  }).catch(function(){
    showModal('De afbeelding kon niet gemaakt worden. Probeer het opnieuw.');
  });
};
function closeModal(){modal.hidden=true;}
document.getElementById('modalClose').onclick=closeModal;
modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)closeModal();});

/* ---------- tekening bewaren en openen als bestand (.json) ---------- */
document.getElementById('bExport').onclick=function(){
  saveNow();
  var data=JSON.stringify({app:'verkeer-in-beeld',version:1,scene:scene,store:store});
  download(new Blob([data],{type:'application/json'}),'verkeerssituatie-'+stamp()+'.json');
};
var fileIn=document.getElementById('fileIn');
document.getElementById('bImport').onclick=function(){fileIn.click();};
fileIn.addEventListener('change',function(){
  var f=fileIn.files[0];fileIn.value='';
  if(!f)return;
  var hasWork=store.cross.items.length||store.road.items.length;
  if(hasWork&&!confirm('Dit vervangt je huidige tekeningen. Doorgaan?'))return;
  f.text().then(function(txt){
    if(!applyData(JSON.parse(txt)))throw new Error('formaat');
    undoStack=[];redoStack=[];selId=null;
    drawBase();renderPalette();render();saveNow();
  }).catch(function(){
    showModal('Dit bestand kon niet geopend worden. Kies een bestand dat je eerder met "Tekening bewaren" hebt gemaakt.');
  });
});

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

/* Offline werken en installeren als app (alleen via http(s), niet via file://). */
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
