const { CLOUD_FUNCTION_NAME } = require("./cloud")

const ITEMS_KEY = "life-cycle-items-v3"
const ITEMS_INIT_KEY = "life-cycle-items-initialized-v3"
const CUSTOM_TEMPLATES_KEY = "life-cycle-custom-templates-v2"
const CUSTOM_CATEGORIES_KEY = "life-cycle-custom-categories-v1"
const USER_PROFILE_KEY = "life-cycle-user-profile-v1"
const UNLOCK_STATE_KEY = "life-cycle-unlock-state-v1"
const DATA_META_KEY = "life-cycle-data-meta-v1"
const CLOUD_SYNC_SCHEMA_VERSION = 1
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_EXTRA_CATEGORIES = 5

const baseCategoryMeta = {
  personal_care: { label: "个护", color: "#DCECCF", textColor: "#4B6A44" },
  bedding: { label: "床品", color: "#DDEBF6", textColor: "#49657D" },
  home: { label: "家居", color: "#E3EFE5", textColor: "#4B6A57" },
  daily_use: { label: "日用", color: "#E0E7FA", textColor: "#4D5E8C" },
  kitchenware: { label: "厨房", color: "#F6DFC7", textColor: "#8A5D39" },
  beauty: { label: "美妆", color: "#F7DFE6", textColor: "#8A5A6D" },
  medicine: { label: "药品", color: "#F7E4CF", textColor: "#8C6540" },
  food: { label: "食品", color: "#F5ECC6", textColor: "#8A7334" },
  other: { label: "其他", color: "#E6E8E9", textColor: "#5F6568" }
}

const baseCategoryOptions = Object.keys(baseCategoryMeta).map((value) => ({
  value,
  label: baseCategoryMeta[value].label
}))

const customCategoryPalette = [
  { color: "#F8E6D4", textColor: "#8A5A34" },
  { color: "#E0F0EA", textColor: "#4C7862" },
  { color: "#E4E9FA", textColor: "#576A9A" },
  { color: "#F7E3EF", textColor: "#8F5875" },
  { color: "#F6EDCF", textColor: "#8A7437" }
]

const actionOptions = [
  { value: "replace", label: "更换", startLabel: "开始使用日期" },
  { value: "wash", label: "清洗", startLabel: "上次清洗日期" },
  { value: "expire", label: "到期", startLabel: "开始记录日期" }
]

const statusOptions = [
  { value: "all", label: "全部" },
  { value: "upcoming", label: "即将到期" },
  { value: "expired", label: "已过期" }
]

