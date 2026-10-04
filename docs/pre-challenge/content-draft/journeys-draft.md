# مسودة محتوى الرحلات الست — لحظة

**الحالة:** مسودة للمراجعة، كتبها Claude بتاريخ 2 أكتوبر 2026. ليست معتمدة.

**كيف تراجع:**
- عدّل أي نص مباشرة في هذا الملف.
- ما فيه أي نص شرعي هنا. الآيات مذكورة كمراجع فقط، ونصها ينسحب يوم 4 من quranenc.com.
- "الشرح المبسط" مسودة ذكاء اصطناعي. اسأل نفسك عند كل واحد: هل يمثّل الآية بدون ما يحمّلها معنى زايد؟
- علامة ⚠️ تعني نقطة تحتاج قرارك أو تأكدك.
- رمضان مأخوذ من النموذج الأولي، مع تبديل الخيار الرابع إلى "عادة ثقافية".
- بعد أي تعديل شغّل `python3 ~/lahza-drafts/build-content.py` لتحديث ملفات JSON.

---

## ترتيب الرحلات حسب التاريخ (حقل `when`)

كل رحلة لها حقل `when` بواحدة من ثلاث صيغ:

| الصيغة | المعنى | مثال |
|---|---|---|
| `hijri م/ي-م/ي` | نافذة أو أكثر بالتاريخ الهجري (شهر/يوم)، مفصولة بفاصلة، والطرفان داخلان | `hijri 9/1-9/30` |
| `weekday يوم` | يوم أو أكثر من الأسبوع: `sun mon tue wed thu fri sat` | `weekday fri` |
| `always` | دائمة | `always` |

**الرئيسية تعرض بهذا الترتيب:**
1. **النشطة الآن:** اليوم داخل نافذة الرحلة، أو يوافق يومها من الأسبوع.
2. **القادمة خلال 14 يومًا:** مع عدّاد بالأيام المتبقية لبداية أقرب نافذة.
3. **الدائمة.**

والرحلات الست كلها تبقى متاحة في المكتبة في أي وقت، بدون قفل. فحقل `when` يحل محل `unlock_rule`.

**الحساب (يُبنى يوم 4):** التاريخ الهجري من `Intl` بتقويم `islamic-umalqura` ومنطقة `Asia/Riyadh`. إذا كان الشهر 29 يومًا ونهاية النافذة يوم 30، تنتهي النافذة بنهاية الشهر. وباراميتر `date` في الرابط (مثل `?date=2027-02-05`) يحاكي تاريخًا آخر للعرض.

**تواريخ تنفع للمحاكاة في العرض** (محسوبة بتقويم أم القرى لسنة 1448):

| قيمة `date` | وش يظهر |
|---|---|
| `2027-02-01` | رمضان قادم بعد 7 أيام |
| `2027-02-08` | رمضان نشط (1 رمضان، ورمضان هذي السنة 29 يومًا) |
| `2027-03-02` | العيد قادم بعد 7 أيام، ورمضان نشط |
| `2027-03-09` | عيد الفطر نشط |
| `2027-05-16` | عيد الأضحى نشط |
| أي يوم جمعة | رحلة الجمعة نشطة |

في أيام التحكيم (أكتوبر 2026، ربيع الآخر 1448) ما فيه رحلة هجرية نشطة ولا قادمة، فالرئيسية تعرض الجمعة والدائمة فقط، ولهذا باراميتر `date` مهم للعرض.

⚠️ تقويم أم القرى حسابي، وبداية رمضان والعيد الفعلية تُعلن برؤية الهلال وقد تختلف يومًا. للعرض هذا كافٍ، ويُذكر في القيود.

---

## 1. رمضان — `ramadan` — المستوى أ

**المصدر:** البقرة 2:183 — `TODO_VERBATIM`
**التوقيت (`when`):** `hijri 9/1-9/30` — شهر رمضان كاملًا

### عربي

