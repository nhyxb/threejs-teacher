import * as THREE from 'three';
import type {LessonModule,Params} from './types';
import {box,cylinder,material} from './scene-kit';
import {deriveGearState,predictionOptions,MODULE,type GearParams} from './model';

const teal=0x247b87, orange=0xbf742f, ink=0x304747;
const fromParams=(p:Params):GearParams=>({inputTeeth:Number(p.inputTeeth),outputTeeth:Number(p.outputTeeth),rpm:Number(p.rpm),direction:Number(p.direction)});
const fmt=(n:number)=>Number(n.toFixed(2)).toString();
const camera={position:[0,10,8] as [number,number,number],target:[0,.5,0] as [number,number,number]};
const source='https://www.khkgears.co.jp/gear_technology/basic_guide/khk351_2/';

export const lesson:LessonModule={
 sceneCaption:'青色：输入轮 · 橙色：输出轮 · 白线：数圈标记',
 timeNote:'模拟秒数与 rpm 对应；演示速度只改变观看快慢，不改变标示的转速。',
 slug:'gear-ratio',title:'齿轮，齿数怎样改变转速',concept:'齿轮传动',
 subtitle:'改变两轮齿数，观察相反转向；先算输出转速，再用运动验证。',
 modelNote:'两只平行轴、同模数、外啮合的理想直齿轮；忽略摩擦、间隙、弹性、惯性和负载。齿数与节圆半径成正比，改齿数时自动调整轴距。齿形是可数齿的示意轮廓，非制造用渐开线，不计算接触力。正负号按从齿轮上方看定义：顺时针为正。传动比 i 定义为输入速率/输出速率 = 输出齿数/输入齿数（非零速时）；静止时沿用几何齿数比。圆环为理论节圆；白色径向标记帮助数圈。屏幕播放速度可减慢观察，rpm 表示模拟转速。',
 sources:[{title:'KHK 小原齿车工业：一段齿轮机构的速度比与转向',url:source},{title:'KHK：直齿轮尺寸计算（节圆直径 d = m × z）',url:'https://www.khkgears.co.jp/gear_technology/basic_guide/khk357_2/'}],
 parameters:[
  {key:'inputTeeth',label:'输入轮齿数 z₁',kind:'select',value:12,options:[12,18,24,36].map(value=>({value,label:`${value} 齿`}))},
  {key:'outputTeeth',label:'输出轮齿数 z₂',kind:'select',value:24,options:[12,18,24,36].map(value=>({value,label:`${value} 齿`}))},
  {key:'rpm',label:'输入速率（rpm）',kind:'range',value:30,min:0,max:120,step:5},
  {key:'direction',label:'输入方向（从上方看）',kind:'select',value:1,options:[{value:1,label:'顺时针'},{value:-1,label:'逆时针'}]}
 ],
 steps:[
  {id:'observe',title:'认识两轮',heading:'一轮带动，另一轮跟随',duration:8,camera,
   body:['青色是输入轮：外部动力带它转。橙色是输出轮：被啮合的齿推动。齿数 z 是一整圈的齿的数量；rpm 表示每分钟转多少圈。','点击“开始演示”，盯住两轮的白色径向标记。默认输入 12 齿、输出 24 齿：输入转两圈，输出才转一圈。'],takeaway:'齿与齿接续推动，把输入运动传给输出轮。'},
  {id:'contact',title:'为什么反转',heading:'相切处向同一侧移动',duration:8,camera,
   body:['箭头画的是理论节圆相切位置的运动方向。左轮的右边与右轮的左边，必须朝同一侧经过，才不会相互顶住。','两只轮的接触点位于各自圆心的相反侧，因此整个轮的旋转方向相反。方向统一按从上方看；旋转镜头后，请用文字方向判断。'],takeaway:'一对外啮合齿轮必然反向；换大小不会改变这条规则。'},
  {id:'count',title:'数齿与圈数',heading:'同一时间，经过相同的齿数',duration:8,camera,
   body:['输入每经过一个齿，输出也经过一个齿。相同时间内：输入圈数 × z₁ = 输出圈数的大小 × z₂。','保持输入为 12 齿，只把输出从 12 改成 24，再改成 36 齿。白色标记与下方累计圈数会告诉你：输出齿越多，完成一圈越慢。'],takeaway:'大输出轮减速，小输出轮增速；两轮等齿数时等速。'},
  {id:'formula',title:'算出转速',heading:'用齿数比，计算输出转速',duration:8,camera,
   body:['传动比 i = z₂ ÷ z₁。输出速率 = 输入速率 ÷ i = 输入速率 × z₁ ÷ z₂。速率只表示大小；有符号转速中的负号表示逆时针。','例如输入 12 齿、30 rpm，输出 24 齿：i = 2，输出为 15 rpm。现在只改输入 rpm，观察输出按相同比例变化；把输入设为 0，两轮一起停止。'],takeaway:'齿数比决定快慢比例；输入转速决定实际每分钟转几圈。'},
  {id:'predict',title:'预测并验证',heading:'这次，先给出你的预测',duration:8,camera,
   body:['先选择一组齿数、输入速率和方向，再预测输出。初始时下方隐藏计算结果，避免直接照抄。','选择答案会显示原因与结果。也可播放或拖动进度直接验证。改参数会清空旧答案；试试等齿数、大带小、反向与零转速。'],takeaway:'先判断增减速，再计算大小，最后把方向反过来。',
   question:(params)=>{const s=deriveGearState(fromParams(params),0);return {prompt:`当前输入 ${s.inputTeeth} 齿，${Math.abs(s.inputRpm)} rpm、${s.inputDirection}；输出 ${s.outputTeeth} 齿。输出怎样运动？`,choices:predictionOptions(s)}}}
 ],
 createScene(ctx){
  box(ctx.world,[10,.15,6.4],[0,0,0],0xdde6e2);
  const input=new THREE.Group(),output=new THREE.Group();ctx.world.add(input,output);
  const inputLabel=ctx.label('',[-2,1,-2],'major input-label');
  const outputLabel=ctx.label('',[2,1,2],'major output-label');
  const contactLabel=ctx.label('啮合点：每经过 1 齿，两边都前进 1 齿',[0,1.25,0],'contact-label');
  const arrows=[new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(),.9,teal,.22,.14),new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(),.9,orange,.22,.14)];arrows.forEach(a=>ctx.world.add(a));
  const gearGeometry=(z:number)=>{
   const pitch=2*Math.PI/z,r=MODULE*z/2,root=r-1.25*MODULE,tip=r+MODULE;
   const shape=new THREE.Shape();
   for(let k=0;k<z;k++)for(const [phase,radius] of [[-.5,root],[-.32,root],[-.16,tip],[.16,tip],[.32,root],[.5,root]]){
    const a=(k+phase)*pitch,x=radius*Math.cos(a),y=-radius*Math.sin(a);
    if(k===0&&phase===-.5)shape.moveTo(x,y);else shape.lineTo(x,y);
   }
   shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.018,bevelThickness:.018});geometry.rotateX(-Math.PI/2);return geometry;
  };
  const buildGear=(group:THREE.Group,z:number,color:number)=>{
   group.traverse(o=>{const mesh=o as THREE.Mesh;if(mesh.geometry)mesh.geometry.dispose();if(mesh.material)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose()});group.clear();
   const r=MODULE*z/2;
   const body=new THREE.Mesh(gearGeometry(z),material(color,.55));body.position.y=.62;body.castShadow=true;body.receiveShadow=true;group.add(body);
   cylinder(group,.28,.74,[0,.58,0],ink);cylinder(group,.15,.08,[0,.99,0],0xe7eeeb);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.012,6,128),new THREE.MeshBasicMaterial({color:0xf5faf7}));ring.rotation.x=-Math.PI/2;ring.position.y=.968;group.add(ring);
   box(group,[r*.65,.035,.075],[r*.5,.982,0],0xffffff,false);
  };
  let previousKey='';
  return {updateAt({stepId,time,params,revealed}){
   const s=deriveGearState(fromParams(params),time),key=`${s.inputTeeth}/${s.outputTeeth}`;
   if(key!==previousKey){buildGear(input,s.inputTeeth,teal);buildGear(output,s.outputTeeth,orange);previousKey=key;}
   input.position.x=s.inputX;output.position.x=s.outputX;
   input.rotation.y=-s.inputAngle;output.rotation.y=Math.PI/s.outputTeeth-s.outputAngle;
   inputLabel.setText(`输入 · ${s.inputTeeth} 齿`);outputLabel.setText(`输出 · ${s.outputTeeth} 齿`);
   inputLabel.position.set(s.inputX,1.1,-s.inputRadius-.42);outputLabel.position.set(s.outputX,1.1,s.outputRadius+.42);
   const contactX=s.inputX+s.inputRadius;contactLabel.position.set(contactX,1.35,-2.6);
   const contact=stepId==='contact';contactLabel.setVisible(contact);
   arrows.forEach((a,i)=>{a.visible=contact&&s.inputRpm!==0;a.position.set(contactX+(i===0?-.14:.14),1.15,-.45*(Math.sign(s.inputRpm)||1));a.setDirection(new THREE.Vector3(0,0,Math.sign(s.inputRpm)||1))});
   const hidden=stepId==='predict'&&!revealed&&time===0;
   return {
    status:hidden?'先预测，结果暂时隐藏':s.inputRpm===0?'输入停止，两轮都停止':s.ratio>1?'输出减速，转向相反':s.ratio<1?'输出增速，转向相反':'两轮等速，转向相反',
    detail:hidden?`用当前 ${s.inputTeeth} → ${s.outputTeeth} 齿和 ${Math.abs(s.inputRpm)} rpm 输入计算。选择答案，或播放验证。`:`输入 ${s.inputDirection}，输出 ${s.outputDirection}。相同时间都经过 ${s.teethPassed} 齿；白线标记帮助观察累计圈数。`,
    metrics:[{label:'传动比 i = z₂ / z₁',value:hidden?'待验证':fmt(s.ratio)},{label:'输入速率',value:fmt(Math.abs(s.inputRpm)),unit:'rpm'},{label:'输出速率',value:hidden?'待验证':fmt(Math.abs(s.outputRpm)),unit:hidden?'':'rpm'}],
    rows:[{label:'累计输入圈数',value:fmt(Math.abs(s.inputTurns))+' 圈'},{label:'累计输出圈数',value:hidden?'待验证':fmt(Math.abs(s.outputTurns))+' 圈'},{label:'有符号输出转速',value:hidden?'待验证':fmt(s.outputRpm)+' rpm'},{label:'模拟时间',value:fmt(s.time)+' 秒'}]
   };
  },dispose(){}};
 }
};
