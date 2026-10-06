'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {SystemId} from './anatomy-data';
export function useProcessAudio({playing,system,time,volume}:{playing:boolean;system:SystemId;time:number;volume:number}){
 const [enabled,setEnabled]=useState(false),[available,setAvailable]=useState(true);
 const context=useRef<AudioContext|null>(null),master=useRef<GainNode|null>(null),nodes=useRef(new Set<AudioScheduledSourceNode>()),last=useRef('');
 const stop=useCallback(()=>{for(const n of nodes.current){try{n.stop();}catch{}}nodes.current.clear();},[]);
 const toggle=useCallback(async()=>{
  if(enabled){stop();setEnabled(false);return;}
  try{const Constructor=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;if(!Constructor)throw new Error('Audio unavailable');
   context.current??=new Constructor();if(!master.current){master.current=context.current.createGain();master.current.gain.value=volume*.20;master.current.connect(context.current.destination);}await context.current.resume();setEnabled(true);last.current='';
  }catch{setAvailable(false);setEnabled(false);}
 },[enabled,stop,volume]);
 useEffect(()=>{if(context.current&&master.current)master.current.gain.setTargetAtTime(volume*.20,context.current.currentTime,.04);},[volume]);
 useEffect(()=>{if(!enabled||!playing){stop();last.current='';return;}const c=context.current,output=master.current;if(!c||!output)return;
  const seconds=time*6,cycle=system==='circulatory'?Math.floor(seconds*1.18):system==='respiratory'?Math.floor(seconds/2.24):Math.floor(seconds/1.5),key=system+':'+cycle;
  if(last.current===key)return;last.current=key;
  function remember(n:AudioScheduledSourceNode,cleanup=()=>{}){nodes.current.add(n);n.onended=()=>{nodes.current.delete(n);n.disconnect();cleanup();};}
  function tone(frequency:number,offset:number,duration:number,amplitude:number,endFrequency=frequency){const source=c!.createOscillator(),gain=c!.createGain();source.type='sine';source.frequency.setValueAtTime(frequency,c!.currentTime+offset);source.frequency.exponentialRampToValueAtTime(endFrequency,c!.currentTime+offset+duration);gain.gain.setValueAtTime(0,c!.currentTime+offset);gain.gain.linearRampToValueAtTime(amplitude,c!.currentTime+offset+.012);gain.gain.exponentialRampToValueAtTime(.0001,c!.currentTime+offset+duration);source.connect(gain);gain.connect(output!);source.start(c!.currentTime+offset);source.stop(c!.currentTime+offset+duration+.02);remember(source,()=>gain.disconnect());}
  function breath(duration:number,frequency:number,amplitude:number){const buffer=c!.createBuffer(1,Math.ceil(c!.sampleRate*duration),c!.sampleRate),values=buffer.getChannelData(0);for(let i=0;i<values.length;i++)values[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/values.length);const source=c!.createBufferSource(),filter=c!.createBiquadFilter(),gain=c!.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.65;gain.gain.value=amplitude;source.connect(filter);filter.connect(gain);gain.connect(output!);source.start();remember(source,()=>{filter.disconnect();gain.disconnect();});}
  if(system==='circulatory'){tone(72,0,.16,.75,38);tone(88,.23,.12,.50,48);}
  else if(system==='respiratory')breath(.95,cycle%2?460:680,.32);
  else if(system==='digestive'){breath(.4,180,.16);tone(92,.06,.24,.08,48);}
  else if(system==='nervous'){tone(650,0,.1,.12,980);tone(980,.09,.07,.08,650);}
  else if(system==='muscular'){tone(145,0,.15,.12,70);}
  else if(system==='skeletal'){tone(215,0,.06,.10,150);}
  else if(system==='urinary'){tone(820,0,.12,.10,320);}
 },[enabled,playing,system,time,stop]);
 useEffect(()=>()=>{stop();void context.current?.close();},[stop]);
 return {enabled,available,toggle};
}
