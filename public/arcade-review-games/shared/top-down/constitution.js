// Replace this content module to reuse the adventure for another topic.
export const content = {
  title: 'Constitution Courthouse Run',
  questions: [
    { id:'branches', text:'Which branch of the U.S. government makes federal laws?', choices:['Legislative','Executive','Judicial'], answer:'Legislative', explanation:'Congress is the legislative branch. Its two chambers, the House and Senate, make federal laws.' },
    { id:'balance', text:'The president vetoes a bill passed by Congress. Which principle does this illustrate?', choices:['Checks and balances','Federalism','Popular sovereignty'], answer:'Checks and balances', explanation:'A veto allows the executive branch to check the legislative branch. Congress can also check that veto by overriding it with the required votes.' },
    { id:'rights', text:'Which amendment protects freedom of speech?', choices:['First Amendment','Third Amendment','Tenth Amendment'], answer:'First Amendment', explanation:'The First Amendment protects speech, religion, the press, peaceful assembly, and petition.' },
    { id:'federalism', text:'Power is divided between the national and state governments. What is this called?', choices:['Federalism','Separation of powers','Judicial review'], answer:'Federalism', explanation:'Federalism divides power between levels of government. Separation of powers divides responsibilities among branches.' }
  ]
};
