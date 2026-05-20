export type WorksheetComplexity = 'easy' | 'medium' | 'hard'
export type WorksheetSubject = 'Math' | 'English' | 'Science' | 'Hindi' | 'Social Studies' | 'EVS' | 'Computer'

export interface Worksheet {
  id: string
  grade: number
  subject: WorksheetSubject
  title: string
  topic: string
  complexity: WorksheetComplexity
  tags: string[]
  estimatedMinutes: number
  board: 'CBSE' | 'ICSE' | 'all'
  description: string
  questionCount: number
}

let _id = 1
const w = (grade: number, subject: WorksheetSubject, title: string, topic: string, complexity: WorksheetComplexity, tags: string[], mins: number, desc: string, qc: number): Worksheet => ({
  id: String(_id++), grade, subject, title, topic, complexity, tags, estimatedMinutes: mins, board: 'CBSE', description: desc, questionCount: qc,
})

export const WORKSHEETS: Worksheet[] = [

  // ── MATH GRADE 1 ────────────────────────────────────────────────────────────
  w(1,'Math','Counting Objects to 20','Number Sense','easy',['counting','numbers','objects'],15,'Count and write numbers using pictures of fruits, animals, and toys.',10),
  w(1,'Math','Forward and Backward Counting','Number Sense','easy',['counting','sequences'],15,'Fill in missing numbers counting forward and backward from 1–50.',12),
  w(1,'Math','More, Less, or Equal','Comparison','easy',['comparison','greater','lesser'],15,'Compare groups of objects and tick more, less, or equal.',10),
  w(1,'Math','Addition Using Pictures','Addition','easy',['addition','pictures','sum'],20,'Add two groups of objects (sum up to 10) using visual counting.',15),
  w(1,'Math','Subtraction Stories','Subtraction','easy',['subtraction','take away'],20,'Solve simple take-away problems using pictures.',12),
  w(1,'Math','Shapes Around Us','Geometry','easy',['shapes','circle','square','triangle'],20,'Identify and colour basic 2D shapes in real-life pictures.',10),
  w(1,'Math','Numbers Before and After','Number Sense','easy',['before','after','sequences'],15,'Write the number that comes before and after each given number.',12),
  w(1,'Math','Odd and Even Numbers 1–20','Number Sense','medium',['odd','even'],20,'Circle odd numbers in red and even numbers in blue up to 20.',15),
  w(1,'Math','Addition Number Bonds to 10','Addition','medium',['bonds','number families','addition'],20,'Complete number bond diagrams; find all pairs that make 10.',14),
  w(1,'Math','Skip Counting by 2s and 5s','Number Sense','medium',['skip counting','patterns'],20,'Fill in the blanks counting by 2s and 5s up to 50.',12),
  w(1,'Math','Long and Short, Heavy and Light','Measurement','easy',['measurement','comparison','length'],20,'Compare objects: circle the longer/heavier/taller item.',10),
  w(1,'Math','Days of the Week & Months','Time','easy',['calendar','days','months'],15,'Order days of week, identify today/yesterday/tomorrow.',10),
  w(1,'Math','Tally Marks','Data Handling','easy',['tally','counting','data'],15,'Count objects and represent using tally marks.',10),
  w(1,'Math','Addition and Subtraction Mixed','Addition','medium',['addition','subtraction','mixed'],25,'Solve a mix of addition and subtraction within 20.',20),
  w(1,'Math','Number Names 1–50','Number Sense','easy',['number names','writing'],20,'Match numerals to their number names (one, two… fifty).',15),

  // ── MATH GRADE 2 ────────────────────────────────────────────────────────────
  w(2,'Math','Place Value: Tens and Ones','Place Value','easy',['tens','ones','place value'],20,'Identify tens and ones in 2-digit numbers using blocks.',15),
  w(2,'Math','Adding 2-Digit Numbers (No Regrouping)','Addition','easy',['addition','2-digit'],20,'Add two 2-digit numbers where no carrying is needed.',15),
  w(2,'Math','Adding with Regrouping','Addition','medium',['addition','regrouping','carry'],25,'Add 2-digit numbers that require carrying over.',18),
  w(2,'Math','Subtracting 2-Digit Numbers','Subtraction','medium',['subtraction','2-digit','borrowing'],25,'Subtract 2-digit numbers including problems requiring borrowing.',18),
  w(2,'Math','Multiplication as Repeated Addition','Multiplication','easy',['multiplication','groups','repeated addition'],20,'Write multiplication from pictures of equal groups.',12),
  w(2,'Math','Tables of 2, 3, 5, 10','Multiplication','medium',['tables','multiplication','times tables'],25,'Complete multiplication tables and answer related questions.',20),
  w(2,'Math','Halves and Quarters','Fractions','easy',['fractions','half','quarter'],20,'Shade half and quarter of shapes; identify fractions in pictures.',12),
  w(2,'Math','2D Shapes: Sides and Corners','Geometry','easy',['shapes','sides','corners','vertices'],20,'Count sides and corners of 2D shapes; sort shapes by property.',14),
  w(2,'Math','Telling Time to the Hour and Half Hour','Time','easy',['time','clock','hour','half hour'],20,'Draw hands on clock faces; write times shown on clocks.',12),
  w(2,'Math','Money: Coins and Notes (Indian ₹)','Money','easy',['money','coins','rupees','Indian currency'],25,'Identify coins and notes; add small amounts of Indian money.',15),
  w(2,'Math','Word Problems: Addition & Subtraction','Word Problems','medium',['word problems','addition','subtraction','real life'],25,'Solve 2-step real-life story problems using addition and subtraction.',15),
  w(2,'Math','Patterns: Shapes and Numbers','Patterns','easy',['patterns','sequences','shapes'],20,'Extend and create patterns with shapes and numbers.',12),
  w(2,'Math','Measurement: Rulers and cm','Measurement','medium',['measurement','centimetres','rulers'],20,'Measure lines and objects using a ruler; compare lengths.',12),
  w(2,'Math','Skip Counting by 3s and 4s','Number Sense','medium',['skip counting','3s','4s'],20,'Count forward and backward by 3s and 4s.',12),
  w(2,'Math','Numbers up to 999: Reading and Writing','Number Sense','medium',['hundreds','place value','3-digit'],20,'Read, write, and order 3-digit numbers.',15),

  // ── MATH GRADE 3 ────────────────────────────────────────────────────────────
  w(3,'Math','Place Value to Thousands','Place Value','easy',['thousands','hundreds','place value'],20,'Identify, expand, and compare 4-digit numbers.',15),
  w(3,'Math','Multiplication Tables 6–10','Multiplication','medium',['tables','times tables','6-10'],25,'Practise and apply multiplication tables 6 through 10.',20),
  w(3,'Math','Long Multiplication (2×1 digit)','Multiplication','medium',['long multiplication','2-digit'],25,'Multiply a 2-digit number by a 1-digit number with steps.',18),
  w(3,'Math','Division as Sharing and Grouping','Division','easy',['division','sharing','grouping'],20,'Solve division problems using pictures of sharing equally.',15),
  w(3,'Math','Simple Division with Remainders','Division','medium',['division','remainders'],25,'Divide and find the quotient and remainder.',18),
  w(3,'Math','Fractions: Halves, Thirds, Quarters','Fractions','medium',['fractions','numerator','denominator'],25,'Identify, name, and compare unit fractions up to 1/10.',15),
  w(3,'Math','Adding and Subtracting Fractions (Same Denominator)','Fractions','medium',['fractions','addition','subtraction'],25,'Add and subtract like fractions with visual support.',15),
  w(3,'Math','Perimeter of Rectangles and Squares','Geometry','medium',['perimeter','rectangle','square'],20,'Calculate perimeter by adding all sides.',15),
  w(3,'Math','Area Using Square Units','Geometry','medium',['area','square units','counting'],20,'Count squares to find area of irregular shapes on grids.',15),
  w(3,'Math','Reading Bar Graphs','Data Handling','easy',['bar graph','data','reading'],20,'Answer questions by reading information from bar graphs.',14),
  w(3,'Math','Roman Numerals 1–20','Number Sense','medium',['roman numerals','I','V','X'],20,'Convert between Roman numerals and Arabic numerals up to 20.',12),
  w(3,'Math','Telling Time to the Minute','Time','medium',['time','clock','minutes'],20,'Read analogue clocks to the minute; solve elapsed time problems.',15),
  w(3,'Math','Rounding to the Nearest 10 and 100','Number Sense','medium',['rounding','estimation','nearest 10'],20,'Round numbers and estimate sums/differences.',15),
  w(3,'Math','Word Problems: Multiplication and Division','Word Problems','medium',['word problems','multiplication','division'],25,'Multi-step problems using all four operations.',20),
  w(3,'Math','Money: Making Change','Money','medium',['money','change','rupees','subtraction'],25,'Calculate change from purchases using Indian currency.',15),

  // ── MATH GRADE 4 ────────────────────────────────────────────────────────────
  w(4,'Math','Large Numbers to Lakhs','Place Value','easy',['lakhs','Indian number system','place value'],20,'Read and write numbers up to 1,00,000 in Indian system.',15),
  w(4,'Math','Multiplication of 3-Digit by 2-Digit','Multiplication','medium',['long multiplication','3-digit','2-digit'],25,'Multiply 3-digit numbers by 2-digit numbers using standard algorithm.',20),
  w(4,'Math','Long Division with Remainders','Division','hard',['long division','3-digit','remainders'],30,'Divide 3-digit numbers by 1-digit with full working.',20),
  w(4,'Math','Factors and Multiples','Number Theory','medium',['factors','multiples','HCF','LCM'],25,'Find factors, multiples; identify prime vs composite numbers.',18),
  w(4,'Math','Equivalent Fractions','Fractions','medium',['equivalent fractions','simplifying','comparing'],25,'Find equivalent fractions and simplify using GCD.',18),
  w(4,'Math','Adding and Subtracting Mixed Numbers','Fractions','hard',['mixed numbers','fractions','addition'],30,'Add and subtract mixed numbers with unlike denominators.',20),
  w(4,'Math','Decimals: Tenths and Hundredths','Decimals','medium',['decimals','tenths','hundredths'],25,'Read, write, and order decimals to hundredths place.',18),
  w(4,'Math','Addition and Subtraction of Decimals','Decimals','medium',['decimals','addition','subtraction'],25,'Add and subtract decimal numbers in column form.',18),
  w(4,'Math','Angles: Acute, Right, Obtuse','Geometry','medium',['angles','acute','obtuse','right angle'],20,'Identify and measure angles; classify by type.',15),
  w(4,'Math','Lines, Line Segments, Rays','Geometry','easy',['lines','parallel','perpendicular'],20,'Identify types of lines; draw and label geometric figures.',15),
  w(4,'Math','Pictographs and Bar Graphs','Data Handling','medium',['pictograph','bar graph','data','tally'],25,'Read, interpret, and draw simple data charts.',18),
  w(4,'Math','Unitary Method','Word Problems','hard',['unitary method','proportional reasoning'],30,'Solve problems using the concept of unit value.',20),
  w(4,'Math','Perimeter and Area of Rectangles','Geometry','medium',['perimeter','area','rectangle','formula'],25,'Apply formulae to find perimeter and area; solve real problems.',18),
  w(4,'Math','Profit and Loss (Introduction)','Applied Math','hard',['profit','loss','cost price','selling price'],30,'Understand and calculate simple profit and loss situations.',20),
  w(4,'Math','Patterns and Symmetry','Geometry','easy',['symmetry','lines of symmetry','patterns'],20,'Identify lines of symmetry; complete symmetrical figures.',15),

  // ── MATH GRADE 5 ────────────────────────────────────────────────────────────
  w(5,'Math','Numbers up to Crores','Place Value','easy',['crores','Indian number system','place value'],20,'Read, write, and compare numbers up to 10 crore.',15),
  w(5,'Math','HCF and LCM','Number Theory','medium',['HCF','LCM','prime factorisation'],25,'Find HCF and LCM using prime factorisation and division methods.',20),
  w(5,'Math','Fractions: BODMAS with Fractions','Fractions','hard',['BODMAS','fractions','order of operations'],30,'Apply order of operations to fraction problems.',20),
  w(5,'Math','Multiplication of Fractions','Fractions','medium',['fractions','multiplication','product'],25,'Multiply fractions and mixed numbers.',18),
  w(5,'Math','Division of Fractions','Fractions','hard',['fractions','division','reciprocal'],30,'Divide fractions using reciprocal method.',20),
  w(5,'Math','Decimals: Multiplication','Decimals','medium',['decimals','multiplication','tenths'],25,'Multiply decimals by whole numbers and by decimals.',18),
  w(5,'Math','Decimals: Division','Decimals','hard',['decimals','division','hundredths'],30,'Divide decimals by whole numbers and decimals.',20),
  w(5,'Math','Percentage: Introduction','Percentage','medium',['percentage','fraction','decimal','conversion'],25,'Convert between fractions, decimals, and percentages.',18),
  w(5,'Math','Ratio and Proportion','Ratio','medium',['ratio','proportion','comparison'],25,'Write and simplify ratios; solve proportion problems.',18),
  w(5,'Math','Area of Triangles','Geometry','medium',['area','triangle','formula','base','height'],25,'Calculate area of triangles using ½ × base × height.',18),
  w(5,'Math','Volume of Cuboids','Geometry','hard',['volume','cuboid','l×b×h'],30,'Find volume of cuboids and cubes using formula.',20),
  w(5,'Math','Speed, Distance, Time','Applied Math','hard',['speed','distance','time','formula'],30,'Solve real-life speed-distance-time problems.',20),
  w(5,'Math','Data: Mean, Median, Mode','Data Handling','hard',['mean','median','mode','average'],30,'Calculate measures of central tendency for data sets.',20),
  w(5,'Math','Simple Interest','Applied Math','hard',['simple interest','principal','rate','time'],30,'Calculate SI using the formula P×R×T/100.',20),
  w(5,'Math','Algebraic Expressions (Introduction)','Algebra','medium',['algebra','variable','expression','term'],25,'Identify terms in expressions; evaluate simple algebraic expressions.',18),

  // ── MATH GRADE 6 ────────────────────────────────────────────────────────────
  w(6,'Math','Integers: Introduction and Number Line','Integers','easy',['integers','positive','negative','number line'],20,'Represent integers on a number line; order and compare.',15),
  w(6,'Math','Operations on Integers','Integers','medium',['integers','addition','subtraction','multiplication'],25,'Add, subtract, multiply, and divide positive and negative integers.',20),
  w(6,'Math','Fractions: Unlike Denominators','Fractions','medium',['unlike fractions','LCM','addition'],25,'Add and subtract fractions with different denominators using LCM.',18),
  w(6,'Math','Basic Algebra: Linear Equations','Algebra','medium',['linear equations','variable','solve','balance method'],25,'Solve one-step and two-step linear equations.',18),
  w(6,'Math','Ratio, Proportion, and Unitary Method','Ratio','medium',['ratio','proportion','unitary method'],25,'Solve complex ratio problems and proportion puzzles.',20),
  w(6,'Math','Percentage Applications','Percentage','medium',['percentage','profit','loss','discount'],25,'Find percentage of quantities; apply to profit/loss/discount.',20),
  w(6,'Math','Geometry: Lines and Angles','Geometry','medium',['angles','parallel lines','transversal','vertically opposite'],25,'Identify angle pairs: supplementary, complementary, vertically opposite.',18),
  w(6,'Math','Triangle Properties','Geometry','medium',['triangle','angle sum','types of triangles'],25,'Apply angle sum property; classify triangles by side and angle.',18),
  w(6,'Math','Area and Perimeter: Composite Shapes','Geometry','hard',['area','perimeter','composite','L-shape'],30,'Find area and perimeter of composite (L-shaped, irregular) figures.',20),
  w(6,'Math','Data Handling: Frequency Tables & Histograms','Data Handling','medium',['frequency','histogram','class interval'],25,'Organise raw data into frequency tables; draw histograms.',20),
  w(6,'Math','Symmetry and Reflection','Geometry','easy',['symmetry','reflection','line of symmetry'],20,'Identify and draw axes of symmetry; reflect shapes in a line.',15),
  w(6,'Math','Exponents and Powers','Number Theory','medium',['exponents','powers','base','square','cube'],25,'Calculate squares, cubes; use exponential notation.',18),
  w(6,'Math','Mensuration: Circle Area and Circumference','Geometry','hard',['circle','circumference','area','π'],30,'Apply formulae: C = 2πr and A = πr² to solve problems.',20),
  w(6,'Math','Speed Problems with Unit Conversion','Applied Math','hard',['speed','km/h','m/s','conversion'],30,'Convert units and solve complex speed-distance-time problems.',20),
  w(6,'Math','Probability: Introduction','Probability','medium',['probability','likely','certain','impossible'],25,'Understand and calculate simple probabilities; experimental vs theoretical.',18),

  // ── MATH GRADE 7 ────────────────────────────────────────────────────────────
  w(7,'Math','Rational Numbers and Number Line','Rational Numbers','medium',['rational numbers','fractions','number line'],25,'Represent rational numbers on number line; compare and order.',18),
  w(7,'Math','Operations on Rational Numbers','Rational Numbers','hard',['rational numbers','arithmetic operations'],30,'Add, subtract, multiply, divide rational numbers.',20),
  w(7,'Math','Linear Equations in One Variable','Algebra','medium',['linear equations','variable','solve'],25,'Solve equations with variables on both sides; word problems.',20),
  w(7,'Math','Lines and Angles: Parallel Lines','Geometry','medium',['parallel lines','transversal','corresponding angles'],25,'Identify angle relationships formed by a transversal.',18),
  w(7,'Math','Triangle Congruence Criteria','Geometry','hard',['congruence','SSS','SAS','ASA','RHS'],30,'Apply congruence conditions to prove triangles congruent.',20),
  w(7,'Math','Pythagoras Theorem','Geometry','hard',['Pythagoras','right triangle','hypotenuse'],30,'Verify Pythagoras theorem; find missing sides of right triangles.',20),
  w(7,'Math','Percentage: Profit, Loss, Discount, Tax','Applied Math','hard',['profit','loss','discount','GST','tax'],30,'Solve multi-step problems involving commerce mathematics.',20),
  w(7,'Math','Simple and Compound Interest','Applied Math','hard',['simple interest','compound interest','formula'],30,'Calculate and compare simple and compound interest.',20),
  w(7,'Math','Algebraic Expressions: Expansion','Algebra','hard',['algebraic expressions','expansion','factorisation','identities'],30,'Expand algebraic expressions using identities like (a+b)².',20),
  w(7,'Math','Mensuration: Surface Area and Volume','Geometry','hard',['surface area','volume','cuboid','cylinder'],30,'Find surface area and volume of cuboids and cylinders.',20),
  w(7,'Math','Statistics: Mean, Median, Mode, Range','Data Handling','medium',['statistics','mean','median','mode','range'],25,'Calculate and interpret all measures of central tendency.',20),
  w(7,'Math','Probability: Experiments and Events','Probability','medium',['probability','experiment','event','sample space'],25,'List sample spaces; calculate probability of events.',18),
  w(7,'Math','Symmetry: Rotational Symmetry','Geometry','medium',['rotational symmetry','order of symmetry','centre'],20,'Identify order of rotational symmetry; distinguish from line symmetry.',15),
  w(7,'Math','Visualising Solid Shapes','Geometry','medium',['3D shapes','nets','faces','edges','vertices'],25,'Match 3D shapes with their nets; count faces, edges, vertices.',18),
  w(7,'Math','Ratio and Proportion: Direct and Inverse','Ratio','hard',['direct proportion','inverse proportion','variation'],30,'Distinguish and solve direct vs inverse proportion problems.',20),

  // ── MATH GRADE 8 ────────────────────────────────────────────────────────────
  w(8,'Math','Rational Numbers: All Operations','Rational Numbers','hard',['rational numbers','operations','BODMAS'],30,'Apply BODMAS to complex rational number expressions.',20),
  w(8,'Math','Squares and Square Roots','Number Theory','medium',['squares','square roots','prime factorisation','long division'],25,'Find square roots using prime factorisation and long division.',20),
  w(8,'Math','Cubes and Cube Roots','Number Theory','hard',['cubes','cube roots','estimation'],30,'Find cube roots by prime factorisation; estimate cube roots.',20),
  w(8,'Math','Linear Equations: Two Variables','Algebra','hard',['linear equations','two variables','simultaneous','graphical'],30,'Solve simultaneous equations algebraically and graphically.',20),
  w(8,'Math','Algebraic Identities','Algebra','hard',['identities','(a+b)²','(a-b)²','(a+b)(a-b)','factorisation'],30,'Apply all standard algebraic identities to expand and factorise.',20),
  w(8,'Math','Factorisation of Expressions','Algebra','hard',['factorisation','common factors','grouping','identities'],30,'Factorise algebraic expressions using multiple methods.',20),
  w(8,'Math','Quadrilaterals: Properties and Types','Geometry','medium',['quadrilaterals','parallelogram','rhombus','trapezium'],25,'Apply properties of special quadrilaterals to solve problems.',18),
  w(8,'Math','Mensuration: Trapezium and Polygon Area','Geometry','hard',['mensuration','trapezium','polygon','area'],30,'Calculate areas of trapeziums and composite polygons.',20),
  w(8,'Math','Understanding Graphs: Linear and Non-linear','Graphs','medium',['graphs','linear','non-linear','coordinates'],25,'Plot and interpret graphs of real-life situations.',18),
  w(8,'Math','Percentage: Commission and Partnership','Applied Math','hard',['commission','partnership','profit sharing'],30,'Solve complex percentage applications involving business.',20),
  w(8,'Math','Direct and Inverse Proportion Applications','Ratio','hard',['proportion','direct','inverse','real life'],30,'Solve advanced proportion problems in time-work and pipes.',20),
  w(8,'Math','Introduction to Probability','Probability','medium',['probability','playing cards','dice','coins'],25,'Calculate probability for standard experiments (cards, dice, coins).',20),
  w(8,'Math','Data Handling: Pie Charts','Data Handling','medium',['pie chart','sector','central angle','percentage'],25,'Draw and interpret pie charts; calculate sector angles.',18),
  w(8,'Math','Exponents: Laws and Applications','Number Theory','hard',['laws of exponents','negative exponents','scientific notation'],30,'Apply all laws of exponents; write numbers in scientific notation.',20),
  w(8,'Math','Introduction to Trigonometry (Preview)','Geometry','hard',['trigonometry','sin','cos','tan','right triangle'],30,'Introduction to sine, cosine, tangent ratios using right triangles.',20),

  // ── ENGLISH GRADE 1 ─────────────────────────────────────────────────────────
  w(1,'English','Alphabet Recognition A–Z','Phonics','easy',['alphabet','letters','uppercase','lowercase'],15,'Match uppercase to lowercase letters; identify letters in words.',12),
  w(1,'English','CVC Words: Short Vowel Sounds','Phonics','easy',['CVC','short vowels','reading','phonics'],20,'Read and write simple CVC words: cat, hen, big, top, sun.',15),
  w(1,'English','Sight Words: List 1 (Dolch)','Vocabulary','easy',['sight words','Dolch','reading','common words'],20,'Recognise and practise the first 30 high-frequency sight words.',20),
  w(1,'English','Naming Words: Nouns Around Me','Grammar','easy',['nouns','naming words','people','places','things'],15,'Identify nouns in simple sentences; sort into people/places/things.',12),
  w(1,'English','Action Words: Verbs in Pictures','Grammar','easy',['verbs','action words','doing words'],15,'Identify action words from pictures; complete sentences with verbs.',12),
  w(1,'English','Describing Words: Adjectives','Grammar','easy',['adjectives','describing words','colour','size','shape'],20,'Use adjectives to describe pictures; fill in describing words.',12),
  w(1,'English','Simple Sentences: Subject + Verb','Grammar','easy',['sentences','subject','verb','structure'],20,'Build simple sentences from word cards; identify subject and verb.',12),
  w(1,'English','Capital Letters and Full Stop','Punctuation','easy',['capitals','full stop','punctuation','sentences'],20,'Correct sentences that are missing capitals and full stops.',15),
  w(1,'English','Rhyming Words','Phonics','easy',['rhyming','word families','-at','-en','-in'],20,'Match rhyming words; complete rhyming pairs.',15),
  w(1,'English','Reading Comprehension: Short Passage','Comprehension','easy',['comprehension','reading','questions','answers'],25,'Read a 4-sentence passage; answer who/what/where questions.',8),
  w(1,'English','Letter Writing Sounds: Blends','Phonics','medium',['blends','bl-','cl-','br-','consonant clusters'],20,'Read and write words with common consonant blends.',15),
  w(1,'English','Singular and Plural Nouns','Grammar','easy',['singular','plural','nouns','-s','-es'],20,'Change singular nouns to plural; identify correct plural forms.',12),
  w(1,'English','Question Words: Who, What, Where','Grammar','easy',['question words','who','what','where','when'],15,'Match questions to pictures; practise using question words.',10),
  w(1,'English','My Family: Descriptive Writing','Writing','easy',['writing','family','description','sentences'],25,'Write 3 simple sentences about family members with prompts.',3),
  w(1,'English','Story Sequence: Putting Events in Order','Comprehension','easy',['sequencing','story','first','then','last'],20,'Cut and paste story pictures in correct order; write labels.',5),

  // ── ENGLISH GRADE 2 ─────────────────────────────────────────────────────────
  w(2,'English','Common and Proper Nouns','Grammar','easy',['proper nouns','common nouns','capitals'],20,'Distinguish common from proper nouns; capitalise proper nouns correctly.',15),
  w(2,'English','Pronouns: I, He, She, They, We','Grammar','easy',['pronouns','subject pronouns','substitution'],20,'Replace nouns with correct pronouns in sentences.',15),
  w(2,'English','Present Tense: Is/Am/Are','Grammar','medium',['present tense','is','am','are','verb to be'],20,'Choose correct form of "to be"; write sentences in present tense.',15),
  w(2,'English','Past Tense: Regular Verbs (-ed)','Grammar','medium',['past tense','-ed','regular verbs'],20,'Change present tense verbs to past by adding -ed.',15),
  w(2,'English','Compound Words','Vocabulary','easy',['compound words','word building','combination'],20,'Join two words to make compound words; use in sentences.',15),
  w(2,'English','Antonyms and Synonyms (Set 1)','Vocabulary','medium',['antonyms','synonyms','opposites','similar'],20,'Match words to their opposites and synonyms.',15),
  w(2,'English','Punctuation: Question Mark and Exclamation','Punctuation','medium',['question mark','exclamation','punctuation'],20,'Identify sentence types; add correct end punctuation.',15),
  w(2,'English','Comprehension: Animal Stories','Comprehension','easy',['comprehension','animals','reading','inference'],25,'Read a short animal story; answer literal and simple inferential questions.',10),
  w(2,'English','Conjunctions: And, But, Or, Because','Grammar','medium',['conjunctions','joining sentences','and','but','because'],25,'Join sentence pairs using appropriate conjunctions.',15),
  w(2,'English','Paragraph Writing: My Pet','Writing','medium',['paragraph','writing','pet','description','sentences'],30,'Write a 5-sentence paragraph about a pet using given vocabulary.',5),
  w(2,'English','Alphabetical Order (Dictionaries)','Vocabulary','easy',['alphabetical order','dictionary','sorting'],20,'Arrange words alphabetically to 2nd and 3rd letter.',12),
  w(2,'English','Similes: As ___ as a ___','Grammar','medium',['similes','comparison','as...as','creative'],20,'Complete and create similes using given structures.',12),
  w(2,'English','Word Families: -ight, -ame, -ore','Phonics','medium',['word families','long vowels','spelling patterns'],20,'Build and read word families with long vowel patterns.',15),
  w(2,'English','Comprehension: Non-fiction (Animals)','Comprehension','medium',['non-fiction','facts','comprehension','animals'],25,'Read a factual text; distinguish fact from opinion.',10),
  w(2,'English','Informal Letter: Writing to a Friend','Writing','hard',['letter writing','informal','format','greeting','closing'],30,'Write an informal letter following correct format.',1),

  // ── ENGLISH GRADE 3–5 (sample set) ──────────────────────────────────────────
  w(3,'English','Tenses: Simple Present, Past, Future','Grammar','medium',['tenses','present','past','future','timeline'],25,'Identify and use all three simple tenses correctly.',18),
  w(3,'English','Comprehension: Folk Tale','Comprehension','medium',['folk tale','comprehension','moral','inference'],30,'Read an Indian folk tale; identify moral; answer inference questions.',12),
  w(3,'English','Adjectives: Degrees of Comparison','Grammar','medium',['adjectives','comparative','superlative','degrees'],25,'Form comparative and superlative forms; use in sentences.',18),
  w(3,'English','Prepositions: In, On, Under, Between','Grammar','easy',['prepositions','in','on','under','position'],20,'Use prepositions correctly to describe positions in pictures.',15),
  w(3,'English','Story Writing: Beginning, Middle, End','Writing','hard',['story writing','narrative','structure','characters'],35,'Write a short story using given characters and a story map.',1),
  w(3,'English','Speech Marks: Direct Speech','Punctuation','hard',['speech marks','direct speech','dialogue','inverted commas'],25,'Punctuate dialogue correctly using speech marks.',15),
  w(3,'English','Comprehension: Poem','Comprehension','medium',['poem','comprehension','stanza','rhyme','theme'],25,'Read a poem; identify rhyme scheme, theme, and answer questions.',8),
  w(3,'English','Synonyms for Overused Words','Vocabulary','medium',['synonyms','said','went','nice','big','vocabulary enrichment'],20,'Replace overused words with more precise synonyms.',15),
  w(4,'English','Active and Passive Voice (Introduction)','Grammar','hard',['active voice','passive voice','sentence structure'],30,'Convert sentences from active to passive voice and vice versa.',15),
  w(4,'English','Reported Speech: Statements','Grammar','hard',['reported speech','indirect speech','tense shift'],30,'Convert direct statements to reported speech with tense changes.',15),
  w(4,'English','Comprehension: Biography','Comprehension','hard',['biography','comprehension','inference','character'],30,'Read a short biography of an Indian leader; answer higher-order questions.',12),
  w(4,'English','Essay Writing: My School','Writing','hard',['essay','formal','paragraphs','introduction','conclusion'],35,'Write a 3-paragraph essay with clear introduction and conclusion.',1),
  w(4,'English','Idioms and Their Meanings','Vocabulary','hard',['idioms','figurative language','meaning in context'],25,'Match idioms to meanings; use 5 idioms in original sentences.',15),
  w(5,'English','Modal Verbs: Can, Could, Should, Must','Grammar','medium',['modal verbs','ability','obligation','permission'],25,'Use modal verbs correctly; distinguish between their uses.',18),
  w(5,'English','Comprehension: Newspaper Article','Comprehension','hard',['newspaper','comprehension','fact vs opinion','headline'],30,'Read a news-style article; identify main idea, facts, and opinions.',12),
  w(5,'English','Persuasive Writing: Letter to Editor','Writing','hard',['persuasive writing','letter to editor','argument','evidence'],35,'Write a persuasive letter using reasons and evidence.',1),

  // ── SCIENCE GRADE 3 ─────────────────────────────────────────────────────────
  w(3,'Science','Parts of a Plant and Their Functions','Biology','easy',['plants','roots','stem','leaves','functions'],20,'Label plant parts; match each part to its function.',12),
  w(3,'Science','Living and Non-Living Things','Biology','easy',['living','non-living','characteristics of life'],20,'Sort objects into living and non-living; justify with characteristics.',12),
  w(3,'Science','Animal Habitats','Biology','easy',['habitats','forest','desert','ocean','adaptations'],20,'Match animals to habitats; explain one adaptation for each.',12),
  w(3,'Science','Sources of Food: Plant vs Animal','Biology','easy',['food sources','plants','animals','nutrition'],20,'Classify foods by source; identify nutrients in common foods.',12),
  w(3,'Science','States of Matter','Physics','medium',['solid','liquid','gas','properties','matter'],20,'Identify states; describe properties; give examples from daily life.',15),
  w(3,'Science','Water: Sources and Uses','EVS','easy',['water','sources','conservation','water cycle'],20,'Identify sources of water; suggest ways to conserve water.',12),
  w(3,'Science','Air and Wind','Physics','easy',['air','wind','properties of air','atmosphere'],20,'Prove air occupies space; describe properties and uses of air.',12),
  w(3,'Science','Simple Machines Around Us','Physics','medium',['simple machines','lever','pulley','wheel','inclined plane'],25,'Identify simple machines in daily objects; explain advantages.',14),
  w(3,'Science','Rocks and Soil Types','Earth Science','easy',['rocks','soil','types','properties','minerals'],20,'Observe and classify soil types; match rocks to their uses.',12),
  w(3,'Science','Seasons and Weather','Earth Science','easy',['seasons','weather','temperature','rainfall','India'],20,'Describe seasonal changes in India; relate to human activities.',12),
  w(3,'Science','Our Senses: Five Sense Organs','Biology','easy',['senses','eyes','ears','nose','tongue','skin'],20,'Match senses to organs; describe functions; safety rules.',12),
  w(3,'Science','Light and Shadow','Physics','medium',['light','shadow','transparent','opaque','translucent'],25,'Explain shadow formation; classify materials by light transmission.',15),
  w(3,'Science','Healthy Food and Balanced Diet','Biology','medium',['nutrition','balanced diet','vitamins','proteins','carbohydrates'],25,'Build a balanced meal; identify food groups and their nutrients.',15),
  w(3,'Science','Pollution: Air, Water, Soil','EVS','medium',['pollution','causes','effects','solutions','environment'],25,'Identify types of pollution; suggest child-friendly solutions.',15),
  w(3,'Science','Transport and Communication','EVS','easy',['transport','communication','means','ancient','modern'],20,'Compare ancient vs modern transport and communication methods.',12),

  // ── SCIENCE GRADE 4–6 ────────────────────────────────────────────────────────
  w(4,'Science','Digestive System','Biology','medium',['digestion','stomach','intestine','enzymes','organs'],25,'Trace food through the digestive system; label a diagram.',15),
  w(4,'Science','Skeletal and Muscular System','Biology','medium',['skeleton','muscles','joints','movement','bones'],25,'Identify major bones and muscles; explain their roles.',15),
  w(4,'Science','Electricity: Circuits and Conductors','Physics','medium',['circuit','conductor','insulator','switch','bulb'],25,'Draw simple circuits; test conductors and insulators.',15),
  w(4,'Science','Magnets: Properties and Uses','Physics','easy',['magnets','poles','attract','repel','compass'],20,'Explore magnetic properties; describe real-world uses.',12),
  w(4,'Science','Photosynthesis and Respiration','Biology','hard',['photosynthesis','respiration','oxygen','carbon dioxide','chlorophyll'],30,'Write equations; draw and explain process diagrams.',18),
  w(5,'Science','Human Reproductive System (Introduction)','Biology','medium',['reproduction','life cycle','puberty','age-appropriate'],25,'Understand basic life cycles of plants and animals; human development.',15),
  w(5,'Science','Solar System and Space','Physics','medium',['planets','solar system','sun','moon','stars'],25,'Order planets by distance; describe features of each planet.',15),
  w(5,'Science','Changes Around Us: Physical and Chemical','Chemistry','hard',['physical change','chemical change','reversible','irreversible'],30,'Classify changes; design experiments to distinguish them.',18),
  w(6,'Science','Cell: Structure and Function','Biology','medium',['cell','nucleus','membrane','chloroplast','organelles'],25,'Label plant and animal cells; compare their structures.',18),
  w(6,'Science','Motion and Measurement','Physics','medium',['motion','speed','distance','measurement','uniform motion'],25,'Measure distances; calculate speed; plot distance-time graphs.',18),
  w(6,'Science','Acids, Bases and Salts','Chemistry','hard',['acids','bases','salts','pH','indicators','litmus'],30,'Test common substances with indicators; understand neutralisation.',20),
  w(6,'Science','Food: Nutrients and Diseases','Biology','hard',['nutrients','deficiency diseases','scurvy','rickets','anaemia'],30,'Identify nutrients and their deficiency diseases; plan a healthy diet.',20),
  w(6,'Science','Water Cycle and Conservation','Earth Science','medium',['water cycle','evaporation','condensation','rainfall','groundwater'],25,'Draw labelled water cycle; calculate water footprints.',18),
  w(6,'Science','The Atmosphere: Layers and Gases','Earth Science','hard',['atmosphere','troposphere','stratosphere','ozone','greenhouse'],30,'Describe atmospheric layers; explain greenhouse effect and climate.',20),

  // ── HINDI GRADE 1–5 ─────────────────────────────────────────────────────────
  w(1,'Hindi','स्वर और व्यंजन पहचान','Phonics','easy',['स्वर','व्यंजन','वर्णमाला'],15,'स्वर और व्यंजन को पहचानें और लिखें।',12),
  w(1,'Hindi','मात्राएँ: आ, इ, ई','Grammar','easy',['मात्राएँ','आ की मात्रा','इ की मात्रा'],20,'आ, इ, ई की मात्राओं वाले शब्द बनाएँ और पढ़ें।',15),
  w(1,'Hindi','दो अक्षर के शब्द','Vocabulary','easy',['शब्द','छोटे शब्द','पठन'],20,'चित्रों के नाम देखकर दो अक्षर के शब्द लिखें।',15),
  w(1,'Hindi','मेरा परिवार: चित्र वर्णन','Writing','easy',['परिवार','वर्णन','वाक्य'],20,'परिवार के सदस्यों के बारे में एक-एक वाक्य लिखें।',3),
  w(2,'Hindi','सर्वनाम: मैं, तुम, वह, हम','Grammar','easy',['सर्वनाम','मैं','तुम','वह'],20,'सर्वनामों की पहचान करें और वाक्यों में प्रयोग करें।',15),
  w(2,'Hindi','क्रिया: वर्तमान काल','Grammar','medium',['क्रिया','वर्तमान काल','है','हैं'],25,'वर्तमान काल में वाक्य बनाएँ। सही क्रिया रूप चुनें।',18),
  w(3,'Hindi','विलोम शब्द (Set 1)','Vocabulary','medium',['विलोम','opposite','antonyms'],20,'50 महत्वपूर्ण विलोम शब्दों को मिलाएँ।',20),
  w(3,'Hindi','पर्यायवाची शब्द','Vocabulary','medium',['पर्यायवाची','synonyms','similar words'],20,'सामान्य शब्दों के पर्यायवाची लिखें।',15),
  w(4,'Hindi','संज्ञा के भेद','Grammar','medium',['संज्ञा','व्यक्तिवाचक','जातिवाचक','भाववाचक'],25,'संज्ञाओं के प्रकारों की पहचान करें और उदाहरण दें।',18),
  w(4,'Hindi','अनुच्छेद लेखन: मेरा विद्यालय','Writing','hard',['अनुच्छेद','लेखन','विद्यालय'],30,'मेरे विद्यालय पर एक सुंदर अनुच्छेद लिखें।',1),
  w(5,'Hindi','समास: द्वंद्व और तत्पुरुष','Grammar','hard',['समास','द्वंद्व','तत्पुरुष','compound words'],30,'समासों के प्रकार पहचानें और विग्रह करें।',18),
  w(5,'Hindi','मुहावरे और लोकोक्तियाँ','Vocabulary','hard',['मुहावरे','लोकोक्तियाँ','idioms','proverbs'],30,'20 महत्वपूर्ण मुहावरों के अर्थ और वाक्य प्रयोग।',20),
  w(5,'Hindi','पत्र लेखन: औपचारिक','Writing','hard',['पत्र','औपचारिक','formal letter','प्रारूप'],30,'औपचारिक पत्र का सही प्रारूप समझें और लिखें।',1),

  // ── SOCIAL STUDIES / EVS GRADE 1–6 ──────────────────────────────────────────
  w(1,'EVS','My Body: Parts and Care','Health','easy',['body parts','hygiene','care','senses'],15,'Identify body parts; describe how to take care of each.',10),
  w(1,'EVS','My Home and Neighbourhood','Community','easy',['home','neighbourhood','community','helpers'],15,'Describe your home; identify community helpers in your area.',10),
  w(2,'EVS','Plants: Trees, Shrubs, Herbs','Biology','easy',['plants','trees','shrubs','herbs','classification'],20,'Classify plants by type; describe uses of common plants.',12),
  w(2,'EVS','Animals: Wild, Domestic, Pet','Biology','easy',['animals','wild','domestic','pet','habitat'],20,'Classify animals by their relationship with humans.',12),
  w(3,'Social Studies','Maps and Directions','Geography','medium',['maps','compass','directions','north','south'],25,'Read simple maps; use compass directions to describe locations.',15),
  w(3,'Social Studies','Our Country India: Physical Features','Geography','medium',['India','mountains','rivers','plains','coastline'],25,'Identify major physical features of India on an outline map.',15),
  w(4,'Social Studies','States and Capitals of India','Geography','medium',['states','capitals','India','geography'],25,'Locate and name all states and their capitals on an India map.',20),
  w(4,'Social Studies','Major Rivers of India','Geography','medium',['rivers','Ganga','Yamuna','Brahmaputra','origin'],25,'Trace major rivers on a map; identify their sources and tributaries.',18),
  w(5,'Social Studies','Indian Freedom Struggle: Key Events','History','hard',['freedom struggle','1857','Gandhi','Non-cooperation','independence'],30,'Create a timeline of 10 key events in India\'s freedom struggle.',15),
  w(5,'Social Studies','The Indian Constitution','Civics','hard',['Constitution','fundamental rights','duties','Preamble'],30,'Understand the Preamble; identify 6 Fundamental Rights with examples.',15),
  w(6,'Social Studies','Ancient Civilisations: Indus Valley','History','hard',['Indus Valley','Harappa','Mohenjo-daro','ancient India'],30,'Describe the Indus Valley Civilisation; compare with modern cities.',15),
  w(6,'Social Studies','Three Organs of Government','Civics','medium',['legislature','executive','judiciary','parliament','India'],25,'Explain the roles of Parliament, Cabinet, and Supreme Court.',15),
]

