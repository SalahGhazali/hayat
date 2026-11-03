import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',timezoneId:'Asia/Jerusalem'});
// Keep the pre-existing scenarios outside the seed donor's new waiting period.
await context.addInitScript(()=>{const NativeDate=Date,fixed=NativeDate.parse('2026-11-23T10:00:00Z');globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return fixed}}});
const page=await context.newPage(),errors=[],checks=[];
context.on('page',p=>p.on('pageerror',err=>errors.push(err.message)));
page.on('pageerror',err=>errors.push(err.message));
context.on('response',r=>{if(r.url().startsWith('http://localhost:8000/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const base='http://localhost:8000/';
const go=(path,p=page)=>p.goto(base+path);
const fill=async(values,p=page)=>{for(const [name,value]of Object.entries(values))await p.locator(`[name="${name}"]`).fill(value)};
async function login(email,p=page,password='Demo12345!'){
 await go('login.html',p);await fill({identifier:email,password},p);await p.locator('#login-form [type="submit"]').click();
 await p.waitForURL(/\/(donor|bank|admin)\/dashboard.html$/);await p.locator('#view-content').waitFor();
}
async function confirm(p=page){await p.locator('.swal2-popup [data-confirm]').click();await p.locator('.swal2-popup').waitFor({state:'hidden'})}
async function reason(text){await page.fill('#reason',text);await page.locator('#reason-form [type="submit"]').click();await page.locator('.modal.show').waitFor({state:'hidden'})}
async function csv(selector){const pending=page.waitForEvent('download');await page.click(selector);const download=await pending,stream=await download.createReadStream();let result='';for await(const chunk of stream)result+=chunk.toString('utf8');return result}
const report=()=>writeFile('test-results/completion.json',JSON.stringify({checks,errors},null,2));
const check=text=>{checks.push(text);console.log(text)};

try{
 await login('admin@hayat.demo');await go('admin/blood-banks.html');await page.setViewportSize({width:320,height:640});await page.locator('[data-edit-bank="bank-demo-1"]').click();
 await expect(page.locator('.modal.show')).toBeVisible();await page.locator('#bank-edit-form [type="submit"]').scrollIntoViewIfNeeded();assert.ok((await page.locator('#bank-edit-form [type="submit"]').boundingBox()).y<640);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
 await page.screenshot({path:'test-results/completed-bank-settings-mobile.png',fullPage:true});
 await page.fill('#edit-bankName','بنك حياة النموذجي بعد المراجعة');await page.fill('#edit-contact','coordination@synthetic.demo');await page.selectOption('#edit-city','غزة');await page.selectOption('#edit-area','الرمال');await page.fill('#edit-reason','تحديث بيانات المؤسسة في مراجعة الإكمال');
 await page.locator('#bank-edit-form [type="submit"]').click();await page.locator('.modal.show').waitFor({state:'hidden'});await expect(page.locator('#table-main')).toContainText('coordination@synthetic.demo');
 await page.setViewportSize({width:1440,height:1000});check('Admin edits institution settings in a mobile-safe modal with a reason while keeping representative login and institution records');
 await go('admin/requests.html');
 await page.locator('a[href*="request-details.html"]').first().click();await page.waitForURL('**/admin/request-details.html?id=*');
 await expect(page.locator('#page-title')).toHaveText('تفاصيل طلب الدم');
 await expect(page.locator('[data-close="fulfilled"]')).toHaveCount(0);
 await expect(page.locator('a[href*="bank/record-donation"]')).toHaveCount(0);
 check('Admin request details opens from its real link and preserves role actions');

 await login('staff@hayat.demo');await go('bank/create-request.html');await page.selectOption('#bloodType','O+');await page.fill('#units','1');await page.locator('#request-form [type="submit"]').click();await page.waitForURL('**/bank/request-details.html?id=*');
 const requestId=new URL(page.url()).searchParams.get('id');
 await expect(page.locator('[data-close="fulfilled"]')).toHaveCount(0);
 await page.locator('a[href*="donors.html?request="]').click();await expect(page.locator('#table-main')).toContainText('أحمد محمد');
 await expect(page.locator('#table-main tbody tr')).toHaveCount(2);
 await page.locator('a[href*="record-donation.html?donor=demo-donor&"]').click();
 await expect(page.locator('#donorId')).toHaveValue('demo-donor');await expect(page.locator('#requestId')).toHaveValue(requestId);
 check('Request candidates are reachable and recording preselects the donor and same-bank request');

 const donor=await context.newPage();await login('ahmad@hayat.demo',donor);await go('donor/request-details.html?id='+encodeURIComponent(requestId),donor);
 await donor.locator('[data-respond="declined"]').click();await confirm(donor);
 assert.equal(await donor.evaluate(()=>HayatData.points('demo-donor')),15);
 await go('bank/request-details.html?id='+encodeURIComponent(requestId));await expect(page.locator('#table-main')).toContainText('اعتذر');
 await donor.locator('[data-respond="accepted"]').click();await confirm(donor);
 await go('bank/request-details.html?id='+encodeURIComponent(requestId));await expect(page.locator('#table-main')).toContainText('مقبول');await expect(page.locator('[data-close="fulfilled"]')).toHaveCount(0);
 await page.locator('a[href*="record-donation.html?request="]').click();await page.selectOption('#donorId','demo-donor');await page.fill('#reference','COMPLETION-LINKED');await page.check('[name="completed"]');await page.locator('#donation-form [type="submit"]').click();await confirm();await page.waitForURL('**/bank/reports.html');
 await expect(page.locator('#table-bank-points')).toContainText('COMPLETION-LINKED');
 await expect(donor.locator('#view-content')).toContainText('1');
 assert.equal(await donor.evaluate(()=>HayatData.points('demo-donor')),20);
 await page.reload();await expect(page.locator('.toast')).toHaveCount(0);
 check('Decline/accept awards zero; separate same-origin role tabs see donation and +5; success toast does not replay');

 await page.selectOption('#status-filter','confirmed');await expect(page.locator('#table-bank-points')).toContainText('COMPLETION-LINKED');
 const pointsCSV=await csv('[data-table="table-bank-points"]');assert.match(pointsCSV,/COMPLETION-LINKED/);assert.match(pointsCSV,/الحركة/);assert.doesNotMatch(pointsCSV,/SYNTH-2/);
 await page.fill('#table-search','COMPLETION-LINKED');await expect(page.locator('#table-main tbody tr')).toHaveCount(1);await expect(page.locator('#table-bank-points tbody tr')).toHaveCount(1);
 await page.screenshot({path:'test-results/completed-bank-report-desktop.png',fullPage:true});
 check('Bank points ledger stays scoped, filters by reference, exports the intended table and survives donation-status filters');

 await go('bank/request-details.html?id='+encodeURIComponent(requestId));await expect(page.locator('[data-close="fulfilled"]')).toHaveCount(0);
 await expect(page.locator('#view-content')).toContainText('مستوفى');await expect(donor.locator('[data-respond]')).toHaveCount(0);await expect(donor.locator('#view-content')).toContainText('أُغلقت تلقائيًا');
 await page.locator('a[href*="reports.html?request="]').click();await expect(page.locator('#table-main tbody tr')).toHaveCount(1);await expect(page.locator('#table-main')).toContainText('COMPLETION-LINKED');
 await expect(page.locator('[data-correct]')).toHaveCount(0);const donationId=await page.evaluate(()=>HayatData.read().donations.find(d=>d.reference==='COMPLETION-LINKED').id);await login('admin@hayat.demo');await go('admin/donations.html');await page.locator(`[data-correct="${donationId}"]`).click();await reason('تصحيح تجريبي بعد إغلاق الطلب');await login('staff@hayat.demo');await go('bank/reports.html?request='+encodeURIComponent(requestId));
 await expect(page.locator('#table-bank-points')).toContainText('-5');assert.equal(await donor.evaluate(()=>HayatData.points('demo-donor')),15);
 await go('bank/record-donation.html?request='+encodeURIComponent(requestId));await expect(page.locator('#view-content')).toContainText('الطلب غير متاح للتوثيق');await expect(page.locator('#donation-form')).toHaveCount(0);
 check('The last confirmed unit automatically closes the campaign; closed donor actions disappear; filtered request history preserves auditable correction');

 await login('bank2@hayat.demo');await go('bank/reports.html');await expect(page.locator('#table-main')).toContainText('SYNTH-2');await expect(page.locator('#view-content')).not.toContainText('COMPLETION-LINKED');
 await go('bank/donors.html?request='+encodeURIComponent(requestId));await expect(page.locator('#view-content')).toContainText('الطلب غير متاح');await expect(page.locator('a[href*="record-donation.html?donor="]')).toHaveCount(0);
 check('Second institution cannot view first-bank report entries or use a candidate URL outside its scope');
 await donor.close();

 // Create real mock operations to check that audit entries beyond the previous 25-row cutoff are reachable.
 await login('ahmad@hayat.demo');await page.evaluate(()=>{for(let n=0;n<29;n++)HayatData.respond('REQ-DEMO-001',n%2?'accepted':'declined')});
 await login('admin@hayat.demo');await go('admin/settings-audit.html');
 await expect(page.locator('#table-audit tbody tr')).toHaveCount(8);const firstMain=await page.locator('#table-main').innerText();const firstAudit=await page.locator('#table-audit').innerText();
 await page.locator('[data-page-key="audit"][data-page="2"]').click();assert.equal(await page.locator('#table-main').innerText(),firstMain);
 await page.locator('[data-page-key="audit"][data-page="3"]').click();await page.locator('[data-page-key="audit"][data-page="4"]').click();assert.notEqual(await page.locator('#table-audit').innerText(),firstAudit);
 await page.fill('#table-search','تصحيح تجريبي بعد إغلاق الطلب');await expect(page.locator('#table-audit tbody tr')).toHaveCount(1);await expect(page.locator('#table-main')).toContainText('تصحيح تجريبي بعد إغلاق الطلب');
 const auditCSV=await csv('[data-table="table-audit"]');assert.match(auditCSV,/تصحيح تجريبي بعد إغلاق الطلب/);assert.match(auditCSV,/السجل المرتبط/);
 await page.selectOption('#bank-filter','bank-demo-2');await expect(page.locator('#table-audit')).toHaveCount(0);await page.selectOption('#bank-filter','bank-demo-1');await expect(page.locator('#table-audit')).toContainText('تصحيح توثيق');
 await page.screenshot({path:'test-results/completed-admin-audit-desktop.png',fullPage:true});
 check('Audit paginates beyond 25 operations independently, searches old reasons, filters by institution and exports actual audit rows');

 await go('register.html');await fill({fullName:'متبرع إكمال وهمي',email:'completion@synthetic.demo',phone:'٠٥٩٧٠٠٠٠٩٩',password:'Test12345!',confirmPassword:'Test12345!',city:'غزة',area:'الرمال'});await page.selectOption('#bloodType','unknown');await page.check('[name="consent"]');
 await page.fill('#lastDonation',await page.evaluate(()=>Hayat.today()));await page.locator('#register-form [type="submit"]').click();await page.waitForURL('**/verify.html');await page.click('#toggle-inbox');const code=await page.locator('#mock-code').innerText();
 // Simulate an administrative suspension after the verification form was opened.
 await page.evaluate(()=>{const id=Hayat.storage.sessionGet('pending_verify_id'),u=Hayat.allUsers().find(u=>u.id===id);Hayat.saveUser({...u,status:'suspended'})});await page.fill('#code',code);await page.locator('#verify-form [type="submit"]').click();await expect(page.locator('#form-alert')).toContainText('تغيرت حالة الحساب');
 await page.evaluate(()=>{const id=Hayat.storage.sessionGet('pending_verify_id'),u=Hayat.allUsers().find(u=>u.id===id);Hayat.saveUser({...u,status:'pending_verification'})});
 await page.fill('#code',code.replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]));await page.locator('#verify-form [type="submit"]').click();await page.waitForURL('**/status.html?type=verified');
 check('Registration accepts Arabic phone digits and today’s date; stale verification cannot reactivate a suspended account; Arabic OTP works');

 const freshDonorId=await page.evaluate(()=>Hayat.currentUser().id);
 await login('staff@hayat.demo');await go('bank/record-donation.html');await page.selectOption('#donorId',freshDonorId);await page.locator('[data-record-blood-type]').click();await page.selectOption('#exam-blood-type','O+');await page.fill('#exam-reference','COMPLETION-BLOOD-RESULT');await page.check('#exam-confirmed');await page.locator('#blood-type-form [type="submit"]').click();await page.locator('#blood-type-form').waitFor({state:'detached'});await page.selectOption('#requestId','');await page.fill('#reference','PUBLIC-NEW-DONOR-WALKIN');await page.check('[name="completed"]');await page.locator('#donation-form [type="submit"]').click();await confirm();await page.waitForURL('**/bank/reports.html');
 assert.equal(await page.evaluate(id=>HayatData.points(id),freshDonorId),5);await login('completion@synthetic.demo',page,'Test12345!');await go('donor/history.html');await expect(page.locator('#table-main')).toContainText('PUBLIC-NEW-DONOR-WALKIN');await expect(page.locator('#table-main tbody tr')).toHaveCount(1);
 check('A newly registered public donor is found by staff, receives a direct donation without a request, and sees +5 and confirmed history');

 await go('forgot-password.html');await page.fill('#email','completion@synthetic.demo');await page.locator('#forgot-form [type="submit"]').click();await page.click('#mock-reset-link');await page.waitForURL('**/reset-password.html?token=*');await page.waitForFunction(()=>window.Hayat);
 await page.evaluate(()=>{const token=new URLSearchParams(location.search).get('token'),data=Hayat.storage.sessionGet('reset_'+token);data.expiresAt=Date.now()-1;Hayat.storage.sessionSet('reset_'+token,data)});
 await fill({password:'Changed12345!',confirmPassword:'Changed12345!'});await page.locator('#reset-form [type="submit"]').click();await expect(page.locator('#form-alert')).toContainText('انتهت صلاحيته');
 await go('forgot-password.html');await page.fill('#email','completion@synthetic.demo');await page.locator('#forgot-form [type="submit"]').click();await page.click('#mock-reset-link');await page.waitForURL('**/reset-password.html?token=*');await page.waitForFunction(()=>window.Hayat);
 await page.evaluate(()=>{const token=new URLSearchParams(location.search).get('token'),data=Hayat.storage.sessionGet('reset_'+token);data.used=true;Hayat.storage.sessionSet('reset_'+token,data)});
 await fill({password:'Changed12345!',confirmPassword:'Changed12345!'});await page.locator('#reset-form [type="submit"]').click();await expect(page.locator('#form-alert')).toContainText('غير صالح');
 check('A reset link that expires or is consumed while its form stays open is rejected on submit');

 await login('staff@hayat.demo');await go('bank/reports.html');
 for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)')}
 await page.setViewportSize({width:320,height:900});await page.screenshot({path:'test-results/completed-bank-report-mobile.png',fullPage:true});
 check('Completed institution reports fit all six widths and keep a white background with OS dark mode');
 assert.deepEqual(errors,[]);await report();
}catch(error){await page.screenshot({path:'test-results/completion-failure.png',fullPage:true});await writeFile('test-results/completion-failure.json',JSON.stringify({checks,errors,url:page.url(),failure:error.message},null,2));throw error}
finally{await browser.close()}
