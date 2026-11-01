const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){const data=new Map(),session=new Map();const storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});const ctx=vm.createContext({document:{body:{dataset:{root:'./'}},addEventListener(){}},localStorage:storage(data),sessionStorage:storage(session),module:{exports:{}},console,TextEncoder,crypto:require('node:crypto').webcrypto,location:{replace(){}},setTimeout});ctx.window=ctx;for(const file of ['core','store'])vm.runInContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'),ctx);const H=ctx.Hayat,D=ctx.HayatData,login=id=>H.setSession(H.allUsers().find(u=>u.id===id));return{H,D,login,exported:ctx.module.exports}}
test('acceptance changes responses only; confirmation awards +5 once; correction remains auditable',()=>{const{H,D,login}=fixture();login('demo-donor');const initial=D.points('demo-donor'),count=D.read().donations.length;D.respond('REQ-DEMO-001','accepted');assert.equal(D.points('demo-donor'),initial);assert.equal(D.read().donations.length,count);assert.equal(D.read().donor_responses[0].status,'accepted');login('demo-staff');const form={donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'TEST-001'};const donation=D.recordDonation(form);assert.equal(D.points('demo-donor'),initial+5);assert.throws(()=>D.recordDonation(form),/منع التكرار/);assert.throws(()=>D.recordDonation({...form,reference:'ANOTHER'}),/منع التكرار/);assert.equal(D.read().point_transactions.filter(p=>p.donationId===donation.id&&p.type==='award').length,1);assert.throws(()=>D.correctDonation(donation.id,'توثيق خاطئ للاختبار'),/غير مسموح/);login('demo-admin');D.correctDonation(donation.id,'توثيق خاطئ للاختبار');assert.equal(D.points('demo-donor'),initial);assert.equal(D.read().donations.find(d=>d.id===donation.id).status,'corrected');assert.throws(()=>D.correctDonation(donation.id,'تصحيح آخر للاختبار'),/مسبقًا/);assert.equal(D.read().point_transactions.filter(p=>p.donationId===donation.id).length,2);assert.ok(D.read().audit_logs.some(a=>a.subjectId===donation.id&&a.details==='توثيق خاطئ للاختبار'));});
test('walk-in donation works without a request and survives repeated reads',()=>{const{D,login}=fixture();login('demo-staff');const donation=D.recordDonation({donorId:'demo-donor',donatedAt:D.today(),reference:'WALKIN-001'});assert.equal(donation.requestId,null);assert.equal(D.points('demo-donor'),20);assert.equal(D.read().donations[0].id,donation.id);});
test('unknown group, unavailable, unverified and out-of-radius donors are not matched',()=>{const{H,D}=fixture();const donor=H.allUsers()[0],request=D.read().requests[0];assert.equal(D.matches(donor,request),true);for(const patch of [{bloodType:'unknown'},{bloodType:'A+'},{available:false},{verified:false},{status:'suspended'},{city:'رفح',area:'المركز'}])assert.equal(D.matches({...donor,...patch},request),false);assert.equal(D.matches({...donor,area:'منطقة غير معروفة'},request),false);assert.equal(D.matches({...donor,area:'النصر'},{...request,radius:1}),false);});
test('closed requests refuse responses and closure notifies matched donors',()=>{const{D,login}=fixture();login('demo-staff');D.closeRequest('REQ-DEMO-001','cancelled','إلغاء تجريبي بسبب اكتمال التنسيق');assert.ok(D.read().notifications.some(n=>n.title==='تم إغلاق طلب الدم'));login('demo-donor');assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/مغلق/);assert.equal(D.points('demo-donor'),15);});
test('bank institution scopes and role guards are applied in repository mutations',()=>{const{H,D,login}=fixture();H.saveUser({id:'other-staff',name:'موظف تجريبي آخر',role:'bank',bankId:'bank-demo-2',staffType:'employee',status:'active',verified:true});login('other-staff');assert.throws(()=>D.closeRequest('REQ-DEMO-001','cancelled','سبب اختباري'),/أخرى/);assert.throws(()=>D.correctDonation('DON-DEMO-001','تصحيح اختباري'),/غير مسموح/);assert.throws(()=>D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'CROSS-BANK'}),/مؤسستك/);login('demo-donor');assert.throws(()=>D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'urgent'}),/غير مسموح/);assert.throws(()=>D.recordDonation({}),/غير مسموح/);login('demo-admin');assert.throws(()=>D.recordDonation({}),/غير مسموح/);});
test('admin creates bank and first representative; rep adds staff; staff cannot manage staff',async()=>{const{H,D,login}=fixture();login('demo-admin');const b=await D.createBank({bankName:'مؤسسة اختبار وهمية',city:'غزة',area:'الرمال',name:'ممثل اختباري',email:'rep@synthetic.demo',phone:'0591111111',password:'Test12345!'});const rep=H.allUsers().find(u=>u.bankId===b.id);assert.equal(rep.staffType,'representative');assert.equal(rep.role,'bank');assert.ok(rep.passwordHash);assert.equal(rep.password,undefined);assert.equal(await H.passwordHash('Test12345!',rep.salt),rep.passwordHash);login(rep.id);const staff=await D.createStaff({name:'موظف اختبار',email:'staff@synthetic.demo',phone:'0591111112',password:'Test12345!',bankId:'bank-demo-2'});assert.equal(staff.bankId,b.id);assert.equal(staff.staffType,'employee');assert.equal(staff.status,'pending_activation');assert.equal(staff.verified,false);login(staff.id);assert.throws(()=>D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'normal'}),/غير مسموح/);D.verifyAccount(staff.id,staff.email);await assert.rejects(D.createStaff({}),/للممثل/);D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'normal'});const n=D.read().notifications.filter(n=>n.donorId==='demo-donor');assert.ok(n.length>1);});
test('required unique contact data is validated for institution accounts and profile',async()=>{const{D,login}=fixture();login('demo-representative');await assert.rejects(D.createStaff({name:'موظف',email:'ahmad@hayat.demo',phone:'0592222222',password:'Test12345!'}),/مستخدم/);await assert.rejects(D.createStaff({name:'موظف',email:'new@hayat.demo',phone:'0590000001',password:'Test12345!'}),/مستخدم/);await assert.rejects(D.createStaff({name:'موظف',email:'',phone:'',password:'Test12345!'}),/مطلوبان/);});
test('regular staff cannot manage colleagues, representatives cannot cross banks or self-promote',()=>{const{D,login}=fixture();login('demo-staff');assert.throws(()=>D.toggleUser('demo-representative','اختبار صلاحيات'),/غير مسموح/);login('demo-representative');assert.throws(()=>D.toggleUser('demo-admin','اختبار صلاحيات'),/لا يمكن/);assert.throws(()=>D.toggleUser('demo-representative','اختبار صلاحيات'),/لا يمكن/);D.toggleUser('demo-staff','إيقاف موظف تجريبي');login('demo-staff');assert.throws(()=>D.createRequest({}),/غير مسموح/);});
test('bank suspension blocks operational mutations',()=>{const{D,login}=fixture();login('demo-admin');D.toggleBank('bank-demo-1','إيقاف اختباري للمؤسسة');login('demo-staff');assert.throws(()=>D.createRequest({}),/غير نشطة/);});
test('changing email requires reverification, keeps points and profile cannot set roles',()=>{const{H,D,login}=fixture();login('demo-donor');const result=D.saveProfile({name:'أحمد تجربة',email:'changed@hayat.demo',phone:'0590000001',city:'غزة',area:'الرمال',bloodType:'O+',available:'on',notifyEnabled:'on',role:'admin',points:9999});assert.equal(result,true);assert.equal(H.currentUser().role,'donor');assert.equal(H.currentUser().verified,false);assert.equal(H.currentUser().status,'pending_verification');assert.equal(D.points('demo-donor'),15);assert.match(H.storage.sessionGet('verify_demo-donor').code,/^\d{6}$/);assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/غير مسموح/);});
test('new request only includes synthetic matching candidates; no points for creation',()=>{const{D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:'3',radius:'10',urgency:'urgent',bankId:'bank-demo-2'});assert.equal(r.bankId,'bank-demo-1');assert.ok(D.read().notifications.some(n=>n.requestId===r.id&&n.donorId==='demo-donor'));assert.equal(D.points('demo-donor'),15);assert.throws(()=>D.createRequest({bloodType:'unknown',units:1,radius:1,urgency:'urgent'}));assert.throws(()=>D.createRequest({bloodType:'O+',units:0,radius:1,urgency:'urgent'}));});
test('notification preference suppresses unread emphasis without hiding request history',()=>{const{H,D,login}=fixture();H.saveUser({...H.allUsers()[0],notifyEnabled:false});login('demo-staff');const r=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});const notification=D.read().notifications.find(n=>n.requestId===r.id);assert.equal(notification.read,true);});

