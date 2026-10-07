// Teste de navegador com APIs simuladas; não envia dados para Groq/Supabase.
const { chromium } = require('playwright');
const express = require('express');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const app = express();
app.use(express.static(path.join(__dirname, '../view')));
const server = app.listen(0, '127.0.0.1', async () => {
    let browser;
    try {
        browser = await chromium.launch({headless:true,
            ...(process.env.TEKO_CHROMIUM_PATH ? {executablePath:process.env.TEKO_CHROMIUM_PATH} : {}),
            args:['--no-sandbox','--disable-dev-shm-usage']});
        const page = await browser.newPage({viewport:{width:1440,height:1100}});
        const errors = []; page.on('pageerror',error=>errors.push(error.message));
        const child = {id:'10000000-0000-4000-8000-000000000001',nome:'Ana'};
        await page.addInitScript(child => {
            if (!localStorage.getItem('teko_session')) localStorage.setItem('teko_session', JSON.stringify({crianca:child}));
        }, child);
        let recommendations = [], fail = false;
        await page.route('**/children',route=>route.fulfill({json:{children:[child]}}));
        await page.route('**/api/recommendations/*',route=>route.fulfill({status:fail?503:200,json:fail?{error:'Falha'}:{recommendations}}));
        const url = `http://127.0.0.1:${server.address().port}`;
        await page.goto(url+'/pages/home.html');
        await page.waitForFunction(()=>document.querySelector('#home-recommendations').getAttribute('aria-busy')==='false');
        assert.equal(await page.locator('.recommendation-item').count(),0);
        assert.equal(await page.locator('#recommendations-empty').isVisible(),true);
        assert.equal(await page.locator('#recommendations-notification').isVisible(),false);
        await page.screenshot({path:path.join(os.tmpdir(),'teko-home-empty.png'),fullPage:true});
        recommendations = [
            {id:'a',title:'Respire com o Teko',url:'/atividades/respire-com-teko'},
            {id:'b',title:'Monte a Frase',url:'/atividades/monte-frase'},
            {id:'c',title:'Como Ele Pode Estar?',url:'/atividades/como-ele-pode-estar'}
        ];
        await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(()=>document.querySelectorAll('.recommendation-item').length===3);
        assert.equal(await page.locator('#recommendations-count').textContent(),'3/3');
        assert.equal(await page.locator('#recommendations-notification').isVisible(),true);
        await page.screenshot({path:path.join(os.tmpdir(),'teko-home-recommendations-desktop.png'),fullPage:true});
        await page.setViewportSize({width:390,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        await page.screenshot({path:path.join(os.tmpdir(),'teko-home-recommendations-mobile.png'),fullPage:true});
        recommendations.shift();
        await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
        await page.waitForFunction(()=>document.querySelectorAll('.recommendation-item').length===2);
        assert.equal(await page.locator('#recommendations-count').textContent(),'2/3');
        fail = true;
        await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(()=>!document.querySelector('#recommendations-retry').hidden);
        assert.equal(await page.locator('.recommendation-item').count(),0);
        fail = false;recommendations = [];
        await page.locator('#recommendations-retry').click();
        await page.waitForFunction(()=>!document.querySelector('#recommendations-empty').hidden);
        await page.route('**/api/ai/chat',route=>route.fulfill({json:{response:'Entendo. Quer me contar mais?',recommendationAdded:true}}));
        await page.goto(url+'/pages/tekoia.html');
        await page.locator('#chat-input').fill('quero uma atividade calma');
        await page.locator('#send-btn').click();
        await page.waitForFunction(()=>document.querySelector('#chat-input').value==='');
        assert.equal(await page.locator('#chat-activity').count(),0);
        assert.ok(await page.evaluate(()=>localStorage.getItem('teko_recommendations_changed')));
        assert.deepEqual(errors,[]);
        console.log('PASS: Home vazia, 3 cartões, atualização após conclusão, erro/retry, desktop/celular e chat sem botão de sugestão.');
    } catch (error) { console.error(error); process.exitCode=1; }
    finally { if(browser)await browser.close();server.close(); }
});
