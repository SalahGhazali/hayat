const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(initialTime='2026-11-23T10:00:00Z'){let currentTime=Date.parse(initialTime);class Clock extends Date{constructor(...args){super(...(args.length?args:[currentTime]))}static now(){return currentTime}}const data=new Map(),session=new Map();const storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});const ctx=vm.createContext({Date:Clock,document:{body:{dataset:{root:'./'}},addEventListener(){}},localStorage:storage(data),sessionStorage:storage(session),module:{exports:{}},console,TextEncoder,crypto:require('node:crypto').webcrypto,location:{replace(){}},setTimeout});ctx.window=ctx;for(const file of ['core','store'])vm.runInContext(fs.readFileSync(`assets/js/${file}.js`,'utf8'),ctx);const H=ctx.Hayat,D=ctx.HayatData,login=id=>H.setSession(H.allUsers().find(u=>u.id===id));return{H,D,login,setNow:value=>currentTime=Date.parse(value),exported:ctx.module.exports}}
test('acceptance changes responses only; confirmation awards +5 once; correction remains auditable',()=>{const{H,D,login}=fixture();login('demo-donor');const initial=D.points('demo-donor'),count=D.read().donations.length;D.respond('REQ-DEMO-001','accepted');assert.equal(D.points('demo-donor'),initial);assert.equal(D.read().donations.length,count);assert.equal(D.read().donor_responses[0].status,'accepted');login('demo-staff');const form={donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'TEST-001'};const donation=D.recordDonation(form);assert.equal(D.points('demo-donor'),initial+5);assert.throws(()=>D.recordDonation(form),/منع التكرار/);assert.throws(()=>D.recordDonation({...form,reference:'ANOTHER'}),/منع التكرار/);assert.equal(D.read().point_transactions.filter(p=>p.donationId===donation.id&&p.type==='award').length,1);assert.throws(()=>D.correctDonation(donation.id,'توثيق خاطئ للاختبار'),/غير مسموح/);login('demo-admin');D.correctDonation(donation.id,'توثيق خاطئ للاختبار');assert.equal(D.points('demo-donor'),initial);assert.equal(D.read().donations.find(d=>d.id===donation.id).status,'corrected');assert.throws(()=>D.correctDonation(donation.id,'تصحيح آخر للاختبار'),/مسبقًا/);assert.equal(D.read().point_transactions.filter(p=>p.donationId===donation.id).length,2);assert.ok(D.read().audit_logs.some(a=>a.subjectId===donation.id&&a.details==='توثيق خاطئ للاختبار'));});
test('walk-in donation works without a request and survives repeated reads',()=>{const{D,login}=fixture();login('demo-staff');const donation=D.recordDonation({donorId:'demo-donor',donatedAt:D.today(),reference:'WALKIN-001'});assert.equal(donation.requestId,null);assert.equal(D.points('demo-donor'),20);assert.equal(D.read().donations[0].id,donation.id);});
test('unknown, unavailable, hidden and unverified donors are excluded while distance does not limit campaigns',()=>{const{H,D}=fixture();const donor=H.allUsers()[0],request=D.read().requests[0];assert.equal(D.matches(donor,request),true);for(const patch of [{bloodType:'unknown'},{bloodType:'A+'},{available:false},{visibleToBanks:false},{verified:false},{status:'suspended'}])assert.equal(D.matches({...donor,...patch},request),false);assert.equal(D.matches({...donor,city:'رفح',area:'المركز'},request),true);assert.equal(D.matches({...donor,area:'منطقة غير معروفة'},request),true);assert.equal(D.matches({...donor,area:'النصر'},{...request,radius:1}),true);});
test('closed requests refuse responses and closure notifies matched donors',()=>{const{D,login}=fixture();login('demo-staff');D.closeRequest('REQ-DEMO-001','cancelled','إلغاء تجريبي بسبب اكتمال التنسيق');assert.ok(D.read().notifications.some(n=>n.title==='تم إغلاق طلب الدم'));login('demo-donor');assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/مغلق/);assert.equal(D.points('demo-donor'),15);});
test('bank institution scopes and role guards are applied in repository mutations',()=>{const{H,D,login}=fixture();H.saveUser({id:'other-staff',name:'موظف تجريبي آخر',role:'bank',bankId:'bank-demo-2',staffType:'employee',status:'active',verified:true});login('other-staff');assert.throws(()=>D.closeRequest('REQ-DEMO-001','cancelled','سبب اختباري'),/أخرى/);assert.throws(()=>D.correctDonation('DON-DEMO-001','تصحيح اختباري'),/غير مسموح/);assert.throws(()=>D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'CROSS-BANK'}),/مؤسستك/);login('demo-donor');assert.throws(()=>D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'urgent'}),/غير مسموح/);assert.throws(()=>D.recordDonation({}),/غير مسموح/);login('demo-admin');assert.throws(()=>D.recordDonation({}),/غير مسموح/);});
test('admin creates bank and first representative; rep adds staff; staff cannot manage staff',async()=>{const{H,D,login}=fixture();login('demo-admin');const b=await D.createBank({bankName:'مؤسسة اختبار وهمية',city:'غزة',area:'الرمال',name:'ممثل اختباري',email:'rep@synthetic.demo',phone:'0591111111',password:'Test12345!'});const rep=H.allUsers().find(u=>u.bankId===b.id);assert.equal(rep.staffType,'representative');assert.equal(rep.role,'bank');assert.ok(rep.passwordHash);assert.equal(rep.password,undefined);assert.equal(await H.passwordHash('Test12345!',rep.salt),rep.passwordHash);login(rep.id);const staff=await D.createStaff({name:'موظف اختبار',email:'staff@synthetic.demo',phone:'0591111112',password:'Test12345!',bankId:'bank-demo-2'});assert.equal(staff.bankId,b.id);assert.equal(staff.staffType,'employee');assert.equal(staff.status,'pending_activation');assert.equal(staff.verified,false);login(staff.id);assert.throws(()=>D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'normal'}),/غير مسموح/);D.verifyAccount(staff.id,staff.email);await assert.rejects(D.createStaff({}),/للممثل/);D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'normal'});const n=D.read().notifications.filter(n=>n.donorId==='demo-donor');assert.ok(n.length>1);});
test('required unique contact data is validated for institution accounts and profile',async()=>{const{D,login}=fixture();login('demo-representative');await assert.rejects(D.createStaff({name:'موظف',email:'ahmad@hayat.demo',phone:'0592222222',password:'Test12345!'}),/مستخدم/);await assert.rejects(D.createStaff({name:'موظف',email:'new@hayat.demo',phone:'0590000001',password:'Test12345!'}),/مستخدم/);await assert.rejects(D.createStaff({name:'موظف',email:'',phone:'',password:'Test12345!'}),/مطلوبان/);});
test('regular staff cannot manage colleagues, representatives cannot cross banks or self-promote',()=>{const{D,login}=fixture();login('demo-staff');assert.throws(()=>D.toggleUser('demo-representative','اختبار صلاحيات'),/غير مسموح/);login('demo-representative');assert.throws(()=>D.toggleUser('demo-admin','اختبار صلاحيات'),/لا يمكن/);assert.throws(()=>D.toggleUser('demo-representative','اختبار صلاحيات'),/لا يمكن/);D.toggleUser('demo-staff','إيقاف موظف تجريبي');login('demo-staff');assert.throws(()=>D.createRequest({}),/غير مسموح/);});
test('bank suspension blocks operational mutations',()=>{const{D,login}=fixture();login('demo-admin');D.toggleBank('bank-demo-1','إيقاف اختباري للمؤسسة');login('demo-staff');assert.throws(()=>D.createRequest({}),/غير نشطة/);});
test('changing email requires reverification, keeps points and profile cannot set roles',()=>{const{H,D,login}=fixture();login('demo-donor');const result=D.saveProfile({name:'أحمد تجربة',email:'changed@hayat.demo',phone:'0590000001',city:'غزة',area:'الرمال',bloodType:'O+',available:'on',notifyEnabled:'on',role:'admin',points:9999});assert.equal(result,true);assert.equal(H.currentUser().role,'donor');assert.equal(H.currentUser().verified,false);assert.equal(H.currentUser().status,'pending_verification');assert.equal(D.points('demo-donor'),15);assert.match(H.storage.sessionGet('verify_demo-donor').code,/^\d{6}$/);assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/غير مسموح/);});
test('new request only includes synthetic matching candidates; no points for creation',()=>{const{D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:'3',radius:'10',urgency:'urgent',bankId:'bank-demo-2'});assert.equal(r.bankId,'bank-demo-1');assert.ok(D.read().notifications.some(n=>n.requestId===r.id&&n.donorId==='demo-donor'));assert.equal(D.points('demo-donor'),15);assert.throws(()=>D.createRequest({bloodType:'unknown',units:1,radius:1,urgency:'urgent'}));assert.throws(()=>D.createRequest({bloodType:'O+',units:0,radius:1,urgency:'urgent'}));});
test('notification preference suppresses unread emphasis without hiding request history',()=>{const{H,D,login}=fixture();H.saveUser({...H.allUsers()[0],notifyEnabled:false});login('demo-staff');const r=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});const notification=D.read().notifications.find(n=>n.requestId===r.id&&n.donorId==='demo-donor');assert.equal(notification.read,true);});

