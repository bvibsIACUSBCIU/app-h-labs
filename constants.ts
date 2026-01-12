import { TechCase, MediaCategory, AirdropItem, CourseCategory, IntelItem, WhaleAlert, BountyTask, TrendingTopic, SmartMoneyFlow, KOLBenefit, MarketTicker, SectorData, CexFlow, DevActivity, StablecoinMetric, MediaPartner, StrategicPartner } from './types';

// --- NEW SUCCESS CASES (0 to 1 Battle Records) ---
export const successCases = [
  { name: "Nexus Chain", tag: "Infrastructure", growth: "200M TVL", desc: "Modular L2 built from scratch." },
  { name: "Panda Meme", tag: "Meme/Traffic", growth: "100x ROI", desc: "Viral marketing campaign, 50k holders." },
  { name: "RWA Gold", tag: "RWA", growth: "$50M AUM", desc: "Tokenized gold assets with legal compliance." },
  { name: "SwapX", tag: "DeFi", growth: "Top 5 DEX", desc: "Custom AMM solution with concentrated liquidity." },
  { name: "BetMarket", tag: "Prediction", growth: "20k Users", desc: "Decentralized prediction market platform." },
  { name: "SafeWallet", tag: "Tooling", growth: "1M Downloads", desc: "MPC-based non-custodial wallet." },
  { name: "GameVerse", tag: "GameFi", growth: "Top 1 on AppStore", desc: "Full-chain MMORPG incubation." },
  { name: "Alpha DAO", tag: "Community", growth: "10k Members", desc: "Paid research community setup." }
];

export const techCases: TechCase[] = [
  { title: "XOne Protocol", desc: "Cross-chain liquidity layer.", tech: ["Cosmos", "Rust"], impact: "$200M TVL" },
];

export const mediaChannels: MediaCategory[] = [];

export const airdropList: AirdropItem[] = [
  { id: 'a1', name: "Nexus Chain", ticker: "NEX", amount: "5,000", value: "$850", progress: 85, status: "可领取" },
];

export const marketTickers: MarketTicker[] = [
  { symbol: "BTC", price: "$68,450", change: "+2.1%", trend: "up" },
  { symbol: "ETH", price: "$3,620", change: "+1.5%", trend: "up" },
  { symbol: "SOL", price: "$182", change: "+5.2%", trend: "up" },
  { symbol: "BNB", price: "$590", change: "+0.8%", trend: "up" },
  { symbol: "Gas", price: "12 gwei", change: "-5%", trend: "down" },
];

export const sectorData: SectorData[] = [
  { name: "AI Agents", change24h: 15.4, leader: "$FET", sentiment: 'Hot', flow: "+$45M" },
  { name: "Restaking", change24h: 2.1, leader: "$ETHFI", sentiment: 'Warm', flow: "+$12M" },
  { name: "Memes", change24h: -5.4, leader: "$PEPE", sentiment: 'Cool', flow: "-$8M" },
  { name: "L2", change24h: 0.5, leader: "$ARB", sentiment: 'Warm', flow: "+$2M" },
];

export const warRoomIntel: IntelItem[] = [
  { id: '1', time: '10:42', source: 'Macro', content: 'US CPI Data coming in lower than expected (2.9%). Possible rate cut signal.', sentiment: 'Bullish', impactLevel: 'High' },
  { id: '2', time: '10:45', source: 'OnChain', content: 'Vitalik.eth moved 500 ETH to Coinbase.', sentiment: 'Bearish', impactLevel: 'Medium' },
  { id: '3', time: '11:02', source: 'Twitter', content: 'BlackRock digital asset chief mentions "Tokenization" in interview.', sentiment: 'Bullish', impactLevel: 'Medium' },
];

export const whaleAlerts: WhaleAlert[] = [
  { token: "ETH", action: "Buy", amount: "4,500", value: "$16.2M", walletLabel: "0x7a...9f2 (Smart Money)" },
  { token: "SOL", action: "Transfer", amount: "150,000", value: "$27.3M", walletLabel: "Binance Hot Wallet" },
  { token: "PEPE", action: "Sell", amount: "400B", value: "$4.2M", walletLabel: "Early Adopter" },
];

