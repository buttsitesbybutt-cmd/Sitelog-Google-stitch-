import{a as P,g as C,b as D,s as R,d as h,c as w}from"./index-BD2tU7GL.js";const G=`Date,Project,Category,Description,Workers,Hours,Material
2026-05-16,Plot 3,RF Wall Coordination,1 vila,2,20,
2026-05-16,Plot 29,GF Wall Coordination,Marking For Cutting,,,
2026-05-16,Plot 30,GF Wall Coordination,Marking for Cutting,,,
2026-05-15,Plot 35,External & Pump Room Piping,Inspection for Lift Right side of 4BR has been passed,,,
2026-05-15,Plot 3,RF Wall Coordination,1 vila piping,2,20,
2026-05-14,Plot 6,GF Wall Coordination,GF Marking For Cutting,,,
2026-05-14,Plot 18,FF Wall Coordination,3 Vila box fixing,2,26,
2026-05-13,Plot 18,GF Wall Coordination,All work complete,,,
2026-05-13,Plot 18,FF Wall Coordination,FF Wall marking,,,
2026-05-13,Plot 38,GF DB Piping,3BR plus 3BR,2,26,
2026-05-12,Plot 18,GF DB Piping,3BR GF DB complete,2,20,
2026-05-12,Plot 32,RF Wall Coordination,2 vila piping,2,20,
2026-05-12,Plot 38,GF DB Piping,1 villa 4BR GF DB Fixing,2,20,
2026-05-12,Plot 32,RF Wall Coordination,2 Vila,2,20,
2026-05-11,Plot 18,GF DB Piping,"1 electrical DB in 4BR 
1 Data DB in 4BR 
1 3BR ele data db",4,40,
2026-05-11,Plot 36,GF DB Piping,"4BR piping complete 
4BR data complete",2,20,
2026-05-11,Plot 36,GF DB Piping,"3BR GF DB complete 
3BR GF DB complete",2,20,
2026-05-09,Plot 36,GF DB Piping,"1 4BR complete 
1 4BR onu complete",2,20,
2026-05-07,Plot 3,RF Wall Coordination,2 vila piping,4,40,`,j=async()=>{if(!P.currentUser)throw new Error("User must be logged in to import data");const m=(e=>{const n=[];let o=[],t="",i=!1;for(let a=0;a<e.length;a++){const r=e[a],g=e[a+1];r==='"'?i&&g==='"'?(t+='"',a++):i=!i:r===","&&!i?(o.push(t),t=""):(r==="\r"||r===`
`)&&!i?((t||o.length>0)&&(o.push(t),n.push(o),o=[],t=""),r==="\r"&&g===`
`&&a++):t+=r}return(t||o.length>0)&&(o.push(t),n.push(o)),n})(G).slice(1);let c=await C(),F=await D();for(const e of m){if(e.length<3||!e[1]||!e[2])continue;const[n,o,t,i,a,r,g]=e;let s=c.find(l=>{var u;return((u=l.name)==null?void 0:u.toLowerCase())===t.toLowerCase()});s||(s={id:await R({name:t,order:c.length}),name:t,order:c.length,userId:P.currentUser.uid},c.push(s));const p=(o||"").replace("Plot ","").trim();if(!p)continue;const B=p,f=`${t} - Plot ${p}`;let d=F.find(l=>l.plotNum===p&&l.categoryId===s.id);if(!d){const l={villaNum:B,plotNum:p,title:f,description:`Legacy project: ${o}`,categoryId:s.id,progress:100,status:"Completed",startDate:n||new Date().toISOString().split("T")[0]};d={id:await h(l),...l,userId:P.currentUser.uid,lastUpdated:new Date().toISOString()},F.push(d)}i&&await w(d.id,{date:n||new Date().toISOString().split("T")[0],description:i.trim(),workers:parseInt(a)||0,hours:parseFloat(r)||0,materials:(g||"").trim()})}return!0};export{j as importLegacyData};