test('automatic fulfilment counts only confirmed donations and closes exactly at the campaign goal',()=>{
 const{H,D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:2,radius:10,urgency:'urgent'});
 login('demo-donor');D.respond(r.id,'accepted');login('demo-staff');
 assert.throws(()=>D.closeRequest(r.id,'fulfilled','اكتمل التنسيق'),/توثيق عدد الوحدات/);
 const donation=D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:D.today(),reference:'FULFILLMENT-001'});
 assert.equal(D.read().requests.find(x=>x.id===r.id).status,'active');
 login('demo-admin');D.correctDonation(donation.id,'توثيق خاطئ للاختبار');login('demo-staff');assert.throws(()=>D.closeRequest(r.id,'fulfilled','تم التصحيح'),/توثيق عدد الوحدات/);
 const yesterday=new Date(D.today()+'T12:00:00');yesterday.setDate(yesterday.getDate()-1);const when=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
 D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:when,reference:'FULFILLMENT-002'});assert.equal(D.read().requests.find(x=>x.id===r.id).status,'active');
 H.saveUser({...H.allUsers().find(u=>u.id==='demo-donor'),id:'goal-donor',email:'goal@synthetic.demo',phone:'0597777001'});
 D.recordDonation({donorId:'goal-donor',requestId:r.id,donatedAt:D.today(),reference:'FULFILLMENT-LAST'});
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

function appointmentFixture(){const f=fixture();f.login('demo-donor');const response=f.D.respond('REQ-DEMO-001','accepted');f.login('demo-staff');return {...f,response}}

test('nearby institution ordering uses demo locations with a truthful unknown-distance fallback',()=>{
 const {H,D}=fixture(),donor=H.allUsers().find(u=>u.id==='demo-donor');assert.equal(D.nearbyBanks(donor)[0].id,'bank-demo-1');assert.equal(D.nearbyBanks({...donor,city:'دير البلح',area:'الوسطى'})[0].id,'bank-demo-2');assert.equal(D.nearbyBanks({...donor,city:'مدينة غير مدعومة',area:'مجهولة'})[0].distanceKm,null);
});

test('voluntary submission is separate from campaigns and blocks competing coordination until cancellation',()=>{
 const {D,login}=fixture();login('demo-donor-a-positive');const before=D.read(),v=D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation',notes:'أرغب بالتبرع طوعًا'});const s=D.read();assert.equal(v.status,'pending');assert.equal(s.requests.length,before.requests.length);assert.equal(s.donations.length,before.donations.length);assert.equal(D.points('demo-donor-a-positive'),0);assert.equal(D.activeVoluntaryRequest(v.donorId).id,v.id);assert.ok(s.notifications.some(n=>n.bankId===v.bankId&&n.voluntaryId===v.id));assert.ok(s.notifications.some(n=>n.donorId===v.donorId&&n.voluntaryId===v.id));
 assert.throws(()=>D.createVoluntaryRequest({bankId:'bank-demo-2',kind:'donation'}),/تنسيق جار/);assert.throws(()=>D.respond('REQ-DEMO-002','accepted'),/طلب طوعي/);D.cancelVoluntaryRequest(v.id,{expectedVersion:v.version});D.respond('REQ-DEMO-002','accepted');assert.throws(()=>D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation'}),/تنسيق جار/);
});

function voluntaryFixture(kind='donation',donorId='demo-donor-a-positive'){
 const f=fixture();f.login(donorId);let v=f.D.createVoluntaryRequest({bankId:'bank-demo-1',kind});f.login('demo-staff');v=f.D.scheduleVoluntaryAppointment(v.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:v.version});f.login(donorId);v=f.D.replyVoluntaryAppointment(v.id,{status:'accepted',expectedVersion:v.version});f.login('demo-staff');return {...f,request:v};
}