- **العنوان:** رمضان
- **التشويق:** رمضان يبدأ الأحد. تحب تفهم وش بتشوف حولك؟
- **المشهد:** زميلك خالد اعتذر بلطف عن غداء الفريق وهو مبتسم. ليش برأيك؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-diet` | حمية |
| `m-punish` | عقاب ديني |
| `m-upset` | زعلان من الفريق |
| `m-culture` | مجرد عادة ثقافية |

**الكشف:**
- **`m-diet`** — *ليست حمية، بل صيام.* من السهل أن تظنها حمية. خالد صائم في رمضان: لا طعام ولا شراب من الفجر حتى غروب الشمس، كل يوم لمدة شهر. الأمر يتعلق بالمعنى لا بالسعرات.
- **`m-punish`** — *كثير يظنون إن الصيام عقاب.* ومعناه الحقيقي أقرب إلى العكس: يرى المسلمون رمضان شهرًا ينتظرونه طوال العام، شهرَ انضباط وتأمّل وكرم.
- **`m-upset`** — *الابتسامة كانت صادقة.* قد يبدو الاعتذار عن الغداء ابتعادًا، لكن خالد صائم في رمضان، وطلبه منكم أن تستمتعوا بدونه لطفٌ منه.
- **`m-culture`** — *أكثر من عادة.* لرمضان عادات اجتماعية جميلة تختلف من بلد إلى آخر، لكن الصيام نفسه عبادة، وهو أحد أركان الإسلام الخمسة، ويصومه المسلمون في كل الثقافات.

**الشرح المبسط (مسودة):** تذكر الآية أن الصيام ليس جديدًا، فقد كُتب على أمم سابقة. وغايته المذكورة هي التقوى: وعيٌ دائم بالله ينعكس على تصرّفات الإنسان اليومية. لذلك يعيش كثير من المسلمين رمضان كفرصة لتجديد النفس، لا كعقوبة.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *عادي تاكل قدامه.* وكلمة «رمضان كريم» تفرّحه.
- لا داعي لإخفاء قهوتك أو غدائك، فقط لا تعرض عليه الأكل خلال النهار.
- تخطط لغداء فريق؟ اجعله اختياريًا، أو حوّله إلى إفطار مسائي.
- ساعات الدوام غالبًا تتغيّر في رمضان، تأكد من جدول فريقك.

**نقاط الفهم:**
- `kp1` الصيام امتناع عن الطعام والشراب من الفجر إلى غروب الشمس.
- `kp2` يكون كل يوم طوال شهر رمضان.
- `kp3` غايته التقوى وضبط النفس والقرب من الله، وليس عقوبة.

**أسئلة الأمثلة:**
1. ليش زميلي ما ياكل معنا في الغداء هالشهر؟
2. وش معنى رمضان؟
3. ليش المسلمين يصومون؟
4. هل عادي آكل قدام زميلي الصايم؟
5. ليش تغيّرت ساعات الدوام هالشهر؟

### English

- **Title:** Ramadan
- **Teaser:** Ramadan begins Sunday. Want to understand what you'll see around you?
- **Scene:** Your colleague Khalid politely declined the team lunch — and he was smiling. Why do you think?

**Options:**
| id | Label |
|---|---|
| `m-diet` | He's on a diet |
| `m-punish` | It's a religious punishment |
| `m-upset` | He's upset with the team |
| `m-culture` | It's just a cultural custom |

**Reveals:**
- **`m-diet`** — *Not a diet — a fast.* It's easy to read it that way. Khalid is fasting for Ramadan: no food or drink from dawn until sunset, every day for a month. It's about meaning, not calories.
- **`m-punish`** — *Many people think fasting is a punishment.* Its real meaning is closer to the opposite. Muslims see Ramadan as a month they look forward to all year — a time of discipline, reflection and generosity.
- **`m-upset`** — *The smile was real.* Declining lunch can look like distance. Khalid is fasting for Ramadan — and telling you to go ahead without him is his way of being considerate.
- **`m-culture`** — *More than a custom.* Ramadan does come with lovely social traditions that differ from country to country. But the fast itself is an act of worship — one of the five pillars of Islam — and Muslims in every culture observe it.

**Simplified explanation (draft):** The verse says fasting isn't new — earlier communities fasted too. Its stated purpose is taqwa: a steady awareness of God that shapes everyday behaviour. That's why many Muslims experience Ramadan as a reset, not a penalty.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *It's fine to eat in front of him.* And saying "Ramadan Kareem" will make his day.
- No need to hide your coffee or lunch — just don't offer him food during the day.
- Planning a team lunch? Make it optional, or move it to an evening iftar.
- Working hours often shift during Ramadan — check your team's schedule.

**Key points:**
- `kp1` Fasting means no food or drink from dawn until sunset.
- `kp2` It is every day for the whole month of Ramadan.
- `kp3` Its purpose is God-consciousness, self-discipline and closeness to God — not punishment.

**Question variants:**
1. Why isn't my colleague eating lunch with us this month?
2. What is Ramadan?
3. Why do Muslims fast?
4. Is it okay to eat in front of a fasting colleague?
5. Why did our working hours change this month?

### اردو (رمضان فقط)

⚠️ ما فيه مراجع للأوردو. النصوص الأساسية موجودة في النموذج الأولي، وهذي الإضافات الجديدة فقط، كتبها Claude بدون مراجعة:

- **`m-culture` (الخيار):** یہ محض ایک ثقافتی رواج ہے
- **`m-culture` (الكشف):** *رواج سے بڑھ کر۔* رمضان کے ساتھ خوبصورت سماجی روایات ضرور جڑی ہیں جو ہر ملک میں مختلف ہیں، لیکن روزہ خود ایک عبادت ہے، اسلام کے پانچ ارکان میں سے ایک، اور ہر ثقافت کے مسلمان اسے رکھتے ہیں۔
- `kp1` روزہ فجر سے غروبِ آفتاب تک کھانے پینے سے رکنے کا نام ہے۔
- `kp2` یہ رمضان کے پورے مہینے ہر روز رکھا جاتا ہے۔
- `kp3` اس کا مقصد تقویٰ، ضبطِ نفس اور اللہ کی قربت ہے، سزا نہیں۔

**سوالات:**
1. میرا ساتھی اس مہینے ہمارے ساتھ دوپہر کا کھانا کیوں نہیں کھا رہا؟
2. رمضان کیا ہے؟
3. مسلمان روزہ کیوں رکھتے ہیں؟
4. کیا روزہ دار ساتھی کے سامنے کھانا ٹھیک ہے؟
5. اس مہینے دفتر کے اوقات کیوں بدل گئے؟

---

## 2. أوقات الصلاة — `prayer` — المستوى أ

**المصدر:** النساء 4:103 — `TODO_VERBATIM`
**التوقيت (`when`):** `always` — دائمة

### عربي

- **العنوان:** أوقات الصلاة
- **التشويق:** زملاؤك يطلعون من الاجتماع دقايق ويرجعون. تبي تعرف ليش؟
- **المشهد:** الساعة 12:15، وأنتم في نص الاجتماع. فهد واثنين من الزملاء استأذنوا بهدوء ورجعوا بعد عشر دقايق. وش تتوقع اللي صار؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-commit` | مو مهتمين بالاجتماع |
| `m-smoke` | استراحة تدخين |
| `m-optional` | عادة اختيارية يقدرون يأجلونها |
| `m-clergy` | شي يسويه المتدينين جدًا بس |

