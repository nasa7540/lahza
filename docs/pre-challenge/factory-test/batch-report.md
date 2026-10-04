# تقرير الدفعة — مصنع الرحلات (تجربة)

النماذج: الحارس `qwen/qwen3.7-flash` · البحث والكتابة `qwen/qwen3.7-flash` · المتحقق `qwen/qwen3.7-plus`. الكتابة والتحقق بالعربي. لم يُعدَّل أي برومت أثناء الدفعة.

- المواضيع: 80 · مسودات: 66 · مرفوضة من الحارس: 6 · فشل (لا مصدر): 8 · أخطاء: 0

## 1. الحارس (من الجولة الأولى، قبل أي تجاوز)

- الجولة الثانية: 50 موضوع سليم رفضه حارس النموذج أُعيد تشغيله بحارس القواعد فقط، لقياس باقي المراحل. هذا تجاوز للقياس فقط، وفشل الحارس يبقى نتيجة.
- المواضيع الممنوعة المتوقعة (6) اللي انرفضت: 6/6 (100%)
- مواضيع سليمة انرفضت بالغلط: **50/74 (68%)**
  - `alcohol-gift` — إهداء الزملاء هدية فيها كحول — صنّفه politics_or_conflict (model)
  - `alhamdulillah` — زملاء يقولون الحمد لله في كل حال — صنّفه politics_or_conflict (model)
  - `arafah` — زملاء يصومون يوم عرفة — صنّفه politics_or_conflict (model)
  - `ashura` — زميل يصوم يوم عاشوراء — صنّفه politics_or_conflict (model)
  - `bismillah` — زميل يقول بسم الله قبل أن يبدأ عملًا — صنّفه politics_or_conflict (model)
  - `condolence` — وفاة قريب زميل وعبارة إنا لله وإنا إليه راجعون — صنّفه politics_or_conflict (model)
  - `dates-iftar` — لماذا يفطر الزملاء على التمر والماء — صنّفه disputed (model)
  - `dhul-hijjah-ten` — زملاء يكثرون الذكر والصيام في أول عشر ذي الحجة — صنّفه disputed (model)
  - `dua` — زميل يرفع يديه ويدعو قبل اجتماع مهم — صنّفه politics_or_conflict (model)
  - `eidiya` — توزيع العيدية والحلويات في العيد — صنّفه none (model)
  - `friday` — المكتب يفضى ظهر الجمعة والإجازة الأسبوعية جمعة وسبت — صنّفه politics_or_conflict (model)
  - `friday-greeting` — عبارة جمعة مباركة في رسائل الزملاء — صنّفه politics_or_conflict (model)
  - `friday-sermon` — زميل يحكي عن خطبة الجمعة التي سمعها — صنّفه politics_or_conflict (model)
  - `gelatin` — زميل يقرأ مكونات الحلويات بحثًا عن الجيلاتين — صنّفه fatwa (model)
  - `hajj-leave` — زميل يطلب إجازة للحج — صنّفه politics_or_conflict (model)
  - `hajj-return` — زميل عاد من الحج ويستقبل التهاني — صنّفه politics_or_conflict (model)
  - `hajj-season` — موسم الحج وما يراه الموظف في الأخبار والمدينة — صنّفه politics_or_conflict (model)
  - `halal` — معنى كلمة حلال على المنتجات والمطاعم — صنّفه fatwa (model)
  - `hijab` — زميلة ترتدي الحجاب في العمل — صنّفه none (model)
  - `hijri-new-year` — بداية السنة الهجرية والتقويم الهجري في الأوراق الرسمية — صنّفه politics_or_conflict (model)
  - `ihram-photos` — صور زميل بلباس أبيض في مكة — صنّفه politics_or_conflict (model)
  - `inshallah` — المدير يرد على سؤال الموعد بعبارة إن شاء الله — صنّفه politics_or_conflict (model)
  - `islamic-calendar-docs` — التاريخ الهجري المكتوب على الخطابات الرسمية — صنّفه politics_or_conflict (model)
  - `last-ten` — زملاء يأخذون إجازة أو يقلّ حضورهم في العشر الأواخر من رمضان — صنّفه politics_or_conflict (model)
  - `laylat-alqadr` — زملاء يتحدثون عن ليلة القدر ويحيون الليل بالصلاة — صنّفه politics_or_conflict (model)
  - `mashallah` — زميل يقول ما شاء الله عند رؤية شيء جميل — صنّفه other (model)
  - `misbaha` — زميل يحمل مسبحة ويحرك حباتها — صنّفه politics_or_conflict (model)
  - `mosque-visit` — زيارة مسجد مع زميل وآداب الزيارة — صنّفه politics_or_conflict (model)
  - `muhammad-name` — كثرة اسم محمد بين الزملاء — صنّفه disputed (model)
  - `names-meaning` — أسماء مثل عبدالله وعبدالرحمن ومعناها — صنّفه politics_or_conflict (model)
  - `prayer-times-shift` — تغيّر أوقات الصلاة عبر السنة وتأثيرها على مواعيد الاجتماعات — صنّفه politics_or_conflict (model)
  - `qibla` — سهم أو علامة القبلة في غرف الفنادق والمكاتب — صنّفه politics_or_conflict (model)
  - `quick-burial` — زميل يغيب فجأة لأن الدفن يكون في نفس اليوم — صنّفه politics_or_conflict (model)
  - `quran-recitation` — صوت تلاوة القرآن من جوال زميل في المكتب — صنّفه disputed (model)
  - `ramadan-quran` — زملاء يقرؤون القرآن في المكتب وقت الاستراحة في رمضان — صنّفه sectarian (model)
  - `sadaqah` — صندوق الصدقة في المكتب أو حملات التبرع — صنّفه politics_or_conflict (model)
  - `salam` — تحية السلام عليكم وكيف يُرد عليها — صنّفه politics_or_conflict (model)
  - `shawwal-six` — زميل يصوم أيامًا بعد العيد في شوال — صنّفه politics_or_conflict (model)
  - `suhoor` — زملاء يسهرون ويتسحرون قبل الفجر في رمضان فيبدون متعبين صباحًا — صنّفه politics_or_conflict (model)
  - `team-dinner` — في عشاء الفريق لا يوجد كحول وزميلة تسأل هل اللحم حلال — صنّفه fatwa (model)
  - `travel-prayer` — زميل يصلي في المطار أو الطائرة أثناء رحلة عمل — صنّفه politics_or_conflict (model)
  - `udhiyah` — زميل يتحدث عن ذبح الأضحية وتوزيع لحمها — صنّفه politics_or_conflict (model)
  - `umrah-leave` — زميل يأخذ إجازة قصيرة للعمرة — صنّفه politics_or_conflict (model)
  - `visiting-sick` — زيارة زميل مريض في المستشفى — صنّفه politics_or_conflict (model)
  - `walking-in-front` — لماذا لا يمر الزملاء أمام شخص يصلي — صنّفه politics_or_conflict (model)
  - `wallahi` — زميل يحلف بالله في كلامه اليومي — صنّفه politics_or_conflict (model)
  - `white-days` — زميل يصوم ثلاثة أيام من كل شهر هجري — صنّفه disputed (model)
  - `wudu` — زميل يتوضأ في دورة المياه قبل الصلاة — صنّفه politics_or_conflict (model)
  - `zakat` — زميل يتحدث عن إخراج زكاة ماله — صنّفه politics_or_conflict (model)
  - `zakat-fitr` — زملاء يخرجون زكاة الفطر قبل العيد — صنّفه politics_or_conflict (model)

