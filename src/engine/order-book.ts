import process from "node:process";
import { Order, Side, BookLevel, OrderBookSnapshot } from "../domain/types";

interface PriceQueue {
  orders: Order[];
  head: number;
}

export class OrderBoook {
  private bids = new Map<Number, PriceQueue>();
  private asks = new Map<Number, PriceQueue>();

  private orders = new Map<String, Order>();

  constructor(public readonly symbol: string) {}

  private getLevels(side: Side) {
    return side === "BUY" ? this.bids : this.asks;
  }

  add(order: Order): void {
    if (order.price === undefined) {
      throw new Error("Cannot rest a market order");
    }

    const levels = this.getLevels(order.side);

    let queue = levels.get(order.price);

    if (!queue) {
      queue = {
        orders: [],
        head: 0,
      };
      levels.set(order.price, queue);
    }

    queue.orders.push(order);
    this.orders.set(order.id,order);
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  remove(orderId: string): boolean {
    const order = this.orders.get(orderId);

    if(!order){
        return false;
    }

    // Mark the order inactive.
    // Queue compaction can happen later.
    order.remainingQuantity = 0;
    order.status = "CANCELLED";

    this.orders.delete(orderId);
    this.cleanEmptyLevels(order.side);

    return true;
  }

  getBestOrder(side: Side): Order | undefined {
    const levels = this.getLevels(side);

    const prices = [...levels.keys()];

    prices.sort((a: Number,b: Number) => {
        return side === "BUY" ?  b - a: a - b
    })

    for(const price of prices){
        const queue = levels.get(price)!;

        while(queue.head < queue.orders.length){
            const order = queue.orders[queue.head];

            if(order && order.remainingQuantity > 0 && order.status !== "CANCELLED"){
                return order;
            }

            queue.head++;
        }

        levels.delete(price);
    }

    return undefined;
  }

  private cleanEmptyLevels(side: Side): void{
    const levels = this.getLevels(side);

    for(const [price, queue] of levels){
        while(queue.head < queue.orders.length){
            const order = queue.orders[queue.head];

            if(order && order.remainingQuantity > 0 && order.status !== "CANCELLED"){
                break;
            }

            queue.head++;
        }

        if(queue.head > queue.orders.length) {
            levels.delete(price);
        }
    }
  }

  snapshot(): OrderBookSnapshot{
    const buildLevels = (levels: Map<number,PriceQueue>, descending: boolean): BookLevel[] => {
        return [...levels.entries()].map(([price, queue]) => {
            const activeOrders = queue.orders.slice(queue.head).filter(order => order.remainingQuantity > 0 && order.status !== "CANCELLED");

            return{
                price, quantity: activeOrders.reduce((sum, order) => sum + order.remainingQuantity, 0),
                orderCount: activeOrders.length,
            }
        }).filter(level => level.orderCount > 0).sort((a,b) => descending? b.price - a.price : a.price - b.price)
    }

    return{
        symbol: this.symbol,
        bids: buildLevels(this.bids, true),
        asks: buildLevels(this.asks, false)
    }
  }
}
