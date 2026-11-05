// French Revolution Room 1 scene dressing. Prop geometry stays with this room pack.
function registerEscapeRoomProps(registry) {
  registry.register('table', buildBastilleProp);
  registry.register('crate', buildBastilleProp);
  registry.register('bed', buildBastilleProp);
  registry.register('papers', buildBastilleProp);
  registry.register('writing', buildBastilleProp);
  registry.register('cup', buildBastilleProp);
  registry.register('chain', buildBastilleProp);
  registry.register('torch', buildBastilleProp);
  registry.register('door', buildBastilleProp);
  registry.register('window', buildBastilleProp);
}

function buildBastilleProp(prop, env) {
  const { THREE, group, materials, box, cyl, makeMaterial, animatedProps, seeded } = env;
    const p = new THREE.Group(); p.position.set(...(prop.position || [0,0,0])); p.rotation.y = prop.rotation || 0; group.add(p);
    const mat = materials[prop.material] || wood;
    const putBox = (m, pos, size, rot) => box(p,m,pos,size,rot);
    switch (prop.kind) {
      case 'table':
        putBox(darkWood,[0,.82,0],[1.62,.13,.87]);
        for(let z=-.31;z<=.32;z+=.21) putBox(wood,[0,.891,z],[1.56,.012,.19]);
        for(const x of [-.7,.7]) for(const z of [-.34,.34]) putBox(wood,[x,.4,z],[.13,.8,.13],[.04,0,.04]);
        putBox(darkWood,[0,.39,0],[1.34,.12,.68]);
        for(const x of [-.54,.54]) putBox(darkWood,[x,.65,0],[.06,.08,.72]);
        break;
      case 'crate':
        putBox(darkWood,[0,.35,0],[.82,.72,.72]);
        for(let y=.08;y<.7;y+=.22) putBox(wood,[0,y,-.365],[.78,.045,.025]);
        putBox(wood,[-.04,.35,-.393],[.075,.58,.025],[0,0,.62]);
        putBox(wood,[-.04,.35,-.394],[.075,.58,.025],[0,0,-.62]);
        putBox(wood,[0,.73,0],[.84,.055,.74]);
        break;
      case 'bed':
        putBox(darkWood,[0,.36,0],[2.65,.16,1.15]);
        for(const x of [-1.2,1.2]) {
          for(const z of [-.48,.48]) putBox(wood,[x,.19,z],[.12,.38,.12]);
          putBox(wood,[x,.59,0],[.13,.52,1.18]);
          putBox(darkWood,[x,.64,0],[.16,.07,1.23]);
        }
        putBox(wood,[0,.44,-.53],[2.42,.16,.09]);
        putBox(wood,[0,.44,.53],[2.42,.16,.09]);
        putBox(straw,[0,.51,0],[2.35,.22,.97]);
        for(let i=0;i<56;i++){const q=seeded(i+77);const a=q(), b=q(), len=.24+a*.38, ang=(q()-.5)*.18;box(p,straw,[((a-.5)*2.1),.64+q()*.035,((b-.5)*.86)],[len,.018,.028],[0,(q()-.5)*.2,ang]);}
        putBox(parchment,[-.82,.68,-.16],[.45,.14,.32],[.04,0,-.12]);
        break;
      case 'papers':
        for(let i=0;i<4;i++){
          const px=(i%2)*.25-.1, pz=Math.floor(i/2)*.19-.08, angle=(i-1)*.18;
          putBox(parchment,[px,.03,pz],[.36,.018,.24],[0,angle,0]);
          for(let line=0;line<4;line++)putBox(materials.ink,[px-.005,.041,pz-.075+line*.045],[.235-(line%2)*.04,.003,.009],[0,angle,0]);
        }
        break;
      case 'writing': {
        const c=document.createElement('canvas');c.width=768;c.height=320;const x=c.getContext('2d');
        x.clearRect(0,0,c.width,c.height);const rand=seeded(1789);x.strokeStyle='rgba(37,23,19,.8)';x.fillStyle='rgba(37,23,19,.83)';x.lineWidth=3;
        x.font='italic bold 54px Georgia';x.fillText('LIBERTÉ',38,118);x.font='italic 40px Georgia';x.fillText('et droits du peuple',46,194);
        for(let i=0;i<18;i++){x.beginPath();x.moveTo(rand()*768,rand()*320);x.lineTo(rand()*768,rand()*320);x.stroke();}
        const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
        const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.8),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
        plane.position.set(0,0,0);p.add(plane);break;
      }
      case 'cup': {
        const pewter=makeMaterial('#83755f',{metalness:.52,roughness:.48});
        const vessel=new THREE.Mesh(new THREE.CylinderGeometry(.15,.11,.30,16,1,true),pewter);
        vessel.position.set(0,.18,0);vessel.castShadow=true;p.add(vessel);
        cyl(p,makeMaterial('#3e3429'),[0,.045,0],.11,.11,.025,16);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(.15,.023,8,20),pewter);
        rim.position.set(0,.335,0);rim.rotation.x=Math.PI/2;p.add(rim);
        break;
      }
      case 'chain':
        for(let i=0;i<5;i++){
          const t=new THREE.Mesh(new THREE.TorusGeometry(.17,.045,9,20),iron);
          t.position.set((i-2)*.31,.055+(i===3?.025:0),i===2?.035:0);
          t.rotation.set(i%2?.18:0,i%2?.82:0,i===3?.12:0);t.castShadow=true;p.add(t);
        }
        const snapped=new THREE.Mesh(new THREE.TorusGeometry(.14,.042,8,18,Math.PI*1.48),iron);
        snapped.position.set(.98,.07,.09);snapped.rotation.set(.24,.6,.34);p.add(snapped);
        break;
      case 'torch': {
        putBox(darkWood,[0,-.12,0],[.12,.46,.11],[0,0,-.16]);
        const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.38,7),new THREE.MeshBasicMaterial({color:0xffa13a}));
        flame.position.set(0,.2,.04);p.add(flame);animatedProps.push(flame);
        const core=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:0xffe3a0}));
        core.position.set(0,.14,.03);p.add(core);animatedProps.push(core);
        break;
      }
      case 'door':
        putBox(darkWood,[0,1.25,0],[1.55,2.5,.17]);
        for(let x=-.6;x<=.61;x+=.3) putBox(wood,[x,1.25,.1],[.055,2.34,.025]);
        putBox(iron,[.56,1.18,.14],[.1,.1,.05]);
        break;
      case 'window':
        for(const x of [-.7,.7]) putBox(wood,[x,0,0],[.13,1.45,.15]);
        for(const y of [-.68,.68]) putBox(wood,[0,y,0],[1.48,.13,.15]);
        for(let x=-.42;x<=.43;x+=.28) putBox(iron,[x,0,.06],[.035,1.25,.035]);
        putBox(iron,[0,0,.06],[1.32,.04,.04]);
        break;
      default:
        if(prop.geometry) prop.geometry.forEach(g=>box(p,materials[g.material]||mat,g.position,g.size,g.rotation));
    }
    return p;
  }

export { registerEscapeRoomProps };
