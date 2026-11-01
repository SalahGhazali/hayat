import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});
const page=await context.newPage();
const errors=[];page.on('pageerror',err=>errors.push(err.message));page.on('response',r=>{if(r.url().startsWith('http://localhost:8000')&&r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.goto('http://localhost:8000',{waitUntil:'networkidle'});
await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
await page.goto('http://localhost:8000/login.html');
await page.screenshot({path:'test-results/login-desktop.png',fullPage:true});
await page.click('[data-demo-account="demo-donor"]');await page.click('button[type="submit"]');await page.waitForURL('**/donor/dashboard.html');
await page.screenshot({path:'test-results/donor-desktop.png',fullPage:true});
for(const width of [320,375,390,768,1024,1440]){
 await page.setViewportSize({width,height:1000});
 for(const path of ['index.html','login.html','register.html','donor/dashboard.html']){
  await page.goto('http://localhost:8000/'+path);await page.locator('body').waitFor();
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,bg:getComputedStyle(document.body).backgroundColor}));
  console.log(width,path,layout);if(layout.scroll>width+1)errors.push(`overflow ${width} ${path}: ${layout.scroll}`);if(layout.bg!=='rgb(255, 255, 255)')errors.push(`background ${path}`);
 }
}
await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:8000/login.html');await page.screenshot({path:'test-results/login-mobile.png',fullPage:true});
await page.goto('http://localhost:8000/donor/dashboard.html');await page.screenshot({path:'test-results/donor-mobile.png',fullPage:true});
console.log('ERRORS',JSON.stringify(errors));await writeFile('test-results/smoke.json',JSON.stringify({errors},null,2));await browser.close();if(errors.length)process.exitCode=1;
