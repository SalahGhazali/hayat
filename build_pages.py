from pathlib import Path
P=Path(__file__).resolve().parent

def wrap(title,body,page='',nested=False,scripts=()):
 root='../' if nested else './'
 sources='\n'.join(f'<script defer src="{root}assets/js/{s}.js"></script>' for s in scripts)
 return f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#FFFFFF">
  <meta name="description" content="حياة — منصة ذكية لتنسيق التبرع بالدم وربط المتبرعين ببنوك الدم.">
  <link rel="icon" type="image/png" href="{root}assets/img/hayat-logo-symbol.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
  <link rel="stylesheet" href="{root}assets/css/styles.css">
  <title>{title} | حياة – Hayat</title>
  <script defer src="{root}assets/js/core.js"></script>
  {sources}
</head>
<body data-page="{page}" data-root="{root}">
<div id="site-header"></div>
<main id="main-content">{body}</main>
<div id="site-footer"></div>
<div id="toast-container" class="toast-container" aria-live="polite"></div>
</body>
</html>'''

def put(name,title,body,page='',nested=False,scripts=()):
 (P/name).write_text(wrap(title,body,page,nested,scripts),encoding='utf-8')

def f(name,label,placeholder='',type='text',required=False,extra='',help_text=''):
 field=f'<input class="field" type="{type}" name="{name}" id="{name}" placeholder="{placeholder}" {"required" if required else ""} {extra}>'
 if type=='password':
  field=f'<div class="password-field">{field}<button type="button" class="password-toggle" data-password-toggle="{name}" aria-label="إظهار كلمة المرور"><i class="ti ti-eye" aria-hidden="true"></i></button></div>'
 return f'<div class="form-group"><label for="{name}">{label}</label>{field}<span class="field-error" data-error-for="{name}" aria-live="polite"></span>{f"<div class=\"field-note\">{help_text}</div>" if help_text else ""}</div>'

home='''
<section class="hero"><div class="container hero-grid"><div class="hero-content">
<span class="eyebrow"><span class="dot"></span> معًا نجعل التبرع بالدم أكثر تنظيمًا</span>
<h1>عطاؤك حياة، <em>وتواصلك يصنع الفرق.</em></h1>
<p class="hero-lead">منصة حياة تقرّب المسافة بين المتبرعين وبنوك الدم، وتنظّم طلبات التبرع والاستجابة لها بطريقة واضحة وسريعة، خصوصًا في الأوقات الطارئة.</p>
<div class="hero-actions"><a class="btn btn-primary" href="register.html">انضم كمتبرع <i class="ti ti-arrow-left icon-inline" aria-hidden="true"></i></a><a class="btn btn-outline" href="#how"><i class="ti ti-player-play icon-inline" aria-hidden="true"></i> اكتشف كيف تعمل</a></div>
<div class="hero-attributes"><span><i class="ti ti-shield-check" aria-hidden="true"></i> حسابات مؤسسات معتمدة</span><span><i class="ti ti-map-pin" aria-hidden="true"></i> تنسيق بحسب المنطقة</span><span><i class="ti ti-device-mobile" aria-hidden="true"></i> تصميم مناسب للجوال</span></div>
</div><div class="hero-art"><div class="hero-panel"><img class="hero-logo" src="assets/img/hayat-logo-wordmark.png" alt="شعار حياة المعتمد: قطرة الدم والقلب واليد الداعمة مع اسم حياة"></div>
<div class="floating-card float-top"><span class="blood-pill">O+</span><span><strong>طلب تبرع تجريبي</strong><small>حالة جديدة • بنك دم افتراضي</small></span></div>
<div class="floating-card float-bottom"><span class="icon-circle teal" style="width:43px;height:43px"><i class="ti ti-circle-check" aria-hidden="true"></i></span><span><strong>استجابة أكثر تنظيمًا</strong><small>تواصل واضح مع بنك الدم</small></span></div></div></div></section>
<section id="features" class="section section-soft"><div class="container"><div class="section-top"><span class="overline">لماذا حياة؟</span><h2>كل ما يلزم لتنسيق التبرع، في مكان واحد</h2><p>نركّز على الوصول إلى المتبرع المناسب وتنظيم التواصل مع المؤسسات، مع بقاء الفحوصات والقرارات الطبية لدى المختصين.</p></div><div class="features-grid">
<article class="feature-card"><span class="icon-circle"><i class="ti ti-bell-ringing" aria-hidden="true"></i></span><h3>طلبات واضحة وتنبيهات موجهة</h3><p>تتابع احتياجات بنوك الدم وتستجيب للطلبات التي تصلك عبر حسابك.</p></article>
<article class="feature-card"><span class="icon-circle teal"><i class="ti ti-map-pin-search" aria-hidden="true"></i></span><h3>تنسيق بحسب الموقع والفصيلة</h3><p>تساعد معلومات المنطقة والفصيلة على توجيه الطلبات للمرشحين المناسبين مبدئيًا.</p></article>
<article class="feature-card"><span class="icon-circle"><i class="ti ti-award" aria-hidden="true"></i></span><h3>سجل تبرعات ونقاط تحفيزية</h3><p>كل تبرع فعلي مؤكّد من بنك الدم يمنح المتبرع 5 نقاط معنوية داخل حسابه.</p></article>
</div></div></section>
<section id="how" class="section"><div class="container"><div class="section-top"><span class="overline">خطوات بسيطة</span><h2>كيف تعمل منصة حياة؟</h2><p>رحلة واضحة من إنشاء الحساب إلى توثيق التبرع.</p></div><div class="steps">
<div class="step"><span class="step-number">01</span><h3>أنشئ حسابك وأكّد بريدك</h3><p>أدخل بيانات التواصل وفصيلتك ومنطقتك، ثم فعّل حسابك عبر البريد الإلكتروني.</p></div>
<div class="step"><span class="step-number">02</span><h3>تابع الطلبات واستجب</h3><p>اطّلع على طلبات بنوك الدم التي تصلك، واقبل أو ارفض حسب قدرتك على الحضور.</p></div>
<div class="step"><span class="step-number">03</span><h3>وثّق التبرع واكسب نقاطك</h3><p>بعد التبرع الفعلي، يؤكّد بنك الدم العملية لتظهر في سجلك مع 5 نقاط.</p></div>
</div></div></section>
<section id="roles" class="section section-soft"><div class="container"><div class="section-top"><span class="overline">من يستفيد؟</span><h2>مصممة للمتبرعين والمؤسسات</h2></div><div class="roles-grid">
<article class="role-card red"><span class="icon-circle"><i class="ti ti-user-heart" aria-hidden="true"></i></span><h3>للمتبرعين</h3><p>ملف شخصي، طلبات جديدة، حالة توفر أولية، سجل تبرعات ونقاط تشجيعية.</p><a href="register.html">سجّل كمتبرع <i class="ti ti-arrow-left" aria-hidden="true"></i></a></article>
<article class="role-card"><span class="icon-circle teal"><i class="ti ti-building-hospital" aria-hidden="true"></i></span><h3>لبنوك الدم</h3><p>إدارة الطلبات والاستجابات، توثيق التبرعات، ومراجعة تقارير المؤسسة. الحساب المؤسسي ينشئه مدير النظام.</p><a href="login.html">تسجيل دخول المؤسسة <i class="ti ti-arrow-left" aria-hidden="true"></i></a></article>
</div></div></section>
<section class="section"><div class="container"><div class="section-top"><span class="overline">أسئلة شائعة</span><h2>إجابات تساعدك تبدأ</h2></div><div class="faq">
<details><summary>هل يمكنني التسجيل إذا كنت لا أعرف فصيلة دمي؟</summary><p>نعم، يمكنك اختيار «لا أعرف» في التسجيل. لكن لا تُستخدم فصيلتك في المطابقة الآلية حتى تتحدد بشكل موثوق.</p></details>
<details><summary>هل يكفي قبول الطلب للحصول على النقاط؟</summary><p>لا. تُضاف 5 نقاط فقط بعد حدوث التبرع الفعلي وتأكيده من بنك دم مخوّل، حتى لو كان التبرع خارج طلبات حياة.</p></details>
<details><summary>هل تتحقق حياة من صلاحية الدم للمريض؟</summary><p>لا، المنصة أداة تنسيق. الفحوصات والأهلية الطبية والتوافق النهائي للدم مسؤولية الجهات الطبية المعتمدة.</p></details>
<details><summary>هل هذه النسخة متصلة بمستشفيات حقيقية؟</summary><p>لا. هذه نسخة MVP تجريبية للواجهات وتجربة الاستخدام، وتستخدم بيانات افتراضية فقط.</p></details>
</div></div></section>
<section class="section" style="padding-top:0"><div class="container"><div class="cta-panel"><div><h2>كل تبرع يبدأ بخطوة.</h2><p>أنشئ حسابًا تجريبيًا واستكشف كيف يمكن لحياة أن تجعل تجربة التنسيق أبسط.</p></div><a href="register.html" class="btn btn-primary">ابدأ الآن <i class="ti ti-arrow-left icon-inline" aria-hidden="true"></i></a></div></div></section>
'''
put('index.html','الرئيسية',home,'home')

register=f'''<section class="auth-wrap"><div class="container"><div class="auth-layout"><div class="auth-card">
<span class="overline">انضم إلى حياة</span><h1>إنشاء حساب متبرع</h1><p class="intro">املأ بياناتك لتجربة التسجيل. استخدم بيانات وهمية فقط في هذه النسخة.</p>
<div id="form-alert" class="form-alert" role="alert"></div><form id="register-form" novalidate>
{f('fullName','الاسم الكامل','مثال: أحمد محمد',required=True)}
{f('email','البريد الإلكتروني','name@example.com','email',True,extra='autocomplete="email"')}
{f('phone','رقم الهاتف','059XXXXXXX','tel',True,extra='autocomplete="tel" inputmode="tel" dir="ltr"')}
{f('password','كلمة المرور','8 أحرف على الأقل','password',True,extra='autocomplete="new-password"')}
{f('confirmPassword','تأكيد كلمة المرور','أعد كتابة كلمة المرور','password',True,extra='autocomplete="new-password"')}
<div class="form-group"><label for="bloodType">فصيلة الدم</label><select class="field" id="bloodType" name="bloodType" required><option value="">اختر فصيلة الدم</option><option value="unknown">لا أعرف فصيلة دمي</option>{''.join(f'<option value="{t}">{t}</option>' for t in ['O+','O-','A+','A-','B+','B-','AB+','AB-'])}</select><span class="field-error" data-error-for="bloodType"></span></div>
<div class="form-row">{f('city','المدينة','مثال: غزة',required=True)}{f('area','المنطقة / الحي','مثال: الرمال',required=True)}</div>
{f('lastDonation','آخر تاريخ تبرع <span class="optional">(اختياري)</span>','','date',False)}
<div class="checkbox-line"><input type="checkbox" name="consent" id="consent"><label for="consent">أفهم أن هذا نموذج MVP تجريبي، وسأستخدم بيانات غير حقيقية فقط.</label></div><span class="field-error" data-error-for="consent"></span>
<button type="submit" class="btn btn-primary btn-block">إنشاء الحساب التجريبي <i class="ti ti-arrow-left icon-inline" aria-hidden="true"></i></button></form>
<div class="auth-footer">عندك حساب؟ <a href="login.html">تسجيل الدخول</a></div></div>
<aside class="auth-side"><img src="assets/img/hayat-logo-wordmark.png" alt="شعار حياة"><h2>حياة تجمعنا على العطاء</h2><p>أنشئ حسابك، أكّد بريدك، وتعرّف على تجربة التنسيق مع بنوك الدم.</p></aside></div></div></section>'''
put('register.html','إنشاء حساب متبرع',register,'register',scripts=['auth'])

verify='''<section class="auth-wrap"><div class="container"><div class="auth-small"><div class="auth-card auth-center">
<div class="verification-icon"><i class="ti ti-mail-check" aria-hidden="true"></i></div><h1>تأكيد البريد الإلكتروني</h1><p class="intro">أدخل الرمز المكوّن من 6 أرقام المرسل افتراضيًا إلى <strong id="verify-email" class="ltr">—</strong>.</p>
<div class="form-alert" id="form-alert" role="alert"></div><form id="verify-form" novalidate><div class="form-group" style="text-align:right"><label for="code">رمز التحقق</label><input class="field otp-input" id="code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required autocomplete="one-time-code"><span class="field-error" data-error-for="code"></span></div><button class="btn btn-primary btn-block" type="submit">تأكيد الحساب</button></form>
<div style="margin-top:18px"><button type="button" class="btn btn-outline btn-sm" id="resend-code">إعادة إرسال الرمز</button></div><div style="margin-top:12px"><button class="btn btn-soft btn-sm" type="button" id="toggle-inbox"><i class="ti ti-mail-opened" aria-hidden="true"></i> فتح صندوق البريد التجريبي</button></div>
<div id="mock-inbox" class="demo-inbox hidden" style="display:none"><h3>صندوق البريد التجريبي</h3><p>الرمز للعرض داخل المحاكاة فقط، ولا يتم إرسال بريد حقيقي.</p><div class="demo-code ltr" id="mock-code">—</div><p>تنتهي صلاحية الرمز الساعة: <strong id="mock-expiry">—</strong></p></div>
</div></div></div></section>'''
# Use CSS-based toggle targeted by JS via hidden property to avoid inline display overriding.
verify=verify.replace('class="demo-inbox hidden" style="display:none"','class="demo-inbox" hidden')
put('verify.html','تأكيد البريد الإلكتروني',verify,'verify',scripts=['auth'])

login=f'''<section class="auth-wrap"><div class="container"><div class="auth-layout"><div class="auth-card"><span class="overline">مرحبًا بعودتك</span><h1>تسجيل الدخول</h1><p class="intro">صفحة واحدة لجميع حسابات حياة. النظام يوجهك إلى اللوحة المناسبة.</p><div class="form-alert" id="form-alert" role="alert"></div>
<form id="login-form" novalidate>{f('identifier','البريد الإلكتروني أو رقم الهاتف','name@example.com / 059...','text',True,extra='autocomplete="username"')}{f('password','كلمة المرور','أدخل كلمة المرور','password',True,extra='autocomplete="current-password"')}
<div style="display:flex;justify-content:flex-end;margin:-4px 0 20px"><a class="text-link" style="font-size:.8rem" href="forgot-password.html">نسيت كلمة المرور؟</a></div><button type="submit" class="btn btn-primary btn-block">تسجيل الدخول <i class="ti ti-arrow-left icon-inline" aria-hidden="true"></i></button></form>
<div class="auth-footer">ليس لديك حساب؟ <a href="register.html">إنشاء حساب متبرع</a></div>
<div class="demo-inbox"><h3>جرّب الحسابات الجاهزة</h3><p>اضغط لتعبئة البيانات التجريبية (كلمة المرور: <span class="ltr">Demo12345!</span>).</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><button class="btn btn-outline btn-sm" type="button" data-demo-account="demo-donor">متبرع</button><button class="btn btn-outline btn-sm" type="button" data-demo-account="demo-representative">ممثل المؤسسة</button><button class="btn btn-outline btn-sm" type="button" data-demo-account="demo-staff">موظف بنك دم</button><button class="btn btn-outline btn-sm" type="button" data-demo-account="demo-admin">مدير النظام</button></div></div></div>
<aside class="auth-side"><img src="assets/img/hayat-logo-wordmark.png" alt="شعار حياة"><h2>مساحة واحدة لأدوار مختلفة</h2><p>جرّب الواجهات الأولية للمتبرع وبنك الدم ومدير النظام، من دون إدخال أي بيانات حقيقية.</p></aside></div></div></section>'''
put('login.html','تسجيل الدخول',login,'login',scripts=['auth'])

forgot=f'''<section class="auth-wrap"><div class="container"><div class="auth-small"><div class="auth-card"><div class="verification-icon"><i class="ti ti-lock-open" aria-hidden="true"></i></div><h1 style="text-align:center">استعادة كلمة المرور</h1><p class="intro" style="text-align:center">أدخل بريدك الإلكتروني لاستعراض تجربة استعادة كلمة المرور.</p>
<div class="form-alert" id="form-alert" role="alert"></div><form id="forgot-form" novalidate>{f('email','البريد الإلكتروني','name@example.com','email',True)}<button type="submit" class="btn btn-primary btn-block">متابعة</button></form>
<div id="forgot-done" hidden><div class="form-alert success visible"><i class="ti ti-mail-check"></i><span>إذا كان البريد مسجلًا، فستظهر تعليمات الاستعادة في صندوق البريد التجريبي.</span></div><a class="btn btn-outline btn-block" id="mock-reset-link" hidden href="reset-password.html">افتح رسالة الاستعادة التجريبية</a></div>
<div class="auth-footer"><a href="login.html">العودة لتسجيل الدخول</a></div></div></div></div></section>'''
put('forgot-password.html','نسيت كلمة المرور',forgot,'forgot',scripts=['auth'])

reset=f'''<section class="auth-wrap"><div class="container"><div class="auth-small"><div class="auth-card"><div class="verification-icon"><i class="ti ti-key" aria-hidden="true"></i></div><h1 style="text-align:center">تعيين كلمة مرور جديدة</h1><p class="intro" style="text-align:center">هذا الرابط تجريبي وتكون صلاحيته 15 دقيقة.</p><div class="form-alert" id="form-alert" role="alert"></div><form id="reset-form" novalidate>{f('password','كلمة المرور الجديدة','8 أحرف على الأقل','password',True,extra='autocomplete="new-password"')}{f('confirmPassword','تأكيد كلمة المرور','أعد كلمة المرور','password',True,extra='autocomplete="new-password"')}<button type="submit" class="btn btn-primary btn-block">حفظ كلمة المرور</button></form></div></div></div></section>'''
put('reset-password.html','إعادة تعيين كلمة المرور',reset,'reset',scripts=['auth'])

status='''<section class="result-screen"><div class="result-icon"><i id="status-icon" class="ti ti-circle-check" aria-hidden="true"></i></div><h1 id="status-heading">تمت العملية</h1><p id="status-description">حالة النظام.</p><div class="actions"><a id="status-action" class="btn btn-primary" href="index.html">المتابعة</a><a class="btn btn-outline" href="index.html">الرئيسية</a></div></section>'''
put('status.html','رسائل النظام',status,'status',scripts=['auth'])

# Dashboard starter previews; full domain modules are intentionally NOT yet implemented.
configs={
'donor':dict(title='لوحة المتبرع',intro='تابع حسابك التجريبي ونقاطك وسجل التبرعات.',metrics=[('فصيلة الدم','O+','droplet'),('النقاط','15','award'),('التبرعات','3','heart-handshake'),('الإشعارات','2','bell')],section='إطلالة على تجربتك',cards=[('طلب دم تجريبي','فصيلة O+ · بنك دم افتراضي','O+'),('مكافآت التبرع','5 نقاط لكل تبرع مؤكد','+5')]),
'bank':dict(title='لوحة بنك الدم',intro='واجهة أولية لمراقبة الطلبات والاستجابات والتبرعات.',metrics=[('الطلبات النشطة','8','clipboard-list'),('المستجيبون','24','users'),('التبرعات المكتملة','35','droplet'),('النقاط الممنوحة','175','award')],section='ملخص المؤسسة',cards=[('طلب تجريبي','احتياج لفصيلة O+','O+'),('تأكيد التبرعات','قيد تطوير الواجهة التفاعلية','+5')]),
'admin':dict(title='لوحة مدير النظام',intro='نظرة مبدئية على المؤسسات والمتبرعين والتبرعات.',metrics=[('المتبرعون','1,250','users'),('بنوك الدم','18','building-hospital'),('الطلبات النشطة','42','clipboard-list'),('التبرعات المؤكدة','320','droplet')],section='مراقبة المنصة',cards=[('تقارير الإشراف الصحي','ضمن صلاحيات مدير النظام','↗'),('إدارة المؤسسات','إنشاء ممثل المؤسسة الرسمي','↗')])}
for role,c in configs.items():
 metrics=''.join(f'<article class="metric-card"><div class="metric-label"><span>{a}</span><i class="ti ti-{icon}" aria-hidden="true"></i></div><div class="metric-value">{val}</div></article>' for a,val,icon in c['metrics'])
 cards=''.join(f'<div class="preview-card"><div><h3>{name}</h3><p>{hint}</p></div><strong>{val}</strong></div>' for name,hint,val in c['cards'])
 body=f'''<section class="dashboard-wrap"><div class="container"><div class="dash-header"><div><div class="dashboard-overline">HAYAT / {role.upper()}</div><h1>{c['title']}</h1><p id="dashboard-welcome">{c['intro']}</p></div><button class="btn btn-outline btn-sm" type="button" id="logout-dashboard"><i class="ti ti-logout icon-inline" aria-hidden="true"></i> تسجيل الخروج</button></div><div class="dash-grid">{metrics}</div><div class="dash-panels"><section class="dash-panel"><h2>{c['section']}</h2>{cards}</section><section class="dash-panel"><h2>المرحلة القادمة</h2><p>هذه لوحة استعراض أولية. سنضيف إليها التفاعلات الكاملة بناءً على التحليل المعتمد للـMVP، دون Backend.</p><div class="dash-links"><button type="button" class="btn btn-primary btn-sm" data-future>استعراض الوظائف القادمة</button><a href="../index.html#how" class="btn btn-outline btn-sm">كيف تعمل حياة؟</a></div></section></div><div class="dashboard-preview-note"><i class="ti ti-info-circle" aria-hidden="true"></i> بيانات هذه اللوحة افتراضية لأغراض العرض، وليست متصلة بمستشفى أو قاعدة بيانات حقيقية.</div></div></section>'''
 put(f'{role}/dashboard.html',c['title'],body,role,True,scripts=['dashboard'])
print('Generated HTML:',len(list(P.rglob('*.html'))))
