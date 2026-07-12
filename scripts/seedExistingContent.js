import 'dotenv/config';
import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';
import SiteContent from '../models/SiteContent.js';

const blogPosts = [
  {
    title: {
      en: 'Climate-Smart Farming in Pakistan',
      ur: 'پاکستان میں موسمیاتی سمارٹ کھیتی',
      sd: 'پاڪستان ۾ موسمياتي سمارٽ فارمنگ',
    },
    excerpt: {
      en: 'Learn how to adapt your farming practices to climate change',
      ur: 'موسمیاتی تبدیلی کے لیے اپنی کھیتی کو کیسے ڈھالیں',
      sd: 'سکو ته ڪيئن پنهنجي فارمنگ جي طريقن کي موسمياتي تبديلي سان مطابقت ڏجي',
    },
    content: {
      en: `Pakistan's farmers are on the front line of climate change — shifting monsoon patterns, unpredictable heatwaves, and both floods and droughts within the same year have made traditional planting calendars unreliable.\n\nStart by watching real-time weather alerts (see the Weather page) instead of relying only on the old sowing calendar — a week's difference in sowing date can now mean the difference between a full harvest and a failed one. Switch to drought-tolerant wheat and cotton varieties recommended by your local agriculture extension office where floods or dry spells have become common.\n\nSoil health matters more than ever: composting crop residue (see the Recycling page) instead of burning it keeps moisture in the soil and cuts fertilizer costs. Combined with laser land leveling and drip irrigation where affordable, these changes can offset a large share of climate-driven yield loss.\n\nFinally, diversify — a farm growing two or three crops recovers from a bad season far better than one relying on a single crop.`,
      ur: `پاکستان کے کسان موسمیاتی تبدیلی کی زد میں سب سے آگے ہیں — مون سون کے بدلتے ہوئے انداز، غیر متوقع گرمی کی لہریں، اور ایک ہی سال میں سیلاب اور خشک سالی دونوں نے روایتی بوائی کے کیلنڈر کو غیر معتبر بنا دیا ہے۔\n\nپرانے بوائی کیلنڈر پر انحصار کرنے کے بجائے حقیقی وقت کے موسمی الرٹس (موسم کا صفحہ دیکھیں) پر نظر رکھیں — بوائی کی تاریخ میں ایک ہفتے کا فرق اب مکمل فصل اور ناکام فصل کے درمیان فرق پیدا کر سکتا ہے۔ جہاں سیلاب یا خشک سالی عام ہو گئی ہے وہاں اپنے مقامی زرعی توسیعی دفتر کی تجویز کردہ خشک سالی برداشت کرنے والی گندم اور کپاس کی اقسام اپنائیں۔\n\nمٹی کی صحت پہلے سے کہیں زیادہ اہم ہے: فصل کی باقیات کو جلانے کے بجائے کھاد بنانا (ری سائیکلنگ کا صفحہ دیکھیں) مٹی میں نمی برقرار رکھتا ہے اور کھاد کے اخراجات کم کرتا ہے۔ لیزر لینڈ لیولنگ اور ڈرپ ایریگیشن کے ساتھ مل کر یہ تبدیلیاں موسمیاتی نقصان کا بڑا حصہ پورا کر سکتی ہیں۔\n\nآخر میں، تنوع اپنائیں — دو یا تین فصلیں اگانے والا کھیت ایک ہی فصل پر انحصار کرنے والے کھیت کے مقابلے میں خراب موسم سے کہیں بہتر طور پر سنبھل جاتا ہے۔`,
      sd: `پاڪستان جا هاري موسمياتي تبديلي جي اڳيان آهن — مانسون جي بدلجندڙ نموني، اڻڄاتل گرمي، ۽ هڪ ئي سال ۾ ٻوڏ ۽ خشڪ سالي ٻنهي، پراڻي پوکي جي ڪئلينڊر کي ناقابل اعتبار بڻائي ڇڏيو آهي.\n\nپراڻي پوکي واري ڪئلينڊر تي ڀاڙڻ بدران حقيقي وقت جي موسمي خبردارين (موسم واري صفحي کي ڏسو) تي نظر رکو — پوکي جي تاريخ ۾ هڪ هفتي جو فرق هاڻي مڪمل فصل ۽ ناڪام فصل جي وچ ۾ فرق پيدا ڪري سگهي ٿو. جتي ٻوڏ يا خشڪ سالي عام ٿي وئي آهي اتي پنهنجي مقامي زرعي آفيس جي تجويز ڪيل خشڪ سالي برداشت ڪندڙ ڪڻڪ ۽ ڪپاهه جون قسمون استعمال ڪريو.\n\nمٽي جي صحت اڳ کان وڌيڪ اهم آهي: فصل جي بچيل حصن کي ساڙڻ بدران ڀاڻ ٺاهڻ (ري سائيڪلنگ واري صفحي کي ڏسو) مٽي ۾ نمي برقرار رکي ٿو ۽ ڀاڻ جو خرچ گهٽائي ٿو. ليزر ليولنگ ۽ ڊرپ آبپاشي سان گڏجي اهي تبديليون موسمياتي نقصان جو وڏو حصو پورو ڪري سگهن ٿيون.\n\nآخر ۾، مختلف فصلون پوکيو — ٻه يا ٽي فصلون پوکيندڙ ٻني هڪ ئي فصل تي ڀاڙيندڙ ٻني جي ڀيٽ ۾ خراب موسم مان تمام سٺي نموني سنڀري ٿي.`,
    },
    author: 'Dr. Ali Hassan',
    image: 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyMTExMDEzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    published: true,
    createdAt: new Date('2025-11-01'),
  },
  {
    title: {
      en: 'Maximizing Wheat Yield in 2025',
      ur: '2025 میں گندم کی پیداوار کو زیادہ سے زیادہ کرنا',
      sd: '2025 ۾ ڪڻڪ جي پيداوار کي وڌ کان وڌ ڪرڻ',
    },
    excerpt: {
      en: 'Best practices for wheat cultivation this season',
      ur: 'اس موسم میں گندم کی کاشت کے بہترین طریقے',
      sd: 'هن موسم ۾ ڪڻڪ جي پوک جا بهترين طريقا',
    },
    content: {
      en: `Wheat remains Pakistan's most important staple, and small changes in technique can add up to a significant yield increase this season.\n\nSow between November 1st and November 20th — the "Kor" (first) irrigation 22-25 days after sowing is the single most critical watering of the whole cycle, so don't delay it. Treat seed with fungicide before drilling, and use around 50kg of seed per acre at a depth of 2-3 inches for even germination.\n\nApply 2 bags of DAP per acre at sowing time, then split your urea across the tillering (around day 45) and booting (around day 85) stages rather than dumping it all at once — this alone can noticeably raise grain weight. Watch soil moisture closely during the grain-filling stage around day 110.\n\nHarvest once grain moisture drops below 12%, typically April-May — harvesting too early or too late both cost you yield. Use the AI Crop Advisory page any time for a schedule tailored to your specific location.`,
      ur: `گندم اب بھی پاکستان کی سب سے اہم اجناس ہے، اور تکنیک میں چھوٹی تبدیلیاں اس موسم میں پیداوار میں نمایاں اضافہ کر سکتی ہیں۔\n\nیکم نومبر سے 20 نومبر کے درمیان بوائی کریں — بوائی کے 22 سے 25 دن بعد 'کور' (پہلا) پانی پورے چکر کا سب سے اہم پانی ہے، اسے تاخیر سے نہ دیں۔ ڈرل کرنے سے پہلے بیج کو پھپھوندی کش دوا سے علاج کریں، اور یکساں اگاؤ کے لیے فی ایکڑ تقریباً 50 کلو بیج 2-3 انچ کی گہرائی پر استعمال کریں۔\n\nبوائی کے وقت فی ایکڑ ڈی اے پی کے 2 تھیلے استعمال کریں، پھر یوریا کو ایک ساتھ ڈالنے کے بجائے ٹلرنگ (تقریباً 45 دن) اور بوٹنگ (تقریباً 85 دن) کے مراحل میں تقسیم کریں — یہ اکیلے دانے کے وزن میں نمایاں اضافہ کر سکتا ہے۔ تقریباً 110 دن پر دانہ بھرنے کے مرحلے کے دوران مٹی کی نمی پر گہری نظر رکھیں۔\n\nجب دانے کی نمی 12 فیصد سے کم ہو جائے تو کٹائی کریں، عام طور پر اپریل-مئی — بہت جلدی یا بہت دیر سے کٹائی دونوں پیداوار میں نقصان کا باعث بنتی ہیں۔ اپنے مخصوص مقام کے مطابق شیڈول کے لیے کسی بھی وقت AI فصل مشورہ کا صفحہ استعمال کریں۔`,
      sd: `ڪڻڪ اڃا تائين پاڪستان جو سڀ کان اهم اَنُّ آهي، ۽ طريقي ۾ ننڍيون تبديليون هن موسم ۾ پيداوار ۾ خاص اضافو ڪري سگهن ٿيون.\n\n1 نومبر کان 20 نومبر جي وچ ۾ پوکيو — پوکي جي 22 کان 25 ڏينهن بعد 'ڪور' (پهريون) پاڻي سڄي چڪر جو سڀ کان اهم پاڻي آهي، ان ۾ دير نه ڪريو. ڊرل ڪرڻ کان اڳ ٻج کي ڦڦوند ڪش دوا سان علاج ڪريو، ۽ هڪجهڙي اُڀار لاءِ في ايڪڙ تقريبن 50 ڪلو ٻج 2-3 انچ جي کوهه تي استعمال ڪريو.\n\nپوکي وقت في ايڪڙ ڊي اي پي جا 2 ٿيلها استعمال ڪريو، پوءِ يوريا کي هڪ ئي دفعي وجهڻ بدران ٽلرنگ (تقريبن 45 ڏينهن) ۽ بوٽنگ (تقريبن 85 ڏينهن) مرحلن ۾ ورهايو — اهو اڪيلو داڻي جي وزن ۾ خاص اضافو ڪري سگهي ٿو. تقريبن 110 ڏينهن تي داڻي ڀرڻ واري مرحلي دوران مٽي جي نمي تي ويجهي نظر رکو.\n\nجڏهن داڻي جي نمي 12 سيڪڙو کان گهٽ ٿي وڃي تڏهن لڻو، عام طور تي اپريل-مئي — تمام جلدي يا تمام دير سان لڻڻ ٻئي پيداوار ۾ نقصان جو سبب بڻجن ٿا. پنهنجي مخصوص هنڌ مطابق شيڊول لاءِ ڪنهن به وقت AI فصل صلاح واري صفحي کي استعمال ڪريو.`,
    },
    author: 'Fatima Khan',
    image: 'https://images.unsplash.com/photo-1664729570424-069f0c0d5ef4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGVhdCUyMGZpZWxkJTIwY3JvcHN8ZW58MXx8fHwxNzYyMTQ5MDYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    published: true,
    createdAt: new Date('2025-10-28'),
  },
  {
    title: {
      en: 'Turning Waste into Profit',
      ur: 'فضلہ کو منافع میں تبدیل کرنا',
      sd: 'فضول کي فائدي ۾ تبديل ڪرڻ',
    },
    excerpt: {
      en: 'How recycling damaged crops can earn you money',
      ur: 'تباہ شدہ فصلوں کی ری سائیکلنگ سے پیسے کیسے کمائیں',
      sd: 'تباھ ٿيل فصلن جي ري سائيڪلنگ مان پئسا ڪيئن ڪمائجن',
    },
    content: {
      en: `Every season, huge amounts of wheat straw, cotton stalks, rice husk, and sugarcane bagasse get burned in the field — not just wasted value, but a major source of air pollution and smog across Punjab and Sindh.\n\nMost crop residue has real resale value: wheat straw and rice husk compost into organic fertilizer worth 500-750 PKR per bag, cotton stalks and bagasse can be sold as animal feed supplement, and larger quantities of bagasse are bought by paper mills. None of this requires new equipment — just collection, basic drying or chopping, and a buyer.\n\nThe fastest way to find out what your specific residue is worth is the Waste Recycling page here in AgriResilient: upload a photo and it identifies the item, gives you a realistic PKR price range, and suggests real nearby mandis, compost plants, or feed buyers based on your profile location.\n\nEven a small farm turning residue into compost instead of burning it saves on fertilizer costs the very next season — the return isn't just cash, it's better soil for years afterward.`,
      ur: `ہر موسم میں گندم کا بھوسا، کپاس کے ڈنٹھل، چاول کی بھوسی اور گنے کا چھلکا کھیت میں جلا دیا جاتا ہے — یہ نہ صرف قیمت کا ضیاع ہے بلکہ پنجاب اور سندھ میں فضائی آلودگی اور سموگ کا ایک بڑا ذریعہ بھی ہے۔\n\nزیادہ تر فصل کی باقیات کی حقیقی دوبارہ فروخت کی قیمت ہوتی ہے: گندم کا بھوسا اور چاول کی بھوسی کھاد بن کر 500-750 روپے فی بیگ کی مالیت رکھتے ہیں، کپاس کے ڈنٹھل اور گنے کا چھلکا جانوروں کی خوراک کے طور پر فروخت ہو سکتے ہیں، اور بڑی مقدار میں چھلکا کاغذ کی ملوں کو فروخت ہوتا ہے۔ اس کے لیے نئے آلات کی ضرورت نہیں — صرف جمع کرنا، بنیادی خشک کرنا یا کاٹنا، اور ایک خریدار۔\n\nیہ جاننے کا تیز ترین طریقہ کہ آپ کی مخصوص باقیات کی قیمت کیا ہے، یہاں AgriResilient کا ویسٹ ری سائیکلنگ صفحہ ہے: ایک تصویر اپ لوڈ کریں اور یہ چیز کی شناخت کرتا ہے، آپ کو حقیقت پسندانہ روپے کی قیمت کی حد دیتا ہے، اور آپ کے پروفائل کے مقام کی بنیاد پر قریبی منڈیوں، کھاد پلانٹس، یا خوراک خریداروں کی تجویز دیتا ہے۔\n\nایک چھوٹا کھیت بھی باقیات کو جلانے کے بجائے کھاد میں تبدیل کر کے اگلے ہی موسم میں کھاد کے اخراجات بچاتا ہے — فائدہ صرف نقدی نہیں، بلکہ آنے والے سالوں کے لیے بہتر مٹی بھی ہے۔`,
      sd: `هر موسم ۾ ڪڻڪ جو ڀوسو، ڪپاهه جا ٻوٽا، چانورن جي ڀونڊ ۽ گنيء جي کاڻي کيت ۾ ساڙي ڇڏجي ٿي — هي نه صرف قيمت جو نقصان آهي پر پنجاب ۽ سنڌ ۾ هوا جي آلودگي ۽ دونهين جو هڪ وڏو سبب پڻ آهي.\n\nاڪثر فصل جي بچيل شين جي حقيقي وڪري جي قيمت هوندي آهي: ڪڻڪ جو ڀوسو ۽ چانورن جي ڀونڊ ڀاڻ بڻجي 500-750 رپيا في ٻوري جي قيمت رکن ٿا، ڪپاهه جا ٻوٽا ۽ گنيء جي کاڻي جانورن جي خوراڪ طور وڪامي سگهن ٿا، ۽ وڏي مقدار ۾ کاڻي ڪاڱي جي ملن کي وڪامي ٿي. ان لاءِ نئين سامان جي ضرورت ناهي — رڳو گڏ ڪرڻ، خشڪ ڪرڻ يا ڪٽڻ، ۽ هڪ خريدار.\n\nھي ڄاڻڻ جو تڪڙو طريقو ته توهان جي مخصوص بچيل شين جي قيمت ڇا آهي، هتي AgriResilient جو ويسٽ ري سائيڪلنگ صفحو آهي: هڪ تصوير اپ لوڊ ڪريو ۽ اهو شئي جي سڃاڻپ ڪري ٿو، توهان کي حقيقي پي ڪي آر قيمت جي حد ڏئي ٿو، ۽ توهان جي پروفائل جي هنڌ جي بنياد تي قريبي منڊين، ڀاڻ پلانٽس، يا خوراڪ خريدارن جي صلاح ڏئي ٿو.\n\nھڪ ننڍي ٻني به بچيل شين کي ساڙڻ بدران ڀاڻ ۾ تبديل ڪري ايندڙ موسم ۾ ڀاڻ جو خرچ بچائي ٿي — فائدو رڳو نقد نه، پر ايندڙ سالن لاءِ بھتر مٽي پڻ آهي.`,
    },
    author: 'Ahmed Raza',
    image: 'https://images.unsplash.com/photo-1752741177226-d4d595d8c517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBjb21wb3N0fGVufDF8fHx8MTc2MjE0OTA2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    published: true,
    createdAt: new Date('2025-10-25'),
  },
];

