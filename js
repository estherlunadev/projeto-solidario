"use strict";
(() => {
 const $ = s => document.querySelector(s);
 const $$ = s => [...document.querySelectorAll(s)];
 const keys = {users:"ps_users", donations:"ps_donations", schedules:"ps_schedules", session:"ps_session", theme:"ps_theme"};
 const read = k => { try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return []} };
 const save = (k,v) => localStorage.setItem(k,JSON.stringify(v));
 function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.classList.toggle("error",error);t.style.display="block";clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display="none",3500)}
 function showScreen(id){
   const target=document.getElementById(id)||$("#inicio");
   $$(".screen").forEach(s=>s.classList.toggle("active",s===target));
   $$("nav a[data-screen]").forEach(a=>a.classList.toggle("active",a.dataset.screen===target.id));
   if(location.hash!=="#"+target.id) history.replaceState(null,"","#"+target.id);
   window.scrollTo({top:0,behavior:"smooth"});
   updateDashboard();
 }
 function route(){showScreen((location.hash||"#inicio").slice(1))}
 window.addEventListener("hashchange",route);
 $$("a[href^='#']").forEach(a=>a.addEventListener("click",()=>{const id=a.getAttribute("href").slice(1);setTimeout(()=>showScreen(id),0)}));

 function setTheme(dark){document.body.classList.toggle("dark",dark);$("#themeBtn").textContent=dark?"☀ Tema claro":"☾ Tema escuro";localStorage.setItem(keys.theme,dark?"escuro":"claro")}
 setTheme(localStorage.getItem(keys.theme)==="escuro");
 $("#themeBtn").addEventListener("click",()=>setTheme(!document.body.classList.contains("dark")));


 $("#registerForm").addEventListener("submit",e=>{
   e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;
   const d=Object.fromEntries(new FormData(f).entries());
   if(d.senha!==d.confirmarSenha){toast("As senhas não coincidem.",true);return}
   const users=read(keys.users);
   if(users.some(u=>u.email.toLowerCase()===d.email.toLowerCase())){toast("Este e-mail já está cadastrado.",true);return}
   users.push({nome:d.nome,email:d.email,senha:d.senha,tipo:d.tipo,telefone:d.telefone});save(keys.users,users);
   toast("Cadastro realizado neste navegador!");f.reset();showScreen("login");
 });

 $("#loginForm").addEventListener("submit",e=>{
   e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
   const user=read(keys.users).find(u=>u.email.toLowerCase()===d.email.toLowerCase()&&u.senha===d.senha);
   if(!user){toast("Cadastro não encontrado ou senha incorreta. Faça seu cadastro primeiro.",true);return}
   localStorage.setItem(keys.session,JSON.stringify({nome:user.nome,email:user.email}));
   toast("Login realizado. Olá, "+user.nome+"!");showScreen("dashboard");
 });


 $("#donationForm").addEventListener("submit",e=>{
   e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;
   const d=Object.fromEntries(new FormData(f).entries());d.id=Date.now();d.status="Disponível";
   const list=read(keys.donations);list.push(d);save(keys.donations,list);
   toast("Doação cadastrada com sucesso!");f.reset();$("#previewFotos").replaceChildren();updateDashboard();showScreen("itens");
 });


 $("#fotos").addEventListener("change",e=>{
   const area=$("#previewFotos");area.replaceChildren();
   [...e.target.files].filter(f=>f.type.startsWith("image/")).forEach(file=>{
     const img=document.createElement("img");img.alt="Prévia "+file.name;img.style.cssText="width:100px;height:90px;object-fit:cover;border-radius:9px;margin:8px 8px 0 0";
     const reader=new FileReader();reader.onload=()=>img.src=reader.result;reader.readAsDataURL(file);area.appendChild(img);
   });
 });


 $("#searchItems").addEventListener("input",e=>{
   const term=e.target.value.toLocaleLowerCase("pt-BR");let visible=0;
   $$(".donation-item").forEach(card=>{const show=(card.dataset.search+" "+card.textContent).toLocaleLowerCase("pt-BR").includes(term);card.hidden=!show;if(show)visible++});
   $("#noResults").hidden=visible>0;
 });


 $$(".detailBtn").forEach(btn=>btn.addEventListener("click",()=>{
   $("#detailName").textContent=btn.dataset.name;$("#detailCategory").textContent=btn.dataset.category;$("#detailState").textContent=btn.dataset.state;$("#detailDescription").textContent=btn.dataset.description;
   $("#itemAgendado").value=btn.dataset.name;showScreen("detalhes");
 }));


 $("#scheduleForm").addEventListener("submit",e=>{
   e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;
   const d=Object.fromEntries(new FormData(f).entries());d.id=Date.now();d.status="Agendado";
   const list=read(keys.schedules);list.push(d);save(keys.schedules,list);
   toast("Coleta agendada com sucesso!");f.reset();$("#doador").value="João Silva";$("#itemAgendado").value=$("#detailName").textContent;updateDashboard();showScreen("historico");
 });

 function updateDashboard(){
   const donations=read(keys.donations),schedules=read(keys.schedules),users=read(keys.users);
   $("#countDonations").textContent=donations.length;$("#dashDonations").textContent=donations.length;$("#dashSchedules").textContent=schedules.length;
   $("#adminDonations").textContent=donations.length;$("#adminSchedules").textContent=schedules.length;$("#adminUsers").textContent=users.length;
   const session=JSON.parse(localStorage.getItem(keys.session)||"null");$("#dashUser").textContent=session?.nome||"Visitante";
   const rows=[];
   donations.forEach(d=>rows.push({nome:d.item||"Doação",info:(d.categoria||"—")+" · "+new Date(d.id).toLocaleDateString("pt-BR"),tipo:"Doação",status:d.status||"Disponível"}));
   schedules.forEach(d=>rows.push({nome:d.item+" / "+d.doador,info:(d.data||"")+" "+(d.horario||""),tipo:"Coleta",status:d.status||"Agendado"}));
   $("#historyBody").replaceChildren();
   if(!rows.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=4;td.textContent="Ainda não há registros. Cadastre uma doação ou agendamento para visualizar aqui.";tr.appendChild(td);$("#historyBody").appendChild(tr)}
   else rows.reverse().forEach(r=>{const tr=document.createElement("tr");[r.nome,r.info,r.tipo,r.status].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});$("#historyBody").appendChild(tr)});
 }
 $("#exportData").addEventListener("click",()=>{
   const data={usuarios:read(keys.users),doacoes:read(keys.donations),agendamentos:read(keys.schedules)};
   const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="ponte-solidaria-dados.json";a.click();URL.revokeObjectURL(url);toast("Arquivo de dados exportado.");
 });
 $("#logout").addEventListener("click",()=>{localStorage.removeItem(keys.session);toast("Sessão encerrada.");showScreen("inicio")});
 $("#year").textContent=new Date().getFullYear();
 const today=new Date();$("#dataColeta").min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
 $("#backTop").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
 window.addEventListener("scroll",()=>$("#backTop").style.display=window.scrollY>250?"block":"none");
 updateDashboard();route();
})();
