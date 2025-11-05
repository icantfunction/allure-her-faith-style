import React from "react";
import { PublicAPI, AdminAPI } from "../../lib/api";
import { uploadWithPresign } from "../../lib/upload";

type Product = {
  productId: string;
  name: string;
  price: number;
  images?: string[];
  imageUrls?: string[];
};

export default function Products() {
  const [list, setList] = React.useState<Product[]>([]);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState<number>(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { 
    PublicAPI.listProducts().then(setList).catch(console.error); 
  }, []);

  async function create() {
    try {
      setBusy(true);
      let images: string[] = [];
      if (file) {
        const presign = await AdminAPI.presignImage(file.name, file.type || "application/octet-stream");
        await uploadWithPresign(presign.uploadUrl, file);
        images = [presign.key];
      }
      await AdminAPI.createProduct({ name, price, images });
      setName(""); setPrice(0); setFile(null);
      setList(await PublicAPI.listProducts());
      alert("Product created");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-wrap">
      <h1>Products</h1>
      <div className="admin-card">
        <h3>Create product</h3>
        <div className="admin-grid">
          <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input placeholder="Price" type="number" step="0.01" value={price} onChange={(e)=>setPrice(Number(e.target.value))}/>
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          <button disabled={busy || !name} onClick={create} className="admin-btn">Create</button>
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Current products</h3>
      <ul className="admin-list">
        {list.map(p=>(
          <li key={p.productId} className="admin-item">
            <div className="admin-name">{p.name}</div>
            <div>${p.price.toFixed(2)}</div>
            {p.imageUrls?.[0] && (<img src={p.imageUrls[0]} alt={p.name} style={{ width: 160, height: "auto", marginTop: 8 }}/>)}
          </li>
        ))}
      </ul>
    </div>
  );
}
