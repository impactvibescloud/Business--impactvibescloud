import React from "react";

//  DashBoard
const Change_Password = React.lazy(() =>
  import("./views/pages/register/Change_password")
);

// Tickets
const NewTicketComponent = React.lazy(() => import("./components/Ticket/NewTicketComponent"));

const Dashboard = React.lazy(() => import("./views/dashboard/Dashboard"));
const EditProfile = React.lazy(() => import("./views/Profile/EditProfile"));
const Socialmedia = React.lazy(() => import("./views/configuration/Socialmedia.js"));
const Address = React.lazy(() => import("./views/configuration/Address.js"));
const Logo = React.lazy(() => import("./views/configuration/Logo.js"));
const Login = React.lazy(() => import("./views/pages/login/Login"));

// Missing Components Imports - Using lazy loading
const Templates = React.lazy(() => import("./views/Templates/Templates"));
const UsersTeams = React.lazy(() => import("./views/UsersTeams/UsersTeams"));
const VirtualNumbers = React.lazy(() => import("./views/VirtualNumbers/VirtualNumbers"));
const Billing = React.lazy(() => import("./views/Billing/Billing"));
const ReportsAnalytics = React.lazy(() => import("./views/ReportsAnalytics/ReportsAnalytics"));
const Payments = React.lazy(() => import("./views/Payments/Payments"));
const Settings = React.lazy(() => import("./views/Settings/Settings"));
const Department = React.lazy(() => import("./views/Department/Department"));

// Products
const Products = React.lazy(() => import("./views/Products/Products"));
const AddProduct = React.lazy(() => import("./views/Products/AddProduct"));
const EditProduct = React.lazy(() => import("./views/Products/EditProduct"));
const ViewProduct = React.lazy(() => import("./views/Products/ViewProduct"));
const ProductManual = React.lazy(() => import("./views/ProductManual/ProductManual"));

// Order Management
const NewOrders = React.lazy(() => import("./views/orders/NewOrders.js"));
const ProcessingOrders = React.lazy(() => import("./views/orders/ProcessingOrders.js"));
const DispatchedOrders = React.lazy(() => import("./views/orders/DispatchedOrders.js"));
const DeliveredOrders = React.lazy(() => import("./views/orders/DeliveredOrders.js"));
const CancelledOrders = React.lazy(() => import("./views/orders/CancelledOrders.js"));
const ReturnedOrders = React.lazy(() => import("./views/orders/ReturnedOrders.js"));
const AddOrder = React.lazy(() => import("./views/orders/AddOrder"));
const EditOrder = React.lazy(() => import("./views/orders/EditOrder"));
const ViewOrders = React.lazy(() => import("./views/orders/ViewOrders"));

// Configuration
const ApplicationName = React.lazy(() => import("./views/configuration/ApplicationName"));
const CopyrightMessage = React.lazy(() => import("./views/configuration/CopyrightMessage"));

// SEO
const AddSeoRequest = React.lazy(() => import("./views/seo/AddSeoRequest"));

// Testimonials
const Testimonials = React.lazy(() => import("./views/Testimonials/Testimonials"));
const AddTestimonial = React.lazy(() => import("./views/Testimonials/AddTestimonial"));
const ViewTestimonial = React.lazy(() => import("./views/Testimonials/ViewTestimonial"));
const Policies = React.lazy(() => import("./views/configuration/Policies/Policies"));

// Purpose
const Purpose = React.lazy(() => import("./views/configuration/Purpose/Purpose"));
const AddPurpose = React.lazy(() => import("./views/configuration/Purpose/AddPurpose"));
const EditPurpose = React.lazy(() => import("./views/configuration/Purpose/EditPurpose.js"));

// Language
const Languages = React.lazy(() => import("./views/configuration/Language/Languages"));
const AddLanguage = React.lazy(() => import("./views/configuration/Language/AddLanguage"));
const EditLanguage = React.lazy(() => import("./views/configuration/Language/EditLanguage"));

// BusinessType
const BusinessType = React.lazy(() => import("./views/configuration/Business_Type/Business"));
const AddBusinessType = React.lazy(() => import("./views/configuration/Business_Type/AddBusiness"));
const EditBusinessType = React.lazy(() => import("./views/configuration/Business_Type/EditLanguage"));
const ViewAppointment = React.lazy(() => import("./views/Appointments/ViewAppointment"));
const EditAppointment = React.lazy(() => import("./views/Appointments/EditAppointment"));
const AddNewAppointment = React.lazy(() => import("./views/Appointments/AddNewAppointment"));

// Campaigns and Categories
const Campaign = React.lazy(() => import("./views/Campaigns/Campaign.js"));
const AddCampaign = React.lazy(() => import("./views/Campaigns/AddCampaign.js"));
const Categories = React.lazy(() => import("./views/Categories/categories"));
const Brands = React.lazy(() => import("./views/Brands/Brands"));
const Content = React.lazy(() => import("./views/Content/content"));

// Content Editing
const EditPrivacyPolicy = React.lazy(() => import("./views/Content/editPrivacyPolicy"));
const EditTermsConditions = React.lazy(() => import("./views/Content/editTermsConditions"));
const EditShippingPolicy = React.lazy(() => import("./views/Content/editShippingPolicy"));
const EditRefundpolicy = React.lazy(() => import("./views/Content/editRefundPolicy"));
const EditAboutUs = React.lazy(() => import("./views/Content/editAboutUs"));

