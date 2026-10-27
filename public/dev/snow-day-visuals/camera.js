// Snow-specific framing: preserve steering edges and put the entire fort in view.
export function fitBenchmarkCamera(camera,width,height){
 const aspect=Math.max(1,width)/Math.max(1,height),portrait=aspect<.85;
 camera.aspect=aspect;camera.fov=portrait?49:48;
 camera.position.set(0,portrait?36:30,portrait?44:40);
 camera.lookAt(0,0,portrait?-3:0);
 camera.zoom=portrait?Math.min(1,aspect/.9):height<550?.76:1;
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
