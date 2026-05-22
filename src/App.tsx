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
  Printer, ArrowUp
} from "lucide-react";
import * as XLSX from "xlsx";

import HeroBanner from "./components/user/HeroBanner";
import JerseyCard from "./components/user/JerseyCard";
import PaymentSelector from "./components/user/PaymentSelector";
import StatsCard from "./components/admin/StatsCard";
import JerseyViewer from "./components/three/JerseyViewer";
import LanguageToggle from "./components/user/LanguageToggle";
import ThemeToggle from "./components/user/ThemeToggle";
import { useTranslation } from "./i18n/LanguageContext";
import { Product, Order, OrderItem, Payment, OrderStatus, PaymentMethod, PaymentStatus, JerseyType, JerseySize, TeamPlayer } from "./types";

const PROVINCES_VN = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long",
  "Vĩnh Phúc", "Yên Bái", "Phú Yên"
].sort((a, b) => a.localeCompare(b, "vi"));

const DISTRICTS_BY_PROVINCE: { [key: string]: string[] } = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Quận Hà Đông",
    "Quận Nam Từ Liêm", "Quận Bắc Từ Liêm", "Huyện Sóc Sơn", "Huyện Đông Anh", "Huyện Gia Lâm",
    "Huyện Thanh Trì", "Huyện Mê Linh", "Thị xã Sơn Tây", "Huyện Ba Vì", "Huyện Phúc Thọ",
    "Huyện Thạch Thất", "Huyện Quốc Oai", "Huyện Chương Mỹ", "Huyện Đan Phượng", "Huyện Hoài Đức",
    "Huyện Thanh Oai", "Huyện Mỹ Đức", "Huyện Ứng Hòa", "Huyện Thường Tín", "Huyện Phú Xuyên"
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10",
    "Quận 11", "Quận 12", "Quận Bình Tân", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận",
    "Quận Tân Bình", "Quận Tân Phú", "Thành phố Thủ Đức", "Huyện Bình Chánh", "Huyện Cần Giờ",
    "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu",
    "Quận Cẩm Lệ", "Huyện Hòa Vang"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An",
    "Quận Đồ Sơn", "Quận Dương Kinh", "Huyện Thuỷ Nguyên", "Huyện An Dương", "Huyện An Lão",
    "Huyện Kiến Thuỵ", "Huyện Tiên Lãng", "Huyện Vĩnh Bảo"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt",
    "Huyện Phong Điền", "Huyện Cờ Đỏ", "Huyện Vĩnh Thạnh", "Huyện Thới Lai"
  ],
  "Bình Dương": [
    "Thành phố Thủ Dầu Một", "Thành phố Thuận An", "Thành phố Dĩ An", "Thành phố Tân Uyên",
    "Thành phố Bến Cát", "Huyện Bắc Tân Uyên", "Huyện Dầu Tiếng", "Huyện Phú Giáo", "Huyện Bàu Bàng"
  ],
  "Đồng Nai": [
    "Thành phố Biên Hòa", "Thành phố Long Khánh", "Huyện Long Thành", "Huyện Nhơn Trạch",
    "Huyện Vĩnh Cửu", "Huyện Trảng Bom", "Huyện Thống Nhất", "Huyện Cẩm Mỹ", "Huyện Xuân Lộc",
    "Huyện Định Quán", "Huyện Tân Phú"
  ]
};