export const SUBJECTS_BY_GRADE: Record<number, WorksheetSubject[]> = {
  1: ['Math','English','Hindi','EVS'],
  2: ['Math','English','Hindi','EVS'],
  3: ['Math','English','Hindi','Science','Social Studies'],
  4: ['Math','English','Hindi','Science','Social Studies'],
  5: ['Math','English','Hindi','Science','Social Studies'],
  6: ['Math','English','Hindi','Science','Social Studies','Computer'],
  7: ['Math','English','Hindi','Science','Social Studies','Computer'],
  8: ['Math','English','Hindi','Science','Social Studies','Computer'],
}

export const SUBJECT_ICONS: Record<WorksheetSubject, string> = {
  'Math': '🔢',
  'English': '📖',
  'Science': '🔬',
  'Hindi': '📝',
  'Social Studies': '🗺️',
  'EVS': '🌱',
  'Computer': '💻',
}

export const COMPLEXITY_COLORS: Record<WorksheetComplexity, { bg: string; color: string; label: string }> = {
  easy:   { bg: '#ECFDF5', color: '#059669', label: 'Easy' },
  medium: { bg: '#FFF7ED', color: '#D97706', label: 'Medium' },
  hard:   { bg: '#FEF2F2', color: '#DC2626', label: 'Hard' },
}
