import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useGeoLocation from "./map/useGeoLocation";
import MapView from "./map/MapView";
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
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
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

  const handleFineNearestStation = () => {
    if (location.loaded && !location.error) {
      const userLocation = {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
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
    <div className="h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-orange-500 border-b border-gray-200 fixed top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Thay thế logo cũ bằng logo mới */}
              <img
                src="src/assets/logoEV2.png "
                alt="FPTFAST Logo"
                className="w-18 h-16 mr-3"
              />
              <span className="text-3xl font-bold text-white">
                F P T F A S T
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.features")}
              </a>
              <a
                href="#pricing"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.pricing")}
              </a>
              <a
                href="#stations"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.stations")}
              </a>
              <a
                href="#contact"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.contact")}
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <LanguageSwitcher />
                  <Button variant="outline" onClick={() => navigate("/login")}>
                    {t("nav.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-black text-white hover:bg-gray-800 flex items-center space-x-2"
                  >
                    {t("nav.getStarted")}
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-auto justify-start text-white hover:bg-orange-600 hover:text-white px-3"
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
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
                      onClick={() => handleNavigateToDashboard("profile")}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToDashboard("support")}
                    >
                      <PhoneCall className="mr-2 h-4 w-4" />
                      <span>Hỗ trợ</span>
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
      <section className="bg-gradient-to-br from-orange-100 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-orange-100 text-orange-800">
                {t("home.hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl text-orange-900 mb-6">
                {t("home.hero.title")}
              </h1>
              <p className="text-xl text-orange-800 mb-8">
                {t("home.hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={handleFineNearestStation}
                  disabled={isButtonDisabled}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {t("home.hero.findStation")}
                  <MapPin className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleNavigateToDashboard("map")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {"Đặt lịch"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-2xl text-orange-900">
                    {t("home.hero.avgSwapTime")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("home.hero.avgSwapTimeLabel")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl text-orange-900">
                    {t("home.hero.availability")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("home.hero.availabilityLabel")}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1751355356724-7df0dda28b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzU3NTE1OTMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern EV charging station"
                className="w-full h-96 object-cover rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    12 {t("home.hero.batteriesAvailable")}
                  </span>
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
      <section id="features" className="py-15 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
              {t("features.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section id="stations" className="py-15 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
              {t("stations.title")}
            </h2>
            <p className="text-xl text-gray-600">{t("stations.subtitle")}</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="bg-orange-50 rounded-lg h-96 flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapView />

                  <Button
                    onClick={handleFineNearestStation}
                    disabled={isButtonDisabled}
                  >
                    {t("stations.viewFullMap")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h4 className="text-gray-900 mb-1">
                    {t("stations.downtownHub")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    12 {t("home.hero.batteriesAvailable")}
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <h4 className="text-gray-900 mb-1">
                    {t("stations.mallStation")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    8 {t("home.hero.batteriesAvailable")}
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <h4 className="text-gray-900 mb-1">
                    {t("stations.airportTerminal")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t("stations.maintenanceMode")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection></PricingSection>

      {/* Testimonials Section */}
      <section className="py-15 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
              {t("testimonials.title")}
            </h2>
            <p className="text-xl text-gray-600">
              {t("testimonials.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <CardTitle>{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="">
                  <img
                    src="src/assets/logoEV2.png "
                    alt="FPTFAST Logo"
                    className="w-18 h-16 mr-3"
                  />
                </div>
                <span className="text-3xl font-bold text-white">
                  F P T F A S T
                </span>
              </div>
              <p className="text-white-400 mb-4">{t("footer.description")}</p>
              {/* <div className="flex space-x-4">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div> */}
            </div>

            <div>
              <h4 className="text-lg mb-4">{t("footer.services")}</h4>
              <ul className="space-y-2 text-white-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.batterySwap")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.findStations")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.subscriptionPlans")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.enterpriseSolutions")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg mb-4">{t("footer.support")}</h4>
              <ul className="space-y-2 text-white-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.helpCenter")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.faqs")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.contactSupport")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {t("footer.roadsideAssistance")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg mb-4">{t("footer.contact")}</h4>
              <div className="space-y-2 text-white-400">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>038626028</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>FPTFAST@fpt.edu.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white">{t("footer.copyright")}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-white-400 hover:text-white">
                {t("footer.privacyPolicy")}
              </a>
              <a href="#" className="text-white-400 hover:text-white">
                {t("footer.termsOfService")}
              </a>
            </div>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