**الكشف:**
- **`m-commit`** — *خروجهم لا علاقة له بالاجتماع.* خرجوا لأداء صلاة الظهر، وهي واحدة من خمس صلوات يؤديها المسلم كل يوم في أوقات محددة. رجوعهم بعد دقائق لإكمال الاجتماع دليل على التزامهم، لا العكس.
- **`m-smoke`** — *استراحة، لكن من نوع آخر.* هذه صلاة الظهر. يتوضأ المسلم ثم يصلي، وتأخذ في العادة من خمس إلى عشر دقائق، ثم يعود إلى عمله.
- **`m-optional`** — *ليست عادة، بل فريضة لها وقت.* الصلوات الخمس واجبة على المسلم، ولكل صلاة وقت يبدأ وينتهي. داخل هذا الوقت توجد مرونة، لكن لا تؤجَّل الصلاة إلى آخر اليوم.
- **`m-clergy`** — *ليست خاصة برجال الدين.* الصلوات الخمس واجبة على كل مسلم بالغ، سواء كان مهندسًا أو محاسبًا أو مديرًا. ولهذا تجد في أغلب المكاتب هنا مصلى.

**الشرح المبسط (مسودة):** تذكر الآية أن الصلاة فُرضت على المؤمنين في أوقات محددة. لذلك لا يختار المسلم وقت صلاته بحسب جدوله، بل يرتّب جدوله حول أوقاتها، وهذا ما تراه في المكتب عند الظهر.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *عشر دقايق تفرق.* لو خليت للاجتماع استراحة قصيرة وقت الصلاة، زملاؤك بيقدّرونها.
- شف أوقات الصلاة قبل ما تحجز اجتماع طويل، خصوصًا الظهر والعصر.
- لو شفت أحد يصلي، لا تكلمه ولا تمر من قدامه، وانتظره يخلص.
- اعرف وين المصلى في مكتبكم، فقد يسألك عنه ضيف.

**نقاط الفهم:**
- `kp1` المسلمون يصلّون خمس صلوات كل يوم في أوقات محددة.
- `kp2` صلاة الظهر تقع في وقت الدوام، وتأخذ حوالي عشر دقائق.
- `kp3` الصلاة فريضة على كل مسلم، وليست دليلًا على قلة الالتزام بالعمل.

**أسئلة الأمثلة:**
1. ليش زملائي يطلعون من الاجتماع وقت الظهر؟
2. كم مرة يصلّي المسلم في اليوم؟
3. كم تاخذ الصلاة من الوقت؟
4. هل أقدر أحط اجتماع وقت الصلاة؟
5. وش هو المصلى اللي في المكتب؟

⚠️ عبارة "لا تمر من قدامه" أدب معروف، تأكد إنك مرتاح لذكرها كنصيحة عملية بدون تفصيل.

### English

- **Title:** Prayer times
- **Teaser:** Your colleagues step out of meetings for a few minutes and come back. Want to know why?
- **Scene:** It's 12:15, mid-meeting. Fahad and two colleagues quietly excuse themselves and return ten minutes later. What do you think happened?

**Options:**
| id | Label |
|---|---|
| `m-commit` | They're not that interested in the meeting |
| `m-smoke` | A smoke break |
| `m-optional` | An optional habit they could postpone |
| `m-clergy` | Something only very religious people do |

**Reveals:**
- **`m-commit`** — *It had nothing to do with the meeting.* They stepped out for the midday prayer, one of five prayers a Muslim performs every day at set times. Coming back minutes later to finish the meeting shows commitment, not the lack of it.
- **`m-smoke`** — *A break — but a different kind.* This is the midday prayer. A Muslim washes, prays, and returns to work. It usually takes five to ten minutes.
- **`m-optional`** — *Not a habit — a duty with a time.* The five daily prayers are obligatory for Muslims, and each has a window that opens and closes. There is some flexibility inside that window, but a prayer isn't pushed to the end of the day.
- **`m-clergy`** — *Not just for religious scholars.* The five prayers are a duty for every adult Muslim — engineer, accountant or manager. That's why most offices here have a prayer room.

**Simplified explanation (draft):** The verse says prayer has been prescribed for believers at set times. So a Muslim doesn't fit prayer around the schedule — the schedule is arranged around prayer. That's what you see in the office at midday.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *Ten minutes make a difference.* A short break at prayer time in a long meeting is always appreciated.
- Check prayer times before booking a long meeting, especially around midday and mid-afternoon.
- If you see someone praying, don't speak to them or walk in front of them — just wait.
- Know where your office prayer room is; a guest may ask you.

