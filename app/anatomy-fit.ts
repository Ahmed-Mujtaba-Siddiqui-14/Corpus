import * as THREE from 'three';

// Landmark registration from the teaching pose to the reference surface's A-pose.
const mix=(v:number,stops:number[][])=>{for(let i=1;i<stops.length;i++){if(v<=stops[i][0])return THREE.MathUtils.lerp(stops[i-1][1],stops[i][1],THREE.MathUtils.clamp((v-stops[i-1][0])/(stops[i][0]-stops[i-1][0]),0,1));}return stops[stops.length-1][1];};
export function registerTeachingPoint(v:THREE.Vector3){
 const y=v.y,ax=Math.abs(v.x),sign=Math.sign(v.x);
 if(y<4.48&&ax<1.2){
  const oldCenter=.48,newCenter=mix(y,[[.12,1.09],[.65,1.04],[1.5,.90],[2.65,.77],[4.48,.60]]);
  const legWeight=THREE.MathUtils.smoothstep(ax,.15,.35);
  v.x+=sign*(newCenter-oldCenter)*legWeight;
  v.z+=mix(y,[[.12,-.40],[.6,-.5],[1,-.43],[2,-.32],[2.65,-.13],[3.2,0],[4.48,0]])*legWeight;
 }else if(y>4.08&&y<7.85&&ax>.88){
  const weight=THREE.MathUtils.smoothstep(ax,.88,1.13);
  const oldCenter=mix(y,[[4.1,1.68],[4.88,1.66],[6.03,1.38],[7.28,1.04],[7.85,.85]]);
  const newCenter=mix(y,[[4.1,2.48],[4.88,2.10],[6.03,1.59],[7.28,1.03],[7.85,.85]]);
  const newY=mix(y,[[4.1,4.82],[4.88,5.40],[6.03,6.32],[7.28,7.66],[7.85,8.08]]);
  const newZ=mix(y,[[4.1,.16],[4.88,-.02],[6.03,-.16],[7.28,-.16],[7.85,-.10]]);
  v.x=THREE.MathUtils.lerp(v.x,sign*(newCenter+(ax-oldCenter)*.82),weight);
  v.y=THREE.MathUtils.lerp(y,newY,weight);v.z+=newZ*weight;
 }else if(y>4.48&&y<8.05){v.y+=.3*Math.min(1,(y-4.48)/.45,(8.05-y)/.45);}
 return v;
}

// A reference-derived envelope keeps supporting geometry within the same skin pose.
// The surface is sampled in X/Y cells; each cell retains anterior/posterior depths.
export function bodyEnvelope(group:THREE.Group){
 const rows=256,cols=192,bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
 const lo=new Float32Array(rows*cols).fill(Infinity),hi=new Float32Array(rows*cols).fill(-Infinity);
 group.updateMatrixWorld(true);const p=new THREE.Vector3();
 group.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);const x=Math.floor((p.x-bounds.min.x)/size.x*(cols-1)),y=Math.floor((p.y-bounds.min.y)/size.y*(rows-1));for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=cols||yy<0||yy>=rows)continue;const k=yy*cols+xx;lo[k]=Math.min(lo[k],p.z);hi[k]=Math.max(hi[k],p.z);}}});
 const nearest=new Int16Array(rows*cols).fill(-1);
 for(let y=0;y<rows;y++){const occupied:number[]=[];for(let x=0;x<cols;x++)if(Number.isFinite(lo[y*cols+x]))occupied.push(x);for(let x=0;x<cols;x++){let best=-1,d=Infinity;for(const candidate of occupied){const distance=Math.abs(candidate-x);if(distance<d){best=candidate;d=distance;}}nearest[y*cols+x]=best;}}
 return (v:THREE.Vector3,inset=.018)=>{
  v.y=THREE.MathUtils.clamp(v.y,bounds.min.y+.03,bounds.max.y-.03);
  let y=THREE.MathUtils.clamp(Math.round((v.y-bounds.min.y)/size.y*(rows-1)),0,rows-1),x=THREE.MathUtils.clamp(Math.round((v.x-bounds.min.x)/size.x*(cols-1)),0,cols-1);
  let cell=nearest[y*cols+x];if(cell<0)return v;
  if(!Number.isFinite(lo[y*cols+x])){x=cell;v.x=bounds.min.x+x/(cols-1)*size.x;}
  const k=y*cols+x,zMin=lo[k],zMax=hi[k],margin=Math.min(inset,(zMax-zMin)*.22);v.z=THREE.MathUtils.clamp(v.z,zMin+margin,zMax-margin);return v;
 };
}
export function fitSupportingGroup(group:THREE.Group,fit:(p:THREE.Vector3)=>THREE.Vector3){
 group.updateMatrixWorld(true);const v=new THREE.Vector3();
 group.traverse(o=>{if(!(o instanceof THREE.Mesh)||o.userData.reference)return;const a=o.geometry.getAttribute('position'),inverse=o.matrixWorld.clone().invert();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);fit(v).applyMatrix4(inverse);a.setXYZ(i,v.x,v.y,v.z);}a.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();});
}
