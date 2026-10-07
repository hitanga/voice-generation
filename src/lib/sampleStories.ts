export interface SampleStory {
  id: string;
  title: string;
  genre: string;
  recommendedVoice: string;
  recommendedMode: string;
  recommendedPitch: number;
  tags: string[];
  excerpt: string;
  fullText: string;
}

export const SAMPLE_STORIES: SampleStory[] = [
  {
    id: "sample_hindi_panchatantra",
    title: "बुद्धिमान खरगोश और शेर (पंचतंत्र की अमर कथा)",
    genre: "Hindi Panchatantra (पंचतंत्र)",
    recommendedVoice: "Aarav",
    recommendedMode: "bedtime_warm",
    recommendedPitch: 0,
    tags: ["Hindi (हिंदी)", "Panchatantra", "Moral Story", "Indian Lore"],
    excerpt: "किसी घने और विशाल जंगल में भासुरक नाम का एक अत्यंत क्रूर शेर रहता था...",
    fullText: `किसी घने और विशाल जंगल में भासुरक नाम का एक अत्यंत क्रूर और बलशाली शेर रहता था। वह प्रतिदिन अपनी भूख मिटाने के लिए कई निर्दोष पशुओं को मार डालता था। 

जंगल के सभी पशु भयभीत हो गए। एक दिन सभी जानवरों ने मिलकर शेर से प्रार्थना की, "महाराज! यदि आप इसी तरह हमारा संहार करेंगे, तो एक दिन यह जंगल पूरी तरह खाली हो जाएगा। हम वचन देते हैं कि आपकी भूख शांत करने के लिए प्रतिदिन एक पशु स्वयं आपके पास भोजन बनकर आ जाएगा।"

शेर ने यह प्रस्ताव स्वीकार कर लिया। कई दिन शांति से बीते। अंततः एक दिन एक छोटे और समझदार खरगोश की बारी आई। खरगोश ने मन ही मन सोचा कि मृत्यु तो निश्चित है, क्यों न अपनी बुद्धिमानी से इस अत्याचारी शेर का अंत करने का उपाय खोजा जाए!

खरगोश जानबूझकर बहुत देर से शेर की गुफा के पास पहुंचा। शेर भूख से तड़प रहा था और क्रोध से लाल-पीला हो चुका था। उसने दहाड़ते हुए पूछा, "दुष्ट! तू इतना छोटा है और इतनी देर से आया है! अब मैं जंगल के सभी जानवरों का अंत कर दूंगा!"

खरगोश ने हाथ जोड़कर अत्यंत विनम्रता से कहा, "महाराज, क्षमा करें! रास्ते में मुझे एक दूसरा शेर मिल गया था। उसने स्वयं को इस जंगल का असली राजा बताया और मुझे खाने की कोशिश की। मैंने उससे कहा कि हमारे राजा भासुरक आपसे कहीं अधिक पराक्रमी हैं। उसने आपको ललकारा है!"

भासुरक क्रोध से कांप उठा और बोला, "कहाँ है वह धृष्ट? मुझे अभी उसके पास ले चल!" खरगोश उसे एक गहरे, प्राचीन कुएं के पास ले गया और बोला, "महाराज, वह इसी पाताल रूपी किले में छुपा है।"

शेर ने कुएं में झांका, तो शांत जल में उसे अपनी ही परछाई दिखाई दी। उसने अपनी ही गूंजती दहाड़ को प्रतिद्वंद्वी शेर की चुनौती समझा और बिना सोचे-समझे कुएं में छलांग लगा दी। भारी जल में डूबकर उस क्रूर शेर का अंत हो गया, और पूरे जंगल में शांति और खुशियां लौट आईं। बुद्धि बल से सदा श्रेष्ठ होती है।`,
  },
  {
    id: "sample_hindi_golden_swan",
    title: "सोने का हंस और लालची औरत (हितोपदेश की लोककथा)",
    genre: "Hindi Folk Tale (लोककथा)",
    recommendedVoice: "Ananya",
    recommendedMode: "bedtime_warm",
    recommendedPitch: 1,
    tags: ["Hindi (हिंदी)", "Folk Tale", "Bedtime", "Moral"],
    excerpt: "एक शांत गांव में एक गरीब महिला अपनी दो बेटियों के साथ बहुत तंगी में जीवन बिता रही थी...",
    fullText: `एक शांत और सुंदर गांव के किनारे, एक गरीब मां अपनी दो मासूम बेटियों के साथ एक छोटी सी झोपड़ी में रहती थी। उनके पास न तो पर्याप्त भोजन था और न ही ठंड से बचने के लिए वस्त्र। 

पास के सरोवर में एक अद्भुत हंस रहता था, जिसके पंख विशुद्ध स्वर्ण के थे। हंस ने उस परिवार की दयनीय स्थिति देखी, तो उसका हृदय करुणा से भर गया। वह उड़कर झोपड़ी की मुंडेर पर बैठा और मीठी वाणी में बोला, "हे भली माता! तुम्हारी गरीबी देखकर मुझे बहुत दुख होता है। मैं हर हफ्ते तुम्हारे पास आऊंगा और अपने शरीर से एक सोने का पंख तुम्हें भेंट करूंगा, जिसे बेचकर तुम अपनी बेटियों का पालन-पोषण सुखपूर्वक कर सको।"

हंस ने एक सोने का पंख गिरा दिया और आकाश में उड़ गया। माता ने वह पंख बाजार में बेचा, जिससे उन्हें बहुत सा धन मिला। अब उनका जीवन सुख और आनंद से बीतने लगा।

किंतु समय बीतने के साथ, उस महिला के मन में गहरा लालच जाग उठा। उसने अपनी बेटियों से कहा, "यह हंस कभी भी दूर देश उड़ सकता है। क्यों न जब यह अगली बार आए, तो हम इसके सारे पंख एक साथ नोच लें? हम एक ही दिन में बहुत अमीर बन जाएंगे!"

बेटियों ने मां को बहुत समझाया कि यह अधर्म है, किंतु लालच ने मां की बुद्धि भ्रष्ट कर दी थी। जैसे ही स्वर्ण हंस अगली सुबह प्रेमपूर्वक दाना चुगने आंगन में उतरा, महिला ने झपटकर उसके सारे पंख एक साथ उखाड़ लिए।

किंतु यह क्या! प्रकृति का नियम था कि जब तक पंख स्वेच्छा से दान न दिए जाएं, उनका कोई मूल्य नहीं रहता। महिला के हाथों में आते ही वे सोने के पंख साधारण सफेद पंखों में बदल गए। घायल हंस तड़पते हुए बोला, "लोभ सदा विनाश का कारण बनता है।" कुछ ही क्षणों में उसके नए साधारण पंख उगे और वह हमेशा के लिए उस लालची घर से उड़ गया।`,
  },
  {
    id: "sample_eldertree",
    title: "The Whispering Willow & The Silver Moth",
    genre: "Warm Bedtime Fable",
    recommendedVoice: "Kore",
    recommendedMode: "bedtime_warm",
    recommendedPitch: 0,
    tags: ["Bedtime", "Fable", "Soothing", "Nature"],
    excerpt: "Deep within the heart of the Whispering Glade, where fireflies danced like embers...",
    fullText: `Deep within the heart of the Whispering Glade, where fireflies danced like soft embers in the twilight, stood an ancient weeping willow named Elda. Elda was not like the other trees of the woodland. When the evening breeze swept gently through her silver-tipped boughs, she did not merely rustle. She hummed a lullaby so ancient that even the stars leaned down closer to listen.

One quiet night, as mist crept over the mossy stones, a tiny silver moth fluttered into the hollow of Elda's trunk. The moth's wings were trembling, tired from a long journey across the quiet valleys.

"Rest, little traveler," Elda whispered, her leafy canopy swaying with the tender warmth of a summer hearth. "Here beneath my boughs, no storm may reach you, and no shadow shall chill your heart. Close your eyes, let the crickets play their gentle strings, and let the moonlight wrap you in velvet peace."

The little moth folded its gleaming wings, feeling the slow, ancient heartbeat of the glade. Outside, the night was vast and still, cradling the dreaming forest until the coming of the dawn.`,
  },
  {
    id: "sample_obsidian_citadel",
    title: "The Chronicles of the Obsidian Gate",
    genre: "Epic Fantasy Saga",
    recommendedVoice: "Kabir",
    recommendedMode: "epic_dramatic",
    recommendedPitch: -2,
    tags: ["Epic", "Fantasy", "Dramatic", "Cinematic"],
    excerpt: "Before the high volcanic towers of the Obsidian Gate, General Korvath raised his shattered blade...",
    fullText: `The thunder broke across the jagged crags of Mount Dreadspire like the roaring of forgotten gods. Before the colossal arch of the Obsidian Gate, where molten iron veins pulsed beneath the blackened basalt, General Korvath raised his shattered blade into the tempest.

Behind him, five hundred banner-bearers stood motionless in the freezing rain, their eyes reflecting the crimson glow of the citadel fires. For seven long centuries, the gates had remained sealed by the runic blood of the first archons. But now, deep within the subterranean caverns, the titan's heart had stirred.

"Stand firm, sons and daughters of the storm!" Korvath's voice shook the stones, deep and unyielding against the howling gale. "Behind us lies everything we have loved, every hearth, every child, every song of our ancestors! If this fortress falls tonight, the sun shall never rise upon our plains again. Sound the war horns! Let the mountain remember the fury of mortals!"

A solitary horn shrieked through the lightning, and with a deafening groan that splintered the sky, the iron gates began to swing wide.`,
  },
  {
    id: "sample_baker_street_noir",
    title: "Shadows on Rain-Slicked 5th",
    genre: "Detective Noir",
    recommendedVoice: "Charon",
    recommendedMode: "noir_detective",
    recommendedPitch: -1,
    tags: ["Noir", "Mystery", "Hardboiled", "Jazz"],
    excerpt: "The rain in this city doesn't wash anything clean. It just turns yesterday's lies into cold puddles...",
    fullText: `The neon sign outside my second-story window buzzed like a trapped wasp, spelling out 'BARRON INVESTIGATIONS' in an intermittent amber twitch. The midnight rain on Fifth Avenue didn't wash anything clean; it just turned yesterday's broken promises into slick, oily mirrors under the streetlamps.

I poured two fingers of rye into a chipped glass and didn't drink it. On the mahogany desk sat an unmarked manila envelope, sealed with red wax. Inside was a single photograph from the docks at midnight and a cryptic ledger dated three days before the mayor went missing.

A knock came at the frosted glass door. Three slow taps, deliberate as a metronome. 

I kept my hand near the desk drawer. "Office is closed," I said into the quiet gloom.

The handle turned slowly. "Not for what I'm paying you, Mr. Barron," a voice drifted from the hallway. A voice like crushed velvet and expensive cigarettes. The kind of trouble you hear coming a mile away, and open the door for anyway.`,
  },
  {
    id: "sample_starlight_voyager",
    title: "The Song of the Nebula Drifter",
    genre: "Sci-Fi Wonder",
    recommendedVoice: "Aoede",
    recommendedMode: "classic_novel",
    recommendedPitch: 1,
    tags: ["Sci-Fi", "Cosmic", "Wonder", "Melodic"],
    excerpt: "At the outer rim of the Helix Cluster, solar winds sang through the magnetic sails of the Astralis...",
    fullText: `At the silent outer rim of the Helix Cluster, four hundred light-years beyond the furthest trading beacons of the Commonwealth, the starship Astralis glided through a sea of ionized violet dust. 

Dr. Lyra Vance adjusted the spectral resonators, listening to the acoustic translation of the pulsar frequencies. In the vacuum of deep space, silence was an illusion. The stars sang to one another in gravimetric waves, pulses of hydrogen light, and the slow, eternal symphony of dying supernovas.

Suddenly, the sensor bank chimed—not with random cosmic static, but with a pristine mathematical sequence: three harmonic primes followed by a golden ratio harmonic. 

Lyra leaned toward the viewport. There, nestled within the luminous folds of the nebula, floated a ring of crystalline architecture six kilometers across, slowly illuminating in resonance with her ship's arrival. After ten thousand years of searching, humanity had finally found the First Hearth.`,
  },
  {
    id: "sample_fairy_dough",
    title: "The Baker's Mischievous Sourdough",
    genre: "Whimsical & Fairy Tale",
    recommendedVoice: "Puck",
    recommendedMode: "whimsical_fantasy",
    recommendedPitch: 2,
    tags: ["Whimsical", "Comedy", "Magic", "Kids"],
    excerpt: "Old Tobias always said that sourdough needs love, but he never warned that it might bite your apron...",
    fullText: `Old Barnaby was quite certain he had followed Great-Aunt Petunia's recipe book to the exact teaspoon. Flour from the windmill, water from the wishing well, and yeast harvested under the light of the crescent moon. 

Yet at three o'clock in the morning, as the cobblestone village of Bramblewick slept, a cheerful gurgling noise echoed from the copper mixing bowl. Barnaby rubbed his flour-dusted spectacles and gasped. 

The dough wasn't merely rising. It was stretching! Two blueberry eyes blinked curiously from its bubbly crust, and with a soft 'pop!', a little doughy arm reached out and stole Barnaby's wooden spoon.

"Good heavens!" cried the old baker, dodging as the miniature loaf leaped gracefully from the counter onto the spice shelf, dusting cinnamon over the sleeping ginger cat. "Come back here, you unruly pastry! You're supposed to be breakfast, not a circus acrobat!"

The bread simply giggled, puffed up like a balloon, and did three cartwheels into the flour bin.`,
  },
];