test('fulfilled closure requires confirmed donations; acceptance and corrected donations do not count',()=>{
 const{D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'urgent'});
 login('demo-donor');D.respond(r.id,'accepted');login('demo-staff');
 assert.throws(()=>D.closeRequest(r.id,'fulfilled','اكتمل التنسيق'),/توثيق عدد الوحدات/);
 const donation=D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:D.today(),reference:'FULFILLMENT-001'});
 login('demo-admin');D.correctDonation(donation.id,'توثيق خاطئ للاختبار');login('demo-staff');assert.throws(()=>D.closeRequest(r.id,'fulfilled','تم التصحيح'),/توثيق عدد الوحدات/);
 const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const when=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
 D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:when,reference:'FULFILLMENT-002'});D.closeRequest(r.id,'fulfilled','تم توثيق الوحدة المطلوبة');
 assert.equal(D.read().requests.find(x=>x.id===r.id).status,'fulfilled');
 login('demo-donor');assert.throws(()=>D.respond(r.id,'accepted'),/مغلق/);
});

test('calendar dates reject nonexistent days and future dates without changing points',()=>{
 const{H,D,login}=fixture();login('demo-staff');
 for(const donatedAt of ['2026-02-30','2026-04-31','2026-13-01','2026-00-10','not-a-date','9999-01-01'])assert.throws(()=>D.recordDonation({donorId:'demo-donor',donatedAt,reference:'DATE-INVALID'}),/تاريخ/);
 assert.equal(D.points('demo-donor'),15);assert.equal(H.validPastDate('2024-02-29'),true);assert.equal(H.validPastDate('2025-02-29'),false);
 login('demo-donor');assert.throws(()=>D.saveProfile({...H.currentUser(),lastDonation:'2026-02-30'}),/تاريخ/);
});

