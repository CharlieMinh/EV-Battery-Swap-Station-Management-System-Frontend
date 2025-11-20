import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Edit,
  Car,
  Delete,
  Check,
  CheckCircle,
  XCircle,
  Loader2,
  Landmark,
  CreditCard,
  Search,
  Plus,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Swal from "sweetalert2";
import useGeoLocation from "../map/useGeoLocation";
import { fetchStations, Station } from "../../services/admin/stationService";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  SubscriptionPlanRequest,
  updateSubscriptionPlan,
} from "@/services/admin/subscriptionPlans";
import { is } from "date-fns/locale";

// --- Logic (Giữ nguyên) ---

interface Vehicle {
  id: string;
  compatibleBatteryModelId: string;
  vin: string;
  plate: string;
  brand: string;
  vehicleModelFullName?: string;
  compatibleBatteryModelName?: string;
  photoUrl?: string;
}
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number | null; // Sửa: Cho phép null
  features?: string[]; // (Cái này có vẻ không được dùng, nhưng giữ nguyên)
  benefits: string; // 👈 Thêm benefits (dựa trên file PricingSection)
  batteryModel: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface Payment {
  paymentId: string;
  userSubscriptionId: string;
  paymentUrl: string;
  amount: number;
  planName: string;
  planDescription?: string;
  maxSwapsPerMonth: number;
  message: string;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const response = await axios.get("/api/v1/auth/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export function SubscriptionPlansPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Bộ lọc client-side
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [battery, setBattery] = useState<string>("ALL");

  // Phân trang client-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const navigate = useNavigate();

  // Thêm states cho việc tìm trạm gần nhất
  const location = useGeoLocation();
  const [stations, setStations] = useState<Station[] | null>(null);
  const [isWaitingForLocation, setIsWaitingForLocation] = useState(false);

  // ===== States cho role check =====
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(handler);
  }, [search]);

  // ===== Fetch current user role =====
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setUserLoading(false);
    };
    fetchUser();
  }, []);

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  const fetchPlans = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5194/api/v1/subscription-plans",
        { withCredentials: true }
      );
      const sortedData = (res.data as SubscriptionPlan[])
        .filter((p) => {
          // Admin có thể xem tất cả, Driver chỉ xem gói đang hoạt động
          const userIsAdmin = currentUser?.role?.toUpperCase() === "ADMIN";
          if (userIsAdmin) {
            return p.monthlyPrice > 0;
          } else {
            return p.monthlyPrice > 0 && p.isActive === true;
          }
        })
        .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
      setPlans(sortedData);
    } catch (error) {
      toast.error("Không thể lấy gói đăng ký hiện tại, vui lòng thử lại sau");
    }
  };

  const handlePayWithVNPay = () => {
    if (payment && payment.paymentUrl) {
      window.location.href = decodeURIComponent(payment.paymentUrl);
    } else {
      toast.error("Không tìm thấy link thanh toán VNPay.");
    }
  };

  const handlePayWithCash = async () => {
    if (!payment || !payment.paymentId) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:5194/api/v1/payments/${payment.paymentId}/select-cash`,
        {},
        { withCredentials: true }
      );

      setIsPaymentModalOpen(false);

      const result = await Swal.fire({
        icon: "success",
        title: "Đơn hàng đã được tạo",
        html: "Hãy đến trạm gần nhất để thanh toán.",
        showCancelButton: true,
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Tìm trạm gần nhất",
        cancelButtonText: "Để sau",
        allowOutsideClick: false,
      });

      if (result.isConfirmed) {
        setIsWaitingForLocation(true);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Không thể chọn phương thức tiền mặt.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePendingSubscription = async (plan: SubscriptionPlan) => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/subscriptions/create-pending",
        {
          subscriptionPlanId: plan.id,
        },
        { withCredentials: true }
      );

      setPayment(response.data);
      setIsPaymentModalOpen(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể tạo đơn hàng.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== States cho Popup Thêm / Sửa Gói =====
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<SubscriptionPlanRequest>({
    name: "",
    description: "",
    monthlyPrice: 0,
    maxSwapsPerMonth: 0,
    benefits: "",
    refundPolicy: "",
    batteryModelId: "",
  });
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const handleAddStation = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      monthlyPrice: 0,
      maxSwapsPerMonth: 0,
      benefits: "",
      refundPolicy: "",
      batteryModelId: "",
    });
    setFormIsActive(true); // Mặc định gói mới là active
    setIsAddEditModalOpen(true);
  };

  const handleEditPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      maxSwapsPerMonth: plan.maxSwapsPerMonth ?? 0,
      benefits: plan.benefits,
      refundPolicy: plan.benefits, // tạm dùng benefits làm refundPolicy nếu chưa có
      batteryModelId: plan.batteryModel.id,
    });
    // Đảm bảo isActive là boolean, mặc định true nếu undefined/null
    const isActiveValue = plan.isActive === true || plan.isActive === undefined ? true : false;
    console.log("Editing plan - isActive:", plan.isActive, "Setting to:", isActiveValue);
    setFormIsActive(isActiveValue);
    setIsAddEditModalOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Xóa gói",
      text: "Bạn có chắc chắn muốn xóa gói này? Hành động này không thể hoàn tác.",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await deleteSubscriptionPlan(planId);
        toast.success("Gói đã được xóa thành công");
        setPlans(plans.filter((p) => p.id !== planId));
      } catch (error: any) {
        const msg = error.response?.data?.message || "Không thể xóa gói.";
        toast.error(msg);
      }
    }
  };

  useEffect(() => {
    const getSubscriptionPlans = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5194/api/v1/subscription-plans",
          {
            withCredentials: true,
          }
        );
        const sortedData = (res.data as SubscriptionPlan[])
          .filter((p) => {
            // Admin có thể xem tất cả, Driver chỉ xem gói đang hoạt động
            const userIsAdmin = currentUser?.role?.toUpperCase() === "ADMIN";
            if (userIsAdmin) {
              return p.monthlyPrice > 0;
            } else {
              return p.monthlyPrice > 0 && p.isActive === true;
            }
          })
          .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        setPlans(sortedData);
      } catch (error) {
        toast.error("Không thể lấy gói đăng ký hiện tại, vui lòng thử lại sau");
      }
    };
    getSubscriptionPlans();
  }, [currentUser]);

  useEffect(() => {
    const getAllStations = async () => {
      try {
        const response = await fetchStations(1, 20);
        setStations(response.items);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    getAllStations();
  }, []);

  useEffect(() => {
    if (
      isWaitingForLocation &&
      location.loaded &&
      !location.error &&
      location.coordinates
    ) {
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
      Swal.fire({
        icon: "error",
        title: "Lỗi xác định vị trí",
        text: `${location.error.message}. Vui lòng kiểm tra cài đặt vị trí của trình duyệt.`,
        confirmButtonColor: "#f97316",
      });
    }
  }, [
    isWaitingForLocation,
    location.loaded,
    location.error,
    location.coordinates,
    navigate,
    stations,
  ]);

  const batteryOptions = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((p) => {
      if (p.batteryModel?.name) set.add(p.batteryModel.name);
    });
    return Array.from(set).sort();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    let list = [...plans];
    if (debouncedSearch) {
      list = list.filter((p) => p.name.toLowerCase().includes(debouncedSearch));
    }
    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) list = list.filter((p) => p.monthlyPrice >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) list = list.filter((p) => p.monthlyPrice <= max);
    }
    if (battery && battery !== "ALL") {
      list = list.filter((p) => p.batteryModel?.name === battery);
    }
    list.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    return list;
  }, [plans, debouncedSearch, minPrice, maxPrice, battery]);

  const total = filteredPlans.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, maxPage);
  const pagedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubscription = () => {
    if (selectedPlan) {
      setIsConfirmDialogOpen(false);
      handleCreatePendingSubscription(selectedPlan);
    }
  };

  if (userLoading) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== Header Section ===== */}
        <div className="text-center mb-16 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              {isAdmin ? t("driver.subscription.manageTitle") : t("driver.subscription.listTitle")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isAdmin
                ? t("driver.subscription.manageSubtitle")
                : t("driver.subscription.subtitle")}
            </p>
          </div>
          {isAdmin && (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-5 rounded-lg shadow-md flex items-center gap-2 ml-6"
              onClick={handleAddStation}
            >
              <Plus className="w-5 h-5" />
              {t("driver.subscription.addStationButton")}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <Label className="mb-1 block">{t("driver.subscription.searchLabel")}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t("driver.subscription.listSearchPlaceholder")}
                  className="pl-8"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">{t("driver.subscription.minPriceLabel")}</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("driver.subscription.minPricePlaceholder")}
                  value={
                    minPrice ? Number(minPrice).toLocaleString("vi-VN") : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMinPrice(value);
                    setPage(1);
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  đ
                </span>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">{t("driver.subscription.maxPriceLabel")}</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("driver.subscription.maxPricePlaceholder")}
                  value={
                    maxPrice ? Number(maxPrice).toLocaleString("vi-VN") : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMaxPrice(value);
                    setPage(1);
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  đ
                </span>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">{t("driver.subscription.batteryTypeLabel")}</Label>
              <Select
                value={battery}
                onValueChange={(v) => {
                  setBattery(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("driver.subscription.allOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("driver.subscription.allOption")}</SelectItem>
                  {batteryOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pagedPlans.map((plan, index) => {
            const features = (plan.benefits || "")
              .split("\n")
              .filter((f) => f.trim() !== "" && f.trim() !== "✓");

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 bg-white"`}
              >
                {/* Admin Badge */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                    ADMIN
                  </div>
                )}

                <CardHeader className="text-center pt-10 pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 h-16">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-orange-600 tracking-tight">
                      {plan.monthlyPrice.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-lg font-medium text-gray-500 ml-1">
                      {" "}
                      VND/tháng
                    </span>
                  </div>
                  <CardDescription className="pt-4 text-base text-gray-600 h-24 overflow-hidden">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col justify-between p-6 pt-0">
                  <ul className="my-4 space-y-3 pt-6 border-t">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-orange-500 mr-2.5 flex-shrink-0" />
                      <span className="text-gray-600">
                        {plan.maxSwapsPerMonth
                          ? `${plan.maxSwapsPerMonth} ${t("driver.subscription.listSwapsPerMonth")}`
                          : t("driver.subscription.unlimited")}
                      </span>
                    </li>
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-2.5 flex-shrink-0" />
                        <span className="text-gray-600">
                          {feature.replace("✓", "").trim()}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Buttons - khác nhau dựa trên role */}
                  {!isAdmin ? (
                    <Button
                      className={`w-full py-5 text-base font-semibold rounded-lg shadow-md transition-all duration-300 bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50"`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {t("driver.subscription.selectPlan")}
                    </Button>
                  ) : (
                    <div className="space-y-2 pt-4">
                      <Button
                        className="w-full py-4 text-base font-semibold rounded-lg shadow-md transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleEditPlan(plan.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full py-4 text-base font-semibold rounded-lg shadow-md"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Delete className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t("driver.subscription.totalPlans")} {total.toLocaleString("vi-VN")} {t("driver.subscription.totalPlansUnit")}
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm">{t("driver.subscription.pageSizeLabel")}</Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 9, 12, 18].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  {t("driver.subscription.pagination.prev")}
                </Button>
                <span className="text-sm">
                  {t("driver.subscription.pagination.page")} {currentPage}/{maxPage}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  disabled={currentPage >= maxPage}
                >
                  {t("driver.subscription.pagination.next")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {filteredPlans.length === 0 && (
          <p className="text-center text-gray-500 text-lg py-12">
            {t("driver.subscription.emptyNoPlans")}
          </p>
        )}

        {/* Dialog Xác Nhận Đăng Ký Gói */}
        {selectedPlan && (
          <Dialog
            open={isConfirmDialogOpen}
            onOpenChange={setIsConfirmDialogOpen}
          >
            <DialogContent className="max-w-lg rounded-xl">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {t("driver.subscription.confirmTitle")}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 pt-4">
                  {t("driver.subscription.confirmMessage")}{" "}
                  <span className="font-bold text-orange-600">
                    {selectedPlan.name}
                  </span>
                  ?
                </DialogDescription>
              </DialogHeader>

              <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {t("driver.subscription.importantNote")}
                </p>
                <p className="text-sm text-blue-800">
                  {t("driver.subscription.applicableBatteryIntro")}{" "}
                  <span className="font-bold">
                    {selectedPlan.batteryModel.name}
                  </span>
                  .
                  <br />
                  {t("driver.subscription.applicableBatteryEnsure")}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  disabled={isLoading}
                >
                  {t("driver.cancel")}
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6"
                  onClick={handleConfirmSubscription}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("driver.subscription.confirmButton")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog Thanh Toán */}
        {payment && (
          <Dialog
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
          >
            <DialogContent className="max-w-md rounded-xl">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {t("driver.subscription.payment.title")}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 pt-2">
                  {t("driver.subscription.payment.description")}
                </DialogDescription>
              </DialogHeader>

              <div className="my-6 space-y-3 border-t border-b py-6">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">{t("driver.subscription.payment.planLabel")}</span>
                  <span className="font-medium text-gray-800 text-right">
                    {payment.planName}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-lg font-bold">
                  <span>{t("driver.subscription.payment.totalLabel")}</span>
                  <span className="text-3xl font-extrabold text-orange-600">
                    {payment.amount.toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-5 text-base rounded-lg shadow-md"
                  onClick={handlePayWithVNPay}
                  disabled={isLoading}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t("driver.subscription.payment.payWithVNPay")}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold py-5 text-base rounded-lg"
                  onClick={handlePayWithCash}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Landmark className="mr-2 h-5 w-5" />
                  )}
                  {t("driver.subscription.payment.payWithCashAtStation")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog Thêm / Sửa Gói hoặc Trạm */}
        <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
          <DialogContent className="max-w-2xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {editingPlan
                  ? "Chỉnh sửa gói thuê pin"
                  : "Thêm gói thuê pin mới"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Nhập thông tin chi tiết về gói thuê pin. Các trường có dấu * là
                bắt buộc.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Tên gói *</Label>
                <Input
                  placeholder="Nhập tên gói..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Mô tả *</Label>
                <Input
                  placeholder="Nhập mô tả..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giá thuê hàng tháng *</Label>
                  <Input
                    type="number"
                    placeholder="Nhập giá VND"
                    value={formData.monthlyPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Số lượt đổi tối đa / tháng</Label>
                  <Input
                    type="number"
                    placeholder="0 = không giới hạn"
                    value={formData.maxSwapsPerMonth ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxSwapsPerMonth: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Ưu đãi / Lợi ích</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows={3}
                  placeholder="Nhập mỗi ưu đãi 1 dòng..."
                  value={formData.benefits}
                  onChange={(e) =>
                    setFormData({ ...formData, benefits: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Chính sách hoàn tiền</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2"
                  rows={2}
                  placeholder="Nhập chính sách hoàn tiền (nếu có)..."
                  value={formData.refundPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, refundPolicy: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Loại pin *</Label>
                <Select
                  value={formData.batteryModelId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, batteryModelId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại pin" />
                  </SelectTrigger>
                  <SelectContent>
                    {batteryOptions.map((b) => {
                      const plan = plans.find(
                        (p) => p.batteryModel?.name === b
                      );
                      return (
                        <SelectItem
                          key={plan?.batteryModel.id}
                          value={plan?.batteryModel.id ?? ""}
                        >
                          {b}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Chỉ hiển thị select isActive khi đang chỉnh sửa (không phải tạo mới) */}
              {editingPlan && (
                <div>
                  <Label>Trạng thái *</Label>
                  <Select
                    value={formIsActive === true ? "active" : "inactive"}
                    onValueChange={(value) => {
                      const newValue = value === "active";
                      console.log("Select changed - value:", value, "formIsActive:", newValue);
                      setFormIsActive(newValue);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái">
                        {formIsActive === true ? "Hoạt động" : "Ngừng hoạt động"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setIsAddEditModalOpen(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    setIsLoading(true);

                    if (editingPlan) {
                      // Sử dụng giá trị isActive từ form state
                      const updateData = {
                        ...formData,
                        isActive: Boolean(formIsActive),
                      };
                      
                      console.log("Updating plan with data:", updateData);
                      console.log("isActive value:", updateData.isActive, typeof updateData.isActive);
                      
                      // dùng API service update
                      await updateSubscriptionPlan(editingPlan.id, updateData);
                      toast.success("Cập nhật gói thuê pin thành công!");
                    } else {
                      // dùng API service create
                      await createSubscriptionPlan(formData);
                      toast.success("Thêm gói thuê pin mới thành công!");
                    }

                    setIsAddEditModalOpen(false);

                    // gọi lại fetchPlans để cập nhật danh sách
                    fetchPlans();
                  } catch (err: any) {
                    toast.error(
                      err.response?.data?.message ||
                      "Có lỗi xảy ra, vui lòng thử lại."
                    );
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPlan ? "Lưu thay đổi" : "Thêm mới"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
