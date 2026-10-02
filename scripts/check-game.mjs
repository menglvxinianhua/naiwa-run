import assert from 'node:assert/strict';
import {GROUND,GRAVITY,JUMP,speedAt,scoreAt,intersects,playerBox,obstacleBox} from '../public/play/physics.js';
assert(speedAt(100)>speedAt(0));assert.equal(speedAt(1000),410);assert.equal(scoreAt(12.34),123);
const bird=obstacleBox({type:'bird',x:90});
assert(intersects(playerBox(68,GROUND,false),bird),'standing must hit bird');
assert(!intersects(playerBox(68,GROUND,true),bird),'duck must clear bird');
const rock=obstacleBox({type:'rock',x:90,w:40,h:40});
assert(intersects(playerBox(68,GROUND,false),rock));
let y=GROUND,v=JUMP,min=GROUND;for(let i=0;i<120;i++){v+=GRAVITY/120;y=Math.min(GROUND,y+v/120);min=Math.min(min,y);}
assert(min<GROUND-100);assert.equal(y,GROUND);assert(!intersects(playerBox(68,min,false),rock));
assert(!intersects({x:0,y:0,w:10,h:10},{x:10,y:0,w:10,h:10}));
console.log('PASS: acceleration cap, scores, jump landing, rock and bird hitboxes, duck clearance');