test('Arabic and Persian digits normalize to the same unique phone',async()=>{
 const{H,D,login}=fixture();assert.equal(H.normalPhone('٠٥٩٠٠٠٠٠٠١'),'0590000001');assert.equal(H.normalDigits('۰۱۲۳۴۵۶۷۸۹'),'0123456789');
 login('demo-representative');await assert.rejects(D.createStaff({name:'حساب مكرر',email:'digits@synthetic.demo',phone:'٠٥٩٠٠٠٠٠٠١',password:'Test12345!'}),/مستخدم/);
});

test('admin actions retain the institution scope in audit records',()=>{
 const{D,login}=fixture();login('demo-admin');D.correctDonation('DON-DEMO-001','تصحيح إداري تجريبي');D.toggleBank('bank-demo-1','توقيف إداري تجريبي');
 const events=D.read().audit_logs.filter(event=>event.id!=='AUD-DEMO-001');for(const event of events)assert.equal(event.bankId,'bank-demo-1');
 assert.ok(events.every(event=>event.actorId==='demo-admin'&&event.at&&event.subjectId));
});

test('new confirmed donation stores the declared blood type at confirmation',()=>{
 const{H,D,login}=fixture();login('demo-staff');const donation=D.recordDonation({donorId:'demo-donor',donatedAt:D.today(),reference:'BLOOD-SNAPSHOT'});
 assert.equal(donation.bloodType,'O+');const donor=H.allUsers().find(u=>u.id==='demo-donor');H.saveUser({...donor,bloodType:'A+'});
 assert.equal(D.read().donations.find(d=>d.id===donation.id).bloodType,'O+');
});

test('institution settings are admin-only, require a reason, preserve records and update staff labels',()=>{
 const{H,D,login}=fixture();const update={bankName:'مؤسسة حياة بعد المراجعة',contact:'coordination@synthetic.demo',city:'غزة',area:'النصر',reason:'تحديث بيانات التواصل التجريبية'};
 login('demo-representative');assert.throws(()=>D.updateBank('bank-demo-1',update),/غير مسموح/);
 login('demo-admin');assert.throws(()=>D.updateBank('bank-demo-1',{...update,reason:''}),/سبب التعديل/);assert.throws(()=>D.updateBank('bank-demo-1',{...update,area:'غير معروفة'}),/خريطة المحاكاة/);
 D.updateBank('bank-demo-1',update);assert.equal(D.read().banks[0].name,update.bankName);assert.equal(D.read().banks[0].contact,update.contact);
 assert.equal(H.allUsers().find(u=>u.id==='demo-staff').bankName,update.bankName);assert.equal(H.allUsers().find(u=>u.id==='demo-representative').email,'representative@hayat.demo');
 assert.equal(D.read().donations.length,3);assert.equal(D.points('demo-donor'),15);
 const event=D.read().audit_logs[0];assert.equal(event.bankId,'bank-demo-1');assert.match(event.details,/تحديث بيانات التواصل/);assert.match(event.details,/بنك حياة النموذجي/);
});

