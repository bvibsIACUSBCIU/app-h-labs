export type TabState = 'war_room' | 'kol_portal' | 'bounty_hall' | 'academy' | 'fund';

export interface TechCase {
    title: string;
    desc: string;
    tech: string[];
    impact: string;
}

export interface MediaCategory {
    name: string;
    channels: any[];
}

export interface AirdropItem {
    id: string;
    name: string;
    ticker: string;
    amount: string;
    value: string;
    progress: number;
    status: string;
}

export interface CourseCategory {
    category: string;
    level: string;
    items: string[];
}

export interface IntelItem {
    id: string;
    time: string;
    source: string;
    content: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    impactLevel: 'High' | 'Medium' | 'Low';
}

export interface WhaleAlert {
    token: string;
    action: string;
    amount: string;
    value: string;
    walletLabel: string;
}

export interface BountyTask {
    id: string;
    title: string;
    project: string;
    reward: string;
    type: string;
    slots: number;
    filled: number;
    deadline: string;
}

export interface TrendingTopic {
    id: string;
    name: string;
    volume: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'FOMO';
    change: number;
    phase: string;
    context: string;
}

export interface SmartMoneyFlow {
    token: string;
    netFlow24h: string;
    entityName: string;
    entityType: string;
    signal: string;
}

export interface KOLBenefit {
    title: string;
    desc: string;
    iconType: string;
}

export interface MarketTicker {
    symbol: string;
    price: string;
    change: string;
    trend: 'up' | 'down';
}

export interface SectorData {
    name: string;
    change24h: number;
    leader: string;
    sentiment: string;
    flow: string;
}

export interface CexFlow {
    exchange: string;
    netFlow24h: string;
    status: string;
    topToken: string;
}

export interface DevActivity {
    project: string;
    commits: number;
    status: string;
}

export interface StablecoinMetric {
    name: string;
    supply: string;
    change: string;
}

export interface MediaPartner {
    name: string;
    logo: string;
}

export interface StrategicPartner {
    name: string;
    logo: string;
}
