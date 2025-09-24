import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./custom/image-with-fallback";
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
} from "lucide-react";

interface HomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function Homepage({ onGetStarted, onLogin }: HomepageProps) {
  const { t } = useLanguage();
  const features = [
    {
      icon: <Clock className="w-8 h-8 text-green-500" />,
      title: t("features.ultraFast.title"),
      description: t("features.ultraFast.desc"),
    },
    {
      icon: <Battery className="w-8 h-8 text-blue-500" />,
      title: t("features.alwaysCharged.title"),
      description: t("features.alwaysCharged.desc"),
    },
    {
      icon: <MapPin className="w-8 h-8 text-purple-500" />,
      title: t("features.nationwide.title"),
      description: t("features.nationwide.desc"),
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: t("features.safeReliable.title"),
      description: t("features.safeReliable.desc"),
    },
  ];

  const pricingPlans = [
    {
      name: t("pricing.payPerSwap"),
      price: "$25",
      period: t("pricing.perSwap"),
      description: t("pricing.payPerSwap.desc"),
      features: [
        t("pricing.payPerSwap.feature1"),
        t("pricing.payPerSwap.feature2"),
        t("pricing.payPerSwap.feature3"),
        t("pricing.payPerSwap.feature4"),
      ],
      popular: false,
    },
    {
      name: t("pricing.monthlyUnlimited"),
      price: "$149",
      period: t("pricing.perMonth"),
      description: t("pricing.monthlyUnlimited.desc"),
      features: [
        t("pricing.monthlyUnlimited.feature1"),
        t("pricing.monthlyUnlimited.feature2"),
        t("pricing.monthlyUnlimited.feature3"),
        t("pricing.monthlyUnlimited.feature4"),
      ],
      popular: true,
    },
    {
      name: t("pricing.enterprise"),
      price: "Custom",
      period: t("pricing.customPricing"),
      description: t("pricing.enterprise.desc"),
      features: [
        t("pricing.enterprise.feature1"),
        t("pricing.enterprise.feature2"),
        t("pricing.enterprise.feature3"),
        t("pricing.enterprise.feature4"),
      ],
      popular: false,
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
        {/* Thay thế logo cũ bằng logo mới */}
        <img src="src/assets/logoEV.png" alt="FPTFAST Logo" className="w-18 h-16 mr-3" />
        <span className="text-xl text-gray-900"></span>
      </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                {t("nav.features")}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                {t("nav.pricing")}
              </a>
              <a href="#stations" className="text-gray-600 hover:text-gray-900">
                {t("nav.stations")}
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">
                {t("nav.contact")}
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button variant="ghost" onClick={onLogin}>
                {t("nav.signIn")}
              </Button>
              <Button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {t("nav.getStarted")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800">
                {t("home.hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl text-gray-900 mb-6">
                {t("home.hero.title")}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {t("home.hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {t("home.hero.findStation")}
                  <MapPin className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  {t("home.hero.watchDemo")}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-2xl text-gray-900">
                    {t("home.hero.avgSwapTime")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("home.hero.avgSwapTimeLabel")}
                  </div>
                </div>
                <div>
                  <div className="text-2xl text-gray-900">
                    {t("home.hero.availability")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t("home.hero.availabilityLabel")}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1751355356724-7df0dda28b2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzU3NTE1OTMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Modern EV charging station"
                className="w-full h-96 object-cover rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
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
      <section className="py-16 bg-white">
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
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
      <section id="stations" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
              {t("stations.title")}
            </h2>
            <p className="text-xl text-gray-600">{t("stations.subtitle")}</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="bg-green-50 rounded-lg h-96 flex items-center justify-center mb-6">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-900 mb-2">
                    {t("stations.mapTitle")}
                  </h3>
                  <p className="text-gray-600 mb-4">{t("stations.mapDesc")}</p>
                  <Button onClick={onGetStarted}>
                    {t("stations.viewFullMap")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="text-gray-900 mb-1">
                    {t("stations.downtownHub")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    12 {t("home.hero.batteriesAvailable")}
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
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
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
              {t("pricing.title")}
            </h2>
            <p className="text-xl text-gray-600">{t("pricing.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "border-green-500 border-2" : ""
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">
                      {t("pricing.mostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular
                        ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        : ""
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={onGetStarted}
                  >
                    {t("pricing.getStarted")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-white text-green-600 hover:bg-gray-100"
            >
              {t("cta.signUpNow")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600"
            >
              {t("cta.contactSales")}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mr-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl">EV Battery Swap Station
                </span>
              </div>
              <p className="text-gray-400 mb-4">{t("footer.description")}</p>
              {/* <div className="flex space-x-4">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div> */}
            </div>

            <div>
              <h4 className="text-lg mb-4">{t("footer.services")}</h4>
              <ul className="space-y-2 text-gray-400">
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
              <ul className="space-y-2 text-gray-400">
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
              <div className="space-y-2 text-gray-400">
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

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">{t("footer.copyright")}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                {t("footer.privacyPolicy")}
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                {t("footer.termsOfService")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
