import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Asia/Jerusalem',colorScheme:'dark',reducedMotion:'reduce'});
const base='http://localhost:8000/',checks=[],errors=[];
await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
context.on('page',page=>{page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('Hayat demo data unavailable'))errors.push(m.text())})});
context.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await context.addInitScript(()=>{const NativeDate=Date,fixed=NativeDate.parse('2026-11-03T10:00:00Z');globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return fixed}}});
const bank=await context.newPage(),donor=await context.newPage(),other=await context.newPage();
const go=async(page,path)=>{await page.goto(base+path);await page.locator('#view-content').waitFor()};
async function login(page,email){await page.goto(base+'login.html');await page.fill('[name="identifier"]',email);await page.fill('[name="password"]','Demo12345!');await page.locator('#login-form [type="submit"]').click();await page.waitForURL(/\/(donor|bank)\/dashboard.html$/);await page.locator('#view-content').waitFor()}
async function confirm(page){await page.locator('.swal2-popup [data-confirm]').click();await page.locator('.swal2-popup').waitFor({state:'hidden'})}
async function saveProfile(page){await page.locator('#profile-form [type="submit"]').click();await expect(page.locator('#profile-form [type="submit"]')).toBeEnabled()}
const row=(page,name)=>page.locator('#table-main tbody tr').filter({hasText:name});
const check=message=>{checks.push(message);console.log(message)};
async function layouts(page,label){for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label} overflow ${width}`);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)');if(width===320||width===1440)await page.screenshot({path:`test-results/invitations-${label}-${width}.png`,fullPage:true})}}

try{
 await login(bank,'staff@hayat.demo');await go(bank,'bank/create-request.html');await bank.selectOption('#bloodType','A+');await bank.fill('#units','1');await bank.locator('#request-form [type="submit"]').click();await bank.waitForURL('**/bank/request-details.html?id=*');const requestId=new URL(bank.url()).searchParams.get('id');
 await bank.locator('a[href*="donors.html?request="]').click();await expect(row(bank,'ليلى التجريبية')).toBeVisible();await expect(row(bank,'خالد التجريبي')).toBeVisible();await expect(row(bank,'أحمد محمد')).toHaveCount(0);await expect(row(bank,'نور التجريبية')).toHaveCount(0);await expect(row(bank,'مريم التجريبية')).toHaveCount(0);await expect(row(bank,'فصيلة غير معروفة')).toHaveCount(0);
 check('A+ campaign candidates include A+ and O- while excluding recent donation, unavailability, unknown and incompatible blood types');
 await login(other,'a-positive@hayat.demo');await go(other,'donor/profile.html');await other.uncheck('[name="visibleToBanks"]');await saveProfile(other);await expect(row(bank,'ليلى التجريبية')).toHaveCount(0);await other.reload();await expect(other.locator('[name="visibleToBanks"]')).not.toBeChecked();await go(bank,'bank/donors.html');await expect(row(bank,'ليلى التجريبية')).toHaveCount(0);await expect(row(bank,'أحمد محمد')).toHaveCount(0);
 await other.check('[name="visibleToBanks"]');await saveProfile(other);await expect(row(bank,'ليلى التجريبية')).toBeVisible();await other.uncheck('[name="available"]');await saveProfile(other);await expect(row(bank,'ليلى التجريبية')).toHaveCount(0);await other.check('[name="available"]');await saveProfile(other);await expect(row(bank,'ليلى التجريبية')).toBeVisible();
 await layouts(bank,'available-donors');
 check('Visibility and availability independently remove a donor from both candidate and general lists, persist on reload and restore on opt-in');
 await login(donor,'o-negative@hayat.demo');await expect(donor.locator('#view-content a[href*="'+requestId+'"]')).toBeVisible();await go(donor,'donor/notifications.html');await expect(donor.locator('#view-content')).toContainText('نداء جديد لفصيلة A+');
 await row(bank,'خالد التجريبي').locator('[data-invite-donor]').click();await bank.selectOption('#invitation-request',requestId);await bank.locator('#invitation-form [type="submit"]').click();await bank.locator('#invitation-form').waitFor({state:'detached'});await expect(donor.locator('#view-content')).toContainText('دعوة تبرع من بنك حياة النموذجي');
 assert.equal(await donor.evaluate(()=>HayatData.points('demo-donor-o-negative')),0);assert.equal(await donor.evaluate(()=>HayatData.read().donor_responses.filter(r=>r.donorId==='demo-donor-o-negative').length),0);
 await go(bank,'bank/donors.html?request='+requestId);await expect(row(bank,'خالد التجريبي').locator('[data-invite-donor]')).toBeDisabled();
 const duplicate=await bank.evaluate(id=>{const before=HayatData.read().notifications.length;HayatData.inviteDonor(id,'demo-donor-o-negative');return before===HayatData.read().notifications.length},requestId);assert.ok(duplicate);
 await row(bank,'ليلى التجريبية').locator('[data-invite-donor]').click();await confirm(bank);await expect(row(bank,'ليلى التجريبية').locator('[data-invite-donor]')).toBeDisabled();await go(other,'donor/request-details.html?id='+requestId);await other.locator('[data-respond="declined"]').click();await confirm(other);assert.equal(await other.evaluate(()=>HayatData.points('demo-donor-a-positive')),0);
 await layouts(bank,'campaign-candidates');
 check('General-list campaign selection and campaign-row invitations both deliver in-app notifications; duplicates are disabled and sending/declining earns no points');
 await go(donor,'donor/request-details.html?id='+requestId);await donor.locator('[data-respond="accepted"]').click();await confirm(donor);assert.equal(await donor.evaluate(()=>HayatData.points('demo-donor-o-negative')),0);
 await go(bank,'bank/request-details.html?id='+requestId);await bank.locator('[data-schedule-appointment]').click();await bank.fill('#appointment-time','2026-11-04T13:00');await bank.locator('#appointment-form [type="submit"]').click();await bank.locator('#appointment-form').waitFor({state:'detached'});await donor.locator('[data-accept-appointment]').click();await confirm(donor);await expect(bank.locator('[data-complete-response]')).toBeEnabled();await bank.locator('[data-complete-response]').click();await confirm(bank);await expect(bank.locator('#view-content')).toContainText('أُغلقت تلقائيًا');
 const result=await bank.evaluate(id=>{const s=HayatData.read(),d=s.donations.find(d=>d.requestId===id&&d.status==='confirmed');return {type:d.bloodType,donorId:d.donorId,requestStatus:s.requests.find(r=>r.id===id).status,points:HayatData.points(d.donorId)}},requestId);assert.deepEqual(result,{type:'O-',donorId:'demo-donor-o-negative',requestStatus:'fulfilled',points:5});
 await expect(donor.locator('[data-donation-cooldown]')).toBeVisible();await go(bank,'bank/donors.html?request='+requestId);await expect(bank.locator('#view-content')).toContainText('الطلب غير متاح');await expect(bank.locator('[data-invite-donor]')).toHaveCount(0);await go(bank,'bank/donors.html');await expect(row(bank,'خالد التجريبي')).toHaveCount(0);
 check('O- donor can accept an A+ campaign, confirm a future appointment and complete donation once; own blood type is preserved, +5 and cooldown apply, and the campaign closes automatically');
 assert.deepEqual(errors,[]);await writeFile('test-results/invitations.json',JSON.stringify({checks,errors},null,2));console.log(`Passed ${checks.length} invitation groups with six responsive widths and no browser errors.`);
}finally{await browser.close()}
