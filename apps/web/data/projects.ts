export interface ProjectItem {
  name: string;
  description: string;
  url: string;
}

export const projects: ProjectItem[] = [
  {
    name: 'AI-Workflow-Starter',
    description: '一套用于快速落地 AI 应用的项目模板，包含提示词管理、评测与部署脚本。',
    url: 'https://github.com/example/ai-workflow-starter',
  },
  {
    name: 'Embedded-Log-Toolkit',
    description: '嵌入式日志采集与分析工具集，支持串口抓取与关键事件过滤。',
    url: 'https://github.com/example/embedded-log-toolkit',
  },
];
