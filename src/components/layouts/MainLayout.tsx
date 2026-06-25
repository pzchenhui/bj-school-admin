import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard, BookOpen, BookText, BarChart2, MessageSquare,
  Calendar, Mic2, ClipboardList, Newspaper, Activity, Shield,
  GraduationCap, LogOut, Database, Menu, CalendarDays, LineChart, Cpu,
  ChevronLeft, ChevronRight, Brain,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePeriodicBackup } from '@/hooks/usePeriodicBackup';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  shortLabel: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页工作台',    shortLabel: '首页',  path: '/dashboard',  icon: LayoutDashboard, group: '主要' },
  { label: '工作计划管理',  shortLabel: '计划',  path: '/plans',       icon: BookOpen,        group: '日常记录' },
  { label: '班务日志记录',  shortLabel: '日志',  path: '/logs',        icon: BookText,        group: '日常记录' },
  { label: '值周值日台账',  shortLabel: '值日',  path: '/duty',        icon: ClipboardList,   group: '日常记录' },
  { label: '学生成绩管理',  shortLabel: '成绩',  path: '/grades',      icon: BarChart2,       group: '学生管理' },
  { label: '学生评语评价',  shortLabel: '评语',  path: '/comments',    icon: MessageSquare,   group: '学生管理' },
  { label: '学生心理辅导',  shortLabel: '心理',  path: '/psychology',       icon: Brain,           group: '学生管理' },
  { label: '知识库管理',    shortLabel: '知识',  path: '/psychology-admin', icon: BookOpen,        group: '学生管理' },
  { label: '节日活动方案库',shortLabel: '活动',  path: '/festivals',        icon: Calendar,        group: '资源库' },
  { label: '发言稿中心',    shortLabel: '发言',  path: '/speeches',    icon: Mic2,            group: '资源库' },
  { label: '黑板报素材库',  shortLabel: '黑板',  path: '/blackboard',  icon: Newspaper,       group: '资源库' },
  { label: '文体实践活动库',shortLabel: '实践',  path: '/activities',  icon: Activity,        group: '资源库' },
  { label: '数据分析',      shortLabel: '分析',  path: '/analytics',   icon: LineChart,       group: '数据分析' },
  { label: '学年学期管理',  shortLabel: '学年',  path: '/semesters',   icon: CalendarDays,    group: '数据分析' },
  { label: '大模型API管理', shortLabel: 'AI',    path: '/llm-api',     icon: Cpu,             group: '系统' },
  { label: '系统安全备份',  shortLabel: '安全',  path: '/security',    icon: Shield,          group: '系统' },
];

const BOTTOM_TABS = [
  { label: '首页', path: '/dashboard', icon: LayoutDashboard },
  { label: '记录', path: '/logs', icon: BookText },
  { label: '分析', path: '/analytics', icon: LineChart },
  { label: '设置', path: '/security', icon: Shield },
];

const NAV_GROUPS = ['主要', '日常记录', '学生管理', '资源库', '数据分析', '系统'];
const GROUP_LABELS: Record<string, string> = {
  '主要': '', '日常记录': '日常记录', '学生管理': '学生管理',
  '资源库': '资源库', '数据分析': '数据分析', '系统': '系统',
};

interface SidebarContentProps {
  onNavClick?: () => void;
  collapsed?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onNavClick, collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* 品牌标志 */}
      <div className={cn(
        'flex items-center gap-2.5 border-b border-sidebar-border shrink-0 transition-all duration-200',
        collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4'
      )}>
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-sidebar-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-sidebar-foreground leading-tight">{"班级小助手"}</p>
            <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">单机隐私版</p>
          </div>
        )}
      </div>
      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <TooltipProvider delayDuration={0}>
          {NAV_GROUPS.map(group => {
            const items = NAV_ITEMS.filter(n => n.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-1">
                {!collapsed && GROUP_LABELS[group] && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-widest">
                    {GROUP_LABELS[group]}
                  </p>
                )}
                {collapsed && GROUP_LABELS[group] && (
                  <div className="mx-3 my-1.5 border-t border-sidebar-border/40" />
                )}
                <ul className="space-y-0.5">
                  {items.map(item => {
                    const isActive = location.pathname === item.path ||
                      (item.path === '/dashboard' && location.pathname === '/');
                    const Icon = item.icon;
                    const btn = (
                      <button
                        onClick={() => { navigate(item.path); onNavClick?.(); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-md text-sm transition-all duration-150 text-left min-h-[36px]',
                          collapsed ? 'px-2 justify-center' : 'px-3',
                          isActive
                            ? 'bg-sidebar-primary/90 text-sidebar-primary-foreground font-medium shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <Icon className={cn(
                          'shrink-0 transition-colors',
                          collapsed ? 'w-5 h-5' : 'w-4 h-4',
                          isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50'
                        )} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                    return (
                      <li key={item.path}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                          </Tooltip>
                        ) : btn}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </TooltipProvider>
      </nav>
      {!collapsed && (
        <div className="px-4 py-2.5 border-t border-sidebar-border/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-sidebar-foreground/30" />
            <p className="text-[10px] text-sidebar-foreground/30">数据本地加密存储</p>
          </div>
        </div>
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentSemester, semesters, switchSemester, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 启动定时自动备份
  usePeriodicBackup();

  const currentPage = NAV_ITEMS.find(n =>
    n.path === location.pathname || (n.path === '/dashboard' && location.pathname === '/')
  );

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* 桌面端侧边栏 */}
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-sidebar-border relative transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}>
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* 折叠切换按钮 */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-card hover:shadow-hover transition-shadow z-10"
          title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
            : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          }
        </button>
      </aside>

      {/* 右侧主区域 */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">

        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-30 h-13 bg-card/95 backdrop-blur-sm border-b border-border flex items-center gap-2 px-4 shrink-0 no-print">

          {/* 移动端汉堡菜单 */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-8 w-8 -ml-1">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 bg-sidebar border-r border-sidebar-border">
              <SidebarContent onNavClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* 当前页面标题 */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {currentPage && (
              <currentPage.icon className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
            )}
            <h1 className="text-sm font-semibold text-foreground truncate">
              {currentPage?.label ?? '班主任管理系统'}
            </h1>
          </div>

          {/* 学期切换 */}
          <Select value={currentSemester.id} onValueChange={switchSemester}>
            <SelectTrigger className="h-8 text-xs shrink-0 hidden sm:flex w-36">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(sem => (
                <SelectItem key={sem.id} value={sem.id} className="text-xs">{sem.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/security')}>
                  <Database className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">数据备份</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={logout}>
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">退出登录</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </header>

        {/* 移动端学期选择条 */}
        <div className="sm:hidden px-4 py-2 border-b border-border bg-card/80 no-print">
          <Select value={currentSemester.id} onValueChange={switchSemester}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(sem => (
                <SelectItem key={sem.id} value={sem.id} className="text-xs">{sem.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 lg:pb-6">
            <Outlet />
          </div>
        </main>

        {/* 移动端底部Tab栏 */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border no-print">
          <div className="flex items-center h-14">
            {BOTTOM_TABS.map(tab => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/dashboard' && location.pathname === '/');
              const Icon = tab.icon;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-12 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                  <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
