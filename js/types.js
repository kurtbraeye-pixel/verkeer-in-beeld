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
function wheels(list){
  return list.map(function(p){return '<rect x="'+p[0]+'" y="'+p[1]+'" width="8" height="'+(p[2]||22)+'" rx="3" fill="#1c1c1e"/>';}).join('');
}
function lights(front,back,fw,bw){
  return '<rect x="'+(-fw)+'" y="'+front+'" width="13" height="5" rx="2" fill="#ffe27a"/><rect x="'+(fw-13)+'" y="'+front+'" width="13" height="5" rx="2" fill="#ffe27a"/>'+
         '<rect x="'+(-bw)+'" y="'+back+'" width="13" height="4" rx="2" fill="#c8202a"/><rect x="'+(bw-13)+'" y="'+back+'" width="13" height="4" rx="2" fill="#c8202a"/>';
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
function agent(arm){
  var vest='#d4e03a',sleeve='#2a4a86',navy='#1d3566',skin='#f0c29b',s='';
  s+='<rect x="-17" y="14" width="14" height="48" rx="5" fill="'+navy+'"/><rect x="3" y="14" width="14" height="48" rx="5" fill="'+navy+'"/>';
  s+='<rect x="-19" y="58" width="18" height="10" rx="4" fill="#111"/><rect x="1" y="58" width="18" height="10" rx="4" fill="#111"/>';
  s+='<rect x="20" y="-34" width="12" height="46" rx="6" fill="'+sleeve+'"/><circle cx="26" cy="16" r="7" fill="'+skin+'"/>';
  if(arm==='up'){
    s+='<rect x="-32" y="-82" width="12" height="52" rx="6" fill="'+sleeve+'"/><rect x="-37" y="-100" width="22" height="22" rx="9" fill="'+skin+'"/>';
  }else{
    s+='<rect x="-64" y="-34" width="46" height="12" rx="6" fill="'+sleeve+'"/><circle cx="-62" cy="-28" r="7" fill="'+skin+'"/>';
  }
  s+='<rect x="-22" y="-38" width="44" height="56" rx="10" fill="'+vest+'"/><rect x="-22" y="-18" width="44" height="6" fill="#e9eef0"/><rect x="-22" y="0" width="44" height="6" fill="#e9eef0"/><rect x="-1.5" y="-38" width="3" height="56" fill="#9aa51a"/>';
  s+='<rect x="-5" y="-48" width="10" height="12" fill="'+skin+'"/><circle cx="0" cy="-58" r="15" fill="'+skin+'"/>';
  s+='<path d="M-16 -62Q-16 -80 0 -80Q16 -80 16 -62Z" fill="'+navy+'"/><rect x="-17" y="-64" width="34" height="6" rx="3" fill="#0f1f44"/><rect x="-4" y="-76" width="8" height="6" rx="2" fill="#e5c24a"/>';
  s+='<rect x="-11" y="-56" width="22" height="6" rx="3" fill="#222"/>';
  return arm==='up'?'<g transform="translate(2,16)">'+s+'</g>':'<g transform="translate(19,6)">'+s+'</g>';
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
function mergePlate(){
  return '<rect x="-22" y="-81" width="44" height="68" rx="5" fill="#22558c" stroke="#fff" stroke-width="2.5"/>'+
    '<rect x="-19.5" y="-78.5" width="39" height="63" rx="3" fill="none" stroke="#fff" stroke-width="0.9"/>'+
    '<polygon points="-8.4,-73.2 -0.5,-60.9 -5.5,-60.9 -5.5,-48 16.3,-36 16.3,-19.7 10.7,-19.7 10.7,-32.3 -5.5,-41.2 -5.5,-19.5 -11.2,-19.5 -11.2,-60.9 -16.3,-60.9" fill="#fff"/>';
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
  car:{label:'Auto',kind:'vehicle',color:true,w:70,h:124,draw:function(it){
    var c=it.color,d=shade(c,-.35),l=shade(c,.25);
    return wheels([[-36,-42],[28,-42],[-36,26],[28,26]])+
      '<rect x="-32" y="-62" width="64" height="124" rx="24" fill="'+c+'" stroke="'+d+'" stroke-width="2.5"/>'+
      '<path d="M-23 -26Q0 -34 23 -26L19 -6H-19Z" fill="#bfe0ee" stroke="'+d+'" stroke-width="1.5"/>'+
      '<rect x="-23" y="-6" width="46" height="32" rx="7" fill="'+l+'" stroke="'+d+'" stroke-width="1.5"/>'+
      '<path d="M-19 26H19L23 40Q0 46 -23 40Z" fill="#9fc4d6" stroke="'+d+'" stroke-width="1.5"/>'+
      lights(-60,56,25,25);
  }},
  carD:{label:'Defecte auto',kind:'vehicle',color:true,w:70,h:124,draw:function(it){
    return TYPES.car.draw(it)+hazard([[-31,-60],[31,-60],[-31,60],[31,60]])+triangle(0,96);
  }},
  truckD:{label:'Defecte vrachtwagen',kind:'vehicle',color:true,w:78,h:214,draw:function(it){
    return TYPES.truck.draw(it)+hazard([[-31,-104],[31,-104],[-34,104],[34,104]])+triangle(0,138);
  }},
  bus:{label:'Bus',kind:'vehicle',color:true,w:76,h:204,draw:function(it){
    var c=it.color,d=shade(c,-.35),l=shade(c,.25);
    return wheels([[-38,-72,26],[30,-72,26],[-38,44,26],[30,44,26]])+
      '<rect x="-34" y="-102" width="68" height="204" rx="16" fill="'+c+'" stroke="'+d+'" stroke-width="2.5"/>'+
      '<rect x="-27" y="-96" width="54" height="26" rx="6" fill="#bfe0ee" stroke="'+d+'" stroke-width="1.5"/>'+
      '<rect x="-27" y="-64" width="54" height="158" rx="8" fill="'+l+'" stroke="'+d+'" stroke-width="1.5"/>'+
      '<rect x="-14" y="-44" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/><rect x="-14" y="6" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/><rect x="-14" y="56" width="28" height="22" rx="3" fill="#f5f7f8" opacity=".85"/>'+
      lights(-100,98,28,28);
  }},
  truck:{label:'Vrachtwagen',kind:'vehicle',color:true,w:78,h:214,draw:function(it){
    var c=it.color,d=shade(c,-.35),l=shade(c,.25),ribs='';
    for(var y=-14;y<100;y+=24)ribs+='<line x1="-36" y1="'+y+'" x2="36" y2="'+y+'" stroke="#c4cbd0" stroke-width="2"/>';
    return wheels([[-39,-92],[31,-92],[-39,58,30],[31,58,30]])+
      '<rect x="-10" y="-44" width="20" height="10" fill="#444"/>'+
      '<rect x="-36" y="-38" width="72" height="144" rx="6" fill="#eef1f3" stroke="#9aa3a9" stroke-width="2"/>'+ribs+
      '<rect x="-33" y="-107" width="66" height="66" rx="14" fill="'+c+'" stroke="'+d+'" stroke-width="2.5"/>'+
      '<rect x="-25" y="-98" width="50" height="18" rx="5" fill="#bfe0ee" stroke="'+d+'" stroke-width="1.5"/>'+
      '<rect x="-25" y="-76" width="50" height="28" rx="6" fill="'+l+'" stroke="'+d+'" stroke-width="1.5"/>'+
      lights(-106,102,28,30);
  }},
  bike:{label:'Fiets',kind:'vehicle',color:true,w:34,h:76,draw:function(it){
    var c=it.color,d=shade(c,-.35);
    return '<rect x="-3" y="-37" width="6" height="28" rx="3" fill="#222"/><rect x="-3" y="9" width="6" height="28" rx="3" fill="#222"/>'+
      '<line x1="0" y1="-12" x2="0" y2="12" stroke="#555" stroke-width="3"/>'+
      '<line x1="-15" y1="-22" x2="15" y2="-22" stroke="#333" stroke-width="3.5" stroke-linecap="round"/>'+
      '<path d="M-11 -4L-14 -22M11 -4L14 -22" stroke="'+c+'" stroke-width="5" stroke-linecap="round" fill="none"/>'+
      '<ellipse cx="0" cy="-2" rx="14" ry="8" fill="'+c+'" stroke="'+d+'" stroke-width="1.5"/>'+
      '<circle cx="0" cy="-3" r="7.5" fill="#3b3f45" stroke="#1d2024" stroke-width="1.5"/>'+
      '<circle cx="0" cy="-36" r="3" fill="#ffe27a"/>';
  }},
  ambulance:{label:'Ziekenwagen',kind:'vehicle',beacon:true,w:72,h:134,draw:function(it){
    var on=it.beacon!==false;
    return wheels([[-36,-44],[28,-44],[-36,26],[28,26]])+
      '<rect x="-32" y="-67" width="64" height="134" rx="18" fill="#f5f7f8" stroke="#a9b2b8" stroke-width="2.5"/>'+
      '<path d="M-23 -34Q0 -42 23 -34L19 -14H-19Z" fill="#bfe0ee" stroke="#a9b2b8" stroke-width="1.5"/>'+
      '<rect x="-23" y="-14" width="46" height="74" rx="7" fill="#e8edf0" stroke="#a9b2b8" stroke-width="1.5"/>'+
      '<rect x="-4" y="16" width="8" height="30" fill="#d62b2b"/><rect x="-15" y="27" width="30" height="8" fill="#d62b2b"/>'+
      lamp(-22,-11,44,8,on)+lights(-65,62,25,25)+glow([[-13,-7],[13,-7]],on);
  }},
  police:{label:'Politie',kind:'vehicle',beacon:true,w:70,h:124,draw:function(it){
    var on=it.beacon!==false;
    return wheels([[-36,-42],[28,-42],[-36,26],[28,26]])+
      '<rect x="-32" y="-62" width="64" height="124" rx="24" fill="#f2f4f6" stroke="#8a96a0" stroke-width="2.5"/>'+
      '<rect x="-30" y="-52" width="60" height="9" fill="#1b4f9c"/><rect x="-30" y="38" width="60" height="9" fill="#1b4f9c"/>'+
      '<path d="M-23 -28Q0 -36 23 -28L19 -8H-19Z" fill="#bfe0ee" stroke="#8a96a0" stroke-width="1.5"/>'+
      '<rect x="-23" y="-8" width="46" height="32" rx="7" fill="#e6eaed" stroke="#8a96a0" stroke-width="1.5"/>'+
      lamp(-20,-5,19,8,on)+lamp(1,-5,19,8,on)+lights(-60,56,25,25)+glow([[-10,-1],[10,-1]],on);
  }},
  fire:{label:'Brandweer',kind:'vehicle',beacon:true,w:78,h:164,draw:function(it){
    var r='',y,on=it.beacon!==false;
    for(y=-10;y<=70;y+=11)r+='<line x1="-15" y1="'+y+'" x2="15" y2="'+y+'" stroke="#cfd5d9" stroke-width="2.5"/>';
    return wheels([[-40,-56],[32,-56],[-40,24],[32,24],[-40,52],[32,52]])+
      '<rect x="-34" y="-82" width="68" height="164" rx="14" fill="#d4271f" stroke="#7e130e" stroke-width="2.5"/>'+
      '<path d="M-26 -72Q0 -80 26 -72L22 -50H-22Z" fill="#bfe0ee" stroke="#7e130e" stroke-width="1.5"/>'+
      '<rect x="-26" y="-50" width="52" height="28" rx="6" fill="#e24b42" stroke="#7e130e" stroke-width="1.5"/>'+
      lamp(-20,-44,40,7,on)+
      '<line x1="-15" y1="-16" x2="-15" y2="76" stroke="#cfd5d9" stroke-width="4"/><line x1="15" y1="-16" x2="15" y2="76" stroke="#cfd5d9" stroke-width="4"/>'+r+
      lights(-80,78,28,28)+glow([[-12,-40.5],[12,-40.5]],on);
  }},
  cyclist:{label:'Fietser',kind:'object',color:true,w:130,h:118,draw:function(it){
    var c=it.color,d=shade(c,-.35),s='';
    s+='<circle cx="-36" cy="20" r="26" fill="none" stroke="#222" stroke-width="4"/><circle cx="36" cy="20" r="26" fill="none" stroke="#222" stroke-width="4"/>';
    s+='<g stroke="#4a5058" stroke-width="4" stroke-linecap="round" fill="none"><path d="M-36 20H0M-36 20L-14 -14M0 20L-14 -14M-14 -14H24M0 20L24 -14M24 -14L36 20M24 -14L26 -24L18 -26"/></g>';
    s+='<path d="M-22 -18H-8" stroke="#222" stroke-width="5" stroke-linecap="round"/>';
    s+='<path d="M-14 -18L6 -2L0 20" fill="none" stroke="#3d4f73" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
    s+='<path d="M-14 -20L12 -46" stroke="'+c+'" stroke-width="15" stroke-linecap="round"/>';
    s+='<path d="M12 -44L22 -27" stroke="'+d+'" stroke-width="6" stroke-linecap="round"/>';
    s+='<circle cx="18" cy="-58" r="9" fill="#f0c29b"/><path d="M9 -60Q9 -69 18 -69Q27 -69 27 -60Z" fill="'+d+'"/>';
    return '<g transform="translate(0,10)">'+s+'</g>';
  }},
  ped:{label:'Voetganger',kind:'object',follow:true,color:true,w:52,h:52,draw:function(it){
    /* bovenaanzicht, stappend: linkervoet voor, rechterarm voor */
    var c=it.color,d=shade(c,-.3),skin='#f0c29b';
    return '<ellipse cx="-8" cy="-15" rx="5" ry="8" fill="#2b2e33"/><ellipse cx="8" cy="13" rx="5" ry="8" fill="#2b2e33"/>'+
      '<ellipse cx="-22" cy="7" rx="5.5" ry="10" fill="'+d+'"/><circle cx="-22" cy="16" r="4" fill="'+skin+'"/>'+
      '<ellipse cx="22" cy="-7" rx="5.5" ry="10" fill="'+d+'"/><circle cx="22" cy="-16" r="4" fill="'+skin+'"/>'+
      '<ellipse cx="0" cy="0" rx="21" ry="11" fill="'+c+'" stroke="'+d+'" stroke-width="2"/>'+
      '<circle cx="0" cy="-1.5" r="10" fill="'+skin+'"/><circle cx="0" cy="1.5" r="9.5" fill="#4a3426"/>';
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
  stop:{label:'Stopbord',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<polygon points="'+octagon(33,-45)+'" fill="#fff"/><polygon points="'+octagon(29,-45)+'" fill="#d3202a"/><text x="0" y="-39" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="17" fill="#fff">STOP</text>');
  }},
  yield:{label:'Geef voorrang',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<polygon points="-26,-62 26,-62 0,-17" fill="#fff" stroke="#d3202a" stroke-width="9" stroke-linejoin="round"/>');
  }},
  priority:{label:'Voorrangsweg',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<polygon points="0,-81 36,-45 0,-9 -36,-45" fill="#fff" stroke="#111" stroke-width="2.6" stroke-linejoin="round"/>'+
      '<polygon points="0,-68 23,-45 0,-22 -23,-45" fill="#e8801a" stroke="#111" stroke-width="1.6" stroke-linejoin="miter"/>');
  }},
  endpriority:{label:'Einde voorrangsweg',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<defs><clipPath id="epc"><polygon points="600,70 1130,600 600,1130 70,600"/></clipPath></defs>'+
      '<g transform="translate(0,-45) scale(0.066) translate(-600,-600)">'+
      '<polygon points="600,60 1140,600 600,1140 60,600" fill="#fff"/>'+
      '<g clip-path="url(#epc)"><line x1="1400" y1="-200" x2="-200" y2="1400" stroke="#111" stroke-width="185"/></g>'+
      '<g fill="#e8801a" stroke="#111" stroke-width="24" stroke-linejoin="miter"><polygon points="270,600 600,270 710,380 380,710"/><polygon points="930,600 600,930 490,820 820,490"/></g>'+
      '<polygon points="600,60 1140,600 600,1140 60,600" fill="none" stroke="#111" stroke-width="32" stroke-linejoin="round"/></g>');
  }},
  noentry:{label:'Verboden toegang',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<circle cx="0" cy="-45" r="31" fill="#d3202a" stroke="#fff" stroke-width="3"/><rect x="-21" y="-51" width="42" height="12" rx="2" fill="#fff"/>');
  }},
  ahead:{label:'Rechtdoor (verplicht)',kind:'object',follow:true,w:68,h:150,draw:function(){
    return signWrap('<circle cx="0" cy="-45" r="31" fill="#1b6ec2" stroke="#fff" stroke-width="3"/><path d="M0 -68L15 -47H6V-24H-6V-47H-15Z" fill="#fff"/>');
  }},
  mergesign:{label:'Vermindering rechts',kind:'object',follow:true,w:48,h:150,draw:function(){return signWrap(mergePlate());}},
  mergesign_l:{label:'Vermindering links',kind:'object',follow:true,w:48,h:150,draw:function(){return signWrap(mirror(mergePlate()));}},
  lanesign:{label:'Rijstrookbord',kind:'object',follow:true,w:112,h:150,wf:function(it){return (it.lanes||['s','s']).length*30+14;},draw:function(it){
    var L=it.lanes||['s','s'],n=L.length,Wd=n*30+14,s='',i,x0=-Wd/2;
    s+='<rect x="'+x0+'" y="-86" width="'+Wd+'" height="74" rx="7" fill="#22558c" stroke="#fff" stroke-width="3"/>';
    s+='<rect x="'+(x0+3.5)+'" y="-82.5" width="'+(Wd-7)+'" height="67" rx="4.5" fill="none" stroke="#fff" stroke-width="1"/>';
    for(i=1;i<n;i++)s+='<line x1="'+(x0+7+i*30)+'" y1="-17" x2="'+(x0+7+i*30)+'" y2="-81" stroke="#fff" stroke-width="2" '+(it.solid?'':'stroke-dasharray="7 5" ')+'/>';
    for(i=0;i<n;i++)s+=laneArrow(L[i],x0+7+15+i*30);
    return signWrap(s);
  }},
  workwarn:{label:'Wegenwerken',kind:'object',follow:true,w:72,h:150,draw:function(){
    return signWrap('<g transform="translate(0,-18) scale(0.072) translate(-605,-1020)">'+
      '<polygon points="610,70 75,975 1135,975" fill="#c0281f" stroke="#c0281f" stroke-width="95" stroke-linejoin="round"/>'+
      '<polygon points="610,190 200,900 1020,900" fill="#f1f1ef"/>'+
      '<g fill="#000"><rect x="258" y="838" width="675" height="30"/>'+
      '<path d="M258 838L330 800Q372 755 410 800L470 838Z"/>'+
      '<path d="M640 838Q720 750 800 700Q835 662 870 690Q910 760 933 838Z"/>'+
      '<path d="M618 412Q650 392 684 428L680 462Q662 478 642 468L614 452Z M545 455L608 446L640 472L657 522L652 602L602 642L592 702L638 790L642 842L592 842L556 802L532 832L470 840L468 600L452 562L468 496L510 482Z"/></g>'+
      '<path d="M652 664L772 722" stroke="#000" stroke-width="9" fill="none" stroke-linecap="round"/></g>');
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
  agent_up:{label:'Bevoegd persoon',kind:'object',w:76,h:170,draw:function(){return agent('up');}},
  agent_side:{label:'Bevoegd persoon',kind:'object',w:106,h:150,draw:function(){return agent('side');}},
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
    var s='<clipPath id="'+id+'"><polygon points="'+pts+'"/></clipPath><g clip-path="url(#'+id+')" stroke="'+WHITE+'" stroke-width="12">';
    for(d=-h;d<=w;d+=34)s+='<line x1="'+(bb[0]+d)+'" y1="'+bb[1]+'" x2="'+(bb[0]+d+h)+'" y2="'+bb[3]+'"/>';
    return s+'</g><polygon points="'+pts+'" fill="none" stroke="'+WHITE+'" stroke-width="7" stroke-linejoin="miter"/><polygon points="'+pts+'" fill="#000" fill-opacity="0"/>';
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
  fietspad:{label:'Fietspad (rood)',kind:'base',stretch:'wh',w:90,h:500,tw:50,th:90,draw:function(it){
    return '<rect x="'+(-it.w/2)+'" y="'+(-it.h/2)+'" width="'+it.w+'" height="'+it.h+'" fill="#c4513f" stroke="#a53f2f" stroke-width="2"/>';
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
function dims(it){var b=baseDims(it),s=TYPES[it.type].stretch?1:it.s;return [b[0]*s,b[1]*s];}

var LINES=['solid','dashed','ydashed','tsolid','tdashed'];
var BERMS=['midberm','grasberm','verhardeberm','stoep','fietspad','parkeer'];
var LANEMARKS=['stopline','sharks','arrow_s','arrow_r','arrow_l','arrow_sr','arrow_sl','arrow_mr','arrow_ml'];

var SECTIONS=[
  {el:'t-veh',entries:[{type:'car'},{type:'bus'},{type:'truck'},{type:'bike'},{type:'ambulance'},{type:'police'},{type:'fire'},{type:'ped'}]},
  {el:'t-light',entries:[{type:'light',state:'red',label:'Rood'},{type:'light',state:'orange',label:'Oranje'},{type:'light',state:'green',label:'Groen'}]},
  {el:'t-sign',entries:[{type:'stop'},{type:'yield'},{type:'priority'},{type:'endpriority'},{type:'noentry'},{type:'ahead'},{type:'mergesign'},{type:'mergesign_l'},
    {type:'lanesign',lanes:['l','s'],label:'Rijstrookbord'},{type:'lanesign',lanes:['s','r'],label:'Rijstrookbord'},{type:'lanesign',lanes:['l','s','r'],label:'Rijstrookbord'},{type:'lanesign',lanes:['s','s','s','r'],label:'Rijstrookbord'},{type:'lanesign',lanes:['s','s','r'],label:'Rijstrookbord'},{type:'lanesign',lanes:['l','s','s'],label:'Rijstrookbord'},{type:'lanesign',lanes:['s','s'],label:'Rijstrookbord'}]},
  {el:'t-mark',entries:[{type:'solid'},{type:'dashed'},{type:'ydashed'},{type:'stopline'},{type:'sharks'},{type:'zebra'},{type:'vlak'},
    {type:'arrow_s'},{type:'arrow_r'},{type:'arrow_l'},{type:'arrow_sr'},{type:'arrow_sl'},{type:'arrow_mr'},{type:'arrow_ml'}]},
  {el:'t-berm',entries:[{type:'midberm'},{type:'grasberm'},{type:'verhardeberm'},{type:'stoep'},{type:'fietspad'},{type:'parkeer'},{type:'asfalt'}]},
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
  TYPES,SECTIONS,ENTRY,LINES,BERMS,LANEMARKS,
  copyPts,isPts,vbox,normV,follows,baseDims,dims,clamp,sanitizeItem
};