export default function App() {
  const { t } = useTranslation();

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
  const [addressProvince, setAddressProvince] = useState("");
  const [addressDistrict, setAddressDistrict] = useState("");
  const [addressWard, setAddressWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
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

  // Pagination & Scroll States
  const [currentPage, setCurrentPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const productsPerPage = 8;

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

  // Reset to first page when filtering or searching changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, jerseyTypeFilter]);

  // Track scroll position for "Back to Top" button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Compile individual address selections into shippingAddress string recursively
  useEffect(() => {
    const parts = [
      addressDetail.trim(),
      addressWard.trim(),
      addressDistrict.trim(),
      addressProvince.trim()
    ].filter(Boolean);
    setShippingAddress(parts.join(", "));
  }, [addressProvince, addressDistrict, addressWard, addressDetail]);

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
          alert(t("alerts.excelImportSuccess", { count: parsedPlayers.length }));
        } else {
          alert(t("alerts.excelImportEmpty"));
        }
      } catch (ex) {
        console.error(ex);
        alert(t("alerts.excelImportError"));
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
      alert(t("alerts.addPlayerNameRequired"));
      return;
    }

    const duplicate = teamRoster.some(p => p.name === cleanName && p.number === newPlayerNumber);
    if (duplicate) {
      const confirmDup = confirm(t("alerts.addPlayerDuplicate", { name: cleanName, number: newPlayerNumber }));
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
    if (!fullName.trim()) errors.fullName = t("validation.fullName");

    // VN phone regex: accepts standard mobile formats starting with 3, 5, 7, 8, 9 (9 digits after +84) or standard local zero (10 digits)
    const phoneClean = phone.trim().replace(/[\s\.\-\(\)]/g, "");
    if (!phoneClean) {
      errors.phone = t("validation.phoneRequired");
    } else {
      const is9Digits = /^[35789][0-9]{8}$/.test(phoneClean);
      const is10Digits = /^0[35789][0-9]{8}$/.test(phoneClean);
      if (!is9Digits && !is10Digits) {
        errors.phone = t("validation.phoneInvalid");
      }
    }

    if (!addressProvince) {
      errors.addressProvince = t("validation.province");
    }
    if (!addressDistrict.trim()) {
      errors.addressDistrict = t("validation.district");
    }
    if (!addressWard.trim()) {
      errors.addressWard = t("validation.ward");
    }
    if (!addressDetail.trim()) {
      errors.addressDetail = t("validation.detail");
    }

    if (!addressProvince || !addressDistrict.trim() || !addressWard.trim() || !addressDetail.trim()) {
      errors.shippingAddress = t("validation.shipping");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Place Order API
  const handlePlaceOrder = async () => {
    if (!validateOrderForm() || !selectedProduct) return;

    if (customizeMode === "team") {
      if (teamRoster.length === 0) {
        alert(t("alerts.teamEmpty"));
        return;
      }
      if (teamRoster.length < 20) {
        const proceed = confirm(t("alerts.teamUnder20", { count: teamRoster.length }));
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

    let finalPhone = phone.trim();
    if (finalPhone && !finalPhone.startsWith("0")) {
      finalPhone = "0" + finalPhone;
    }

    const payload = {
      customerName: fullName.trim(),
      phone: finalPhone,
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
        alert(err.error || t("alerts.orderError"));
      }
    } catch (e) {
      console.error(e);
      alert(t("alerts.systemDown"));
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
          alert(t("alerts.rosterNotFound"));
        }
      } else {
        alert(t("alerts.rosterError"));
      }
    } catch (e) {
      console.error("Error searching roster order:", e);
      alert(t("alerts.rosterSystemDown"));
    } finally {
      setRosterSearchLoader(false);
    }
  };

  const handleExportRosterToExcel = (itemsToExport: any[], orderCodeInfo?: string, customerNameInfo?: string) => {
    if (itemsToExport.length === 0) {
      alert(t("alerts.rosterExportEmpty"));
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
      setAdminError(t("alerts.adminLoginInvalid"));
    }
  };

  // Export orders to Excel
  const handleExportOrders = () => {
    if (orders.length === 0) {
      alert(t("alerts.ordersExportEmpty"));
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
    if (!confirm(t("alerts.productDeleteConfirm"))) return;
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
      alert(t("alerts.productSaveValidation"));
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
        alert(t("alerts.productSaveError"));
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
        alert(t("alerts.paymentSimulated"));
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="min-h-screen bg-surface-base text-text-primary font-sans antialiased flex flex-col justify-between">
      {/* HEADER NAVBAR */}
      <nav className="sticky top-0 z-50 bg-surface-1/90 backdrop-blur-md border-b border-border-default px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => { setActiveTab("home"); window.scrollTo(0,0); }} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="bg-yellow-500 text-black p-2 rounded-xl group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-sm font-black text-yellow-400 tracking-widest block font-display leading-none">{t("nav.brandTitle")}</span>
              <span className="text-xs uppercase font-extrabold text-text-primary block tracking-wide">{t("nav.brandTagline")}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab("home")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "home" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-text-muted"
              }`}
            >
              {t("nav.home")}
            </button>
            <button
              id="nav-tab-jerseys"
              onClick={() => setActiveTab("jerseys")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "jerseys" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-text-muted"
              }`}
            >
              {t("nav.jerseys")}
            </button>
            <button
              id="nav-tab-track"
              onClick={() => setActiveTab("track")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "track" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-text-muted"
              }`}
            >
              {t("nav.track")}
            </button>
            <button
              id="nav-tab-team-roster"
              onClick={() => setActiveTab("team-roster")}
              className={`text-sm font-bold tracking-wide uppercase cursor-pointer hover:text-yellow-400 transition-colors ${
                activeTab === "team-roster" ? "text-yellow-400 border-b-2 border-yellow-500 pb-1" : "text-text-muted"
              }`}
            >
              {t("nav.teamRoster")}
            </button>

            <div className="w-[1px] h-6 bg-surface-4" />

            <LanguageToggle />
            <ThemeToggle />

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  id="nav-tab-dashboard"
                  onClick={() => setActiveTab("admin-dashboard")}
                  className={`text-xs px-3.5 py-1.5 font-black uppercase rounded-lg border flex items-center gap-1.5 transition-all ${
                    activeTab.startsWith("admin-")
                      ? "bg-yellow-500 text-black border-yellow-500"
                      : "bg-surface-3 text-yellow-400 border-yellow-500/30 hover:bg-surface-4"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t("nav.adminPanel")}
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setActiveTab("home");
                  }}
                  className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                  title={t("nav.adminLogoutTitle")}
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
                {t("nav.adminLogin")}
              </button>
            )}
          </div>

          {/* Mobile responsive toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <button
              id="btn-mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-text-muted hover:text-text-primary border border-border-default rounded-xl bg-surface-3"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-border-default flex flex-col gap-3">
            <button
              onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "home" ? "bg-yellow-500/10 text-yellow-400" : "text-text-muted hover:text-text-primary"}`}
            >
              {t("nav.home")}
            </button>
            <button
              onClick={() => { setActiveTab("jerseys"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "jerseys" ? "bg-yellow-500/10 text-yellow-400" : "text-text-muted hover:text-text-primary"}`}
            >
              {t("nav.jerseys")}
            </button>
            <button
              onClick={() => { setActiveTab("track"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "track" ? "bg-yellow-500/10 text-yellow-400" : "text-text-muted hover:text-text-primary"}`}
            >
              {t("nav.track")}
            </button>
            <button
              onClick={() => { setActiveTab("team-roster"); setIsMobileMenuOpen(false); }}
              className={`text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl tracking-wide ${activeTab === "team-roster" ? "bg-yellow-500/10 text-yellow-400" : "text-text-muted hover:text-text-primary"}`}
            >
              {t("nav.teamRoster")}
            </button>

            <div className="w-full h-[1px] bg-surface-4 my-1" />

            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => { setActiveTab("admin-dashboard"); setIsMobileMenuOpen(false); }}
                  className={`text-left text-xs font-black uppercase px-3 py-2.5 rounded-xl border flex items-center gap-2 ${activeTab.startsWith("admin-") ? "bg-yellow-500 text-black border-yellow-500" : "bg-surface-3 text-yellow-400 border-yellow-500/30"}`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  {t("nav.adminPanelMobile")}
                </button>
                <button
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setActiveTab("home");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-xs font-semibold uppercase px-3 py-2 rounded-xl text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20"
                >
                  {t("nav.adminLogout")}
                </button>
              </>
            ) : (
              <button
                onClick={() => { setActiveTab("admin-login"); setIsMobileMenuOpen(false); }}
                className="text-left text-sm font-semibold uppercase px-3 py-2 rounded-xl text-blue-400 hover:text-text-primary"
              >
                {t("nav.adminLogin")}
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
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{t("home.hotDesignsLabel")}</span>
                  <h2 className="text-2xl sm:text-3.5xl font-black text-text-primary tracking-tight mt-1">{t("home.hotDesignsTitle")}</h2>
                </div>
                <button
                  id="btn-view-all"
                  onClick={() => setActiveTab("jerseys")}
                  className="text-xs sm:text-sm font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 select-none transition-colors"
                >
                  {t("home.viewMore")}
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
            <section className="mb-16 py-12 px-8 bg-surface-3/40 border border-border-default rounded-3xl relative">
              <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight mb-8 text-center">
                {t("home.howItWorksTitle")}
              </h3>

              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: t("home.step1Title"),
                    desc: t("home.step1Desc"),
                  },
                  {
                    step: "02",
                    title: t("home.step2Title"),
                    desc: t("home.step2Desc"),
                  },
                  {
                    step: "03",
                    title: t("home.step3Title"),
                    desc: t("home.step3Desc"),
                  },
                ].map((s, idx) => (
                  <div key={idx} className="relative bg-surface-2 p-6 rounded-2xl border border-border-default/60 flex flex-col justify-between">
                    <div>
                      <span className="text-3xl font-mono font-black text-yellow-500/30 tracking-tight block mb-4">{s.step}</span>
                      <h4 className="text-text-primary text-base font-bold mb-3">{s.title}</h4>
                      <p className="text-text-muted text-xs leading-relaxed">{s.desc}</p>
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
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{t("jerseys.categoryLabel")}</span>
              <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight mt-1">{t("jerseys.title")}</h1>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-surface-3 border border-border-default p-4 rounded-2xl">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder={t("jerseys.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-2 text-text-primary placeholder-text-muted pl-10 pr-4 py-2 rounded-xl text-sm border border-border-default focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Badges tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: t("jerseys.filterAll") },
                  { value: "home", label: t("jerseys.filterHome") },
                  { value: "away", label: t("jerseys.filterAway") },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setJerseyTypeFilter(tab.value)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                      jerseyTypeFilter === tab.value
                        ? "bg-yellow-500 text-black border-yellow-500 shadow-md shadow-yellow-500/10"
                        : "bg-surface-base/40 text-text-muted border-border-default hover:bg-surface-base/80"
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
              <div className="text-center py-16 px-4 bg-surface-3/30 rounded-3xl border border-border-default max-w-md mx-auto">
                <div className="p-4 bg-surface-4/60 rounded-full w-fit mx-auto mb-4 border border-zinc-600">
                  <Shirt className="w-8 h-8 text-yellow-400" />
                </div>
                <h4 className="text-text-primary text-base font-bold mb-2">{t("jerseys.emptyTitle")}</h4>
                <p className="text-text-muted text-xs">{t("jerseys.emptyDesc")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {currentProducts.map((p) => (
                    <JerseyCard 
                      key={p.id} 
                      product={p} 
                      onSelect={(id) => handleProductSelectToCustomize(id)} 
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase border border-border-default bg-surface-3 text-text-muted hover:text-text-primary hover:border-yellow-500/40 disabled:opacity-40 disabled:hover:text-text-muted disabled:hover:border-border-default transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                    >
                      {t("jerseys.paginationPrev")}
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pg = idx + 1;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => {
                            setCurrentPage(pg);
                            window.scrollTo({ top: 300, behavior: "smooth" });
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer select-none ${
                            currentPage === pg
                              ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/15 font-black"
                              : "bg-surface-3 hover:bg-surface-base text-text-muted hover:text-text-primary border border-border-default hover:border-yellow-500/20"
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase border border-border-default bg-surface-3 text-text-muted hover:text-text-primary hover:border-yellow-500/40 disabled:opacity-40 disabled:hover:text-text-muted disabled:hover:border-border-default transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                    >
                      {t("jerseys.paginationNext")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* VIEW 3: CUSTOMIZE VIEW WITH 3D */}
        {activeTab === "customize" && (
          <div>
            {/* Nav back trigger */}
            <button
              onClick={() => setActiveTab("jerseys")}
              className="text-xs font-bold text-text-muted hover:text-text-primary flex items-center gap-1.5 select-none mb-6 group cursor-pointer bg-surface-3 py-2 px-4 rounded-xl border border-border-default"
            >
              <RotateCcw className="w-4 h-4" />
              {t("customize.backToList")}
            </button>

            {selectedProduct ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT CONSOLE Custom Form */}
                <div className="lg:col-span-5 bg-surface-3 border border-border-default p-6 rounded-3xl shadow-xl">
                  <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    {t("customize.sectionTitle")}
                  </h2>
                  <p className="text-text-muted text-xs leading-normal mb-6">
                    {t("customize.productPrefix")} <span className="text-text-primary font-semibold">{selectedProduct.name}</span> <br />
                    {t("customize.priceLabel")} <span className="text-yellow-400 font-mono font-bold">{selectedProduct.price.toLocaleString("vi-VN")} ₫</span>
                  </p>

                  <div className="flex flex-col gap-5">
                    
                    {/* Toggle Mode */}
                    <div className="grid grid-cols-2 gap-2 bg-surface-2 p-1 rounded-2xl border border-border-default">
                      <button
                        type="button"
                        onClick={() => setCustomizeMode("individual")}
                        className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          customizeMode === "individual"
                            ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/10"
                            : "text-text-muted hover:text-text-primary hover:bg-surface-3/60"
                        }`}
                      >
                        <Shirt className="w-3.5 h-3.5 shrink-0" />
                        {t("customize.modeIndividual")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomizeMode("team")}
                        className={`py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          customizeMode === "team"
                            ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/10"
                            : "text-text-muted hover:text-text-primary hover:bg-surface-3/60"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {t("customize.modeTeam")} {teamRoster.length >= 20 ? t("customize.teamThresholdFire") : t("customize.teamThreshold")}
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
                            <h4 className="text-sm font-bold text-yellow-400">{t("customize.officialBadge")}</h4>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                              {t("customize.officialDesc")}
                            </p>
                          </div>
                        </div>

                        <div className="h-[1px] bg-border-default/80" />

                        {/* NAME IN HẬU & SỐ ÁO */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-text-muted text-xs font-black uppercase tracking-wider block mb-1.5">
                              {t("customize.nicknameLabel")}
                            </label>
                            <input
                              type="text"
                              maxLength={12}
                              value={nickname}
                              onChange={(e) => setNickname(e.target.value.toUpperCase())}
                              placeholder={t("customize.nicknamePlaceholder")}
                              className="w-full bg-surface-base/40 text-text-primary font-sans font-black uppercase px-3 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-sm tracking-wide"
                            />
                          </div>

                          <div>
                            <label className="text-text-muted text-xs font-black uppercase tracking-wider block mb-1.5">
                              {t("customize.numberLabel")}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={jerseyNumber}
                              onChange={(e) => setJerseyNumber(Math.min(99, Math.max(1, Number(e.target.value) || 10)))}
                              className="w-full bg-surface-base/40 text-text-primary font-mono font-black px-3 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-sm"
                            />
                          </div>
                        </div>

                        {/* SIZE & QUANTITY */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-text-muted text-xs font-black uppercase tracking-wider block mb-1.5">
                              {t("customize.sizeLabel")}
                            </label>
                            <select
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value as JerseySize)}
                              className="w-full bg-surface-2 text-text-primary font-black px-3 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-sm cursor-pointer"
                            >
                              {["S", "M", "L", "XL", "XXL", "XXXL"].map((sz) => (
                                <option key={sz} value={sz}>{sz}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-text-muted text-xs font-black uppercase tracking-wider block mb-1.5">
                              {t("customize.quantityLabel")}
                            </label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                                className="bg-surface-1 text-text-secondary hover:text-text-primary px-3.5 py-2.5 border border-border-default rounded-l-xl text-sm font-black cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className="flex-grow text-center bg-surface-base/40 border-t border-b border-border-default py-2.5 text-sm font-bold font-mono">
                                {selectedQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(Math.min(20, selectedQuantity + 1))}
                                className="bg-surface-1 text-text-secondary hover:text-text-primary px-3.5 py-2.5 border border-border-default rounded-r-xl text-sm font-black cursor-pointer select-none"
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
                          <span className="text-yellow-400 text-[9px] font-black uppercase tracking-wider block">{t("customize.bulkProgramLabel")}</span>
                          <h4 className="text-xs sm:text-sm font-black text-text-primary flex items-center gap-1.5">
                            <Coins className="w-4.5 h-4.5 text-yellow-400 shrink-0" />
                            {t("customize.bulkProgramTitle")}
                          </h4>
                          <p className="text-[11px] text-text-muted leading-relaxed">
                            {t("customize.bulkProgramDesc1")} <strong>{t("customize.bulkProgramDesc2")}</strong> {t("customize.bulkProgramDesc3")} <strong>{t("customize.bulkProgramDesc4")}</strong>{t("customize.bulkProgramDesc5")}
                          </p>

                          {/* Progress bar and counter */}
                          <div className="bg-surface-base/40 p-3 rounded-xl border border-border-default/80 mt-1">
                            <div className="flex justify-between items-baseline text-[10.5px] font-bold mb-1.5">
                              <span className="text-text-primary">{t("customize.teamProgressLabel")}</span>
                              <span className="text-yellow-400 font-mono font-black">{t("customize.teamProgressUnit", { count: teamRoster.length })}</span>
                            </div>
                            <div className="w-full bg-surface-4 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${teamRoster.length >= 20 ? "bg-green-500" : "bg-yellow-500"}`}
                                style={{ width: `${Math.min(100, (teamRoster.length / 20) * 100)}%` }}
                              />
                            </div>
                            {teamRoster.length >= 20 ? (
                              <div className="mt-2 text-green-400 text-[10.5px] font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce shrink-0" />
                                {t("customize.teamProgressDoneShort")}
                              </div>
                            ) : (
                              <div className="mt-2 text-text-muted text-[10px]">
                                {t("customize.teamProgressLeftPrefix")} <strong>{t("customize.teamProgressLeftCount", { count: 20 - teamRoster.length })}</strong> {t("customize.teamProgressLeftSuffix")}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Excel Excel template and Import tools */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={downloadExcelTemplate}
                            className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-border-default bg-surface-2/70 hover:bg-surface-3 hover:border-border-strong text-text-secondary hover:text-text-primary text-[11px] font-bold transition-all select-none cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-green-400 shrink-0 animate-pulse" />
                            {t("customize.downloadExcelTemplate")}
                          </button>

                          <label className="relative flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40 text-yellow-400 hover:text-yellow-300 text-[11px] font-black tracking-wide transition-all cursor-pointer text-center select-none">
                            <Plus className="w-4 h-4 shrink-0" />
                            {t("customize.uploadList")}
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              onChange={handleExcelImport}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Adding manually form header inside */}
                        <div className="bg-surface-2 border border-border-default p-3.5 rounded-2xl flex flex-col gap-2.5">
                          <span className="text-text-muted text-[10.5px] font-black uppercase tracking-wider block">{t("customize.addPlayerManual")}</span>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12 md:col-span-5">
                              <input
                                type="text"
                                placeholder={t("customize.namePlaceholder")}
                                value={newPlayerName}
                                maxLength={12}
                                onChange={(e) => setNewPlayerName(e.target.value.toUpperCase())}
                                className="w-full bg-surface-base/60 text-text-primary font-sans font-extrabold placeholder-text-muted px-3 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs uppercase text-left font-display"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                              <input
                                type="number"
                                min={1}
                                max={99}
                                placeholder={t("customize.numberPlaceholder")}
                                value={newPlayerName === "" ? "" : newPlayerNumber}
                                onChange={(e) => setNewPlayerNumber(Math.min(99, Math.max(1, Number(e.target.value) || 10)))}
                                className="w-full bg-surface-base/60 text-text-primary font-mono font-black px-2.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs text-center"
                              />
                            </div>
                            <div className="col-span-6 md:col-span-4 flex gap-1.5">
                              <select
                                value={newPlayerSize}
                                onChange={(e) => setNewPlayerSize(e.target.value as JerseySize)}
                                className="flex-grow bg-surface-base/60 text-text-primary font-black px-1.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs cursor-pointer text-center"
                              >
                                {["S", "M", "L", "XL", "XXL", "XXXL"].map((sz) => (
                                  <option key={sz} value={sz}>{sz}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleAddPlayerManually}
                                className="p-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 select-none shadow shadow-yellow-500/20"
                                title={t("customize.addPlayerTitle")}
                              >
                                <Plus className="w-4 h-4 text-black" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List/Table view scrollable of current customized members */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-text-muted text-[10px] font-black uppercase tracking-wider block">
                              {t("customize.rosterTitle", { count: teamRoster.length })}
                            </span>
                            {teamRoster.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(t("alerts.rosterClearConfirm"))) {
                                    setTeamRoster([]);
                                    setActivePlayerIndex(0);
                                  }
                                }}
                                className="text-red-400 hover:text-red-300 text-[9px] font-bold uppercase cursor-pointer select-none"
                              >
                                {t("customize.clearAll")}
                              </button>
                            )}
                          </div>

                          {teamRoster.length === 0 ? (
                            <div className="bg-surface-2 border border-border-default border-dashed rounded-2xl p-6 text-center text-text-muted text-xs leading-normal">
                              <Users className="w-6 h-6 text-text-muted mx-auto mb-2" />
                              {t("customize.rosterEmptyLine1")} <br />
                              {t("customize.rosterEmptyLine2")}
                            </div>
                          ) : (
                            <div className="max-h-[220px] overflow-y-auto border border-border-default rounded-2xl bg-surface-1 text-xs divide-y divide-border-default/50">
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
                                        isSelectedPreview ? "bg-yellow-500 text-black" : "bg-surface-4 text-text-muted"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <p className="font-extrabold text-text-primary uppercase tracking-wide text-xs">
                                          {player.name}
                                        </p>
                                        <p className="text-[10px] text-text-muted font-mono mt-0.5">
                                          {t("customize.rosterJerseyNumLabel")} <strong className="text-text-secondary">{player.number}</strong> • {t("customize.rosterSizeLabel")} <strong className="text-text-secondary font-mono">{player.size}</strong>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        isSelectedPreview ? "bg-yellow-500/20 text-yellow-500" : "bg-surface-base text-text-muted"
                                      }`}>
                                        {isSelectedPreview ? t("customize.rosterViewing") : t("customize.rosterView")}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleRemovePlayer(player.id, e)}
                                        className="p-1.5 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer select-none"
                                        title={t("customize.rosterRemove")}
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

                    <div className="h-[1px] bg-border-default/85" />

                    {/* SHIPPINGS DETAIL INFO */}
                    <div className="flex flex-col gap-4">
                      <span className="text-text-muted text-xs font-black uppercase tracking-wider block mb-0.5">
                        {t("customize.shippingSection")}
                      </span>

                      {/* Họ tên */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("customize.fullNameLabel")}</label>
                        <input
                          type="text"
                          placeholder={t("customize.fullNamePlaceholder")}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs"
                        />
                        {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.fullName}</p>}
                      </div>

                      {/* Số điện thoại */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("customize.phoneLabel")}</label>
                        <div className="flex items-stretch gap-2">
                          <div className="flex items-center gap-1.5 bg-surface-3/90 hover:bg-surface-base px-3.5 rounded-xl border border-border-default text-xs font-mono text-text-secondary select-none">
                            <span className="text-sm">🇻🇳</span>
                            <span className="font-extrabold text-text-muted">+84</span>
                          </div>
                          <input
                            type="text"
                            placeholder={t("customize.phonePlaceholder")}
                            value={phone}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^0-9]/g, "");
                              setPhone(cleaned);
                            }}
                            className="flex-1 bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs font-mono"
                          />
                        </div>
                        {formErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.phone}</p>}
                      </div>

                      {/* Address Fields */}
                      <div className="border border-border-default/60 bg-surface-base/20 p-3.5 rounded-2xl flex flex-col gap-3">
                        <span className="text-[10.5px] text-text-muted font-bold uppercase tracking-wider block mb-0.5">{t("customize.addressLabel")}</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Tỉnh / Thành phố */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted font-bold uppercase">{t("customize.provinceLabel")}</label>
                            <select
                              value={addressProvince}
                              onChange={(e) => {
                                setAddressProvince(e.target.value);
                                setAddressDistrict("");
                                setAddressWard("");
                              }}
                              className="w-full bg-surface-base text-text-primary px-3 py-2 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs cursor-pointer"
                            >
                              <option value="" disabled>{t("customize.provincePlaceholder")}</option>
                              {PROVINCES_VN.map((p) => (
                                <option key={p} value={p} className="bg-surface-1">{p}</option>
                              ))}
                            </select>
                            {formErrors.addressProvince && <p className="text-red-500 text-[9px] font-bold mt-0.5">{formErrors.addressProvince}</p>}
                          </div>

                          {/* Quận / Huyện */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted font-bold uppercase">{t("customize.districtLabel")}</label>
                            {addressProvince && DISTRICTS_BY_PROVINCE[addressProvince] ? (
                              <select
                                value={addressDistrict}
                                onChange={(e) => {
                                  setAddressDistrict(e.target.value);
                                  setAddressWard("");
                                }}
                                className="w-full bg-surface-base text-text-primary px-3 py-2 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs cursor-pointer"
                              >
                                <option value="" disabled>{t("customize.districtSelectPlaceholder")}</option>
                                {DISTRICTS_BY_PROVINCE[addressProvince].map((d) => (
                                  <option key={d} value={d} className="bg-surface-1">{d}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder={addressProvince ? t("customize.districtPlaceholder") : t("customize.districtPlaceholderEmpty")}
                                disabled={!addressProvince}
                                value={addressDistrict}
                                onChange={(e) => setAddressDistrict(e.target.value)}
                                className="w-full bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            )}
                            {formErrors.addressDistrict && <p className="text-red-500 text-[9px] font-bold mt-0.5">{formErrors.addressDistrict}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Phường / Xã */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted font-bold uppercase">{t("customize.wardLabel")}</label>
                            <input
                              type="text"
                              placeholder={addressDistrict ? t("customize.wardPlaceholder") : t("customize.wardPlaceholderEmpty")}
                              disabled={!addressDistrict}
                              value={addressWard}
                              onChange={(e) => setAddressWard(e.target.value)}
                              list={`wards-list-${addressProvince}-${addressDistrict}`}
                              className="w-full bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <datalist id={`wards-list-${addressProvince}-${addressDistrict}`}>
                              {addressDistrict === "Quận 1" && [
                                "Phường Bến Nghé", "Phường Bến Thành", "Phường Cô Giang", "Phường Cầu Kho", 
                                "Phường Cầu Ông Lãnh", "Phường Đa Kao", "Phường Nguyễn Cư Trinh", 
                                "Phường Nguyễn Thái Bình", "Phường Phạm Ngũ Lão", "Phường Tân Định"
                              ].map(w => <option key={w} value={w} />)}
                              
                              {addressProvince === "Hà Nội" && [
                                "Phường Cống Vị", "Phường Điện Biên", "Phường Giảng Võ", "Phường Kim Mã", 
                                "Phường Láng Hạ", "Phường Mỹ Đình", "Phường Hàng Trống", "Phường Bạch Mai",
                                "Phường Tràng Tiền", "Phường Hàng Bông", "Phường Trúc Bạch"
                              ].map(w => <option key={w} value={w} />)}

                              {["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Thị trấn"].map(w => (
                                <option key={w} value={w} />
                              ))}
                            </datalist>
                            {formErrors.addressWard && <p className="text-red-500 text-[9px] font-bold mt-0.5">{formErrors.addressWard}</p>}
                          </div>

                          {/* Địa chỉ chi tiết */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted font-bold uppercase">{t("customize.detailLabel")}</label>
                            <input
                              type="text"
                              placeholder={t("customize.detailPlaceholder")}
                              value={addressDetail}
                              onChange={(e) => setAddressDetail(e.target.value)}
                              className="w-full bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs"
                            />
                            {formErrors.addressDetail && <p className="text-red-500 text-[9px] font-bold mt-0.5">{formErrors.addressDetail}</p>}
                          </div>
                        </div>

                        {/* Combined Live Address Preview */}
                        {shippingAddress && (
                          <div className="bg-surface-2 px-3 py-2 rounded-xl border border-border-default/40 text-[10px] text-text-muted font-medium flex items-start gap-1.5 leading-relaxed">
                            <span className="text-yellow-500 select-none">📍</span>
                            <span className="break-all"><strong>{t("customize.shippingPreviewLabel")}</strong> {shippingAddress}</span>
                          </div>
                        )}
                        {formErrors.shippingAddress && <p className="text-red-500 text-[10px] mt-1 font-bold">{formErrors.shippingAddress}</p>}
                      </div>

                      {/* Ghi chú */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t("customize.notesLabel")}</label>
                        <textarea
                          placeholder={t("customize.notesPlaceholder")}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full bg-surface-base/40 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs resize-y min-h-[70px]"
                        />
                      </div>
                    </div>

                    <div className="h-[1px] bg-border-default my-1" />

                    {/* METHOD SELECT */}
                    <div>
                      <span className="text-text-muted text-xs font-black uppercase tracking-wider block mb-3">
                        {t("customize.paymentSectionLabel")}
                      </span>
                      <PaymentSelector 
                        selectedMethod={paymentMethod} 
                        onChange={(method) => setPaymentMethod(method)} 
                      />
                    </div>

                    {/* PRICING SUM */}
                    <div className="bg-surface-1 p-4 rounded-2xl border border-border-default/80 mt-2 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-bold">
                          {customizeMode === "individual"
                            ? t("customize.pricingTempIndividual", { qty: selectedQuantity })
                            : t("customize.pricingTempTeam", { qty: teamRoster.length })}
                        </span>
                        <span className="text-text-primary font-mono">
                          {customizeMode === "individual"
                            ? (selectedProduct.price * selectedQuantity).toLocaleString("vi-VN")
                            : (selectedProduct.price * teamRoster.length).toLocaleString("vi-VN")
                          } ₫
                        </span>
                      </div>

                      {/* Bulk Roster Discount display */}
                      {customizeMode === "team" && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted font-bold">{t("customize.teamDiscountLabel")}</span>
                          <span className={teamRoster.length >= 20 ? "text-green-400 font-bold font-mono" : "text-text-muted font-mono"}>
                            {teamRoster.length >= 20
                              ? t("customize.teamDiscountValue", { amount: Math.round(selectedProduct.price * teamRoster.length * 0.15).toLocaleString("vi-VN") })
                              : t("customize.teamDiscountInactive")
                            }
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-bold">{t("customize.shippingFee")}</span>
                        <span className="text-green-400 font-mono font-bold">{t("customize.freeShipping")}</span>
                      </div>
                      <div className="h-[1px] bg-border-default my-1" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-text-primary uppercase">{t("customize.totalLabel")}</span>
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
                      {customizeMode === "team"
                        ? t("customize.placeOrderCtaTeam", { qty: teamRoster.length })
                        : t("customize.placeOrderCta")}
                    </button>
                  </div>
                </div>

                {/* RIGHT VISUAL Interactive ThreeJS JerseyViewer (Sticky on Desktop) */}
                <div className="lg:col-span-7 lg:sticky lg:top-28">
                  {customizeMode === "team" && teamRoster[activePlayerIndex] && (
                    <div className="bg-surface-2 border border-border-default px-4 py-3 rounded-2xl mb-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <span className="text-text-muted">{t("customize.previewBadge")}</span>
                        <strong className="text-text-primary uppercase font-bold font-sans tracking-wide">{teamRoster[activePlayerIndex].name}</strong>
                      </div>
                      <span className="text-yellow-400 font-mono font-black text-xs uppercase">
                        {t("customize.previewMetaNumber")} {teamRoster[activePlayerIndex].number} • {t("customize.previewMetaSize")} {teamRoster[activePlayerIndex].size}
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

                  <div className="mt-4 bg-surface-3/80 border border-border-default p-4.5 rounded-2xl flex items-center gap-3.5">
                    <div className="bg-yellow-500/15 border border-yellow-500/20 p-2.5 rounded-xl">
                      <Shirt className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <span className="text-text-primary text-xs font-extrabold block">{t("customize.techPrintTitle")}</span>
                      <p className="text-text-muted text-[11px] mt-0.5 leading-normal">
                        {t("customize.techPrintDesc")}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 bg-surface-3/40 rounded-3xl border border-border-default max-w-lg mx-auto">
                <p className="text-text-muted">{t("customize.notSelectedTitle")}</p>
                <button onClick={() => setActiveTab("jerseys")} className="mt-4 bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-bold">
                  {t("customize.notSelectedCta")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CHECKOUT PLACED CONFIRMATION */}
        {activeTab === "checkout" && (
          <div className="max-w-2xl mx-auto">
            {latestOrder ? (
              <div className="bg-surface-3 border border-border-default p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Gold success glow ornament */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 to-amber-600" />
                
                <div className="text-center mb-8">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-full w-fit mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">{t("checkout.successTitle")}</h1>
                  <p className="text-text-muted text-xs sm:text-sm mt-1 max-w-sm mx-auto">
                    {t("checkout.successSubtitle")}
                  </p>
                </div>

                {/* Prominent Code copying block */}
                <div className="bg-surface-base/60 border border-border-default p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 mb-8">
                  <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block">{t("checkout.orderCodeLabel")}</span>
                  <div className="flex items-center gap-3 bg-surface-2 border border-border-default px-6 py-3.5 rounded-xl shadow-inner w-full sm:w-auto justify-between sm:justify-start">
                    <span className="text-yellow-400 font-mono font-black text-xl tracking-wider select-all">
                      {latestOrder.orderCode}
                    </span>
                    <button
                      id="btn-copy-code"
                      onClick={() => handleCopyToClipboard(latestOrder.orderCode)}
                      className="p-2 border border-border-default hover:bg-surface-4 rounded-lg text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                      title={t("checkout.copyOrderTitle")}
                    >
                      {copiedCode ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Clipboard className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  <p className="text-text-muted text-[10px] sm:text-xs">
                    {t("checkout.saveCodeHintBefore")} <strong>{t("checkout.saveCodeHintTrackLabel")}</strong>{t("checkout.saveCodeHintAfter")}
                  </p>
                </div>

                {/* Details layout */}
                <div className="border-t border-border-default pt-6 flex flex-col gap-4">
                  <h3 className="text-text-primary text-sm font-bold uppercase tracking-wider">{t("checkout.receiverInfo")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-text-muted">{t("checkout.receiverCustomer")}</span>
                      <p className="text-text-primary font-semibold mt-0.5">{latestOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">{t("checkout.receiverPhone")}</span>
                      <p className="text-text-primary mt-0.5 font-mono">{latestOrder.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-muted">{t("checkout.receiverAddress")}</span>
                      <p className="text-text-primary mt-0.5">{latestOrder.address}</p>
                    </div>
                  </div>
                </div>

                {/* Items summarize details */}
                <div className="border-t border-border-default mt-6 pt-6 flex flex-col gap-4">
                  <h3 className="text-text-primary text-sm font-bold uppercase tracking-wider">{t("checkout.productDetails")}</h3>
                  {latestOrder.items?.map((item, idx) => (
                    <div key={idx} className="bg-surface-base/40 p-4 border border-border-default rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4.5 h-4.5 rounded-full border border-black/40 shadow shadow-inner"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <div>
                          <p className="text-text-primary font-bold">{item.product?.name}</p>
                          <p className="text-text-muted text-xs mt-0.5">
                            {t("checkout.nicknameLabel")} <strong className="text-text-primary uppercase font-sans">{item.nickname || t("checkout.nicknameMissing")}</strong> • {t("checkout.numberLabel")} <strong className="text-text-primary font-mono">{item.jerseyNumber}</strong> • {t("checkout.sizeLabel")} <strong className="text-text-primary font-mono">{item.size}</strong>
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
                <div className="border-t border-border-default mt-6 pt-6 text-xs text-text-muted">
                  <h3 className="text-text-primary text-sm font-bold uppercase tracking-wider mb-3">{t("checkout.paymentInfo")}</h3>

                  {latestOrder.payment?.method === "cod" && (
                    <div className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                      <HandCoins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-amber-500 font-bold block">{t("checkout.codTitle")}</span>
                        <p className="mt-1 leading-relaxed text-text-muted">
                          {t("checkout.codDescBefore")} <strong className="text-text-primary font-mono">{(latestOrder.totalAmount).toLocaleString("vi-VN")} ₫</strong> {t("checkout.codDescAfter")}
                        </p>
                      </div>
                    </div>
                  )}

                  {latestOrder.payment?.method === "bank_transfer" && (
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <Landmark className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-blue-400 font-bold block">{t("checkout.bankTitle")}</span>
                          <p className="mt-1 leading-relaxed text-text-muted">
                            {t("checkout.bankDesc")}
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface-base/50 p-4.5 rounded-xl border border-border-default grid grid-cols-2 gap-4 text-xs font-sans text-text-secondary">
                        <div>
                          <span className="text-text-muted">{t("checkout.bankBeneficiary")}</span>
                          <p className="text-text-primary font-bold mt-0.5">{t("checkout.bankName")}</p>
                        </div>
                        <div>
                          <span className="text-text-muted">{t("checkout.bankAccount")}</span>
                          <p className="text-yellow-400 font-mono font-bold mt-0.5">{t("checkout.bankAccountValue")}</p>
                        </div>
                        <div>
                          <span className="text-text-muted">{t("checkout.bankHolder")}</span>
                          <p className="text-text-primary font-semibold mt-0.5">{t("checkout.bankHolderValue")}</p>
                        </div>
                        <div>
                          <span className="text-text-muted">{t("checkout.bankNote")}</span>
                          <p className="text-yellow-500 font-mono font-bold mt-0.5">{latestOrder.orderCode}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(latestOrder.payment?.method === "momo" || latestOrder.payment?.method === "vnpay") && (
                    <div className="bg-surface-3 border border-pink-500/20 rounded-2xl p-4.5 flex flex-col items-center gap-4 text-center">
                      <div className="flex items-center gap-2 text-pink-400">
                        <Wallet className="w-5 h-5" />
                        <span className="font-bold">{t("checkout.onlineGatewayTitle", { gateway: latestOrder.payment.method.toUpperCase() })}</span>
                      </div>

                      <p className="text-xs text-text-muted">
                        {t("checkout.onlineGatewayDesc")}
                      </p>

                      {/* Display a beautifully simulated dynamic QR code */}
                      <div className="p-3 bg-white rounded-xl border border-border-default">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${latestOrder.orderCode}`}
                          alt="Simulated Payment QR"
                          className="w-40 h-40 object-contain block"
                        />
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <span className="text-[10px] text-text-muted font-mono block">{t("checkout.onlineGatewayAmount", { amount: latestOrder.totalAmount.toLocaleString("vi-VN"), orderCode: latestOrder.orderCode })}</span>
                        {latestOrder.payment.status === "paid" ? (
                          <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold flex items-center justify-center gap-1.5 text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            {t("checkout.onlineGatewayPaid", { gateway: latestOrder.payment.method.toUpperCase() })}
                          </div>
                        ) : (
                          <button
                            id="btn-simulate-pay"
                            onClick={() => simulatePaymentSuccess(latestOrder.id)}
                            className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            {t("checkout.onlineGatewayConfirmCta")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                <div className="border-t border-border-default mt-6 pt-6 flex sm:flex-row flex-col justify-end gap-3.5">
                  <button
                    onClick={() => {
                      setTrackingQuery(latestOrder.orderCode);
                      executeTrackingQuery();
                      setActiveTab("track");
                    }}
                    className="bg-surface-4 hover:bg-border-strong text-yellow-400 font-bold px-6 py-3 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    {t("checkout.trackCta")}
                  </button>
                  <button
                    onClick={() => {
                      setLatestOrder(null);
                      setActiveTab("home");
                    }}
                    className="bg-yellow-500 text-black font-extrabold px-6 py-3 rounded-xl text-xs hover:bg-yellow-400 transition-all cursor-pointer text-center"
                  >
                    {t("checkout.backHomeCta")}
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 bg-surface-3/40 border border-border-default rounded-3xl">
                <p className="text-text-muted">{t("checkout.noSessionTitle")}</p>
                <button onClick={() => setActiveTab("home")} className="mt-4 bg-yellow-500 text-black px-6 py-2.5 rounded-xl font-bold">
                  {t("checkout.noSessionCta")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: ORDER TRACKING PAGE */}
        {activeTab === "track" && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center sm:text-left">
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{t("track.label")}</span>
              <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight mt-1">{t("track.title")}</h1>
              <p className="text-text-muted text-xs sm:text-sm mt-1">
                {t("track.descBefore")} <code className="font-mono text-yellow-500 bg-surface-3 px-1 py-0.5 rounded">ORD-...</code> {t("track.descAfter")}
              </p>
            </div>

            {/* Input bar */}
            <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                <input
                  type="text"
                  placeholder={t("track.searchPlaceholder")}
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") executeTrackingQuery();
                  }}
                  className="w-full bg-surface-2 text-text-primary font-sans font-semibold placeholder-text-muted pl-11 pr-4 py-3.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
              <button
                id="btn-execute-tracking"
                onClick={() => executeTrackingQuery()}
                disabled={trackingLoader || !trackingQuery.trim()}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-8 py-3.5 rounded-xl text-xs uppercase tracking-wider select-none shrink-0 cursor-pointer disabled:bg-surface-4 disabled:text-text-muted disabled:cursor-not-allowed"
              >
                {trackingLoader ? t("track.searchCtaLoading") : t("track.searchCta")}
              </button>
            </div>

            {/* Tracking Results block */}
            {trackingLoader ? (
              <div className="h-40 bg-surface-2 border border-border-default rounded-2xl animate-pulse flex items-center justify-center text-text-muted">
                {t("track.loaderText")}
              </div>
            ) : searchedTrack && trackingResults.length === 0 ? (
              <div className="bg-surface-3/80 border border-border-default p-10 rounded-2xl text-center max-w-sm mx-auto">
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full w-fit mx-auto mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-text-primary text-base font-extrabold mb-1">{t("track.notFoundTitle")}</h3>
                <p className="text-text-muted text-xs leading-normal">
                  {t("track.notFoundDesc")}
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
                    { key: "pending", label: t("track.stepPending"), desc: t("track.stepPendingDesc") },
                    { key: "processing", label: t("track.stepProcessing"), desc: t("track.stepProcessingDesc") },
                    { key: "printing", label: t("track.stepPrinting"), desc: t("track.stepPrintingDesc") },
                    { key: "shipping", label: t("track.stepShipping"), desc: t("track.stepShippingDesc") },
                    { key: "completed", label: t("track.stepCompleted"), desc: t("track.stepCompletedDesc") }
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
                    <div key={order.id} className="bg-surface-3 border border-border-default hover:border-zinc-800 p-6 rounded-2xl shadow-xl transition-all">
                      
                      {/* Top bar info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-default pb-4 gap-2 mb-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">{t("track.orderCodeLabel")}</span>
                            <span className="text-text-primary font-mono font-black text-sm tracking-wide bg-surface-base/40 px-2 py-0.5 rounded border border-border-default">{order.orderCode}</span>
                          </div>
                          <span className="text-[10px] text-text-muted block mt-1">{t("track.orderDatePrefix")} {new Date(order.createdAt).toLocaleString("vi-VN")}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {order.status === "cancelled" ? (
                            <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                              {t("track.statusCancelled")}
                            </span>
                          ) : (
                            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                              {t("track.statusJourneyPrefix")} {steps[currentStepIdx]?.label.toUpperCase()}
                            </span>
                          )}

                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                            isPaid
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                          }`}>
                            {isPaid ? t("track.paymentPaid") : t("track.paymentUnpaid")}
                          </span>
                        </div>
                      </div>

                      {/* CLIENT TIMELINE STEPPER HIGHLIGHTED IN GOLD */}
                      {order.status !== "cancelled" && (
                        <div className="mb-8 py-4.5 bg-surface-base/40 rounded-2xl border border-border-default/60 px-4">
                          <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                            {/* Horizontal Line connector (for table size) */}
                            <div className="absolute top-4 left-6 right-6 h-0.5 bg-border-default hidden sm:block z-0" />

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
                                        ? "bg-surface-2 border-yellow-500 text-yellow-400"
                                        : "bg-surface-2 border-border-default text-text-muted"
                                  }`}>
                                    {sidx + 1}
                                  </div>

                                  {/* Text */}
                                  <div>
                                    <span className={`text-xs block font-bold ${
                                      isCompletedStep ? "text-text-primary" : "text-text-muted"
                                    }`}>
                                      {st.label}
                                    </span>
                                    <span className="text-[9px] text-text-muted leading-none">{st.desc}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items Details */}
                      <div>
                        <span className="text-text-muted text-xs font-black uppercase tracking-wider block mb-3">{t("track.productsLabel")}</span>
                        {items.map((it: any, iIdx: number) => (
                          <div key={iIdx} className="bg-surface-base/30 border border-border-default/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between shrink-0 gap-4 mb-3">
                            <div className="flex items-start gap-4">
                              <span
                                className="w-5 h-5 rounded-full border border-black/40 shadow shadow-inner shrink-0 mt-0.5"
                                style={{ backgroundColor: it.colorHex }}
                              />
                              <div>
                                <span className="text-text-primary text-sm font-extrabold">{it.product?.name}</span>
                                <div className="text-xs text-text-muted mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span>{t("track.rowPrintName")} <strong className="text-indigo-400 uppercase font-sans">{it.nickname || t("checkout.nicknameMissing")}</strong></span>
                                  <span>{t("track.rowJerseyNum")} <strong className="text-indigo-400 font-mono">{it.jerseyNumber}</strong></span>
                                  <span>{t("track.rowSize")} <strong className="text-text-primary font-mono">{it.size}</strong></span>
                                  <span>{t("track.rowQty")} <strong className="text-text-primary font-mono">{it.quantity}</strong></span>
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
                      <div className="border-t border-border-default mt-4 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                        <div className="text-text-muted">
                          {t("track.receiverPrefix")} <span className="text-text-primary font-bold">{order.customerName}</span> • {t("track.phonePrefix")} <span className="text-text-primary font-semibold">{order.phone}</span> <br />
                          {t("track.addressPrefix")} <span className="text-text-secondary">{order.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-text-muted uppercase block-[10px]">{t("track.totalPrefix")}</span>
                          <span className="text-yellow-400 font-mono font-black text-base">{order.totalAmount.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Simulated Polling notification badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 bg-surface-3 border border-border-default rounded-full px-4 py-1.5 text-[10px] text-text-muted select-none">
                    <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                    {t("track.pollingNotice")}
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
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">{t("roster.label")}</span>
              <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight mt-1 animate-fade-in">{t("roster.title")}</h1>
              <p className="text-text-muted text-xs sm:text-sm mt-1">
                {t("roster.desc")}
              </p>
            </div>

            {/* Sub-tabs header */}
            <div className="flex border-b border-border-default gap-4 mb-8 no-print flex-row-tabs">
              <button
                id="roster-tab-order"
                onClick={() => {
                  setRosterSubTab("order");
                  setRosterSelectedOrder(null);
                  setRosterSearchResults([]);
                  setRosterSearchQuery("");
                }}
                className={`pb-3.5 text-sm font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                  rosterSubTab === "order" ? "text-yellow-400 border-yellow-500" : "text-text-muted border-transparent hover:text-text-primary"
                }`}
              >
                {t("roster.tabOrder")}
              </button>
              <button
                id="roster-tab-draft"
                onClick={() => setRosterSubTab("draft")}
                className={`pb-3.5 text-sm font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-all ${
                  rosterSubTab === "draft" ? "text-yellow-400 border-yellow-500" : "text-text-muted border-transparent hover:text-text-primary"
                }`}
              >
                {t("roster.tabDraft")}
              </button>
            </div>

            {/* TAB CONTENT: ORDER ROSTER EXTRACTION */}
            {rosterSubTab === "order" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Search Panel */}
                <div className="lg:col-span-4 bg-surface-3 border border-border-default p-6 rounded-3xl no-print">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">{t("roster.searchTitle")}</h3>
                  <p className="text-text-muted text-xs mb-5 leading-relaxed">
                    {t("roster.searchDesc")}
                  </p>

                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder={t("roster.searchPlaceholder")}
                        value={rosterSearchQuery}
                        onChange={(e) => setRosterSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRosterSearch();
                        }}
                        className="w-full bg-surface-2 text-text-primary font-sans placeholder-text-muted pl-11 pr-4 py-3.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500 text-xs font-semibold"
                      />
                    </div>

                    <button
                      id="btn-roster-search"
                      onClick={handleRosterSearch}
                      disabled={rosterSearchLoader || !rosterSearchQuery.trim()}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-surface-4 disabled:text-text-muted text-black font-extrabold text-xs uppercase py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {rosterSearchLoader ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          {t("roster.searchCtaLoading")}
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          {t("roster.searchCta")}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Multiple results matching selection */}
                  {rosterSearchResults.length > 1 && !rosterSelectedOrder && (
                    <div className="mt-6 border-t border-border-default pt-5">
                      <span className="text-text-muted text-xs font-bold block mb-3">{t("roster.multipleFound", { count: rosterSearchResults.length })}</span>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {rosterSearchResults.map(order => (
                          <div
                            key={order.id}
                            onClick={() => {
                              setRosterSelectedOrder(order);
                              setRosterCheckedItems({});
                            }}
                            className="bg-surface-2 border border-border-default hover:border-yellow-500/50 p-3 rounded-xl cursor-pointer transition-all text-xs"
                          >
                            <div className="flex justify-between font-mono font-bold text-text-primary mb-1">
                              <span>{order.orderCode}</span>
                              <span className="text-yellow-400">{t("roster.multipleJerseyCount", { count: order.items?.length || 0 })}</span>
                            </div>
                            <div className="text-text-muted">{t("roster.multipleCustomer", { name: order.customerName, phone: order.phone })}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Selector quick link if some order loaded */}
                  {rosterSelectedOrder && rosterSearchResults.length > 1 && (
                    <button
                      onClick={() => setRosterSelectedOrder(null)}
                      className="mt-5 w-full bg-transparent hover:bg-surface-4 text-text-muted border border-border-default font-bold text-[11px] uppercase py-2.5 rounded-lg cursor-pointer transition-all"
                    >
                      {t("roster.backToResults")}
                    </button>
                  )}
                </div>

                {/* Right Side: Printing Sheet Display */}
                <div className="lg:col-span-8 space-y-6">
                  {rosterSelectedOrder ? (
                    <div>
                      {/* Printing Roster Card */}
                      <div id="print-sheet-card" className="print-roster-target bg-surface-3 border border-border-default p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
                        
                        {/* Header for print / screen */}
                        <div className="border-b-2 border-dashed border-border-default pb-6 mb-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                              <h2 className="print-title text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                                <Shirt className="w-6 h-6 text-yellow-500 no-print" />
                                {t("roster.sheetTitle")}
                              </h2>
                              <span className="text-text-muted text-[10px] sm:text-xs">
                                {t("roster.sheetMeta", { date: new Date(rosterSelectedOrder.createdAt).toLocaleDateString("vi-VN") })}
                              </span>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="bg-surface-4 border border-border-default text-yellow-400 font-mono font-bold text-sm px-4 py-1.5 rounded-xl block">
                                {rosterSelectedOrder.orderCode}
                              </span>
                              <span className="text-text-muted text-[10px] mt-1.5 block uppercase font-bold tracking-wider">
                                {t("roster.statusPrefix")} <span className="text-green-400 font-black">{rosterSelectedOrder.status.toUpperCase()}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-xs text-text-muted bg-surface-2/60 p-4 border border-border-default rounded-2xl">
                            <div>
                              <span className="text-text-muted block text-[9px] uppercase font-bold text-yellow-500/80">{t("roster.customerLabel")}</span>
                              <strong className="text-text-primary font-sans">{rosterSelectedOrder.customerName}</strong>
                            </div>
                            <div>
                              <span className="text-text-muted block text-[9px] uppercase font-bold text-yellow-500/80">{t("roster.phoneLabel")}</span>
                              <strong className="text-text-primary font-mono">{rosterSelectedOrder.phone}</strong>
                            </div>
                            <div className="sm:col-span-2 md:col-span-1">
                              <span className="text-text-muted block text-[9px] uppercase font-bold text-yellow-500/80">{t("roster.deliveryAddress")}</span>
                              <span className="text-text-secondary font-sans truncate block" title={rosterSelectedOrder.address}>{rosterSelectedOrder.address}</span>
                            </div>
                            {rosterSelectedOrder.notes && (
                              <div className="sm:col-span-2 md:col-span-3 border-t border-border-default/60 pt-2 mt-2">
                                <span className="text-text-muted block text-[9px] uppercase font-bold text-yellow-500/60">{t("roster.notesLabel")}</span>
                                <span className="text-text-secondary font-sans italic">{rosterSelectedOrder.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Roster print items count stats */}
                        <div className="mb-6">
                          <span className="text-text-primary text-xs font-extrabold uppercase tracking-widest block mb-3">{t("roster.summaryLabel")}</span>
                          <div className="flex flex-wrap gap-2">
                            <div className="print-stat-item bg-surface-2 border border-border-default px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                              <span className="text-text-muted uppercase font-semibold">{t("roster.totalLabel")}</span>
                              <strong className="text-yellow-400 font-mono text-sm">
                                {t("roster.totalUnit", { count: rosterSelectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 })}
                              </strong>
                            </div>

                            {/* Compute sizes dynamic breakdown */}
                            {Object.entries((rosterSelectedOrder.items || []).reduce((acc, it) => {
                              const sz = it.size || "M";
                              acc[sz] = (acc[sz] || 0) + (it.quantity || 1);
                              return acc;
                            }, {} as { [key: string]: number })).map(([sz, count]) => (
                              <div key={sz} className="print-stat-item bg-surface-2 border border-border-default px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                                <span className="text-text-muted uppercase">{t("roster.sizeLabel", { size: sz })}</span>
                                <strong className="text-text-primary font-mono text-sm">{count}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Main Print Manifest Table */}
                        <div className="overflow-x-auto border border-border-default rounded-2xl bg-surface-2/40">
                          <table className="print-table w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-surface-3 border-b border-border-default text-text-muted text-[10px] font-black uppercase tracking-wider">
                                <th className="p-3 w-12 text-center">{t("roster.tableSTT")}</th>
                                <th className="p-3">{t("roster.tablePrintName")}</th>
                                <th className="p-3 w-20 text-center">{t("roster.tableNumber")}</th>
                                <th className="p-3 w-16 text-center">{t("roster.tableSize")}</th>
                                <th className="p-3">{t("roster.tableTeam")}</th>
                                <th className="p-3 w-20 text-center">{t("roster.tableColor")}</th>
                                <th className="p-3 w-24 text-center no-print">{t("roster.tableDone")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default text-xs text-text-primary">
                              {(rosterSelectedOrder.items || []).map((it, idx) => {
                                let labelNickname = (it.nickname || "PLAYER").trim().toUpperCase();
                                return (
                                  <tr
                                    key={it.id}
                                    className={`hover:bg-surface-3/50 transition-colors ${rosterCheckedItems[it.id] ? "opacity-30 line-through bg-surface-2/10" : ""}`}
                                  >
                                    <td className="p-3 font-mono text-center text-text-muted">{idx + 1}</td>
                                    <td className="p-3 font-extrabold uppercase font-sans tracking-wide text-yellow-400 text-sm">
                                      {labelNickname}
                                    </td>
                                    <td className="p-3 font-mono font-black text-center text-text-primary text-base">
                                      {it.jerseyNumber ?? 10}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-block bg-surface-4 border border-border-default text-text-primary px-2 py-0.5 rounded text-[11px] font-mono font-black">
                                        {it.size}
                                      </span>
                                    </td>
                                    <td className="p-3 font-medium text-text-secondary">
                                      {it.product?.name || t("roster.defaultProductName")}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5 justify-center">
                                        <div
                                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                                          style={{ backgroundColor: it.colorHex || "#ffffff" }}
                                        />
                                        <span className="font-mono text-[9px] text-text-muted">{it.colorHex}</span>
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
                                        className="w-4.5 h-4.5 rounded border-border-default bg-surface-base text-yellow-500 focus:ring-yellow-500 cursor-pointer accent-yellow-400"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Printable production disclaimer */}
                        <div className="mt-6 border-t border-border-default pt-4 text-center text-[10px] text-text-muted italic">
                          {t("roster.disclaimer")}
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
                          className="bg-surface-3 hover:bg-surface-4 text-text-secondary border border-border-default px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-2"
                        >
                          {copiedRosterText ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              {t("roster.copyZaloDone")}
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-4 h-4 text-blue-400" />
                              {t("roster.copyZalo")}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleExportRosterToExcel(rosterSelectedOrder.items || [], rosterSelectedOrder.orderCode, rosterSelectedOrder.customerName)}
                          className="bg-surface-3 hover:bg-surface-4 text-text-primary border border-border-default px-5 py-3 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          {t("roster.exportExcel")}
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition-all flex items-center gap-2 shadow-lg"
                        >
                          <Printer className="w-4 h-4 text-black" />
                          {t("roster.printSheet")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-3 border border-border-default rounded-3xl p-12 text-center animate-fade-in">
                      <div className="bg-surface-4/60 p-4 rounded-full w-fit mx-auto mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-text-muted animate-pulse" />
                      </div>
                      <h3 className="text-base font-bold text-text-primary mb-1">{t("roster.emptyTitle")}</h3>
                      <p className="text-text-muted text-xs max-w-sm mx-auto leading-relaxed">
                        {t("roster.emptyDesc")}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: ACTIVE DRAFT CUSTOMIZER ROSTER */}
            {rosterSubTab === "draft" && (
              <div className="bg-surface-3 border border-border-default p-6 sm:p-8 rounded-3xl shadow-xl transition-all">
                <div className="border-b border-border-default pb-5 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-text-primary uppercase flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-500" />
                      {t("roster.draftTitle")}
                    </h2>
                    <p className="text-text-muted text-xs mt-1">
                      {t("roster.draftDesc")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportRosterToExcel(teamRoster)}
                      disabled={teamRoster.length === 0}
                      className="bg-transparent hover:bg-surface-4 disabled:opacity-40 disabled:hover:bg-transparent text-xs text-text-secondary border border-border-default px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      {t("roster.draftExportExcel")}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t("alerts.draftClearConfirm"))) {
                          setTeamRoster([]);
                        }
                      }}
                      disabled={teamRoster.length === 0}
                      className="bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-xs text-red-400 border border-red-500/20 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("roster.draftClear")}
                    </button>
                  </div>
                </div>

                {teamRoster.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-surface-4/60 p-4.5 rounded-full w-fit mx-auto mb-4">
                      <Shirt className="w-7 h-7 text-yellow-500" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary">{t("roster.draftEmptyTitle")}</h3>
                    <p className="text-text-muted text-xs max-w-md mx-auto mt-2 leading-relaxed">
                      {t("roster.draftEmptyDesc")}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                      <button
                        onClick={downloadExcelTemplate}
                        className="bg-surface-2 hover:bg-surface-4 text-text-primary border border-border-default px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        {t("roster.draftDownloadTemplate")}
                      </button>
                      <button
                        onClick={() => {
                          setCustomizeMode("team");
                          setActiveTab("customize");
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {t("roster.draftAddAtStudio")}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Draft Roster Stats */}
                    <div className="mb-6 flex flex-wrap gap-2.5">
                      <div className="bg-surface-2 border border-border-default px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                        <span className="text-text-muted uppercase font-semibold">{t("roster.draftMemberLabel")}</span>
                        <strong className="text-yellow-400 font-mono text-sm">{t("roster.draftMemberUnit", { count: teamRoster.length })}</strong>
                      </div>

                      {/* Compute sizing counts on matching draft */}
                      {Object.entries(teamRoster.reduce((acc, p) => {
                        const sz = p.size || "M";
                        acc[sz] = (acc[sz] || 0) + 1;
                        return acc;
                      }, {} as { [key: string]: number })).map(([sz, count]) => (
                        <div key={sz} className="bg-surface-2 border border-border-default px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
                          <span className="text-text-muted uppercase">{t("roster.sizeLabel", { size: sz })}</span>
                          <strong className="text-text-primary font-mono text-sm">{count}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Table of draft players */}
                    <div className="overflow-x-auto border border-border-default rounded-2xl bg-surface-2/40 mb-6">
                      <table className="w-full text-left border-collapse font-sans">
                        <thead>
                          <tr className="bg-surface-3 border-b border-border-default text-text-muted text-[10px] font-black uppercase tracking-wider">
                            <th className="p-3 w-12 text-center">{t("roster.tableSTT")}</th>
                            <th className="p-3">{t("roster.draftTablePlayerName")}</th>
                            <th className="p-3 w-28 text-center">{t("roster.draftTableNumber")}</th>
                            <th className="p-3 w-28 text-center">{t("roster.draftTableSize")}</th>
                            <th className="p-3 w-16 text-center">{t("roster.draftTableDelete")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default text-xs text-text-primary">
                          {teamRoster.map((player, idx) => (
                            <tr key={player.id} className="hover:bg-surface-3/40 transition-colors">
                              <td className="p-3 font-mono text-center text-text-muted">{idx + 1}</td>
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
                                  className="w-16 bg-surface-base border border-border-default text-center font-mono py-1 rounded text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={player.size}
                                  onChange={(e) => {
                                    setTeamRoster(teamRoster.map(p => p.id === player.id ? { ...p, size: e.target.value as JerseySize } : p));
                                  }}
                                  className="bg-surface-base border border-border-default text-center py-1 rounded w-16 text-xs text-text-secondary focus:outline-none cursor-pointer"
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

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-surface-2/75 p-5 rounded-2xl border border-border-default mt-6 gap-4">
                      <div className="text-text-muted text-xs text-center sm:text-left">
                        <strong className="text-text-secondary mr-1 block sm:inline">{t("roster.draftNextLabel")}</strong>
                        {t("roster.draftNextDesc")}
                      </div>

                      <button
                        onClick={() => {
                          setCustomizeMode("team");
                          setActiveTab("customize");
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 shadow-lg w-full sm:w-auto justify-center"
                      >
                        {t("roster.draftLoadIntoStudio")}
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
            <div className="bg-surface-3 border border-border-default p-8 rounded-3xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl w-fit mx-auto mb-3">
                  <ShieldAlert className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">{t("adminLogin.title")}</h1>
                <p className="text-text-muted text-xs mt-1 leading-normal">
                  {t("adminLogin.subtitle")}
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
                  <label className="text-text-muted text-[10px] font-black uppercase tracking-widest block mb-1.5">{t("adminLogin.emailLabel")}</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourshop.com"
                    className="w-full bg-surface-2 text-text-primary px-4 py-3 rounded-xl border border-border-default focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <p className="text-[10px] text-text-muted mt-1">{t("adminLogin.emailHintPrefix")} <strong className="text-text-secondary">admin@yourshop.com</strong></p>
                </div>

                <div>
                  <label className="text-text-muted text-[10px] font-black uppercase tracking-widest block mb-1.5">{t("adminLogin.passwordLabel")}</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-2 text-text-primary px-4 py-3 rounded-xl border border-border-default focus:outline-none focus:border-blue-500 text-sm text-indigo-300"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-admin-submit"
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center mt-2.5"
                >
                  {t("adminLogin.submit")}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW 7: ADMIN AREA DASHBOARD AND METRICS --- */}
        {activeTab.startsWith("admin-") && isAdminLoggedIn && (
          <div>
            
            {/* ADMIN SUB NAV LINKS BAR */}
            <div className="flex flex-wrap items-center gap-1.5 mb-8 border-b border-border-default pb-4">
              {[
                { tab: "admin-dashboard", label: t("admin.subNavDashboard") },
                { tab: "admin-orders", label: t("admin.subNavOrders") },
                { tab: "admin-products", label: t("admin.subNavProducts") },
                { tab: "admin-customers", label: t("admin.subNavCustomers") }
              ].map((sub) => (
                <button
                  key={sub.tab}
                  onClick={() => setActiveTab(sub.tab as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                    activeTab === sub.tab
                      ? "bg-yellow-500 text-black border-2 border-yellow-500 shadow-md shadow-yellow-500/10"
                      : "bg-surface-3/60 text-text-muted border border-border-default hover:bg-surface-4"
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
                    title={t("admin.statTotalOrders")}
                    value={adminStats?.totalOrders ?? 0}
                    icon={<ShoppingBag className="w-5 h-5" />}
                    subtitle={t("admin.statTotalOrdersSub")}
                    colorClass="text-blue-400"
                  />
                  <StatsCard
                    title={t("admin.statRevenue")}
                    value={`${(adminStats?.revenue ?? 0).toLocaleString("vi-VN")} ₫`}
                    icon={<BadgeDollarSign className="w-5 h-5" />}
                    subtitle={t("admin.statRevenueSub")}
                    colorClass="text-green-400"
                  />
                  <StatsCard
                    title={t("admin.statPending")}
                    value={adminStats?.pendingOrders ?? 0}
                    icon={<Clock className="w-5 h-5" />}
                    subtitle={t("admin.statPendingSub")}
                    colorClass="text-amber-500"
                  />
                  <StatsCard
                    title={t("admin.statCompletedToday")}
                    value={adminStats?.completedToday ?? 0}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    subtitle={t("admin.statCompletedTodaySub")}
                    colorClass="text-pink-400"
                  />
                </div>

                {/* GRAPH SECTION: HIGH-CRAFT PREMIUM CUSTOM INFOGRAPHIC CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Chart 1: Trend Sales Last 7 Days (Line graph styled in customized SVGs with points and grid lines) */}
                  <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block">{t("admin.chartRevenueLabel")}</span>
                      <h3 className="text-text-primary text-base font-bold mt-0.5">{t("admin.chartRevenueTitle")}</h3>
                    </div>

                    <div className="h-60 w-full relative flex items-end justify-between px-2 pt-6 pb-2 bg-surface-base/30 border border-border-default rounded-xl">
                      {/* Grid background markers */}
                      <div className="absolute inset-0 flex flex-col justify-between p-3 select-none pointer-events-none opacity-10">
                        <div className="w-full h-[1px] bg-text-primary text-[8px]"></div>
                        <div className="w-full h-[1px] bg-text-primary"></div>
                        <div className="w-full h-[1px] bg-text-primary"></div>
                        <div className="w-full h-[1px] bg-text-primary"></div>
                      </div>

                      {/* Display daily nodes */}
                      {adminStats?.ordersLast7Days?.map((v: any, itemIdx: number) => {
                        const totalMax = Math.max(...adminStats.ordersLast7Days.map((x: any) => x.amount)) || 100000;
                        const barRatioPercentage = Math.min(100, Math.max(10, (v.amount / totalMax) * 100));

                        return (
                          <div key={itemIdx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group">
                            {/* Hover data card */}
                            <div className="absolute bottom-full mb-1 bg-surface-3 border border-yellow-500/40 text-yellow-400 px-2 py-0.5 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                              {t("admin.chartRevenueTooltip", { amount: v.amount.toLocaleString("vi-VN"), count: v.count })}
                            </div>

                            {/* Solid visual connector column bar (using custom responsive layouts) */}
                            <div 
                              className="w-[12px] sm:w-[16px] rounded-t-md bg-gradient-to-t from-yellow-600 to-yellow-400 shadow shadow-yellow-500/20 group-hover:from-yellow-400 group-hover:to-yellow-300 transition-all cursor-pointer"
                              style={{ height: `${barRatioPercentage}%` }}
                            />

                            <span className="text-[10px] text-text-muted font-bold font-mono">
                              {v.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Popular Squad teams ordered hierarchy (horizontal status bar graphs) */}
                  <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex flex-col gap-4">
                    <div>
                      <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block">{t("admin.chartTeamsLabel")}</span>
                      <h3 className="text-text-primary text-base font-bold mt-0.5">{t("admin.chartTeamsTitle")}</h3>
                    </div>

                    <div className="bg-surface-base/30 border border-border-default rounded-xl p-5 flex flex-col gap-4 h-60 justify-center">
                      {adminStats?.topTeams?.map((team: any, tidx: number) => {
                        const maxCount = Math.max(...adminStats.topTeams.map((x: any) => x.count)) || 1;
                        const computedRatio = (team.count / maxCount) * 100;

                        return (
                          <div key={tidx} className="flex flex-col gap-1.5 group">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-text-primary font-black block group-hover:text-yellow-400 transition-colors">
                                {tidx + 1}. {team.team}
                              </span>
                              <span className="font-mono text-text-muted text-xs font-bold">{t("admin.chartTeamsUnit", { count: team.count })}</span>
                            </div>
                            {/* Horizontal load progress bars */}
                            <div className="w-full bg-surface-4 h-[6.5px] rounded-full overflow-hidden">
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
                <div className="bg-surface-3 border border-border-default p-5 rounded-2xl">
                  <h3 className="text-text-primary text-sm font-extrabold uppercase tracking-widest mb-4">{t("admin.recentOrdersTitle")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-text-muted">
                      <thead className="bg-surface-2 border-b border-border-default text-text-muted uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">{t("admin.tableOrderCode")}</th>
                          <th className="px-4 py-3">{t("admin.tableCustomer")}</th>
                          <th className="px-4 py-3">{t("admin.tableTotal")}</th>
                          <th className="px-4 py-3">{t("admin.tableDate")}</th>
                          <th className="px-4 py-3">{t("admin.tableStatus")}</th>
                          <th className="px-4 py-3 text-right">{t("admin.tableActionsHead")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-surface-4 transition-colors font-medium">
                            <td className="px-4 py-3 font-mono font-bold text-yellow-400">{ord.orderCode}</td>
                            <td className="px-4 py-3 text-text-primary">
                              <div>{ord.customerName}</div>
                              <div className="text-[10px] text-text-muted">{ord.phone}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-text-secondary font-bold">{ord.totalAmount.toLocaleString("vi-VN")} ₫</td>
                            <td className="px-4 py-3 text-text-muted">{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</td>
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
                                className="text-[10px] bg-surface-4 hover:bg-border-strong text-text-primary py-1 px-3.5 border border-border-default rounded-lg cursor-pointer transition-colors"
                              >
                                {t("admin.viewDetails")}
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
              <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
                  <div>
                    <h2 className="text-text-primary text-base font-black uppercase tracking-widest">{t("admin.ordersTitle")}</h2>
                    <p className="text-text-muted text-xs mt-0.5">{t("admin.ordersDesc")}</p>
                  </div>

                  <button
                    id="btn-excel-export"
                    onClick={handleExportOrders}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                    {t("admin.exportExcel")}
                  </button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-base/30 p-4 border border-border-default/80 rounded-2xl">
                  {/* Search inputs */}
                  <div>
                    <label className="text-text-muted text-[9px] font-black uppercase block mb-1.5">{t("admin.filterKeyword")}</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder={t("admin.filterKeywordPlaceholder")}
                        value={adminOrderSearch}
                        onChange={(e) => setAdminOrderSearch(e.target.value)}
                        className="w-full bg-surface-2 text-text-primary placeholder-text-muted pl-9 pr-4 py-2 rounded-xl text-xs border border-border-default focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Status Dropdowns */}
                  <div>
                    <label className="text-text-muted text-[9px] font-black uppercase block mb-1.5">{t("admin.filterStatus")}</label>
                    <select
                      value={adminOrderFilterStatus}
                      onChange={(e) => setAdminOrderFilterStatus(e.target.value)}
                      className="w-full bg-surface-2 text-text-primary px-3 py-2 rounded-xl text-xs border border-border-default cursor-pointer focus:outline-none focus:border-yellow-500"
                    >
                      <option value="all">{t("admin.filterStatusAll")}</option>
                      <option value="pending">{t("admin.statusOptPending")}</option>
                      <option value="processing">{t("admin.statusOptProcessing")}</option>
                      <option value="printing">{t("admin.statusOptPrinting")}</option>
                      <option value="shipping">{t("admin.statusOptShipping")}</option>
                      <option value="completed">{t("admin.statusOptCompleted")}</option>
                      <option value="cancelled">{t("admin.statusOptCancelled")}</option>
                    </select>
                  </div>

                  {/* Payment Filters */}
                  <div>
                    <label className="text-text-muted text-[9px] font-black uppercase block mb-1.5">{t("admin.filterPayment")}</label>
                    <select
                      value={adminOrderFilterPayment}
                      onChange={(e) => setAdminOrderFilterPayment(e.target.value)}
                      className="w-full bg-surface-2 text-text-primary px-3 py-2 rounded-xl text-xs border border-border-default cursor-pointer focus:outline-none focus:border-yellow-500"
                    >
                      <option value="all">{t("admin.filterPaymentAll")}</option>
                      <option value="cod">{t("admin.paymentOptCod")}</option>
                      <option value="bank_transfer">{t("admin.paymentOptBank")}</option>
                      <option value="momo">{t("admin.paymentOptMomo")}</option>
                      <option value="vnpay">{t("admin.paymentOptVnpay")}</option>
                    </select>
                  </div>

                  {/* Bulk Actions Console */}
                  <div>
                    <label className="text-text-muted text-[9px] font-black uppercase block mb-1.5">{t("admin.bulkActionsLabel", { count: selectedOrderIds.length })}</label>
                    <div className="flex gap-2">
                      <select
                        value={bulkStatusValue}
                        onChange={(e) => setBulkStatusValue(e.target.value)}
                        className="flex-grow bg-surface-2 text-text-primary px-3 py-2 rounded-xl text-[11px] border border-border-default cursor-pointer"
                        disabled={selectedOrderIds.length === 0}
                      >
                        <option value="">{t("admin.bulkActionsPlaceholder")}</option>
                        <option value="processing">{t("admin.bulkStatusProcessing")}</option>
                        <option value="printing">{t("admin.bulkStatusPrinting")}</option>
                        <option value="shipping">{t("admin.bulkStatusShipping")}</option>
                        <option value="completed">{t("admin.statusOptCompleted")}</option>
                        <option value="cancelled">{t("admin.statusOptCancelled")}</option>
                      </select>
                      <button
                        onClick={handleBulkStatusUpdate}
                        disabled={selectedOrderIds.length === 0 || !bulkStatusValue}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-4.5 py-2 rounded-xl text-xs font-black disabled:bg-surface-4 disabled:text-text-muted disabled:cursor-not-allowed cursor-pointer"
                      >
                        {t("admin.bulkUpdate")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders spreadsheet grid */}
                <div className="overflow-x-auto border border-border-default rounded-xl">
                  <table className="w-full text-xs text-left text-text-muted min-w-[900px]">
                    <thead className="bg-surface-2 border-b border-border-default text-text-muted uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                            onChange={handleSelectAllOrders}
                            className="w-3.5 h-3.5 accent-yellow-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3.5">{t("admin.tableOrderCode")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTableCustomer")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTablePrintName")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTableTeam")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTableSize")}</th>
                        <th className="px-4 py-3.5">{t("admin.tableTotal")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTablePayment")}</th>
                        <th className="px-4 py-3.5">{t("admin.ordersTableStatus")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {orders.map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        const item = ord.items?.[0]; // single item schema
                        
                        return (
                          <tr key={ord.id} className={`hover:bg-surface-4 transition-colors ${isSelected ? "bg-yellow-500/5" : ""}`}>
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
                              <span className="text-[10px] text-text-muted block">{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</span>
                            </td>
                            <td className="px-4 py-3 text-text-primary">
                              <p className="font-bold">{ord.customerName}</p>
                              <p className="font-mono text-text-muted text-[10px]">{ord.phone}</p>
                              <p className="text-[9px] text-text-muted line-clamp-1 max-w-[150px]" title={ord.address}>{ord.address}</p>
                            </td>
                            <td className="px-4 py-3 text-text-primary uppercase font-sans font-bold">
                              {item ? (
                                <div>
                                  <span className="text-indigo-400 text-xs tracking-wider block">{item.nickname || "DRAFT"}</span>
                                  <span className="text-text-muted text-[10px] font-mono block">{t("admin.ordersTablePrintNum")} {item.jerseyNumber}</span>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-text-secondary">
                              {item?.product?.teamCountry || "N/A"}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span className="font-mono text-yellow-500 font-extrabold text-xs block">{item?.size || t("admin.dashboardSize")}</span>
                              <span className="text-text-muted text-[10px] block font-medium">{t("admin.ordersTableSizeQty")} {item?.quantity || 1}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-text-secondary font-extrabold font-bold">
                              {ord.totalAmount.toLocaleString("vi-VN")} ₫
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{ord.payment?.method}</span>
                                <select
                                  value={ord.payment?.status || "pending"}
                                  onChange={(e) => handleUpdateOrderPaymentStatus(ord.id, e.target.value as PaymentStatus)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg outline-none cursor-pointer bg-surface-base/40 border border-border-default ${
                                    ord.payment?.status === "paid"
                                      ? "text-green-400 border-green-500/20 bg-green-500/5"
                                      : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                  }`}
                                >
                                  <option value="pending">{t("admin.paymentStatusPending")}</option>
                                  <option value="paid">{t("admin.paymentStatusPaid")}</option>
                                  <option value="failed">{t("admin.paymentStatusFailed")}</option>
                                  <option value="refunded">{t("admin.paymentStatusRefunded")}</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className={`text-[10px] uppercase font-black px-2.5 py-1.5 rounded-lg border bg-surface-base/40 outline-none cursor-pointer ${
                                  ord.status === "completed"
                                    ? "text-green-400 border-green-500/20 bg-green-500/5"
                                    : ord.status === "shipping"
                                      ? "text-orange-400 border-orange-500/20 bg-orange-500/5"
                                      : ord.status === "cancelled"
                                        ? "text-red-500 border-red-500/20 bg-red-500/5"
                                        : "text-blue-400 border-blue-500/20 bg-blue-500/5"
                                }`}
                              >
                                <option value="pending">{t("admin.statusPENDING")}</option>
                                <option value="processing">{t("admin.statusPROCESSING")}</option>
                                <option value="printing">{t("admin.statusPRINTING")}</option>
                                <option value="shipping">{t("admin.statusSHIPPING")}</option>
                                <option value="completed">{t("admin.statusCOMPLETED")}</option>
                                <option value="cancelled">{t("admin.statusCANCELLED")}</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className="text-center py-12 text-text-muted font-bold border border-border-default rounded-xl">
                    {t("admin.ordersEmpty")}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: PRODUCTS SEEDING & CRUD */}
            {activeTab === "admin-products" && (
              <div className="flex flex-col gap-6">
                
                <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h2 className="text-text-primary text-base font-black uppercase tracking-widest">{t("admin.productsTitle")}</h2>
                    <p className="text-text-muted text-xs mt-0.5">{t("admin.productsDesc")}</p>
                  </div>

                  <button
                    onClick={() => handleOpenProductForm(null)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    {t("admin.addProduct")}
                  </button>
                </div>

                {/* MODAL SHEET INLINE (Simple Form Overlay for compatibility) */}
                {isProductModalOpen && (
                  <div className="fixed inset-0 z-55 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in animate-duration-150">
                    <div className="bg-surface-3 border border-border-default rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                      <button
                        onClick={() => setIsProductModalOpen(false)}
                        className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-2 border border-border-default rounded-lg bg-surface-base/40 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <h3 className="text-text-primary text-lg font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-yellow-500" />
                        {editingProduct ? t("admin.productModalEdit") : t("admin.productModalAdd")}
                      </h3>

                      <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-xs">
                        <div>
                          <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormName")}</label>
                          <input
                            type="text"
                            required
                            value={prodFormName}
                            onChange={(e) => setProdFormName(e.target.value)}
                            placeholder="Argentina Home 2026 Special Edition"
                            className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none focus:border-yellow-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormTeam")}</label>
                            <input
                              type="text"
                              required
                              value={prodFormTeam}
                              onChange={(e) => setProdFormTeam(e.target.value)}
                              placeholder="Vietnam 🇻🇳"
                              className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormType")}</label>
                            <select
                              value={prodFormType}
                              onChange={(e) => setProdFormType(e.target.value as JerseyType)}
                              className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default"
                            >
                              <option value="home">{t("admin.productTypeHome")}</option>
                              <option value="away">{t("admin.productTypeAway")}</option>
                              <option value="third">{t("admin.productTypeThird")}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormPrice")}</label>
                            <input
                              type="number"
                              required
                              value={prodFormPrice}
                              onChange={(e) => setProdFormPrice(e.target.value)}
                              placeholder="390000"
                              className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default"
                            />
                          </div>

                          <div>
                            <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormStock")}</label>
                            <input
                              type="number"
                              required
                              value={prodFormStock}
                              onChange={(e) => setProdFormStock(e.target.value)}
                              className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-text-muted font-extrabold uppercase tracking-widest block mb-1">{t("admin.productFormImage")}</label>
                          <input
                            type="text"
                            value={prodFormImage}
                            onChange={(e) => setProdFormImage(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-surface-2 text-text-primary px-3.5 py-2.5 rounded-xl border border-border-default"
                          />
                        </div>

                        <div className="flex justify-end gap-3.5 mt-4">
                          <button
                            type="button"
                            onClick={() => setIsProductModalOpen(false)}
                            className="bg-surface-4 text-text-secondary px-4 py-2.5 rounded-xl hover:bg-border-strong font-bold cursor-pointer"
                          >
                            {t("admin.productFormCancel")}
                          </button>
                          <button
                            type="submit"
                            className="bg-yellow-500 text-black px-6 py-2.5 rounded-xl hover:bg-yellow-400 font-extrabold cursor-pointer"
                          >
                            {t("admin.productFormSubmit")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Grid Lists products */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <div key={p.id} className={`bg-surface-3 border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between ${p.isActive ? "border-border-default" : "border-red-500/20 opacity-40 bg-surface-base"}`}>

                      <div className="relative aspect-square">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-black/80 border border-border-default text-yellow-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                            {p.jerseyType.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-text-muted block uppercase mb-1">{p.teamCountry}</span>
                          <span className="text-text-primary text-xs sm:text-sm font-bold block leading-snug line-clamp-2">{p.name}</span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center text-xs font-mono mb-3 leading-none">
                            <span className="text-yellow-400 font-bold">{p.price.toLocaleString("vi-VN")} ₫</span>
                            <span className="text-text-muted text-[10px]">{t("admin.productStock")} {p.stock}</span>
                          </div>

                          {/* Quick modifier controls button bars */}
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border-default">
                            <button
                              onClick={() => handleOpenProductForm(p)}
                              className="bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white p-2 border border-blue-500/15 rounded-lg flex items-center justify-center transition-colors"
                              title={t("admin.productEdit")}
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
                              title={p.isActive ? t("admin.productSuspend") : t("admin.productActivate")}
                            >
                              {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-2 border border-red-500/15 rounded-lg flex items-center justify-center transition-colors"
                              title={t("admin.productDelete")}
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
              <div className="bg-surface-3 border border-border-default p-5 rounded-2xl flex flex-col gap-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
                  <div>
                    <h2 className="text-text-primary text-base font-black uppercase tracking-widest">{t("admin.customersTitle")}</h2>
                    <p className="text-text-muted text-xs mt-0.5">{t("admin.customersDesc")}</p>
                  </div>

                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder={t("admin.customersSearchPlaceholder")}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-surface-2 text-text-primary placeholder-text-muted pl-10 pr-4 py-2 rounded-xl text-xs border border-border-default focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                {/* Customers database expanders table representation */}
                <div className="overflow-x-auto border border-border-default rounded-xl">
                  <table className="w-full text-xs text-left text-text-muted">
                    <thead className="bg-surface-2 border-b border-border-default text-text-muted uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">{t("admin.customersColName")}</th>
                        <th className="px-5 py-3.5">{t("admin.customersColPhone")}</th>
                        <th className="px-5 py-3.5 text-center">{t("admin.customersColTotal")}</th>
                        <th className="px-5 py-3.5">{t("admin.customersColSpent")}</th>
                        <th className="px-5 py-3.5">{t("admin.customersColLast")}</th>
                        <th className="px-5 py-3.5 text-center">{t("admin.customersColActions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {adminCustomers.map((cust) => {
                        const isExpanded = expandedCustomerPhone === cust.phone;
                        const hasRepeatOrder = cust.totalOrders > 1;

                        return (
                          <>
                            <tr key={cust.phone} className={`hover:bg-surface-4 transition-colors leading-normal ${isExpanded ? "bg-surface-4/60" : ""}`}>
                              <td className="px-5 py-3.5 text-text-primary font-bold flex items-center gap-2">
                                {cust.name}
                                {hasRepeatOrder && (
                                  <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    {t("admin.customersBadgeLoyal")}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-text-secondary font-bold">{cust.phone}</td>
                              <td className="px-5 py-3.5 text-center font-bold font-mono">{t("admin.customersOrdersUnit", { count: cust.totalOrders })}</td>
                              <td className="px-5 py-3.5 font-mono text-yellow-400 font-bold text-sm">
                                {cust.totalSpent.toLocaleString("vi-VN")} ₫
                              </td>
                              <td className="px-5 py-3.5 text-text-muted text-[10px]">
                                {new Date(cust.lastOrderDate).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button
                                  onClick={() => {
                                    setExpandedCustomerPhone(isExpanded ? null : cust.phone);
                                  }}
                                  className="text-[10px] bg-surface-4 hover:bg-border-strong text-text-primary py-1 px-3 border border-border-default rounded-lg cursor-pointer transition-colors"
                                >
                                  {isExpanded ? t("admin.customersCollapse") : t("admin.customersExpand")}
                                </button>
                              </td>
                            </tr>

                            {/* EXPANDE REPRESENTS:past buy listing for this person's number */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-surface-base/60 px-6 py-4 border-l-4 border-yellow-500">
                                  <div className="flex flex-col gap-3">
                                    <span className="text-text-muted text-[10px] font-black uppercase tracking-widest block">{t("admin.customersHistoryLabel")}</span>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {orders
                                        .filter(o => o.phone.trim() === cust.phone.trim())
                                        .map((orderItem) => (
                                          <div key={orderItem.id} className="bg-surface-3/80 border border-border-default rounded-xl p-4 flex items-center justify-between text-xs">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-yellow-500">{orderItem.orderCode}</span>
                                                <span className="text-text-muted text-[10px]">{new Date(orderItem.createdAt).toLocaleDateString("vi-VN")}</span>
                                              </div>
                                              <p className="text-text-primary font-medium mt-1">
                                                {t("admin.customersHistoryPrintLabel")} <strong className="text-indigo-400 capitalize">{orderItem.items?.[0]?.nickname || t("admin.customersHistoryEmpty")}</strong> {t("admin.customersHistoryNumber")} {orderItem.items?.[0]?.jerseyNumber || 10})
                                              </p>
                                              <span className="text-[10px] uppercase text-text-muted block mt-1">{t("admin.customersHistoryStatusPrefix")} {orderItem.status} ({orderItem.payment?.status})</span>
                                            </div>

                                            <div className="text-right">
                                              <span className="text-text-primary font-mono font-bold block">{orderItem.totalAmount.toLocaleString("vi-VN")} ₫</span>
                                              <button
                                                onClick={() => {
                                                  setAdminOrderSearch(orderItem.orderCode);
                                                  setActiveTab("admin-orders");
                                                }}
                                                className="text-[9px] text-blue-400 hover:underline mt-1 block"
                                              >
                                                {t("admin.customersHistoryViewOrder")}
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
                  <div className="text-center py-12 text-text-muted font-bold border border-border-default rounded-xl">
                    {t("admin.customersEmpty")}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-surface-1 border-t border-border-default py-12 px-6 sm:px-8 text-xs sm:text-sm text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center sm:text-left">

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-text-primary font-bold tracking-wider font-display uppercase">{t("footer.brand")}</span>
            </div>
            <p className="text-text-muted text-xs mt-1">
              {t("footer.desc")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-text-muted text-sm mt-4 border-t border-border-default/40 pt-4">
            <span className="hover:text-yellow-400 cursor-pointer transition-colors">{t("footer.contactZalo")}</span>
            <span className="text-text-muted hidden sm:inline">|</span>
            <a href="https://www.facebook.com/dannguyentien22/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 cursor-pointer transition-colors text-blue-400 hover:underline">{t("footer.contactFb")}</a>
            <span className="text-text-muted hidden sm:inline">|</span>
            <span
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveTab("admin-dashboard");
                } else {
                  setActiveTab("admin-login");
                }
              }}
              className="text-text-muted hover:text-yellow-500 font-semibold hover:underline cursor-pointer select-none transition-colors"
            >
              {t("footer.managedBy")}
            </span>
          </div>

          <p className="text-[11px] text-text-muted tracking-wide font-mono">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

      {/* Back to Top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-400 text-black p-3.5 rounded-xl border border-yellow-600/40 shadow-xl shadow-yellow-500/25 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center duration-300"
          title={t("ui.backToTop")}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
