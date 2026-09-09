# Retro-Board 功能清单

> 用于 retro-board 核心功能迁移至 pmis 项目的逐项核对清单。
> 来源：`D:\dev\treapro\HelloCPP\funny-coworkers\retro-board`
> 迁移原则：**整体布局与样式遵循 pmis 项目风格**，不直接照搬 retro-board 的 Tailwind 自定义 UI。
> 状态图例：`[ ]` 未迁移 / `[x]` 已迁移

---

## 一、迁移基础说明

### 1.1 数据模型映射（retro-board → pmis）

| Retro-Board 实体 | 迁移策略 | 目标位置 |
|---|---|---|
| `User` | **复用** pmis 的 `app_user` 表 | `com.blake.pmis.entity.User` |
| `Team` | **复用** pmis 的 `team` 表（仅作可选关联，**不做鉴权边界**，见 1.3） | `com.blake.pmis.entity.Team` |
| `Board` | **新建** `retro_boards` 表（owner_id + 可空 team_id + status，见 1.3） | `com.blake.pmis.entity.retro.Board` |
| `BoardParticipant` | **新建** `retro_board_participants` 表（"临时团队"的真身，替代 retro-board 中 TeamMember 的权限源角色，见 1.3） | `com.blake.pmis.entity.retro.BoardParticipant` |
| `BoardColumn` | **新建** `retro_columns` 表 | `com.blake.pmis.entity.retro.BoardColumn` |
| `Card` | **新建** `retro_cards` 表 | `com.blake.pmis.entity.retro.Card` |

### 1.2 技术差异与改造点

| 维度 | Retro-Board | PMIS 现状 | 改造方向 |
|---|---|---|---|
| 后端框架 | Spring Boot 3.2.0 / Java 17 | 同 | 无需改造 |
| 包名 | `com.retroboard.*` | `com.blake.pmis.*` | 重命名为 `com.blake.pmis.retro.*` |
| WebSocket | spring-boot-starter-websocket + STOMP/SockJS | **未引入** | 需新增依赖与配置 |
| 实时鉴权 | `/ws` 无鉴权 | JWT 全局 | 需新增 STOMP 握手 JWT 校验 |
| 前端路由 | App Router (`app/**/page.tsx`) | Pages Router (`src/pages/*.tsx`) | 重写为 `src/pages/retro/**` |
| UI 栈 | Tailwind 自定义 | MUI v6 + Tailwind | **改用 MUI 组件**，遵循 pmis 风格 |
| HTTP | axios + fetchApi 双封装 | 原生 `fetch` 封装 | 统一改用 pmis 的 `apiCall` + `pmis-token` |
| 拖拽 | HTML5 原生 draggable | `@dnd-kit`（wiki 已用，已装依赖） | **统一用 @dnd-kit 重写**卡片拖拽（已拍板 2026-09-04） |
| 认证存储 | `localStorage['token']` | `localStorage['pmis-token']` + cookie | 复用 pmis-token |

### 1.3 回顾会建模设计（已拍板 2026-09-04）

**核心结论**：回顾会是"一次性活动"而非"组织单元"，**不建临时 Team**。看板即回顾会，访问控制基于参与者名单。

**数据模型**：

```
retro_board（回顾会看板 = 回顾会本身）
├─ id
├─ title              -- 如 "Sprint 42 回顾"
├─ description
├─ owner_id           -- 主持人（创建者）→ app_user.id
├─ team_id (可空)      -- 可选关联真实团队：仅用于展示/统计/预填参与者，不用于鉴权
├─ status             -- ACTIVE / ENDED（结束后只读）
└─ created_at / updated_at

retro_board_participants（"临时团队"的真身）
├─ id
├─ board_id           -- FK retro_board
├─ user_id            -- FK app_user
├─ role               -- OWNER / PARTICIPANT
└─ created_at
   UNIQUE(board_id, user_id)
```

**权限矩阵**：

| 操作 | 主持人 | 参与者 | 非参与者 |
|---|---|---|---|
| 查看看板/卡片 | ✅ | ✅ | ❌ 403 |
| 添加/编辑/移动/删除卡片（宽松模式） | ✅ | ✅ | ❌ |
| 投票 | ✅ | ✅ | ❌ |
| 增删列 | ✅ | ❌ | ❌ |
| 邀请/移除参与者 | ✅ | ❌ | ❌ |
| 编辑看板信息 / 结束回顾 / 删除看板 | ✅ | ❌ | ❌ |

