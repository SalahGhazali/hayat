/* Mock authentication and verification UX — only for front-end prototype. */
(() => {
'use strict';
const H=window.Hayat;
if(!H)return;
const D=window.HayatData;
const {$,$$,storage,allUsers,saveUser,emailVal,normalPhone,passwordHash,DEMO_PASSWORD,setSession,currentUser,clearFormErrors,fieldError,alertForm,url,toast,randomCode,dashboardFor}=H;
const page=document.body.dataset.page;
const now=()=>Date.now();
const getUserByIdentifier=v=>{const q=String(v).trim();return allUsers().find(u=>u.email===emailVal(q)||normalPhone(u.phone)===normalPhone(q)&&normalPhone(q).length>0)};
const navigate=p=>{location.href=url(p)};
function setButtonLoading(button,loading,text='جاري المعالجة...'){if(!button)return;if(loading){button.dataset.before=button.innerHTML;button.disabled=true;button.textContent=text}else{button.disabled=false;button.innerHTML=button.dataset.before||button.innerHTML}}
function makeVerification(u){const code=randomCode();storage.sessionSet('verify_'+u.id,{code,expiresAt:now()+5*60*1000,resendAt:now()+60*1000});storage.sessionSet('pending_verify_id',u.id);return code}
function initPasswordToggles(){ $$('[data-password-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const target=document.getElementById(btn.dataset.passwordToggle);if(!target)return;const showing=target.type==='password';target.type=showing?'text':'password';btn.setAttribute('aria-label',showing?'إخفاء كلمة المرور':'إظهار كلمة المرور');btn.innerHTML=`<i class="ti ti-${showing?'eye-off':'eye'}" aria-hidden="true"></i>`})) }
function initRegister(){const form=$('#register-form');if(!form)return;
 form.addEventListener('submit',async event=>{event.preventDefault();clearFormErrors(form);
 const name=form.elements.fullName.value.trim(),email=emailVal(form.elements.email.value),phone=normalPhone(form.elements.phone.value),password=form.elements.password.value,confirm=form.elements.confirmPassword.value,bloodType=form.elements.bloodType.value,city=form.elements.city.value.trim(),area=form.elements.area.value.trim(),lastDonation=form.elements.lastDonation.value,consent=form.elements.consent.checked;
 let count=0;const fail=(n,msg)=>{fieldError(form,n,msg);count++};
 if(name.length<2||name.length>100)fail('fullName','أدخل اسمًا من 2 إلى 100 حرف.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('email','أدخل بريدًا إلكترونيًا بصيغة صحيحة.');
 if(phone.length<8||phone.length>15)fail('phone','أدخل رقم هاتف صحيحًا من 8 إلى 15 رقمًا.');
 if(password.length<8)fail('password','كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.');
 if(confirm!==password)fail('confirmPassword','كلمتا المرور غير متطابقتين.');
 if(!bloodType)fail('bloodType','اختر فصيلة الدم أو «لا أعرف».');
 if(!city)fail('city','المدينة مطلوبة.');
 if(!area)fail('area','المنطقة مطلوبة.');
 if(lastDonation&&!H.validPastDate(lastDonation))fail('lastDonation','أدخل تاريخًا صحيحًا لآخر تبرع لا يقع في المستقبل.');
 if(!consent)fail('consent','يجب الموافقة على استخدام بيانات تجريبية فقط.');
 if(email&&allUsers().some(u=>u.email===email))fail('email','البريد الإلكتروني مسجل بالفعل.');
 if(phone&&allUsers().some(u=>normalPhone(u.phone)===phone))fail('phone','رقم الهاتف مسجل بالفعل.');
 if(count){alertForm('يرجى تصحيح الحقول الموضّحة أدناه.');return}
 const btn=$('[type="submit"]',form);setButtonLoading(btn,true,'جاري إنشاء الحساب التجريبي...');
 try{const user=await D.registerDonor({name,email,phone,password,bloodType,city,area,lastDonation});makeVerification(user);navigate('verify.html');}
 catch(error){alertForm('تعذرت محاكاة التسجيل. تأكد من السماح بالتخزين المحلي في المتصفح.');setButtonLoading(btn,false)}
 })
}
function initVerify(){const form=$('#verify-form');if(!form)return;
 let id=storage.sessionGet('pending_verify_id');if(!id){const email=new URLSearchParams(location.search).get('email');if(email){const usr=allUsers().find(u=>u.email===emailVal(email));if(usr&&!usr.verified){id=usr.id;storage.sessionSet('pending_verify_id',id);if(!storage.sessionGet('verify_'+id))makeVerification(usr)}}}
 const user=allUsers().find(u=>u.id===id);if(!user){alertForm('لا يوجد حساب بانتظار التأكيد. سجّل حسابًا جديدًا أولًا.','info');form.querySelector('button[type="submit"]').disabled=true;return}
 const emailLabel=$('#verify-email');if(emailLabel)emailLabel.textContent=user.email;
 if(user.status==='suspended'){alertForm('هذا الحساب موقوف. راجع إدارة النموذج.');form.querySelector('[type="submit"]').disabled=true;return}
 const renderInbox=()=>{const data=storage.sessionGet('verify_'+user.id);const codeEl=$('#mock-code');if(codeEl)codeEl.textContent=data?.code??'—';const expiry=$('#mock-expiry');if(expiry)expiry.textContent=data?new Date(data.expiresAt).toLocaleTimeString('ar', {hour:'2-digit',minute:'2-digit'}):'—'};
 renderInbox();$('#toggle-inbox')?.addEventListener('click',()=>{const box=$('#mock-inbox');if(box)box.hidden=!box.hidden;renderInbox()});
 $('#resend-code')?.addEventListener('click',()=>{const current=storage.sessionGet('verify_'+user.id);if(current&&now()<current.resendAt){const seconds=Math.ceil((current.resendAt-now())/1000);toast(`يمكن طلب رمز جديد بعد ${seconds} ثانية.`,'warning');return}makeVerification(user);renderInbox();toast('تم إنشاء رمز جديد في صندوق البريد التجريبي.','success')});
 form.addEventListener('submit',e=>{e.preventDefault();clearFormErrors(form);const current=allUsers().find(u=>u.id===user.id);if(!current||current.status==='suspended'||current.email!==user.email){alertForm('تغيرت حالة الحساب. ارجع إلى تسجيل الدخول.');return}const given=H.normalDigits(form.elements.code.value).replace(/\D/g,'').trim();const token=storage.sessionGet('verify_'+user.id);if(!/^\d{6}$/.test(given)){fieldError(form,'code','رمز التحقق مكوّن من 6 أرقام.');return}if(!token||now()>token.expiresAt){alertForm('انتهت صلاحية الرمز. اضغط إعادة إرسال للحصول على رمز جديد.');return}if(given!==token.code){alertForm('رمز التحقق غير صحيح. حاول مرة أخرى.');return}try{const activated=D.verifyAccount(user.id,user.email);storage.sessionDel('verify_'+user.id);storage.sessionDel('pending_verify_id');setSession(activated);navigate('status.html?type=verified')}catch(error){alertForm(error.message)}});
}
function initLogin(){const form=$('#login-form');if(!form)return;
 // Consume before display so refreshing during the toast cannot replay it.
 const logoutNotice=storage.sessionGet('logout_notice');storage.sessionDel('logout_notice');
 if(logoutNotice&&now()-logoutNotice.createdAt<30000&&!currentUser())toast('تم تسجيل الخروج بنجاح.','success',{delay:3000}).dataset.feedback='logout';
 $$('[data-demo-account]').forEach(btn=>btn.addEventListener('click',()=>{const u=allUsers().find(a=>a.id===btn.dataset.demoAccount);if(!u)return;form.elements.identifier.value=u.email;form.elements.password.value=DEMO_PASSWORD;toast('تم تعبئة بيانات الحساب التجريبي.','info')}));
 form.addEventListener('submit',async event=>{event.preventDefault();clearFormErrors(form);const input=form.elements.identifier.value.trim(),pass=form.elements.password.value;if(!input){fieldError(form,'identifier','البريد أو رقم الهاتف مطلوب.');return}if(!pass){fieldError(form,'password','كلمة المرور مطلوبة.');return}
 const btn=$('[type="submit"]',form);setButtonLoading(btn,true,'جاري تسجيل الدخول...');let user=getUserByIdentifier(input);
 let matched=false;try{matched=Boolean(user&&(user.demo?pass===DEMO_PASSWORD:await passwordHash(pass,user.salt)===user.passwordHash))}catch{matched=false}
 if(!matched){alertForm('بيانات تسجيل الدخول غير صحيحة.');setButtonLoading(btn,false);return}
 const current=allUsers().find(candidate=>candidate.id===user.id);if(!current||current.passwordHash!==user.passwordHash||current.salt!==user.salt){alertForm('تغيرت بيانات الحساب. حاول تسجيل الدخول مجددًا.');setButtonLoading(btn,false);return}user=current;
 if(user.status==='suspended'){alertForm('هذا الحساب موقوف. راجع إدارة النظام.');setButtonLoading(btn,false);return}
 if(!user.verified&&['pending_verification','pending_activation'].includes(user.status)){if(!storage.sessionGet('verify_'+user.id))makeVerification(user);storage.sessionSet('pending_verify_id',user.id);navigate('verify.html');return}
 if(user.status!=='active'||!user.verified){alertForm('هذا الحساب غير نشط. راجع إدارة النظام.');setButtonLoading(btn,false);return}
 setSession(user);navigate(dashboardFor(user))
 });
}
function initForgot(){const form=$('#forgot-form');if(!form)return;
 form.addEventListener('submit',e=>{e.preventDefault();clearFormErrors(form);const email=emailVal(form.elements.email.value);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){fieldError(form,'email','أدخل بريدًا إلكترونيًا صحيحًا.');return}
 const user=allUsers().find(u=>u.email===email);if(user){const token=Math.random().toString(36).slice(2)+Date.now().toString(36);storage.sessionSet('reset_'+token,{id:user.id,expiresAt:now()+15*60*1000,used:false});storage.sessionSet('last_reset_token',token)}else{storage.sessionDel('last_reset_token')}
 $('#forgot-done').hidden=false;$('#forgot-form').hidden=true;const open=$('#mock-reset-link');if(open){open.hidden=!user;if(user)open.href=url('reset-password.html?token='+encodeURIComponent(storage.sessionGet('last_reset_token')))}
 });
}
function initReset(){const form=$('#reset-form');if(!form)return;const token=new URLSearchParams(location.search).get('token');const data=token?storage.sessionGet('reset_'+token):null;const expired=!data||data.used||data.expiresAt<now();if(expired){alertForm('الرابط التجريبي غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.');form.querySelector('button[type="submit"]').disabled=true;return}
 form.addEventListener('submit',async e=>{e.preventDefault();clearFormErrors(form);const currentToken=storage.sessionGet('reset_'+token);if(!currentToken||currentToken.used||currentToken.expiresAt<now()){alertForm('الرابط التجريبي غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.');return}const pass=form.elements.password.value,confirm=form.elements.confirmPassword.value;if(pass.length<8){fieldError(form,'password','استخدم 8 أحرف على الأقل.');return}if(pass!==confirm){fieldError(form,'confirmPassword','كلمتا المرور غير متطابقتين.');return}
 const user=allUsers().find(u=>u.id===data.id);if(!user){alertForm('تعذر العثور على الحساب.');return}if(user.demo){alertForm('الحسابات التجريبية الجاهزة تستخدم كلمة مرور ثابتة. جرب هذه العملية على حساب أنشأته بنفسك.','info');return}
 const btn=$('[type="submit"]',form);setButtonLoading(btn,true);try{user.salt='salt_'+Math.random().toString(36).slice(2)+Date.now();user.passwordHash=await passwordHash(pass,user.salt);saveUser(user);currentToken.used=true;storage.sessionSet('reset_'+token,currentToken);}catch{alertForm('تعذر حفظ كلمة المرور التجريبية. حاول مرة أخرى.');setButtonLoading(btn,false);return}H.clearSession();navigate('status.html?type=reset')
 });
}
function initStatus(){const map={
 verified:['تم تفعيل حسابك بنجاح','تم تأكيد بريدك الإلكتروني في المحاكاة، وأصبح بإمكانك استعراض لوحة المتبرع.','donor/dashboard.html','الانتقال إلى لوحة المتبرع','circle-check'],
 reset:['تم تغيير كلمة المرور','تم تحديث كلمة المرور التجريبية. استخدم بياناتك الجديدة لتسجيل الدخول.','login.html','تسجيل الدخول','lock-check'],
 denied:['ليس لديك صلاحية للوصول','هذه الصفحة مخصصة لنوع حساب آخر. يمكنك العودة للوحة التحكم المناسبة لك.','index.html','العودة للرئيسية','shield-x'],
 missing:['الصفحة غير متوفرة','الصفحة التي تبحث عنها غير موجودة في النسخة الحالية.','index.html','العودة للرئيسية','file-off'],
 error:['تعذّر إكمال العملية مؤقتًا','يمكنك إعادة المحاولة أو العودة للرئيسية. تبقى بيانات المحاكاة المحفوظة في هذا المتصفح.','index.html','إعادة المحاولة','alert-circle']
 };const kind=new URLSearchParams(location.search).get('type')||'missing';
 if(kind==='logout'){const user=currentUser();if(user){location.replace(url(dashboardFor(user)))}else{H.completeLogout()}return}
 let [title,desc,target,action,icon]=map[kind==='temporary-error'?'error':kind]||map.missing;
 if(kind==='verified'){const user=currentUser();target=user?dashboardFor(user):'login.html';action=user?'الانتقال إلى لوحتي':'تسجيل الدخول';desc='تم تأكيد بريدك الإلكتروني في المحاكاة. يمكنك الآن متابعة استخدام حسابك.'}
 $('#status-heading').textContent=title;$('#status-description').textContent=desc;$('#status-icon').className='ti ti-'+icon;const a=$('#status-action');a.textContent=action;a.href=url(target);
 if(['error','temporary-error'].includes(kind)){const user=currentUser();a.href=url(user?dashboardFor(user):'index.html')}
}
document.addEventListener('DOMContentLoaded',()=>{initPasswordToggles();if(page==='register')initRegister();if(page==='verify')initVerify();if(page==='login')initLogin();if(page==='forgot')initForgot();if(page==='reset')initReset();if(page==='status')initStatus()});
})();