const builtInTemplates = [
  { id: "tpl-toothbrush", name: "牙刷", category: "personal_care", actionType: "replace", cycleDays: 90, remindThresholdDays: 14, recommendedText: "90 天" },
  { id: "tpl-electric-head", name: "电动牙刷头", category: "personal_care", actionType: "replace", cycleDays: 90, remindThresholdDays: 14, recommendedText: "90 天" },
  { id: "tpl-towel", name: "毛巾", category: "personal_care", actionType: "wash", cycleDays: 4, remindThresholdDays: 1, recommendedText: "约 4 天" },
  { id: "tpl-bath-tool", name: "沐浴用具", category: "personal_care", actionType: "replace", cycleDays: 28, remindThresholdDays: 5, recommendedText: "28 天" },
  { id: "tpl-razor-blade", name: "剃须刀片", category: "personal_care", actionType: "replace", cycleDays: 7, remindThresholdDays: 1, recommendedText: "约 7 天" },

  { id: "tpl-bedsheet", name: "床单", category: "bedding", actionType: "wash", cycleDays: 7, remindThresholdDays: 2, recommendedText: "7 天" },
  { id: "tpl-duvet-cover", name: "被套", category: "bedding", actionType: "wash", cycleDays: 14, remindThresholdDays: 3, recommendedText: "14 天" },
  { id: "tpl-pillowcase", name: "枕套", category: "bedding", actionType: "wash", cycleDays: 7, remindThresholdDays: 2, recommendedText: "7 天" },
  { id: "tpl-quilt", name: "被子", category: "bedding", actionType: "wash", cycleDays: 60, remindThresholdDays: 12, recommendedText: "2 个月" },
  { id: "tpl-mattress", name: "床垫", category: "bedding", actionType: "wash", cycleDays: 180, remindThresholdDays: 30, recommendedText: "180 天" },

  { id: "tpl-blanket", name: "毛毯", category: "home", actionType: "wash", cycleDays: 60, remindThresholdDays: 12, recommendedText: "2 个月" },
  { id: "tpl-curtain", name: "窗帘", category: "home", actionType: "wash", cycleDays: 30, remindThresholdDays: 6, recommendedText: "30 天" },
  { id: "tpl-ac-filter", name: "空调滤网", category: "home", actionType: "replace", cycleDays: 90, remindThresholdDays: 18, recommendedText: "90 天" },
  { id: "tpl-mop", name: "拖把头", category: "home", actionType: "replace", cycleDays: 90, remindThresholdDays: 18, recommendedText: "90 天" },
  { id: "tpl-broom", name: "扫把", category: "home", actionType: "replace", cycleDays: 365, remindThresholdDays: 60, recommendedText: "365 天" },
  { id: "tpl-rag", name: "抹布", category: "home", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每次使用后" },

  { id: "tpl-sunscreen", name: "防晒霜", category: "beauty", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "以包装到期日为准" },
  { id: "tpl-foundation", name: "粉底液", category: "beauty", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "常见 12M 标识" },
  { id: "tpl-lipstick", name: "口红", category: "beauty", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "常见 12M 标识" },
  { id: "tpl-mascara", name: "睫毛膏", category: "beauty", actionType: "expire", cycleDays: 90, remindThresholdDays: 18, recommendedText: "90 天" },
  { id: "tpl-face-cream", name: "面霜", category: "beauty", actionType: "expire", cycleDays: 180, remindThresholdDays: 36, recommendedText: "常见 6M 标识" },
  { id: "tpl-makeup-brush", name: "化妆刷", category: "beauty", actionType: "wash", cycleDays: 7, remindThresholdDays: 2, recommendedText: "7 天" },
  { id: "tpl-perfume", name: "香水", category: "beauty", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "建议每年检查一次" },
  { id: "tpl-face-mask", name: "面膜", category: "beauty", actionType: "expire", cycleDays: 180, remindThresholdDays: 36, recommendedText: "常见 6M 标识" },

  { id: "tpl-medicine", name: "常备药", category: "medicine", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "以包装到期日为准" },
  { id: "tpl-vitamin", name: "维生素", category: "medicine", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "以包装到期日为准" },
  { id: "tpl-prescription-drug", name: "处方药", category: "medicine", actionType: "expire", cycleDays: 180, remindThresholdDays: 36, recommendedText: "以包装到期日为准" },

  { id: "tpl-milk", name: "牛奶", category: "food", actionType: "expire", cycleDays: 7, remindThresholdDays: 2, recommendedText: "7 天" },
  { id: "tpl-snack", name: "零食", category: "food", actionType: "expire", cycleDays: 90, remindThresholdDays: 18, recommendedText: "90 天" },
  { id: "tpl-ready-to-eat", name: "熟食", category: "food", actionType: "expire", cycleDays: 4, remindThresholdDays: 1, recommendedText: "4 天" },
  { id: "tpl-fresh-food", name: "生鲜", category: "food", actionType: "expire", cycleDays: 2, remindThresholdDays: 1, recommendedText: "2 天" },
  { id: "tpl-canned-food", name: "罐头", category: "food", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "建议按标签轮换" },
  { id: "tpl-cooking-oil", name: "食用油", category: "food", actionType: "expire", cycleDays: 180, remindThresholdDays: 36, recommendedText: "180 天" },

  { id: "tpl-cutting-board", name: "砧板", category: "kitchenware", actionType: "replace", cycleDays: 180, remindThresholdDays: 30, recommendedText: "180 天检查一次" },
  { id: "tpl-chopsticks", name: "筷子", category: "kitchenware", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每次使用后" },
  { id: "tpl-knife", name: "刀具", category: "kitchenware", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每次使用后" },
  { id: "tpl-cookware", name: "锅具", category: "kitchenware", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每次使用后" },
  { id: "tpl-seasoning", name: "调味品", category: "kitchenware", actionType: "expire", cycleDays: 365, remindThresholdDays: 73, recommendedText: "建议每年检查风味" },
  { id: "tpl-sponge-brush", name: "海绵刷", category: "kitchenware", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每次使用后" },

  { id: "tpl-water-cup", name: "水杯", category: "daily_use", actionType: "wash", cycleDays: 1, remindThresholdDays: 0, recommendedText: "每天清洗" },
  { id: "tpl-bag", name: "包包", category: "daily_use", actionType: "wash", cycleDays: 30, remindThresholdDays: 6, recommendedText: "30 天" },
  { id: "tpl-watch-band", name: "手表表带", category: "daily_use", actionType: "wash", cycleDays: 7, remindThresholdDays: 2, recommendedText: "7 天" },

  { id: "tpl-custom", name: "自定义记录", category: "other", actionType: "expire", cycleDays: 30, remindThresholdDays: 3, recommendedText: "按实际需要设置" }
]

const LEGACY_TEMPLATE_MAP = {
  "tpl-face-towel": "tpl-towel",
  "tpl-bath-towel": "tpl-towel",
  "tpl-comb": "tpl-custom",
  "tpl-mop-head": "tpl-mop"
}

const TIP_SOURCES = {
  ada: {
    authority: "美国牙科协会 ADA",
    sourceUrl: "https://adanews.ada.org/huddles/when-should-patients-replace-their-toothbrushes/"
  },
  aciLaundry: {
    authority: "American Cleaning Institute",
    sourceUrl: "https://www.cleaninginstitute.org/cleaning-tips/clothes/laundry-basics/do-i-need-wash"
  },
  clevelandLoofah: {
    authority: "Cleveland Clinic",
    sourceUrl: "https://health.clevelandclinic.org/loofahs-can-double-as-bacterial-breeding-grounds"
  },
  razor: {
    authority: "GoodRx 医学审核内容",
    sourceUrl: "https://www.goodrx.com/health-topic/dermatology/how-often-change-razor-blade"
  },
  sleepSheets: {
    authority: "Sleep Foundation",
    sourceUrl: "https://www.sleepfoundation.org/best-sheets/how-often-should-you-wash-your-sheets"
  },
  beddingRefresh: {
    authority: "Time 整理的卧具清洁建议",
    sourceUrl: "https://time.com/6995955/how-often-should-you-wash-your-sheets/"
  },
  mattress: {
    authority: "Sleep Foundation",
    sourceUrl: "https://www.sleepfoundation.org/mattress-information/mattress-care"
  },
  curtains: {
    authority: "American Cleaning Institute",
    sourceUrl: "https://www.cleaninginstitute.org/sites/default/files/assets/1/AssetManager/Cleaning%20to%20Controll%20Allergies%26%20Asthma.English.pdf"
  },
  filter: {
    authority: "美国 EPA",
    sourceUrl: "https://www.epa.gov/sites/production/files/2018-07/documents/guide_to_air_cleaners_in_the_home_2nd_edition.pdf"
  },
  mop: {
    authority: "O-Cedar / 清洁工具使用建议",
    sourceUrl: "https://sutherlands.com/products/item/3561198/ocedar-microfiber-dualaction-dust-mop-refill"
  },
  broom: {
    authority: "Consumer Reports",
    sourceUrl: "https://www.consumerreports.org/home-garden/cleaning/how-to-clean-and-when-to-replace-household-cleaning-tools-a6383783893/"
  },
  cloth: {
    authority: "King County Public Health",
    sourceUrl: "https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/childrens-health/child-care-health-resources/-/media/king-county/depts/dph/documents/health-safety/health-programs-services/child-care-health/sanitation/cleaning-schedule.ashx"
  },
  cosmetics: {
    authority: "FDA",
    sourceUrl: "https://www.fda.gov/cosmetics/cosmetics-labeling/shelf-life-and-expiration-dating-cosmetics"
  },
  cosmeticsPao: {
    authority: "Ohio State Health & Discovery",
    sourceUrl: "https://health.osu.edu/health/skin-and-body/is-it-ok-to-use-expired-makeup"
  },
  makeupBrush: {
    authority: "美国皮肤病学会 AAD",
    sourceUrl: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/clean-your-makeup-brushes"
  },
  medicines: {
    authority: "FDA",
    sourceUrl: "https://www.fda.gov/drugs/special-features/dont-be-tempted-use-expired-medicines"
  },
  leftovers: {
    authority: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety"
  },
  freshFood: {
    authority: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe"
  },
  shelfStable: {
    authority: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/shelf-stable-food"
  },
  cuttingBoard: {
    authority: "University of Illinois Extension",
    sourceUrl: "https://extension.illinois.edu/meat-safety/cutting-boards"
  },
  dishwashing: {
    authority: "American Cleaning Institute",
    sourceUrl: "https://www.cleaninginstitute.org/cleaning-tips/washing-dishes"
  },
  knives: {
    authority: "Victorinox",
    sourceUrl: "https://www.victorinox.com/en-GB/Cutlery/Information/How-to-Sharpen-Your-Kitchen-Knife/cms/howtosharpenyourkitchenknife/"
  },
  bagCare: {
    authority: "Cambridge Satchel",
    sourceUrl: "https://us.cambridgesatchel.com/blogs/journal/how-to-clean-a-leather-handbag-cambridge-satchel"
  },
  watchBand: {
    authority: "Apple Support",
    sourceUrl: "https://support.apple.com/en-us/108893"
  }
}

function buildTip(recommendation, evidence, source) {
  return {
    recommendation,
    authority: source.authority,
    evidence,
    sourceUrl: source.sourceUrl
  }
}

const templateTips = {
  "tpl-toothbrush": buildTip("建议每 90 天左右更换一次，刷毛外翻时提前更换。", "ADA 建议牙刷每 3 到 4 个月更换一次；电动牙刷头同样按刷毛磨损和 3 到 4 个月节奏更换。", TIP_SOURCES.ada),
  "tpl-electric-head": buildTip("建议每 90 天左右更换一次，刷毛外翻时提前更换。", "ADA 对刷头更换的核心判断也是刷毛磨损和 3 到 4 个月周期。", TIP_SOURCES.ada),
  "tpl-towel": buildTip("建议按 4 天左右清洗一次。", "American Cleaning Institute 建议浴巾在 3 到 5 次正常使用后清洗；应用默认按每天使用一次取中间值。", TIP_SOURCES.aciLaundry),
  "tpl-bath-tool": buildTip("建议每 28 天更换一次。", "Cleveland Clinic 提醒天然丝瓜络或类似沐浴用具容易滋生细菌，建议每 3 到 4 周更换，并在中间每周清洁一次。", TIP_SOURCES.clevelandLoofah),
  "tpl-razor-blade": buildTip("建议约 7 天更换一次。", "医学审核建议大多数刀片在 5 到 7 次剃须后更换；应用默认按接近日常剃须习惯换算为 1 周。", TIP_SOURCES.razor),

  "tpl-bedsheet": buildTip("建议每 7 天清洗一次。", "Sleep Foundation 建议床单和枕套至少每周清洗一次，以减少汗液、皮屑和过敏原积累。", TIP_SOURCES.sleepSheets),
  "tpl-duvet-cover": buildTip("建议每 14 天清洗一次。", "American Cleaning Institute 给出的基础建议是床品至少每 2 周清洗一次；若贴身使用或出汗较多可以再缩短。", TIP_SOURCES.aciLaundry),
  "tpl-pillowcase": buildTip("建议每 7 天清洗一次。", "枕套与面部和头发直接接触，Sleep Foundation 建议至少每周清洗一次。", TIP_SOURCES.sleepSheets),
  "tpl-quilt": buildTip("建议每 2 个月清洁一次。", "综合卧具清洁建议认为不直接贴身的被子、毯子通常每 2 到 3 个月清洗一次；应用默认取 2 个月。", TIP_SOURCES.beddingRefresh),
  "tpl-mattress": buildTip("建议每 180 天做一次深度清洁和检查。", "Sleep Foundation 建议定期清洁床垫，并指出维护会影响寿命和睡眠卫生；应用默认设为半年一次深清与状态检查。", TIP_SOURCES.mattress),

  "tpl-blanket": buildTip("建议每 2 个月清洗一次。", "对于不直接当床单贴身使用的毛毯，常见专家建议是每 2 到 3 个月清洁一次；应用默认取 2 个月。", TIP_SOURCES.beddingRefresh),
  "tpl-curtain": buildTip("建议每 30 天清洗或除尘一次。", "American Cleaning Institute 的过敏原清洁清单建议窗帘按月清洁，以减少灰尘和过敏原积累。", TIP_SOURCES.curtains),
  "tpl-ac-filter": buildTip("建议每 90 天更换或彻底清洁一次。", "EPA 指出滤网通常按制造商建议每 60 到 90 天更换；应用默认取上限 90 天。", TIP_SOURCES.filter),
  "tpl-mop": buildTip("建议每 90 天更换一次。", "常见拖把头补充件会给出约 3 个月的最佳效果更换建议，适合做家庭常规提醒。", TIP_SOURCES.mop),
  "tpl-broom": buildTip("建议每 365 天做一次磨损检查。", "Consumer Reports 汇总的清洁工具建议认为扫把通常在规律使用 1 到 2 年后出现明显磨损；应用默认设为 1 年检查一次。", TIP_SOURCES.broom),
  "tpl-rag": buildTip("建议每次使用后就清洗。", "公共卫生清洁排程建议抹布等清洁布在每次使用后清洗，避免把污渍和细菌带到下一处表面。", TIP_SOURCES.cloth),

  "tpl-sunscreen": buildTip("建议优先看包装到期日，默认按 1 年做一次库存检查。", "FDA 明确指出防晒产品属于药品，必须在有效期内使用；应用默认 365 天只是提醒你核对包装日期。", TIP_SOURCES.cosmetics),
  "tpl-foundation": buildTip("建议优先看 PAO / 到期标识，默认按 12M 使用。", "FDA 要求厂家对化妆品安全和货架期负责；Ohio State 提醒很多化妆品会用 3M、6M、12M 这类开封后标识，液体底妆常见为 12M 左右。", TIP_SOURCES.cosmeticsPao),
  "tpl-lipstick": buildTip("建议优先看 PAO / 到期标识，默认按 12M 使用。", "口红等彩妆建议以包装上的 PAO 或到期日为准；应用默认 12 个月作为保守提醒。", TIP_SOURCES.cosmeticsPao),
  "tpl-mascara": buildTip("建议约 90 天更换一次。", "FDA 提醒睫毛膏刷头反复接触眼周，通常建议购买或开封后 2 到 4 个月丢弃；应用默认取 90 天。", TIP_SOURCES.cosmetics),
  "tpl-face-cream": buildTip("建议优先看 PAO / 到期标识，默认按 6M 使用。", "护肤霜类产品常见 6M 或 12M 开封后标识；应用默认取更保守的 6 个月。", TIP_SOURCES.cosmeticsPao),
  "tpl-makeup-brush": buildTip("建议每 7 天清洗一次。", "AAD 建议化妆刷每 7 到 10 天清洗一次，避免油脂、旧妆和细菌堆积。", TIP_SOURCES.makeupBrush),
  "tpl-perfume": buildTip("建议每年检查一次香味和包装状态。", "香水也属于化妆品范畴，实际货架期以厂家标识为准；应用默认 1 年做一次质量和气味检查。", TIP_SOURCES.cosmetics),
  "tpl-face-mask": buildTip("建议优先看包装到期日，默认按 6M 做开封后提醒。", "面膜同样应遵循包装标识；应用默认 6 个月是偏保守的开封后提醒。", TIP_SOURCES.cosmeticsPao),

  "tpl-medicine": buildTip("建议严格按包装有效期使用，默认每年做一次药箱盘点。", "FDA 强调不要被诱惑去使用过期药；应用默认 365 天只是提醒你定期检查包装有效期。", TIP_SOURCES.medicines),
  "tpl-vitamin": buildTip("建议优先按包装有效期管理，默认每年盘点一次。", "补充剂也应优先遵循包装上的有效期或最佳食用期；应用默认 365 天用于库存整理提醒。", TIP_SOURCES.medicines),
  "tpl-prescription-drug": buildTip("建议严格按处方和包装有效期管理。", "FDA 建议处方药以标签有效期为准，不要延后使用；应用默认 180 天用于中短期复核提醒。", TIP_SOURCES.medicines),

  "tpl-milk": buildTip("建议按 7 天左右做冷藏检查。", "牛奶属于高风险冷藏食品，开封后通常需要尽快饮用；应用默认设为 7 天冷藏检查提醒。", TIP_SOURCES.freshFood),
  "tpl-snack": buildTip("建议以包装日期为准，默认每 90 天做一次库存轮换。", "USDA 将零食和许多调味品归为 shelf-stable foods，质量受开封和储存影响较大；应用默认 90 天用于检查是否该先吃掉。", TIP_SOURCES.shelfStable),
  "tpl-ready-to-eat": buildTip("建议 4 天内吃完。", "USDA 对熟食和剩菜的安全建议通常是冷藏后 3 到 4 天内食用完毕；应用默认取 4 天。", TIP_SOURCES.leftovers),
  "tpl-fresh-food": buildTip("建议 2 天内处理。", "USDA 冷藏表中很多生鲜肉类和海鲜的推荐储存期是 1 到 2 天；应用默认取 2 天做保守提醒。", TIP_SOURCES.freshFood),
  "tpl-canned-food": buildTip("建议按标签轮换，默认每 1 年检查一次。", "USDA 指出未开封低酸罐头可存放 2 到 5 年、高酸罐头约 12 到 18 个月；应用默认 1 年提醒你轮换库存，开封后则应冷藏并在 3 到 4 天内用完。", TIP_SOURCES.shelfStable),
  "tpl-cooking-oil": buildTip("建议每 180 天检查一次开封后的油脂状态。", "食用油属于 shelf-stable foods，但开封后会逐步氧化；应用默认设为 180 天检查气味、颜色和新鲜度。", TIP_SOURCES.shelfStable),

  "tpl-cutting-board": buildTip("建议每 180 天检查一次磨损，出现深沟槽及时更换。", "University of Illinois Extension 建议当砧板表面出现大量刀痕或较深沟槽时更换；应用默认设为半年检查一次。", TIP_SOURCES.cuttingBoard),
  "tpl-chopsticks": buildTip("建议每次使用后及时清洗并彻底晾干。", "筷子同属直接接触食物的餐具，按餐具清洁原则应在每次使用后及时洗净和晾干。", TIP_SOURCES.dishwashing),
  "tpl-knife": buildTip("建议每次使用后及时清洗。", "American Cleaning Institute 指出餐具和锅具需要保持清洁才能安全使用；刀具应在每次使用后及时洗净并擦干。", TIP_SOURCES.dishwashing),
  "tpl-cookware": buildTip("建议每次使用后及时清洗。", "American Cleaning Institute 的洗碗建议同样适用于锅具，及时清洗有助于避免油污结垢和交叉污染。", TIP_SOURCES.dishwashing),
  "tpl-seasoning": buildTip("建议每年检查一次风味和结块情况。", "USDA 把香辛料和调味品归为 shelf-stable foods；应用默认 1 年做一次风味和状态检查，实际仍应优先看包装标签。", TIP_SOURCES.shelfStable),
  "tpl-sponge-brush": buildTip("建议每次使用后彻底洗净并晾干。", "American Cleaning Institute 提醒洗碗工具本身也要保持清洁；海绵刷在每次使用后冲洗和晾干更卫生。", TIP_SOURCES.dishwashing),

  "tpl-water-cup": buildTip("建议每天清洗一次。", "杯子属于高频接触饮具，按餐具清洁原则应做到日常清洗；应用默认设为 1 天。", TIP_SOURCES.dishwashing),
  "tpl-bag": buildTip("建议每 30 天做一次常规清洁保养。", "皮包保养建议通常包括日常除尘和每月温和清洁；应用默认用 30 天提醒一次基础保养。", TIP_SOURCES.bagCare),
  "tpl-watch-band": buildTip("建议每 7 天清洁一次，运动出汗后当天处理。", "Apple 建议定期保持表带清洁和干燥，接触汗液、乳液或防晒后及时清洁；应用默认设为每周一次。", TIP_SOURCES.watchBand),
  "tpl-custom": buildTip("建议按你的实际使用频率设置。", "自定义模板没有固定行业周期，最稳妥的做法是按包装标签、材质说明或个人习惯自行设置。", TIP_SOURCES.dishwashing)
}

const seedItems = [
  {
    id: "toothbrush-001",
    templateId: "tpl-toothbrush",
    name: "牙刷",
    category: "personal_care",
    actionType: "replace",
    startAt: "2026-02-20",
    cycleDays: 90,
    remindThresholdDays: 14,
    imageUrl: "",
    timeline: [{ date: "2026.02.20", title: "开始使用", detail: "设置了 90 天更换周期" }]
  },
  {
    id: "bedsheet-001",
    templateId: "tpl-bedsheet",
    name: "床单",
    category: "bedding",
    actionType: "wash",
    startAt: "2026-05-02",
    cycleDays: 7,
    remindThresholdDays: 2,
    imageUrl: "",
    timeline: [{ date: "2026.05.02", title: "上次清洗", detail: "进入 7 天清洗周期" }]
  }
]

const defaultUserProfile = {
  loggedIn: false,
  nickName: "",
  avatarUrl: "",
  cloudOpenId: "",
  lastLoginAt: "",
  lastSyncAt: "",
  cloudAvailable: false
}

const defaultUnlockState = {
  customTemplatesUnlocked: false,
  unlockMethod: "",
  unlockedAt: ""
}

function hasWxStorage() {
  return typeof wx !== "undefined" && typeof wx.getStorageSync === "function"
}

function canUseCloud() {
  return typeof wx !== "undefined" && !!wx.cloud && typeof wx.cloud.callFunction === "function"
}

function canUseCloudStorage() {
  return typeof wx !== "undefined" && !!wx.cloud && typeof wx.cloud.uploadFile === "function"
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function hasProfileContent(userInfo = {}) {
  return !!((userInfo.nickName || "").trim() || (userInfo.avatarUrl || "").trim())
}

function mergeUserProfile(profile, userInfo = {}) {
  return {
    nickName: userInfo.nickName || profile.nickName || "微信用户",
    avatarUrl: userInfo.avatarUrl || profile.avatarUrl || ""
  }
}

function normalizeCloudFunctionResult(result) {
  if (!result || typeof result !== "object" || !result.result || typeof result.result !== "object") {
    return {}
  }

  return result.result
}

function getCloudErrorMessage(error) {
  if (!error) {
    return ""
  }

  return error.errMsg || error.message || `${error}`
}

function inferCloudErrorReason(error) {
  const message = getCloudErrorMessage(error).toLowerCase()

  if (!message) {
    return "cloud_call_failed"
  }
  if (message.includes("function") && message.includes("not found")) {
    return "cloud_function_missing"
  }
  if (message.includes("functionname parameter")) {
    return "cloud_function_missing"
  }
  if (message.includes("environment") && message.includes("not found")) {
    return "cloud_env_missing"
  }
  if (message.includes("collection") && (message.includes("not exist") || message.includes("does not exist"))) {
    return "collection_missing"
  }
  if (message.includes("permission")) {
    return "cloud_permission_denied"
  }

  return "cloud_call_failed"
}

function isCloudFileId(value) {
  return typeof value === "string" && value.indexOf("cloud://") === 0
}

function isDevtoolsLocalImageUrl(value) {
  return typeof value === "string" && /^http:\/\/(store|tmp)\//.test(value)
}

function isRemoteUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value) && !isDevtoolsLocalImageUrl(value)
}

function isLocalImagePath(value) {
  return !!value && typeof value === "string" && !isCloudFileId(value) && !isRemoteUrl(value)
}

function getFileExtension(path = "") {
  const matched = path.match(/(\.[a-zA-Z0-9]+)(?:\?|$)/)
  return matched ? matched[1].toLowerCase() : ".jpg"
}

function buildCloudImagePath(openId, itemId, localPath) {
  const safeOpenId = openId || "guest"
  const safeItemId = itemId || `item-${Date.now()}`
  const ext = getFileExtension(localPath)
  return `life-cycle-images/${safeOpenId}/${safeItemId}-${Date.now()}${ext}`
}

function getImageInfoAsync(src) {
  return new Promise((resolve, reject) => {
    if (typeof wx === "undefined" || typeof wx.getImageInfo !== "function") {
      reject(new Error("getImageInfo unavailable"))
      return
    }

    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}

async function resolveUploadableImagePath(localPath) {
  if (!isDevtoolsLocalImageUrl(localPath)) {
    return {
      ok: true,
      filePath: localPath
    }
  }

  try {
    const info = await getImageInfoAsync(localPath)
    const resolvedPath = info && info.path ? info.path : ""
    if (!resolvedPath) {
      return {
        ok: false,
        reason: "devtools_local_image_unsupported",
        errorMessage: "开发者工具中的本地图片路径无法稳定用于云存储上传"
      }
    }

    return {
      ok: true,
      filePath: resolvedPath
    }
  } catch (error) {
    return {
      ok: false,
      reason: "devtools_local_image_unsupported",
      error,
      errorMessage: getCloudErrorMessage(error) || "开发者工具中的本地图片路径无法稳定用于云存储上传"
    }
  }
}

function getPreferredImageUrl(item = {}) {
  if (isCloudFileId(item.imageFileId)) {
    return item.imageFileId
  }
  if (isCloudFileId(item.imageUrl)) {
    return item.imageUrl
  }
  if (isRemoteUrl(item.imageUrl)) {
    return item.imageUrl
  }
  if (isLocalImagePath(item.imageUrl)) {
    return item.imageUrl
  }

  return ""
}

function normalizeImageFields(item = {}) {
  const imageFileId = isCloudFileId(item.imageFileId)
    ? item.imageFileId
    : isCloudFileId(item.imageUrl)
      ? item.imageUrl
      : ""

  const imageLocalPath = isLocalImagePath(item.imageLocalPath)
    ? item.imageLocalPath
    : imageFileId
      ? ""
      : isLocalImagePath(item.imageUrl)
        ? item.imageUrl
        : ""

  return {
    ...item,
    imageFileId,
    imageUrl: imageFileId || getPreferredImageUrl(item),
    imageLocalPath
  }
}

function cleanupLocalImageFiles(items = []) {
  if (typeof wx === "undefined" || typeof wx.removeSavedFile !== "function") {
    return
  }

  items.forEach((item) => {
    const normalizedItem = normalizeImageFields(item)
    const localPaths = [normalizedItem.imageUrl, normalizedItem.imageLocalPath].filter((path, index, list) => {
      return isLocalImagePath(path) && list.indexOf(path) === index
    })

    localPaths.forEach((filePath) => {
      wx.removeSavedFile({
        filePath,
        fail: () => {}
      })
    })
  })
}

function readStorage(key, fallback) {
  if (!hasWxStorage()) {
    return clone(fallback)
  }
  const value = wx.getStorageSync(key)
  if (value === "" || typeof value === "undefined" || value === null) {
    return clone(fallback)
  }
  return clone(value)
}

function writeStorage(key, value) {
  if (hasWxStorage()) {
    wx.setStorageSync(key, clone(value))
  }
  return clone(value)
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00+08:00`)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateLabel(dateString) {
  return dateString.replace(/-/g, ".")
}

function diffDays(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

function addDays(dateString, days) {
  const date = parseDate(dateString)
  return formatDate(new Date(date.getTime() + days * DAY_MS))
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}

function getNowDate() {
  return new Date()
}

function getNowIsoString() {
  return new Date().toISOString()
}

function formatDateTimeLabel(dateString) {
  if (!dateString) {
    return ""
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  const hours = `${date.getHours()}`.padStart(2, "0")
  const minutes = `${date.getMinutes()}`.padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function getTodayString() {
  return formatDate(getNowDate())
}

function readDataMeta() {
  return readStorage(DATA_META_KEY, { updatedAt: getNowIsoString() })
}

function writeDataMeta(nextMeta) {
  return writeStorage(DATA_META_KEY, nextMeta)
}

function touchDataMeta() {
  writeDataMeta({ updatedAt: getNowIsoString() })
}

function ensureSeedData() {
  const initialized = readStorage(ITEMS_INIT_KEY, false)
  const storedItems = readStorage(ITEMS_KEY, [])
  if (initialized && Array.isArray(storedItems)) {
    return storedItems
  }

  writeStorage(ITEMS_KEY, seedItems)
  writeStorage(ITEMS_INIT_KEY, true)
  touchDataMeta()
  return clone(seedItems)
}

function readRawItems() {
  return ensureSeedData()
}

function saveRawItems(items, options = {}) {
  writeStorage(ITEMS_KEY, items)
  if (!options.skipMeta) {
    touchDataMeta()
  }
  if (!options.skipCloudSync) {
    queueCloudSync()
  }
  return clone(items)
}

function readCustomTemplates() {
  return readStorage(CUSTOM_TEMPLATES_KEY, [])
}

function saveCustomTemplates(templates, options = {}) {
  writeStorage(CUSTOM_TEMPLATES_KEY, templates)
  if (!options.skipMeta) {
    touchDataMeta()
  }
  if (!options.skipCloudSync) {
    queueCloudSync()
  }
  return clone(templates)
}

function readCustomCategories() {
  return readStorage(CUSTOM_CATEGORIES_KEY, [])
}

function saveCustomCategories(categories, options = {}) {
  writeStorage(CUSTOM_CATEGORIES_KEY, categories)
  if (!options.skipMeta) {
    touchDataMeta()
  }
  if (!options.skipCloudSync) {
    queueCloudSync()
  }
  return clone(categories)
}

function getCategoryOptions() {
  return [
    ...baseCategoryOptions,
    ...readCustomCategories().map((item) => ({
      value: item.value,
      label: item.label
    }))
  ]
}

function getCustomCategories() {
  return readCustomCategories()
}

function getCustomCategoryRemainingCount() {
  return Math.max(0, MAX_EXTRA_CATEGORIES - readCustomCategories().length)
}

function getCategoryMetaByValue(category) {
  if (baseCategoryMeta[category]) {
    return baseCategoryMeta[category]
  }

  const customCategories = readCustomCategories()
  const index = customCategories.findIndex((item) => item.value === category)
  if (index > -1) {
    const palette = customCategoryPalette[index % customCategoryPalette.length]
    return {
      label: customCategories[index].label,
      color: palette.color,
      textColor: palette.textColor
    }
  }

  return baseCategoryMeta.other
}

function getCategoryLabel(category) {
  return getCategoryMetaByValue(category).label
}

function createCustomCategory(name) {
  const trimmedName = (name || "").trim()
  if (!trimmedName) {
    return { ok: false, reason: "empty" }
  }

  const customCategories = readCustomCategories()
  if (customCategories.length >= MAX_EXTRA_CATEGORIES) {
    return { ok: false, reason: "limit" }
  }

  const duplicated = getCategoryOptions().some((item) => item.label === trimmedName)
  if (duplicated) {
    return { ok: false, reason: "duplicated" }
  }

  const nextCategory = {
    value: `custom-category-${Date.now()}`,
    label: trimmedName
  }
  customCategories.push(nextCategory)
  saveCustomCategories(customCategories)
  return { ok: true, category: nextCategory }
}

function readUserProfile() {
  const profile = {
    ...defaultUserProfile,
    ...readStorage(USER_PROFILE_KEY, defaultUserProfile)
  }

  if (profile.loggedIn && !profile.cloudOpenId) {
    return {
      ...profile,
      loggedIn: false,
      cloudAvailable: false
    }
  }

  return profile
}

function saveUserProfile(profile) {
  return writeStorage(USER_PROFILE_KEY, {
    ...defaultUserProfile,
    ...profile
  })
}

function readUnlockState() {
  return {
    ...defaultUnlockState,
    ...readStorage(UNLOCK_STATE_KEY, defaultUnlockState)
  }
}

function saveUnlockState(unlockState, options = {}) {
  writeStorage(UNLOCK_STATE_KEY, {
    ...defaultUnlockState,
    ...unlockState
  })
  if (!options.skipMeta) {
    touchDataMeta()
  }
  if (!options.skipCloudSync) {
    queueCloudSync()
  }
  return readUnlockState()
}

async function callLifeCycleCloud(action, data = {}) {
  if (!canUseCloud()) {
    return { ok: false, reason: "cloud_unavailable" }
  }

  try {
    const result = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION_NAME,
      data: {
        action,
        ...data
      }
    })
    return {
      ok: true,
      data: normalizeCloudFunctionResult(result)
    }
  } catch (error) {
    return {
      ok: false,
      reason: inferCloudErrorReason(error),
      error,
      errorMessage: getCloudErrorMessage(error)
    }
  }
}

function getCloudUpdatedAt(payload = {}) {
  return payload.updatedAt || (payload.meta && payload.meta.updatedAt) || ""
}

function saveCloudSession(options = {}) {
  const profile = readUserProfile()
  const mergedProfile = mergeUserProfile(profile, options.userInfo)
  return saveUserProfile({
    ...profile,
    ...mergedProfile,
    loggedIn: true,
    cloudOpenId: options.openId || profile.cloudOpenId,
    lastLoginAt: options.lastLoginAt || profile.lastLoginAt || getNowIsoString(),
    lastSyncAt: options.lastSyncAt || profile.lastSyncAt,
    cloudAvailable: options.cloudAvailable !== false
  })
}

function buildCloudPayload() {
  const profile = readUserProfile()
  const unlockState = readUnlockState()
  const dataMeta = readDataMeta()
  return {
    items: readRawItems().map((item) => normalizeImageFields(item)),
    customTemplates: readCustomTemplates(),
    customCategories: readCustomCategories(),
    unlockState,
    meta: dataMeta,
    userProfile: {
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl
    },
    updatedAt: dataMeta.updatedAt,
    schemaVersion: CLOUD_SYNC_SCHEMA_VERSION
  }
}

function getPendingDeleteImageFileIds(item = {}) {
  return Array.isArray(item.pendingDeleteImageFileIds)
    ? item.pendingDeleteImageFileIds.filter((fileId, index, list) => isCloudFileId(fileId) && list.indexOf(fileId) === index)
    : []
}

async function deleteCloudFiles(fileIds = []) {
  const uniqueFileIds = fileIds.filter((fileId, index, list) => isCloudFileId(fileId) && list.indexOf(fileId) === index)
  if (!uniqueFileIds.length) {
    return { ok: true }
  }

  if (!canUseCloudStorage() || !wx.cloud || typeof wx.cloud.deleteFile !== "function") {
    return { ok: false, reason: "cloud_unavailable" }
  }

  try {
    await wx.cloud.deleteFile({
      fileList: uniqueFileIds
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: inferCloudErrorReason(error) === "cloud_call_failed" ? "image_delete_failed" : inferCloudErrorReason(error),
      error,
      errorMessage: getCloudErrorMessage(error)
    }
  }
}

function deleteCloudFilesBestEffort(fileIds = []) {
  const uniqueFileIds = fileIds.filter((fileId, index, list) => isCloudFileId(fileId) && list.indexOf(fileId) === index)
  if (!uniqueFileIds.length) {
    return
  }

  Promise.resolve()
    .then(() => deleteCloudFiles(uniqueFileIds))
    .catch(() => {})
}

async function uploadImageToCloud(localPath, profile, itemId) {
  if (!canUseCloudStorage()) {
    return { ok: false, reason: "cloud_unavailable" }
  }

  const resolvedImage = await resolveUploadableImagePath(localPath)
  if (!resolvedImage.ok) {
    return resolvedImage
  }

  try {
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: buildCloudImagePath(profile.cloudOpenId, itemId, resolvedImage.filePath),
      filePath: resolvedImage.filePath
    })

    return {
      ok: true,
      fileID: uploadResult.fileID || ""
    }
  } catch (error) {
    console.warn("Cloud image upload failed", {
      originalPath: localPath,
      resolvedPath: resolvedImage.filePath,
      error: getCloudErrorMessage(error)
    })
    return {
      ok: false,
      reason: inferCloudErrorReason(error) === "cloud_call_failed" ? "image_upload_failed" : inferCloudErrorReason(error),
      error,
      errorMessage: getCloudErrorMessage(error)
    }
  }
}

async function uploadImageForCurrentUser(localPath, itemId) {
  const profile = readUserProfile()
  if (!profile.loggedIn || !profile.cloudOpenId) {
    return { ok: false, reason: "not_logged_in" }
  }

  return uploadImageToCloud(localPath, profile, itemId)
}

async function ensureCloudImagesSynced() {
  const profile = readUserProfile()
  if (!profile.loggedIn || !profile.cloudOpenId) {
    return { ok: true }
  }

  const rawItems = readRawItems()
  let changed = false

  for (const item of rawItems) {
    const normalizedItem = normalizeImageFields(item)
    const pendingDeleteImageFileIds = getPendingDeleteImageFileIds(normalizedItem)
    const localImagePath = normalizedItem.imageLocalPath || (isLocalImagePath(normalizedItem.imageUrl) ? normalizedItem.imageUrl : "")

    if (!localImagePath) {
      if (pendingDeleteImageFileIds.length) {
        const deleteResult = await deleteCloudFiles(pendingDeleteImageFileIds)
        if (deleteResult.ok) {
          item.pendingDeleteImageFileIds = []
          changed = true
        }
      }
      continue
    }

    const uploadResult = await uploadImageToCloud(localImagePath, profile, item.id)
    if (!uploadResult.ok) {
      return uploadResult
    }

    item.imageFileId = uploadResult.fileID
    item.imageUrl = uploadResult.fileID
    item.imageLocalPath = ""
    item.pendingDeleteImageFileIds = pendingDeleteImageFileIds

    if (pendingDeleteImageFileIds.length) {
      const deleteResult = await deleteCloudFiles(pendingDeleteImageFileIds)
      if (deleteResult.ok) {
        item.pendingDeleteImageFileIds = []
      }
    }

    changed = true
  }

  if (changed) {
    saveRawItems(rawItems, { skipMeta: false, skipCloudSync: true })
  }

  return { ok: true }
}

function applyCloudPayload(payload) {
  if (Array.isArray(payload.items)) {
    saveRawItems(payload.items.map((item) => normalizeImageFields(item)), { skipMeta: true, skipCloudSync: true })
    writeStorage(ITEMS_INIT_KEY, true)
  }

  if (Array.isArray(payload.customTemplates)) {
    saveCustomTemplates(payload.customTemplates, { skipMeta: true, skipCloudSync: true })
  }

  if (Array.isArray(payload.customCategories)) {
    saveCustomCategories(payload.customCategories, { skipMeta: true, skipCloudSync: true })
  }

  if (payload.unlockState) {
    saveUnlockState(payload.unlockState, { skipMeta: true, skipCloudSync: true })
  }

  if (payload.meta && payload.meta.updatedAt) {
    writeDataMeta({ updatedAt: payload.meta.updatedAt })
  } else if (payload.updatedAt) {
    writeDataMeta({ updatedAt: payload.updatedAt })
  }

  if (payload.userProfile) {
    const profile = readUserProfile()
    saveUserProfile({
      ...profile,
      nickName: payload.userProfile.nickName || profile.nickName,
      avatarUrl: payload.userProfile.avatarUrl || profile.avatarUrl
    })
  }
}

async function fetchCloudPayload() {
  const result = await callLifeCycleCloud("fetchProfile")
  if (!result.ok) {
    return { found: false, reason: result.reason, error: result.error }
  }

  return {
    found: !!result.data.found,
    data: result.data.data || null,
    openId: result.data.openId || ""
  }
}

async function syncAllToCloud() {
  const profile = readUserProfile()
  if (!profile.loggedIn) {
    return { ok: false, reason: "not_logged_in" }
  }
  if (!canUseCloud()) {
    saveUserProfile({ ...profile, cloudAvailable: false })
    return { ok: false, reason: "cloud_unavailable" }
  }

  const imageSyncResult = await ensureCloudImagesSynced()
  if (!imageSyncResult.ok) {
    saveUserProfile({
      ...readUserProfile(),
      cloudAvailable: false
    })
    return imageSyncResult
  }

  const payload = buildCloudPayload()

  const result = await callLifeCycleCloud("syncProfile", { payload })
  if (!result.ok || result.data.ok === false) {
    saveUserProfile({
      ...readUserProfile(),
      cloudAvailable: false
    })
    return {
      ok: false,
      reason: result.reason || result.data.reason || "sync_failed",
      error: result.error
    }
  }

  saveCloudSession({
    openId: result.data.openId,
    lastSyncAt: result.data.lastSyncAt || getNowIsoString()
  })
  return { ok: true }
}

async function restoreAllFromCloud() {
  const profile = readUserProfile()
  if (!profile.loggedIn) {
    return { ok: false, reason: "not_logged_in" }
  }

  const remote = await fetchCloudPayload()
  if (!remote.found || !remote.data) {
    return { ok: false, reason: "remote_missing", error: remote.error }
  }

  applyCloudPayload(remote.data)
  saveCloudSession({
    openId: remote.openId,
    lastSyncAt: getNowIsoString()
  })
  return { ok: true }
}

async function prepareCloudAfterLogin(userInfo) {
  const loginResult = await callLifeCycleCloud("login", {
    userProfile: hasProfileContent(userInfo)
      ? {
          nickName: userInfo.nickName || "",
          avatarUrl: userInfo.avatarUrl || ""
        }
      : undefined
  })

  if (!loginResult.ok || loginResult.data.ok === false) {
    return {
      ok: false,
      reason: loginResult.reason || loginResult.data.reason || "cloud_unavailable"
    }
  }

  const lastLoginAt = getNowIsoString()
  const openId = loginResult.data.openId || ""
  const remoteData = loginResult.data.data || null

  saveCloudSession({
    openId,
    userInfo,
    lastLoginAt
  })

  if (!loginResult.data.found || !remoteData) {
    const syncResult = await syncAllToCloud()
    return {
      ok: syncResult.ok,
      reason: syncResult.reason,
      action: syncResult.ok ? "created_cloud" : "cloud_unavailable"
    }
  }

  const localUpdatedAt = readDataMeta().updatedAt
  const remoteUpdatedAt = getCloudUpdatedAt(remoteData)

  if (remoteUpdatedAt && remoteUpdatedAt > localUpdatedAt) {
    applyCloudPayload(remoteData)
    saveCloudSession({
      openId,
      userInfo,
      lastLoginAt,
      lastSyncAt: getNowIsoString()
    })
    return { ok: true, action: "restored_cloud" }
  }

  const syncResult = await syncAllToCloud()
  return {
    ok: syncResult.ok,
    reason: syncResult.reason,
    action: syncResult.ok ? "synced_local" : "cloud_unavailable"
  }
}

function queueCloudSync() {
  const profile = readUserProfile()
  if (!profile.loggedIn) {
    return
  }
  Promise.resolve()
    .then(() => syncAllToCloud())
    .catch(() => {})
}

function loginUser(userInfo = {}, options = {}) {
  return saveCloudSession({
    openId: options.openId || "",
    userInfo,
    lastLoginAt: options.lastLoginAt || getNowIsoString(),
    lastSyncAt: options.lastSyncAt || ""
  })
}

function logoutUser() {
  const profile = readUserProfile()
  return saveUserProfile({
    ...defaultUserProfile,
    nickName: profile.nickName,
    avatarUrl: profile.avatarUrl,
    cloudOpenId: profile.cloudOpenId
  })
}

function clearLocalData() {
  cleanupLocalImageFiles(readRawItems())
  writeStorage(ITEMS_KEY, [])
  writeStorage(ITEMS_INIT_KEY, true)
  writeStorage(CUSTOM_TEMPLATES_KEY, [])
  writeStorage(CUSTOM_CATEGORIES_KEY, [])
  writeStorage(UNLOCK_STATE_KEY, defaultUnlockState)
  writeDataMeta({ updatedAt: getNowIsoString() })
  return {
    itemCount: 0,
    customTemplateCount: 0
  }
}

function unlockCustomTemplates(method = "share") {
  return saveUnlockState({
    customTemplatesUnlocked: true,
    unlockMethod: method,
    unlockedAt: getNowIsoString()
  })
}

function getActionMeta(actionType) {
  return actionOptions.find((option) => option.value === actionType) || actionOptions[0]
}

function getActionVerb(actionType) {
  const mapping = {
    replace: "更换",
    wash: "清洗",
    expire: "处理"
  }
  return mapping[actionType] || "处理"
}

function decorateTemplate(template) {
  return {
    ...template,
    isCustom: template.id.indexOf("custom-template-") === 0
  }
}

function getAllTemplates() {
  return [...builtInTemplates, ...readCustomTemplates()].map(decorateTemplate)
}

function getTemplateById(templateId) {
  const normalizedTemplateId = LEGACY_TEMPLATE_MAP[templateId] || templateId
  return getAllTemplates().find((template) => template.id === normalizedTemplateId) || decorateTemplate(builtInTemplates[0])
}

function getTemplateTip(templateId) {
  const normalizedTemplateId = LEGACY_TEMPLATE_MAP[templateId] || templateId
  return templateTips[normalizedTemplateId] || null
}

function getTemplatesByCategory(category) {
  return getAllTemplates().filter((template) => template.category === category)
}

function getCustomTemplateCount() {
  return readCustomTemplates().length
}

function createCustomTemplate(payload) {
  const templates = readCustomTemplates()
  const template = {
    id: `custom-template-${Date.now()}`,
    name: payload.name.trim(),
    category: payload.category,
    actionType: actionOptions[0].value,
    cycleDays: Number(payload.cycleDays),
    remindThresholdDays: Number(payload.remindThresholdDays),
    recommendedText: `${Number(payload.cycleDays)} 天`
  }
  templates.unshift(template)
  saveCustomTemplates(templates)
  return decorateTemplate(template)
}

function updateCustomTemplate(payload) {
  const templates = readCustomTemplates()
  const target = templates.find((template) => template.id === payload.id)
  if (!target) {
    return null
  }

  target.name = payload.name.trim()
  target.category = payload.category
  target.cycleDays = Number(payload.cycleDays)
  target.remindThresholdDays = Number(payload.remindThresholdDays)
  target.recommendedText = `${Number(payload.cycleDays)} 天`
  saveCustomTemplates(templates)
  return decorateTemplate(target)
}

function deleteCustomTemplate(id) {
  const templates = readCustomTemplates()
  saveCustomTemplates(templates.filter((template) => template.id !== id))
}

function getDefaultTemplateForm() {
  const options = getCategoryOptions()
  return {
    id: "",
    name: "",
    category: options[0].value,
    cycleDays: 30,
    remindThresholdDays: 3
  }
}

function buildExpireAt(item) {
  return item.expireAt || addDays(item.startAt, item.cycleDays)
}

function getDescription(item, usedDays, cycleDays) {
  if (item.actionType === "replace") {
    return `已使用 ${usedDays} 天，建议 ${cycleDays} 天更换一次`
  }
  if (item.actionType === "wash") {
    return `距离上次清洗已过 ${usedDays} 天，建议 ${cycleDays} 天清洗一次`
  }
  if (item.category === "beauty") {
    return `已记录 ${usedDays} 天，建议结合标签和状态判断`
  }
  if (item.category === "medicine" || item.category === "food") {
    return `已记录 ${usedDays} 天，请优先参考包装到期日`
  }
  return `已记录 ${usedDays} 天，建议按设定周期处理`
}

function getStatusType(remainingDays, remindThresholdDays) {
  if (remainingDays < 0) {
    return "expired"
  }
  if (remainingDays === 0) {
    return "due_today"
  }
  if (remainingDays <= remindThresholdDays) {
    return "warning"
  }
  return "normal"
}

function getStatusText(remainingDays) {
  if (remainingDays < 0) {
    return `已超期 ${Math.abs(remainingDays)} 天`
  }
  if (remainingDays === 0) {
    return "今天到期"
  }
  return `还剩 ${remainingDays} 天`
}

function getProgressColor(remainingPercent) {
  if (remainingPercent === 0) {
    return "#E45D48"
  }
  if (remainingPercent < 30) {
    return "#FF8F1F"
  }
  if (remainingPercent < 60) {
    return "#F6B13A"
  }
  return "#6BA05C"
}

function decorateItem(item) {
  const normalizedItem = normalizeImageFields(item)
  const today = getNowDate()
  const expireAt = buildExpireAt(normalizedItem)
  const startDate = parseDate(normalizedItem.startAt)
  const expireDate = parseDate(expireAt)
  const cycleDays = Number(normalizedItem.cycleDays) || Math.max(1, diffDays(startDate, expireDate))
  const usedDays = Math.max(0, diffDays(startDate, today))
  const remainingDays = diffDays(today, expireDate)
  const denominator = Math.max(1, expireDate.getTime() - startDate.getTime())
  const remainingPercent = clamp(
    Math.round(((expireDate.getTime() - today.getTime()) / denominator) * 100),
    0,
    100
  )
  const categoryInfo = getCategoryMetaByValue(normalizedItem.category)
  const actionMeta = getActionMeta(normalizedItem.actionType)
  const template = getTemplateById(normalizedItem.templateId || "tpl-custom")

  return {
    ...normalizedItem,
    expireAt,
    cycleDays,
    usedDays,
    remainingDays,
    remainingPercent,
    progressColor: getProgressColor(remainingPercent),
    statusType: getStatusType(remainingDays, Number(normalizedItem.remindThresholdDays) || 0),
    statusText: getStatusText(remainingDays),
    descriptionText: getDescription(normalizedItem, usedDays, cycleDays),
    displayInitial: (normalizedItem.name || "?").slice(0, 1),
    categoryLabel: categoryInfo.label,
    categoryColor: categoryInfo.color,
    categoryTextColor: categoryInfo.textColor,
    actionLabel: actionMeta.label,
    startLabel: actionMeta.startLabel,
    templateName: template.name,
    timeline: clone(normalizedItem.timeline || [])
  }
}

function sortItems(items) {
  const priorityMap = { expired: 0, due_today: 1, warning: 2, normal: 3 }
  return [...items].sort((a, b) => {
    const statusDiff = priorityMap[a.statusType] - priorityMap[b.statusType]
    if (statusDiff !== 0) {
      return statusDiff
    }
    return a.remainingDays - b.remainingDays
  })
}

function getAllItems() {
  return readRawItems().map(decorateItem)
}

function getHomeItems(filters = {}) {
  const { status = "all", category = "" } = filters
  let items = getAllItems()

  if (status === "upcoming") {
    items = items.filter((item) => item.statusType === "warning" || item.statusType === "due_today")
  } else if (status === "expired") {
    items = items.filter((item) => item.statusType === "expired")
  }

  if (category) {
    items = items.filter((item) => item.category === category)
  }

  return sortItems(items)
}

function getItemById(id) {
  const item = readRawItems().find((rawItem) => rawItem.id === id)
  return item ? decorateItem(item) : null
}

function getDefaultCreateForm() {
  const template = builtInTemplates[0]
  return {
    id: "",
    templateId: template.id,
    name: template.name,
    category: template.category,
    actionType: actionOptions[0].value,
    cycleDays: template.cycleDays,
    remindThresholdDays: template.remindThresholdDays,
    startAt: getTodayString(),
    imageUrl: "",
    imageFileId: "",
    imageLocalPath: ""
  }
}

function getCreateFormByItemId(id) {
  const item = readRawItems().find((rawItem) => rawItem.id === id)
  if (!item) {
    return null
  }

  const normalizedItem = normalizeImageFields(item)

  return {
    id: normalizedItem.id,
    templateId: normalizedItem.templateId || "tpl-custom",
    name: normalizedItem.name,
    category: normalizedItem.category,
    actionType: normalizedItem.actionType,
    cycleDays: normalizedItem.cycleDays,
    remindThresholdDays: normalizedItem.remindThresholdDays,
    startAt: normalizedItem.startAt,
    imageUrl: normalizedItem.imageUrl,
    imageFileId: normalizedItem.imageFileId,
    imageLocalPath: normalizedItem.imageLocalPath || ""
  }
}

function buildTimelineForCreate(item) {
  const titleMap = {
    replace: "开始使用",
    wash: "上次清洗",
    expire: "开始记录"
  }

  return [
    {
      date: formatDateLabel(item.startAt),
      title: titleMap[item.actionType] || "开始记录",
      detail: `设置了 ${item.cycleDays} 天${getActionVerb(item.actionType)}周期`
    }
  ]
}

function createItem(payload) {
  const rawItems = readRawItems()
  const item = normalizeImageFields({
    id: `item-${Date.now()}`,
    templateId: payload.templateId || "tpl-custom",
    name: payload.name.trim(),
    category: payload.category,
    actionType: payload.actionType,
    startAt: payload.startAt,
    cycleDays: Number(payload.cycleDays),
    remindThresholdDays: Number(payload.remindThresholdDays),
    imageUrl: payload.imageUrl || payload.imageFileId || "",
    imageFileId: payload.imageFileId || (isCloudFileId(payload.imageUrl) ? payload.imageUrl : ""),
    imageLocalPath: payload.imageLocalPath || "",
    pendingDeleteImageFileIds: [],
    timeline: buildTimelineForCreate(payload)
  })

  rawItems.unshift(item)
  saveRawItems(rawItems)
  return decorateItem(item)
}

function updateItem(payload) {
  const rawItems = readRawItems()
  const target = rawItems.find((item) => item.id === payload.id)
  if (!target) {
    return null
  }

  const previousItem = normalizeImageFields(target)
  const previousImageFileId = previousItem.imageFileId
  const previousLocalPaths = [previousItem.imageUrl, previousItem.imageLocalPath].filter((path, index, list) => {
    return isLocalImagePath(path) && list.indexOf(path) === index
  })

  target.templateId = payload.templateId || "tpl-custom"
  target.name = payload.name.trim()
  target.category = payload.category
  target.actionType = payload.actionType
  target.startAt = payload.startAt
  target.cycleDays = Number(payload.cycleDays)
  target.remindThresholdDays = Number(payload.remindThresholdDays)
  target.imageUrl = payload.imageUrl || payload.imageFileId || ""
  target.imageFileId = payload.imageFileId || (isCloudFileId(payload.imageUrl) ? payload.imageUrl : "")
  target.imageLocalPath = payload.imageLocalPath || ""
  target.timeline = [
    {
      date: formatDateLabel(getTodayString()),
      title: "编辑信息",
      detail: "更新了名称、周期或提醒设置"
    },
    ...(target.timeline || [])
  ]

  const normalizedTarget = normalizeImageFields(target)
  const nextPendingDeleteImageFileIds = getPendingDeleteImageFileIds(previousItem)
  const nextImageHasUploadedCloudFile = !!normalizedTarget.imageFileId
  const nextImageNeedsUpload = !!normalizedTarget.imageLocalPath && !normalizedTarget.imageFileId
  const nextImageRemoved = !normalizedTarget.imageUrl && !normalizedTarget.imageFileId && !normalizedTarget.imageLocalPath

  if (previousImageFileId && previousImageFileId !== normalizedTarget.imageFileId) {
    if (nextImageNeedsUpload) {
      nextPendingDeleteImageFileIds.push(previousImageFileId)
    } else if (nextImageHasUploadedCloudFile || nextImageRemoved) {
      deleteCloudFilesBestEffort([previousImageFileId])
    }
  }

  normalizedTarget.pendingDeleteImageFileIds = nextPendingDeleteImageFileIds.filter((fileId, index, list) => {
    return isCloudFileId(fileId) && list.indexOf(fileId) === index
  })

  Object.assign(target, normalizedTarget)
  saveRawItems(rawItems)

  const nextLocalPaths = [normalizedTarget.imageUrl, normalizedTarget.imageLocalPath].filter((path, index, list) => {
    return isLocalImagePath(path) && list.indexOf(path) === index
  })
  const removedLocalPaths = previousLocalPaths.filter((path) => !nextLocalPaths.includes(path))
  if (removedLocalPaths.length) {
    cleanupLocalImageFiles(removedLocalPaths.map((filePath) => ({ imageUrl: filePath })))
  }

  return decorateItem(target)
}

function completeItem(id) {
  const items = readRawItems()
  const target = items.find((item) => item.id === id)
  if (!target) {
    return null
  }

  const today = getTodayString()
  target.startAt = today
  target.timeline = [
    {
      date: formatDateLabel(today),
      title: `已${getActionVerb(target.actionType)}`,
      detail: `已自动续到下一轮 ${target.cycleDays} 天周期`
    },
    ...(target.timeline || [])
  ]

  saveRawItems(items)
  return decorateItem(target)
}

function deleteItem(id) {
  const items = readRawItems()
  const target = items.find((item) => item.id === id)
  if (!target) {
    return
  }

  const normalizedTarget = normalizeImageFields(target)
  const cloudFileIds = [normalizedTarget.imageFileId, ...getPendingDeleteImageFileIds(normalizedTarget)].filter((fileId, index, list) => {
    return isCloudFileId(fileId) && list.indexOf(fileId) === index
  })

  cleanupLocalImageFiles([normalizedTarget])
  saveRawItems(items.filter((item) => item.id !== id))
  deleteCloudFilesBestEffort(cloudFileIds)
}

function getSyncOverview() {
  const profile = readUserProfile()
  const dataMeta = readDataMeta()
  const lastSyncValue = profile.lastSyncAt ? formatDateTimeLabel(profile.lastSyncAt) : "暂无"
  const lastLocalChangeAt = dataMeta.updatedAt || ""
  const hasLocalChangeRecord = !!lastLocalChangeAt
  const hasPendingLocalChanges = !!(profile.loggedIn && (!profile.lastSyncAt || lastLocalChangeAt > profile.lastSyncAt))
  const localChangeLabel = hasLocalChangeRecord ? formatDateTimeLabel(lastLocalChangeAt) : ""

  if (!profile.loggedIn) {
    return {
      mode: "guest",
      title: "当前为本地模式",
      detail: "默认数据保存在本机，登录后会尝试同步到云端。",
      lastSyncLabel: "最近一次同步成功",
      lastSyncValue: "尚未登录",
      pendingLabel: "未同步本地修改",
      pendingValue: "当前修改仅保存在本机",
      pendingDetail: hasLocalChangeRecord ? `最近一次本地修改：${localChangeLabel}` : "",
      hasPendingLocalChanges: false
    }
  }
  if (profile.cloudAvailable) {
    return {
      mode: "cloud",
      title: "当前为云端同步模式",
      detail: hasPendingLocalChanges ? "检测到新的本地修改，等待下一次云端同步。" : "云端数据已是最新状态。",
      lastSyncLabel: "最近一次同步成功",
      lastSyncValue,
      pendingLabel: "未同步本地修改",
      pendingValue: hasPendingLocalChanges ? "有，等待同步" : "无，已同步完成",
      pendingDetail: hasPendingLocalChanges ? `最近一次本地修改：${localChangeLabel}` : "",
      hasPendingLocalChanges
    }
  }
  return {
    mode: "local",
    title: "已登录，但云端未连接",
    detail: "当前仍使用本地数据；配置云开发后可继续同步。",
    lastSyncLabel: "最近一次同步成功",
    lastSyncValue: profile.lastSyncAt ? lastSyncValue : "暂无成功记录",
    pendingLabel: "未同步本地修改",
    pendingValue: hasPendingLocalChanges ? "有，等待云端可用后同步" : "无，本地与最近一次同步一致",
    pendingDetail: hasPendingLocalChanges ? `最近一次本地修改：${localChangeLabel}` : "",
    hasPendingLocalChanges
  }
}

function getProfileSummary() {
  const profile = readUserProfile()
  const unlockState = readUnlockState()
  return {
    profile,
    unlockState,
    syncOverview: getSyncOverview(),
    managedCount: getAllItems().length,
    customTemplateCount: getCustomTemplateCount()
  }
}

module.exports = {
  categoryMeta: baseCategoryMeta,
  categoryOptions: baseCategoryOptions,
  getCategoryOptions,
  getCustomCategories,
  getCustomCategoryRemainingCount,
  createCustomCategory,
  MAX_EXTRA_CATEGORIES,
  actionOptions,
  statusOptions,
  quickTemplates: builtInTemplates,
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getTemplateTip,
  getDefaultTemplateForm,
  getCustomTemplateCount,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  getAllItems,
  getHomeItems,
  getItemById,
  getDefaultCreateForm,
  getCreateFormByItemId,
  getCategoryLabel,
  createItem,
  updateItem,
  completeItem,
  deleteItem,
  getActionMeta,
  getProfileSummary,
  getSyncOverview,
  readUserProfile,
  loginUser,
  uploadImageForCurrentUser,
  logoutUser,
  clearLocalData,
  prepareCloudAfterLogin,
  syncAllToCloud,
  restoreAllFromCloud,
  readUnlockState,
  unlockCustomTemplates
}
