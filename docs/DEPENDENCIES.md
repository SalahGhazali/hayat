# المكتبات المثبتة محليًا

جميع ملفات التشغيل داخل `assets/vendor/`؛ لا CDN ولا تحميل خطوط أو صور من موقع خارجي وقت التشغيل. الموقع يعمل دون npm أو خطوة بناء. يثبت `package-lock.json` أدوات التطوير والمكتبات الجديدة، وتعيد أداتا `scripts/vendor-experience.mjs` و`scripts/vendor-font.mjs` نسخ توزيعات npm الأصلية.

| المكتبة | الإصدار | المصدر الرسمي | الرخصة المحلية | الملفات المستخدمة |
|---|---|---|---|---|
| Tabler Core | 1.7.3 | [Tabler](https://github.com/tabler/tabler) | `tabler/LICENSE`، MIT | `tabler/tabler.rtl.min.css` و`tabler/tabler.min.js` |
| Tabler Icons Webfont | 3.34.1 | [الأيقونات](https://github.com/tabler/tabler-icons) | `icons/LICENSE`، MIT | `icons/tabler-icons.min.css` و`icons/fonts/tabler-icons.woff2` |
| SweetAlert2 | 11.17.2 | [المصدر](https://github.com/sweetalert2/sweetalert2/tree/v11.17.2) | `sweetalert2/LICENSE`، MIT | `sweetalert2/sweetalert2.min.js` و`sweetalert2/sweetalert2.min.css` |
| Chart.js | 4.4.9 | [توثيق الربط](https://www.chartjs.org/docs/latest/getting-started/integration.html) | `chartjs/LICENSE.md`، MIT | `chartjs/chart.umd.js`؛ يتضمن التوزيع اعتماد الألوان الأصلي |
| AOS | 2.3.4 | [المصدر](https://github.com/michalsnik/aos/tree/v2.3.4) | `aos/LICENSE`، MIT | `aos/aos.js` و`aos/aos.css` |
| CountUp.js | 2.8.2 | [المصدر](https://github.com/inorganik/countUp.js/tree/v2.8.2) | `countup/LICENSE.md`، MIT | `countup/countUp.umd.js` |
| Cairo عبر Fontsource | 5.3.0 | [Fontsource](https://fontsource.org/fonts/cairo) | `cairo/OFL.txt`، SIL OFL 1.1 | `cairo/cairo.css` ومجموعتا Arabic وLatin بأوزان 400–800 بصيغة WOFF2 |
| Playwright، للاختبار فقط | 1.64.1 | [Playwright](https://playwright.dev/) | Apache 2.0 داخل حزمة npm | لا يُرسل إلى المتصفح؛ يستخدم Edge المثبت على Windows |

المسارات في الجدول نسبية إلى `assets/vendor/`. يسجل ملف `experience-manifest.json` أسماء الحزم وإصداراتها ورخصها من توزيع npm نفسه. مصدر صور الخلفية ورخصتها في [ASSETS_CREDITS.md](ASSETS_CREDITS.md)، والشعار المعتمد السابق لم يتغير. Swiper اختياري، ولم تظهر حاجة لتدوير المحتوى؛ وGSAP غير مستخدم.

التأكيدات عبر SweetAlert2، والنماذج التي تطلب سببًا أو تحرير بيانات داخل Modal من Tabler. كل رسم مُنفذ بواسطة Chart.js وله عنوان وجدول قيم يمكن فتحه دون الاعتماد على الرسم أو اللون. الإعدادات والحركة وتقليلها في `assets/js/motion.js`.
