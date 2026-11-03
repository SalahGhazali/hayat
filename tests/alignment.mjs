import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('test-results',{recursive:true});
const base='http://localhost:8000/',checks=[],errors=[],externalRequests=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',timezoneId:'Asia/Jerusalem'});
await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base)||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();externalRequests.push(url);return route.abort()});
context.on('page',p=>p.on('pageerror',error=>errors.push(error.message)));
context.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const page=await context.newPage();
const go=(path,p=page)=>p.goto(base+path);
const fill=async(values,p=page)=>{for(const[name,value]of Object.entries(values))await p.locator(`[name="${name}"]`).fill(value)};
const check=(text,evidence={})=>{checks.push({text,evidence});console.log(text)};
async function login(email,p=page,password='Demo12345!'){
 await go('login.html',p);await fill({identifier:email,password},p);await p.locator('#login-form [type="submit"]').click();await p.waitForURL(/\/(donor|bank|admin)\/dashboard.html$/);await p.locator('#view-content').waitFor();
}
async function confirm(p=page){await expect(p.locator('.swal2-popup')).toBeVisible();await p.locator('.swal2-popup [data-confirm]').click();await p.locator('.swal2-popup').waitFor({state:'hidden'})}
async function reason(text,p=page){await p.fill('#reason',text);await p.locator('#reason-form [type="submit"]').click();await p.locator('.modal.show').waitFor({state:'hidden'})}
async function counters(p=page){
 await p.waitForFunction(()=>[...document.querySelectorAll('[data-count]')].length>0&&[...document.querySelectorAll('[data-count]')].every(el=>el.dataset.countFinal!==undefined));
 const expected=await p.locator('[data-count]').evaluateAll(els=>els.map(el=>({key:el.dataset.counterKey,final:Number(el.dataset.countFinal)})));
 await expect.poll(()=>p.locator('[data-count]').evaluateAll(els=>els.map(el=>Number(el.textContent.trim().replace(/,/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)))))).toEqual(expected.map(item=>item.final));
 return expected;
}
async function charts(p=page){
 await p.waitForFunction(()=>window.Chart&&document.querySelectorAll('canvas[data-chart]').length&&[...document.querySelectorAll('canvas[data-chart]')].every(el=>Chart.getChart(el)));
 return p.locator('canvas[data-chart]').evaluateAll(els=>els.map(el=>{
  const chart=Chart.getChart(el),source=JSON.parse(el.dataset.chart),card=el.closest('.card');
  return {title:el.getAttribute('aria-label')||card?.querySelector('.card-title')?.textContent||'',source,actual:{labels:[...chart.data.labels],datasets:chart.data.datasets.map(d=>({label:d.label,data:[...d.data]}))},rtl:chart.options.plugins.legend.rtl&&chart.options.plugins.tooltip.rtl,fallback:!!card?.querySelector('table'),animation:chart.options.animation===false?false:chart.options.animation.duration,ticks:chart.scales.x.ticks.map(tick=>tick.label),bloodTooltip:chart.options.plugins.tooltip.callbacks.title([{label:'O+'}])[0]};
 }));
}
function verifyCharts(rows){
 assert.ok(rows.length>0);for(const row of rows){assert.match(row.title,/[\u0600-\u06ff]/);assert.equal(row.rtl,true);assert.equal(row.fallback,true,`${row.title} needs a table fallback`);assert.deepEqual(row.actual.labels,row.source.labels);assert.deepEqual(row.actual.datasets.map(d=>d.data),row.source.datasets.map(d=>d.data));for(const d of row.actual.datasets)assert.match(d.label,/[\u0600-\u06ff]/);if(row.source.labels.includes('O+')){assert.equal(row.bloodTooltip,'\u2066O+\u2069');assert.ok(row.ticks.some(tick=>/^\u2066(?:O|AB|A|B)[+-]\u2069$/.test(String(tick))))}}
}
function seriesTotal(charts,label){const datasets=charts.flatMap(chart=>chart.actual.datasets).filter(dataset=>dataset.label===label);assert.equal(datasets.length,1,`Expected exactly one ${label} series`);return datasets[0].data.reduce((sum,value)=>sum+Number(value),0)}
async function widths(path,p=page){
 const evidence=[];await go(path,p);for(const width of [320,375,390,768,1024,1440]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(650);const result=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,dir:document.documentElement.dir,background:getComputedStyle(document.body).backgroundColor}));assert.ok(result.scroll<=width+1,`${path} overflows at ${width}`);assert.equal(result.dir,'rtl');assert.equal(result.background,'rgb(255, 255, 255)');evidence.push(result)}return evidence;
}

