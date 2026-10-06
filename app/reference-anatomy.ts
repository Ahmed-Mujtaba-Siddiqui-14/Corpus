import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {SystemId} from './anatomy-data';

export const BASE_PATH=process.env.NEXT_PUBLIC_BASE_PATH || '';
export const REFERENCE_SCALE=9.4/1.82951877;
export const REFERENCE_Y=.91462487*REFERENCE_SCALE+.12;
export type ReferenceAsset={file:string;system:SystemId;organ:string;color:string;motion?:'heart'|'lungs'|'bladder';replace?:string[]};
export const referenceAssets:ReferenceAsset[]=[
 {file:'VH_M_Heart',system:'circulatory',organ:'Heart',color:'#af4b4e',motion:'heart',replace:['Right atrium','Left atrium','Right ventricle','Left ventricle','Tricuspid valve','Mitral valve','Pulmonary valve','Aortic valve']},
 {file:'VH_M_Lung',system:'respiratory',organ:'Lungs',color:'#c98f98',motion:'lungs',replace:['Lungs','Trachea','Bronchi']},
 {file:'VH_M_Liver',system:'digestive',organ:'Liver',color:'#82382f'},
 {file:'VH_M_Small_Intestine',system:'digestive',organ:'Small intestine',color:'#ce9380'},
 {file:'SBU_M_Intestine_Large',system:'digestive',organ:'Large intestine',color:'#af7b68',replace:['Large intestine','Rectum']},
 {file:'VH_M_Pancreas',system:'digestive',organ:'Pancreas',color:'#d2a076'},
 {file:'Allen_M_Brain',system:'nervous',organ:'Brain',color:'#c9a39d'},
 {file:'VH_M_Spinal_Cord',system:'nervous',organ:'Spinal cord',color:'#d5bd81'},
 {file:'VH_M_Kidney_L',system:'urinary',organ:'Kidneys',color:'#8e3d46'},
 {file:'VH_M_Kidney_R',system:'urinary',organ:'Kidneys',color:'#8e3d46'},
 {file:'VH_M_Urinary_Bladder',system:'urinary',organ:'Bladder',color:'#c89886',motion:'bladder'},
 {file:'VH_M_Ureter_L',system:'urinary',organ:'Ureters',color:'#d1b296'},
 {file:'VH_M_Ureter_R',system:'urinary',organ:'Ureters',color:'#d1b296'},
 {file:'VH_M_Pelvis',system:'skeletal',organ:'Pelvis',color:'#ddcfaf'},
];
export function tissueMaterial(color:string,skin=false,kind:'tissue'|'muscle'|'bone'='tissue'){
 const mat=new THREE.MeshPhysicalMaterial({color,roughness:skin?.70:kind==='bone'?.72:kind==='muscle'?.50:.44,metalness:0,clearcoat:skin?.04:kind==='bone'?.04:.18,clearcoatRoughness:.42,side:THREE.DoubleSide});
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vTissueWorld;varying vec3 vTissueLocal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTissueWorld=transformed;vTissueLocal=transformed;');
  shader.fragmentShader='varying vec3 vTissueWorld;varying vec3 vTissueLocal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float tissueGrain=sin(vTissueLocal.x*107.0+sin(vTissueLocal.y*89.0))*sin(vTissueLocal.y*137.0+sin(vTissueLocal.z*71.0))*sin(vTissueLocal.z*113.0+sin(vTissueLocal.x*43.0));
   float tissueCloud=sin(vTissueLocal.x*19.0+sin(vTissueLocal.z*23.0))*sin(vTissueLocal.y*27.0);
   diffuseColor.rgb*=1.0+tissueGrain*0.045+tissueCloud*0.07;
   ${kind==='muscle'?`float fibers=pow(0.5+0.5*sin(vTissueLocal.x*155.0+sin(vTissueLocal.y*5.0)*3.0+vTissueLocal.z*27.0),7.0);
   float bundles=0.5+0.5*sin(vTissueLocal.x*31.0+vTissueLocal.y*2.0);
   diffuseColor.rgb=mix(diffuseColor.rgb*.76,diffuseColor.rgb*1.26,fibers*.70+bundles*.22);`:kind==='bone'?`diffuseColor.rgb*=1.0+0.04*sin(vTissueLocal.y*77.0)*sin(vTissueLocal.x*63.0);`:''}
  `);
  if(kind==='muscle')shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float ridge=sin(vTissueLocal.x*155.0+sin(vTissueLocal.y*5.0)*3.0+vTissueLocal.z*27.0);
   normal=normalize(normal+normalize(dFdx(vViewPosition))*(ridge*0.08));
  `);
 };
 mat.customProgramCacheKey=()=>`corpus-${skin?'skin':kind}-textured-v4`;return mat;
}
export function skinMaterial(){
 const mat=tissueMaterial('#648696',true);const base=mat.onBeforeCompile.bind(mat);
 const uniforms={cutMode:{value:1},headWindow:{value:0},openBody:{value:0}};
 mat.onBeforeCompile=(shader,renderer)=>{base(shader,renderer);Object.assign(shader.uniforms,uniforms);
 shader.fragmentShader='uniform float cutMode;uniform float headWindow;uniform float openBody;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
  if(cutMode>0.5){
   float torsoWindow=pow(vTissueWorld.x/0.87,2.0)+pow((vTissueWorld.y-6.35)/1.85,2.0);
   float brainWindow=pow(vTissueWorld.x/0.46,2.0)+pow((vTissueWorld.y-8.98)/0.52,2.0);
   if(torsoWindow<1.0 || (headWindow>0.5 && brainWindow<1.0)) discard;
  }
 `);
 };mat.customProgramCacheKey=()=> 'corpus-skin-window-v4';return {mat,uniforms};
}
function organName(name:string,asset:ReferenceAsset){
 const n=name.toLowerCase();if(asset.organ==='Heart'){
  if(n.includes('left_cardiac_atrium'))return 'Left atrium';if(n.includes('right_cardiac_atrium'))return 'Right atrium';
  if(n.includes('right_ventricle'))return 'Right ventricle';if(n.includes('left_ventricle'))return 'Left ventricle';
  if(n.includes('mitral'))return 'Mitral valve';if(n.includes('tricuspid'))return 'Tricuspid valve';if(n.includes('aortic_valve'))return 'Aortic valve';if(n.includes('pulmonary_valve'))return 'Pulmonary valve';
 }
 if(asset.organ==='Lungs'){if(n.includes('trachea'))return 'Trachea';if(n.includes('bronchus')&&!n.includes('bronchopulmonary'))return 'Bronchi';}
 if(asset.organ==='Large intestine'&&n.includes('rectum'))return 'Rectum';return asset.organ;
}
export async function loadReference(asset:ReferenceAsset){
 const gltf=await new GLTFLoader().loadAsync(`${BASE_PATH}/models/${asset.file}.glb`);const group=new THREE.Group();const meshes:THREE.Mesh[]=[];
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.scale(REFERENCE_SCALE,REFERENCE_SCALE,REFERENCE_SCALE);geometry.translate(0,REFERENCE_Y,0);
  const name=organName(o.name,asset);const color=/valve/i.test(name)?'#d9baa0':asset.color;
  const mesh=new THREE.Mesh(geometry,tissueMaterial(color));mesh.name=o.name;mesh.userData={organ:name,system:asset.system,baseColor:color,baseScale:[1,1,1],reference:true,referenceOrgan:asset.organ};
  group.add(mesh);meshes.push(mesh);o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());
 });
 const box=new THREE.Box3().setFromObject(group);const center=box.getCenter(new THREE.Vector3());
 for(const mesh of meshes)mesh.geometry.translate(-center.x,-center.y,-center.z);group.position.copy(center);group.userData.motion=asset.motion;group.userData.organ=asset.organ;group.userData.reference=true;
 return {group,meshes,box};
}
export async function loadBody(){
 const gltf=await new GLTFLoader().loadAsync(`${BASE_PATH}/models/Human_Surface.glb`);const {mat,uniforms}=skinMaterial();const group=new THREE.Group();
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.scale(REFERENCE_SCALE,REFERENCE_SCALE,REFERENCE_SCALE);geo.translate(0,REFERENCE_Y,0);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,mat));o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});return {group,mat,uniforms};
}
