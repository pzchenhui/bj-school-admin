import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, MoreVertical, Pencil, Trash2,
  Wifi, WifiOff, Loader2, Zap, Clock, ShieldCheck, BarChart2,
} from 'lucide-react';
import { PROVIDER_MAP } from '@/lib/llmProviders';
import type { LLMApiConfig, TestResult } from '@/types/types';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConfigCardProps {
  config: LLMApiConfig;
  onEdit: (config: LLMApiConfig) => void;
  onDeleted: () => void;
  onActivated: () => void;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

/** 服务商色彩标记 */
const PROVIDER_COLORS: Record<string, { dot: string; badge: string }> = {
  openai:     { dot: 'bg-success',   badge: 'bg-success/10 text-success border-success/20' },
  anthropic:  { dot: 'bg-warning',   badge: 'bg-warning/10 text-warning border-warning/20' },
  azure_openai: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20' },
  gemini:     { dot: 'bg-chart-4',   badge: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  custom:     { dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
};

const ConfigCard: React.FC<ConfigCardProps> = ({ config, onEdit, onDeleted, onActivated }) => {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const providerMeta = PROVIDER_MAP[config.provider];
  const providerColor = PROVIDER_COLORS[config.provider] ?? PROVIDER_COLORS.custom;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('llm-api-manager', {
        body: {
          action: 'test',
          id: config.id,
          endpointUrl: config.endpoint_url,
          modelIdentifier: config.model_identifier,
          provider: config.provider,
        },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        setTestResult({ success: false, message: msg || error.message });
        return;
      }
      setTestResult({ success: data?.success, message: data?.message, latency: data?.latency });
    } catch (e: unknown) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : '测试失败' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetActive = async () => {
    if (config.is_active) return;
    setIsActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke('llm-api-manager', {
        body: { action: 'setActive', id: config.id },
      });
      if (error || !data?.success) { toast.error('切换失败，请稍后重试'); return; }
      toast.success('已切换为当前启用配置');
      onActivated();
    } catch { toast.error('操作异常，请稍后重试'); }
    finally { setIsActivating(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('llm-api-manager', {
        body: { action: 'delete', id: config.id },
      });
      if (error || !data?.success) { toast.error('删除失败，请稍后重试'); return; }
      toast.success('配置已删除');
      onDeleted();
    } catch { toast.error('操作异常'); }
    finally { setIsDeleting(false); setShowDeleteDialog(false); }
  };

  const formattedDate = new Date(config.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const lastUsed = config.last_used_at
    ? new Date(config.last_used_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    : null;

  return (
    <>
      <Card className={cn(
        'h-full flex flex-col transition-all duration-200 border shadow-card hover:shadow-hover',
        config.is_active && 'ring-1 ring-primary/40 border-primary/40',
      )}>
        <CardContent className="flex-1 flex flex-col p-4 gap-3">

          {/* 顶部：服务商标记 + 名称 + 激活状态 + 菜单 */}
          <div className="flex items-start gap-2.5">
            {/* 服务商色点 */}
            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', providerColor.dot)} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate text-balance leading-snug">
                  {config.name}
                </h3>
                {config.is_active && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-primary text-primary-foreground shrink-0 font-medium">
                    启用中
                  </Badge>
                )}
                {!config.is_enabled && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground shrink-0">
                    已禁用
                  </Badge>
                )}
              </div>
              <span className={cn(
                'inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border mt-1',
                providerColor.badge,
              )}>
                {providerMeta?.name ?? config.provider}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground -mr-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(config)} className="gap-2 cursor-pointer text-sm">
                  <Pencil className="w-3.5 h-3.5" /> 编辑配置
                </DropdownMenuItem>
                {!config.is_active && (
                  <DropdownMenuItem onClick={handleSetActive} disabled={isActivating} className="gap-2 cursor-pointer text-sm">
                    <Zap className="w-3.5 h-3.5" /> 设为启用
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除配置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 配置信息区 */}
          <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-2 border border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">模型</span>
              <code className="text-xs font-mono text-foreground truncate bg-background px-1.5 py-0.5 rounded border border-border/60">
                {config.model_identifier}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">端点</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <code className="text-[11px] font-mono text-muted-foreground truncate max-w-[160px] cursor-default">
                      {config.endpoint_url}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs break-all text-xs">
                    {config.endpoint_url}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">密钥</span>
              <div className="flex items-center gap-1.5">
                <code className="text-[11px] font-mono text-muted-foreground tracking-widest">••••••••••</code>
                <div className="flex items-center gap-0.5 text-success">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[9px] font-mono">AES-GCM</span>
                </div>
              </div>
            </div>
          </div>

          {/* 描述 */}
          {config.description && (
            <p className="text-xs text-muted-foreground text-pretty line-clamp-2">{config.description}</p>
          )}

          {/* 使用统计 */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              <span>调用 <strong className="text-foreground">{config.usage_count}</strong> 次</span>
            </div>
            {lastUsed && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>最近 {lastUsed}</span>
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <span>{formattedDate} 创建</span>
            </div>
          </div>

          <Separator />

          {/* 测试结果 */}
          {testResult && (
            <div className={cn(
              'text-xs rounded-lg px-3 py-2 flex items-start gap-2 border',
              testResult.success
                ? 'bg-success/8 border-success/20 text-success'
                : 'bg-destructive/8 border-destructive/20 text-destructive',
            )}>
              {testResult.success
                ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                : <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="break-words">{testResult.message}</p>
                {testResult.latency !== undefined && (
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 响应 {testResult.latency} ms
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 mt-auto">
            {!config.is_active && (
              <Button
                variant="outline" size="sm"
                className="h-8 text-xs flex-1"
                onClick={handleSetActive}
                disabled={isActivating}
              >
                {isActivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span className="ml-1.5">设为启用</span>
              </Button>
            )}
            <Button
              size="sm"
              className={cn('h-8 text-xs', config.is_active ? 'flex-1' : 'flex-1')}
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Wifi className="w-3.5 h-3.5" />
              }
              <span className="ml-1.5">{isTesting ? '测试中...' : '连接测试'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-balance">确认删除此配置？</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              将永久删除配置 <strong>「{config.name}」</strong>，此操作不可撤销。
              {config.is_active && (
                <span className="block mt-2 text-warning font-medium">
                  ⚠ 该配置当前处于启用状态，删除后将无可用 AI 配置。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConfigCard;