ENDED 状态下所有人仅可查看（只读），包括主持人和参与者。

**鉴权改造**：retro-board 原基于 team 成员的校验（`existsByTeamIdAndOwnerOrMember`）改写为基于参与者：`existsByBoardIdAndUserId`（owner 或 participant）。WebSocket 订阅同样校验。

**邀请流程**：创建回顾会时用用户选择器（复用 `userApi.getAllUsers()`）勾选参与者；若关联真实团队，从 pmis `TeamMember` 表预填一键全选；受邀发站内通知（复用 NotificationService），点击直达 `/retro/{id}`。

**生命周期**：ACTIVE → 主持人点击"结束回顾" → ENDED（只读）。建表即含 status，避免后期迁移。

**API 前缀约定**：所有 retro API 统一挂 `/api/retro/**` 前缀（下文各功能项中的 `/api/boards` 等路径为 retro-board 原始路径，迁移时统一加前缀，避免与 pmis 现有路由冲突）。

### 1.4 关键用户流程（2026-09-04 拍板）

```
主持人点侧边栏 Retrospective 旁的 [+]
  → 跳转 /retro?new=1，列表页自动弹"新建回顾会"弹窗
  → 填标题（必填）、描述、可选关联团队（选中后预填团队成员）、勾选参与者
  → 创建成功 → 跳转 /retro/{id}，创建者为 OWNER
参与者：收到站内通知 → 点击通知直达 /retro/{id}
进行中：参与者实时贴卡 / 拖拽 / 投票（WebSocket 同步）；主持人可随时"邀请"补人、管理列
主持人点"结束回顾" → 二次确认 → status=ENDED → 全员只读，看板移入列表页"已结束"tab 归档
```

- 新建入口形态：**列表页弹窗**（不走独立 /new 页面，已拍板）
- 加人时机：**创建时 + 进行中两个入口都支持**（已拍板）
- board 增多管理：**状态 tab 分流**——默认只看进行中，已结束为只读归档（已拍板，不引入文件夹/归档机制）

---

## 二、用户与认证模块（复用 pmis，无需重新迁移）

- [x] **2.1 登录** —— ✅ 复用 pmis 登录页，retro 模块共享 pmis 认证态
  - 来源：`AuthenticationController.java` / `AuthenticationService.java`
- [x] **2.2 注册** —— ✅ 复用 pmis 注册流程
  - 来源：`AuthenticationController.java#L32-L42`
- [x] **2.3 登出** —— ✅ 复用 pmis 登出
  - 来源：`AuthenticationService.java#L97-L110`（active token hash 校验/清空）
- [x] **2.4 token 刷新机制** —— ✅ 复用 pmis 现有 `/api/auth/refresh`；WS 连接使用当前 pmis-token，遇 401 按 pmis 统一机制刷新后重连，不单独实现
- [x] **2.5 实时连接的 JWT 鉴权** —— ✅ 已实现：`JwtHandshakeInterceptor` 从 query 提取 pmis-token 校验，`RetroChannelInterceptor` 校验 SUBSCRIBE 权限

---

## 三、团队(Team)模块

> **设计决策（见 1.3）更新**：回顾会不基于 Team 鉴权。pmis 已有 `Team`/`TeamController`/`TeamMember`，retro-board 的团队权限逻辑**不再迁移**——Team 仅用于：①创建回顾会时可选关联；②从 `TeamMember` 预填参与者名单。
> - 3.1 复用 pmis 现有团队接口（与 retro 无关）
> - 3.2 / 3.3 / 3.5：❌ 不迁移（被 `retro_board_participants` 取代）
> - 3.4 改造为 4.10 的"按参与视角查询"
> - 3.5 演变为：预填参与者时从 pmis `TeamMember` 读取

- [x] **3.1 团队 CRUD** —— ✅ 直接复用 pmis 现有 `/api/teams` 接口，retro 模块不新建团队逻辑（retro-board 的 TeamController 不迁移）
- [~] **3.2 团队成员管理** —— ❌ 不迁移（retro-board 的 TeamMember 维护逻辑被 `retro_board_participants` 取代，见 4.6/4.7）
- [~] **3.3 团队归属与权限校验** —— ❌ 不迁移（`existsByTeamIdAndOwnerOrMember` 被 4.9 参与者鉴权取代）
- [~] **3.4 团队-看板关联查询** —— ❌ 不迁移，改造为 4.10"我主持的/我参与的"视角查询
- [~] **3.5 默认 owner 角色** —— ❌ 不迁移（创建团队逻辑不迁移）；创建回顾会时自动将创建者写入 participants 且 role=OWNER（见 4.1）

