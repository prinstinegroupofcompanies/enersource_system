import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { MfaPage } from './pages/MfaPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { ProfilePage } from './pages/ProfilePage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { FinanceLayout } from './components/finance/FinanceLayout';
import { FinanceOverviewPage } from './pages/finance/FinanceOverviewPage';
import { FinanceAccountsPage } from './pages/finance/FinanceAccountsPage';
import { FinanceJournalsPage } from './pages/finance/FinanceJournalsPage';
import { FinanceLedgerPage } from './pages/finance/FinanceLedgerPage';
import { FinanceTrialBalancePage } from './pages/finance/FinanceTrialBalancePage';
import { FinanceReportsPage } from './pages/finance/FinanceReportsPage';
import { SalesLayout } from './components/sales/SalesLayout';
import { SalesOverviewPage } from './pages/sales/SalesOverviewPage';
import { SalesCustomersPage } from './pages/sales/SalesCustomersPage';
import { SalesQuotationsPage } from './pages/sales/SalesQuotationsPage';
import { SalesOrdersPage } from './pages/sales/SalesOrdersPage';
import { SalesContractsPage } from './pages/sales/SalesContractsPage';
import { SalesInvoicesPage } from './pages/sales/SalesInvoicesPage';
import { SalesReceivablesPage } from './pages/sales/SalesReceivablesPage';
import { SalesPayablesPage } from './pages/sales/SalesPayablesPage';
import { InventoryLayout } from './components/inventory/InventoryLayout';
import { InventoryOverviewPage } from './pages/inventory/InventoryOverviewPage';
import { InventoryItemsPage } from './pages/inventory/InventoryItemsPage';
import { InventoryMovementsPage } from './pages/inventory/InventoryMovementsPage';
import { InventoryTransfersPage } from './pages/inventory/InventoryTransfersPage';
import { InventoryReportsPage } from './pages/inventory/InventoryReportsPage';
import { ProcurementLayout } from './components/procurement/ProcurementLayout';
import { ProcurementOverviewPage } from './pages/procurement/ProcurementOverviewPage';
import { ProcurementRequisitionsPage } from './pages/procurement/ProcurementRequisitionsPage';
import { ProcurementPaymentsPage } from './pages/procurement/ProcurementPaymentsPage';
import { PettyCashLayout } from './components/procurement/PettyCashLayout';
import { PettyCashOverviewPage } from './pages/pettycash/PettyCashOverviewPage';
import { PettyCashExpensesPage } from './pages/pettycash/PettyCashExpensesPage';
import { PettyCashReportsPage } from './pages/pettycash/PettyCashReportsPage';
import { ProjectsLayout } from './components/projects/ProjectsLayout';
import { ProjectsOverviewPage } from './pages/projects/ProjectsOverviewPage';
import { ProjectsListPage } from './pages/projects/ProjectsListPage';
import { ProjectsDetailPage } from './pages/projects/ProjectsDetailPage';
import { CrmLayout } from './components/crm/CrmLayout';
import { CrmOverviewPage } from './pages/crm/CrmOverviewPage';
import { CrmLeadsPage } from './pages/crm/CrmLeadsPage';
import { CrmPipelinePage } from './pages/crm/CrmPipelinePage';
import { CrmClientsPage } from './pages/crm/CrmClientsPage';
import { CrmRemindersPage } from './pages/crm/CrmRemindersPage';
import { HrLayout } from './components/hr/HrLayout';
import { HrOverviewPage } from './pages/hr/HrOverviewPage';
import { HrEmployeesPage } from './pages/hr/HrEmployeesPage';
import { HrAttendancePage } from './pages/hr/HrAttendancePage';
import { HrKpisPage } from './pages/hr/HrKpisPage';
import { HrAppraisalsPage } from './pages/hr/HrAppraisalsPage';
import { CommunicationLayout } from './components/communication/CommunicationLayout';
import { CommunicationOverviewPage } from './pages/communication/CommunicationOverviewPage';
import { CommunicationChannelsPage } from './pages/communication/CommunicationChannelsPage';
import { DocumentsLayout } from './components/documents/DocumentsLayout';
import { DocumentsOverviewPage } from './pages/documents/DocumentsOverviewPage';
import { DocumentsLibraryPage } from './pages/documents/DocumentsLibraryPage';
import { AssetsLayout } from './components/assets/AssetsLayout';
import { AssetsOverviewPage } from './pages/assets/AssetsOverviewPage';
import { AssetsRegistryPage } from './pages/assets/AssetsRegistryPage';
import { SupportLayout } from './components/support/SupportLayout';
import { SupportOverviewPage } from './pages/support/SupportOverviewPage';
import { SupportTicketsPage } from './pages/support/SupportTicketsPage';
import { ReportsLayout } from './components/reports/ReportsLayout';
import { ReportsOverviewPage } from './pages/reports/ReportsOverviewPage';
import { ReportsFinancialPage } from './pages/reports/ReportsFinancialPage';
import { ReportsOperationalPage } from './pages/reports/ReportsOperationalPage';
import { ReportsAnalyticsPage } from './pages/reports/ReportsAnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { LoadingScreen } from './components/ui/LoadingScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading && !user) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/mfa" element={<MfaPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="finance" element={<FinanceLayout />}>
          <Route index element={<FinanceOverviewPage />} />
          <Route path="accounts" element={<FinanceAccountsPage />} />
          <Route path="journals" element={<FinanceJournalsPage />} />
          <Route path="ledger" element={<FinanceLedgerPage />} />
          <Route path="trial-balance" element={<FinanceTrialBalancePage />} />
          <Route path="reports" element={<FinanceReportsPage />} />
        </Route>
        <Route path="sales" element={<SalesLayout />}>
          <Route index element={<SalesOverviewPage />} />
          <Route path="customers" element={<SalesCustomersPage />} />
          <Route path="quotations" element={<SalesQuotationsPage />} />
          <Route path="orders" element={<SalesOrdersPage />} />
          <Route path="contracts" element={<SalesContractsPage />} />
          <Route path="invoices" element={<SalesInvoicesPage />} />
          <Route path="receivables" element={<SalesReceivablesPage />} />
          <Route path="payables" element={<SalesPayablesPage />} />
        </Route>
        <Route path="inventory" element={<InventoryLayout />}>
          <Route index element={<InventoryOverviewPage />} />
          <Route path="items" element={<InventoryItemsPage />} />
          <Route path="movements" element={<InventoryMovementsPage />} />
          <Route path="transfers" element={<InventoryTransfersPage />} />
          <Route path="reports" element={<InventoryReportsPage />} />
        </Route>
        <Route path="procurement" element={<ProcurementLayout />}>
          <Route index element={<ProcurementOverviewPage />} />
          <Route path="requisitions" element={<ProcurementRequisitionsPage />} />
          <Route path="payments" element={<ProcurementPaymentsPage />} />
        </Route>
        <Route path="petty-cash" element={<PettyCashLayout />}>
          <Route index element={<PettyCashOverviewPage />} />
          <Route path="expenses" element={<PettyCashExpensesPage />} />
          <Route path="reports" element={<PettyCashReportsPage />} />
        </Route>
        <Route path="projects" element={<ProjectsLayout />}>
          <Route index element={<ProjectsOverviewPage />} />
          <Route path="list" element={<ProjectsListPage />} />
          <Route path=":projectId" element={<ProjectsDetailPage />} />
        </Route>
        <Route path="crm" element={<CrmLayout />}>
          <Route index element={<CrmOverviewPage />} />
          <Route path="leads" element={<CrmLeadsPage />} />
          <Route path="pipeline" element={<CrmPipelinePage />} />
          <Route path="clients" element={<CrmClientsPage />} />
          <Route path="reminders" element={<CrmRemindersPage />} />
        </Route>
        <Route path="hr" element={<HrLayout />}>
          <Route index element={<HrOverviewPage />} />
          <Route path="employees" element={<HrEmployeesPage />} />
          <Route path="attendance" element={<HrAttendancePage />} />
          <Route path="kpis" element={<HrKpisPage />} />
          <Route path="appraisals" element={<HrAppraisalsPage />} />
        </Route>
        <Route path="communication" element={<CommunicationLayout />}>
          <Route index element={<CommunicationOverviewPage />} />
          <Route path="channels" element={<CommunicationChannelsPage />} />
        </Route>
        <Route path="documents" element={<DocumentsLayout />}>
          <Route index element={<DocumentsOverviewPage />} />
          <Route path="library" element={<DocumentsLibraryPage />} />
        </Route>
        <Route path="assets" element={<AssetsLayout />}>
          <Route index element={<AssetsOverviewPage />} />
          <Route path="registry" element={<AssetsRegistryPage />} />
        </Route>
        <Route path="support" element={<SupportLayout />}>
          <Route index element={<SupportOverviewPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
        </Route>
        <Route path="reports" element={<ReportsLayout />}>
          <Route index element={<ReportsOverviewPage />} />
          <Route path="financial" element={<ReportsFinancialPage />} />
          <Route path="operational" element={<ReportsOperationalPage />} />
          <Route path="analytics" element={<ReportsAnalyticsPage />} />
        </Route>
        <Route path="audit" element={<AuditPage />} />
        <Route path="module/:moduleKey" element={<ModulePlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
