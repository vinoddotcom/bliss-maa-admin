import ProductForm from "@/components/ProductForm";
import Layout from "@/components/Layout";

export default function NewProduct() {
  return (
    <Layout>
      <span className="text-2xl font-bold">New Product</span>
      <ProductForm />
    </Layout>
  );
}