---

## 四、看板(Board)模块 ⭐ 核心

- [x] **4.1 创建回顾会看板** —— ✅ POST `/api/retro/boards`（BoardController + BoardService.createBoard，创建 board + 批量写入 participants + 发邀请通知）
  - 前端：列表页"新建回顾会"弹窗（含参与者选择器）
- [x] **4.2 查看看板列表** —— ✅ GET `/api/retro/boards?view=owned|joined|all`（BoardController.listBoards）
  - 前端：`src/pages/retro/index.tsx`
- [x] **4.3 查看看板详情** —— ✅ GET `/api/retro/boards/{id}`（BoardController.getBoardById）
  - 前端：`src/pages/retro/[id].tsx`
- [x] **4.4 更新看板** —— ✅ PUT `/api/retro/boards/{id}`（BoardController.updateBoard，owner only）
  - 前端：详情页标题内联编辑
- [x] **4.5 删除看板** —— ✅ DELETE `/api/retro/boards/{id}`（BoardController.deleteBoard，owner only，级联删除）
  - 前端：列表页删除按钮 + 确认框
- [x] **4.6 邀请参与者** —— ✅ POST `/api/retro/boards/{id}/participants`（BoardController.inviteParticipants + NotificationService.notifyRetroInvite）
  - 前端：详情页"邀请"按钮 → InviteDialog 用户多选弹窗
- [x] **4.7 移除参与者** —— ✅ DELETE `/api/retro/boards/{id}/participants/{userId}`（BoardController.removeParticipant，owner only）
  - 前端：参与者头像 popover 内"移除"
- [x] **4.8 结束回顾会** —— ✅ POST `/api/retro/boards/{id}/end`（BoardController.endBoard，status ACTIVE→ENDED）
  - 前端：详情页"结束回顾会"按钮 + 确认；ENDED 后只读横幅 + 全部操作禁用
- [x] **4.9 参与者鉴权改造** —— ✅ RetroAuthService 基于 `existsByBoardIdAndUserId` 校验（owner 或 participant），非参与者 403
- [x] **4.10 我主持的 / 我参与的列表查询** —— ✅ GET `/api/retro/boards?view=owned|joined|all`（BoardService.listBoards 基于 participants 表）

---

## 五、列(Column)模块 ⭐ 核心

- [x] **5.1 创建列** —— ✅ POST `/api/retro/columns`（BoardColumnController + BoardColumnService，owner only，广播 `column_created`）
  - 前端：详情页"添加列"按钮 + 内联输入
- [x] **5.2 查询列列表** —— ✅ GET `/api/retro/columns?boardId={id}`（BoardColumnController.getColumnsByBoard，按 position 升序）
- [x] **5.3 更新列** —— ✅ PUT `/api/retro/columns/{id}`（BoardColumnController.updateColumn，owner only，广播 `column_updated`）
  - 前端：列名内联编辑
- [x] **5.4 删除列** —— ✅ DELETE `/api/retro/columns/{id}`（BoardColumnController.deleteColumn，owner only，级联删除卡片，广播 `column_deleted`）
  - 前端：列头删除按钮 + 确认
- [~] **5.5 列拖拽重排** —— ❌ **MVP 不做**（已拍板 2026-09-04）。retro-board 原本也仅实现 isDragOver 视觉反馈、未完成列间拖拽；列按创建/position 顺序排列，后续版本再补

---

## 六、卡片(Card)模块 ⭐ 核心

- [x] **6.1 创建卡片** —— ✅ POST `/api/retro/cards`（CardController + CardService，所有参与者，广播 `card_created`）
  - 前端：列底部"+ 添加卡片"按钮 + 内联输入
- [x] **6.2 查询列内卡片** —— ✅ GET `/api/retro/cards?columnId={id}`（CardController.getCardsByColumn，按 position 升序）
- [x] **6.3 更新卡片** —— ✅ PUT `/api/retro/cards/{id}`（CardController.updateCard，所有参与者，广播 `card_updated`）
  - 前端：CardEditDialog 编辑 title/description
