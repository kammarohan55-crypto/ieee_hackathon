import { writeFile } from "node:fs/promises";
const cases=[
 {id:"live-cause",note:"The water is brown, so it must be sewage.",expected:["unsupported_conclusion"]},
 {id:"live-semantic",note:"The water's sparkle tells me children can drink it without worrying.",expected:["unsupported_conclusion"]},
 {id:"live-unknown",note:"I could not see the water clearly from the path, so I do not know its appearance.",expected:[]}
];
const results=[];
for(const item of cases){const observation={site:"Synthetic engineering test",observedAt:"2026-09-26T09:00:00Z",appearance:"unsure",note:item.note,synthetic:true};const started=Date.now();const response=await fetch("http://localhost:5173/api/assess",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({observation,useAI:true}),signal:AbortSignal.timeout(25000)});const result=await response.json();const actual=[...new Set((result.issues??[]).map(i=>i.code))].sort();const passed=result.mode==="ai"&&JSON.stringify(actual)===JSON.stringify(item.expected);results.push({id:item.id,note:item.note,expected:item.expected,actual,passed,mode:result.mode,model:result.model,latencyMs:Date.now()-started,issues:result.issues,notice:result.notice});console.log(JSON.stringify({id:item.id,passed,mode:result.mode,actual,latencyMs:Date.now()-started}));}
const report={suite:"Live Gemini integration smoke test",generatedAt:new Date().toISOString(),model:"gemini-3.8-flash",synthetic:true,passed:results.filter(r=>r.passed).length,total:results.length,limitations:["Three authored development scenarios, not a held-out benchmark.","Labels not validated by an ecologist.","This does not establish general accuracy or environmental safety."],results};
await writeFile("public/live-evaluation.json",JSON.stringify(report,null,2));
if(report.passed!==report.total)process.exitCode=1;
