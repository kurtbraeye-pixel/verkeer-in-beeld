/* Kant-en-klare voorbeeldsituaties voor de rechte weg (PRESETS) en het kruispunt (XPRESETS). */
import {TYPES,SHAPES,ROUTES,copyPts} from './types.js';

/* ---------- voorbeeldsituaties (rechte weg) ---------- */
var C={red:'#d33a2f',blue:'#2d63c8',green:'#2e9a57',orange:'#ee7a1e',white:'#f2f4f5',yellow:'#f2b705'};
function I(type,x,y,o){
  o=o||{};
  var d=TYPES[type],it={id:0,type:type,x:x,y:y,s:o.s||1,rot:o.rot||0};
  if(o.color)it.color=o.color;else if(d.color)it.color=C.red;
  if(o.flip)it.flip=o.flip;
  if(o.lanes)it.lanes=o.lanes;
  if(o.text)it.text=o.text;
  if(o.state)it.state=o.state;
  if(d.stretch){it.w=o.w||d.w;it.h=o.h||d.h;}
  if(type==='vlak')it.pts=copyPts(o.pts||SHAPES[2]);
  if(type==='routepijl')it.pts=copyPts(o.pts||ROUTES[o.shape==null?1:o.shape]);
  return it;
}
function edgeLines(a,b){return [I('solid',a,430,{h:860}),I('solid',b,430,{h:860})];}
var PRESETS=[
  {id:'p1',label:'Rechte weg met twee richtingen',roadW:280,build:function(){
    return edgeLines(372,628).concat([I('dashed',500,430,{h:860}),I('car',570,640,{color:C.red}),I('car',430,230,{rot:180,color:C.blue})]);
  }},
  {id:'p2',label:'Twee rijstroken per richting met middenberm',roadW:640,build:function(){
    return [I('midberm',500,430,{w:60,h:860})].concat(edgeLines(192,808),edgeLines(458,542),[
      I('dashed',325,430,{h:860}),I('dashed',675,430,{h:860}),
      I('car',602,660,{color:C.red}),I('car',747,500,{color:C.blue}),
      I('car',398,200,{rot:180,color:C.green}),I('car',252,330,{rot:180,color:C.orange})]);
  }},
  {id:'p3',label:'Voorsorteren voor een kruispunt',roadW:520,build:function(){
    return [I('asfalt',500,155,{w:1000,h:190,rot:0})].concat([
      I('solid',248,555,{h:610}),I('solid',752,555,{h:610}),I('solid',380,560.5,{h:599}),
      I('solid',248,30,{h:60}),I('solid',752,30,{h:60}),
      I('dashed',504,571.5,{h:577}),I('dashed',628,571.5,{h:577}),
      I('dashed',120,155,{h:240,rot:90}),I('dashed',880,155,{h:240,rot:90}),
      I('stopline',566,272,{w:372}),
      I('arrow_l',442,650),I('arrow_s',566,650),I('arrow_r',690,650),
      I('lanesign',840,640,{lanes:['l','s','r'],s:1.5}),
      I('car',566,500,{color:C.red}),I('car',314,420,{rot:180,color:C.blue}),I('car',150,155,{rot:90,color:C.green})]);
  }},
  {id:'p4',label:'Rijstrookvermindering: rechter rijstrook valt weg',roadW:280,build:function(){
    /* boven de versmalling is de rechter strook weg: daar ligt berm en de lijn op 500 is de nieuwe kantlijn */
    return [I('grasberm',572,176,{w:136,h:352}),I('solid',372,430,{h:860}),I('solid',628,670,{h:380}),
      I('solid',500,176,{h:352}),I('solid',564,416,{rot:315,h:181}),
      I('dashed',500,606,{h:508}),
      I('arrow_ml',564,570),I('mergesign',730,640,{s:1.5}),
      I('car',436,720,{color:C.blue}),I('car',564,720,{color:C.orange}),
      I('tag',436,815,{text:'A'}),I('tag',564,815,{text:'B'})];
  }},
  {id:'p5',label:'Rijstrookvermindering: linker rijstrook valt weg',roadW:280,build:function(){
    return [I('grasberm',428,176,{w:136,h:352}),I('solid',628,430,{h:860}),I('solid',372,670,{h:380}),
      I('solid',500,176,{h:352}),I('solid',436,416,{rot:45,h:181}),
      I('dashed',500,606,{h:508}),
      I('arrow_mr',436,570),I('mergesign_l',730,640,{s:1.5}),
      I('car',436,720,{color:C.blue}),I('car',564,720,{color:C.orange}),
      I('tag',436,815,{text:'A'}),I('tag',564,815,{text:'B'})];
  }},
  {id:'p6',label:'Gele onderbroken lijn (stilstaan mag)',roadW:300,build:function(){
    return [I('stoep',685,430,{w:70,h:860}),I('stoep',315,430,{w:70,h:860}),I('dashed',500,430,{h:860}),
      I('ydashed',641,430,{h:860}),I('car',585,520,{color:C.green}),I('car',415,200,{rot:180,color:C.blue})];
  }},
  {id:'p7',label:'Verdrijvingsvlak',roadW:420,build:function(){
    return edgeLines(302,698).concat([
      I('vlak',500,430,{pts:[[0,-260],[50,-150],[50,150],[0,260],[-50,150],[-50,-150]]}),
      I('dashed',500,85,{h:170}),I('dashed',500,775,{h:170}),
      I('car',624,640,{color:C.red}),I('car',376,220,{rot:180,color:C.blue})]);
  }},
  {id:'p8',label:'Wegenwerken met tijdelijke markering',roadW:420,build:function(){
    /* gele tijdelijke markering gaat voor op de witte: de middellijn schuift naar links,
       een schuine gele lijn leidt het verkeer langs de werfzone rechts */
    return edgeLines(302,698).concat([
      I('dashed',500,430,{h:860}),
      I('tdashed',440,430,{h:860}),
      I('tsolid',590,265,{h:330}),I('tsolid',640,535,{rot:335,h:233}),
      I('barrier',630,265,{rot:90,w:330}),
      I('cone',640,480),I('cone',664,530),I('cone',685,580),
      I('workwarn',790,700,{s:1.5}),I('car',540,720,{color:C.red}),I('car',370,300,{rot:180,color:C.white})]);
  }},
  {id:'p9',label:'Hindernis: defecte auto (geen inhalen)',roadW:280,build:function(){
    return edgeLines(372,628).concat([I('dashed',500,430,{h:860}),
      I('carD',564,330,{color:C.white}),I('car',564,720,{color:C.red}),I('car',436,150,{rot:180,color:C.blue}),
      I('tag',564,815,{text:'A'}),I('tag',564,200,{text:'B'})]);
  }},
  {id:'p10',label:'Hindernis: omgevallen boom',roadW:280,build:function(){
    return edgeLines(372,628).concat([I('dashed',500,430,{h:860}),
      I('tree',548,300,{rot:6,s:.62}),I('car',564,700,{color:C.orange}),I('car',436,150,{rot:180,color:C.blue})]);
  }}
];
/* ---------- voorbeeldsituaties (kruispunt) ---------- */
function carX(dirName,color,off){
  off=off||0;
  var m={bottom:[560,700+off,0],top:[440,160-off,180],left:[200-off,490,90],right:[800+off,370,270]}[dirName];
  return I('car',m[0],m[1],{rot:m[2],color:color});
}
function tagAt(x,y,t){return I('tag',x,y,{text:t});}
/* spiegelt items rond het midden van het tekenvlak: wat voor verkeer van onder geldt, geldt dan voor verkeer van boven */
function flip(list){
  return list.map(function(it){var c=JSON.parse(JSON.stringify(it));c.x=1000-c.x;c.y=860-c.y;c.rot=(c.rot+180)%360;return c;});
}
/* drie voorsorteerstroken voor verkeer van onder (vw 720): lijnen stoppen aan de stopstreep */
function sortLanes(signY){
  return [I('stopline',677,621,{w:366}),
    I('solid',500,735,{h:250}),I('dashed',620,746,{h:228}),I('dashed',740,746,{h:228}),
    I('arrow_l',560,730),I('arrow_s',680,730),I('arrow_r',800,730),
    I('lanesign',930,signY,{lanes:['l','s','r'],s:1.2})];
}
var XPRESETS=[
  {id:'c1',label:'Kruispunt zonder borden: voorrang aan rechts',vw:240,hw:240,arm:null,build:function(){
    return [carX('bottom',C.red),carX('right',C.blue),carX('top',C.green),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(440,55,'C')];
  }},
  {id:'c2',label:'T-kruispunt zonder borden: voorrang aan rechts',vw:240,hw:240,arm:'top',build:function(){
    return [carX('bottom',C.red),carX('right',C.blue),carX('left',C.orange),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(95,490,'C')];
  }},
  {id:'c3',label:'Voorrangsweg en "geef voorrang"',vw:240,hw:240,arm:null,build:function(){
    return [I('priority',310,620,{rot:90}),I('priority',690,240,{rot:270}),I('yield',690,620),I('yield',310,240,{rot:180}),
      I('sharks',560,610,{w:108}),I('sharks',440,250,{rot:180,w:108}),
      carX('bottom',C.red),carX('right',C.blue),tagAt(560,810,'A'),tagAt(905,370,'B')];
  }},
  {id:'c4',label:'Stopbord op het kruispunt',vw:240,hw:240,arm:null,build:function(){
    return [I('priority',310,620,{rot:90}),I('priority',690,240,{rot:270}),I('stop',690,620),I('stop',310,240,{rot:180}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),
      carX('bottom',C.red),carX('right',C.blue),carX('left',C.orange),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(95,490,'C')];
  }},
  {id:'c5',label:'Kruispunt met borden en wegmarkeringen (voorsorteren)',vw:720,hw:240,arm:null,build:function(){
    return [I('zebra',500,580,{w:720,h:56}),I('zebra',500,280,{w:720,h:56})].concat(
      sortLanes(740),flip(sortLanes(740)),[
      I('dashed',70,430,{h:140,rot:90}),I('dashed',930,430,{h:140,rot:90}),
      I('car',680,800,{color:C.red}),I('car',320,60,{rot:180,color:C.blue})]);
  }},
  {id:'c6',label:'Kruispunt met verkeerslichten',vw:240,hw:240,arm:null,build:function(){
    return [I('light',690,620,{state:'red'}),I('light',310,240,{state:'red',rot:180}),I('light',310,620,{state:'green',rot:90}),I('light',690,240,{state:'green',rot:270}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),I('stopline',309,490,{rot:90,w:108}),I('stopline',691,370,{rot:270,w:108}),
      I('zebra',500,580,{w:240,h:56}),I('zebra',500,280,{w:240,h:56}),
      I('ped',440,582,{color:C.orange,rot:90}),I('ped',560,278,{color:C.green,rot:270}),
      carX('bottom',C.red),carX('left',C.blue),carX('right',C.white)];
  }},
  {id:'c7',label:'Verkeerslichten, borden en wegmarkeringen',vw:720,hw:240,arm:null,build:function(){
    var lights=[I('light',900,592,{state:'green'})];
    return [I('zebra',500,580,{w:720,h:56}),I('zebra',500,280,{w:720,h:56})].concat(
      sortLanes(760),flip(sortLanes(760)),lights,flip(lights),[
      I('dashed',70,430,{h:140,rot:90}),I('dashed',930,430,{h:140,rot:90}),
      I('car',680,800,{color:C.red}),I('car',560,800,{color:C.orange}),
      I('car',320,60,{rot:180,color:C.blue}),I('car',440,60,{rot:180,color:C.green})]);
  }},
  {id:'c8',label:'Bevoegd persoon gaat voor lichten en borden',vw:240,hw:240,arm:null,build:function(){
    /* zoals "kruispunt met verkeerslichten", met een stopbord naast elk licht: de bevoegd persoon gaat boven alles */
    return [I('light',690,620,{state:'green'}),I('light',310,240,{state:'green',rot:180}),I('light',310,620,{state:'red',rot:90}),I('light',690,240,{state:'red',rot:270}),
      I('stop',755,620),I('stop',245,240,{rot:180}),I('stop',310,685,{rot:90}),I('stop',690,175,{rot:270}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),I('stopline',309,490,{rot:90,w:108}),I('stopline',691,370,{rot:270,w:108}),
      I('zebra',500,580,{w:240,h:56}),I('zebra',500,280,{w:240,h:56}),
      I('agent_up',500,430),
      carX('bottom',C.white),carX('right',C.green),carX('top',C.blue),carX('left',C.orange),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(440,55,'C'),tagAt(95,490,'D')];
  }},
  {id:'c9',label:'Zebrapad: afslaan met voetganger en fietser',vw:240,hw:240,arm:null,build:function(){
    return [I('zebra',650,430,{w:240,h:56,rot:90}),
      I('routepijl',605,560,{shape:3}),
      I('ped',650,345,{color:C.orange,rot:180}),I('bike',607,655,{color:C.blue}),
      carX('bottom',C.red),tagAt(560,810,'A')];
  }}
];

export {PRESETS,XPRESETS};