- [x] **6.4 删除卡片** —— ✅ DELETE `/api/retro/cards/{id}`（CardController.deleteCard，所有参与者，广播 `card_deleted`）
  - 前端：卡片删除按钮 + 确认
- [x] **6.5 卡片拖拽 - 列内重排** —— ✅ 用 @dnd-kit（DndContext + SortableContext + verticalListSortingStrategy）
- [x] **6.6 卡片拖拽 - 跨列移动** —— ✅ @dnd-kit 多容器 droppable，onDragEnd 更新 columnId + position
  - 后端：PUT `/api/retro/cards/{id}`（更新 columnId + position）
- [x] **6.7 卡片拖拽视觉反馈** —— ✅ @dnd-kit DragOverlay 提供跟随预览（旋转+半透明+阴影）
- [x] **6.8 卡片投票** —— ✅ POST `/api/retro/cards/{id}/vote`（CardController.voteCard，所有参与者，广播 `card_voted`）
  - 逻辑：已投则取消（-1），未投则新增（+1）；字段 `votes` + `votedByCurrentUser`
  - 前端：投票按钮根据 `votedByCurrentUser` 切换样式（蓝底/灰底）
- [x] **6.9 投票规则** —— ✅ **维持原版**（已拍板 2026-09-04）：每卡每用户最多 1 票，可取消，不设每人总票数上限；无需额外 user_votes 表，仅需卡片 votes 计数 + 当前用户是否已投标记
- [x] **6.10 同列按票数排序** —— ✅ 已实现并浏览器实测通过（2026-09-09）：列头 ArrowUpDown 按钮切换（对齐原版列内排序入口），票数降序、同票按 position 稳定排序；纯客户端视图偏好、不调后端、不影响他人；激活时该列卡片与放置目标禁用拖拽（避免 votes 视图与 position 拖拽语义冲突），取消后恢复；投票后自动实时重排；只读（ENDED）看板也可排序查看，且非 owner 参与者可见可用
- [x] **6.11 卡片固定高度 + 点击查看详情** —— ✅ 已实现并浏览器实测通过（2026-09-09）：卡片统一固定高度 h-36（144px）flex 纵向布局，标题 line-clamp-2、描述 line-clamp-3 截断，投票栏 mt-auto 置底，列体独立滚动不被长内容顶开；点击卡片打开详情弹窗（复用编辑弹窗，进行中可编辑、已结束为只读"卡片详情"，含完整标题/描述/票数）；投票/编辑/删除按钮 stopPropagation 不触发弹窗；拖拽结束 200ms 内抑制 click 误触弹窗

---

## 七、实时协作模块 ⭐ 核心

- [x] **7.1 后端 WebSocket 配置** —— ✅ `WebSocketConfig`（STOMP broker `/topic`，endpoint `/ws` + SockJS + JwtHandshakeInterceptor）
- [x] **7.2 后端广播服务** —— ✅ `WebSocketService.broadcastBoardUpdate` 向 `/topic/retro/{boardId}` 发送 `BoardUpdateEvent`
- [x] **7.3 广播事件清单** —— ✅ 各 Service 增删改后调用 `broadcastBoardUpdate`
  - [x] `card_created`（创建卡片后）
  - [x] `card_updated`（更新卡片后）
  - [x] `card_deleted`（删除卡片后）
  - [x] `card_voted`（投票切换后）
  - [x] `column_created`（创建列后）
  - [x] `column_updated`（更新列后）
  - [x] `column_deleted`（删除列后）
- [x] **7.4 前端 WebSocket Hook** —— ✅ `src/hooks/useRetroWebSocket.ts`（SockJS + @stomp/stompjs 连接 `/ws?token=...`，订阅 `/topic/retro/{boardId}`）
- [x] **7.5 前端事件分发** —— ✅ 详情页 handleWsEvent 解析 7 种事件并更新 React state
- [x] **7.6 多端实时同步** —— ✅ WS 广播 + 前端事件分发实现多端同步
- [x] **7.7 WS 订阅鉴权** —— ✅ `RetroChannelInterceptor` 在 SUBSCRIBE 时校验 participants 表，非参与者拒订阅

---

## 八、看板详情页前端交互 `/retro/[id]`（pmis 风格重写）

> UI 布局与用户流程已于 2026-09-04 拍板。所有 UI 用 **MUI 组件**（Paper/Card/Dialog/IconButton/Menu/Avatar/Chip 等）+ pmis 主布局（Layout 侧边栏+顶栏），**不照搬** retro-board 的 Tailwind 样式。

