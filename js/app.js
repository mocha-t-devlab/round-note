'use strict';
const CLUBS=14,PENALTY=14,MAX=4,KEY='golf_tracker_phase7',LONG=800;
const MEMBER_COLORS=[{dark:'#2e7d32',light:'#c8e6c9',summary:'#eef7ee'},{dark:'#1565c0',light:'#d9eaff',summary:'#f0f6fd'},{dark:'#ef6c00',light:'#ffe4c7',summary:'#fff4e8'},{dark:'#7b1fa2',light:'#ead7f2',summary:'#f7effa'}];
const cols=[...Array.from({length:9},(_,i)=>({t:'h',h:i})),{t:'s',k:'out',l:'OUT'},...Array.from({length:9},(_,i)=>({t:'h',h:i+9})),{t:'s',k:'in',l:'IN'},{t:'s',k:'total',l:'TOTAL'}];
const player=n=>({name:n,names:Array.from({length:CLUBS},(_,i)=>`クラブ${i+1}`),yards:Array(CLUBS).fill(''),visible:Array(CLUBS).fill(true),scores:Array.from({length:18},()=>Array(15).fill(0)),notes:Array(18).fill('')});
let st={date:'',course:'',par:Array(18).fill(4),locks:Array(18).fill(false),active:0,players:[player('あなた')]},settingsPlayer=0,memoHole=null;
addEventListener('DOMContentLoaded',()=>{load();common();tabs();head();body();bind();calc();setTimeout(()=>{$('app').classList.add('show');$('splash').classList.add('hide')},2000)});
const today=()=>{const n=new Date();return new Date(n-n.getTimezoneOffset()*60000).toISOString().slice(0,10)};
function common(){const d=$('round-date'),c=$('course-name');d.value=st.date||today();c.value=st.course;d.onchange=save;c.oninput=save}
function tabs(){const b=$('member-tabs');b.replaceChildren();st.players.forEach((p,i)=>{const x=el('button',`${p.name}： ${total(p)}`,'member-tab'+(i===st.active?' active':'')),color=MEMBER_COLORS[i%MEMBER_COLORS.length];x.style.setProperty('--tab-dark',color.dark);x.onclick=()=>{st.active=i;save();tabs();body();calc()};x.oncontextmenu=e=>{e.preventDefault();rename(i)};b.append(x)});applyMemberTheme();if(st.players.length<MAX){const x=el('button','＋','add-member');x.onclick=add;b.append(x)}}
function add(){const n=prompt('メンバー名',`メンバー${st.players.length+1}`);if(!n?.trim())return;st.players.push(player(n.trim()));st.active=st.players.length-1;save();tabs();body();calc()}
function rename(i){const n=prompt('名前変更。空欄で削除',st.players[i].name);if(n===null)return;if(n.trim())st.players[i].name=n.trim();else if(st.players.length>1&&confirm('削除しますか？')){st.players.splice(i,1);st.active=Math.min(st.active,st.players.length-1)}save();tabs();body();calc()}
function head(){const a=document.createElement('tr');a.className='hole-row';a.append(el('th','クラブ名','label'));cols.forEach(c=>{const x=el('th',c.t==='h'?(st.locks[c.h]?`🔒 ${c.h+1}H`:`${c.h+1}H`):c.l,c.t==='s'?'summary':'');if(c.t==='h'){x.classList.add('hole-head');x.dataset.lockHole=c.h;bindHoleLock(x,c.h)}a.append(x)});const b=document.createElement('tr');b.className='par-row';b.append(el('th','Par','label'));cols.forEach(c=>{if(c.t==='s'){const x=el('td','','summary');x.id=`par-${c.k}`;b.append(x)}else{const td=document.createElement('td'),s=document.createElement('select');td.className='par-hole';td.dataset.parHole=c.h;s.className='par-select';s.disabled=!!st.locks[c.h];for(let v=3;v<=7;v++){const o=el('option',v);o.value=v;o.selected=v===st.par[c.h];s.append(o)}s.onchange=()=>{if(st.locks[c.h])return;st.par[c.h]=+s.value;calc();save()};td.append(s);b.append(td)}});$('table-head').replaceChildren(a,b);updateLockUI()}
function body(){const p=st.players[st.active],f=document.createDocumentFragment();for(let i=0;i<CLUBS;i++){const r=document.createElement('tr');r.className='club-row'+(p.visible[i]?'':' hidden-row');const th=el('th','','label'),info=el('div','','info'),n=document.createElement('input');n.className='club-name';n.value=p.names[i];n.oninput=()=>{p.names[i]=n.value;save()};const line=el('div','','distance'),d=document.createElement('input');d.type='number';d.inputMode='numeric';d.className='club-distance';d.placeholder='---';d.value=p.yards[i];d.oninput=()=>{d.value=d.value.replace(/\D/g,'').slice(0,3);p.yards[i]=d.value;save()};line.append(d,document.createTextNode('yd'));info.append(n,line);th.append(info);r.append(th);cols.forEach(c=>r.append(c.t==='h'?counter(c.h,i):sumCell(`club-${i}-${c.k}`)));f.append(r)}f.append(penRow(),calcRow('合計','total-row','total'),calcRow('±','diff-row','diff'));$('table-body').replaceChildren(f);updateLockUI()}
function penRow(){const r=document.createElement('tr');r.className='penalty-row';r.append(el('th','ペナルティー','label'));cols.forEach(c=>r.append(c.t==='h'?counter(c.h,PENALTY):sumCell(`penalty-${c.k}`)));return r}function calcRow(l,cl,p){const r=document.createElement('tr');r.className=cl;r.append(el('th',l,'label'));cols.forEach(c=>{const cell=sumCell(c.t==='h'?`${p}-${c.h}`:`${p}-${c.k}`);if(p==='total'&&c.t==='h'){cell.classList.add('total-note');cell.dataset.noteHole=c.h;cell.onclick=()=>openMemo(c.h)}r.append(cell)});return r}function sumCell(id){const x=el('td','0','summary');x.id=id;return x}

