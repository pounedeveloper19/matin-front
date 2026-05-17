export interface ExecutionResult<T = unknown> {
  type: 'Success' | 'Warning' | 'Danger' | 'Info'
  code: number
  caption: string | null
  message: string | null
  result: T
}

export interface PaginationResult<T = unknown> {
  pageNumber: number
  pageSize: number
  totalPages: number
  totalRecords: number
  filteredCount: number
  data: T[]
}

// Auth
export interface LoginRequest {
  mobile: string
  password: string
}

export interface LoginResponse {
  token: string
  role: 'admin' | 'customer'
  fullName: string
}

// Public self-registration
export interface PublicRegisterReal {
  firstName: string
  lastName: string
  nationalCode: string
  mobile: string
  password: string
  familiarityType: number
}

export interface PublicRegisterLegal {
  companyName: string
  nationalId: string
  economicCode: string
  ceoFullName: string
  ceoMobile: string
  mobile: string
  password: string
  familiarityType: number
}

// Customer
export interface CustomerReal {
  id?: number
  firstName: string
  lastName: string
  nationalCode: string
  mobile: string
  familiarityType?: number
  customerTypeId?: number
}

export interface CustomerLegal {
  id?: number
  companyName: string
  nationalId: string
  economicCode: string
  ceo_FullName: string
  ceo_Mobile: string
  familiarityType?: number
  customerTypeId?: number
  registerNumber?: string | null
  ceoNationalId?: string | null
  gazetteDate?: string | null
}

export interface AddressResult {
  id: number
  powerEntityName: string
  cityTitle: string
  provinceTitle: string
  mainAddress: string
  postalCode: string
}

export interface SubscriptionResult {
  id: number
  billIdentifier: string
  contractCapacityKw: number | null
  addressId: number
  mainAddress: string
  powerEntity: string
}

export interface AddSubscriptionRequest {
  addressId: number
  billIdentifier: string
  contractCapacityKw: number | null
}

export interface AddAddress {
  customerProfileId: number
  powerEntityId: number
  cityId: number
  mainAddress: string
  postalCode: string
}

export interface CustomerAgent {
  customerProfileId: number
  fullName: string
  mobile: string
  password: string
}

// Contracts
export interface ContractResult {
  id: number
  contractNumber: string
  contractRate: number
  statusId: number
  status: string
  subscription: string
  startDate: string
  endDate: string
  address: string
  warrantyAmount: number
  warrantyType: string
  warrantyTypeId: number
  warrantyFileId: string | null
  contractPowerKw: number | null
  contractVolumeKwh: number | null
  contractAmountRial: number | null
  paymentDeadline: string | null
}

export interface SubmitWarrantyRequest {
  contractId: number
  amount: number
  typeId: number
  fileId?: string | null
}

export interface ContractConfirm {
  contractId: number
  statusId: number
}

// Admin Contract
export interface AdminContract {
  id: number
  contractNumber: string
  contractRate: number
  statusId: number
  subscriptionId: number
  startDate: string | null
  endDate: string | null
  amount?: number
  fileId?: string | null
  typeId?: number
  customerNationalId?: string
  customerName?: string
  status?: string
  warrantyFileId?: string | null
  contractPowerKw?: number | null
  contractVolumeKwh?: number | null
  contractAmountRial?: number | null
  paymentDeadline?: string | null
}

// Bills
export interface BillAnalysis {
  period: string
  totalConsumption: number
  matinCost: number
  backupCost: number
  saving: number
  savingPercent: number
  demandPenalty: number
}

export interface BillBand {
  name: string
  actualKwh: number
  contractedKwh: number
  excessKwh: number
  deficitKwh: number
  marketRateRial: number
  penaltyRial: number
  creditRial: number
}

