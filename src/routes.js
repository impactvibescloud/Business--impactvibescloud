import React from "react";

//  DashBoard
const Change_Password = React.lazy(() =>
  import("./views/pages/register/Change_password")
);

import EditProfile from "./views/Profile/EditProfile";
const Dashboard = React.lazy(() => import("./views/dashboard/Dashboard"));
import Socialmedia from "./views/configuration/Socialmedia.js";
import Address from "./views/configuration/Address.js";
import Logo from "./views/configuration/Logo.js";
import Login from "./views/pages/login/Login";

// Missing Components Imports
import Templates from "./views/Templates/Templates";
import UsersTeams from "./views/UsersTeams/UsersTeams";
// Import the correct VirtualNumbers component
import VirtualNumbers from "./views/VirtualNumbers/VirtualNumbers";
import Billing from "./views/Billing/Billing";
import ReportsAnalytics from "./views/ReportsAnalytics/ReportsAnalytics";
import Payments from "./views/Payments/Payments";
import Settings from "./views/Settings/Settings";


//Businesses

import Products from "./views/Products/Products";
//product
import AddProduct from "./views/Products/AddProduct";
import EditProduct from "./views/Products/EditProduct";
import ViewProduct from "./views/Products/ViewProduct";
//product manual
import ProductManual from "./views/ProductManual/ProductManual";
//Order Management
import NewOrders from "./views/orders/NewOrders.js";
import ProcessingOrders from "./views/orders/ProcessingOrders.js";
import DispatchedOrders from "./views/orders/DispatchedOrders.js";
import DeliveredOrders from "./views/orders/DeliveredOrders.js";
import CancelledOrders from "./views/orders/CancelledOrders.js";
import ReturnedOrders from "./views/orders/ReturnedOrders.js";
import AddOrder from "./views/orders/AddOrder";
import EditOrder from "./views/orders/EditOrder";
import ViewOrders from "./views/orders/ViewOrders"; 

import ApplicationName from "./views/configuration/ApplicationName";
import CopyrightMessage from "./views/configuration/CopyrightMessage";

import AddSeoRequest from "./views/seo/AddSeoRequest";

import Testimonials from "./views/Testimonials/Testimonials";
import AddTestimonial from "./views/Testimonials/AddTestimonial";
import ViewTestimonial from "./views/Testimonials/ViewTestimonial";
import Policies from "./views/configuration/Policies/Policies";
////purpose
import Purpose from "./views/configuration/Purpose/Purpose";
import AddPurpose from "./views/configuration/Purpose/AddPurpose";
//language
import Languages from "./views/configuration/Language/Languages";
import AddLanguage from "./views/configuration/Language/AddLanguage";
import EditLanguage from "./views/configuration/Language/EditLanguage";
//BusinessType
import BusinessType from "./views/configuration/Business_Type/Business";
import AddBusinessType from "./views/configuration/Business_Type/AddBusiness";
import EditBusinessType from "./views/configuration/Business_Type/EditLanguage";
import EditPurpose from "./views/configuration/Purpose/EditPurpose.js";
import ViewAppointment from "./views/Appointments/ViewAppointment";
import EditAppointment from "./views/Appointments/EditAppointment";
import AddNewAppointment from "./views/Appointments/AddNewAppointment";

import Campaign from "./views/Campaigns/Campaign.js";
import AddCampaign from "./views/Campaigns/AddCampaign.js";
import Categories from "./views/Categories/categories";
import Brands from "./views/Brands/Brands";
import Content from "./views/Content/content";

import EditPrivacyPolicy from "./views/Content/editPrivacyPolicy";
import EditTermsConditions from "./views/Content/editTermsConditions";
import EditShippingPolicy from "./views/Content/editShippingPolicy";
import EditRefundpolicy from "./views/Content/editRefundPolicy";
import EditAboutUs from "./views/Content/editAboutUs";

