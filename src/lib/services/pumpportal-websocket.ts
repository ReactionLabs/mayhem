/**
 * PumpPortal WebSocket Service
 * Real-time data streaming from PumpPortal API
 * Reference: https://pumpportal.fun/data-api/real-time
 * 
 * Supports:
 * - New token creation events (Pump.fun & Bonk)
 * - Token trade events
 * - Account trade events
 * - Migration events
 */

const WS_URL = 'wss://pumpportal.fun/api/data';

export type PumpTokenCreateEvent = {
  txType: 'create';
  mint: string;
  traderPublicKey: string;
  name: string;
  symbol: string;
  uri: string;
  initialBuy: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  pool?: 'pump' | 'bonk'; // Pool type
};

export type PumpTradeEvent = {
  txType: 'buy' | 'sell';
  mint: string;
  traderPublicKey: string;
  tokenAmount: number;
  solAmount: number;
  newTokenBalance: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
};

export type PumpMigrationEvent = {
  txType: 'migration';
  mint: string;
  // Add other migration fields as needed
};

export type PumpWebSocketEvent = PumpTokenCreateEvent | PumpTradeEvent | PumpMigrationEvent;

export type TokenFilter = {
  minMarketCap?: number; // In SOL
  maxMarketCap?: number; // In SOL
  minVolume?: number; // In SOL
  minInitialBuy?: number; // In SOL
  pool?: 'pump' | 'bonk' | 'all';
  minBondingCurve?: number; // Percentage (0-100)
  maxBondingCurve?: number; // Percentage (0-100)
  searchTerm?: string; // Name or symbol search
  createdAfter?: Date; // Only show tokens created after this date
  createdBefore?: Date; // Only show tokens created before this date
};

export class PumpPortalWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isManualClose = false;
  
  // Subscriptions
  private subscribedToNewTokens = false;
  private subscribedToMigrations = false;
  private subscribedTokenMints = new Set<string>();
  private subscribedAccounts = new Set<string>();

  // Event handlers
  private onTokenCreate: ((event: PumpTokenCreateEvent) => void) | null = null;
  private onTrade: ((event: PumpTradeEvent) => void) | null = null;
  private onMigration: ((event: PumpMigrationEvent) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onConnect: (() => void) | null = null;
  private onDisconnect: (() => void) | null = null;

  constructor() {
    // Auto-connect on instantiation
    this.connect();
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.isManualClose) return;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PumpPortal WS] Connected');
        }
        this.reconnectAttempts = 0;
        this.onConnect?.();

        // Resubscribe to all active subscriptions
        this.resubscribe();
      };

      this.ws.onclose = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PumpPortal WS] Disconnected');
        }
        this.onDisconnect?.();

        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30 seconds
          );
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), delay);
        }
      };

      this.ws.onerror = (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[PumpPortal WS] Error:', error);
        }
        this.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.txType === 'create') {
            this.onTokenCreate?.(data as PumpTokenCreateEvent);
          } else if (data.txType === 'buy' || data.txType === 'sell') {
            this.onTrade?.(data as PumpTradeEvent);
          } else if (data.txType === 'migration') {
            this.onMigration?.(data as PumpMigrationEvent);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[PumpPortal WS] Parse error:', error);
          }
        }
      };
    } catch (error) {
      this.onError?.(error as Error);
    }
  }

  private resubscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.subscribedToNewTokens) {
      this.ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
    }

    if (this.subscribedToMigrations) {
      this.ws.send(JSON.stringify({ method: 'subscribeMigration' }));
    }

    if (this.subscribedTokenMints.size > 0) {
      this.ws.send(JSON.stringify({
        method: 'subscribeTokenTrade',
        keys: Array.from(this.subscribedTokenMints),
      }));
    }

    if (this.subscribedAccounts.size > 0) {
      this.ws.send(JSON.stringify({
        method: 'subscribeAccountTrade',
        keys: Array.from(this.subscribedAccounts),
      }));
    }
  }

  // Subscription methods
  subscribeNewTokens() {
    this.subscribedToNewTokens = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
    }
  }

  unsubscribeNewTokens() {
    this.subscribedToNewTokens = false;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'unsubscribeNewToken' }));
    }
  }

  subscribeMigrations() {
    this.subscribedToMigrations = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'subscribeMigration' }));
    }
  }

  unsubscribeMigrations() {
    this.subscribedToMigrations = false;
    // Note: There's no unsubscribeMigration method in the API docs, but we track it
  }

  subscribeTokenTrades(mints: string[]) {
    mints.forEach(mint => this.subscribedTokenMints.add(mint));
    if (this.ws?.readyState === WebSocket.OPEN && mints.length > 0) {
      this.ws.send(JSON.stringify({
        method: 'subscribeTokenTrade',
        keys: mints,
      }));
    }
  }

  unsubscribeTokenTrades(mints: string[]) {
    mints.forEach(mint => this.subscribedTokenMints.delete(mint));
    if (this.ws?.readyState === WebSocket.OPEN && mints.length > 0) {
      this.ws.send(JSON.stringify({
        method: 'unsubscribeTokenTrade',
        keys: mints,
      }));
    }
  }

  subscribeAccountTrades(accounts: string[]) {
    accounts.forEach(account => this.subscribedAccounts.add(account));
    if (this.ws?.readyState === WebSocket.OPEN && accounts.length > 0) {
      this.ws.send(JSON.stringify({
        method: 'subscribeAccountTrade',
        keys: accounts,
      }));
    }
  }

  // Event handler setters
  setOnTokenCreate(handler: (event: PumpTokenCreateEvent) => void) {
    this.onTokenCreate = handler;
  }

  setOnTrade(handler: (event: PumpTradeEvent) => void) {
    this.onTrade = handler;
  }

  setOnMigration(handler: (event: PumpMigrationEvent) => void) {
    this.onMigration = handler;
  }

  setOnError(handler: (error: Error) => void) {
    this.onError = handler;
  }

  setOnConnect(handler: () => void) {
    this.onConnect = handler;
  }

  setOnDisconnect(handler: () => void) {
    this.onDisconnect = handler;
  }

  // Filter helper
  static matchesFilter(event: PumpTokenCreateEvent, filter: TokenFilter): boolean {
    const mcapSol = event.marketCapSol;
    const initialBuy = event.initialBuy;
    const bondingCurve = (mcapSol / 85) * 100; // Approximate bonding curve progress

    if (filter.minMarketCap && mcapSol < filter.minMarketCap) return false;
    if (filter.maxMarketCap && mcapSol > filter.maxMarketCap) return false;
    if (filter.minInitialBuy && initialBuy < filter.minInitialBuy) return false;
    if (filter.pool && filter.pool !== 'all' && event.pool !== filter.pool) return false;
    if (filter.minBondingCurve && bondingCurve < filter.minBondingCurve) return false;
    if (filter.maxBondingCurve && bondingCurve > filter.maxBondingCurve) return false;
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      if (!event.name.toLowerCase().includes(term) && 
          !event.symbol.toLowerCase().includes(term) &&
          !event.mint.toLowerCase().includes(term)) {
        return false;
      }
    }

    return true;
  }

  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

