// Close, lower-angle framing. Portrait follows the squad instead of shrinking
// the whole world to fit a narrow phone; offscreen threats get edge indicators.
export function fitBenchmarkCamera(camera,width,height){
 const aspect=Math.max(1,width)/Math.max(1,height),portrait=aspect<.85;
 camera.aspect=aspect;camera.fov=portrait?53:aspect<1.6?53:46;
 camera.position.set(0,22,39);camera.lookAt(0,0,portrait?-1:3);
 camera.zoom=!portrait&&height<550?.78:1;
 camera.userData.portraitFollow=portrait;
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
