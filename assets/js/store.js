/* Synthetic local repositories. No server, real medical data or secure authorization. */
(()=>{'use strict';
const H=window.Hayat,KEY='state_v02',now=()=>new Date().toISOString(),today=H.today;
const id=p=>p+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));
const groups=['O+','O-','A+','A-','B+','B-','AB+','AB-'];
function demoUsers(){return [...H.demos.map(u=>({...u})),
 {id:'demo-bank2-staff',name:'موظفة مركز العطاء التجريبي',email:'bank2-staff@hayat.demo',phone:'0590000006',role:'bank',staffType:'employee',bankId:'bank-demo-2',bankName:'مركز العطاء النموذجي',verified:true,status:'active',demo:true},
 ...[
  ['a-positive','ليلى التجريبية','A+','غزة','النصر',true],
  ['o-negative','خالد التجريبي','O-','غزة','الرمال',true],
  ['b-positive','مريم التجريبية','B+','غزة','الشجاعية',true],
  ['ab-positive','يوسف التجريبي','AB+','دير البلح','الوسطى',true],
  ['a-negative','نور التجريبية','A-','خانيونس','المركز',false],
  ['unknown','متبرع بفصيلة غير معروفة','unknown','غزة','الرمال',true],
  ['pending','متبرع بانتظار التحقق','B-','رفح','المركز',true]
 ].map(([key,name,bloodType,city,area,available],index)=>({id:'demo-donor-'+key,name,email:key+'@hayat.demo',phone:'05900000'+String(10+index),role:'donor',bloodType,city,area,available,verified:key!=='pending',status:key==='pending'?'pending_verification':'active',demo:true}))];}
