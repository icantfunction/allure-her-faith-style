import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-6">
          <h1 className="text-4xl font-heading font-semibold text-foreground">
            Return & Exchange Policy
          </h1>
          <p className="text-lg text-foreground/80">All sales are final.</p>
          <ul className="list-disc pl-5 space-y-3 text-foreground/80">
            <li>Exchanges accepted within 14 days of delivery (unused, original condition, tags attached).</li>
            <li>Damaged or incorrect items: Contact us within 7 days with a photo to arrange an exchange.</li>
            <li>Shipping for exchanges is the customer's responsibility unless the item was damaged or incorrect.</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReturnPolicy;