### 8.A 页面结构（自上而下）

```
┌─ pmis 全局 Layout（侧边栏 + 顶栏）──────────────────────┐
│ 头部条：[可编辑标题] [状态徽标]      [头像组] [邀请] [结束回顾] │  ← 主持人可见后两个按钮
│ ENDED 时：灰色横幅"回顾已结束，当前为只读状态"                  │
│ ─────────────────────────────────────────────────── │
│ 看板区：横向多列（每列独立纵向滚动，列头固定）                     │
│   [列头: 列名 + 卡数 + (主持人)删除]  [+ 添加列(仅主持人)]      │
│   ┌卡片┐ ┌卡片┐ ...                                    │
└─────────────────────────────────────────────────────┘
```

- [x] **8.1 看板布局** —— ✅ 横向多列，每列独立纵向滚动，列头固定；整体在 pmis Layout 内
- [x] **8.2 列组件（Column）** —— ✅ 列名展示 + 内联编辑/删除（owner only）+ 添加卡片入口（所有参与者，ENDED 禁用）
- [x] **8.3 卡片组件（Card）** —— ✅ SortableCard：标题/描述展示 + 投票按钮（已投蓝/未投灰）+ @dnd-kit useSortable draggable + DragOverlay 预览
- [x] **8.4 卡片编辑弹窗** —— ✅ CardEditDialog：编辑 title/description（所有参与者可编辑）+ 保存/取消

### 8.B 头部条（详情页管理区）

- [x] **8.5 头部条布局** —— ✅ 标题（owner 内联编辑）+ 状态徽标（进行中绿/已结束灰）+ 参与者头像组（前 5 个 + `+n`）+ owner 可见"邀请"+"结束回顾会"按钮
- [x] **8.6 参与者头像组交互** —— ✅ 点击展开 popover 名单（头像+姓名+邮箱+角色）；owner 在 popover 内可"移除"参与者
- [x] **8.7 邀请弹窗** —— ✅ InviteDialog：用户多选（复用 `userApi.getAllUsers()`）+ 确认后调邀请接口并发通知
- [x] **8.8 结束回顾** —— ✅ owner 点击"结束回顾会" → 二次确认 → 调 end 接口 → status 转 ENDED
- [x] **8.9 ENDED 只读态 UI** —— ✅ 灰色只读横幅；所有输入/按钮/拖拽禁用（sensors=[], disabled=true），仅保留查看与名单查看

---

## 九、看板列表页 `/retro`（pmis 风格，对齐 projects 页）

> 布局已于 2026-09-04 拍板：右侧主区域**列表形式**展示（与 projects/issues 一致），不做卡片网格。

### 9.A 页面结构

```
┌─ Retrospective                          [+ 新建回顾会] ─┐
│ [🔍 搜索框(按标题)]   视角: 我主持的∨  团队: 全部∨       │
│ Tabs: [进行中 (n)]  [已结束 (n)]      ← 默认"进行中"      │
│ ──────────────────────────────────────────────────── │
│ ▸ Sprint 42 回顾   团队:后端组  👥👥👥+2  ●进行中  12卡  │
│ ▸ 需求梳理回顾     团队:产品组  👥👥+1    ●已结束   8卡  │
│   行尾操作: [进入] （主持人额外: [删除]）                    │
└─────────────────────────────────────────────────────┘
```

- [x] **9.1 列表行字段** —— ✅ 标题 / 关联团队名 / 参与者头像组（前 3 个 + `+n`）/ 状态徽标 / 卡片数 / 创建时间 / 行尾操作（进入；owner 额外有删除）
- [x] **9.2 搜索** —— ✅ 按标题实时过滤
- [x] **9.3 筛选** —— ✅ 视角 chips（我参与的/我主持的/全部）+ 团队筛选下拉
- [x] **9.4 状态 Tabs 分流** —— ✅ 进行中（默认）/ 已结束（只读归档），不引入独立归档机制
- [x] **9.5 点击行进入详情** —— ✅ router.push(`/retro/{id}`)
- [x] **9.6 新建回顾会弹窗** —— ✅ 列表页弹窗（标题/描述/关联团队/参与者多选），创建后跳转 `/retro/{id}`
- [x] **9.7 URL 触发新建** —— ✅ `?new=1` 自动打开弹窗，关闭后清掉 query 参数
- [x] **9.8 空状态** —— ✅ 无数据时展示引导文案 + 图标

