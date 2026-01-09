import { Home, MessageCircle } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  messagesCount: number;
  isMobile: boolean;
  colors: {
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
  };
}

export function TabNavigation({
  activeTab,
  onTabChange,
  messagesCount,
  isMobile,
  colors,
}: TabNavigationProps) {
  return (
    <TabsList
      className="grid w-full grid-cols-2 h-12 p-0.5"
      style={{
        backgroundColor: colors.backgroundColor,
      }}
    >
      <TabsTrigger
        value="home"
        onClick={() => onTabChange('home')}
        className="flex items-center gap-2 h-10 py-2 rounded-lg border-2 border-transparent"
        style={{
          color: activeTab === 'home' ? colors.primaryColor : colors.textColor + '80',
          borderColor: activeTab === 'home' ? colors.primaryColor : 'transparent',
          backgroundColor: activeTab === 'home' ? colors.primaryColor + '10' : 'transparent',
        }}
      >
        <Home className="h-4 w-4" />
        <span className={isMobile ? 'hidden sm:inline' : ''}></span>
      </TabsTrigger>
      <TabsTrigger
        value="chat"
        onClick={() => onTabChange('chat')}
        className="flex items-center gap-2 h-10 py-2 rounded-lg border-2 border-transparent"
        style={{
          color: activeTab === 'chat' ? colors.primaryColor : colors.textColor + '80',
          borderColor: activeTab === 'chat' ? colors.primaryColor : 'transparent',
          backgroundColor: activeTab === 'chat' ? colors.primaryColor + '10' : 'transparent',
        }}
      >
        <MessageCircle className="h-4 w-4" />
        <span className={isMobile ? 'hidden sm:inline' : ''}></span>
        {messagesCount > 0 && (
          <span
            className="text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
            style={{
              backgroundColor: colors.primaryColor,
              color: 'white',
            }}
          >
            {messagesCount}
          </span>
        )}
      </TabsTrigger>
    </TabsList>
  );
}
