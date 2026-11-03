/* Tekenvlak-constanten, de tekeningen van alle weggebruikers, borden en markeringen,
   en de indeling van het materiaalpaneel. Bevat geen DOM-code. */
var W=1000,H=860,CX=500,CY=430;
var ROT={bottom:0,top:180,left:90,right:270};
var ARROW={bottom:'↑',top:'↓',left:'→',right:'←'};
var DIRLABEL={bottom:'onder',top:'boven',left:'links',right:'rechts'};
var COLORS=['#d33a2f','#2d63c8','#2e9a57','#f2b705','#f2f4f5','#2b2e33','#ee7a1e','#8e979e'];
var SVGNS='http://www.w3.org/2000/svg';
var WHITE='#f3f3ee';
var SHAPES=[
  [[-80,-130],[80,-130],[80,130],[-80,130]],
  [[-45,-130],[45,-130],[80,130],[-80,130]],
  [[-55,-130],[55,-130],[85,20],[40,130],[-80,130]]
];
var ROUTES=[
  [[0,80],[0,-80]],
  [[-20,80],[-20,30],[20,-30],[20,-80]],
  [[20,110],[20,70],[-20,30],[-20,-30],[20,-70],[20,-110]],
  [[-45,70],[-45,20],[-30,-20],[5,-40],[45,-40]],
  [[45,70],[45,20],[30,-20],[-5,-40],[-45,-40]]
];
var ROUTELABEL=['Pijl recht','S-bocht','Boog (inhalen)','Bocht rechts','Bocht links'];
function copyPts(a){return a.map(function(q){return q.slice();});}
function isPts(it){return it.type==='vlak'||it.type==='routepijl';}
function routePath(p,dash){
  var n=p.length,P=p.map(function(q){return q.slice();});
  var dx=P[n-1][0]-P[n-2][0],dy=P[n-1][1]-P[n-2][1],L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  var tip=P[n-1].slice(),cut=Math.min(22,L*.6);
  P[n-1]=[tip[0]-dx*cut,tip[1]-dy*cut];
  var d='M'+P[0][0]+' '+P[0][1],i;
  for(i=0;i<n-1;i++){
    var a=P[Math.max(0,i-1)],b=P[i],c=P[i+1],e=P[Math.min(n-1,i+2)];
    d+='C'+(b[0]+(c[0]-a[0])/4)+' '+(b[1]+(c[1]-a[1])/4)+' '+(c[0]-(e[0]-b[0])/4)+' '+(c[1]-(e[1]-b[1])/4)+' '+c[0]+' '+c[1];
  }
  var px=-dy,py=dx,hb=[tip[0]-dx*30,tip[1]-dy*30];
  var head='<polygon points="'+(hb[0]+px*17)+','+(hb[1]+py*17)+' '+tip[0]+','+tip[1]+' '+(hb[0]-px*17)+','+(hb[1]-py*17)+'" fill="#1b6ec2" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>';
  var da=dash?' stroke-dasharray="16 11"':'';
  return '<path d="'+d+'" fill="none" stroke="#000" stroke-opacity="0" stroke-width="30"/>'+
    '<path d="'+d+'" fill="none" stroke="#fff" stroke-width="12" opacity=".9"'+da+'/>'+
    '<path d="'+d+'" fill="none" stroke="#1b6ec2" stroke-width="7"'+da+'/>'+head;
}
function vbox(p){
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  p.forEach(function(q){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);});
  return [x0,y0,x1,y1];
}
function normV(it){
  var bb=vbox(it.pts),cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,a=it.rot*Math.PI/180;
  it.pts=it.pts.map(function(q){return [Math.round((q[0]-cx)*10)/10,Math.round((q[1]-cy)*10)/10];});
  it.x+=(cx*Math.cos(a)-cy*Math.sin(a))*it.s;it.y+=(cx*Math.sin(a)+cy*Math.cos(a))*it.s;
}

function shade(hex,t){
  var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,m=t<0?0:255,k=Math.abs(t);
  r=Math.round(r+(m-r)*k);g=Math.round(g+(m-g)*k);b=Math.round(b+(m-b)*k);
  return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
}
/* Tekenregels (zie CLAUDE.md): vaste lijndiktes, schaduw en kleuren voor alle tekeningen */
var STYLE={
  lw:{big:2.5,small:2,detail:1.5,fine:1.2},          /* lijndiktes bij 100% */
  shadow:[3,4],shadowOpacity:.18,                     /* zachte schaduw onder alles wat boven de weg uitsteekt */
  col:{tyre:'#1c1c1e',head:'#ffe27a',rear:'#c8202a',glassFront:'#bfe0ee',glassRear:'#9fc4d6',
       skin:'#f0c29b',hair:'#4a3426',blink:'#ffa400',brake:'#ff1f1f',beacon:'#2f8bff'}
};
/* rand in een donkerdere tint van de eigen kleur */
function edge(c){return shade(c,-.35);}
/* schaduw: dezelfde vorm (svg-string) verschoven en half doorzichtig zwart; met it valt ze altijd rechtsonder,
   ook als het onderdeel gedraaid of gespiegeld is */
function shadowOf(shape,it){
  var x=STYLE.shadow[0],y=STYLE.shadow[1];
  if(it){var a=-(it.rot||0)*Math.PI/180,c=Math.cos(a),n=Math.sin(a),ox=x*c-y*n,oy=x*n+y*c;x=ox*(it.flip||1);y=oy;}
  return '<g transform="translate('+x.toFixed(2)+' '+y.toFixed(2)+')" fill="#000" stroke="none" opacity="'+STYLE.shadowOpacity+'">'+shape+'</g>';
}
/* buitenspiegel: klein huisje op een armpje, links en rechts op hoogte y */
function mirrors(x,y,c,d){
  var m=function(s){return '<g transform="scale('+s+' 1)"><path d="M'+x+' '+(y+3)+'H'+(x+4)+'" stroke="'+d+'" stroke-width="2.4"/>'+
    '<rect x="'+(x+3)+'" y="'+y+'" width="6" height="7" rx="2.2" fill="'+c+'" stroke="'+d+'" stroke-width="'+STYLE.lw.fine+'"/></g>';};
  return m(1)+m(-1);
}
function wheels(list){
  return list.map(function(p){return '<rect x="'+p[0]+'" y="'+p[1]+'" width="8" height="'+(p[2]||22)+'" rx="3" fill="'+STYLE.col.tyre+'"/>';}).join('');
}
function lights(front,back,fw,bw){
  var h=STYLE.col.head,r=STYLE.col.rear;
  return '<rect x="'+(-fw)+'" y="'+front+'" width="13" height="5" rx="2" fill="'+h+'"/><rect x="'+(fw-13)+'" y="'+front+'" width="13" height="5" rx="2" fill="'+h+'"/>'+
         '<rect x="'+(-bw)+'" y="'+back+'" width="13" height="4" rx="2" fill="'+r+'"/><rect x="'+(bw-13)+'" y="'+back+'" width="13" height="4" rx="2" fill="'+r+'"/>';
}
function octagon(r,cy){
  var pts=[];for(var i=0;i<8;i++){var a=(i*45+22.5)*Math.PI/180;pts.push((r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1));}
  return pts.join(' ');
}
function signWrap(plate){
  return '<g transform="translate(0,4)"><rect x="-3.5" y="-16" width="7" height="86" fill="#9aa1a6" stroke="#6c737a" stroke-width="1"/><rect x="-10" y="66" width="20" height="5" rx="2" fill="#6c737a"/>'+plate+'</g>';
}
function dashes(h,len,gap,wid,col){
  var s='',y=-h/2;
  while(y<h/2-1){var l=Math.min(len,h/2-y);s+='<rect x="'+(-wid/2)+'" y="'+y+'" width="'+wid+'" height="'+l+'" fill="'+col+'"/>';y+=len+gap;}
  return s;
}
/* bevoegd persoon in bovenaanzicht; de voorkant (klep van de pet, voeten) wijst naar +y,
   zodat hij met "Komt van" naar de naderende bestuurder kijkt */
function agent(arm,it){
  var vest='#d4e03a',sleeve='#2a4a86',navy='#1d3566',glove='#ffffff',s='';
  s+='<ellipse cx="-9" cy="13" rx="5" ry="7.5" fill="#111"/><ellipse cx="9" cy="13" rx="5" ry="7.5" fill="#111"/>';
  if(arm==='side'){
    s+='<rect x="-64" y="-6" width="44" height="12" rx="6" fill="'+sleeve+'"/><circle cx="-63" cy="0" r="6.5" fill="'+glove+'" stroke="#9aa3a9" stroke-width="1.2"/>';
    s+='<rect x="20" y="-6" width="44" height="12" rx="6" fill="'+sleeve+'"/><circle cx="63" cy="0" r="6.5" fill="'+glove+'" stroke="#9aa3a9" stroke-width="1.2"/>';
  }else{
    /* linkerarm langs het lichaam; de opgestoken rechterarm zie je als schaduw op de grond en een hand boven de schouder */
    s+='<ellipse cx="-26" cy="4" rx="5.5" ry="10" fill="'+sleeve+'"/>';
    s+='<ellipse cx="46" cy="-18" rx="22" ry="6" fill="#000" opacity=".18" transform="rotate(-28 46 -18)"/>';
  }
  s+='<ellipse cx="0" cy="0" rx="24" ry="13" fill="'+vest+'" stroke="#9aa51a" stroke-width="2"/>';
  s+='<ellipse cx="0" cy="0" rx="17" ry="8" fill="none" stroke="#eef2f3" stroke-width="3"/>';
  s+='<circle cx="0" cy="-1" r="11.5" fill="'+navy+'"/><path d="M-9 6Q0 16 9 6Z" fill="#0f1f44"/><rect x="-3" y="1" width="6" height="4" rx="1" fill="#e5c24a"/>';
  if(arm!=='side'){
    s+='<circle cx="23" cy="-4" r="8.5" fill="'+sleeve+'"/><circle cx="23" cy="-5" r="7" fill="'+glove+'" stroke="#9aa3a9" stroke-width="1.2"/>';
  }
  var sh=arm==='side'?'<rect x="-64" y="-6" width="128" height="12" rx="6"/><ellipse cx="0" cy="2" rx="24" ry="14"/>':'<ellipse cx="0" cy="2" rx="26" ry="14"/>';
  return '<g transform="scale(1.3)">'+shadowOf(sh,it)+s+'</g>';
}
/* ---------- borden: verhoudingen zoals de officiële SB250-borden (verkeersbord.be) ---------- */
var RED='#d3202a',INK='#111',ORANGE='#e8801a';
/* lijnletters voor cijfers en tekst op borden: overal dezelfde vorm, ook in een gedownloade afbeelding */
function f(n){return +n.toFixed(2);}
function pt(cx,cy,rx,ry,deg){var a=deg*Math.PI/180;return [cx+rx*Math.cos(a),cy+ry*Math.sin(a)];}
function P(p){return f(p[0])+' '+f(p[1]);}
function arc(rx,ry,large,sweep,p){return 'A'+f(rx)+' '+f(ry)+' 0 '+large+' '+sweep+' '+P(p);}