export interface BillAnalysisResult {
  monthName: string
  year: number
  totalConsumption: number
  contractCapacityKw: number
  contractedEnergyKwh: number
  contractRateRialPerKwh: number
  peakHoursPerDay: number
  midHoursPerDay: number
  lowHoursPerDay: number
  bands: BillBand[]
  marketPeakRate: number
  marketMidRate: number
  marketLowRate: number
  backupRate: number
  totalDifferentialRial: number
  totalCreditRial: number
  article16Rial: number
  fuelFeeRial: number
  matinBillRial: number
  withoutMatinBillRial: number
  withMatinBillRial: number
  savingRial: number
  savingPercent: number
}

export interface OptimalPurchaseCurvePoint {
  contractCapacityKw: number
  contractedEnergyKwh: number
  savingRial: number
  withMatinBillRial: number
}

export interface OptimalPurchaseCurveResult {
  currentContractCapacityKw: number
  savingAtCurrentContractRial: number
  optimalContractCapacityKw: number
  optimalSavingRial: number
  withoutMatinBillRial: number
  points: OptimalPurchaseCurvePoint[]
}

export interface ManualBillRequest {
  subscriptionId: number
  year: number
  month: number
  peakKwh: number
  midKwh: number
  lowKwh: number
  fridayPeakKwh: number
}

// Tickets
export interface TicketSummary {
  id: number
  subject: string
  status: string
  statusId: number
  createdAt: string | null
  messageCount: number
}

export interface TicketMessage {
  id: number
  body: string | null
  fileId: string | null
  senderName: string
  isAdmin: boolean
  createdAt: string | null
}

export interface CreateTicketRequest {
  subject: string
  body: string
}

export interface AddTicketMessageRequest {
  ticketId: number
  body: string
  fileId?: string | null
}

export interface UpdateTicketStatusRequest {
  ticketId: number
  statusId: number
}

// Announcements
export interface AnnouncementItem {
  id: number
  title: string
  contents: string
  publishDate: string
}

export interface AdminAnnouncement {
  id: number
  title: string
  contents: string
  publishDate: string | null
  finishDate: string | null
}

// Admin Tickets
export interface AdminTicketSummary {
  id: number
  subject: string
  status: string
  statusId: number
  customerName: string
  createdAt: string | null
  messageCount: number
}

// TariffCode / TariffCodeOption
export interface TariffCode {
  id: number
  code: string
  title: string
  optionCount?: number
}

export interface TariffCodeOption {
  id: number
  tariffCodeId: number
  tariffCode?: string
  tariffCodeCode?: string
  title: string
  penaltyMultiplier: number
  creditMultiplier: number
}

export interface AdvancedBillAnalysisResult {
  monthName: string
  year: number
  month: number
  // مصرف برق
  peakKwh: number
  midKwh: number
  lowKwh: number
  totalKwh: number
  // ساعات TOU
  peakHoursPerDay: number
  midHoursPerDay: number
  lowHoursPerDay: number
  // نرخ تعرفه صنعتی
  tariffPeakRial: number
  tariffMidRial: number
  tariffLowRial: number
  // حداکثر نرخ عمده‌فروشی (1.3 × بازار)
  maxWholePeak: number
  maxWholeMid: number
  maxWholeLow: number
  // متوسط بازار و نرخ قانون جهش
  avgMarket: number
  greenLawRate: number
  greenPercent: number
  greenSubjectKwh: number
  // انرژی بازار و باقیمانده
  marketEnergyPeak: number
  marketEnergyMid: number
  marketEnergyLow: number
  remainingPeak: number
  remainingMid: number
  remainingLow: number
  // اجزای هزینه قبل از قرارداد
  energyBeforeRial: number
  article16BeforeRial: number
  regulatoryBeforeRial: number
  // اجزای هزینه بعد از قرارداد
  energyAfterRial: number
  article16AfterRial: number
  regulatoryAfterRial: number
  creditRial: number
  // صورتحساب‌های بازار
  bilateralBillRial: number
  exchangeBillRial: number
  greenBillRial: number
  // نتایج نهایی
  costWithoutMatin: number
  costWithMatin: number
  netSaving: number
  savingPercent: number
}

