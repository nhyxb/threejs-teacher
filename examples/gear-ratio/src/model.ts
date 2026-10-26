export interface GearParams { inputTeeth: number; outputTeeth: number; rpm: number; direction: number }
export interface GearState {
  inputTeeth: number; outputTeeth: number; inputRpm: number; outputRpm: number;
  ratio: number; inputTurns: number; outputTurns: number; inputAngle: number; outputAngle: number;
  inputRadius: number; outputRadius: number; inputX: number; outputX: number;
  teethPassed: number; inputDirection: string; outputDirection: string; time: number;
}
export const MODULE = 0.12;
export function directionName(rpm: number): string { return rpm === 0 ? '停止' : rpm > 0 ? '顺时针' : '逆时针'; }
export function deriveGearState(p: GearParams, time: number): GearState {
  if (![p.inputTeeth,p.outputTeeth].every(z => Number.isInteger(z) && z >= 12 && z <= 36)) throw new RangeError('齿数应为 12–36 的整数');
  if (!Number.isFinite(p.rpm) || p.rpm < 0 || p.rpm > 120) throw new RangeError('输入速率应为 0–120 rpm');
  if (p.direction !== 1 && p.direction !== -1) throw new RangeError('方向应为 1 或 -1');
  if (!Number.isFinite(time) || time < 0) throw new RangeError('时间应为非负有限数');
  const inputRpm = p.rpm === 0 ? 0 : p.rpm * p.direction;
  const outputRpm = inputRpm === 0 ? 0 : -inputRpm * p.inputTeeth / p.outputTeeth;
  const inputTurns = inputRpm * time / 60, outputTurns = outputRpm * time / 60;
  const inputRadius = MODULE * p.inputTeeth / 2, outputRadius = MODULE * p.outputTeeth / 2;
  return { inputTeeth:p.inputTeeth,outputTeeth:p.outputTeeth,inputRpm,outputRpm,ratio:p.outputTeeth/p.inputTeeth,
    inputTurns,outputTurns,inputAngle:inputTurns*Math.PI*2,outputAngle:outputTurns*Math.PI*2,
    inputRadius,outputRadius,inputX:-outputRadius,outputX:inputRadius,
    teethPassed:Math.floor(Math.abs(inputTurns)*p.inputTeeth+1e-9),inputDirection:directionName(inputRpm),outputDirection:directionName(outputRpm),time };
}
export function predictionOptions(s: GearState) {
  if (!s.inputRpm) return [
    {label:'输出停止',correct:true,feedback:'输入为 0 rpm，没有齿被推动，理想模型中的输出也为 0 rpm。'},
    {label:'输出继续转动',correct:false,feedback:'本模型不含惯性滑行。输入停止，输出也停止。'}
  ];
  const speed = Number(Math.abs(s.outputRpm).toFixed(2));
  return [
    {label:`${speed} rpm · ${s.outputDirection}`,correct:true,feedback:`对。输出速率 = ${Math.abs(s.inputRpm)} × ${s.inputTeeth} ÷ ${s.outputTeeth} = ${speed} rpm；两轮外啮合，转向相反。`},
    {label:`${speed} rpm · ${s.inputDirection}`,correct:false,feedback:`速率算对了，转向需反过来：接触处不能彼此穿过，因此输出为${s.outputDirection}。`},
    {label:`${speed*2} rpm · ${s.outputDirection}`,correct:false,feedback:`方向对了。相同时间经过的齿数相同，应用 n1 × z1 = |n2| × z2，输出应为 ${speed} rpm。`}
  ];
}
