// Room-specific content (no engine logic). Assets live in /escape/rooms/wwi/assets/...
window.ROOM_DATA = {
  minutes: 40,
  title: 'Escape from the Trenches (WWI)',
  scenes: [
    {
      id: 'intro',
      title: 'Mission Briefing',
      type: 'intro'
      // no journalOnStart or itemOnSolve for intro
    },

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

    { id: 's3',
      title: 'Frontline Intel',
      type: 'sort',
      prompt: 'Assign each event to the Western or Eastern Front.',
      items: [
        {
          id: 'trench-france',
          label: 'Deep trench lines across France and Belgium',
          front: 'west'
        },
        {
          id: 'somme',
          label: 'Battle of the Somme with huge casualties and little gain',
          front: 'west'
        },
        {
          id: 'verdun',
          label: 'Long, grinding battle at Verdun',
          front: 'west'
        },
        {
          id: 'tannenberg',
          label: 'Germany crushes a Russian army at Tannenberg',
          front: 'east'
        },
        {
          id: 'retreat',
          label: 'Russian army retreats because of shortages and poor supplies',
          front: 'east'
        },
        {
          id: 'revolution',
          label: 'Russia leaves the war after the 1917 Revolution',
          front: 'east'
        }
      ]
    },

    { id: 's4',
      title: 'War on All Fronts',
      type: 'map',
      hotspots: [
        { id: 'west-front', x: 35, y: 40 },
        { id: 'east-front', x: 65, y: 35 },
        { id: 'south-front', x: 50, y: 70 }
      ],
      correct: 'west-front'
    },

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

    { id: 's6',
      title: 'Weapons of War',
      type: 'multiselect',
      options: [
        { id:'tanks',        label:'Tanks' },
        { id:'poison-gas',   label:'Poison gas' },
        { id:'u-boats',      label:'U-boats (submarines)' },
        { id:'airplanes',    label:'Airplanes used in combat' },
        { id:'machine-guns', label:'Rapid-fire machine guns' },
        { id:'nuclear',      label:'Nuclear bombs' },
        { id:'radar',        label:'Radar tracking' }
      ],
      correct: ['tanks','poison-gas','u-boats','airplanes','machine-guns']
    },

    { id: 's7',
      title: 'Hold the Line',
      type: 'decision',
      journalOnStart: 'Night watch: flooding trench, thin rations, gas alarm.',
      journalOnSolve: 'Unit survived the night. Radio access possible.'
    },

    { id: 's8',
      title: 'Armistice Transmission',
      type: 'final',
      scrambled: 'Eulqj wkh zdu wr dq hqg',
      accepts: ['bring the war to an end']
    }
  ]
};