test('one ongoing response blocks another request and new matching invitations without closing the bank request',()=>{
 const{H,D,login}=fixture();login('demo-staff');const second=D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'normal'});
 login('demo-donor');D.respond('REQ-DEMO-001','accepted');assert.equal(D.activeCommitment('demo-donor').requestId,'REQ-DEMO-001');
 assert.throws(()=>D.respond(second.id,'accepted'),/استجابة جارية/);assert.equal(D.read().requests.find(r=>r.id==='REQ-DEMO-001').status,'active');assert.equal(D.matches(H.currentUser(),second),false);
 const before=D.read().donations.length;assert.equal(D.points('demo-donor'),15);
 login('demo-staff');const third=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'urgent'});assert.ok(!D.read().notifications.some(n=>n.requestId===third.id&&n.donorId==='demo-donor'));
 H.saveUser({...H.allUsers().find(u=>u.id==='demo-donor'),id:'second-donor',name:'متبرع ثانٍ وهمي',email:'second@synthetic.demo',phone:'0597000088'});login('second-donor');D.respond('REQ-DEMO-001','accepted');assert.equal(D.activeCommitment('second-donor').requestId,'REQ-DEMO-001');
 assert.equal(D.read().donations.length,before);assert.equal(D.points('demo-donor'),15);
});

test('duplicate acceptance is idempotent and explicit withdrawal restores candidates and unread invitations',()=>{
 const{H,D,login}=fixture();login('demo-staff');const second=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});
 login('demo-donor');D.respond('REQ-DEMO-001','accepted');const accepted=JSON.stringify(D.read());D.respond('REQ-DEMO-001','accepted');assert.equal(JSON.stringify(D.read()),accepted);
 D.markRead();assert.equal(D.read().notifications.find(n=>n.requestId===second.id&&n.donorId==='demo-donor').read,false);
 D.respond('REQ-DEMO-001','withdrawn');assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.read().donor_responses.find(r=>r.requestId==='REQ-DEMO-001').status,'withdrawn');assert.equal(D.matches(H.currentUser(),second),true);
 D.respond(second.id,'accepted');assert.equal(D.activeCommitment('demo-donor').requestId,second.id);assert.equal(D.points('demo-donor'),15);
});

test('withdrawal stays available after changing the donor profile and availability',()=>{
 const{H,D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');D.saveProfile({...H.currentUser(),bloodType:'A+',city:'رفح',area:'المركز',available:'',notifyEnabled:'on'});
 assert.equal(D.activeCommitment('demo-donor').requestId,'REQ-DEMO-001');assert.equal(D.matches(H.currentUser(),D.read().requests[0]),false);
 D.respond('REQ-DEMO-001','withdrawn');assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(H.currentUser().available,false);assert.equal(H.currentUser().bloodType,'A+');
});

test('request closure and institution suspension release coordination permanently',()=>{
 const{D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-staff');D.closeRequest('REQ-DEMO-001','cancelled','أُغلق الطلب في اختبار التنسيق');assert.equal(D.activeCommitment('demo-donor'),null);
 const next=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});login('demo-donor');D.respond(next.id,'accepted');login('demo-admin');D.toggleBank('bank-demo-1','إيقاف مؤسسة لاختبار التنسيق');assert.equal(D.activeCommitment('demo-donor'),null);
 D.toggleBank('bank-demo-1','إعادة المؤسسة دون استعادة القبول');assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.read().donor_responses.find(r=>r.requestId===next.id).releaseReason,'bank_suspended');
 login('demo-donor');D.respond(next.id,'accepted');assert.equal(D.activeCommitment('demo-donor').requestId,next.id);
});

