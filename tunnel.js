// Túnel público via Pinggy (SSH na porta 443). Reconecta sozinho; URL atual em PUBLIC_URL.txt
const {Client}=require('ssh2'),net=require('net'),fs=require('fs');
function start(){const c=new Client();let url='';
 c.on('ready',()=>{c.forwardIn('localhost',0,e=>{if(e)console.error('fwd',e);});
  c.shell(false,(e,s)=>{if(e)return console.error(e);s.on('data',d=>{const t=d.toString();const m=t.match(/https:\/\/[a-z0-9.-]+\.pinggy\.link/);if(m&&m[0]!==url){url=m[0];fs.writeFileSync(__dirname+'/PUBLIC_URL.txt',url+'\n');console.log(new Date().toISOString(),'URL',url);}});});});
 c.on('tcp connection',(i,accept)=>{const s=accept(),l=net.connect(+process.env.PORT||3027,'127.0.0.1');s.pipe(l).pipe(s);l.on('error',()=>s.end());s.on('error',()=>l.end());});
 c.on('error',e=>console.error('err',e.message));c.on('close',()=>{console.log('closed, reconnecting');setTimeout(start,3000);});
 c.connect({host:'a.pinggy.io',port:443,username:'free',tryKeyboard:true,password:'',keepaliveInterval:20000,readyTimeout:20000});
 c.on('keyboard-interactive',(n,i,l,p,f)=>f(p.map(()=>'')));}
start();