export interface CustomerTariffInfo {
  tariffCodeOptionId: number
  tariffCodeId: number
  tariffCodeTitle: string | null
  tariffCodeOptionTitle: string | null
}

// Admin Subscription
export interface AdminSubscription {
  id: number
  billIdentifier: string
  contractCapacityKw: number | null
  addressId: number
  mainAddress?: string
  city?: string
}

// Admin tables
export interface AdminLegalCustomer {
  id: number
  nationalId: string
  ceoFullName: string
  companyName: string
  economicCode?: string
  ceoMobile?: string
  familiarityTitle?: string
  familiarityType?: number
  customerTypeId?: number
  isActive?: boolean
  registerNumber?: string
  ceoNationalId?: string
  gazetteDate?: string
}

export interface AdminRealCustomer {
  id: number
  nationalCode: string
  firstName: string
  lastName: string
  mobile: string
  familiarityType?: number
  customerTypeId?: number
  isActive?: boolean
}

export interface AdminAddress {
  id: number
  city?: string
  province?: string
  cityId?: number
  powerEntityId?: number
  postalCode: string
  mainAddress: string
  customerProfileId?: number
}

// Monthly Market Rates
export interface MonthlyMarketRate {
  id: number
  year: number
  month: number
  marketAvg: number           // متوسط قیمت بازار برق
  marketPeak: number          // حداکثر - اوج بار
  marketMid: number           // حداکثر - میان بار
  marketLow: number           // حداکثر - کم بار
  boardPeak: number
  boardMid: number
  boardLow: number
  greenBoardRate: number
  openBoardRate: number
  industrialTariffBase: number  // نرخ قانون جهش تولید (تعرفه صنعتی)
  executiveTariffBase: number
}

// PowerEntity
export interface AdminPowerEntity {
  id: number
  name: string
  provinceId: number
  province?: string
  entityTypeId: number
  entityType?: string
  isActive: boolean
}

// Tariff
export interface Tariff {
  tariffId: number
  tariffTypeId: number
  tariffType?: string
  customerTypeId: number
  customerType?: string
  powerEntitiesId: number
  powerEntity?: string
  effectiveFrom: string | null
  effectiveFromRaw?: string | null
  slabCount?: number
}

// TariffSlab
export interface TariffSlab {
  id: number
  tariffId: number
  fromKwh: number
  toKwh: number | null
  multiplier: number
}

// TOU Schedule
export interface HourEntry {
  hourNumber: number
  toutypeId: number
}

// Pending Registrations
export interface PendingUser {
  id: number
  fullName: string | null
  mobile: string
  customerProfileId: number | null
  customerType: number | null
  realName: string | null
  legalName: string | null
  nationalCode: string | null
  nationalId: string | null
  registeredAt?: string | null
  city?: string | null
  province?: string | null
  mainAddress?: string | null
  hasIdentityDoc?: boolean
  hasAddress?: boolean
}

// User Management (Admin)
export interface AdminUser {
  id: number
  fullName: string
  mobile: string
  isActive: boolean | null
  customerProfileId: number | null
  roleId: number | null
  roleTitle: string | null
  customerName: string | null
}

export interface AdminRole {
  id: number
  title: string
  description: string | null
}

export interface NavMenuItem {
  id: number
  title: string
  path: string | null      // null برای گروه‌ها
  icon: string
  isSelectable: boolean    // false = گروه، true = صفحه
  children: NavMenuItem[]
}

export interface SiteMapItem {
  id: number
  title: string
  parentId: number | null
  isInMenu: boolean
  isSelectable: boolean
  description: string | null
  controlKey: string | null
}

export interface SetUserRoleRequest {
  userId: number
  roleId: number | null
}

export interface UpdateUserRequest {
  id: number
  fullName: string
  mobile: string
  password?: string
}

export interface CreateAdminUserRequest {
  fullName: string
  mobile: string
  password: string
  roleId: number | null
}

export interface SetPermissionsRequest {
  roleId: number
  siteMapIds: number[]
}