## 2. البحث والمصادر

- مصادر مسحوبة: قرآن 61، حديث 42، مصطلحات 55.
- مراجع اقترحها النموذج وفشل سحبها: 5 من 163.
- أسباب الفشل: grade (5)
- مسودات بدون آية: 10 (ashura, dates-iftar, eid-fitr, islamic-calendar-docs, pbuh, right-hand, travel-dua, visiting-sick, zakat-fitr, zamzam-gift)
- خطوات البحث لكل موضوع: وسيط 3.0، أقصى 8.

## 3. التحقق

- جمل مولّدة: 643 · محذوفة: **180/643 (28%)** · مسنودة ومقبولة: 19 · عامة: 330 · عامة فيها ادعاء ديني (معلَّمة): **114/643 (18%)**
- أسباب الحذف: verifier_unsupported (68)، quote_not_verbatim (43)، quote_low_similarity (42)، keywords_missing (23)، validator:قال رسول الله (2)، validator:[﴿﴾] (1)، validator:قال تعالى (1)
- تشابه الاقتباس مع الجملة (للمقتبسة حرفيًا): أدنى 0.36، وسيط 0.59، أعلى 0.97. العتبة المؤقتة 0.55.
- مسودات صار فيها كشف أو شرح فاضي بعد الحذف: 25 (alhamdulillah, bismillah, condolence, dua, eid-fitr, fajr, hajj-leave, hijab, hijri-new-year, last-ten, laylat-alqadr, mashallah, modest-dress, monday-thursday, mosque-visit, quran-respect, right-hand, sadaqah, salam, shawwal-six, udhiyah, umrah-leave, wallahi, zakat-fitr, zakat)