test('linked confirmed donation ends coordination once and a correction never reactivates it',()=>{
 const{D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-staff');const donation=D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'COORD-LINKED'});
 assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.points('demo-donor'),20);assert.equal(D.read().donor_responses[0].donationId,donation.id);
 login('demo-admin');D.correctDonation(donation.id,'تصحيح لا يعيد الاستجابة القديمة');assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.points('demo-donor'),15);
 login('demo-donor');assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/انتهى تنسيقك/);assert.throws(()=>D.respond('REQ-DEMO-001','declined'),/انتهى تنسيقك/);
});

test('a contemporary walk-in donation resolves coordination but entering an older donation does not',()=>{
 const{D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-staff');D.recordDonation({donorId:'demo-donor',donatedAt:'2025-01-01',reference:'HISTORIC-WALKIN'});assert.ok(D.activeCommitment('demo-donor'));
 const donation=D.recordDonation({donorId:'demo-donor',donatedAt:D.today(),reference:'CURRENT-WALKIN'});assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.read().donor_responses[0].donationId,donation.id);
});

test('legacy multiple acceptances retain the latest, audit the release and never resurrect superseded responses',()=>{
 const{H,D,login}=fixture();login('demo-staff');const next=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});const old=D.read();delete old.coordinationVersion;
 old.donor_responses=[{id:'legacy-1',donorId:'demo-donor',requestId:'REQ-DEMO-001',status:'accepted',at:'2026-10-31T10:00:00Z'},{id:'legacy-2',donorId:'demo-donor',requestId:next.id,status:'accepted',at:'2026-10-31T11:00:00Z'}];H.storage.set('state_v02',old);
 assert.equal(D.activeCommitment('demo-donor').requestId,next.id);assert.equal(D.read().donor_responses[0].releaseReason,'superseded');assert.ok(D.read().audit_logs.some(a=>a.action==='تحديث تنسيق استجابة سابقة'));
 const migrated=JSON.stringify(D.read());assert.equal(JSON.stringify(D.read()),migrated);login('demo-donor');D.respond(next.id,'withdrawn');assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.points('demo-donor'),15);
});

test('deterministic demo population covers both bank teams, eight donors and useful first-load records',()=>{
 const{H,D,exported}=fixture();const users=H.allUsers(),s=D.read();assert.equal(exported,D);assert.equal(H.Data,D);
 assert.equal(users.filter(user=>user.role==='admin').length,1);assert.equal(users.filter(user=>user.role==='donor').length,8);
 for(const bank of s.banks){const team=users.filter(user=>user.bankId===bank.id);assert.equal(team.filter(user=>user.staffType==='representative').length,1);assert.equal(team.filter(user=>user.staffType==='employee').length,1)}
 assert.ok(users.some(user=>user.role==='donor'&&user.status==='pending_verification'));assert.ok(users.some(user=>user.bloodType==='unknown'));
 assert.ok(s.requests.length&&s.donor_responses.length&&s.donations.length&&s.point_transactions.length&&s.notifications.length&&s.audit_logs.length);assert.equal(D.points('demo-donor'),15);
});

test('central registration rejects repeated email and Arabic-normalized phone while keeping new donors pending',async()=>{
 const{H,D,login}=fixture(),data={name:'متبرع جديد وهمي',email:'central@synthetic.demo',phone:'0598800001',password:'Test12345!',bloodType:'unknown',city:'غزة',area:'الرمال'};
 const before=D.allUsers().length,user=await D.registerDonor(data);assert.equal(user.status,'pending_verification');assert.equal(user.verified,false);assert.equal(D.points(user.id),0);assert.equal(D.getSession(),null);
 login(user.id);assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/غير مسموح/);
 await assert.rejects(D.registerDonor({...data,phone:'0598800002'}),/مستخدم/);await assert.rejects(D.registerDonor({...data,email:'unique@synthetic.demo',phone:'٠٥٩٨٨٠٠٠٠١'}),/مستخدم/);assert.equal(D.allUsers().length,before+1);
 const activated=D.verifyAccount(user.id,user.email);assert.equal(activated.status,'active');assert.equal(H.currentUser().verified,true);assert.equal(D.points(user.id),0);
});