/* ---------- lijnletters: middellijn in een vak van w breed en h hoog, lijndikte sw ---------- */
function ell(cx,cy,rx,ry){return 'M'+P([cx-rx,cy])+arc(rx,ry,1,0,[cx+rx,cy])+arc(rx,ry,1,0,[cx-rx,cy]);}
function six(w,h,map){
  var r=w/2,rb=h*.33,cy=h-rb,a=pt(r,cy,r,rb,198),b=pt(r,cy,r,rb,18);
  return 'M'+P(map([w*.82,0]))+'L'+P(map(a))+arc(r,rb,1,0,map(b))+arc(r,rb,1,0,map(a));
}
function glyph(ch,w,h,sw){
  var r=w/2,e=sw/2,ru,rl;
  switch(ch){
    case '0':case 'O':return 'M0 '+f(r)+arc(r,r,0,1,[w,r])+'V'+f(h-r)+arc(r,r,0,1,[0,h-r])+'Z';
    case '1':return 'M0 '+f(h*.28)+'L'+f(w)+' 0V'+f(h+e);
    case '2':return 'M'+P(pt(r,r,r,r,195))+arc(r,r,0,1,pt(r,r,r,r,345))+'C'+f(w*1.02)+' '+f(h*.5)+' '+f(w*.2)+' '+f(h*.68)+' 0 '+f(h)+'H'+f(w+e);
    case '3':ru=h*.23;rl=h/2-ru;
      return 'M'+P(pt(r,ru,r*.9,ru,198))+arc(r*.9,ru,1,1,[r,2*ru])+arc(r,rl,1,1,pt(r,2*ru+rl,r,rl,158));
    case '4':return 'M'+f(w*.74)+' '+f(h+e)+'V0L0 '+f(h*.7)+'H'+f(w+e);
    case '5':rl=h*.32;var c=h-rl,a=pt(r,c,r,rl,212);return 'M'+f(w*.95)+' 0H'+f(a[0])+'V'+f(a[1])+arc(r,rl,1,1,pt(r,c,r,rl,150));
    case '6':return six(w,h,function(p){return p;});
    case '7':return 'M0 0H'+f(w)+'L'+f(w*.32)+' '+f(h+e);
    case '8':ru=h*.235;return ell(r,ru,r*.88,ru)+ell(r,2*ru+(h/2-ru),r,h/2-ru);
    case '9':return six(w,h,function(p){return [w-p[0],h-p[1]];});
    case 'S':return sShape(w,h,0);
    case 'Z':return 'M0 0H'+f(w)+'L0 '+f(h)+'H'+f(w);
    case 'N':return 'M0 '+f(h+e)+'V0L'+f(w)+' '+f(h)+'V'+f(-e);
    case 'E':return 'M'+f(w)+' 0H0V'+f(h)+'H'+f(w)+'M0 '+f(h/2)+'H'+f(w*.88);
    case 'F':return 'M'+f(w)+' 0H0V'+f(h+e)+'M0 '+f(h*.48)+'H'+f(w*.85);
  }
  /* kleine letters: x-hoogte vanaf xt tot onderaan */
  var xt=h*.3,xr=(h-xt)/2,cy=xt+xr;
  switch(ch){
    case 'i':return 'M'+f(r)+' '+f(-e*.8)+'V'+f(sw*.5)+'M'+f(r)+' '+f(xt+e*.6)+'V'+f(h+e);
    case 't':return 'M'+f(w*.38)+' '+f(h*.04)+'V'+f(h-xr*.55)+'Q'+f(w*.38)+' '+f(h)+' '+f(w*1.05)+' '+f(h)+'M'+f(-e)+' '+f(xt)+'H'+f(w+e);
    case 'e':return 'M0 '+f(cy)+'H'+f(w)+arc(r,xr,0,0,[0,cy])+arc(r,xr,0,0,pt(r,cy,r,xr,35));
    case 's':return sShape(w,h-xt,xt);
    case 'r':return 'M0 '+f(xt-e)+'V'+f(h+e)+'M0 '+f(xt+xr*.9)+'Q0 '+f(xt)+' '+f(w)+' '+f(xt);
    case 'a':return 'M'+f(w*.08)+' '+f(xt+xr*.3)+'Q'+f(w*.25)+' '+f(xt)+' '+f(r)+' '+f(xt)+'Q'+f(w)+' '+f(xt)+' '+f(w)+' '+f(xt+xr*.7)+'V'+f(h+e)+
      'M'+f(w)+' '+f(cy)+'H'+f(r)+'Q0 '+f(cy)+' 0 '+f(cy+xr*.5)+'Q0 '+f(h)+' '+f(r)+' '+f(h)+'Q'+f(w)+' '+f(h)+' '+f(w)+' '+f(cy+xr*.3);
    case 'T':return 'M'+f(-e)+' 0H'+f(w+e)+'M'+f(r)+' 0V'+f(h+e);
    case 'P':var hb=h*.56;return 'M0 '+f(h+e)+'V0H'+f(w-hb/2)+arc(hb/2,hb/2,0,1,[w-hb/2,hb])+'H0';
  }
  return '';
}
function sShape(w,h,oy){
  var r=w/2,ru=h*.24,rl=h/2-ru;
  return 'M'+P(pt(r,oy+ru,r,ru,-28))+arc(r,ru,1,0,[r,oy+2*ru])+arc(r,rl,1,1,pt(r,oy+2*ru+rl,r,rl,152));
}
var NARROW={'1':.62,'i':.35,'t':.7,'r':.65,'s':.85};
/* tekst gecentreerd op (cx,cy); W = breedte van één teken, H = hoogte, buitenmaten */
function letters(str,cx,cy,W,H,gap,sw,col){
  var e=sw/2,ws=[],tot=-gap,i,x,d='';
  for(i=0;i<str.length;i++){ws.push(W*(NARROW[str[i]]||1));tot+=ws[i]+gap;}
  x=cx-tot/2;
  for(i=0;i<str.length;i++){
    d+='<path transform="translate('+f(x+e)+' '+f(cy-H/2+e)+')" d="'+glyph(str[i],ws[i]-sw,H-sw,sw)+'"/>';
    x+=ws[i]+gap;
  }
  return '<g fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linejoin="miter" stroke-miterlimit="2.2">'+d+'</g>';
}
/* fiets in zijaanzicht met spaakwielen, kettingblad, zadel en stuur; naven op (±13,0), wielstraal 8.5 */
function bicycle(col,sw){
  var l='stroke="'+col+'" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  return '<g '+l+' stroke-width="'+sw+'">'+
    '<circle cx="-13" cy="0" r="8.5"/><circle cx="13" cy="0" r="8.5"/>'+
    '<path d="M-13 0L-.5 0L-4.6 -11.6ZM-4.6 -11.6L8.6 -11.6M10 -7.6L-.5 0M8.4 -12.6L10 -7.6Q11.6 -3.6 13 0M-4.6 -11.6L-5.2 -13.4"/>'+
    '<path d="M-8 -13.8H-2.4" stroke-width="'+(sw*1.9)+'"/>'+
    '<path d="M8.4 -12.6L8 -15.2Q6.6 -16.6 4.4 -16" />'+
    '<circle cx="-.5" cy="0" r="2.6"/><path d="M-.5 0L1.6 3.4" />'+
    '</g><circle cx="-13" cy="0" r="1.1" fill="'+col+'"/><circle cx="13" cy="0" r="1.1" fill="'+col+'"/><circle cx="-.5" cy="0" r=".9" fill="'+col+'"/>';
}
/* pijl op een rijstrookbord */
function laneArrow(c,x){
  var s='',st='stroke="#fff" fill="none" stroke-width="6.5" stroke-linejoin="miter"';
  function head(ex,ey,dx,dy){
    var px=-dy,py=dx;
    return '<polygon points="'+(ex+px*10).toFixed(1)+','+(ey+py*10).toFixed(1)+' '+(ex+dx*14).toFixed(1)+','+(ey+dy*14).toFixed(1)+' '+(ex-px*10).toFixed(1)+','+(ey-py*10).toFixed(1)+'" fill="#fff"/>';
  }
  var k=0.7071;
  if(c==='s'||c==='sr'||c==='sl')s+='<path d="M'+x+' -19V-62" '+st+'/>'+head(x,-62,0,-1);
  if(c==='sr')s+='<path d="M'+x+' -36L'+(x+7)+' -43" '+st+'/>'+head(x+7,-43,k,-k);
  if(c==='sl')s+='<path d="M'+x+' -36L'+(x-7)+' -43" '+st+'/>'+head(x-7,-43,-k,-k);
  if(c==='l')s+='<path d="M'+x+' -19V-36L'+(x-7)+' -45" '+st+'/>'+head(x-7,-45,-k,-k);
  if(c==='r')s+='<path d="M'+x+' -19V-36L'+(x+7)+' -45" '+st+'/>'+head(x+7,-45,k,-k);
  return s;
}
function arrowSR(){
  return '<g transform="translate(-11.5,0)"><path d="M0 -45L17 -15H7V45H-7V-15H-17Z" fill="'+WHITE+'"/>'+
    '<path d="M0 12Q0 -6 16 -6H22" fill="none" stroke="'+WHITE+'" stroke-width="8" stroke-linejoin="round"/><polygon points="20,-18 42,-6 20,6" fill="'+WHITE+'"/></g>';
}
function arrowMR(){
  return '<g transform="translate(-3,0)"><path d="M-18 45V10L8 -28" fill="none" stroke="'+WHITE+'" stroke-width="12" stroke-linejoin="round"/>'+
    '<polygon points="19.6,-20.2 -3.6,-35.8 20.3,-46.3" fill="'+WHITE+'"/></g>';
}
function arrowTurn(){
  return '<g transform="translate(-19,0)"><path d="M0 45V-8Q0 -22 14 -22H20" fill="none" stroke="'+WHITE+'" stroke-width="13" stroke-linejoin="round"/><polygon points="18,-42 46,-22 18,-2" fill="'+WHITE+'"/></g>';
}
var FBLUE='#1f66ae';
/* F97b (rechter rijstrook valt weg): pijl in de linker strook, de rechter strook buigt erin; F97 = gespiegeld */
function mergePlate(){
  return '<rect x="-22" y="-81" width="44" height="68" rx="5" fill="'+FBLUE+'" stroke="#fff" stroke-width="1.2"/>'+
    '<rect x="-18.5" y="-77.5" width="37" height="61" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/>'+
    '<path d="M9 -17V-33L-6 -47" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="miter"/>'+
    '<rect x="-10" y="-58" width="8" height="41" fill="#fff"/><polygon points="-17,-57 5,-57 -6,-73" fill="#fff"/>';
}
/* PICTO-BEGIN: pictogrammen, nagetekend naar de officiële borden (omtrek opgemeten, in bordcoördinaten) */
var PIC={
  a21:'M-0.6 -60.5L1.2 -60.6L1.9 -60.1L2 -59.7L2.1 -55L4.8 -54.2L8.2 -50.3L8.5 -49.5L9.3 -44.4L9.3 -43.6L9.1 -43.3L8 -43.1L7.7 -43.4L6.8 -48L5.1 -49.9L4.6 -50.5L4.4 -50.4L4.3 -43.6L7.4 -36.5L7.5 -36.2L8.1 -36L8 -35L9.9 -30.8L9.7 -30.5L6.8 -29.1L6.5 -29.3L6.3 -29.8L6.9 -30.9L6.9 -31.3L1.5 -40.3L1.1 -39.8L-0.8 -36.2L-0.6 -36L-1.8 -34.3L-4.6 -29L-8.1 -30.5L-8.3 -30.8L-7.8 -31.6L-6.5 -31.7L-1.2 -43.5L-1.2 -44.3L-1.4 -44.8L-1.5 -48L-1.7 -49.2L-1.9 -49.3L-3.3 -47.4L-8 -45L-8.3 -45L-8.7 -45.4L-9.1 -46.1L-4.7 -49.2L-2.4 -53.8L-0.6 -54.4L-0.4 -54.5L-0.4 -55.3L-1.2 -56L-1.4 -56.3L-1.4 -59.9L-1.1 -60.3ZM-20.2 -36L-18.5 -36.1L-18.3 -36L-18.8 -35.3L-20.4 -35.2L-20.7 -35.4ZM-15.8 -36L-14.1 -36.1L-13.8 -36L-14.3 -35.3L-16 -35.2L-16.3 -35.4ZM-11.3 -36L-9.7 -36.1L-9.4 -36L-9.9 -35.3L-11.6 -35.2L-11.8 -35.4ZM-6.9 -36L-5.3 -36.1L-5 -36L-5.5 -35.3L-7.1 -35.2L-7.4 -35.4ZM1.8 -36L3.4 -36.1L3.7 -35.9L3.3 -35.3L1.7 -35.2L1.4 -35.4ZM10.6 -36L12.2 -36.1L12.6 -35.9L12.2 -35.3L10.5 -35.2L10.3 -35.4ZM15 -36L16.7 -36.1L17 -35.9L16.6 -35.3L15 -35.2L14.7 -35.4ZM19.5 -36L21.1 -36.1L21.4 -35.9L21 -35.3L19.4 -35.2L19.1 -35.4ZM-25.3 -27.2L-23.8 -27.2L-23.5 -27.1L-24 -26.3L-25.5 -26.2L-25.8 -26.4ZM-20.9 -27.2L-19.4 -27.2L-19.1 -27.1L-19.6 -26.3L-21.1 -26.2L-21.4 -26.4ZM-16.4 -27.2L-15 -27.2L-14.7 -27.1L-15.2 -26.3L-16.7 -26.2L-17 -26.4ZM-12 -27.2L-10.5 -27.2L-10.2 -27.1L-10.8 -26.3L-12.2 -26.2L-12.6 -26.4ZM-7.6 -27.2L-6.1 -27.2L-5.8 -27.1L-6.3 -26.3L-7.8 -26.2L-8.1 -26.4ZM-3.2 -27.2L-1.7 -27.2L-1.4 -27.1L-1.9 -26.3L-3.4 -26.2L-3.7 -26.4ZM1.2 -27.2L2.7 -27.2L3 -27.1L2.5 -26.3L1 -26.2L0.7 -26.4ZM5.7 -27.2L7.1 -27.2L7.5 -27.1L6.9 -26.3L5.4 -26.2L5.1 -26.4ZM10.1 -27.2L11.6 -27.2L11.9 -27.1L11.3 -26.3L9.9 -26.2L9.5 -26.4ZM14.4 -27.2L16 -27.2L16.3 -27.1L15.8 -26.3L14.3 -26.2L14 -26.3L14 -26.6ZM18.8 -27.2L20.4 -27.2L20.7 -27.1L20.2 -26.3L18.7 -26.2L18.4 -26.3L18.4 -26.6ZM23.2 -27.2L24.8 -27.2L25.2 -27.1L24.6 -26.3L23.1 -26.2L22.9 -26.3L22.8 -26.6Z',
  a25:'M-0.8 -54.9L-0.2 -54.9L0.6 -54.3L1 -53.6L1 -52.9L1.4 -52L3.3 -50.3L4.9 -47.8L6.1 -44.6L6.4 -43.2L6.4 -42.9L6.6 -42.6L5.9 -42.1L5.6 -41.4L5.7 -40.9L6.5 -39L7 -38.8L8.2 -39.1L9 -39.2L10.7 -38.8L12.3 -37.8L13 -37.1L13.7 -35.9L13.7 -35.5L13.4 -36L13.3 -35.9L13.8 -34.4L13.8 -32.9L13.2 -31L11.6 -29.2L10.5 -28.7L9.9 -28.5L8.5 -28.3L7.5 -28.5L5.8 -29.2L5.2 -29.6L4.3 -30.7L3.8 -31.7L3.6 -33.2L3.4 -33.4L3.2 -33.1L2.9 -33.4L2.6 -33.3L2.3 -32.7L1.6 -32.1L1.5 -31.5L1.7 -31.2L1.5 -30.9L0.5 -30.8L-1 -31.1L-0.8 -31.4L-0.1 -31.6L0.3 -31.9L-0.5 -32L-0.7 -32.2L-0.7 -35.2L-5.3 -39.6L-5.8 -38.3L-4.4 -37.2L-3.6 -36L-3.1 -34.6L-2.9 -33.5L-3.1 -33.1L-3.3 -33.3L-3.8 -31.4L-4.7 -29.9L-5.3 -29.3L-6.5 -28.7L-7.7 -28.3L-9.5 -28.3L-10.3 -28.5L-11.9 -29.3L-12.5 -29.9L-13.2 -31L-13.8 -33L-13.6 -34.7L-13 -36L-12 -37.3L-10.3 -38.3L-9.5 -38.5L-7.7 -38.5L-6.2 -38L-6.7 -38.4L-8.2 -38.8L-9.7 -38.6L-11.1 -38.2L-11.1 -38.3L-9.2 -39L-7.8 -39L-6.3 -38.5L-6 -38.5L-4.5 -43.2L-3.6 -43.3L-2.7 -44L-1.9 -44.1L-1.4 -44.3L0.1 -46L0.3 -46.6L-0.2 -48.2L-0.3 -50.2L0.1 -51.1L0 -51.2L-0.6 -51L-1.5 -51.8L-1.6 -52.4L-2.2 -53.1L-2.2 -53.6L-1.4 -54.5ZM1.8 -45.2L-0.7 -43.1L-1.7 -43.1L-2.9 -42.6L-3.4 -42.7L-4.4 -42.7L-4.7 -41.6L-4.6 -41.4L-3.4 -41.4L1.1 -43.6L1.8 -44.3L2 -44.9ZM-4.6 -41.2L-5.1 -40.6L-5.1 -40.2L-4 -38.9L-0.7 -35.8L-0.7 -36.4L-0.9 -36.9L-3.7 -40.2L-3.8 -41.1ZM4.8 -41.2L2.3 -38.9L1.8 -38.1L1.4 -37.2L1.6 -35.1L1.8 -35.3L4.2 -39.7L4.9 -41.1ZM5.2 -40.8L1.9 -34.9L2.7 -33.6L3 -33.8L3.5 -35.7L4.1 -36.9L5.1 -37.8L6.2 -38.7ZM0.1 -40.5L-0.6 -40.1L-0.8 -39.9L-0.4 -39.6ZM7.7 -38.8L6.9 -38.6L7 -38.3L8 -38.6L9.2 -38.6L10.7 -38.3L12 -37.5L13 -36.3L13 -36.6L12.3 -37.5L10.8 -38.4L9.7 -38.8ZM6.3 -38.3L5.2 -37.7L4.6 -37L3.8 -35.9L3.4 -34.7L3.3 -33.8L3.6 -33.9L3.6 -34.6L4.1 -36L5.6 -37.7L6.3 -38.1ZM7.8 -38.1L7.2 -37.9L7.2 -37.5L8.4 -34.6L9.6 -34.3L12.4 -36L12.1 -36.6L10.7 -37.7L9.3 -38.1ZM-9.5 -38L-10.7 -37.6L-11.7 -36.9L-12.5 -35.9L-13.3 -33.9L-13.1 -32L-12 -30.2L-11.2 -29.5L-9.5 -28.8L-7.7 -28.8L-6.5 -29.2L-5.2 -30.1L-4.1 -31.9L-3.9 -33L-4.3 -33.4L-7.3 -33.4L-7.6 -33.3L-8.4 -32.6L-8.7 -32.5L-9.1 -32.8L-9.4 -33.4L-9.2 -33.9L-8.7 -34.2L-8.2 -34.1L-7.5 -34.8L-6.7 -36.3L-6.5 -37.4L-7.5 -38ZM-5.8 -37.9L-5.8 -37.8L-4.7 -36.8L-4.1 -36L-3.6 -34.7L-3.5 -33.9L-3.3 -33.6L-3.2 -34.2L-3.8 -35.9L-4.7 -37.2ZM6.5 -37.6L5.7 -37.2L4.8 -36.2L4.1 -34.6L4 -33.8L4.1 -33.6L5.6 -33.5L6.1 -33.7L7.5 -33.7L7.9 -34.3L7.9 -34.7L7.1 -36.7L6.8 -37.4ZM-6 -37.2L-6.9 -35.1L-7.9 -33.8L-7.3 -33.5L-4.1 -33.6L-3.9 -34L-4.6 -35.9L-5.1 -36.5ZM12.7 -35.7L9.8 -34L9.7 -33.2L9.5 -32.8L8.8 -32.4L8 -32.6L7.5 -33.4L4.1 -33.3L4.1 -32.4L4.3 -31.7L5.2 -30.3L6.9 -29.2L8.5 -28.8L10 -29L11.4 -29.8L12.5 -30.9L13 -31.9L13.3 -32.7L13.3 -34.4L13 -35.2Z',
  a31:'M1.1 -59.9L1.9 -59.9L3.5 -59.2L4.5 -58.4L5.1 -57.5L5.1 -57L4.8 -56.3L4.9 -55.6L4.3 -55.6L2.8 -54.2L2.1 -54.1L1.9 -53.8L1.9 -53.5L3.2 -51.9L3.4 -51.2L3.4 -50.6L2.9 -49.4L2.7 -47.8L2.2 -46L2.2 -42.9L2.6 -41.9L3.2 -41.3L4.1 -40.7L7.8 -39.1L9.8 -38.1L10.4 -37.5L11.1 -37.3L12 -37.3L14.9 -39.8L15.7 -40.2L16.6 -40.1L18.4 -38.2L19.9 -36L20.1 -35L20.6 -34.2L20.6 -33.2L21 -31.9L21.7 -31.1L21.8 -30.5L22.1 -30.1L22.1 -29.1L22.3 -28.7L23 -28.3L22.9 -26.8L-24.9 -26.8L-24.9 -29.1L-24 -29.1L-23.1 -29L-21.5 -29.2L-18.7 -32.3L-18.1 -33.2L-17.2 -33.7L-16.7 -33.7L-16.1 -33.4L-14.2 -31.4L-13.8 -30.8L-11.7 -28.8L-10.3 -28.8L-10 -30.3L-10.4 -33.2L-9.9 -36.9L-10.2 -38.5L-10.2 -39.5L-9.9 -40.5L-10.4 -42.2L-10.4 -43.1L-10.2 -44.1L-9.6 -45.6L-11.2 -46.7L-11.4 -48.5L-11 -50L-10.2 -52.3L-10.3 -52.9L-9.8 -53.6L-6.3 -55L-5.2 -55.9L-3.2 -56L-1.4 -56.7L-0.4 -56.4L0.3 -57.1L0.4 -57.7L0.4 -58.7L0.6 -59.3ZM-6 -52.1L-8.3 -51L-8.3 -49.9L-8.8 -48.3L-8.5 -47.9L-8.2 -47.9L-6.7 -50.3L-5.8 -52ZM-1.1 -48.4L-1.8 -47.8L-2.2 -46.6L-2.2 -46L-2 -45.3L-1.2 -44.5L-1 -44.6L-1.2 -45.3ZM-4.6 -41.5L-5.2 -40.8L-6.3 -37.4L-6.3 -35.6L-6.6 -34.7L-6.6 -33.2L-7 -32.5L-6.8 -31.9L-7.1 -31.2L-7.1 -30.7L-7 -30.5L-6.1 -30.5L-5.8 -30.3L-5.8 -29.6L-6.1 -28.8L-5.9 -28.6L-1.7 -28.6L-1.6 -28.7L-2.5 -30L-2.7 -30.1L-3 -29.9L-4 -30.8L-4.1 -31.2L-3.1 -32.2L-2.7 -34.4L-2 -36.6L-1.1 -38.3ZM3.2 -40.7L3.1 -40.4L3.7 -39.1L3.7 -38L0.6 -32.4L-0.1 -31.8L0.2 -31.4L0.6 -31.3L1.2 -29.9L2.2 -28.9L2.3 -28.5L2.6 -28.4L2.9 -28.6L4.1 -29.7L4.5 -29.9L6.2 -30.9L7.1 -32.4L8.1 -33.4L9.1 -33.9L9.7 -34.5L10.4 -35.7L11.3 -36.6L10.1 -37.2L9.3 -37.9L8.6 -38.3Z',
  f49w:'M-20.1 -60.7L19.9 -60.8L20.4 -60.6L21.2 -60.2L22.1 -59.2L22.6 -58.4L22.8 -57.9L22.8 -18.1L22.6 -17.6L22.2 -16.8L21.2 -15.9L20.4 -15.4L19.9 -15.2L-19.9 -15.2L-20.4 -15.4L-21.2 -15.8L-22.1 -16.8L-22.6 -17.6L-22.8 -18.1L-22.8 -57.9L-22.6 -58.4L-22.1 -59.2L-21.2 -60.2ZM-19.1 -59.8L-19.6 -59.6L-20.5 -59.2L-21.1 -58.6L-21.6 -57.6L-21.8 -57L-21.8 -19L-21.6 -18.4L-21 -17.3L-20.5 -16.8L-19.6 -16.4L-19 -16.2L19 -16.2L19.6 -16.4L20.6 -16.9L21.3 -17.7L21.6 -18.4L21.8 -19L21.8 -57L21.6 -57.6L21 -58.7L20.5 -59.2L19.6 -59.6L19 -59.8ZM-0.1 -55.7L0.3 -55.3L14.6 -30.4L14.5 -30.2L14 -30.1L13.8 -29.7L14.9 -29.7L15.2 -29.4L19 -22.9L18.9 -22.7L17.7 -22.6L17.5 -22.4L17.4 -22L19.4 -22L20.2 -20.7L20.3 -20.4L-20.4 -20.4L-20.4 -20.5ZM-1.2 -47.2L-1.6 -46.9L-1.8 -46.3L-1.8 -44.3L-1.6 -43.8L-1.2 -43.4L-0.9 -43.3L-0.9 -42.7L-2.5 -42.2L-4.3 -38.6L-7.5 -36.4L-6.9 -35.6L-6.6 -35.6L-2.9 -37.5L-2 -38.8L-1.9 -38.4L-1.9 -37.5L-1.8 -37.2L-1.7 -35.1L-1.6 -34.8L-1.6 -34.5L-5.6 -25.8L-5.8 -25.7L-6.4 -25.7L-7 -24.9L-4.6 -23.8L-4 -23.7L-1 -29.5L-0.8 -29.7L-0.2 -29.7L-0 -29.8L0.1 -30.2L-0.5 -30.3L0.5 -32.1L4.5 -25.3L4 -24.2L4.4 -23.7L6.7 -24.8L6.8 -25L2.6 -34.6L2.7 -39.5L2.8 -39.6L4.3 -38L5 -34.6L5.2 -34.1L6.3 -34.3L6.4 -34.5L5.7 -39.3L3 -42.5L2.7 -42.7L1.1 -43L1 -43.1L1 -46.3L0.8 -46.9L0.4 -47.2ZM-13.8 -30.2L-14 -30.1L-14.1 -29.8L-13.9 -29.7L-12.2 -29.7L-12 -29.9L-11.8 -30.1L-12 -30.2ZM-9.8 -30.2L-10 -30.1L-10.1 -29.8L-9.9 -29.7L-8.2 -29.7L-7.8 -30.1L-8 -30.2ZM-5.8 -30.2L-6.2 -29.8L-6 -29.7L-4.2 -29.7L-4 -29.8L-3.9 -30.1L-4.1 -30.2ZM6.1 -30.2L5.8 -29.8L6 -29.7L7.8 -29.7L8.1 -30.1L7.9 -30.2ZM10.1 -30.2L9.8 -29.8L10 -29.7L11.8 -29.7L12.1 -30.1L11.9 -30.2ZM-18.1 -22.7L-18.5 -22.2L-18.5 -22L-18.3 -22L-16.6 -22L-16.2 -22.6L-16.4 -22.7ZM-14.1 -22.7L-14.5 -22.2L-14.5 -22L-14.3 -22L-12.7 -22L-12.4 -22.2L-12.2 -22.6L-12.4 -22.7ZM-10.1 -22.7L-10.4 -22.5L-10.5 -22.2L-10.5 -22L-10.3 -22L-8.7 -22L-8.4 -22.2L-8.2 -22.6L-8.4 -22.7ZM-6.2 -22.7L-6.5 -22.1L-6.3 -22L-4.7 -22L-4.2 -22.6L-4.4 -22.7ZM-2.2 -22.7L-2.5 -22.1L-2.3 -22L-0.7 -22L-0.5 -22.1L-0.3 -22.6L-0.4 -22.7ZM1.8 -22.7L1.5 -22.2L1.5 -22L1.7 -22L3.3 -22L3.5 -22.1L3.7 -22.6L3.6 -22.7ZM5.8 -22.7L5.6 -22.5L5.5 -22.2L5.5 -22L5.7 -22L7.3 -22L7.7 -22.6L7.6 -22.7ZM9.8 -22.7L9.6 -22.5L9.4 -22.1L9.6 -22L11.3 -22L11.7 -22.6L11.4 -22.7ZM13.8 -22.7L13.4 -22.2L13.4 -22L13.6 -22L15.3 -22L15.7 -22.6L15.4 -22.7Z',
  f49d:'M-1.2 -47.2L0.3 -47.2L0.7 -47L0.9 -46.6L0.9 -43.1L1 -43L2.5 -42.7L2.9 -42.5L5.2 -39.8L5.7 -39.1L6.4 -34.5L6.1 -34.3L5.2 -34.2L5 -34.8L4.4 -37.7L4 -38.4L3.1 -39.4L2.8 -39.7L2.7 -39.7L2.7 -38.1L2.6 -37.7L2.6 -34.5L6.7 -25L6.6 -24.8L4.5 -23.8L4.3 -23.9L4 -24.2L4.5 -25L4.5 -25.3L2.1 -29.5L0.4 -32.1L-0.5 -30.3L-0.4 -30.2L0.1 -30.2L-0.1 -29.8L-0.2 -29.7L-0.9 -29.6L-1.1 -29.4L-4.1 -23.8L-4.5 -23.8L-6.9 -25L-6.4 -25.6L-5.9 -25.7L-5.7 -25.6L-5.5 -25.8L-1.6 -34.4L-1.6 -35.3L-1.7 -35.7L-1.9 -39L-2.2 -38.7L-3.1 -37.4L-6.7 -35.6L-7.5 -36.4L-4.2 -38.6L-2.4 -42.2L-0.8 -42.7L-0.8 -43.3L-1.4 -43.5L-1.7 -44L-1.7 -46.7L-1.5 -47ZM-13.8 -30.2L-12.1 -30.2L-11.9 -30.1L-12 -29.8L-12.2 -29.7L-13.9 -29.7L-14.1 -29.8ZM-9.8 -30.2L-8.1 -30.2L-7.9 -30.1L-8.2 -29.7L-9.9 -29.7L-10.1 -29.8ZM-5.8 -30.2L-4.1 -30.2L-3.9 -30.1L-4.2 -29.7L-5.9 -29.7L-6.1 -29.8ZM6.1 -30.2L7.9 -30.2L8.1 -30.1L7.7 -29.7L6 -29.7L5.8 -29.8ZM10.1 -30.2L11.8 -30.2L12 -30.1L11.9 -29.8L11.7 -29.7L10 -29.7L9.8 -29.8ZM14.1 -30.2L14.7 -30.2L15 -29.7L13.8 -29.7ZM-18.1 -22.6L-16.4 -22.7L-16.2 -22.6L-16.6 -22.1L-18.2 -22.1L-18.4 -22.2ZM-14.2 -22.6L-12.4 -22.7L-12.3 -22.6L-12.6 -22.1L-14.2 -22.1L-14.4 -22.2ZM-10.2 -22.6L-8.5 -22.7L-8.3 -22.5L-8.6 -22.1L-10.3 -22.1L-10.4 -22.2ZM-6.2 -22.6L-4.5 -22.7L-4.3 -22.5L-4.7 -22.1L-6.3 -22.1L-6.4 -22.2ZM-2.2 -22.6L-0.6 -22.7L-0.3 -22.6L-0.5 -22.3L-0.7 -22.1L-2.3 -22.1L-2.5 -22.2ZM1.8 -22.6L3.4 -22.7L3.7 -22.6L3.5 -22.3L3.3 -22.1L1.7 -22.1L1.5 -22.2ZM5.8 -22.6L7.4 -22.7L7.7 -22.6L7.5 -22.3L7.3 -22.1L5.7 -22.1L5.5 -22.2ZM9.8 -22.6L11.4 -22.7L11.7 -22.6L11.3 -22.1L9.7 -22.1L9.5 -22.2ZM13.7 -22.6L15.4 -22.7L15.6 -22.6L15.3 -22.1L13.7 -22.1L13.5 -22.2ZM17.7 -22.6L19 -22.7L19.2 -22.5L19.3 -22.2L19.1 -22.1L17.6 -22.1L17.5 -22.3Z',
  f111r:'M-11.4 -54.4L-6.5 -54.5L-6.3 -54.3L-6.5 -53.5L-6.8 -53.2L-10.1 -53.1L-14.4 -43.6L-14.8 -42.6L-11.2 -42.8L-10.8 -43L-8.8 -43L-8.3 -43.2L-6.2 -43.2L-5.5 -43.3L-3.4 -43.3L-3.4 -38.2L-8.8 -38.2L-9 -38L-9 -37.7L-8.9 -37.4L-8.7 -37.2L-3.5 -37.2L-3.3 -37L-3.3 -36.2L-3.5 -36L-4.8 -36L-5.3 -35.7L-12.8 -35.7L-13 -35.5L-12.9 -34.7L-5.3 -34.7L-4.7 -34.3L-1.3 -34.3L-1 -34.7L-0.2 -34.7L0 -34.3L-0 -33.2L-0.2 -33L-8.7 -33L-8.8 -32.8L-8.8 -32.3L-8.8 -32.1L-8.5 -32L-0.2 -32L-0 -31.8L-0 -30.3L-0.3 -30.2L-12.1 -30.1L-12.3 -29.7L-12.4 -24.4L-15.8 -24.3L-16 -24.7L-16 -30L-16.2 -30.2L-16.9 -30.2L-18 -33.2L-18.3 -34.7L-18.3 -41.2L-16.7 -43.1L-11.9 -53.6ZM-4.4 -54.4L-2.9 -54.4L-2.7 -53.2L-4.8 -53.2ZM5.1 -54.4L6.6 -54.4L6.9 -53.2L4.9 -53.2L4.8 -53.8ZM8.4 -54.4L10.8 -54.5L11.3 -54.3L16.4 -43.1L18 -41.2L18 -34.5L16.6 -30.2L15.8 -30.2L15.7 -30L15.7 -24.7L15.5 -24.3L12.1 -24.4L12 -29.7L11.8 -30.1L5.8 -30.2L5.5 -30.3L5.6 -31.9L8.3 -32L8.5 -32.3L8.5 -32.8L8.3 -33L5.6 -33.1L5.6 -34.6L12.3 -34.7L12.6 -34.7L12.7 -35L12.7 -35.5L12.5 -35.7L5.6 -35.7L5.6 -37.1L8.7 -37.2L8.9 -37.4L9 -37.8L8.8 -38.2L5.6 -38.2L5.6 -43.3L10.5 -43L10.8 -42.8L12.3 -42.8L14.3 -42.5L14.5 -42.7L9.9 -52.8L9.7 -53.2L8.7 -53.2ZM-0.8 -43.4L0.2 -43.5L0.5 -43.2L0.5 -39.7L0.3 -39.3L0.3 -38.3L0.2 -38.2L-1 -38.2L-1.2 -38.3L-1.2 -43.2ZM1.7 -43.3L3.2 -43.3L3.3 -43.2L3.3 -38.5L3.2 -38.2L2 -38.2L1.8 -38.3L1.7 -39.8ZM-14.3 -40.8L-15.3 -40.4L-15.8 -39.9L-16.2 -39.2L-16.2 -38.3L-15.8 -37.6L-15.3 -37.1L-14.5 -36.7L-13.8 -36.7L-13.1 -37.1L-12.6 -37.6L-12.2 -38.3L-12.2 -39.2L-12.6 -39.9L-13.1 -40.4ZM13.3 -40.7L12.8 -40.4L12.1 -39.6L11.8 -39L11.8 -38.3L12.1 -37.7L12.9 -36.9L13.3 -36.7L14.3 -36.7L14.9 -37L15.6 -37.7L15.8 -38.3L15.8 -39L15.3 -40.1L14.8 -40.4L14.3 -40.7ZM-1.1 -37.1L-0.1 -37.1L-0.1 -35.7L-1.1 -35.7ZM2.2 -37.1L3.3 -37.1L3.3 -35.7L2.2 -35.7ZM2.2 -34.6L3.3 -34.6L3.3 -33.1L2.2 -33.1ZM2.2 -31.9L3.3 -31.9L3.3 -30.2L2.2 -30.2Z',
  f111w:'M-21.3 -72.4L-20.9 -72.4L-20.8 -72.2L-20.8 -19L-20.4 -17.8L-19.9 -17.4L-19 -17L19 -17L19.9 -17.4L20.4 -17.9L20.8 -19L20.8 -72.2L20.9 -72.4L21.3 -72.4L21.3 -16.9L-21.3 -16.9ZM0.1 -67.4L1.8 -67.5L2.8 -67.1L3.8 -66.3L4.5 -64.7L4.5 -63.5L4.1 -62.4L3.7 -61.8L2.7 -60.9L2.7 -60.7L5.3 -60.1L7.1 -58.8L9.8 -48.7L10 -48.5L11.5 -48.5L11.7 -48.2L11.7 -47.3L11.5 -47.2L7.3 -47.2L3.3 -48.8L1.5 -48.8L1.4 -48.7L1.7 -47.5L1.5 -39.8L1.7 -39.3L1.7 -37.7L2 -37L2 -19.5L1.9 -19.1L1.3 -18.8L0.4 -18.9L0 -19.7L0 -36.7L0.5 -37.8L0.5 -47.8L0.8 -48.8L-1.2 -48.8L-4.8 -47.4L-5.2 -47.2L-9.3 -47.2L-9.5 -47.5L-9.4 -48.4L-8 -48.5L-7.7 -48.7L-4.9 -58.8L-4.4 -59.3L-3.1 -60.1L-0.6 -60.7L-0.6 -60.9L-1.7 -62L-2.1 -62.7L-2.3 -63.3L-2.3 -64.8L-1.5 -66.4L-0.9 -66.9ZM-3.4 -58.3L-3.7 -58L-6 -49.5L-6.1 -48.6L-4.7 -48.3L-1.2 -49.7L3.3 -49.7L6.7 -48.3L8.3 -48.6L7 -53.7L5.6 -58.3L5.3 -57.5L4.5 -52.3L4.8 -50.7L4.8 -50.2L-2.8 -50.2L-2.4 -52ZM-2.9 -47.6L-1.6 -47.6L-1.2 -47L-1.2 -43.7L-1.3 -43L-1.3 -38.5L-1.2 -37.8L-1.3 -36L-1.2 -34.8L-1.5 -34.5L-4.8 -34.5L-5 -34.7L-4.9 -35.8L-3.5 -35.8L-3.2 -36.2L-3.2 -47.2ZM3.6 -47.6L5 -47.7L5.3 -47.3L5.3 -26.3L5.5 -26.2L7.1 -26.1L7.2 -25L7 -24.8L3.7 -24.8L3.3 -25L3.3 -47ZM-14.6 -40.6L-13.8 -40.7L-13.1 -40.3L-12.6 -39.8L-12.3 -39.2L-12.3 -38.2L-12.6 -37.7L-13.1 -37.1L-13.7 -36.8L-14.7 -36.8L-15.1 -37.1L-15.7 -37.6L-16 -38.2L-16 -39.2L-15.8 -39.8L-15.3 -40.3ZM13.1 -40.4L14.6 -40.4L15.2 -40L15.6 -39.3L15.6 -38.1L15.2 -37.3L14.6 -36.9L13.1 -36.9L12.6 -37.2L12.1 -38.1L12.1 -39.3L12.5 -40Z',
  c31a:'M-5.3 -62.6L-5.2 -62.3L-5.2 -55.9L4.2 -55.9L5.3 -55.7L7 -55.2L8.8 -54.4L10.2 -53.5L11.9 -51.7L12.8 -50.5L13.5 -49L13.9 -47.7L14.2 -46.3L14.2 -34.1L9.8 -38.4L9.7 -45.4L9.6 -46.4L9.3 -47.4L8.6 -48.6L7.1 -50.1L6 -50.7L3.8 -51.3L-3.2 -51.4L-9.7 -57.9L-9.6 -58.3ZM-13.1 -54.8L-5.2 -47L-5.3 -44.6L-14.2 -53.5L-14.1 -53.8ZM9.8 -32L13.8 -28L13.5 -28L12 -29.5L9.8 -27.4Z',
  d5:'M7.1 -68.2L7.3 -68.1L6 -63.9L7.7 -63.3L9.4 -62.4L11.4 -61.2L12.7 -60.1L14.6 -58.3L16 -56.4L17.9 -53L18.7 -50.5L19.3 -47.7L19.5 -45.1L19.3 -44.7L19.3 -43L19 -41.4L16.2 -41.9L16.1 -42L16.4 -43.9L16.4 -46.8L16.1 -48.7L15.2 -51.6L14.1 -53.8L12.7 -55.7L11.2 -57.4L9.5 -58.8L8 -59.8L5.2 -61L4.8 -60.6L3.6 -56.8L-0.1 -64.8L-0.1 -65L0.2 -65.1ZM-6.6 -63.8L-6.2 -63.7L-5.4 -61.1L-8.1 -59.9L-10.7 -58.1L-13 -55.9L-13.9 -54.7L-14.6 -53.6L-15.9 -50.7L-16.5 -48.5L-16.8 -46.4L-16.8 -44L-16.4 -42.1L-15.9 -42L-12.4 -42.9L-12 -42.8L-16.5 -36.4L-17.3 -35.6L-22.9 -39.7L-23.8 -40.4L-19.9 -41.2L-19.5 -41.4L-19.5 -42L-19.7 -43.4L-19.7 -47.3L-19.3 -49.8L-18 -53.6L-16.3 -56.5L-14.7 -58.6L-12.5 -60.6L-9.5 -62.6ZM7.8 -36.4L16.7 -35.5L16.1 -28.2L15.9 -27.4L12.8 -30.6L11.2 -29.4L8.7 -27.8L7.1 -27.1L4.9 -26.4L2 -25.8L0.3 -25.8L-0.1 -25.7L-0.7 -25.8L-2.4 -25.8L-4.8 -26.3L-7.9 -27.3L-10.8 -28.8L-13.2 -30.7L-12.6 -31.5L-11.2 -33L-10.5 -32.4L-8.7 -31.1L-6.7 -30.1L-4.6 -29.4L-1.6 -28.8L1.4 -28.8L3.8 -29.2L7.3 -30.5L9 -31.5L10 -32.3L10.7 -32.9L10.6 -33.2Z'
};
/* PICTO-END */
/* driehoekig bord met rode rand (gevaarsborden, B15, B17) */
function warnPlate(inner){
  return '<polygon points="0,-84 36,-20 -36,-20" fill="#f4f4f1" stroke="#d3202a" stroke-width="10" stroke-linejoin="round"/>'+inner;
}
/* B15: voorrang op de kruisende zijweg(en); de hoofdweg is de brede balk met punt */
/* rond bord met rode rand: wit (verbod, C) of blauw (parkeren, E) */
function ringPlate(fill,inner){
  return '<circle cx="0" cy="-45" r="32" fill="'+RED+'" stroke="#fff" stroke-width="1.2"/><circle cx="0" cy="-45" r="22.8" fill="'+fill+'"/>'+inner;
}
/* rode schuine balk (of kruis) over een rond bord; loopt door tot in de rode ring */
function banBar(w,cross){return '<path d="M-18.4 -63.4L18.4 -26.6'+(cross?'M18.4 -63.4L-18.4 -26.6':'')+'" stroke="'+RED+'" stroke-width="'+w+'"/>';}
/* rond blauw bord met een dunne witte ring net binnen de rand (gebod, D) */
function bluePlate(inner){return '<circle cx="0" cy="-45" r="32" fill="#1b6ec2"/><circle cx="0" cy="-45" r="29.2" fill="none" stroke="#fff" stroke-width="1.3"/>'+inner;}
/* vierkant blauw bord met een witte lijn net binnen de rand (aanwijzing F, parking E9) */
function squarePlate(h,inner){
  var y=-13-h;
  return '<rect x="-25" y="'+y+'" width="50" height="'+h+'" rx="5" fill="'+FBLUE+'" stroke="#fff" stroke-width="1.2"/>'+
    '<rect x="-21.5" y="'+(y+3.5)+'" width="43" height="'+(h-7)+'" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/>'+inner;
}
/* fiets in zijaanzicht (pictogram), midden op x,y */
function bikeIcon(x,y,k,col,sw){
  return '<g transform="translate('+x+' '+y+') scale('+k+')" stroke="'+col+'" stroke-width="'+(sw||2.4)+'" stroke-linecap="round" stroke-linejoin="round" fill="none">'+
    '<circle cx="-10" cy="4" r="6"/><circle cx="10" cy="4" r="6"/><path d="M-10 4L-3 -7H7L10 4M-3 -7L0 4L7 -7M-6 -10H-1M7 -7L8 -11H12"/></g>';
}
/* D5 rotonde: drie witte pijlen in tegenwijzerzin */
function roundArrows(){return '<path fill="#fff" fill-rule="evenodd" d="'+PIC.d5+'"/>';}
/* C31: afslaan verboden; de pijl spiegelt, de rode balk blijft van linksboven naar rechtsonder */
function turnBan(right){
  var arrow='<path fill="'+INK+'" d="'+PIC.c31a+'"/>';
  return ringPlate('#fff',(right?mirror(arrow):arrow)+banBar(5.4));
}
/* B15: de hoofdweg is een brede balk (bijna een vijfde van de bordbreedte) met een punt boven en een zwaluwstaart onder;
   de zijweg(en) zijn smalle balken: dwars (a, c, f) of schuin naar achter (b, g) of naar voor (d, e) */