test('voluntary appointments support alternatives, stale guards and early completion with one atomic award',()=>{
 const {H,D,login}=fixture();login('demo-donor-a-positive');let v=D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation'});login('demo-staff');assert.throws(()=>D.completeVoluntaryDonation(v.id,v.version),/مقبولًا/);v=D.scheduleVoluntaryAppointment(v.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:v.version});login(v.donorId);v=D.replyVoluntaryAppointment(v.id,{status:'change_requested',requestedAt:'2026-11-25T11:00:00Z',expectedVersion:v.version});login('demo-staff');assert.throws(()=>D.scheduleVoluntaryAppointment(v.id,{scheduledAt:v.appointment.requestedAt,expectedVersion:1}),/تغير/);v=D.scheduleVoluntaryAppointment(v.id,{scheduledAt:v.appointment.requestedAt,expectedVersion:v.version});login(v.donorId);v=D.replyVoluntaryAppointment(v.id,{status:'accepted',expectedVersion:v.version});login('demo-staff');
 const writes=[],save=H.storage.set;H.storage.set=(key,value)=>{writes.push(key);save(key,value)};const donation=D.completeVoluntaryDonation(v.id,v.version);assert.equal(writes.length,1);assert.equal(donation.requestId,null);assert.equal(donation.voluntaryId,v.id);assert.equal(donation.donatedAt,D.today());assert.equal(D.points(v.donorId),5);assert.equal(D.activeVoluntaryRequest(v.donorId),null);assert.equal(D.read().voluntary_requests.find(x=>x.id===v.id).status,'completed');assert.equal(D.donationCooldown(v.donorId).blocked,true);const snapshot=JSON.stringify(D.read());assert.equal(D.completeVoluntaryDonation(v.id,v.version).id,donation.id);assert.equal(JSON.stringify(D.read()),snapshot);
});

test('unknown-type registration persists an immediate institution guidance message without creating a donation',async()=>{
 const {D}=fixture(),before=D.read().donations.length;const donor=await D.registerDonor({name:'متبرع لا يعرف فصيلته',email:'blood-unknown@synthetic.demo',phone:'0598888788',password:'Test12345!',bloodType:'unknown',city:'غزة',area:'الرمال'});const notification=D.read().notifications.find(n=>n.donorId===donor.id&&n.type==='blood_type_guidance');assert.equal(donor.status,'pending_verification');assert.equal(notification.recommendedBankId,'bank-demo-1');assert.match(notification.body,/فحص/);assert.equal(D.points(donor.id),0);assert.equal(D.read().donations.length,before);
});

test('typing appointment records the staff result and completes an examination with zero donations or points',()=>{
 const {H,D,request}=voluntaryFixture('blood_type_check','demo-donor-unknown'),before=D.read().donations.length,writes=[],save=H.storage.set;H.storage.set=(key,value)=>{writes.push(key);save(key,value)};
 const donor=D.recordBloodType(request.donorId,{bloodType:'A+',reference:'EXAM-UNKNOWN',examConfirmed:'on',voluntaryId:request.id,expectedVersion:request.version});assert.equal(writes.length,1);assert.equal(donor.bloodType,'A+');assert.equal(donor.bloodTypeRecord.recordedBy,'demo-staff');assert.equal(donor.bloodTypeRecord.bankId,'bank-demo-1');assert.equal(D.read().voluntary_requests.find(v=>v.id===request.id).status,'completed');assert.equal(D.activeVoluntaryRequest(donor.id),null);assert.equal(D.points(donor.id),0);assert.equal(D.read().donations.length,before);assert.equal(D.donationCooldown(donor.id).blocked,false);assert.ok(D.matches(donor,D.read().requests.find(r=>r.id==='REQ-DEMO-002')));assert.ok(D.read().notifications.some(n=>n.donorId===donor.id&&n.type==='blood_type_recorded'));
});

test('blood typing requires staff, an attested result and same-bank voluntary scope',()=>{
 const {D,login,request}=voluntaryFixture('blood_type_check','demo-donor-unknown'),data={bloodType:'O-',reference:'LAB-SCOPE',examConfirmed:'on',voluntaryId:request.id,expectedVersion:request.version};
 login('demo-donor-unknown');assert.throws(()=>D.recordBloodType(request.donorId,data),/غير مسموح/);login('demo-admin');assert.throws(()=>D.recordBloodType(request.donorId,data),/غير مسموح/);login('demo-bank2-staff');assert.throws(()=>D.recordBloodType(request.donorId,data),/أخرى/);assert.throws(()=>D.completeVoluntaryDonation(request.id,request.version),/أخرى/);login('demo-staff');const snapshot=JSON.stringify(D.read());for(const patch of [{bloodType:'unknown'},{examConfirmed:''},{reference:''}])assert.throws(()=>D.recordBloodType(request.donorId,{...data,...patch}));assert.equal(JSON.stringify(D.read()),snapshot);
});

test('staff-recorded blood type is protected from donor edits and preserves historical donation types',()=>{
 const {H,D,login}=fixture();login('demo-staff');D.recordBloodType('demo-donor',{bloodType:'A+',reference:'LAB-CORRECTION',examConfirmed:'on',reason:'تصحيح الفصيلة بناءً على نتيجة الفحص'});assert.ok(D.read().donations.filter(d=>d.donorId==='demo-donor').every(d=>d.bloodType==='O+'));login('demo-donor');assert.throws(()=>D.saveProfile({...H.currentUser(),bloodType:'O-',available:'on',notifyEnabled:'on'}),/تُصحح/);assert.throws(()=>D.saveProfile({...H.currentUser(),bloodType:'unknown',available:'on',notifyEnabled:'on'}),/تُصحح/);D.saveProfile({...H.currentUser(),available:'on',notifyEnabled:'on'});assert.equal(H.currentUser().bloodTypeRecord.reference,'LAB-CORRECTION');assert.equal(D.points('demo-donor'),15);
});

