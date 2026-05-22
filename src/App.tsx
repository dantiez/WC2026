/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trophy, Flame, Search, ShoppingBag, Landmark, HandCoins, 
  CreditCard, Wallet, Users, Package, Coins, CheckCircle2, 
  ArrowRight, ChevronRight, Plus, Trash2, Edit, LogOut, 
  ExternalLink, FileSpreadsheet, Smartphone, MapPin, 
  Clipboard, Check, RotateCcw, Sparkles, Menu, X, ShieldAlert, 
  Clock, Shirt, BadgeDollarSign, HelpCircle, Eye, EyeOff,
  Printer
} from "lucide-react";
import * as XLSX from "xlsx";

import HeroBanner from "./components/user/HeroBanner";
import JerseyCard from "./components/user/JerseyCard";
import PaymentSelector from "./components/user/PaymentSelector";
import StatsCard from "./components/admin/StatsCard";
import JerseyViewer from "./components/three/JerseyViewer";
import { Product, Order, OrderItem, Payment, OrderStatus, PaymentMethod, PaymentStatus, JerseyType, JerseySize, TeamPlayer } from "./types";

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<
    "home" | "jerseys" | "customize" | "checkout" | "track" | "team-roster" | "admin-login" | "admin-dashboard" | "admin-orders" | "admin-products" | "admin-customers"
  >("home");

  // Core Data State loaded from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);

  // User Customize State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nickname, setNickname] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [selectedSize, setSelectedSize] = useState<JerseySize>("M");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [jerseyColor, setJerseyColor] = useState("#1e3a8a"); // primary Color
  const [accentColor, setAccentColor] = useState("#ffd700"); // details stripe color

  // Team Customizer States
  const [customizeMode, setCustomizeMode] = useState<"individual" | "team">("individual");
  const [teamRoster, setTeamRoster] = useState<TeamPlayer[]>([
    { id: "pl-1", name: "TIEN LINH", number: 22, size: "L" },
    { id: "pl-2", name: "QUANG HAI", number: 19, size: "M" },
    { id: "pl-3", name: "HOANG DUC", number: 14, size: "XL" },
    { id: "pl-4", name: "TUAN HAI", number: 10, size: "M" },
    { id: "pl-5", name: "DUY MANH", number: 2, size: "XXL" }
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(10);
  const [newPlayerSize, setNewPlayerSize] = useState<JerseySize>("M");

  // User Checkout Info Form Status
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Active Placement Order & Code tracking
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingResults, setTrackingResults] = useState<Order[]>([]);
  const [searchedTrack, setSearchedTrack] = useState(false);
  const [trackingLoader, setTrackingLoader] = useState(false);

  // Search/Filters lists for Public & Admin
  const [searchQuery, setSearchQuery] = useState("");
  const [jerseyTypeFilter, setJerseyTypeFilter] = useState("all");

  // Mobile navigation helper
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form states
  const [prodFormName, setProdFormName] = useState("");
  const [prodFormTeam, setProdFormTeam] = useState("");
  const [prodFormType, setProdFormType] = useState<JerseyType>("home");
  const [prodFormPrice, setProdFormPrice] = useState("");
  const [prodFormStock, setProdFormStock] = useState("");
  const [prodFormImage, setProdFormImage] = useState("");

  // Search / filters for Admin Orders list
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [adminOrderFilterStatus, setAdminOrderFilterStatus] = useState("all");
  const [adminOrderFilterPayment, setAdminOrderFilterPayment] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatusValue, setBulkStatusValue] = useState("");

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [expandedCustomerPhone, setExpandedCustomerPhone] = useState<string | null>(null);

  // Team Printing Roster view states
  const [rosterSearchQuery, setRosterSearchQuery] = useState("");
  const [rosterSearchResults, setRosterSearchResults] = useState<Order[]>([]);
  const [rosterSelectedOrder, setRosterSelectedOrder] = useState<Order | null>(null);
  const [rosterSearchLoader, setRosterSearchLoader] = useState(false);
  const [rosterSubTab, setRosterSubTab] = useState<"draft" | "order">("order");
  const [rosterCheckedItems, setRosterCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [copiedRosterText, setCopiedRosterText] = useState(false);

  // --- Realtime / Periodic Sync ---
  // Periodically re-fetches stats & orders if logged in as admin
  useEffect(() => {
    fetchProducts();
    if (isAdminLoggedIn) {
      fetchAdminStats();
      fetchAdminOrders();
      fetchAdminCustomers();
    }
  }, [isAdminLoggedIn, activeTab]);

  // Handle auto polling order logs for tracking
  useEffect(() => {
    let interval: any;
    if (activeTab === "track" && trackingResults.length > 0) {
      // Poll every 5 seconds to simulate realtime status updates from the database without refreshing!
      interval = setInterval(() => {
        executeTrackingQuery(false); // background fetch
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, trackingResults]);

  // --- API Fetches ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/products?isAdmin=${isAdminLoggedIn ? "true" : "false"}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchAdminOrders = async () => {
    try {
      const response = await fetch(`/api/orders?search=${adminOrderSearch}&status=${adminOrderFilterStatus}&paymentMethod=${adminOrderFilterPayment}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchAdminCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?search=${customerSearch}`);
      if (response.ok) {
        const data = await response.json();
        setAdminCustomers(data);
      }
    } catch (e) {
      console.error("Error fetching customers:", e);
    }
  };

  // Run admin searches when toggles change of key inputs
  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminOrders();
    }
  }, [adminOrderSearch, adminOrderFilterStatus, adminOrderFilterPayment]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminCustomers();
    }
  }, [customerSearch]);


  // Try to redirect on deep customizable clicks
  const handleProductSelectToCustomize = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setSelectedProduct(prod);
      // Auto assign suitable primary colors depending on chosen squad country
      const country = prod.teamCountry.toLowerCase();
      if (country.includes("argentina")) {
        setJerseyColor("#4BA3E3");
        setAccentColor("#FFFFFF");
      } else if (country.includes("brazil")) {
        setJerseyColor("#FDD116");
        setAccentColor("#009C3B");
      } else if (country.includes("france")) {
        setJerseyColor("#07224F");
        setAccentColor("#C61B21");
      } else if (country.includes("germany")) {
        setJerseyColor("#EFEFEF");
        setAccentColor("#111111");
      } else if (country.includes("japan")) {
        setJerseyColor("#002D62");
        setAccentColor("#FFFFFF");
      } else if (country.includes("spain")) {
        setJerseyColor("#C61B21");
        setAccentColor("#FDD116");
      } else if (country.includes("portugal")) {
        setJerseyColor("#8B0000");
        setAccentColor("#008000");
      } else if (country.includes("korea")) {
        setJerseyColor("#C61B21");
        setAccentColor("#000000");
      } else if (country.includes("vietnam")) {
        setJerseyColor("#DA251D");
        setAccentColor("#FFFF00");
      } else {
        setJerseyColor("#1E3A8A");
        setAccentColor("#FFD700");
      }
      
      setActiveTab("customize");
      window.scrollTo(0, 0);
    }
  };

  // --- Excel & Manual Team Roster Handlers ---
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const parsedPlayers: TeamPlayer[] = [];
        // Start from index 1 (skipping header)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          let rawName = String(row[0] || "").trim().toUpperCase();
          let rawNum = Number(row[1]);
          let rawSize = String(row[2] || "M").trim().toUpperCase();
          
          // Basic clean validation
          if (!rawName || rawName === "TÊN IN ÁO" || rawName === "UNDEFINED") continue;
          if (isNaN(rawNum)) rawNum = 10;
          if (!["S", "M", "L", "XL", "XXL", "XXXL"].includes(rawSize)) {
            rawSize = "M";
          }
          
          parsedPlayers.push({
            id: "pl-" + Math.random().toString(36).substr(2, 9),
            name: rawName.toUpperCase().slice(0, 12),
            number: Math.min(99, Math.max(1, rawNum)),
            size: rawSize as JerseySize
          });
        }
        
        if (parsedPlayers.length > 0) {
          setTeamRoster(prev => {
            const newList = [...prev, ...parsedPlayers];
            setActivePlayerIndex(newList.length - parsedPlayers.length); // highlight first new player
            return newList;
          });
          alert(`Đã nhập thành công ${parsedPlayers.length} thành viên vào danh sách từ file Excel!`);
        } else {
          alert("Không tìm thấy hàng thông tin thành viên nào hợp lệ trong file Excel. Vui lòng kiểm tra lại cấu trúc cột: Cột A: Tên in áo, Cột B: Số áo, Cột C: Size.");
        }
      } catch (ex) {
        console.error(ex);
        alert("Có lỗi xảy ra khi đọc tệp Excel. Hãy đảm bảo tệp đúng định dạng mẫu.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset inputs
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      ["Tên in áo", "Số áo", "Kích thước Size"],
      ["CONG PHUONG", 10, "M"],
      ["QUANG HAI", 19, "L"],
      ["TIEN LINH", 22, "XL"],
      ["HOANG DUC", 14, "M"],
      ["VAN TOAN", 9, "S"]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachMau");
    XLSX.writeFile(workbook, "Mau_Danh_Sach_In_Ao_WC2026.xlsx");
  };

  const handleAddPlayerManually = () => {
    const cleanName = newPlayerName.trim().toUpperCase();
    if (!cleanName) {
      alert("Vui lòng nhập Tên in áo.");
      return;
    }

    const duplicate = teamRoster.some(p => p.name === cleanName && p.number === newPlayerNumber);
    if (duplicate) {
      const confirmDup = confirm(`Thành viên ${cleanName} số ${newPlayerNumber} đã tồn tại trong danh sách. Bạn vẫn muốn thêm?`);
      if (!confirmDup) return;
    }

    const newPl: TeamPlayer = {
      id: "pl-" + Math.random().toString(36).substr(2, 9),
      name: cleanName.slice(0, 12),
      number: newPlayerNumber,
      size: newPlayerSize
    };

    setTeamRoster(prev => {
      const nextList = [...prev, newPl];
      setActivePlayerIndex(nextList.length - 1); // point preview to newly added player
      return nextList;
    });
    setNewPlayerName("");
    setNewPlayerNumber(prev => (prev < 99 ? prev + 1 : 1)); // auto auto-increment jersey number
  };

  const handleRemovePlayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting template view trigger
    setTeamRoster(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (activePlayerIndex >= filtered.length) {
        setActivePlayerIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  // Check form inputs before submitting
  const validateOrderForm = () => {
    const errors: { [key: string]: string } = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập Họ tên.";
    
    // VN phone regex
    const phoneClean = phone.trim().replace(/[\s\.\-\(\)]/g, "");
    if (!phoneClean) {
      errors.phone = "Vui lòng nhập Số điện thoại.";
    } else if (!/^(0[35789])[0-9]{8}$/.test(phoneClean)) {
      errors.phone = "Số điện thoại di động không đúng định dạng Việt Nam (10 chữ số).";
    }

    if (!shippingAddress.trim()) errors.shippingAddress = "Vui lòng cung cấp Địa chỉ nhận hàng.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order API
  const handlePlaceOrder = async () => {
    if (!validateOrderForm() || !selectedProduct) return;

    if (customizeMode === "team") {
      if (teamRoster.length === 0) {
        alert("Bảng danh sách thành viên đội đang trống. Vui lòng thêm ít nhất 1 thành viên hoặc tải tệp Excel lên.");
        return;
      }
      if (teamRoster.length < 20) {
        const proceed = confirm(`Danh sách của bạn hiện mới có ${teamRoster.length} thành viên. Để đặt hàng sỉ được Cực Kỳ Ưu Đãi Giảm 15% và thiết kế riêng, bạn nên đặt từ 20 người trở lên. Bạn có chắc chắn muốn tiến hành đặt ngay không?`);
        if (!proceed) return;
      }
    }

    const orderItems = customizeMode === "individual"
      ? [
          {
            productId: selectedProduct.id,
            nickname: nickname.trim().toUpperCase() || "CUSTOMER",
            jerseyNumber: jerseyNumber || 10,
            size: selectedSize,
            colorHex: jerseyColor,
            quantity: selectedQuantity
          }
        ]
      : teamRoster.map(player => ({
          productId: selectedProduct.id,
          nickname: player.name.trim().toUpperCase() || "PLAYER",
          jerseyNumber: player.number || 10,
          size: player.size,
          colorHex: jerseyColor,
          quantity: 1
        }));

    const payload = {
      customerName: fullName.trim(),
      phone: phone.trim(),
      address: shippingAddress.trim(),
      notes: notes.trim() + (customizeMode === "team" ? " [ĐƠN ĐẶT ĐỒNG ĐỘI NHÓM N > 20]" : ""),
      paymentMethod,
      items: orderItems
    };

    try {
      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const data = await resp.json();
        setLatestOrder(data);
        setActiveTab("checkout");
        // Clear customize inputs
        setNickname("");
        setJerseyNumber(10);
        setSelectedQuantity(1);
        window.scrollTo(0,0);
      } else {
        const err = await resp.json();
        alert(err.error || "Gặp lỗi tạo đơn đặt hàng.");
      }
    } catch (e) {
      console.error(e);
      alert("Hệ thống gián đoạn dịch vụ, vui lòng thử lại.");
    }
  };

  // Order Tracking searches
  const executeTrackingQuery = async (showLoader = true) => {
    if (!trackingQuery.trim()) return;
    if (showLoader) setTrackingLoader(true);
    
    try {
      const response = await fetch(`/api/orders/track?query=${encodeURIComponent(trackingQuery.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingResults(data);
        setSearchedTrack(true);
      }
    } catch (e) {
      console.error("Error searching tracker:", e);
    } finally {
      if (showLoader) setTrackingLoader(false);
    }
  };

  // Team Printing Roster Helper Functions
  const handleRosterSearch = async () => {
    if (!rosterSearchQuery.trim()) return;
    setRosterSearchLoader(true);
    setRosterSelectedOrder(null);
    try {
      const response = await fetch(`/api/orders/track?query=${encodeURIComponent(rosterSearchQuery.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setRosterSearchResults(data);
        if (data.length === 1) {
          setRosterSelectedOrder(data[0]);
          setRosterCheckedItems({});
        } else if (data.length === 0) {
          alert("Không tìm thấy đơn hàng nào khớp với mã hoặc số điện thoại này.");
        }
      } else {
        alert("Có lỗi xảy ra khi tra cứu thông tin in ấn.");
      }
    } catch (e) {
      console.error("Error searching roster order:", e);
      alert("Hệ thống gián đoạn dịch vụ tra cứu.");
    } finally {
      setRosterSearchLoader(false);
    }
  };

  const handleExportRosterToExcel = (itemsToExport: any[], orderCodeInfo?: string, customerNameInfo?: string) => {
    if (itemsToExport.length === 0) {
      alert("Không có cầu thủ nào để xuất Excel.");
      return;
    }
    
    const rows = [
      ["STT", "Họ và Tên In Áo", "Số Áo", "Kích Thước Size", "Mẫu Áo Đấu", "Màu Sắc Thiết Kế"],
      ...itemsToExport.map((it, idx) => {
        let nickname = it.nickname || it.name || "PLAYER";
        let num = it.jerseyNumber ?? it.number ?? 10;
        let size = it.size || "M";
        let prodName = it.product?.name || (selectedProduct?.name || "N/A");
        let color = it.colorHex || jerseyColor;
        
        return [
          idx + 1,
          nickname.toUpperCase(),
          num,
          size,
          prodName,
          color
        ];
      })
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachInAn");
    
    const filename = orderCodeInfo 
      ? `Danh_Sach_In_An_${orderCodeInfo}.xlsx` 
      : `Danh_Sach_In_An_Draft_${new Date().toISOString().split("T")[0]}.xlsx`;
      
    XLSX.writeFile(workbook, filename);
  };

  const handleCopyRosterToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRosterText(true);
    setTimeout(() => setCopiedRosterText(false), 2000);
  };

  // Admin login flow
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === "admin@yourshop.com") {
      setIsAdminLoggedIn(true);
      setActiveTab("admin-dashboard");
      setAdminError("");
    } else {
      setAdminError("Email không chính xác hoặc không đủ quyền quản trị viên.");
    }
  };

  // Export orders to Excel
  const handleExportOrders = () => {
    if (orders.length === 0) {
      alert("Không có đơn hàng nào khớp với bộ lọc bộ lọc để xuất Excel.");
      return;
    }

    const flatData = orders.flatMap(order => {
      const items = order.items || [];
      return items.map((item: any) => ({
        "Mã Đơn Hàng": order.orderCode,
        "Ngày Tạo": new Date(order.createdAt).toLocaleDateString("vi-VN"),
        "Tên Người Nhận": order.customerName,
        "Số Điện Thoại": order.phone,
        "Địa Chỉ Giao Hàng": order.address,
        "Đội Tuyển": item.product?.teamCountry || "N/A",
        "Mẫu Áo": item.product?.jerseyType === "home" ? "Sân Nhà" : "Sân Khách",
        "Tên In Hậu": item.nickname || "Không In",
        "Số Áo": item.jerseyNumber,
        "Kích Thước Size": item.size,
        "Màu Sắc 3D": item.colorHex,
        "Số Lượng": item.quantity,
        "Đơn Giá (VND)": item.unitPrice,
        "Thực Thu Tổng (VND)": order.totalAmount,
        "Trạng Thái Đơn Hàng": order.status.toUpperCase(),
        "Hình Thức": order.payment?.method?.toUpperCase() || "COD",
        "Trạng Thái Thanh Toán": order.payment?.status?.toUpperCase() || "PENDING",
        "Ghi Chú Đơn": order.notes || ""
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh Sách Đơn Hàng");
    XLSX.writeFile(workbook, `WC2026_DonHang_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Clipboard copy helper
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Change product active toggles directly from dashboard
  const handleToggleProductActive = async (id: string, current: boolean) => {
    try {
      const resp = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current })
      });
      if (resp.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Remove products completely or soft delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn có tin chắc muốn dùng hoạt động của sản phẩm này?")) return;
    try {
      const resp = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (resp.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open modal config to add or edit product info
  const handleOpenProductForm = (prod: Product | null) => {
    if (prod) {
      setEditingProduct(prod);
      setProdFormName(prod.name);
      setProdFormTeam(prod.teamCountry);
      setProdFormType(prod.jerseyType);
      setProdFormPrice(String(prod.price));
      setProdFormStock(String(prod.stock));
      setProdFormImage(prod.imageUrl);
    } else {
      setEditingProduct(null);
      setProdFormName("");
      setProdFormTeam("");
      setProdFormType("home");
      setProdFormPrice("390000");
      setProdFormStock("50");
      setProdFormImage("");
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName || !prodFormTeam || !prodFormPrice) {
      alert("Vui lòng điền đủ Tên, Đội và Giá bán.");
      return;
    }

    const payload = {
      name: prodFormName,
      teamCountry: prodFormTeam,
      jerseyType: prodFormType,
      price: Number(prodFormPrice),
      stock: Number(prodFormStock),
      imageUrl: prodFormImage || undefined
    };

    try {
      let resp;
      if (editingProduct) {
        resp = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        resp = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (resp.ok) {
        setIsProductModalOpen(false);
        fetchProducts();
      } else {
        alert("Lỗi lưu sản phẩm.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Single order status quick updates
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const resp = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (resp.ok) {
        fetchAdminOrders();
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Single order payment status quick updates
  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      const resp = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      });
      if (resp.ok) {
        fetchAdminOrders();
        fetchAdminStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk action update
  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0 || !bulkStatusValue) return;

    try {
      const resp = await fetch("/api/orders/bulk-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          status: bulkStatusValue
        })
      });

      if (resp.ok) {
        fetchAdminOrders();
        fetchAdminStats();
        setSelectedOrderIds([]);
        setBulkStatusValue("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Interactive Payment simulate helper for demonstration!
  const simulatePaymentSuccess = async (orderId: string) => {
    try {
      const response = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentStatus: "paid" })
      });
      if (response.ok) {
        const data = await response.json();
        // Update local checkout layout order state
        setLatestOrder(data.order);
        alert("Thanh toán thành công! Hệ thống mô phỏng MoMo/VNPay đã nhận được cổng thông tin IPN và cập nhật đơn hàng thành [Đã thanh toán]");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle single checkboxes
  const handleToggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(item => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };


  // Filtering lists of products for public selection
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.teamCountry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = jerseyTypeFilter === "all" || p.jerseyType === jerseyTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#07070b] text-[#F8F8FF] font-sans antialiased flex flex-col justify-between">
      {/* HEADER NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#1e1e2d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => { setActiveTab("home"); window.scrollTo(0,0); }} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="bg-yellow-500 text-black p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-sm font-black text-yellow-400 tracking-widest block font-display leading-none">WORLD CUP 2026</span>
              <span className="text-xs uppercase font-extrabold text-[#F8F8FF] block tracking-wide">JERSEY CUSTOMIZER</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab("home")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "home" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-gray-400"
              }`}
            >
              Trang Chủ
            </button>
            <button
              id="nav-tab-jerseys"
              onClick={() => setActiveTab("jerseys")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "jerseys" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-gray-400"
              }`}
            >
              Chọn Áo Đấu
            </button>
            <button
              id="nav-tab-track"
              onClick={() => setActiveTab("track")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "track" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-gray-400"
              }`}
            >
              Tra Cứu Đơn
            </button>
            <button
              id="nav-tab-team-roster"
              onClick={() => setActiveTab("team-roster")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "team-roster" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-gray-400"
              }`}
            >
              Danh Sách In Ấn
            </button>
            
            <div className="w-[1px] h-6 bg-[#1e1e2d]" />

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  id="nav-tab-dashboard"
                  onClick={() => setActiveTab("admin-dashboard")}
                  className={`text-xs px-3.5 py-1.5 font-black uppercase rounded-lg border flex items-center gap-1.5 transition-all ${
                    activeTab.startsWith("admin-")
                      ? "bg-yellow-500 text-black border-yellow-500"
                      : "bg-[#111118] text-yellow-400 border-yellow-500/30 hover:bg-black/40"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Quản Trị Viên
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setActiveTab("home");
                  }}
                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                  title="Thoát quản trị viên"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-login"
                onClick={() => setActiveTab("admin-login")}
                className="text-xs tracking-wider uppercase font-extrabold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
              >
                Đăng nhập Admin
              </button>
            )}
          </div>

          {/* Mobile responsive toggle */}
          <button 
            id="btn-mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white border border-[#1e1e2d] rounded-xl bg-[#111118]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-[#1e1e2d] flex flex-col gap-3">
            <button
              onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "home" ? "bg-yellow-500/10 text-yellow-400" : "text-gray-400 hover:text-[#F8F8FF]"}`}
            >
              Trang Chủ
            </button>
            <button
              onClick={() => { setActiveTab("jerseys"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "jerseys" ? "bg-yellow-500/10 text-yellow-400" : "text-gray-400 hover:text-[#F8F8FF]"}`}
            >
              Chọn Áo Đấu
            </button>
            <button
              onClick={() => { setActiveTab("track"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "track" ? "bg-yellow-500/10 text-yellow-400" : "text-gray-400 hover:text-[#F8F8FF]"}`}
            >
              Tra Cứu Đơn
            </button>
            <button
              onClick={() => { setActiveTab("team-roster"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "team-roster" ? "bg-yellow-500/10 text-yellow-400" : "text-gray-400 hover:text-[#F8F8FF]"}`}
            >
              Danh Sách In Ấn
            </button>
            
            <div className="w-full h-[1px] bg-[#1e1e2d] my-1" />

            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => { setActiveTab("admin-dashboard"); setIsMobileMenuOpen(false); }}
                  className={`text-left text-xs font-black uppercase px-3 py-2.5 rounded-xl border flex items-center gap-2 ${activeTab.startsWith("admin-") ? "bg-yellow-500 text-black border-yellow-500" : "bg-[#111118] text-yellow-400 border-yellow-500/30"}`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Khu Vực Quản Trị
                </button>
                <button
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setActiveTab("home");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-xs font-semibold uppercase px-3 py-2 rounded-xl text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20"
                >
                  Thoát Quản Trị
                </button>
              </>
            ) : (
              <button
                onClick={() => { setActiveTab("admin-login"); setIsMobileMenuOpen(false); }}
                className="text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl text-blue-400 hover:text-white"
              >
                Đăng nhập Admin
              </button>
            )}
          </div>
        )}
      </nav>

      {/* MAIN CONTAINER CONTENT VIEW */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 sm:px-8 py-8">
        
        {/* VIEW 1: HOME PAGE */}
        {activeTab === "home" && (
          <div>
            <HeroBanner 
              onShopNow={() => setActiveTab("jerseys")} 
              onTrackNow={() => setActiveTab("track")} 
            />

            {/* Popular/Featured jerseys list */}
            <section className="mb-16">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Hot Designs</span>
                  <h2 className="text-2xl sm:text-3.5xl font-black text-[#F8F8FF] tracking-tight mt-1">Các Mẫu Áo Bán Chạy</h2>
                </div>
                <button
                  id="btn-view-all"
                  onClick={() => setActiveTab("jerseys")}
                  className="text-xs sm:text-sm font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 select-none transition-colors"
                >
                  Xem thêm các đội tuyển
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-80 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((p) => (
                    <JerseyCard 
                      key={p.id} 
                      product={p} 
                      onSelect={(id) => handleProductSelectToCustomize(id)} 
                    />
                  ))}
                </div>
              )}
            </section>

            {/* How It Works Section */}
            <section className="mb-16 py-12 px-8 bg-[#111118]/40 border border-[#1e1e2d] rounded-3xl relative">
              <h3 className="text-xl sm:text-2xl font-black text-[#F8F8FF] tracking-tight mb-8 text-center">
                Quy Trình Cá Nhân Hóa Đơn Giản
              </h3>
              
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Chọn Mẫu Áo Đấu",
                    desc: "Chọn thiết kế sân nhà hoặc sân khách lấy cảm hứng từ các đội tuyển tham dự World Cup 2026."
                  },
                  {
                    step: "02",
                    title: "Tùy Biến 2.5D Chân Thực",
                    desc: "Nhập Tên và Số áo yêu thích của bạn. Trải nghiệm thay đổi ngay lập tức trên mô hình 2.5D cao cấp."
                  },
                  {
                    step: "03",
                    title: "Thanh Toán & Nhận Áo",
                    desc: "Chọn hình thức thanh toán COD hoặc trực tuyến. Áo đấu của bạn sẽ được in ấn sắc nét và vận chuyển nhanh chóng."
                  }
                ].map((s, idx) => (
                  <div key={idx} className="relative bg-[#0d0d14] p-6 rounded-2xl border border-[#1e1e2d]/60 flex flex-col justify-between">
                    <div>
                      <span className="text-3xl font-mono font-black text-yellow-500/30 tracking-tight block mb-4">{s.step}</span>
                      <h4 className="text-[#F8F8FF] text-base font-bold mb-3">{s.title}</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: JERSEY SELECTION */}
        {activeTab === "jerseys" && (
          <div>
            <div className="mb-8">
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Danh Mục Áo Đấu</span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#F8F8FF] tracking-tight mt-1">Chọn Đội Tuyển Yêu Thích</h1>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#111118] border border-[#1e1e2d] p-4 rounded-2xl">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm quốc gia / tên áo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d0d14] text-[#F8F8FF] placeholder-gray-500 pl-10 pr-4 py-2 rounded-xl text-sm border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Badges tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "Tất Cả" },
                  { value: "home", label: "Áo Sân Nhà" },
                  { value: "away", label: "Áo Sân Khách" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setJerseyTypeFilter(tab.value)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                      jerseyTypeFilter === tab.value
                        ? "bg-yellow-500 text-black border-yellow-500 shadow-md shadow-yellow-500/10"
                        : "bg-black/40 text-gray-400 border-[#1e1e2d] hover:bg-black/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-80 bg-zinc-900 border border-zinc-800 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#111118]/30 rounded-3xl border border-[#1e1e2d] max-w-md mx-auto">
                <div className="p-4 bg-[#1e1e2d]/60 rounded-full w-fit mx-auto mb-4 border border-zinc-600">
                  <Shirt className="w-8 h-8 text-yellow-400" />
                </div>
                <h4 className="text-[#F8F8FF] text-base font-bold mb-2">Không tìm thấy sản phẩm phù hợp</h4>
                <p className="text-gray-400 text-xs">Vui lòng kiểm tra lại bộ lọc hoặc gõ tên nước khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredProducts.map((p) => (
                  <JerseyCard 
                    key={p.id} 
                    product={p} 
                    onSelect={(id) => handleProductSelectToCustomize(id)} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CUSTOMIZE VIEW WITH 3D */}
        {activeTab === "customize" && (
          <div>
            {/* Nav back trigger */}
            <button
              onClick={() => setActiveTab("jerseys")}
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 select-none mb-6 group cursor-pointer bg-[#111118] py-2 px-4 rounded-xl border border-[#1e1e2d]"
            >
              <RotateCcw className="w-4 h-4" />
              Quay lại chọn mẫu
            </button>

            {selectedProduct ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT CONSOLE Custom Form */}
                <div className="lg:col-span-5 bg-[#111118] border border-[#1e1e2d] p-6 rounded-3xl shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-black text-[#F8F8FF] tracking-tight mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Cá Nhân Hóa Áo Đấu
                  </h2>
                  <p className="text-gray-400 text-xs leading-normal mb-6">
                    Mẫu áo cao cấp: <span className="text-[#F8F8FF] font-semibold">{selectedProduct.name}</span> <br />
                    Đơn giá: <span className="text-yellow-400 font-mono font-bold">{selectedProduct.price.toLocaleString("vi-VN")} ₫</span>
                  </p>

                  <div className="flex flex-col gap-5">
                    
                    {/* Toggle Mode */}
                    <div className="grid grid-cols-2 gap-2 bg-[#0c0c14] p-1 rounded-2xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setCustomizeMode("individual")}
                        className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          customizeMode === "individual"
                            ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/10"
                            : "text-gray-400 hover:text-white hover:bg-zinc-900/40"
                        }`}
                      >
                        <Shirt className="w-3.5 h-3.5 shrink-0" />
                        Đặt Cá Nhân
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomizeMode("team")}
                        className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          customizeMode === "team"
                            ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/10"
                            : "text-gray-400 hover:text-white hover:bg-zinc-900/40"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        Đặt Cho Đội {teamRoster.length >= 20 ? "🔥" : ">20 Người"}
                      </button>
                    </div>

                    {/* MODE 1: INDIVIDUAL CUSTOMIZER */}
                    {customizeMode === "individual" ? (
                      <>
                        {/* Official Player-Version Design Notice */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
                          <div className="p-1.5 bg-yellow-500/20 rounded-lg text-yellow-500 mt-0.5">
                            <Shirt className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-yellow-400">Phiên bản Player chính thức</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                              Áo đấu được sản xuất chuẩn chỉnh theo thiết kế thi đấu chính thức của đội tuyển. Bạn chỉ cần chọn kích thước và điền thông tin in áo (Tên & Số) dưới đây.
                            </p>
                          </div>
                        </div>

                        <div className="h-[1px] bg-zinc-800/80" />

                        {/* NAME IN HẬU & SỐ ÁO */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-1.5">
                              Tên in áo (Tối đa 12)
                            </label>
                            <input
                              type="text"
                              maxLength={12}
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value.toUpperCase())}
                              placeholder="MESSY"
                              className="w-full bg-black/40 text-[#F8F8FF] font-sans font-black uppercase px-3 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-sm tracking-wide"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-1.5">
                              Số in sau áo (1–99)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={jerseyNumber}
                              onChange={(e) => setJerseyNumber(Math.min(99, Math.max(1, Number(e.target.value) || 10)))}
                              className="w-full bg-black/40 text-[#F8F8FF] font-mono font-black px-3 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-sm"
                            />
                          </div>
                        </div>

                        {/* SIZE & QUANTITY */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-1.5">
                              Kích thước áo Size
                            </label>
                            <select
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value as JerseySize)}
                              className="w-full bg-[#0d0d14] text-[#F8F8FF] font-black px-3 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-sm cursor-pointer"
                            >
                              {["S", "M", "L", "XL", "XXL", "XXXL"].map((sz) => (
                                <option key={sz} value={sz}>{sz}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-1.5">
                              Số lượng đặt
                            </label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                                className="bg-[#0a0a0f] text-gray-300 hover:text-[#F8F8FF] px-3.5 py-2.5 border border-[#1e1e2d] rounded-l-xl text-sm font-black cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className="flex-grow text-center bg-black/40 border-t border-b border-[#1e1e2d] py-2.5 text-sm font-bold font-mono">
                                {selectedQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(Math.min(20, selectedQuantity + 1))}
                                className="bg-[#0a0a0f] text-gray-300 hover:text-[#F8F8FF] px-3.5 py-2.5 border border-[#1e1e2d] rounded-r-xl text-sm font-black cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (

                      // MODE 2: TEAM ROSTER CUSTOMIZER (> 20 PLAYERS)
                      <>
                        {/* Mass-Discount Explanation */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-amber-600/5 to-amber-500/10 border border-yellow-500/20 flex flex-col gap-2 relative overflow-hidden">
                          <span className="text-yellow-400 text-[9px] font-black uppercase tracking-wider block">CHƯƠNG TRÌNH IN ÁO ĐỒNG ĐỘI WORLD CUP 2026</span>
                          <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                            <Coins className="w-4.5 h-4.5 text-yellow-400 shrink-0" />
                            Ưu Đãi Đặt Khối Lượng Lớn (-15%)
                          </h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Cá nhân hóa độc bản cho từng thành viên của đội (họ tên & số áo in nhiệt sắc nét). Tự động giảm giá <strong>15% trên từng sản phẩm</strong> khi danh sách đạt từ <strong>20 người trở lên</strong>!
                          </p>
                          
                          {/* Progress bar and counter */}
                          <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/80 mt-1">
                            <div className="flex justify-between items-baseline text-[10.5px] font-bold mb-1.5">
                              <span className="text-[#F8F8FF]">Tiến độ danh sách đội:</span>
                              <span className="text-yellow-400 font-mono font-black">{teamRoster.length} / 20 đặt áo</span>
                            </div>
                            <div className="w-full bg-[#1e1e2a] h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${teamRoster.length >= 20 ? "bg-green-500" : "bg-yellow-500"}`}
                                style={{ width: `${Math.min(100, (teamRoster.length / 20) * 100)}%` }}
                              />
                            </div>
                            {teamRoster.length >= 20 ? (
                              <div className="mt-2 text-green-400 text-[10.5px] font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce shrink-0" />
                                🎉 Đã kích hoạt giá sỉ Đội Đạt Chuẩn Giảm 15%!
                              </div>
                            ) : (
                              <div className="mt-2 text-zinc-400 text-[10px]">
                                * Hãy thêm tiếp <strong>{20 - teamRoster.length} thành viên</strong> để tự động giảm 15% tổng đơn đặt.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Excel Excel template and Import tools */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={downloadExcelTemplate}
                            className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-zinc-800 bg-[#0d0d14]/70 hover:bg-[#11111a] hover:border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold transition-all select-none cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-green-400 shrink-0 animate-pulse" />
                            Tải Bản Excel Mẫu
                          </button>

                          <label className="relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40 text-yellow-400 hover:text-yellow-300 text-[11px] font-black tracking-wide transition-all cursor-pointer text-center select-none">
                            <Plus className="w-4 h-4 shrink-0" />
                            Tải Danh Sách Lên
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              onChange={handleExcelImport}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Adding manually form header inside */}
                        <div className="bg-[#0c0c14] border border-[#1e1e2d] p-3.5 rounded-2xl flex flex-col gap-2.5">
                          <span className="text-zinc-400 text-[10.5px] font-black uppercase tracking-wider block">Thêm thành viên thủ công</span>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12 md:col-span-5">
                              <input
                                type="text"
                                placeholder="In Tên (Ví dụ: QUANG HAI)"
                                value={newPlayerName}
                                maxLength={12}
                                onChange={(e) => setNewPlayerName(e.target.value.toUpperCase())}
                                className="w-full bg-black/60 text-[#F8F8FF] font-sans font-extrabold placeholder-zinc-700 px-3 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs uppercase text-left font-display"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <input
                                type="number"
                                min={1}
                                max={99}
                                placeholder="Số áo"
                                value={newPlayerName === "" ? "" : newPlayerNumber}
                                onChange={(e) => setNewPlayerNumber(Math.min(99, Math.max(1, Number(e.target.value) || 10)))}
                                className="w-full bg-black/60 text-[#F8F8FF] font-mono font-black px-2.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-4 flex gap-1.5">
                              <select
                                value={newPlayerSize}
                                onChange={(e) => setNewPlayerSize(e.target.value as JerseySize)}
                                className="flex-grow bg-black/60 text-[#F8F8FF] font-black px-1.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs cursor-pointer text-center"
                              >
                                {["S", "M", "L", "XL", "XXL", "XXXL"].map((sz) => (
                                  <option key={sz} value={sz}>{sz}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleAddPlayerManually}
                                className="p-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 select-none shadow shadow-yellow-500/20"
                                title="Thêm cầu thủ"
                              >
                                <Plus className="w-4 h-4 text-black" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List/Table view scrollable of current customized members */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider block">
                              Danh Sách In Ấn ({teamRoster.length} Cầu Thủ)
                            </span>
                            {teamRoster.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Xóa sạch toàn bộ danh sách cầu thủ hiện tại?")) {
                                    setTeamRoster([]);
                                    setActivePlayerIndex(0);
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 text-[9px] font-bold uppercase cursor-pointer select-none"
                              >
                                Xóa sạch
                              </button>
                            )}
                          </div>

                          {teamRoster.length === 0 ? (
                            <div className="bg-[#0c0c14] border border-[#1e1e2d] border-dashed rounded-2xl p-6 text-center text-zinc-500 text-xs leading-normal">
                              <Users className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                              Chưa có thành viên nào được thêm. <br />
                              Tải danh sách Excel lên hoặc nhập tay ở mục trên.
                            </div>
                          ) : (
                            <div className="max-h-[220px] overflow-y-auto border border-[#1e1e2d] rounded-2xl bg-[#09090e] text-xs divide-y divide-[#1e1e2d]/50">
                              {teamRoster.map((player, idx) => {
                                const isSelectedPreview = idx === activePlayerIndex;
                                return (
                                  <div
                                    key={player.id}
                                    onClick={() => setActivePlayerIndex(idx)}
                                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                                      isSelectedPreview
                                        ? "bg-yellow-500/10 border-l-2 border-yellow-500"
                                        : "hover:bg-zinc-900/40 border-l-2 border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[9px] ${
                                        isSelectedPreview ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <p className="font-extrabold text-[#F8F8FF] uppercase tracking-wide text-xs">
                                          {player.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                          Số áo: <strong className="text-zinc-300">{player.number}</strong> • Size: <strong className="text-zinc-300 font-mono">{player.size}</strong>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        isSelectedPreview ? "bg-yellow-500/20 text-yellow-500" : "bg-black text-zinc-600"
                                      }`}>
                                        {isSelectedPreview ? "Đang Xem 3D" : "Xem 3D"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleRemovePlayer(player.id, e)}
                                        className="p-1.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-colors cursor-pointer select-none"
                                        title="Xóa thành viên"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="h-[1px] bg-zinc-800/85" />

                    {/* SHIPPINGS DETAIL INFO */}
                    <div className="flex flex-col gap-3">
                      <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-0.5">
                        Địa chỉ vận chuyển nhận hàng
                      </span>

                      <div>
                        <input
                          type="text"
                          placeholder="Họ và Tên khách hàng (*)"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-black/40 text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs"
                        />
                        {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.fullName}</p>}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Số điện thoại di động (*)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-black/40 text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs"
                        />
                        {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.phone}</p>}
                      </div>

                      <div>
                        <textarea
                          placeholder="Địa chỉ giao nhận chi tiết (Số nhà, Tỉnh/TP...) (*)"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          rows={2}
                          className="w-full bg-black/40 text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs resize-none"
                        />
                        {formErrors.shippingAddress && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.shippingAddress}</p>}
                      </div>

                      <input
                        type="text"
                        placeholder="Ghi chú thêm (Tùy chọn)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-black/40 text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs"
                      />
                    </div>

                    <div className="h-[1px] bg-zinc-800 my-1" />

                    {/* METHOD SELECT */}
                    <div>
                      <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-3">
                        Chọn cách thức thanh toán
                      </span>
                      <PaymentSelector 
                        selectedMethod={paymentMethod} 
                        onChange={(method) => setPaymentMethod(method)} 
                      />
                    </div>

                    {/* PRICING SUM */}
                    <div className="bg-[#0a0a0f] p-4 rounded-2xl border border-zinc-800/80 mt-2 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">
                          {customizeMode === "individual" 
                            ? `Thành tiền tạm (${selectedQuantity} áo):` 
                            : `Thành tiền tạm (${teamRoster.length} áo):`}
                        </span>
                        <span className="text-[#F8F8FF] font-mono">
                          {customizeMode === "individual"
                            ? (selectedProduct.price * selectedQuantity).toLocaleString("vi-VN")
                            : (selectedProduct.price * teamRoster.length).toLocaleString("vi-VN")
                          } ₫
                        </span>
                      </div>
                      
                      {/* Bulk Roster Discount display */}
                      {customizeMode === "team" && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">Chiết khấu đồng đội:</span>
                          <span className={teamRoster.length >= 20 ? "text-green-400 font-bold font-mono" : "text-zinc-500 font-mono"}>
                            {teamRoster.length >= 20 
                              ? `-${Math.round(selectedProduct.price * teamRoster.length * 0.15).toLocaleString("vi-VN")} ₫ (-15%)`
                              : "Chưa áp dụng (Cần ≥ 20 người)"
                            }
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold">Phí ship vận chuyển:</span>
                        <span className="text-green-400 font-mono font-bold">Miễn phí ship</span>
                      </div>
                      <div className="h-[1px] bg-zinc-800 my-1" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-white uppercase">Tổng đơn hàng:</span>
                        <span className="text-yellow-400 font-mono font-black text-lg sm:text-xl">
                          {customizeMode === "individual"
                            ? (selectedProduct.price * selectedQuantity).toLocaleString("vi-VN")
                            : (
                                (selectedProduct.price * teamRoster.length) - 
                                (teamRoster.length >= 20 ? Math.round(selectedProduct.price * teamRoster.length * 0.15) : 0)
                              ).toLocaleString("vi-VN")
                          } ₫
                        </span>
                      </div>
                    </div>

                    <button
                      id="btn-place-order"
                      type="button"
                      onClick={handlePlaceOrder}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black py-4.5 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 text-sm uppercase cursor-pointer text-center select-none"
                    >
                      Xác Nhận Đặt Đơn Hàng {customizeMode === "team" ? `(${teamRoster.length} Áo)` : ""}
                    </button>
                  </div>
                </div>

                {/* RIGHT VISUAL Interactive ThreeJS JerseyViewer (Sticky on Desktop) */}
                <div className="lg:col-span-7 lg:sticky lg:top-28">
                  {customizeMode === "team" && teamRoster[activePlayerIndex] && (
                    <div className="bg-[#0c0c14] border border-[#1e1e2d] px-4 py-3 rounded-2xl mb-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <span className="text-zinc-400">Xem trước in ấn:</span>
                        <strong className="text-white uppercase font-bold font-sans tracking-wide">{teamRoster[activePlayerIndex].name}</strong>
                      </div>
                      <span className="text-yellow-400 font-mono font-black text-xs uppercase">
                        SỐ {teamRoster[activePlayerIndex].number} • SIZE {teamRoster[activePlayerIndex].size}
                      </span>
                    </div>
                  )}

                  <div className="w-full flex-grow">
                    <JerseyViewer 
                      colorHex={jerseyColor} 
                      accentHex={accentColor} 
                      nickname={customizeMode === "individual" ? nickname : (teamRoster[activePlayerIndex]?.name || "PLAYER")} 
                      number={customizeMode === "individual" ? jerseyNumber : (teamRoster[activePlayerIndex]?.number || 10)} 
                      teamName={selectedProduct.teamCountry} 
                    />
                  </div>

                  <div className="mt-4 bg-[#111118]/80 border border-[#1e1e2d] p-4.5 rounded-2xl flex items-center gap-3.5">
                    <div className="bg-yellow-500/15 border border-yellow-500/20 p-2.5 rounded-xl">
                      <Shirt className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <span className="text-[#F8F8FF] text-xs font-extrabold block">Bản in kỹ thuật số 3D</span>
                      <p className="text-gray-400 text-[11px] mt-0.5 leading-normal">
                        Công nghệ in chuyển nhiệt trực tiếp đảm bảo KHÔNG bong tróc, nứt nẻ hay phai màu sau hàng vặn lần giặt sấy. Mực in đạt tiêu chuẩn thân thiện làn da của FIFA.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 bg-[#111118]/40 rounded-3xl border border-[#1e1e2d] max-w-lg mx-auto">
                <p className="text-gray-400">Không tìm thấy áo đấu nào được lựa chọn.</p>
                <button onClick={() => setActiveTab("jerseys")} className="mt-4 bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-bold">
                  Quay lại chọn áo
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CHECKOUT PLACED CONFIRMATION */}
        {activeTab === "checkout" && (
          <div className="max-w-2xl mx-auto">
            {latestOrder ? (
              <div className="bg-[#111118] border border-[#1e1e2d] p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Gold success glow ornament */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 to-amber-600" />
                
                <div className="text-center mb-8">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-full w-fit mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#F8F8FF] tracking-tight">Đặt Đơn Hàng Thành Công!</h1>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    Đơn hàng áo đấu World Cup của bạn đã được tiếp nhận và chuyển đến bộ phận sản xuất in ấn kỹ thuật.
                  </p>
                </div>

                {/* Prominent Code copying block */}
                <div className="bg-black/60 border border-zinc-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 mb-8">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block">MÃ TRA CỨU ĐƠN HÀNG</span>
                  <div className="flex items-center gap-3 bg-[#0c0c14] border border-[#1e1e2d] px-6 py-3.5 rounded-xl shadow-inner w-full sm:w-auto justify-between sm:justify-start">
                    <span className="text-yellow-400 font-mono font-black text-xl tracking-wider select-all">
                      {latestOrder.orderCode}
                    </span>
                    <button
                      id="btn-copy-code"
                      onClick={() => handleCopyToClipboard(latestOrder.orderCode)}
                      className="p-2 border border-zinc-700/60 hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-[#F8F8FF] cursor-pointer transition-colors"
                      title="Copy mã đơn hàng"
                    >
                      {copiedCode ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Clipboard className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <p className="text-zinc-500 text-[10px] sm:text-xs">
                    * Vui lòng SAO CHÉP MÃ NÀY để tra cứu hành trình giao hàng của bạn bất cứ lúc nào tại mục <strong>Tra Cứu Đơn</strong>.
                  </p>
                </div>

                {/* Details layout */}
                <div className="border-t border-[#1e1e2d] pt-6 flex flex-col gap-4">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Thông Tin Người Nhận</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Khách hàng:</span>
                      <p className="text-[#F8F8FF] font-semibold mt-0.5">{latestOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Số điện thoại:</span>
                      <p className="text-[#F8F8FF] mt-0.5 font-mono">{latestOrder.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Địa chỉ giao nhận:</span>
                      <p className="text-[#F8F8FF] mt-0.5">{latestOrder.address}</p>
                    </div>
                  </div>
                </div>

                {/* Items summarize details */}
                <div className="border-t border-[#1e1e2d] mt-6 pt-6 flex flex-col gap-4">
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Chi Tiết Sản Phẩm</h3>
                  {latestOrder.items?.map((item, idx) => (
                    <div key={idx} className="bg-black/40 p-4 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-4.5 h-4.5 rounded-full border border-black/40 shadow shadow-inner"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <div>
                          <p className="text-[#F8F8FF] font-bold">{item.product?.name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Tên in: <strong className="text-white uppercase font-sans">{item.nickname || "N/A"}</strong> • Số áo: <strong className="text-white font-mono">{item.jerseyNumber}</strong> • Size: <strong className="text-white font-mono">{item.size}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="text-yellow-400 font-bold font-mono">
                        {(item.unitPrice * item.quantity).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment instructions matching chosen options */}
                <div className="border-t border-[#1e1e2d] mt-6 pt-6 text-xs text-gray-400">
                  <h3 className="text-[#F8F8FF] text-sm font-bold uppercase tracking-wider mb-3">Thông Tin Thanh Toán</h3>
                  
                  {latestOrder.payment?.method === "cod" && (
                    <div className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                      <HandCoins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-amber-500 font-bold block">Hình thức: Cod nhận hàng thanh toán</span>
                        <p className="mt-1 leading-relaxed text-zinc-400">
                          Người giao hàng sẽ thu đúng số tiền tổng cộng <strong className="text-white font-mono">{(latestOrder.totalAmount).toLocaleString("vi-VN")} ₫</strong> khi giao áo đến nơi. Bạn sẽ được mở bao bì đồng kiểm trước.
                        </p>
                      </div>
                    </div>
                  )}

                  {latestOrder.payment?.method === "bank_transfer" && (
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <Landmark className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-blue-400 font-bold block">Hình thức: Chuyển khoản qua Ngân hàng</span>
                          <p className="mt-1 leading-relaxed text-zinc-400">
                            Vui lòng thực hiện chuyển khoản đến số tài khoản bên dưới để xác nhận bắt đầu chế tác in áo:
                          </p>
                        </div>
                      </div>
                      <div className="bg-black/50 p-4.5 rounded-xl border border-zinc-800 grid grid-cols-2 gap-4 text-xs font-sans text-gray-300">
                        <div>
                          <span className="text-zinc-500">Ngân hàng thụ hưởng:</span>
                          <p className="text-white font-bold mt-0.5">Vietcombank (VCB)</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Số tài khoản nhận:</span>
                          <p className="text-yellow-400 font-mono font-bold mt-0.5">1937 EF06 5EF7</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Tên người thụ hưởng:</span>
                          <p className="text-white font-semibold mt-0.5">JERSEY WORLD CUP LAB</p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Nội dung bắt buộc:</span>
                          <p className="text-yellow-500 font-mono font-bold mt-0.5">{latestOrder.orderCode}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(latestOrder.payment?.method === "momo" || latestOrder.payment?.method === "vnpay") && (
                    <div className="bg-[#1a0a1a] border border-pink-500/20 rounded-2xl p-4.5 flex flex-col items-center gap-4 text-center">
                      <div className="flex items-center gap-2 text-pink-400">
                        <Wallet className="w-5 h-5" />
                        <span className="font-bold">Mô Phỏng Thanh Toán Trực Tuyến {latestOrder.payment.method.toUpperCase()}</span>
                      </div>
                      
                      <p className="text-xs text-zinc-400">
                        Vui lòng quét QR mô phỏng bên dưới để kích hoạt tín hiệu IPN tự động trả về máy chủ:
                      </p>

                      {/* Display a beautifully simulated dynamic QR code */}
                      <div className="p-3 bg-white rounded-xl border border-zinc-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${latestOrder.orderCode}`}
                          alt="Simulated Payment QR"
                          className="w-40 h-40 object-contain block"
                        />
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <span className="text-[10px] text-zinc-500 font-mono block">Số tiền: {latestOrder.totalAmount.toLocaleString("vi-VN")} ₫ • Nội dung: {latestOrder.orderCode}</span>
                        {latestOrder.payment.status === "paid" ? (
                          <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold flex items-center justify-center gap-1.5 text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Đã nhận thanh toán từ cổng {latestOrder.payment.method.toUpperCase()}!
                          </div>
                        ) : (
                          <button
                            id="btn-simulate-pay"
                            onClick={() => simulatePaymentSuccess(latestOrder.id)}
                            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Xác Nhận Tôi Đã Quét Trả Tiền (Mô phỏng VNPay/MoMo)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="border-t border-[#1e1e2d] mt-6 pt-6 flex sm:flex-row flex-col justify-end gap-3.5">
                  <button
                    onClick={() => {
                      setTrackingQuery(latestOrder.orderCode);
                      executeTrackingQuery();
                      setActiveTab("track");
                    }}
                    className="bg-[#1e1e2d] hover:bg-[#2c2c3d] text-yellow-400 font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Mở Trang Theo Dõi Trực Tuyến
                  </button>
                  <button
                    onClick={() => {
                      setLatestOrder(null);
                      setActiveTab("home");
                    }}
                    className="bg-yellow-500 text-black font-extrabold px-6 py-3 rounded-xl text-xs hover:bg-yellow-400 transition-all cursor-pointer text-center"
                  >
                    Trở về Trang Chủ
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 bg-[#111118]/40 border border-[#1e1e2d] rounded-3xl">
                <p className="text-gray-400">Không tìm thấy phiên thanh toán nào đang hoạt động.</p>
                <button onClick={() => setActiveTab("home")} className="mt-4 bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-bold">
                  Trở về trang chủ
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: ORDER TRACKING PAGE */}
        {activeTab === "track" && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center sm:text-left">
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">REALTIME TRACKING</span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#F8F8FF] tracking-tight mt-1">Tra Cứu Đơn Hàng Áo Đấu</h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1">
                Nhập số điện thoại đặt áo HOẶC mã đơn hàng dạng <code className="font-mono text-yellow-500 bg-[#111118] px-1 py-0.5 rounded">ORD-...</code> để tra cứu lộ trình in ấn trực tiếp.
              </p>
            </div>

            {/* Input bar */}
            <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Nhập Số điện thoại hoặc Mã ORD-..."
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") executeTrackingQuery();
                  }}
                  className="w-full bg-[#0d0d14] text-[#F8F8FF] font-sans font-semibold placeholder-gray-500 pl-11 pr-4 py-3.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
              <button
                id="btn-execute-tracking"
                onClick={() => executeTrackingQuery()}
                disabled={trackingLoader || !trackingQuery.trim()}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-8 py-3.5 rounded-xl text-xs uppercase tracking-wider select-none shrink-0 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
              >
                {trackingLoader ? "Đang Tra Cứu..." : "Tra Cứu"}
              </button>
            </div>

            {/* Tracking Results block */}
            {trackingLoader ? (
              <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse flex items-center justify-center text-zinc-500">
                Đang nạp trạng thái từ vệ tinh...
              </div>
            ) : searchedTrack && trackingResults.length === 0 ? (
              <div className="bg-[#111118]/80 border border-[#1e1e2d] p-10 rounded-2xl text-center max-w-sm mx-auto">
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full w-fit mx-auto mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-white text-base font-extrabold mb-1">Không Tìm Thấy Đơn Hàng</h3>
                <p className="text-zinc-400 text-xs leading-normal">
                  Vui lòng kiểm tra lại chính xác Mã đơn hàng (dạng ORD-...) hoặc số điện thoại bạn nhập lúc đặt.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {trackingResults.map((order, idx) => {
                  const items = order.items || [];
                  const payment = order.payment;
                  const isPaid = payment?.status === "paid";

                  // Status timeline stepper calculator helper
                  const steps: { key: OrderStatus; label: string; desc: string }[] = [
                    { key: "pending", label: "Tiếp Nhận", desc: "Đơn hàng mới tạo" },
                    { key: "processing", label: "Chuẩn Bị", desc: "Xếp phôi chuẩn bị in" },
                    { key: "printing", label: "Đang In 3D", desc: "In kỹ thuật nhiệt" },
                    { key: "shipping", label: "Đang Giao", desc: "Vận chuyển COD nhãn" },
                    { key: "completed", label: "Hoàn Tất", desc: "Đã nhận áo thành công" }
                  ];

                  const getStepIndex = (status: OrderStatus) => {
                    const statusMapping: { [key: string]: number } = {
                      pending: 0,
                      processing: 1,
                      printing: 2,
                      shipping: 3,
                      completed: 4,
                      cancelled: -1
                    };
                    return statusMapping[status] ?? 0;
                  };

                  const currentStepIdx = getStepIndex(order.status);

                  return (
                    <div key={order.id} className="bg-[#111118] border border-[#1e1e2d] hover:border-zinc-800 p-6 rounded-2xl shadow-xl transition-all">
                      
                      {/* Top bar info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e1e2d] pb-4 gap-2 mb-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">Mã đơn:</span>
                            <span className="text-[#F8F8FF] font-mono font-black text-sm tracking-wide bg-black/40 px-2 py-0.5 rounded border border-zinc-800">{order.orderCode}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-1">Đã đặt ngày: {new Date(order.createdAt).toLocaleString("vi-VN")}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {order.status === "cancelled" ? (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                              ĐÃ HỦY ĐƠN
                            </span>
                          ) : (
                            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                              HÀNH TRÌNH: QUY TRÌNH {steps[currentStepIdx]?.label.toUpperCase()}
                            </span>
                          )}

                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                            isPaid
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                          }`}>
                            {isPaid ? "Đã trả tiền" : "Chưa thanh toán"}
                          </span>
                        </div>
                      </div>

                      {/* CLIENT TIMELINE STEPPER HIGHLIGHTED IN GOLD */}
                      {order.status !== "cancelled" && (
                        <div className="mb-8 py-4.5 bg-black/40 rounded-2xl border border-zinc-800/60 px-4">
                          <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                            {/* Horizontal Line connector (for table size) */}
                            <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-800 hidden sm:block z-0" />

                            {steps.map((st, sidx) => {
                              const isCompletedStep = sidx <= currentStepIdx;
                              const isActiveStep = sidx === currentStepIdx;

                              return (
                                <div key={st.key} className="flex sm:flex-col items-center gap-3 sm:gap-0 sm:text-center relative z-10 flex-1">
                                  {/* Stepper Dot */}
                                  <div className={`w-8.5 h-8.5 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:mb-2 transition-all shrink-0 ${
                                    isActiveStep 
                                      ? "bg-yellow-500 border-yellow-500 text-black shadow shadow-yellow-500/50 scale-110" 
                                      : isCompletedStep
                                        ? "bg-[#0d0d14] border-yellow-500 text-yellow-400"
                                        : "bg-[#0d0d14] border-zinc-800 text-zinc-500"
                                  }`}>
                                    {sidx + 1}
                                  </div>
                                  
                                  {/* Text */}
                                  <div>
                                    <span className={`text-xs block font-bold ${
                                      isCompletedStep ? "text-[#F8F8FF]" : "text-zinc-500"
                                    }`}>
                                      {st.label}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 leading-none">{st.desc}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items Details */}
                      <div>
                        <span className="text-zinc-400 text-xs font-black uppercase tracking-wider block mb-3">Sản phẩm đặt chế tác:</span>
                        {items.map((it: any, iIdx: number) => (
                          <div key={iIdx} className="bg-black/30 border border-zinc-800/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between shrink-0 gap-4 mb-3">
                            <div className="flex items-start gap-4">
                              <span 
                                className="w-5 h-5 rounded-full border border-black/40 shadow shadow-inner shrink-0 mt-0.5"
                                style={{ backgroundColor: it.colorHex }}
                              />
                              <div>
                                <span className="text-[#F8F8FF] text-sm font-extrabold">{it.product?.name}</span>
                                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span>In Tên: <strong className="text-indigo-400 uppercase font-sans">{it.nickname || "N/A"}</strong></span>
                                  <span>Số Áo: <strong className="text-indigo-400 font-mono">{it.jerseyNumber}</strong></span>
                                  <span>Cỡ: <strong className="text-[#F8F8FF] font-mono">{it.size}</strong></span>
                                  <span>S.Lượng: <strong className="text-[#F8F8FF] font-mono">{it.quantity}</strong></span>
                                </div>
                              </div>
                            </div>

                            <span className="text-yellow-400 font-mono font-bold text-sm text-right">
                              {(it.unitPrice * it.quantity).toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary Pricing info */}
                      <div className="border-t border-[#1e1e2d] mt-4 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                        <div className="text-zinc-500">
                          Người nhận: <span className="text-[#F8F8FF] font-bold">{order.customerName}</span> • Số ĐT: <span className="text-[#F8F8FF] font-semibold">{order.phone}</span> <br />
                          Nơi giao: <span className="text-zinc-300">{order.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 uppercase block-[10px]">Thực chi tổng cộng:</span>
                          <span className="text-yellow-400 font-mono font-black text-base">{order.totalAmount.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
                
                {/* Simulated Polling notification badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 bg-[#111118] border border-zinc-800 rounded-full px-4 py-1.5 text-[10px] text-zinc-500 select-none">
                    <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                    Đang thiết lập kết nối thời gian thực tự động quét trạng thái in áo mỗi 5s...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5.5: TEAM PRINTING ROSTER LIST */}
        {activeTab === "team-roster" && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background: #ffffff !important;
                  color: #000000 !important;
                }
                .no-print, nav, footer, button, select, input, .flex-row-tabs {
                  display: none !important;
                }
                .print-roster-target {
                  display: block !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  width: 100% !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                }
                .print-table {
                  border: 1px solid #111111 !important;
                  width: 100% !important;
                  color: #000000 !important;
                }
                .print-table th {
                  background: #f0f0f0 !important;
                  color: #000000 !important;
                  border: 1px solid #111111 !important;
                  font-weight: bold !important;
                }
                .print-table td {
                  border: 1px solid #111111 !important;
                  color: #000000 !important;
                }
                .print-title {
                  color: #000000 !important;
                  font-size: 24px !important;
                  text-align: center !important;
                }
                .print-stat-item {
                  background: #f4f4f5 !important;
                  border: 1px solid #d4d4d8 !important;
                  color: #000000 !important;
                }
              }
            `}} />

            <div className="mb-8 text-center sm:text-left no-print">
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">PRODUCTION MANIFEST</span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#F8F8FF] tracking-tight mt-1 animate-fade-in">Danh Sách In Ấn Đồng Đội</h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1">
                Công cụ hỗ trợ rà soát, xuất Excel, sao chép nhanh hoặc in danh sách thông số áo đấu (Tên in, Số áo, Cỡ size) trực tiếp dành cho xưởng in ấn sản xuất của Shop.
              </p>
            </div>

            {/* Sub-tabs header */}
            <div className="flex border-b border-[#1e1e2d] gap-4 mb-8 no-print flex-row-tabs">
              <button
                id="roster-tab-order"
                onClick={() => {
                  setRosterSubTab("order");
                  setRosterSelectedOrder(null);
                  setRosterSearchResults([]);
                  setRosterSearchQuery("");
                }}
                className={`pb-3.5 text-sm font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                  rosterSubTab === "order" ? "text-yellow-400 border-yellow-500" : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                Trích Xuất Đơn Hàng Đã Đặt
              </button>
              <button
                id="roster-tab-draft"
                onClick={() => setRosterSubTab("draft")}
                className={`pb-3.5 text-sm font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                  rosterSubTab === "draft" ? "text-yellow-400 border-yellow-500" : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                Chỉnh Sửa Bản Nháp Đang Thiết Kế
              </button>
            </div>

            {/* TAB CONTENT: ORDER ROSTER EXTRACTION */}
            {rosterSubTab === "order" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Search Panel */}
                <div className="lg:col-span-4 bg-[#111118] border border-[#1e1e2d] p-6 rounded-3xl no-print">
                  <h3 className="text-sm font-bold text-[#F8F8FF] uppercase tracking-wider mb-3">Tra cứu Đơn hàng / Đấu đội</h3>
                  <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
                    Nhập mã đơn hàng hoặc số điện thoại của trưởng đội để nạp thông số in ấn chi tiết cho từng cầu thủ từ hệ thống.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Nhập Số ĐT hoặc Mã ORD-..."
                        value={rosterSearchQuery}
                        onChange={(e) => setRosterSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRosterSearch();
                        }}
                        className="w-full bg-[#0d0d14] text-[#F8F8FF] font-sans placeholder-gray-500 pl-11 pr-4 py-3.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500 text-xs font-semibold"
                      />
                    </div>
                    
                    <button
                      id="btn-roster-search"
                      onClick={handleRosterSearch}
                      disabled={rosterSearchLoader || !rosterSearchQuery.trim()}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-805 disabled:text-zinc-650 text-black font-extrabold text-xs uppercase py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {rosterSearchLoader ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Đang Truy Vấn...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Trích Xuất Thông Tin
                        </>
                      )}
                    </button>
                  </div>

                  {/* Multiple results matching selection */}
                  {rosterSearchResults.length > 1 && !rosterSelectedOrder && (
                    <div className="mt-6 border-t border-[#1e1e2d] pt-5">
                      <span className="text-zinc-400 text-xs font-bold block mb-3">Tìm thấy {rosterSearchResults.length} đơn hàng. Chọn đơn cần in:</span>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {rosterSearchResults.map(order => (
                          <div 
                            key={order.id}
                            onClick={() => {
                              setRosterSelectedOrder(order);
                              setRosterCheckedItems({});
                            }}
                            className="bg-[#0d0d14] border border-[#1e1e2d] hover:border-yellow-500/50 p-3 rounded-xl cursor-pointer transition-all text-xs"
                          >
                            <div className="flex justify-between font-mono font-bold text-[#F8F8FF] mb-1">
                              <span>{order.orderCode}</span>
                              <span className="text-yellow-400">{order.items?.length || 0} áo</span>
                            </div>
                            <div className="text-zinc-500">Khách: {order.customerName} - {order.phone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Selector quick link if some order loaded */}
                  {rosterSelectedOrder && rosterSearchResults.length > 1 && (
                    <button
                      onClick={() => setRosterSelectedOrder(null)}
                      className="mt-5 w-full bg-transparent hover:bg-[#1e1e2d] text-zinc-400 border border-zinc-800 font-bold text-[11px] uppercase py-2.5 rounded-lg cursor-pointer transition-all"
                    >
                      Quay lại Danh Sách Kết Quả
                    </button>
                  )}
                </div>

                {/* Right Side: Printing Sheet Display */}
                <div className="lg:col-span-8 space-y-6">
                  {rosterSelectedOrder ? (
                    <div>
                      {/* Printing Roster Card */}
                      <div id="print-sheet-card" className="print-roster-target bg-[#111118] border border-[#1e1e2d] p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
                        
                        {/* Header for print / screen */}
                        <div className="border-b-2 border-dashed border-[#1e1e2d] pb-6 mb-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                              <h2 className="print-title text-xl sm:text-2xl font-black text-[#F8F8FF] uppercase tracking-tight flex items-center gap-2">
                                <Shirt className="w-6 h-6 text-yellow-500 no-print" />
                                Bảng Kê Sản Xuất In Ấn
                              </h2>
                              <span className="text-zinc-500 text-[10px] sm:text-xs">
                                Tiêu chuẩn chất lượng World Cup Studio • Xuất ngày: {new Date(rosterSelectedOrder.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="bg-[#1e1e2d] border border-zinc-800 text-yellow-400 font-mono font-bold text-sm px-4 py-1.5 rounded-xl block">
                                {rosterSelectedOrder.orderCode}
                              </span>
                              <span className="text-zinc-500 text-[10px] mt-1.5 block uppercase font-bold tracking-wider">
                                Trạng thái đơn: <span className="text-green-400 font-black">{rosterSelectedOrder.status.toUpperCase()}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-xs text-zinc-400 bg-[#0d0d14]/60 p-4 border border-[#1e1e2d] rounded-2xl">
                            <div>
                              <span className="text-zinc-600 block text-[9px] uppercase font-bold text-yellow-500/80">Người đặt hàng</span>
                              <strong className="text-[#F8F8FF] font-sans">{rosterSelectedOrder.customerName}</strong>
                            </div>
                            <div>
                              <span className="text-zinc-600 block text-[9px] uppercase font-bold text-yellow-500/80">Điện thoại di động</span>
                              <strong className="text-[#F8F8FF] font-mono">{rosterSelectedOrder.phone}</strong>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                              <span className="text-zinc-600 block text-[9px] uppercase font-bold text-yellow-500/80">Địa chỉ bàn giao</span>
                              <span className="text-zinc-300 font-sans truncate block" title={rosterSelectedOrder.address}>{rosterSelectedOrder.address}</span>
                            </div>
                            {rosterSelectedOrder.notes && (
                              <div className="sm:col-span-2 md:col-span-3 border-t border-[#1e1e2d]/60 pt-2 mt-2">
                                <span className="text-zinc-600 block text-[9px] uppercase font-bold text-yellow-500/60">Ghi chú khâu sản xuất</span>
                                <span className="text-zinc-300 font-sans italic">{rosterSelectedOrder.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Roster print items count stats */}
                        <div className="mb-6">
                          <span className="text-[#F8F8FF] text-xs font-extrabold uppercase tracking-widest block mb-3">Tóm tắt khổ vải & Size tuyển</span>
                          <div className="flex flex-wrap gap-2">
                            <div className="print-stat-item bg-[#0d0d14] border border-[#1e1e2d] px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                              <span className="text-zinc-500 uppercase font-semibold">Tổng Số Lượng:</span>
                              <strong className="text-yellow-400 font-mono text-sm">
                                {rosterSelectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} áo
                              </strong>
                            </div>
                            
                            {/* Compute sizes dynamic breakdown */}
                            {Object.entries((rosterSelectedOrder.items || []).reduce((acc, it) => {
                              const sz = it.size || "M";
                              acc[sz] = (acc[sz] || 0) + (it.quantity || 1);
                              return acc;
                            }, {} as { [key: string]: number })).map(([sz, count]) => (
                              <div key={sz} className="print-stat-item bg-[#0d0d14] border border-[#1e1e2d] px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                                <span className="text-zinc-500 uppercase">Size {sz}:</span>
                                <strong className="text-[#F8F8FF] font-mono text-sm">{count}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Main Print Manifest Table */}
                        <div className="overflow-x-auto border border-[#1e1e2d] rounded-2xl bg-[#0d0d14]/40">
                          <table className="print-table w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#111118] border-b border-[#1e1e2d] text-zinc-400 text-[10px] font-black uppercase tracking-wider">
                                <th className="p-3 w-12 text-center">STT</th>
                                <th className="p-3">Tên In Mặt Áo (Mặt Sau)</th>
                                <th className="p-3 w-20 text-center">Số Áo</th>
                                <th className="p-3 w-16 text-center">Size</th>
                                <th className="p-3">Mẫu Áo Tuyển</th>
                                <th className="p-3 w-20 text-center">Màu In</th>
                                <th className="p-3 w-24 text-center no-print">Đã In Xong</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e1e2d] text-xs text-[#F8F8FF]">
                              {(rosterSelectedOrder.items || []).map((it, idx) => {
                                let labelNickname = (it.nickname || "PLAYER").trim().toUpperCase();
                                return (
                                  <tr 
                                    key={it.id} 
                                    className={`hover:bg-[#111118]/50 transition-colors ${rosterCheckedItems[it.id] ? "opacity-30 line-through bg-zinc-900/10" : ""}`}
                                  >
                                    <td className="p-3 font-mono text-center text-zinc-500">{idx + 1}</td>
                                    <td className="p-3 font-extrabold uppercase font-sans tracking-wide text-yellow-400 text-sm">
                                      {labelNickname}
                                    </td>
                                    <td className="p-3 font-mono font-black text-center text-[#F8F8FF] text-base">
                                      {it.jerseyNumber ?? 10}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-block bg-zinc-800 border border-zinc-700 text-[#F8F8FF] px-2 py-0.5 rounded text-[11px] font-mono font-black">
                                        {it.size}
                                      </span>
                                    </td>
                                    <td className="p-3 font-medium text-zinc-300">
                                      {it.product?.name || "Premium Custom Jersey"}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5 justify-center">
                                        <div 
                                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner" 
                                          style={{ backgroundColor: it.colorHex || "#ffffff" }}
                                        />
                                        <span className="font-mono text-[9px] text-zinc-500">{it.colorHex}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center no-print">
                                      <input
                                        type="checkbox"
                                        checked={!!rosterCheckedItems[it.id]}
                                        onChange={(e) => {
                                          setRosterCheckedItems({
                                            ...rosterCheckedItems,
                                            [it.id]: e.target.checked
                                          });
                                        }}
                                        className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-950 text-yellow-500 focus:ring-yellow-500 cursor-pointer accent-yellow-400"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Printable production disclaimer */}
                        <div className="mt-6 border-t border-[#1e1e2d] pt-4 text-center text-[10px] text-zinc-650 italic">
                          Mọi sai lệch kích thước vải hoặc bong tróc decal in ấn trong 7 ngày đầu sản xuất được bảo hành 100% không thu thêm phụ phí.
                        </div>

                      </div>

                      {/* Action buttons list */}
                      <div className="mt-6 flex flex-wrap gap-4 justify-end no-print">
                        <button
                          onClick={() => {
                            const rawItems = rosterSelectedOrder.items || [];
                            const tString = `DANH SÁCH IN ÁO - ĐƠN HÀNG ${rosterSelectedOrder.orderCode}\nKhách hàng: ${rosterSelectedOrder.customerName} - ĐT: ${rosterSelectedOrder.phone}\n----------------------------------------\n` +
                              rawItems.map((it, idx) => `${idx + 1}. TÊN: ${(it.nickname || "PLAYER").toUpperCase()} - SỐ: ${it.jerseyNumber} - SIZE: ${it.size} - MÀU IN: ${it.colorHex}`).join("\n");
                            handleCopyRosterToClipboard(tString);
                          }}
                          className="bg-[#111118] hover:bg-[#1e1e2d] text-zinc-300 border border-[#1e1e2d] px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-2"
                        >
                          {copiedRosterText ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              Đã Sao Chép Zalo!
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-4 h-4 text-blue-400" />
                              Sao Chép Nhanh Gửi Zalo
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleExportRosterToExcel(rosterSelectedOrder.items || [], rosterSelectedOrder.orderCode, rosterSelectedOrder.customerName)}
                          className="bg-[#111118] hover:bg-[#1e1e2d] text-[#F8F8FF] border border-[#1e1e2d] px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          Xuất Excel In (.xlsx)
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition-all flex items-center gap-2 shadow-lg"
                        >
                          <Printer className="w-4 h-4 text-black" />
                          In Phiếu Chi Tiết
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#111118] border border-[#1e1e2d] rounded-3xl p-12 text-center animate-fade-in">
                      <div className="bg-[#1e1e2d]/60 p-4 rounded-full w-fit mx-auto mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-zinc-500 animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-300 mb-1">Chưa Có Dữ Liệu Roster</h3>
                      <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                        Hãy nhập SĐT hoặc Mã ORD-... ở thanh tìm kiếm bên trái để bắt đầu lập danh sách và in ấn đồng loạt.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: ACTIVE DRAFT CUSTOMIZER ROSTER */}
            {rosterSubTab === "draft" && (
              <div className="bg-[#111118] border border-[#1e1e2d] p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
                <div className="border-b border-[#1e1e2d] pb-5 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#F8F8FF] uppercase flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-500" />
                      Cầu Thủ/Đội Bóng Bản Nháp
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1">
                      Danh sách này đồng nhất trực tiếp với mục **"Tùy Biến Đặt Đội"** ở Tab Thiết Kế Sáng Tạo.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportRosterToExcel(teamRoster)}
                      disabled={teamRoster.length === 0}
                      className="bg-transparent hover:bg-[#1e1e2d] disabled:opacity-40 disabled:hover:bg-transparent text-xs text-zinc-300 border border-[#1e1e2d] px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      Tải File Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ cầu thủ bản nháp này không?")) {
                          setTeamRoster([]);
                        }
                      }}
                      disabled={teamRoster.length === 0}
                      className="bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-xs text-red-400 border border-red-500/20 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa Sạch Đội Nháp
                    </button>
                  </div>
                </div>

                {teamRoster.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-[#1e1e2d]/60 p-4.5 rounded-full w-fit mx-auto mb-4">
                      <Shirt className="w-7 h-7 text-yellow-500" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-300">Nhóm Nháp Đội Bóng Đang Trống</h3>
                    <p className="text-zinc-500 text-xs max-w-md mx-auto mt-2 leading-relaxed">
                      Bạn chưa thêm cầu thủ nào vào bản nháp. Bạn có thể tải mẫu Excel chuẩn phía dưới để điền danh sách, hoặc chuyển sang Customizer của chúng tôi để thêm trực tiếp.
                    </p>
                    
                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                      <button
                        onClick={downloadExcelTemplate}
                        className="bg-zinc-900 hover:bg-zinc-800 text-[#F8F8FF] border border-zinc-800 px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Tải Excel Mẫu Chuẩn
                      </button>
                      <button
                        onClick={() => {
                          setCustomizeMode("team");
                          setActiveTab("customize");
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        Thêm Cầu Thủ Tại Studio
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Draft Roster Stats */}
                    <div className="mb-6 flex flex-wrap gap-2.5">
                      <div className="bg-[#0d0d14] border border-[#1e1e2d] px-3.5 py-2' rounded-xl text-xs flex items-center gap-1.5">
                        <span className="text-zinc-500 uppercase font-semibold">Thành viên:</span>
                        <strong className="text-yellow-400 font-mono text-sm">{teamRoster.length} cầu thủ</strong>
                      </div>
                      
                      {/* Compute sizing counts on matching draft */}
                      {Object.entries(teamRoster.reduce((acc, p) => {
                        const sz = p.size || "M";
                        acc[sz] = (acc[sz] || 0) + 1;
                        return acc;
                      }, {} as { [key: string]: number })).map(([sz, count]) => (
                        <div key={sz} className="bg-[#0d0d14] border border-[#1e1e2d] px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                          <span className="text-zinc-500 uppercase">Size {sz}:</span>
                          <strong className="text-[#F8F8FF] font-mono text-sm">{count}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Table of draft players */}
                    <div className="overflow-x-auto border border-[#1e1e2d] rounded-2xl bg-[#0d0d14]/40 mb-6">
                      <table className="w-full text-left border-collapse font-sans">
                        <thead>
                          <tr className="bg-[#111118] border-b border-[#1e1e2d] text-zinc-400 text-[10px] font-black uppercase tracking-wider">
                            <th className="p-3 w-12 text-center">STT</th>
                            <th className="p-3">Họ Tên trên áo</th>
                            <th className="p-3 w-28 text-center">Số Áo</th>
                            <th className="p-3 w-28 text-center">Kích Cỡ Size</th>
                            <th className="p-3 w-16 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e2d] text-xs text-[#F8F8FF]">
                          {teamRoster.map((player, idx) => (
                            <tr key={player.id} className="hover:bg-[#111118]/40 transition-colors">
                              <td className="p-3 font-mono text-center text-zinc-500">{idx + 1}</td>
                              <td className="p-3 font-bold uppercase text-yellow-500 text-sm">
                                {player.name}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  value={player.number}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value) || 0;
                                    setTeamRoster(teamRoster.map(p => p.id === player.id ? { ...p, number: parsed } : p));
                                  }}
                                  className="w-16 bg-[#07070b] border border-[#1e1e2d] text-center font-mono py-1 rounded text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={player.size}
                                  onChange={(e) => {
                                    setTeamRoster(teamRoster.map(p => p.id === player.id ? { ...p, size: e.target.value as JerseySize } : p));
                                  }}
                                  className="bg-[#07070b] border border-[#1e1e2d] text-center py-1 rounded w-16 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                                >
                                  {["S","M","L","XL","XXL","XXXL"].map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setTeamRoster(teamRoster.filter(p => p.id !== player.id))}
                                  className="p-1 px-1.5 text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0d0d14]/75 p-5 rounded-2xl border border-[#1e1e2d] mt-6 gap-4">
                      <div className="text-zinc-500 text-xs text-center sm:text-left">
                        <strong className="text-zinc-300 mr-1 block sm:inline">Cách nhanh tiếp theo:</strong> 
                        Chuyển nhanh danh sách này sang mục Customizer để xem lại toàn bộ Mockup 2.5D của các tuyển thủ và thanh toán nhanh.
                      </div>
                      
                      <button
                        onClick={() => {
                          setCustomizeMode("team");
                          setActiveTab("customize");
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 shadow-lg w-full sm:w-auto justify-center"
                      >
                        Nạp Đội Vào Customizer
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* VIEW 6: ADMIN LOGINS AND REDIRECTS */}
        {activeTab === "admin-login" && (
          <div className="max-w-md mx-auto">
            <div className="bg-[#111118] border border-[#1e1e2d] p-8 rounded-3xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl w-fit mx-auto mb-3">
                  <ShieldAlert className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#F8F8FF] tracking-tight">Khu Vực Quản Trị Viên</h1>
                <p className="text-zinc-400 text-xs mt-1 leading-normal">
                  Vui lòng đăng nhập bằng Tài khoản quản lý để thực hiện rà soát đơn hàng, cập nhật kho và truy xuất báo cáo.
                </p>
              </div>

              {adminError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 py-3.5 px-4 rounded-xl text-xs font-bold mb-5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4.5">
                <div>
                  <label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest block mb-1.5">Email quản lý</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourshop.com"
                    className="w-full bg-[#0d0d14] text-[#F8F8FF] px-4 py-3 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Sử dụng Email khuyên dùng: <strong className="text-zinc-300">admin@yourshop.com</strong></p>
                </div>

                <div>
                  <label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest block mb-1.5">Mật khẩu PIN code (Mô phỏng bất kỳ)</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0d0d14] text-[#F8F8FF] px-4 py-3 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-blue-500 text-sm text-indigo-300"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-admin-submit"
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center mt-2.5"
                >
                  Xác Thực Đăng Nhập
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW 7: ADMIN AREA DASHBOARD AND METRICS --- */}
        {activeTab.startsWith("admin-") && isAdminLoggedIn && (
          <div>
            
            {/* ADMIN SUB NAV LINKS BAR */}
            <div className="flex flex-wrap items-center gap-1.5 mb-8 border-b border-[#1e1e2d] pb-4">
              {[
                { tab: "admin-dashboard", label: "Bảng Điều Khiển" },
                { tab: "admin-orders", label: "Quản Lý Đơn Hàng" },
                { tab: "admin-products", label: "Đội Tuyển & Giá Cả" },
                { tab: "admin-customers", label: "Danh Sách Khách Hàng" }
              ].map((sub) => (
                <button
                  key={sub.tab}
                  onClick={() => setActiveTab(sub.tab as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    activeTab === sub.tab
                      ? "bg-yellow-500 text-black border-2 border-yellow-500 shadow-md shadow-yellow-500/10"
                      : "bg-[#111118]/60 text-zinc-400 border border-[#1e1e2d] hover:bg-[#1e1e2d]"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-TAB 1: ANALYTICS DASHBOARD CARD ROWS */}
            {activeTab === "admin-dashboard" && (
              <div className="flex flex-col gap-8">
                
                {/* 4 Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard 
                    title="Tổng số Đơn" 
                    value={adminStats?.totalOrders ?? 0}
                    icon={<ShoppingBag className="w-5 h-5" />}
                    subtitle="Lượng order tích lũy"
                    colorClass="text-blue-400"
                  />
                  <StatsCard 
                    title="Doanh thu thực" 
                    value={`${(adminStats?.revenue ?? 0).toLocaleString("vi-VN")} ₫`}
                    icon={<BadgeDollarSign className="w-5 h-5" />}
                    subtitle="Tỉ lệ thanh toán hoàn tất"
                    colorClass="text-green-400"
                  />
                  <StatsCard 
                    title="Đơn đang chờ" 
                    value={adminStats?.pendingOrders ?? 0}
                    icon={<Clock className="w-5 h-5" />}
                    subtitle="Cần rà soát chuẩn bị in"
                    colorClass="text-amber-500"
                  />
                  <StatsCard 
                    title="Hoàn tất hôm nay" 
                    value={adminStats?.completedToday ?? 0}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    subtitle="Đã bàn giao vận chuyển"
                    colorClass="text-pink-400"
                  />
                </div>

                {/* GRAPH SECTION: HIGH-CRAFT PREMIUM CUSTOM INFOGRAPHIC CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Trend Sales Last 7 Days (Line graph styled in customized SVGs with points and grid lines) */}
                  <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block">TRENDS LINE CHART</span>
                      <h3 className="text-white text-base font-bold mt-0.5">Biểu Đồ Xu Hướng Doanh Thu (7 Ngày)</h3>
                    </div>

                    <div className="h-60 w-full relative flex items-end justify-between px-2 pt-6 pb-2 bg-black/30 border border-zinc-800 rounded-xl">
                      {/* Grid background markers */}
                      <div className="absolute inset-0 flex flex-col justify-between p-3 select-none pointer-events-none opacity-10">
                        <div className="w-full h-[1px] bg-white text-[8px]"></div>
                        <div className="w-full h-[1px] bg-white"></div>
                        <div className="w-full h-[1px] bg-white"></div>
                        <div className="w-full h-[1px] bg-white"></div>
                      </div>

                      {/* Display daily nodes */}
                      {adminStats?.ordersLast7Days?.map((v: any, itemIdx: number) => {
                        const totalMax = Math.max(...adminStats.ordersLast7Days.map((x: any) => x.amount)) || 100000;
                        const barRatioPercentage = Math.min(100, Math.max(10, (v.amount / totalMax) * 100));

                        return (
                          <div key={itemIdx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group">
                            {/* Hover data card */}
                            <div className="absolute bottom-full mb-1 bg-zinc-900 border border-yellow-500/40 text-yellow-400 px-2 py-0.5 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                              {v.amount.toLocaleString("vi-VN")} ₫ ({v.count} đơn)
                            </div>

                            {/* Solid visual connector column bar (using custom responsive layouts) */}
                            <div 
                              className="w-[12px] sm:w-[16px] rounded-t-md bg-gradient-to-t from-yellow-600 to-yellow-400 shadow shadow-yellow-500/20 group-hover:from-yellow-400 group-hover:to-yellow-300 transition-all cursor-pointer"
                              style={{ height: `${barRatioPercentage}%` }}
                            />

                            <span className="text-[10px] text-zinc-400 font-bold font-mono">
                              {v.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Popular Squad teams ordered hierarchy (horizontal status bar graphs) */}
                  <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block">MARKETS METRICS</span>
                      <h3 className="text-white text-base font-bold mt-0.5">Top 5 Đội Tuyển Được Ưa Chuộng Nhất</h3>
                    </div>

                    <div className="bg-black/30 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 h-60 justify-center">
                      {adminStats?.topTeams?.map((t: any, tidx: number) => {
                        const maxCount = Math.max(...adminStats.topTeams.map((x: any) => x.count)) || 1;
                        const computedRatio = (t.count / maxCount) * 100;

                        return (
                          <div key={tidx} className="flex flex-col gap-1.5 group">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#F8F8FF] font-black block group-hover:text-yellow-400 transition-colors">
                                {tidx + 1}. {t.team}
                              </span>
                              <span className="font-mono text-zinc-400 text-xs font-bold">{t.count} áo</span>
                            </div>
                            {/* Horizontal load progress bars */}
                            <div className="w-full bg-[#1e1e2d] h-[6.5px] rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${computedRatio}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Sub row: Recent Placed orders (limits last 5 items) */}
                <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl">
                  <h3 className="text-white text-[#F8F8FF] text-sm font-extrabold uppercase tracking-widest mb-4">Danh Sách 5 Đơn Gần Nhất</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-zinc-400">
                      <thead className="bg-[#0c0c14] border-b border-[#1e1e2d] text-zinc-500 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Mã đơn</th>
                          <th className="px-4 py-3">Khách hàng</th>
                          <th className="px-4 py-3">Tổng Tiền</th>
                          <th className="px-4 py-3">Ngày đặt</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3 text-right">Hành động nhanh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1e2d]">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#151522] transition-colors font-medium">
                            <td className="px-4 py-3 font-mono font-bold text-yellow-400">{ord.orderCode}</td>
                            <td className="px-4 py-3 text-[#F8F8FF]">
                              <div>{ord.customerName}</div>
                              <div className="text-[10px] text-zinc-500">{ord.phone}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-300 font-bold">{ord.totalAmount.toLocaleString("vi-VN")} ₫</td>
                            <td className="px-4 py-3 text-zinc-500">{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                                ord.status === "completed" 
                                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                  : ord.status === "shipping"
                                    ? "bg-orange-500/10 border border-orange-500/20 text-orange-400"
                                    : ord.status === "cancelled"
                                      ? "bg-red-500/10 border border-red-500/20 text-red-500"
                                      : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab("admin-orders");
                                  setAdminOrderSearch(ord.orderCode);
                                }}
                                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-[#F8F8FF] py-1 px-3.5 border border-zinc-700 rounded-lg cursor-pointer transition-colors"
                              >
                                Xem Chi Tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 2: ORDER MANAGER MANAGEMENT TABLE */}
            {activeTab === "admin-orders" && (
              <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1e2d] pb-5">
                  <div>
                    <h2 className="text-white text-base font-black uppercase tracking-widest">Rà soát chi tiết Đơn Hàng</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Thực hiện cập nhật in ấn hoặc xuất hóa đơn, xuất excel nhanh chóng.</p>
                  </div>
                  
                  <button
                    id="btn-excel-export"
                    onClick={handleExportOrders}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                    Báo Cáo File Excel (.XLSX)
                  </button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/30 p-4 border border-zinc-800/80 rounded-2xl">
                  {/* Search inputs */}
                  <div>
                    <label className="text-zinc-500 text-[9px] font-black uppercase block mb-1.5">Bộ lọc từ khóa</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Tìm mã ORD, tên khách, sđt..."
                        value={adminOrderSearch}
                        onChange={(e) => setAdminOrderSearch(e.target.value)}
                        className="w-full bg-[#0d0d14] text-[#F8F8FF] placeholder-gray-500 pl-9 pr-4 py-2 rounded-xl text-xs border border-[#1e1e2d] focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Status Dropdowns */}
                  <div>
                    <label className="text-zinc-500 text-[9px] font-black uppercase block mb-1.5">Lọc Trạng Thái Đơn</label>
                    <select
                      value={adminOrderFilterStatus}
                      onChange={(e) => setAdminOrderFilterStatus(e.target.value)}
                      className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3 py-2 rounded-xl text-xs border border-[#1e1e2d] cursor-pointer focus:outline-none focus:border-yellow-500"
                    >
                      <option value="all">Tất Cả Trạng Thái</option>
                      <option value="pending">Pending (Chờ duyệt)</option>
                      <option value="processing">Processing (Chuẩn bị)</option>
                      <option value="printing">Printing (Đang in)</option>
                      <option value="shipping">Shipping (Đang giao)</option>
                      <option value="completed">Completed (Xong)</option>
                      <option value="cancelled">Cancelled (Đã hủy)</option>
                    </select>
                  </div>

                  {/* Payment Filters */}
                  <div>
                    <label className="text-zinc-500 text-[9px] font-black uppercase block mb-1.5">Lọc Thanh Toán</label>
                    <select
                      value={adminOrderFilterPayment}
                      onChange={(e) => setAdminOrderFilterPayment(e.target.value)}
                      className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3 py-2 rounded-xl text-xs border border-[#1e1e2d] cursor-pointer focus:outline-none focus:border-yellow-500"
                    >
                      <option value="all">Tất Cả Phương Thức</option>
                      <option value="cod">COD (Giao thu tiền)</option>
                      <option value="bank_transfer">Chuyển khoản VCB</option>
                      <option value="momo">Ví điện tử MoMo</option>
                      <option value="vnpay">Cổng VNPay</option>
                    </select>
                  </div>

                  {/* Bulk Actions Console */}
                  <div>
                    <label className="text-zinc-500 text-[9px] font-black uppercase block mb-1.5">Tác Vụ Hàng Loạt ({selectedOrderIds.length} chọn)</label>
                    <div className="flex gap-2">
                      <select
                        value={bulkStatusValue}
                        onChange={(e) => setBulkStatusValue(e.target.value)}
                        className="flex-grow bg-[#0d0d14] text-[#F8F8FF] px-3 py-2 rounded-xl text-[11px] border border-[#1e1e2d] cursor-pointer"
                        disabled={selectedOrderIds.length === 0}
                      >
                        <option value="">Đặt Trạng Thái...</option>
                        <option value="processing">Processing (Duyệt)</option>
                        <option value="printing">Printing (Dầu in)</option>
                        <option value="shipping">Shipping (Bàn giao ship)</option>
                        <option value="completed">Completed (Xong)</option>
                        <option value="cancelled">Cancelled (Hủy)</option>
                      </select>
                      <button
                        onClick={handleBulkStatusUpdate}
                        disabled={selectedOrderIds.length === 0 || !bulkStatusValue}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-4.5 py-2 rounded-xl text-xs font-black disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders spreadsheet grid */}
                <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                  <table className="w-full text-xs text-left text-zinc-400 min-w-[900px]">
                    <thead className="bg-[#0c0c14] border-b border-[#1e1e2d] text-zinc-500 uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                            onChange={handleSelectAllOrders}
                            className="w-3.5 h-3.5 accent-yellow-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3.5">Mã đơn</th>
                        <th className="px-4 py-3.5">Khách hàng / SĐT</th>
                        <th className="px-4 py-3.5">In Áo Tên / Số</th>
                        <th className="px-4 py-3.5">Đội tuyển</th>
                        <th className="px-4 py-3.5">Cỡ / SL</th>
                        <th className="px-4 py-3.5">Tổng Tiền</th>
                        <th className="px-4 py-3.5">Thanh Toán</th>
                        <th className="px-4 py-3.5">Trạng Thái Đơn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2d]">
                      {orders.map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        const item = ord.items?.[0]; // single item schema
                        
                        return (
                          <tr key={ord.id} className={`hover:bg-[#151522] transition-colors ${isSelected ? "bg-yellow-500/5" : ""}`}>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOrder(ord.id)}
                                className="w-3.5 h-3.5 accent-yellow-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-black text-yellow-400 tracking-wider block">{ord.orderCode}</span>
                              <span className="text-[10px] text-zinc-500 block">{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</span>
                            </td>
                            <td className="px-4 py-3 text-[#F8F8FF]">
                              <p className="font-bold">{ord.customerName}</p>
                              <p className="font-mono text-zinc-500 text-[10px]">{ord.phone}</p>
                              <p className="text-[9px] text-zinc-600 line-clamp-1 max-w-[150px]" title={ord.address}>{ord.address}</p>
                            </td>
                            <td className="px-4 py-3 text-white uppercase font-sans font-bold">
                              {item ? (
                                <div>
                                  <span className="text-indigo-400 text-xs tracking-wider block">{item.nickname || "DRAFT"}</span>
                                  <span className="text-zinc-400 text-[10px] font-mono block">Số in: {item.jerseyNumber}</span>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-300">
                              {item?.product?.teamCountry || "N/A"}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span className="font-mono text-yellow-500 font-extrabold text-xs block">{item?.size || "M"}</span>
                              <span className="text-zinc-500 text-[10px] block font-medium">SL: {item?.quantity || 1} cái</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-300 font-extrabold font-bold">
                              {ord.totalAmount.toLocaleString("vi-VN")} ₫
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{ord.payment?.method}</span>
                                <select
                                  value={ord.payment?.status || "pending"}
                                  onChange={(e) => handleUpdateOrderPaymentStatus(ord.id, e.target.value as PaymentStatus)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg outline-none cursor-pointer bg-black/40 border border-[#1e1e2d] ${
                                    ord.payment?.status === "paid" 
                                      ? "text-green-400 border-green-500/20 bg-green-500/5" 
                                      : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                  }`}
                                >
                                  <option value="pending">Mới tạo (Pending)</option>
                                  <option value="paid">Đã Thu Tiền (Paid)</option>
                                  <option value="failed">Lỗi Giao Dịch (Failed)</option>
                                  <option value="refunded">Đã Hoàn Lại (Refunded)</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className={`text-[10px] uppercase font-black px-2.5 py-1.5 rounded-lg border bg-black/40 outline-none cursor-pointer ${
                                  ord.status === "completed"
                                    ? "text-green-400 border-green-500/20 bg-green-500/5"
                                    : ord.status === "shipping"
                                      ? "text-orange-400 border-orange-500/20 bg-orange-500/5"
                                      : ord.status === "cancelled"
                                        ? "text-red-500 border-red-500/20 bg-red-500/5"
                                        : "text-blue-400 border-blue-500/20 bg-blue-500/5"
                                }`}
                              >
                                <option value="pending">PENDING</option>
                                <option value="processing">PROCESSING</option>
                                <option value="printing">PRINTING (ĐANG IN)</option>
                                <option value="shipping">SHIPPING</option>
                                <option value="completed">COMPLETED</option>
                                <option value="cancelled">CANCELLED</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 font-bold border border-zinc-800 rounded-xl">
                    Không tìm thấy đơn đặt áo nào khớp với thông tin rà soát lọc.
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: PRODUCTS SEEDING & CRUD */}
            {activeTab === "admin-products" && (
              <div className="flex flex-col gap-6">
                
                <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h2 className="text-[#F8F8FF] text-base font-black uppercase tracking-widest">Danh sách Sản phẩm áo thi đấu</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Sửa đổi giá niêm yết, số lượng kho phôi hoặc vô hiệu hóa áo nhanh chóng.</p>
                  </div>
                  
                  <button
                    onClick={() => handleOpenProductForm(null)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    Thêm Phôi Áo Mới
                  </button>
                </div>

                {/* MODAL SHEET INLINE (Simple Form Overlay for compatibility) */}
                {isProductModalOpen && (
                  <div className="fixed inset-0 z-55 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in animate-duration-150">
                    <div className="bg-[#111118] border border-[#1e1e2d] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                      <button 
                        onClick={() => setIsProductModalOpen(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 border border-zinc-800 rounded-lg bg-black/40 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <h3 className="text-[#F8F8FF] text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-yellow-500" />
                        {editingProduct ? "Cập Nhật Áo Đấu" : "Thêm Áo Đấu World Cup Mới"}
                      </h3>

                      <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-xs">
                        <div>
                          <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Tên sản phẩm (*)</label>
                          <input
                            type="text"
                            required
                            value={prodFormName}
                            onChange={(e) => setProdFormName(e.target.value)}
                            placeholder="Argentina Home 2026 Special Edition"
                            className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none focus:border-yellow-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Đội/Quốc gia (*)</label>
                            <input
                              type="text"
                              required
                              value={prodFormTeam}
                              onChange={(e) => setProdFormTeam(e.target.value)}
                              placeholder="Vietnam 🇻🇳"
                              className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Phân hạng áo</label>
                            <select
                              value={prodFormType}
                              onChange={(e) => setProdFormType(e.target.value as JerseyType)}
                              className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d]"
                            >
                              <option value="home">Sân Nhà (Home)</option>
                              <option value="away">Sân Khách (Away)</option>
                              <option value="third">Phụ (Third)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Đơn Giá (đ) (*)</label>
                            <input
                              type="number"
                              required
                              value={prodFormPrice}
                              onChange={(e) => setProdFormPrice(e.target.value)}
                              placeholder="390000"
                              className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d]"
                            />
                          </div>

                          <div>
                            <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Số lượng tồn kho phôi</label>
                            <input
                              type="number"
                              required
                              value={prodFormStock}
                              onChange={(e) => setProdFormStock(e.target.value)}
                              className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 font-extrabold uppercase.tracking-widest block mb-1">Ảnh đại diện URL (Trực tiếp từ unsplash)</label>
                          <input
                            type="text"
                            value={prodFormImage}
                            onChange={(e) => setProdFormImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-[#0d0d14] text-[#F8F8FF] px-3.5 py-2.5 rounded-xl border border-[#1e1e2d]"
                          />
                        </div>

                        <div className="flex justify-end gap-3.5 mt-4">
                          <button
                            type="button"
                            onClick={() => setIsProductModalOpen(false)}
                            className="bg-zinc-800 text-gray-300 px-4 py-2.5 rounded-xl hover:bg-zinc-700 font-bold cursor-pointer"
                          >
                            Đóng Hủy
                          </button>
                          <button
                            type="submit"
                            className="bg-yellow-500 text-black px-6 py-2.5 rounded-xl hover:bg-yellow-400 font-extrabold cursor-pointer"
                          >
                            Lưu cấu hình
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Grid Lists products */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <div key={p.id} className={`bg-[#111118] border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between ${p.isActive ? "border-[#1e1e2d]" : "border-red-500/20 opacity-40 bg-zinc-950"}`}>
                      
                      <div className="relative aspect-square">
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-black/80 border border-zinc-800 text-yellow-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                            {p.jerseyType.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-gray-500 block uppercase mb-1">{p.teamCountry}</span>
                          <span className="text-white text-xs sm:text-sm font-bold block leading-snug line-clamp-2">{p.name}</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center text-xs font-mono mb-3 leading-none">
                            <span className="text-yellow-400 font-bold">{p.price.toLocaleString("vi-VN")} ₫</span>
                            <span className="text-zinc-500 text-[10px]">Tồn: {p.stock}</span>
                          </div>

                          {/* Quick modifier controls button bars */}
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800">
                            <button
                              onClick={() => handleOpenProductForm(p)}
                              className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white p-2 border border-blue-500/15 rounded-lg flex items-center justify-center transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleProductActive(p.id, p.isActive)}
                              className={`p-2 border rounded-lg flex items-center justify-center transition-colors ${
                                p.isActive 
                                  ? "bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border-amber-500/15"
                                  : "bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-green-500/15"
                              }`}
                              title={p.isActive ? "Dừng bán tạm thời" : "Bán lại"}
                            >
                              {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-2 border border-red-500/15 rounded-lg flex items-center justify-center transition-colors"
                              title="Hủy hoạt động áo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* SUB-TAB 4: CUSTOMERS STATS EXPANDER DIRECTORY */}
            {activeTab === "admin-customers" && (
              <div className="bg-[#111118] border border-[#1e1e2d] p-5 rounded-2xl flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e1e2d] pb-5">
                  <div>
                    <h2 className="text-[#F8F8FF] text-base font-black uppercase tracking-widest">Danh Mục Khách Hàng đặt áo</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Quản lý các số điện thoại đặt in, lọc danh sách thành viên tích cực.</p>
                  </div>

                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Tìm tên hoặc số điện thoại..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-[#0d0d14] text-[#F8F8FF] placeholder-gray-500 pl-10 pr-4 py-2 rounded-xl text-xs border border-[#1e1e2d] focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                {/* Customers database expanders table representation */}
                <div className="overflow-x-auto border border-zinc-800 rounded-xl">
                  <table className="w-full text-xs text-left text-zinc-400">
                    <thead className="bg-[#0c0c14] border-b border-[#1e1e2d] text-zinc-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Họ Tên Khách Hàng</th>
                        <th className="px-5 py-3.5">Số Điện Thoại</th>
                        <th className="px-5 py-3.5 text-center">Tổng Số Đơn</th>
                        <th className="px-5 py-3.5">Tích lũy chi tiêu</th>
                        <th className="px-5 py-3.5">Đặt Gần Nhất</th>
                        <th className="px-5 py-3.5 text-center">Thao tác tra cứu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2d]">
                      {adminCustomers.map((cust) => {
                        const isExpanded = expandedCustomerPhone === cust.phone;
                        const hasRepeatOrder = cust.totalOrders > 1;

                        return (
                          <>
                            <tr key={cust.phone} className={`hover:bg-[#151522] transition-colors leading-normal ${isExpanded ? "bg-zinc-900/60" : ""}`}>
                              <td className="px-5 py-3.5 text-white font-bold flex items-center gap-2">
                                {cust.name}
                                {hasRepeatOrder && (
                                  <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    Thân Thiết
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-zinc-300 font-bold">{cust.phone}</td>
                              <td className="px-5 py-3.5 text-center font-bold font-mono">{cust.totalOrders} đơn</td>
                              <td className="px-5 py-3.5 font-mono text-yellow-400 font-bold text-sm">
                                {cust.totalSpent.toLocaleString("vi-VN")} ₫
                              </td>
                              <td className="px-5 py-3.5 text-zinc-500 text-[10px]">
                                {new Date(cust.lastOrderDate).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button
                                  onClick={() => {
                                    setExpandedCustomerPhone(isExpanded ? null : cust.phone);
                                  }}
                                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-[#F8F8FF] py-1 px-3 border border-zinc-700 rounded-lg cursor-pointer transition-colors"
                                >
                                  {isExpanded ? "Thu nhỏ đơn" : "Xem tất cả đơn"}
                                </button>
                              </td>
                            </tr>

                            {/* EXPANDE REPRESENTS:past buy listing for this person's number */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-black/60 px-6 py-4 border-l-4 border-yellow-500">
                                  <div className="flex flex-col gap-3">
                                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block">Lịch sử đặt in cho khách hàng này:</span>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {orders
                                        .filter(o => o.phone.trim() === cust.phone.trim())
                                        .map((orderItem) => (
                                          <div key={orderItem.id} className="bg-[#111118]/80 border border-zinc-800 rounded-xl p-4 flex items-center justify-between text-xs">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-yellow-500">{orderItem.orderCode}</span>
                                                <span className="text-zinc-500 text-[10px]">{new Date(orderItem.createdAt).toLocaleDateString("vi-VN")}</span>
                                              </div>
                                              <p className="text-[#F8F8FF] font-medium mt-1">
                                                In: <strong className="text-indigo-400 capitalize">{orderItem.items?.[0]?.nickname || "Không in"}</strong> (Số: {orderItem.items?.[0]?.jerseyNumber || 10})
                                              </p>
                                              <span className="text-[10px] uppercase text-zinc-500 block mt-1">Trạng thái: {orderItem.status} ({orderItem.payment?.status})</span>
                                            </div>

                                            <div className="text-right">
                                              <span className="text-white font-mono font-bold block">{orderItem.totalAmount.toLocaleString("vi-VN")} ₫</span>
                                              <button
                                                onClick={() => {
                                                  setAdminOrderSearch(orderItem.orderCode);
                                                  setActiveTab("admin-orders");
                                                }}
                                                className="text-[9px] text-blue-400 hover:underline mt-1 block"
                                              >
                                                Xem đơn chi tiết
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {adminCustomers.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 font-bold border border-zinc-800 rounded-xl">
                    Không tìm thấy thành viên khách hàng nào.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0f] border-t border-[#1e1e2d] py-12 px-6 sm:px-8 text-xs sm:text-sm text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center sm:text-left">
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-white font-bold tracking-wider font-display uppercase">Jersey World Cup Lab 2026</span>
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              Phân phối áo đấu cao cấp và hỗ trợ thiết kế in ấn chuyển nhiệt chuẩn kỹ thuật số vệ tinh.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-zinc-400">
            <span className="hover:text-yellow-400 cursor-pointer">Zalo OA Support: 0929.266.290</span>
            <span className="hover:text-yellow-400 cursor-pointer">Hotline Zalo: 0352-789-VNP</span>
            <span className="text-zinc-600 block sm:inline">|</span>
            <span 
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveTab("admin-dashboard");
                } else {
                  setActiveTab("admin-login");
                }
              }} 
              className="text-yellow-500 font-bold hover:underline cursor-pointer select-none"
            >
              Hệ thống quản lý Admin
            </span>
          </div>

          <p className="text-[11px] text-zinc-600 tracking-wide font-mono">
            &copy; {new Date().getFullYear()} World Cup Jersey Hub. Crafted with premium Sports-Luxe Theme.
          </p>
        </div>
      </footer>
    </div>
  );
}
