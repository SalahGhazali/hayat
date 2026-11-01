# مكونات الواجهة ومصادرها

آخر تحديث: 1 نوفمبر 2026. يعتمد التطبيق على Tabler RTL المجاني ومكتبات محلية محددة الإصدار. ملفات التشغيل الأصلية وتراخيصها في `assets/vendor/`، وتعديلات الهوية في ملفات CSS الخاصة بحياة. لا تحميل من CDN وقت التشغيل، ولا قالب Pro أو مكتبة مكونات أخرى.

## المكونات المشتركة

| الجزء | التنفيذ الحالي | المصدر الرسمي |
|---|---|---|
| هيكل لوحات الأدوار | تنقل Tabler العمودي و`page-wrapper` و`page-header` و`page-body`؛ مشترك عبر `dashboard.js` | [Tabler RTL layout](https://preview.tabler.io/layout-rtl.html) |
| قائمة الجوال | offcanvas في هيكل لوحة الدور، مع إغلاق وتركيز وتنقل بلوحة المفاتيح | [Tabler UI](https://docs.tabler.io/ui) |
| صفحات الوصول | تخطيط الغلاف والنموذج، وبطاقات وحقول Tabler؛ الصورة ضمن لوحة منفصلة عن النموذج | [Sign in](https://preview.tabler.io/sign-in.html)، [Sign up](https://preview.tabler.io/sign-up.html) |
| الجداول | `table table-vcenter card-table` داخل `table-responsive`؛ بحث وترتيب وتصفية وترقيم وتصدير في `dashboard.js` | [Tabler tables](https://docs.tabler.io/ui/components/table) |
| حقول النماذج | `form-control` و`form-select` و`form-check` مع رسائل عربية وحفظ الإدخال الصحيح عند الخطأ | [Tabler forms](https://docs.tabler.io/ui) |
| تحرير بيانات وسبب الإجراء | `modal-dialog-centered` و`modal-dialog-scrollable` و`tabler.Modal` | [Tabler modal](https://docs.tabler.io/ui/components/modal) |
| تأكيد العمليات | `Hayat.confirmDialog()` باستخدام SweetAlert2، بما فيه الخروج والتبرع والتراجع | [SweetAlert2](https://github.com/sweetalert2/sweetalert2/tree/v11.17.2) |
| رسائل النجاح والخطأ القصيرة | `toast` و`tabler.Toast` عبر `Hayat.toast()`؛ الخروج مرة واحدة لمدة 3 ثوانٍ | [Tabler toasts](https://preview.tabler.io/toasts.html) |
| الحالات الفارغة | `empty` و`empty-title` و`empty-action` مع إجراء مناسب | [Tabler empty state](https://preview.tabler.io/empty.html) |
| حالات النظام | `status.html` للتفعيل والاستعادة و403 و404 والخطأ المؤقت، مع الرسم الزخرفي المحلي | [Tabler free templates](https://github.com/tabler/tabler) |
| الأيقونات | Tabler Icons Webfont المحلي؛ لا رموز تعبيرية بديلة | [Tabler Icons](https://github.com/tabler/tabler-icons) |
| التحميل | هيكل تحميل مشترك و`aria-busy` عند تحديث اللوحة، وتعطيل إرسال النموذج أثناء الحفظ | `dashboard.js` و`hayat-theme.css` |

## الرسوم والحركة والصور

- **Chart.js:** رسوم لوحات المؤسسة والإدارة وتقاريرهما، مع عناوين ووسوم عربية وإعداد RTL وألوان الهوية. لكل رسم جدول قيم قابل للفتح. الإعداد المشترك والتخلص من الرسوم عند إعادة العرض في `assets/js/motion.js`. [الربط الرسمي](https://www.chartjs.org/docs/latest/getting-started/integration.html).
- **CountUp.js:** عدادات الرئيسية ولوحات الأدوار من المخزن نفسه. الرئيسية توضح أنها بيانات تجريبية. [المصدر المثبت 2.8.2](https://github.com/inorganik/countUp.js/tree/v2.8.2).
- **AOS:** إظهار أقسام الرئيسية وصفحة «كيف تعمل حياة» فقط، باستخدام `fade-up` و`fade` و`zoom-in` مرة واحدة؛ لا انتقال أفقي. [المصدر المثبت 2.3.4](https://github.com/michalsnik/aos/tree/v2.3.4).
- **تقليل الحركة:** يعالج `motion.js` تفضيل `prefers-reduced-motion` ويعرض القيم النهائية دون تحريك. المحتوى العام يبقى ظاهرًا عند تعطيل JavaScript، ولا حركة على الجداول والنماذج.
- **الصور:** صور محلية بأحجام محددة ونسخ WebP وJPG متجاوبة، ضمن غلاف أو قسم محدود. مصدرها ومصورها وترخيصها وأحجامها في [ASSETS_CREDITS.md](ASSETS_CREDITS.md). الشعار المعتمد محفوظ دون تغيير.

## التوثيق المرتبط

[DEPENDENCIES.md](DEPENDENCIES.md) هو سجل الإصدارات والرخص والملفات الحالية. [TABLER_IMPLEMENTATION.md](TABLER_IMPLEMENTATION.md) و[COMPONENTS_AND_REFERENCES.md](COMPONENTS_AND_REFERENCES.md) يحتفظان بتوثيق دمج Tabler السابق ونسخ الأمثلة الحرة في `docs/upstream/`؛ التغييرات الحالية، ومنها SweetAlert2 والرسوم والحركة وخط Fontsource، موثقة هنا وفي سجل الاعتمادات.

تعكس [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md) و[QA_RESULTS.md](QA_RESULTS.md) الفحوص المنفذة فعلًا. وجود مكتبة أو مكوّن في المصدر لا يكفي وحده لاعتبار اختبار قبول ناجحًا.