// Optimal Purchase Curve
export interface OptimalPurchaseCurvePoint {
  contractCapacityKw: number
  contractedEnergyKwh: number
  savingRial: number
  withMatinBillRial: number
}

export interface OptimalPurchaseCurveResult {
  currentContractCapacityKw: number
  savingAtCurrentContractRial: number
  optimalContractCapacityKw: number
  optimalSavingRial: number
  withoutMatinBillRial: number
  points: OptimalPurchaseCurvePoint[]
}

// Orders & Payments
export interface OrderResult {
  id: number
  billId: number
  billIdentifier: string
  requestedKwh: number
  energyType: string
  energyTypeId: number
  priceAtMoment: number
  status: string
  statusId: number
  orderDate: string | null
  isPriceRequest: boolean
  paymentCount: number
  lastPaymentStatusId?: number | null
}

export interface PaymentResult {
  id: number
  amount: number
  method: string
  methodId: number
  status: string
  statusId: number
  referenceNumber: string | null
  receiptFileId?: string | null
  createdAt: string | null
}

export interface OrderDetailResult extends OrderResult {
  payments: PaymentResult[]
}

export interface AdminOrderResult {
  id: number
  billId: number
  billIdentifier: string
  customerName: string
  requestedKwh: number
  energyType: string
  energyTypeId: number
  priceAtMoment: number
  status: string
  statusId: number
  orderDate: string | null
  isPriceRequest: boolean
  paymentCount: number
  paidAmount: number
  payments?: PaymentResult[]
}

export interface CreateOrderRequest {
  subscriptionId: number
  requestedKwh: number
  energyTypeId: number
  isPriceRequest: boolean
}

export interface SubmitPaymentRequest {
  orderId: number
  amount: number
  methodId: number
  referenceNumber?: string
  receiptFileId?: string
}

export interface UpdateOrderStatusRequest {
  orderId: number
  statusId: number
  priceAtMoment?: number
}

export interface ConfirmPaymentRequest {
  paymentId: number
  statusId: number
}

// Reports
export interface ContractReportItem {
  id: number
  contractNumber: string | null
  customerName: string
  billIdentifier: string
  status: string
  statusId: number
  startDate: string | null
  endDate: string | null
  contractRate: number
  contractPowerKw: number | null
  contractVolumeKwh: number | null
  contractAmountRial: number | null
  paymentDeadline: string | null
}

export interface OrderReportItem {
  id: number
  billIdentifier: string
  customerName: string
  energyType: string
  energyTypeId: number
  requestedKwh: number
  priceAtMoment: number
  status: string
  statusId: number
  orderDate: string | null
  isPriceRequest: boolean
  paymentCount: number
  paidAmount: number
}

export interface PaymentReportItem {
  id: number
  orderId: number
  billIdentifier: string
  customerName: string
  amount: number
  method: string
  methodId: number
  status: string
  statusId: number
  referenceNumber: string | null
  receiptFileId: string | null
  createdAt: string | null
}

interface ReportByStatus {
  statusId: number
  status: string
  count: number
  totalAmount?: number
}

export interface ContractReportResult {
  items: ContractReportItem[]
  summary: { total: number; byStatus: ReportByStatus[]; totalAmountRial: number }
}

export interface OrderReportResult {
  items: OrderReportItem[]
  summary: { total: number; byStatus: ReportByStatus[]; totalRequestedKwh: number; totalPaidRial: number }
}

export interface PaymentReportResult {
  items: PaymentReportItem[]
  summary: { total: number; byStatus: (ReportByStatus & { totalAmount: number })[]; totalAmountRial: number; confirmedAmountRial: number }
}

// Bill Analysis Report (admin)
export interface AdminBillReport {
  id: number
  subscriptionId: number
  billIdentifier: string
  year: number | null
  month: number | null
  peakCons: number | null
  midCons: number | null
  lowCons: number | null
  costWithoutMatin: number | null
  costWithMatin: number | null
  netSaving: number | null
  createdAt: string | null
}
