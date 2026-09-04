import{r as e}from"./rolldown-runtime-B0Z9INg1.js";var t=e({default:()=>m,downloadXlsx:()=>u,generateXlsxBuffer:()=>l,utils:()=>d,write:()=>p,writeFile:()=>f});function n(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`)}function r(e){let t=e+1,n=``;for(;t>0;){let e=(t-1)%26;n=String.fromCharCode(65+e)+n,t=Math.floor((t-e)/26)}return n}var i=(()=>{let e=new Uint32Array(256);for(let t=0;t<256;t++){let n=t;for(let e=0;e<8;e++)n=n&1?3988292384^n>>>1:n>>>1;e[t]=n}return e})();function a(e){let t=4294967295;for(let n=0;n<e.length;n++)t=i[(t^e[n])&255]^t>>>8;return(t^4294967295)>>>0}function o(e){let t=new TextEncoder,n=[],r=0;for(let i of e){let e=t.encode(i.path),o=a(i.data);n.push({entry:i,offset:r,crc:o,nameBuf:e}),r+=30+e.length+i.data.length}let i=0;for(let e of n)i+=46+e.nameBuf.length;let o=new Uint8Array(r+i+22),s=new DataView(o.buffer),c=0;for(let e of n)s.setUint32(c,67324752,!0),s.setUint16(c+4,20,!0),s.setUint16(c+6,0,!0),s.setUint16(c+8,0,!0),s.setUint16(c+10,0,!0),s.setUint16(c+12,0,!0),s.setUint32(c+14,e.crc,!0),s.setUint32(c+18,e.entry.data.length,!0),s.setUint32(c+22,e.entry.data.length,!0),s.setUint16(c+26,e.nameBuf.length,!0),s.setUint16(c+28,0,!0),c+=30,o.set(e.nameBuf,c),c+=e.nameBuf.length,o.set(e.entry.data,c),c+=e.entry.data.length;let l=c;for(let e of n)s.setUint32(c,33639248,!0),s.setUint16(c+4,20,!0),s.setUint16(c+6,20,!0),s.setUint16(c+8,0,!0),s.setUint16(c+10,0,!0),s.setUint16(c+12,0,!0),s.setUint16(c+14,0,!0),s.setUint32(c+16,e.crc,!0),s.setUint32(c+20,e.entry.data.length,!0),s.setUint32(c+24,e.entry.data.length,!0),s.setUint16(c+28,e.nameBuf.length,!0),s.setUint16(c+30,0,!0),s.setUint16(c+32,0,!0),s.setUint16(c+34,0,!0),s.setUint16(c+36,0,!0),s.setUint32(c+38,0,!0),s.setUint32(c+42,e.offset,!0),c+=46,o.set(e.nameBuf,c),c+=e.nameBuf.length;return s.setUint32(c,101010256,!0),s.setUint16(c+4,0,!0),s.setUint16(c+6,0,!0),s.setUint16(c+8,n.length,!0),s.setUint16(c+10,n.length,!0),s.setUint32(c+12,i,!0),s.setUint32(c+16,l,!0),s.setUint16(c+20,0,!0),o}function s(e){let t=e.data||[],i=0;for(let e of t)e&&e.length>i&&(i=e.length);let a=e[`!cols`]||e.cols||[],o=``;a.length>0?o=`<cols>`+a.map((e,t)=>{let n=e?.wch?Math.max(e.wch,8):12;return`<col min="${t+1}" max="${t+1}" width="${n}" customWidth="1"/>`}).join(``)+`</cols>`:i>0&&(o=`<cols>`+Array.from({length:i},(e,t)=>`<col min="${t+1}" max="${t+1}" width="15" customWidth="1"/>`).join(``)+`</cols>`);let s=`<sheetData>`;for(let e=0;e<t.length;e++){let i=t[e]||[],a=e+1,o=a===1,c=`<row r="${a}">`;for(let e=0;e<i.length;e++){let t=i[e],s=`${r(e)}${a}`,l=o?` s="1"`:``;if(t==null||t===``)c+=`<c r="${s}"${l}/>`;else if(typeof t==`number`&&!isNaN(t))c+=`<c r="${s}"${l} t="n"><v>${t}</v></c>`;else if(typeof t==`boolean`)c+=`<c r="${s}"${l} t="b"><v>${+!!t}</v></c>`;else{let e=n(String(t));c+=`<c r="${s}"${l} t="inlineStr"><is><t>${e}</t></is></c>`}}c+=`</row>`,s+=c}return s+=`</sheetData>`,`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${o}
  ${s}
</worksheet>`}var c=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="10"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E293B"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;function l(e){let t=new TextEncoder,r=[],i=e.SheetNames.length>0?e.SheetNames:[`Sheet1`],a=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;for(let e=0;e<i.length;e++)a+=`\n  <Override PartName="/xl/worksheets/sheet${e+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;a+=`
</Types>`,r.push({path:`[Content_Types].xml`,data:t.encode(a)}),r.push({path:`_rels/.rels`,data:t.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)});let l=`<sheets>`;for(let e=0;e<i.length;e++){let t=n(i[e].replace(/[\[\]:*?/\\]/g,``).slice(0,31)||`Sheet${e+1}`);l+=`<sheet name="${t}" sheetId="${e+1}" r:id="rId${e+1}"/>`}l+=`</sheets>`;let u=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${l}
</workbook>`;r.push({path:`xl/workbook.xml`,data:t.encode(u)});let d=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;for(let e=0;e<i.length;e++)d+=`\n  <Relationship Id="rId${e+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${e+1}.xml"/>`;d+=`
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,r.push({path:`xl/_rels/workbook.xml.rels`,data:t.encode(d)}),r.push({path:`xl/styles.xml`,data:t.encode(c)});for(let n=0;n<i.length;n++){let a=i[n],o=s(e.Sheets[a]||{data:[]});r.push({path:`xl/worksheets/sheet${n+1}.xml`,data:t.encode(o)})}return o(r)}function u(e,t=`export.xlsx`){let n=l(e),r=new Blob([n],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=t.endsWith(`.xlsx`)?t:`${t}.xlsx`,document.body.appendChild(a),a.click(),document.body.removeChild(a),setTimeout(()=>URL.revokeObjectURL(i),1e3)}var d={book_new:()=>({SheetNames:[],Sheets:{}}),aoa_to_sheet:e=>({data:e||[],cols:e&&e.length>0?e[0].map(e=>({wch:Math.max(String(e??``).length+3,12)})):[]}),json_to_sheet:e=>{if(!e||e.length===0)return{data:[]};let t=Object.keys(e[0]);return{data:[t,...e.map(e=>t.map(t=>e[t]??``))],cols:t.map(e=>({wch:Math.max(e.length+3,14)})),"!cols":t.map(e=>({wch:Math.max(e.length+3,14)}))}},book_append_sheet:(e,t,n=`Sheet1`)=>{let r=n.replace(/[\[\]:*?/\\]/g,``).slice(0,31)||`Sheet${e.SheetNames.length+1}`;t.name=r,e.SheetNames.includes(r)||e.SheetNames.push(r),e.Sheets[r]=t}},f=u,p=e=>l(e),m={utils:d,writeFile:f,write:p,generateXlsxBuffer:l,downloadXlsx:u};export{f as n,t as r,d as t};
//# sourceMappingURL=xlsx-CE8xGrpF.js.map