function b15arm(sx,sy,ex,ey,t){
  var dx=ex-sx,dy=ey-sy,l=Math.hypot(dx,dy),nx=-dy/l*t/2,ny=dx/l*t/2;
  return '<polygon points="'+[[sx+nx,sy+ny],[ex+nx,ey+ny],[ex-nx,ey-ny],[sx-nx,sy-ny]].map(function(q){return q[0].toFixed(1)+','+q[1].toFixed(1);}).join(' ')+'"/>';
}
var B15SIDE={
  a:'<rect x="-16.5" y="-45" width="33" height="5.1"/>',c:'<rect x="-16.5" y="-45" width="12" height="5.1"/>',f:'<rect x="4.5" y="-45" width="12" height="5.1"/>',
  b:b15arm(-3.8,-49,-16.4,-28.6,5.1),g:b15arm(3.8,-49,16.4,-28.6,5.1),
  d:b15arm(-4.5,-34.1,-13.8,-47.1,5.1),e:b15arm(4.5,-34.1,13.8,-47.1,5.1)};
/* de zeven varianten, te kiezen in het eigenschappenpaneel */
var B15LIST=[['a','Zijwegen links en rechts'],['c','Zijweg links'],['f','Zijweg rechts'],['b','Schuin links (naar achter)'],['g','Schuin rechts (naar achter)'],['d','Schuin links (naar voor)'],['e','Schuin rechts (naar voor)']];
function b15(v){
  return warnPlate('<g fill="'+INK+'"><polygon points="0,-59.4 8,-52.5 8,-26.8 0,-33.5 -8,-26.8 -8,-52.5"/>'+B15SIDE[v]+'</g>');
}
function hazard(pts){
  return pts.map(function(q){return '<circle cx="'+q[0]+'" cy="'+q[1]+'" r="9" fill="#ffb000" opacity=".35"/><circle cx="'+q[0]+'" cy="'+q[1]+'" r="4.5" fill="#ff9f00" stroke="#fff" stroke-width="1.2"/>';}).join('');
}
function triangle(cx,cy){
  return '<g transform="translate('+cx+' '+cy+')"><polygon points="0,-17 17,13 -17,13" fill="#fff" stroke="#d3202a" stroke-width="6" stroke-linejoin="round"/><polygon points="0,-9 8,7 -8,7" fill="#e5e5e0"/></g>';
}
function mirror(s){return '<g transform="scale(-1 1)">'+s+'</g>';}
/* blauw zwaailicht van een prioritair voertuig: lamp + gloed als het aan staat (it.beacon===false = uit) */
function lamp(x,y,w,h,on){
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="2.5" fill="'+(on?'#9ad6ff':'#1d3a6b')+'" stroke="'+(on?'#2f6fe0':'#0f2247')+'" stroke-width="1.5"/>';
}
function glow(pts,on){
  if(!on)return '';
  return pts.map(function(p){
    var c=' cx="'+p[0]+'" cy="'+p[1]+'"';
    return '<circle'+c+' r="34" fill="#2f8bff" opacity=".2"/><circle'+c+' r="22" fill="#3d9bff" opacity=".35"/><circle'+c+' r="12" fill="#7cc4ff" opacity=".7"/><circle'+c+' r="5.5" fill="#fff"/>';
  }).join('');
}

