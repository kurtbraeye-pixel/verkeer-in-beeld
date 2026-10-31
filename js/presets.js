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
    return [I('midberm',500,430,{w:60,h:860})].concat(edgeLines(192,808),[
      I('dashed',325,430,{h:860}),I('dashed',675,430,{h:860}),
      I('car',602,660,{color:C.red}),I('car',747,500,{color:C.blue}),
      I('car',398,200,{rot:180,color:C.green}),I('car',252,330,{rot:180,color:C.orange})]);
  }},
  {id:'p3',label:'Voorsorteren voor een kruispunt',roadW:520,build:function(){
    return [I('asfalt',500,155,{w:1000,h:190,rot:0})].concat([
      I('solid',248,555,{h:610}),I('solid',752,555,{h:610}),I('solid',380,555,{h:610}),
      I('solid',248,30,{h:60}),I('solid',752,30,{h:60}),
      I('dashed',504,575,{h:570}),I('dashed',628,575,{h:570}),
      I('dashed',500,155,{h:1000,rot:90}),
      I('stopline',566,272,{w:372}),
      I('arrow_l',442,650),I('arrow_s',566,650),I('arrow_r',690,650),
      I('lanesign',840,640,{lanes:['l','s','r'],s:1.5}),
      I('car',566,500,{color:C.red}),I('car',314,420,{rot:180,color:C.blue}),I('car',150,155,{rot:90,color:C.green})]);
  }},
  {id:'p4',label:'Rijstrookvermindering: rechter rijstrook valt weg',roadW:280,build:function(){
    return edgeLines(372,628).concat([
      I('solid',500,176,{h:352}),I('solid',564,416,{rot:315,h:181}),
      I('dashed',500,606,{h:508}),
      I('arrow_ml',564,570),I('mergesign',730,640,{s:1.5}),
      I('car',436,720,{color:C.blue}),I('car',564,720,{color:C.orange}),
      I('tag',436,815,{text:'A'}),I('tag',564,815,{text:'B'})]);
  }},
  {id:'p5',label:'Rijstrookvermindering: linker rijstrook valt weg',roadW:280,build:function(){
    return edgeLines(372,628).concat([
      I('solid',500,176,{h:352}),I('solid',436,416,{rot:45,h:181}),
      I('dashed',500,606,{h:508}),
      I('arrow_mr',436,570),I('mergesign_l',730,640,{s:1.5}),
      I('car',436,720,{color:C.blue}),I('car',564,720,{color:C.orange}),
      I('tag',436,815,{text:'A'}),I('tag',564,815,{text:'B'})]);
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
    return edgeLines(302,698).concat([
      I('dashed',430,430,{h:860}),I('dashed',570,720,{h:280}),
      I('tsolid',570,260,{h:420}),I('tsolid',605,555,{rot:158,h:184}),
      I('barrier',640,260,{rot:90,w:420}),
      I('cone',565,560),I('cone',590,620),I('cone',615,680),
      I('workwarn',790,640,{s:1.5}),I('car',360,700,{color:C.red}),I('car',500,300,{color:C.white})]);
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
    return [I('priority',310,620,{rot:90}),I('priority',690,240,{rot:270}),I('stop',690,620),
      I('stopline',560,621,{w:108}),
      carX('bottom',C.red),carX('right',C.blue),carX('left',C.orange),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(95,490,'C')];
  }},
  {id:'c5',label:'Kruispunt met borden en wegmarkeringen (voorsorteren)',vw:720,hw:240,arm:null,build:function(){
    return [I('zebra',500,580,{w:720,h:56}),
      I('solid',500,720,{h:280}),I('dashed',620,720,{h:280}),I('dashed',740,720,{h:280}),
      I('stopline',680,621,{w:360}),
      I('arrow_l',560,720),I('arrow_s',680,720),I('arrow_r',800,720),
      I('dashed',70,430,{h:140,rot:90}),I('dashed',930,430,{h:140,rot:90}),
      I('lanesign',930,740,{lanes:['l','s','r'],s:1.2}),
      I('car',680,800,{color:C.red}),I('car',440,150,{rot:180,color:C.blue})];
  }},
  {id:'c6',label:'Kruispunt met verkeerslichten',vw:240,hw:240,arm:null,build:function(){
    return [I('light',690,620,{state:'red'}),I('light',310,240,{state:'red',rot:180}),I('light',310,620,{state:'green',rot:90}),I('light',690,240,{state:'green',rot:270}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),I('stopline',309,490,{rot:90,w:108}),I('stopline',691,370,{rot:270,w:108}),
      I('zebra',500,580,{w:240,h:56}),I('zebra',500,280,{w:240,h:56}),
      I('ped',440,582,{color:C.orange,rot:90}),I('ped',560,278,{color:C.green,rot:270}),
      carX('bottom',C.red),carX('left',C.blue),carX('right',C.white)];
  }},
  {id:'c7',label:'Verkeerslichten, borden en wegmarkeringen',vw:720,hw:240,arm:null,build:function(){
    return [I('zebra',500,580,{w:720,h:56}),
      I('solid',500,720,{h:280}),I('dashed',620,720,{h:280}),I('dashed',740,720,{h:280}),
      I('stopline',680,621,{w:360}),
      I('arrow_l',560,720),I('arrow_s',680,720),I('arrow_r',800,720),
      I('dashed',70,430,{h:140,rot:90}),I('dashed',930,430,{h:140,rot:90}),
      I('lanesign',930,760,{lanes:['l','s','r'],s:1.2}),
      I('light',900,592,{state:'green'}),I('light',110,258,{state:'green',rot:180}),
      I('car',680,800,{color:C.red}),I('car',560,800,{color:C.orange}),I('car',440,150,{rot:180,color:C.blue})];
  }},
  {id:'c8',label:'Bevoegd persoon gaat voor lichten en borden',vw:240,hw:240,arm:null,build:function(){
    return [I('stop',690,620),I('light',750,620,{state:'green'}),I('stopline',560,621,{w:108}),
      I('agent_up',500,420),carX('bottom',C.white),carX('right',C.green),
      tagAt(560,810,'A'),tagAt(905,370,'B')];
  }},
  {id:'c9',label:'Zebrapad: afslaan met voetganger en fietser',vw:240,hw:240,arm:null,build:function(){
    return [I('zebra',650,430,{w:240,h:56,rot:90}),
      I('routepijl',605,560,{shape:3}),
      I('ped',650,345,{color:C.orange,rot:180}),I('bike',650,470,{color:C.blue,rot:180}),
      carX('bottom',C.red),tagAt(560,810,'A')];
  }}
];

export {PRESETS,XPRESETS};
