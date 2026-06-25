import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Cpu } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {/* 工程风格图标装饰 */}
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
        <Cpu className="w-9 h-9 text-muted-foreground" />
      </div>
      {/* 角落装饰线 */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary/40" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary/40" />
      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary/40" />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary/40" />
    </div>

    <h3 className="text-base font-semibold text-foreground mb-2 text-balance">暂无 API 配置</h3>
    <p className="text-sm text-muted-foreground max-w-sm text-pretty mb-6">
      添加您的第一个大语言模型 API 配置，支持 OpenAI、Anthropic、Azure 等主流服务商，
      以及任何兼容 OpenAI 格式的自定义端点。
    </p>

    <Button onClick={onAdd} className="gap-2">
      <Plus className="w-4 h-4" />
      添加第一个配置
    </Button>

    {/* 工程风格注释 */}
    <p className="text-[10px] font-mono text-muted-foreground/50 mt-8 tracking-wider">
      // FIG 1.0 — NO API CONFIGS FOUND
    </p>
  </div>
);

export default EmptyState;
