import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',timezoneId:'Asia/Jerusalem'});
// Keep the pre-existing scenarios outside the seed donor's new waiting period.
await context.addInitScript(()=>{const NativeDate=Date,fixed=NativeDate.parse('2026-11-23T10:00:00Z');globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return fixed}}});
const checks=[],errors=[],base='http://localhost:8000/';
context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
context.on('response',response=>{
 if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
});
const bank=await context.newPage(),donor=await context.newPage();
const go=async(page,path)=>{
 await page.goto(base+path);
 await page.locator('#view-content').waitFor();
};
async function login(page,email){
 await page.goto(base+'login.html');
 await page.fill('[name="identifier"]',email);
 await page.fill('[name="password"]','Demo12345!');
 await page.locator('#login-form [type="submit"]').click();
 await page.waitForURL(/\/(donor|bank|admin)\/dashboard.html$/);
 await page.locator('#view-content').waitFor();
}
async function confirm(page){
 await page.locator('.swal2-popup [data-confirm]').click();
 await page.locator('.swal2-popup').waitFor({state:'hidden'});
}
async function reason(page,text){
 await page.fill('#reason',text);
 await page.locator('#reason-form [type="submit"]').click();
 await page.locator('.modal.show').waitFor({state:'hidden'});
}
async function createRequest(label){
 await go(bank,'bank/create-request.html');
 await bank.selectOption('#bloodType','O+');
 await bank.fill('#units','1');
 await bank.fill('[name="notes"]',label);
 await bank.locator('#request-form [type="submit"]').click();
 await bank.waitForURL('**/bank/request-details.html?id=*');
 await bank.locator('#view-content').waitFor();
 return new URL(bank.url()).searchParams.get('id');
}
const requestLink=(page,id)=>page.locator(`#view-content a[href*="request-details.html?id=${encodeURIComponent(id)}"]`);
const activeId=()=>donor.evaluate(()=>HayatData.activeCommitment('demo-donor')?.requestId||null);
const totals=()=>donor.evaluate(()=>({points:HayatData.points('demo-donor'),donations:HayatData.read().donations.length}));
const check=text=>{checks.push(text);console.log(text)};
async function layouts(page,label){
 for(const width of [320,1440]){
  await page.setViewportSize({width,height:1000});
  const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,background:getComputedStyle(document.body).backgroundColor}));
  assert.ok(layout.width<=width+1,`${label}: page overflows at ${width}px (${layout.width}px)`);
  assert.equal(layout.background,'rgb(255, 255, 255)',`${label}: keeps a white background with OS dark mode`);
  await page.screenshot({path:`test-results/commitment-${label}-${width}.png`,fullPage:true});
 }
}