test('unknown-type voluntary donor must receive a recorded result before donation confirmation',()=>{
 const {D,request}=voluntaryFixture('donation','demo-donor-unknown');assert.throws(()=>D.completeVoluntaryDonation(request.id,request.version),/نتيجة فصيلة/);D.recordBloodType(request.donorId,{bloodType:'O-',reference:'PRE-DONATION-LAB',examConfirmed:'on',voluntaryId:request.id,expectedVersion:request.version});assert.equal(D.read().voluntary_requests.find(v=>v.id===request.id).status,'accepted');assert.equal(D.points(request.donorId),0);
 assert.throws(()=>D.recordDonation({donorId:request.donorId,voluntaryId:request.id,requestId:'REQ-DEMO-003',expectedVersion:request.version,donatedAt:D.today(),reference:'MIXED-VOL-CAMPAIGN'}),/مستقل/);assert.throws(()=>D.recordDonation({donorId:request.donorId,voluntaryId:request.id,expectedVersion:request.version,donatedAt:'2025-01-01',reference:'BEFORE-VOL-REQUEST'}),/غير متاح/);
 const donation=D.completeVoluntaryDonation(request.id,request.version);assert.equal(donation.bloodType,'O-');assert.equal(D.points(request.donorId),5);
});

test('legacy unknown-type recorded donation requires a staff result before confirmation',()=>{
 const {H,D,login}=fixture(),s=D.read();s.donations.push({id:'LEGACY-UNKNOWN-RECORDED',donorId:'demo-donor-unknown',bankId:'bank-demo-1',requestId:null,donatedAt:D.today(),status:'recorded',reference:'UNKNOWN-RECORDED'});H.storage.set('state_v02',s);login('demo-staff');const snapshot=JSON.stringify(D.read());assert.throws(()=>D.confirmDonation('LEGACY-UNKNOWN-RECORDED'),/نتيجة فصيلة/);assert.equal(JSON.stringify(D.read()),snapshot);D.recordBloodType('demo-donor-unknown',{bloodType:'B+',reference:'LAB-LEGACY',examConfirmed:'on'});const donation=D.confirmDonation('LEGACY-UNKNOWN-RECORDED');assert.equal(donation.bloodType,'B+');assert.equal(D.points('demo-donor-unknown'),5);
});

