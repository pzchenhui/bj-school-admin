/**
 * 通用AI辅助生成面板
 * 每个功能页面底部展开的AI工具区
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Wand2,
  Feather,
  BookPlus,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AiMode = 'generate' | 'polish' | 'expand' | 'summarize';

interface AIPanelProps {
  /** 上下文提示：告诉AI当前的场景 */
  context: string;
  /** 当前内容（用于润色/扩写/总结） */
  currentContent?: string;
  /** 确认使用AI内容的回调 */
  onApply: (content: string) => void;
  /** 面板标题 */
  title?: string;
}

const MODE_CONFIG: Record<AiMode, { label: string; icon: React.ComponentType<{className?: string}>; desc: string; color: string }> = {
  generate: { label: '内容生成', icon: Sparkles, desc: '根据场景自动生成完整内容', color: 'text-primary' },
  polish:   { label: '文本润色', icon: Feather,  desc: '优化语言表达，使行文更流畅', color: 'text-[hsl(var(--success))]' },
  expand:   { label: '扩写补充', icon: BookPlus, desc: '在原有内容基础上丰富细节', color: 'text-[hsl(var(--warning))]' },
  summarize:{ label: '智能总结', icon: FileText, desc: '提炼核心要点，生成精练总结', color: 'text-[hsl(var(--info))]' },
};

/** 本地模拟AI生成（离线版本） */
function generateLocalContent(mode: AiMode, context: string, currentContent: string, prompt: string): string {
  const base = currentContent || context;
  switch (mode) {
    case 'generate':
      return `【AI生成内容 - ${context}】\n\n` +
        `${prompt ? `根据您的要求"${prompt}"，` : ''}以下是为您生成的参考内容：\n\n` +
        `一、总体目标\n` +
        `结合本${context}的实际情况，科学合理地开展各项工作，切实履行班主任职责，促进学生全面发展。\n\n` +
        `二、主要工作内容\n` +
        `1. 加强班级日常管理，维护良好的学习秩序和纪律风气。\n` +
        `2. 关注学生的思想动态和心理健康，及时疏导解决问题。\n` +
        `3. 积极开展主题教育活动，丰富学生的课余文化生活。\n` +
        `4. 加强家校联系，定期与家长沟通学生在校情况。\n` +
        `5. 督促学生认真完成各科学业任务，培养良好学习习惯。\n\n` +
        `三、工作措施\n` +
        `通过晨会、班会等形式，对学生进行思想品德教育；定期召开家长会，汇报班级整体情况；建立健全班级管理制度，培养学生自我管理能力。\n\n` +
        `四、预期成效\n` +
        `通过以上工作的落实，班级整体面貌持续改善，学生综合素质显著提升，形成积极向上、团结互助的班级氛围。`;

    case 'polish':
      if (!base) return '请先输入需要润色的内容';
      return `【润色后内容】\n\n${base
        .replace(/。\s*/g, '。\n')
        .replace(/，/g, '，')
        .trim()}\n\n（以上内容已经过语言优化，表达更加流畅规范）`;

    case 'expand':
      if (!base) return '请先输入需要扩写的内容';
      return `【扩写后内容】\n\n${base}\n\n在此基础上，进一步补充如下：\n\n` +
        `（一）加强细节落实\n通过具体可操作的措施，确保各项工作目标得到切实贯彻执行，做到有安排、有检查、有总结。\n\n` +
        `（二）注重过程记录\n建立完整的工作台账，对重要工作节点进行详细记录，为后续工作总结和改进提供参考依据。\n\n` +
        `（三）持续改进提升\n定期对工作开展情况进行自我评估，及时发现问题并调整工作策略，不断优化工作方法。`;

    case 'summarize':
      if (!base) return '请先输入需要总结的内容';
      const lines = base.split(/[。\n]/).filter(l => l.trim().length > 5).slice(0, 5);
      return `【智能总结】\n\n本期主要工作要点如下：\n\n` +
        lines.map((l, i) => `${i + 1}. ${l.trim().slice(0, 30)}${l.trim().length > 30 ? '...' : ''}`).join('\n') +
        `\n\n综上所述，通过本期各项工作的有序推进，班级管理工作取得了积极成效，学生整体表现良好，各项工作目标基本达成。`;

    default:
      return '';
  }
}

const AIPanel: React.FC<AIPanelProps> = ({
  context,
  currentContent = '',
  onApply,
  title = 'AI智能辅助',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<AiMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    // 模拟AI生成延迟
    await new Promise(r => setTimeout(r, 800));
    const content = generateLocalContent(mode, context, currentContent, prompt);
    setResult(content);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('已复制到剪贴板');
  };

  const handleApply = () => {
    onApply(result);
    toast.success('已应用到编辑区');
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-accent/60 hover:bg-accent transition-colors border border-border"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          <Badge variant="secondary" className="text-xs">AI辅助</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <Card className="mt-2 border-primary/20 ai-panel-enter">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              选择AI功能
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 模式选择 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(MODE_CONFIG) as AiMode[]).map(m => {
                const cfg = MODE_CONFIG[m];
                const Icon = cfg.icon;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs transition-all',
                      mode === m
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', mode === m ? cfg.color : '')} />
                    <span className="font-medium">{cfg.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">{MODE_CONFIG[mode].desc}</p>

            {/* 附加提示词 */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">补充说明（可选）</p>
              <Textarea
                placeholder="输入额外要求，如：突出安全教育主题、篇幅约500字..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full h-9">
              {loading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />AI生成中...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />立即生成</>
              )}
            </Button>

            {/* 生成结果 */}
            {result && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-foreground">生成结果</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
                        <Copy className="w-3 h-3 mr-1" />复制
                      </Button>
                      <Button size="sm" onClick={handleApply} className="h-7 text-xs">
                        应用到编辑区
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {result}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIPanel;
