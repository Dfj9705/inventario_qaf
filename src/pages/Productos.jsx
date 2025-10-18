import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Productos(){
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({sku:"",nombre:"",precio:0});
  useEffect(()=>{ api.get("/productos").then(r=>setItems(r.data)); },[]);
  async function crear(e){
    e.preventDefault();
    const {data}=await api.post("/productos",form);
    setItems([data,...items]); setForm({sku:"",nombre:"",precio:0});
  }
  return (
    <div className="p-4">
      <h2>Productos</h2>
      <form onSubmit={crear}>
        <input placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/>
        <input type="number" step="0.01" placeholder="Precio" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})}/>
        <button>Guardar</button>
      </form>
      <ul>{items.map(p=><li key={p.id}>{p.sku} — {p.nombre} Q{p.precio}</li>)}</ul>
    </div>
  );
}