test('recent donors may request a blood-type examination but cannot submit a voluntary donation',()=>{
 const {D,login}=fixture('2026-11-03T10:00:00Z');login('demo-donor');assert.throws(()=>D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation'}),/فترة الانتظار/);const request=D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'blood_type_check'});assert.equal(request.status,'pending');assert.equal(D.points('demo-donor'),15);
});

test('account or institution suspension permanently ends voluntary coordination',()=>{
 const {D,login,request}=voluntaryFixture();login('demo-admin');D.toggleBank('bank-demo-1','إيقاف مؤسسة اختبار الطلبات الطوعية');assert.equal(D.read().voluntary_requests.find(v=>v.id===request.id).status,'cancelled');D.toggleBank('bank-demo-1','إعادة تفعيل المؤسسة');assert.equal(D.activeVoluntaryRequest(request.donorId),null);
 const second=fixture();second.login('demo-donor-a-positive');const v=second.D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation'});second.login('demo-admin');second.D.toggleUser(v.donorId,'إيقاف حساب اختبار الطلبات الطوعية');assert.equal(second.D.read().voluntary_requests[0].status,'cancelled');
});

test('older walk-in records keep a voluntary request active while an actual new donation ends it',()=>{
 const {D,login}=fixture();login('demo-donor-a-positive');const v=D.createVoluntaryRequest({bankId:'bank-demo-1',kind:'donation'});login('demo-staff');D.recordDonation({donorId:v.donorId,donatedAt:'2025-01-01',reference:'OLD-VOL-WALKIN'});assert.equal(D.activeVoluntaryRequest(v.donorId).id,v.id);D.recordDonation({donorId:v.donorId,donatedAt:D.today(),reference:'NEW-VOL-WALKIN'});assert.equal(D.activeVoluntaryRequest(v.donorId),null);assert.equal(D.read().voluntary_requests[0].status,'completed');
});

test('donor acceptance, withdrawal and decline notify the institution once per actual transition',()=>{
 const {D,login}=fixture();login('demo-donor');const before=D.read().notifications.filter(n=>n.bankId==='bank-demo-1'&&n.type==='donor_response').length;
 D.respond('REQ-DEMO-001','accepted');const accepted=D.read().notifications.find(n=>n.bankId==='bank-demo-1'&&n.relatedDonorId==='demo-donor');assert.equal(accepted.title,'وافق متبرع على الحملة');assert.equal(accepted.read,false);assert.equal(accepted.donorId,undefined);
 D.respond('REQ-DEMO-001','accepted');assert.equal(D.read().notifications.filter(n=>n.bankId==='bank-demo-1'&&n.type==='donor_response').length,before+1);
 D.respond('REQ-DEMO-001','withdrawn');D.respond('REQ-DEMO-001','accepted');D.respond('REQ-DEMO-001','declined');const notices=D.read().notifications.filter(n=>n.bankId==='bank-demo-1'&&n.type==='donor_response');assert.equal(notices.length,before+4);assert.equal(new Set(notices.map(n=>n.eventKey)).size,notices.length);assert.ok(notices.some(n=>n.title==='تراجع متبرع عن استجابته'));assert.ok(notices.some(n=>n.title==='اعتذر متبرع عن الحملة'));assert.equal(D.points('demo-donor'),15);const declined=JSON.stringify(D.read());D.respond('REQ-DEMO-001','declined');assert.equal(JSON.stringify(D.read()),declined);
});

test('institution read controls cannot read other-bank or donor-private notifications',()=>{
 const {D,login}=fixture();login('demo-donor');D.respond('REQ-DEMO-001','accepted');login('demo-bank2-staff');const otherRequest=D.createRequest({bloodType:'O-',units:1,urgency:'normal'});D.closeRequest(otherRequest.id,'cancelled','اختبار إشعارات المؤسسة الثانية');
 const s=D.read(),other=s.notifications.find(n=>n.bankId==='bank-demo-2'),own=s.notifications.find(n=>n.bankId==='bank-demo-1'),donor=s.notifications.find(n=>n.donorId==='demo-donor-o-negative');
 login('demo-staff');const snapshot=JSON.stringify(D.read());assert.throws(()=>D.markRead(other.id),/مؤسستك/);assert.throws(()=>D.markRead(donor.id),/مؤسستك/);assert.equal(JSON.stringify(D.read()),snapshot);
 D.markRead(own.id);assert.equal(D.read().notifications.find(n=>n.id===own.id).read,true);D.markRead();assert.ok(D.read().notifications.filter(n=>n.bankId==='bank-demo-1'&&!n.donorId).every(n=>n.read));assert.equal(D.read().notifications.find(n=>n.id===other.id).read,false);
 login('demo-donor-o-negative');D.markRead();assert.equal(D.read().notifications.find(n=>n.id===other.id).read,false);login('demo-admin');assert.throws(()=>D.markRead(),/غير مسموح/);
});

test('past responses become institution notifications once without changing their original data or points',()=>{
 const {H,D}=fixture(),s=D.read();delete s.bankNotificationsVersion;s.notifications=s.notifications.filter(n=>n.type!=='donor_response');const responses=JSON.stringify(s.donor_responses),donations=JSON.stringify(s.donations),points=JSON.stringify(s.point_transactions);H.storage.set('state_v02',s);
 const migrated=D.read(),notice=migrated.notifications.find(n=>n.type==='donor_response'&&n.responseId==='RES-DEMO-001');assert.equal(notice.bankId,'bank-demo-1');assert.equal(notice.title,'اعتذر متبرع عن الحملة');assert.equal(notice.at,'2026-10-30T11:00:00Z');assert.equal(notice.read,false);assert.equal(JSON.stringify(migrated.donor_responses),responses);assert.equal(JSON.stringify(migrated.donations),donations);assert.equal(JSON.stringify(migrated.point_transactions),points);assert.equal(JSON.stringify(D.read()),JSON.stringify(migrated));
});

test('campaign completion, administrative closure and correction deliver scoped institution notifications',()=>{
 const {D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O-',units:1,urgency:'normal'});const donation=D.recordDonation({donorId:'demo-donor-o-negative',requestId:r.id,donatedAt:D.today(),reference:'BANK-COMPLETE-NOTICE'});assert.ok(D.read().notifications.some(n=>n.bankId==='bank-demo-1'&&n.type==='campaign_fulfilled'&&n.requestId===r.id));
 login('demo-admin');D.correctDonation(donation.id,'اختبار إشعار تصحيح تبرع للمؤسسة');D.closeRequest('REQ-DEMO-001','cancelled','اختبار إشعار إيقاف إداري للحملة');const notices=D.read().notifications.filter(n=>n.bankId==='bank-demo-1');assert.ok(notices.some(n=>n.type==='donation_correction'&&n.donationId===donation.id));assert.ok(notices.some(n=>n.type==='campaign_closed'&&n.title==='أوقفت الإدارة الحملة'));assert.ok(notices.every(n=>!n.donorId));
});

test('red-cell recruitment respects all ABO/Rh combinations and rejects unknown types',()=>{
 const {D}=fixture(),abo={O:['O'],A:['O','A'],B:['O','B'],AB:['O','A','B','AB']};
 for(const donor of D.groups)for(const recipient of D.groups){const expected=abo[recipient.slice(0,-1)].includes(donor.slice(0,-1))&&(recipient.endsWith('+')||donor.endsWith('-'));assert.equal(D.compatibleBloodTypes(donor,recipient),expected,`${donor} -> ${recipient}`)}
 assert.equal(D.compatibleBloodTypes('unknown','A+'),false);assert.equal(D.compatibleBloodTypes('O-','unknown'),false);
});

test('campaign notifications include every available compatible donor and exclude private, unavailable and recent donors',()=>{
 const {H,D,login}=fixture('2026-11-03T10:00:00Z'),base=H.allUsers().find(u=>u.id==='demo-donor');
 const entries=[['eligible-o','O+',{}],['hidden-o','O-',{visibleToBanks:false}],['unavailable-o','O-',{available:false}],['declared-o','O-',{lastDonation:D.today()}]];
 for(const [index,[id,bloodType,patch]] of entries.entries())H.saveUser({...base,id,email:id+'@synthetic.demo',phone:'059888810'+index,bloodType,city:'رفح',area:'المركز',...patch});
 login('demo-staff');const r=D.createRequest({bloodType:'A+',units:5,urgency:'normal'}),notified=D.read().notifications.filter(n=>n.requestId===r.id).map(n=>n.donorId);
 for(const id of ['demo-donor-a-positive','demo-donor-o-negative','eligible-o'])assert.ok(notified.includes(id),id);
 for(const id of ['demo-donor','hidden-o','unavailable-o','declared-o','demo-donor-b-positive','demo-donor-unknown'])assert.ok(!notified.includes(id),id);
 assert.equal(D.eligibleDonor(H.allUsers().find(u=>u.id==='declared-o')),false);assert.equal(D.points('declared-o'),0);
});

test('manual invitations are scoped, persistent and idempotent and award no points or response',()=>{
 const {D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'A+',units:3,urgency:'normal'}),before=D.read(),balance=D.points('demo-donor-o-negative');
 const invitation=D.inviteDonor(r.id,'demo-donor-o-negative');assert.equal(invitation.type,'donation_invitation');assert.equal(invitation.invitedBy,'demo-staff');assert.equal(invitation.read,false);
 const s=D.read();assert.equal(s.notifications.length,before.notifications.length+1);assert.equal(s.donor_responses.length,before.donor_responses.length);assert.equal(s.donations.length,before.donations.length);assert.equal(D.points('demo-donor-o-negative'),balance);
 assert.ok(s.audit_logs.some(a=>a.subjectId===r.id&&a.action==='إرسال دعوة تبرع'&&a.details==='demo-donor-o-negative'));
 const snapshot=JSON.stringify(s);assert.equal(D.inviteDonor(r.id,'demo-donor-o-negative').id,invitation.id);assert.equal(JSON.stringify(D.read()),snapshot);
 login('demo-donor-o-negative');D.respond(r.id,'accepted');assert.equal(D.points('demo-donor-o-negative'),balance);assert.equal(D.activeCommitment('demo-donor-o-negative').requestId,r.id);
 login('demo-staff');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/بالفعل/);
});