function mergeUsers(s){
 const legacy=H.storage.get('users',[]),current=Array.isArray(s.users)?s.users:[];
 const users=demoUsers();
 for(const user of [...legacy,...current]){const index=users.findIndex(candidate=>candidate.id===user.id);if(index<0)users.push(user);else users[index]={...users[index],...user}}
 s.users=users;s.usersVersion=1;
}
function putUser(s,user){const index=s.users.findIndex(candidate=>candidate.id===user.id);if(index<0)s.users.push({...user});else s.users[index]={...user};return user}
function allUsers(){return read().users.map(user=>({...user}))}
function saveUser(user){const s=read();putUser(s,user);write(s);return user}
function getSession(){return H.storage.sessionGet('session')}
function setSession(user){H.storage.sessionSet('session',{id:user.id,startedAt:Date.now()})}
function clearSession(){H.storage.sessionDel('session')}
// Artificial coordinates for a reproducible radius demonstration; never use actual GPS.
const locations={'غزة':{'الرمال':[31.52,34.44],'النصر':[31.53,34.46],'الشجاعية':[31.50,34.47]},'دير البلح':{'الوسطى':[31.42,34.35]},'خانيونس':{'المركز':[31.34,34.31]},'رفح':{'المركز':[31.29,34.25]}};
function point(city,area){return locations[city]?.[area]||null}
function km(a,b){if(!a||!b)return Infinity;const rad=x=>x*Math.PI/180,lat=rad(b[0]-a[0]),lng=rad(b[1]-a[1]);const x=Math.sin(lat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(lng/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function seed(){const s={schema:2,users:demoUsers(),usersVersion:1,banks:[{id:'bank-demo-1',name:'بنك حياة النموذجي',city:'غزة',area:'الرمال',contact:'bank1@hayat.demo',status:'active'},{id:'bank-demo-2',name:'مركز العطاء النموذجي',city:'دير البلح',area:'الوسطى',contact:'bank2@hayat.demo',status:'active'}],requests:[],donor_responses:[],donations:[],point_transactions:[],notifications:[],audit_logs:[]};
 for(let i=0;i<3;i++){const date=['2026-02-10','2026-05-18','2026-08-20'][i],donation={id:'DON-DEMO-00'+(i+1),donorId:'demo-donor',bankId:i===1?'bank-demo-2':'bank-demo-1',requestId:null,donatedAt:date,reference:'SYNTH-'+(i+1),bloodType:'O+',status:'confirmed',confirmedBy:i===1?'demo-bank2-representative':'demo-staff',confirmedAt:date+'T10:00:00Z'};s.donations.push(donation);s.point_transactions.push({id:'PT-DEMO-'+i,donorId:donation.donorId,donationId:donation.id,bankId:donation.bankId,delta:5,type:'award',reason:'تبرع تجريبي مؤكّد',actorId:donation.confirmedBy,at:donation.confirmedAt})}
 for(const [i,g]of ['O+','A+','O-'].entries())s.requests.push({id:'REQ-DEMO-00'+(i+1),bankId:'bank-demo-1',bloodType:g,units:i+2,urgency:i===0?'high':'normal',radius:15,status:'active',createdBy:'demo-staff',createdAt:'2026-10-30T10:00:00Z',notes:'طلب افتراضي لاستعراض التنسيق فقط'});
 s.donor_responses.push({id:'RES-DEMO-001',requestId:'REQ-DEMO-002',donorId:'demo-donor-a-positive',status:'declined',at:'2026-10-30T11:00:00Z'});
 s.audit_logs.push({id:'AUD-DEMO-001',actorId:'demo-staff',bankId:'bank-demo-1',action:'تهيئة بيانات تجربة حياة',subjectId:'REQ-DEMO-001',details:'سجلات افتراضية لا تمثل نشاط مؤسسة حقيقية.',at:'2026-10-30T10:00:00Z'});
 s.notifications.push({id:'N-DEMO-1',donorId:'demo-donor',requestId:'REQ-DEMO-001',title:'نداء جديد لفصيلة O+',body:'طلب تجريبي من بنك حياة النموذجي في نطاق منطقتك.',read:false,at:'2026-10-30T10:00:00Z'});
 return s;
}
function read(){let s=H.storage.get(KEY),changed=false;if(!s){s=seed();changed=true}if(s.usersVersion!==1||!Array.isArray(s.users)){mergeUsers(s);changed=true}if(s.requestVersion!==1){for(const request of s.requests)if(request.urgency==='urgent')request.urgency='high';s.requestVersion=1;changed=true}if(s.coordinationVersion!==1){migrateCoordination(s);s.coordinationVersion=1;changed=true}if(changed)write(s);return s}
function write(s){H.storage.set(KEY,s)}
function actor(roles){const u=H.currentUser();if(!u||!u.verified||u.status!=='active'||!roles.includes(u.role))throw Error('غير مسموح بهذه العملية.');if(u.role==='bank'&&!read().banks.some(b=>b.id===u.bankId&&b.status==='active'))throw Error('المؤسسة غير نشطة.');return u}
function audit(s,u,action,subjectId,details='',bankId=u.bankId||null){s.audit_logs.unshift({id:id('AUD'),actorId:u.id,bankId,action,subjectId,details,at:now()})}
function bankScope(u,bankId){if(u.role==='bank'&&u.bankId!==bankId)throw Error('هذا السجل يتبع مؤسسة أخرى.')}
function activeCommitment(donorId,s=read()){
 return s.donor_responses.filter(response=>response.donorId===donorId&&response.status==='accepted'&&!response.releasedAt&&s.requests.some(r=>r.id===response.requestId&&r.status==='active'&&s.banks.some(b=>b.id===r.bankId&&b.status==='active'))).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0]||null;
}
function releaseResponse(response,reason,actorId,donationId){response.releasedAt=now();response.releaseReason=reason;response.releasedBy=actorId;if(donationId)response.donationId=donationId}
function releaseCoordination(s,predicate,reason,actorId,donationId){for(const response of s.donor_responses.filter(r=>r.status==='accepted'&&!r.releasedAt&&predicate(r)))releaseResponse(response,reason,actorId,donationId)}
function responseDay(response){if(response.acceptedOn)return response.acceptedOn;const at=new Date(response.at);return Number.isNaN(at.getTime())?'9999-12-31':`${at.getFullYear()}-${String(at.getMonth()+1).padStart(2,'0')}-${String(at.getDate()).padStart(2,'0')}`}
function migrateCoordination(s){
 const seen=new Set();
 for(const response of [...s.donor_responses].sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))){
  if(response.status!=='accepted'||response.releasedAt)continue;
  const request=s.requests.find(r=>r.id===response.requestId),institution=s.banks.find(b=>b.id===request?.bankId),donor=s.users.find(d=>d.id===response.donorId);
  const donation=s.donations.find(d=>d.donorId===response.donorId&&d.status==='confirmed'&&(d.requestId===response.requestId||d.donatedAt>=responseDay(response)));
  const reason=donor?.status==='suspended'?'account_suspended':!request||request.status!=='active'?'request_closed':institution?.status!=='active'?'bank_suspended':donation?'donation_confirmed':seen.has(response.donorId)?'superseded':null;
  if(reason){releaseResponse(response,reason,'demo-system',donation?.id);audit(s,{id:'demo-system'},'تحديث تنسيق استجابة سابقة',response.requestId,reason,request?.bankId||null)}else seen.add(response.donorId);
 }
}
function matches(d,r,s=read()){const b=s.banks.find(x=>x.id===r.bankId),commitment=activeCommitment(d.id,s);return Boolean(b&&b.status==='active'&&(!commitment||commitment.requestId===r.id)&&d.role==='donor'&&d.status==='active'&&d.verified&&d.available!==false&&groups.includes(d.bloodType)&&d.bloodType===r.bloodType&&km(point(d.city,d.area),point(b.city,b.area))<=r.radius)}
function notifyMatches(s,r){for(const d of s.users.filter(d=>matches(d,r,s))){if(s.notifications.some(n=>n.donorId===d.id&&n.requestId===r.id))continue;s.notifications.unshift({id:id('N'),donorId:d.id,requestId:r.id,title:`نداء جديد لفصيلة ${r.bloodType}`,body:`طلب من ${s.banks.find(b=>b.id===r.bankId)?.name}، ترشيح تنسيقي أولي.`,read:d.notifyEnabled===false,at:now()})}}
function syncMatches(){const s=read();s.requests.filter(r=>r.status==='active').forEach(r=>notifyMatches(s,r));write(s)}
function requestFields(data){if(!groups.includes(data.bloodType))throw Error('اختر فصيلة دم معروفة.');const units=Number(data.units),radius=Number(data.radius),urgency=data.urgency==='urgent'?'high':data.urgency;if(!Number.isInteger(units)||units<1||units>100||!Number.isFinite(radius)||radius<1||radius>100||!['normal','high','critical'].includes(urgency))throw Error('تحقق من الوحدات (1–100) والنطاق (1–100 كم) والأولوية.');return{bloodType:data.bloodType,units,radius,urgency,notes:String(data.notes||'').slice(0,400)}}
function createRequest(data){const u=actor(['bank']),s=read(),fields=requestFields(data),b=s.banks.find(b=>b.id===u.bankId);if(!point(b.city,b.area))throw Error('حدّد منطقة المؤسسة من خريطة المحاكاة قبل إنشاء الطلب.');const r={id:id('REQ'),bankId:u.bankId,...fields,status:'active',createdBy:u.id,createdAt:now()};s.requests.unshift(r);notifyMatches(s,r);audit(s,u,'إنشاء طلب دم',r.id);write(s);return r}
function editRequest(requestId,data){const u=actor(['bank']),s=read(),r=s.requests.find(request=>request.id===requestId);if(!r)throw Error('الطلب غير موجود.');bankScope(u,r.bankId);if(r.status!=='active')throw Error('لا يمكن تعديل طلب مغلق.');const fields=requestFields(data),reason=String(data.reason||'').trim();if(reason.length<5)throw Error('سبب التعديل مطلوب من 5 أحرف على الأقل.');const confirmed=s.donations.filter(donation=>donation.requestId===r.id&&donation.status==='confirmed');if(fields.units<confirmed.length)throw Error('عدد الوحدات أقل من التبرعات المؤكدة المرتبطة.');if(fields.bloodType!==r.bloodType&&(confirmed.length||s.donor_responses.some(response=>response.requestId===r.id&&response.status==='accepted'&&!response.releasedAt)))throw Error('لا يمكن تغيير الفصيلة بعد استجابة جارية أو توثيق تبرع؛ أغلق الطلب وأنشئ طلبًا آخر.');const before={bloodType:r.bloodType,units:r.units,radius:r.radius,urgency:r.urgency,notes:r.notes};Object.assign(r,fields,{updatedAt:now(),updatedBy:u.id});notifyMatches(s,r);audit(s,u,'تعديل طلب دم',r.id,`${reason} | قبل: ${JSON.stringify(before)} | بعد: ${JSON.stringify(fields)}`);write(s);return r}
function respond(requestId,status){
 const u=actor(['donor']),s=read(),r=s.requests.find(r=>r.id===requestId),commitment=activeCommitment(u.id,s);
 let response=s.donor_responses.find(x=>x.requestId===requestId&&x.donorId===u.id);
 if(!['accepted','declined','withdrawn'].includes(status)||!r||r.status!=='active'||!s.banks.some(b=>b.id===r.bankId&&b.status==='active'))throw Error('الطلب مغلق أو لم يعد ضمن ترشيحاتك الأولية.');
 if(status==='accepted'&&commitment&&commitment.requestId!==requestId)throw Error('لديك استجابة جارية لطلب آخر. تراجع عنها أولًا قبل قبول طلب جديد.');
 const withdrawing=response?.status==='accepted'&&!response.releasedAt&&status!=='accepted';
 if(status==='withdrawn'&&!withdrawing)throw Error('لا توجد استجابة جارية للتراجع عنها.');
 if(!withdrawing&&!matches(u,r,s))throw Error('الطلب مغلق أو لم يعد ضمن ترشيحاتك الأولية.');
 if(response?.releaseReason==='donation_confirmed'||s.donations.some(d=>d.donorId===u.id&&d.requestId===requestId&&d.status==='confirmed'))throw Error('انتهى تنسيقك لهذا الطلب بعد توثيق التبرع.');
 if(response?.status===status&&!response.releasedAt)return response;
 if(!response)s.donor_responses.unshift(response={id:id('RES'),requestId,donorId:u.id});
 response.status=status;response.at=now();
 if(status==='accepted'){response.acceptedOn=today();delete response.releasedAt;delete response.releaseReason;delete response.releasedBy;delete response.donationId}
 else releaseResponse(response,status,u.id);
 for(const notification of s.notifications.filter(n=>n.donorId===u.id&&n.requestId===requestId))notification.read=true;
 audit(s,u,status==='accepted'?'قبول طلب':withdrawing?'التراجع عن الاستجابة':'الاعتذار عن طلب',r.id,'',r.bankId);write(s);syncMatches();return response;
}
function closeRequest(requestId,status,reason){const u=actor(['bank','admin']),s=read(),r=s.requests.find(r=>r.id===requestId);if(!r)throw Error('الطلب غير موجود.');bankScope(u,r.bankId);if(u.role==='admin'&&status!=='cancelled')throw Error('إجراء المدير هو إيقاف الطلب مع السبب فقط؛ الاستيفاء من صلاحية المؤسسة.');if(r.status!=='active'||!['fulfilled','cancelled'].includes(status))throw Error('الطلب مغلق بالفعل.');if(!String(reason||'').trim())throw Error('سبب الإغلاق مطلوب.');if(status==='fulfilled'&&s.donations.filter(d=>d.requestId===r.id&&d.status==='confirmed').length<r.units)throw Error('لا يمكن إغلاق الطلب كمستوفى قبل توثيق عدد الوحدات المطلوبة؛ الاستجابات ليست تبرعات.');r.status=status;r.closedAt=now();r.closedBy=u.id;r.closeReason=String(reason).trim();releaseCoordination(s,response=>response.requestId===r.id,'request_closed',u.id);for(const donorId of new Set(s.notifications.filter(n=>n.requestId===r.id).map(n=>n.donorId))){s.notifications.unshift({id:id('N'),donorId,requestId:r.id,title:'تم إغلاق طلب الدم',body:r.closeReason,read:false,at:now()})}audit(s,u,u.role==='admin'?'إيقاف إداري للطلب':'إغلاق طلب: '+status,r.id,r.closeReason,r.bankId);write(s);syncMatches()}
function donationNotification(s,donation,title,body){s.notifications.unshift({id:id('N'),donorId:donation.donorId,requestId:donation.requestId,donationId:donation.id,title,body,read:false,at:now()})}
function awardDonation(s,donation,u){if(s.point_transactions.some(transaction=>transaction.donationId===donation.id&&transaction.type==='award'))return;donation.status='confirmed';donation.confirmedBy=u.id;donation.confirmedAt=now();s.point_transactions.unshift({id:id('PT'),donorId:donation.donorId,bankId:u.bankId,donationId:donation.id,delta:5,type:'award',reason:'تبرع فعلي مؤكد — محاكاة',actorId:u.id,at:now()});releaseCoordination(s,response=>response.donorId===donation.donorId&&(response.requestId===donation.requestId||donation.donatedAt>=responseDay(response)),'donation_confirmed',u.id,donation.id);donationNotification(s,donation,'تم توثيق تبرعك · +5 نقاط',`وثّقت ${s.banks.find(b=>b.id===u.bankId)?.name} تبرعًا مكتملًا في ${donation.donatedAt}. أضيفت 5 نقاط معنوية في هذه المحاكاة.`);audit(s,u,'توثيق تبرع وإضافة 5 نقاط',donation.id,donation.reference)}
function confirmDonation(donationId){const u=actor(['bank']),s=read(),donation=s.donations.find(candidate=>candidate.id===donationId);if(!donation)throw Error('التبرع غير موجود.');bankScope(u,donation.bankId);if(donation.status==='corrected')throw Error('لا يمكن إعادة تأكيد توثيق مصحح.');if(donation.status==='confirmed')return donation;if(donation.status!=='recorded')throw Error('حالة التبرع غير صالحة للتأكيد.');awardDonation(s,donation,u);write(s);return donation}
function recordDonation(data){const u=actor(['bank']),s=read(),d=s.users.find(d=>d.id===data.donorId&&d.role==='donor'&&d.verified&&d.status==='active');if(!d)throw Error('اختر حساب متبرع مفعّل.');const reference=String(data.reference||'').trim();if(reference.length<3)throw Error('أدخل مرجعًا تجريبيًا فريدًا (3 أحرف على الأقل).');if(!H.validPastDate(data.donatedAt))throw Error('أدخل تاريخًا صحيحًا لا يقع في المستقبل.');if(s.donations.some(x=>(x.bankId===u.bankId&&x.reference.toLowerCase()===reference.toLowerCase())||(x.donorId===d.id&&x.donatedAt===data.donatedAt)))throw Error('يوجد توثيق لهذا المرجع أو للمتبرع في اليوم نفسه؛ تم منع التكرار.');let request=null;if(data.requestId){request=s.requests.find(r=>r.id===data.requestId&&r.bankId===u.bankId&&r.status==='active');if(!request)throw Error('اختر طلبًا نشطًا من مؤسستك.');if(request.bloodType!==d.bloodType)throw Error('الفصيلة المعلنة تختلف عن الطلب؛ راجع الاختيار. هذا تحقق تنسيقي وليس فحص توافق طبي.');}
 const donation={id:id('DON'),donorId:d.id,bankId:u.bankId,requestId:request?.id||null,donatedAt:data.donatedAt,reference,bloodType:d.bloodType,status:'recorded',recordedBy:u.id,recordedAt:now()};s.donations.unshift(donation);awardDonation(s,donation,u);write(s);return donation;
}
function correctDonation(donationId,reason){const u=actor(['admin']),s=read(),d=s.donations.find(x=>x.id===donationId);if(!d)throw Error('التبرع غير موجود.');if(d.status!=='confirmed')throw Error('تم تصحيح هذا التبرع مسبقًا.');if(String(reason||'').trim().length<5)throw Error('أدخل سبب التصحيح من 5 أحرف على الأقل.');d.status='corrected';d.correctedBy=u.id;d.correctedAt=now();d.correctionReason=String(reason).trim();s.point_transactions.unshift({id:id('PT'),donorId:d.donorId,bankId:d.bankId,donationId:d.id,delta:-5,type:'correction',reason:d.correctionReason,actorId:u.id,at:now()});donationNotification(s,d,'تصحيح توثيق تبرع · -5 نقاط',`أضافت الإدارة حركة تصحيح مقابلة دون حذف السجل الأصلي. السبب: ${d.correctionReason}`);audit(s,u,'تصحيح توثيق وعكس 5 نقاط',d.id,d.correctionReason,d.bankId);write(s)}
function points(donorId,s=read()){return s.point_transactions.filter(p=>p.donorId===donorId).reduce((a,p)=>a+p.delta,0)}
function uniqueContact(data,exclude,s=read()){const email=H.emailVal(data.email),phone=H.normalPhone(data.phone);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<8||phone.length>15)throw Error('البريد والهاتف مطلوبان بصيغة صحيحة.');if(s.users.some(u=>u.id!==exclude&&(u.email===email||H.normalPhone(u.phone)===phone)))throw Error('البريد أو الهاتف مستخدم مسبقًا.');return{email,phone}}
async function account(data,extra){const contact=uniqueContact(data);if(String(data.name||'').trim().length<2||String(data.password||'').length<8)throw Error('أدخل اسمًا صحيحًا وكلمة مرور تجريبية من 8 أحرف.');const salt=id('SALT');return{id:id('USER'),name:data.name.trim(),...contact,...extra,verified:true,status:'active',salt,passwordHash:await H.passwordHash(data.password,salt),createdAt:now()}}
async function createBank(data){const u=actor(['admin']);if(String(data.bankName||'').trim().length<3||!point(data.city,data.area))throw Error('أدخل اسم المؤسسة واختر مدينة ومنطقة تجريبيتين صحيحتين.');const b={id:id('BANK'),name:data.bankName.trim(),city:data.city,area:data.area,contact:H.emailVal(data.email),status:'active'};const rep=await account(data,{role:'bank',staffType:'representative',bankId:b.id,bankName:b.name,createdBy:u.id});const current=actor(['admin']),s=read();if(current.id!==u.id)throw Error('تغيرت جلسة الإدارة قبل الحفظ.');uniqueContact(data,null,s);s.banks.push(b);putUser(s,rep);audit(s,u,'إنشاء مؤسسة وممثلها الرسمي',b.id,rep.id,b.id);write(s);return b}
async function createStaff(data){const u=actor(['bank']);if(u.staffType!=='representative')throw Error('إدارة الموظفين للممثل الرسمي فقط.');const user=await account(data,{role:'bank',staffType:'employee',bankId:u.bankId,bankName:u.bankName,createdBy:u.id});Object.assign(user,{verified:false,status:'pending_activation',activationPending:true});const current=actor(['bank']),s=read();if(current.id!==u.id||current.staffType!=='representative')throw Error('تغيرت صلاحية الممثل قبل الحفظ.');uniqueContact(data,null,s);putUser(s,user);audit(s,u,'إضافة موظف بانتظار تفعيل بريده التجريبي',user.id);write(s);return user}
async function registerDonor(data){
 const name=String(data.fullName||data.name||'').trim(),bloodType=data.bloodType,city=String(data.city||'').trim(),area=String(data.area||'').trim();
 if(name.length<2||name.length>100||![...groups,'unknown'].includes(bloodType)||!city||!area)throw Error('الاسم والفصيلة والمدينة والمنطقة مطلوبة.');
 if(data.lastDonation&&!H.validPastDate(data.lastDonation))throw Error('تاريخ آخر تبرع غير صالح.');
 const user=await account({...data,name},{role:'donor',bloodType,city,area,lastDonation:data.lastDonation||null,available:true,notifyEnabled:true});
 user.status='pending_verification';user.verified=false;const s=read();uniqueContact(data,null,s);putUser(s,user);audit(s,{id:user.id},'إنشاء حساب متبرع بانتظار التحقق',user.id);write(s);return user;
}
function verifyAccount(userId,email){const s=read(),user=s.users.find(candidate=>candidate.id===userId);if(!user||user.email!==email||user.status==='suspended')throw Error('تغيرت حالة الحساب. ارجع إلى تسجيل الدخول.');if(!['pending_verification','pending_activation','active'].includes(user.status))throw Error('حالة الحساب لا تسمح بالتفعيل.');if(user.verified&&user.status==='active')return user;const activation=user.status==='pending_activation';user.verified=true;user.status='active';delete user.activationPending;audit(s,{id:user.id,bankId:user.bankId},activation?'تفعيل موظف بعد تحقق البريد التجريبي':'تأكيد البريد التجريبي',user.id);write(s);return user}
function updateBank(bankId,data){
 const u=actor(['admin']),s=read(),b=s.banks.find(b=>b.id===bankId);
 if(!b)throw Error('المؤسسة غير موجودة.');
 const name=String(data.bankName||'').trim(),contact=H.emailVal(data.contact),reason=String(data.reason||'').trim();
 if(name.length<3||name.length>100||!point(data.city,data.area))throw Error('أدخل اسم المؤسسة واختر مدينة ومنطقة من خريطة المحاكاة.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))throw Error('أدخل بريد تواصل تجريبيًا صحيحًا للمؤسسة.');
 if(reason.length<5)throw Error('سبب التعديل مطلوب من 5 أحرف على الأقل.');
 const before={name:b.name,city:b.city,area:b.area,contact:b.contact};
 Object.assign(b,{name,city:data.city,area:data.area,contact});
 for(const member of s.users.filter(user=>user.role==='bank'&&user.bankId===b.id))member.bankName=name;
 for(const request of s.requests.filter(r=>r.bankId===b.id&&r.status==='active'))notifyMatches(s,request);
 audit(s,u,'تعديل إعدادات المؤسسة',b.id,`${reason} | قبل: ${JSON.stringify(before)} | بعد: ${JSON.stringify({name,city:b.city,area:b.area,contact})}`,b.id);
 write(s);return b;
}
function toggleUser(userId,reason){const u=actor(['bank','admin']),s=read(),target=s.users.find(x=>x.id===userId);if(!target||target.id===u.id||target.role==='admin')throw Error('لا يمكن تعديل حالة هذا الحساب.');if(u.role==='bank'&&(u.staffType!=='representative'||target.bankId!==u.bankId||target.staffType!=='employee'))throw Error('غير مسموح بإدارة هذا الحساب.');if(!String(reason||'').trim())throw Error('السبب مطلوب.');target.status=target.status==='suspended'?(target.verified?'active':target.activationPending?'pending_activation':'pending_verification'):'suspended';if(target.role==='donor'&&target.status==='suspended')releaseCoordination(s,response=>response.donorId===target.id,'account_suspended',u.id);audit(s,u,'تغيير حالة حساب إلى '+target.status,target.id,reason,target.bankId||null);write(s)}
function toggleBank(bankId,reason){const u=actor(['admin']),s=read(),b=s.banks.find(b=>b.id===bankId);if(!b||!String(reason||'').trim())throw Error('المؤسسة والسبب مطلوبان.');b.status=b.status==='active'?'suspended':'active';if(b.status==='suspended')releaseCoordination(s,response=>s.requests.some(r=>r.id===response.requestId&&r.bankId===b.id),'bank_suspended',u.id);audit(s,u,'تغيير حالة مؤسسة إلى '+b.status,b.id,reason,b.id);write(s);syncMatches()}
function saveProfile(data){
 const u=actor(['donor','bank','admin']),contact=uniqueContact(data,u.id);
 if(String(data.name||'').trim().length<2)throw Error('الاسم مطلوب.');
 if(u.role==='donor'&&(![...groups,'unknown'].includes(data.bloodType)||!String(data.city||'').trim()||!String(data.area||'').trim()))throw Error('الفصيلة والمدينة والمنطقة مطلوبة.');
 if(data.lastDonation&&!H.validPastDate(data.lastDonation))throw Error('تاريخ آخر تبرع غير صالح.');
 const changedEmail=contact.email!==u.email,updated={...u,name:data.name.trim(),...contact},s=read();
 if(u.role==='donor'){
  // Preserve older prototype records before the profile's declared group changes.
  for(const donation of s.donations.filter(d=>d.donorId===u.id&&!d.bloodType))donation.bloodType=u.bloodType;
  Object.assign(updated,{bloodType:data.bloodType,city:data.city.trim(),area:data.area.trim(),available:data.available==='on',notifyEnabled:data.notifyEnabled==='on',lastDonation:data.lastDonation||null});
 }
 if(changedEmail){updated.verified=false;updated.status='pending_verification';H.storage.sessionSet('pending_verify_id',u.id);H.storage.sessionSet('verify_'+u.id,{code:H.randomCode(),expiresAt:Date.now()+300000,resendAt:Date.now()+60000})}
 putUser(s,updated);audit(s,u,'تحديث الملف الشخصي',u.id,changedEmail?'تغيير بريد مع إعادة تأكيد تجريبية':'');write(s);syncMatches();return changedEmail;
}
function markRead(notificationId){const u=actor(['donor']),s=read(),commitment=activeCommitment(u.id,s);s.notifications.filter(n=>n.donorId===u.id&&(!commitment||!n.requestId||n.donationId||n.requestId===commitment.requestId)&&(!notificationId||n.id===notificationId)).forEach(n=>n.read=true);write(s)}
function reset(){actor(['admin']);for(const k of Object.keys(localStorage))if(k.startsWith(H.prefix))localStorage.removeItem(k);for(const k of Object.keys(sessionStorage))if(k.startsWith(H.prefix))sessionStorage.removeItem(k)}
window.HayatData={read,allUsers,saveUser,getSession,setSession,clearSession,registerDonor,verifyAccount,groups,locations,point,km,matches,activeCommitment,syncMatches,createRequest,editRequest,respond,closeRequest,recordDonation,confirmDonation,correctDonation,points,createBank,createStaff,updateBank,toggleUser,toggleBank,saveProfile,markRead,reset,today};
H.Data=window.HayatData;
if(typeof module!=='undefined'&&module.exports)module.exports=window.HayatData;
read();
})();