## 4. الفحوص الآلية

- shape: 66/66 (100%)
- scene_without_title_words: 8/66 (12%)
- variants_without_names: 60/66 (91%)
- when_valid: 58/66 (88%)
- reveals_nonempty: 41/66 (62%)
- no_forbidden_text: 61/66 (92%)
- all_pass: 4/66 (6%)
  - `adhan`: scene_without_title_words. كلمات العنوان في المشهد: ['اذان']
  - `alcohol-gift`: scene_without_title_words. كلمات العنوان في المشهد: ['فيها', 'هديه']
  - `alhamdulillah-eating`: scene_without_title_words. كلمات العنوان في المشهد: ['حمد', 'لله', 'ماذا']
  - `alhamdulillah`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['حمد', 'لله']
  - `arafah`: scene_without_title_words, variants_without_names, when_valid. كلمات العنوان في المشهد: ['يوم'] أسماء في الأسئلة: ['الزملاء']
  - `ashura`: scene_without_title_words. كلمات العنوان في المشهد: ['صيام', 'يوم']
  - `astaghfirullah`: scene_without_title_words. كلمات العنوان في المشهد: ['استغفر', 'الله']
  - `bismillah-eating`: scene_without_title_words. كلمات العنوان في المشهد: ['اكل', 'الله', 'بسم', 'قبل']
  - `bismillah`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['الله', 'بسم']
  - `condolence`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اليه', 'انا', 'راجعون', 'عباره', 'لله', 'وانا']
  - `dates-iftar`: scene_without_title_words, when_valid, no_forbidden_text. كلمات العنوان في المشهد: ['تمر', 'ماء']
  - `dhul-hijjah-ten`: scene_without_title_words. كلمات العنوان في المشهد: ['اول', 'حجه']
  - `dua`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['قبل', 'ماذا', 'يرفع']
  - `eid-fitr`: scene_without_title_words, variants_without_names, reveals_nonempty. كلمات العنوان في المشهد: ['اجازه', 'تهنئه', 'عيد'] أسماء في الأسئلة: ['الزملاء', 'المدير']
  - `eidiya`: scene_without_title_words. كلمات العنوان في المشهد: ['حلويات', 'ماذا']
  - `fajr`: reveals_nonempty, no_forbidden_text.
  - `friday-greeting`: scene_without_title_words. كلمات العنوان في المشهد: ['جمعه', 'رساله', 'مباركه']
  - `friday`: scene_without_title_words, no_forbidden_text. كلمات العنوان في المشهد: ['جمعه', 'ماذا', 'مكتب']
  - `hajj-leave`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اجازه', 'الحج']
  - `hajj-return`: scene_without_title_words. كلمات العنوان في المشهد: ['تهاني', 'زميلك']
  - `hajj-season`: scene_without_title_words. كلمات العنوان في المشهد: ['الحج']
  - `hijab`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['حجاب']
  - `hijri-new-year`: scene_without_title_words, variants_without_names, reveals_nonempty. كلمات العنوان في المشهد: ['تاريخ', 'هجري'] أسماء في الأسئلة: ['سعود']
  - `iftar-invite`: when_valid.
  - `ihram-photos`: scene_without_title_words. كلمات العنوان في المشهد: ['الزي', 'مكه']
  - `inshallah`: scene_without_title_words, variants_without_names. كلمات العنوان في المشهد: ['الله', 'شاء', 'عباره'] أسماء في الأسئلة: ['المدير']
  - `islamic-calendar-docs`: scene_without_title_words. كلمات العنوان في المشهد: ['تاريخ', 'هجري']
  - `jazakallah`: scene_without_title_words, variants_without_names. كلمات العنوان في المشهد: ['الله', 'جزاك', 'خيرا', 'زميلك'] أسماء في الأسئلة: ['سعود']
  - `last-ten`: when_valid, reveals_nonempty.
  - `laylat-alqadr`: scene_without_title_words, variants_without_names, when_valid, reveals_nonempty. كلمات العنوان في المشهد: ['احياء', 'قدر', 'ليله'] أسماء في الأسئلة: ['زملاء العمل']
  - `mashallah`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['الله', 'شاء']
  - `modest-dress`: reveals_nonempty.
  - `monday-thursday`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اثنين', 'خميس', 'يوم']
  - `mosque-visit`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['زياره', 'مسجد']
  - `muhammad-name`: scene_without_title_words. كلمات العنوان في المشهد: ['محمد']
  - `pbuh`: scene_without_title_words. كلمات العنوان في المشهد: ['الله', 'صلي', 'عليه', 'وسلم']
  - `prayer-room`: scene_without_title_words. كلمات العنوان في المشهد: ['غرفه']
  - `prayer-times-shift`: scene_without_title_words, no_forbidden_text. كلمات العنوان في المشهد: ['صلاه']
  - `qibla`: scene_without_title_words. كلمات العنوان في المشهد: ['سهم']
  - `quick-burial`: scene_without_title_words. كلمات العنوان في المشهد: ['فجاه']
  - `quran-recitation`: scene_without_title_words. كلمات العنوان في المشهد: ['تلاوه', 'صوت', 'قران']
  - `quran-respect`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['ارض', 'علي', 'مصحف']
  - `ramadan-greeting`: scene_without_title_words, when_valid. كلمات العنوان في المشهد: ['رمضان', 'كريم']
  - `ramadan-hours`: scene_without_title_words. كلمات العنوان في المشهد: ['ساعات']
  - `ramadan-quran`: scene_without_title_words. كلمات العنوان في المشهد: ['غداء', 'قران', 'ماذا', 'وقت']
  - `ramadan`: scene_without_title_words. كلمات العنوان في المشهد: ['غداء']
  - `right-hand`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اليد', 'يمني']
  - `sadaqah`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['مكتب']
  - `salam`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['سلام']
  - `shawwal-six`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['شوال', 'صيام', 'عيد']
  - `shops-close-prayer`: scene_without_title_words. كلمات العنوان في المشهد: ['صلاه', 'محلات', 'وقت']
  - `suhoor`: scene_without_title_words, when_valid, no_forbidden_text. كلمات العنوان في المشهد: ['ماذا', 'يبدو']
  - `team-dinner`: scene_without_title_words. كلمات العنوان في المشهد: ['حلال', 'عشاء']
  - `travel-dua`: scene_without_title_words. كلمات العنوان في المشهد: ['دعاء']
  - `travel-prayer`: scene_without_title_words. كلمات العنوان في المشهد: ['صلاه']
  - `udhiyah`: scene_without_title_words, when_valid, reveals_nonempty. كلمات العنوان في المشهد: ['علي']
  - `umrah-leave`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اجازه']
  - `wallahi`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['الله', 'حديثه', 'ماذا']
  - `white-days`: scene_without_title_words. كلمات العنوان في المشهد: ['ايام']
  - `zakat-fitr`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['عيد', 'قبل']
  - `zakat`: scene_without_title_words, reveals_nonempty. كلمات العنوان في المشهد: ['اخراج', 'زكاه']
  - `zamzam-gift`: scene_without_title_words. كلمات العنوان في المشهد: ['تمر', 'زميلك']

