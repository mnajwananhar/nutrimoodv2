"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  Menu,
  X,
  User,
  LogOut,
  Utensils,
  Users,
  BookOpen,
  History,
  BarChart3,
  Star,
  Play,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";
import AuthButtons from "./AuthButtons";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, signOut, isAuthLoading } = useAuth();
  const { success, error } = useToast();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Tambahkan useEffect untuk scroll ke anchor jika ada hash di url
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      pathname === "/" &&
      window.location.hash
    ) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
          // Set active section when navigating via hash
          setActiveSection(id);
        }, 100); // delay agar elemen sudah render
      }
    }
  }, [pathname]);

  // Scrollspy untuk guest anchor
  useEffect(() => {
    if (!user && pathname === "/") {
      const handleScroll = () => {
        const sections = ["fitur", "demo", "footer"];
        let found = "";

        // Check if we're at the bottom of the page for footer
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 100;

        if (isAtBottom) {
          found = "footer";
        } else {
          for (const id of sections) {
            const el = document.getElementById(id);
            if (el) {
              const rect = el.getBoundingClientRect();
              // For footer, check if it's visible in viewport
              if (id === "footer") {
                if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                  found = id;
                  break;
                }
              } else {
                // For other sections, use the original logic
                if (rect.top <= 80 && rect.bottom > 80) {
                  found = id;
                  break;
                }
              }
            }
          }
        }

        setActiveSection(found);
      };
      window.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [user, pathname]);

  // Navigation untuk user login
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    {
      name: "Analisis Nutrisi",
      href: "/recommendations/assessment",
      icon: Utensils,
    },
    { name: "Komunitas", href: "/community", icon: Users },
    { name: "Edukasi", href: "/learn", icon: BookOpen },
  ];
  // Navigation untuk sebelum login (hanya anchor ke elemen di beranda)
  const guestNavigation = [
    { name: "Beranda", href: "/", icon: Brain },
    { name: "Fitur", href: "#fitur", icon: Star },
    { name: "Demo", href: "#demo", icon: Play },
    { name: "Kontak", href: "#footer", icon: Mail },
  ];

  const userNavigation = [
    { name: "Riwayat", href: "/history", icon: History },
    { name: "Profil", href: "/profile/", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      console.log("Sign out clicked"); // Tambah log untuk debug
      await signOut();
      success("Berhasil Keluar", "Anda telah berhasil keluar dari akun Anda.");
      router.push("/recommendations/assessment");
    } catch (err) {
      console.error("Error signing out:", err);
      error(
        "Gagal Keluar",
        err instanceof Error && err.message
          ? err.message
          : "Terjadi kesalahan saat mencoba keluar. Silakan coba lagi."
      );
      alert(
        "Gagal logout: " +
          (err instanceof Error && err.message ? err.message : "Unknown error")
      );
    }
  };

  // Handler untuk guestNavigation anchor
  const handleGuestNavClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.replace("#", "");
      if (pathname === "/") {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        // Set hash di URL untuk semua anchor links
        window.location.hash = id;
        // Manually set active section for immediate feedback
        setActiveSection(id);
      } else {
        router.push("/" + href);
      }
    }
  };

  if (isAuthLoading) {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="w-32 h-8 bg-sage-100 rounded animate-pulse" />
            <div className="w-48 h-8 bg-sage-100 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-200">
              <Image
                src="/icons/icon-96x96.png"
                alt="NutriMood Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
              NutriMood
            </span>
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {(user ? navigation : guestNavigation).map((item) => {
              const Icon = item.icon;
              let isActiveGuest = false;
              if (!user) {
                if (item.href === "/" && !activeSection) isActiveGuest = true;
                if (item.href === "#fitur" && activeSection === "fitur")
                  isActiveGuest = true;
                if (item.href === "#demo" && activeSection === "demo")
                  isActiveGuest = true;
                if (item.href === "#footer" && activeSection === "footer")
                  isActiveGuest = true;
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={
                    !user && item.href.startsWith("#")
                      ? (e) => handleGuestNavClick(e, item.href)
                      : undefined
                  }
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    user
                      ? isActive(item.href)
                        ? "bg-forest-100 text-forest-700 shadow-sm"
                        : "text-sage-700 hover:bg-sage-50"
                      : isActiveGuest
                      ? "bg-forest-100 text-forest-700 shadow-sm"
                      : "text-sage-700 hover:bg-sage-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>{" "}
          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-sage-50 transition-colors"
                  >
                    {userProfile?.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="User Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-sage-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-forest-500 to-forest-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {userProfile?.full_name?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                    )}
                    <span className="text-sage-700 font-medium">
                      {userProfile?.full_name || "User"}
                    </span>
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-earth border border-sage-200 py-2 z-50">
                      {" "}
                      <div className="px-4 py-2 border-b border-sage-100 flex items-center gap-3">
                        {userProfile?.avatar_url ? (
                          <Image
                            src={userProfile.avatar_url}
                            alt="User Avatar"
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-sage-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                            {userProfile?.full_name?.[0]?.toUpperCase() ||
                              userProfile?.username?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-forest-900">
                            {userProfile?.full_name || "User"}
                          </p>
                          <p className="text-sm text-sage-600 truncate break-all max-w-[180px]">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      {userNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 hover:text-forest-700 transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                      <div className="border-t border-sage-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              !isAuthLoading && <AuthButtons />
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-sage-600 hover:text-forest-700 hover:bg-sage-50 transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-sage-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {(user ? navigation : guestNavigation).map((item) => {
              const Icon = item.icon;
              let isActiveGuest = false;
              if (!user) {
                if (item.href === "/" && !activeSection) isActiveGuest = true;
                if (item.href === "#fitur" && activeSection === "fitur")
                  isActiveGuest = true;
                if (item.href === "#demo" && activeSection === "demo")
                  isActiveGuest = true;
                if (item.href === "#footer" && activeSection === "footer")
                  isActiveGuest = true;
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={
                    !user && item.href.startsWith("#")
                      ? (e) => handleGuestNavClick(e, item.href)
                      : undefined
                  }
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    user
                      ? isActive(item.href)
                        ? "bg-forest-100 text-forest-700"
                        : "text-sage-700 hover:text-forest-700 hover:bg-sage-50"
                      : isActiveGuest
                      ? "bg-forest-100 text-forest-700"
                      : "text-sage-700 hover:text-forest-700 hover:bg-sage-50"
                  }`}
                  scroll={item.href.startsWith("#") ? false : true}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {user && (
              <>
                {" "}
                <div className="border-t border-sage-200 mt-4 pt-4 flex items-center gap-3">
                  {userProfile?.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-sage-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                      {userProfile?.full_name?.[0]?.toUpperCase() ||
                        userProfile?.username?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  )}
                  <span className="font-medium text-forest-900">
                    {userProfile?.full_name || userProfile?.username || "User"}
                  </span>
                </div>
                <div className="border-t border-sage-200 mt-4 pt-4">
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-sage-700 hover:text-forest-700 hover:bg-sage-50 transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-sage-200 mt-4 pt-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Keluar</span>
                  </button>
                </div>
              </>
            )}

            {!user && !isAuthLoading && (
              <div className="border-t border-sage-200 mt-4 pt-4">
                <AuthButtons mobile={true} />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