/* stretch: 'w' | 'h' | 'wh' = mag uitgerekt worden; tw/th = afmetingen op het tegeltje */
var TYPES={
  car:{label:'Auto',kind:'vehicle',signals:true,color:true,w:70,h:124,draw:function(it){
    var c=it.color,d=edge(c),l=shade(c,.25),lw=STYLE.lw,g=STYLE.col;
    return shadowOf('<rect x="-34" y="-62" width="68" height="124" rx="24"/>',it)+
      wheels([[-36,-42],[28,-42],[-36,26],[28,26]])+mirrors(31,-24,c,d)+
      '<rect x="-32" y="-62" width="64" height="124" rx="24" fill="'+c+'" stroke="'+d+'" stroke-width="'+lw.big+'"/>'+
      /* motorkap met twee lichte plooien */
      '<path d="M-14 -56Q-17 -42 -18 -30M14 -56Q17 -42 18 -30" stroke="'+d+'" stroke-width="'+lw.fine+'" fill="none" opacity=".55"/>'+
      '<path d="M-23 -26Q0 -34 23 -26L19 -6H-19Z" fill="'+g.glassFront+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      /* zijruiten langs het dak */
      '<path d="M-24 -4L-26.5 24M24 -4L26.5 24" stroke="'+g.glassRear+'" stroke-width="3" stroke-linecap="round"/>'+
      '<rect x="-21" y="-6" width="42" height="32" rx="7" fill="'+l+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      '<path d="M-19 26H19L23 40Q0 46 -23 40Z" fill="'+g.glassRear+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      lights(-60,56,25,25);
  }},
  carD:{label:'Defecte auto',kind:'vehicle',signals:true,color:true,w:70,h:124,draw:function(it){
    return TYPES.car.draw(it)+hazard([[-31,-60],[31,-60],[-31,60],[31,60]])+triangle(0,96);
  }},
  truckD:{label:'Defecte vrachtwagen',kind:'vehicle',signals:true,color:true,w:78,h:214,draw:function(it){
    return TYPES.truck.draw(it)+hazard([[-31,-104],[31,-104],[-34,104],[34,104]])+triangle(0,138);
  }},
  bus:{label:'Bus',kind:'vehicle',signals:true,color:true,w:76,h:204,draw:function(it){
    var c=it.color,d=edge(c),l=shade(c,.25),lw=STYLE.lw,g=STYLE.col;
    return shadowOf('<rect x="-34" y="-102" width="68" height="204" rx="16"/>',it)+
      wheels([[-38,-72,26],[30,-72,26],[-38,44,26],[30,44,26]])+
      /* grote busspiegels die naar voren steken */
      '<path d="M-33 -90Q-40 -96 -40 -104M33 -90Q40 -96 40 -104" stroke="'+d+'" stroke-width="2.2" fill="none"/>'+
      '<rect x="-43" y="-110" width="6" height="9" rx="2" fill="#2b2e33"/><rect x="37" y="-110" width="6" height="9" rx="2" fill="#2b2e33"/>'+
      '<rect x="-34" y="-102" width="68" height="204" rx="16" fill="'+c+'" stroke="'+d+'" stroke-width="'+lw.big+'"/>'+
      '<rect x="-27" y="-96" width="54" height="26" rx="6" fill="'+g.glassFront+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      '<path d="M-31 -64V92M31 -64V92" stroke="'+g.glassRear+'" stroke-width="2.6" stroke-dasharray="20 3"/>'+
      '<rect x="-27" y="-64" width="54" height="152" rx="8" fill="'+l+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      '<rect x="-14" y="-44" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/><rect x="-14" y="6" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/><rect x="-14" y="56" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/>'+
      '<rect x="-22" y="92" width="44" height="6" rx="2" fill="'+g.glassRear+'" stroke="'+d+'" stroke-width="'+lw.fine+'"/>'+
      lights(-100,98,28,28);
  }},
  truck:{label:'Vrachtwagen',kind:'vehicle',signals:true,color:true,w:78,h:214,draw:function(it){
    var c=it.color,d=edge(c),l=shade(c,.25),box='#eef1f3',bd=edge(box),lw=STYLE.lw,ribs='';
    for(var y=-14;y<100;y+=24)ribs+='<line x1="-36" y1="'+y+'" x2="36" y2="'+y+'" stroke="#c4cbd0" stroke-width="'+lw.small+'"/>';
    return shadowOf('<rect x="-36" y="-38" width="72" height="144" rx="6"/><rect x="-33" y="-107" width="66" height="66" rx="14"/>',it)+
      wheels([[-39,-92],[31,-92],[-39,58,30],[31,58,30]])+mirrors(32,-96,c,d)+
      '<rect x="-10" y="-44" width="20" height="10" fill="#444"/>'+
      '<rect x="-36" y="-38" width="72" height="144" rx="6" fill="'+box+'" stroke="'+bd+'" stroke-width="'+lw.small+'"/>'+ribs+
      '<rect x="-33" y="-107" width="66" height="66" rx="14" fill="'+c+'" stroke="'+d+'" stroke-width="'+lw.big+'"/>'+
      '<rect x="-25" y="-98" width="50" height="18" rx="5" fill="'+STYLE.col.glassFront+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      '<rect x="-25" y="-76" width="50" height="28" rx="6" fill="'+l+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      lights(-106,102,28,30);
  }},
  brom:{label:'Bromfiets',kind:'vehicle',color:true,signals:true,w:40,h:88,draw:function(it){
    var c=it.color,d=edge(c),jacket='#3d4f73';
    return shadowOf('<rect x="-4" y="-44" width="8" height="88" rx="3"/><ellipse cx="0" cy="4" rx="13" ry="9"/>',it)+
      '<rect x="-4" y="-44" width="8" height="21" rx="3" fill="'+STYLE.col.tyre+'"/><rect x="-4" y="23" width="8" height="21" rx="3" fill="'+STYLE.col.tyre+'"/>'+
      '<rect x="-18" y="-31" width="36" height="4" rx="2" fill="#333"/>'+
      '<path d="M-9 -27Q0 -35 9 -27L8 28Q0 34 -8 28Z" fill="'+c+'" stroke="'+d+'" stroke-width="1.5"/>'+
      '<path d="M-11 -2L-16 -27M11 -2L16 -27" stroke="'+jacket+'" stroke-width="5" stroke-linecap="round"/>'+
      '<ellipse cx="0" cy="4" rx="13" ry="9" fill="'+jacket+'"/>'+
      '<circle cx="0" cy="-5" r="8.5" fill="#2b2e33" stroke="#111" stroke-width="1.5"/><path d="M-5.5 -10Q0 -13.5 5.5 -10" stroke="#8fb8d0" stroke-width="2.2" fill="none"/>'+
      '<circle cx="0" cy="-42" r="2.8" fill="'+STYLE.col.head+'"/><rect x="-3" y="41" width="6" height="3" rx="1" fill="'+STYLE.col.rear+'"/>';
  }},
  motor:{label:'Motorfiets',kind:'vehicle',color:true,signals:true,w:48,h:106,draw:function(it){
    var c=it.color,d=edge(c),l=shade(c,.2),jacket='#2b2e33';
    return shadowOf('<rect x="-7" y="-53" width="14" height="106" rx="5"/><ellipse cx="0" cy="8" rx="15" ry="10"/>',it)+
      '<rect x="-6" y="-53" width="12" height="26" rx="5" fill="'+STYLE.col.tyre+'"/><rect x="-7" y="26" width="14" height="27" rx="5" fill="'+STYLE.col.tyre+'"/>'+
      '<rect x="-23" y="-36" width="46" height="5" rx="2.5" fill="#333"/>'+
      '<path d="M-12 -32Q0 -42 12 -32L13 -6Q0 0 -13 -6Z" fill="'+c+'" stroke="'+d+'" stroke-width="1.5"/>'+
      '<path d="M-9 -28Q0 -34 9 -28L9 -14Q0 -11 -9 -14Z" fill="'+l+'"/>'+
      '<path d="M-11 -4L11 -4L9 36Q0 40 -9 36Z" fill="'+d+'"/>'+
      '<path d="M-13 2L-21 -32M13 2L21 -32" stroke="'+jacket+'" stroke-width="6" stroke-linecap="round"/>'+
      '<ellipse cx="0" cy="8" rx="15" ry="10" fill="'+jacket+'"/>'+
      '<circle cx="0" cy="-2" r="9.5" fill="'+c+'" stroke="#111" stroke-width="1.5"/><path d="M-6 -7.5Q0 -11.5 6 -7.5" stroke="#1d2024" stroke-width="2.6" fill="none"/>'+
      '<circle cx="0" cy="-50" r="3.4" fill="'+STYLE.col.head+'"/><rect x="-4" y="50" width="8" height="3" rx="1" fill="'+STYLE.col.rear+'"/>';
  }},
  tram:{label:'Tram',kind:'vehicle',color:true,signals:true,w:76,h:300,draw:function(it){
    var c=it.color,d=edge(c),l=shade(c,.25),s='';
    function car(y0,y1,front,back){
      var r='<rect x="-36" y="'+y0+'" width="72" height="'+(y1-y0)+'" rx="'+(front||back?14:4)+'" fill="'+c+'" stroke="'+d+'" stroke-width="2.5"/>';
      r+='<rect x="-28" y="'+(y0+10)+'" width="56" height="'+(y1-y0-20)+'" rx="6" fill="'+l+'" stroke="'+d+'" stroke-width="1.2"/>';
      if(front)r+='<path d="M-28 '+(y0+6)+'Q0 '+(y0-2)+' 28 '+(y0+6)+'L26 '+(y0+22)+'H-26Z" fill="'+STYLE.col.glassFront+'" stroke="'+d+'" stroke-width="1.2"/>';
      if(back)r+='<path d="M-28 '+(y1-6)+'Q0 '+(y1+2)+' 28 '+(y1-6)+'L26 '+(y1-22)+'H-26Z" fill="'+STYLE.col.glassFront+'" stroke="'+d+'" stroke-width="1.2"/>';
      return r;
    }
    s+=shadowOf('<rect x="-36" y="-150" width="72" height="300" rx="14"/>',it)+mirrors(35,-134,c,d);
    s+=car(-150,-6,true,false)+car(6,150,false,true);
    s+='<rect x="-30" y="-8" width="60" height="16" fill="#555b60"/><path d="M-30 -4H30M-30 0H30M-30 4H30" stroke="#3c4145" stroke-width="1.2"/>';
    s+='<path d="M-14 -90L14 -60M14 -90L-14 -60" stroke="#2b2e33" stroke-width="2.5"/><rect x="-18" y="-77" width="36" height="4" rx="2" fill="#2b2e33"/>';
    s+='<rect x="-30" y="-148" width="12" height="5" rx="2" fill="'+STYLE.col.head+'"/><rect x="18" y="-148" width="12" height="5" rx="2" fill="'+STYLE.col.head+'"/>';
    s+='<rect x="-30" y="143" width="12" height="5" rx="2" fill="'+STYLE.col.rear+'"/><rect x="18" y="143" width="12" height="5" rx="2" fill="'+STYLE.col.rear+'"/>';
    return s;
  }},
  bike:{label:'Fiets',kind:'vehicle',color:true,w:34,h:76,draw:function(it){
    var c=it.color,d=edge(c),lw=STYLE.lw,g=STYLE.col;
    return shadowOf('<rect x="-3" y="-37" width="6" height="74" rx="3"/><ellipse cx="0" cy="-2" rx="14" ry="8"/>',it)+
      '<rect x="-3" y="-37" width="6" height="28" rx="3" fill="'+g.tyre+'"/><rect x="-3" y="9" width="6" height="28" rx="3" fill="'+g.tyre+'"/>'+
      '<line x1="0" y1="-12" x2="0" y2="12" stroke="#555" stroke-width="3"/>'+
      '<rect x="-4" y="20" width="8" height="10" rx="2" fill="#555b60"/>'+   /* bagagedrager */
      '<line x1="-15" y1="-22" x2="15" y2="-22" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>'+
      '<path d="M-11 -4L-14 -21M11 -4L14 -21" stroke="'+c+'" stroke-width="5" stroke-linecap="round" fill="none"/>'+
      '<circle cx="-14.5" cy="-22" r="3" fill="'+g.skin+'"/><circle cx="14.5" cy="-22" r="3" fill="'+g.skin+'"/>'+
      '<ellipse cx="0" cy="-2" rx="14" ry="8" fill="'+c+'" stroke="'+d+'" stroke-width="'+lw.detail+'"/>'+
      '<circle cx="0" cy="-3" r="7.5" fill="'+g.hair+'" stroke="'+shade(g.hair,-.35)+'" stroke-width="'+lw.fine+'"/>'+
      '<circle cx="0" cy="-36" r="3" fill="'+g.head+'"/><rect x="-2.5" y="35" width="5" height="2.5" rx="1" fill="'+g.rear+'"/>';
  }},
  ambulance:{label:'Ziekenwagen',kind:'vehicle',signals:true,beacon:true,w:72,h:134,draw:function(it){
    var on=it.beacon!==false;
    return shadowOf('<rect x="-34" y="-67" width="68" height="134" rx="18"/>',it)+
      wheels([[-36,-44],[28,-44],[-36,26],[28,26]])+mirrors(31,-30,'#f5f7f8','#a9b2b8')+
      '<rect x="-32" y="-67" width="64" height="134" rx="18" fill="#f5f7f8" stroke="#a9b2b8" stroke-width="2.5"/>'+
      '<path d="M-23 -34Q0 -42 23 -34L19 -14H-19Z" fill="'+STYLE.col.glassFront+'" stroke="#a9b2b8" stroke-width="1.5"/>'+
      '<rect x="-23" y="-14" width="46" height="74" rx="7" fill="#e8edf0" stroke="#a9b2b8" stroke-width="1.5"/>'+
      '<rect x="-4" y="16" width="8" height="30" fill="#d62b2b"/><rect x="-15" y="27" width="30" height="8" fill="#d62b2b"/>'+
      lamp(-22,-11,44,8,on)+lights(-65,62,25,25)+glow([[-13,-7],[13,-7]],on);
  }},
  police:{label:'Politie',kind:'vehicle',signals:true,beacon:true,w:70,h:124,draw:function(it){
    var on=it.beacon!==false;
    return shadowOf('<rect x="-34" y="-62" width="68" height="124" rx="24"/>',it)+
      wheels([[-36,-42],[28,-42],[-36,26],[28,26]])+mirrors(31,-26,'#f2f4f6','#8a96a0')+
      '<rect x="-32" y="-62" width="64" height="124" rx="24" fill="#f2f4f6" stroke="#8a96a0" stroke-width="2.5"/>'+
      '<rect x="-30" y="-52" width="60" height="9" fill="#1b4f9c"/><rect x="-30" y="38" width="60" height="9" fill="#1b4f9c"/>'+
      '<path d="M-23 -28Q0 -36 23 -28L19 -8H-19Z" fill="'+STYLE.col.glassFront+'" stroke="#8a96a0" stroke-width="1.5"/>'+
      '<rect x="-23" y="-8" width="46" height="32" rx="7" fill="#e6eaed" stroke="#8a96a0" stroke-width="1.5"/>'+
      lamp(-20,-5,19,8,on)+lamp(1,-5,19,8,on)+lights(-60,56,25,25)+glow([[-10,-1],[10,-1]],on);
  }},
  fire:{label:'Brandweer',kind:'vehicle',signals:true,beacon:true,w:78,h:164,draw:function(it){
    var r='',y,on=it.beacon!==false;
    for(y=-10;y<=70;y+=11)r+='<line x1="-15" y1="'+y+'" x2="15" y2="'+y+'" stroke="#cfd5d9" stroke-width="2.5"/>';
    return shadowOf('<rect x="-34" y="-82" width="68" height="164" rx="14"/>',it)+
      wheels([[-40,-56],[32,-56],[-40,24],[32,24],[-40,52],[32,52]])+mirrors(33,-66,'#d4271f','#7e130e')+
      '<rect x="-34" y="-82" width="68" height="164" rx="14" fill="#d4271f" stroke="#7e130e" stroke-width="2.5"/>'+
      '<path d="M-26 -72Q0 -80 26 -72L22 -50H-22Z" fill="'+STYLE.col.glassFront+'" stroke="#7e130e" stroke-width="1.5"/>'+
      '<rect x="-26" y="-50" width="52" height="28" rx="6" fill="#e24b42" stroke="#7e130e" stroke-width="1.5"/>'+
      lamp(-20,-44,40,7,on)+
      '<line x1="-15" y1="-16" x2="-15" y2="76" stroke="#cfd5d9" stroke-width="4"/><line x1="15" y1="-16" x2="15" y2="76" stroke="#cfd5d9" stroke-width="4"/>'+r+
      lights(-80,78,28,28)+glow([[-12,-40.5],[12,-40.5]],on);
  }},
  ped:{label:'Voetganger',kind:'object',follow:true,color:true,w:52,h:52,draw:function(it){
    /* bovenaanzicht, stappend: linkervoet voor, rechterarm voor */
    var c=it.color,d=edge(c),g=STYLE.col;
    return shadowOf('<ellipse cx="0" cy="0" rx="21" ry="11"/><circle cx="0" cy="0" r="10"/>',it)+
      '<ellipse cx="-8" cy="-15" rx="5" ry="8" fill="#2b2e33"/><ellipse cx="8" cy="13" rx="5" ry="8" fill="#2b2e33"/>'+
      '<ellipse cx="-22" cy="7" rx="5.5" ry="10" fill="'+d+'"/><circle cx="-22" cy="16" r="4" fill="'+g.skin+'"/>'+
      '<ellipse cx="22" cy="-7" rx="5.5" ry="10" fill="'+d+'"/><circle cx="22" cy="-16" r="4" fill="'+g.skin+'"/>'+
      '<ellipse cx="0" cy="0" rx="21" ry="11" fill="'+c+'" stroke="'+d+'" stroke-width="'+STYLE.lw.small+'"/>'+
      '<circle cx="0" cy="-1.5" r="10" fill="'+g.skin+'"/><circle cx="0" cy="1.5" r="9.5" fill="'+g.hair+'"/>'+
      '<path d="M-5 -9Q0 -11 5 -9" stroke="'+shade(g.skin,-.2)+'" stroke-width="'+STYLE.lw.fine+'" fill="none"/>';
  }},
  light:{label:'Verkeerslicht',kind:'object',follow:true,w:40,h:150,draw:function(it){
    var L=[['#ff3b30','#4a1f1c'],['#ffa41b','#4a3716'],['#2fd66a','#15361f']];
    var on={red:0,orange:1,green:2}[it.state||'red'];
    var s='<rect x="-3.5" y="16" width="7" height="54" fill="#5d6368"/><rect x="-13" y="66" width="26" height="7" rx="2" fill="#3f4448"/><rect x="-18" y="-76" width="36" height="94" rx="10" fill="#25292d" stroke="#0e1012" stroke-width="2"/>';
    L.forEach(function(l,i){
      var cy=-56+i*26,lit=i===on;
      if(lit)s+='<circle cx="0" cy="'+cy+'" r="17" fill="'+l[0]+'" opacity=".28"/>';
      s+='<circle cx="0" cy="'+cy+'" r="10.5" fill="'+(lit?l[0]:l[1])+'"/>';
      if(lit)s+='<circle cx="-3" cy="'+(cy-3)+'" r="3.2" fill="#fff" opacity=".55"/>';
    });
    return s;
  }},
  stop:{label:'Stop (B5)',kind:'object',follow:true,w:68,h:150,draw:function(){
    /* vier even brede, hoge letters over bijna de hele breedte, zoals op het officiële B5-bord */
    return signWrap('<polygon points="'+octagon(33,-45)+'" fill="#fff" stroke="#c9ccce" stroke-width="1" stroke-linejoin="round"/><polygon points="'+octagon(31,-45)+'" fill="'+RED+'"/>'+
      letters('STOP',0,-45,11,24.5,2.2,4,'#fff'));
  }},
  b15:{label:'Voorrang op zijweg (B15)',kind:'object',follow:true,w:80,h:150,draw:function(it){return signWrap(b15(B15SIDE[it.side]?it.side:'a'));}},
  b17:{label:'Voorrang van rechts (B17)',kind:'object',follow:true,w:80,h:150,draw:function(){
    return signWrap(warnPlate('<path d="M-10.5 -52.5L10.5 -31.5M10.5 -52.5L-10.5 -31.5" stroke="'+INK+'" stroke-width="6.2" fill="none"/>'));
  }},
  a21:{label:'Oversteekplaats voetgangers (A21)',kind:'object',follow:true,w:80,h:150,draw:function(){
    return signWrap(warnPlate('<path fill="'+INK+'" fill-rule="evenodd" d="'+PIC.a21+'"/>'));
  }},
  a25:{label:'Oversteekplaats fietsers (A25)',kind:'object',follow:true,w:80,h:150,draw:function(){
    return signWrap(warnPlate('<path fill="'+INK+'" fill-rule="evenodd" d="'+PIC.a25+'"/>'));
  }},
  c3:{label:'Verboden toegang, beide richtingen (C3)',kind:'object',follow:true,w:68,h:150,draw:function(){return signWrap(ringPlate('#fff',''));}},
  c31a:{label:'Links afslaan verboden (C31a)',kind:'object',follow:true,w:68,h:150,draw:function(){return signWrap(turnBan(false));}},
  c31b:{label:'Rechts afslaan verboden (C31b)',kind:'object',follow:true,w:68,h:150,draw:function(){return signWrap(turnBan(true));}},
  c43:{label:'Maximumsnelheid (C43)',kind:'object',follow:true,w:68,h:150,draw:function(it){
    /* brede, vette cijfers; twee cijfers vullen ongeveer driekwart van het witte veld */
    var t=String(it.text||'50').replace(/[^0-9]/g,'').slice(0,3)||'50',big=t.length<3;
    return signWrap(ringPlate('#fff',big?letters(t,0,-45,15.4,18.6,2.6,3.8,INK):letters(t,0,-45,11.8,15,1.8,3.1,INK)));
  }},
  d5:{label:'Rotonde (D5)',kind:'object',follow:true,w:68,h:150,draw:function(it){
    /* nopost: alleen het ronde bord, gecentreerd (bv. midden op het middeneiland) */
    return it.nopost?'<g transform="translate(0 45)">'+bluePlate(roundArrows())+'</g>':signWrap(bluePlate(roundArrows()));
  }},
  d7:{label:'Fietspad (D7)',kind:'object',follow:true,w:68,h:150,draw:function(){
    /* witte fiets op een grondlijn, dunne witte ring binnen de rand */
    return signWrap('<circle cx="0" cy="-45" r="31.5" fill="#1b6ec2"/><circle cx="0" cy="-45" r="29.4" fill="none" stroke="#fff" stroke-width="1.3"/>'+
      '<g transform="translate(0 -44) scale(.86)">'+bicycle('#fff',1.25)+'<path d="M-21 10.6H21" stroke="#fff" stroke-width="1.25"/></g>');
  }},
  e1:{label:'Parkeren verboden (E1)',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap(ringPlate(FBLUE,banBar(8)));
  }},
  e3:{label:'Stilstaan en parkeren verboden (E3)',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap(ringPlate(FBLUE,banBar(8,true)));
  }},
  e9a:{label:'Parking (E9a)',kind:'object',follow:true,w:56,h:150,draw:function(){
    return signWrap(squarePlate(54,letters('P',.5,-40,21,33,0,6.6,'#fff')));
  }},
  f19:{label:'Eenrichtingsverkeer (F19)',kind:'object',follow:true,w:56,h:150,draw:function(){
    return signWrap(squarePlate(54,'<path d="M0 -61.5L10.5 -49H3.2V-19.5H-3.2V-49H-10.5Z" fill="#fff"/>'));
  }},
  f49:{label:'Oversteekplaats voetgangers (F49)',kind:'object',follow:true,w:56,h:150,draw:function(){
    /* vierkant bord: witte driehoek met voetganger tussen twee onderbroken lijnen */
    return signWrap(squarePlate(50,'<path fill="#fff" fill-rule="evenodd" d="'+PIC.f49w+'"/><path fill="'+INK+'" fill-rule="evenodd" d="'+PIC.f49d+'"/>'));
  }},
  a23:{label:'Opgelet kinderen (A23)',kind:'object',follow:true,w:80,h:150,draw:function(){return signWrap(warnPlate(kidsInner()));}},
  f4a:{label:'Begin zone 30 (F4a)',kind:'object',follow:true,w:56,h:150,draw:function(){return signWrap(zonePlate(false));}},
  f4b:{label:'Einde zone 30 (F4b)',kind:'object',follow:true,w:56,h:150,draw:function(){return signWrap(zonePlate(true));}},
  school:{label:'Schoolomgeving (A23 + F4a)',kind:'object',follow:true,w:72,h:220,draw:function(){
    /* A23 boven F4a aan één paal */
    return '<g transform="translate(0 33)"><rect x="-3.5" y="-96" width="7" height="82" fill="#9aa1a6" stroke="#6c737a" stroke-width="1"/>'+
      signWrap(zonePlate(false)+'<g transform="translate(0 -117) scale(.75) translate(0 52)">'+warnPlate(kidsInner())+'</g>')+'</g>';
  }},
  f111:{label:'Fietsstraat (F111)',kind:'object',follow:true,w:56,h:150,draw:function(){return signWrap(cyclePlate(false));}},
  f113:{label:'Einde fietsstraat (F113)',kind:'object',follow:true,w:56,h:150,draw:function(){return signWrap(cyclePlate(true));}},
  yield:{label:'Voorrang verlenen (B1)',kind:'object',follow:true,w:80,h:150,draw:function(){
    /* even groot als een gevaarsbord, op zijn kop */
    return signWrap('<polygon points="-36,-84 36,-84 0,-20" fill="#f4f4f1" stroke="'+RED+'" stroke-width="10" stroke-linejoin="round"/>');
  }},
  priority:{label:'Voorrangsweg (B9)',kind:'object',follow:true,w:68,h:150,draw:function(){
    /* smalle zwarte rand met ruim afgeronde hoeken, oranje ruit met een dunne zwarte lijn */
    return signWrap('<g transform="translate(0 -45) rotate(45)"><rect x="-25.4" y="-25.4" width="50.8" height="50.8" rx="4.6" fill="#fff" stroke="'+INK+'" stroke-width="1.9"/>'+
      '<rect x="-16" y="-16" width="32" height="32" fill="'+ORANGE+'" stroke="'+INK+'" stroke-width="1.3"/></g>');
  }},
  endpriority:{label:'Einde voorrangsweg (B11)',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<defs><clipPath id="epc"><polygon points="600,70 1130,600 600,1130 70,600"/></clipPath></defs>'+
      '<g transform="translate(0,-45) scale(0.066) translate(-600,-600)">'+
      '<rect x="216" y="216" width="768" height="768" rx="70" transform="rotate(45 600 600)" fill="#fff"/>'+
      '<g clip-path="url(#epc)"><line x1="1400" y1="-200" x2="-200" y2="1400" stroke="#111" stroke-width="185"/></g>'+
      '<g fill="#e8801a" stroke="#111" stroke-width="24" stroke-linejoin="miter"><polygon points="270,600 600,270 710,380 380,710"/><polygon points="930,600 600,930 490,820 820,490"/></g>'+
      '<rect x="216" y="216" width="768" height="768" rx="70" transform="rotate(45 600 600)" fill="none" stroke="#111" stroke-width="29"/></g>');
  }},
  noentry:{label:'Verboden richting (C1)',kind:'object',follow:true,w:68,h:150,draw:function(){
    /* witte balk over ruim 90% van de breedte */
    return signWrap('<circle cx="0" cy="-45" r="31" fill="'+RED+'" stroke="#fff" stroke-width="1.2"/><rect x="-28.5" y="-50.3" width="57" height="10.6" fill="#fff"/>');
  }},
  ahead:{label:'Verplicht rechtdoor (D1)',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap(bluePlate('<path d="M0 -70L18 -48H6.6V-21H-6.6V-48H-18Z" fill="#fff"/>'));
  }},
  mergesign:{label:'Rijstrook\u00ADversmalling rechts (F97b)',kind:'object',follow:true,w:48,h:150,draw:function(){return signWrap(mergePlate());}},
  mergesign_l:{label:'Rijstrook\u00ADversmalling links (F97)',kind:'object',follow:true,w:48,h:150,draw:function(){return signWrap(mirror(mergePlate()));}},
  lanesign:{label:'Rijstrookbord (F13)',kind:'object',follow:true,w:112,h:150,wf:function(it){return (it.lanes||['s','s']).length*30+14;},draw:function(it){
    var L=it.lanes||['s','s'],n=L.length,Wd=n*30+14,s='',i,x0=-Wd/2;
    s+='<rect x="'+x0+'" y="-86" width="'+Wd+'" height="74" rx="7" fill="'+FBLUE+'" stroke="#fff" stroke-width="1.2"/>';
    s+='<rect x="'+(x0+3.5)+'" y="-82.5" width="'+(Wd-7)+'" height="67" rx="4.5" fill="none" stroke="#fff" stroke-width="1.6"/>';
    for(i=1;i<n;i++)s+='<line x1="'+(x0+7+i*30)+'" y1="-17" x2="'+(x0+7+i*30)+'" y2="-81" stroke="#fff" stroke-width="2" '+(it.solid?'':'stroke-dasharray="7 5" ')+'/>';
    for(i=0;i<n;i++)s+=laneArrow(L[i],x0+7+15+i*30);
    return signWrap(s);
  }},
  workwarn:{label:'Werken (A31)',kind:'object',follow:true,w:80,h:150,draw:function(){
    return signWrap(warnPlate('<path fill="'+INK+'" fill-rule="evenodd" d="'+PIC.a31+'"/>'));
  }},
  tree:{label:'Omgevallen boom',kind:'object',w:270,h:100,draw:function(){
    var s='',i,f=[[-112,-8,34],[-92,16,30],[-84,-26,28],[-62,2,30],[-120,22,24],[-70,-4,22]];
    s+='<path d="M-60 -6L-100 -34M-50 8L-92 36M-30 -8L-42 -30" stroke="#6a4626" stroke-width="7" stroke-linecap="round" fill="none"/>';
    s+='<rect x="-80" y="-13" width="160" height="26" rx="6" fill="#7d5532" stroke="#573a1f" stroke-width="2.5"/>';
    for(i=-60;i<70;i+=26)s+='<path d="M'+i+' -9Q'+(i+6)+' 0 '+i+' 9" stroke="#5a3b1f" stroke-width="1.5" fill="none"/>';
    s+='<ellipse cx="80" cy="0" rx="6" ry="13" fill="#c99a62" stroke="#573a1f" stroke-width="2"/><ellipse cx="80" cy="0" rx="2.5" ry="6" fill="none" stroke="#8a6234" stroke-width="1.2"/>';
    for(i=0;i<f.length;i++)s+='<circle cx="'+f[i][0]+'" cy="'+f[i][1]+'" r="'+f[i][2]+'" fill="'+(i%2?'#3f8f4a':'#357d3f')+'" stroke="#256030" stroke-width="2"/>';
    return s;
  }},
  triangleI:{label:'Gevaren\u00ADdriehoek',kind:'object',w:46,h:46,draw:function(){return triangle(0,0);}},
  kuil:{label:'Put in de weg',kind:'object',w:120,h:80,draw:function(){
    return '<ellipse cx="0" cy="0" rx="56" ry="36" fill="#8f8a82" stroke="#ece8de" stroke-width="3"/><ellipse cx="2" cy="2" rx="44" ry="26" fill="#2b2926"/><ellipse cx="4" cy="4" rx="30" ry="16" fill="#171615"/>';
  }},
  agent_up:{label:'Bevoegd persoon',kind:'object',follow:true,onRoad:true,w:100,h:74,draw:function(it){return agent('up',it);}},
  agent_side:{label:'Bevoegd persoon',kind:'object',follow:true,onRoad:true,w:177,h:58,draw:function(it){return agent('side',it);}},
  tag:{label:'Letter',kind:'object',w:44,h:44,draw:function(it){
    return '<circle r="20" fill="#fff" stroke="#2b2e33" stroke-width="2.5"/><text y="8" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="22" fill="#2b2e33">'+esc(it.text||'A')+'</text>';
  }},
  cone:{label:'Kegel',kind:'object',w:34,h:34,draw:function(){
    return '<rect x="-15" y="-15" width="30" height="30" rx="4" fill="#f1801b" stroke="#a9520a" stroke-width="2"/><circle r="10" fill="#fff"/><circle r="5.5" fill="#f1801b"/>';
  }},
  baken:{label:'Baken (rood-wit)',kind:'object',w:18,h:46,draw:function(){
    var s='<rect x="-9" y="-23" width="18" height="46" rx="3" fill="#fff" stroke="#5a1a16" stroke-width="2"/>',i;
    for(i=0;i<3;i++)s+='<rect x="-9" y="'+(-23+i*16)+'" width="18" height="8" fill="#d3202a"/>';
    return s+'<rect x="-9" y="-23" width="18" height="46" rx="3" fill="none" stroke="#5a1a16" stroke-width="2"/>';
  }},
  routepijl:{label:'Route-pijl',kind:'object',w:70,h:170,draw:function(it){return routePath(it.pts||ROUTES[1],it.dash);}},
  barrier:{label:'Afzetting',kind:'object',stretch:'w',w:200,h:20,tw:100,th:18,draw:function(it){
    var w=it.w||200,s='',n=Math.max(1,Math.ceil(w/20)),i,x;
    for(i=0;i<n;i++){x=-w/2+i*20;s+='<rect x="'+x+'" y="-9" width="'+Math.min(20,w/2-x)+'" height="18" fill="'+(i%2?'#f4f4f0':'#d3202a')+'"/>';}
    return s+'<rect x="'+(-w/2)+'" y="-9" width="'+w+'" height="18" fill="none" stroke="#5a1a16" stroke-width="2"/>';
  }},

  /* wegmarkeringen */
  solid:{label:'Doorlopende lijn',kind:'mark',follow:true,stretch:'h',w:14,h:180,tw:14,th:100,draw:function(it){
    return '<rect x="-5" y="'+(-it.h/2)+'" width="10" height="'+it.h+'" fill="'+WHITE+'"/>';
  }},
  dashed:{label:'Onderbroken lijn',kind:'mark',follow:true,stretch:'h',w:14,h:180,tw:14,th:100,draw:function(it){
    return dashes(it.h,30,20,10,WHITE);
  }},
  ydashed:{label:'Gele onderbroken lijn',kind:'mark',follow:true,stretch:'h',w:16,h:180,tw:16,th:100,draw:function(it){
    return dashes(it.h,28,18,11,'#f2c200');
  }},
  stopline:{label:'Stopstreep',kind:'mark',follow:true,stretch:'w',w:120,h:28,tw:100,th:28,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="-11" width="'+it.w+'" height="22" fill="'+WHITE+'"/>';
  }},
  sharks:{label:'Haaientanden',kind:'mark',follow:true,stretch:'w',w:120,h:28,tw:100,th:28,draw:function(it){
    var n=Math.max(1,Math.round(it.w/24)),tw=it.w/n,s='',i,x;
    for(i=0;i<n;i++){x=-it.w/2+i*tw;s+='<polygon points="'+(x+1)+',-14 '+(x+tw-1)+',-14 '+(x+tw/2)+',14" fill="'+WHITE+'"/>';}
    return s;
  }},
  zebra:{label:'Zebrapad',kind:'mark',follow:true,stretch:'wh',w:240,h:56,tw:120,th:56,draw:function(it){
    var w=it.w,n=Math.max(2,Math.floor((w+12)/30)),tot=n*18+(n-1)*12,s='',i;
    for(i=0;i<n;i++)s+='<rect x="'+(-tot/2+i*30)+'" y="'+(-it.h/2)+'" width="18" height="'+it.h+'" rx="2" fill="'+WHITE+'" opacity=".96"/>';
    return s;
  }},
  vlak:{label:'Verdrijvings\u00ADvlak',kind:'mark',w:160,h:260,draw:function(it){
    var p=it.pts||SHAPES[1],bb=vbox(p),id='vc'+(it.id||0),pts=p.map(function(q){return q[0]+','+q[1];}).join(' '),d,w=bb[2]-bb[0],h=bb[3]-bb[1];
    /* brede schuine strepen (45°) met veel tussenruimte, binnen een volle rand zoals een doorlopende lijn */
    var s='<clipPath id="'+id+'"><polygon points="'+pts+'"/></clipPath><g clip-path="url(#'+id+')" stroke="'+WHITE+'" stroke-width="18">';
    for(d=-h;d<=w;d+=90)s+='<line x1="'+(bb[0]+d)+'" y1="'+bb[1]+'" x2="'+(bb[0]+d+h)+'" y2="'+bb[3]+'"/>';
    return s+'</g><polygon points="'+pts+'" fill="none" stroke="'+WHITE+'" stroke-width="10" stroke-linejoin="miter"/><polygon points="'+pts+'" fill="#000" fill-opacity="0"/>';
  }},
  arrow_s:{label:'Pijl rechtdoor',kind:'mark',follow:true,w:40,h:94,draw:function(){
    return '<path d="M0 -45L17 -15H7V45H-7V-15H-17Z" fill="'+WHITE+'"/>';
  }},
  arrow_r:{label:'Pijl rechts',kind:'mark',follow:true,w:56,h:94,draw:function(){return arrowTurn();}},
  arrow_l:{label:'Pijl links',kind:'mark',follow:true,w:56,h:94,draw:function(){return mirror(arrowTurn());}},
  arrow_sr:{label:'Rechtdoor of rechts',kind:'mark',follow:true,w:60,h:94,draw:function(){return arrowSR();}},
  arrow_sl:{label:'Rechtdoor of links',kind:'mark',follow:true,w:60,h:94,draw:function(){return mirror(arrowSR());}},
  arrow_mr:{label:'Voegen naar rechts',kind:'mark',follow:true,w:56,h:96,draw:function(){return arrowMR();}},
  arrow_ml:{label:'Voegen naar links',kind:'mark',follow:true,w:56,h:96,draw:function(){return mirror(arrowMR());}},

  fietsoversteek:{label:'Oversteekplaats fietsers',kind:'mark',follow:true,stretch:'w',w:240,h:50,tw:120,th:50,draw:function(it){
    /* twee rijen witte blokjes aan de randen */
    var s='',x,n=Math.max(2,Math.floor(it.w/20));
    for(x=0;x<n;x++){
      var px=-it.w/2+x*(it.w/n)+(it.w/n-10)/2;
      s+='<rect x="'+px.toFixed(1)+'" y="'+(-it.h/2)+'" width="10" height="10" fill="'+WHITE+'"/><rect x="'+px.toFixed(1)+'" y="'+(it.h/2-10)+'" width="10" height="10" fill="'+WHITE+'"/>';
    }
    return s;
  }},
  bikesym:{label:'Fietssymbool',kind:'mark',follow:true,w:44,h:84,draw:function(){
    return '<g transform="rotate(-90)">'+bikeIcon(0,0,2.1,WHITE,3.6)+'</g>';
  }},
  opstelvak:{label:'Opstelvak fietsers',kind:'mark',follow:true,stretch:'w',w:120,h:110,tw:100,th:80,draw:function(it){
    var w=it.w,h=it.h;
    return '<rect x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" fill="#b85c46"/>'+
      '<rect x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="10" fill="'+WHITE+'"/><rect x="'+(-w/2)+'" y="'+(h/2-14)+'" width="'+w+'" height="14" fill="'+WHITE+'"/>'+
      '<g transform="rotate(-90)">'+bikeIcon(0,0,1.5,WHITE,3.4)+'</g>';
  }},
  tramrails:{label:'Tramsporen',kind:'mark',follow:true,stretch:'h',w:72,h:600,tw:40,th:100,draw:function(it){
    var s='',h=it.h;
    [-28,28].forEach(function(x){
      s+='<rect x="'+(x-3.5)+'" y="'+(-h/2)+'" width="7" height="'+h+'" fill="#55524d"/><rect x="'+(x-1)+'" y="'+(-h/2)+'" width="2" height="'+h+'" fill="#a9a59d"/>';
    });
    return s;
  }},
  zigzag:{label:'Bushalte (gele zigzaglijn)',kind:'mark',follow:true,stretch:'h',w:30,h:300,tw:16,th:100,draw:function(it){
    var d='M0 '+(-it.h/2),y,i=0;
    for(y=-it.h/2+15;y<=it.h/2;y+=15)d+='L'+(i++%2?-9:9)+' '+y.toFixed(1);
    return '<path d="'+d+'" stroke="#f2c200" stroke-width="5" fill="none" stroke-linejoin="miter"/>';
  }},

  /* tijdelijke markeringen */
  tsolid:{label:'Tijdelijke lijn (doorlopend)',kind:'mark',follow:true,stretch:'h',w:14,h:180,tw:14,th:100,draw:function(it){
    return '<rect x="-5" y="'+(-it.h/2)+'" width="10" height="'+it.h+'" fill="#f5a000"/>';
  }},
  tdashed:{label:'Tijdelijke lijn (onderbroken)',kind:'mark',follow:true,stretch:'h',w:14,h:180,tw:14,th:100,draw:function(it){
    return dashes(it.h,30,20,10,'#f5a000');
  }},

  /* bermen en stroken (liggen onder de lijnen) */
  midberm:{label:'Middenberm',kind:'base',stretch:'wh',w:60,h:500,tw:50,th:90,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#7fb782" stroke="#d9d5cb" stroke-width="6"/>';
  }},
  grasberm:{label:'Grasberm',kind:'base',stretch:'wh',w:120,h:500,tw:70,th:90,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#6fae74" stroke="#5a9a60" stroke-width="2"/>';
  }},
  verhardeberm:{label:'Verharde berm',kind:'base',stretch:'wh',w:70,h:500,tw:50,th:90,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#a9a59d" stroke="#8f8b84" stroke-width="2"/>';
  }},
  stoep:{label:'Stoep',kind:'base',stretch:'wh',w:70,h:500,tw:50,th:90,draw:function(it){
    var r='x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'"';
    return '<rect '+r+' fill="#dccda6" stroke="#b7a578" stroke-width="5"/><rect '+r+' fill="url(#paving)"/>';
  }},
  suggestie:{label:'Fietssuggestie\u00ADstrook',kind:'base',stretch:'wh',w:70,h:500,tw:50,th:90,draw:function(it){
    /* fietssuggestiestrook: enkel een rode strook, zonder markering */
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#b85c46"/>';
  }},
  fietspad:{label:'Fietspad (rood)',kind:'base',stretch:'wh',w:90,h:500,tw:50,th:90,draw:function(it){
    /* gemarkeerd fietspad: rood, met aan beide zijden een witte onderbroken streep */
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#c4513f"/>'+
      '<g transform="translate('+(-it.w/2+3)+' 0)">'+dashes(it.h,20,20,6,WHITE)+'</g>'+
      '<g transform="translate('+(it.w/2-3)+' 0)">'+dashes(it.h,20,20,6,WHITE)+'</g>';
  }},
  asfalt:{label:'Zijweg (asfalt)',kind:'base',stretch:'wh',w:400,h:190,tw:70,th:50,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#6f6a64"/>';
  }},
  parkeer:{label:'Parkeerstrook',kind:'base',stretch:'wh',w:130,h:500,tw:70,th:90,draw:function(it){
    var s='<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#7c7872" stroke="#625e59" stroke-width="2"/>',y;
    for(y=-it.h/2+10;y<it.h/2-2;y+=140)s+='<rect x="'+(-it.w/2)+'" y="'+y+'" width="'+it.w+'" height="4" fill="'+WHITE+'" opacity=".9"/>';
    return s;
  }}
};
function follows(def){return def.kind==='vehicle'||!!def.follow;}
function baseDims(it){
  var d=TYPES[it.type];
  if(it.type==='vlak'){var bb=vbox(it.pts||SHAPES[1]);return [bb[2]-bb[0],bb[3]-bb[1]];}
  if(it.type==='routepijl'){var rb=vbox(it.pts||ROUTES[1]);return [rb[2]-rb[0]+40,rb[3]-rb[1]+40];}
  if(d.stretch)return [it.w||d.w,it.h||d.h];
  return [d.wf?d.wf(it):d.w,d.h];
}
/* F4a/F4b: wit zonebord met zwarte rand, "ZONE" en een C43-bord; einde = alles grijs met een zwarte schuine balk */
function zonePlate(end){
  var g='#8c9196',s='<rect x="-25" y="-87" width="50" height="74" rx="5" fill="#fff" stroke="#c9ccce" stroke-width=".8"/>'+
    '<rect x="-22.4" y="-84.4" width="44.8" height="68.8" rx="3.4" fill="none" stroke="'+INK+'" stroke-width="1.7"/>'+
    letters('ZONE',0,-76.6,5.6,6.8,1.2,1.4,end?g:INK);
  if(end)return s+'<circle cx="0" cy="-47.8" r="20.4" fill="none" stroke="'+g+'" stroke-width=".7"/>'+letters('30',0,-47.8,10,12.1,1.7,2.5,g)+
    '<path d="M20.2 -83.2L-20.2 -17.6" stroke="'+INK+'" stroke-width="3.2"/>';
  return s+'<g transform="translate(0 -47.8) scale(.65) translate(0 45)">'+ringPlate('#fff',letters('30',0,-45,15.4,18.6,2.6,3.8,INK))+'</g>';
}
/* F111/F113: witte fietser in vooraanzicht voor een rode auto; einde = rode schuine balk */
function cyclePlate(end){
  var s=squarePlate(75,letters('Fietsstraat',0,-79.2,3.3,5.4,.55,.9,'#fff')+
    '<path fill="'+RED+'" fill-rule="evenodd" d="'+PIC.f111r+'"/><path fill="#fff" fill-rule="evenodd" d="'+PIC.f111w+'"/>');
  if(end)s+='<path d="M20.6 -83.4L-20.6 -17.6" stroke="'+RED+'" stroke-width="3.7"/>';
  return s;
}
/* A23: de twee kinderen, nagetekend naar het officiële bord (omtrek in een meetvlak van 880×800, verkleind tot op het bord) */
function kidsInner(){
  return '<g transform="translate(-19.2 -60.37) scale(.043625)" fill="'+INK+'" fill-rule="evenodd">'+
    '<path d="M513 35L531 40L562 50L590 60L599 70L604 80L605 90L603 100L599 110L595 120L589 130L582 140L575 150L570 160L571 170L574 180L575 190L581 200L596 210L607 220L615 230L623 240L631 250L638 260L643 270L648 280L654 290L659 300L663 310L667 320L669 330L671 340L671 350L685 355L702 360L707 370L711 380L714 390L715 400L718 410L719 420L719 440L717 450L715 460L707 470L690 474L660 477L636 480L636 490L643 500L645 510L646 520L645 530L639 540L627 550L615 560L620 570L626 580L631 590L635 600L639 610L644 620L648 630L655 640L663 650L671 660L680 670L688 680L691 690L683 700L671 710L663 720L655 730L647 740L647 744L593 744L593 740L603 730L616 720L620 710L624 700L632 690L636 680L630 670L624 660L617 650L612 640L604 630L596 620L588 610L580 600L569 590L561 580L552 570L545 560L532 550L524 540L521 537L519 540L511 550L491 560L487 570L484 580L482 590L479 600L475 610L471 620L467 630L464 640L462 650L459 660L455 670L453 680L450 690L447 700L443 710L443 720L445 730L443 740L443 744L347 744L340 738L336 730L340 720L384 710L394 700L401 690L405 680L412 670L414 660L416 650L420 640L421 630L424 620L426 610L428 600L432 590L432 580L436 570L437 560L440 550L440 540L436 530L436 520L440 510L444 500L448 490L452 480L456 470L459 460L463 450L465 440L468 430L472 420L472 400L470 390L468 380L461 370L456 364L451 370L443 380L435 390L425 400L417 410L405 420L393 430L380 436L366 436L358 428L364 410L368 400L372 390L378 380L384 370L392 360L399 350L406 340L413 330L419 320L424 310L429 300L433 290L437 280L441 270L445 260L452 250L460 240L468 230L476 220L485 210L496 200L498 190L491 180L481 170L483 160L482 150L476 140L476 130L480 120L480 110L482 100L484 90L480 80L476 70L476 60L481 50L496 40ZM595 314L604 320L609 330L613 340L616 348L612 352L585 352L583 340L583 330L587 320Z"/>'+
    '<path d="M228 214L251 220L271 230L283 240L289 250L291 260L292 270L298 280L308 272L309 262L316 255L323 258L327 270L326 282L324 292L338 300L347 310L357 320L356 326L344 323L332 314L327 320L326 330L318 337L309 333L306 322L303 312L293 310L286 320L283 330L284 340L292 350L303 360L311 370L318 380L324 390L331 400L339 410L380 415L403 420L393 430L379 440L367 450L370 460L371 470L375 480L378 490L379 500L382 510L403 520L411 530L415 540L417 550L419 560L414 570L395 580L383 590L363 600L350 610L333 617L316 610L308 600L300 590L290 587L283 600L286 610L288 620L291 630L296 640L300 650L303 660L307 670L309 680L311 690L315 700L319 710L315 720L302 730L292 740L292 744L244 744L244 740L248 730L262 720L272 710L276 700L276 690L273 680L272 670L268 660L260 650L252 640L244 630L240 620L236 610L236 600L233 590L232 580L229 577L227 580L219 590L215 600L213 610L211 620L211 650L210 680L209 690L208 700L207 710L207 744L120 744L116 730L147 720L168 710L172 700L173 690L173 650L172 640L172 610L174 590L177 580L147 576L148 570L156 560L163 550L168 540L173 530L177 520L183 510L186 500L189 490L192 480L186 477L181 480L165 490L143 500L117 510L117 520L115 530L105 537L96 530L92 520L90 510L92 500L97 490L111 480L123 470L136 460L151 450L164 440L179 430L192 420L200 410L203 400L205 390L209 380L216 370L224 360L220 350L216 340L200 330L200 300L196 290L196 280L194 270L194 260L192 250L190 240L192 230L206 220ZM311 455L316 460L324 470L332 480L336 490L339 500L340 510L340 520L331 526L319 520L312 510L308 500L306 490L306 480L305 470L307 460Z"/>'+
    '<rect x="24" y="743" width="832" height="24"/></g>';
}
function dims(it){var b=baseDims(it),s=TYPES[it.type].stretch?1:it.s;return [b[0]*s,b[1]*s];}