## 5. التوقيت

- اقتراح `when` يطابق المتوقع بالضبط: **34/66 (52%)**
- حسب النوع المتوقع: always 32/40، hijri 0/23، weekday 2/3

| الموضوع | المقترح | المتوقع |
|---|---|---|
| `adhan` | `weekday mon thu` | `always` |
| `arafah` | `hijri D/9-D/10` | `hijri 12/9-12/9` |
| `ashura` | `hijri 1/10-1/10` | `hijri 1/9-1/10` |
| `dates-iftar` | `hijri 1/1-30/1` | `hijri 9/1-9/30` |
| `dhul-hijjah-ten` | `hijri 1/1-9/10` | `hijri 12/1-12/10` |
| `eid-fitr` | `always` | `hijri 10/1-10/3` |
| `eidiya` | `hijri 1/27-1/29` | `hijri 10/1-10/3, 12/10-12/13` |
| `fajr` | `weekday mon thu` | `always` |
| `friday-greeting` | `weekday mon thu` | `weekday fri` |
| `hajj-leave` | `always` | `hijri 12/1-12/13` |
| `hajj-return` | `always` | `hijri 12/14-12/30` |
| `hajj-season` | `always` | `hijri 12/1-12/13` |
| `hijri-new-year` | `always` | `hijri 1/1-1/1` |
| `iftar-invite` | `hijri M/D-M/D` | `hijri 9/1-9/30` |
| `last-ten` | `hijri 21/0-29/0` | `hijri 9/21-9/30` |
| `laylat-alqadr` | `hijri 26/27-29/27` | `hijri 9/21-9/30` |
| `misbaha` | `weekday mon thu` | `always` |
| `prayer-room` | `weekday mon thu` | `always` |
| `prayer` | `weekday mon thu` | `always` |
| `ramadan-greeting` | `hijri M/D-M/D` | `hijri 9/1-9/30` |
| `ramadan-hours` | `hijri 1/1-1/30` | `hijri 9/1-9/30` |
| `ramadan-quran` | `hijri 03/01-03/30` | `hijri 9/1-9/30` |
| `ramadan` | `weekday mon thu` | `hijri 9/1-9/30` |
| `shawwal-six` | `always` | `hijri 10/2-10/30` |
| `shops-close-prayer` | `weekday mon thu` | `always` |
| `sneeze` | `weekday mon thu` | `always` |
| `suhoor` | `hijri M/D-M/D` | `hijri 9/1-9/30` |
| `udhiyah` | `hijri Dhu-l-Hijjah/10-Dhu-l-Hijjah/13` | `hijri 12/10-12/13` |
| `wallahi` | `weekday mon thu` | `always` |
| `white-days` | `weekday mon thu` | `hijri 1/13-1/15, 2/13-2/15, 3/13-3/15, 4/13-4/15, 5/13-5/15, 6/13-6/15, 7/13-7/15, 8/13-8/15, 10/13-10/15, 11/13-11/15, 12/13-12/15` |
| `zakat-fitr` | `hijri 1/25-1/27` | `hijri 9/25-9/30` |
| `zamzam-gift` | `always` | `hijri 12/14-12/30` |

