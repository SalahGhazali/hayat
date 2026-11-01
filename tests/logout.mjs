import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';

const base='http://localhost:8000/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const notice=()=>page.locator('[data-feedback="logout"]');
async function login(){
 await page.goto(base+'login.html');
 await page.fill('#identifier','ahmad@hayat.demo');
 await page.fill('#password','Demo12345!');
 await page.locator('#login-form [type="submit"]').click();
 await page.waitForURL('**/donor/dashboard.html');
}
async function logout(){
 await page.locator('[data-logout]').click();
 await page.locator('.swal2-popup [data-confirm]').click();
 await page.waitForURL('**/login.html');
 await expect(notice()).toBeVisible();
 await expect(notice()).toHaveCount(1);
 assert.equal(await page.evaluate(()=>Hayat.getSession()),null);
 assert.equal(await page.evaluate(()=>Hayat.storage.sessionGet('logout_notice')),null);
}
try{
 await login();
 await page.locator('[data-logout]').click();
 await expect(page.locator('.swal2-popup')).toBeVisible();
 await expect(page.locator('.swal2-popup [data-confirm]')).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page.locator('.swal2-popup')).toHaveCount(0);await expect(page.locator('[data-logout]')).toBeFocused();
 assert.equal(await page.evaluate(()=>Hayat.currentUser()?.id),'demo-donor');
 assert.match(page.url(),/donor\/dashboard\.html$/);

 await logout();
 await expect(notice()).toContainText('تم تسجيل الخروج بنجاح');
 await page.waitForTimeout(1700);
 await expect(notice()).toBeVisible();
 await expect(notice()).toHaveCount(0,{timeout:2500});
 await expect(page.locator('#login-form')).toBeVisible();
 await page.reload();
 await expect(notice()).toHaveCount(0);
 await page.goto(base+'donor/dashboard.html');
 await page.waitForURL('**/login.html');
 await expect(notice()).toHaveCount(0);
 console.log('Confirmed logout goes straight to login; notice disappears after ~3 seconds and does not return after refresh or protected-page redirect.');

 await login();
 await logout();
 await page.reload();
 await expect(notice()).toHaveCount(0);
 console.log('Refreshing while the logout notice is still visible does not replay it.');

 await page.setViewportSize({width:320,height:900});
 await page.goto(base+'status.html?type=logout');
 await page.waitForURL('**/login.html');
 await expect(notice()).toBeVisible();
 const bounds=await notice().boundingBox();
 assert(bounds&&bounds.width<=320&&bounds.x>=0&&bounds.x+bounds.width<=320);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
 await notice().locator('[data-bs-dismiss="toast"]').click();
 await expect(notice()).toHaveCount(0);
 await page.reload();
 await expect(notice()).toHaveCount(0);
 console.log('The old logout URL forwards to login with one dismissible, mobile-safe notice.');

 await login();
 await page.goto(base+'status.html?type=logout');
 await page.waitForURL('**/donor/dashboard.html');
 assert.equal(await page.evaluate(()=>Hayat.currentUser()?.id),'demo-donor');
 await expect(notice()).toHaveCount(0);
 await page.goto(base+'login.html');
 await expect(notice()).toHaveCount(0);
 console.log('Opening the old logout URL with an active session keeps the account signed in and does not show a false logout notice.');
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
