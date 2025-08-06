// Stake Engine RGS API Integration

export interface StakeConfig {
  sessionID: string;
  rgsUrl: string;
  lang: string;
  device: 'mobile' | 'desktop';
}

export interface Balance {
  amount: number; // Amount in micro-units (6 decimal places)
  currency: string;
}

export interface GameConfig {
  minBet: number;
  maxBet: number;
  stepBet: number;
  defaultBetLevel: number;
  betLevels: number[];
  jurisdiction: {
    socialCasino: boolean;
    disabledFullscreen: boolean;
    disabledTurbo: boolean;
  };
}

export interface AuthenticateResponse {
  balance: Balance;
  config: GameConfig;
  round?: any;
}

export interface PlayRequest {
  amount: number;
  sessionID: string;
  mode: string; // 'BASE' for our game
}

export interface PlayResponse {
  balance: Balance;
  round: any;
}

export interface EndRoundResponse {
  balance: Balance;
}

export interface GameEvent {
  sessionID: string;
  event: string;
}

class StakeAPI {
  private config: StakeConfig;
  private baseUrl: string;

  constructor() {
    // Get configuration from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    this.config = {
      sessionID: urlParams.get('sessionID') || 'demo-session',
      rgsUrl: urlParams.get('rgs_url') || 'http://localhost:3001',
      lang: urlParams.get('lang') || 'en',
      device: (urlParams.get('device') as 'mobile' | 'desktop') || 'desktop'
    };

    this.baseUrl = this.config.rgsUrl;
    
    console.log('Stake API initialized with config:', this.config);
  }

  /**
   * Convert display amount to micro-units (6 decimal places)
   * Example: $1.00 -> 1000000
   */
  public toMicroUnits(amount: number): number {
    return Math.round(amount * 1000000);
  }

  /**
   * Convert micro-units to display amount
   * Example: 1000000 -> $1.00
   */
  public fromMicroUnits(microAmount: number): number {
    return microAmount / 1000000;
  }

  /**
   * Authenticate session with RGS
   */
  async authenticate(): Promise<AuthenticateResponse> {
    try {
      console.log('Authenticating session with RGS...');
      
      const response = await fetch(`${this.baseUrl}/wallet/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: this.config.sessionID
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data: AuthenticateResponse = await response.json();
      console.log('Authentication successful:', data);
      
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      // Return demo data for development
      return this.getDemoAuthData();
    }
  }

  /**
   * Get current player balance
   */
  async getBalance(): Promise<Balance> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: this.config.sessionID
        })
      });

      if (!response.ok) {
        throw new Error(`Balance request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Balance request error:', error);
      return { amount: 1000000000, currency: 'USD' }; // Demo: $1000
    }
  }

  /**
   * Play a round - debit bet amount and get game result
   */
  async play(betAmount: number): Promise<PlayResponse> {
    try {
      console.log('Playing round with bet:', this.fromMicroUnits(betAmount));
      
      const response = await fetch(`${this.baseUrl}/wallet/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: betAmount,
          sessionID: this.config.sessionID,
          mode: 'BASE'
        })
      });

      if (!response.ok) {
        throw new Error(`Play request failed: ${response.status}`);
      }

      const data: PlayResponse = await response.json();
      console.log('Play response received:', data);
      
      return data;
    } catch (error) {
      console.error('Play request error:', error);
      // Return demo game result
      return this.getDemoPlayResult(betAmount);
    }
  }

  /**
   * End the current round - triggers payout
   */
  async endRound(): Promise<EndRoundResponse> {
    try {
      console.log('Ending current round...');
      
      const response = await fetch(`${this.baseUrl}/wallet/endround`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: this.config.sessionID
        })
      });

      if (!response.ok) {
        throw new Error(`End round failed: ${response.status}`);
      }

      const data: EndRoundResponse = await response.json();
      console.log('Round ended successfully:', data);
      
      return data;
    } catch (error) {
      console.error('End round error:', error);
      return { balance: { amount: 1000000000, currency: 'USD' } };
    }
  }

  /**
   * Track game events
   */
  async trackEvent(event: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/bet/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: this.config.sessionID,
          event: event
        })
      });
    } catch (error) {
      console.error('Event tracking error:', error);
    }
  }

  /**
   * Demo authentication data for development
   */
  private getDemoAuthData(): AuthenticateResponse {
    return {
      balance: {
        amount: 1000000000, // $1000
        currency: 'USD'
      },
      config: {
        minBet: 100000, // $0.10
        maxBet: 10000000000, // $10,000
        stepBet: 100000, // $0.10
        defaultBetLevel: 1000000, // $1.00
        betLevels: [
          100000,   // $0.10
          200000,   // $0.20
          500000,   // $0.50
          1000000,  // $1.00
          2000000,  // $2.00
          5000000,  // $5.00
          10000000, // $10.00
          20000000, // $20.00
          50000000, // $50.00
          100000000 // $100.00
        ],
        jurisdiction: {
          socialCasino: false,
          disabledFullscreen: false,
          disabledTurbo: false
        }
      }
    };
  }

  /**
   * Demo play result for development
   */
  private getDemoPlayResult(betAmount: number): PlayResponse {
    // Simulate game outcome using existing shuffle math
    const multiplierZones = [0, 1000, 0, 500, 100, 25, 10, 5, 1, 0, 0, 0]; // Skip DROP zone
    const randomZone = Math.floor(Math.random() * multiplierZones.length);
    const multiplier = multiplierZones[randomZone];
    const winAmount = betAmount * multiplier;

    return {
      balance: {
        amount: 1000000000 - betAmount + winAmount, // Updated balance
        currency: 'USD'
      },
      round: {
        id: `round-${Date.now()}`,
        betAmount: betAmount,
        winAmount: winAmount,
        multiplier: multiplier,
        finalPosition: randomZone,
        completed: winAmount === 0 // Round is completed if no win (no endRound needed)
      }
    };
  }

  /**
   * Get configuration
   */
  public getConfig(): StakeConfig {
    return { ...this.config };
  }
}

export const stakeAPI = new StakeAPI();