// Outlet
const viewDetails = React.lazy(() => import("./views/Outlet/viewDetails"));
const Design = React.lazy(() => import("./views/Design/design"));
const RegisterImage = React.lazy(() => import("./views/Images/RegisterImage"));
const LoginImage = React.lazy(() => import("./views/Images/LoginImage"));

// Affiliate
const Coupons = React.lazy(() => import("./views/Affiliate/Coupons"));
const Affiliates = React.lazy(() => import("./views/Affiliate/Affiliates"));
const CreateCoupon = React.lazy(() => import("./views/Affiliate/CreateCoupon"));
const CreateAffiliate = React.lazy(() => import("./views/Affiliate/CreateAffiliate"));
const EditAffiliate = React.lazy(() => import("./views/Affiliate/EditAffiliate"));
const EditCoupon = React.lazy(() => import("./views/Affiliate/EditCoupon"));
const PayAffiliate = React.lazy(() => import("./views/Affiliate/PayAffiliate"));
const AffiliateHistory = React.lazy(() => import("./views/Affiliate/AffiliateHistory"));
const CouponHistory = React.lazy(() => import("./views/Affiliate/CouponHistory"));
const EditTestimonial = React.lazy(() => import("./views/Testimonials/EditTestimonial"));

// Blogs
const Blogs = React.lazy(() => import("./views/Blog/Blogs"));
const CreateBlog = React.lazy(() => import("./views/Blog/CreateBlog"));
const users = React.lazy(() => import("./views/Users/users"));
const UpdateBlog = React.lazy(() => import("./views/Blog/EditBlog"));
const ViewBlog = React.lazy(() => import("./views/Blog/ViewBlog"));
const principalDistributor = React.lazy(() => import("./views/Outlet/principalDistributor"));
const SinglePrincipalDistributorAllDetails = React.lazy(() => import("./views/Outlet/singlePrincipalDistributorAllDetails"));

const addPrincipalDistributor = React.lazy(() => import("./views/Outlet/addPrincipalDistributor"));
const InStoreCashOrders = React.lazy(() => import("./views/orders/InStoreCashOrders"));
const InStoreQRCodeOrders = React.lazy(() => import("./views/orders/InStoreQRCodeOrders"));
const Employee = React.lazy(() => import("./views/EmployeeAccess/Employee"));
const AddEmployee = React.lazy(() => import("./views/EmployeeAccess/addEmployee"));
const EditEmployee = React.lazy(() => import("./views/EmployeeAccess/editEmployee"));
const Currency = React.lazy(() => import("./views/configuration/Currency"));

const AddMultipleProduct = React.lazy(() => import("./views/Products/AddMultipleProducts"));
const AddMultiplePd = React.lazy(() => import("./views/Outlet/AddMultiplePD"));
const ViewProductManual = React.lazy(() => import("./views/ProductManual/SingleProductManual"));
const ViewRetailDistributorPD = React.lazy(() => import("./views/Outlet/ViewRetailDistributorPD"));

const PendingOrders = React.lazy(() => import("./views/orders/pendingOrders"));
const ViewInvoices = React.lazy(() => import("./views/orders/viewInoices"));

const Announcements = React.lazy(() => import("./views/Announcment/announcement"));
const CreateAnnouncement = React.lazy(() => import("./views/Announcment/createAnnouncement"));
const TodayTask = React.lazy(() => import("./views/Tasks/TodayTasks"));

const MobileApp = React.lazy(() => import("./views/configuration/MobileApp"));

const OpeningInventoryReports = React.lazy(() => import("./views/Reports/OpeningInventoryReports"));
const StockReports = React.lazy(() => import("./views/Reports/StockReports "));
const Transporter = React.lazy(() => import("./views/Transporter/Transporter"));
const Menu = React.lazy(() => import("./views/Menu/menu"));
const AddMenu = React.lazy(() => import("./views/Menu/addMenu"));
const EditMenuPage = React.lazy(() => import("./views/Menu/editMenu"));
const FranchiseOrders = React.lazy(() => import("./views/FranchiseeOrders/franchiseOrders"));
const ViewDetails = React.lazy(() => import("./views/FranchiseeOrders/viewDetails"));
const MenuCategories = React.lazy(() => import("./views/Menu-Category/menu-category"));
const videos = React.lazy(() => import("./views/video/Video"));
const AddProductsOutlet = React.lazy(() => import("./views/Outlet/AddProductsOutlet"));
const Equipment = React.lazy(() => import("./views/Equipment/equipment"));
const AddEquipmentsOutlet = React.lazy(() => import("./views/Outlet/AddEquipmentsOutlet"));
const Branches = React.lazy(() => import("./views/Branches/Branches"));
const CallLogs = React.lazy(() => import("./views/CallLogs/CallLogs"));
const ContactLists = React.lazy(() => import("./views/Contacts/ContactLists.jsx"));
const Contacts = React.lazy(() => import("./views/Contacts/Contacts.jsx"));
const AutodialCampaigns = React.lazy(() => import("./views/Campaigns/AutodialCampaigns"));
const SurveyCampaigns = React.lazy(() => import("./views/Campaigns/SurveyCampaigns"));

const routes = [
  //dashboard

  { path: "/dashboard", name: "Dashboard", element: Dashboard, navName: "" },
  { path: "/tickets", name: "Support Tickets", element: NewTicketComponent, navName: "Support" },
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
    path: '/department',
    name: 'Department',
    element: Department,
    navName: "Department",
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
