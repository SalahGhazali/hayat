/* Synthetic local repositories. No server, real medical data or secure authorization. */
(()=>{'use strict';
const H=window.Hayat,KEY='state_v02',now=()=>new Date().toISOString(),today=H.today;
const id=p=>p+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));
const groups=['O+','O-','A+','A-','B+','B-','AB+','AB-'];
// Preliminary RED-CELL recruitment only, not plasma/whole-blood clearance.
// https://professionaleducation.blood.ca/en/transfusion/clinical-guide/blood-administration
const redCellDonors={'O-':['O-'],'O+':['O+','O-'],'A-':['A-','O-'],'A+':['A+','A-','O+','O-'],'B-':['B-','O-'],'B+':['B+','B-','O+','O-'],'AB-':['AB-','A-','B-','O-'],'AB+':['AB+','AB-','A+','A-','B+','B-','O+','O-']};
function compatibleBloodTypes(donorType,requestedType){return groups.includes(donorType)&&groups.includes(requestedType)&&redCellDonors[requestedType].includes(donorType)}
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
function read(){let s=H.storage.get(KEY),changed=false;if(!s){s=seed();changed=true}if(!Array.isArray(s.voluntary_requests)){s.voluntary_requests=[];changed=true}if(s.usersVersion!==1||!Array.isArray(s.users)){mergeUsers(s);changed=true}if(s.requestVersion!==1){for(const request of s.requests)if(request.urgency==='urgent')request.urgency='high';s.requestVersion=1;changed=true}if(s.coordinationVersion!==1){migrateCoordination(s);s.coordinationVersion=1;changed=true}if(s.fulfillmentVersion!==1){for(const request of s.requests)autoFulfill(s,request,{id:'demo-system',bankId:request.bankId});s.fulfillmentVersion=1;changed=true}if(s.bankNotificationsVersion!==1){for(const response of s.donor_responses){const request=s.requests.find(r=>r.id===response.requestId);if(request)bankResponseNotice(s,response,request,true)}s.bankNotificationsVersion=1;changed=true}if(s.bloodGuidanceVersion!==1){for(const donor of s.users)guideUnknownDonor(s,donor);s.bloodGuidanceVersion=1;changed=true}if(changed)write(s);return s}
function write(s){H.storage.set(KEY,s)}
function actor(roles){const u=H.currentUser();if(!u||!u.verified||u.status!=='active'||!roles.includes(u.role))throw Error('غير مسموح بهذه العملية.');if(u.role==='bank'&&!read().banks.some(b=>b.id===u.bankId&&b.status==='active'))throw Error('المؤسسة غير نشطة.');return u}
function audit(s,u,action,subjectId,details='',bankId=u.bankId||null){s.audit_logs.unshift({id:id('AUD'),actorId:u.id,bankId,action,subjectId,details,at:now()})}
function bankScope(u,bankId){if(u.role==='bank'&&u.bankId!==bankId)throw Error('هذا السجل يتبع مؤسسة أخرى.')}
function nearbyBanks(donor,s=read()){
 const origin=point(donor.city,donor.area);
 return s.banks.filter(b=>b.status==='active').map(b=>({...b,distanceKm:origin&&point(b.city,b.area)?km(origin,point(b.city,b.area)):null})).sort((a,b)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||(a.city===donor.city?-1:0)-(b.city===donor.city?-1:0)||a.name.localeCompare(b.name,'ar'));
}
function guideUnknownDonor(s,donor){
 if(donor.role!=='donor'||donor.bloodType!=='unknown'||s.notifications.some(n=>n.donorId===donor.id&&n.type==='blood_type_guidance'))return;
 const institution=nearbyBanks(donor,s)[0];
 s.notifications.unshift({id:id('N'),donorId:donor.id,type:'blood_type_guidance',recommendedBankId:institution?.id||null,title:'فصيلتك غير مسجلة: اطلب فحص فصيلة الدم',body:`يرجى مراجعة مؤسسة مختصة لفحص فصيلتك وتسجيل النتيجة.${institution?` مؤسسة مقترحة ضمن بيانات العرض: ${institution.name}، ${institution.city}، ${institution.area}.`:''} يمكنك طلب موعد للفحص بعد تأكيد حسابك.`,read:false,at:now()});
}
function activeVoluntaryRequest(donorId,s=read()){return s.voluntary_requests.find(v=>v.donorId===donorId&&['pending','accepted'].includes(v.status)&&s.banks.some(b=>b.id===v.bankId&&b.status==='active'))||null}
function voluntaryScope(s,requestId,u){
 const request=s.voluntary_requests.find(v=>v.id===requestId);if(!request)throw Error('الطلب الطوعي غير موجود.');
 bankScope(u,request.bankId);if(u.role==='donor'&&request.donorId!==u.id)throw Error('هذا الطلب يخص متبرعًا آخر.');return request;
}
function voluntaryVersion(request,expectedVersion){if(Number(expectedVersion)!==request.version)throw Error('تغير الطلب أو الموعد؛ حدّث الصفحة قبل المتابعة.')}
function voluntaryNotice(s,request,title,body,toBank=false){
 const notice={voluntaryId:request.id,type:'voluntary_request',title,body,read:false,at:now()};
 if(toBank)bankNotice(s,request.bankId,{...notice,relatedDonorId:request.donorId});else s.notifications.unshift({id:id('N'),donorId:request.donorId,...notice});
}
function endVoluntary(s,request,status,u,reason,donationId){
 request.status=status;request.version++;request.updatedAt=now();request.closedAt=now();request.closedBy=u.id;request.closeReason=reason;
 if(donationId)request.donationId=donationId;
 if(request.appointment){request.appointment.status=status==='completed'?'completed':'cancelled';request.appointment.version=request.version;request.appointment.updatedAt=now()}
 voluntaryNotice(s,request,status==='completed'?'اكتمل طلبك لدى المؤسسة':'انتهى الطلب الطوعي',reason);
 voluntaryNotice(s,request,status==='completed'?'اكتمل الطلب الطوعي':'انتهى تنسيق الطلب الطوعي',`${s.users.find(d=>d.id===request.donorId)?.name||'متبرع'} · ${reason}`,true);
 audit(s,u,status==='completed'?'إكمال طلب طوعي':'إنهاء طلب طوعي',request.id,reason,request.bankId);
}
function releaseVoluntary(s,predicate,u,reason){for(const request of s.voluntary_requests.filter(v=>['pending','accepted'].includes(v.status)&&predicate(v)))endVoluntary(s,request,'cancelled',u,reason)}
function createVoluntaryRequest(data){
 const u=actor(['donor']),s=read(),institution=s.banks.find(b=>b.id===data.bankId&&b.status==='active'),kind=data.kind||'donation';
 if(!institution)throw Error('اختر مؤسسة نشطة من القائمة.');if(!['donation','blood_type_check'].includes(kind))throw Error('اختر تبرعًا طوعيًا أو فحص فصيلة الدم.');
 if(activeCommitment(u.id,s)||activeVoluntaryRequest(u.id,s))throw Error('لديك تنسيق جارٍ؛ أنهه أو تراجع عنه قبل إرسال طلب آخر.');
 if(kind==='donation'&&donationCooldown(u.id,s).blocked)throw Error('لا يمكنك تقديم طلب تبرع خلال فترة الانتظار. يمكنك طلب فحص الفصيلة فقط.');
 const request={id:id('VOL'),donorId:u.id,bankId:institution.id,kind,status:'pending',version:1,notes:String(data.notes||'').trim().slice(0,400),createdAt:now(),createdOn:today(),updatedAt:now()};
 s.voluntary_requests.unshift(request);voluntaryNotice(s,request,'تم إرسال طلبك للمؤسسة',`تستقبل ${institution.name} طلبك وترد عليه بموعد أو اعتذار.`);voluntaryNotice(s,request,kind==='donation'?'طلب تبرع طوعي جديد':'طلب فحص فصيلة دم',`${u.name} يرغب في ${kind==='donation'?'التبرع طوعًا':'فحص فصيلة الدم'}.`,true);audit(s,u,'تقديم طلب طوعي',request.id,kind,request.bankId);write(s);return request;
}
function scheduleVoluntaryAppointment(requestId,data){
 const u=actor(['bank']),s=read(),request=voluntaryScope(s,requestId,u),donor=s.users.find(d=>d.id===request.donorId);voluntaryVersion(request,data.expectedVersion);
 if(!['pending','accepted'].includes(request.status)||!donor?.verified||donor.status!=='active')throw Error('الطلب أو حساب المتبرع لم يعد متاحًا.');
 if(request.kind==='donation'&&donationCooldown(donor.id,s).blocked)throw Error('المتبرع في فترة انتظار بعد التبرع.');
 if(request.appointment?.status==='accepted')throw Error('الموعد مؤكد بالفعل.');
 const scheduledAt=futureAppointment(data.scheduledAt),previous=request.appointment;request.status='accepted';request.version++;request.updatedAt=now();
 request.appointment={id:previous?.id||id('APT'),version:request.version,status:'proposed',scheduledAt,proposedBy:u.id,updatedAt:now()};
 voluntaryNotice(s,request,'موعد طلبك الطوعي بانتظار موافقتك',`${s.banks.find(b=>b.id===u.bankId).name} · ${new Date(scheduledAt).toLocaleString('ar-PS')}. يمكنك الموافقة أو اقتراح وقت آخر.`);audit(s,u,'قبول طلب طوعي وإرسال موعد',request.id,JSON.stringify({previous,scheduledAt}),request.bankId);write(s);return request;
}
function replyVoluntaryAppointment(requestId,data){
 const u=actor(['donor']),s=read(),request=voluntaryScope(s,requestId,u);voluntaryVersion(request,data.expectedVersion);
 if(request.status!=='accepted'||request.appointment?.status!=='proposed'||!s.banks.some(b=>b.id===request.bankId&&b.status==='active'))throw Error('لا يوجد موعد جديد متاح للرد.');
 if(request.kind==='donation'&&donationCooldown(u.id,s).blocked)throw Error('لا يمكنك قبول موعد تبرع خلال فترة الانتظار.');
 if(!['accepted','change_requested'].includes(data.status))throw Error('اختر قبول الموعد أو طلب وقت آخر.');
 const appointment=request.appointment;
 if(data.status==='accepted')futureAppointment(appointment.scheduledAt);
 else{const requestedAt=futureAppointment(data.requestedAt);if(requestedAt===appointment.scheduledAt)throw Error('اختر وقتًا مختلفًا.');appointment.requestedAt=requestedAt}
 request.version++;request.updatedAt=now();appointment.version=request.version;appointment.status=data.status;appointment.updatedAt=now();
 voluntaryNotice(s,request,data.status==='accepted'?'وافق المتبرع على موعد الطلب الطوعي':'طلب المتبرع تغيير موعد الطلب الطوعي',`${u.name} · ${new Date(data.status==='accepted'?appointment.scheduledAt:appointment.requestedAt).toLocaleString('ar-PS')}`,true);audit(s,u,'الرد على موعد طلب طوعي',request.id,data.status,request.bankId);write(s);return request;
}
function cancelVoluntaryRequest(requestId,data={}){
 const u=actor(['donor','bank']),s=read(),request=voluntaryScope(s,requestId,u);voluntaryVersion(request,data.expectedVersion);
 if(!['pending','accepted'].includes(request.status))throw Error('الطلب منتهٍ بالفعل.');const reason=String(data.reason||'').trim();if(u.role==='bank'&&reason.length<5)throw Error('أدخل سبب الاعتذار من 5 أحرف على الأقل.');
 endVoluntary(s,request,u.role==='bank'&&request.status==='pending'?'declined':'cancelled',u,reason||'تراجع المتبرع عن الطلب.');for(const r of s.requests.filter(r=>r.status==='active'))notifyMatches(s,r);write(s);return request;
}
function completeVoluntaryDonation(requestId,expectedVersion){
 const u=actor(['bank']),s=read(),request=voluntaryScope(s,requestId,u),existing=s.donations.find(d=>d.id===request.donationId);
 if(existing?.status==='confirmed')return existing;voluntaryVersion(request,expectedVersion);
 if(request.status!=='accepted'||request.kind!=='donation'||request.appointment?.status!=='accepted')throw Error('يجب أن يكون طلب تبرع مقبولًا وموعده موافقًا عليه.');
 return recordDonation({donorId:request.donorId,donatedAt:today(),reference:'VOL-'+request.id,voluntaryId:request.id,expectedVersion});
}
function recordBloodType(donorId,data){
 const u=actor(['bank']),s=read(),donor=s.users.find(d=>d.id===donorId&&d.role==='donor'&&d.verified&&d.status==='active');if(!donor)throw Error('اختر متبرعًا مسجلًا ومفعّلًا.');
 if(!groups.includes(data.bloodType))throw Error('اختر الفصيلة المسجلة في نتيجة الفحص.');const reference=String(data.reference||'').trim(),reason=String(data.reason||'').trim();
 if(reference.length<3||reference.length>80||data.examConfirmed!=='on')throw Error('أدخل مرجع الفحص وأكد تسجيل نتيجة فحص فعلية لدى المؤسسة.');
 if(donor.bloodType!=='unknown'&&donor.bloodType!==data.bloodType&&reason.length<5)throw Error('أدخل سبب تصحيح الفصيلة من 5 أحرف على الأقل.');
 let request=null;if(data.voluntaryId){request=voluntaryScope(s,data.voluntaryId,u);voluntaryVersion(request,data.expectedVersion);if(request.donorId!==donor.id||request.status!=='accepted'||request.appointment?.status!=='accepted')throw Error('الطلب أو الموعد غير متاح لتسجيل نتيجة الفحص.')}
 const before={bloodType:donor.bloodType,record:donor.bloodTypeRecord||null};
 if(!request&&donor.bloodType===data.bloodType&&donor.bloodTypeRecord?.bankId===u.bankId&&donor.bloodTypeRecord?.reference===reference)return donor;
 for(const donation of s.donations.filter(d=>d.donorId===donor.id&&!d.bloodType))donation.bloodType=donor.bloodType;
 donor.bloodType=data.bloodType;donor.bloodTypeRecord={bankId:u.bankId,recordedBy:u.id,at:now(),reference};
 for(const notification of s.notifications.filter(n=>n.donorId===donor.id&&n.type==='blood_type_guidance')){notification.read=true;notification.resolvedAt=now()}
 s.notifications.unshift({id:id('N'),donorId:donor.id,type:'blood_type_recorded',voluntaryId:request?.id||null,title:'سجلت المؤسسة فصيلة دمك',body:`سجلت ${s.banks.find(b=>b.id===u.bankId).name} فصيلتك ${data.bloodType} من نتيجة الفحص.`,read:false,at:now()});
 audit(s,u,'تسجيل نتيجة فصيلة الدم',donor.id,JSON.stringify({before,after:donor.bloodTypeRecord,bloodType:donor.bloodType,reason}),u.bankId);
 if(request?.kind==='blood_type_check')endVoluntary(s,request,'completed',u,'تم إجراء الفحص وتسجيل الفصيلة. لا يُحتسب هذا تبرعًا.');
 for(const r of s.requests.filter(r=>r.status==='active'))notifyMatches(s,r);write(s);return donor;
}
function bankNotice(s,bankId,data){const notice={id:id('N'),bankId,...data,read:false,at:data.at||now()};s.notifications.unshift(notice);return notice}
function bankResponseNotice(s,response,request,historical=false){
 if(!['accepted','declined','withdrawn'].includes(response.status))return;
 const eventKey=`response:${response.id}:${response.notificationRevision||0}`;if(s.notifications.some(n=>n.bankId===request.bankId&&n.eventKey===eventKey))return;
 const donor=s.users.find(d=>d.id===response.donorId),titles={accepted:'وافق متبرع على الحملة',declined:'اعتذر متبرع عن الحملة',withdrawn:'تراجع متبرع عن استجابته'};
 bankNotice(s,request.bankId,{type:'donor_response',eventKey,requestId:request.id,responseId:response.id,relatedDonorId:response.donorId,title:titles[response.status],body:`${donor?.name||'متبرع مسجل'} · حملة ${request.bloodType}.${historical&&response.releasedAt?' انتهى تنسيق هذه الاستجابة.':''}`,at:response.at||now()});
}
function autoFulfill(s,request,u){
 if(!request||request.status!=='active'||s.donations.filter(d=>d.requestId===request.id&&d.status==='confirmed').length<request.units)return false;
 request.status='fulfilled';request.closedAt=now();request.closedBy=u.id;request.autoClosed=true;request.closeReason='اكتمل عدد التبرعات المؤكدة المطلوب للحملة؛ أُغلقت تلقائيًا.';
 releaseCoordination(s,response=>response.requestId===request.id,'request_closed',u.id);
 const recipients=new Set([...s.donor_responses.filter(r=>r.requestId===request.id).map(r=>r.donorId),...s.notifications.filter(n=>n.requestId===request.id&&n.donorId).map(n=>n.donorId)]);
 for(const donorId of recipients)s.notifications.unshift({id:id('N'),donorId,requestId:request.id,title:'اكتملت الحملة وأُغلقت',body:request.closeReason,read:false,at:now()});
 bankNotice(s,request.bankId,{type:'campaign_fulfilled',requestId:request.id,title:'اكتملت الحملة وأُغلقت تلقائيًا',body:`حملة ${request.bloodType} · اكتمل العدد المطلوب: ${request.units} تبرعات مؤكدة.`});
 audit(s,u,'إغلاق الحملة تلقائيًا بعد اكتمال التبرعات',request.id,request.closeReason,request.bankId);return true;
}
// Calendar months, clamped to the last day of the target month (not a fixed 90 days).
function addMonths(day,count=3){const [y,m,d]=day.split('-').map(Number),target=new Date(Date.UTC(y,m-1+count,1));target.setUTCDate(Math.min(d,new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate()));return target.toISOString().slice(0,10)}
function donationCooldown(donorId,s=read(),asOf=today()){
 const declared=s.users.find(d=>d.id===donorId)?.lastDonation;
 const lastDonation=[...s.donations.filter(d=>d.donorId===donorId&&d.status==='confirmed').map(d=>d.donatedAt),...(declared&&H.validPastDate(declared)?[declared]:[])].sort().at(-1)||null;
 const nextAllowedDate=lastDonation?addMonths(lastDonation):null,remainingDays=nextAllowedDate?Math.max(0,Math.round((Date.parse(nextAllowedDate+'T00:00:00Z')-Date.parse(asOf+'T00:00:00Z'))/86400000)):0;
 return {lastDonation,nextAllowedDate,remainingDays,blocked:remainingDays>0};
}
function checkDonationInterval(s,donorId,day,excludeId){
 const conflict=s.donations.find(d=>d.id!==excludeId&&d.donorId===donorId&&d.status==='confirmed'&&(d.donatedAt<=day?day<addMonths(d.donatedAt):d.donatedAt<addMonths(day)));
 if(conflict)throw Error('لا يمكن توثيق تبرع آخر قبل مرور 3 أشهر بين التبرعات المؤكدة.');
}
function coordination(s,responseId,u){
 const response=s.donor_responses.find(r=>r.id===responseId),request=s.requests.find(r=>r.id===response?.requestId),donor=s.users.find(d=>d.id===response?.donorId);
 if(!response||!request)throw Error('الاستجابة غير موجودة.');
 bankScope(u,request.bankId);if(u.role==='donor'&&response.donorId!==u.id)throw Error('هذه الاستجابة تخص متبرعًا آخر.');
 if(response.status!=='accepted'||response.releasedAt||request.status!=='active'||!s.banks.some(b=>b.id===request.bankId&&b.status==='active')||!donor?.verified||donor.status!=='active')throw Error('انتهى التنسيق أو لم يعد متاحًا.');
 if(donationCooldown(donor.id,s).blocked)throw Error('لا يمكن تنسيق تبرع جديد قبل مرور 3 أشهر على آخر تبرع مسجل أو معلن.');
 return {response,request,donor};
}
function appointmentVersion(response,version){if(Number(version)!==(response.appointment?.version||response.appointmentRevision||0))throw Error('تغير الموعد؛ حدّث الصفحة وراجع آخر موعد قبل المتابعة.')}
function futureAppointment(value){
 const date=new Date(value),day=String(value).slice(0,10),calendar=new Date(day+'T12:00:00Z');
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(calendar.getTime())||calendar.toISOString().slice(0,10)!==day||!Number.isFinite(date.getTime())||date.getTime()<=Date.now())throw Error('اختر تاريخًا ووقتًا صحيحين في المستقبل.');
 return date.toISOString();
}
function appointmentNotice(s,response,request,u,title,body,toBank=false){s.notifications.unshift({id:id('N'),...(toBank?{bankId:request.bankId,type:'appointment_reply',relatedDonorId:response.donorId}:{donorId:response.donorId}),responseId:response.id,requestId:request.id,title,body,read:false,at:now()});audit(s,u,title,response.id,body,request.bankId)}
function scheduleAppointment(responseId,data){
 const u=actor(['bank']),s=read(),{response,request}=coordination(s,responseId,u);appointmentVersion(response,data.expectedVersion);
 const scheduledAt=futureAppointment(data.scheduledAt),previous=response.appointment;
 if(previous?.status==='accepted')throw Error('الموعد مؤكد بالفعل.');
 response.appointmentRevision=(previous?.version||response.appointmentRevision||0)+1;
 response.appointment={id:previous?.id||id('APT'),version:response.appointmentRevision,status:'proposed',scheduledAt,proposedBy:u.id,updatedAt:now()};
 appointmentNotice(s,response,request,u,'موعد تبرع بانتظار موافقتك',`اقترحت المؤسسة موعدًا: ${new Date(scheduledAt).toLocaleString('ar-PS')}. يمكنك قبوله أو طلب وقت آخر.`);
 s.audit_logs[0].details+=` | السابق: ${JSON.stringify(previous||null)} | الجديد: ${scheduledAt}`;
 write(s);return response.appointment;
}
function replyAppointment(responseId,data){
 const u=actor(['donor']),s=read(),{response,request}=coordination(s,responseId,u);appointmentVersion(response,data.expectedVersion);
 const appointment=response.appointment;if(!appointment||appointment.status!=='proposed')throw Error('لا يوجد موعد جديد بانتظار ردك.');
 if(!['accepted','change_requested'].includes(data.status))throw Error('اختر قبول الموعد أو طلب تغييره.');
 if(data.status==='accepted'){futureAppointment(appointment.scheduledAt);appointment.status='accepted'}
 else{appointment.requestedAt=futureAppointment(data.requestedAt);if(appointment.requestedAt===appointment.scheduledAt)throw Error('اختر وقتًا مختلفًا عن الموعد المقترح.');appointment.status='change_requested'}
 appointment.version++;response.appointmentRevision=appointment.version;appointment.updatedAt=now();appointment.respondedBy=u.id;
 appointmentNotice(s,response,request,u,data.status==='accepted'?'وافق المتبرع على الموعد':'طلب المتبرع تغيير الموعد',`${u.name} · ${new Date(data.status==='accepted'?appointment.scheduledAt:appointment.requestedAt).toLocaleString('ar-PS')}`,true);
 write(s);return appointment;
}
function completeResponseDonation(responseId,expectedVersion){
 const u=actor(['bank']),s=read(),response=s.donor_responses.find(r=>r.id===responseId),request=s.requests.find(r=>r.id===response?.requestId);
 if(!response||!request)throw Error('الاستجابة غير موجودة.');bankScope(u,request.bankId);
 const existing=s.donations.find(d=>d.id===response.donationId);if(existing?.status==='confirmed')return existing;
 coordination(s,responseId,u);appointmentVersion(response,expectedVersion);
 const appointment=response.appointment;if(appointment?.status!=='accepted')throw Error('يجب أن يوافق المتبرع على الموعد أولًا.');
 return recordDonation({donorId:response.donorId,requestId:request.id,donatedAt:today(),reference:'APPT-'+appointment.id,responseId,expectedVersion});
}
function activeCommitment(donorId,s=read()){
 return s.donor_responses.filter(response=>response.donorId===donorId&&response.status==='accepted'&&!response.releasedAt&&s.requests.some(r=>r.id===response.requestId&&r.status==='active'&&s.banks.some(b=>b.id===r.bankId&&b.status==='active'))).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0]||null;
}
function releaseResponse(response,reason,actorId,donationId){if(response.appointment){response.appointment.status=reason==='donation_confirmed'?'completed':'cancelled';response.appointment.version++;response.appointmentRevision=response.appointment.version;response.appointment.updatedAt=now()}response.releasedAt=now();response.releaseReason=reason;response.releasedBy=actorId;if(donationId)response.donationId=donationId}
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
function eligibleDonor(d,s=read(),requestId=null){
 const commitment=activeCommitment(d.id,s);
 return Boolean(!activeVoluntaryRequest(d.id,s)&&d.role==='donor'&&d.status==='active'&&d.verified&&d.available!==false&&d.visibleToBanks!==false&&groups.includes(d.bloodType)&&!donationCooldown(d.id,s).blocked&&(!commitment||commitment.requestId===requestId));
}
function matches(d,r,s=read()){return Boolean(r.status==='active'&&s.banks.some(b=>b.id===r.bankId&&b.status==='active')&&eligibleDonor(d,s,r.id)&&compatibleBloodTypes(d.bloodType,r.bloodType)&&!s.donor_responses.some(response=>response.donorId===d.id&&response.requestId===r.id&&response.releaseReason==='donation_confirmed'))}
function inviteDonor(requestId,donorId){
 const u=actor(['bank']),s=read(),r=s.requests.find(r=>r.id===requestId),d=s.users.find(d=>d.id===donorId);
 if(!r)throw Error('الحملة غير موجودة.');bankScope(u,r.bankId);
 if(r.status!=='active')throw Error('الحملة مغلقة ولا تقبل دعوات جديدة.');
 if(!d||!matches(d,r,s))throw Error('المتبرع غير متاح للدعوة حاليًا أو خارج الترشيح الأولي لهذه الحملة.');
 if(s.donor_responses.some(response=>response.donorId===donorId&&response.requestId===requestId&&response.status==='accepted'&&!response.releasedAt))throw Error('المتبرع قبل هذه الحملة بالفعل.');
 const existing=s.notifications.find(n=>n.donorId===donorId&&n.requestId===requestId&&n.type==='donation_invitation');if(existing)return existing;
 const notification={id:id('N'),donorId,requestId,type:'donation_invitation',invitedBy:u.id,title:'دعوة تبرع من '+s.banks.find(b=>b.id===u.bankId).name,body:`تدعوك المؤسسة للاستجابة لحملة فصيلة ${r.bloodType}. فصيلتك المعلنة ${d.bloodType} مرشحة أوليًا؛ يمكنك القبول أو الاعتذار، ويُحدد الموعد بعد قبولك.`,read:false,at:now()};
 s.notifications.unshift(notification);audit(s,u,'إرسال دعوة تبرع',requestId,donorId);write(s);return notification;
}
function notifyMatches(s,r){for(const d of s.users.filter(d=>matches(d,r,s))){if(s.notifications.some(n=>n.donorId===d.id&&n.requestId===r.id))continue;s.notifications.unshift({id:id('N'),donorId:d.id,requestId:r.id,title:`نداء جديد لفصيلة ${r.bloodType}`,body:`طلب من ${s.banks.find(b=>b.id===r.bankId)?.name}، ترشيح تنسيقي أولي.`,read:d.notifyEnabled===false,at:now()})}}
function syncMatches(){const s=read();s.requests.filter(r=>r.status==='active').forEach(r=>notifyMatches(s,r));write(s)}
function requestFields(data,fallbackRadius=15){if(!groups.includes(data.bloodType))throw Error('اختر فصيلة دم معروفة.');const units=Number(data.units),radius=Number(data.radius??fallbackRadius),urgency=data.urgency==='urgent'?'high':data.urgency;if(!Number.isInteger(units)||units<1||units>100||!Number.isFinite(radius)||radius<1||radius>100||!['normal','high','critical'].includes(urgency))throw Error('تحقق من الوحدات (1–100) والنطاق (1–100 كم) والأولوية.');return{bloodType:data.bloodType,units,radius,urgency,notes:String(data.notes||'').slice(0,400)}}
function createRequest(data){const u=actor(['bank']),s=read(),fields=requestFields(data),b=s.banks.find(b=>b.id===u.bankId);if(!point(b.city,b.area))throw Error('حدّد منطقة المؤسسة من خريطة المحاكاة قبل إنشاء الطلب.');const r={id:id('REQ'),bankId:u.bankId,...fields,status:'active',createdBy:u.id,createdAt:now()};s.requests.unshift(r);notifyMatches(s,r);audit(s,u,'إنشاء طلب دم',r.id);write(s);return r}
function editRequest(requestId,data){const u=actor(['bank']),s=read(),r=s.requests.find(request=>request.id===requestId);if(!r)throw Error('الطلب غير موجود.');bankScope(u,r.bankId);if(r.status!=='active')throw Error('لا يمكن تعديل طلب مغلق.');const fields=requestFields(data,r.radius),reason=String(data.reason||'').trim();if(reason.length<5)throw Error('سبب التعديل مطلوب من 5 أحرف على الأقل.');const confirmed=s.donations.filter(donation=>donation.requestId===r.id&&donation.status==='confirmed');if(fields.units<confirmed.length)throw Error('عدد الوحدات أقل من التبرعات المؤكدة المرتبطة.');if(fields.bloodType!==r.bloodType&&(confirmed.length||s.donor_responses.some(response=>response.requestId===r.id&&response.status==='accepted'&&!response.releasedAt)))throw Error('لا يمكن تغيير الفصيلة بعد استجابة جارية أو توثيق تبرع؛ أغلق الطلب وأنشئ طلبًا آخر.');const before={bloodType:r.bloodType,units:r.units,radius:r.radius,urgency:r.urgency,notes:r.notes};Object.assign(r,fields,{updatedAt:now(),updatedBy:u.id});if(!autoFulfill(s,r,u))notifyMatches(s,r);audit(s,u,'تعديل طلب دم',r.id,`${reason} | قبل: ${JSON.stringify(before)} | بعد: ${JSON.stringify(fields)}`);write(s);return r}
function respond(requestId,status){
 const u=actor(['donor']),s=read(),r=s.requests.find(r=>r.id===requestId),commitment=activeCommitment(u.id,s);
 let response=s.donor_responses.find(x=>x.requestId===requestId&&x.donorId===u.id);
 if(!['accepted','declined','withdrawn'].includes(status)||!r||r.status!=='active'||!s.banks.some(b=>b.id===r.bankId&&b.status==='active'))throw Error('الطلب مغلق أو لم يعد ضمن ترشيحاتك الأولية.');
 if(status==='accepted'&&activeVoluntaryRequest(u.id,s))throw Error('لديك طلب طوعي جارٍ. أنهه أو تراجع عنه قبل قبول حملة.');
 if(status==='accepted'&&commitment&&commitment.requestId!==requestId)throw Error('لديك استجابة جارية لطلب آخر. تراجع عنها أولًا قبل قبول طلب جديد.');
 if(status==='accepted'&&donationCooldown(u.id,s).blocked)throw Error('لا يمكنك التبرع قبل مرور 3 أشهر على آخر تبرع مسجل أو معلن.');
 const withdrawing=response?.status==='accepted'&&!response.releasedAt&&status!=='accepted';
 if(status==='withdrawn'&&!withdrawing)throw Error('لا توجد استجابة جارية للتراجع عنها.');
 if(response?.releaseReason==='donation_confirmed'||s.donations.some(d=>d.donorId===u.id&&d.requestId===requestId&&d.status==='confirmed'))throw Error('انتهى تنسيقك لهذا الطلب بعد توثيق التبرع.');
 if(!withdrawing&&!matches(u,r,s))throw Error('الطلب مغلق أو لم يعد ضمن ترشيحاتك الأولية.');
 if(response?.status===status&&(status==='declined'||!response.releasedAt))return response;
 if(!response)s.donor_responses.unshift(response={id:id('RES'),requestId,donorId:u.id});
 response.status=status;response.at=now();response.notificationRevision=(response.notificationRevision||0)+1;
 if(status==='accepted'){response.acceptedOn=today();delete response.appointment;delete response.releasedAt;delete response.releaseReason;delete response.releasedBy;delete response.donationId}
 else releaseResponse(response,status,u.id);
 for(const notification of s.notifications.filter(n=>n.donorId===u.id&&n.requestId===requestId))notification.read=true;
 bankResponseNotice(s,response,r);
 audit(s,u,status==='accepted'?'قبول طلب':withdrawing?'التراجع عن الاستجابة':'الاعتذار عن طلب',r.id,'',r.bankId);write(s);syncMatches();return response;
}
function closeRequest(requestId,status,reason){const u=actor(['bank','admin']),s=read(),r=s.requests.find(r=>r.id===requestId);if(!r)throw Error('الطلب غير موجود.');bankScope(u,r.bankId);if(u.role==='admin'&&status!=='cancelled')throw Error('إجراء المدير هو إيقاف الطلب مع السبب فقط؛ الاستيفاء من صلاحية المؤسسة.');if(r.status!=='active'||!['fulfilled','cancelled'].includes(status))throw Error('الطلب مغلق بالفعل.');if(!String(reason||'').trim())throw Error('سبب الإغلاق مطلوب.');if(status==='fulfilled'&&s.donations.filter(d=>d.requestId===r.id&&d.status==='confirmed').length<r.units)throw Error('لا يمكن إغلاق الطلب كمستوفى قبل توثيق عدد الوحدات المطلوبة؛ الاستجابات ليست تبرعات.');r.status=status;r.closedAt=now();r.closedBy=u.id;r.closeReason=String(reason).trim();releaseCoordination(s,response=>response.requestId===r.id,'request_closed',u.id);for(const donorId of new Set(s.notifications.filter(n=>n.donorId&&n.requestId===r.id).map(n=>n.donorId))){s.notifications.unshift({id:id('N'),donorId,requestId:r.id,title:'تم إغلاق طلب الدم',body:r.closeReason,read:false,at:now()})}bankNotice(s,r.bankId,{type:'campaign_closed',requestId:r.id,title:u.role==='admin'?'أوقفت الإدارة الحملة':'أُغلقت الحملة',body:r.closeReason});audit(s,u,u.role==='admin'?'إيقاف إداري للطلب':'إغلاق طلب: '+status,r.id,r.closeReason,r.bankId);write(s);syncMatches()}
function donationNotification(s,donation,title,body){s.notifications.unshift({id:id('N'),donorId:donation.donorId,requestId:donation.requestId,donationId:donation.id,title,body,read:false,at:now()})}
function awardDonation(s,donation,u){if(s.point_transactions.some(transaction=>transaction.donationId===donation.id&&transaction.type==='award'))return;const request=s.requests.find(r=>r.id===donation.requestId);if(donation.requestId&&(!request||request.bankId!==donation.bankId||request.status!=='active'||s.donations.filter(d=>d.requestId===request.id&&d.status==='confirmed').length>=request.units))throw Error('الحملة مغلقة أو اكتمل عدد التبرعات المطلوب.');checkDonationInterval(s,donation.donorId,donation.donatedAt,donation.id);const donor=s.users.find(d=>d.id===donation.donorId);if(!groups.includes(donor?.bloodType))throw Error('سجّل نتيجة فصيلة دم المتبرع بعد الفحص أولًا.');if(!groups.includes(donation.bloodType))donation.bloodType=donor.bloodType;donation.status='confirmed';donation.confirmedBy=u.id;donation.confirmedAt=now();s.point_transactions.unshift({id:id('PT'),donorId:donation.donorId,bankId:u.bankId,donationId:donation.id,delta:5,type:'award',reason:'تبرع فعلي مؤكد — محاكاة',actorId:u.id,at:now()});releaseCoordination(s,response=>response.donorId===donation.donorId&&(response.requestId===donation.requestId||donation.donatedAt>=responseDay(response)),'donation_confirmed',u.id,donation.id);for(const voluntary of s.voluntary_requests.filter(v=>v.donorId===donation.donorId&&['pending','accepted'].includes(v.status)&&donation.donatedAt>=v.createdOn)){if(voluntary.kind==='donation'&&voluntary.bankId===donation.bankId)endVoluntary(s,voluntary,'completed',u,'تم توثيق التبرع الطوعي المكتمل.',donation.id);else endVoluntary(s,voluntary,'cancelled',u,'انتهى التنسيق بعد توثيق تبرع للمتبرع.')}donationNotification(s,donation,'تم توثيق تبرعك · +5 نقاط',`وثّقت ${s.banks.find(b=>b.id===u.bankId)?.name} تبرعًا مكتملًا في ${donation.donatedAt}. أضيفت 5 نقاط معنوية. يمكنك الاستجابة للتبرع مجددًا ابتداءً من ${addMonths(donation.donatedAt)} وفق فترة الانتظار في المنصة.`);audit(s,u,'توثيق تبرع وإضافة 5 نقاط',donation.id,donation.reference);autoFulfill(s,request,u)}
function confirmDonation(donationId){const u=actor(['bank']),s=read(),donation=s.donations.find(candidate=>candidate.id===donationId);if(!donation)throw Error('التبرع غير موجود.');bankScope(u,donation.bankId);if(donation.status==='corrected')throw Error('لا يمكن إعادة تأكيد توثيق مصحح.');if(donation.status==='confirmed')return donation;if(donation.status!=='recorded')throw Error('حالة التبرع غير صالحة للتأكيد.');awardDonation(s,donation,u);write(s);return donation}
function recordDonation(data){const u=actor(['bank']),s=read(),d=s.users.find(d=>d.id===data.donorId&&d.role==='donor'&&d.verified&&d.status==='active');if(!d)throw Error('اختر حساب متبرع مفعّل.');if(!groups.includes(d.bloodType))throw Error('سجّل نتيجة فصيلة دم المتبرع بعد الفحص أولًا.');const reference=String(data.reference||'').trim();if(reference.length<3)throw Error('أدخل مرجعًا تجريبيًا فريدًا (3 أحرف على الأقل).');if(!H.validPastDate(data.donatedAt))throw Error('أدخل تاريخًا صحيحًا لا يقع في المستقبل.');if(s.donations.some(x=>(x.bankId===u.bankId&&x.reference.toLowerCase()===reference.toLowerCase())||(x.donorId===d.id&&x.donatedAt===data.donatedAt)))throw Error('يوجد توثيق لهذا المرجع أو للمتبرع في اليوم نفسه؛ تم منع التكرار.');let request=null;if(data.requestId){request=s.requests.find(r=>r.id===data.requestId&&r.bankId===u.bankId&&r.status==='active');if(!request)throw Error('اختر طلبًا نشطًا من مؤسستك.');if(!compatibleBloodTypes(d.bloodType,request.bloodType))throw Error('الفصيلة المعلنة خارج الترشيح الأولي للحملة؛ راجع الاختيار والفحص لدى المؤسسة.');}
 checkDonationInterval(s,d.id,data.donatedAt);
 if(data.voluntaryId&&data.requestId)throw Error('الطلب الطوعي مستقل عن الحملات.');
 if(data.voluntaryId){const v=voluntaryScope(s,data.voluntaryId,u);voluntaryVersion(v,data.expectedVersion);if(v.donorId!==d.id||v.kind!=='donation'||v.status!=='accepted'||v.appointment?.status!=='accepted'||data.donatedAt<v.createdOn)throw Error('الطلب الطوعي غير متاح لتوثيق التبرع.');if(donationCooldown(d.id,s).blocked)throw Error('المتبرع في فترة انتظار بعد التبرع.');}
 if(data.responseId){const {response}=coordination(s,data.responseId,u);appointmentVersion(response,data.expectedVersion);if(response.donorId!==d.id||response.requestId!==request?.id||response.appointment?.status!=='accepted')throw Error('الموعد غير متاح لتأكيد التبرع.')}
 const donation={id:id('DON'),donorId:d.id,bankId:u.bankId,requestId:request?.id||null,voluntaryId:data.voluntaryId||null,donatedAt:data.donatedAt,reference,bloodType:d.bloodType,status:'recorded',recordedBy:u.id,recordedAt:now()};s.donations.unshift(donation);awardDonation(s,donation,u);write(s);return donation;
}
function correctDonation(donationId,reason){const u=actor(['admin']),s=read(),d=s.donations.find(x=>x.id===donationId);if(!d)throw Error('التبرع غير موجود.');if(d.status!=='confirmed')throw Error('تم تصحيح هذا التبرع مسبقًا.');if(String(reason||'').trim().length<5)throw Error('أدخل سبب التصحيح من 5 أحرف على الأقل.');d.status='corrected';d.correctedBy=u.id;d.correctedAt=now();d.correctionReason=String(reason).trim();s.point_transactions.unshift({id:id('PT'),donorId:d.donorId,bankId:d.bankId,donationId:d.id,delta:-5,type:'correction',reason:d.correctionReason,actorId:u.id,at:now()});donationNotification(s,d,'تصحيح توثيق تبرع · -5 نقاط',`أضافت الإدارة حركة تصحيح مقابلة دون حذف السجل الأصلي. السبب: ${d.correctionReason}`);bankNotice(s,d.bankId,{type:'donation_correction',requestId:d.requestId,donationId:d.id,title:'صححت الإدارة توثيق تبرع',body:`${s.users.find(user=>user.id===d.donorId)?.name||'متبرع مسجل'} · ${d.reference} · السبب: ${d.correctionReason}`});audit(s,u,'تصحيح توثيق وعكس 5 نقاط',d.id,d.correctionReason,d.bankId);write(s)}
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
 user.status='pending_verification';user.verified=false;const s=read();uniqueContact(data,null,s);putUser(s,user);guideUnknownDonor(s,user);audit(s,{id:user.id},'إنشاء حساب متبرع بانتظار التحقق',user.id);write(s);return user;
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
function toggleUser(userId,reason){const u=actor(['bank','admin']),s=read(),target=s.users.find(x=>x.id===userId);if(!target||target.id===u.id||target.role==='admin')throw Error('لا يمكن تعديل حالة هذا الحساب.');if(u.role==='bank'&&(u.staffType!=='representative'||target.bankId!==u.bankId||target.staffType!=='employee'))throw Error('غير مسموح بإدارة هذا الحساب.');if(!String(reason||'').trim())throw Error('السبب مطلوب.');target.status=target.status==='suspended'?(target.verified?'active':target.activationPending?'pending_activation':'pending_verification'):'suspended';if(target.role==='donor'&&target.status==='suspended'){releaseCoordination(s,response=>response.donorId===target.id,'account_suspended',u.id);releaseVoluntary(s,v=>v.donorId===target.id,u,'أُوقف حساب المتبرع.');}audit(s,u,'تغيير حالة حساب إلى '+target.status,target.id,reason,target.bankId||null);write(s)}
function toggleBank(bankId,reason){const u=actor(['admin']),s=read(),b=s.banks.find(b=>b.id===bankId);if(!b||!String(reason||'').trim())throw Error('المؤسسة والسبب مطلوبان.');b.status=b.status==='active'?'suspended':'active';if(b.status==='suspended'){releaseCoordination(s,response=>s.requests.some(r=>r.id===response.requestId&&r.bankId===b.id),'bank_suspended',u.id);releaseVoluntary(s,v=>v.bankId===b.id,u,'المؤسسة غير نشطة حاليًا.');}audit(s,u,'تغيير حالة مؤسسة إلى '+b.status,b.id,reason,b.id);write(s);syncMatches()}
function saveProfile(data){
 const u=actor(['donor','bank','admin']),contact=uniqueContact(data,u.id);
 if(String(data.name||'').trim().length<2)throw Error('الاسم مطلوب.');
 if(u.role==='donor'&&(![...groups,'unknown'].includes(data.bloodType)||!String(data.city||'').trim()||!String(data.area||'').trim()))throw Error('الفصيلة والمدينة والمنطقة مطلوبة.');
 if(data.lastDonation&&!H.validPastDate(data.lastDonation))throw Error('تاريخ آخر تبرع غير صالح.');
 const changedEmail=contact.email!==u.email,updated={...u,name:data.name.trim(),...contact},s=read();
 if(u.role==='donor'){
  if(u.bloodTypeRecord&&data.bloodType!==u.bloodType)throw Error('الفصيلة المسجلة لدى المؤسسة تُصحح بواسطة موظف مختص مع تسجيل السبب.');
  // Preserve older prototype records before the profile's declared group changes.
  for(const donation of s.donations.filter(d=>d.donorId===u.id&&!d.bloodType))donation.bloodType=u.bloodType;
  Object.assign(updated,{bloodType:data.bloodType,city:data.city.trim(),area:data.area.trim(),available:data.available==='on',notifyEnabled:data.notifyEnabled==='on',lastDonation:data.lastDonation||null,visibleToBanks:data.visibilityControl==='on'?data.visibleToBanks==='on':u.visibleToBanks!==false});
 }
 if(changedEmail){updated.verified=false;updated.status='pending_verification';H.storage.sessionSet('pending_verify_id',u.id);H.storage.sessionSet('verify_'+u.id,{code:H.randomCode(),expiresAt:Date.now()+300000,resendAt:Date.now()+60000})}
 putUser(s,updated);guideUnknownDonor(s,updated);audit(s,u,'تحديث الملف الشخصي',u.id,changedEmail?'تغيير بريد مع إعادة تأكيد تجريبية':'');write(s);syncMatches();return changedEmail;
}
function markRead(notificationId){
 const u=actor(['donor','bank']),s=read();
 if(u.role==='bank'){
  const notifications=s.notifications.filter(n=>n.bankId===u.bankId&&!n.donorId);
  if(notificationId&&!notifications.some(n=>n.id===notificationId))throw Error('الإشعار غير متاح لحساب مؤسستك.');
  notifications.filter(n=>!notificationId||n.id===notificationId).forEach(n=>n.read=true);
 }else{
  const commitment=activeCommitment(u.id,s);s.notifications.filter(n=>n.donorId===u.id&&(!commitment||!n.requestId||n.donationId||n.requestId===commitment.requestId)&&(!notificationId||n.id===notificationId)).forEach(n=>n.read=true);
 }
 write(s);
}
function reset(){actor(['admin']);for(const k of Object.keys(localStorage))if(k.startsWith(H.prefix))localStorage.removeItem(k);for(const k of Object.keys(sessionStorage))if(k.startsWith(H.prefix))sessionStorage.removeItem(k)}
window.HayatData={read,allUsers,saveUser,getSession,setSession,clearSession,registerDonor,verifyAccount,groups,locations,point,km,nearbyBanks,activeVoluntaryRequest,createVoluntaryRequest,scheduleVoluntaryAppointment,replyVoluntaryAppointment,cancelVoluntaryRequest,completeVoluntaryDonation,recordBloodType,compatibleBloodTypes,eligibleDonor,inviteDonor,addMonths,donationCooldown,scheduleAppointment,replyAppointment,completeResponseDonation,matches,activeCommitment,syncMatches,createRequest,editRequest,respond,closeRequest,recordDonation,confirmDonation,correctDonation,points,createBank,createStaff,updateBank,toggleUser,toggleBank,saveProfile,markRead,reset,today};
H.Data=window.HayatData;
if(typeof module!=='undefined'&&module.exports)module.exports=window.HayatData;
read();
})();