try{
 await login(bank,'staff@hayat.demo');
 const requestA=await createRequest('طلب أ لاختبار تنسيق متبرع واحد');
 const requestB=await createRequest('طلب ب لاختبار إخفاء الطلبات الأخرى');
 await go(bank,'bank/request-details.html?id='+encodeURIComponent(requestA));
 await login(donor,'ahmad@hayat.demo');
 const before=await totals();
 await go(donor,'donor/request-details.html?id='+encodeURIComponent(requestA));
 await donor.locator('[data-respond="accepted"]').click();
 await confirm(donor);
 await expect.poll(activeId).toBe(requestA);
 await expect(donor.locator('[data-withdraw][data-id="'+requestA+'"]')).toBeVisible();
 await expect(donor.locator('[data-respond="accepted"], [data-respond="declined"]')).toHaveCount(0);
 await expect(bank.locator('#table-main')).toContainText('أحمد محمد');
 await expect(bank.locator('#table-main')).toContainText('بانتظار التنسيق');
 assert.equal(await bank.evaluate(id=>HayatData.read().requests.find(request=>request.id===id).status,requestA),'active');
 assert.deepEqual(await totals(),before);
 check('Accepting A creates one donor commitment, changes the institution response immediately, keeps the general request active and awards no points');

 const duplicate=await donor.evaluate(id=>{
  const auditBefore=HayatData.read().audit_logs.length;
  HayatData.respond(id,'accepted');
  HayatData.respond(id,'accepted');
  const state=HayatData.read();
  return {auditBefore,auditAfter:state.audit_logs.length,responses:state.donor_responses.filter(response=>response.requestId===id&&response.donorId==='demo-donor').length};
 },requestA);
 assert.equal(duplicate.responses,1);
 assert.equal(duplicate.auditAfter,duplicate.auditBefore);
 const blocked=await donor.evaluate(id=>{
  try{HayatData.respond(id,'accepted');return false}catch{return true}
 },requestB);
 assert.equal(blocked,true,'The repository rejects a second simultaneous acceptance');
 await donor.reload();
 await donor.locator('#view-content').waitFor();
 assert.equal(await activeId(),requestA);
 check('Repeated acceptance is idempotent, a second request is rejected by the repository, and the commitment survives reload');

 await go(donor,'donor/dashboard.html');
 await expect(requestLink(donor,requestA).first()).toBeVisible();
 await expect(requestLink(donor,requestB)).toHaveCount(0);
 await layouts(donor,'accepted-dashboard');
 await go(donor,'donor/notifications.html');
 await expect(requestLink(donor,requestA).first()).toBeVisible();
 await expect(requestLink(donor,requestB)).toHaveCount(0);
 await layouts(donor,'accepted-notifications');
 await go(donor,'donor/request-details.html?id='+encodeURIComponent(requestB));
 await expect(donor.locator('[data-respond="accepted"]')).toHaveCount(0);
 await expect(requestLink(donor,requestA).first()).toBeVisible();
 await layouts(donor,'locked-request');
 assert.deepEqual(await totals(),before);
 check('Other request cards and notifications stay hidden during coordination; a direct request URL provides a link back to A without an acceptance action at 320px and 1440px');

 await go(donor,'donor/request-details.html?id='+encodeURIComponent(requestA));
 await donor.locator('[data-withdraw][data-id="'+requestA+'"]').click();
 await confirm(donor);
 await expect.poll(activeId).toBe(null);
 await go(donor,'donor/dashboard.html');
 await expect(requestLink(donor,requestB).first()).toBeVisible();
 await go(donor,'donor/notifications.html');
 await expect(requestLink(donor,requestB).first()).toBeVisible();
 assert.deepEqual(await totals(),before);
 check('Explicit withdrawal releases the commitment and restores other request cards and notifications without changing donations or points');

 await go(donor,'donor/request-details.html?id='+encodeURIComponent(requestB));
 await donor.locator('[data-respond="accepted"]').click();
 await confirm(donor);
 await expect.poll(activeId).toBe(requestB);
 await go(bank,'bank/request-details.html?id='+encodeURIComponent(requestB));
 await bank.locator('[data-close="cancelled"]').click();
 await reason(bank,'إلغاء تجريبي لإنهاء تنسيق المتبرع في هذا الطلب');
 await expect.poll(activeId).toBe(null);
 await expect(donor.locator('[data-withdraw]')).toHaveCount(0);
 await expect(donor.locator('#view-content')).toContainText('إلغاء تجريبي لإنهاء تنسيق المتبرع');
 await go(donor,'donor/dashboard.html');
 await expect(requestLink(donor,requestA).first()).toBeVisible();
 assert.deepEqual(await totals(),before);
 check('Institution cancellation releases the donor across same-origin tabs and restores the remaining active request with no donation or point change');

 await go(donor,'donor/request-details.html?id='+encodeURIComponent(requestA));
 await donor.locator('[data-respond="accepted"]').click();
 await confirm(donor);
 await expect.poll(activeId).toBe(requestA);
 await go(bank,'bank/record-donation.html?donor=demo-donor&request='+encodeURIComponent(requestA));
 await expect(bank.locator('#donorId')).toHaveValue('demo-donor');
 await expect(bank.locator('#requestId')).toHaveValue(requestA);
 await bank.fill('#reference','COMMITMENT-LINKED');
 await bank.check('[name="completed"]');
 await bank.locator('#donation-form [type="submit"]').click();
 await confirm(bank);
 await bank.waitForURL('**/bank/reports.html');
 await expect.poll(activeId).toBe(null);
 assert.deepEqual(await totals(),{points:before.points+5,donations:before.donations+1});
 const donationId=await bank.evaluate(()=>HayatData.read().donations.find(donation=>donation.reference==='COMMITMENT-LINKED').id);
 await expect(bank.locator('[data-correct]')).toHaveCount(0);await login(bank,'admin@hayat.demo');await go(bank,'admin/donations.html');await bank.locator('[data-correct="'+donationId+'"]').click();
 await reason(bank,'تصحيح تجريبي بعد انتهاء تنسيق طلب التبرع');
 await expect.poll(async()=>(await totals()).points).toBe(before.points);
 assert.equal(await activeId(),null);
 await donor.reload();
 await donor.locator('#view-content').waitFor();
 assert.equal(await activeId(),null);
 check('An actual linked donation ends the commitment and awards +5 once; an auditable correction reverses the points without reviving the commitment');

 assert.deepEqual(errors,[]);
 await writeFile('test-results/commitment.json',JSON.stringify({checks,errors},null,2));
}catch(error){
 for(const [name,page]of [['donor',donor],['bank',bank]]){
  await page.screenshot({path:`test-results/commitment-failure-${name}.png`,fullPage:true}).catch(()=>{});
 }
 await writeFile('test-results/commitment-failure.json',JSON.stringify({checks,errors,donorUrl:donor.url(),bankUrl:bank.url(),failure:error.message},null,2));
 throw error;
}finally{
 await browser.close();
}