// import editPrincipalDistributorAddress from "./views/customerDetails/editPrincipalDistributorAddress";
// import AddUserAddress from "./views/customerDetails/addUserAddress";
import viewDetails from "./views/Outlet/viewDetails";
import Design from "./views/Design/design";
import RegisterImage from "./views/Images/RegisterImage";
import LoginImage from "./views/Images/LoginImage";
//Affiliate
import Coupons from "./views/Affiliate/Coupons";
import Affiliates from "./views/Affiliate/Affiliates";
import CreateCoupon from "./views/Affiliate/CreateCoupon";
import CreateAffiliate from "./views/Affiliate/CreateAffiliate";
import EditAffiliate from "./views/Affiliate/EditAffiliate";
import EditCoupon from "./views/Affiliate/EditCoupon";
import PayAffiliate from "./views/Affiliate/PayAffiliate";
import AffiliateHistory from "./views/Affiliate/AffiliateHistory";
import CouponHistory from "./views/Affiliate/CouponHistory";
import EditTestimonial from "./views/Testimonials/EditTestimonial";
//Blogs
import Blogs from "./views/Blog/Blogs";
import CreateBlog from "./views/Blog/CreateBlog";
import users from "./views/Users/users";
import UpdateBlog from "./views/Blog/EditBlog";
import ViewBlog from "./views/Blog/ViewBlog";
import principalDistributor from "./views/Outlet/principalDistributor";
import SinglePrincipalDistributorAllDetails from "./views/Outlet/singlePrincipalDistributorAllDetails";

import { element } from "prop-types";
import addPrincipalDistributor from "./views/Outlet/addPrincipalDistributor";
import InStoreCashOrders from "./views/orders/InStoreCashOrders";

import InStoreQRCodeOrders from "./views/orders/InStoreQRCodeOrders";
import Employee from "./views/EmployeeAccess/Employee";
import AddEmployee from "./views/EmployeeAccess/addEmployee";
import EditEmployee from "./views/EmployeeAccess/editEmployee";
import Currency from "./views/configuration/Currency";

import AddMultipleProduct from "./views/Products/AddMultipleProducts";
import AddMultiplePd from "./views/Outlet/AddMultiplePD";

import ViewProductManual from "./views/ProductManual/SingleProductManual";

import ViewRetailDistributorPD from "./views/Outlet/ViewRetailDistributorPD";

import PendingOrders from "./views/orders/pendingOrders";
import ViewInvoices from "./views/orders/viewInoices";

import Announcements from "./views/Announcment/announcement";
import CreateAnnouncement from "./views/Announcment/createAnnouncement";
import TodayTask from "./views/Tasks/TodayTasks";

import MobileApp from "./views/configuration/MobileApp";

import OpeningInventoryReports from "./views/Reports/OpeningInventoryReports";
import StockReports from "./views/Reports/StockReports ";
import Transporter from "./views/Transporter/Transporter";
import Menu from "./views/Menu/menu";
import AddMenu from "./views/Menu/addMenu";
import EditMenuPage from "./views/Menu/editMenu";
import FranchiseOrders from "./views/FranchiseeOrders/franchiseOrders";
import ViewDetails from "./views/FranchiseeOrders/viewDetails";
import MenuCategories from "./views/Menu-Category/menu-category";
import videos from "./views/video/Video";
import AddProductsOutlet from "./views/Outlet/AddProductsOutlet";
import Equipment from './views/Equipment/equipment';
import AddEquipmentsOutlet from "./views/Outlet/AddEquipmentsOutlet";
import Branches from "./views/Branches/Branches";
import CallLogs from './views/CallLogs/CallLogs';
import { ContactList, ContactLists, Contacts } from "./views/Contacts";
import AutodialCampaigns from "./views/Campaigns/AutodialCampaigns";
import SurveyCampaigns from "./views/Campaigns/SurveyCampaigns";