test('staff activation cannot bypass suspension and re-enabling an unverified employee remains pending',async()=>{
 const{H,D,login}=fixture();login('demo-representative');const staff=await D.createStaff({name:'موظف بانتظار التفعيل',email:'activation@synthetic.demo',phone:'0598800003',password:'Test12345!',bankId:'bank-demo-2'});
 assert.equal(staff.bankId,'bank-demo-1');assert.equal(staff.status,'pending_activation');assert.equal(staff.verified,false);assert.throws(()=>D.verifyAccount(staff.id,'wrong@synthetic.demo'),/تغيرت/);
 D.toggleUser(staff.id,'تعليق الحساب قبل تفعيله');assert.throws(()=>D.verifyAccount(staff.id,staff.email),/تغيرت/);D.toggleUser(staff.id,'استعادة مسار التفعيل');assert.equal(D.allUsers().find(user=>user.id===staff.id).status,'pending_activation');
 login(staff.id);assert.throws(()=>D.createRequest({}),/غير مسموح/);D.verifyAccount(staff.id,staff.email);assert.equal(H.currentUser().status,'active');assert.equal(H.currentUser().activationPending,undefined);
 assert.equal(D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'high'}).bankId,'bank-demo-1');
});

test('legacy local users migrate without dropping edited profiles, accounts, requests or the points ledger',()=>{
 const{H,D}=fixture(),state=D.read(),originalDonations=JSON.stringify(state.donations),originalLedger=JSON.stringify(state.point_transactions);delete state.users;delete state.usersVersion;
 const legacy={id:'legacy-donor',name:'حساب قديم محفوظ',email:'legacy@synthetic.demo',phone:'0598800004',role:'donor',bloodType:'A+',city:'غزة',area:'الرمال',verified:true,status:'active'};
 H.storage.set('users',[legacy,{...H.demos[0],name:'اسم أحمد المحفوظ سابقًا'}]);H.storage.set('state_v02',state);
 assert.equal(D.allUsers().find(user=>user.id==='demo-donor').name,'اسم أحمد المحفوظ سابقًا');assert.equal(D.allUsers().find(user=>user.id===legacy.id).name,legacy.name);assert.equal(JSON.stringify(D.read().donations),originalDonations);assert.equal(JSON.stringify(D.read().point_transactions),originalLedger);
 H.saveUser({...legacy,name:'تعديل داخل المخزن المركزي'});assert.equal(D.allUsers().find(user=>user.id===legacy.id).name,'تعديل داخل المخزن المركزي');assert.equal(D.read().requests.length,state.requests.length);
});

test('donation, single award, audit and donor notification persist atomically and reconfirmation changes nothing',()=>{
 const{H,D,login}=fixture();login('demo-staff');const writes=[],save=H.storage.set;H.storage.set=(key,value)=>{writes.push({key,value:JSON.parse(JSON.stringify(value))});save(key,value)};
 const donation=D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'ATOMIC-CONFIRM'});assert.equal(writes.length,1);const committed=writes[0].value;
 assert.equal(writes[0].key,'state_v02');assert.ok(committed.donations.some(record=>record.id===donation.id&&record.status==='confirmed'));assert.equal(committed.point_transactions.filter(point=>point.donationId===donation.id&&point.delta===5).length,1);assert.ok(committed.audit_logs.some(event=>event.subjectId===donation.id));assert.equal(committed.notifications.filter(notice=>notice.donationId===donation.id).length,1);
 const snapshot=JSON.stringify(D.read());assert.equal(D.confirmDonation(donation.id).id,donation.id);assert.equal(writes.length,1);assert.equal(JSON.stringify(D.read()),snapshot);
 login('demo-bank2-staff');assert.throws(()=>D.confirmDonation(donation.id),/أخرى/);login('demo-admin');assert.throws(()=>D.confirmDonation(donation.id),/غير مسموح/);
});

test('administrative correction keeps the original award, notifies the donor and cannot repeat or reconfirm',()=>{
 const{D,login}=fixture();login('demo-representative');assert.throws(()=>D.correctDonation('DON-DEMO-001','تصحيح خارج صلاحية المؤسسة'),/غير مسموح/);
 login('demo-admin');D.correctDonation('DON-DEMO-001','تصحيح إداري مع سبب محفوظ');const s=D.read(),ledger=s.point_transactions.filter(point=>point.donationId==='DON-DEMO-001');assert.equal(ledger.length,2);assert.ok(ledger.some(point=>point.delta===5));assert.ok(ledger.some(point=>point.delta===-5&&point.actorId==='demo-admin'));assert.equal(D.points('demo-donor'),10);assert.ok(s.notifications.some(notice=>notice.donationId==='DON-DEMO-001'&&notice.title.includes('-5')));
 const snapshot=JSON.stringify(s);assert.throws(()=>D.correctDonation('DON-DEMO-001','سبب ثانٍ لتصحيح مكرر'),/مسبقًا/);assert.equal(JSON.stringify(D.read()),snapshot);login('demo-staff');assert.throws(()=>D.confirmDonation('DON-DEMO-001'),/مصحح/);
});

