(function () {
const YEAR_MIN = 1885;
const YEAR_MAX = 1947;
const YEAR_RANGE = YEAR_MAX - YEAR_MIN;
const INC = [
  {y:1885,city:"Bombay",lat:18.9,lng:72.8,president:"Womesh Chandra Bonnerjee",phase:"moderate",
   ev:["Founded by A.O. Hume","72 delegates","Gokuldas Tejpal College","ICS reform demand"],
   desc:"Founding session at Gokuldas Tejpal Sanskrit College. 72 delegates from across India. Demanded civil-service reform and representative councils. A.O. Hume, retired ICS officer, was the prime organiser."},
  {y:1886,city:"Calcutta",lat:22.5,lng:88.3,president:"Dadabhai Naoroji",phase:"moderate",
   ev:["Drain Theory presented","434 delegates","ICS reform demand"],
   desc:"Naoroji's 'Drain Theory' of British wealth extraction formally presented to 434 delegates. Demanded competitive ICS exams be held simultaneously in India and England."},
  {y:1887,city:"Madras",lat:13.1,lng:80.3,president:"Badruddin Tyabji",phase:"moderate",
   ev:["First Muslim president","Hindu-Muslim unity","ICS exam reform"],
   desc:"Badruddin Tyabji became the first Muslim president of Congress. Urged Hindu-Muslim unity as the bedrock of the national movement. Demanded simultaneous ICS examinations."},
  {y:1888,city:"Allahabad",lat:25.4,lng:81.8,president:"George Yule",phase:"moderate",
   ev:["First European president","1248 delegates - record","Legislative reform"],
   desc:"George Yule became the first European president. 1248 delegates - the largest yet. Demanded expansion of Legislative Councils and reduction of military expenditure."},
  {y:1889,city:"Bombay",lat:18.9,lng:72.8,president:"William Wedderburn",phase:"moderate",
   ev:["Elected councils demanded","Judicial separation","British presidency"],
   desc:"Demanded elected councils with Indian majority. Called for separation of judicial and executive functions. Social-reform debate expanded."},
  {y:1890,city:"Calcutta",lat:22.5,lng:88.3,president:"Pherozeshah Mehta",phase:"moderate",
   ev:["Salt tax reduction","Arms Act repeal","Tilak joins debates"],
   desc:"Pressed for reduction of salt tax and repeal of Arms Act. Bal Gangadhar Tilak attended, emerging as a voice for assertive nationalism. Moderate-Extremist fault lines appeared."},
  {y:1891,city:"Nagpur",lat:21.1,lng:79.1,president:"Ananda Charlu",phase:"moderate",
   ev:["Age of Consent Act debate","Women's education","Moderate vs Extremist"],
   desc:"Debated Age of Consent Act raising marriageable age. Tilak opposed it as interference in Hindu custom, widening the moderate-extremist rift. Women's education prominently discussed."},
  {y:1892,city:"Allahabad",lat:25.4,lng:81.8,president:"Womesh Chandra Bonnerjee",phase:"moderate",
   ev:["Indian Councils Act 1892","Elected element demand","Bonnerjee's 2nd term"],
   desc:"Welcomed Indian Councils Act 1892 but demanded elected majority and genuine representation. Criticised high military spending. Bonnerjee's second presidency."},
  {y:1893,city:"Lahore",lat:31.5,lng:74.3,president:"Dadabhai Naoroji",phase:"moderate",
   ev:["Simultaneous ICS exams","Poverty data presented","Hindu-Muslim unity"],
   desc:"Called for Simultaneous Civil Service Examinations in India and England. Presented data on India's poverty caused by British economic policies."},
  {y:1894,city:"Madras",lat:13.1,lng:80.3,president:"Alfred Webb",phase:"moderate",
   ev:["Irish MP as president","Local self-government","Press freedom"],
   desc:"Alfred Webb, Irish MP, symbolised international sympathy for Indian self-rule. Demanded extension of local self-government and press freedom."},
  {y:1895,city:"Poona",lat:18.5,lng:73.8,president:"Surendranath Banerjea",phase:"moderate",
   ev:["Tilak's nationalism rises","Moderate vs Extremist","Famine relief debated"],
   desc:"Tilak began asserting more aggressive nationalistic views. Discussed famines and land revenue policy. Growing chorus for swaraj as a long-term goal."},
  {y:1896,city:"Calcutta",lat:22.5,lng:88.3,president:"Rahimtulla Sayani",phase:"moderate",
   ev:["Vande Mataram first sung","1896 famine crisis","Plague epidemic response"],
   desc:"Historic session: Vande Mataram was sung for the very first time by Rabindranath Tagore - it became the battle cry of the freedom movement. Condemned plague-era repressive policies."},
  {y:1897,city:"Amraoti",lat:20.9,lng:77.7,president:"C. Sankaran Nair",phase:"moderate",
   ev:["Famine relief crisis","Tilak prosecuted for sedition","Shivaji festival controversy"],
   desc:"Held amid famine relief crisis. Tilak prosecuted for sedition (Kesari articles) - Congress condemned the prosecution. British repressive measures sharply criticised."},
  {y:1898,city:"Madras",lat:13.1,lng:80.3,president:"Ananda Mohan Bose",phase:"moderate",
   ev:["Currency reform demand","Vernacular education","Trade policy critique"],
   desc:"Called for reform of Indian currency and trade policy. Expansion of vernacular education demanded. Criticism of deindustrialisation sharpened."},
  {y:1899,city:"Lucknow",lat:26.8,lng:80.9,president:"Romesh Chunder Dutt",phase:"moderate",
   ev:["Deindustrialisation data","Peasant tax burden","Economic history critique"],
   desc:"Dutt presented data on deindustrialisation of Indian handicrafts. Demanded relief for over-taxed peasants."},
  {y:1900,city:"Lahore",lat:31.5,lng:74.3,president:"N.G. Chandavarkar",phase:"moderate",
   ev:["Military commissions for Indians","Abolish indentured labour","Moderate vs Extremist tensions"],
   desc:"Demanded opening of military commissions to Indians and abolition of indentured labour. Moderate vs Extremist tensions intensifying within Congress."},
  {y:1901,city:"Calcutta",lat:22.5,lng:88.3,president:"Dinshaw Wacha",phase:"moderate",
   ev:["Gokhale's maiden address","Peasant tax critique","Congress finances"],
   desc:"Gokhale's maiden presidential address. Criticised rising tax burden on peasants and demanded economic reforms."},
  {y:1902,city:"Ahmedabad",lat:23.0,lng:72.6,president:"Surendranath Banerjea",phase:"moderate",
   ev:["Curzon's university reforms","Economic grievances","Second Banerjea presidency"],
   desc:"Discussed Curzon administration's university reforms and economic grievances. Reaffirmed the moderate constitutional approach."},
  {y:1903,city:"Madras",lat:13.1,lng:80.3,president:"Lalmohan Ghosh",phase:"moderate",
   ev:["Rupee duties protested","Protectionism rising","Industrial decline"],
   desc:"Called for reduction of rupee duties on British cotton goods. Highlighted continuing decline of Indian artisan industries."},
  {y:1904,city:"Bombay",lat:18.9,lng:72.8,president:"Henry Cotton",phase:"moderate",
   ev:["Bengal partition proposed","Moderate Congress peaks","British ICS ally"],
   desc:"Debated Curzon's proposed partition of Bengal with alarm. Growing anxiety about imperial policy."},
  {y:1905,city:"Banaras",lat:25.3,lng:83.0,president:"Gopal Krishna Gokhale",phase:"moderate",
   ev:["Partition of Bengal announced","Swadeshi resolution passed","Tilak demands Swaraj now"],
   desc:"Partition of Bengal announced - Congress passed Swadeshi resolution. Gokhale urged constitutional agitation; Tilak demanded immediate Swaraj. Swadeshi movement formally launched."},
  {y:1906,city:"Calcutta",lat:22.5,lng:88.3,president:"Dadabhai Naoroji",phase:"assertive",
   ev:["'Swaraj' declared as INC goal","Muslim League founded same year","Calcutta Four adopted"],
   desc:"Landmark session: Naoroji declared 'Swaraj' (self-governance) as Congress goal. Adopted Swadeshi, Boycott, National Education and Swaraj as the 'Calcutta Four'. Muslim League founded the same year."},
  {y:1907,city:"Surat",lat:21.2,lng:72.8,president:"Rash Behari Ghosh",phase:"assertive",
   ev:["The Surat Split","Tilak faction expelled","Congress divided"],
   desc:"The notorious Surat Split. Extremists led by Tilak clashed violently with Moderates. Congress formally split - Tilak and the Extremists were expelled."},
  {y:1908,city:"Madras",lat:13.1,lng:80.3,president:"Rash Behari Ghosh",phase:"moderate",
   ev:["Tilak sentenced 6 years","Moderates hold Congress alone","Sedition Act crackdown"],
   desc:"Moderates held Congress alone. Condemned Tilak's 6-year sentence for sedition as political persecution."},
  {y:1909,city:"Lahore",lat:31.5,lng:74.3,president:"Madan Mohan Malaviya",phase:"moderate",
   ev:["Morley-Minto Reforms debated","Separate electorates opposed","Constitutional demands"],
   desc:"Debated Morley-Minto Reforms. Opposed separate electorates for Muslims as divisive. Demanded reforms in letter and spirit."},
  {y:1910,city:"Allahabad",lat:25.4,lng:81.8,president:"William Wedderburn",phase:"moderate",
   ev:["Morley-Minto implementation","Elected majority demand","Moderate unity"],
   desc:"Pressed for genuine implementation of Morley-Minto Reforms. Demanded elected majority in expanded legislative councils."},
  {y:1911,city:"Calcutta",lat:22.5,lng:88.3,president:"Bishan Narayan Dar",phase:"moderate",
   ev:["Bengal Partition annulled","'Jana Gana Mana' first sung","Delhi Durbar year"],
   desc:"Delhi Durbar year: annulment of Bengal Partition - a major Congress victory. 'Jana Gana Mana' sung publicly for the first time at this session. Capital shifted to Delhi."},
  {y:1912,city:"Bankipore",lat:25.6,lng:85.1,president:"R.N. Mudholkar",phase:"moderate",
   ev:["Home Rule aspirations","Bengal partition reversed","Delhi capital shift"],
   desc:"Focused on Home Rule aspirations. Welcomed reversal of Bengal partition and shift of capital to Delhi."},
  {y:1913,city:"Karachi",lat:24.9,lng:67.0,president:"Nawab Syed Muhammad Bahadur",phase:"moderate",
   ev:["Indian governance demand","South Africa Indians","Symbolic border session"],
   desc:"Demanded greater Indian participation in governance. Addressed plight of Indian labour in South Africa."},
  {y:1914,city:"Madras",lat:13.1,lng:80.3,president:"Bhupendra Nath Bose",phase:"moderate",
   ev:["WWI outbreak","Conditional loyalty offered","Post-war reforms expected"],
   desc:"WWI broke out mid-session. Congress offered conditional loyalty in hopes of post-war constitutional reforms."},
  {y:1915,city:"Bombay",lat:18.9,lng:72.8,president:"S.P. Sinha",phase:"moderate",
   ev:["Gandhi returns from South Africa","Home Rule Leagues founded","Tilak released from prison"],
   desc:"Gandhi returned from South Africa. Annie Besant founded the Home Rule League. Tilak was released from Burma imprisonment. Stage set for mass politics."},
  {y:1916,city:"Lucknow",lat:26.8,lng:80.9,president:"Ambika Charan Majumdar",phase:"assertive",
   ev:["Lucknow Pact - Congress-League unity","Tilak rejoins Congress","Dominion Status demanded"],
   desc:"Historic Lucknow Pact: Congress-Muslim League unity agreement. Tilak and Congress reconciled - Extremists rejoined. Demand for dominion status. Home Rule Leagues at peak."},
  {y:1917,city:"Calcutta",lat:22.5,lng:88.3,president:"Annie Besant",phase:"assertive",
   ev:["First woman president of INC","Montagu Declaration","Besant interned and released"],
   desc:"First woman president of Congress. Besant had been interned by the British for Home Rule activities and was released shortly before the session. Congress demanded immediate self-government."},
  {y:1918,city:"Bombay",lat:18.9,lng:72.8,president:"Syed Hasan Imam",phase:"assertive",
   ev:["Montagu-Chelmsford Reforms debated","Moderates exit Congress","WWI loyalty question"],
   desc:"Special session to debate Montagu-Chelmsford Reforms. Congress split on acceptance - deemed inadequate by Tilak faction. Moderate wing walked out to form the National Liberal Federation."},
  {y:1919,city:"Amritsar",lat:31.6,lng:74.9,president:"Motilal Nehru",phase:"assertive",
   ev:["Jallianwala Bagh massacre condemned","Non-Cooperation Motion adopted","Rowlatt Act denounced","Khilafat issue raised"],
   desc:"Held months after Jallianwala Bagh massacre (April 13, 1919). Gandhi's Non-Cooperation Motion adopted. Rowlatt Act denounced. Khilafat issue raised. Gandhi emerged as undisputed national leader."},
  {y:1920,city:"Nagpur",lat:21.1,lng:79.1,president:"C. Vijayaraghavachariar",phase:"gandhi",
   ev:["Non-Cooperation Programme adopted","Congress reorganised on linguistic lines","Mass membership model","Constitution rewritten"],
   desc:"Most transformative Congress session. Gandhi's Non-Cooperation Programme formally adopted. Congress reorganised on linguistic lines with mass membership - transformed from elite club to mass movement."},
  {y:1921,city:"Ahmedabad",lat:23.0,lng:72.6,president:"Hakim Ajmal Khan",phase:"gandhi",
   ev:["Non-Cooperation at peak","Khilafat alliance","Gandhi given sole authority","Charkha as symbol"],
   desc:"Non-Cooperation Movement at peak. Gandhi given sole executive authority. Charkha adopted as nationalist symbol. Khilafat-Congress Hindu-Muslim unity at its height."},
  {y:1922,city:"Gaya",lat:24.8,lng:85.0,president:"C.R. Das",phase:"gandhi",
   ev:["Chauri Chaura aftermath","NCM suspended by Gandhi","Swaraj Party formed","Council entry debate"],
   desc:"Aftermath of Chauri Chaura violence - Gandhi suspended Non-Cooperation. Council Entry debate: Das and Motilal Nehru formed Swaraj Party to contest elections from within the system."},
  {y:1923,city:"Kakinada",lat:16.9,lng:82.2,president:"Maulana Muhammad Ali",phase:"gandhi",
   ev:["Dominion status demand","Swaraj Party elections","Congress-Khilafat fraying"],
   desc:"Demanded immediate grant of dominion status. Swaraj Party contested elections and performed well; Congress-Khilafat alliance was fraying."},
  {y:1924,city:"Belgaum",lat:15.9,lng:74.5,president:"Mahatma Gandhi",phase:"gandhi",
   ev:["Gandhi's only presidency","Hindu-Muslim unity emphasis","Khadi and constructive work","Withdrew from elections"],
   desc:"Only time Gandhi presided over Congress. Stressed communal harmony, khadi, Hindu-Muslim unity and constructive village work rather than direct agitation."},
  {y:1925,city:"Kanpur",lat:26.4,lng:80.3,president:"Sarojini Naidu",phase:"gandhi",
   ev:["First Indian woman president","Nightingale of India","Hindu-Muslim riots response","Boycott reaffirmed"],
   desc:"Sarojini Naidu became the first Indian woman (and second woman overall) to preside - a landmark for women in Indian politics. Called for communal peace."},
  {y:1926,city:"Gauhati",lat:26.2,lng:91.7,president:"S. Srinivasa Iyengar",phase:"gandhi",
   ev:["Northeast India session","Independence talk growing","Nehru rising as leader","Communal riots aftermath"],
   desc:"Significant session for bringing Congress to the Northeast. Renewed call for complete independence. Jawaharlal Nehru rising as a leading voice."},
  {y:1927,city:"Madras",lat:13.1,lng:80.3,president:"M.A. Ansari",phase:"gandhi",
   ev:["'Purna Swaraj' moved first time","Simon Commission boycott","Nehru's influence peaks"],
   desc:"Nehru moved historic resolution for 'Complete Independence' (Purna Swaraj) - passed for the first time. Simon Commission announced with no Indian members; boycott declared."},
  {y:1928,city:"Calcutta",lat:22.5,lng:88.3,president:"Motilal Nehru",phase:"gandhi",
   ev:["Nehru Report - Indian constitution draft","Simon Commission boycott","Bose & Nehru push full independence","Dominion vs Independence split"],
   desc:"Nehru Report presented as an all-Indian constitutional draft. Subhas Bose and Jawaharlal Nehru pressed for complete independence against Motilal's dominion status - a generational split."},
  {y:1929,city:"Lahore",lat:31.5,lng:74.3,president:"Jawaharlal Nehru",phase:"gandhi",
   ev:["Purna Swaraj resolution passed","Tricolour unfurled Dec 31","26 Jan declared Independence Day","Salt Satyagraha to follow"],
   desc:"Most celebrated Congress session. Jawaharlal Nehru elected president. Historic Purna Swaraj (Complete Independence) resolution passed on 31 December. Tricolour unfurled at midnight. 26 January 1930 declared Independence Day."},
  {y:1930,city:"Allahabad",lat:25.4,lng:81.8,president:"Jawaharlal Nehru",phase:"cdo",
   ev:["Salt March - 12 March","Gandhi arrested","RTC boycotted","Civil Disobedience begins"],
   desc:"Salt March began 12 March from Sabarmati. Gandhi arrested after Dandi. Congress boycotted Round Table Conference. Civil Disobedience Movement spread across India."},
  {y:1931,city:"Karachi",lat:24.9,lng:67.0,president:"Vallabhbhai Patel",phase:"cdo",
   ev:["Gandhi-Irwin Pact ratified","Fundamental Rights resolution","Bhagat Singh hanged March 23","India's first charter of rights"],
   desc:"Gandhi-Irwin Pact ratified. Historic Karachi Resolution on Fundamental Rights and Economic Policy - cornerstone of independent India's framework. Bhagat Singh's execution on 23 March cast a shadow."},
  {y:1932,city:"Delhi",lat:28.6,lng:77.2,president:"Madan Mohan Malaviya",phase:"cdo",
   ev:["Gandhi arrested","Communal Award protested","Poona Pact signed","Civil Disobedience resumed"],
   desc:"Gandhi arrested. Poona Pact signed after Communal Award: Gandhi's fast against separate Dalit electorates forced a compromise. Civil Disobedience resumed after Round Table Conference failure."},
  {y:1933,city:"Calcutta",lat:22.5,lng:88.3,president:"Nellie Sengupta",phase:"cdo",
   ev:["Second woman president","Civil Disobedience winding down","Anti-untouchability campaign","Gandhi's constructive programme"],
   desc:"Nellie Sengupta became the second woman to preside. Gandhi suspended Civil Disobedience for 'constructive programme'. Anti-untouchability campaign foregrounded."},
  {y:1934,city:"Bombay",lat:18.9,lng:72.8,president:"Rajendra Prasad",phase:"cdo",
   ev:["Civil Disobedience suspended","Congress Socialist Party formed","1934 elections contested","Nehru-Gandhi debates"],
   desc:"Congress decided to contest 1934 elections. Civil Disobedience formally suspended. Congress Socialist Party formed by Jayaprakash Narayan. Bose pushed for radical economic agenda."},
  {y:1936,city:"Lucknow",lat:26.8,lng:80.9,president:"Jawaharlal Nehru",phase:"independence",
   ev:["Socialist program adopted","Mass contact program","1937 elections campaign","Provincial autonomy"],
   desc:"Nehru's socialist-leaning presidential address. Mass contact programme launched ahead of 1937 provincial elections. Congress debated participation under 1935 Act."},
  {y:1937,city:"Faizpur",lat:21.2,lng:75.6,president:"Jawaharlal Nehru",phase:"independence",
   ev:["First ever village session","Agrarian reform agenda","Peasant mobilization","Congress wins 7 provinces"],
   desc:"Historic first session held in a village (Faizpur, Maharashtra). Symbolised Congress reaching rural India. 1937 elections swept by Congress - governments in 7 provinces."},
  {y:1938,city:"Haripura",lat:21.2,lng:72.8,president:"Subhas Chandra Bose",phase:"independence",
   ev:["National Planning Committee constituted","Bose's industrialisation vision","Gandhi vs Bose ideology","Largest-ever session"],
   desc:"National Planning Committee constituted under Nehru - forerunner of India's planning commission. Bose's presidential address called for two-year ultimatum to British."},
  {y:1939,city:"Tripuri",lat:23.9,lng:79.5,president:"Subhas Chandra Bose",phase:"independence",
   ev:["Bose re-elected over Gandhi's candidate","Pant Resolution limits Bose","Bose resigns forms Forward Bloc","WWII - Congress vs British"],
   desc:"Bose controversially defeated Gandhi's candidate. Gandhi called it his personal defeat. Bose resigned after Pant Resolution; formed Forward Bloc. Congress refused to support WWII without independence."},
  {y:1940,city:"Ramgarh",lat:23.6,lng:85.5,president:"Maulana Abul Kalam Azad",phase:"independence",
   ev:["Azad's longest presidency 1940-46","Individual Satyagraha launched","August Offer rejected","WWII - India's freedom first"],
   desc:"Azad became president - served till 1946, longest single-person tenure. Individual Satyagraha launched against forced WWII involvement. Linlithgow's August Offer rejected."},
  {y:1941,city:"(No session - WWII)",lat:20.0,lng:77.0,president:"Maulana Abul Kalam Azad",phase:"independence",
   ev:["No formal session","Leaders in prison","Underground coordination","WWII restrictions"],
   desc:"No formal all-India session due to wartime restrictions. Congress leaders coordinated from prison or underground."},
  {y:1942,city:"Wardha / Bombay",lat:20.7,lng:78.6,president:"Maulana Abul Kalam Azad",phase:"independence",
   ev:["Quit India Resolution - Aug 8","'Do or Die' speech by Gandhi","All leaders arrested Aug 9","Underground resistance spreads"],
   desc:"Most dramatic session. Quit India Resolution passed 8 August at Gowalia Tank, Bombay. Gandhi's immortal 'Do or Die' call. All Congress leadership arrested within hours. Underground resistance spread across India."},
  {y:1945,city:"Bombay",lat:18.9,lng:72.8,president:"Maulana Abul Kalam Azad",phase:"independence",
   ev:["Leaders released from prison","Simla Conference collapses","INA trials - Congress defends","Transfer of power begins"],
   desc:"Congress leaders released from prison. Simla Conference with Viceroy Wavell collapsed. Congress defended INA soldiers on trial. Transfer of power negotiations began in earnest."},
  {y:1946,city:"Meerut",lat:28.9,lng:77.7,president:"J.B. Kripalani",phase:"independence",
   ev:["Cabinet Mission Plan debated","Nehru leads Interim Government","INA trials condemned","Last pre-independence session"],
   desc:"Nehru elected to lead Interim Government. Cabinet Mission Plan discussed as partition loomed. INA trials condemned. Final push towards independence negotiations."},
  {y:1947,city:"Delhi",lat:28.6,lng:77.2,president:"J.B. Kripalani",phase:"independence",
   ev:["Independence - 15 August","Partition Plan accepted","Congress becomes governing party","62 years of struggle ends"],
   desc:"Partition Plan accepted with grief. Independence achieved 15 August 1947. Tricolour raised over Red Fort. Congress transformed from freedom movement into governing party of independent India."},
];
const KEY_EVENTS=[
  {y:1885,t:"INC founded in Bombay - W.C. Bonnerjee chairs first session of 72 delegates"},
  {y:1886,t:"Dadabhai Naoroji articulates 'Drain Theory' at Calcutta session (434 delegates)"},
  {y:1887,t:"Badruddin Tyabji - first Muslim president; urges Hindu-Muslim unity"},
  {y:1890,t:"Tilak joins Congress debates; moderate-radical fault lines appear"},
  {y:1896,t:"Vande Mataram sung for first time by Rabindranath Tagore - Calcutta session"},
  {y:1905,t:"Swadeshi Resolution passed at Banaras after Partition of Bengal announced"},
  {y:1906,t:"Calcutta session: Naoroji declares 'Swaraj' as Congress goal - historic shift"},
  {y:1907,t:"Surat Split - Extremists (Tilak) and Moderates formally divide Congress"},
  {y:1911,t:"Bengal Partition annulled; 'Jana Gana Mana' first sung at Calcutta session"},
  {y:1915,t:"Gandhi returns from South Africa; Home Rule Leagues founded by Besant & Tilak"},
  {y:1916,t:"Lucknow Pact: Congress-League unity; Tilak rejoins; Dominion Status demanded"},
  {y:1917,t:"Annie Besant - first woman Congress president; interned then released by British"},
  {y:1919,t:"Amritsar: Jallianwala Bagh condemned; Gandhi's Non-Cooperation adopted"},
  {y:1920,t:"Nagpur: Non-Cooperation Programme; Congress reorganised as mass movement"},
  {y:1921,t:"Non-Cooperation at peak; Gandhi given sole executive authority; Khilafat alliance"},
  {y:1922,t:"Chauri Chaura: Gandhi suspends NCM; Swaraj Party formed by Das & Nehru"},
  {y:1924,t:"Gandhi presides at Belgaum - only time he holds the Congress presidency"},
  {y:1925,t:"Sarojini Naidu - first Indian woman president of Congress at Kanpur"},
  {y:1927,t:"Madras: 'Purna Swaraj' moved first time; Simon Commission boycott declared"},
  {y:1928,t:"Nehru Report - Indian constitutional draft; Subhas & Nehru push full independence"},
  {y:1929,t:"Lahore: Purna Swaraj resolution - 26 Jan 1930 declared Independence Day"},
  {y:1930,t:"Salt March 12 March; Civil Disobedience Movement; Gandhi arrested"},
  {y:1931,t:"Karachi: Fundamental Rights resolution; Gandhi-Irwin Pact; Bhagat Singh mourned"},
  {y:1934,t:"Civil Disobedience suspended; Congress Socialist Party formed"},
  {y:1937,t:"Faizpur first village session; Congress wins 1937 elections, forms 7 provincial govts"},
  {y:1938,t:"Haripura: Bose president; National Planning Committee formed under Nehru"},
  {y:1939,t:"Tripuri: Bose vs. Gandhi faction; Bose resigns; forms Forward Bloc"},
  {y:1940,t:"Ramgarh: Azad president (till 1946); Individual Satyagraha; August Offer rejected"},
  {y:1942,t:"Quit India Resolution - 'Do or Die' - entire Congress leadership arrested overnight"},
  {y:1945,t:"Leaders released; Simla Conference fails; INA trials; independence negotiations begin"},
  {y:1946,t:"Nehru leads Interim Government; Cabinet Mission Plan debated"},
  {y:1947,t:"Independence: 15 August - India free after 62 years of Congress struggle"},
];
const PHASES={
  moderate:{color:"#1a5276",label:"Moderate Phase"},
  assertive:{color:"#117a65",label:"Assertive Nationalism"},
  gandhi:{color:"#b7950b",label:"Gandhian Era"},
  cdo:{color:"#a93226",label:"Civil Disobedience"},
  independence:{color:"#6c3483",label:"Final Push"},
};
const JUMPS=[
  {label:"Founding 1885",y:1885},{label:"Vande Mataram",y:1896},
  {label:"Surat Split",y:1907},{label:"Lucknow Pact",y:1916},
  {label:"Non-Cooperation",y:1920},{label:"Purna Swaraj",y:1929},
  {label:"Salt March",y:1930},{label:"Quit India",y:1942},
  {label:"Independence",y:1947},
];
const ERA_MARKS=[
  {y:1885,l:"1885"},{y:1900,l:"1900"},{y:1910,l:"1910"},
  {y:1920,l:"1920"},{y:1930,l:"1930"},{y:1940,l:"1940"},
  {y:1947,l:"1947"},
];
const ERA_COLORS=[
  {s:1885,e:1906,c:"#1a5276"},{s:1906,e:1920,c:"#117a65"},
  {s:1920,e:1930,c:"#b7950b"},{s:1930,e:1942,c:"#a93226"},
  {s:1942,e:1947,c:"#6c3483"},
];
const STATE_MAP={"Andaman and Nicobar":"AN","Andhra Pradesh":"AP","Arunachal Pradesh":"AR","Assam":"AS","Bihar":"BR","Chandigarh":"CH","Chhattisgarh":"CG","Dadra and Nagar Haveli":"DN","Daman and Diu":"DD","Delhi":"DL","NCT of Delhi":"DL","Goa":"GA","Gujarat":"GJ","Haryana":"HR","Himachal Pradesh":"HP","Jammu and Kashmir":"JK","Jammu & Kashmir":"JK","Jharkhand":"JH","Karnataka":"KA","Kerala":"KL","Lakshadweep":"LD","Madhya Pradesh":"MP","Maharashtra":"MH","Manipur":"MN","Meghalaya":"ML","Mizoram":"MZ","Nagaland":"NL","Odisha":"OD","Puducherry":"PY","Punjab":"PB","Rajasthan":"RJ","Sikkim":"SK","Tamil Nadu":"TN","Tripura":"TR","Uttar Pradesh":"UP","Uttarakhand":"UK","West Bengal":"WB","Union Territory of Jammu and Kashmir":"JK","Union Territory of Ladakh":"LA","Ladakh":"LA","Telangana":"TG","Andaman & Nicobar":"AN","Dadar Nagar& Haveli":"DN","Daman & Diu":"DD","Orissa":"OD"};
const CITY_STATE={"Bombay":"MH","Calcutta":"WB","Madras":"TN","Allahabad":"UP","Lahore":"PB","Nagpur":"MH","Amraoti":"MH","Lucknow":"UP","Ahmedabad":"GJ","Poona":"MH","Amritsar":"PB","Banaras":"UP","Gaya":"BR","Kakinada":"AP","Belgaum":"KA","Kanpur":"UP","Gauhati":"AS","Bankipore":"BR","Karachi":"(Pak)","Faizpur":"MH","Haripura":"GJ","Tripuri":"MP","Ramgarh":"JH","Meerut":"UP","Delhi":"DL","Wardha / Bombay":"MH","Surat":"GJ","(No session - WWII)":""};
const CITY_COORDS={"Bombay":[72.83,18.96],"Calcutta":[88.36,22.56],"Madras":[80.28,13.08],"Allahabad":[81.85,25.44],"Lahore":[74.34,31.52],"Nagpur":[79.09,21.15],"Amraoti":[77.75,20.93],"Lucknow":[80.95,26.85],"Ahmedabad":[72.59,23.02],"Poona":[73.86,18.52],"Amritsar":[74.87,31.63],"Banaras":[83.01,25.32],"Gaya":[85.00,24.80],"Kakinada":[82.24,16.93],"Belgaum":[74.50,15.87],"Kanpur":[80.35,26.47],"Gauhati":[91.74,26.19],"Bankipore":[85.13,25.61],"Karachi":[67.01,24.86],"Faizpur":[75.62,21.17],"Haripura":[72.83,21.18],"Tripuri":[79.55,23.88],"Ramgarh":[85.52,23.64],"Meerut":[77.71,28.98],"Delhi":[77.21,28.64],"Wardha / Bombay":[78.60,20.75],"Surat":[72.83,21.17]};
const SOURCES = [
  'Indian National Congress records and session resolutions',
  'Encyclopaedia Britannica and standard Indian freedom movement references',
  'Bipan Chandra et al., India\'s Struggle for Independence',
  'NCERT history texts for the late colonial period',
];
const SESSION_YEARS = INC.map((session) => session.y);
const IMPORTANT_YEARS = new Set(KEY_EVENTS.map((event) => event.y));
function clampYear(year) {
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, Number(year) || YEAR_MIN));
}
function getSession(year) {
  const numericYear = clampYear(year);
  return INC.find((session) => session.y === numericYear) || null;
}
function getNearestSession(year) {
  const numericYear = clampYear(year);
  let nearest = INC[0];
  for (const session of INC) {
    if (Math.abs(session.y - numericYear) < Math.abs(nearest.y - numericYear)) {
      nearest = session;
    }
  }
  return nearest;
}
function getSessionsUpTo(year) {
  const numericYear = clampYear(year);
  return INC.filter((session) => session.y <= numericYear);
}
function getPhaseKey(year) {
  const numericYear = clampYear(year);
  if (numericYear < 1906) return 'moderate';
  if (numericYear < 1920) return 'assertive';
  if (numericYear < 1930) return 'gandhi';
  if (numericYear < 1942) return 'cdo';
  return 'independence';
}
function getPhaseLabel(year) {
  const key = getPhaseKey(year);
  return PHASES[key]?.label || key;
}
function getPhaseColor(year) {
  const key = getPhaseKey(year);
  return PHASES[key]?.color || '#1a5276';
}
function getEventForYear(year) {
  const numericYear = clampYear(year);
  let event = KEY_EVENTS[0];
  for (const item of KEY_EVENTS) {
    if (item.y <= numericYear) event = item;
  }
  return event?.t || '';
}
function hexToRgba(hex, alpha) {
  const clean = String(hex || '').trim().replace('#', '');
  if (clean.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
function shuffleInPlace(values, random = Math.random) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}
function formatSessionSummary(session) {
  if (!session) return '';
  const phase = PHASES[session.phase]?.label || session.phase;
  const events = session.ev?.length ? session.ev.join('; ') : 'No recorded event tags';
  return `${session.y} ${session.city} | President: ${session.president} | Phase: ${phase}\nHighlights: ${events}\n${session.desc}`;
}
function buildShareText(session) {
  if (!session) return '';
  return [
    `INC ${session.y} - ${session.city}`,
    `President: ${session.president}`,
    `Phase: ${PHASES[session.phase]?.label || session.phase}`,
    session.ev?.length ? `Highlights: ${session.ev.join('; ')}` : 'Highlights: none recorded',
    session.desc,
  ].join('\n');
}

window.CongressData = Object.freeze({ YEAR_MIN, YEAR_MAX, YEAR_RANGE, INC, PHASES, JUMPS, ERA_MARKS, ERA_COLORS, STATE_MAP, CITY_STATE, CITY_COORDS, KEY_EVENTS, SOURCES, SESSION_YEARS, IMPORTANT_YEARS, clampYear, getSession, getNearestSession, getSessionsUpTo, getPhaseKey, getPhaseLabel, getPhaseColor, getEventForYear, hexToRgba, shuffleInPlace, formatSessionSummary, buildShareText });
})();

