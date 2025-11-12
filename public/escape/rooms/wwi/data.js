// Room-specific content (no engine logic). Assets live in /escape/rooms/wwi/assets/...
window.ROOM_DATA = {
  minutes: 40,
  title: 'Escape from the Trenches (WWI)',
  scenes: [
    { id: 's1',
      title: 'The Sarajevo Mystery',
      type: 'match',
      journalOnStart: 'HQ dossier found: Sarajevo, June 1914.',
      journalOnSolve: 'Assassination evidence compiled. Europe on edge.',
      itemOnSolve: { id:'main-files', label:'M.A.I.N. Files' }
    },

    { id: 's2',
      title: 'M.A.I.N. Files',
      type: 'order',
      journalOnStart: 'Analyzing long-term causes of war.',
      journalOnSolve: 'Sequence confirmed: Militarism → Alliances → Imperialism → Nationalism.',
      itemOnSolve: { id:'map-frag-1', label:'Map Fragment #1' },
      order: [
        { id:'M', label:'Militarism',    note:'Arms race & glorification of the military.' },
        { id:'A', label:'Alliances',     note:'Web of treaties that pulled nations in.' },
        { id:'I', label:'Imperialism',   note:'Competition for colonies and resources.' },
        { id:'N', label:'Nationalism',   note:'Pride & self-determination movements.' }
      ],
      correctIdOrder: ['M','A','I','N'],
      hint: 'Think build-up → treaties → empires → pride.'
    },

    { id: 's3', title: 'Web of Alliances', type: 'sort' },         // placeholder
    { id: 's4', title: 'War on All Fronts', type: 'map' },         // placeholder

    { id: 's5',
      title: 'Intercepted Messages',
      type: 'dual-input',
      journalOnStart: 'Decoding U.S. entry: a sinking and a telegram.',
      journalOnSolve: 'U.S. outrage grows: Lusitania (1915) & Zimmerman to Mexico.',
      itemOnSolve: { id:'us-flag', label:'U.S. Flag Pin' },
      inputs: {
        q1: { label:'Year the Lusitania was sunk', placeholder:'YYYY', accepts:['1915'] },
        q2: { label:'Country Germany courted in Zimmerman Telegram', placeholder:'Type the country', accepts:['mexico','méxico'] }
      },
      hint: 'One sank in the Atlantic; the other promised Texas, New Mexico, Arizona.'
    },

    { id: 's6', title: 'Weapons of War', type: 'multiselect' },    // placeholder

    { id: 's7',
      title: 'Hold the Line',
      type: 'decision',
      journalOnStart: 'Night watch: flooding trench, thin rations, gas alarm.',
      journalOnSolve: 'Unit survived the night. Radio access possible.'
    },

    { id: 's8', title: 'Armistice Transmission', type: 'final' }   // placeholder
  ]
};