function counter(h,i){

    const x = el('td','','counter');

    x.dataset.h = h;
    x.dataset.i = i;
    x.dataset.scoreHole = h;

    let t = null;
    let long = false;
    let moved = false;

    let startX = 0;
    let startY = 0;

    const clear = () => {
        clearTimeout(t);
        t = null;
    };

    x.addEventListener('touchstart', (e) => {

        moved = false;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        long = false;

        t = setTimeout(() => {
            long = true;
            change(h,i,-1);
        }, LONG);

    }, { passive:true });

    x.addEventListener('touchmove', (e) => {

        const dx = Math.abs(
            e.touches[0].clientX - startX
        );

        const dy = Math.abs(
            e.touches[0].clientY - startY
        );

        if(dx > 8 || dy > 8){
            moved = true;
            clear();
        }

    }, { passive:true });

    x.addEventListener('touchend', () => {

        if(!moved && t && !long){
            change(h,i,1);
        }

        clear();

    });

    x.addEventListener('touchcancel', clear);

    x.oncontextmenu = e => e.preventDefault();

    show(x,h,i);

    return x;
}

function change(h,i,a){if(st.locks[h])return;const p=st.players[st.active],before=p.scores[h][i],after=Math.max(0,before+a),cell=document.querySelector(`[data-h="${h}"][data-i="${i}"]`);p.scores[h][i]=after;show(cell,h,i);if(after!==before)flashCell(cell,a>0?'flash-add':'flash-subtract');calc();save();tabs()}function show(x,h,i){const v=st.players[st.active].scores[h][i];x.textContent=i===PENALTY?String(v):v||''}
function calc(){const s=st.players[st.active].scores;txt('par-out',sum(st.par.slice(0,9)));txt('par-in',sum(st.par.slice(9)));txt('par-total',sum(st.par));for(let i=0;i<CLUBS;i++){const v=s.map(r=>r[i]);txt(`club-${i}-out`,sum(v.slice(0,9)));txt(`club-${i}-in`,sum(v.slice(9)));txt(`club-${i}-total`,sum(v))}const pen=s.map(r=>r[PENALTY]);txt('penalty-out',sum(pen.slice(0,9)));txt('penalty-in',sum(pen.slice(9)));txt('penalty-total',sum(pen));const ts=s.map(sum),used=ts.map(Boolean);ts.forEach((v,i)=>{txt(`total-${i}`,used[i]?v:'');setDiff(`diff-${i}`,used[i]?v-st.par[i]:null)});const o=sum(ts.slice(0,9)),n=sum(ts.slice(9)),hasOut=used.slice(0,9).some(Boolean),hasIn=used.slice(9).some(Boolean),op=st.par.slice(0,9).reduce((a,v,i)=>a+(used[i]?v:0),0),np=st.par.slice(9).reduce((a,v,i)=>a+(used[i+9]?v:0),0);txt('total-out',hasOut?o:'');txt('total-in',hasIn?n:'');txt('total-total',hasOut||hasIn?o+n:'');setDiff('diff-out',hasOut?o-op:null);setDiff('diff-in',hasIn?n-np:null);setDiff('diff-total',hasOut||hasIn?o+n-op-np:null);updateNoteMarkers()}
function bindHoleLock(cell,hole){let timer=null,startX=0,startY=0;const clear=()=>{if(timer!==null)clearTimeout(timer);timer=null};cell.onpointerdown=e=>{startX=e.clientX;startY=e.clientY;timer=setTimeout(()=>{timer=null;toggleHoleLock(hole,cell)},LONG)};cell.onpointermove=e=>{if(Math.abs(e.clientX-startX)>10||Math.abs(e.clientY-startY)>10)clear()};cell.onpointerup=clear;cell.onpointercancel=clear;cell.oncontextmenu=e=>e.preventDefault()}function toggleHoleLock(hole,cell){st.locks[hole]=!st.locks[hole];save();cell.classList.add('lock-flash');setTimeout(()=>{head();body();calc()},240)}function updateLockUI(){document.querySelectorAll('[data-lock-hole]').forEach(x=>x.classList.toggle('locked-hole',!!st.locks[+x.dataset.lockHole]));document.querySelectorAll('[data-par-hole]').forEach(x=>x.classList.toggle('locked-hole',!!st.locks[+x.dataset.parHole]));document.querySelectorAll('[data-score-hole]').forEach(x=>x.classList.toggle('locked-hole',!!st.locks[+x.dataset.scoreHole]))}
function openSettings(){closePanels();settingsPlayer=st.active;renderSettings();$('overlay').hidden=false;$('settings').hidden=false}function renderSettings(){const t=$('settings-tabs');t.replaceChildren();st.players.forEach((p,i)=>{const b=el('button',p.name,'settings-player'+(i===settingsPlayer?' active':''));b.onclick=()=>{settingsPlayer=i;renderSettings()};t.append(b)});const list=$('club-list'),p=st.players[settingsPlayer];list.replaceChildren();for(let i=0;i<CLUBS;i++){const row=el('label','','club-setting'),c=document.createElement('input');c.type='checkbox';c.checked=p.visible[i];c.onchange=()=>{p.visible[i]=c.checked;save();if(settingsPlayer===st.active){body();calc()}};row.append(c,document.createTextNode(p.names[i]||`クラブ${i+1}`));list.append(row)}}
function openMemo(hole){memoHole=hole;const p=st.players[st.active],text=p.notes?.[hole]||'';$('memo-title').textContent=`${hole+1}H メモ（${p.name}）`;$('memo-text').value=text;updateMemoCount();closePanels();$('overlay').hidden=false;$('memo-panel').hidden=false;$('memo-text').focus()}function updateMemoCount(){$('memo-count').textContent=`${$('memo-text').value.length} / 100文字`}function saveMemo(){if(memoHole===null)return;const p=st.players[st.active];p.notes[memoHole]=$('memo-text').value.slice(0,100).trim();save();updateNoteMarkers();closePanels();memoHole=null}function deleteMemo(){if(memoHole===null)return;st.players[st.active].notes[memoHole]='';$('memo-text').value='';updateMemoCount();save();updateNoteMarkers();closePanels();memoHole=null}function updateNoteMarkers(){const notes=st.players[st.active]?.notes||[];document.querySelectorAll('[data-note-hole]').forEach(cell=>cell.classList.toggle('has-note',!!notes[+cell.dataset.noteHole]))}
function bind(){const menu=$('action-menu'),ov=$('overlay');$('menu-button').onclick=()=>{menu.hidden=!menu.hidden;ov.hidden=menu.hidden};ov.onclick=closePanels;$('club-settings').onclick=openSettings;$('close-settings').onclick=closePanels;$('operation-help').onclick=()=>{closePanels();ov.hidden=false;$('help').hidden=false};$('close-help').onclick=closePanels;$('round-clear').onclick=()=>{closePanels();if(!confirm('ラウンド情報をクリアします。\n\n消去される情報\n・ゴルフ場名\n・Par\n・全メンバーの使用回数\n・ペナルティー\n・ホールのロック状態\n\n残る情報\n・メンバー名\n・クラブ名\n・飛距離\n・クラブ表示設定\n\n日付は本日に設定されます。'))return;st.date=today();st.course='';st.par=Array(18).fill(4);st.locks=Array(18).fill(false);st.players.forEach(p=>{p.scores=Array.from({length:18},()=>Array(15).fill(0));p.notes=Array(18).fill('')});$('round-date').value=st.date;$('course-name').value='';head();body();calc();tabs();save()};$('reset').onclick=()=>{closePanels();if(confirm('すべての登録内容を初期化します。\n\nメンバー名、クラブ名、飛距離、表示設定、Par、使用回数、ペナルティー、ホールのロック状態がすべて消去されます。\n\nこの操作は取り消せません。')){localStorage.removeItem(KEY);location.reload()}};$('version-info').onclick=()=>{closePanels();ov.hidden=false;$('version-panel').hidden=false};$('close-version').onclick=closePanels;$('memo-text').oninput=()=>{if($('memo-text').value.length>100)$('memo-text').value=$('memo-text').value.slice(0,100);updateMemoCount()};$('save-memo').onclick=saveMemo;$('delete-memo').onclick=deleteMemo}function closePanels(){$('action-menu').hidden=true;$('settings').hidden=true;$('help').hidden=true;$('version-panel').hidden=true;$('memo-panel').hidden=true;$('overlay').hidden=true}
function applyMemberTheme(){const color=MEMBER_COLORS[st.active%MEMBER_COLORS.length],root=document.documentElement;root.style.setProperty('--member-dark',color.dark);root.style.setProperty('--member-light',color.light);root.style.setProperty('--member-summary-light',color.summary)}function flashCell(cell,className){if(!cell)return;cell.classList.remove('flash-add','flash-subtract');void cell.offsetWidth;cell.classList.add(className);setTimeout(()=>cell.classList.remove(className),260)}function setDiff(id,value){const cell=$(id);if(!cell)return;cell.classList.remove('diff-under','diff-over','diff-even');if(value===null){cell.textContent='';return}cell.textContent=fmt(value);cell.classList.add(value<0?'diff-under':value>0?'diff-over':'diff-even')}function total(p){return p.scores.reduce((a,r)=>a+sum(r),0)}function save(){st.date=$('round-date')?.value||today();st.course=$('course-name')?.value||'';localStorage.setItem(KEY,JSON.stringify(st))}function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d?.players?.length){st=d;if(!Array.isArray(st.locks)||st.locks.length!==18)st.locks=Array(18).fill(false);st.players.forEach(p=>{if(!Array.isArray(p.notes)||p.notes.length!==18)p.notes=Array(18).fill('');if(!Array.isArray(p.visible))p.visible=Array(CLUBS).fill(true)})}}catch(e){console.error(e)}}function fmt(v){return v===0?'E':v>0?`+${v}`:String(v)}function sum(a){return a.reduce((x,y)=>x+(+y||0),0)}function $(id){return document.getElementById(id)}function txt(id,v){const x=$(id);if(x)x.textContent=v}function el(tag,text='',cl=''){const x=document.createElement(tag);x.textContent=text;if(cl)x.className=cl;return x}
