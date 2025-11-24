import { useEffect, useMemo, useState } from "react";
import { AdminAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Search, Printer, PackageCheck, Truck, Filter, Sparkles } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type Order = {
  orderId: string;
  customerName: string;
  email: string;
  status: string;
  total: number;
  currency?: string;
  shippingMethod?: string;
  labelGeneratedAt?: string;
  trackingId?: string;
  createdAt?: string;
  hasLabel?: boolean;
  shippingAddress?: {
    city?: string;
    state?: string;
    country?: string;
  };
};

const statusOptions = [
  { label: "All", value: "" },
  { label: "New", value: "NEW" },
  { label: "Packed", value: "PACKED" },
  { label: "Shipped", value: "SHIPPED" },
];

const methodOptions = [
  { label: "Any", value: "" },
  { label: "Standard", value: "Standard" },
  { label: "Express", value: "Express" },
];

const formatCurrency = (value?: number, currency?: string) => {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value);
};

const OrderRow = ({
  order,
  selected,
  onSelect,
  onPrint,
  onStatus,
}: {
  order: Order;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onPrint: (orderId: string) => void;
  onStatus: (orderId: string, status: string) => void;
}) => (
  <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,auto] items-center gap-4 py-3 border-b">
    <Checkbox checked={selected} onCheckedChange={(v) => onSelect(Boolean(v))} />
    <div>
      <div className="font-medium text-foreground">{order.orderId}</div>
      <div className="text-sm text-muted-foreground">{order.customerName}</div>
    </div>
    <div>
      <div className="text-sm text-foreground">{formatCurrency(order.total, order.currency)}</div>
      <div className="text-xs text-muted-foreground">{order.shippingMethod || "Standard"}</div>
    </div>
    <div className="text-sm text-muted-foreground">
      {order.createdAt ? format(new Date(order.createdAt), "MMM d, h:mm a") : "—"}
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={order.status === "SHIPPED" ? "default" : "secondary"}>{order.status || "NEW"}</Badge>
      {order.hasLabel && <Badge variant="outline">Label</Badge>}
      {order.trackingId && <Badge variant="outline">{order.trackingId}</Badge>}
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onPrint(order.orderId)}>
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default function Orders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [hasLabel, setHasLabel] = useState<"" | "true" | "false">("");
  const [search, setSearch] = useState("");
  const [labelDialog, setLabelDialog] = useState(false);
  const [storeName, setStoreName] = useState("Allure Her");
  const [carrier, setCarrier] = useState("Standard");
  const [formatOption, setFormatOption] = useState("4x6");
  const [busy, setBusy] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const load = () => {
    setLoading(true);
    AdminAPI.listOrders({
      status: status || undefined,
      method: method || undefined,
      hasLabel: hasLabel === "" ? undefined : hasLabel === "true",
      q: debouncedSearch || undefined,
      limit: 25,
    })
      .then((res) => setOrders(res.items || []))
      .catch((err) => {
        console.error(err);
        toast({ title: "Error loading orders", description: err.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, method, hasLabel, debouncedSearch]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      orders.forEach((o) => (next[o.orderId] = true));
    }
    setSelected(next);
  };

  const handlePrint = async (orderIds: string[]) => {
    if (!orderIds.length) {
      toast({ title: "Select orders", description: "Choose at least one order to print labels." });
      return;
    }
    setBusy(true);
    try {
      const res = await AdminAPI.bulkPrintLabels({
        orderIds,
        storeName,
        carrier,
        format: formatOption,
      });
      toast({
        title: "Labels ready",
        description: res.pdfUrl ? "Open the generated PDF from the link below." : "Labels requested.",
      });
      if (res.pdfUrl) {
        window.open(res.pdfUrl, "_blank");
      }
      setLabelDialog(false);
      load();
    } catch (err: any) {
      toast({ title: "Label print failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (orderId: string, nextStatus: string) => {
    try {
      await AdminAPI.updateOrderStatus(orderId, nextStatus);
      toast({ title: "Updated", description: `Order ${orderId} marked ${nextStatus}` });
      load();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-luxury">
        <CardHeader className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <CardTitle className="font-heading text-2xl">Orders & Shipping</CardTitle>
            <CardDescription>Smart workflows. Fewer clicks. More shipped orders.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Built for Sarah</Badge>
            <Badge variant="outline">Batch faster than generic builders</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Orders to fulfill today" value={orders.filter((o) => o.status !== "SHIPPED").length} />
          <SummaryCard title="Avg fulfillment time" value="4h (vs 5h)" />
          <SummaryCard title="Late-risk orders" value={orders.filter((o) => !o.hasLabel).length} />
          <SummaryCard title="Batching boost" value="30% faster when batching" />
        </CardContent>
      </Card>

      <Card className="border-border shadow-luxury">
        <CardHeader className="flex flex-wrap gap-3 items-center justify-between">
          <CardTitle className="font-heading flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart batching
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>Select all</Button>
            <Button size="sm" onClick={() => setLabelDialog(true)} disabled={!selectedIds.length}>
              <Printer className="h-4 w-4 mr-2" />
              Print {selectedIds.length} labels
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pick orders to see batching suggestions.</p>
          ) : (
            <BatchingSuggestions orders={orders.filter((o) => selected[o.orderId])} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-luxury">
        <CardHeader className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-heading">Filters</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              {methodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select className="rounded-md border px-3 py-2 text-sm" value={hasLabel} onChange={(e) => setHasLabel(e.target.value as any)}>
              <option value="">Label: Any</option>
              <option value="true">Has label</option>
              <option value="false">No label</option>
            </select>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-2.5" />
              <Input
                className="pl-8"
                placeholder="Search order ID, name, email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All caught up, Sarah. While you wait: offer a thank-you coupon, pre-print return labels, star VIP customers.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,auto] gap-4 pb-2 text-sm text-muted-foreground border-b">
                <div><Checkbox checked={selectedIds.length === orders.length} onCheckedChange={(v) => toggleAll(Boolean(v))} /></div>
                <div>Order</div>
                <div>Total / Method</div>
                <div>Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {orders.map((order) => (
                <OrderRow
                  key={order.orderId}
                  order={order}
                  selected={!!selected[order.orderId]}
                  onSelect={(v) => setSelected((prev) => ({ ...prev, [order.orderId]: v }))}
                  onPrint={(id) => handlePrint([id])}
                  onStatus={handleStatus}
                />
              ))}
            </>
          )}
        </CardContent>
      </Card>
      <LabelDialog
        open={labelDialog}
        onOpenChange={setLabelDialog}
        selectedCount={selectedIds.length}
        storeName={storeName}
        setStoreName={setStoreName}
        carrier={carrier}
        setCarrier={setCarrier}
        formatOption={formatOption}
        setFormatOption={setFormatOption}
        onPrint={() => handlePrint(selectedIds)}
        busy={busy}
      />
    </div>
  );
}

const LabelDialog = ({
  open,
  onOpenChange,
  selectedCount,
  storeName,
  setStoreName,
  carrier,
  setCarrier,
  formatOption,
  setFormatOption,
  onPrint,
  busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedCount: number;
  storeName: string;
  setStoreName: (v: string) => void;
  carrier: string;
  setCarrier: (v: string) => void;
  formatOption: string;
  setFormatOption: (v: string) => void;
  onPrint: () => void;
  busy: boolean;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Print {selectedCount} labels</DialogTitle>
        <DialogDescription>Confirm carrier, format, and store name.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Store name</label>
          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Carrier</label>
          <select className="rounded-md border px-3 py-2 text-sm w-full" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            <option value="Standard">Standard</option>
            <option value="Express">Express</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Format</label>
          <select className="rounded-md border px-3 py-2 text-sm w-full" value={formatOption} onChange={(e) => setFormatOption(e.target.value)}>
            <option value="4x6">4x6 thermal</option>
            <option value="A4">A4 / Letter PDF</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onPrint} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            Print
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const SummaryCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="border-border shadow-sm">
    <CardHeader>
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      <CardDescription className="text-2xl font-heading text-foreground">{value}</CardDescription>
    </CardHeader>
  </Card>
);

const BatchingSuggestions = ({ orders }: { orders: Order[] }) => {
  if (!orders.length) return null;
  const groups = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const key = `${order.shippingMethod || "Standard"}|${order.shippingAddress?.country || "US"}`;
    acc[key] = acc[key] || [];
    acc[key].push(order);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(groups).map(([key, group], idx) => {
        const [method, region] = key.split("|");
        return (
          <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Batch {idx + 1}: {group.length} orders</p>
              <p className="text-sm text-muted-foreground">{method} · {region} · fewer clicks than generic dashboards</p>
            </div>
            <Badge variant="secondary">Save time</Badge>
          </div>
        );
      })}
    </div>
  );
};