const routes = [
  //dashboard

  { path: "/dashboard", name: "Dashboard", element: Dashboard, navName: "" },
  {
    path: "/change_password",
    name: "Change Password",
    element: Change_Password,
    navName: "",
  },
  {
    path: "/profile/edit",
    name: "Edit Profile",
    element: EditProfile,
    navName: "",
  },
  // { path: '/profile', name: 'Profile', element: Profile },
  //-----------------------Product Management Routes------------------------------------------------
  {
    path: "/products",
    name: "products",
    element: Products,
    navName: "Product Management",
  },
  {
    path: "/product/add",
    name: "Add products",
    element: AddProduct,
    navName: "Product Management",
  },
  {
    path: "/product/add/multiple",
    name: "Add products",
    element: AddMultipleProduct,
    navName: "Product Management",
  },
  {
    path: "/product/edit/:id",
    name: "Edit products",
    element: EditProduct,
    navName: "Product Management",
  },
  {
    path: "/product/view/:id",
    name: "view products",
    element: ViewProduct,
    navName: "Product Management",
  },
  {
    path: "/categories",
    name: "Categories",
    element: Categories,
    navName: "Product Management",
  },
  {
    path: "/brands",
    name: "Brands",
    element: Brands,
    navName: "Product Management",
  },
  {
    path: "/product-manual",
    name: "Product Manual",
    element: ProductManual,
    navName: "Product Management",
  },
  {
    path: "/product-manual/view/:id",
    name: "Product Manual",
    element: ViewProductManual,
    navName: "Product Management",
  },

  //Tasks
  {
    path: "/task/today",
    name: "Today's Tasks",
    element: TodayTask,
    navName: "Tasks",
  },
  // RetailDistributor

  //----------------------- End Product Management Routes------------------------------------------------
  //---------------Reports------------
  {
    path: "/reports/opening-inventory",
    name: "Reports Opening Inventory",
    element: OpeningInventoryReports,
    navName: "Reports",
  },
  {
    path: "/reports/stock",
    name: "Reports Stock",
    element: StockReports,
    navName: "Reports",
  },
  //-----------------End Reports------------------
  //Departure
  // { path: "/departures", name: "Departures", element: Departures },
  // { path: "/departure/add", name: "Add Departure", element: AddDeparture },
  // { path: "/product/edit/:id", name: "Edit products", element: EditProduct },
  // { path: "/product/view/:id", name: "view products", element: ViewProduct },

  // Appointments
  // { path: "/appointments", name: "Appointments", element: Appointments },
  // {
  //   path: "/appointment/view/:id",
  //   name: "View Appointment",
  //   element: ViewAppointment,
  // },
  // {
  //   path: "/appointment/edit/:id",
  //   name: "Edit Appointment",
  //   element: EditAppointment,
  // },
  // {
  //   path: "/appointment/new",
  //   name: "Add Appointment",
  //   element: AddNewAppointment,
  // },
  //------------------customers Route-------------------------
  {
    path: "/franchisee",
    name: "PrincipalDistributor",
    element: principalDistributor,
    navName: "PrincipalDistributor",
  },
  {
    path: "/franchisee/:_id",
    name: "PrincipalDistributor",
    element: SinglePrincipalDistributorAllDetails,
    navName: "PrincipalDistributor",
  },
  {
    path: "/add-principal-distributor",
    name: "PrincipalDistributor",
    element: addPrincipalDistributor,
    navName: "PrincipalDistributor",
  },
  {
    path: "/add-principal-distributor/multiple",
    name: "PrincipalDistributor",
    element: AddMultiplePd,
    navName: "PrincipalDistributor",
  },
  {
    path: "/view/mappedretaildistributor/:id",
    name: "view retail distributor",
    element: ViewRetailDistributorPD,
    navName: "PrincipalDistributor",
  },
  // Menu
  {
    path: "/menu",
    name: "Menu",
    element: Menu,
    navName: "Menu",
  },
  {
    path: "/add-menu",
    name: "Menu",
    element: AddMenu,
    navName: "Menu",
  },
  {
    path: "/edit-item/:id",
    name: "Menu",
    element: EditMenuPage,
    navName: "Menu",
  },
  {
    path: "/menu-categories",
    name: "Categories",
    element: MenuCategories,
    navName: "Menu",
  },
  {
    path: "/order-history",
    name: "Order history",
    element: FranchiseOrders,
    navName: "Order history",
  },
  {
    path: "/order-history/:id",
    name: "Order history",
    element: ViewDetails,
    navName: "Order history",
  },

  //video uploading routes
  // {
  //   path: "/upload-video",
  //   name: "Upload Video",
  //   element: UploadVideo,
  //   navName: "Upload Video",
  // },
  // {
  //   path: "/edit-video/:id",
  //   name: "Edit Video",
  //   element: EditVideo,
  //   navName: "Edit Video",
  // },
  {
    path: "/videos",
    name: "videos",
    element: videos,
    navName: "Videos",
  },

  //Inventory

  //Sales

  //------------------ End customers Route-------------------------

  // {
  //   path: "/users-address/add",
  //   name: "User Address",
  //   element: AddUserAddress,
  // },
  // {
  //   path: "/users-address/edit/:id",
  //   name: "Edit user address",
  //   element: editPrincipalDistributorAddress,
  // },
  {
    path: "/users-address/view",
    name: "Customers",
    element: viewDetails,
  },
  {
    path: "/franchisee/products/:id",
    name: "Outlet Products",
    element: AddProductsOutlet,
  },

  // health care providers
  // {
  //   path: "//users",
  //   name: "healthcare providers",
  //   element: Businesses,
  // },
  // {
  //   path: "//users/add",
  //   name: "Add healthcare providers",
  //   element: AddBusiness,
  // },
  // {
  //   path: "/users/edit/:id",
  //   name: "Edit healthcare providers",
  //   element: EditBusiness,
  // },
  // {
  //   path: "/users/view/:id",
  //   name: "view healthcare providers",
  //   element: ViewHealthCareProvider,
  // },
  // Categories

  // Design
  // {
  //   path: "/design",
  //   name: "Design",
  //   element: Design,
  // },
  // {
  //   path: "/campaigns",
  //   name: "campaigns",
  //   element: Campaign,
  // },
  // {
  //   path: "/campaign/add",
  //   name: "Add Campaigns",
  //   element: AddCampaign,
  // },
  // {
  //   path: "/campaigns/edit/:id",
  //   name: "Edit healthcare providers",
  //   element: EditBusiness,
  // },
  // {
  //   path: "/campaigns/view/:id",
  //   name: "view healthcare providers",
  //   element: ViewHealthCareProvider,
  // },

  // { path: '/franchisee/view/:id', name: 'view franchisee', element: ViewFra },

  // { path: '/complaint/view/:id', name: 'view Complain', element: ViewComplaint },
  //Complaints

  //-------------------------------website related routes----------------------------------
  {
    path: "/registerImage",
    name: "RegisterImage",
    element: RegisterImage,
    navName: "Website Related",
  },

  {
    path: "/loginImage",
    name: "LoginImage",
    element: LoginImage,
    navName: "Website Related",
  },
  {
    path: "/testimonials",
    name: "Testimonials",
    element: Testimonials,
    navName: "Website Related",
  },

  {
    path: "/currency",
    name: "Currency",
    element: Currency,
    navName: "Settings",
  },
  {
    path: "/testimonial/new",
    name: "AddTestimonial",
    element: AddTestimonial,
    navName: "Website Related",
  },
  {
    path: "/testimonial/view/:id",
    name: "ViewTestimonial",
    element: ViewTestimonial,
    navName: "Website Related",
  },
  {
    path: "/testimonial/edit/:id",
    name: "EditTestimonial",
    element: EditTestimonial,
    navName: "Website Related",
  },
  //seo
  {
    path: "/seo/request/new",
    name: "seo Request",
    element: AddSeoRequest,
    navName: "Website Related",
  },
  // Content ---- >
  {
    path: "/content",
    name: "Website Related",
    element: Content,
    navName: "Website Related",
  },
  {
    path: "/content/terms-and-conditions",
    name: "Website Related",
    element: EditTermsConditions,
    navName: "Website Related",
  },
  {
    path: "/content/privacy-policy",
    name: "Website Related",
    element: EditPrivacyPolicy,
    navName: "Website Related",
  },
  {
    path: "/content/shipping-policy",
    name: "Website Related",
    element: EditShippingPolicy,
    navName: "Website Related",
  },
  {
    path: "/content/refund-policy",
    name: "Website Related",
    element: EditRefundpolicy,
    navName: "Website Related",
  },
  {
    path: "/content/about-us",
    name: "Website Related",
    element: EditAboutUs,
    navName: "Website Related",
  },
  //-------------------------------End website related routes----------------------------------
  //--------------Order Management Routes---------------------------------------
  {
    path: "/orders/new",
    name: "New Orders",
    element: NewOrders,
    navName: "Orders",
  },
  {
    path: "/order/add",
    name: "add Order",
    element: AddOrder,
    navName: "Orders",
  },
  {
    path: "/orders/edit/:id",
    name: "Edit Order",
    element: EditOrder,
    navName: "Orders",
  },
  {
    path: "/orders/:status/:id",
    name: "View Order",
    element: ViewOrders,
    navName: "Orders",
  },
  {
    path: "/orders/invoice/:status/:id",
    name: "View Invoice ",
    element: ViewInvoices,
    navName: "Orders",
  },

  {
    path: "/orders/processing",
    name: "Processing Orders",
    element: ProcessingOrders,
    navName: "Orders",
  },
  {
    path: "/orders/dispatched",
    name: "Dispatched Orders",
    element: DispatchedOrders,
    navName: "Orders",
  },
  {
    path: "/orders/delivered",
    name: "Delivered Orders",
    element: DeliveredOrders,
    navName: "Orders",
  },
  {
    path: "/orders/pending",
    name: "Pending Orders",
    element: PendingOrders,
    navName: "Orders",
  },
  {
    path: "/orders/cancelled",
    name: "Cancelled Orders",
    element: CancelledOrders,
    navName: "Orders",
  },
  {
    path: "/orders/returned",
    name: "Returned Orders",
    element: ReturnedOrders,
    navName: "Orders",
  },
  {
    path: "/inStoreCashOrders/new",
    name: "In Store Cash Orders",
    element: InStoreCashOrders,
    navName: "Orders",
  },
  {
    path: "/InStoreQRCodeOrders/new",
    name: "In Store QR Code Orders",
    element: InStoreQRCodeOrders,
    navName: "Orders",
  },
  //-------------- End Order Management Routes---------------------------------------
  // Announcement
  {
    path: "/announcement",
    name: "Announcment",
    element: Announcements,
    navName: "Announcment",
  },
  {
    path: "/announcement/create",
    name: "Announcment",
    element: CreateAnnouncement,
    navName: "Announcment",
  },
  //----------Point of sale orders Routes-----------------------

  // { path: "/order/:status/:id", name: "View Order", element: ViewOdr },

  //------------settings------------------------//

  //-----------------Configuration Routes-----------------------------------
  {
    path: "/socialmedia",
    name: "Social Media",
    element: Socialmedia,
    navName: "Configuration",
  },

  {
    path: "/application/name",
    name: "ApplicationName",
    element: ApplicationName,
    navName: "Configuration",
  },
  {
    path: "/copyright/message",
    name: "Copyright Message",
    element: CopyrightMessage,
    navName: "Configuration",
  },

  {
    path: "/address",
    name: "Address",
    element: Address,
    navName: "Configuration",
  },
  { path: "/logo", name: "Logo", element: Logo, navName: "Configuration" },
  {
    path: "/mobile-app",
    name: "MobileApp",
    element: MobileApp,
    navName: "Configuration",
  },
  //-----------------  End Configuration Routes-----------------------------------

  //-----------------Affiliate & Coupons  Routes-----------------------------------
  {
    path: "/affiliate/coupons",
    name: "Coupon",
    element: Coupons,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/affiliates",
    name: "Affiliate",
    element: Affiliates,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/coupons/create",
    name: "Create Coupon",
    element: CreateCoupon,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/affiliates/create",
    name: "Create Affiliate",
    element: CreateAffiliate,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/affiliates/edit/:id",
    name: "Edit Affiliate",
    element: EditAffiliate,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/affiliates/pay/:id",
    name: "Pay Affiliate",
    element: PayAffiliate,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/affiliates/history/:id",
    name: "Pay Affiliate",
    element: AffiliateHistory,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/coupons/edit/:id",
    name: "Edit Coupon",
    element: EditCoupon,
    navName: "Affiliate & Coupons",
  },
  {
    path: "/affiliate/coupons/history/:id",
    name: "Edit Coupon",
    element: CouponHistory,
    navName: "Affiliate & Coupons",
  },
  //-----------------  End Affiliate & Coupons  Routes-----------------------------------

  //---------- Blog Routes---------------------------------
  {
    path: "/blogs",
    name: "Blogs",
    element: Blogs,
    navName: "Blog",
  },
  {
    path: "/blogs/create",
    name: "Blogs",
    element: CreateBlog,
    navName: "Blog",
  },
  {
    path: "/blog/edit/:id",
    name: "Blogs",
    element: UpdateBlog,
    navName: "Blog",
  },
  {
    path: "/blog/view/:id",
    name: "Blogs",
    element: ViewBlog,
    navName: "Blog",
  },

  //----------End Blog Routes---------------------------------
  // ------------------------Employee Routes-----------------------
  {
    path: "/employee",
    name: "Employee",
    element: Employee,
    navName: "Employees & Access",
  },
  {
    path: "/add-employee",
    name: "Employee",
    element: AddEmployee,
    navName: "Employees & Access",
  },
  {
    path: "edit-employee/:id",
    name: "Employee",
    element: EditEmployee,
    navName: "Employees & Access",
  },
  
  // Templates Route
  {
    path: "/templates",
    name: "Templates",
    element: Templates,
    navName: "Templates",
  },
  // Transporter
  {
    path: "transporter",
    name: "Transporter",
    element: Transporter,
    navName: "Employees & Access",
  },
  {
    path: '/equipment', 
    exact: true,
    name: 'Equipment',
    element: Equipment
  },
  {
    path: "franchisee/equipment/:id",
    name: "Add Equipment",
    element: AddEquipmentsOutlet,
    navName: "Employees & Access",
  },
  {
    path: "/branch",
    name: "Branch",
    element: Branches,
    navName: "Branch",
  },
  {
    path: "/contactlists",
    name: "Contact Lists",
    element: ContactLists,
    navName: "Contact Lists",
  },
  {
    path: "/contacts",
    name: "Contacts",
    element: Contacts,
    navName: "Contacts",
  },
  {
    path: '/callogs',
    name: 'Call Logs',
    element: CallLogs,
    navName: "Call Logs",
  },
  {
    path: "/campaigns/autodial",
    name: "Autodial Campaigns",
    element: AutodialCampaigns,
    navName: "Campaigns",
  },
  {
    path: "/campaigns/surveys",
    name: "Survey Campaigns",
    element: SurveyCampaigns,
    navName: "Campaigns",
  },
  {
    path: "/users-teams",
    name: "Users & Teams",
    element: UsersTeams,
    navName: "Users & Teams",
  },
  {
    path: "/virtual-numbers",
    name: "Virtual Numbers",
    element: VirtualNumbers,
    navName: "Virtual Numbers",
  },
  {
    path: "/billing",
    name: "Billing",
    element: Billing,
    navName: "Billing",
  },
  {
    path: "/reports-analytics",
    name: "Reports & Analytics",
    element: ReportsAnalytics,
    navName: "Reports & Analytics",
  },
  {
    path: "/settings",
    name: "Settings",
    element: Settings,
    navName: "Settings",
  },
];

export default routes;
