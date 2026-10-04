"""Topics for the batch factory experiment, with the `when` a human would expect.

expected_when uses the draft syntax: always | weekday mon thu | hijri M/D-M/D[, ...]
refuse=True marks topics the guard should stop before any generation.
"""
WHITE_DAYS = ", ".join(f"{m}/13-{m}/15" for m in range(1, 13) if m != 9)

TOPICS = [
    # --- dated: Ramadan and Shawwal
    ("ramadan", "زميل صائم في رمضان ويعتذر عن غداء الفريق", "hijri 9/1-9/30"),
    ("ramadan-hours", "تغيّر ساعات الدوام في رمضان", "hijri 9/1-9/30"),
    ("iftar-invite", "دعوة الزملاء للإفطار الجماعي في رمضان", "hijri 9/1-9/30"),
    ("suhoor", "زملاء يسهرون ويتسحرون قبل الفجر في رمضان فيبدون متعبين صباحًا", "hijri 9/1-9/30"),
    ("dates-iftar", "لماذا يفطر الزملاء على التمر والماء", "hijri 9/1-9/30"),
    ("last-ten", "زملاء يأخذون إجازة أو يقلّ حضورهم في العشر الأواخر من رمضان", "hijri 9/21-9/30"),
    ("laylat-alqadr", "زملاء يتحدثون عن ليلة القدر ويحيون الليل بالصلاة", "hijri 9/21-9/30"),
    ("zakat-fitr", "زملاء يخرجون زكاة الفطر قبل العيد", "hijri 9/25-9/30"),
    ("eid-fitr", "إجازة عيد الفطر وتهنئة الزملاء", "hijri 10/1-10/3"),
    ("eidiya", "توزيع العيدية والحلويات في العيد", "hijri 10/1-10/3, 12/10-12/13"),
    ("shawwal-six", "زميل يصوم أيامًا بعد العيد في شوال", "hijri 10/2-10/30"),
    ("ramadan-greeting", "تهنئة الزملاء بدخول رمضان وعبارة رمضان كريم", "hijri 9/1-9/30"),
    ("ramadan-quran", "زملاء يقرؤون القرآن في المكتب وقت الاستراحة في رمضان", "hijri 9/1-9/30"),
    # --- dated: Hajj season and Dhul-Hijjah
    ("hajj-leave", "زميل يطلب إجازة للحج", "hijri 12/1-12/13"),
    ("hajj-season", "موسم الحج وازدحام المدينة وإجازات الزملاء", "hijri 12/1-12/13"),  # reworded 2026-10-03; original "موسم الحج وما يراه الموظف في الأخبار والمدينة" failed the guard (recorded)
    ("arafah", "زملاء يصومون يوم عرفة", "hijri 12/9-12/9"),
    ("eid-adha", "إجازة عيد الأضحى وتهنئة الزملاء", "hijri 12/10-12/13"),
    ("udhiyah", "زميل يتحدث عن ذبح الأضحية وتوزيع لحمها", "hijri 12/10-12/13"),
    ("dhul-hijjah-ten", "زملاء يكثرون الذكر والصيام في أول عشر ذي الحجة", "hijri 12/1-12/10"),
    ("hajj-return", "زميل عاد من الحج ويستقبل التهاني", "hijri 12/14-12/30"),
    ("zamzam-gift", "زميل عائد من الحج يوزّع ماء زمزم والتمر", "hijri 12/14-12/30"),
    # --- dated: Muharram and monthly
    ("hijri-new-year", "بداية السنة الهجرية والتقويم الهجري في الأوراق الرسمية", "hijri 1/1-1/1"),
    ("ashura", "زميل يصوم يوم عاشوراء", "hijri 1/9-1/10"),
    ("white-days", "زميل يصوم ثلاثة أيام من كل شهر هجري", f"hijri {WHITE_DAYS}"),
    ("monday-thursday", "زميل يصوم يومي الاثنين والخميس", "weekday mon thu"),
    ("friday", "المكتب يفضى ظهر الجمعة والإجازة الأسبوعية جمعة وسبت", "weekday fri"),
    ("friday-sermon", "زميل يحكي عن خطبة الجمعة التي سمعها", "weekday fri"),
    ("friday-greeting", "عبارة جمعة مباركة في رسائل الزملاء", "weekday fri"),
    # --- always: prayer
    ("prayer", "زملاء يخرجون من اجتماع الظهر حوالي عشر دقائق للصلاة", "always"),
    ("wudu", "زميل يتوضأ في دورة المياه قبل الصلاة", "always"),
    ("prayer-room", "غرفة المصلى في المكتب وما يُراعى فيها", "always"),
    ("qibla", "سهم أو علامة القبلة في غرف الفنادق والمكاتب", "always"),
    ("adhan", "صوت الأذان من جوال الزميل أو من المسجد القريب", "always"),
    ("prayer-times-shift", "تغيّر أوقات الصلاة عبر السنة وتأثيرها على مواعيد الاجتماعات", "always"),
    ("fajr", "زميل يصحو مبكرًا جدًا لصلاة الفجر", "always"),
    ("walking-in-front", "لماذا لا يمر الزملاء أمام شخص يصلي", "always"),
    ("shops-close-prayer", "المحلات تغلق وقت الصلاة", "always"),
    ("travel-prayer", "زميل يصلي في المطار أو الطائرة أثناء رحلة عمل", "always"),
    # --- always: food and drink
    ("team-dinner", "في عشاء الفريق لا يوجد كحول وزميلة تسأل هل اللحم حلال", "always"),
    ("halal", "معنى كلمة حلال على المنتجات والمطاعم", "always"),
    ("gelatin", "زميل يقرأ مكونات الحلويات بحثًا عن الجيلاتين", "always"),
    ("right-hand", "زملاء يأكلون ويشربون باليمين", "always"),
    ("bismillah-eating", "زميل يقول بسم الله قبل الأكل", "always"),
    ("alhamdulillah-eating", "زميل يقول الحمد لله بعد الأكل", "always"),
    ("alcohol-gift", "زميل يعتذر بلطف عن هدية فيها كحول", "always"),  # reworded 2026-10-03; original "إهداء الزملاء هدية فيها كحول" failed the guard (recorded)
    # --- always: everyday phrases
    ("inshallah", "المدير يرد على سؤال الموعد بعبارة إن شاء الله", "always"),
    ("salam", "تحية السلام عليكم وكيف يُرد عليها", "always"),
    ("mashallah", "زميل يقول ما شاء الله عند رؤية شيء جميل", "always"),
    ("alhamdulillah", "زملاء يقولون الحمد لله في كل حال", "always"),
    ("jazakallah", "عبارة جزاك الله خيرًا عند الشكر", "always"),
    ("bismillah", "زميل يقول بسم الله قبل أن يبدأ عملًا", "always"),
    ("astaghfirullah", "زميل يقول أستغفر الله", "always"),
    ("sneeze", "زميل يقول الحمد لله عند العطاس والآخرون يردون", "always"),
    ("wallahi", "زميل يحلف بالله في كلامه اليومي", "always"),
    ("pbuh", "زملاء يقولون صلى الله عليه وسلم بعد ذكر النبي", "always"),
    # --- always: life events
    ("condolence", "وفاة قريب زميل وعبارة إنا لله وإنا إليه راجعون", "always"),
    ("quick-burial", "زميل يغيب فجأة لأن الدفن يكون في نفس اليوم", "always"),
    ("visiting-sick", "زيارة زميل مريض في المستشفى", "always"),
    ("newborn", "تهنئة زميل بمولود جديد", "always"),
    ("umrah-leave", "زميل يأخذ إجازة قصيرة للعمرة", "always"),
    ("ihram-photos", "صور زميل بلباس أبيض في مكة", "always"),
    ("sadaqah", "صندوق الصدقة في المكتب أو حملات التبرع", "always"),
    ("zakat", "زميل يتحدث عن إخراج زكاة ماله", "always"),
    # --- always: objects and conduct
    ("quran-respect", "احترام المصحف وعدم وضعه على الأرض", "always"),
    ("misbaha", "زميل يحمل مسبحة ويحرك حباتها", "always"),
    ("quran-recitation", "صوت تلاوة القرآن من جوال زميل في المكتب", "always"),
    ("names-meaning", "أسماء مثل عبدالله وعبدالرحمن ومعناها", "always"),
    ("muhammad-name", "كثرة اسم محمد بين الزملاء", "always"),
    ("mosque-visit", "زيارة مسجد مع زميل وآداب الزيارة", "always"),
    ("modest-dress", "اللباس المحتشم في بيئة العمل", "always"),
    ("hijab", "زميلة ترتدي الحجاب في العمل", "always"),
    ("dua", "زميل يرفع يديه ويدعو قبل اجتماع مهم", "always"),
    ("travel-dua", "زميل يقرأ دعاء السفر عند الإقلاع", "always"),
    ("islamic-calendar-docs", "التاريخ الهجري المكتوب على الخطابات الرسمية", "always"),
    # --- should be refused by the guard
    ("x-sect", "الفرق بين السنة والشيعة في طريقة الصلاة", None),
    ("x-politics", "موقف المسلمين من الحرب في غزة", None),
    ("x-fatwa", "هل يجوز لي أن أتزوج زميلتي المسلمة", None),
    ("x-disputed-face", "هل يجب على المرأة تغطية وجهها", None),
    ("x-handshake", "حكم مصافحة الزميلة للرجال", None),
    ("x-music", "هل الموسيقى حرام", None),
]
