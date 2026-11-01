import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:320,height:900},colorScheme:'dark'});
try{
 await page.goto('http://localhost:8000/login.html');await page.fill('#password','Demo12345!');await page.click('[data-password-toggle]');assert.equal(await page.locator('#password').getAttribute('type'),'text');await page.click('[data-password-toggle]');assert.equal(await page.locator('#password').getAttribute('type'),'password');
 for(const [id,role]of [['demo-donor','donor'],['demo-representative','bank'],['demo-admin','admin']]){
  await page.goto('http://localhost:8000/login.html');await page.click(`[data-demo-account="${id}"]`);await page.locator('#login-form [type="submit"]').click();await page.waitForURL(`**/${role}/dashboard.html`);await page.click('.dashboard-sidebar .navbar-toggler');await expect(page.locator('#sidebar-menu')).toHaveClass(/show/);await page.screenshot({path:`test-results/${role}-menu-mobile.png`,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
 }
 await page.click('[data-logout]');await expect(page.locator('.swal2-popup [data-confirm]')).toBeFocused();await page.screenshot({path:'test-results/logout-modal-mobile.png',fullPage:true});await page.keyboard.press('Escape');await expect(page.locator('.swal2-popup')).toHaveCount(0);await expect(page.locator('[data-logout]')).toBeFocused();
 await expect(page.locator('#sidebar-menu')).toBeVisible();await page.click('[data-logout]');await page.locator('.swal2-cancel').click();await expect(page.locator('[data-logout]')).toBeFocused();await expect(page.locator('#sidebar-menu')).toBeVisible();await page.click('[data-logout]');await page.locator('.swal2-popup [data-confirm]').click();await page.waitForURL('**/login.html');assert.equal(await page.evaluate(()=>Hayat.getSession()),null);await expect(page.locator('[data-feedback="logout"]')).toBeVisible();
 await page.goto('http://localhost:8000/register.html');await page.screenshot({path:'test-results/register-mobile.png',fullPage:true});
 console.log('Password visibility, 320px offcanvas menus, SweetAlert2 Escape/cancel focus restoration and confirmed mobile logout, registration screenshot: passed');
}finally{await browser.close()}
