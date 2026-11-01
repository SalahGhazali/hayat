/* Frontend-only simulation; client-side guards are not authentication/security. */
(()=>{'use strict';
const PREFIX='hayat_mvp_v01_';
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const safe=v=>String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
const root=document.body?.dataset.root||'./',url=p=>root+p;
const storage={get(k,d=null){try{return JSON.parse(localStorage.getItem(PREFIX+k))??d}catch{return d}},set(k,v){localStorage.setItem(PREFIX+k,JSON.stringify(v))},sessionGet(k,d=null){try{return JSON.parse(sessionStorage.getItem(PREFIX+k))??d}catch{return d}},sessionSet(k,v){sessionStorage.setItem(PREFIX+k,JSON.stringify(v))},sessionDel(k){sessionStorage.removeItem(PREFIX+k)}};
const demos=[
{id:'demo-donor',name:'أحمد محمد',email:'ahmad@hayat.demo',phone:'0590000001',role:'donor',bloodType:'O+',city:'غزة',area:'الرمال',available:true,verified:true,status:'active',demo:true},
{id:'demo-representative',name:'د. سارة أحمد',email:'representative@hayat.demo',phone:'0590000002',role:'bank',staffType:'representative',bankId:'bank-demo-1',bankName:'بنك حياة النموذجي',verified:true,status:'active',demo:true},
{id:'demo-staff',name:'محمد خالد',email:'staff@hayat.demo',phone:'0590000003',role:'bank',staffType:'employee',bankId:'bank-demo-1',bankName:'بنك حياة النموذجي',verified:true,status:'active',demo:true},
{id:'demo-bank2-representative',name:'ممثل مركز العطاء التجريبي',email:'bank2@hayat.demo',phone:'0590000005',role:'bank',staffType:'representative',bankId:'bank-demo-2',bankName:'مركز العطاء النموذجي',verified:true,status:'active',demo:true},
{id:'demo-admin',name:'مدير النظام',email:'admin@hayat.demo',phone:'0590000004',role:'admin',verified:true,status:'active',demo:true}];
const DEMO_PASSWORD='Demo12345!';
function allUsers(){if(window.HayatData)return window.HayatData.allUsers();const saved=storage.get('users',[]);return [...demos.map(d=>({...d,...saved.find(u=>u.id===d.id)})),...saved.filter(u=>!demos.some(d=>d.id===u.id))]}
function saveUser(u){if(window.HayatData)return window.HayatData.saveUser(u);const list=storage.get('users',[]),i=list.findIndex(x=>x.id===u.id);if(i<0)list.push(u);else list[i]=u;storage.set('users',list)}
const getSession=()=>window.HayatData?window.HayatData.getSession():storage.sessionGet('session'),currentUser=()=>allUsers().find(u=>u.id===getSession()?.id)||null;
const setSession=u=>window.HayatData?window.HayatData.setSession(u):storage.sessionSet('session',{id:u.id,startedAt:Date.now()}),clearSession=()=>window.HayatData?window.HayatData.clearSession():storage.sessionDel('session');
const dashboardFor=u=>`${['admin','bank'].includes(u?.role)?u.role:'donor'}/dashboard.html`;
const icon=n=>`<i class="ti ti-${n}" aria-hidden="true"></i>`;
const brand=()=>`<a class="brand-lockup text-decoration-none" href="${url('index.html')}" aria-label="حياة — الرئيسية"><img class="symbol-logo" src="${url('assets/img/hayat-logo-symbol.png')}" alt=""><span><strong>حياة</strong><small>HAYAT</small></span></a>`;
function toast(message,type='success',{delay=5000}={}){
 let box=$('#toast-container');if(!box){box=document.createElement('div');box.id='toast-container';box.className='toast-container';box.setAttribute('aria-live','polite');document.body.append(box)}
 const el=document.createElement('div');el.className=`toast ${type}`;el.setAttribute('role','status');el.innerHTML=`<div class="toast-body">${icon(type==='error'?'alert-circle':type==='warning'?'alert-triangle':'circle-check')}<span>${safe(message)}</span><button class="btn-close ms-auto" type="button" aria-label="إغلاق التنبيه" data-bs-dismiss="toast"></button></div>`;box.append(el);
 const t=new tabler.Toast(el,{delay});el.addEventListener('hidden.bs.toast',()=>{t.dispose();el.remove()},{once:true});t.show();return el;
}
function alertForm(message,type='error'){const el=$('#form-alert');if(!el)return toast(message,type);el.className='form-alert visible '+type;el.innerHTML=`${icon('info-circle')}<span>${safe(message)}</span>`;el.scrollIntoView({block:'nearest'});}
function clearFormErrors(form){$$('.field-error',form).forEach(e=>e.textContent='');$$('.invalid',form).forEach(e=>{e.classList.remove('invalid');e.removeAttribute('aria-invalid')});const el=$('#form-alert');if(el){el.className='form-alert';el.textContent=''}}
function fieldError(form,name,message){const input=form.elements[name];if(input){input.classList.add('invalid');input.setAttribute('aria-invalid','true');const id='error-'+name;input.setAttribute('aria-describedby',id);let el=$(`[data-error-for="${name}"]`,form);if(!el){el=document.createElement('span');el.className='field-error';el.dataset.errorFor=name;input.parentElement.append(el)}el.id=id;el.textContent=message}}
async function confirmDialog({title='هل أنت متأكد؟',description='',confirm='تأكيد',danger=false,onConfirm}){
 if(!window.Swal){toast('تعذر فتح التأكيد. أعد تحميل الصفحة لاستعادة المكتبة المحلية.','error');return Promise.resolve(false)}
 const drawer=$('.offcanvas.show,.offcanvas-lg.show'),previous=document.activeElement;
 const offcanvas=drawer?tabler.Offcanvas.getOrCreateInstance(drawer):null;
 // Finish the drawer's focus trap before another accessible dialog takes focus.
 if(offcanvas)await new Promise(resolve=>{drawer.addEventListener('hidden.bs.offcanvas',resolve,{once:true});offcanvas.hide()});
 const result=await Swal.fire({title,text:description,icon:danger?'warning':'question',showCancelButton:true,showCloseButton:true,confirmButtonText:confirm,cancelButtonText:'تراجع',closeButtonAriaLabel:'إغلاق',buttonsStyling:false,returnFocus:!drawer,focusCancel:danger,heightAuto:false,customClass:{popup:'hayat-confirm',confirmButton:'btn '+(danger?'btn-danger':'btn-primary'),cancelButton:'btn btn-outline-secondary',actions:'gap-2'},showClass:{popup:matchMedia('(prefers-reduced-motion: reduce)').matches?'':'swal2-show'},hideClass:{popup:matchMedia('(prefers-reduced-motion: reduce)').matches?'':'swal2-hide'},didOpen:()=>{Swal.getConfirmButton().dataset.confirm=''}});
 if(result.isConfirmed){onConfirm?.();return true}
 if(offcanvas&&drawer.isConnected){drawer.addEventListener('shown.bs.offcanvas',()=>previous?.focus(),{once:true});offcanvas.show()}
 return false;
}
function completeLogout(){clearSession();storage.sessionSet('logout_notice',{createdAt:Date.now()});location.replace(url('login.html'))}
function logout(){confirmDialog({title:'تسجيل الخروج',description:'هل تريد إنهاء الجلسة التجريبية الحالية؟',confirm:'تسجيل الخروج',onConfirm:completeLogout})}
function initChrome(){const user=currentUser();const header=$('#site-header');if(header)header.innerHTML=`<a class="skip-link" href="#main-content">تجاوز إلى المحتوى</a><div class="demo-strip">${icon('info-circle')} نموذج واجهات تجريبي — استخدم بيانات وهمية فقط</div><header class="navbar navbar-expand-lg public-header"><div class="container-xl">${brand()}<button type="button" class="navbar-toggler ms-auto d-lg-none" data-bs-toggle="collapse" data-bs-target="#public-menu" aria-expanded="false" aria-controls="public-menu" aria-label="فتح القائمة"><span class="navbar-toggler-icon"></span></button><nav class="collapse navbar-collapse" id="public-menu" aria-label="التنقل الرئيسي"><ul class="navbar-nav mx-lg-auto"><li class="nav-item"><a class="nav-link" href="${url('index.html')}#how">كيف تعمل حياة؟</a></li><li class="nav-item"><a class="nav-link" href="${url('index.html')}#features">لماذا حياة</a></li><li class="nav-item"><a class="nav-link" href="${url('index.html')}#roles">للمتبرعين والمؤسسات</a></li></ul><div class="d-flex flex-wrap gap-2 py-2">${user?`<a class="btn btn-primary" href="${url(dashboardFor(user))}">${icon('layout-dashboard')} لوحتي</a><button class="btn btn-outline-secondary" type="button" data-logout>خروج</button>`:`<a class="btn btn-outline-secondary" href="${url('login.html')}">تسجيل الدخول</a><a class="btn btn-primary" href="${url('register.html')}">انضم كمتبرع</a>`}</div></nav></div></header>`;
 $$('[data-logout]',header||document).forEach(b=>b.onclick=logout);
 const footer=$('#site-footer');if(footer)footer.innerHTML=`<footer class="public-footer"><div class="container-xl"><div class="row align-items-center g-4"><div class="col-md-5">${brand()}<p class="text-secondary mt-3 mb-0">تواصل يقرّب العطاء. منصة لتنسيق التبرع بالدم، والفحوصات والقرارات الطبية لدى المختصين.</p></div><div class="col-md-7"><div class="d-flex flex-wrap gap-4 justify-content-md-end"><a href="${url('index.html')}#how">كيف تعمل حياة</a><a href="${url('login.html')}">تسجيل الدخول</a><a href="${url('register.html')}">انضم كمتبرع</a></div></div></div><div class="border-top mt-4 pt-3 text-secondary d-flex flex-wrap justify-content-between gap-2"><span>© 2026 حياة · مشروع تخرج، نموذج تفاعلي</span><span>واجهات Tabler UI · بيانات افتراضية</span></div></div></footer>`;
}
const normalDigits=value=>String(value??'').replace(/[٠-٩۰-۹]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.includes(d)?'٠١٢٣٤٥٦٧٨٩'.indexOf(d):'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const normalPhone=p=>normalDigits(p).replace(/[^0-9]/g,''),emailVal=e=>String(e??'').trim().toLowerCase(),randomCode=()=>String(Math.floor(100000+Math.random()*900000));
// Calendar dates follow the browser's local day, without UTC rollover or date normalization.
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function validPastDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value&&value<=today()}
async function passwordHash(pass,salt){const str='hayat-demo-only:'+salt+':'+pass;if(globalThis.crypto?.subtle){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function requireUser(role){const u=currentUser();if(!u){location.replace(url('login.html'));return null}if(!u.verified||u.status!=='active'||u.role!==role){location.replace(url('status.html?type=denied'));return null}return u}
window.Hayat={prefix:PREFIX,$,$$,safe,url,storage,demos,DEMO_PASSWORD,allUsers,saveUser,getSession,currentUser,setSession,clearSession,dashboardFor,toast,alertForm,clearFormErrors,fieldError,confirmDialog,normalDigits,normalPhone,emailVal,randomCode,passwordHash,requireUser,logout,completeLogout,brand,icon,today,validPastDate};
document.addEventListener('DOMContentLoaded',()=>{initChrome();$$('#site-header a[href$="#how"], #site-footer a[href$="#how"]').forEach(a=>a.href=url('how-it-works.html'))});
})();