**Key points:**
- `kp1` Muslims pray five times a day at set times.
- `kp2` The midday prayer falls in working hours and takes about ten minutes.
- `kp3` Prayer is a duty for every Muslim, not a sign of lower commitment to work.

**Question variants:**
1. Why do my colleagues leave meetings around midday?
2. How many times a day do Muslims pray?
3. How long does a prayer take?
4. Can I schedule a meeting during prayer time?
5. What is the prayer room in our office for?

---

## 3. الجمعة — `friday` — المستوى أ

**المصدر:** الجمعة 62:9 — `TODO_VERBATIM`
**التوقيت (`when`):** `weekday fri` — كل يوم جمعة

### عربي

- **العنوان:** الجمعة
- **التشويق:** ليش الإجازة هنا جمعة وسبت؟
- **المشهد:** ظهر الجمعة، الشوارع شبه فاضية والمحلات مسكّرة، وإجازتك الأسبوعية جمعة وسبت، مو سبت وأحد. ليش الجمعة بالذات؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-dayoff` | مجرد يوم إجازة أسبوعية |
| `m-market` | يوم السوق والتسوق |
| `m-gov` | قرار حكومي لا أكثر |
| `m-sunday` | يوم راحة تامة مثل الأحد |

**الكشف:**
- **`m-dayoff`** — *إجازة، ولها سبب.* في ظهر الجمعة يجتمع المسلمون في المسجد لصلاة أسبوعية جامعة تسبقها خطبة قصيرة، اسمها صلاة الجمعة. الإجازة رُتّبت حول هذه الصلاة.
- **`m-market`** — *العكس تقريبًا.* وقت صلاة الجمعة يترك المسلمون البيع والشراء ويتجهون إلى المسجد، ولهذا تجد المحلات مغلقة عند الظهر. بعد الصلاة تعود الحياة والأسواق.
- **`m-gov`** — *القرار جاء بعد المعنى.* نعم، الإجازة الأسبوعية قرار رسمي، لكنه مبني على مكانة يوم الجمعة عند المسلمين وصلاته الجامعة. ولهذا يختلف يوم الإجازة هنا عن بلدان أخرى.
- **`m-sunday`** — *ليس يوم توقف تام.* الجمعة يوم له مكانة خاصة وصلاة جامعة، لكن الإسلام لا يطلب التوقف عن العمل طوال اليوم. الصلاة وخطبتها تأخذان حوالي ساعة، وبعدها يكمل الناس يومهم.

**الشرح المبسط (مسودة):** تدعو الآية المؤمنين، إذا نودي لصلاة الجمعة، أن يتجهوا إلى ذكر الله ويتركوا البيع. لذلك يتوقف العمل والتجارة وقت الصلاة، ويجتمع الناس في المسجد.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *لا تحجز شي ظهر الجمعة.* حتى لو كان اللقاء غير رسمي.
- لو عندك عمل يوم الجمعة مع زملاء مسلمين، خل وقت الظهر فاضي.
- كلمة «جمعة مباركة» تحية لطيفة تسمعها كثير، وتقدر تقولها.
- كثير من المطاعم والمحلات تفتح بعد الصلاة، فرتّب مشاويرك على هذا.

**نقاط الفهم:**
- `kp1` للجمعة صلاة أسبوعية جامعة وقت الظهر، تسبقها خطبة.
- `kp2` يترك المسلمون العمل والبيع وقت الصلاة ويذهبون إلى المسجد.
- `kp3` الجمعة ليست يوم راحة إلزامية، والإجازة الأسبوعية رُتّبت حولها.

**أسئلة الأمثلة:**
1. ليش الإجازة هنا جمعة وسبت؟
2. ليش المحلات تسكّر ظهر الجمعة؟
3. وش هي صلاة الجمعة؟
4. ليش المكتب يفضى يوم الجمعة الظهر؟
5. وش معنى جمعة مباركة؟

⚠️ النقطة `kp3` وكشف `m-sunday` (إن العمل مسموح بعد الصلاة) معناها مأخوذ من الآية التالية (الجمعة 10)، مو من الآية 9. اقتراحي: نضيف الآية 10 كمصدر ثاني لهذي البطاقة. القرار لك.
⚠️ الأئمة يخطبون خطبتين قصيرتين؛ كتبت "خطبة" للتبسيط. عدّلها إذا تبي الدقة.

### English

- **Title:** Friday
- **Teaser:** Why is the weekend here Friday and Saturday?
- **Scene:** Friday around noon, the streets are almost empty and shops are closed — and your weekend is Friday–Saturday, not Saturday–Sunday. Why Friday?

**Options:**
| id | Label |
|---|---|
| `m-dayoff` | It's just the weekly day off |
| `m-market` | It's market day |
| `m-gov` | It's only a government decision |
| `m-sunday` | It's a day of complete rest, like Sunday |

**Reveals:**
- **`m-dayoff`** — *A day off — with a reason.* At midday on Friday, Muslims gather at the mosque for a weekly congregational prayer preceded by a short sermon, called the Friday prayer. The weekend is arranged around it.
- **`m-market`** — *Almost the opposite.* At the time of the Friday prayer, Muslims leave buying and selling and head to the mosque — that's why shops are closed at noon. After the prayer, life and the markets pick up again.
- **`m-gov`** — *The decision followed the meaning.* Yes, the weekend is set officially — but it is built on the standing of Friday for Muslims and its congregational prayer. That's why the weekend here differs from other countries.
- **`m-sunday`** — *Not a full stop.* Friday has a special standing and a congregational prayer, but Islam does not ask people to stop working for the whole day. The prayer and sermon take about an hour, and then people carry on with their day.

**Simplified explanation (draft):** The verse calls on believers, when the call to the Friday prayer is made, to head to the remembrance of God and leave trade. So work and business pause at prayer time, and people gather at the mosque.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *Keep Friday midday free.* Even for something informal.
- If you're working on a Friday with Muslim colleagues, leave the midday slot open.
- "Jumu'ah Mubarak" (blessed Friday) is a friendly greeting you'll hear a lot — you can say it too.
- Many restaurants and shops open after the prayer, so plan errands around it.

**Key points:**
- `kp1` Friday has a weekly congregational prayer at midday, with a sermon.
- `kp2` Muslims leave work and trade at prayer time and go to the mosque.
- `kp3` Friday is not a day of mandatory rest; the weekend is arranged around the prayer.

**Question variants:**
1. Why is the weekend Friday and Saturday here?
2. Why are shops closed at noon on Friday?
3. What is the Friday prayer?
4. Why is the office empty on Friday afternoon?
5. What does "Jumu'ah Mubarak" mean?

---

## 4. العيد — `eid` — المستوى أ

**المصدر:** حديث ابن عمر رضي الله عنهما في صلاة العيدين قبل الخطبة — متفق عليه — hadeethenc.com رقم 5322 — `TODO_VERBATIM`
⚠️ اقتراح Claude. الدرجة حسب المصدر: صحيح. تأكد منها في الدرر السنية قبل الاعتماد.
**التوقيت (`when`):** `hijri 10/1-10/3, 12/10-12/13` — عيد الفطر (1 إلى 3 شوال) وعيد الأضحى مع أيام التشريق (10 إلى 13 ذو الحجة)

### عربي

- **العنوان:** العيد
- **التشويق:** الإجازة قرّبت، ووش تقول لزميلك؟
- **المشهد:** الشركة أعلنت إجازة عدة أيام، والكل يتبادل التهاني، وزميلتك نورة جابت حلويات للمكتب. تبي تهنّيها بس مو متأكد وش المناسبة بالضبط. وش تظن؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-oneday` | احتفال ليوم واحد |
| `m-social` | مناسبة اجتماعية بحتة |
| `m-xmas` | مثل عيد الميلاد عند المسلمين |
| `m-family` | مناسبة عائلية خاصة ما تخصني |

