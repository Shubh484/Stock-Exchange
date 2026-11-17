export type Side = "BUY" | "SELL";

export type OrderType = "LIMIT" | "MARKET";

export type OrderStatus =
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

export interface NewOrder {
  symbol: string;
  side: Side;
  type: OrderType;
  quantity: Number;
  price?: Number;
}

export interface Order {
  id: string;
  sequence: number;
  symbol: string;
  side: Side;
  type: OrderType;
  price?: number;
  originalQuantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Trade{
    id: string;
    symbol: string;
    price: number;
    quantity: number;
    buyOrderId: string;
    sellOrderId: string;
    sequence: number;
    executedAt: number;
}

export interface BookLevel{
    price: number;
    quantity: number;
    orderCount: number;
}

export interface OrderBookSnapshot{
    symbol: string;
    bids: BookLevel[];
    asks: BookLevel[];
}

export type EngineEvent =
  | {
      type: "ORDER_ACCEPTED";
      orderId: string;
      sequence: number;
    }
  | {
      type: "TRADE_EXECUTED";
      trade: Trade;
    }
  | {
      type: "ORDER_RESTED";
      orderId: string;
    }
  | {
      type: "ORDER_CANCELLED";
      orderId: string;
    }
  | {
      type: "ORDER_REJECTED";
      orderId: string;
      reason: string;
    };

export interface OrderResult{
    order: Order;
    trades: Trade[];
    events: EngineEvent[];
}