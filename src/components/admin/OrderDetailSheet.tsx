import { Order } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Scale, 
  CreditCard,
  Truck,
  Calendar,
  Hash
} from "lucide-react";

interface OrderDetailSheetProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value?: number, currency?: string) => {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: currency || "USD" 
  }).format(value);
};

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
  if (!order) return null;

  const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? order.totalQuantity ?? 0;
  const totalWeight = order.items?.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0) ?? order.totalWeight ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Order {order.orderId}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant={order.status === "SHIPPED" ? "default" : "secondary"}>
              {order.status || "NEW"}
            </Badge>
            {order.hasLabel && <Badge variant="outline">Label Generated</Badge>}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Customer Information
            </h3>
            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.email}`} className="text-primary hover:underline">
                  {order.email}
                </a>
              </div>
              {order.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.phone}`} className="text-primary hover:underline">
                    {order.phone}
                  </a>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Shipping Address */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Shipping Address
            </h3>
            <div className="space-y-2 bg-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {order.shippingAddress?.name && (
                    <p className="font-medium">{order.shippingAddress.name}</p>
                  )}
                  {order.shippingAddress?.line1 && <p>{order.shippingAddress.line1}</p>}
                  {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {[
                      order.shippingAddress?.city,
                      order.shippingAddress?.state,
                      order.shippingAddress?.postal_code
                    ].filter(Boolean).join(", ")}
                  </p>
                  <p>{order.shippingAddress?.country || "US"}</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Order Items */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} {item.weight ? `• ${item.weight}oz each` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity, order.currency)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No item details available</p>
              )}
            </div>
          </section>

          <Separator />

          {/* Order Summary */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Order Summary
            </h3>
            <div className="space-y-2 bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Total Quantity</span>
                </div>
                <span className="font-medium">{totalQty} items</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scale className="h-4 w-4" />
                  <span>Total Weight</span>
                </div>
                <span className="font-medium">{totalWeight > 0 ? `${totalWeight} oz` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Shipping Method</span>
                </div>
                <span className="font-medium">{order.shippingMethod || "Standard"}</span>
              </div>
              <Separator className="my-2" />
              {order.subtotal !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
              )}
              {order.shippingCost !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shippingCost, order.currency)}</span>
                </div>
              )}
              {order.taxAmount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.taxAmount, order.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Total</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(order.total, order.currency)}
                </span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Shipping & Tracking */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Shipping & Tracking
            </h3>
            <div className="space-y-2 bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order Date</span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy h:mm a") : "—"}
                </span>
              </div>
              {order.trackingId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tracking ID</span>
                  <Badge variant="outline">{order.trackingId}</Badge>
                </div>
              )}
              {order.labelGeneratedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Label Generated</span>
                  <span>{format(new Date(order.labelGeneratedAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Order Notes
                </h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm">{order.notes}</p>
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
