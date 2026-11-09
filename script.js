(() => {
"use strict";
const STORAGE_KEY = "personalExpenseTracker.transactions.v1";
let transactions = loadTransactions(), activeFilter = "all", editingId = null, toastTimer;
const $ = selector => document.querySelector(selector);
const form = $("#transactionForm"), titleInput = $("#title"), amountInput = $("#amount");
const categoryInput = $("#category"), dateInput = $("#date"), list = $("#transactionList");
const emptyState = $("#emptyState"), searchInput = $("#searchInput"), toast = $("#toast");
$("#currentYear").textContent = new Date().getFullYear();
dateInput.value = localDateString(new Date());

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter(x => x && typeof x.id === "string" && typeof x.title === "string" &&
      Number.isFinite(x.amount) && x.amount > 0 && ["income","expense"].includes(x.type) &&
      typeof x.category === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.date));
  } catch (error) { console.error("Unable to load saved transactions", error); return []; }
}
function saveTransactions() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); return true; }
  catch (error) { console.error(error); showToast("Could not save data. Check browser storage settings."); return false; }
}
function money(value) {
  return new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT",minimumFractionDigits:2}).format(value);
}
function displayDate(value) {
  const [y,m,d] = value.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}
function showToast(message) {
  toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"),2600);
}
function setError(field,message="") {
  const error = $(`#${field}Error`); if (error) error.textContent = message;
  const input = $(`#${field}`); if (input) input.setAttribute("aria-invalid",message ? "true":"false");
}
function clearErrors() { ["title","amount","category","date"].forEach(field => setError(field)); }
function selectedType() { return $('input[name="type"]:checked')?.value || "income"; }
function updateDashboard() {
  const income = transactions.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0);
  const expenses = transactions.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
  $("#totalIncome").textContent = money(income);
  $("#totalExpenses").textContent = money(expenses);
  $("#currentBalance").textContent = money(income-expenses);
  $("#transactionCount").textContent = `${transactions.length} transaction${transactions.length===1?"":"s"}`;
}
function cell(text,className="") { const td=document.createElement("td"); if(className)td.className=className; td.textContent=text; return td; }
function renderTransactions() {
  const query=searchInput.value.trim().toLocaleLowerCase();
  const filtered=transactions.filter(x=>(activeFilter==="all"||x.type===activeFilter)&&x.title.toLocaleLowerCase().includes(query))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  list.replaceChildren(); emptyState.classList.toggle("visible",filtered.length===0);
  if(!filtered.length) {
    const has=transactions.length>0;
    $("#emptyTitle").textContent=has?"No matching transactions":"No transactions yet";
    $("#emptyMessage").textContent=has?"Try another filter or search term.":"Add your first income or expense to see it here.";
  }
  filtered.forEach(item=>{
    const row=document.createElement("tr"), title=cell(item.title,"transaction-name"); title.title=item.title;
    const categoryCell=document.createElement("td"), category=document.createElement("span");
    category.className="category-tag"; category.textContent=item.category; categoryCell.append(category);
    const typeCell=document.createElement("td"), type=document.createElement("span");
    type.className=`type-tag ${item.type}`; type.textContent=item.type==="income"?"Income":"Expense"; typeCell.append(type);
    const amount=cell(`${item.type==="income"?"+":"-"}${money(item.amount)}`,item.type==="income"?"amount-income":"amount-expense");
    const actionsCell=document.createElement("td"), actions=document.createElement("div"); actions.className="row-actions";
    const edit=document.createElement("button"); edit.type="button"; edit.className="action-button"; edit.textContent="Edit";
    edit.setAttribute("aria-label",`Edit ${item.title}`); edit.addEventListener("click",()=>beginEdit(item.id));
    const del=document.createElement("button"); del.type="button"; del.className="action-button delete"; del.textContent="Delete";
    del.setAttribute("aria-label",`Delete ${item.title}`); del.addEventListener("click",()=>deleteTransaction(item.id));
    actions.append(edit,del); actionsCell.append(actions);
    row.append(title,categoryCell,cell(displayDate(item.date)),typeCell,amount,actionsCell); list.append(row);
  });
  updateDashboard(); renderMonthlySummary();
}
function renderMonthlySummary() {
  const container=$("#monthlySummary"); container.replaceChildren(); const totals={};
  transactions.filter(x=>x.type==="expense").forEach(x=>{const key=x.date.slice(0,7);totals[key]=(totals[key]||0)+x.amount;});
  const months=Object.keys(totals).sort().reverse().slice(0,8);
  if(!months.length){const p=document.createElement("p");p.className="monthly-empty";p.textContent="No monthly expense data yet.";container.append(p);return;}
  months.forEach(key=>{
    const [year,month]=key.split("-").map(Number), name=new Date(year,month-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});
    const card=document.createElement("div");card.className="month-card";const label=document.createElement("span");label.textContent=name;
    const value=document.createElement("strong");value.textContent=money(totals[key]);card.append(label,value);container.append(card);
  });
}
function validate(data) {
  clearErrors(); let valid=true;
  if(!data.title){setError("title","Please enter a transaction title.");valid=false;}
  if(!Number.isFinite(data.amount)||data.amount<=0){setError("amount","Enter an amount greater than zero.");valid=false;}
  if(!data.category){setError("category","Please select a category.");valid=false;}
  if(!data.date){setError("date","Please select a date.");valid=false;}
  else if(data.date>localDateString(new Date())){setError("date","Future dates are not allowed.");valid=false;}
  return valid;
}
function resetForm() {
  editingId=null;form.reset();dateInput.value=localDateString(new Date());
  $('input[name="type"][value="income"]').checked=true;$("#formHeading").textContent="Add transaction";
  $("#submitBtn").textContent="＋ Add transaction";$("#cancelEditBtn").classList.add("hidden");clearErrors();
}
form.addEventListener("submit",event=>{
  event.preventDefault();
  const data={title:titleInput.value.trim(),amount:Number(amountInput.value),type:selectedType(),category:categoryInput.value,date:dateInput.value};
  if(!validate(data)){form.querySelector('[aria-invalid="true"]')?.focus();return;}
  if(editingId){
    const old=transactions;transactions=transactions.map(x=>x.id===editingId?{...x,...data}:x);
    if(!saveTransactions()){transactions=old;return;}
    resetForm();renderTransactions();showToast("Transaction updated successfully.");
  }else{
    const item={id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,...data};
    transactions.push(item);if(!saveTransactions()){transactions=transactions.filter(x=>x.id!==item.id);return;}
    resetForm();renderTransactions();showToast("Transaction added successfully.");
  }
});
function beginEdit(id) {
  const item=transactions.find(x=>x.id===id);if(!item)return;editingId=id;
  titleInput.value=item.title;amountInput.value=item.amount;categoryInput.value=item.category;dateInput.value=item.date;
  $(`input[name="type"][value="${item.type}"]`).checked=true;$("#formHeading").textContent="Edit transaction";
  $("#submitBtn").textContent="Save changes";$("#cancelEditBtn").classList.remove("hidden");clearErrors();
  $("#add-transaction").scrollIntoView({behavior:"smooth",block:"start"});titleInput.focus({preventScroll:true});
}
function deleteTransaction(id) {
  const item=transactions.find(x=>x.id===id);if(!item)return;
  if(!window.confirm(`Delete "${item.title}"? This action cannot be undone.`))return;
  const previous=transactions;transactions=transactions.filter(x=>x.id!==id);
  if(!saveTransactions()){transactions=previous;return;}if(editingId===id)resetForm();
  renderTransactions();showToast("Transaction deleted successfully.");
}
$("#cancelEditBtn").addEventListener("click",resetForm);
$("#addNewBtn").addEventListener("click",()=>{$("#add-transaction").scrollIntoView({behavior:"smooth",block:"start"});titleInput.focus({preventScroll:true});});
searchInput.addEventListener("input",renderTransactions);
document.querySelectorAll(".filter-button").forEach(button=>button.addEventListener("click",()=>{
  activeFilter=button.dataset.filter;document.querySelectorAll(".filter-button").forEach(item=>{
    const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));
  });renderTransactions();
}));
document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",()=>{
  document.querySelectorAll(".nav-link").forEach(item=>item.classList.remove("active"));link.classList.add("active");
}));
renderTransactions();
})();
