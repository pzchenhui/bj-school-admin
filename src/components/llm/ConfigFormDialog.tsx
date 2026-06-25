import React, { useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Info, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { PROVIDERS, PROVIDER_MAP } from '@/lib/llmProviders';
import type { LLMApiConfig, LLMProvider } from '@/types/types';
import { cn } from '@/lib/utils';

// ── 表单校验 Schema ──────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').max(60, '名称最多60个字符'),
  provider: z.enum(['openai', 'anthropic', 'azure_openai', 'gemini', 'custom'] as const),
  endpoint_url: z.string().min(1, 'API 端点不能为空').url('请输入有效的 URL 格式'),
  api_key: z.string().optional(),
  model_identifier: z.string().min(1, '模型标识符不能为空').max(100),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().int().min(1).max(128000),
  top_p: z.number().min(0).max(1),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConfigFormDialogProps {
  open: boolean;
  onClose: () => void;
  editConfig?: LLMApiConfig | null;
  onSaved: () => void;
}

const ConfigFormDialog: React.FC<ConfigFormDialogProps> = ({ open, onClose, editConfig, onSaved }) => {
  const isEdit = !!editConfig;
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editConfig?.name ?? '',
      provider: (editConfig?.provider as LLMProvider) ?? 'openai',
      endpoint_url: editConfig?.endpoint_url ?? PROVIDER_MAP['openai'].defaultEndpoint,
      api_key: '',
      model_identifier: editConfig?.model_identifier ?? '',
      temperature: editConfig?.optional_params?.temperature ?? 0.7,
      max_tokens: editConfig?.optional_params?.max_tokens ?? 2048,
      top_p: editConfig?.optional_params?.top_p ?? 1,
      description: editConfig?.description ?? '',
    },
  });

  // 切换服务商时自动填入默认端点和示例模型
  const handleProviderChange = useCallback((value: LLMProvider) => {
    form.setValue('provider', value);
    const meta = PROVIDER_MAP[value];
    if (meta.defaultEndpoint) {
      form.setValue('endpoint_url', meta.defaultEndpoint);
    } else {
      form.setValue('endpoint_url', '');
    }
    if (!form.getValues('model_identifier')) {
      form.setValue('model_identifier', meta.modelExamples[0] ?? '');
    }
  }, [form]);

  // 重置为服务商默认端点
  const resetEndpoint = useCallback(() => {
    const provider = form.getValues('provider');
    const meta = PROVIDER_MAP[provider];
    if (meta.defaultEndpoint) form.setValue('endpoint_url', meta.defaultEndpoint);
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      );

      const payload: Record<string, unknown> = {
        action: isEdit ? 'save' : 'save',
        id: editConfig?.id ?? undefined,
        name: values.name,
        provider: values.provider,
        endpointUrl: values.endpoint_url,
        modelIdentifier: values.model_identifier,
        optionalParams: {
          temperature: values.temperature,
          max_tokens: values.max_tokens,
          top_p: values.top_p,
        },
        description: values.description,
      };

      // 仅在填入了新密钥时传递
      if (values.api_key && values.api_key.trim()) {
        payload.apiKey = values.api_key.trim();
      }

      const { data, error } = await supabase.functions.invoke('llm-api-manager', {
        body: payload,
      });

      if (error) {
        const msg = await error?.context?.text?.();
        form.setError('root', { message: msg || error.message });
        return;
      }

      if (!data?.success) {
        form.setError('root', { message: data?.error || '保存失败，请重试' });
        return;
      }

      onSaved();
      onClose();
    } catch (e: unknown) {
      form.setError('root', { message: e instanceof Error ? e.message : '网络异常，请稍后重试' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentProvider = form.watch('provider');
  const providerMeta = PROVIDER_MAP[currentProvider];
  const temperature = form.watch('temperature');
  const maxTokens = form.watch('max_tokens');
  const topP = form.watch('top_p');

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto font-source-han-mono-sc">
        <DialogHeader>
          <DialogTitle className="text-balance flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              {isEdit ? 'EDIT' : 'NEW'}
            </span>
            {isEdit ? '编辑 API 配置' : '添加新 API 配置'}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {isEdit ? '修改已有的大语言模型 API 配置项，密钥留空则保持不变。' : '填写服务商信息与认证密钥，密钥将加密存储在数据库中。'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">

            {/* 配置名称 */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">配置名称 <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="如：生产环境 GPT-4、测试用 Claude" {...field} className="px-3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 服务商 */}
            <FormField control={form.control} name="provider" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">服务商 <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={(v) => handleProviderChange(v as LLMProvider)}>
                  <FormControl>
                    <SelectTrigger className="px-3">
                      <SelectValue placeholder="选择服务商" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVIDERS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">{p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                {providerMeta && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1 pt-0.5">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    认证方式：<code className="text-xs bg-muted px-1 rounded">{providerMeta.authHeader}</code>
                  </p>
                )}
              </FormItem>
            )} />

            {/* 端点 URL */}
            <FormField control={form.control} name="endpoint_url" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">API 端点（Endpoint URL）<span className="text-destructive">*</span></FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="https://api.openai.com/v1" {...field} className="px-3 flex-1 min-w-0 font-mono text-sm" />
                  </FormControl>
                  {providerMeta?.defaultEndpoint && (
                    <Button type="button" variant="outline" size="sm" className="shrink-0 h-9" onClick={resetEndpoint} title="恢复默认端点">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <FormMessage />
                <p className="text-xs text-muted-foreground">兼容 OpenAI 格式的第三方服务可填写自定义端点</p>
              </FormItem>
            )} />

            {/* API 密钥 */}
            <FormField control={form.control} name="api_key" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">
                  API 密钥（Secret Key）{!isEdit && <span className="text-destructive">*</span>}
                  {isEdit && <Badge variant="secondary" className="ml-2 text-xs font-normal">留空保持不变</Badge>}
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder={isEdit ? '留空则保持原密钥不变' : '粘贴您的 API 密钥...'}
                      {...field}
                      className="px-3 pr-10 font-mono text-sm"
                      autoComplete="off"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showKey ? '隐藏密钥' : '显示密钥'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FormMessage />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  密钥经 AES-GCM 加密后存储，前端界面仅显示掩码
                </p>
              </FormItem>
            )} />

            {/* 模型标识符 */}
            <FormField control={form.control} name="model_identifier" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">模型名称/标识符 <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder={providerMeta?.modelExamples[0] ?? 'gpt-4-turbo'} {...field} className="px-3 font-mono text-sm" />
                </FormControl>
                <FormMessage />
                {providerMeta?.modelExamples.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-xs text-muted-foreground mr-1 self-center">常用：</span>
                    {providerMeta.modelExamples.map(m => (
                      <button
                        key={m} type="button"
                        onClick={() => form.setValue('model_identifier', m)}
                        className="text-xs bg-muted hover:bg-accent hover:text-accent-foreground px-2 py-0.5 rounded border border-border transition-colors font-mono"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </FormItem>
            )} />

            {/* 描述 */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal">备注说明（选填）</FormLabel>
                <FormControl>
                  <Textarea placeholder="对该配置的简要说明，如用途、限额等" {...field} className="px-3 min-h-16 resize-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* 高级参数折叠区 */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-1"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                高级参数配置
                <Separator className="flex-1 ml-2" />
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-5 bg-muted/40 rounded-lg p-4 border border-border">
                  {/* 温度 */}
                  <FormField control={form.control} name="temperature" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-sm font-normal">温度（Temperature）</FormLabel>
                        <Badge variant="outline" className="font-mono text-xs">{temperature.toFixed(1)}</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          min={0} max={2} step={0.1}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          className="w-full"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">值越高输出越随机（0=确定性，1=均衡，2=高创意）</p>
                    </FormItem>
                  )} />

                  {/* 最大生成长度 */}
                  <FormField control={form.control} name="max_tokens" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-sm font-normal">最大生成长度（Max Tokens）</FormLabel>
                        <Badge variant="outline" className="font-mono text-xs">{maxTokens.toLocaleString()}</Badge>
                      </div>
                      <FormControl>
                        <Input
                          type="number" min={1} max={128000}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          className="px-3 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Top P */}
                  <FormField control={form.control} name="top_p" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-sm font-normal">Top P（核采样）</FormLabel>
                        <Badge variant="outline" className="font-mono text-xs">{topP.toFixed(2)}</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          min={0} max={1} step={0.05}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          className="w-full"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">控制词汇多样性，建议与温度不同时调整</p>
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* 表单级错误 */}
            {form.formState.errors.root && (
              <div className="bg-destructive/10 border border-destructive/30 rounded px-3 py-2 text-sm text-destructive flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="h-9">
                取消
              </Button>
              <Button type="submit" disabled={isSaving} className={cn('h-9 min-w-20', isSaving && 'opacity-70')}>
                {isSaving ? '保存中...' : isEdit ? '保存修改' : '添加配置'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigFormDialog;
