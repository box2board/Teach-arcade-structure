// Content and experiment rules are separate from movement, rendering, and UI.
export const region = {
  id: 'waterworks-v1', title: 'Waterworks Valley', width: 26, height: 16,
  spawn: {x:3,y:8},
  stations: [
    {id:'canal',name:'Canal junction',x:6,y:5,tool:'Flow wrench',objective:'Redirect the stream at the canal junction.',intro:'The stream enters from the west. Guide it south through the upper elbow, then east through the lower elbow toward the waterwheel.',hint:'An elbow has two open sides. Connect west to south in the upper elbow, then north to east in the lower one.',discovery:'A continuous channel redirects moving water to the wheel.'},
    {id:'wheel',name:'Waterwheel',x:10,y:10,tool:'Flow gauge',objective:'Adjust the waterwheel until its shaft runs steadily.',intro:'Water is reaching the wheel. Adjust the valve and test the shaft. Too little flow cannot lift the load; too much makes this worn wheel slip.',hint:'Compare low, middle, and high valve settings. Look for a steady shaft rather than the largest number.',discovery:'Moving water transfers energy to the wheel. This model runs steadily at 40–60% valve opening.'},
    {id:'gears',name:'Gear workshop',x:18,y:5,tool:'Gear kit',objective:'Transfer the wheel’s motion to the generator at 50–70 rpm.',intro:'The wheel shaft turns a 20-tooth driver at 120 rpm. The generator needs 50–70 rpm. Try different driven gears and observe their speed.',hint:'When a small driver turns a larger gear, the larger gear turns more slowly. Compare the tooth counts.',discovery:'Meshing gears transfer motion. A 20-tooth driver at 120 rpm turns a 40-tooth gear at 60 rpm.'},
    {id:'gate',name:'Archive gate',x:22,y:11,tool:'Circuit kit',objective:'Complete a conducting circuit to power the archive gate.',intro:'The generator is ready. Connect its output to the gate motor and back to the generator. Test a connecting material and the return path.',hint:'The motor needs both a conducting connection and a complete return path. Copper conducts; rubber and wood insulate.',discovery:'A motor needs a closed conducting circuit. The chain transfers energy from moving water to motion, electricity, and motion again.'}
  ]
};
export function evaluateExperiment(id, config) {
  if(id==='canal'){
    const first=config.upper==='ws',second=config.lower==='ne';
    return {success:first&&second,message:!first?'Water spills at the upper elbow. Its openings do not connect the incoming west channel to the south channel.':!second?'Water reaches the lower elbow but cannot turn east toward the wheel.':'The channel connects! Water flows south, then east to the wheel.',measurement:first&&second?'Flow reaches the waterwheel':first?'Flow stops at lower elbow':'Flow stops at upper elbow'};
  }
  if(id==='wheel'){
    const value=Number(config.flow),success=value>=40&&value<=60;
    return {success,message:success?'The wheel lifts its load steadily. The bridge mechanism starts moving.':value<40?'The wheel strains and stalls. The water supplies too little energy to lift the load.':'The worn wheel slips and the shaft pulses. More flow is not producing useful steady motion.',measurement:success?'Steady shaft: 120 rpm':value<40?'Shaft stalled: 0 rpm':'Shaft slipping: unstable'};
  }
  if(id==='gears'){
    const rpm=120*20/Number(config.teeth),success=rpm>=50&&rpm<=70;
    return {success,message:success?'The generator turns at its working speed. Electrical power reaches the gate station.':rpm>70?'The generator turns too fast. Try a driven gear that takes longer to complete one rotation.':'The generator turns too slowly. Try a smaller driven gear.',measurement:`Generator: ${rpm} rpm · Target: 50–70 rpm`};
  }
  const conducting=config.material==='copper',closed=config.returnPath==='closed';
  return {success:conducting&&closed,message:!closed?'The circuit is open. The current has no complete path back to the generator.':!conducting?'The loop is connected, but this material insulates. The motor receives no current.':'Current flows around the complete copper circuit. The motor opens the archive gate!',measurement:conducting&&closed?'Motor powered · Gate open':'No current · Gate closed'};
}
