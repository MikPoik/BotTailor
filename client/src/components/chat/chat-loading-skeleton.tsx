import { MessageCircle, Home } from "lucide-react";

interface ChatLoadingSkeletonProps {
  primaryColor?: string;
  isMobile?: boolean;
}

export default function ChatLoadingSkeleton({ 
  primaryColor = '#2563eb',
  isMobile = false 
}: ChatLoadingSkeletonProps) {
  return (
    <div className={`bg-white ${isMobile ? 'h-full' : 'w-96 h-[600px] rounded-2xl shadow-2xl border border-gray-200'} flex flex-col overflow-hidden animate-pulse`}>
      {/* Header skeleton */}
      <div 
        className="p-3 flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
          <div>
            <div className="h-3 w-20 bg-white bg-opacity-30 rounded animate-pulse mb-1"></div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <div className="h-2 w-12 bg-white bg-opacity-20 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="w-6 h-6 bg-white bg-opacity-30 rounded animate-pulse"></div>
      </div>

      {/* Tab skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          <div className="flex-1 px-3 py-2 flex items-center justify-center space-x-1 bg-blue-50">
            <Home className="h-4 w-4 text-gray-400" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 px-3 py-2 flex items-center justify-center space-x-1">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4 bg-gray-50">
        {/* Home tab skeleton content */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-blue-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
            <div className="h-3 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
            <div className="h-3 w-40 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Quick action buttons skeleton */}
        <div className="space-y-2">
          <div className="h-10 bg-white border border-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-white border border-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-white border border-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="p-3 border-t border-gray-200 bg-white flex items-center space-x-2">
        <div className="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        <div 
          className="w-10 h-10 rounded-lg animate-pulse"
          style={{ backgroundColor: `${primaryColor}20` }}
        ></div>
      </div>
    </div>
  );
}