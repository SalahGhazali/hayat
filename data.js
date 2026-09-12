/* All records are fictional demonstration data. The app requires no server. */
(() => {
  'use strict';
  const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };
  const normalizeBloodType = type => String(type || '').trim().toUpperCase().replace('-', '−');
  const redCellRecipients = {
    'O−': ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A−': ['A−', 'A+', 'AB−', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B−': ['B−', 'B+', 'AB−', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB−': ['AB−', 'AB+'],
    'AB+': ['AB+']
  };
  const canDonate = (donorType, recipientType) => (redCellRecipients[normalizeBloodType(donorType)] || []).includes(normalizeBloodType(recipientType));
  window.HayatData = {
    version: 1,
    today: () => day(0),
    dateAfter: day,
    bloodTypes: ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'],
    canDonate,
    recipientsFor: donorType => [...(redCellRecipients[normalizeBloodType(donorType)] || [])],
    donorsFor: recipientType => Object.keys(redCellRecipients).filter(donorType => canDonate(donorType, recipientType)),
    cities: ['غزة', 'دير البلح', 'شمال غزة', 'خان يونس', 'رفح', 'النصيرات', 'البريج'],
    seed: () => ({
      profile: { name: 'أحمد محمد', email: 'ahmad@example.com', phone: '0590000000', bloodType: 'O+', city: 'غزة', birthDate: '1999-04-12', available: true, reminders: true, emergencyAlerts: true, lastDonation: day(-100) },
      role: 'donor',
      signedIn: false,
      requests: [
        { id: 'REQ-1042', hospital: 'بنك الدم المركزي الحكومي', centerId: 'c1', city: 'غزة', bloodType: 'O+', units: 6, fulfilled: 2, urgency: 'urgent', created: day(0), status: 'open', note: 'طلب تجريبي من بنك الدم لدعم احتياجات المستشفى.', responses: 8 },
        { id: 'REQ-1041', hospital: 'مركز الأقصى للتبرع', centerId: 'c2', city: 'دير البلح', bloodType: 'A−', units: 4, fulfilled: 1, urgency: 'urgent', created: day(0), status: 'open', note: 'يستقبل المركز المتبرعين خلال ساعات العمل المحددة.', responses: 5 },
        { id: 'REQ-1040', hospital: 'مركز الشفاء للتبرع', centerId: 'c3', city: 'غزة', bloodType: 'B+', units: 5, fulfilled: 3, urgency: 'normal', created: day(-1), status: 'open', note: 'للمساهمة في توفير احتياطي بنك الدم.', responses: 12 },
        { id: 'REQ-1039', hospital: 'مركز ناصر للتبرع', centerId: 'c4', city: 'خان يونس', bloodType: 'AB+', units: 3, fulfilled: 1, urgency: 'normal', created: day(-1), status: 'open', note: 'يمكنك حجز موعد للتبرع في المركز.', responses: 4 },
        { id: 'REQ-1038', hospital: 'مستشفى رفح الحكومي', centerId: 'c5', city: 'رفح', bloodType: 'O−', units: 5, fulfilled: 2, urgency: 'urgent', created: day(-2), status: 'open', note: 'طلب عاجل تجريبي لتجربة الاستجابة للطلبات.', responses: 10 },
        { id: 'REQ-1037', hospital: 'بنك الدم المركزي الحكومي', centerId: 'c1', city: 'غزة', bloodType: 'A+', units: 4, fulfilled: 4, urgency: 'normal', created: day(-3), status: 'completed', note: 'اكتمل الطلب بفضل مساهمة المتبرعين.', responses: 16 }
      ],
      centers: [
        { id: 'c1', name: 'بنك الدم المركزي الحكومي', city: 'غزة', address: 'حي الرمال، شارع الوحدة', hours: 'الأحد – الخميس · ٨:٠٠ ص – ٣:٠٠ م', phone: '09 000 0001', x: 36, y: 29 },
        { id: 'c2', name: 'مركز الأقصى للتبرع', city: 'دير البلح', address: 'وسط المدينة، الشارع الرئيسي', hours: 'الأحد – الخميس · ٨:٠٠ ص – ٤:٠٠ م', phone: '02 000 0002', x: 53, y: 48 },
        { id: 'c3', name: 'مركز الشفاء للتبرع', city: 'غزة', address: 'حي الرمال، قرب الجامعة', hours: 'الأحد – الخميس · ٩:٠٠ ص – ٣:٠٠ م', phone: '09 000 0003', x: 43, y: 23 },
        { id: 'c4', name: 'مركز ناصر للتبرع', city: 'خان يونس', address: 'وسط المدينة', hours: 'الأحد – الخميس · ٨:٠٠ ص – ٢:٠٠ م', phone: '02 000 0004', x: 44, y: 78 },
        { id: 'c5', name: 'مستشفى رفح الحكومي', city: 'رفح', address: 'شارع المستشفيات', hours: 'الأحد – الخميس · ٨:٠٠ ص – ٣:٠٠ م', phone: '04 000 0005', x: 55, y: 13 }
      ],
      campaigns: [
        { id: 'cam1', title: 'قطرة منك، حياة لغيرك', subtitle: 'حملة جامعة فلسطين للتبرع بالدم', location: 'جامعة فلسطين · الحرم الجامعي', city: 'غزة', date: day(3), time: '٩:٠٠ ص – ٢:٠٠ م', enrolled: 86, target: 120, theme: 'rose', joined: false, centerId: 'c3' },
        { id: 'cam2', title: 'معًا ينبض الأمل', subtitle: 'يوم مفتوح للتبرع بالدم', location: 'مركز الأقصى للتبرع', city: 'دير البلح', date: day(7), time: '١٠:٠٠ ص – ٤:٠٠ م', enrolled: 54, target: 100, theme: 'teal', joined: false, centerId: 'c2' },
        { id: 'cam3', title: 'أنت سبب في حياة', subtitle: 'حملة مجتمعنا يتبرع', location: 'مركز ناصر للتبرع', city: 'خان يونس', date: day(12), time: '٩:٠٠ ص – ١:٠٠ م', enrolled: 32, target: 80, theme: 'purple', joined: false, centerId: 'c4' }
      ],
      appointments: [{ id: 'APT-2001', centerId: 'c1', date: day(2), time: '10:00', status: 'confirmed', requestId: null }],
      history: [
        { id: 'DON-1003', centerId: 'c1', date: day(-100), bloodType: 'O+', status: 'completed' },
        { id: 'DON-1002', centerId: 'c3', date: day(-210), bloodType: 'O+', status: 'completed' },
        { id: 'DON-1001', centerId: 'c1', date: day(-330), bloodType: 'O+', status: 'completed' }
      ],
      notifications: [
        { id: 'n1', title: 'هناك من يحتاج فصيلتك في غزة', text: 'طلب جديد لفصيلة O+ من بنك الدم المركزي. اطّلع على التفاصيل واختر موعدًا يناسبك.', type: 'urgent', date: day(0), read: false, route: 'requests', requestId: 'REQ-1042' },
        { id: 'n2', title: 'موعدك القادم بانتظارك', text: 'تم تأكيد موعدك التجريبي في بنك الدم المركزي الساعة ١٠:٠٠ صباحًا.', type: 'calendar', date: day(0), read: false, route: 'appointments' },
        { id: 'n3', title: 'لنصنع أثرًا أكبر معًا', text: 'حملة «قطرة منك، حياة لغيرك» قريبة منك. انضم وكن جزءًا من الأثر.', type: 'heart', date: day(-1), read: true, route: 'campaigns' }
      ],
      donors: [
        {id:'d1',name:'أحمد محمد',bloodType:'O+',city:'غزة',available:true,status:'active'},
        {id:'d2',name:'سارة خالد',bloodType:'A−',city:'دير البلح',available:true,status:'active'},
        {id:'d3',name:'عمر حسن',bloodType:'B+',city:'غزة',available:false,status:'active'},
        {id:'d4',name:'ليان يوسف',bloodType:'O−',city:'رفح',available:true,status:'active'},
        {id:'d5',name:'محمد علي',bloodType:'AB+',city:'خان يونس',available:true,status:'active'}
      ],
      activity: [],
      responses: [],
      settings: { platformName: 'حياة', campaignAlerts: true, demoIntervalDays: 90 }
    })
  };
})();

