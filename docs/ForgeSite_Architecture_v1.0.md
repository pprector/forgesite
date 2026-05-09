# ForgeSite 技术架构文档

> **产品名称：** ForgeSite  
> **文档版本：** v1.0  
> **面向读者：** 研发、测试、DevOps、AI 工程、产品技术负责人  
> **依据文档：** [ForgeSite_PRD_v1.0.md](./ForgeSite_PRD_v1.0.md)  
> **状态：** 初稿  
> **日期：** 2026-05-09

---

## 目录

1. [架构目标与原则](#1-架构目标与原则)
2. [业务上下文与核心链路](#2-业务上下文与核心链路)
3. [总体系统架构](#3-总体系统架构)
4. [系统模块设计](#4-系统模块设计)
5. [核心领域模型](#5-核心领域模型)
6. [数据模型设计](#6-数据模型设计)
7. [AI 工作流架构](#7-ai-工作流架构)
8. [网站生成与发布架构](#8-网站生成与发布架构)
9. [SEO / GEO 架构](#9-seo--geo-架构)
10. [转化与数据分析架构](#10-转化与数据分析架构)
11. [安全架构](#11-安全架构)
12. [可观测性与运维架构](#12-可观测性与运维架构)
13. [性能、容量与可靠性设计](#13-性能容量与可靠性设计)
14. [推荐技术栈](#14-推荐技术栈)
15. [MVP 交付边界](#15-mvp-交付边界)
16. [演进路线](#16-演进路线)
17. [风险与技术应对](#17-风险与技术应对)

---

## 1. 架构目标与原则

### 1.1 架构目标

ForgeSite 是一个 AI 驱动的展示官网自动生成 SaaS。MVP 阶段的技术架构需要支撑以下目标：

1. **10 分钟内完成建站闭环**：从上传资料、AI 解析、结构推荐、生成网站、预览编辑到发布上线。
2. **5 分钟内生成首版网站**：资料确认后，系统可在异步任务中完成页面内容生成、SEO/GEO 生成、静态站点构建和预览输出。
3. **支持多类型素材解析**：PDF、Excel、Word、PPT、图片、URL 等输入源，并保留来源引用。
4. **AI 动态结构推荐**：不依赖固定行业模板包，由 AI 根据素材内容推荐页面、模块和排序。
5. **防止 AI 幻觉进入关键事实**：认证、年份、产能、出口国家、资质等关键事实必须有来源或用户确认。
6. **静态站点高性能发布**：生成不可变版本，发布到子域名，支持草稿站和正式站。
7. **SEO/GEO 原生内置**：自动生成 sitemap、robots、meta、JSON-LD、DirectAnswer、EvidenceBlock、FAQ 等内容。
8. **可演进到多租户商业 SaaS**：MVP 支持单用户多项目，后续扩展 Agency、多站点、多语言、自定义域名和白标。

### 1.2 设计原则

| 原则 | 说明 |
|---|---|
| MVP 优先 | 先实现从资料上传到二级域名发布的核心闭环，避免复杂 CMS、拖拽编辑器、购物车等非目标能力。 |
| 异步优先 | 文件解析、OCR、URL 抓取、AI 提取、网站生成、发布构建均作为异步任务执行。 |
| 来源可追溯 | 所有结构化字段、事实内容、SEO/GEO Evidence 都要保存 source reference。 |
| 静态前台、动态后台 | 访客访问的是静态站点，后台负责生成、编辑、发布和数据统计。 |
| 版本不可变 | 每次发布生成 immutable artifact，便于回滚、审计和缓存。 |
| 模块化页面 | 页面由模块组成，AI 推荐模块组合，用户只做轻量调整。 |
| 多租户隔离 | 数据、文件、发布产物和统计事件都必须按 user/project/site 维度隔离。 |
| 可替换 AI Provider | AI 编排层抽象模型调用，避免绑定单一模型供应商。 |

---

## 2. 业务上下文与核心链路

### 2.1 核心业务对象

ForgeSite 围绕“项目”组织建站过程：

```text
User
  └── Project
        ├── Materials
        ├── ExtractionResult
        ├── SiteStructureProposal
        ├── WebsiteDraft
        ├── ContactConfig
        ├── PublishVersion
        ├── Lead
        └── AnalyticsEvent
```

### 2.2 MVP 主链路

```text
注册/登录
  ↓
创建项目并填写基础信息
  ↓
上传素材或输入旧网站 URL
  ↓
异步解析素材，生成解析报告
  ↓
AI 提取公司/个人、产品/服务、资质、联系方式等结构化信息
  ↓
用户审核提取结果，确认高置信度字段，修正低置信度字段
  ↓
AI 推荐网站结构：页面列表 + 页面模块 + 模块排序 + 推荐原因 + 置信度
  ↓
用户确认结构，可增删页面、隐藏模块、调整顺序
  ↓
选择模板风格
  ↓
AI 生成页面内容、SEO/GEO 内容、结构化数据
  ↓
渲染为静态站点并进入预览环境
  ↓
用户轻量编辑：文案、图片、产品信息、SEO 描述、联系方式
  ↓
发布到 customer.forgesite.com 子域名
  ↓
采集访问事件、联系按钮点击、表单询盘
```

### 2.3 关键用例

| 用例 | 参与者 | 技术重点 |
|---|---|---|
| 上传素材 | 站点管理员 | 分片上传、文件校验、病毒扫描、对象存储、异步解析任务。 |
| AI 信息提取 | AI Worker | 文本/OCR/表格抽取、分块、结构化输出、来源引用、置信度。 |
| 网站结构推荐 | AI Worker | 实体识别、内容盘点、页面/模块推荐、置信度和推荐原因。 |
| 生成网站 | Site Generator | 模块内容生成、模板渲染、SEO/GEO 注入、静态资源构建。 |
| 发布站点 | Publish Service | 不可变版本、CDN 缓存、子域名路由、回滚。 |
| 提交询盘 | 访客 | 表单校验、反垃圾、邮件通知、后台管理。 |
| 查看看板 | 站点管理员 | 事件采集、聚合统计、Top 页面、渠道点击、国家地区。 |

---

## 3. 总体系统架构

### 3.1 架构分层

```text
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  Admin Web / Public Static Site / Tracking Script / Webhook   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
│  Auth / Rate Limit / Tenant Context / Request Validation      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Application Layer                      │
│ Project / Material / Extraction / Structure / Website / SEO   │
│ Contact / Publish / Analytics / Lead / Billing-lite           │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│       Async Worker Layer      │  │       AI Orchestration      │
│ Parse / OCR / Crawl / Build   │  │ Prompt / Schema / Guardrail │
│ Publish / Email / Analytics   │  │ Provider Adapter / Eval     │
└──────────────────────────────┘  └────────────────────────────┘
                 │                         │
                 ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Data Layer                           │
│ PostgreSQL / Object Storage / Redis / Search Index / Queue    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Infrastructure                   │
│ CDN / DNS / Email / AI Provider / OCR / URL Fetcher / GeoIP    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 部署视图

```text
Internet
  │
  ├── Admin Web CDN ───────► Admin SPA / SSR App
  │                              │
  │                              ▼
  │                         Backend API
  │                              │
  │          ┌───────────────────┼───────────────────┐
  │          ▼                   ▼                   ▼
  │     PostgreSQL            Redis               Queue
  │          │                   │                   │
  │          ▼                   ▼                   ▼
  │   Object Storage ◄────── Worker Pool ───────► AI Provider
  │          │                   │
  │          ▼                   ▼
  └── Public Site CDN ◄── Published Static Artifacts
             │
             ▼
      customer.forgesite.com
```

### 3.3 运行时边界

| 边界 | 职责 | 是否对公网暴露 |
|---|---|---|
| Admin Web | 后台管理、上传、编辑、预览、发布操作 | 是 |
| Public Site | 生成后的静态官网 | 是 |
| Backend API | 业务 API、认证、租户隔离、任务调度 | 是，需鉴权 |
| Worker Pool | 文件解析、AI、构建、发布、邮件等后台任务 | 否 |
| AI Orchestrator | Prompt、JSON Schema、Guardrail、Provider 适配 | 否 |
| Storage | 原始素材、解析结果、图片、发布产物 | 否，通过签名 URL 或 CDN 访问 |
| Queue | 异步任务队列 | 否 |

---

## 4. 系统模块设计

### 4.1 管理后台 Admin Web

**职责：**

- 登录、注册、项目管理。
- 素材上传与解析状态展示。
- AI 提取结果审核。
- 网站结构推荐确认。
- 页面内容、模块、图片和 SEO 配置轻量编辑。
- 联系方式配置。
- 预览和发布。
- 数据看板与询盘管理。

**关键页面：**

| 页面 | 功能 |
|---|---|
| Dashboard | 项目状态、建站进度、访问和询盘摘要。 |
| Materials | 文件上传、URL 输入、解析状态、素材管理。 |
| AI Extraction | 结构化信息审核、置信度、来源引用、待确认项。 |
| Website Structure | AI 推荐页面与模块、增删调整、确认。 |
| Website Editor | 轻量内容编辑、图片替换、模块显隐、重新生成。 |
| SEO/GEO | 页面 SEO、GEO Score、JSON-LD、优化建议。 |
| Leads | 表单提交、渠道来源、导出 CSV。 |
| Analytics | 页面访问、国家地区、渠道点击、热门页面。 |
| Settings | 项目设置、联系方式、发布域名、套餐。 |

### 4.2 Backend API

Backend API 是核心业务编排层，建议按领域拆分模块，而非 MVP 阶段过早拆微服务。

| 模块 | 职责 |
|---|---|
| Auth Module | 用户注册登录、会话、权限、租户上下文。 |
| Project Module | 项目生命周期、站点基础信息、项目状态机。 |
| Material Module | 文件元数据、上传签名、解析状态、素材分组。 |
| Extraction Module | AI 提取任务创建、结果保存、用户确认。 |
| Structure Module | 页面结构推荐、模块组合、用户调整、最终结构。 |
| Website Module | 草稿站点、页面、模块实例、内容块、图片引用。 |
| Template Module | 模板风格、模块渲染配置、主题变量。 |
| SEO/GEO Module | SEO 元数据、GEO 内容单元、JSON-LD、质量评分。 |
| Contact Module | 表单、邮箱、WhatsApp、微信、电话、LinkedIn 配置。 |
| Publish Module | 构建任务、发布版本、预览版本、回滚。 |
| Lead Module | 表单询盘、邮件通知、导出。 |
| Analytics Module | 事件接收、清洗、聚合查询。 |
| Admin/Internal Module | 任务重试、AI 调用记录、系统配置。 |

### 4.3 Worker Pool

所有耗时任务必须异步化。

| Worker | 输入 | 输出 |
|---|---|---|
| File Parse Worker | material_id | extracted_text、table_blocks、image_assets、metadata。 |
| OCR Worker | image/pdf page | OCR text、bounding boxes、confidence。 |
| URL Crawl Worker | url | page text、images、metadata、links。 |
| Extraction Worker | project_id + parsed blocks | structured extraction result。 |
| Structure Recommendation Worker | extraction_result_id | site structure proposal。 |
| Content Generation Worker | final structure + knowledge base | website draft pages/modules。 |
| SEO/GEO Worker | generated pages | meta、schema、GEO units、score。 |
| Static Build Worker | website_draft/version | HTML、assets、sitemap、robots。 |
| Publish Worker | build artifact | published version、CDN invalidation。 |
| Email Worker | lead/event | notification email。 |
| Analytics Aggregate Worker | raw events | daily aggregates。 |

### 4.4 AI Orchestration Layer

AI 编排层不直接散落在业务代码中，应作为统一基础能力：

- Prompt Template 管理。
- JSON Schema / Structured Output 管理。
- 模型 Provider Adapter。
- Token 预算与上下文裁剪。
- 输入内容脱敏与安全过滤。
- 输出校验与自动修复。
- 来源引用校验。
- AI 调用日志、成本统计和重试。
- 质量评分与 Guardrail。

---

## 5. 核心领域模型

### 5.1 项目状态机

```text
DRAFT
  ↓
MATERIAL_UPLOADING
  ↓
PARSING
  ↓
EXTRACTING
  ↓
EXTRACTION_REVIEW
  ↓
STRUCTURE_RECOMMENDING
  ↓
STRUCTURE_REVIEW
  ↓
GENERATING
  ↓
PREVIEW_READY
  ↓
PUBLISHED
```

异常状态：

```text
PARSE_PARTIAL_FAILED
EXTRACTION_FAILED
GENERATION_FAILED
PUBLISH_FAILED
ARCHIVED
```

设计要求：

- 文件级失败不应阻断项目整体流程。
- 项目状态由任务状态聚合得出，避免手动写错。
- 每个关键状态变化写入 audit log。

### 5.2 素材模型

```text
Material
  id
  project_id
  type: PDF | EXCEL | WORD | PPT | IMAGE | URL
  original_name
  storage_key
  size_bytes
  mime_type
  parse_status
  parse_error
  metadata
  created_at
```

```text
ParsedBlock
  id
  material_id
  project_id
  block_type: TEXT | TABLE | IMAGE | OCR_TEXT | URL_TEXT
  content
  structured_payload
  source_ref
  confidence
  embedding_id
```

`source_ref` 示例：

```json
{
  "materialId": "mat_123",
  "fileName": "product-catalog.pdf",
  "page": 8,
  "row": null,
  "textSnippet": "Monthly capacity: 50,000 units"
}
```

### 5.3 AI 提取结果模型

```text
ExtractionResult
  id
  project_id
  version
  status
  entity_type
  language
  summary
  created_at
```

```text
ExtractedField
  id
  extraction_result_id
  field_path
  value_json
  confidence
  source_refs[]
  review_status: ACCEPTED | REJECTED | EDITED | PENDING
  user_value_json
```

关键规则：

- `confidence >= 0.8` 可默认建议接受，但仍允许用户编辑。
- 关键事实字段必须具备 `source_refs` 或 `review_status=ACCEPTED/EDITED`。
- 低置信度字段不进入最终站点，除非用户确认。

### 5.4 网站结构模型

```text
SiteStructureProposal
  id
  project_id
  extraction_result_id
  status: PROPOSED | ACCEPTED | MODIFIED | REJECTED
  confidence
  rationale
```

```text
PageDefinition
  id
  proposal_id
  page_type: HOME | PRODUCT_LIST | PRODUCT_DETAIL | ABOUT | CONTACT | CAPABILITY | CERTIFICATE | CUSTOM
  title
  slug
  order_index
  confidence
  recommendation_reason
  enabled
```

```text
ModuleDefinition
  id
  page_definition_id
  module_type: HERO | VALUE_PROPS | PRODUCT_GRID | SPEC_TABLE | IMAGE_GALLERY | FAQ | CTA | ...
  order_index
  data_binding
  confidence
  enabled
```

### 5.5 网站草稿与发布模型

```text
WebsiteDraft
  id
  project_id
  template_id
  status
  current_version
  language
```

```text
WebsitePage
  id
  draft_id
  page_type
  title
  slug
  seo_title
  meta_description
  canonical_url
  status
```

```text
WebsiteModule
  id
  page_id
  module_type
  order_index
  content_json
  source_refs[]
  ai_generated
  user_modified
  visible
```

```text
PublishVersion
  id
  project_id
  version_no
  type: PREVIEW | PRODUCTION
  artifact_key
  domain
  status
  published_at
  created_by
```

---

## 6. 数据模型设计

### 6.1 数据库选型

MVP 推荐使用 PostgreSQL 作为主数据库，原因：

- 支持事务、JSONB、全文检索、复杂查询。
- 可通过 pgvector 扩展支持素材分块向量检索。
- 适合 SaaS 多租户的关系型数据建模。
- 后续可平滑拆分读库、归档库或分析库。

### 6.2 主要表设计

#### users

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| email | varchar | 登录邮箱，唯一 |
| password_hash | varchar | 密码哈希 |
| name | varchar | 用户名 |
| plan | varchar | Free / Pro / Agency |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

#### projects

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| owner_id | uuid | 用户 ID |
| name | varchar | 项目名 |
| business_name | varchar | 公司/个人名称 |
| industry | varchar | 行业 |
| one_liner | text | 一句话简介 |
| status | varchar | 项目状态 |
| default_language | varchar | 默认生成语言 |
| subdomain | varchar | 二级域名前缀 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

#### materials

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| project_id | uuid | 项目 ID |
| type | varchar | PDF/EXCEL/WORD/PPT/IMAGE/URL |
| source_url | text | URL 类型素材地址 |
| original_name | varchar | 原始文件名 |
| storage_key | text | 对象存储 Key |
| mime_type | varchar | MIME 类型 |
| size_bytes | bigint | 文件大小 |
| parse_status | varchar | WAITING/PARSING/DONE/FAILED |
| parse_error | text | 错误信息 |
| metadata | jsonb | 页数、宽高、表格数量等 |
| created_at | timestamptz | 创建时间 |

#### parsed_blocks

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| project_id | uuid | 项目 ID |
| material_id | uuid | 素材 ID |
| block_type | varchar | TEXT/TABLE/IMAGE/OCR_TEXT/URL_TEXT |
| content | text | 文本内容 |
| structured_payload | jsonb | 表格、图片、OCR 坐标等结构化数据 |
| source_ref | jsonb | 来源引用 |
| confidence | numeric | 解析置信度 |
| embedding | vector | 可选，向量检索 |
| created_at | timestamptz | 创建时间 |

#### extraction_results / extracted_fields

保存 AI 提取版本与字段级审核状态。`extracted_fields.field_path` 建议使用点路径，例如：

- `profile.name`
- `profile.contacts.email`
- `products[0].specs.material`
- `certificates[0].issuer`

#### site_structure_proposals / page_definitions / module_definitions

保存 AI 推荐结构及用户确认后的结构。推荐结构和最终结构建议保留版本，便于回溯 AI 推荐质量。

#### website_drafts / website_pages / website_modules

保存可编辑草稿站点。页面模块内容使用 JSONB，以支持不同模块类型的差异化结构。

#### publish_versions

保存每次预览/正式发布的不可变版本。

#### contact_configs

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| project_id | uuid | 项目 ID |
| channel | varchar | FORM/EMAIL/WHATSAPP/WECHAT/PHONE/LINKEDIN |
| enabled | boolean | 是否启用 |
| config_json | jsonb | 渠道配置 |
| display_json | jsonb | 展示位置、按钮文案等 |

#### leads

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| project_id | uuid | 项目 ID |
| source_page | text | 来源页面 |
| source_channel | varchar | FORM/WHATSAPP/EMAIL 等 |
| payload | jsonb | 表单内容 |
| visitor_context | jsonb | IP 国家、UA、referrer |
| status | varchar | NEW/CONTACTED/CLOSED/SPAM |
| created_at | timestamptz | 创建时间 |

#### analytics_events / analytics_daily_stats

MVP 可同时保留原始事件和日聚合数据：

```text
analytics_events
  id, project_id, site_version_id, event_type, page_path,
  referrer, country, user_agent, session_id, payload, created_at
```

```text
analytics_daily_stats
  id, project_id, date, metric_name, dimension_json, value
```

### 6.3 多租户隔离策略

- 所有业务表必须包含 `project_id` 或通过关联可追溯到 `project_id`。
- API 层从认证上下文注入 `owner_id`，所有查询必须加租户过滤。
- 对象存储 Key 按 `tenant/{user_id}/project/{project_id}/...` 分层。
- 发布产物按 `sites/{project_id}/versions/{version_no}/...` 分层。
- 后续可启用 PostgreSQL Row Level Security。

---

## 7. AI 工作流架构

### 7.1 AI 总流程

```text
素材解析结果
  ↓
内容标准化与分块
  ↓
实体识别
  ↓
内容盘点
  ↓
结构化信息提取
  ↓
用户审核与补全
  ↓
网站结构推荐
  ↓
用户确认结构
  ↓
页面模块内容生成
  ↓
SEO/GEO 生成
  ↓
质量校验与防幻觉检查
  ↓
生成网站草稿
```

### 7.2 Prompt 分层

| Prompt 类型 | 用途 | 输出 |
|---|---|---|
| Material Understanding Prompt | 理解素材块内容、判断内容类别 | block tags、summary、entities |
| Entity Recognition Prompt | 判断展示主体类型 | company/person/service_provider/other |
| Extraction Prompt | 提取公司、产品、服务、资质、联系方式等 | JSON Schema |
| Structure Recommendation Prompt | 推荐页面与模块组合 | Page + Module JSON |
| Content Generation Prompt | 生成每个模块的内容 | Module Content JSON |
| SEO Prompt | 生成 title、meta、alt、slug、OG | SEO metadata JSON |
| GEO Prompt | 生成 DirectAnswer、Evidence、FAQ、HowToChoose 等 | GEO units JSON |
| Quality Check Prompt | 校验事实、重复、完整性、GEO Score | score + issues |

### 7.3 Structured Output 约束

AI 输出必须采用 JSON Schema，禁止直接将自由文本作为系统状态写入数据库。示例：

```json
{
  "entityType": "MANUFACTURING_COMPANY",
  "profile": {
    "name": {
      "value": "ABC Hardware Co., Ltd.",
      "confidence": 0.92,
      "sourceRefs": ["src_001"]
    }
  },
  "products": [
    {
      "name": {
        "value": "Stainless Steel Hinge",
        "confidence": 0.88,
        "sourceRefs": ["src_021", "src_022"]
      }
    }
  ]
}
```

### 7.4 来源引用机制

AI 工作流必须先建立 `SourceRef Registry`：

```text
src_001 -> material_id=mat_1, page=1, text="ABC Hardware Co., Ltd."
src_021 -> material_id=mat_2, row=18, text="Stainless Steel Hinge"
```

模型输出只允许引用已存在的 `src_xxx`。服务端保存前需要校验：

1. `sourceRefs` 是否存在。
2. 引用来源是否属于当前项目。
3. 关键事实字段是否至少有一个来源或用户确认。
4. 引用片段与生成内容是否存在明显矛盾。

### 7.5 防幻觉规则

| 字段类型 | 规则 |
|---|---|
| 关键事实 | 必须有来源或用户确认，如认证、年份、产能、出口国家、设备数量、客户名称。 |
| 营销表达 | 可由 AI 生成，但不得引入未经证实的事实。 |
| SEO/GEO 摘要 | 可由 AI 改写，但必须基于已确认资料和页面内容。 |
| FAQ | 问题可由 AI 推测，答案涉及事实时必须引用来源。 |
| 对比/选型建议 | 可生成通用建议，但不得伪造竞品或客户数据。 |

### 7.6 AI 任务幂等与重试

- 每个 AI 任务生成 `idempotency_key = task_type + project_id + input_version_hash`。
- 同一输入版本重复执行应返回同一结果或生成新版本但不覆盖已确认内容。
- AI Provider 超时或限流时指数退避重试。
- JSON 校验失败时可触发一次“修复 JSON”Prompt。
- 多次失败后标记任务失败，并展示用户可理解的错误。

---

## 8. 网站生成与发布架构

### 8.1 生成产物

每次构建输出：

```text
index.html
products/index.html
products/{slug}/index.html
about/index.html
contact/index.html
sitemap.xml
robots.txt
assets/*
```

实际页面列表由 AI 推荐结构和用户确认结果决定，不强制固定为以上页面。

### 8.2 静态生成流程

```text
WebsiteDraft
  ↓
Normalize Page/Module Data
  ↓
Load Template + Theme Tokens
  ↓
Render HTML Pages
  ↓
Inject SEO Meta / JSON-LD / Tracking Script
  ↓
Optimize Images / Assets
  ↓
Generate sitemap.xml / robots.txt
  ↓
Write Artifact to Object Storage
  ↓
Create PublishVersion(PREVIEW)
```

### 8.3 预览与正式发布

| 类型 | 域名 | 特点 |
|---|---|---|
| Preview | `preview-{version}.customer.forgesite.com` 或带签名预览 URL | 供用户编辑前预览，可限制访问。 |
| Production | `customer.forgesite.com` | 正式公开访问，接入 CDN。 |

发布流程：

```text
用户点击发布
  ↓
创建 publish task
  ↓
构建正式 artifact
  ↓
写入 publish_versions
  ↓
更新 project 当前生产版本指针
  ↓
刷新 CDN 或更新边缘路由
  ↓
站点可访问
```

### 8.4 子域名路由

MVP 使用统一泛域名：

```text
*.forgesite.com -> Public Site Gateway/CDN
```

解析流程：

```text
Host: acme.forgesite.com
  ↓
根据 subdomain 查找 project
  ↓
读取 current_production_version
  ↓
定位 artifact path
  ↓
返回静态文件
```

如使用对象存储 + CDN，可将路由映射前置到边缘函数或轻量 Public Site Gateway。

### 8.5 回滚设计

- 每次发布版本不可变。
- `projects.current_publish_version_id` 指向当前生产版本。
- 回滚只是切换版本指针，不重新生成。
- 回滚操作写 audit log。

### 8.6 页面模块库与组合规则（MVP）

> 依据 PRD「6. 页面模块库」：页面由**模块**按序组合而成；AI 负责推荐模块组合与排序，用户可微调。

#### 8.6.1 模块定义（MVP）

| 模块名称 | 描述 | 适用场景 |
|---|---|---|
| Hero | 首页主视觉：标题、副标题、CTA 按钮 | 所有 |
| Value Props | 核心优势/价值点展示（2-5 条） | 所有 |
| Product/Service Grid | 产品/服务卡片列表 | 所有 |
| Detail Content | 详情页主体内容 | 所有 |
| Spec Table | 规格参数表（键值对） | 企业/产品 |
| Image Gallery | 图片集/作品集展示 | 所有 |
| FAQ | 常见问题 | 所有 |
| About Story | 公司/个人介绍 | 所有 |
| Team | 团队介绍 | 企业 |
| Certificates | 资质证书展示 | 企业 |
| Capability | 工厂/公司能力展示 | 企业 |
| Quality Control | 质量控制流程 | 企业 |
| Testimonials | 客户评价/案例 | 服务商/个人 |
| Contact Info | 联系方式汇总 | 所有 |
| CTA Section | 转化引导区域 | 所有 |
| Blog/Articles | 文章/行业知识列表 | 企业/服务商 |
| Timeline | 发展历程/时间线 | 企业/个人 |

#### 8.6.2 模块组合规则（MVP）

- 每个页面由多个模块按顺序组成。
- AI 根据「实体识别 + 内容盘点」生成初始模块组合与排序，并为每个模块标注置信度/推荐原因。
- 用户可：
  - 调整模块顺序（上移/下移）。
  - 隐藏/显示模块。
  - 对单个模块触发“重新生成”（如产品描述、FAQ、DirectAnswer 等）。
- MVP 不做：自由拖拽布局、复杂动画编辑、CSS/JS 自定义。

---

## 9. SEO / GEO 架构

### 9.1 SEO 自动生成能力

每个页面生成：

- SEO Title。
- Meta Description。
- H1/H2/H3 结构建议。
- 图片 Alt Text。
- 语义化 URL slug。
- Canonical。
- Open Graph / Twitter Card。
- Sitemap。
- Robots.txt。
- 内链建议。

### 9.2 JSON-LD 结构化数据

按页面类型注入：

| Schema | 适用页面 |
|---|---|
| Organization | 企业站点所有页面 |
| Person | 个人品牌站点所有页面 |
| Product | 产品详情页 |
| Service | 服务详情页 |
| FAQPage | 有 FAQ 的页面 |
| BreadcrumbList | 所有页面 |
| ImageGallery | 图库/作品集页面 |
| LocalBusiness | 有实体地址的本地服务商 |

### 9.3 GEO 内容单元

```text
GEOContentUnit
  id
  page_id
  type: DIRECT_ANSWER | ENTITY_SUMMARY | EVIDENCE_BLOCK | BUYER_QUESTION | COMPARISON_BLOCK | HOW_TO_CHOOSE | APPLICATION_BLOCK | CTA_BLOCK
  content_json
  source_refs[]
  score
```

GEO 内容不应仅隐藏在结构化数据中，而应以可读内容模块形式出现在页面中，确保 AI 搜索引擎和传统搜索引擎都可抓取。

### 9.4 GEO Score

评分维度：

| 维度 | 权重建议 | 说明 |
|---|---:|---|
| 实体清晰度 | 20% | 名称、类型、行业、地域是否明确。 |
| 答案完整度 | 20% | 页面是否直接回答用户/采购商问题。 |
| 证据充分度 | 20% | 关键事实是否有来源和证据。 |
| 结构化程度 | 15% | 标题层级、FAQ、JSON-LD 是否完整。 |
| 差异化程度 | 15% | 是否体现独特能力、案例、资质。 |
| 转化明确度 | 10% | CTA 和联系渠道是否明确。 |

发布规则：

- `>= 80`：允许发布，状态良好。
- `60-79`：允许发布，但提示优化建议。
- `< 60`：不建议发布，提示补充资料或重新生成。

---

## 10. 转化与数据分析架构

### 10.1 联系渠道

MVP 支持：

- 联系表单。
- 邮箱 mailto。
- WhatsApp wa.me。
- 微信号/二维码弹窗。
- 电话 tel。
- LinkedIn 外链。

每个渠道配置：

```json
{
  "enabled": true,
  "placement": ["floating", "contact_page", "cta_section"],
  "label": "Get a quote",
  "value": "+8613800000000"
}
```

### 10.2 表单提交流程

```text
访客提交表单
  ↓
前端基础校验
  ↓
后端校验 + 频控 + 反垃圾
  ↓
保存 Lead
  ↓
记录 conversion event
  ↓
发送邮件通知站点管理员
  ↓
后台 Leads 可查看和导出
```

#### 10.2.1 表单字段与配置（MVP）

默认表单字段（可配置开关）：

- 姓名（必填）
- 公司名（选填）
- 邮箱（必填）
- 电话（选填）
- 需求描述（必填）
- 附件上传（选填，限制文件类型和大小）

### 10.3 埋点事件

| 事件 | 说明 |
|---|---|
| page_view | 页面访问。 |
| contact_click | 联系渠道点击。 |
| form_start | 表单开始填写。 |
| form_submit | 表单提交成功。 |
| external_link_click | LinkedIn 等外链点击。 |
| file_download | 后续如支持资料下载。 |

### 10.4 Analytics 数据处理

MVP 建议采用轻量自建事件采集：

```text
Tracking Script
  ↓
/events API
  ↓
analytics_events raw table
  ↓
Aggregate Worker
  ↓
analytics_daily_stats
  ↓
Dashboard Query API
```

IP 地址建议只保存脱敏结果或国家/地区，不长期保存完整 IP，降低隐私风险。

---

## 11. 安全架构

### 11.1 认证与授权

- 管理后台必须登录访问。
- API 使用 session cookie 或 JWT，推荐 HttpOnly Secure SameSite Cookie。
- 所有项目资源访问必须校验 `project.owner_id == current_user.id`。
- 发布站点的公开页面无需登录，但表单 API 需要站点级 token 或 origin 校验。

### 11.2 文件上传安全

| 风险 | 措施 |
|---|---|
| 恶意文件 | MIME 校验、扩展名校验、病毒扫描、对象存储隔离。 |
| 超大文件 | 单文件 50MB 限制、单次文件数限制、用户套餐配额。 |
| 文件执行 | 上传文件不进入可执行目录，只通过对象存储访问。 |
| 隐私泄露 | 原始素材默认私有，访问使用签名 URL。 |

### 11.3 URL 抓取安全

URL 抓取需要防 SSRF：

- 禁止抓取内网 IP、localhost、link-local、metadata service。
- 限制跳转次数。
- 限制响应大小和下载时间。
- 只允许 http/https。
- 抓取 Worker 运行在隔离网络环境。

### 11.4 AI 安全

- Prompt Injection 防护：URL/文档内容作为不可信输入，不允许覆盖系统指令。
- 敏感信息脱敏：如检测到身份证、银行卡等高敏字段，默认不写入站点。
- AI 输出校验：所有输出必须过 JSON Schema、来源引用和事实规则校验。
- AI 调用日志：保存输入摘要、输出、模型、token、成本和错误，但注意避免记录敏感全文。

### 11.5 公开站点安全

- 静态 HTML 默认禁用用户自定义 JS/CSS。
- 富文本内容需要 HTML sanitize。
- 联系表单加入 CSRF/站点 token、频控、honeypot 或验证码策略。
- 响应头：CSP、X-Content-Type-Options、Referrer-Policy、Permissions-Policy。

### 11.6 数据合规

- 支持用户删除项目及相关素材。
- 原始上传素材和发布产物保留周期可配置。
- 询盘数据可导出和删除。
- 隐私政策需说明 AI 处理和第三方服务调用。

---

## 12. 可观测性与运维架构

### 12.1 日志

日志需覆盖：

- API 请求日志。
- Worker 任务日志。
- AI 调用日志。
- 发布构建日志。
- 表单提交与邮件发送日志。
- 权限失败和安全拦截日志。

日志字段建议：

```text
timestamp, level, trace_id, user_id, project_id, task_id, module, action, duration_ms, error_code
```

### 12.2 指标

| 指标 | 说明 |
|---|---|
| upload_success_rate | 上传成功率。 |
| parse_success_rate | 解析成功率。 |
| ai_extraction_success_rate | AI 提取成功率。 |
| first_site_generation_duration | 首版网站生成耗时。 |
| publish_duration | 发布耗时。 |
| ai_token_cost | AI token 和成本。 |
| lead_submit_count | 表单提交数。 |
| event_ingest_qps | 埋点接收吞吐。 |
| worker_queue_lag | 队列积压。 |
| error_rate_by_api | API 错误率。 |

### 12.3 链路追踪

每个核心流程生成统一 `trace_id`：

```text
Upload API -> Queue -> Parse Worker -> Extraction Worker -> Structure Worker -> Generation Worker -> Build Worker
```

便于排查用户反馈“生成失败”“发布很慢”等问题。

### 12.4 告警

MVP 告警建议：

- AI Provider 错误率超过阈值。
- Worker 队列积压超过阈值。
- 发布失败率超过阈值。
- 表单邮件发送失败。
- 数据库连接池耗尽。
- 对象存储上传失败。

---

## 13. 性能、容量与可靠性设计

### 13.1 性能目标

| 场景 | 目标 |
|---|---|
| 后台页面 API | P95 < 500ms，长任务除外。 |
| 文件上传初始化 | P95 < 1s。 |
| 文件解析 | 单文件异步，失败不阻塞其他文件。 |
| 首版生成 | 用户确认资料后 5 分钟内完成。 |
| 发布上线 | 点击发布后 2 分钟内可访问。 |
| 公开站点访问 | CDN 命中下 P95 < 200ms。 |

### 13.2 异步任务可靠性

- 任务状态表记录 `PENDING/RUNNING/SUCCEEDED/FAILED/RETRYING`。
- 所有 Worker 任务可重试、可幂等。
- 长任务写 heartbeat。
- 任务失败保存错误码和用户友好提示。
- 支持人工或系统触发重跑。

### 13.3 缓存策略

| 数据 | 缓存方式 |
|---|---|
| 公开站点 HTML/assets | CDN 长缓存，版本化路径。 |
| 后台项目摘要 | Redis 短缓存。 |
| 模板配置 | 本地/Redis 缓存。 |
| AI prompt templates | 版本化配置缓存。 |
| Analytics 聚合数据 | 查询缓存或预聚合表。 |

### 13.4 降级策略

- AI Provider 不可用：允许用户保存资料和编辑已有内容，提示稍后生成。
- OCR 失败：保留图片，提示用户手动补充或上传清晰文件。
- SEO/GEO 评分失败：允许预览，不允许标记为 SEO/GEO 已完成。
- 邮件通知失败：Lead 仍保存，后台提示通知失败并支持重发。
- Analytics 失败：不影响公开站点访问和表单提交。

---

## 14. 推荐技术栈（Vercel Native 方案）

> ForgeSite MVP 推荐采用“Vercel Native + Next.js 全栈 + 后台异步任务外置”的实现方式：管理后台、公开站点路由、API、预览发布尽量使用 Vercel/Next.js；文件解析、OCR、URL 抓取、AI 长任务、站点构建等耗时任务放到 Inngest/Trigger.dev 或独立 Worker 中执行。

### 14.1 总体技术组合

| 能力 | 推荐技术 | 说明 |
|---|---|---|
| 应用框架 | Next.js App Router + TypeScript | 管理后台、公开站点、API Routes、Server Actions 统一在一个全栈应用中实现。 |
| 部署平台 | Vercel | 托管 Next.js 应用、预览环境、Serverless Functions、Edge Middleware、CDN。 |
| UI 与样式 | shadcn/ui + Tailwind CSS | 贴近 Vercel/Next.js 生态，组件可控、包体小、适合 SaaS 后台和模板系统。 |
| 数据库 | Neon Postgres / Supabase Postgres / Vercel Postgres | PostgreSQL 作为主数据源，承载多租户业务数据、JSONB 模块内容和统计聚合。 |
| ORM | Prisma 或 Drizzle | Prisma 开发效率高；Drizzle 更轻量、SQL 可控、边缘兼容更好。 |
| AI SDK | Vercel AI SDK | 统一模型调用、流式输出、多 Provider 适配和结构化生成。 |
| 队列/工作流 | Inngest / Trigger.dev / QStash | 编排文件解析、AI 提取、结构推荐、页面生成、发布构建等长任务。 |
| 文件存储 | Vercel Blob，后续可迁移到 S3 兼容存储 | 存储原始素材、图片资源、生成站点产物。 |
| 鉴权 | Clerk 或 Auth.js | Clerk 上线快；Auth.js 更可控、成本低。 |
| 邮件 | Resend | 表单询盘通知、系统通知、验证邮件。 |
| 监控 | Sentry + Vercel Speed Insights + Vercel Analytics | 错误追踪、性能观测和基础访问分析。 |
| 测试 | Vitest + Playwright | 单元测试、集成测试、关键流程 E2E。 |

### 14.2 应用框架与渲染策略

| 场景 | 推荐技术 | 实现策略 |
|---|---|---|
| 管理后台 | Next.js App Router | 默认使用 React Server Components 获取首屏数据，减少客户端包体。 |
| 客户端交互 | Client Components | 仅用于上传组件、编辑器、预览控制、图表、复杂表单等强交互区域。 |
| 简单写操作 | Server Actions | 项目配置、联系方式配置、字段审核等表单类写操作。 |
| API 接口 | Route Handlers | 文件上传签名、公开表单提交、埋点、Webhook、异步任务回调等。 |
| 公开站点 | Next.js 动态渲染发布版本，后续演进静态 artifact | MVP 先降低构建复杂度，按 Host/subdomain 读取当前发布版本渲染。 |
| 子域名路由 | Vercel Middleware / Edge Config | 根据 Host 解析 project/subdomain，并路由到公开站点渲染入口。 |

Vercel/Next.js 性能实践要求：

- 独立数据请求应并行执行，避免瀑布式 await。
- 首屏数据优先在 Server Components 中读取，减少客户端二次请求。
- 只把必要数据传给 Client Components，避免重复序列化大型 JSON。
- 大型编辑器、图表、文件上传器使用 dynamic import 按需加载。
- 第三方统计、客服、埋点脚本在 hydration 后延迟加载。
- 模板模块组件避免 barrel import，按文件直接导入以控制包体。

### 14.3 前端与后台 UI

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| UI 组件 | shadcn/ui | 组件代码可复制进项目，便于深度定制 SaaS 后台。 |
| 样式系统 | Tailwind CSS | 统一后台 UI、站点模板和主题 token。 |
| 表单 | React Hook Form + Zod | 表单状态、校验和 API 输入 Schema 复用。 |
| 客户端数据刷新 | SWR 或 TanStack Query | 用于任务进度、Analytics 图表、Leads 列表等需要客户端刷新的数据。 |
| 状态管理 | Zustand | 仅用于编辑器局部状态、预览面板状态，不承载服务端事实数据。 |
| 图表 | Tremor / Recharts | 数据看板、转化趋势、Top 页面。 |
| 文件上传 | UploadThing / Uppy / 自建直传 | 客户端直传 Vercel Blob/S3，后端只签发上传凭证。 |

### 14.4 后端、数据与 API

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| 业务 API | Next.js Route Handlers + Zod | REST 风格即可满足 MVP，所有输入必须 Schema 校验。 |
| 类型安全 API | tRPC（可选） | 如果团队偏 TypeScript 全栈，可在后台管理 API 中使用。 |
| 主数据库 | PostgreSQL | 项目、素材、AI 提取、网站草稿、发布版本、Leads、Analytics。 |
| ORM | Prisma / Drizzle | 二选一，避免同时引入。 |
| JSON 内容 | PostgreSQL JSONB | 保存模块内容、AI 输出、GEO 内容单元、渠道配置。 |
| 向量检索 | pgvector | 素材分块、来源检索、RAG 式内容生成。 |
| 缓存 | Vercel Data Cache / unstable_cache + Redis（可选） | 读多写少数据、模板配置、公开站点版本指针。 |
| 频控 | Upstash Redis / Vercel KV | 公开表单、埋点 API、AI 生成接口限流。 |

API 设计建议：

- 后台页面首屏数据优先由 Server Components 直接查询数据库。
- 公开 API 必须经过 Zod 校验、频控和站点级权限校验。
- Server Actions 只处理已登录后台的小型写操作；长任务只创建任务，不直接执行。
- 所有项目级查询必须带 owner/project 权限过滤。

### 14.5 AI 与文档解析

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| AI 调用 | Vercel AI SDK | 模型适配、流式响应、结构化输出、Provider 切换。 |
| LLM Provider | OpenAI / Anthropic / Gemini / 国产模型适配 | 选择支持 Structured Output 或稳定 JSON 输出的模型。 |
| Schema 校验 | Zod + JSON Schema | Prompt 输出、API 输入、AI 结果入库前统一校验。 |
| Prompt 管理 | 数据库版本化 Prompt Template | Prompt、Schema、模型参数均需版本化，便于回溯。 |
| PDF 解析 | Unstructured / Apache Tika / pdfplumber | 放到 Worker 中执行，不放在 Vercel 普通函数中长时间运行。 |
| Office 解析 | Apache Tika / LibreOffice headless / Mammoth | Word、PPT、Excel 解析。 |
| OCR | 云 OCR 或自托管 OCR Worker | 图片、扫描 PDF、证书识别。 |
| URL 抓取 | Playwright / Readability + 安全沙箱 | 必须具备 SSRF 防护、响应大小限制和超时控制。 |

AI 相关任务建议全部通过 Inngest/Trigger.dev 编排：

```text
Material Uploaded
  ↓
Parse Worker
  ↓
OCR/Crawl Worker
  ↓
Extraction Worker using Vercel AI SDK
  ↓
Structure Recommendation Worker
  ↓
Content Generation Worker
  ↓
SEO/GEO Quality Worker
```

### 14.6 异步任务与长任务编排

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| 工作流编排 | Inngest 或 Trigger.dev | 支持步骤化任务、重试、幂等、可视化任务状态。 |
| 轻量消息 | QStash | 适合简单异步 HTTP 任务和延迟调用。 |
| 定时任务 | Vercel Cron | 定时聚合 Analytics、清理过期预览、重试失败邮件。 |
| 任务状态 | PostgreSQL tasks 表 | 前端展示进度、错误原因、重跑入口。 |
| 长时间解析 | 独立 Worker / Trigger.dev | OCR、文档解析、Playwright 抓取不建议放入普通 Serverless Function。 |

任务实现原则：

- 每个任务具备 idempotency key。
- 长任务只读写任务状态和版本化产物，不覆盖用户已确认内容。
- 失败任务可重试，最终失败需提供用户可理解的错误信息。
- AI 调用、文件解析、发布构建分别记录耗时和成本。

### 14.7 文件、图片与发布产物

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| 原始素材 | Vercel Blob / S3 | 私有存储，访问使用签名 URL。 |
| 生成图片资源 | Vercel Blob / S3 | 站点模板引用版本化资源路径。 |
| 图片优化 | Next.js Image | 后台预览和公开站点均使用优化后的图片。 |
| 上传方式 | 客户端直传 | 避免大文件经过 API Server。 |
| 发布产物 | MVP 可由 Next.js 动态渲染；后续写入 Blob/S3 静态 artifact | 先快后稳，访问量上来后再静态化。 |

发布策略建议：

1. **MVP 阶段**：发布版本数据写入数据库，公开站点由 Next.js 根据 Host + current_publish_version 动态渲染，并利用 Vercel CDN 缓存。
2. **增长阶段**：发布时生成 HTML、assets、sitemap、robots，写入 Blob/S3，并由 Edge Middleware/CDN 直接分发。
3. **规模阶段**：针对高访问站点启用静态 artifact，低访问站点保持动态渲染，实现成本和性能平衡。

### 14.8 Analytics、询盘与邮件

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| 基础站点性能 | Vercel Speed Insights | 观察 Core Web Vitals 和真实性能。 |
| 平台访问参考 | Vercel Analytics | 用作整体访问趋势参考，不替代业务看板。 |
| 自定义事件 | 自建 `/api/public/events` | page_view、contact_click、form_start、form_submit 等项目级事件。 |
| 事件存储 | PostgreSQL raw events + daily aggregates | 支撑项目数据看板。 |
| 地理位置 | Vercel Edge Request Geo 或第三方 GeoIP | 只保存国家/地区等低敏维度。 |
| 邮件通知 | Resend | 新询盘、发布结果、系统提醒。 |

ForgeSite 的 Dashboard 需要项目级、页面级、渠道级聚合，所以不能只依赖 Vercel Analytics；必须保留自建事件采集和聚合表。

### 14.9 可观测性、质量与 CI/CD

| 场景 | 推荐技术 | 说明 |
|---|---|---|
| 错误追踪 | Sentry | 前端、Route Handlers、Server Actions、Worker 错误统一上报。 |
| 日志 | Vercel Logs + Axiom / Better Stack | 查询 API、任务、AI、发布日志。 |
| 性能 | Vercel Speed Insights | Web 性能和 Core Web Vitals。 |
| AI 成本 | 自建 ai_call_logs 表 | 记录模型、token、耗时、成本、任务 ID。 |
| 任务监控 | Inngest/Trigger.dev Dashboard | 查看任务失败、重试和耗时。 |
| 单元测试 | Vitest | Prompt 工具、Schema、领域服务、数据转换。 |
| E2E 测试 | Playwright | 上传、AI 审核、生成、预览、发布、表单提交。 |
| CI/CD | Vercel Git Integration + GitHub Actions | PR Preview、测试、Lint、类型检查、数据库迁移检查。 |

### 14.10 MVP 推荐默认选型

| 能力 | 默认选型 |
|---|---|
| 应用框架 | Next.js App Router + TypeScript |
| 部署平台 | Vercel |
| UI | shadcn/ui + Tailwind CSS |
| 数据库 | Neon Postgres |
| ORM | Prisma（开发效率优先）或 Drizzle（轻量可控优先） |
| AI | Vercel AI SDK + 支持 Structured Output 的 LLM |
| 队列/工作流 | Inngest 或 Trigger.dev |
| 文件存储 | Vercel Blob，规模化后迁移 S3 兼容存储 |
| 鉴权 | Clerk（快速上线）或 Auth.js（自控优先） |
| 邮件 | Resend |
| 频控/缓存 | Upstash Redis / Vercel KV |
| 错误监控 | Sentry |
| 性能监控 | Vercel Speed Insights |
| 业务 Analytics | 自建 events API + PostgreSQL 聚合表 |

### 14.11 MVP 不建议采用

- 不建议一开始拆成多个微服务；优先使用模块化单体 Next.js 全栈应用。
- 不建议把 OCR、Office 解析、Playwright 抓取、长时间 AI 生成放进普通 Vercel Serverless Function。
- 不建议完全依赖 Vercel Analytics 作为业务数据看板。
- 不建议引入复杂拖拽编辑器、自定义 CSS/JS 或插件系统。
- 不建议一开始实现复杂自定义域名和多语言；应作为 V1/V2 演进能力。
- 不建议把大量服务端数据传入 Client Components，避免客户端包体和 hydration 成本过高。

---

## 15. MVP 交付边界

### 15.1 MVP 必须交付

| 能力 | 交付标准 |
|---|---|
| 用户与项目 | 用户可注册登录、创建项目。 |
| 素材上传 | 支持 PDF、Excel、Word、PPT、图片、URL；显示解析状态。 |
| AI 提取 | 输出结构化字段、置信度、来源引用；用户可审核。 |
| 结构推荐 | AI 推荐页面列表、模块组合、排序和置信度；用户可调整。 |
| 网站生成 | 至少支持首页、产品/服务、详情、关于、联系及按需推荐页面。 |
| 模板 | 至少 3 套视觉风格。 |
| 编辑 | 支持文案、图片、SEO、模块显隐、局部重新生成。 |
| SEO/GEO | 自动生成 SEO 基础项、JSON-LD、DirectAnswer、FAQ、EvidenceBlock、GEO Score。 |
| 联系渠道 | 表单、邮箱、WhatsApp、微信、电话、LinkedIn。 |
| 发布 | 支持二级域名发布、预览、重新发布、版本记录。 |
| 数据看板 | 访问、Top 页面、国家地区、渠道点击、表单提交。 |
| 询盘管理 | 查看、邮件通知、CSV 导出。 |

### 15.2 MVP 不做

- 在线支付、购物车、库存。
- 拖拽式页面编辑器。
- 自定义 CSS/JS。
- 插件市场。
- 多业务员复杂权限。
- 完整 CRM。
- ERP 对接。
- 完整版本树管理。
- Agency 白标。
- 自定义域名和多语言作为第二期能力。

---

## 16. 演进路线

### 16.1 V0.1 原型验证

目标：证明上传资料后能生成可看的静态网站。

交付范围：

- 支持 PDF、Excel、图片上传。
- 基础文本/OCR/表格解析。
- AI 提取公司基本信息和产品信息。
- 生成首页、产品页、联系页。
- 静态预览。
- 简单 Prompt 与 JSON Schema 校验。

### 16.2 V0.5 MVP 闭环

目标：完成从上传到发布的商业闭环。

交付范围：

- 完整素材管理。
- AI 动态结构推荐。
- 用户确认结构。
- 模块化网站生成。
- SEO/GEO 自动生成和评分。
- 联系渠道配置。
- 二级域名发布。
- 基础数据看板。
- 询盘管理。

### 16.3 V1.0 商业化增强

目标：支撑 Pro 付费用户。

增强能力：

- 自定义域名。
- 更完整模板市场。
- 多语言站点。
- AI 内容质量评估和人工审核入口。
- 站点收录进度监控。
- 更精细的数据分析。
- 额度、套餐、支付和账单。

### 16.4 V2.0 Agency 与平台化

目标：支撑服务商批量交付。

增强能力：

- 多站点工作台。
- 团队权限。
- 白标发布。
- 客户协作审核。
- API 接入。
- 批量生成和批量发布。
- 模板和模块插件化。

---

## 17. 风险与技术应对

| 风险 | 等级 | 技术应对 |
|---|---|---|
| AI 内容编造 | 高 | 来源引用、关键事实强校验、用户审核、GEO Evidence、质量检查 Prompt。 |
| 解析质量不稳定 | 中 | 多解析器兜底、OCR、低置信度标记、允许用户手动补充。 |
| 网站生成同质化 | 中 | 基于项目资料生成内容、模板只管视觉、行业 Prompt 可配置、模块组合动态化。 |
| 首版生成超时 | 中 | 异步任务拆分、并行生成页面、缓存解析结果、任务进度可视化。 |
| 发布失败 | 中 | 构建和发布分离、不可变 artifact、重试、回滚。 |
| URL 抓取安全 | 高 | SSRF 防护、抓取沙箱、响应大小和协议限制。 |
| 多租户越权 | 高 | 强制项目级权限过滤、对象存储私有、审计日志、自动化权限测试。 |
| 表单垃圾信息 | 中 | 频控、honeypot、验证码策略、垃圾评分。 |
| AI 成本失控 | 中 | token 预算、分块摘要、缓存、额度限制、成本监控。 |
| SEO/GEO 效果不可控 | 中 | 质量评分、结构化数据校验、收录状态提示、用户预期管理。 |

---

## 附录 A：核心 API 草案

### Project

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/{projectId}
PATCH  /api/projects/{projectId}
```

### Materials

```text
POST   /api/projects/{projectId}/materials/upload-url
POST   /api/projects/{projectId}/materials
GET    /api/projects/{projectId}/materials
GET    /api/projects/{projectId}/materials/{materialId}
DELETE /api/projects/{projectId}/materials/{materialId}
POST   /api/projects/{projectId}/materials/{materialId}/retry-parse
```

### AI Extraction

```text
POST   /api/projects/{projectId}/extractions
GET    /api/projects/{projectId}/extractions/latest
PATCH  /api/projects/{projectId}/extractions/{extractionId}/fields/{fieldId}
POST   /api/projects/{projectId}/extractions/{extractionId}/confirm
```

### Structure

```text
POST   /api/projects/{projectId}/structure-proposals
GET    /api/projects/{projectId}/structure-proposals/latest
PATCH  /api/projects/{projectId}/structure-proposals/{proposalId}
POST   /api/projects/{projectId}/structure-proposals/{proposalId}/confirm
```

### Website

```text
POST   /api/projects/{projectId}/website/generate
GET    /api/projects/{projectId}/website/draft
PATCH  /api/projects/{projectId}/website/pages/{pageId}
PATCH  /api/projects/{projectId}/website/modules/{moduleId}
POST   /api/projects/{projectId}/website/modules/{moduleId}/regenerate
```

### Publish

```text
POST   /api/projects/{projectId}/publish/preview
POST   /api/projects/{projectId}/publish/production
GET    /api/projects/{projectId}/publish/versions
POST   /api/projects/{projectId}/publish/versions/{versionId}/rollback
```

### Leads & Analytics

```text
POST   /api/public/sites/{siteId}/leads
POST   /api/public/sites/{siteId}/events
GET    /api/projects/{projectId}/leads
GET    /api/projects/{projectId}/analytics/summary
GET    /api/projects/{projectId}/analytics/pages
```

---

## 附录 B：研发落地建议

1. 第一阶段先实现“上传 → 解析 → AI 提取 → 人审 → 生成静态预览”的最小闭环。
2. 第二阶段补齐“AI 结构推荐 → 模块化生成 → SEO/GEO → 发布”。
3. 第三阶段补齐“数据看板 → 询盘管理 → 稳定性与安全加固”。
4. Prompt、Schema、模板、模块类型都应版本化，避免后续升级破坏历史站点。
5. 发布产物必须不可变，编辑永远作用于草稿，发布只是生成新版本。
6. 不要在 MVP 引入拖拽编辑器、自定义代码和复杂 CMS，否则会显著扩大范围。