const aboutContent = {
  section: 'about',
  intro: {
    en: 'AgriResilient is an AI-powered platform designed to help Pakistani farmers adapt to climate change through smart crop advisory, waste recycling, and carbon rewards.',
    ur: 'AgriResilient ایک AI سے چلنے والا پلیٹ فارم ہے جو پاکستانی کسانوں کو موسمیاتی تبدیلی کے مطابق ڈھالنے میں مدد کرتا ہے۔',
    sd: 'AgriResilient هڪ AI سان هلندڙ پليٽ فارم آهي جيڪو پاڪستاني هارين کي موسمياتي تبديليءَ موجب ڍلڻ ۾ مدد ڪري ٿو.',
  },
  values: [
    {
      title: { en: 'Mission', ur: 'مشن', sd: 'مشن' },
      desc: {
        en: 'Empower farmers with AI technology',
        ur: 'کسانوں کو AI ٹیکنالوجی سے بااختیار بنانا',
        sd: 'هارين کي AI ٽيڪنالاجي سان بااختيار بڻائڻ',
      },
    },
    {
      title: { en: 'Community', ur: 'کمیونٹی', sd: 'ڪميونٽي' },
      desc: {
        en: 'Building sustainable farming networks',
        ur: 'پائیدار کھیتی کے نیٹ ورک بنانا',
        sd: 'پائيدار زراعت جا نيٽ ورڪ بڻائڻ',
      },
    },
    {
      title: { en: 'Innovation', ur: 'اختراع', sd: 'جدت' },
      desc: {
        en: 'Climate-smart solutions',
        ur: 'موسمیاتی سمارٹ حل',
        sd: 'موسمياتي سمارٽ حل',
      },
    },
  ],
  team: [
    { name: 'Dr. Ali Hassan', role: { en: 'AI Researcher', ur: 'AI محقق', sd: 'AI محقق' }, emoji: '👨‍💻' },
    { name: 'Fatima Khan', role: { en: 'Agricultural Expert', ur: 'زرعی ماہر', sd: 'زرعي ماهر' }, emoji: '👩‍🌾' },
    { name: 'Ahmed Raza', role: { en: 'Software Engineer', ur: 'سافٹ ویئر انجینئر', sd: 'سافٽ ويئر انجنيئر' }, emoji: '👨‍💼' },
    { name: 'Sara Malik', role: { en: 'UX Designer', ur: 'UX ڈیزائنر', sd: 'UX ڊيزائنر' }, emoji: '👩‍🎨' },
  ],
};