export const bountyTasks: BountyTask[] = [
  { id: 'b1', title: "Write Thread on Modular Blockchains", project: "Nexus Chain", reward: "$150 USDC", type: "Content", slots: 5, filled: 2, deadline: "2d" },
  { id: 'b2', title: "Retweet Partnership Announcement", project: "H-Swap", reward: "$20 USDC", type: "Retweet", slots: 100, filled: 84, deadline: "12h" },
  { id: 'b3', title: "Testnet Validator Setup", project: "ZetaLayer", reward: "$500 + NFT", type: "Testnet", slots: 50, filled: 50, deadline: "Ended" },
];

export const twitterTrends: TrendingTopic[] = [
  { id: 't1', name: "$WIF", volume: "45k tweets", sentiment: 'Bullish', change: 150, phase: 'Peak Hype', context: 'Sphere Las Vegas Rumors' },
  { id: 't2', name: "ERC-404", volume: "12k tweets", sentiment: 'Neutral', change: -20, phase: 'Distribution', context: 'Market cooling down' },
];

export const telegramAlpha: TrendingTopic[] = [
  { id: 'tg1', name: "Unibot", volume: "85 groups", sentiment: 'Bullish', change: 45, phase: 'Accumulation', context: 'New Solana support' },
  { id: 'tg2', name: "Banana Gun", volume: "60 groups", sentiment: 'FOMO', change: 80, phase: 'Discovery', context: 'Sniper competition' },
];

export const smartMoneyFlows: SmartMoneyFlow[] = [
  { token: "PENDLE", netFlow24h: "+$2.5M", entityName: "Wintermute", entityType: "MM", signal: "Accumulation" },
  { token: "LDO", netFlow24h: "-$1.2M", entityName: "Alameda (Liquidator)", entityType: "VC", signal: "Dump" },
];

export const kolBenefits: KOLBenefit[] = [
  { title: "Alpha Intelligence Tool", desc: "Real-time access to War Room dashboards and whale tracking signals.", iconType: "Tool" },
  { title: "Private Allocation", desc: "Guaranteed allocation in H Labs incubated projects (Seed/Private rounds).", iconType: "Money" },
  { title: "Legal & Audit Shield", desc: "Subsidized smart contract audits and legal entity setup consulting.", iconType: "Safety" },
  { title: "Global Founder Network", desc: "Direct access to founders of top 50 protocols for partnership opportunities.", iconType: "Network" },
];

export const cexFlows: CexFlow[] = [
  { exchange: "Binance", netFlow24h: "-$120M", status: "Accumulation", topToken: "BTC" },
  { exchange: "Coinbase", netFlow24h: "-$45M", status: "Accumulation", topToken: "ETH" },
  { exchange: "Bybit", netFlow24h: "+$15M", status: "Distribution", topToken: "USDT" },
];

export const devActivity: DevActivity[] = []; 

export const stablecoinData: StablecoinMetric[] = [];

