// Etapa 3: temporada, calendário, escalação, avanço rodada a rodada
const S=require('./sim');
module.exports=({app,uni,q,pool,auth,wrap,fail,member,bump,R,M})=>{
 const club=id=>uni.prepare('SELECT c.id,c.name,c.overall,c.league_id,l.name league FROM clubs c JOIN leagues l ON l.id=c.league_id WHERE c.id=?').get(id);
 const pp=p=>({...p,positions:JSON.parse(p.positions||'[]'),stats:JSON.parse(p.stats||'{}')});
 const squad=(db,roomId,clubId)=>R.squad(db,roomId,clubId);
 async function xiFor(db,roomId,clubId){const sq=await squad(db,roomId,clubId);const [l]=(await db.query('SELECT * FROM lineups WHERE room_id=$1 AND club_id=$2',[roomId,clubId])).rows;
  if(l&&l.starters?.length===11){const m=new Map(sq.map(p=>[p.id,p]));const xi=l.starters.map(id=>m.get(id)).filter(Boolean);if(xi.length===11)return {xi,formation:l.formation,custom:true};}
  const f=l?.formation||'4-3-3';return {xi:S.autoXI(sq,f),formation:f,custom:false};}
 const form=async(db,compId,clubId)=>{const r=(await db.query('SELECT home,hg,ag FROM matches WHERE comp_id=$1 AND played AND (home=$2 OR away=$2) ORDER BY round DESC LIMIT 5',[compId,clubId])).rows;
  if(!r.length)return null;return r.reduce((a,m)=>{const [f,g]=m.home===clubId?[m.hg,m.ag]:[m.ag,m.hg];return a+(f>g?3:f===g?1:0)},0)*5/r.length;};
 const ownerOnly=(room,r)=>{if(room.owner_id!==r.user.id)throw fail('Só o dono da sala',403);};

 app.post('/api/rooms/:code/season/start',auth,wrap(async(r,s)=>{const room=await member(r);ownerOnly(room,r);if(room.status!=='lobby')throw fail('Temporada já iniciada');
  const ms=await q('SELECT club_id FROM room_managers WHERE room_id=$1',[room.id]);if(ms.some(m=>!m.club_id))throw fail('Todos os técnicos precisam escolher clube');
  const leagues=[...new Set(ms.map(m=>club(m.club_id).league_id))];const c=await pool.connect();
  try{await c.query('BEGIN');for(const lid of leagues){const L=uni.prepare('SELECT * FROM leagues WHERE id=?').get(lid);const ids=uni.prepare('SELECT id FROM clubs WHERE league_id=?').all(lid).map(x=>x.id);const rounds=S.schedule(ids);
    const {rows:[comp]}=await c.query('INSERT INTO competitions(room_id,season,league_id,name,rounds_total) VALUES($1,$2,$3,$4,$5) RETURNING id',[room.id,room.season,lid,L.name,rounds.length]);
    const vals=[];rounds.forEach((m,i)=>m.forEach(([h,a])=>vals.push([comp.id,i+1,h,a])));
    await c.query('INSERT INTO matches(comp_id,round,home,away) SELECT * FROM unnest($1::int[],$2::int[],$3::int[],$4::int[])',[vals.map(v=>v[0]),vals.map(v=>v[1]),vals.map(v=>v[2]),vals.map(v=>v[3])]);}
   await c.query("UPDATE rooms SET status='season',version=version+1 WHERE id=$1",[room.id]);await c.query('UPDATE room_managers SET ready=false WHERE room_id=$1',[room.id]);if(M)await M.onStart(c,{...room,status:'season'});await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
  await bump(room.id,`Temporada ${room.season}/${room.season+1} iniciada! Clubes travados.`);s.json({ok:1});}));

 app.get('/api/rooms/:code/season',auth,wrap(async(r,s)=>{const room=await member(r);const comps=await q('SELECT * FROM competitions WHERE room_id=$1 AND season=$2 ORDER BY id',[room.id,room.season]);
  const ms=await q('SELECT m.user_id,u.nick,m.club_id,m.ready FROM room_managers m JOIN users u ON u.id=m.user_id WHERE room_id=$1',[room.id]);const me=ms.find(m=>m.user_id===r.user.id);
  const myComp=me.club_id&&comps.find(c=>c.league_id===club(me.club_id).league_id);
  s.json({status:room.status,season:room.season,owner:room.owner_id===r.user.id,competitions:comps,my_comp:myComp?.id||null,my_club:me.club_id,managers:ms.map(m=>({...m,club:m.club_id&&club(m.club_id).name}))});}));

 app.get('/api/rooms/:code/comp/:id/table',auth,wrap(async(r,s)=>{const room=await member(r);const [comp]=await q('SELECT * FROM competitions WHERE id=$1 AND room_id=$2',[r.params.id,room.id]);if(!comp)throw fail('Competição não encontrada',404);
  const ms=await q('SELECT * FROM matches WHERE comp_id=$1 AND played',[comp.id]);const hum=new Map((await q('SELECT m.club_id,u.nick FROM room_managers m JOIN users u ON u.id=m.user_id WHERE room_id=$1',[room.id])).map(x=>[x.club_id,x.nick]));
  const T={};uni.prepare('SELECT id,name FROM clubs WHERE league_id=?').all(comp.league_id).forEach(c=>T[c.id]={club_id:c.id,name:c.name,manager:hum.get(c.id)||null,j:0,v:0,e:0,d:0,gp:0,gc:0,pts:0,form:[]});
  for(const m of ms.sort((a,b)=>a.round-b.round))for(const [id,f,g] of [[m.home,m.hg,m.ag],[m.away,m.ag,m.hg]]){const t=T[id];if(!t)continue;t.j++;t.gp+=f;t.gc+=g;if(f>g){t.v++;t.pts+=3;t.form.push('V')}else if(f===g){t.e++;t.pts++;t.form.push('E')}else{t.d++;t.form.push('D')}}
  const rows=Object.values(T).map(t=>({...t,sg:t.gp-t.gc,form:t.form.slice(-5)})).sort((a,b)=>b.pts-a.pts||b.v-a.v||b.sg-a.sg||b.gp-a.gp||a.name.localeCompare(b.name));
  s.json({comp,rows});}));

 app.get('/api/rooms/:code/comp/:id/fixtures',auth,wrap(async(r,s)=>{const room=await member(r);const [comp]=await q('SELECT * FROM competitions WHERE id=$1 AND room_id=$2',[r.params.id,room.id]);if(!comp)throw fail('Competição não encontrada',404);
  const round=+r.query.round||Math.max(1,comp.current_round);const ms=await q('SELECT id,round,home,away,hg,ag,played FROM matches WHERE comp_id=$1 AND round=$2 ORDER BY id',[comp.id,round]);
  const hum=new Map((await q('SELECT m.club_id,u.nick FROM room_managers m JOIN users u ON u.id=m.user_id WHERE room_id=$1',[room.id])).map(x=>[x.club_id,x.nick]));
  s.json({comp,round,matches:ms.map(m=>({...m,home_name:club(m.home).name,away_name:club(m.away).name,home_mgr:hum.get(m.home)||null,away_mgr:hum.get(m.away)||null}))});}));

 app.get('/api/rooms/:code/comp/:id/scorers',auth,wrap(async(r,s)=>{const room=await member(r);const [comp]=await q('SELECT id FROM competitions WHERE id=$1 AND room_id=$2',[r.params.id,room.id]);if(!comp)throw fail('Competição não encontrada',404);
  const name=id=>uni.prepare('SELECT name,primary_position FROM players WHERE id=?').get(id)||{};const fmt=x=>({...x,...name(x.player_id),club:club(x.club_id)?.name,rating:x.apps?+(x.rating_sum/x.apps).toFixed(2):null});
  s.json({goals:(await q('SELECT * FROM player_stats WHERE comp_id=$1 AND goals>0 ORDER BY goals DESC,assists DESC LIMIT 30',[comp.id])).map(fmt),
   assists:(await q('SELECT * FROM player_stats WHERE comp_id=$1 AND assists>0 ORDER BY assists DESC,goals DESC LIMIT 30',[comp.id])).map(fmt),
   ratings:(await q('SELECT * FROM player_stats WHERE comp_id=$1 AND apps>=GREATEST(1,(SELECT max(apps) FROM player_stats WHERE comp_id=$1)/2) ORDER BY rating_sum/apps DESC LIMIT 30',[comp.id])).map(fmt)});}));

 app.get('/api/rooms/:code/match/:id',auth,wrap(async(r,s)=>{const room=await member(r);const [m]=await q('SELECT m.* FROM matches m JOIN competitions c ON c.id=m.comp_id WHERE m.id=$1 AND c.room_id=$2',[r.params.id,room.id]);if(!m)throw fail('Jogo não encontrado',404);
  s.json({...m,home_name:club(m.home).name,away_name:club(m.away).name});}));

 app.get('/api/rooms/:code/lineup',auth,wrap(async(r,s)=>{const room=await member(r);const [me]=await q('SELECT club_id FROM room_managers WHERE room_id=$1 AND user_id=$2',[room.id,r.user.id]);if(!me.club_id)throw fail('Escolha um clube');
  const sq=await squad(pool,room.id,me.club_id);const x=await xiFor(pool,room.id,me.club_id);
  s.json({formations:Object.keys(S.FORMATIONS),formation:x.formation,custom:x.custom,starters:x.xi.map(p=>p.id),strength:S.strength(x.xi),squad:sq.map(p=>({id:p.id,name:p.name,primary_position:p.primary_position,overall:p.overall,age:p.age,sector:S.sec(p)})).sort((a,b)=>b.overall-a.overall)});}));
 app.post('/api/rooms/:code/lineup',auth,wrap(async(r,s)=>{const room=await member(r);const [me]=await q('SELECT club_id FROM room_managers WHERE room_id=$1 AND user_id=$2',[room.id,r.user.id]);if(!me.club_id)throw fail('Escolha um clube');
  const f=r.body?.formation;if(!S.FORMATIONS[f])throw fail('Formação inválida');let st=null;
  if(!r.body.auto){st=[...new Set((r.body.starters||[]).map(Number))];if(st.length!==11)throw fail('Escolha exatamente 11 titulares');const ids=new Set((await squad(pool,room.id,me.club_id)).map(p=>p.id));if(st.some(i=>!ids.has(i)))throw fail('Jogador fora do elenco');}
  await q('INSERT INTO lineups(room_id,club_id,formation,starters) VALUES($1,$2,$3,$4) ON CONFLICT(room_id,club_id) DO UPDATE SET formation=$3,starters=$4',[room.id,me.club_id,f,st]);s.json({ok:1});}));

 app.post('/api/rooms/:code/ready',auth,wrap(async(r,s)=>{const room=await member(r);await q('UPDATE room_managers SET ready=NOT ready WHERE room_id=$1 AND user_id=$2',[room.id,r.user.id]);
  const ms=await q('SELECT ready FROM room_managers WHERE room_id=$1',[room.id]);await q('UPDATE rooms SET version=version+1 WHERE id=$1',[room.id]);
  if(room.status==='season'&&ms.every(m=>m.ready))return s.json(await advance(room.id,'Todos prontos'));s.json({ok:1});}));
 app.post('/api/rooms/:code/advance',auth,wrap(async(r,s)=>{const room=await member(r);ownerOnly(room,r);s.json(await advance(room.id,'Dono da sala'));}));

 async function advance(roomId,why){const c=await pool.connect();const out=[];
  try{await c.query('BEGIN');const {rows:[room]}=await c.query('SELECT * FROM rooms WHERE id=$1 FOR UPDATE',[roomId]);if(room.status!=='season')throw fail('A temporada não está em andamento');
   const comps=(await c.query('SELECT * FROM competitions WHERE room_id=$1 AND season=$2 AND current_round<rounds_total ORDER BY id',[roomId,room.season])).rows;if(!comps.length)throw fail('Temporada encerrada');
   if(M)await M.before(c,room);
   const hum=new Map((await c.query('SELECT m.club_id,u.nick FROM room_managers m JOIN users u ON u.id=m.user_id WHERE room_id=$1',[roomId])).rows.map(x=>[x.club_id,x.nick]));
   for(const comp of comps){const round=comp.current_round+1;const ms=(await c.query('SELECT * FROM matches WHERE comp_id=$1 AND round=$2',[comp.id,round])).rows;
    for(const m of ms){const H={club_id:m.home,...await xiFor(c,roomId,m.home),form:await form(c,comp.id,m.home)},A={club_id:m.away,...await xiFor(c,roomId,m.away),form:await form(c,comp.id,m.away)};
     const res=S.playMatch(H,A);const details={xg:res.xg,strength:res.strength,events:res.events,ratings:res.ratings,lineups:res.lineups,formation:{home:H.formation,away:A.formation},form:{home:H.form,away:A.form}};
     await c.query('UPDATE matches SET hg=$2,ag=$3,played=true,details=$4 WHERE id=$1',[m.id,res.hg,res.ag,details]);
     const pl=[...H.xi.map(p=>[p,m.home]),...A.xi.map(p=>[p,m.away])];
     await c.query(`INSERT INTO player_stats(comp_id,player_id,club_id,apps,goals,assists,rating_sum) SELECT $1,* FROM unnest($2::int[],$3::int[],$4::int[],$5::int[],$6::int[],$7::real[]) ON CONFLICT(comp_id,player_id) DO UPDATE SET apps=player_stats.apps+1,goals=player_stats.goals+EXCLUDED.goals,assists=player_stats.assists+EXCLUDED.assists,rating_sum=player_stats.rating_sum+EXCLUDED.rating_sum,club_id=EXCLUDED.club_id`,
      [comp.id,pl.map(x=>x[0].id),pl.map(x=>x[1]),pl.map(()=>1),pl.map(x=>res.goalsBy[x[0].id].g),pl.map(x=>res.goalsBy[x[0].id].a),pl.map(x=>res.ratings[x[0].id])]);
     if(hum.has(m.home)||hum.has(m.away))out.push({id:m.id,comp:comp.name,round,home:club(m.home).name,away:club(m.away).name,hg:res.hg,ag:res.ag});}
    await c.query('UPDATE competitions SET current_round=$2 WHERE id=$1',[comp.id,round]);}
   if(M)await M.after(c,room);
   await c.query('UPDATE room_managers SET ready=false WHERE room_id=$1',[roomId]);
   const left=(await c.query('SELECT count(*)::int n FROM competitions WHERE room_id=$1 AND season=$2 AND current_round<rounds_total',[roomId,room.season])).rows[0].n;
   if(!left)await c.query("UPDATE rooms SET status='finished' WHERE id=$1",[roomId]);
   await c.query('INSERT INTO room_events(room_id,text) VALUES($1,$2)',[roomId,`Rodada simulada (${why}): `+(out.map(o=>`${o.home} ${o.hg}x${o.ag} ${o.away}`).join(' · ')||'—')]);
   await c.query('UPDATE rooms SET version=version+1 WHERE id=$1',[roomId]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
  return {ok:1,results:out};}
};