const footerContent = {
  section: 'footer',
  aboutBlurb: {
    en: 'Empowering Pakistani farmers with AI-driven climate solutions for sustainable agriculture.',
    ur: 'پاکستانی کسانوں کو AI سے چلنے والے موسمیاتی حل کے ساتھ بااختیار بنانا',
    sd: 'پاڪستاني هارين کي AI سان هلندڙ موسمياتي حلن سان بااختيار بڻائڻ',
  },
  email: 'info@agriresilient.pk',
  phone: '+92 300 1234567',
  address: { en: 'Islamabad, Pakistan', ur: 'اسلام آباد، پاکستان', sd: 'اسلام آباد، پاڪستان' },
  socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' },
};

const homeContent = {
  section: 'home',
  testimonials: [
    {
      name: { en: 'Ali Akber', ur: 'علی اکبر', sd: 'علي اڪبر' },
      location: { en: 'NawabShah', ur: 'نواب شاہ', sd: 'نواب شاهه' },
      text: {
        en: 'AgriResilient helped me increase my wheat yield by 30%!',
        ur: 'AgriResilient نے میری گندم کی پیداوار میں 30٪ اضافہ کیا!',
        sd: 'AgriResilient منهنجي ڪڻڪ جي پيداوار ۾ 30٪ اضافو ڪيو!',
      },
      image: 'https://c8.alamy.com/comp/KF2N6Y/a-portrait-of-a-sindhi-villager-pakistan-KF2N6Y.jpg',
      rating: 5,
    },
    {
      name: { en: 'Muhammad Ali', ur: 'محمد علی', sd: 'محمد علي' },
      location: { en: 'Faisalabad', ur: 'فیصل آباد', sd: 'فيصل آباد' },
      text: {
        en: 'The AI advisory is spot on. Saved my cotton crop from pests.',
        ur: 'AI مشورہ بالکل درست ہے۔ میری کپاس کی فصل کو کیڑوں سے بچایا۔',
        sd: 'AI صلاح بلڪل درست آهي. منهنجي ڪپاس جي فصل کي حشرن کان بچايو.',
      },
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
      rating: 5,
    },
    {
      name: { en: 'Ghulam Hasain', ur: 'غلام حسین', sd: 'غلام حسين' },
      location: { en: 'Sakrand', ur: 'سکرنڈ', sd: 'سڪرنڊ' },
      text: {
        en: 'A revolutionary platform for Pakistani agriculture.',
        ur: 'پاکستانی زراعت کے لیے ایک انقلابی پلیٹ فارم۔',
        sd: 'پاڪستاني زراعت لاءِ هڪ انقلابي پليٽ فارم۔',
      },
      image: 'https://ozoutback.com.au/Pakistan/sindh/slides/19791221009.jpg',
      rating: 5,
    },
  ],
};

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL;
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const existingBlogCount = await BlogPost.countDocuments();
  if (existingBlogCount === 0) {
    await BlogPost.insertMany(blogPosts);
    console.log(`Seeded ${blogPosts.length} blog posts.`);
  } else {
    console.log(`Skipped blog seeding — ${existingBlogCount} post(s) already exist.`);
  }

  await SiteContent.findOneAndUpdate(
    { section: 'about' },
    aboutContent,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Seeded About page content.');

  await SiteContent.findOneAndUpdate(
    { section: 'footer' },
    footerContent,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Seeded Footer content.');

  await SiteContent.findOneAndUpdate(
    { section: 'home' },
    homeContent,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Seeded Home page testimonials.');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
