import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import {
  Zap,
  Battery,
  Clock,
  MapPin,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  DollarSign,
  Users,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Play,
  Car,
  History,
  UserIcon,
  LogOut,
  Map,
  QrCode,
  Contact,
  PhoneCall,
  Pen,
  CreditCardIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useGeoLocation from "./map/useGeoLocation";
import MapPreview from "./map/MapPreview";
import { fetchStations, Station } from "../services/admin/stationService";
import type { User } from "../App";
import { get } from "http";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { PricingSection } from "./PricingSection";

interface HomepageProps {
  user: User | null;
  onLogout: () => void;
}
export function Homepage({ user, onLogout }: HomepageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleNavigateToDashboard = (section: string) => {
    navigate("/driver", { state: { initialSection: section } });
  };

  const location = useGeoLocation();
  const [isWaitingForLocation, setIsWaitingForLocation] = useState(false);
  const [stations, setStations] = useState<Station[] | null>(null);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolled, setIsScrolled] = useState(false);

  const features = [
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: t("features.ultraFast.title"),
      description: t("features.ultraFast.desc"),
    },
    {
      icon: <Battery className="w-8 h-8 text-orange-500" />,
      title: t("features.alwaysCharged.title"),
      description: t("features.alwaysCharged.desc"),
    },
    {
      icon: <MapPin className="w-8 h-8 text-orange-500" />,
      title: t("features.nationwide.title"),
      description: t("features.nationwide.desc"),
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-500" />,
      title: t("features.safeReliable.title"),
      description: t("features.safeReliable.desc"),
    },
  ];



  const testimonials = [
    {
      name: t("testimonials.customer1.name"),
      role: t("testimonials.customer1.role"),
      rating: 5,
      comment: t("testimonials.customer1.comment"),
    },
    {
      name: t("testimonials.customer2.name"),
      role: t("testimonials.customer2.role"),
      rating: 5,
      comment: t("testimonials.customer2.comment"),
    },
    {
      name: t("testimonials.customer3.name"),
      role: t("testimonials.customer3.role"),
      comment: t("testimonials.customer3.comment"),
    },
  ];

  const stats = [
    { number: "2.8M", label: t("stats.swapsCompleted") },
    { number: "24", label: t("stats.stationsNationwide") },
    { number: "8,547", label: t("stats.happyCustomers") },
    { number: "99.9%", label: t("stats.uptimeReliability") },
  ];

  useEffect(() => {
    if (isWaitingForLocation && location.loaded && !location.error) {
      const userLocation = {
        lat: location.coordinates!.lat,
        lng: location.coordinates!.lng,
      };

      setIsWaitingForLocation(false);

      navigate("/map", {
        state: {
          userLocation,
          stations,
        },
      });
    }

    if (isWaitingForLocation && location.loaded && location.error) {
      setIsWaitingForLocation(false);
      alert(
        `Lỗi xác định vị trí: ${location.error.message}. Vui lòng kiểm tra cài đặt vị trí của trình duyệt.`
      );
    }
  }, [
    isWaitingForLocation,
    location.loaded,
    location.error,
    location.coordinates,
    navigate,
    stations,
  ]);

  useEffect(() => {
    const getAllStations = async () => {
      try {
        const response = await fetchStations(1, 20);
        setStations(response.items);
        console.log("Fetched stations:", response.items);
      } catch (error) {
        console.error("Error fetching stations:", error);
        throw error;
      }
    };
    getAllStations();
  }, []);

  // Scroll handler for navbar animation with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          setIsScrolled(scrollPosition > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleFineNearestStation = () => {
    if (location.loaded && !location.error) {
      const userLocation = {
        lat: location.coordinates!.lat,
        lng: location.coordinates!.lng,
      };
      console.log("User location:", userLocation);
      console.log("Stations:", stations);
      navigate("/map", {
        state: {
          userLocation,
          stations,
        },
      });
      return;
    }

    if (location.error) {
      alert(
        `Lỗi xác định vị trí: ${location.error.message}. Vui lòng kiểm tra cài đặt vị trí của trình duyệt.`
      );
      return;
    }

    setIsWaitingForLocation(true);
  };

  const isButtonDisabled = isWaitingForLocation;
  let buttonText = t("stations.viewFullMap");

  if (isWaitingForLocation && !location.loaded) {
    buttonText = "Đang xác định vị trí...";
  } else if (location.error) {
    buttonText = "Lỗi vị trí: Thử lại";
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 z-50 ${
          isScrolled 
            ? "bg-white/90 backdrop-blur-md shadow-xl rounded-2xl" 
            : "bg-transparent backdrop-blur-sm rounded-none"
        }`}
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: isScrolled ? '1280px' : '100%',
          paddingTop: isScrolled ? '0.5rem' : '1rem',
          paddingBottom: isScrolled ? '0.5rem' : '1rem',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'max-width, padding, background-color, border-radius'
        }}
      >
        <div className={`mx-auto transition-all duration-300 ease-out ${
          isScrolled ? "px-6 max-w-7xl w-full" : "w-full px-4 sm:px-6 lg:px-8"
        }`}>
          <div 
            className="flex items-center justify-between w-full"
            style={{
              height: isScrolled ? '3.5rem' : '4rem',
              transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="flex items-center group cursor-pointer flex-shrink-0">
              {/* Logo bo tròn, giữ độ nét */}
              <div
                className="rounded-full border border-orange-100 shadow-lg group-hover:shadow-xl group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 overflow-hidden"
                style={{
                  width: isScrolled ? '3rem' : '4rem',
                  height: isScrolled ? '3rem' : '4rem',
                  marginRight: '0.75rem',
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <img
                  src="src/assets/logoEV2.png "
                  alt="FPTFAST Logo"
                  className="w-full h-full"
                  style={{ objectFit: 'contain', imageRendering: 'auto' }}
                />
              </div>
              <span 
                className="font-bold tracking-wide ease-out group-hover:text-orange-700 whitespace-nowrap text-orange-600"
                style={{
                  fontSize: isScrolled ? '1.25rem' : '1.875rem',
                  lineHeight: isScrolled ? '1.75rem' : '2.25rem',
                  transition: 'font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1), line-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'font-size, line-height'
                }}
              >
                {isScrolled ? "FPTFAST" : "F P T F A S T"}
              </span>
            </div>

            <div className="hidden md:flex items-center flex-1 justify-center">
              <a
                href="#features"
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 relative group px-2"
                style={{
                  marginLeft: isScrolled ? '0.5rem' : '1.5rem',
                  marginRight: isScrolled ? '0.5rem' : '1.5rem',
                  fontSize: isScrolled ? '0.95rem' : '1rem',
                  transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("nav.features")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#pricing"
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 relative group px-2"
                style={{
                  marginLeft: isScrolled ? '0.5rem' : '1.5rem',
                  marginRight: isScrolled ? '0.5rem' : '1.5rem',
                  fontSize: isScrolled ? '0.95rem' : '1rem',
                  transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("nav.pricing")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#stations"
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 relative group px-2"
                style={{
                  marginLeft: isScrolled ? '0.5rem' : '1.5rem',
                  marginRight: isScrolled ? '0.5rem' : '1.5rem',
                  fontSize: isScrolled ? '0.95rem' : '1rem',
                  transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("nav.stations")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a
                href="#contact"
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 relative group px-2"
                style={{
                  marginLeft: isScrolled ? '0.5rem' : '1.5rem',
                  marginRight: isScrolled ? '0.5rem' : '1.5rem',
                  fontSize: isScrolled ? '0.95rem' : '1rem',
                  transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("nav.contact")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
            <div className="flex items-center flex-shrink-0">
              {!user ? (
                <>
                  <div>
                    <LanguageSwitcher />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/login")}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 transition-colors duration-300 whitespace-nowrap"
                    style={{
                      marginLeft: isScrolled ? '0.5rem' : '2rem',
                      padding: '0.5rem 1rem',
                      height: isScrolled ? '2.25rem' : '2.5rem',
                      fontSize: isScrolled ? '0.9375rem' : '1rem',
                      transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {t("nav.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-colors duration-300 transform hover:scale-105 whitespace-nowrap"
                    style={{
                      marginLeft: isScrolled ? '0.5rem' : '1.5rem',
                      padding: '0.5rem 1rem',
                      height: isScrolled ? '2.25rem' : '2.5rem',
                      fontSize: isScrolled ? '0.9375rem' : '1rem',
                      transition: 'margin 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1), font-size 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {t("nav.getStarted")}
                    <Sparkles 
                      className="animate-pulse"
                      style={{
                        width: isScrolled ? '0.875rem' : '1rem',
                        height: isScrolled ? '0.875rem' : '1rem',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1), height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative justify-start text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-300 will-change-transform"
                      style={{
                        height: isScrolled ? '2rem' : '2.5rem',
                        padding: isScrolled ? '0.5rem' : '0.75rem'
                      }}
                    >
                      <Avatar 
                        className="mr-2 transition-all duration-500 ease-out will-change-transform"
                        style={{
                          width: isScrolled ? '1.5rem' : '2rem',
                          height: isScrolled ? '1.5rem' : '2rem'
                        }}
                      >
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                        />
                        <AvatarFallback style={{ fontSize: isScrolled ? '0.75rem' : '1rem' }}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className="font-medium whitespace-nowrap transition-all duration-500 ease-out"
                        style={{
                          fontSize: isScrolled ? '0.875rem' : '1rem',
                          display: isScrolled ? 'none' : 'inline'
                        }}
                      >
                        {user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("map")}
                    >
                      <Map className="mr-2 h-4 w-4" />
                      <span>Tìm trạm</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("mycar")}
                    >
                      <Car className="mr-2 h-4 w-4" />
                      <span>Xe của tôi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("subscription")}
                    >
                      <Pen className="mr-2 h-4 w-4" />
                      <span>Đăng ký gói</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("my-payments")}
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      <span>Hóa đơn chờ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("swap")}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      <span>Đơn đã đặt</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("history")}
                    >
                      <History className="mr-2 h-4 w-4" />
                      <span>Lịch sử đổi pin</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("complaints")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span>Khiếu nại của tôi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("profile")}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50 min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-orange-100/40 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-[1600px] mx-auto min-h-[70vh]">
            <div 
              className={`space-y-6 transition-all duration-1000 ${
                isVisible["hero-text"] 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-10"
              }`}
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  el.id = "hero-text";
                  sectionRefs.current["hero-text"] = el;
                }
              }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                {t("home.hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 bg-clip-text text-transparent mb-6 leading-tight animate-gradient">
                {t("home.hero.title")}
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                {t("home.hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleFineNearestStation}
                  disabled={isButtonDisabled}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                >
                  {t("home.hero.findStation")}
                  <MapPin className="w-5 h-5 ml-2 group-hover:animate-bounce" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleNavigateToDashboard("map")}
                  className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  {"Đặt lịch"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                    {t("home.hero.avgSwapTime")}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t("home.hero.avgSwapTimeLabel")}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                    {t("home.hero.availability")}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t("home.hero.availabilityLabel")}
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`relative transition-all duration-1000 delay-300 ${
                isVisible["hero-image"] 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 translate-x-10"
              }`}
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  el.id = "hero-image";
                  sectionRefs.current["hero-image"] = el;
                }
              }}
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <img
                  src="https://images.unsplash.com/photo-1751355356724-7df0dda28b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzU3NTE1OTMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Modern EV charging station"
                  className="relative w-full h-96 md:h-[500px] object-cover rounded-2xl shadow-2xl transform transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl border border-orange-100 transform transition-all duration-300 hover:scale-110 hover:shadow-3xl">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping absolute"></div>
                      <div className="w-4 h-4 bg-orange-500 rounded-full relative"></div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">12</div>
                      <span className="text-sm text-gray-600 font-medium">
                        {t("home.hero.batteriesAvailable")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section 
        id="features" 
        className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden min-h-[600px]"
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            el.id = "features";
            sectionRefs.current["features"] = el;
          }
        }}
      >
        {isVisible["features"] && (
          <>
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 animate-fade-up">
                <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.35] md:leading-[1.25] py-2 text-orange-600">
                  Tại sao lại chọn FFAST
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t("features.subtitle")}
                </p>
              </div>

              <div className="relative feature-energy-line">
                <span className="energy-wave" aria-hidden="true"></span>
                <span className="energy-node" aria-hidden="true"></span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-6 overflow-visible">
                  {features.map((feature, index) => (
                    <Card 
                      key={index} 
                      className="feature-card feature-card-animate text-center group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-200 bg-white/80 backdrop-blur-sm h-full min-h-[280px]"
                      style={{
                        "--feature-fade-delay": `${index * 0.12}s`,
                        "--feature-pulse-delay": `${index * 0.25}s`
                      } as React.CSSProperties}
                    >
                      <CardHeader>
                        <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl w-20 h-20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-orange-600 transition-colors duration-300">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Map Preview Section */}
      <section 
        id="stations" 
        className="py-20 bg-gradient-to-b from-gray-50 to-white relative min-h-[600px]"
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            el.id = "stations";
            sectionRefs.current["stations"] = el;
          }
        }}
      >
        {isVisible["stations"] && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.35] md:leading-[1.25] py-2 text-orange-600 mb-4">
                {t("stations.title")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("stations.subtitle")}</p>
            </div>

            <Card className="border-2 border-orange-100 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.01] bg-white/90 backdrop-blur-sm animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl h-96 flex items-center justify-center mb-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
                    <MapPreview />
                  </div>
                </div>
                <div className="flex justify-center mb-6">
                  <Button
                    onClick={handleFineNearestStation}
                    disabled={isButtonDisabled}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 px-6 py-3 rounded-full"
                  >
                    {t("home.hero.findStation")}
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: t("stations.downtownHub"), batteries: "12", color: "orange", status: "available" },
                    { name: t("stations.mallStation"), batteries: "8", color: "orange", status: "available" },
                    { name: t("stations.airportTerminal"), batteries: null, color: "yellow", status: "maintenance" },
                  ].map((station, index) => (
                    <div 
                      key={index}
                      className="text-center p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 hover:from-orange-50 hover:to-orange-100 border-2 border-transparent hover:border-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group animate-fade-up"
                      style={{ animationDelay: `${0.3 + index * 0.15}s` }}
                    >
                      <div className="relative inline-block mb-3">
                        <CheckCircle className={`w-10 h-10 text-${station.color}-500 mx-auto group-hover:scale-110 transition-transform duration-300`} />
                        <div className={`absolute inset-0 w-10 h-10 text-${station.color}-500 rounded-full animate-ping opacity-20`}></div>
                      </div>
                      <h4 className="text-gray-900 mb-2 font-bold text-lg group-hover:text-orange-600 transition-colors">
                        {station.name}
                      </h4>
                      <p className="text-sm text-gray-600 font-medium">
                        {station.batteries 
                          ? `${station.batteries} ${t("home.hero.batteriesAvailable")}`
                          : t("stations.maintenanceMode")
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden"
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            el.id = "pricing";
            sectionRefs.current["pricing"] = el;
          }
        }}
      >
        {isVisible["pricing"] && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.35] md:leading-[1.25] py-2 text-orange-600 mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t("pricing.subtitle")}
              </p>
            </div>
            <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
              <PricingSection />
            </div>
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section 
        className="py-20 bg-gradient-to-b from-white via-orange-50/30 to-white relative overflow-hidden min-h-[600px]"
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            el.id = "testimonials";
            sectionRefs.current["testimonials"] = el;
          }
        }}
      >
        {isVisible["testimonials"] && (
          <>
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 animate-fade-up">
                <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.35] md:leading-[1.25] py-2 text-orange-600 mb-4">
                  {t("testimonials.title")}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  {t("testimonials.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card 
                    key={index}
                    className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-200 bg-white/90 backdrop-blur-sm animate-fade-up"
                    style={{ animationDelay: `${index * 180}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300"
                            style={{ transitionDelay: `${i * 50}ms` }}
                          />
                        ))}
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-orange-600 transition-colors">
                        {testimonial.name}
                      </CardTitle>
                      <CardDescription className="text-base font-medium">
                        {testimonial.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed italic text-lg group-hover:text-gray-800 transition-colors">
                        "{testimonial.comment}"
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer 
        id="contact" 
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-16 relative overflow-hidden min-h-[400px]"
        ref={(el: HTMLElement | null) => {
          if (el) {
            el.id = "contact";
            sectionRefs.current["contact"] = el as HTMLDivElement;
          }
        }}
      >
        {isVisible["contact"] && (
          <>
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="animate-fade-up">
                  <div className="flex items-center mb-4 group">
                    <div
                      className="rounded-full border border-white/50 shadow-xl mr-3 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 overflow-hidden"
                      style={{ width: "4.25rem", height: "4.25rem" }}
                    >
                      <img
                        src="src/assets/logoEV2.png "
                        alt="FPTFAST Logo"
                        className="w-full h-full"
                        style={{ objectFit: "contain", imageRendering: "auto" }}
                      />
                    </div>
                    <span className="text-3xl font-bold text-white group-hover:text-yellow-200 transition-colors">
                      F P T F A S T
                    </span>
                  </div>
                  <p className="text-orange-50 mb-4 leading-relaxed">{t("footer.description")}</p>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
                  <h4 className="text-xl font-bold mb-6 text-yellow-200">{t("footer.services")}</h4>
                  <ul className="space-y-3 text-orange-50">
                    {[
                      t("footer.batterySwap"),
                      t("footer.findStations"),
                      t("footer.subscriptionPlans"),
                      t("footer.enterpriseSolutions"),
                    ].map((item, index) => (
                      <li key={index}>
                        <a 
                          href="#" 
                          className="hover:text-yellow-200 transition-colors duration-300 flex items-center group"
                        >
                          <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          <span className="group-hover:translate-x-2 transition-transform duration-300">{item}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
                  <h4 className="text-xl font-bold mb-6 text-yellow-200">{t("footer.support")}</h4>
                  <ul className="space-y-3 text-orange-50">
                    {[
                      t("footer.helpCenter"),
                      t("footer.faqs"),
                      t("footer.contactSupport"),
                      t("footer.roadsideAssistance"),
                    ].map((item, index) => (
                      <li key={index}>
                        <a 
                          href="#" 
                          className="hover:text-yellow-200 transition-colors duration-300 flex items-center group"
                        >
                          <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          <span className="group-hover:translate-x-2 transition-transform duration-300">{item}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="animate-fade-up" style={{ animationDelay: "0.45s" }}>
                  <h4 className="text-xl font-bold mb-6 text-yellow-200">{t("footer.contact")}</h4>
                  <div className="space-y-4 text-orange-50">
                    <div className="flex items-center group hover:text-yellow-200 transition-colors duration-300">
                      <div className="p-2 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="font-medium">038626028</span>
                    </div>
                    <div className="flex items-center group hover:text-yellow-200 transition-colors duration-300">
                      <div className="p-2 bg-white/20 rounded-lg mr-3 group-hover:bg-white/30 transition-colors">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="font-medium">FPTFAST@fpt.edu.vn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
