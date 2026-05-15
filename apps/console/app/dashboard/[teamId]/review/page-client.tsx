"use client";

import * as React from "react";
import {
  Button,
  Card,
  Divider,
  Input,
  Radio,
  Space,
  Tag,
  Typography,
  Timeline,
  Message,
  Alert,
} from "@arco-design/web-react";
import { IconCheck, IconClose, IconDownload, IconFilePdf, IconImage, IconLink, IconSearch } from "@arco-design/web-react/icon";

const { Title, Text, Paragraph } = Typography;

// Mock Data
const MOCK_FIELDS = [
  {
    id: "field-profile-name",
    name: "主体名称",
    path: "profile.name",
    status: "pending", // pending, warning, confirmed
    statusText: "待处理",
    letter: "K",
    isKeyFact: true,
    aiValue: "上海某某科技有限公司",
    confidence: "0.95（高）",
    source: "营业执照",
    evidences: [
      { type: "attachment", name: "business-license.pdf", icon: <IconFilePdf /> },
    ],
    history: [
      { time: "2026-05-10 10:19", user: "系统", action: "生成提取结果 v12" },
    ],
  },
  {
    id: "field-profile-address",
    name: "注册地址",
    path: "profile.contacts.address",
    status: "warning",
    statusText: "需关注",
    letter: "K",
    isKeyFact: true,
    aiValue: "上海市浦东新区××路××号",
    confidence: "0.71（中）",
    source: "官网联系我们页 / PDF 资质文件",
    evidences: [
      { type: "text", content: "网页片段：…浦东新区××路××号…（高亮）", icon: <IconLink /> },
      { type: "attachment", name: "business-license.pdf", icon: <IconFilePdf /> },
      { type: "image", name: "contact-page.png", icon: <IconImage /> },
    ],
    history: [
      { time: "2026-05-10 10:21", user: "你", action: "修改地址（从 AI 值调整）" },
      { time: "2026-05-10 10:19", user: "系统", action: "生成提取结果 v12" },
    ],
  },
  {
    id: "field-certs",
    name: "资质证书",
    path: "certificates",
    status: "pending",
    statusText: "待处理",
    letter: "K",
    isKeyFact: true,
    aiValue: "ISO9001 质量管理体系认证",
    confidence: "0.88（高）",
    source: "资质证书扫描件",
    evidences: [
      { type: "attachment", name: "iso9001.pdf", icon: <IconFilePdf /> },
    ],
    history: [
      { time: "2026-05-10 10:19", user: "系统", action: "生成提取结果 v12" },
    ],
  },
  {
    id: "field-one-liner",
    name: "一句话简介",
    path: "profile.oneLiner",
    status: "confirmed",
    statusText: "已确认",
    letter: "N",
    isKeyFact: false,
    aiValue: "致力于提供高质量的软件解决方案",
    confidence: "0.92（高）",
    source: "公司简介文档",
    evidences: [
      { type: "text", content: "文档片段：公司致力于提供高质量的软件解决方案...", icon: <IconLink /> },
    ],
    history: [
      { time: "2026-05-10 10:25", user: "你", action: "确认通过" },
      { time: "2026-05-10 10:19", user: "系统", action: "生成提取结果 v12" },
    ],
  },
];