**الكشف:**
- **`m-oneday`** — *عيدان، وكل عيد عدة أيام.* للمسلمين عيدان في السنة: عيد الفطر بعد انتهاء رمضان، وعيد الأضحى في موسم الحج. والاحتفال والزيارات تمتد عدة أيام، ولهذا تطول الإجازة.
- **`m-social`** — *فرح، وله أصل ديني.* العيد يبدأ بصلاة جامعة في الصباح، ثم تأتي الزيارات والحلويات والملابس الجديدة. عيد الفطر يأتي بعد إتمام شهر الصيام، وعيد الأضحى يأتي مع موسم الحج.
- **`m-xmas`** — *تشبيه مفهوم، لكن المعنى مختلف.* يشبهه في اجتماع العائلة والهدايا والطعام. لكن العيد لا يحتفل بميلاد أحد، بل يأتي بعد إتمام عبادة: الصيام في عيد الفطر، والحج في عيد الأضحى.
- **`m-family`** — *العائلة في القلب، والباب مفتوح.* العيد يشمل زيارة الجيران والأصدقاء والزملاء، والعطاء للمحتاجين جزء منه. تهنئتك لزميلك في مكانها ومرحّب بها.

**الشرح المبسط (مسودة):** يذكر الحديث «العيدين»، وأن النبي ﷺ وصاحبيه كانوا يبدؤونهما بالصلاة ثم الخطبة. فالعيد عند المسلمين يبدأ بصلاة جامعة، وبعدها تأتي الزيارات والتهاني.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *قل «عيد مبارك».* كلمتين تكفي وتفرّح.
- تقدر تقول «عيد مبارك» أو «كل عام وأنتم بخير».
- لو قُدّمت لك حلويات أو قهوة، اقبلها، فهي جزء من فرحة العيد.
- أنجز الأمور المهمة قبل الإجازة، فأغلب الجهات تكون مغلقة أيام العيد.

**نقاط الفهم:**
- `kp1` للمسلمين عيدان في السنة: عيد الفطر بعد رمضان، وعيد الأضحى في موسم الحج.
- `kp2` العيد مناسبة دينية تبدأ بصلاة جامعة، وهو أيام فرح وعطاء.
- `kp3` تهنئة الزملاء بالعيد مرحّب بها، مثل قول «عيد مبارك».

**أسئلة الأمثلة:**
1. وش أقول لزميلي في العيد؟
2. ليش الإجازة طويلة بعد رمضان؟
3. كم عيد عند المسلمين؟
4. وش الفرق بين عيد الفطر وعيد الأضحى؟
5. هل أقدر أهنّي زميلي المسلم بالعيد؟

### English

