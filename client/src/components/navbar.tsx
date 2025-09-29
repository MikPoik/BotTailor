import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bot, LogOut, Settings, User, Menu, X, CreditCard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/theme-toggle";
import { normalizeRoutePath } from "@shared/route-metadata";
import { shouldSSR } from "@/routes/registry";

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const currentPath = location ?? '/';
  const normalizedPath = normalizeRoutePath(currentPath);
  const isPublicRoute = shouldSSR(normalizedPath);

  if (isLoading && !isPublicRoute) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                BotTailor
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="animate-pulse h-8 w-20 bg-muted rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Bot className="h-6 w-6" />
            <span className="font-bold">
              BotTailor
            </span>
          </Link>
        </div>

        {/* Spacer to push content to center and right */}
        <div className="flex flex-1 items-center justify-center">
          {/* Desktop Navigation - Centered */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <>
                  <Button variant={location === "/dashboard" ? "default" : "outline"} asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/subscription">Subscription</Link>
                  </Button>
                </>
              )}
              <Button variant="ghost" asChild>
                <Link href="/docs">Documentation</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/contact">Contact us</Link>
              </Button>

            </div>
          )}
        </div>

        {/* Desktop User Menu */}
        {!isMobile && (
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {!isAuthenticated ? (
              <Button asChild>
                <a href="/api/login">Log In</a>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.email || ""} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Mobile Menu Button and User Avatar/Login */}
        {isMobile && (
          <div className="flex items-center space-x-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.email || ""} />
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button asChild>
                <a href="/api/login">Log In</a>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div className="border-t bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                <Button 
                  variant={location === "/dashboard" ? "default" : "outline"} 
                  asChild 
                  className="w-full justify-start mb-2"
                >
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                </Button>
                <Link
                  href="/docs"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Documentation
                </Link>
                <Link
                  href="/subscription"
                  className="flex items-center text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscription
                </Link>
                <div className="border-t pt-3 space-y-3">
                  <Link
                    href="/profile"
                    className="flex items-center text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={closeMenu}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={closeMenu}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <a
                    href="/api/logout"
                    className="flex items-center text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={closeMenu}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </a>
                  <div className="pt-2">
                    <ThemeToggle />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Home
                </Link>
                <Link
                  href="/docs"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Documentation
                </Link>
                <Link
                  href="/pricing"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Pricing
                </Link>
                <Link
                  href="/contact"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Contact us
                </Link>
                <a
                  href="/api/login"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={closeMenu}
                >
                  Log In
                </a>
                <div className="pt-2">
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