export function ReviewClient() {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(MOCK_FIELDS[1].id);
  const [auditValues, setAuditValues] = React.useState<Record<string, string>>({
    "field-profile-address": "上海市浦东新区××路××号",
  });

  const filteredFields = MOCK_FIELDS.filter((f) => {
    if (filter === "pending" && f.status !== "pending") return false;
    if (filter === "warning" && f.status !== "warning") return false;
    if (filter === "confirmed" && f.status !== "confirmed") return false;
    if (search && !f.name.includes(search) && !f.path.includes(search)) return false;
    return true;
  });

  const selectedField = MOCK_FIELDS.find((f) => f.id === selectedId) || MOCK_FIELDS[0];

  const handleAuditValueChange = (val: string) => {
    setAuditValues((prev) => ({ ...prev, [selectedField.id]: val }));
  };

  const handleAdoptAiValue = () => {
    handleAuditValueChange(selectedField.aiValue);
    Message.success("已采用 AI 提取值");
  };

  const handleConfirm = () => {
    Message.success(`字段 [${selectedField.name}] 已确认`);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", backgroundColor: "var(--color-fill-2)" }}>
      {/* 左侧字段列表 */}
      <div
        style={{
          flex: "0 0 360px",
          width: 360,
          borderRight: "1px solid var(--color-border)",
          backgroundColor: "var(--color-bg-1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <Title heading={6} style={{ margin: "0 0 16px 0" }}>
            信息审核
          </Title>
          <Space direction="vertical" size="medium" style={{ width: "100%" }}>
            <Radio.Group
              type="button"
              value={filter}
              onChange={setFilter}
              options={[
                { label: "全部", value: "all" },
                { label: "待处理", value: "pending" },
                { label: "需关注", value: "warning" },
                { label: "已确认", value: "confirmed" },
              ]}
              style={{ display: "flex", width: "100%" }}
            />
            <Input.Search
              placeholder="搜索字段（名称/路径）"
              value={search}
              onChange={setSearch}
              allowClear
            />
          </Space>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {filteredFields.map((field) => (
              <div
                key={field.id}
                onClick={() => setSelectedId(field.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: selectedId === field.id ? "var(--color-fill-3)" : "transparent",
                  border: selectedId === field.id ? "1px solid var(--color-primary-light-3)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== field.id) e.currentTarget.style.backgroundColor = "var(--color-fill-2)";
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== field.id) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: field.isKeyFact ? "var(--color-primary-light-1)" : "var(--color-neutral-3)",
                      color: field.isKeyFact ? "var(--color-primary-6)" : "var(--color-text-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {field.letter}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text bold ellipsis={{ showTooltip: true }}>
                        {field.name}
                      </Text>
                      {field.status === "pending" && <Tag color="gray" size="small">待处理</Tag>}
                      {field.status === "warning" && <Tag color="orange" size="small">需关注</Tag>}
                      {field.status === "confirmed" && <Tag color="green" size="small">已确认</Tag>}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                      {field.path}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
            {filteredFields.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-3)" }}>
                暂无符合条件的字段
              </div>
            )}
          </Space>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-2)" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            关键事实：3/5 已完成 · 全部字段：6/12 已完成
          </Text>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button style={{ flex: 1 }}>下一项</Button>
            <Button type="primary" style={{ flex: 1 }}>
              提交审核
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧详情面板 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px", backgroundColor: "var(--color-bg-1)" }}>
        {selectedField ? (
          <div style={{ maxWidth: 800 }}>
            {/* 头部标题 */}
            <div style={{ marginBottom: 32 }}>
              <Space align="center" size="medium">
                <Title heading={3} style={{ margin: 0 }}>
                  {selectedField.name} {selectedField.isKeyFact && <Tag color="arcoblue">关键事实</Tag>}
                </Title>
              </Space>
              <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                {selectedField.path} · 状态：{selectedField.statusText}
              </Text>
            </div>

            {/* AI 提取区 */}
            <Card bordered={false} style={{ backgroundColor: "var(--color-fill-1)", marginBottom: 24 }}>
              <Title heading={6} style={{ marginTop: 0 }}>
                AI 提取结果
              </Title>
              <Space direction="vertical" size="small">
                <div>
                  <Text type="secondary">AI 提取值：</Text>
                  <Text bold>{selectedField.aiValue}</Text>
                </div>
                <div>
                  <Text type="secondary">置信度评估：</Text>
                  <Text>{selectedField.confidence}</Text>
                </div>
                <div>
                  <Text type="secondary">信息来源：</Text>
                  <Text>{selectedField.source}</Text>
                </div>
              </Space>
            </Card>

            {/* 证据追溯 */}
            <div style={{ marginBottom: 32 }}>
              <Title heading={6}>证据与溯源</Title>
              <Space direction="vertical" size="medium" style={{ width: "100%" }}>
                {selectedField.evidences.map((ev, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ color: "var(--color-text-3)", marginTop: 2 }}>{ev.icon}</div>
                    {ev.type === "text" ? (
                      <Text>{ev.content}</Text>
                    ) : (
                      <Button type="text" size="small" icon={<IconDownload />}>
                        {ev.name} (点击预览)
                      </Button>
                    )}
                  </div>
                ))}
              </Space>
            </div>

            <Divider />

            {/* 审核操作区 */}
            <div style={{ marginBottom: 32 }}>
              <Title heading={6}>审核确认值</Title>
              <Input.TextArea
                value={auditValues[selectedField.id] ?? ""}
                onChange={handleAuditValueChange}
                placeholder="请输入确认后的最终值"
                autoSize={{ minRows: 2, maxRows: 6 }}
                style={{ marginBottom: 16 }}
              />
              <Space size="medium">
                <Button onClick={handleAdoptAiValue}>一键采用 AI 值</Button>
                <Button>上传 / 关联新附件</Button>
              </Space>
            </div>

            {/* 底部操作 */}
            <div style={{ marginBottom: 32 }}>
              <Space size="medium">
                <Button type="primary" status="success" icon={<IconCheck />} onClick={handleConfirm}>
                  确认通过
                </Button>
                <Button type="primary" onClick={() => Message.info("修改已保存")}>
                  保存修改
                </Button>
                <Button type="outline" status="warning">
                  标记需补充证据
                </Button>
              </Space>
              <Alert
                type="info"
                showIcon={false}
                style={{ marginTop: 16, backgroundColor: "transparent", padding: 0 }}
                content={
                  <Text type="secondary">
                    提交审核规则（关键事实）：必须有证据，或填写审核值并确认通过。
                  </Text>
                }
              />
            </div>

            <Divider />

            {/* 变更记录 */}
            <div>
              <Title heading={6}>变更记录</Title>
              <Timeline style={{ marginTop: 16 }}>
                {selectedField.history.map((log, idx) => (
                  <Timeline.Item key={idx} label={log.time}>
                    <Text bold>{log.user}</Text>
                    <Text style={{ marginLeft: 8 }}>{log.action}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Text type="secondary">请选择左侧字段进行审核</Text>
          </div>
        )}
      </div>
    </div>
  );
}