test('invitation checks current consent, cooldown, type, campaign status and bank role on every send',()=>{
 const {H,D,login}=fixture('2026-11-03T10:00:00Z');login('demo-staff');const r=D.createRequest({bloodType:'A+',units:2,urgency:'normal'});
 login('demo-bank2-staff');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/أخرى/);
 login('demo-donor-o-negative');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/غير مسموح/);login('demo-admin');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/غير مسموح/);
 login('demo-staff');assert.throws(()=>D.inviteDonor(r.id,'demo-donor'),/غير متاح/);assert.throws(()=>D.inviteDonor(r.id,'demo-donor-b-positive'),/غير متاح/);assert.throws(()=>D.inviteDonor(r.id,'demo-donor-unknown'),/غير متاح/);
 D.inviteDonor(r.id,'demo-donor-o-negative');H.saveUser({...H.allUsers().find(u=>u.id==='demo-donor-o-negative'),visibleToBanks:false});const snapshot=JSON.stringify(D.read());assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/غير متاح/);assert.equal(JSON.stringify(D.read()),snapshot);
 D.closeRequest(r.id,'cancelled','إلغاء حملة اختبار الدعوات');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-a-positive'),/مغلقة/);
});

test('donor can disable appearance independently of notification emphasis and re-enable it',()=>{
 const {H,D,login}=fixture();login('demo-donor-o-negative');const donor=H.currentUser();
 D.saveProfile({...donor,available:'on',notifyEnabled:'on',visibilityControl:'on'});assert.equal(H.currentUser().visibleToBanks,false);assert.equal(D.eligibleDonor(H.currentUser()),false);
 login('demo-staff');const r=D.createRequest({bloodType:'A+',units:3,urgency:'normal'});assert.ok(!D.read().notifications.some(n=>n.requestId===r.id&&n.donorId===donor.id));
 login(donor.id);D.saveProfile({...H.currentUser(),available:'on',notifyEnabled:'',visibilityControl:'on',visibleToBanks:'on'});assert.equal(D.eligibleDonor(H.currentUser()),true);assert.ok(D.read().notifications.some(n=>n.requestId===r.id&&n.donorId===donor.id));
});

test('compatible substitute donors can complete a linked donation with their own blood type preserved',()=>{
 const {D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'A+',units:1,urgency:'normal'});
 assert.throws(()=>D.recordDonation({donorId:'demo-donor-b-positive',requestId:r.id,donatedAt:D.today(),reference:'BAD-SUBSTITUTE'}),/خارج الترشيح/);
 const donation=D.recordDonation({donorId:'demo-donor-o-negative',requestId:r.id,donatedAt:D.today(),reference:'O-TO-A'});assert.equal(donation.bloodType,'O-');assert.equal(D.points('demo-donor-o-negative'),5);assert.equal(D.read().requests.find(x=>x.id===r.id).status,'fulfilled');
});

test('negative campaigns do not recruit positive donors and an existing commitment prevents new invitations',()=>{
 const {D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'A-',units:2,urgency:'normal'});assert.throws(()=>D.inviteDonor(r.id,'demo-donor'),/غير متاح/);
 login('demo-donor-o-negative');D.respond('REQ-DEMO-003','accepted');login('demo-staff');assert.throws(()=>D.inviteDonor(r.id,'demo-donor-o-negative'),/غير متاح/);assert.equal(D.eligibleDonor(D.allUsers().find(d=>d.id==='demo-donor-o-negative')),false);
});

test('final donation closes atomically, releases other responders and prevents additional donations',()=>{
 const {H,D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});
 H.saveUser({...H.allUsers().find(u=>u.id==='demo-donor'),id:'waiting-donor',email:'waiting@synthetic.demo',phone:'0597777002'});
 login('demo-donor');D.respond(r.id,'accepted');login('waiting-donor');const waiting=D.respond(r.id,'accepted');login('demo-staff');D.scheduleAppointment(waiting.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0});
 const writes=[],save=H.storage.set;H.storage.set=(key,value)=>{writes.push(key);save(key,value)};
 const donation=D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:D.today(),reference:'AUTO-FINAL'}),s=D.read(),closed=s.requests.find(x=>x.id===r.id);
 assert.equal(writes.length,1);assert.equal(closed.status,'fulfilled');assert.equal(closed.autoClosed,true);assert.equal(closed.closedBy,'demo-staff');assert.ok(closed.closedAt);assert.equal(D.points('demo-donor'),20);
 assert.equal(D.activeCommitment('waiting-donor'),null);assert.equal(s.donor_responses.find(x=>x.id===waiting.id).appointment.status,'cancelled');assert.equal(s.donor_responses.find(x=>x.donorId==='demo-donor'&&x.requestId===r.id).releaseReason,'donation_confirmed');
 assert.ok(s.notifications.some(n=>n.donorId==='waiting-donor'&&n.requestId===r.id&&n.title==='اكتملت الحملة وأُغلقت'));
 const snapshot=JSON.stringify(s);D.confirmDonation(donation.id);assert.equal(JSON.stringify(D.read()),snapshot);assert.equal(writes.length,1);
 assert.throws(()=>D.recordDonation({donorId:'waiting-donor',requestId:r.id,donatedAt:D.today(),reference:'AUTO-EXTRA'}),/نشطًا/);
 login('waiting-donor');assert.equal(D.matches(H.currentUser(),closed),false);assert.throws(()=>D.respond(r.id,'accepted'),/مغلق/);
 login('demo-admin');D.correctDonation(donation.id,'تصحيح بعد إغلاق الحملة تلقائيًا');assert.equal(D.read().requests.find(x=>x.id===r.id).status,'fulfilled');assert.equal(D.activeCommitment('waiting-donor'),null);
});

test('legacy recorded donations cannot be confirmed for a campaign that has already closed',()=>{
 const {H,D,login}=fixture();login('demo-staff');const r=D.createRequest({bloodType:'O+',units:1,radius:10,urgency:'normal'});
 D.recordDonation({donorId:'demo-donor',requestId:r.id,donatedAt:D.today(),reference:'CLOSED-GOAL'});
 const s=D.read();s.donations.push({id:'legacy-recorded-extra',donorId:'demo-donor-o-negative',bankId:r.bankId,requestId:r.id,donatedAt:D.today(),reference:'EXTRA-RECORDED',status:'recorded'});H.storage.set('state_v02',s);
 const snapshot=JSON.stringify(D.read());assert.throws(()=>D.confirmDonation('legacy-recorded-extra'),/مغلقة/);assert.equal(JSON.stringify(D.read()),snapshot);
});

