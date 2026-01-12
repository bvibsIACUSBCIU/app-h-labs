export type Language = 'en' | 'zh';

export const translations = {
  en: {
    nav: { services: "Services", cases: "Success Cases", login: "Login" },
    hero: {
      badge: "H LABS VENTURE BUILDER",
      title: "Build. Scale. Monetize. The Web3 Growth Engine.",
      subtitle: "We empower the next generation of unicorns with Hardcore Tech, Traffic Matrix, and RWA Solutions.",
      cta1: "Access Dashboard",
      cta2: "Apply for Incubation",
      stats: { aum: "Assets Under Management", kol: "KOL Network Reach", projects: "Projects Incubated", partners: "Strategic Partners" }
    },
    pillars: {
      title: "Hardcore Tech Support",
      desc: "Providing end-to-end infrastructure for Web3 projects from zero to one, and one to infinity.",
      p1: { title: "Web3 Infrastructure", desc: "Customized public chains, Wallet solutions, SwapX, Prediction Markets.", items: ["Custom L1/L2 Chains", "MPC Wallet Solutions", "SwapX & Aggregators", "Prediction Markets"] },
      p2: { title: "RWA Sector", desc: "Real World Asset tokenization compliance and technical implementation.", items: ["Asset Tokenization", "Legal Structuring", "On-chain Bonds", "Real Estate on Chain"] },
      p3: { title: "Traffic & Meme", desc: "Viral marketing, Meme culture incubation, and massive traffic injection.", items: ["Meme Incubator", "Viral Campaigns", "Traffic Injection", "Community Takeover"] }
    },
    custody: {
      title: "Institutional Custody & Security",
      desc: "Bank-grade security architecture protecting your assets with absolute compliance.",
      items: [
        { title: "MPC Technology", desc: "Multi-Party Computation wallets eliminating single points of failure." },
        { title: "Double Audits", desc: "Smart contracts audited by top-tier firms (CertiK, SlowMist)." },
        { title: "Global Compliance", desc: "Operating under full legal frameworks and regulatory compliance." },
        { title: "Asset Segregation", desc: "Strict separation of client funds and operational capital." }
      ]
    },
    media: {
      title: "H Media Influence Matrix",
      desc: "Proprietary Traffic Factory + KOL Academy + Full Brand Management",
      s1: { title: "Twitter (X) Ops", desc: "Persona modeling, daily refined content, and growth hacking strategies." },
      s2: { title: "Space / AMA", desc: "One-stop loop: Planning, inviting, hosting, and post-event summaries." },
      s3: { title: "Global Roadshows", desc: "Custom business salons & summits in Dubai, Singapore, Hong Kong." },
      mediaPartners: "Strategic Media Alliance"
    },
    portfolio: {
      title: "From 0 to 1: Battle Records",
      desc: "Real-world success stories powered by H Labs.",
      viewAll: "View All Cases"
    },
    partners: {
      title: "Our Partners",
      subtitle: "Hand in hand, creating benchmarks.",
      desc: "Supported by 400+ industry leading enterprises."
    },
    footer: {
      rights: "© 2024 H Labs Ecosystem.",
      links: ["Services", "Cases", "Twitter", "Contact"]
    },
    dashboard: {
      sidebar: {
        war_room: "War Room",
        kol_portal: "KOL Matrix",
        bounty_hall: "Bounty Hall",
        academy: "Academy",
        fund: "H-Fund",
        disconnect: "Disconnect"
      },
      war_room: {
        title: "WAR ROOM TERMINAL",
        subtitle: "REAL-TIME INTELLIGENCE & MARKET ANALYSIS",
        alpha: "Alpha Stream (Live)",
        radar: "Narrative Radar",
        cex: "CEX Net Flows (24h)",
        smart: "Smart Money",
        whale: "Whale Alerts"
      },
      kol: {
        title: "KOL MATRIX PORTAL",
        subtitle: "Traffic Monetization & Resource Network",
        privileges: "Exclusive Privileges",
        join: "Join the H-Club",
        req: "Minimum Requirement: 10k+ followers or ownership of a community with 500+ active members.",
        connect: "Connect Wallet to Verify"
      },
      bounty: {
        title: "BOUNTY HALL",
        subtitle: "Proof of Work & Earn",
        active: "Total Active",
        pool: "Pool Value",
        filter: "Filter by Type",
        reward: "Reward",
        slots: "Slots",
        claim: "Claim"
      },
      academy: {
        title: "H-ACADEMY",
        subtitle: "Knowledge Base & Alpha Research"
      },
      fund: {
        title: "H-FUND PORTFOLIO",
        subtitle: "Institutional Asset Management",
        restricted_title: "Restricted Access",
        restricted_desc: "Detailed fund metrics, NAV reports, and LP dashboard are only available to accredited investors and whitelisted wallet addresses.",
        request: "REQUEST ACCESS (KYC REQUIRED)",
        public: "Public Portfolio"
      }
    }
  },
  zh: {
    nav: { services: "核心服务", cases: "成功案例", login: "登录终端" },
    hero: {
      badge: "H LABS 风险孵化器",
      title: "构建. 扩张. 变现. Web3 增长引擎.",
      subtitle: "我们通过硬核技术支持、流量矩阵和RWA 解决方案，赋能下一代独角兽企业。",
      cta1: "进入控制台",
      cta2: "申请孵化",
      stats: { aum: "资产管理规模", kol: "KOL 网络触达", projects: "孵化项目数", partners: "战略合作伙伴" }
    },
    pillars: {
      title: "硬核技术支持",
      desc: "为 Web3 项目提供从 0 到 1 的全套基础设施与赛道支持。",
      p1: { title: "基础设施", desc: "定制公链，钱包，SwapX，预测市场等一站式技术交付。", items: ["定制 L1/L2 公链", "MPC 钱包方案", "SwapX 聚合器", "去中心化预测市场"] },
      p2: { title: "RWA 赛道", desc: "现实资产上链，合规架构搭建与技术实现。", items: ["资产代币化", "合规法律架构", "链上债券/国债", "房地产上链"] },
      p3: { title: "流量与 Meme", desc: "病毒式营销，Meme 文化孵化，海量流量注入。", items: ["Meme 孵化器", "病毒式传播", "精准流量注入", "社区接管 (CTO)"] }
    },
    custody: {
      title: "资金托管与安全",
      desc: "银行级安全架构，为您的资产保驾护航，确保绝对合规与透明。",
      items: [
        { title: "MPC 钱包技术", desc: "采用多方计算技术，彻底消除私钥单点故障风险。" },
        { title: "双重代码审计", desc: "核心合约经由 CertiK 与 SlowMist 等头部机构双重审计。" },
        { title: "全球合规运营", desc: "在完全合规的法律框架与监管要求下运营。" },
        { title: "资金严格隔离", desc: "客户资金与平台运营资金完全隔离，公开透明。" }
      ]
    },
    media: {
      title: "H Media 影响力矩阵",
      desc: "自有流量工厂 + KOL 影响力学院 + 品牌全案",
      s1: { title: "推特 (X) 深度运营", desc: "人格化建模 + 每日精细化内容产出 + 增长黑客手段。" },
      s2: { title: "高频交互 (Space/AMA)", desc: "策划、邀约、主持、会后总结一站式闭环。" },
      s3: { title: "全球高端路演", desc: "迪拜、新加坡、香港等核心枢纽的商务沙龙、展会与投资峰会定制。" },
      mediaPartners: "战略合作媒体"
    },
    portfolio: {
      title: "从 0 到 1 的实战记录",
      desc: "我们亲手打造的成功案例。",
      viewAll: "查看全部案例"
    },
    partners: {
      title: "我们的合作伙伴",
      subtitle: "我们携手，共创标杆",
      desc: "荣获 400 多家行业领军企业的鼎力支持"
    },
    footer: {
      rights: "© 2024 H Labs Ecosystem.",
      links: ["服务", "案例", "推特", "联系我们"]
    },
    dashboard: {
      sidebar: {
        war_room: "作战室",
        kol_portal: "KOL 矩阵",
        bounty_hall: "赏金大厅",
        academy: "H-学院",
        fund: "H-基金",
        disconnect: "断开连接"
      },
      war_room: {
        title: "作战室终端",
        subtitle: "实时情报与市场分析",
        alpha: "Alpha 情报流 (实时)",
        radar: "叙事雷达",
        cex: "CEX 净流向 (24h)",
        smart: "聪明钱监控",
        whale: "巨鲸预警"
      },
      kol: {
        title: "KOL 矩阵门户",
        subtitle: "流量变现与资源网络",
        privileges: "专属权益",
        join: "加入 H-Club",
        req: "最低要求：10k+ 粉丝或拥有 500+ 活跃成员的社区。",
        connect: "连接钱包验证"
      },
      bounty: {
        title: "赏金大厅",
        subtitle: "工作量证明与收益",
        active: "当前活动",
        pool: "奖池总额",
        filter: "筛选类型",
        reward: "奖励",
        slots: "名额",
        claim: "领取"
      },
      academy: {
        title: "H-学院",
        subtitle: "知识库与 Alpha 研究"
      },
      fund: {
        title: "H-基金组合",
        subtitle: "机构级资产管理",
        restricted_title: "访问受限",
        restricted_desc: "详细的基金指标、净值报告和 LP 仪表盘仅对合格投资者和白名单地址开放。",
        request: "申请访问 (需 KYC)",
        public: "公开投资组合"
      }
    }
  }
};