try{
 await go('index.html');await counters();
 const libraries=await page.evaluate(()=>({aos:typeof AOS?.init,countup:typeof countUp?.CountUp,chart:typeof Chart,swal:typeof Swal?.fire,sources:[...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(el=>el.src||el.href)}));
 assert.equal(libraries.aos,'function');assert.equal(libraries.countup,'function');assert.equal(libraries.chart,'function');assert.equal(libraries.swal,'function');assert.ok(libraries.sources.every(src=>src.startsWith(locationOrigin(base))));
 await expect(page.locator('body')).toContainText('بيانات تجريبية');
 const aos=await page.locator('[data-aos]').evaluateAll(els=>els.map(el=>({effect:el.dataset.aos,visible:getComputedStyle(el).visibility!=='hidden',opacity:getComputedStyle(el).opacity})));
 assert.ok(aos.length>0);assert.ok(aos.every(item=>['fade-up','fade','zoom-in'].includes(item.effect)));
 check('Pinned libraries run from local assets while every external network request is blocked',{libraries,aos});
 const layouts=[];for(const path of ['index.html','how-it-works.html','login.html','status.html?type=temporary-error']){layouts.push({path,viewports:await widths(path)});await expect(page.locator('body')).not.toContainText(/Lorem Ipsum/i);if(path.includes('temporary-error'))await expect(page.locator('#status-heading')).toContainText('مؤقتًا')}
 await page.screenshot({path:'test-results/alignment-status.png',fullPage:true});
 check('Public, auth and temporary-error screens keep RTL, white pages and no horizontal overflow after motion initializes at all six widths',{layouts});

 await page.emulateMedia({reducedMotion:'reduce'});await go('index.html');const reducedCounters=await counters();
 const reducedAOS=await page.locator('[data-aos]').evaluateAll(els=>els.map(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform})));
 assert.ok(reducedAOS.every(item=>Number(item.opacity)===1&&(item.transform==='none'||item.transform==='matrix(1, 0, 0, 1, 0, 0)')));
 check('Reduced motion shows final counter values and visible home content without reveal transforms',{reducedCounters,reducedAOS});
 await page.emulateMedia({reducedMotion:'no-preference'});
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900},colorScheme:'dark'}),staticPage=await noJS.newPage();
 for(const path of ['index.html','how-it-works.html']){await staticPage.goto(base+path);await expect(staticPage.locator('h1')).toBeVisible();const invisible=await staticPage.locator('[data-aos]').evaluateAll(els=>els.some(el=>getComputedStyle(el).visibility==='hidden'||Number(getComputedStyle(el).opacity)===0));assert.equal(invisible,false);assert.ok(await staticPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await expect(staticPage.locator('a[href$="register.html"]').first()).toBeVisible();if(path==='index.html'){const staticCounters=await staticPage.locator('[data-count]').allTextContents();assert.deepEqual(staticCounters.map(text=>Number(text.trim())),[8,2,3]);for(const counter of await staticPage.locator('[data-count]').all())await expect(counter).toBeVisible()}}
 await staticPage.screenshot({path:'test-results/alignment-home-nojs-320.png',fullPage:true});await noJS.close();
 check('Home and how-it-works retain readable content and registration links with JavaScript disabled at 320px');

 await login('ahmad@hayat.demo');const donorCounters=await counters();assert.ok(donorCounters.some(counter=>counter.final===15));
 await page.locator('[data-logout]').click();await expect(page.locator('.swal2-popup [data-confirm]')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('.swal2-popup')).toHaveCount(0);await expect(page.locator('[data-logout]')).toBeFocused();assert.equal(await page.evaluate(()=>Hayat.currentUser().id),'demo-donor');
 await page.locator('[data-logout]').click();await page.locator('.swal2-cancel').click();await expect(page.locator('.swal2-popup')).toHaveCount(0);await expect(page.locator('[data-logout]')).toBeFocused();
 check('Dashboard counters reach store totals and real SweetAlert2 supports Escape/cancel with focus restored and session retained',{donorCounters});

 await login('staff@hayat.demo');await go('bank/create-request.html');await fill({units:'3',notes:'طلب فحص التطابق'});await page.selectOption('#bloodType','AB-');await page.locator('#request-form [type="submit"]').click();await page.waitForURL('**/bank/request-details.html?id=*');const requestId=new URL(page.url()).searchParams.get('id');
 await page.locator('[data-edit-request]').click();await expect(page.locator('#request-edit-form')).toBeVisible();await page.fill('#edit-units','4');await page.selectOption('#edit-urgency','critical');await page.fill('#edit-notes','تعديل تنسيقي اختباري');await page.fill('#edit-request-reason','تحديث وحدات وأولوية الطلب للاختبار');await page.locator('#request-edit-form [type="submit"]').click();await page.locator('.modal.show').waitFor({state:'hidden'});
 const edited=await page.evaluate(id=>{const s=HayatData.read();return{request:s.requests.find(r=>r.id===id),audit:s.audit_logs.find(a=>a.subjectId===id&&a.action==='تعديل طلب دم')}},requestId);assert.equal(edited.request.units,4);assert.equal(edited.request.radius,15);assert.equal(edited.request.urgency,'critical');assert.match(edited.audit.details,/تحديث وحدات/);
 await go('bank/requests.html');await page.selectOption('#table-sort','oldest');const oldest=await page.locator('#table-main tbody').innerText();await page.selectOption('#table-sort','newest');const newest=await page.locator('#table-main tbody').innerText();assert.notEqual(oldest,newest);await expect(page.locator('#table-main tbody tr').first()).toContainText('AB-');
 check('Bank request editing updates validated fields and audit, and explicit oldest/newest sorting changes row order',{requestId,edited});

 await login('admin@hayat.demo');await go('admin/request-details.html?id='+encodeURIComponent(requestId));await expect(page.locator('[data-close="fulfilled"],[data-edit-request]')).toHaveCount(0);await expect(page.locator('[data-close="cancelled"]')).toBeVisible();
 const blocked=await page.evaluate(id=>{try{HayatData.closeRequest(id,'fulfilled','محاولة مدير لاختبار الحماية');return false}catch{return true}},requestId);assert.equal(blocked,true);await page.locator('[data-close="cancelled"]').click();await reason('إيقاف إداري موثق للاختبار');assert.equal(await page.evaluate(id=>HayatData.read().requests.find(r=>r.id===id).status,requestId),'cancelled');
 check('Admin can stop a request with a reason, cannot fulfil or edit it, and the store also rejects admin fulfilment');

 await login('representative@hayat.demo');await go('bank/staff.html');await fill({name:'موظف التفعيل الاختباري',email:'alignment-staff@synthetic.demo',phone:'0597000188',password:'Test12345!'});await page.locator('#staff-form [type="submit"]').click();await expect(page.locator('#table-main')).toContainText('موظف التفعيل الاختباري');const staffId=await page.evaluate(()=>Hayat.allUsers().find(u=>u.email==='alignment-staff@synthetic.demo').id);
 assert.equal(await page.evaluate(id=>Hayat.allUsers().find(u=>u.id===id).status,staffId),'pending_activation');const staff=await context.newPage();await go('login.html',staff);await fill({identifier:'alignment-staff@synthetic.demo',password:'Test12345!'},staff);await staff.locator('#login-form [type="submit"]').click();await staff.waitForURL('**/verify.html');await staff.locator('#toggle-inbox').click();const code=await staff.locator('#mock-code').innerText();
 await expect(page.locator(`[data-toggle-user="${staffId}"]`)).toHaveText('إيقاف');await page.locator(`[data-toggle-user="${staffId}"]`).click();await reason('إيقاف موظف أثناء فتح التفعيل');await staff.fill('#code',code);await staff.locator('#verify-form [type="submit"]').click();await expect(staff.locator('#form-alert')).toContainText('تغيرت حالة الحساب');assert.equal(await staff.evaluate(id=>Hayat.allUsers().find(u=>u.id===id).status,staffId),'suspended');
 await page.locator(`[data-toggle-user="${staffId}"]`).click();await reason('إعادة الموظف لاستكمال تحقق بريده');assert.equal(await page.evaluate(id=>Hayat.allUsers().find(u=>u.id===id).status,staffId),'pending_activation');await staff.fill('#code',code);await staff.locator('#verify-form [type="submit"]').click();await staff.waitForURL('**/status.html?type=verified');await staff.locator('#status-action').click();await staff.waitForURL('**/bank/dashboard.html');await expect(staff.locator('a[href$="staff.html"]')).toHaveCount(0);
 check('New staff remains pending until their own mock email verification; suspension blocks a stale activation form, restoration preserves pending state and activated staff has no staff management',{staffId});

 await go('bank/record-donation.html',staff);await staff.selectOption('#donorId','demo-donor-a-positive');await staff.fill('#reference','ALIGNMENT-DIRECT');await staff.check('[name="completed"]');await staff.locator('#donation-form [type="submit"]').click();await confirm(staff);await staff.waitForURL('**/bank/reports.html');await expect(staff.locator('[data-correct]')).toHaveCount(0);
 const donation=await staff.evaluate(()=>{const s=HayatData.read(),d=s.donations.find(d=>d.reference==='ALIGNMENT-DIRECT');return{donation:d,awards:s.point_transactions.filter(p=>p.donationId===d.id),notifications:s.notifications.filter(n=>n.donationId===d.id)}});assert.equal(donation.donation.status,'confirmed');assert.equal(donation.donation.bankId,'bank-demo-1');assert.equal(donation.awards.length,1);assert.equal(donation.awards[0].delta,5);assert.equal(donation.notifications.length,1);
 await login('a-positive@hayat.demo');await go('donor/notifications.html');await expect(page.locator('#view-content')).toContainText('تم توثيق تبرعك');await expect(page.locator('#view-content')).toContainText('+5');
 check('Confirming one direct donation atomically creates one +5 ledger transaction and one visible donor notification; bank has no correction control',donation);

 await go('bank/reports.html',staff);let bankCharts=await charts(staff);verifyCharts(bankCharts);const expectedBank=await staff.evaluate(()=>{const s=HayatData.read(),bankId=Hayat.currentUser().bankId;return{donations:s.donations.filter(d=>d.bankId===bankId&&d.status==='confirmed').length,requests:s.requests.filter(r=>r.bankId===bankId).length,points:s.point_transactions.filter(p=>p.bankId===bankId).reduce((sum,p)=>sum+p.delta,0)}});assert.equal(seriesTotal(bankCharts,'تبرعات مؤكدة'),expectedBank.donations);assert.equal(seriesTotal(bankCharts,'طلبات منشورة'),expectedBank.requests);assert.equal(seriesTotal(bankCharts,'نقاط صافية'),expectedBank.points);await staff.selectOption('#status-filter','corrected');const filteredCharts=await charts(staff);verifyCharts(filteredCharts);assert.equal(seriesTotal(filteredCharts,'تبرعات مؤكدة'),0);assert.notDeepEqual(bankCharts.map(row=>row.source),filteredCharts.map(row=>row.source));await staff.selectOption('#status-filter','confirmed');await staff.fill('#date-from','2099-01-01');await staff.locator('#date-from').dispatchEvent('change');const emptyCharts=await charts(staff);verifyCharts(emptyCharts);assert.ok(emptyCharts.every(row=>row.source.datasets.every(d=>d.data.every(value=>Number(value)===0))));
 await staff.emulateMedia({reducedMotion:'reduce'});await go('bank/reports.html',staff);const reducedCharts=await charts(staff);verifyCharts(reducedCharts);assert.ok(reducedCharts.every(row=>row.animation===false||row.animation===0));
 check('Real Chart.js renders Arabic RTL report charts with table fallbacks and store totals; status/date filters update series and reduced motion disables chart animation',{expectedBank,bankCharts,filteredCharts,emptyCharts,reducedCharts});
 await login('admin@hayat.demo');await go('admin/donations.html');await expect(page.locator('#table-main')).toContainText('ALIGNMENT-DIRECT');await go('admin/health-reports.html');const adminCharts=await charts();verifyCharts(adminCharts);await page.selectOption('#bank-filter','bank-demo-2');const scoped=await charts();verifyCharts(scoped);assert.notDeepEqual(adminCharts.map(row=>row.source),scoped.map(row=>row.source));assert.equal(seriesTotal(scoped,'تبرعات مؤكدة'),1);assert.equal(seriesTotal(scoped,'طلبات منشورة'),0);assert.equal(seriesTotal(scoped,'نقاط صافية'),5);await expect(page.locator('#table-main')).not.toContainText('بنك حياة النموذجي');const summary=page.locator('#table-main tbody tr');await expect(summary).toHaveCount(1);for(const[index,value]of [[2,'0'],[3,'1'],[4,'5']])await expect(summary.locator('td').nth(index)).toHaveText(value);
 check('Admin health charts and fallback tables share institution filters and omit other-bank totals',{adminCharts,scoped});
 const chartLayouts=await widths('bank/reports.html',staff);await staff.screenshot({path:'test-results/alignment-chart-report.png',fullPage:true});check('Chart reports fit all six viewports after Chart.js initialization',{chartLayouts});

 await login('ahmad@hayat.demo');await page.setViewportSize({width:320,height:900});await page.locator('.dashboard-sidebar .navbar-toggler').click();await expect(page.locator('#sidebar-menu')).toHaveClass(/show/);await expect(page.locator('.dashboard-sidebar .navbar-toggler')).toHaveAttribute('aria-expanded','true');
 const refreshedRequest=await staff.evaluate(()=>HayatData.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal',notes:'تحديث بين تبويبين أثناء فتح قائمة الجوال'}).id);
 await expect(page.locator('#view-content a[href*="'+refreshedRequest+'"]').first()).toBeVisible();await expect(page.locator('.offcanvas-backdrop')).toHaveCount(0);await expect(page.locator('#sidebar-menu')).not.toHaveClass(/show/);await expect(page.locator('.dashboard-sidebar .navbar-toggler')).toHaveAttribute('aria-expanded','false');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
 check('A cross-tab store update safely refreshes an open mobile drawer without leaving a backdrop, a locked body or a stale expanded state',{refreshedRequest});

 assert.deepEqual(externalRequests,[]);assert.deepEqual(errors,[]);await writeFile('test-results/alignment.json',JSON.stringify({checks,errors,externalRequests},null,2));
}catch(error){await page.screenshot({path:'test-results/alignment-failure.png',fullPage:true}).catch(()=>{});await writeFile('test-results/alignment-failure.json',JSON.stringify({checks,errors,externalRequests,url:page.url(),failure:error.message},null,2));throw error}finally{await browser.close()}
function locationOrigin(url){return new URL(url).origin+'/' }
