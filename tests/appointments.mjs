import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Jerusalem',colorScheme:'dark'});
const errors=[],checks=[],base='http://localhost:8000/';
await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
context.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.text().startsWith('Hayat demo data unavailable'))errors.push(message.text())})});
context.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
const bank=await context.newPage(),donor=await context.newPage();
for(const page of [bank,donor]){await page.clock.install({time:new Date('2026-11-03T10:00:00Z')})}
const go=async(page,path)=>{await page.goto(base+path);await page.locator('#view-content').waitFor()};
async function login(page,email){await page.goto(base+'login.html');await page.fill('[name="identifier"]',email);await page.fill('[name="password"]','Demo12345!');await page.locator('#login-form [type="submit"]').click();await page.waitForURL(/\/(donor|bank)\/dashboard.html$/);await page.locator('#view-content').waitFor()}
async function confirm(page){await page.locator('.swal2-popup [data-confirm]').click();await page.locator('.swal2-popup').waitFor({state:'hidden'})}
async function submitTime(page,time){await page.fill('#appointment-time',time);await page.locator('#appointment-form [type="submit"]').click();await page.locator('#appointment-form').waitFor({state:'detached'})}
async function layouts(page,label){for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label} overflow at ${width}`);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)');if(width===320||width===1440)await page.screenshot({path:`test-results/appointments-${label}-${width}.png`,fullPage:true})}}
const check=message=>{checks.push(message);console.log(message)};
try{
 await login(donor,'ahmad@hayat.demo');await expect(donor.locator('[data-cooldown-days]')).toHaveText('17');await go(donor,'donor/request-details.html?id=REQ-DEMO-001');await expect(donor.locator('[data-respond="accepted"]')).toHaveCount(0);
 check('Existing confirmed donations immediately produce the correct countdown and block acceptance');
 await login(donor,'a-positive@hayat.demo');await go(donor,'donor/request-details.html?id=REQ-DEMO-002');await donor.locator('[data-respond="accepted"]').click();await confirm(donor);
 await login(bank,'staff@hayat.demo');await go(bank,'bank/request-details.html?id=REQ-DEMO-002');await bank.locator('[data-edit-request]').click();await bank.fill('#edit-units','1');await bank.fill('#edit-request-reason','اختبار اكتمال الحملة بعد تبرع واحد');await bank.locator('#request-edit-form [type="submit"]').click();await bank.locator('#request-edit-form').waitFor({state:'detached'});await bank.locator('[data-schedule-appointment]').click();await expect(bank.locator('#appointment-form')).toBeVisible();await bank.setViewportSize({width:320,height:1000});assert.equal(await bank.evaluate(()=>document.documentElement.scrollWidth),320);await submitTime(bank,'2026-11-04T10:00');
 await expect(donor.locator('[data-accept-appointment]')).toBeVisible();await expect(donor.locator('[data-appointment]')).toContainText('بانتظار موافقة المتبرع');
 await go(donor,'donor/notifications.html');await expect(donor.locator('#view-content')).toContainText('موعد تبرع بانتظار موافقتك');await go(donor,'donor/request-details.html?id=REQ-DEMO-002');
 await donor.locator('[data-change-appointment]').click();await submitTime(donor,'2026-11-04T13:00');await expect(bank.locator('#table-main')).toContainText('الوقت الذي طلبه المتبرع');await layouts(bank,'change-request');
 await go(bank,'bank/dashboard.html');await bank.locator('[data-bank-notifications]').click();await expect(bank.locator('#view-content')).toContainText('طلب المتبرع تغيير الموعد');await go(bank,'bank/request-details.html?id=REQ-DEMO-002');
 await bank.locator('[data-schedule-appointment]').click();await expect(bank.locator('#appointment-time')).toHaveValue('2026-11-04T13:00');await bank.locator('#appointment-form [type="submit"]').click();await bank.locator('#appointment-form').waitFor({state:'detached'});
 await donor.locator('[data-accept-appointment]').click();await confirm(donor);await expect(bank.locator('#table-main')).toContainText('موعد مؤكد');await expect(bank.locator('[data-complete-response]')).toBeEnabled();
 assert.equal(await donor.evaluate(()=>HayatData.points(Hayat.currentUser().id)),0);assert.equal(await donor.evaluate(()=>HayatData.read().donations.filter(d=>d.donorId===Hayat.currentUser().id).length),0);
 await layouts(donor,'accepted');await donor.reload();await expect(donor.locator('[data-appointment]')).toContainText('موعد مؤكد');
 check('Bank scheduling, donor alternative time, bank review and donor acceptance persist and notify both sides without creating a donation or points');
 assert.ok(await bank.evaluate(()=>Date.parse(HayatData.read().donor_responses.find(r=>r.requestId==='REQ-DEMO-002'&&r.donorId==='demo-donor-a-positive').appointment.scheduledAt)>Date.now()));
 await expect(bank.locator('[data-complete-response]')).toBeEnabled();await bank.locator('[data-complete-response]').click();await confirm(bank);await expect(bank.locator('#table-main')).toContainText('تم التبرع');
 await expect(bank.locator('#view-content')).toContainText('مستوفى');await expect(bank.locator('#view-content')).toContainText('أُغلقت تلقائيًا');await expect(bank.locator('[data-complete-response], [data-schedule-appointment]')).toHaveCount(0);assert.equal(await bank.evaluate(()=>HayatData.read().requests.find(r=>r.id==='REQ-DEMO-002').status),'fulfilled');
 await expect(donor.locator('[data-donation-cooldown]')).toBeVisible();const days=Number(await donor.locator('[data-cooldown-days]').textContent());assert.equal(days,92);
 assert.equal(await donor.evaluate(()=>HayatData.points(Hayat.currentUser().id)),5);await go(donor,'donor/history.html');await expect(donor.locator('#table-main')).toContainText('APPT-');await expect(donor.locator('#table-main')).toContainText('مؤكد');
 await go(donor,'donor/dashboard.html');await layouts(donor,'cooldown');await donor.clock.fastForward(24*60*60*1000);await expect(donor.locator('[data-cooldown-days]')).toHaveText(String(days-1));await donor.reload();await expect(donor.locator('[data-cooldown-days]')).toHaveText(String(days-1));
 check('Completion before the appointment automatically closes the fulfilled campaign, updates donor history and +5 once, starts the three-month wait from the actual donation day and decreases the countdown on the next day');
 await go(donor,'donor/request-details.html?id=REQ-DEMO-002');await expect(donor.locator('[data-respond="accepted"]')).toHaveCount(0);await expect(donor.locator('[data-donation-cooldown]')).toBeVisible();
 const result=await bank.evaluate(()=>{const s=HayatData.read(),r=s.donor_responses.find(r=>r.requestId==='REQ-DEMO-002'&&r.donorId==='demo-donor-a-positive'),count=s.donations.length;HayatData.completeResponseDonation(r.id,2);return{before:count,after:HayatData.read().donations.length}});assert.equal(result.before,result.after);
 await go(bank,'bank/record-donation.html?donor=demo-donor-a-positive');await bank.fill('#reference','TOO-SOON');await bank.check('[name="completed"]');await bank.locator('#donation-form [type="submit"]').click();await confirm(bank);await expect(bank.locator('#form-alert')).toContainText('3 أشهر');
 check('Direct links, duplicate completion and the general recording form cannot create a second donation');
 await go(bank,'bank/create-request.html');await bank.selectOption('#bloodType','A+');await bank.fill('#units','1');await bank.locator('#request-form [type="submit"]').click();await bank.waitForURL('**/bank/request-details.html?id=*');const nextRequestId=new URL(bank.url()).searchParams.get('id');
 await go(donor,'donor/request-details.html?id='+encodeURIComponent(nextRequestId));await expect(donor.locator('[data-respond="accepted"]')).toHaveCount(0);
 const untilReturn=await donor.evaluate(()=>Date.parse(HayatData.donationCooldown(Hayat.currentUser().id).nextAllowedDate+'T00:00:00+02:00')-Date.now());assert.ok(untilReturn>0);for(let remaining=untilReturn;remaining>0;){const step=Math.min(remaining,7*86400000);await donor.clock.fastForward(step);remaining-=step}
 await expect(donor.locator('[data-donation-cooldown]')).toHaveCount(0);await expect(donor.locator('[data-respond="accepted"]')).toBeVisible();await donor.locator('[data-respond="accepted"]').click();await confirm(donor);assert.equal(await donor.evaluate(()=>HayatData.activeCommitment(Hayat.currentUser().id).requestId),nextRequestId);assert.equal(await donor.evaluate(()=>HayatData.points(Hayat.currentUser().id)),5);
 check('The exact three-month return date removes the banner automatically and allows a new request without awarding additional points');
 assert.deepEqual(errors,[]);
 await writeFile('test-results/appointments.json',JSON.stringify({checks,errors},null,2));
 console.log(`Passed ${checks.length} appointment groups, with six responsive widths and no browser errors.`);
}finally{await browser.close()}