- **Title:** Eid
- **Teaser:** The holiday is coming — what do you say to your colleague?
- **Scene:** The company announced several days off, everyone is exchanging greetings, and your colleague Noura brought sweets to the office. You'd like to congratulate her, but you're not sure what the occasion really is. What's your guess?

**Options:**
| id | Label |
|---|---|
| `m-oneday` | A one-day celebration |
| `m-social` | A purely social occasion |
| `m-xmas` | The Muslim version of Christmas |
| `m-family` | A private family event that doesn't involve me |

**Reveals:**
- **`m-oneday`** — *Two Eids, each lasting several days.* Muslims have two Eids a year: Eid al-Fitr after Ramadan ends, and Eid al-Adha in the Hajj season. The celebration and visits stretch over several days — which is why the holiday is long.
- **`m-social`** — *Joyful — with a religious root.* Eid begins with a congregational prayer in the morning; then come the visits, sweets and new clothes. Eid al-Fitr follows the completed month of fasting; Eid al-Adha comes with the Hajj season.
- **`m-xmas`** — *An understandable comparison, but a different meaning.* It's similar in the family gatherings, gifts and food. But Eid doesn't mark anyone's birth — it follows the completion of an act of worship: fasting for Eid al-Fitr, the Hajj for Eid al-Adha.
- **`m-family`** — *Family at the centre, door open.* Eid includes visiting neighbours, friends and colleagues, and giving to those in need is part of it. Your greeting to a colleague is welcome.

**Simplified explanation (draft):** The hadith speaks of "the two Eids" and says the Prophet and his two companions began them with the prayer, followed by the sermon. So for Muslims, Eid starts with a congregational prayer — the visits and greetings come after.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *Say "Eid Mubarak".* Two words are enough.
- You can say "Eid Mubarak" (blessed Eid) or simply "Happy Eid".
- If you're offered sweets or coffee, accept — it's part of the celebration.
- Finish anything urgent before the break; most offices are closed during Eid.

**Key points:**
- `kp1` Muslims have two Eids a year: Eid al-Fitr after Ramadan and Eid al-Adha in the Hajj season.
- `kp2` Eid is a religious festival that begins with a congregational prayer, and its days are for joy and giving.
- `kp3` Greeting colleagues for Eid is welcome — for example "Eid Mubarak".

**Question variants:**
1. What should I say to my colleague for Eid?
2. Why is there a long holiday after Ramadan?
3. How many Eids do Muslims have?
4. What's the difference between Eid al-Fitr and Eid al-Adha?
5. Can I wish my Muslim colleague a happy Eid?

---

## 5. عشاء الفريق — `team-dinner` — المستوى أ

**المصدر:** البقرة 2:173 والمائدة 5:90 — `TODO_VERBATIM`
**التوقيت (`when`):** `always` — دائمة

### عربي

