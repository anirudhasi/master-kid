// Preloaded "most probable" chapter lists per class & subject (NCERT/CBSE-first,
// per the change request). These seed each child's Syllabus page the moment a
// subject is added — parents then edit: add/delete chapters, track progress.
// Chapters here have no sub-topics; progress is tracked at chapter level
// (Not started → In progress → Completed).

// Normalize the many subject-name variants used across onboarding presets.
function subjectKey(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('math')) return 'maths'
  if (n.includes('english')) return 'english'
  if (n.includes('evs') || n.includes('environmental')) return 'evs'
  if (n.includes('social')) return 'sst'
  if (n === 'science' || n.startsWith('science')) return 'science'
  if (n.includes('hindi')) return 'hindi'
  if (n.includes('computer') || n.includes('informatics') || n.includes('information tech')) return 'computer'
  if (n.includes('kannada')) return 'kannada'
  if (n.includes('gk') || n.includes('general knowledge')) return 'gk'
  if (n.includes('moral') || n.includes('value')) return 'moral'
  return n
}

// grade number → subjectKey → chapter names
const CATALOG: Record<number, Record<string, string[]>> = {
  1: {
    maths: ['Shapes and Space', 'Numbers 1 to 9', 'Addition up to 9', 'Subtraction up to 9', 'Numbers 10 to 20', 'Time', 'Measurement', 'Numbers 21 to 50', 'Data Handling', 'Patterns', 'Numbers 51 to 100', 'Money', 'How Many'],
    english: ['A Happy Child / Three Little Pigs', 'After a Bath / The Bubble, Straw and Shoe', 'One Little Kitten / Lalu and Peelu', 'Once I Saw a Little Bird / Mittu and the Yellow Mango', 'Merry-Go-Round / Circle', 'If I Were an Apple / Our Tree', 'A Kite / Sundari', 'A Little Turtle / The Tiger and the Mosquito', 'Clouds / Anandi\'s Rainbow', 'Flying-Man / The Tailor and his Friend'],
    hindi: ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छुक-छुक गाड़ी', 'रसोईघर', 'चूहो! म्याऊँ सो रही है', 'बंदर और गिलहरी', 'पगड़ी'],
    evs: ['My Family', 'My Body', 'My School', 'Food We Eat', 'Clothes We Wear', 'Our Home', 'Plants Around Us', 'Animals Around Us', 'Water', 'Seasons and Festivals'],
  },
  2: {
    maths: ['What is Long, What is Round?', 'Counting in Groups', 'How Much Can You Carry?', 'Counting in Tens', 'Patterns', 'Footprints', 'Jugs and Mugs', 'Tens and Ones', 'My Funday', 'Add our Points', 'Lines and Lines', 'Give and Take', 'The Longest Step', 'Birds Come, Birds Go', 'How Many Ponytails?'],
    english: ['First Day at School / Haldi\'s Adventure', 'I am Lucky! / I Want', 'A Smile / The Wind and the Sun', 'Rain / Storm in the Garden', 'Zoo Manners / Funny Bunny', 'Mr. Nobody / Curlylocks and the Three Bears', 'On My Blackboard I Can Draw / Make it Shorter', 'I am the Music Man / The Mumbai Musicians', 'Granny Granny Please Comb my Hair / The Magic Porridge Pot', 'Strange Talk / The Grasshopper and the Ant'],
    hindi: ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'म्याऊँ, म्याऊँ!!', 'अधिक बलवान कौन?', 'दोस्त की मदद', 'बहुत हुआ', 'मेरी किताब', 'तितली और कली', 'बुलबुल', 'मीठी सारंगी'],
    evs: ['My Family and Friends', 'Our Body Parts', 'Healthy Food', 'Houses Around Us', 'Plants — Our Green Friends', 'Animals — Domestic and Wild', 'Air and Water', 'Weather and Seasons', 'Means of Transport', 'Our Neighbourhood'],
  },
  3: {
    maths: ['Where to Look From', 'Fun with Numbers', 'Give and Take', 'Long and Short', 'Shapes and Designs', 'Fun with Give and Take', 'Time Goes On', 'Who is Heavier?', 'How Many Times?', 'Play with Patterns', 'Jugs and Mugs', 'Can We Share?', 'Smart Charts!', 'Rupees and Paise'],
    english: ['Good Morning / The Magic Garden', 'Bird Talk / Nina and the Baby Sparrows', 'Little by Little / The Enormous Turnip', 'Sea Song / A Little Fish Story', 'The Balloon Man / The Yellow Butterfly', 'Trains / The Story of the Road', 'Puppy and I / Little Tiger, Big Tiger', 'What\'s in the Mailbox? / My Silly Sister', 'Don\'t Tell / He is My Brother', 'How Creatures Move / The Ship of the Desert'],
    hindi: ['कक्कू', 'शेखीबाज़ मक्खी', 'चाँद वाली अम्मा', 'मन करता है', 'बहादुर बित्तो', 'हमसे सब कहते', 'टिपटिपवा', 'बंदर बाँट', 'कब आऊँ', 'क्योंजीमल और कैसे कैसलिया'],
    evs: ['Poonam\'s Day Out', 'The Plant Fairy', 'Water O\' Water!', 'Our First School', 'Chhotu\'s House', 'Foods We Eat', 'Saying Without Speaking', 'Flying High', 'It\'s Raining', 'What is Cooking', 'From Here to There', 'Work We Do', 'Sharing Our Feelings', 'The Story of Food', 'Making Pots', 'Games We Play', 'Here Comes a Letter', 'A House Like This', 'Our Friends — Animals', 'Drop by Drop', 'Families Can Be Different', 'Left-Right', 'A Beautiful Cloth', 'Web of Life'],
  },
  4: {
    maths: ['Building with Bricks', 'Long and Short', 'A Trip to Bhopal', 'Tick-Tick-Tick', 'The Way the World Looks', 'The Junk Seller', 'Jugs and Mugs', 'Carts and Wheels', 'Halves and Quarters', 'Play with Patterns', 'Tables and Shares', 'How Heavy? How Light?', 'Fields and Fences', 'Smart Charts'],
    english: ['Wake Up! / Noses', 'Neha\'s Alarm Clock / The Little Fir Tree', 'Run! / Nasruddin\'s Aim', 'Why? / Alice in Wonderland', 'Don\'t be Afraid of the Dark / Helen Keller', 'Hiawatha / The Scholar\'s Mother Tongue', 'A Watering Rhyme / The Giving Tree', 'Books / Going to Buy a Book', 'The Naughty Boy / Pinocchio', 'Wind and Water (Revision Unit)'],
    hindi: ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'दोस्त की पोशाक', 'नाव बनाओ नाव बनाओ', 'दान का हिसाब', 'कौन?', 'स्वतंत्रता की ओर', 'थप्प रोटी थप्प दाल', 'पढ़क्कू की सूझ', 'सुनीता की पहिया कुर्सी', 'हुदहुद', 'मुफ़्त ही मुफ़्त'],
    evs: ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'The Story of Amrita', 'Anita and the Honeybees', 'Omana\'s Journey', 'From the Window', 'Reaching Grandmother\'s House', 'Changing Families', 'Hu Tu Tu, Hu Tu Tu', 'The Valley of Flowers', 'Changing Times', 'A River\'s Tale', 'Basva\'s Farm', 'From Market to Home', 'A Busy Month', 'Nandita in Mumbai', 'Too Much Water, Too Little Water', 'Abdul in the Garden', 'Eating Together', 'Food and Fun', 'The World in my Home', 'Pochampalli', 'Home and Abroad', 'Spicy Riddles', 'Defence Officer: Wahida', 'Chuskit Goes to School'],
    computer: ['Introduction to Computers', 'Parts of a Computer', 'Input and Output Devices', 'Windows Basics — Files & Folders', 'Fun with MS Paint', 'Introduction to MS Word', 'Internet Basics & Online Safety'],
  },
  5: {
    maths: ['The Fish Tale', 'Shapes and Angles', 'How Many Squares?', 'Parts and Wholes', 'Does it Look the Same?', 'Be My Multiple, I\'ll be Your Factor', 'Can You See the Pattern?', 'Mapping Your Way', 'Boxes and Sketches', 'Tenths and Hundredths', 'Area and its Boundary', 'Smart Charts', 'Ways to Multiply and Divide', 'How Big? How Heavy?'],
    english: ['Ice-Cream Man / Wonderful Waste!', 'Teamwork / Flying Together', 'My Shadow / Robinson Crusoe', 'Crying / My Elder Brother', 'The Lazy Frog / Rip Van Winkle', 'Class Discussion / The Talkative Barber', 'Topsy-Turvy Land / Gulliver\'s Travels', 'Nobody\'s Friend / The Little Bully', 'Sing a Song of People / Around the World', 'Malu Bhalu / Who Will be Ningthou?'],
    hindi: ['राख की रस्सी', 'फसलों के त्योहार', 'खिलौनेवाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह', 'चिट्ठी का सफ़र', 'डाकिए की कहानी, काँवरे की जुबानी', 'वे दिन भी क्या दिन थे', 'एक माँ की बेबसी', 'एक दिन की बादशाहत', 'चावल की रोटियाँ', 'गुरु और चेला', 'स्वामी की दादी', 'बाघ आया उस रात'],
    evs: ['Super Senses', 'A Snake Charmer\'s Story', 'From Tasting to Digesting', 'Mangoes Round the Year', 'Seeds and Seeds', 'Every Drop Counts', 'Experiments with Water', 'A Treat for Mosquitoes', 'Up You Go!', 'Walls Tell Stories', 'Sunita in Space', 'What if it Finishes…?', 'A Shelter so High!', 'When the Earth Shook!', 'Blow Hot, Blow Cold', 'Who will do this Work?', 'Across the Wall', 'No Place for Us?', 'A Seed tells a Farmer\'s Story', 'Whose Forests?', 'Like Father, Like Daughter', 'On the Move Again'],
    computer: ['Evolution of Computers', 'Windows Explorer & File Management', 'More on MS Word — Formatting', 'Introduction to PowerPoint', 'Introduction to Scratch Programming', 'Internet — Search & E-mail', 'Cyber Safety'],
  },
  6: {
    maths: ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra', 'Ratio and Proportion', 'Symmetry', 'Practical Geometry'],
    science: ['Food: Where Does it Come From?', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials into Groups', 'Separation of Substances', 'Changes Around Us', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms and their Surroundings', 'Motion and Measurement of Distances', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Water', 'Air Around Us', 'Garbage In, Garbage Out'],
    sst: ['History: What, Where, How and When?', 'History: From Hunting–Gathering to Growing Food', 'History: In the Earliest Cities', 'History: Kingdoms, Kings and an Early Republic', 'Geography: The Earth in the Solar System', 'Geography: Globe — Latitudes and Longitudes', 'Geography: Motions of the Earth', 'Geography: Maps', 'Civics: Understanding Diversity', 'Civics: Diversity and Discrimination', 'Civics: What is Government?', 'Civics: Rural & Urban Livelihoods'],
    english: ['Who Did Patrick\'s Homework? / A House, A Home', 'How the Dog Found Himself a New Master!', 'Taro\'s Reward', 'An Indian–American Woman in Space', 'A Different Kind of School', 'Who I Am', 'Fair Play', 'A Game of Chance', 'Desert Animals', 'The Banyan Tree'],
    hindi: ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व', 'पार नज़र के', 'साथी हाथ बढ़ाना', 'ऐसे-ऐसे', 'टिकट अलबम', 'झाँसी की रानी'],
    computer: ['Computer Fundamentals & Memory', 'Advanced Word Processing', 'Spreadsheets — Introduction to Excel', 'More Scratch / Block Coding', 'Internet Services & Cloud', 'Cyber Ethics & Safety'],
  },
  7: {
    maths: ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'The Triangle and its Properties', 'Congruence of Triangles', 'Comparing Quantities', 'Rational Numbers', 'Practical Geometry', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers', 'Symmetry', 'Visualising Solid Shapes'],
    science: ['Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Weather, Climate and Adaptations', 'Winds, Storms and Cyclones', 'Soil', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current and its Effects', 'Light', 'Water: A Precious Resource', 'Forests: Our Lifeline', 'Wastewater Story'],
    sst: ['History: Tracing Changes Through a Thousand Years', 'History: New Kings and Kingdoms', 'History: The Delhi Sultans', 'History: The Mughal Empire', 'Geography: Environment', 'Geography: Inside Our Earth', 'Geography: Our Changing Earth', 'Geography: Air & Water', 'Civics: On Equality', 'Civics: Role of the Government in Health', 'Civics: How the State Government Works', 'Civics: Markets Around Us'],
    english: ['Three Questions / The Squirrel', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'The Ashes That Made Trees Bloom', 'Quality', 'Expert Detectives', 'The Invention of Vita-Wonk', 'Fire: Friend and Foe', 'A Bicycle in Good Repair', 'The Story of Cricket'],
    hindi: ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मीठाईवाला', 'रक्त और हमारा शरीर', 'पापा खो गए', 'शाम एक किसान', 'चिड़िया की बच्ची', 'अपूर्व अनुभव'],
    computer: ['Number Systems', 'Advanced Excel — Formulas & Charts', 'HTML Basics', 'Introduction to Python/Block Coding', 'Multimedia & Presentations', 'Cyber Crime & Security'],
  },
  8: {
    maths: ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Practical Geometry', 'Data Handling', 'Squares and Square Roots', 'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions and Identities', 'Visualising Solid Shapes', 'Mensuration', 'Exponents and Powers', 'Direct and Inverse Proportions', 'Factorisation', 'Introduction to Graphs', 'Playing with Numbers'],
    science: ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Synthetic Fibres and Plastics', 'Materials: Metals and Non-Metals', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Cell — Structure and Functions', 'Reproduction in Animals', 'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light', 'Stars and the Solar System', 'Pollution of Air and Water'],
    sst: ['History: How, When and Where', 'History: From Trade to Territory', 'History: Ruling the Countryside', 'History: When People Rebel — 1857', 'Geography: Resources', 'Geography: Land, Soil, Water, Natural Vegetation', 'Geography: Agriculture', 'Geography: Industries', 'Civics: The Indian Constitution', 'Civics: Understanding Secularism', 'Civics: Parliament and the Making of Laws', 'Civics: Judiciary'],
    english: ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury\'s Lapse of Memory', 'The Summit Within', 'This is Jody\'s Fawn', 'A Visit to Cambridge', 'A Short Monsoon Diary', 'The Great Stone Face I & II'],
    hindi: ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिए', 'क्या निराश हुआ जाए', 'यह सबसे कठिन समय नहीं', 'कबीर की साखियाँ', 'कामचोर'],
    computer: ['Networking Concepts', 'Database Basics', 'More HTML & CSS', 'Python Programming — Basics', 'App & AI Awareness', 'Digital Footprint & Cyber Law'],
  },
}

// Subjects with no NCERT-style published list get a sensible term structure the
// parent can rename or replace (edit/add/delete is always available).
const GENERIC_CHAPTERS = [
  'Term 1 — Unit 1', 'Term 1 — Unit 2', 'Term 1 — Unit 3',
  'Term 2 — Unit 1', 'Term 2 — Unit 2', 'Term 2 — Unit 3',
]

/** Best-guess preloaded chapters for a grade + subject ('' when nothing fits). */
export function chaptersFor(grade: string, subjectName: string): string[] {
  const g = parseInt(grade.replace(/\D/g, '')) || 0
  const byGrade = CATALOG[g]
  if (byGrade) {
    const list = byGrade[subjectKey(subjectName)]
    if (list) return list
  }
  // Nursery/LKG/UKG or unknown subject: give an editable scaffold, not nothing.
  return g >= 1 ? GENERIC_CHAPTERS : []
}
