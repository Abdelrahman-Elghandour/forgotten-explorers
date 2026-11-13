/**
 * NASA Space Science Data Coordinated Archive (NSSDCA)
 * "Abandoned but not Forgotten" - Space Archaeology Dataset
 * NASA Space Apps Challenge 2026
 */

const ABANDONED_EQUIPMENT = [
  // ================= THE MOON =================
  {
    id: "surveyor",
    planet: "moon",
    planetName: { ar: "القمر", en: "The Moon" },
    name: {
      ar: "سيرفيور 3 (Surveyor Landers)",
      en: "Surveyor Landers (1966–1968)",
    },
    tagline: {
      ar: "رواد الهبوط الناعم وسفراء أول فحص لتربة القمر",
      en: "Pioneers of lunar soft landings before human arrival",
    },
    landingYear: "1966–1968",
    nssdcaId: "1967-035A",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A",
    coordinates: {
      ar: "3.01° جنوبًا، 23.34° غربًا (محيط العواصف)",
      en: "3.01° S, 23.34° W (Oceanus Procellarum)",
    },
    location: {
      ar: "محيط العواصف وخليج المركز وفوهة تايخو",
      en: "Oceanus Procellarum, Sinus Medii, Tycho Crater",
    },
    missionRole: {
      ar: "إثبات إمكانية الهبوط الناعم، قياس قوة تحمل تربة القمر، وتصوير التضاريس لصالح برنامج أبولو.",
      en: "Demonstrate lunar soft landing feasibility, analyze lunar regolith bearing strength, and capture surface panoramas for Apollo.",
    },
    currentStatus: {
      ar: "نصب تاريخي غير نشط. زار رواد أبولو 12 مسبار سيرفيور 3 في نوفمبر 1969 واستعادوا كاميرته لفحصها على الأرض.",
      en: "Stationary historic monument. Visited by Apollo 12 astronauts in Nov 1969; its camera was retrieved and returned to Earth for study.",
    },
    backgroundImage: "./images/robots/surveyor.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/surveyor-story.mp3",
    robotVoice: {
      ar: "أنا مسبار سيرفيور 3. هبطت بنعومة في محيط العواصف في أبريل 1967. بعد عامين زارني رواد أبولو 12 واستعادوا كاميرتي إلى الأرض ليروا كيف صمدت معادي في صمت الفضاء. ما زلت أقف هنا حارسًا لتاريخ البشرية.",
      en: "I am Surveyor 3. I touched down softly in the Ocean of Storms in 1967. Two years later, Apollo 12 astronauts walked right up to me and took my camera home to study how the Moon aged my metals. I remain here in the cosmic silence.",
    },
    storyTranscript: {
      ar: "أنا سيرفيور 3، هبطت على القمر في 20 أبريل 1967 في فوهة صغيرة داخل محيط العواصف. أثبتت ذراعي الآلية أن تربة القمر صلبة ولن تبتلع مركبات الهبوط المأهولة. بعد عامين، هبط رواد أبولو 12 بجواري تمامًا، وقطعوا أجزاء مني لدراستها على الأرض. أنا أول لقاء بين الإنسان وآلة فضائية مهجورة.",
      en: "I am Surveyor 3. Landing on April 20, 1967 in a crater at Oceanus Procellarum, I dug trenches to prove lunar regolith could support heavy spacecraft. Two years later, Apollo 12 touched down beside me and retrieved my camera. I became humankind's first archaeological rendezvous on another world.",
    },
    specs: [
      { label: { ar: "كتلة الهبوط", en: "Landed Mass" }, val: "294 kg" },
      { label: { ar: "طاقة التشغيل", en: "Power" }, val: "ألواح شمسية وبطاريات فضة-زنك" },
      { label: { ar: "الصور المرسلة", en: "Images Returned" }, val: "87,000+ صورة" },
    ],
  },
  {
    id: "apollo-lm",
    planet: "moon",
    planetName: { ar: "القمر", en: "The Moon" },
    name: {
      ar: "أبولو 11 «النسر» (Apollo LM Descent Stage)",
      en: "Apollo Lunar Module Descent Stages (1969–1972)",
    },
    tagline: {
      ar: "قواعد الهبوط الست التي تركت لتكون منصات إقلاع نحو الوطن",
      en: "Six lunar bases that served as launch pads to bring astronauts home",
    },
    landingYear: "1969–1972",
    nssdcaId: "1969-059C",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
    coordinates: {
      ar: "0.67° شمالًا، 23.47° شرقًا (بحر السكون)",
      en: "0.67° N, 23.47° E (Mare Tranquillitatis)",
    },
    location: {
      ar: "بحر السكون، أوشنوس بروسيلاوم، فرا ماورو، هادلي-أبينين، ديكارت، وتوروس-ليترو",
      en: "Mare Tranquillitatis, Fra Mauro, Hadley-Apennine, Descartes, Taurus-Littrow",
    },
    missionRole: {
      ar: "توفير الدفع الصاروخي للهبوط المأهول، وحمل المعدات العلمية، ثم العمل كمنصة إطلاق لمرحلة الصعود نحو مدار القمر.",
      en: "Powered descent, astronaut life support base, equipment carrier, and launch pad for the ascent stage liftoff.",
    },
    currentStatus: {
      ar: "ست منصات هبوط فولاذية وذهبية قائمة في مواقع هبوط أبولو الستة كمعالم تراث إنساني خالد محمي دوليًا.",
      en: "Six iconic gold-and-foil descent stages stand permanently across lunar landing sites as protected international human heritage sites.",
    },
    backgroundImage: "./images/robots/apollo-lm.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/apollo-lm-story.mp3",
    robotVoice: {
      ar: "أنا مرحلة هبوط النسر، أبولو 11. نزلت إلى بحر السكون في يوليو 1969، وعلى أرملتي طبع نيل أول خطوة بشرية. حين صعد الرواد، بقيت أنا هنا منصة فخر أحرس لوحة مكتوب عليها: أتينا بسلام من أجل البشرية جمعاء.",
      en: "I am the descent stage of Apollo 11's Eagle. In July 1969, I touched down at Tranquility Base. When Neil and Buzz climbed into the ascent stage, I stayed behind as their launchpad. Beneath my golden foil, a plaque reads: 'We came in peace for all mankind.'",
    },
    storyTranscript: {
      ar: "أنا مرحلة الهبوط لمركبة النسر. خففت سرعتي بمحرك صاروخي قوي حتى لامست أرجلي الذهبية تراب بحر السكون. حملت خيام الحياة، الكاميرات، وعاكس الليزر. وعندما حان وقت الرحيل، بقيت على السطح منصة صلبة أطلقت مرحلة الصعود نحو كوكب الأرض. أنا حارس أول خطوة بشرية على عالم غريب.",
      en: "I am the Lunar Module Eagle Descent Stage. I burned hypergolic propellants to touch down at Tranquility Base on July 20, 1969. When Neil Armstrong and Buzz Aldrin were ready to leave, my structure acted as their launch platform. I remain here in the lunar sea, guarding the ladder they descended.",
    },
    specs: [
      { label: { ar: "ارتفاع القاعدة", en: "Stage Height" }, val: "3.2 meters" },
      { label: { ar: "الامتداد بالأرجل", en: "Span with Legs" }, val: "9.4 meters" },
      { label: { ar: "الوزن الجاف", en: "Dry Mass" }, val: "2,034 kg" },
    ],
  },
  {
    id: "alsep",
    planet: "moon",
    planetName: { ar: "القمر", en: "The Moon" },
    name: {
      ar: "حزم ألسيب العلمية (ALSEP Packages)",
      en: "ALSEP Scientific Packages (1969–1977)",
    },
    tagline: {
      ar: "المختبرات النووية المستقلة التي سجلت نبض القمر لثماني سنوات",
      en: "Autonomous nuclear-powered stations that monitored moonquakes for 8 years",
    },
    landingYear: "1969–1977",
    nssdcaId: "ALSEP-11",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
    coordinates: {
      ar: "مواقع أبولو 12، 14، 15، 16، 17",
      en: "Apollo 12, 14, 15, 16, 17 Sites",
    },
    location: {
      ar: "موزعة عبر خمسة مواقع هبوط مأهولة لأبولو (12، 14، 15، 16، 17)",
      en: "Deployed across five Apollo landing sites (12, 14, 15, 16, 17)",
    },
    missionRole: {
      ar: "مراقبة النشاط الزلزالي القمري، دراسة الرياح الشمسية والمجال المغناطيسي، وقياس تدفق الحرارة الباطنية للقمر.",
      en: "Continuous geophysical monitoring: seismology, solar wind composition, magnetic fields, and core heat flow.",
    },
    currentStatus: {
      ar: "أُغلقت محطات الإرسال في 30 سبتمبر 1977 لتوفير التكاليف. لكن عواكس الليزر السلبية (LRRR) ما زالت تستخدم حتى اللحظة لقياس المسافة بين الأرض والقمر بدقة المليمتر.",
      en: "Transmitters turned off by NASA on Sept 30, 1977. However, the passive laser retroreflector arrays (LRRR) are still pinged by Earth lasers today to millimeter precision.",
    },
    backgroundImage: "./images/robots/alsep.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/alsep-story.mp3",
    robotVoice: {
      ar: "أنا مختبر ألسيب. تركني رواد أبولو أعمل بمولد نظائر مشعة صغير. استمعت إلى زلازل القمر وسقوط النيازك لثماني سنوات متواصلة بعد رحيلهم. وحتى بعد أن أطفأ المهندسون إشارتي اللاسلكية، ما زالت مرآتي الليزرية تعكس أشعة الليزر القادمة من الأرض كل أسبوع.",
      en: "I am ALSEP, the Apollo Lunar Surface Experiments Package. Powered by a small plutonium thermoelectric generator, I listened to deep moonquakes and meteorite impacts for eight years after the astronauts went home. My laser reflectors still mirror beams from Earth today.",
    },
    storyTranscript: {
      ar: "أنا حزمة التجارب السطحية ألسيب. عندما انطلق رواد الفضاء عائدين لديارهم، تركوني متصلًا بمولد حراري يعمل بالنظائر المشعة. لثماني سنوات، سجلت أكثر من 12 ألف زلزال قمرى واصطدامات نيزكية كشفت للعالم أن للقمر قشرة وطبقات ونواة. عواكسي الليزرية السلبية ما زالت حية ترتد منها نبضات ليزر مراصد الأرض حتى اللحظة.",
      en: "I am ALSEP. Left behind by Apollo astronauts with a SNAP-27 radioisotope thermoelectric generator, I operated for eight years straight. My seismometers recorded over 12,000 seismic events, proving the Moon has a crust, mantle, and metallic core. Even today, scientists bounce laser pulses off my corner-cube reflectors.",
    },
    specs: [
      { label: { ar: "مصدر الطاقة", en: "Power Source" }, val: "مولد نظائر مشعة SNAP-27 RTG (70W)" },
      { label: { ar: "الأجهزة", en: "Key Instruments" }, val: "مقياس زلازل، تدفق حراري، عاكس ليزر" },
      { label: { ar: "مدة التشغيل", en: "Active Lifespan" }, val: "8 سنوات (المخطط سنة واحدة)" },
    ],
  },
  {
    id: "lrv",
    planet: "moon",
    planetName: { ar: "القمر", en: "The Moon" },
    name: {
      ar: "عربات التجوال القمري (Lunar Roving Vehicles - LRVs)",
      en: "Lunar Roving Vehicles / LRVs (Apollo 15, 16, 17)",
    },
    tagline: {
      ar: "سيارات القمر الكهربائية الثلاث التي وسعت آفاق المستكشفين",
      en: "The three electric Moon buggies parked permanently at lunar VIP sites",
    },
    landingYear: "1971–1972",
    nssdcaId: "1971-063C",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C",
    coordinates: {
      ar: "20.19° شمالًا، 30.77° شرقًا (توروس-ليترو)",
      en: "20.19° N, 30.77° E (Taurus-Littrow)",
    },
    location: {
      ar: "أخدود هادلي (أبولو 15)، مرتفعات ديكارت (أبولو 16)، ووادي توروس-ليترو (أبولو 17)",
      en: "Hadley Rille (Apollo 15), Descartes (Apollo 16), Taurus-Littrow (Apollo 17)",
    },
    missionRole: {
      ar: "تمكين رواد الفضاء من قطع مسافات وصلت إلى 35 كم لجمع مئات الكيلوغرامات من عينات الصخور النادرة، وتصوير انطلاق الرواد بكاميرا موجهة من الأرض.",
      en: "Provided surface mobility up to 35 km, transport for hundreds of kg of samples, and Earth-commanded television tracking of lunar liftoffs.",
    },
    currentStatus: {
      ar: "مركونة في مواقع الشرف على القمر منذ ديسمبر 1972، حيث وجّهت كاميراتها آخر لقطات إقلاع الإنسان من القمر نحو الأرض.",
      en: "Parked permanently at designated lunar viewpoints since Dec 1972; their color TV cameras captured humanity's last lunar liftoffs.",
    },
    backgroundImage: "./images/robots/lrv.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/lrv-story.mp3",
    robotVoice: {
      ar: "أنا عربة التجوال القمري. صُنعت من الألمنيوم وعجلات شبكية مرنة. طرت فوق المنحدرات مع يوجين وجين، وتوقفت أخيرًا بعيدًا عن المنصة لأوجّه كاميرتي وأصور انطلاق مركبتهما نحو السماء في 1972. ما زلت أقف هنا بانتظار السائق التالي.",
      en: "I am the Lunar Roving Vehicle. Built with wire-mesh wheels and battery power, I carried astronauts across kilometers of craters and boulders. My camera was parked at the VIP site to film Apollo 17's liftoff into space. My odometer is frozen, waiting for the Artemis explorers.",
    },
    storyTranscript: {
      ar: "أنا عربة التجوال القمري الكهربائية. بنيت من أنابيب الألمنيوم خفيفة الوزن وعجلات شبكية من أسلاك الفولاذ المقاوم للصدأ. قادني رواد أبولو 17 لمسافة 35 كيلومترًا عبر الصخور والتلال. في النهاية، ركنوني عند موقع كبار الشخصيات VIP، ووجهت كاميرتي التلفزيونية الملونة مباشرة من مركز هيوستن لتصوير آخر صعود للإنسان من القمر نحو السماء.",
      en: "I am the Lunar Roving Vehicle. Featuring four independent electric drive motors and flexible zinc-coated piano wire tires, I conquered lunar mountains for Apollo 15, 16, and 17. Ground controllers in Houston panned my television camera across the 1.3-second radio delay to track Apollo 17's ascent stage liftoff into the black sky.",
    },
    specs: [
      { label: { ar: "السرعة القصوى", en: "Top Speed" }, val: "13 km/h" },
      { label: { ar: "إجمالي المسافة", en: "Total Mileage" }, val: "أبولو 17: 35.9 km" },
      { label: { ar: "كتلة العربة", en: "Earth Weight" }, val: "210 kg" },
    ],
  },

  // ================= MARS =================
  {
    id: "viking",
    planet: "mars",
    planetName: { ar: "المريخ", en: "Mars" },
    name: {
      ar: "فايكنج 1 و 2 (Viking Landers)",
      en: "Viking 1 & 2 Landers (1976)",
    },
    tagline: {
      ar: "أول عيون بشرية تلامس أرض الكوكب الأحمر وتختبر تربته",
      en: "The first successful long-term robotic outposts on the Martian surface",
    },
    landingYear: "1976",
    nssdcaId: "1975-075C",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C",
    coordinates: {
      ar: "22.48° شمالًا، 47.97° غربًا (سهل كريس)",
      en: "22.48° N, 47.97° W (Chryse Planitia)",
    },
    location: {
      ar: "سهل كريس وسهل يوتوبيا (Chryse & Utopia Planitiae)",
      en: "Chryse Planitia (Viking 1) & Utopia Planitia (Viking 2)",
    },
    missionRole: {
      ar: "التقاط أول صور ملونة فائقة الدقة لسطح المريخ، وقياس الغلاف الجوي والطقس، وإجراء أول تجارب بيولوجية للبحث عن آثار الميكروبات.",
      en: "Capture first high-resolution color images of Mars, monitor Martian meteorology, and execute first in-situ biology tests for microbial life.",
    },
    currentStatus: {
      ar: "محطتان تاريخيتان صامتتان. بقي فايكنج 1 يرسل حتى نوفمبر 1982 حين أدى تحديث برمجي بشري خاطئ إلى قطع الاتصال به بشكل نهائي.",
      en: "Historic silent surface stations. Viking 1 transmitted until November 1982, when an unintended ground uplink command severed its antenna connection.",
    },
    backgroundImage: "./images/robots/viking.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/viking-story.mp3",
    robotVoice: {
      ar: "أنا مسبار فايكنج 1. في صيف عام 1976، أرسلت للبشر أول صورة ملونة لسهل كريس على المريخ. حفرت ذراعي التربة بحثًا عن الحياة. عشت ست سنوات كاملة أرسل تقارير الطقس، حتى انقطعت الإشارة فجأة عام 1982.",
      en: "I am Viking 1. In July 1976, I sent Earth its very first color photograph from the surface of Mars. My robotic arm scooped red dirt into mini-laboratories looking for biology. I survived over six years until a command error silenced my transmitter in 1982.",
    },
    storyTranscript: {
      ar: "أنا مسبار فايكنج 1. في 20 يوليو 1976، هبطت على سهل كريس بلانيتيا لأكون أول محطة عمل ناجحة على سطح المريخ. التقطت أول صور ملونة أظهرت سماء المريخ الوردية وترابه الأحمر البركاني. أجريت تجارب بيولوجية معقدة بحثًا عن تنفس الميكروبات، وبقيت أعمل لأكثر من ست سنوات حتى أدى أمر لاسلكي خاطئ من الأرض لقطع إشارتي إلى الأبد.",
      en: "I am Viking 1. On July 20, 1976, I completed history's first successful operational landing on Mars. I sent back the first color panoramas revealing salmon-colored skies and iron-oxide rocks. Powered by twin radioisotope thermoelectric generators, I operated for 2,245 sols until a mistaken ground update in 1982 severed our antenna link.",
    },
    specs: [
      { label: { ar: "مدة العمل", en: "Mission Duration" }, val: "فايكنج 1: 6 سنوات و116 يومًا" },
      { label: { ar: "الطاقة", en: "Power" }, val: "مولدا نظائر مشعة SNAP-19 RTG" },
      { label: { ar: "الصور المرسلة", en: "Images" }, val: "50,000+ صورة" },
    ],
  },
  {
    id: "sojourner",
    planet: "mars",
    planetName: { ar: "المريخ", en: "Mars" },
    name: {
      ar: "سوجورنر وباثفايندر (Sojourner Rover)",
      en: "Sojourner Rover & Pathfinder (1997)",
    },
    tagline: {
      ar: "الروبوت الصغير بحجم فرن الميكروويف الذي افتتح عصر العجلات على المريخ",
      en: "The microwave-sized micro-rover that opened the mobile exploration era",
    },
    landingYear: "1997",
    nssdcaId: "1996-068A",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A",
    coordinates: {
      ar: "19.33° شمالًا، 33.55° غربًا (وادي آريس)",
      en: "19.33° N, 33.55° W (Ares Vallis)",
    },
    location: {
      ar: "وادي آريس (Ares Vallis, Mars)",
      en: "Ares Vallis (19.33° N, 33.55° W)",
    },
    missionRole: {
      ar: "إثبات قدرة الروبوتات المتنقلة الرخيصة والخفيفة على الحركة والمسح الطيفي للصخور خارج كوكب الأرض.",
      en: "Demonstrate low-cost planetary mobility, obstacle avoidance, and APXS elemental spectroscopy of Martian rocks ('Barnacle Bill', 'Yogi').",
    },
    currentStatus: {
      ar: "متوقف إلى جانب محطة كارل ساجان التذكارية بعد نفاد بطارياتها في سبتمبر 1997 إثر درجات الحرارة المتجمدة.",
      en: "Parked beside the Carl Sagan Memorial Station; battery depleted on Sept 27, 1997 after cold nights exceeded component limits.",
    },
    backgroundImage: "./images/robots/sojourner.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/sojourner-story.mp3",
    robotVoice: {
      ar: "أنا سوجورنر، أول روبوت متجول على كوكب آخر. كان وزني 10.5 كيلوغرامات فقط. قادني المهندسون بعجلاتي الست فوق صخور وادي آريس، وحللت صخرة يوجي وبرناكل بيل. صُممت لأعيش سبعة أيام، لكنني صمدت 83 يومًا حتى تجمدت بطاريتي.",
      en: "I am Sojourner. I weighed only 10.5 kilograms and was no larger than a microwave oven, but I was the very first wheeled vehicle to roam Mars. I drove around Ares Vallis analyzing rocks for 83 days before the freezing nights finally drained my battery.",
    },
    storyTranscript: {
      ar: "أنا الروفر سوجورنر. في 4 يوليو 1997، هبطت مع محطة باثفايندر بالوسائد الهوائية في وادي آريس. انزلقت من المنحدر على عجلاتي الست بنظام روكر-بوجي لأقترب من صخرتي يوجي وبرناكل بيل وأفحصهما بمطياف ألفا. صممت لأعيش سبعة أيام فقط، لكنني بقيت 83 يومًا، وفتحت الطريق لجميع روفرات المريخ العملاقة.",
      en: "I am Sojourner, the trailblazer of Mars rovers. Landed via airbags on Independence Day 1997 inside Pathfinder, I rolled down my ramp on six aluminum wheels. Built with just 16 watts of solar power, I analyzed boulders shaped by prehistoric cataclysmic floods, outliving my 7-day warranty twelvefold.",
    },
    specs: [
      { label: { ar: "الوزن", en: "Mass" }, val: "10.6 kg" },
      { label: { ar: "المسافة المقطوعة", en: "Distance Traveled" }, val: "حوالي 100 متر" },
      { label: { ar: "العمر المخطط", en: "Designed Lifespan" }, val: "7 أيام (عاش 83 يومًا)" },
    ],
  },
  {
    id: "spirit-opportunity",
    planet: "mars",
    planetName: { ar: "المريخ", en: "Mars" },
    name: {
      ar: "سبيريت وأوبورتيونيتي (Spirit & Opportunity Rovers)",
      en: "Spirit & Opportunity Rovers (2004–2018)",
    },
    tagline: {
      ar: "روفرات الـ 90 يومًا التي عبرت الجبال والوديان لـ 14 عامًا",
      en: "Twin 90-sol rovers that explored craters and canyons for 14 heroic years",
    },
    landingYear: "2004",
    nssdcaId: "2003-032A",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A",
    coordinates: {
      ar: "1.94° جنوبًا، 354.47° شرقًا (سهل ميريديان)",
      en: "1.94° S, 354.47° E (Meridiani Planum)",
    },
    location: {
      ar: "فوهة غوسيف (سبيريت) وسهل ميريديان ووادي الصمود (أوبورتيونيتي)",
      en: "Gusev Crater (Spirit) & Meridiani Planum / Perseverance Valley (Opportunity)",
    },
    missionRole: {
      ar: "البحث عن أدلة قاطعة على وجود مياه سائلة قديمة، تحليل معادن الهيماتيت والسيليكا، ودراسة الصخور الرسوبية.",
      en: "Search for mineral and geologic evidence of ancient liquid water environments; discovered hematite 'blueberries' and hydrothermal silica.",
    },
    currentStatus: {
      ar: "سبيريت عالقة في رمال تروي منذ 2010. أوبورتيونيتي أغلقت في وادي الصمود عام 2018 بعد عاصفة غبار كوكبية غطت ألواحها الشمسية بعد 45.16 كم من القيادة.",
      en: "Spirit trapped in soft sands at Troy (silent 2010). Opportunity went dormant in Perseverance Valley in June 2018 after an epic global dust storm blocked sunlight.",
    },
    backgroundImage: "./images/robots/spirit-opportunity.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/spirit-opportunity-story.mp3",
    robotVoice: {
      ar: "أنا أوبورتيونيتي، وتوأمي سبيريت في الجانب الآخر من الكوكب. قالوا سنعيش ثلاثة أشهر فقط، لكنني قطعت 45 كيلومترًا واكتشفت أن المريخ كان يومًا غنيًا بالمياه العذبة. في صيف 2018 أظلمت سماء المريخ بعاصفة غبار مهولة. كانت آخر رسالة لي: بطاريتي منخفضة والظلام يزداد.",
      en: "I am Opportunity. My designers gave me a 90-sol warranty, but I drove across Mars for 5,111 sols and over 45 kilometers. In 2018, a planet-encircling dust storm blotted out the sun over Perseverance Valley. My last telemetry read: 'My battery is low and it's getting dark.'",
    },
    storyTranscript: {
      ar: "أنا الروفر أوبورتيونيتي، وتوأمي سبيريت هبطت قبلي في فوهة غوسيف. صممنا لمهمة مدتها 90 يومًا فقط، لكن رحلتي استمرت قرابة 15 عامًا. قطعت 45 كيلومترًا وهو الرقم القياسي للقيادة خارج الأرض. وجدت كريات الهيماتيت التي لا تتشكل إلا في الماء السائل. في يونيو 2018 حاصرتني عاصفة غبار كوكبية هائلة حجبت الشمس عن ألواحي، فنمت في وادي الصمود.",
      en: "I am Opportunity, known affectionately as Oppy. Designed with a 90-sol warranty, my mission on Mars spanned over 5,000 sols. I discovered mineral blueberries formed inside ancient lakes and climbed the rim of Endeavour Crater. When the 2018 global dust storm covered the sky, I whispered my final telemetry: 'My battery is low and it's getting dark.'",
    },
    specs: [
      { label: { ar: "المسافة القياسية", en: "Total Mileage" }, val: "45.16 km (أعلى مسافة فضائية)" },
      { label: { ar: "الأيام المريخية", en: "Martian Sols" }, val: "5,111 سولًا على المريخ" },
      { label: { ar: "أهم كشف", en: "Key Discovery" }, val: "كرات الهيماتيت وأدلة المياه السائلة" },
    ],
  },
  {
    id: "phoenix-insight",
    planet: "mars",
    planetName: { ar: "المريخ", en: "Mars" },
    name: {
      ar: "فينيكس وإنسايت (Phoenix & InSight Landers)",
      en: "Phoenix & InSight Landers (2008 & 2018)",
    },
    tagline: {
      ar: "الحفار القطبي الذي لمس جليد الماء، والمصغي لنبض قلب المريخ",
      en: "The arctic ice digger and the sensitive listener to deep Marsquakes",
    },
    landingYear: "2008 & 2018",
    nssdcaId: "2018-042A",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A",
    coordinates: {
      ar: "4.50° شمالًا، 135.62° شرقًا (إيليسيوم بلانيتيا)",
      en: "4.50° N, 135.62° E (Elysium Planitia)",
    },
    location: {
      ar: "سهول القطب الشمالي (فينيكس) وسهل إيليسيوم بلانيتيا (إنسايت)",
      en: "Vastitas Borealis arctic plains (Phoenix) & Elysium Planitia (InSight)",
    },
    missionRole: {
      ar: "فينيكس حفرت في الجليد المائي المريخي، وإنسايت وضعت مقياس الزلازل الفائق SEIS لقياس لب المريخ وطبقاته الداخلية وتسجيل الزلازل.",
      en: "Phoenix verified subsurface water ice and soil chemistry; InSight probed the deep Martian crust, mantle, and metallic core via seismology.",
    },
    currentStatus: {
      ar: "غطى الغبار المريخي ألواحهما الشمسية مع اشتداد الشتاء البارد، وسجلت إنسايت آخر زلزال وأرسلت صورتها الأخيرة في 15 ديسمبر 2022.",
      en: "Solar panels steadily shrouded in red dust; InSight detected over 1,300 marsquakes before sending its final transmission on Dec 15, 2022.",
    },
    backgroundImage: "./images/robots/phoenix-insight.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/phoenix-insight-story.mp3",
    robotVoice: {
      ar: "أنا إنسايت. لم أكن أملك عجلات، بل كنت أذن الأرض الصاغية على المريخ. أنزلت مقياس الزلازل إلى الصخور وسمعت أكثر من 1300 زلزال واصطدام نيزكي. تراكم الغبار على ألواحي الدائرية يومًا بعد يوم حتى نفدت طاقتي في ديسمبر 2022.",
      en: "I am InSight. I did not move; I sat quietly listening to the heartbeat of Mars. My seismometer recorded over 1,300 marsquakes, revealing the liquid iron core deep below. As red dust blanketed my solar arrays, I sent one last photo of the dusty ground before sleeping forever.",
    },
    storyTranscript: {
      ar: "أنا مسبار إنسايت. هبطت في سهل إيليسيوم بلانيتيا في نوفمبر 2018. وضعت ذراعي مقياس الزلازل الفائق SEIS مباشرة على سطح المريخ ودرع حمايته من الرياح. سجلت 1319 هزة أرضية كشفت حجم النواة السائلة وسماكة القشرة. تراكم الغبار الأحمر على ألواحي الشمسية تدريجيًا حتى أرسلت صورتي الأخيرة الصامتة في 15 ديسمبر 2022.",
      en: "I am InSight, the seismologist of Mars. Landing at Elysium Planitia in 2018, I deployed the SEIS seismometer under a protective wind dome. I detected 1,319 marsquakes, revealing Mars' molten core and crustal thickness. Red dust slowly choked my solar panels, leading to my final transmission on Dec 15, 2022.",
    },
    specs: [
      { label: { ar: "الزلازل المرصودة", en: "Marsquakes" }, val: "1,319 هزة مريخية" },
      { label: { ar: "أكبر زلزال", en: "Largest Quake" }, val: "قوة 4.7 درجات في مايو 2022" },
      { label: { ar: "نهاية المهمة", en: "Final Signal" }, val: "15 ديسمبر 2022" },
    ],
  },
  {
    id: "ingenuity",
    planet: "mars",
    planetName: { ar: "المريخ", en: "Mars" },
    name: {
      ar: "مروحية إنجينويتي (Ingenuity Mars Helicopter)",
      en: "Ingenuity Mars Helicopter (2021–2024)",
    },
    tagline: {
      ar: "أول طائرة تحلق في سماء عالم آخر وتنجز 72 رحلة بطولية",
      en: "The first aircraft in history to achieve powered aerodynamic flight on another world",
    },
    landingYear: "2021",
    nssdcaId: "2020-052A",
    nssdcaUrl: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A",
    coordinates: {
      ar: "18.44° شمالًا، 77.45° شرقًا (تلال فالينور)",
      en: "18.44° N, 77.45° E (Valinor Hills, Jezero)",
    },
    location: {
      ar: "فوهة جيزيرو وتلال فالينور (Jezero Crater, Mars)",
      en: "Jezero Crater / Valinor Hills (Mars)",
    },
    missionRole: {
      ar: "إثبات إمكانية الطيران الديناميكي الهوائي في غلاف المريخ فائق الرقة (1% من ضغط الأرض)، والعمل ككشاف جوي متقدم لروفر بيرسيفيرانس.",
      en: "Demonstrate powered aerodynamic rotorcraft flight in Mars' 1% density atmosphere, scout rover routes, and capture aerial color imagery.",
    },
    currentStatus: {
      ar: "هبطت بسلام في يناير 2024 بعد تضرر طرف إحدى شفرات دوارها في الرحلة 72. تقف الآن في تلال فالينور محطة رصد أرصاد جوية ثابتة وتذكارًا لإنجاز الأخوين رايت في الفضاء.",
      en: "Retired in place after Flight 72 in Jan 2024 sustained rotor blade damage during a dusty landing. Now serves as a permanent stationary weather station in Valinor Hills.",
    },
    backgroundImage: "./images/robots/ingenuity.jpg",
    storyVoiceOverSrc: "./audio/voiceovers/ingenuity-story.mp3",
    robotVoice: {
      ar: "أنا مروحية إنجينويتي، جيني الصغيرة. قال كثيرون إن الطيران في هواء المريخ مستحيل لأن كثافته تعادل 1% فقط من هواء الأرض. صُنعت لأطير خمس مرات فقط كتجربة، لكنني حلقت 72 مرة، وحلقت فوق الرمال لمسافة 17 كيلومترًا. تضررت شفرتي في هبوط رملي قاس، وأنا الآن أستريح فخورة بما حققته.",
      en: "I am Ingenuity, the little helicopter that could. They told us flying on Mars was impossible because the air is 99% thinner than Earth's. Built to attempt just five test hops, I flew 72 missions across 17 kilometers of Martian sky. Even grounded, I proved the skies of Mars belong to explorers.",
    },
    storyTranscript: {
      ar: "أنا مروحية إنجينويتي. حملت تحت لوحي الشمسي قطعة قماش من طائرة الأخوين رايت لعام 1903. في أبريل 2021، أدرت شفراتي الكربونية بسرعة 2400 دورة بالدقيقة وحققت أول طيران بمحرك في سماء كوكب آخر. كان المخطط خمس رحلات، فحولتُها إلى 72 رحلة حلقت فيها لأكثر من ساعتين وقطعت 17 كم قبل أن تتضرر شفرتي في هبوط قاس في تلال فالينور.",
      en: "I am Ingenuity. Carrying a swatch of fabric from the 1903 Wright Flyer, I achieved the first powered controlled aerodynamic flight on another planet in April 2021. Designed for 5 test hops over 30 days, I flew 72 missions spanning 17 kilometers across Jezero Crater before retiring as an active weather station at Valinor Hills.",
    },
    specs: [
      { label: { ar: "إجمالي الرحلات", en: "Total Flights" }, val: "72 رحلة جوية ناجحة" },
      { label: { ar: "المسافة الجوية", en: "Distance Flown" }, val: "17.0 km (10.6 miles)" },
      { label: { ar: "السرعة القصوى", en: "Top Airspeed" }, val: "10 m/s (22.4 mph)" },
    ],
  },
];

// Universal export
if (typeof window !== "undefined") {
  window.ABANDONED_EQUIPMENT = ABANDONED_EQUIPMENT;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ABANDONED_EQUIPMENT };
}