var LINES=['solid','dashed','ydashed','tsolid','tdashed'];
var BERMS=['midberm','grasberm','verhardeberm','stoep','fietspad','parkeer'];
var LANEMARKS=['stopline','sharks','arrow_s','arrow_r','arrow_l','arrow_sr','arrow_sl','arrow_mr','arrow_ml','bikesym'];
/* alles op een paal (borden, lichten): die komen op de hoek rechts van de naderende bestuurder */
var POSTS=['light','stop','yield','priority','endpriority','b15','b17',
  'a21','a25','c3','c31a','c31b','c43','d5','d7','e1','e3','e9a','f19','f49','a23','f4a','f4b','school','f111','f113','noentry','ahead','mergesign','mergesign_l','lanesign','workwarn'];

var SECTIONS=[
  {el:'t-veh',entries:[{type:'car'},{type:'bus'},{type:'truck'},{type:'tram'},{type:'motor'},{type:'brom'},{type:'bike'},{type:'ambulance'},{type:'police'},{type:'fire'},{type:'ped'}]},
  /* één verkeerslicht; de kleur (rood, oranje, groen) kies je in het eigenschappenpaneel */
  {el:'t-light',entries:[{type:'light',state:'red',label:'Verkeerslicht'}]},
  /* verkeersborden per reeks, zoals de officiële indeling (A gevaar, B voorrang, C verbod, D gebod, F aanwijzing) */
  {el:'t-sign-a',entries:[{type:'a21'},{type:'a23'},{type:'a25'},{type:'workwarn'}]},
  {el:'t-sign-b',entries:[{type:'yield'},{type:'stop'},{type:'priority'},{type:'endpriority'},{type:'b15'},   /* de zijweg kies je in het eigenschappenpaneel */{type:'b17'}]},
  {el:'t-sign-c',entries:[{type:'noentry'},{type:'c3'},{type:'c31a'},{type:'c31b'},
    {type:'c43',text:'50'}]},   /* de snelheid kies je in het eigenschappenpaneel */
  {el:'t-sign-d',entries:[{type:'ahead'},{type:'d5'},{type:'d7'}]},
  {el:'t-sign-e',entries:[{type:'e1'},{type:'e3'},{type:'e9a'}]},
  {el:'t-sign-f',entries:[{type:'f4a'},{type:'f4b'},{type:'school'},{type:'f111'},{type:'f113'},{type:'f19'},{type:'f49'},{type:'mergesign'},{type:'mergesign_l'},{type:'lanesign',lanes:['l','s','r']}]},
  {el:'t-mark',entries:[{type:'solid'},{type:'dashed'},{type:'ydashed'},{type:'stopline'},{type:'sharks'},{type:'zebra'},{type:'fietsoversteek'},{type:'vlak'},
    {type:'arrow_s'},{type:'arrow_r'},{type:'arrow_l'},{type:'arrow_sr'},{type:'arrow_sl'},{type:'arrow_mr'},{type:'arrow_ml'},
    {type:'bikesym'},{type:'opstelvak'},{type:'zigzag'},{type:'tramrails'}]},
  {el:'t-berm',entries:[{type:'midberm'},{type:'grasberm'},{type:'verhardeberm'},{type:'stoep'},{type:'fietspad'},{type:'suggestie'},{type:'parkeer'},{type:'asfalt'}]},
  {el:'t-works',entries:[{type:'workwarn'},{type:'tsolid'},{type:'tdashed'},{type:'barrier'},{type:'cone'},{type:'baken'}]},
  {el:'t-obst',entries:[{type:'tree'},{type:'carD'},{type:'truckD'},{type:'triangleI'},{type:'kuil'}]},
  {el:'t-agent',entries:[{type:'agent_up',label:'Arm omhoog'},{type:'agent_side',label:'Arm opzij'}]},
  {el:'t-tag',entries:[{type:'tag',text:'A',label:'Letter A'},{type:'tag',text:'B',label:'Letter B'},{type:'tag',text:'C',label:'Letter C'},{type:'tag',text:'D',label:'Letter D'},{type:'routepijl',shape:0,label:ROUTELABEL[0]},{type:'routepijl',shape:1,label:ROUTELABEL[1]},{type:'routepijl',shape:2,label:ROUTELABEL[2]},{type:'routepijl',shape:3,label:ROUTELABEL[3]},{type:'routepijl',shape:4,label:ROUTELABEL[4]}]}
];
var ENTRY={};
SECTIONS.forEach(function(sec){sec.entries.forEach(function(e){
  e.key=e.type+(e.state?':'+e.state:'')+(e.lanes?':'+e.lanes.join(''):'')+(e.text?':'+e.text:'')+(e.shape!=null?':s'+e.shape:'');ENTRY[e.key]=e;
});});

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* Controleert een item uit localStorage of een geopend bestand; geeft null terug als het onbruikbaar is. */
var HEX=/^#[0-9a-f]{6}$/i,LANECODES=['s','l','r','sl','sr'],STATES=['red','orange','green'];
function num(v,d){v=+v;return isFinite(v)?v:d;}
function cleanPts(p){
  if(!Array.isArray(p)||p.length<2||p.length>40)return null;
  for(var i=0;i<p.length;i++){
    if(!Array.isArray(p[i])||!isFinite(p[i][0])||!isFinite(p[i][1]))return null;
  }
  return p.map(function(q){return [+q[0],+q[1]];});
}
function sanitizeItem(raw){
  if(raw&&raw.type==='cyclist')raw=Object.assign({},raw,{type:'bike'});   /* oud type uit eerdere versies */
  var m=raw&&/^b15([a-g])$/.exec(raw.type);if(m)raw=Object.assign({},raw,{type:'b15',side:m[1]});   /* vroeger zeven aparte B15-borden */
  if(!raw||typeof raw!=='object'||!Object.prototype.hasOwnProperty.call(TYPES,raw.type))return null;
  var d=TYPES[raw.type];
  var it={id:Math.max(0,Math.floor(num(raw.id,0))),type:raw.type,
    x:clamp(num(raw.x,CX),0,W),y:clamp(num(raw.y,CY),0,H),s:clamp(num(raw.s,1),.3,3.5),
    rot:((num(raw.rot,0)%360)+360)%360};
  if(raw.flip===-1)it.flip=-1;
  if(d.color)it.color=HEX.test(raw.color)?raw.color:COLORS[0];
  if(STATES.indexOf(raw.state)>-1)it.state=raw.state;
  if(Array.isArray(raw.lanes)){
    var l=raw.lanes.filter(function(c){return LANECODES.indexOf(c)>-1;}).slice(0,6);
    if(l.length)it.lanes=l;
  }
  if(typeof raw.text==='string'&&raw.text)it.text=raw.text.slice(0,3);
  if(raw.solid)it.solid=true;
  if(raw.dash)it.dash=true;
  if(raw.beacon===false&&d.beacon)it.beacon=false;
  if(raw.nopost===true)it.nopost=true;
  if(raw.type==='b15'&&B15SIDE[raw.side])it.side=raw.side;
  if(raw.order>=1&&raw.order<=9)it.order=Math.floor(raw.order);   /* volgorde bij afspelen */
  if(it.order&&['s','l','r','u','ml','mr','o','p'].indexOf(raw.route)>-1)it.route=raw.route;
  if(d.signals&&['l','r','h'].indexOf(raw.blink)>-1)it.blink=raw.blink;
  if(d.signals&&raw.brake===true)it.brake=true;
  if(d.stretch||raw.type==='vlak'){
    if(raw.w!=null)it.w=clamp(num(raw.w,d.w),20,1400);
    if(raw.h!=null)it.h=clamp(num(raw.h,d.h),20,1600);
  }
  if(isPts(it)){
    var p=cleanPts(raw.pts);if(p)it.pts=p;
    if(raw.shape!=null)it.shape=Math.max(0,Math.floor(num(raw.shape,1)));
  }
  return it;
}

export {
  W,H,CX,CY,ROT,ARROW,DIRLABEL,COLORS,SVGNS,SHAPES,ROUTES,
  TYPES,SECTIONS,ENTRY,LINES,BERMS,LANEMARKS,POSTS,B15LIST,
  copyPts,isPts,vbox,normV,follows,baseDims,dims,clamp,sanitizeItem
};