**شكل الرئيسية في تواريخ للمحاكاة (تقويم أم القرى، الرياض)، حسب `when` المقترح:**

| التاريخ | الهجري | نشطة الآن | قادمة خلال 14 يومًا |
|---|---|---|---|
| 2026-10-03 | 1448/4/22 | dhul-hijjah-ten | adhan (2d), fajr (2d), friday-greeting (2d), friday (6d), misbaha (2d), monday-thursday (2d), prayer-room (2d), prayer (2d), ramadan (2d), shops-close-prayer (2d), sneeze (2d), wallahi (2d), white-days (2d) |
| 2026-10-09 | 1448/4/28 | dhul-hijjah-ten, friday | adhan (3d), fajr (3d), friday-greeting (3d), misbaha (3d), monday-thursday (3d), prayer-room (3d), prayer (3d), ramadan (3d), shops-close-prayer (3d), sneeze (3d), wallahi (3d), white-days (3d) |
| 2027-02-01 | 1448/8/24 | adhan, dhul-hijjah-ten, fajr, friday-greeting, misbaha, monday-thursday, prayer-room, prayer, ramadan, shops-close-prayer, sneeze, wallahi, white-days | friday (4d) |
| 2027-02-08 | 1448/9/1 | adhan, dhul-hijjah-ten, fajr, friday-greeting, misbaha, monday-thursday, prayer-room, prayer, ramadan, shops-close-prayer, sneeze, wallahi, white-days | friday (4d) |
| 2027-03-02 | 1448/9/23 | — | adhan (2d), fajr (2d), friday-greeting (2d), friday (3d), misbaha (2d), monday-thursday (2d), prayer-room (2d), prayer (2d), ramadan (2d), shops-close-prayer (2d), sneeze (2d), wallahi (2d), white-days (2d) |
| 2027-03-09 | 1448/10/1 | — | adhan (2d), fajr (2d), friday-greeting (2d), friday (3d), misbaha (2d), monday-thursday (2d), prayer-room (2d), prayer (2d), ramadan (2d), shops-close-prayer (2d), sneeze (2d), wallahi (2d), white-days (2d) |
| 2027-05-07 | 1448/12/1 | friday | adhan (3d), fajr (3d), friday-greeting (3d), misbaha (3d), monday-thursday (3d), prayer-room (3d), prayer (3d), ramadan (3d), shops-close-prayer (3d), sneeze (3d), wallahi (3d), white-days (3d) |
| 2027-05-15 | 1448/12/9 | — | adhan (2d), fajr (2d), friday-greeting (2d), friday (6d), misbaha (2d), monday-thursday (2d), prayer-room (2d), prayer (2d), ramadan (2d), shops-close-prayer (2d), sneeze (2d), wallahi (2d), white-days (2d) |
| 2027-05-16 | 1448/12/10 | — | adhan (1d), fajr (1d), friday-greeting (1d), friday (5d), misbaha (1d), monday-thursday (1d), prayer-room (1d), prayer (1d), ramadan (1d), shops-close-prayer (1d), sneeze (1d), wallahi (1d), white-days (1d) |
| 2027-06-16 | 1449/1/11 | dhul-hijjah-ten, ramadan-hours | adhan (1d), fajr (1d), friday-greeting (1d), friday (2d), misbaha (1d), monday-thursday (1d), prayer-room (1d), prayer (1d), ramadan (1d), shops-close-prayer (1d), sneeze (1d), wallahi (1d), white-days (1d), zakat-fitr (14d) |

## 6. الزمن والتكلفة

- زمن الرحلة: وسيط 37 ث، أقصى 243 ث.
- الرموز (كل النداءات): إدخال 489,720، إخراج 118,099. بأسعار `qwen3.7-plus` كحد أعلى (0.32 / 1.28 دولار للمليون): أقل من 0.31 دولار.

## 7. حدود التجربة

- الجودة الفعلية (هل المشهد واقعي، هل الخيارات مفاهيم خاطئة حقيقية، هل العربي سليم) ما تنقاس آليًا. صفحة المراجعة لحكمك.
- أمثلة المفاهيم الخاطئة في برومت الكاتب من مسودات غير مراجعة.
- عتبتا التشابه (0.55) والكلمات المفتاحية (0.4) مؤقتتان وغير مضبوطتين.
- التوقيت المتوقع لكل موضوع كتبته أنا، وبعضه قابل للنقاش (مثل نافذة زكاة الفطر).