export const strategicPartners: StrategicPartner[] = [
  { name: "Binance Labs", logo: "https://static.yzilabs.com/yzi-lab/static/images/logo.png" },
  { name: "Polychain", logo: "https://re2cruiting.cdn.greenhouse.io/external_greenhouse_job_boards/logos/000/010/292/original/polychain_original_(2).png?1504293990" },
  { name: "Animoca", logo: "https://static.wixstatic.com/media/0de4af_81797e1ddad04c02905527b26c5444fa~mv2.png/v1/fill/w_149,h_84,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Animoca%20brands%20standard%20logo.png" },
  { name: "Wintermute", logo: "data:image/png;base64---,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAKlBMVEVHcEwHCwkHCwkHAAEHCwkC1EkFhi8B5E4FbygEsT0Dw0MGWCAA/FcGNhX3URuFAAAAA3RSTlMAbXUKSlSHAAAA20lEQVQokX3TCQ6EIAwFUPR3YfP+150WGEGjNsYAz6+mYghho8fagtX+bET7a65n343oRMw13BFyLs3hQJQ6sRZckXWi8gURE0/kFLGiYkXoghbsCHQc0Y5KDZEzGpKe6EFfQWY2teGIhhH0FZYYhduwR0MP+uUsEDu43aRFQ3tVK84CR0hmn2tDa062qtY0Rzv1ubXJk6LpoOIP9iRpoSOpYLyQMw7tST3ghNkhRE1FHbUkjVjb15hZRZT5T8vHNi5cKxfMz75uE+OVrjga/4a3+t6an5v663f4ATidDZ3pPk+oAAAAAElFTkSuQmCC" },
  { name: "Delphi Digital", logo: "https://members.delphidigital.io/_ipx/f_webp&s_88x86/images/delphi_pro_logo.png" },
  { name: "a16z crypto", logo: "https://a16zcrypto.com/wp-content/themes/a16z-crypto/assets/images/logo.svg" },
  { name: "Sequoia", logo: "--data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAWlBMVEX////3+vrL3Nbj7OnT4t3w9fT0+fgAXzYAWi59qZlYlYDF19C90soAXzcAaUYAaEQAZkKJsqNjm4gAakcAc1Tn7+03hGsXfF9Ei3MsgWbR4dyavrJuoY9RkXtXjS54AAAAoklEQVR4AcTPRQLDMAxE0Qmj2W74/scsg+Iyv+03SPiXIAyBKIyBMEyQhGvpMUZZnqLISiDLKtSM8yw+RSFTKK4Bw0NUxlrxUqyZMZeflRVcvZZciHIBwosNgJCuQmMAtJJfWQXomFzLey9KDcKLDa7HIQBUsTdG87jWSrOXxX4c9HigyU3Z4arIBrjKJUApBZH1ICZmKBbTh+tqLlltoJIsAIV+DYaUANV7AAAAAElFTkSuQmCC" },
  { name: "Coinbase Ventures", logo: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/light/coinbaseLogoNavigation-4.svg" }
];
export const mediaPartners: MediaPartner[] = [
  { name: "CoinDesk", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/CoinDesk_logo.svg/500px-CoinDesk_logo.svg.png?20221224092106" },
  { name: "The Block", logo: "https:-//getlogovector.com/wp-content/uploads/2022/09/the-block-crypto-simplified-logo-vector-2022.png" },
  { name: "Decrypt", logo: "https://logotyp.us/img/logotypus.svg" },
  { name: "Foresight News", logo: "https:-//getlogovector.com/wp-content/uploads/2020/02/foresight-news-logo-vector.png" },
  { name: "CoinTelegraph", logo: "https:-//getlogovector.com/wp-content/uploads/2019/10/cointelegraph-logo-vector.png" },
  { name: "Odaily", logo: "https://www.odaily.news/_next/static/media/logo-banner.71275261.svg" }
];

export const academyCourses: CourseCategory[] = [
  {
    category: "Web3 启蒙 (Web3 Basics)",
    level: "Basic",
    items: [
      "什么是 Web3？去中心化的未来",
      "区块链 101：分布式账本技术",
      "Web3 钱包入门：MetaMask 安装与使用",
      "Gas 费机制与交易原理",
      "如何避免被钓鱼？新手安全指南"
    ]
  },
  {
    category: "DeFi 进阶 (DeFi Mastery)",
    level: "Intermediate",
    items: [
      "DEX 交易实操：Uniswap & Jupiter",
      "流动性挖矿 (Yield Farming) 原理",
      "借贷协议详解：Aave & Compound",
      "跨链桥使用指南：资产跨链转移",
      "Layer 2 生态：Arbitrum & Optimism"
    ]
  },
  {
    category: "安全与风控 (Security)",
    level: "Security",
    items: [
      "硬件钱包设置 (Ledger/Trezor)",
      "智能合约授权管理 (Revoke.cash)",
      "识别 Rug Pull 与貔貅盘",
      "私钥管理与助记词保存最佳实践",
      "冷热钱包隔离策略"
    ]
  },
  {
    category: "投研方法论 (Research)",
    level: "Investor",
    items: [
      "如何阅读白皮书与代币经济学",
      "链上数据分析工具：Dune & Nansen",
      "早期项目发掘：Alpha 寻找策略",
      "解锁与线性释放 (Vesting) 分析",
      "市场情绪分析与贪婪指数"
    ]
  },
  {
    category: "赛道深度解析 (Deep Dive)",
    level: "Advanced",
    items: [
      "模块化区块链 (Modular Blockchains)",
      "ZK-Rollup vs Optimistic Rollup",
      "Restaking (再质押) 生态解析",
      "Web3 社交与去中心化身份 (DID)",
      "RWA (现实世界资产) 代币化"
    ]
  }
];