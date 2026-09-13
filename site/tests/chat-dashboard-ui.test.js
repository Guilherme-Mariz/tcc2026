// Executa os scripts reais em DOM mínimo; não substitui a conferência visual.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const tick = () => new Promise(resolve=>setImmediate(resolve));
const child={id:'10000000-0000-4000-8000-000000000001',firstName:'Ana'};
const progress={completedModules:2,totalRealizations:12,streak:{current:1},timeZone:'America/Sao_Paulo',daily:Array.from({length:7},(_,i)=>({date:`2026-09-${String(i+6).padStart(2,'0')}`,count:1}))};
const reply=(data,status=200)=>({ok:status<400,status,json:async()=>data});
function fixture(page, fetch) {
    const elements=new Map();const timers=new Map();let timer=0;
    const document={activeElement:null};
    class Element {
        constructor(){this.children=[];this.style={};this.attributes={};this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.inert=false;this.listeners={};
            const classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,force)=>{if(force??!classes.has(x))classes.add(x);else classes.delete(x);}};}
        addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
        emit(name,event={}){return Promise.all((this.listeners[name]||[]).map(fn=>fn(event)));}
        setAttribute(k,v){this.attributes[k]=v;}
        removeAttribute(k){delete this.attributes[k];}
        append(...xs){this.children.push(...xs);}
        appendChild(x){this.append(x);}
        replaceChildren(...xs){this.children=[...xs];}
        focus(){document.activeElement=this;}
    }
    Object.assign(document,new Element());document.addEventListener=Element.prototype.addEventListener;document.emit=Element.prototype.emit;
    document.getElementById=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
    document.createElement=()=>new Element();
    const window=new Element();window.location={href:''};
    const context=vm.createContext({window,document,fetch,AbortController,AbortSignal,console,
        localStorage:{getItem:()=>JSON.stringify({crianca:child})},
        setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id)});
    vm.runInContext(fs.readFileSync(path.join(__dirname,`../view/js/${page}.js`),'utf8'),context);
    return {context,document,window,el:document.getElementById,run:code=>vm.runInContext(code,context),
        typeAll(){let count=0;while(timers.size){assert.ok(count++<10000);const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}}};
}
function dashboard(fetch) {const f=fixture('responsavel',fetch);f.el('resp-page').inert=true;f.el('pin-input').value='1234';return f;}

test('PIN mantém blur/foco bloqueado até o progresso; falha permite retry sem novo PIN',async()=>{
    let resolve;let calls=0;
    const f=dashboard(async url=>{
        if(url==='/verify-pin')return reply({valid:true});
        if(url==='/children')return reply({children:[child]});
        if(url==='/auth/profile')return reply({responsavel:{nome_completo:'Marina'}});
        calls++;return calls===1?new Promise(r=>resolve=r):reply(progress);
    });
    const pending=f.run('verificarPin()');await tick();
    assert.equal(f.el('resp-page').inert,true);assert.equal(f.el('resp-page').classList.contains('unlocked'),false);
    assert.equal(f.el('pin-loading-status').textContent,'Carregando seus dados…');
    assert.equal(f.el('pin-loading-spinner').hidden,false);
    resolve(reply({error:'Falha de progresso'},500));await pending;
    assert.equal(f.el('pin-loading-retry').hidden,false);assert.equal(f.el('resp-page').inert,true);
    await f.el('pin-loading-retry').emit('click');
    assert.equal(f.el('resp-page').inert,false);assert.equal(f.el('pin-overlay').style.display,'none');
    assert.equal(f.el('stat-atividades').textContent,12);assert.equal(f.document.activeElement,f.el('resp-heading'));
});

test('erro nos perfis não libera painel e conta sem criança termina carregamento',async()=>{
    let fail=true;
    const f=dashboard(async url=>url==='/verify-pin'?reply({valid:true}):url==='/children'?
        (fail?reply({error:'Perfis indisponíveis'},500):reply({children:[]})):reply({responsavel:{}}));
    await f.run('verificarPin()');assert.equal(f.el('resp-page').inert,true);
    assert.equal(f.el('pin-loading-status').textContent,'Perfis indisponíveis');
    fail=false;await f.el('pin-loading-retry').emit('click');
    assert.equal(f.el('resp-page').inert,false);assert.equal(f.el('dashboard-status').textContent,'Nenhuma criança cadastrada.');
});

test('bloquear durante carregamento invalida resposta e não remove blur',async()=>{
    let resolve;const f=dashboard(async url=>url==='/verify-pin'?reply({valid:true}):url==='/children'?reply({children:[child]}):
        url==='/auth/profile'?reply({responsavel:{}}):new Promise(r=>resolve=r));
    const pending=f.run('verificarPin()');await tick();f.run('bloquearDashboard()');
    resolve(reply(progress));await pending;
    assert.equal(f.el('resp-page').inert,true);assert.equal(f.el('resp-page').classList.contains('unlocked'),false);
    assert.equal(f.el('pin-overlay').style.display,'flex');assert.equal(f.el('stat-atividades').textContent,'—');
});

test('chat preserva texto no erro Groq e bloqueia envio duplicado por Enter',async()=>{
    let resolve,calls=0;const f=fixture('tekoia',()=>{calls++;return new Promise(r=>resolve=r);});
    f.run('carregarSessaoAtiva()');f.el('chat-input').value='estou triste';
    const pending=f.run('enviarMensagem()');await f.run('enviarMensagem()');assert.equal(calls,1);
    resolve(reply({code:'AI_UNAVAILABLE'},503));await pending;f.typeAll();
    assert.equal(f.el('chat-input').value,'estou triste');assert.equal(f.el('send-btn').disabled,false);
    assert.match(f.el('chat-display-text').textContent,/responsável/);assert.equal(f.el('chat-activity').hidden,true);
});

test('chat mostra atividade atual e limpa sugestão ao continuar; URL externa não vira link',async()=>{
    let activity={title:'Respire com o Teko',url:'/atividades/respire-com-teko'};
    const f=fixture('tekoia',async()=>reply({response:'Quer experimentar?',activity}));f.run('carregarSessaoAtiva()');
    f.el('chat-input').value='quero acalmar';await f.run('enviarMensagem()');
    assert.equal(f.el('chat-activity').hidden,false);assert.equal(f.el('chat-activity').children[0].href,activity.url);
    activity=null;await f.el('chat-activity').children[1].emit('click');await tick();
    assert.equal(f.el('chat-activity').hidden,true);
    f.run("mostrarAtividade({title:'Inválida',url:'https://example.com'})");assert.equal(f.el('chat-activity').hidden,true);
});

test('troca de criança descarta resposta atrasada, sugestão e texto do perfil anterior',async()=>{
    let resolve;const f=fixture('tekoia',()=>new Promise(r=>resolve=r));f.run('carregarSessaoAtiva()');
    f.el('chat-input').value='mensagem anterior';const pending=f.run('enviarMensagem()');
    await f.window.emit('teko:session-changed',{detail:{child:{id:'other',firstName:'Bruno'}}});
    resolve(reply({response:'Resposta da Ana',activity:{title:'Jogo antigo',url:'/atividades/respire-com-teko'}}));await pending;f.typeAll();
    assert.match(f.el('chat-display-text').textContent,/Bruno/);assert.doesNotMatch(f.el('chat-display-text').textContent,/Ana/);
    assert.equal(f.el('chat-activity').hidden,true);assert.equal(f.el('chat-input').value,'');assert.equal(f.el('send-btn').disabled,false);
});
