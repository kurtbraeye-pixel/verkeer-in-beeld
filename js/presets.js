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
  if(o.pace)it.pace=o.pace;
  if(d.stretch){it.w=o.w||d.w;it.h=o.h||d.h;}
  if(type==='vlak')it.pts=copyPts(o.pts||SHAPES[2]);
  if(type==='routepijl')it.pts=copyPts(o.pts||ROUTES[o.shape==null?1:o.shape]);
  return it;
}
function edgeLines(a,b){return [I('solid',a,430,{h:860}),I('solid',b,430,{h:860})];}
/* volgorde bij afspelen (n = 1, 2 …) en rijrichting: s rechtdoor, l/r afslaan, ml/mr van rijstrook wisselen,
   o hindernis voorbijrijden, p aan de kant stilstaan, k kruisen (rechte weg), u keren (rotonde) */
function go(it,n,route){it.order=n;if(route&&route!=='s')it.route=route;return it;}
/* stopt na hold px en rijdt in stap n2 verder */
function hold(it,d,n2){it.hold=d;it.order2=n2;return it;}
function tagAt(x,y,t){return I('tag',x,y,{text:t});}
var PRESETS=[
  {id:'p1',label:'Rechte weg met twee richtingen',roadW:280,
    q:{question:'Mag A de onderbroken middenstreep overschrijden?',answers:['Ja, bijvoorbeeld om in te halen, als dat veilig kan','Nee, nooit','Alleen om links af te slaan','Alleen buiten de bebouwde kom'],correct:0},
    build:function(){
    return edgeLines(372,628).concat([I('dashed',500,430,{h:860}),go(I('car',570,640,{color:C.red}),1),go(I('car',430,230,{rot:180,color:C.blue}),1),
      tagAt(570,745,'A'),tagAt(430,125,'B')]);
  }},
  {id:'p2',label:'Twee rijstroken per richting met middenberm',roadW:640,
    q:{question:'A heeft B ingehaald op de linker rijstrook. Wat doet A daarna?',answers:['Terug naar de rechter rijstrook zodra dat veilig kan','Links blijven rijden tot de volgende afrit','Links blijven, want hij rijdt sneller dan B','Het maakt niet uit op welke rijstrook hij rijdt'],correct:0},
    build:function(){
    return [I('midberm',500,430,{w:60,h:860})].concat(edgeLines(192,808),edgeLines(458,542),[
      I('dashed',325,430,{h:860}),I('dashed',675,430,{h:860}),
      go(I('car',602,330,{color:C.red}),1,'mr'),go(I('car',747,560,{color:C.blue}),1),
      go(I('car',398,200,{rot:180,color:C.green}),1),go(I('car',252,330,{rot:180,color:C.orange}),1),
      tagAt(602,435,'A'),tagAt(747,665,'B')]);
  }},
  {id:'p4',label:'Rijstrookvermindering: ritsen',roadW:280,
    q:{question:'De rechter rijstrook van B valt weg. Wanneer voegt B in?',answers:['Pas vlak voor het einde van zijn rijstrook, om beurten (ritsen)','Zo vroeg mogelijk, ver voor de versmalling','B moet stoppen tot de linker rijstrook helemaal vrij is','B heeft voorrang, want hij komt van rechts'],correct:0},
    build:function(){
    /* boven de versmalling is de rechter strook weg: daar ligt berm en de lijn op 500 is de nieuwe kantlijn */
    return [I('grasberm',572,176,{w:136,h:352}),I('solid',372,430,{h:860}),I('solid',628,670,{h:380}),
      I('solid',500,176,{h:352}),I('solid',564,416,{rot:315,h:181}),
      I('dashed',500,606,{h:508}),
      I('arrow_ml',564,570),I('mergesign',730,640,{s:1.5}),
      go(I('car',436,640,{color:C.blue}),1),go(I('car',564,740,{color:C.orange}),2,'ml'),
      I('tag',436,545,{text:'A'}),I('tag',564,645,{text:'B'})];
  }},
  {id:'p6',label:'Parkeerverbod: gele onderbroken streep',roadW:300,
    q:{question:'Mag A langs deze gele onderbroken streep stilstaan of parkeren?',answers:['Stilstaan mag (bijvoorbeeld iemand laten uitstappen), parkeren niet','Parkeren mag, stilstaan niet','Stilstaan en parkeren zijn allebei verboden','Stilstaan en parkeren zijn allebei toegelaten'],correct:0},
    build:function(){
    return [I('stoep',685,430,{w:70,h:860}),I('stoep',315,430,{w:70,h:860}),I('dashed',500,430,{h:860}),
      I('ydashed',641,430,{h:860}),go(I('car',580,620,{color:C.green}),1,'p'),go(I('car',415,200,{rot:180,color:C.blue}),1),
      tagAt(580,725,'A')];
  }},
  {id:'p7',label:'Verdrijvingsvlak',roadW:420,
    q:{question:'Mag je over een verdrijvingsvlak rijden?',answers:['Nee, je mag er niet op rijden en er niet stilstaan','Ja, om in te halen','Ja, als er geen tegenligger is','Alleen fietsers mogen erover'],correct:0},
    build:function(){
    return edgeLines(302,698).concat([
      I('vlak',500,430,{pts:[[0,-260],[50,-150],[50,150],[0,260],[-50,150],[-50,-150]]}),
      I('dashed',500,85,{h:170}),I('dashed',500,775,{h:170}),
      go(I('car',624,640,{color:C.red}),1),go(I('car',376,220,{rot:180,color:C.blue}),1),tagAt(624,745,'A')]);
  }},
  {id:'p8',label:'Wegenwerken met tijdelijke markering',roadW:420,
    q:{question:'Welke markering moet A volgen?',answers:['De gele tijdelijke markering: die gaat voor op de witte','De witte markering','De markering die het dichtst bij de rand ligt','Geen van beide, A rijdt waar er plaats is'],correct:0},
    build:function(){
    /* gele tijdelijke markering gaat voor op de witte: de middellijn schuift naar links,
       een schuine gele lijn leidt het verkeer langs de werfzone rechts */
    return edgeLines(302,698).concat([
      I('dashed',500,430,{h:860}),
      I('tdashed',440,430,{h:860}),
      I('tsolid',590,265,{h:330}),I('tsolid',640,535,{rot:335,h:233}),
      I('barrier',630,265,{rot:90,w:330}),
      I('cone',640,480),I('cone',664,530),I('cone',685,580),
      I('workwarn',790,700,{s:1.5}),go(I('car',530,720,{color:C.red}),1),go(I('car',370,300,{rot:180,color:C.white}),1),tagAt(530,825,'A')]);
  }},
  {id:'p9',label:'Hindernis voorbijrijden: defecte auto',roadW:280,
    q:{question:'Een defecte auto staat stil op de rijstrook van A. Wat doet A?',answers:['De defecte auto voorbijrijden over de onderbroken streep, nadat tegenligger B voorbij is','Wachten tot de defecte auto weggesleept is','Meteen voorbijrijden: B moet voor A stoppen','Claxonneren tot de defecte auto aan de kant gaat'],correct:0},
    build:function(){
    return edgeLines(372,628).concat([I('dashed',500,430,{h:860}),
      I('carD',564,330,{color:C.white}),go(I('car',564,720,{color:C.red}),2,'o'),go(I('car',436,150,{rot:180,color:C.blue}),1),
      I('tag',564,815,{text:'A'}),I('tag',436,45,{text:'B'})]);
  }},
  {id:'p10',label:'Hindernis voorbijrijden over een doorlopende streep',roadW:280,
    q:{question:'Een omgevallen boom blokkeert de rijstrook van A. Er is een doorlopende streep. Wat doet A?',answers:['De boom voorbijrijden, ook over de doorlopende streep, nadat tegenligger B voorbij is','Niet voorbijrijden: over een doorlopende streep mag je nooit rijden','Meteen voorbijrijden: B moet voor A stoppen','Achteruit terugrijden tot waar de streep onderbroken is'],correct:0},
    build:function(){
    return edgeLines(372,628).concat([I('solid',500,430,{h:860}),
      I('tree',548,300,{rot:6,s:.62}),go(I('car',564,700,{color:C.orange}),2,'o'),go(I('car',436,150,{rot:180,color:C.blue}),1),
      I('tag',564,795,{text:'A'}),I('tag',436,45,{text:'B'})]);
  }},
  {id:'p11',label:'Fietsstraat: auto achter een fietser',roadW:280,
    q:{question:'Auto B rijdt in een fietsstraat achter fietser A. Wat mag B?',answers:['Achter de fietser blijven: inhalen mag niet en hoogstens 30 km/u','De fietser inhalen als er geen tegenligger is','Claxonneren zodat de fietser aan de kant gaat','De fietser inhalen, op voorwaarde dat hij niet sneller rijdt dan 30 km/u'],correct:0},
    build:function(){
    /* fietsstraat zonder middenstreep; de fietser rijdt midden op de rechterhelft */
    return edgeLines(372,628).concat([I('f111',680,770),
      go(I('bike',560,470,{color:C.blue}),1),go(I('car',560,690,{color:C.red}),1),
      tagAt(612,470,'A'),tagAt(620,690,'B')]);
  }},
  {id:'p12',label:'Fietsstraat: fietser haalt de auto in',roadW:280,
    q:{question:'Fietser D haalt auto C links in. C rijdt achter fietser A. Wat klopt?',answers:['D mag C inhalen, maar C mag fietser A niet inhalen en rijdt hoogstens 30 km/u','D mag C niet inhalen, want in een fietsstraat is inhalen verboden','C mag A inhalen als er geen tegenligger is','C moet aan de kant gaan zodat D kan passeren'],correct:0},
    build:function(){
    /* A en B vooraan, C blijft erachter op hetzelfde tempo; D rijdt sneller en haalt links in */
    return edgeLines(372,628).concat([I('f111mark',500,215),
      go(I('bike',532,450,{color:C.blue,pace:110}),1),go(I('brom',596,450,{color:C.orange,pace:110}),1),
      go(I('car',564,620,{color:C.red,pace:110}),1),go(I('bike',564,770,{color:C.green}),1,'ml'),
      tagAt(475,450,'A'),tagAt(660,450,'B'),tagAt(660,620,'C'),tagAt(660,770,'D')]);
  }},
  {id:'p13',label:'Woonerf',roadW:400,
    q:{question:'Voetganger A loopt midden op de weg in dit woonerf. Wat klopt?',answers:['Dat mag: voetgangers mogen de hele breedte gebruiken en bestuurders rijden hoogstens 20 km/u','Dat mag niet: voetgangers moeten aan de kant lopen','Dat mag, maar bestuurders mogen 30 km/u rijden','Auto C heeft voorrang op voetganger A'],correct:0},
    build:function(){
    /* parkeervakken links en rechts, niet over de hele lengte; geparkeerde auto's rijden niet mee */
    return edgeLines(312,688).concat([I('parkeer',354,250,{w:70,h:440}),I('parkeer',646,490,{w:70,h:440}),
      I('car',354,250,{rot:180,color:C.white}),I('car',354,390,{rot:180,color:C.yellow}),I('car',646,490,{color:C.green}),
      I('f12a',748,770),
      go(I('ped',500,430,{color:C.orange}),1),go(I('bike',575,560,{color:C.blue,pace:100}),1),go(I('car',575,760,{color:C.red,pace:100}),1),
      tagAt(440,430,'A'),tagAt(525,560,'B'),tagAt(520,760,'C')]);
  }},
  {id:'p14',label:'Voetgangerszone: laden en lossen',roadW:280,
    q:{question:'Het is 9 uur. Auto A komt leveren en rijdt stapvoets. Motorfiets B rijdt gewoon door de zone. Wie is in overtreding?',answers:['Alleen B: A mag van 6 tot 12 uur laden en lossen','Alleen A: in een voetgangerszone mag nooit een auto','A en B allebei','Niemand: stapvoets rijden mag iedereen'],correct:0},
    build:function(){
    return edgeLines(372,628).concat([I('f103',705,770),
      go(I('ped',520,520,{color:C.green}),1),go(I('ped',410,500,{color:C.yellow}),1),go(I('ped',520,300,{rot:180,color:C.blue}),1),
      go(I('car',585,720,{color:C.red,pace:70}),1),go(I('motor',470,130,{rot:180,color:C.orange,pace:150}),1),
      tagAt(650,720,'A'),tagAt(430,130,'B')]);
  }},
  {id:'p15',label:'Voorbehouden weg',roadW:240,
    q:{question:'Wie mag deze voorbehouden weg (F99a) gebruiken?',answers:['Voetgangers, fietsers, ruiters en bestuurders van speed pedelecs','Iedereen, als hij stapvoets rijdt','Alleen voetgangers en fietsers','Ook auto\'s van bewoners'],correct:0},
    build:function(){
    return edgeLines(392,608).concat([I('f99a',650,770),
      go(I('ruiter',555,580,{color:C.red}),1),go(I('bike',555,290,{color:C.blue,pace:120}),1),
      go(I('ped',478,620,{color:C.green}),1),go(I('bike',425,110,{rot:180,color:C.orange,pace:120}),1)]);
  }},
  {id:'p16',label:'Weg met middenrijbaan',roadW:340,
    q:{question:'Op deze weg met middenrijbaan rijdt fietser C rechts van de lijn. Wanneer mogen de auto\'s over de streep rijden?',answers:['Alleen om elkaar te kruisen; anders rijden ze in het midden','Altijd, want het zijn onderbroken lijnen','Nooit, ook niet om te kruisen','Alleen om de fietser in te halen'],correct:0},
    build:function(){
    /* A en B wijken uit om te kruisen; daarna rijdt A terug in het midden en haalt de fietser in */
    return [I('dashed',420,430,{h:860}),I('dashed',580,430,{h:860}),
      go(I('car',500,790,{color:C.red,pace:200}),1,'k'),go(I('car',500,450,{rot:180,color:C.blue,pace:200}),1,'k'),
      go(I('bike',625,430,{color:C.green,pace:70}),1),
      tagAt(440,790,'A'),tagAt(560,450,'B'),tagAt(680,430,'C')];
  }},
  {id:'p17',label:'Zebrapad: auto\'s stoppen voor de voetganger',roadW:280,
    q:{question:'Voetganger C wil oversteken op het zebrapad. Wat doen de auto\'s A en B?',answers:['Stoppen voor het zebrapad en C laten oversteken','Doorrijden: wie al rijdt heeft voorrang','Claxonneren zodat C blijft wachten','Alleen vertragen en rond C rijden'],correct:0},
    build:function(){
    /* stap 1 de auto's stoppen, stap 2 de voetganger steekt over, stap 3 de auto's rijden verder */
    return edgeLines(372,628).concat([I('dashed',500,615,{h:490}),I('dashed',500,145,{h:290}),I('zebra',500,330,{w:256,h:60}),
      I('a21',680,745),I('f49',680,255),
      hold(go(I('car',564,640,{color:C.red}),1),190,3),hold(go(I('car',564,780,{color:C.blue}),1),190,3),
      go(I('ped',345,330,{rot:90,color:C.orange}),2),
      tagAt(505,640,'A'),tagAt(505,780,'B'),tagAt(345,265,'C')]);
  }},
  {id:'p18',label:'Oversteekplaats fietsers: de fietser wacht',roadW:280,
    q:{question:'Fietser C komt aan de oversteekplaats voor fietsers. Op de rijbaan naderen de auto\'s A en B. Wie gaat eerst?',answers:['A en B: C moet wachten','C: op een oversteekplaats heeft de fietser altijd voorrang','Wie het eerst aankomt','C, als hij zijn arm uitsteekt'],correct:0},
    build:function(){
    /* schuine oversteekplaats tussen twee stukken fietspad; stap 1 iedereen rijdt en de fietser stopt aan de rand, stap 2 de fietser steekt over */
    return edgeLines(372,628).concat([I('dashed',500,615,{h:490}),I('dashed',500,145,{h:290}),
      I('fietspad',149,532,{w:48,h:490,rot:60}),I('fietspad',851,128,{w:48,h:490,rot:60}),I('fietsoversteek',500,330,{rot:330,w:330,h:50}),
      I('a25',680,745),I('f50',690,320),I('sharks',341,422,{rot:60,w:44}),I('yield',280,521,{rot:60,s:.6}),
      go(I('car',564,620,{color:C.red}),1),go(I('car',564,770,{color:C.blue}),1),
      hold(go(I('bike',128,545,{rot:60,color:C.green}),1),186,2),
      tagAt(505,620,'A'),tagAt(505,770,'B'),tagAt(95,480,'C')]);
  }}
];
/* ---------- voorbeeldsituaties (kruispunt) ---------- */
function carX(dirName,color,off){
  off=off||0;
  var m={bottom:[560,700+off,0],top:[440,160-off,180],left:[200-off,490,90],right:[800+off,370,270]}[dirName];
  return I('car',m[0],m[1],{rot:m[2],color:color});
}
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
/* straat net voorbij het kruispunt afgesloten met een hek en bord; rechts blijft een opening voor fietser en voetganger */
function gateStreet(sign){
  return [I('barrier',455,285,{w:150}),I(sign,455,212),
    go(I('bike',556,520,{color:C.blue}),1),go(I('ped',598,470,{color:C.green}),1),
    go(I('car',560,660,{color:C.red}),2,'r'),go(I('car',560,800,{color:C.orange}),3,'l'),
    tagAt(650,660,'A'),tagAt(650,800,'B'),tagAt(505,520,'C'),tagAt(650,470,'D')];
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
  {id:'c6',label:'Kruispunt met verkeerslichten',vw:240,hw:240,arm:null,
    q:{question:'B en C hebben groen. B slaat links af, C rijdt rechtdoor. Wie mag eerst?',answers:['C, want wie links afslaat, laat tegenliggers voorgaan','B, want hij komt van rechts','Ze rijden tegelijk, want ze hebben allebei groen','A, want hij staat het dichtst bij het kruispunt'],correct:0},
    build:function(){
    return [I('light',690,620,{state:'red'}),I('light',310,240,{state:'red',rot:180}),I('light',310,620,{state:'green',rot:90}),I('light',690,240,{state:'green',rot:270}),
      I('stopline',560,621,{w:108}),I('stopline',440,239,{rot:180,w:108}),I('stopline',309,490,{rot:90,w:108}),I('stopline',691,370,{rot:270,w:108}),
      I('zebra',500,580,{w:240,h:56}),I('zebra',500,280,{w:240,h:56}),
      go(I('ped',440,582,{color:C.orange,rot:90}),1),go(I('ped',560,278,{color:C.green,rot:270}),1),
      carX('bottom',C.red),go(carX('left',C.blue),2,'l'),go(carX('right',C.white),1),
      tagAt(560,810,'A'),tagAt(95,490,'B'),tagAt(905,370,'C')];
  }},
  {id:'c7',label:'Voorsorteren met verkeerslichten, borden en wegmarkeringen',vw:720,hw:240,arm:null,
    q:{question:'A en D staan op de strook om links af te slaan, B en C rijden rechtdoor. Iedereen heeft groen. Wie rijdt eerst?',answers:['B en C, want wie links afslaat, laat tegenliggers voorgaan','A en D, want zij staan op hun eigen rijstrook','Iedereen tegelijk, want ze hebben allemaal groen','Wie het eerst vertrekt'],correct:0},
    build:function(){
    var lights=[I('light',900,592,{state:'green'})];
    return [I('zebra',500,580,{w:720,h:56}),I('zebra',500,280,{w:720,h:56})].concat(
      sortLanes(760),flip(sortLanes(760)),lights,flip(lights),[
      I('dashed',70,430,{h:140,rot:90}),I('dashed',930,430,{h:140,rot:90}),
      go(I('car',680,800,{color:C.red}),1),go(I('car',560,800,{color:C.orange}),2,'l'),
      go(I('car',320,60,{rot:180,color:C.blue}),1),go(I('car',440,60,{rot:180,color:C.green}),2,'l'),
      tagAt(560,715,'A'),tagAt(680,715,'B'),tagAt(320,145,'C'),tagAt(440,145,'D')]);
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
  {id:'c9',label:'Zebrapad: afslaan met voetganger en fietser',vw:240,hw:240,arm:null,
    q:{question:'A slaat rechts af. Wie mag eerst?',answers:['De voetganger en de fietser','A, want hij was er eerst','Alleen de voetganger; de fietser wacht achter A','A, want de fietser rijdt naast hem in dezelfde richting'],correct:0},
    build:function(){
    return [I('zebra',650,430,{w:240,h:56,rot:90}),
      I('routepijl',605,560,{shape:3}),
      go(I('ped',650,345,{color:C.orange,rot:180}),1),go(I('bike',607,655,{color:C.blue}),1),
      go(carX('bottom',C.red),2,'r'),tagAt(560,810,'A')];
  }},
  {id:'c10',label:'Speelstraat: hek net na het kruispunt',vw:240,hw:240,arm:null,
    q:{question:'Wie mag voorbij het hek de speelstraat in?',answers:['Fietser C en voetganger D; de auto\'s A en B slaan links of rechts af','Iedereen, als hij stapvoets rijdt','Alleen voetganger D','Niemand: het hek sluit de straat'],correct:0},
    build:function(){return gateStreet('speelstraat');}},
  {id:'c11',label:'Schoolstraat: hek net na het kruispunt',vw:240,hw:240,arm:null,
    q:{question:'Wie mag voorbij het hek de schoolstraat in?',answers:['Fietser C en voetganger D; de auto\'s A en B slaan links of rechts af','Iedereen, als hij stapvoets rijdt','Alleen voetganger D','Niemand: het hek sluit de straat'],correct:0},
    build:function(){return gateStreet('schoolstraat');}}
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
var RPRESETS=[
  {id:'r1',label:'Rotonde oprijden: voorrang aan wie op de rotonde rijdt',R:250,
    q:{question:'Wie mag als eerste rijden?',answers:['A, want B komt van links','B, want A moet voorrang verlenen bij het oprijden','Wie het eerst aankomt','A, want hij rijdt rechtdoor'],correct:1},
    build:function(){
      return entries().concat([go(I('car',560,780,{color:C.red}),2),go(ringCar(135,C.blue),1),tagAt(480,800,'A'),tagAt(300,665,'B')]);
    }},
  {id:'r2',label:'Rotonde: welke afrit? (richtingaanwijzer)',R:250,
    q:{question:'Wanneer zet je op een rotonde je richtingaanwijzer aan?',answers:['Rechts, net voor je de rotonde verlaat','Links, als je de derde afrit neemt','Rechts, als je de rotonde oprijdt','Nooit, op een rotonde hoeft dat niet'],correct:0},
    build:function(){
      /* A neemt de 1e afrit (rechtsaf), B de 2e (rechtdoor), C de 3e (linksaf) */
      return entries().concat([go(I('car',560,780,{color:C.red}),1,'r'),go(I('car',780,370,{rot:270,color:C.blue}),2),go(I('car',440,80,{rot:180,color:C.green}),3,'l'),
        tagAt(480,800,'A'),tagAt(850,300,'B'),tagAt(360,80,'C')]);
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