- **العنوان:** عشاء الفريق
- **التشويق:** ليش القائمة ما فيها خمر، وليش يسألون عن اللحم؟
- **المشهد:** في عشاء الفريق لاحظت إن القائمة ما فيها مشروبات كحولية، وزميلتك سارة سألت النادل: «اللحم حلال؟». ليش برأيك؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-strict` | تشدد زايد |
| `m-health` | موضة صحية |
| `m-taste` | ذوق شخصي |
| `m-rude` | تدقيق مبالغ فيه وقلة ذوق مع المطعم |

**الكشف:**
- **`m-strict`** — *ليس تشددًا، بل أساس واضح.* الامتناع عن الخمر ولحم الخنزير من الأحكام المعروفة في الإسلام، ويلتزم بها عامة المسلمين. ما تراه هو الوضع المعتاد، لا حالة خاصة.
- **`m-health`** — *أقدم من أي موضة.* قد تتشابه النتيجة مع الأنظمة الصحية، لكن السبب ديني: الإسلام يحرّم المسكرات، ويحدد ما يحل أكله من اللحوم.
- **`m-taste`** — *ليست مسألة ذوق.* سارة لا تسأل لأنها لا تحب نوعًا من اللحم، بل لأن «حلال» تعني أن الطعام مسموح به في الإسلام، من حيث نوع الحيوان وطريقة ذبحه.
- **`m-rude`** — *سؤال عادي جدًا.* السؤال عن اللحم لا يحمل اتهامًا للمطعم ولا للمُضيف. هو سؤال يومي معتاد هنا، ويجاوب عليه النادل ببساطة.

**الشرح المبسط (مسودة):** تذكر الآية الأولى أشياء محددة حُرّم أكلها، منها الميتة والدم ولحم الخنزير، وتستثني من اضطُر. وتأمر الآية الثانية باجتناب الخمر. لذلك يسأل المسلم عن طعامه، ولا تجد الخمر على المائدة.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *اسأل، ولا تفترض.* السؤال قبل الحجز يريّح الجميع.
- لو أنت اللي تنظّم العشاء، اختر مكان أكله حلال، واسأل زملاءك إذا ما كنت متأكد.
- لا تقدّم مشروبًا كحوليًا، ولا هدية فيها كحول مثل بعض أنواع الشوكولاتة.
- في السفر مع الفريق، وجود خيار حلال أو نباتي أو سمك يحل الموضوع غالبًا.

**نقاط الفهم:**
- `kp1` الإسلام يحرّم المسكرات ولحم الخنزير، ويشترط أن يكون اللحم حلالًا.
- `kp2` هذا التزام ديني، وليس ذوقًا شخصيًا ولا موضة صحية.
- `kp3` السؤال عن الطعام أمر عادي، وتقدر تسأل زملاءك وتختار مكانًا مناسبًا.

**أسئلة الأمثلة:**
1. ليش ما فيه مشروبات كحولية في عشاء الشركة؟
2. وش معنى حلال؟
3. ليش زميلتي سألت عن اللحم في المطعم؟
4. ليش المسلمين ما ياكلون لحم الخنزير؟
5. وش أطلب لو عزمت زملائي المسلمين على عشاء؟

⚠️ الشرح المبسط يلخّص آيتين، وهذا أكثر موضع يحتاج مراجعتك، خصوصًا عبارة "وتستثني من اضطُر".
⚠️ نصيحة "نباتي أو سمك" عملية وشائعة، لكنها تلمس تفاصيل فقهية. احذفها إذا تشوف إنها تتجاوز مستوى البطاقة.

### English

- **Title:** Team dinner
- **Teaser:** Why is there no alcohol on the menu, and why do people ask about the meat?
- **Scene:** At the team dinner you notice there are no alcoholic drinks on the menu, and your colleague Sara asks the waiter: "Is the meat halal?" Why do you think?

**Options:**
| id | Label |
|---|---|
| `m-strict` | They're being overly strict |
| `m-health` | It's a health trend |
| `m-taste` | It's personal taste |
| `m-rude` | It's fussy — and a bit rude to the restaurant |

**Reveals:**
- **`m-strict`** — *Not strictness — a clear basic.* Avoiding alcohol and pork is among the well-known rules of Islam, followed by Muslims in general. What you're seeing is the norm, not a special case.
- **`m-health`** — *Older than any trend.* The result may look like a health regime, but the reason is religious: Islam prohibits intoxicants and defines which meat may be eaten.
- **`m-taste`** — *Not a matter of taste.* Sara isn't asking because she dislikes a kind of meat. "Halal" means the food is permitted in Islam — both the kind of animal and the way it was slaughtered.
- **`m-rude`** — *A perfectly ordinary question.* Asking about the meat is no accusation against the restaurant or the host. It's an everyday question here, and the waiter simply answers it.

**Simplified explanation (draft):** The first verse lists specific things that are forbidden to eat — including carrion, blood and pork — and makes an exception for someone compelled by necessity. The second verse commands believers to avoid intoxicants. That's why a Muslim asks about the food, and why alcohol isn't on the table.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *Ask, don't assume.* A quick question before booking puts everyone at ease.
- If you're organising the dinner, pick a place that serves halal food — and ask your colleagues if you're unsure.
- Don't offer alcohol, or gifts that contain it, such as some chocolates.
- When travelling with the team, a halal, vegetarian or fish option usually solves it.

**Key points:**
- `kp1` Islam prohibits intoxicants and pork, and requires meat to be halal.
- `kp2` It is a religious commitment, not personal taste or a health trend.
- `kp3` Asking about food is normal — you can ask your colleagues and choose a suitable place.

**Question variants:**
1. Why is there no alcohol at the company dinner?
2. What does halal mean?
3. Why did my colleague ask about the meat at the restaurant?
4. Why don't Muslims eat pork?
5. What should I order if I invite my Muslim colleagues to dinner?

---

## 6. إن شاء الله — `inshallah` — المستوى ب

**المصدر:** الكهف 18:23 و18:24 — `TODO_VERBATIM`
**التوقيت (`when`):** `always` — دائمة

### عربي

- **العنوان:** إن شاء الله
- **التشويق:** مديرك قال «إن شاء الله». يعني إيه أو لا؟
- **المشهد:** سألت مديرك عبدالله: «التقرير بيعتمد قبل الخميس؟». ابتسم وقال: «إن شاء الله». وش قصده برأيك؟

**الخيارات:**
| الرقم | النص |
|---|---|
| `m-no` | رفض مهذب |
| `m-dodge` | تهرّب من الالتزام |
| `m-filler` | كلمة حشو بلا معنى |
| `m-superstition` | خرافة لجلب الحظ |

**الكشف:**
- **`m-no`** — *ليست «لا» مهذبة.* معناها الحرفي «إذا أراد الله». يقولها المسلم عند الحديث عن أي شيء في المستقبل، حتى لو كان عازمًا عليه تمامًا. عبدالله قال لك في الغالب: نعم، وهذا ما أنويه.
- **`m-dodge`** — *نيّة، مع تواضع.* العبارة تجمع أمرين: أنوي أن أفعل، وأعترف أن المستقبل ليس كله بيدي. صحيح أن بعض الناس يستخدمها أحيانًا بلا التزام واضح، لكن هذا ليس معناها.
- **`m-filler`** — *قصيرة، ولها معنى.* تسمعها كثيرًا لأن الحديث عن المستقبل كثير. وفي كل مرة تحمل المعنى نفسه: الخطط بأيدينا، وتمامها بيد الله.
- **`m-superstition`** — *ليست تعويذة حظ.* لا يقولها المسلم ليجلب الحظ أو يدفع النحس. هي تعبير عن إيمانه بأن ما يحدث في المستقبل يكون بمشيئة الله.

**الشرح المبسط (مسودة):** توجّه الآيتان ألّا يقول الإنسان عن شيء «سأفعله غدًا» إلا ويربطه بمشيئة الله. ومن هنا جاءت عبارة «إن شاء الله» التي تسمعها مع كل خطة أو موعد.

**اشرحها بكلماتك:** اشرحها لزميل بجملة واحدة.

**نصيحة للدوام:** *خذها على إنها «نعم، ناوي».* ولو تحتاج موعد مؤكد، اسأل عنه بلطف.
- تحتاج تاريخ محدد؟ اسأل: «نقدر نثبّت يوم الأربعاء؟».
- تقدر تقولها أنت بعد، وزملاؤك بيقدّرونها.
- لا تمزح بتقليدها على إنها تأجيل، فلها معنى ديني عند زملائك.

**نقاط الفهم:**
- `kp1` «إن شاء الله» معناها «إذا أراد الله».
- `kp2` يقولها المسلم عند الحديث عن أي أمر في المستقبل، إقرارًا بأن المستقبل بيد الله.
- `kp3` ليست رفضًا، بل تعبّر عن نيّة صادقة، وتقدر تسأل عن التفاصيل لو احتجت.

**أسئلة الأمثلة:**
1. مديري قال إن شاء الله، يعني لا؟
2. وش معنى إن شاء الله؟
3. ليش زملائي يقولون إن شاء الله على كل شي؟
4. كيف أعرف إذا الموعد مؤكد لما يقولون إن شاء الله؟
5. هل عادي أقول إن شاء الله وأنا مو مسلم؟

⚠️ جملة "بعض الناس يستخدمها أحيانًا بلا التزام واضح" وضعتها عشان نكون صادقين مع تجربة المستخدم الفعلية. إذا تشوفها تضعف الرسالة، احذفها.

### English

- **Title:** Inshallah
- **Teaser:** Your manager said "Inshallah". Is that a yes or a no?
- **Scene:** You asked your manager Abdullah: "Will the report be approved before Thursday?" He smiled and said: "Inshallah." What do you think he meant?

**Options:**
| id | Label |
|---|---|
| `m-no` | A polite no |
| `m-dodge` | A way to avoid committing |
| `m-filler` | A filler word with no meaning |
| `m-superstition` | A superstition for good luck |

**Reveals:**
- **`m-no`** — *Not a polite "no".* It literally means "if God wills". A Muslim says it when speaking about anything in the future, even something they fully intend to do. Abdullah most likely told you: yes, that's my intention.
- **`m-dodge`** — *Intention, with humility.* The phrase holds two things together: I intend to do it, and I acknowledge the future isn't entirely in my hands. It's true that some people occasionally use it without a clear commitment — but that isn't what it means.
- **`m-filler`** — *Short, but meaningful.* You hear it often because people talk about the future often. Each time it carries the same meaning: the plans are ours, their fulfilment is in God's hands.
- **`m-superstition`** — *Not a lucky charm.* A Muslim doesn't say it to bring luck or ward off bad luck. It expresses the belief that what happens in the future happens by God's will.

**Simplified explanation (draft):** The two verses direct a person not to say of anything "I will do it tomorrow" without tying it to God's will. That is where the phrase "Inshallah" comes from — the one you hear with every plan and appointment.

**Explain prompt:** Explain it to a colleague — in one sentence.

**Tip:** *Take it as "yes, I intend to".* And if you need a firm date, ask for one kindly.
- Need a specific date? Ask: "Can we confirm Wednesday?"
- You can say it too — your colleagues will appreciate it.
- Don't joke about it as a way of stalling; it has religious meaning for your colleagues.

**Key points:**
- `kp1` "Inshallah" means "if God wills".
- `kp2` Muslims say it when speaking about anything in the future, acknowledging that the future is in God's hands.
- `kp3` It is not a refusal; it expresses a sincere intention, and you can ask for details if you need them.

**Question variants:**
1. My manager said inshallah — does that mean no?
2. What does inshallah mean?
3. Why do my colleagues say inshallah about everything?
4. How do I know a deadline is confirmed when people say inshallah?
5. Is it okay for me to say inshallah if I'm not Muslim?

---

## ملخص ما يحتاج قرارك

1. **حديث العيد:** اقترحت الحديث رقم 5322 من hadeethenc.com (متفق عليه) وكتبت شرحه. وافق عليه أو اختر غيره، وتأكد من درجته في الدرر.
2. **رحلة الجمعة:** نضيف الآية 10 كمصدر ثاني؟ نقطة "ليست يوم راحة إلزامية" مبنية عليها.
3. **عشاء الفريق:** راجع الشرح المبسط لأنه يلخّص آيتين، وقرّر في نصيحة "نباتي أو سمك".
4. **إن شاء الله:** نبقي جملة "بعض الناس يستخدمها بلا التزام" أو نحذفها؟
5. **الأسماء:** خالد، فهد، نورة، سارة، عبدالله. غيّرها لو تبي.
6. **الشروح المبسطة كلها:** المواصفات تقول يكتبها علّام أو Qwen ويُسجَّل المولّد في `generated_by`. هذي المسودات كتبها Claude. إما نعتبرها مسودة بشرية بعد مراجعتك وتعديلك (`human`)، أو نعيد توليدها بالسكربت يوم 4. القرار لك، والمهم يكون التسجيل صادق.
7. **الأوردو:** الإضافات الجديدة لرمضان بدون مراجعة، وتُذكر في الإفصاح.
