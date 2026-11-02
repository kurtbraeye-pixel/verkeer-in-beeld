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
  if(o.nopost)it.nopost=true;
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
/* volgorde bij afspelen (n = 1, 2 …) en rijrichting (s, l, r) */
function go(it,n,route){it.order=n;if(route&&route!=='s')it.route=route;return it;}
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
  {id:'c1',q:{question:'Wie mag als eerste doorrijden?',answers:['Auto A','Auto B','Auto C','Ze moeten allemaal wachten'],correct:2},label:'Kruispunt zonder borden: voorrang aan rechts',vw:240,hw:240,arm:null,build:function(){
    return [go(carX('bottom',C.red),3),go(carX('right',C.blue),2),go(carX('top',C.green),1),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(440,55,'C')];
  }},
  {id:'c2',q:{question:'Wie mag als eerste doorrijden?',answers:['Auto A','Auto B','Auto C','Wie het eerst aankomt'],correct:1},label:'T-kruispunt zonder borden: voorrang aan rechts',vw:240,hw:240,arm:'top',build:function(){
    return [go(carX('bottom',C.red),2,'r'),go(carX('right',C.blue),1),go(carX('left',C.orange),3),
      tagAt(560,810,'A'),tagAt(905,370,'B'),tagAt(95,490,'C')];
  }},
  {id:'c3',q:{question:'Wie mag als eerste doorrijden?',answers:['A, want B komt van links','B, want hij rijdt op de voorrangsweg','A, want hij komt van rechts','Wie het eerst aankomt'],correct:1},label:'Voorrangsweg en "geef voorrang"',vw:240,hw:240,arm:null,build:function(){
    return [I('priority',310,620,{rot:90}),I('priority',690,240,{rot:270}),I('yield',690,620),I('yield',310,240,{rot:180}),
      I('sharks',560,610,{w:108}),I('sharks',440,250,{rot:180,w:108}),
      go(carX('bottom',C.red),2),go(carX('right',C.blue),1),tagAt(560,810,'A'),tagAt(905,370,'B')];
  }},
  {id:'c4',q:{question:'Wat moet bestuurder A doen?',answers:['Stoppen aan de stopstreep en B en C laten voorgaan','Alleen B laten voorgaan, want die komt van rechts','Vertragen en doorrijden als er niemand komt','Als eerste doorrijden'],correct:0},label:'Stopbord op het kruispunt',vw:240,hw:240,arm:null,build:function(){
    return [I('priority',310,620,{rot:90}),I('priority',690,240,{rot:270}),I('stop',690,620),I('stop',310,240,{rot:180}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),
      go(carX('bottom',C.red),2),go(carX('right',C.blue),1),go(carX('left',C.orange),1),
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
  {id:'c8',q:{question:'Wat moeten de bestuurders doen?',answers:['Allemaal stoppen, ook A en C met groen licht','A en C mogen doorrijden, want zij hebben groen','Alleen B en D stoppen, want zij hebben rood','De stopborden bepalen wie voorgaat'],correct:0},label:'Bevoegd persoon gaat voor lichten en borden',vw:240,hw:240,arm:null,build:function(){
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

/* ---------- voorbeeldsituaties (rotonde) ----------
   Midden (500,430), buitenstraal 250, armen van 240 breed. Op de rotonde rijdt men in tegenwijzerzin:
   van onder naar rechts, boven, links. Een auto op de ring onder hoek θ (in graden, y naar onder) heeft rot = θ. */
function ringCar(deg,color){
  var a=deg*Math.PI/180;
  return I('car',Math.round(500+190*Math.cos(a)),Math.round(430+190*Math.sin(a)),{rot:deg,color:color});
}
/* Haaientanden bij elke ingang, alleen op de inrijstrook (tussen middengeleider en stoeprand), op afstand ds van het midden.
   B1 rechts van elke ingang, op de hoek tussen rotonde en fietspad; één groot rond D5-bord (zonder paal) midden op het middeneiland. */
function entries(ds,bike){
  ds=ds||265;
  var out=[I('d5',500,430,{s:1.3,nopost:true})],i,arms=[['bottom',0],['left',90],['top',180],['right',270]];
  var shark={bottom:[572,430+ds],top:[428,430-ds],left:[500-ds,502],right:[500+ds,358]};
  var px=bike?148:150,py=bike?690-430:700-430,sc=bike?.5:.6;
  for(i=0;i<arms.length;i++){
    var k=arms[i][0],r=arms[i][1],a=r*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
    /* positie voor de ingang onder, gedraaid naar de andere ingangen */
    out.push(I('yield',Math.round(500+px*c-py*sn),Math.round(430+px*sn+py*c),{rot:r,s:sc}),
      I('sharks',shark[k][0],shark[k][1],{rot:r,w:92}));
  }
  return out;
}
/* zebrapad op elke arm, voorbij de middengeleiders */
function zebras(){
  return [I('zebra',500,805,{w:240,h:56}),I('zebra',500,55,{w:240,h:56}),I('zebra',125,430,{w:240,h:56,rot:90}),I('zebra',875,430,{w:240,h:56,rot:90})];
}
function route(pts){
  return I('routepijl',500,430,{pts:pts.map(function(p){return [p[0]-500,p[1]-430];})});
}
var A_IN=[560,760];
var RPRESETS=[
  {id:'r1',label:'Rotonde oprijden: voorrang aan wie op de rotonde rijdt',R:250,
    q:{question:'Wie mag als eerste rijden?',answers:['A, want B komt van links','B, want A moet voorrang verlenen bij het oprijden','Wie het eerst aankomt','A, want hij rijdt rechtdoor'],correct:1},
    build:function(){
      return entries().concat([go(I('car',560,780,{color:C.red}),2),go(ringCar(135,C.blue),1),tagAt(480,800,'A'),tagAt(300,665,'B')]);
    }},
  {id:'r2',label:'Rotonde: rechtsaf (eerste afrit)',R:250,build:function(){
    return entries().concat([route([A_IN,[560,660],[600,592],[668,522],[760,490],[880,490]]),go(I('car',560,800,{color:C.red}),1,'r'),tagAt(480,800,'A')]);
  }},
  {id:'r3',label:'Rotonde: rechtdoor (tweede afrit)',R:250,build:function(){
    return entries().concat([route([A_IN,[560,668],[640,582],[690,450],[652,322],[560,252],[440,170],[440,40]]),go(I('car',560,800,{color:C.red}),1),tagAt(480,800,'A')]);
  }},
  {id:'r4',label:'Rotonde: linksaf (derde afrit)',R:250,build:function(){
    return entries().concat([route([A_IN,[560,668],[640,590],[690,450],[642,300],[500,232],[370,270],[302,332],[150,370],[30,370]]),go(I('car',560,800,{color:C.red}),1,'l'),tagAt(480,800,'A')]);
  }},
  {id:'r5',label:'Rotonde verlaten: voetganger op het zebrapad',R:250,
    q:{question:'A verlaat de rotonde. Wat moet A doen?',answers:['De voetganger laten oversteken','Doorrijden, want A rijdt op de rotonde','Claxonneren en doorrijden','Alleen stoppen als de voetganger al op het zebrapad loopt'],correct:0},
    build:function(){
      return entries().concat(zebras(),[go(I('ped',875,540,{color:C.orange}),1),
        go(I('car',735,490,{rot:90,color:C.red}),2),tagAt(735,565,'A')]);
    }},
  {id:'r6',label:'Rotonde met fietspad op de rotonde',R:250,bike:'ring',
    q:{question:'Wie mag als eerste rijden?',answers:['A, want de fietser rijdt naast de rotonde','B, want A moet voorrang verlenen aan wie op de rotonde rijdt, ook aan fietsers','Wie het eerst aankomt','A, want hij komt van rechts'],correct:1},
    build:function(){
      var a=118*Math.PI/180;
      return entries().concat([
        go(I('bike',Math.round(500+235*Math.cos(a)),Math.round(430+235*Math.sin(a)),{rot:118,color:C.blue}),1),
        go(I('car',560,780,{color:C.red}),2),tagAt(480,800,'A'),tagAt(330,640,'B')]);
    }},
  {id:'r7',label:'Rotonde met vrijliggend fietspad: fietser verleent voorrang',R:250,bike:'apart',
    q:{question:'A verlaat de rotonde. Wie mag eerst over de fietsoversteek?',answers:['A, want de fietser moet wachten aan het bord en de haaientanden','B, want fietsers hebben altijd voorrang op een fietsoversteek','B, want hij komt van rechts','Wie het eerst aankomt'],correct:0},
    build:function(){
      /* Het fietspad is een achthoek met zijden op 330 van het midden; fietsers rijden in tegenwijzerzin.
         Vóór elke oversteek: haaientanden over de volle breedte van het fietspad en een B1 voor de fietser.
         De opstelling voor de oversteek onder wordt gedraaid naar de andere drie oversteken. */
      var out=entries(258,true),k;
      for(k=0;k<4;k++){
        var r=-90*k,a=r*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
        function at(x,y){return [Math.round(500+x*c-y*sn),Math.round(430+x*sn+y*c)];}
        var t=at(-128,330),b=at(-172,370),rot=((90+r)%360+360)%360;
        out.push(I('sharks',t[0],t[1],{rot:rot,w:62,s:.45}),I('yield',b[0],b[1],{rot:rot,s:.6}));
      }
      return out.concat([go(I('bike',320,717,{rot:135,color:C.blue}),2),
        go(I('car',440,690,{rot:180,color:C.red}),1),tagAt(440,585,'A'),tagAt(285,690,'B')]);
    }}
];

export {PRESETS,XPRESETS,RPRESETS};