test('existing fully donated active campaigns close on migration without changing donations or points',()=>{
 const {H,D}=fixture(),s=D.read();delete s.fulfillmentVersion;s.requests[0].units=1;s.donations[0].requestId=s.requests[0].id;
 const donations=JSON.stringify(s.donations),points=JSON.stringify(s.point_transactions);H.storage.set('state_v02',s);
 const migrated=D.read();assert.equal(migrated.requests[0].status,'fulfilled');assert.equal(migrated.requests[0].closedBy,'demo-system');assert.equal(JSON.stringify(migrated.donations),donations);assert.equal(JSON.stringify(migrated.point_transactions),points);
 assert.equal(JSON.stringify(D.read()),JSON.stringify(migrated));
});

test('lowering a campaign goal to its confirmed count closes it; direct donations do not count',()=>{
 const {D,login}=fixture();login('demo-staff');D.recordDonation({donorId:'demo-donor-a-positive',donatedAt:D.today(),reference:'UNLINKED-GOAL'});assert.equal(D.read().requests.find(r=>r.id==='REQ-DEMO-002').status,'active');
 D.recordDonation({donorId:'demo-donor',requestId:'REQ-DEMO-001',donatedAt:D.today(),reference:'EDIT-GOAL'});
 D.editRequest('REQ-DEMO-001',{bloodType:'O+',units:1,radius:15,urgency:'normal',reason:'تخفيض احتياج الحملة للوحدة المؤكدة'});
 assert.equal(D.read().requests.find(r=>r.id==='REQ-DEMO-001').status,'fulfilled');
});

test('appointment negotiation notifies both parties and never awards points before actual donation',()=>{
 const {D,login,response}=appointmentFixture(),before=D.read(),points=D.points('demo-donor');
 let a=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00+02:00',expectedVersion:0});
 assert.equal(a.status,'proposed');assert.ok(D.read().notifications.some(n=>n.responseId===response.id&&n.donorId==='demo-donor'));
 login('demo-donor');a=D.replyAppointment(response.id,{status:'change_requested',requestedAt:'2026-11-25T11:00:00+02:00',expectedVersion:a.version});
 assert.equal(a.status,'change_requested');assert.equal(a.requestedAt,'2026-11-25T09:00:00.000Z');assert.ok(D.read().notifications.some(n=>n.bankId==='bank-demo-1'&&n.title==='طلب المتبرع تغيير الموعد'));
 login('demo-staff');a=D.scheduleAppointment(response.id,{scheduledAt:a.requestedAt,expectedVersion:a.version});
 login('demo-donor');a=D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version});
 assert.equal(a.status,'accepted');assert.ok(D.read().notifications.some(n=>n.bankId==='bank-demo-1'&&n.title==='وافق المتبرع على الموعد'));
 assert.equal(D.points('demo-donor'),points);assert.equal(D.read().donations.length,before.donations.length);
 assert.equal(D.read().audit_logs.filter(n=>n.subjectId===response.id).length,4);
});

test('appointment mutations enforce donor ownership, bank scope and operational roles',()=>{
 const {D,login,response}=appointmentFixture(),data={scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0};
 login('demo-bank2-staff');assert.throws(()=>D.scheduleAppointment(response.id,data),/أخرى/);
 login('demo-admin');assert.throws(()=>D.scheduleAppointment(response.id,data),/غير مسموح/);
 login('demo-donor');assert.throws(()=>D.scheduleAppointment(response.id,data),/غير مسموح/);
 login('demo-staff');const a=D.scheduleAppointment(response.id,data);assert.throws(()=>D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version}),/غير مسموح/);
 login('demo-donor-a-positive');assert.throws(()=>D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version}),/متبرعًا آخر/);
 assert.throws(()=>D.completeResponseDonation(response.id,a.version),/غير مسموح/);
});

test('invalid, past and stale appointment changes fail without modifying saved state',()=>{
 const {D,login,response}=appointmentFixture();const snapshot=JSON.stringify(D.read());
 for(const scheduledAt of ['invalid','2026-11-22T10:00:00Z','2027-02-30T10:00:00Z','2027-01-01','2027-01-01T10:00'])assert.throws(()=>D.scheduleAppointment(response.id,{scheduledAt,expectedVersion:0}),/المستقبل/);
 assert.equal(JSON.stringify(D.read()),snapshot);
 const a=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0});
 assert.throws(()=>D.scheduleAppointment(response.id,{scheduledAt:'2026-11-25T10:00:00Z',expectedVersion:0}),/تغير الموعد/);
 login('demo-donor');assert.throws(()=>D.replyAppointment(response.id,{status:'change_requested',requestedAt:a.scheduledAt,expectedVersion:a.version}),/مختلفًا/);
 D.replyAppointment(response.id,{status:'change_requested',requestedAt:'2026-11-25T10:00:00Z',expectedVersion:a.version});
 assert.throws(()=>D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version}),/تغير الموعد/);
});

test('completion works before the accepted appointment time and is atomic and idempotent',()=>{
 const {H,D,login,response}=appointmentFixture();
 assert.throws(()=>D.completeResponseDonation(response.id,0),/يوافق/);
 let a=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0});assert.throws(()=>D.completeResponseDonation(response.id,a.version),/يوافق/);
 login('demo-donor');a=D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version});login('demo-staff');
 assert.throws(()=>D.scheduleAppointment(response.id,{scheduledAt:'2026-11-25T10:00:00Z',expectedVersion:a.version}),/مؤكد بالفعل/);
 assert.throws(()=>D.completeResponseDonation(response.id,1),/تغير الموعد/);
 login('demo-bank2-staff');assert.throws(()=>D.completeResponseDonation(response.id,a.version),/أخرى/);login('demo-staff');
 const writes=[],save=H.storage.set;H.storage.set=(key,value)=>{writes.push(key);save(key,value)};
 const donation=D.completeResponseDonation(response.id,a.version);assert.equal(writes.length,1);assert.equal(donation.donatedAt,'2026-11-23');assert.equal(D.points('demo-donor'),20);
 const saved=D.read(),finished=saved.donor_responses.find(r=>r.id===response.id);assert.equal(finished.appointment.status,'completed');assert.equal(finished.donationId,donation.id);assert.equal(D.activeCommitment('demo-donor'),null);assert.equal(D.donationCooldown('demo-donor').nextAllowedDate,'2027-02-23');
 const snapshot=JSON.stringify(saved);assert.equal(D.completeResponseDonation(response.id,a.version).id,donation.id);assert.equal(JSON.stringify(D.read()),snapshot);assert.equal(writes.length,1);
 login('demo-admin');D.correctDonation(donation.id,'تصحيح اختبار الموعد المكتمل');login('demo-staff');assert.throws(()=>D.completeResponseDonation(response.id,a.version),/انتهى التنسيق/);
});

