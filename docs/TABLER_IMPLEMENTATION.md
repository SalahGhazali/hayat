# تطبيق Tabler UI في حياة

تم تغيير بنية الصفحات، وليس تحميل ملف CSS فوق التصميم القديم فقط.

| الجزء | المكوّن المستخدم | المصدر المجاني الرسمي |
|---|---|---|
| الدخول والتسجيل والاستعادة | `card card-md`, `card-body`, `form-control`, `form-select`, `form-check`, `form-footer` | https://preview.tabler.io/sign-in.html و https://preview.tabler.io/sign-up.html |
| التنقل العام | `navbar navbar-expand-lg`, `collapse`, `navbar-toggler` | https://docs.tabler.io/ui/layout/navbars |
| لوحات الأدوار | `navbar navbar-vertical navbar-expand-lg`, `page-wrapper`, `page-header`, `page-body` | https://preview.tabler.io/layout-rtl.html |
| الجداول | `table table-vcenter card-table`, `table-responsive`, `card-footer` | https://docs.tabler.io/ui/components/table |
| الحالات الفارغة | `empty`, `empty-icon`, `empty-title`, `empty-action` | https://preview.tabler.io/empty.html |
| تأكيد الخروج والعمليات | `modal modal-blur fade`, `modal-dialog-centered`, `tabler.Modal` | https://docs.tabler.io/ui/components/modal |
| رسائل الحفظ والأخطاء | `toast`, `toast-body`, `tabler.Toast` | https://preview.tabler.io/toasts.html |
| الأسئلة الشائعة | `accordion`, `accordion-item`, `collapse` | https://docs.tabler.io/ui/components/accordion |

الإصدارات المثبتة محليًا: **Tabler Core 1.7.3**، و**Tabler Icons Webfont 3.34.1**. اختير CSS المبني للـRTL. لا يوجد Bootstrap منفصل أو Tailwind. ملفات المكتبة والخط الخاص بالأيقونات والتراخيص داخل `assets/vendor/`؛ الأصل محفوظ دون تعديل. قالب Tabler JS يتضمن Bootstrap؛ لذلك لا نحمّل حزمتين.

تعديلات الهوية فقط في `assets/css/hayat-theme.css`: Cairo، الأحمر والتركواز المعتمدان، الأبيض الدائم، قياسات اللمس ومعالجة هوامش الشبكة على الجوال. صفحات Tabler المجانية التي راجعناها محفوظة في `docs/upstream/` للمراجعة وليست صفحات التطبيق. الشعار الأصلي محفوظ كما هو.

`assets/css/styles.css` و`build_pages.py` من v0.1 محفوظان للرجوع، ولا تحمّلهما الصفحات الحالية. `scripts/redesign.mjs` سجل إنشاء الصفحات الجديدة؛ تعديل ملفات HTML مباشرة مناسب للشغل اللاحق. إعادة تشغيل مولّد الصفحات تعيد توليد محتواها، لذلك لا تستخدمه لحفظ تعديلات يدوية لاحقة.

لا تتغير الهوية حسب تفضيل الجهاز: `data-bs-theme="light"` و`color-scheme: only light`. لا واجهة لتغيير الثيم.

## تنقيح الشكل بعد مراجعة المستخدم

أُزيل تدرّج الأزرار وحدودها الداكنة، ووُحّدت الحقول والبطاقات والقوائم على سطح أبيض مع حدود ومساحات أخف. الدخول يستخدم بنية Tabler ذات عمودَي الغلاف والنموذج على الكمبيوتر، وتُطوى مساحة الغلاف على الجوال. الشعار الأصلي لم يتغير.

خط Cairo المتغير، بوزن 400–800، محفوظ داخل `assets/vendor/cairo/` مع رخصة SIL OFL ومصدره؛ لا يطلب المتصفح Google Fonts وقت التشغيل. الأداة `scripts/fonts.mjs` تحفظ الملفات الأصلية من المصدر.

الخروج يستخدم Toast Tabler صغيرًا فوق صفحة الدخول، لمدة 3 ثوانٍ ولمرة واحدة. هذا يتبع طلب المستخدم الأخير ويحل محل توثيق شاشة الخروج الثابتة السابق. بقية مسارات حالات النظام محفوظة. `scripts/refresh-login.mjs` يسجل تعديل بنية صفحة الدخول مع الاحتفاظ بمعرّفات النموذج ومنطقه.

## مراجعة الإكمال

استُخدمت الجداول نفسها لكشف نقاط المؤسسة والتدقيق، مع ترقيم مستقل لكل جدول وحاويات تمرير قابلة للتركيز بلوحة المفاتيح. إعدادات المؤسسة تستخدم `modal-dialog-scrollable` مع نموذج وحقول Tabler؛ عُدّل ترتيب flex داخل النموذج ليبقى تذييل الحفظ ظاهرًا على الشاشات القصيرة. جرى الرجوع مجددًا إلى التوثيق الرسمي للجداول والنوافذ أعلاه دون تغيير إصدار المكتبة المثبّت. تحسّن تباين عناوين الجداول والنصوص الثانوية وإرشادات الحقول، مع الحفاظ على الهوية والشعار.