test('admin can stop a request with an audit reason, but cannot fulfil, edit or create it',()=>{
 const{D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-admin');assert.throws(()=>D.closeRequest('REQ-DEMO-001','fulfilled','استيفاء غير مسموح للمدير'),/إيقاف الطلب/);assert.throws(()=>D.closeRequest('REQ-DEMO-001','cancelled',''),/سبب/);assert.throws(()=>D.editRequest('REQ-DEMO-001',{}),/غير مسموح/);assert.throws(()=>D.createRequest({}),/غير مسموح/);
 D.closeRequest('REQ-DEMO-001','cancelled','إيقاف إداري للتنسيق التجريبي');const request=D.read().requests.find(record=>record.id==='REQ-DEMO-001');assert.equal(request.closedBy,'demo-admin');assert.equal(request.status,'cancelled');assert.equal(D.activeCommitment('demo-donor'),null);assert.ok(D.read().audit_logs.some(event=>event.action==='إيقاف إداري للطلب'&&event.bankId==='bank-demo-1'&&event.details===request.closeReason));
});

test('request edits respect bank scope, preserve response history, rematch notifications and reject closed requests',()=>{
 const{D,login}=fixture(),fields={bloodType:'A+',units:4,radius:10,urgency:'high',notes:'ملاحظات معدلة للتنسيق',reason:'تحديث تفاصيل الطلب الافتراضي'};login('demo-bank2-staff');assert.throws(()=>D.editRequest('REQ-DEMO-001',fields),/أخرى/);login('demo-staff');assert.throws(()=>D.editRequest('REQ-DEMO-001',{...fields,reason:''}),/سبب/);
 const responses=JSON.stringify(D.read().donor_responses);D.editRequest('REQ-DEMO-001',fields);const s=D.read();assert.equal(JSON.stringify(s.donor_responses),responses);assert.equal(s.requests.find(request=>request.id==='REQ-DEMO-001').urgency,'high');assert.ok(s.notifications.some(notice=>notice.requestId==='REQ-DEMO-001'&&notice.donorId==='demo-donor-a-positive'));assert.ok(s.notifications.some(notice=>notice.requestId==='REQ-DEMO-001'&&notice.donorId==='demo-donor'));assert.ok(s.audit_logs.some(event=>event.action==='تعديل طلب دم'&&event.details.includes(fields.reason)));
 D.closeRequest('REQ-DEMO-001','cancelled','انتهاء اختبار التعديل');assert.throws(()=>D.editRequest('REQ-DEMO-001',fields),/مغلق/);
});

test('request edits retain blood group during active coordination and cannot undercount confirmed units',()=>{
 const{D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-staff');const fields={bloodType:'A+',units:2,radius:15,urgency:'normal',reason:'تعديل غير مسموح للفصيلة الجارية'};assert.throws(()=>D.editRequest('REQ-DEMO-001',fields),/الفصيلة/);
 const donation=D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'EDIT-BOUND'});assert.throws(()=>D.editRequest('REQ-DEMO-001',fields),/الفصيلة/);const before=JSON.stringify(D.read());assert.throws(()=>D.editRequest('REQ-DEMO-001',{...fields,bloodType:'O+',units:0}),/الوحدات/);assert.equal(JSON.stringify(D.read()),before);assert.equal(D.confirmDonation(donation.id).id,donation.id);
});

test('concurrent duplicate account creation commits one bank and representative without overwriting either',async()=>{
 const{D,login}=fixture();login('demo-admin');const before=D.read().banks.length,form={bankName:'بنك اختبار التزامن',city:'غزة',area:'الرمال',name:'ممثل التزامن',email:'parallel@synthetic.demo',phone:'0598800005',password:'Test12345!'};
 const results=await Promise.allSettled([D.createBank(form),D.createBank(form)]);assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(results.filter(result=>result.status==='rejected').length,1);assert.equal(D.read().banks.length,before+1);const representative=D.allUsers().find(user=>user.email===form.email);assert.ok(D.read().banks.some(bank=>bank.id===representative.bankId));assert.equal(D.allUsers().filter(user=>user.email===form.email).length,1);
});