test('withdrawal cancels appointments and old actions cannot target a newly accepted coordination',()=>{
 const {D,login,response}=appointmentFixture();const a=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0});
 login('demo-donor');D.respond(response.requestId,'withdrawn');assert.equal(D.read().donor_responses.find(r=>r.id===response.id).appointment.status,'cancelled');
 assert.throws(()=>D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version}),/انتهى التنسيق/);
 D.respond(response.requestId,'accepted');login('demo-staff');assert.throws(()=>D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0}),/تغير الموعد/);
 const current=D.read().donor_responses.find(r=>r.id===response.id);const next=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-25T10:00:00Z',expectedVersion:current.appointmentRevision});assert.ok(next.version>a.version);
 login('demo-donor');assert.throws(()=>D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version}),/تغير الموعد/);
});

test('closing a request cancels its appointment and creates no unaddressed notifications',()=>{
 const {D,login,response}=appointmentFixture();let a=D.scheduleAppointment(response.id,{scheduledAt:'2026-11-24T10:00:00Z',expectedVersion:0});login('demo-donor');D.replyAppointment(response.id,{status:'accepted',expectedVersion:a.version});login('demo-staff');
 D.closeRequest(response.requestId,'cancelled','انتهى طلب اختبار المواعيد');assert.equal(D.read().donor_responses.find(r=>r.id===response.id).appointment.status,'cancelled');assert.throws(()=>D.completeResponseDonation(response.id,2),/انتهى التنسيق/);
 assert.ok(D.read().notifications.every(n=>n.donorId||n.bankId));
});

test('three calendar months clamp month ends and count down at calendar-day boundaries',()=>{
 const {D}=fixture('2026-11-03T10:00:00Z');assert.equal(D.addMonths('2026-11-30'),'2027-02-28');assert.equal(D.addMonths('2023-11-30'),'2024-02-29');assert.equal(D.addMonths('2026-01-31'),'2026-04-30');
 assert.equal(D.donationCooldown('demo-donor').remainingDays,17);assert.equal(D.donationCooldown('demo-donor').nextAllowedDate,'2026-11-20');
 const s=D.read();assert.equal(D.donationCooldown('demo-donor',s,'2026-11-04').remainingDays,16);assert.equal(D.donationCooldown('demo-donor',s,'2026-11-19').remainingDays,1);assert.equal(D.donationCooldown('demo-donor',s,'2026-11-20').blocked,false);
});

test('cooldown blocks new acceptance and candidate matching until the exact return date',()=>{
 const {H,D,login,setNow}=fixture('2026-11-03T10:00:00Z');login('demo-donor');assert.equal(D.matches(H.currentUser(),D.read().requests[0]),false);assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/3 أشهر/);
 D.saveProfile({...H.currentUser(),lastDonation:'',available:'on',notifyEnabled:'on'});assert.equal(D.donationCooldown('demo-donor').blocked,true);assert.throws(()=>D.respond('REQ-DEMO-001','accepted'),/3 أشهر/);
 setNow('2026-11-20T00:00:00Z');assert.equal(D.donationCooldown('demo-donor').blocked,false);assert.equal(D.matches(H.currentUser(),D.read().requests[0]),true);D.respond('REQ-DEMO-001','accepted');assert.ok(D.activeCommitment('demo-donor'));
});

test('all banks and historical entries enforce donation intervals in both date directions',()=>{
 const {D,login}=fixture('2026-11-03T10:00:00Z');login('demo-staff');const snapshot=JSON.stringify(D.read());
 for(const donatedAt of ['2026-11-03','2026-08-21','2026-08-19','2026-06-01'])assert.throws(()=>D.recordDonation({donorId:'demo-donor',donatedAt,reference:'INTERVAL-'+donatedAt}),/3 أشهر/);
 assert.equal(JSON.stringify(D.read()),snapshot);login('demo-bank2-staff');assert.throws(()=>D.recordDonation({donorId:'demo-donor',donatedAt:'2026-11-03',reference:'OTHER-BANK-INTERVAL'}),/3 أشهر/);
 D.recordDonation({donorId:'demo-donor',donatedAt:'2025-01-01',reference:'VALID-OLD-DONATION'});assert.equal(D.donationCooldown('demo-donor').nextAllowedDate,'2026-11-20');
});

test('confirming an older recorded donation also enforces cooldown without partial awards',()=>{
 const {H,D,login}=fixture('2026-11-03T10:00:00Z'),s=D.read();s.donations.push({id:'recorded-too-soon',donorId:'demo-donor',bankId:'bank-demo-1',donatedAt:'2026-11-03',status:'recorded',reference:'RECORDED-INTERVAL'});H.storage.set('state_v02',s);login('demo-staff');
 const snapshot=JSON.stringify(D.read());assert.throws(()=>D.confirmDonation('recorded-too-soon'),/3 أشهر/);assert.equal(JSON.stringify(D.read()),snapshot);
});

test('correcting a mistaken latest donation recalculates cooldown without restoring ended coordination',()=>{
 const {D,login}=fixture('2026-11-03T10:00:00Z');assert.equal(D.donationCooldown('demo-donor').blocked,true);login('demo-admin');D.correctDonation('DON-DEMO-003','توثيق خاطئ لآخر تبرع تجريبي');assert.equal(D.donationCooldown('demo-donor').blocked,false);assert.equal(D.donationCooldown('demo-donor').lastDonation,'2026-05-18');assert.equal(D.activeCommitment('demo-donor'),null);
});
