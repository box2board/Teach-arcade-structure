// wwi-questions.js
// Exposes the question bank globally so your main game file can access it.
window.WWI_QUESTION_BANK = [
  { id: 1, text: "Which event sparked the beginning of World War I?", choices: [
    "Sinking of the Lusitania",
    "Assassination of Archduke Franz Ferdinand",
    "Invasion of Poland",
    "Bombing of Pearl Harbor"
  ], correctIndex: 1 },
  { id: 2, text: "What does the 'M' in MAIN causes of WWI stand for?", choices: [
    "Militarism", "Monarchies", "Marxism", "Materialism"
  ], correctIndex: 0 },
  { id: 3, text: "Which two major alliance groups fought each other in WWI?", choices: [
    "NATO and Warsaw Pact",
    "Axis and Allies",
    "Triple Entente and Central Powers",
    "League of Nations and United Nations"
  ], correctIndex: 2 },
  { id: 4, text: "Which countries were part of the Triple Entente at the start of WWI?", choices: [
    "Germany, Austria-Hungary, Italy",
    "Britain, France, Russia",
    "United States, Italy, Russia",
    "France, Germany, Ottoman Empire"
  ], correctIndex: 1 },
  { id: 5, text: "Which countries were part of the Central Powers?", choices: [
    "Britain, France, Russia",
    "Germany, Austria-Hungary, Ottoman Empire",
    "United States, Russia, Italy",
    "Spain, Portugal, Netherlands"
  ], correctIndex: 1 },
  { id: 6, text: "Nationalism is best described as:", choices: [
    "A desire for world peace",
    "Strong pride and loyalty to one’s nation or ethnic group",
    "A system of colonies",
    "A type of government"
  ], correctIndex: 1 },
  { id: 7, text: "Imperialism contributed to WWI because European countries:", choices: [
    "Shared colonies peacefully",
    "Allowed colonies to become independent",
    "Competeted fiercely for colonies and resources",
    "Gave up their colonies"
  ], correctIndex: 2 },
  { id: 8, text: "Militarism means:", choices: [
    "Reducing a nation’s army",
    "Glorifying military power and keeping large standing armies ready for war",
    "Banning all weapons",
    "Only using armies for defense"
  ], correctIndex: 1 },
  { id: 9, text: "The region of Europe known as the 'powder keg' because of tension was:", choices: [
    "Western Europe", "Eastern Europe", "The Balkans", "Scandinavia"
  ], correctIndex: 2 },
  { id: 10, text: "What was the Schlieffen Plan?", choices: [
    "Germany’s plan to avoid building a navy",
    "A Russian plan to invade Germany",
    "Germany’s plan to quickly defeat France, then fight Russia",
    "Britain’s plan to defend Belgium"
  ], correctIndex: 2 },
  { id: 11, text: "Which country did Germany invade that caused Britain to enter the war?", choices: [
    "Italy", "Belgium", "Switzerland", "Spain"
  ], correctIndex: 1 },
  { id: 12, text: "What best describes trench warfare?", choices: [
    "Fast-moving battles with tanks",
    "Naval warfare on the oceans",
    "Fighting from long, narrow ditches facing each other",
    "Air battles between pilots"
  ], correctIndex: 2 },
  { id: 13, text: "The area between opposing trenches was called:", choices: [
    "The Front Line", "No Man’s Land", "The Home Front", "The Buffer Zone"
  ], correctIndex: 1 },
  { id: 14, text: "A major problem with trench warfare was:", choices: [
    "Soldiers had too much food",
    "Battles always ended quickly",
    "High casualties and little ground gained",
    "It protected civilians from war"
  ], correctIndex: 2 },
  { id: 15, text: "Which of these was a new weapon used in WWI?", choices: [
    "Nuclear bombs", "Crossbows", "Poison gas", "Iron swords"
  ], correctIndex: 2 },
  { id: 16, text: "Which weapon made crossing No Man’s Land especially deadly?", choices: [
    "Bayonets", "Machine guns", "Zeppelins", "Shields"
  ], correctIndex: 1 },
  { id: 17, text: "Why is WWI often called the first 'modern war'?", choices: [
    "It was the first war with uniforms",
    "It used industrial technology and new weapons on a massive scale",
    "It was the shortest war in history",
    "It was fought only in cities"
  ], correctIndex: 1 },
  { id: 18, text: "Which country left WWI early because of a revolution at home?", choices: [
    "Germany", "Italy", "Russia", "France"
  ], correctIndex: 2 },
  { id: 19, text: "What was the name of the treaty that ended Russia’s involvement in WWI?", choices: [
    "Treaty of Versailles", "Treaty of Brest-Litovsk", "Treaty of Paris", "Treaty of London"
  ], correctIndex: 1 },
  { id: 20, text: "What was unrestricted submarine warfare?", choices: [
    "Submarines that only attacked warships",
    "Submarines that had no weapons",
    "Submarines that attacked any ship without warning",
    "Submarines that stayed in ports"
  ], correctIndex: 2 },
  { id: 21, text: "Which British passenger ship was sunk by a German U-boat in 1915?", choices: [
    "Titanic", "Britannic", "Lusitania", "Queen Mary"
  ], correctIndex: 2 },
  { id: 22, text: "Which country did the Zimmermann Telegram try to involve in war against the U.S.?", choices: [
    "Canada", "Mexico", "Brazil", "Cuba"
  ], correctIndex: 1 },
  { id: 23, text: "Who was the U.S. president during World War I?", choices: [
    "Theodore Roosevelt", "Woodrow Wilson", "Franklin D. Roosevelt", "Harry Truman"
  ], correctIndex: 1 },
  { id: 24, text: "Before entering the war, the United States’ official position was:", choices: [
    "Immediate war with Germany",
    "Neutrality",
    "Alliance with the Central Powers",
    "Fighting only in Asia"
  ], correctIndex: 1 },
  { id: 25, text: "The American troops sent to fight in Europe were called:", choices: [
    "Green Berets",
    "Continental Army",
    "American Expeditionary Force (AEF)",
    "Marines Corps Force"
  ], correctIndex: 2 },
  { id: 26, text: "Who led the American Expeditionary Force?", choices: [
    "General Eisenhower", "General Patton", "General Pershing", "General MacArthur"
  ], correctIndex: 2 },
  { id: 27, text: "Which side did the United States join in WWI?", choices: [
    "Central Powers", "Allies / Triple Entente", "Neutral Nations", "Triple Alliance"
  ], correctIndex: 1 },
  { id: 28, text: "What was the effect of American entry into WWI?", choices: [
    "It had no real impact",
    "It strengthened the Central Powers",
    "It boosted Allied morale and helped turn the tide",
    "It ended the war immediately"
  ], correctIndex: 2 },
  { id: 29, text: "What was the term for a cease-fire that ended the fighting in WWI?", choices: [
    "Treaty", "Armistice", "Pact", "Alliance"
  ], correctIndex: 1 },
  { id: 30, text: "On what date did the WWI armistice take effect?", choices: [
    "July 4, 1917", "November 11, 1918", "December 25, 1919", "January 1, 1918"
  ], correctIndex: 1 },
  { id: 31, text: "Which meeting created the main peace terms after WWI?", choices: [
    "Yalta Conference", "Paris Peace Conference", "Potsdam Conference", "Congress of Vienna"
  ], correctIndex: 1 },
  { id: 32, text: "Which three major Allied leaders were part of the 'Big Four'?", choices: [
    "Wilson, Lloyd George, Clemenceau (and Orlando)",
    "Hitler, Mussolini, Tojo",
    "Lenin, Stalin, Trotsky",
    "Kaiser Wilhelm, Franz Joseph, Nicholas II"
  ], correctIndex: 0 },
  { id: 33, text: "Which treaty officially ended the war between Germany and the Allies?", choices: [
    "Treaty of Ghent", "Treaty of Versailles", "Treaty of Paris (1783)", "Munich Agreement"
  ], correctIndex: 1 },
  { id: 34, text: "Which country was forced to accept 'war guilt' in the Treaty of Versailles?", choices: [
    "Britain", "France", "Russia", "Germany"
  ], correctIndex: 3 },
  { id: 35, text: "What did Germany have to pay after WWI, according to the Treaty of Versailles?", choices: [
    "Reconstruction bonds", "Reparations", "Voting rights", "Gold tariffs"
  ], correctIndex: 1 },
  { id: 36, text: "Which organization was created after WWI to help prevent future wars?", choices: [
    "United Nations", "NATO", "League of Nations", "European Union"
  ], correctIndex: 2 },
  { id: 37, text: "Why did many Germans resent the Treaty of Versailles?", choices: [
    "It rewarded them too much",
    "It forced them to fight again",
    "They felt it was unfair and humiliating",
    "It gave them more colonies"
  ], correctIndex: 2 },
  { id: 38, text: "Which empire collapsed as a result of WWI?", choices: [
    "Japanese Empire", "Ottoman Empire", "British Empire", "United States"
  ], correctIndex: 1 },
  { id: 39, text: "Which of the following was a new nation created after WWI?", choices: [
    "Spain", "Portugal", "Poland", "Sweden"
  ], correctIndex: 2 },
  { id: 40, text: "What is one major human cost of WWI?", choices: [
    "Very few soldiers died",
    "Millions of soldiers and civilians were killed or wounded",
    "Only generals were affected",
    "Only naval battles caused casualties"
  ], correctIndex: 1 },
  { id: 41, text: "What is meant by the 'Lost Generation'?", choices: [
    "Children who were evacuated",
    "Young people disillusioned by the war’s destruction",
    "Soldiers who never trained",
    "Leaders who lost elections"
  ], correctIndex: 1 },
  { id: 42, text: "How did WWI affect women in many countries?", choices: [
    "They lost all rights",
    "They stayed completely out of the war effort",
    "Many entered the workforce and took on new roles",
    "They were banned from factories"
  ], correctIndex: 2 },
  { id: 43, text: "What is 'total war'?", choices: [
    "A war fought by only soldiers",
    "A war limited to one region",
    "A war where nations devote all resources, including civilians and industry, to the war effort",
    "A war fought only at sea"
  ], correctIndex: 2 },
  { id: 44, text: "Which of the following best describes propaganda?", choices: [
    "Neutral information",
    "Biased information used to influence public opinion",
    "Scientific research",
    "Secret military codes"
  ], correctIndex: 1 },
  { id: 45, text: "Which front in WWI was known mainly for trench warfare and stalemate?", choices: [
    "Eastern Front", "Western Front", "Pacific Front", "Desert Front"
  ], correctIndex: 1 },
  { id: 46, text: "Which front was generally more mobile and less trench-based?", choices: [
    "Western Front", "Eastern Front", "Atlantic Front", "Arctic Front"
  ], correctIndex: 1 },
  { id: 47, text: "Which group of countries made up the main Central Powers?", choices: [
    "Germany, Austria-Hungary, Ottoman Empire, Bulgaria",
    "Britain, France, Russia, U.S.",
    "Spain, Portugal, Italy",
    "U.S., Italy, Japan"
  ], correctIndex: 0 },
  { id: 48, text: "WWI helped set the stage for WWII mainly because:", choices: [
    "The war made everyone peaceful",
    "The Treaty of Versailles left Germany bitter and unstable",
    "No countries had any debt after the war",
    "The League of Nations was extremely powerful"
  ], correctIndex: 1 },
  { id: 49, text: "What was one economic effect of WWI on Europe?", choices: [
    "All countries became wealthy",
    "Many nations faced huge debts and rebuilding costs",
    "Colonies gained independence immediately",
    "Trade completely stopped forever"
  ], correctIndex: 1 },
  { id: 50, text: "Which country emerged as a stronger world power after WWI?", choices: [
    "United States", "Austria-Hungary", "Ottoman Empire", "Belgium"
  ], correctIndex: 0 }
];