---

## 十、Dashboard（已决策：不迁移，pmis 首页加区块）

- [x] **10.1 Dashboard 集成方式** —— ✅ **复用 pmis 首页 + "最近回顾会"区块**（已拍板 2026-09-04）：不做独立 retro 仪表盘，不迁移 `app/dashboard/page.tsx`
- [x] **10.2 pmis 首页新增"最近回顾会"区块**（展示我参与的最近 N 场回顾，点击直达 `/retro/{id}`）—— ✅ 已实现并验证（2026-09-08）：独立请求加载 `listBoards('joined')`，展示最近 5 场（标题/进行中·已结束徽章/团队/主持人/参与者数/卡片数/更新时间），点击行直达 `/retro/{id}`，"查看全部"跳 `/retro`；浏览器实测行点击导航与"查看全部"跳转均正常

---

## 十一、其他页面（复用 pmis，不单独迁移）

- [x] **11.1 首页** —— ✅ 复用 pmis `/`
- [x] **11.2 登录页** —— ✅ 复用 pmis `/login`
- [x] **11.3 注册页** —— ✅ 复用 pmis `/api/users`

---

## 十二、辅助功能

- [x] **12.1 通知** —— ✅ NotificationService 新增 RETRO_INVITE 类型，邀请时发站内通知
- [x] **12.2 搜索** —— ✅ 列表页按标题搜索（retro-board 无搜索，pmis 已有全局搜索可扩展）
- [x] **12.3 评论** —— N/A（retro-board 无卡片评论，MVP 不含）
- [x] **12.4 附件** —— N/A（retro-board 无卡片附件，MVP 不含）

---

## 十三、Sidebar 集成（布局已拍板 2026-09-04）

- [x] **13.1 增加 Retrospective 菜单项** —— ✅ `getMenuItems()` 插入 `{ id: 'retro', label: '回顾会', icon: MessageSquareText, href: '/retro', badge: activeRetroCount }`，位于 Wiki 与 Reports 之间
- [x] **13.2 菜单项右侧 `+` 按钮** —— ✅ 复用 Teams 的 `+` 模式，`e.stopPropagation()` 后 `router.push('/retro?new=1')`；点击菜单项 → `/retro`
- [x] **13.3 不做可展开子菜单** —— ✅ 无展开子菜单，管理统一在 `/retro` 列表页完成

---

## 十四、迁移完成验收清单

### 后端
- [x] 5 张新表 Flyway 迁移脚本（`retro_boards` / `retro_board_participants` / `retro_columns` / `retro_cards` / `retro_card_votes`）—— V18__create_retro_tables.sql
- [x] 6 个 entity（Board / BoardParticipant / BoardColumn / Card / CardVote + BoardStatus/ParticipantRole 枚举）+ 5 个 repository + 3 个 controller + 4 个 service（包名 `com.blake.pmis.retro.*`）
- [x] 参与者鉴权（RetroAuthService：owner/participant 校验，替代 team 校验，非参与者 403）
- [x] 状态机（ACTIVE/ENDED，ENDED 只读拦截）
- [x] 邀请通知集成（NotificationService.notifyRetroInvite，TYPE_RETRO_INVITE）
- [x] `WebSocketConfig` + `JwtHandshakeInterceptor`（JWT 握手鉴权）+ `RetroChannelInterceptor`（SUBSCRIBE participant 校验）
- [x] `SecurityConfig` 放行 `/ws/**`
- [x] `build.gradle` 新增 `spring-boot-starter-websocket`
- [x] `GlobalExceptionHandler` 新增 AccessDeniedException(403) + IllegalStateException(409) 处理

### 前端
- [x] `package.json` 新增 `@stomp/stompjs` + `sockjs-client` + `@types/sockjs-client`（@dnd-kit 已有）
- [x] `src/services/retroApi.ts`（基于 pmis `fetchApi` 封装，前缀 `/api/retro`，含全部 boards/columns/cards CRUD + 投票 + 参与者管理）
- [x] `src/hooks/useRetroWebSocket.ts`（SockJS + @stomp/stompjs 连接 `/ws?token=...`，订阅 `/topic/retro/{boardId}`）
- [x] Sidebar 增加回顾会菜单项 + `+`（跳 `/retro?new=1`），图标 MessageSquareText，badge=active count
- [x] `src/pages/retro/index.tsx` 列表页：搜索 + 视角 chips + 团队筛选 + 进行中/已结束 Tabs + 行字段 + 空状态 + 创建弹窗
- [x] `src/pages/retro/[id].tsx` 详情页：头部条 + ENDED 只读横幅 + 列管理 + 卡片 @dnd-kit 拖拽 + 投票 + WS 实时更新 + 邀请弹窗
- [x] pmis 首页"最近回顾会"区块（10.2）—— ✅ 已实现并浏览器实测通过（2026-09-08）

