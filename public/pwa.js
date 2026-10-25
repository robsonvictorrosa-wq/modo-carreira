(()=>{if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;if(standalone)return;
const b=document.createElement('button');b.id='installBtn';b.textContent='📲 Instalar app';b.style.display='none';
const tip=document.createElement('div');tip.id='iosTip';tip.style.display='none';
tip.innerHTML='No iPhone: toque em <b>Compartilhar</b> ⎋ e depois em <b>Adicionar à Tela de Início</b>. <a href="#" id="iosX">✕</a>';
addEventListener('DOMContentLoaded',()=>{document.querySelector('nav').appendChild(b);document.body.appendChild(tip);
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);if(ios&&!localStorage.iosTipX){tip.style.display='block';}
 tip.querySelector('#iosX').onclick=e=>{e.preventDefault();tip.style.display='none';localStorage.iosTipX=1;};});
let ev;addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;b.style.display='';});
b.onclick=async()=>{if(!ev)return;ev.prompt();await ev.userChoice;ev=null;b.style.display='none';};
addEventListener('appinstalled',()=>{b.style.display='none';});})();
