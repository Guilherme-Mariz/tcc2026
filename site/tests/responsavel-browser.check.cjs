const { chromium } = require('playwright');
// Verificação opcional: requer Playwright e Chromium instalados no ambiente.
// node tests/responsavel-browser.check.cjs
const express = require('express');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const app = express(); app.use(express.static(path.join(__dirname, '../view')));
const server = app.listen(0,'127.0.0.1',async()=>{
 const browser = await chromium.launch({headless:true,
  ...(process.env.TEKO_CHROMIUM_PATH ? {executablePath:process.env.TEKO_CHROMIUM_PATH} : {}),
  args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let childrenFail=false, empty=false, progressFail=false, pending=[];
 const children=[{id:'10000000-0000-4000-8000-000000000001',firstName:'Ana'},{id:'10000000-0000-4000-8000-000000000002',firstName:'Bruno'}];
 async function waitForPending(count) {
  const deadline=Date.now()+5000;
  while(pending.length<count) {
   assert.ok(Date.now()<deadline, 'Requisição de progresso não recebida');
   await new Promise(r=>setTimeout(r,10));
  }
 }
 const summary=(n)=>({completedModules:2,totalRealizations:n,streak:{current:1},timeZone:'America/Sao_Paulo',daily:Array.from({length:7},(_,i)=>({date:`2026-09-${String(i+6).padStart(2,'0')}`,count:i%3}))});
 await page.route('**/verify-pin',r=>r.fulfill({json:{valid:JSON.parse(r.request().postData()).pin==='1234'}}));
 await page.route('**/children',r=>r.fulfill({status:childrenFail?500:200,json:childrenFail?{error:'Não foi possível carregar os perfis.'}:{children:empty?[]:children}}));
 await page.route('**/auth/profile',r=>r.fulfill({json:{responsavel:{nome_completo:'Marina Teste'}}}));
 let delayed=false;
 await page.route('**/api/activities/progress/*',async r=>{
  if(delayed){pending.push(r);return;}
  await r.fulfill({status:progressFail?500:200,json:progressFail?{error:'Falha ao carregar progresso.'}:summary(r.request().url().endsWith('1')?12:24)});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}/pages/responsavel.html`);
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),true);
 await page.locator('#pin-input').fill('9999');await page.locator('#btn-pin').click();
 await page.waitForFunction(()=>document.querySelector('#pin-error').textContent.includes('incorreto'));
 delayed=true;
 await page.locator('#pin-input').fill('1234');await page.locator('#btn-pin').click();
 await waitForPending(1);
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),true);
 assert.equal(await page.locator('#pin-loading-status').textContent(),'Carregando seus dados…');
 assert.equal(await page.locator('#pin-loading-spinner').isVisible(),true);
 await page.screenshot({path:path.join(os.tmpdir(),'teko-loading.png'),fullPage:true});
 await pending.shift().fulfill({status:500,json:{error:'Falha ao carregar progresso.'}});
 await page.waitForFunction(()=>!document.querySelector('#pin-loading-retry').hidden);
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),true);
 assert.equal(await page.locator('#pin-overlay').isVisible(),true);
 delayed=false;
 await page.locator('#pin-loading-retry').click();
 await page.waitForFunction(()=>document.querySelector('#stat-atividades').textContent==='12');
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pin-overlay')).display==='none');
 assert.equal(await page.locator('#resp-nome').textContent(),'Marina');
 assert.equal(await page.locator('#stat-sequencia').textContent(),'1 dia');
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),false);
 assert.equal(await page.locator('#daily-chart').isVisible(),true);
 await page.screenshot({path:path.join(os.tmpdir(),'teko-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:path.join(os.tmpdir(),'teko-mobile.png'),fullPage:true});
 delayed=true;
 await page.getByRole('button',{name:'Ver dados de Bruno'}).click();
 await page.waitForFunction(()=>document.querySelector('#dado-nome').textContent==='Bruno');
 await page.getByRole('button',{name:'Ver dados de Ana'}).click();
 await waitForPending(2);
 await pending[1].fulfill({json:summary(13)});await pending[0].fulfill({json:summary(999)});pending=[];delayed=false;
 await page.waitForFunction(()=>document.querySelector('#stat-atividades').textContent==='13');
 assert.equal(await page.locator('#dado-nome').textContent(),'Ana');
 progressFail=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('#dashboard-status').textContent==='Falha ao carregar progresso.');
 assert.equal(await page.locator('#daily-chart').isVisible(),false);
 assert.equal(await page.locator('#stat-atividades').textContent(),'—');
 progressFail=false;await page.locator('#dashboard-retry').click();await page.waitForFunction(()=>document.querySelector('#stat-atividades').textContent==='12');
 childrenFail=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('#dashboard-status').textContent.includes('perfis'));
 assert.equal(await page.locator('#child-selector button').count(),0);
 childrenFail=false;empty=true;await page.locator('#dashboard-retry').click();
 await page.waitForFunction(()=>document.querySelector('#dashboard-status').textContent==='Nenhuma criança cadastrada.');
 assert.equal(await page.locator('#daily-chart').isVisible(),false);
 empty=false;delayed=true;await page.evaluate(()=>{void carregarDados();});
 await waitForPending(1);
 await page.evaluate(()=>bloquearDashboard());await pending.shift().fulfill({json:summary(888)});
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),true);
 assert.equal(await page.locator('#daily-chart').isVisible(),false);
 assert.equal(await page.locator('#stat-atividades').textContent(),'—');
 // Bloqueio também invalida uma tentativa de desbloqueio ainda carregando.
 await page.locator('#pin-input').fill('1234');await page.locator('#btn-pin').click();
 await waitForPending(1);await page.evaluate(()=>bloquearDashboard());
 await pending.shift().fulfill({json:summary(777)});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#resp-page').evaluate(e=>e.inert),true);
 assert.equal(await page.locator('#pin-overlay').isVisible(),true);
 assert.equal(await page.locator('#stat-atividades').textContent(),'—');
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile, PIN, saudação, erro/retry, foco, nenhuma criança, troca rápida e resposta após bloqueio.');
 } finally {await browser.close();server.close();}
});