### 集成验证
- [x] 后端启动通过（Flyway V18 迁移成功，8080 端口运行，23 个 JPA 仓储，WebSocket broker 启动）
- [x] 前端编译通过（`/retro` 440 modules、`/retro/[id]` 541 modules，无编译错误，3000 端口运行）
- [x] 端口符合规范（后端 8080 / 前端 3000）
- [x] 侧边栏 `+` → `/retro?new=1` 自动弹新建弹窗；弹窗选人 → 创建 → 受邀人收通知 → 点击通知进入看板，全流程通过 —— ✅ 浏览器实测通过（2026-09-08）：`?new=1` 自动弹窗、选参与者、创建跳转详情页、受邀人铃铛收到 "RetroTest invited you to retrospective" 通知、点击通知跳转 `/retro/{id}`
- [x] 列表页：搜索/视角筛选/团队筛选/进行中·已结束 Tabs/行删除均正常 —— ✅ 浏览器实测通过（2026-09-08）：搜索空状态、我参与的/我主持的/全部 chips 切换、进行中/已结束 Tabs、行删除确认均正常
- [x] 详情页：头像组 popover / 移除参与者 / 邀请补人均正常 —— ✅ 浏览器实测通过（2026-09-08）：popover 显示参与者+主持角色、邀请弹窗打开用户列表、邀请后参与者数增加、移除后减少
- [x] 看板/列/卡片 CRUD + @dnd-kit 拖拽（列内/跨列）+ 投票全流程通过 —— ✅ 浏览器实测通过（2026-09-08）：卡片增删改、投票 toggle、列增删改名、同列拖拽排序均正常；跨列拖拽在上一轮会话已实测通过（含 indicator + 后端 position reindex）
- [x] 非参与者访问返回 403，WS 非参与者拒订阅 —— ✅ 代码+API 实测通过（2026-09-08）：REST `GET /retro/boards/{id}` 非参与者返回 403；`RetroChannelInterceptor.preSend` 对非参与者 SUBSCRIBE `/topic/retro/{id}` return null 拒绝
- [x] 多端实时同步验证（A 增删改 → B 立即刷新）—— ✅ 浏览器实测通过（2026-09-08）：双标签页打开同一看板，B 标签增卡 A 标签秒级自动出现，A 标签删卡 B 标签秒级自动消失，无需手动刷新
- [x] 结束回顾后看板只读（REST + WS + UI 三层验证）—— ✅ 全层实测通过（2026-09-08）：REST 层结束后 update/column add 返回 409；UI 层结束按钮→确认→灰色 "只读模式" 横幅、状态 "已结束"、所有增删改拖投票按钮隐藏/禁用

---

## 附：retro-board 关键源码位置索引

| 模块 | 后端文件 | 前端文件 |
|---|---|---|
| 认证 | `controller/AuthenticationController.java`、`service/AuthenticationService.java` | `app/login/page.tsx`、`app/register/page.tsx` |
| 团队 | `controller/TeamController.java`、`service/TeamService.java` | `app/teams/page.tsx` |
| 看板 | `controller/BoardController.java`、`service/BoardService.java` | `app/board/[id]/page.tsx` |
| 列 | `controller/BoardColumnController.java`、`service/BoardColumnService.java` | `app/components/column/Column.tsx` |
| 卡片 | `controller/CardController.java`、`service/CardService.java` | `app/components/card/Card.tsx` |
| WebSocket | `config/WebSocketConfig.java`、`service/WebSocketService.java` | `app/hooks/useBoardWebSocket.ts` |
| 实体 | `entity/{Board,Card,BoardColumn,Team,User,TeamMember}.java` | — |
| 配置 | `config/{WebSocketConfig,SecurityConfig}.java` | `app/layout.tsx` |
| API 封装 | — | `app/services/api.ts` |
